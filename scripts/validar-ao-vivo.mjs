/**
 * VALIDAÇÃO AO VIVO — abre o site publicado num navegador de verdade e confere a TELA.
 *
 * Portão verde no computador não é portão verde em produção. `curl` devolvendo 200 prova que o
 * servidor entregou um arquivo; não prova que a escala apareceu. Este site é renderizado no
 * navegador: se o JSON não carregar, o HTML continua respondendo 200 e a tela fica **branca**.
 *
 * Por isso este script assere sobre o que a pessoa VÊ, e falha se o console tiver erro.
 *
 * Uso: node scripts/validar-ao-vivo.mjs [url]
 */
import { chromium } from 'playwright'
import { carregarDominio } from './lib/dominio.mjs'

/*
  O catálogo REAL, lido do código do produto — não uma lista digitada aqui.
  Acrescentar uma regra e esquecer a tela passa a reprovar sozinho.
*/
const { CATALOGO } = await carregarDominio()
const IDS_DO_CATALOGO = CATALOGO.map((r) => r.id)
const TOTAL_DE_REGRAS = IDS_DO_CATALOGO.length

const URL = process.argv[2] ?? 'https://flaviocom.github.io/escala-porteiros/'

const navegador = await chromium.launch()
const pagina = await navegador.newPage()

const errosConsole = []
const falhasRede = []
pagina.on('console', (m) => { if (m.type() === 'error') errosConsole.push(m.text()) })
pagina.on('pageerror', (e) => errosConsole.push(`pageerror: ${e.message}`))
pagina.on('requestfailed', (r) => falhasRede.push(`${r.url()} — ${r.failure()?.errorText}`))

console.log(`Abrindo ${URL}\n`)
await pagina.goto(URL, { waitUntil: 'networkidle', timeout: 60_000 })

const checagens = []
const conferir = async (nome, fn) => {
  try {
    const r = await fn()
    checagens.push({ nome, ok: r.ok, detalhe: r.detalhe })
  } catch (e) {
    checagens.push({ nome, ok: false, detalhe: e.message })
  }
}

/**
 * 🔴 É A VERSÃO NOVA QUE ESTÁ NO AR, OU A ANTERIOR?
 *
 * Em 04/08/2026 validei o site "ao vivo" 25 segundos depois do push, e o GitHub Pages ainda servia o
 * pacote **anterior**. A tela abriu, os nomes apareceram, nada acusou nada — e eu quase reportei o
 * comportamento antigo como se fosse o novo. Só apareceu porque o nome do arquivo baixado era o do
 * formato velho, e eu estranhei.
 *
 * `esperar um pouco` não é verificação. **Comparar o pacote publicado com o commitado é.**
 *
 * Só vale quando o script roda dentro do repositório e mira o site publicado — validação contra o
 * servidor de desenvolvimento não tem `docs/assets` para comparar, e aí a checagem se declara
 * inaplicável em vez de inventar um veredito.
 */
await conferir('o pacote NO AR é o commitado (não a versão anterior)', async () => {
  const { readdirSync, existsSync } = await import('node:fs')
  const { join, dirname } = await import('node:path')
  const { fileURLToPath } = await import('node:url')
  const pasta = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'assets')

  if (!existsSync(pasta) || !/^https:\/\//.test(URL)) {
    return { ok: true, detalhe: 'não se aplica (sem docs/assets ou fora do site publicado)' }
  }

  const local = readdirSync(pasta).filter((f) => f.endsWith('.js')).sort()
  const html = await (await fetch(URL, { cache: 'no-store' })).text()
  const noAr = [...html.matchAll(/assets\/(index-[A-Za-z0-9_-]+\.js)/g)].map((m) => m[1])

  if (!local.length || !noAr.length) {
    return { ok: false, detalhe: `não consegui comparar (local: ${local.length}, no ar: ${noAr.length})` }
  }
  const bate = noAr.every((n) => local.includes(n))
  return {
    ok: bate,
    detalhe: bate
      ? `${noAr[0]} — mesma versão`
      : `🔴 no ar: ${noAr.join(', ')} · commitado: ${local.join(', ')} — o Pages ainda não publicou`,
  }
})

await conferir('a tela renderizou (não está em branco)', async () => {
  const texto = (await pagina.locator('#root').innerText()).trim()
  return { ok: texto.length > 200, detalhe: `${texto.length} caracteres visíveis` }
})

await conferir('o título da congregação aparece', async () => {
  const n = await pagina.getByText('Escala Porteiros').count()
  return { ok: n > 0, detalhe: `${n} ocorrência(s)` }
})

