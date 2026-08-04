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

await conferir('a aba Validação abre e mostra as 15 regras', async () => {
  await pagina.reload({ waitUntil: 'networkidle' })
  await pagina.getByRole('button', { name: /Valida/i }).first().click()
  await pagina.waitForTimeout(1200)
  const texto = await pagina.locator('#root').innerText()
  const ids = ['D1', 'D6', 'D10', 'Q1', 'Q5'].filter((id) => texto.includes(id))
  return { ok: ids.length === 5, detalhe: `regras visíveis: ${ids.join(', ')}` }
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

await pagina.screenshot({ path: 'ao-vivo.png', fullPage: false })
console.log('\nCaptura salva em ao-vivo.png')

await navegador.close()

const falhou = checagens.some((c) => !c.ok) || errosConsole.length > 0 || falhasRede.length > 0
console.log(falhou ? '\n🔴 A VALIDAÇÃO AO VIVO REPROVOU' : '\n✅ VALIDAÇÃO AO VIVO APROVADA')
process.exit(falhou ? 1 : 0)
