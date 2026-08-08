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
 * 🔴 P2.18 (08/08/2026): grupo LOCAL do `vivo:tudo` medindo a URL PUBLICADA era "verde de outra
 * árvore" dentro do gate — e não rodava onde a rede é fechada. O padrão agora é o build local;
 * a URL por argumento continua valendo para medir o site no ar.
 *
 * Uso: node scripts/validar-celular.mjs [url]
 */
import { chromium, devices } from 'playwright'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { subirServidor } from './lib/servidor-de-teste.mjs'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORTA = 4303
const servidor = process.argv[2] ? null : await subirServidor({ raiz: RAIZ, porta: PORTA, modo: 'preview' })
const BASE = process.argv[2] ?? servidor.url
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
/*
  🔴 44, NÃO 40 — P4.5, que estava marcado FECHADO com o defeito intacto (achado da auditoria
     externa de 05/08/2026).

     A régua media 40 logo abaixo de um comentário que invoca 44 (Apple) e 48 (Material) como
     justificativa. Um item diferente foi consertado no mesmo dia e o P4.5 foi fechado junto —
     o `BACKLOG.md` promete *"item que sai sem prova volta"*, e este saiu sem prova.

     Medido antes de subir o número: **todos os botões já passavam de 44px**. A folga não
     protegia nada; só deixava a régua discordar do próprio comentário.
*/
/*
  🔴 E ELA MEDIA A TELA ERRADA — sétima auditoria externa, 05/08/2026.

  Esta checagem roda DEPOIS de o script ter navegado para `#/admin`, e nunca voltava. Ou seja: media
  os 5 botões da **porta do administrador** e declarava 100% de aprovação. A tela pública — que é o
  produto inteiro para os 16 irmãos — **nunca foi medida**.

  E o comentário logo acima, *"todos os botões já passavam de 44px"*, descrevia o admin. Medido na
  tela pública, no mesmo aparelho:

      "Minha Escala" 34px · "Filtros" 34px · "15 dias" 28px · "Esta Semana" 28px · "Este Mês" 28px
      5 de 5 abaixo da régua da casa

  É "portão que mede menos do que diz" com a agravante de medir **outra página** — e, das nove vezes
  que essa classe apareceu hoje, a única em que a fronteira era a NAVEGAÇÃO, não o padrão de busca.

  Agora ela mede as DUAS telas, volta para o admin no fim (os passos seguintes contam com isso), e
  diz de qual tela veio cada botão pequeno.
*/
await conferir('os botões têm alvo de toque de pelo menos 44px — NAS DUAS TELAS', async () => {
  const medirBotoes = async () =>
    pagina.evaluate(() =>
      [...document.querySelectorAll('button')]
        .filter((b) => b.offsetParent !== null)
        .map((b) => ({ t: (b.textContent ?? '').trim().slice(0, 28), h: Math.round(b.getBoundingClientRect().height) }))
        .filter((x) => x.h > 0 && x.h < 44))

  const doAdmin = (await medirBotoes()).map((x) => ({ ...x, onde: 'admin' }))

  await pagina.goto(BASE, { waitUntil: 'networkidle' })
  await pagina.waitForTimeout(900)
  const daPublica = (await medirBotoes()).map((x) => ({ ...x, onde: 'pública' }))

  // 🔒 Voltar para o admin: os passos seguintes assumem essa tela, e mudar isso em silêncio
  //    reproduziria exatamente o defeito que este bloco existe para consertar.
  await pagina.goto(BASE + '#/admin', { waitUntil: 'networkidle' })
  await pagina.waitForTimeout(700)

  const pequenos = [...daPublica, ...doAdmin]
  return {
    ok: pequenos.length === 0,
    detalhe: pequenos.length === 0 ? 'todos com 44px ou mais, na pública e no admin' : pequenos.map((p) => `[${p.onde}] "${p.t}" ${p.h}px`).join(' · '),
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
await servidor?.derrubar()

const falhou = checagens.some((c) => !c.ok) || relevantes.length > 0
console.log(falhou ? '\n🔴 REPROVOU NO CELULAR' : '\n✅ APROVADO NO CELULAR')
process.exit(falhou ? 1 : 0)
