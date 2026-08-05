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
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { subirServidor } from './lib/servidor-de-teste.mjs'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
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
    const ids = [...Array(11)].map((_, i) => `D${i + 1}`).concat(['Q1', 'Q2', 'Q3', 'Q4', 'Q5'])
    const faltam = ids.filter((id) => !new RegExp('(^|[^A-Z0-9])' + id + '([^0-9]|$)').test(t))
    exigir(faltam.length === 0, `faltam na tela: ${faltam.join(', ')}`)
    return `as ${ids.length} regras aparecem`
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
    exigir(/16\/16/.test(t), 'não mostrou 16/16 regras')
    exigir(!/melhor de 0 versões/.test(t), 'diz "melhor de 0 versões"')
    exigir(!/undefined|NaN/.test(t), 'aparece undefined/NaN')
    const piso = t.match(/Piso alcançado: (\d+)/)?.[1]
    const versoes = t.match(/melhor de\s+(\d+)\s+vers/)?.[1]
    return `piso ${piso} dias · melhor de ${versoes} versões · 16/16 regras`
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
