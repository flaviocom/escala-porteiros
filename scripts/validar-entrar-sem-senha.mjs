/**
 * Prova as DUAS pontas do conserto de 05/08/2026:
 *
 *   · sem token, a tela NÃO pede senha e não guarda nada no navegador;
 *   · com token digitado, a senha VOLTA a ser exigida — a proteção não sumiu, ela ficou proporcional
 *     ao que existe para proteger.
 *
 * Provar só a primeira deixaria passar um conserto que abriu o cofre para todo mundo.
 */
import { chromium } from 'playwright'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { subirServidor } from './lib/servidor-de-teste.mjs'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORTA = 4292

const checagens = []
const conferir = (nome, ok, detalhe = '') => checagens.push({ nome, ok, detalhe })

console.log('ENTRAR SEM SENHA E SEM TOKEN — as duas pontas\n')

const servidor = await subirServidor({ raiz: RAIZ, porta: PORTA, modo: 'preview' })
let navegador
try {
  navegador = await chromium.launch()
  const pagina = await navegador.newPage({ viewport: { width: 1400, height: 1000 } })
  const erros = []
  pagina.on('pageerror', (e) => erros.push(e.message))

  let subiu = false
  for (let i = 0; i < 40 && !subiu; i++) {
    try {
      await pagina.goto(servidor.url + '#/admin', { waitUntil: 'networkidle', timeout: 3000 })
      subiu = true
    } catch { await pagina.waitForTimeout(500) }
  }
  if (!subiu) throw new Error('o servidor não subiu')
  await pagina.waitForTimeout(1200)

  // ── PONTA 1: sem segredo, sem senha ─────────────────────────────────────
  // ⚠️ Contar `input[type=password]` MEDE A COISA ERRADA: o campo do token e o da chave do motor
  // também são desse tipo. O que precisa sumir são os campos SENHA e REPITA A SENHA — então a
  // medição é pelo RÓTULO. Errar isso daria um vermelho no produto por defeito da régua.
  const contarSenhas = () => pagina.getByLabel(/^(Senha \(mínimo|Repita a senha)/i).count()
  const camposSenhaAntes = await contarSenhas()
  const rotulos = await pagina.locator('body').innerText()
  conferir('NENHUM campo de SENHA aparece de saída', camposSenhaAntes === 0,
    `${camposSenhaAntes} campo(s) rotulado(s) como senha`)
  conferir('a tela diz que não precisa de token nem senha', /sem senha, sem token/i.test(rotulos),
    rotulos.match(/Entrar agora[^\n]*/i)?.[0] ?? '(botão não encontrado)')

  const entrarDireto = pagina.getByRole('button', { name: /Entrar agora — sem senha, sem token/i }).first()
  await entrarDireto.click()
  await pagina.waitForTimeout(2000)

  const dentro = await pagina.locator('body').innerText()
  const entrou = !/Configurar o acesso/i.test(dentro)
  conferir('ENTROU com um clique, sem digitar nada', entrou,
    entrou ? 'a tela de configuração saiu' : 'continuou na configuração')

  const cofre = await pagina.evaluate(() =>
    Object.keys(localStorage).filter((k) => /cofre|segred|admin/i.test(k)))
  conferir('NADA foi guardado no navegador', cofre.length === 0,
    cofre.length ? `guardou: ${cofre.join(', ')}` : 'nenhuma chave de cofre no localStorage')

  for (const aba of ['Elenco', 'Gerar escala', 'Publicar']) {
    const achou = await pagina.getByRole('button', { name: new RegExp(`^${aba}`, 'i') }).count()
    conferir(`aba "${aba}" utilizável`, achou > 0, achou ? 'presente' : 'AUSENTE')
  }
  conferir('o elenco carrega', ['Adilson', 'Williams', 'Thiago'].every((n) => dentro.includes(n)),
    'nomes dos irmãos na tela')

  // ── PONTA 2: com token, a senha VOLTA ───────────────────────────────────
  await pagina.goto(servidor.url + '#/admin', { waitUntil: 'networkidle' })
  await pagina.waitForTimeout(1200)
  const campoToken = pagina.getByLabel(/Token do GitHub/i).first()
  await campoToken.fill('ghp_valor_sintetico_apenas_para_o_teste')
  await pagina.waitForTimeout(600)

  const camposSenhaDepois = await contarSenhas()
  conferir('🔴 com token digitado, os campos de SENHA reaparecem', camposSenhaDepois === 2,
    `${camposSenhaAntes} antes → ${camposSenhaDepois} depois`)

  const textoComToken = await pagina.locator('body').innerText()
  conferir('e o botão passa a falar em guardar com senha', /Conferir e guardar com senha/i.test(textoComToken),
    textoComToken.match(/Conferir e guardar[^\n]*/i)?.[0] ?? '(rótulo não mudou)')

  conferir('nenhum erro no console', erros.length === 0, erros.slice(0, 2).join(' · ') || 'limpo')
  await pagina.goto(servidor.url + '#/admin', { waitUntil: 'networkidle' })
  await pagina.waitForTimeout(900)
  await pagina.screenshot({ path: join(RAIZ, 'capturas', 'entrar-sem-senha.png'), fullPage: false })
} finally {
  if (navegador) await navegador.close()
  await servidor.derrubar()
}

console.log('')
for (const c of checagens) console.log(`  ${c.ok ? '✅' : '🔴'} ${c.nome.padEnd(50)} ${c.detalhe}`)
const falhas = checagens.filter((c) => !c.ok)
console.log(`\n  ${checagens.length - falhas.length} de ${checagens.length} checagens aprovadas`)
if (falhas.length) { console.log('\n🔴 NÃO está utilizável.'); process.exit(1) }
console.log('\n✅ Entra com um clique e sem guardar nada — e a senha volta quando há token para proteger.')
