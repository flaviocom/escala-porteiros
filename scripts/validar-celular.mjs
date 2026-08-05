/**
 * 📱 VALIDAÇÃO AO VIVO EM CELULAR.
 *
 * A área administrativa foi validada só em desktop até aqui — e é do celular que o Flavio mais
 * provavelmente vai mexer na escala, porque é o aparelho que está com ele quando alguém avisa que
 * não pode. Uma tela que funciona em 1280px e quebra em 390px está quebrada onde importa.
 *
 * O que se afere aqui é o que só o navegador prova: se a página **rola de lado** (o pior defeito de
 * mobile), se os botões têm alvo de toque suficiente, e se os campos não estouram a largura.
 *
 * Uso: node scripts/validar-celular.mjs [url]
 */
import { chromium, devices } from 'playwright'

const BASE = process.argv[2] ?? 'https://flaviocom.github.io/escala-porteiros/'
const APARELHO = devices['iPhone 13']

const navegador = await chromium.launch()
const contexto = await navegador.newContext({ ...APARELHO })
const pagina = await contexto.newPage()

const erros = []
pagina.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()) })
pagina.on('pageerror', (e) => erros.push(`pageerror: ${e.message}`))

const checagens = []
const conferir = async (nome, fn) => {
  try { checagens.push({ nome, ...(await fn()) }) } catch (e) { checagens.push({ nome, ok: false, detalhe: e.message }) }
}

console.log(`Abrindo ${BASE} num ${APARELHO.viewport.width}×${APARELHO.viewport.height} (iPhone 13)\n`)
await pagina.goto(BASE, { waitUntil: 'networkidle', timeout: 60_000 })

/** O defeito de mobile mais comum e mais feio: a página rolar de lado. */
const rolaDeLado = async () =>
  pagina.evaluate(() => ({
    conteudo: document.documentElement.scrollWidth,
    janela: document.documentElement.clientWidth,
  }))

await conferir('o site público NÃO rola de lado', async () => {
  const { conteudo, janela } = await rolaDeLado()
  return { ok: conteudo <= janela + 1, detalhe: `conteúdo ${conteudo}px · janela ${janela}px` }
})

await conferir('a escala aparece no celular', async () => {
  const texto = await pagina.locator('#root').innerText()
  return { ok: texto.length > 200, detalhe: `${texto.length} caracteres visíveis` }
})

await conferir('a engrenagem é alcançável no celular', async () => {
  const n = await pagina.locator('a[href="#/admin"]').count()
  return { ok: n > 0, detalhe: `${n} encontrada(s)` }
})

await conferir('a área administrativa abre e NÃO rola de lado', async () => {
  await pagina.goto(BASE + '#/admin', { waitUntil: 'networkidle' })
  await pagina.waitForTimeout(900)
  const { conteudo, janela } = await rolaDeLado()
  return { ok: conteudo <= janela + 1, detalhe: `conteúdo ${conteudo}px · janela ${janela}px` }
})

await conferir('os campos da porta cabem na largura', async () => {
  const estouram = await pagina.evaluate(() => {
    const j = document.documentElement.clientWidth
    return [...document.querySelectorAll('input, button, table')]
      .filter((e) => e.getBoundingClientRect().width > j + 1).length
  })
  return { ok: estouram === 0, detalhe: estouram === 0 ? 'nenhum elemento mais largo que a tela' : `${estouram} elemento(s) estouram` }
})

/**
 * 44×44 CSS px é a recomendação da Apple para alvo de toque; o Material usa 48. Abaixo disso o dedo
 * erra, e errar num botão que publica escala é caro.
 */
await conferir('os botões têm alvo de toque de pelo menos 40px de altura', async () => {
  const pequenos = await pagina.evaluate(() =>
    [...document.querySelectorAll('button')]
      .filter((b) => b.offsetParent !== null)
      .map((b) => ({ t: (b.textContent ?? '').trim().slice(0, 28), h: Math.round(b.getBoundingClientRect().height) }))
      .filter((x) => x.h > 0 && x.h < 40))
  return {
    ok: pequenos.length === 0,
    detalhe: pequenos.length === 0 ? 'todos com 40px ou mais' : pequenos.map((p) => `"${p.t}" ${p.h}px`).join(' · '),
  }
})

/**
 * ⚠️ Esta checagem já mediu a coisa errada. Ela pegava `input[type=password]` PRIMEIRO da tela e
 * lia o valor depois — mas digitar no campo do token faz os campos de senha nascerem, o React
 * redesenha, e o "primeiro" passa a ser outro elemento. O portão acusava o produto por defeito da
 * própria régua. Agora o campo é escolhido pelo RÓTULO, que não muda de dono.
 */
await conferir('dá para digitar no celular sem perder o texto', async () => {
  const campo = pagina.getByLabel(/Token do GitHub/i).first()
  await campo.click()
  await campo.type('teste-de-toque-123', { delay: 10 })
  const v = await campo.inputValue()
  return { ok: v === 'teste-de-toque-123', detalhe: v === 'teste-de-toque-123' ? 'o texto chegou inteiro' : `veio "${v}"` }
})

/**
 * 🔴 O CAMPO NÃO PODE FUGIR DE DEBAixO DO DEDO — portão criado em 05/08/2026.
 *
 * Medido num iPhone 13: os campos de senha nasciam ACIMA do token e empurravam 176 px o campo em
 * que a pessoa estava digitando. Com o teclado aberto, isso é perder a linha no meio de um token
 * de 90 caracteres. Movidos para baixo, o deslocamento é ZERO.
 *
 * ⚠️ Mede a posição no DOCUMENTO, não na janela: `boundingBox()` muda com a rolagem e mediria o
 * navegador rolando, não o layout se movendo. Foi assim que a primeira medição errou por 360 px.
 */
await conferir('o campo em que se digita NÃO se desloca ao redesenhar', async () => {
  const campo = pagina.getByLabel(/Token do GitHub/i).first()
  const onde = () => campo.evaluate((el) => el.getBoundingClientRect().top + window.scrollY)
  const antes = await onde()
  await campo.fill('')
  await campo.type('github_pat_de_teste', { delay: 8 })
  await pagina.waitForTimeout(500)
  const desloc = Math.abs((await onde()) - antes)
  return { ok: desloc <= 24, detalhe: `${desloc.toFixed(0)} px de deslocamento (teto: 24)` }
})

console.log('CHECAGENS')
for (const c of checagens) console.log(`  ${c.ok ? '✅' : '🔴'} ${c.nome}\n        ${c.detalhe}`)

const relevantes = erros.filter((e) => !/401|Failed to load resource|api\.github\.com/i.test(e))
console.log('\nCONSOLE')
console.log(relevantes.length ? relevantes.slice(0, 6).map((e) => '  🔴 ' + e).join('\n') : '  ✅ sem erros inesperados')

await pagina.screenshot({ path: 'capturas/ao-vivo-celular.png' })
await navegador.close()

const falhou = checagens.some((c) => !c.ok) || relevantes.length > 0
console.log(falhou ? '\n🔴 REPROVOU NO CELULAR' : '\n✅ APROVADO NO CELULAR')
process.exit(falhou ? 1 : 0)
