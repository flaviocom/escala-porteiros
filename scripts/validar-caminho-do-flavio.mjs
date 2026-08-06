/**
 * O CAMINHO QUE O FLAVIO VAI PERCORRER, do começo ao fim, num navegador de verdade.
 *
 * 🔴 POR QUE ESTE ARQUIVO EXISTE. Ele descreveu o que vai fazer:
 *
 *   > *"posso atualizar, ajustar o que tiver que ajustar no elenco, gerar a escala e publicar.
 *   >  Passar para os demais irmãos a URL da nova escala e também a imagem."*
 *
 * Os portões cobrem cada peça isolada. **Ninguém tinha percorrido a sequência inteira** — e é a
 * sequência que ele vai fazer, uma vez, na frente de ninguém, sem poder pedir ajuda.
 *
 * Cada passo aqui é uma coisa que, se quebrar, quebra para ele. Inclusive o site PÚBLICO, que é o
 * que os irmãos abrem — e onde o filtro de datas acabou de perder estado interno.
 *
 * Uso: node scripts/validar-caminho-do-flavio.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { subirServidor } from './lib/servidor-de-teste.mjs'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')

/*
  O catálogo REAL, compilado do mesmo código que a tela usa. Sem isto, esta régua decoraria os ids —
  e foi decorando que ela continuou procurando D1..D11 depois de D12 entrar, verde e mentindo.
*/
const _req = createRequire(import.meta.url)
const _esbuild = _req('esbuild')
const _entrada = join(RAIZ, 'node_modules', '.caminho-entrada.ts')
const _saida = join(RAIZ, 'node_modules', '.caminho-catalogo.mjs')
// A quebra vem de `String.fromCharCode(10)`: um `\n` literal aqui já virou quebra de verdade três
// vezes neste projeto, quando o arquivo foi reescrito por script.
writeFileSync(_entrada, "export * from '../src/dominio/regras'" + String.fromCharCode(10), 'utf8')
_esbuild.buildSync({ entryPoints: [_entrada], outfile: _saida, format: 'esm', platform: 'node', bundle: true })
const { CATALOGO } = await import(pathToFileURL(_saida).href)
const { chromium } = await import(`file:///${RAIZ.replace(/\\/g, '/')}/node_modules/playwright/index.mjs`)
mkdirSync(join(RAIZ, 'capturas'), { recursive: true })

const servidor = await subirServidor({ raiz: RAIZ, porta: 4188, modo: 'preview' })
const navegador = await chromium.launch()
const problemas = []
const erros = []

const passo = async (nome, fn) => {
  try {
    const detalhe = await fn()
    console.log(`  ✅ ${nome}`)
    if (detalhe) console.log(`       ${detalhe}`)
  } catch (e) {
    problemas.push(`${nome}: ${e.message}`)
    console.log(`  🔴 ${nome}`)
    console.log(`       ${e.message}`)
  }
}
const exigir = (cond, msg) => { if (!cond) throw new Error(msg) }