await conferir('há nomes de irmãos na tela', async () => {
  const texto = await pagina.locator('#root').innerText()
  const nomes = ['Adilson', 'Donizete', 'Eduardo', 'Marcos', 'Vicente']
  const achados = nomes.filter((n) => texto.includes(n))
  return { ok: achados.length >= 3, detalhe: `achou ${achados.join(', ') || 'nenhum'}` }
})

await conferir('🔴 16/08 aparece como SANTA CEIA, sem ninguém escalado', async () => {
  // Filtra pela data para trazer o dia à tela, e confere o que ele mostra.
  const busca = pagina.locator('input[placeholder*="Buscar" i], input[type="text"]').first()
  await busca.fill('16/08/2026')
  await pagina.waitForTimeout(1200)
  const texto = await pagina.locator('#root').innerText()
  const temCeia = /SANTA\s*CEIA/i.test(texto)
  const temNome = ['Adilson', 'Donizete', 'Eduardo', 'Marcos', 'Vicente', 'Williams', 'Thiago']
    .some((n) => texto.includes(n))
  return {
    ok: temCeia && !temNome,
    detalhe: `Santa Ceia visível: ${temCeia ? 'sim' : 'NÃO'} · algum nome escalado: ${temNome ? 'SIM (errado)' : 'não'}`,
  }
})

/*
  🔴 CONTA, não amostra — achado da auditoria externa de 05/08/2026.

  Esta checagem se anunciava como *"mostra as 15 regras"* e conferia CINCO identificadores de
  amostra. Duas coisas erradas de uma vez: o catálogo tem 16, e uma amostra de 5 aprovaria uma tela
  que perdeu 11. O rótulo dizia mais do que a medição fazia — e é o rótulo que alguém lê depois.

  Agora o número esperado vem do próprio catálogo, então acrescentar uma regra e esquecer a tela
  reprova aqui.
*/
await conferir(`a aba Validação abre e mostra TODAS as ${TOTAL_DE_REGRAS} regras do catálogo`, async () => {
  await pagina.reload({ waitUntil: 'networkidle' })
  await pagina.getByRole('button', { name: /Valida/i }).first().click()
  await pagina.waitForTimeout(1200)
  const texto = await pagina.locator('#root').innerText()
  // Borda por classe de caracteres, sem barra invertida: `\b` dentro de template literal é o
  // caractere de BACKSPACE, não a borda de palavra — a busca morreria em silêncio (aconteceu três
  // vezes em 05/08/2026). E sem borda nenhuma, "D1" casaria dentro de "D11" e o portão aprovaria
  // uma tela que perdeu uma regra.
  const vistos = IDS_DO_CATALOGO.filter((id) => new RegExp('(^|[^A-Z0-9])' + id + '([^0-9]|$)').test(texto))
  const faltando = IDS_DO_CATALOGO.filter((id) => !vistos.includes(id))
  return {
    ok: vistos.length === TOTAL_DE_REGRAS,
    detalhe: faltando.length ? `FALTAM na tela: ${faltando.join(', ')}` : `todas as ${TOTAL_DE_REGRAS} visíveis`,
  }
})

await conferir('a aba Estatísticas abre', async () => {
  await pagina.getByRole('button', { name: /Estat/i }).first().click()
  await pagina.waitForTimeout(1000)
  const texto = await pagina.locator('#root').innerText()
  return { ok: texto.includes('Adilson') || texto.includes('Total'), detalhe: `${texto.length} caracteres` }
})

console.log('CHECAGENS')
for (const c of checagens) console.log(`  ${c.ok ? '✅' : '🔴'} ${c.nome}\n        ${c.detalhe}`)

console.log('\nCONSOLE DO NAVEGADOR')
if (errosConsole.length) errosConsole.slice(0, 10).forEach((e) => console.log('  🔴', e))
else console.log('  ✅ sem erros')

console.log('\nREDE')
if (falhasRede.length) falhasRede.slice(0, 10).forEach((e) => console.log('  🔴', e))
else console.log('  ✅ nenhuma requisição falhou')

await pagina.screenshot({ path: 'capturas/ao-vivo.png', fullPage: false })
console.log('\nCaptura salva em capturas/ao-vivo.png')

await navegador.close()

const falhou = checagens.some((c) => !c.ok) || errosConsole.length > 0 || falhasRede.length > 0
console.log(falhou ? '\n🔴 A VALIDAÇÃO AO VIVO REPROVOU' : '\n✅ VALIDAÇÃO AO VIVO APROVADA')
process.exit(falhou ? 1 : 0)