try {
  const p = await navegador.newPage({ viewport: { width: 1440, height: 1100 } })
  p.on('pageerror', (e) => erros.push('pageerror: ' + e.message))
  p.on('console', (m) => { if (m.type() === 'error') erros.push('console: ' + m.text()) })

  // ── PARTE 1 — O SITE PÚBLICO, que é o que os irmãos abrem ────────────────────────────────────
  console.log('PARTE 1 — o site público (o que os irmãos veem)\n')
  await p.goto(servidor.url, { waitUntil: 'networkidle', timeout: 30000 })
  await p.waitForTimeout(1200)

  await passo('a escala abre e mostra nomes', async () => {
    const t = await p.locator('#root').innerText()
    exigir(t.length > 500, `só ${t.length} caracteres na tela`)
    exigir(!/undefined|NaN/.test(t), 'aparece "undefined" ou "NaN"')
    return `${t.length} caracteres`
  })

  await passo('🔴 ABRE no próximo culto, não no começo da escala', async () => {
    /*
      Medido em 06/08/2026 no site NO AR: quem abria o link caía em **MAR 01**, cinco meses no
      passado, com o próximo turno **32.496 px** abaixo. Ninguém tinha notado porque o navegador de
      quem já usa o site **restaura a rolagem anterior** no reload — o defeito só aparece para quem
      abre pela PRIMEIRA vez, que é exatamente o irmão recebendo o link.

      Por isso esta checagem espera os 300 ms da rolagem e mede a POSIÇÃO, não a existência do
      cartão: `isVisible()` devolvia `true` com o alvo a 32 mil pixels de distância.
    */
    await p.waitForTimeout(2500)
    const r = await p.evaluate(() => {
      const c = [...document.querySelectorAll('.export-item')]
      const noTopo = c.find((x) => x.getBoundingClientRect().bottom > 80)
      return { total: c.length, scrollY: Math.round(window.scrollY), topo: noTopo?.innerText.replace(/\s+/g, ' ').slice(0, 24) ?? '' }
    })
    exigir(r.total > 20, `só ${r.total} turnos na tela — sem lista longa isto não prova nada`)
    exigir(r.scrollY > 500, `a página não rolou (scrollY=${r.scrollY}) — abriu em "${r.topo}"`)
    return `rolou ${r.scrollY}px · no topo da tela: ${r.topo}`
  })

  await passo('🔴 "Esta Semana" vai de domingo a DOMINGO, e a ordem dos atalhos é menor→maior', async () => {
    /*
      Pedido do Flavio em 06/08/2026, com a razão dele: *"não são todas as pessoas que sabem que a
      semana inicia no domingo. Tem gente que acha que começa na segunda, então ela não veria a
      escala do domingo próximo."* Antes ia domingo → sábado, e o domingo seguinte ficava de fora.

      A ordem é conferida nos DOIS conjuntos de botões — a barra lateral e a barra compacta do
      celular. Duas ordens para os mesmos três botões é o tipo de diferença que ninguém nota e todo
      mundo estranha.
    */
    const ordens = await p.evaluate(() =>
      [...document.querySelectorAll('button')].map((b) => b.innerText.trim()).filter((t) => /Semana|dias|Este Mês/.test(t)),
    )
    exigir(ordens.length >= 3, `só ${ordens.length} atalho(s) encontrados`)
    for (let i = 0; i + 2 < ordens.length; i += 3) {
      const trio = ordens.slice(i, i + 3)
      exigir(/Semana/.test(trio[0]), `1º atalho deveria ser "Esta Semana", é "${trio[0]}"`)
      exigir(/dias/.test(trio[1]), `2º atalho deveria ser os 15 dias, é "${trio[1]}"`)
      exigir(/Mês/.test(trio[2]), `3º atalho deveria ser "Este Mês", é "${trio[2]}"`)
    }
    /*
      ⚠️ A primeira versão desta metade calculava a janela AQUI, com `Date`, e imprimia "7 dias".
      Media a minha própria aritmética, não o filtro do produto — passaria com o filtro quebrado.
      Agora ela CLICA e lê os dias que a tela mostra.
    */
    await p.getByRole('button', { name: /Esta Semana/i }).first().click()
    await p.waitForTimeout(1200)
    const janela = await p.evaluate(() => {
      const dias = [...document.querySelectorAll('.export-item')]
        .map((x) => (x.innerText.replace(/\s+/g, ' ').match(/([A-Z]{3}) (\d{2}) ([A-ZÇÃ-]+)/) ?? []).slice(1))
        .filter((m) => m.length === 3)
      const primeiro = dias[0]
      const ultimo = dias[dias.length - 1]
      return { qtd: dias.length, primeiro, ultimo }
    })
    exigir(janela.qtd > 0, 'nenhum turno na semana — sem lista o resto não prova nada')
    exigir(/DOMINGO/i.test(janela.primeiro[2]), `a semana devia começar num domingo, começa em ${janela.primeiro.join(' ')}`)
    exigir(/DOMINGO/i.test(janela.ultimo[2]), `a semana devia TERMINAR num domingo (o pedido do dono), termina em ${janela.ultimo.join(' ')}`)
    exigir(janela.ultimo[1] !== janela.primeiro[1], 'o primeiro e o último domingo são o mesmo dia — a janela não chegou ao domingo seguinte')
    return `${ordens.length / 3} conjunto(s) na ordem certa · ${janela.primeiro.join(' ')} → ${janela.ultimo.join(' ')}`
  })

  await passo('🔴 as Estatísticas DIZEM que período estão contando', async () => {
    /*
      Medido em 06/08/2026 no site no ar: com o filtro "02/08 - 09/08" ligado e visível em vermelho,
      a tabela mostrava março a dezembro — idêntica. Quem olha conclui que os números são da semana,
      e conclui errado, sem nada que o corrija.

      Contar o período inteiro é o certo (distribuição de uma semana não significa nada). O que
      faltava era a tela DIZER isso.
    */
    await p.getByRole('button', { name: /Esta Semana/i }).first().click()
    await p.waitForTimeout(1000)
    await p.getByRole('button', { name: /Estatísticas/i }).first().click()
    await p.waitForTimeout(1500)
    const linha = (await p.locator('#root').innerText()).split(String.fromCharCode(10)).find((x) => /Total de turnos por/.test(x)) ?? ''
    exigir(/\d{2}\/\d{2}\/\d{4} a \d{2}\/\d{2}\/\d{4}/.test(linha), `o subtítulo não diz o período: "${linha.slice(0, 80)}"`)
    exigir(/sem os filtros/i.test(linha), 'o subtítulo não avisa que os filtros da tela não valem aqui')
    await p.getByRole('button', { name: /^Escala$/i }).first().click()
    await p.waitForTimeout(800)
    return linha.replace(/.*· /, '').slice(0, 70)
  })

  await passo('🔴 o filtro por DATA funciona (o `DateSearch` perdeu estado interno hoje)', async () => {
    const busca = p.locator('input[placeholder*="Buscar" i]').first()
    await busca.fill('16/08/2026')
    await p.waitForTimeout(1000)
    const t = await p.locator('#root').innerText()
    exigir(/SANTA\s*CEIA/i.test(t), 'filtrar 16/08 não trouxe a Santa Ceia')
    await busca.fill('')
    await p.waitForTimeout(700)
    return 'filtrou 16/08 e voltou'
  })

  await passo('🔴 os ATALHOS de período respondem (é de lá que o estado fantasma veio)', async () => {
    for (const rotulo of [/Próximos 15 dias/i, /Esta Semana/i, /Este Mês/i]) {
      const b = p.locator('button', { hasText: rotulo }).first()
      if (!(await b.count())) throw new Error(`atalho ${rotulo} não existe`)
      await b.click()
      await p.waitForTimeout(600)
      const t = await p.locator('#root').innerText()
      exigir(!/undefined|NaN/.test(t), `"${rotulo}" produziu undefined/NaN`)
    }
    return 'os 3 atalhos filtram sem quebrar'
  })

  await passo('a aba Validação mostra o catálogo inteiro', async () => {
    await p.reload({ waitUntil: 'networkidle' })
    await p.waitForTimeout(900)
    await p.locator('button', { hasText: /Valida/i }).first().click()
    await p.waitForTimeout(1200)
    const t = await p.locator('#root').innerText()
    /*
      🔴 A LISTA DE IDS ERA CRAVADA — sexta auditoria externa, 05/08/2026, mesma classe do `16/16`.

      Ela dizia `[...Array(11)]` mais os cinco Q, então continuou procurando **D1 a D11** depois de
      D12 entrar no catálogo. A régua saía verde e ainda IMPRIMIA "as 16 regras aparecem" — um número
      decorado, exatamente o defeito P4.14 que este projeto já registrou uma vez.

      Os ids agora vêm do CATÁLOGO compilado, que é a mesma fonte que a tela usa. Uma régua que decora
      o que deveria medir não é régua: é uma segunda cópia da resposta.
    */
    const ids = CATALOGO.map((r) => r.id)
    const faltam = ids.filter((id) => !new RegExp('(^|[^A-Z0-9])' + id + '([^0-9]|$)').test(t))
    exigir(faltam.length === 0, `faltam na tela: ${faltam.join(', ')}`)
    return `as ${ids.length} regras do catálogo aparecem`
  })

  // ── PARTE 2 — O CAMINHO DELE, na área administrativa ─────────────────────────────────────────
  console.log('\nPARTE 2 — o caminho do administrador\n')
  await p.goto(servidor.url + '#/admin', { waitUntil: 'networkidle' })
  await p.waitForTimeout(900)
  await p.locator('button', { hasText: /Entrar agora/i }).first().click()
  await p.waitForTimeout(1000)

  await passo('1. Elenco abre e lista as pessoas com suas restrições', async () => {
    await p.locator('button', { hasText: /^Elenco$/i }).first().click()
    await p.waitForTimeout(900)
    await p.screenshot({ path: join(RAIZ, 'capturas', 'caminho-1-elenco.png'), fullPage: true })
    const t = await p.locator('#root').innerText()
    exigir(/Adilson/.test(t), 'não lista as pessoas')
    exigir(!/undefined|NaN/.test(t), 'aparece undefined/NaN')
    return 'lista com restrições visíveis'
  })

  await passo('2. Gerar escala monta e mostra a conferência regra a regra', async () => {
    await p.locator('button', { hasText: /^Gerar escala$/i }).first().click()
    await p.waitForTimeout(700)
    const bs = p.locator('button', { hasText: /Gerar escala/i })
    await bs.nth((await bs.count()) - 1).click()
    await p.waitForTimeout(7000)
    await p.screenshot({ path: join(RAIZ, 'capturas', 'caminho-2-gerar.png'), fullPage: true })
    const t = await p.locator('#root').innerText()
    exigir(/Piso alcançado/.test(t), 'não mostrou o piso')
    /*
      🔴 O NÚMERO ERA CRAVADO, e por isso esta checagem estava QUEBRADA POR CONSTRUÇÃO desde que D12
      entrou — sexta auditoria externa, 05/08/2026. A tela mostra `17/17`, e a régua exigia `16/16`.
      Como `vivo:caminho` está fora do gate (precisa do site no ar), ninguém soube.

      Agora a régua não decora: exige "N/N" com os dois lados IGUAIS, que é a promessa de verdade —
      "a validação percorreu o catálogo inteiro, sem subconjunto escondido".
    */
    const mRegras = t.match(/(\d+)\s*\/\s*(\d+)\s*regras/i) ?? t.match(/regras conferidas[^0-9]*(\d+)\s*\/\s*(\d+)/i)
    exigir(!!mRegras, 'não mostrou a contagem de regras conferidas')
    exigir(mRegras[1] === mRegras[2], `mostrou ${mRegras[1]}/${mRegras[2]} — a validação não percorreu o catálogo inteiro`)
    exigir(!/melhor de 0 versões/.test(t), 'diz "melhor de 0 versões"')
    exigir(!/undefined|NaN/.test(t), 'aparece undefined/NaN')
    const piso = t.match(/Piso alcançado: (\d+)/)?.[1]
    const versoes = t.match(/melhor de\s+(\d+)\s+vers/)?.[1]
    return `piso ${piso} dias · melhor de ${versoes} versões · ${mRegras[1]}/${mRegras[2]} regras`
  })

  await passo('3. Ajustar abre com os turnos, prontos para trocar', async () => {
    await p.locator('button', { hasText: /^Ajustar$/i }).first().click()
    await p.waitForTimeout(1200)
    await p.screenshot({ path: join(RAIZ, 'capturas', 'caminho-3-ajustar.png'), fullPage: true })
    const t = await p.locator('#root').innerText()
    exigir(t.length > 3000, `só ${t.length} caracteres — a lista de turnos não carregou`)
    exigir(!/A escala ficou inválida/.test(t), 'a escala recém-gerada aparece como inválida')
    return `${t.length} caracteres de turnos`
  })

  await passo('4. Conferir por fora — a segunda régua concorda', async () => {
    await p.locator('button', { hasText: /Conferir por fora/i }).first().click()
    await p.waitForTimeout(1500)
    await p.screenshot({ path: join(RAIZ, 'capturas', 'caminho-4-conferir.png'), fullPage: true })
    const t = await p.locator('#root').innerText()
    exigir(!/discord/i.test(t) || /não .{0,20}discord/i.test(t), 'as duas réguas discordam')
    exigir(!/undefined|NaN/.test(t), 'aparece undefined/NaN')
    return t.split('\n').filter(Boolean).slice(1, 3).join(' · ')
  })

  await passo('5. Publicar mostra o que vai subir, e não trava sem motivo', async () => {
    await p.locator('button', { hasText: /^Publicar$/i }).first().click()
    await p.waitForTimeout(1200)
    await p.screenshot({ path: join(RAIZ, 'capturas', 'caminho-5-publicar.png'), fullPage: true })
    const t = await p.locator('#root').innerText()
    exigir(!/undefined|NaN/.test(t), 'aparece undefined/NaN')
    return t.split('\n').filter(Boolean).slice(0, 3).join(' · ')
  })

  await passo('🔴 6. e o número NÃO muda ao voltar para Gerar', async () => {
    await p.locator('button', { hasText: /^Gerar escala$/i }).first().click()
    await p.waitForTimeout(1200)
    const t = await p.locator('#root').innerText()
    exigir(!/melhor de 0 versões/.test(t), 'voltou a dizer "melhor de 0 versões"')
    exigir(/Piso alcançado/.test(t), 'perdeu o resultado ao trocar de aba')
    return 'a escala e os números sobreviveram à navegação'
  })
} finally {
  await navegador.close()
  await servidor.derrubar()
}

console.log('\nCONSOLE DO NAVEGADOR:', erros.length ? '🔴 ' + erros.slice(0, 5).join(' | ') : '✅ sem erros')
console.log(`\n${problemas.length ? '🔴 ' + problemas.length + ' problema(s)' : '✅ O caminho inteiro funciona, do site público ao Publicar.'}`)
process.exit(problemas.length || erros.length ? 1 : 0)
