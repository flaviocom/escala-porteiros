/**
 * 🏷️ PORTÃO — todo campo de formulário tem um NOME que dá para alcançar?
 *
 * 🔴 POR QUE ESTE PORTÃO EXISTE. Em 05/08/2026 acrescentei à aba "Gerar" o campo de data da Santa
 * Ceia. Ele nasceu só com `title` — sem rótulo. Duas coisas quebraram de uma vez:
 *
 *   1. quem usa leitor de tela ficou sem saber o que aquele campo é (o `title` é lido por último,
 *      quando é lido);
 *   2. o validador de "Gerar" procurava os campos de data POR POSIÇÃO — `nth(2)`, `nth(3)`. O campo
 *      novo entrou no meio, empurrou os outros, e o teste passou a digitar a data da ausência dentro
 *      do campo da Santa Ceia. A tela recusava a ausência, com razão, e o teste acusava a tela.
 *
 * O segundo item é o que me convenceu a escrever um portão em vez de só corrigir: **campo sem rótulo
 * é campo invisível — para quem não enxerga e para quem mede.** Um localizador por rótulo quebra
 * alto no dia em que o rótulo sumir; um por posição erra em silêncio.
 *
 * O que conta como nome alcançável, na ordem em que a plataforma resolve: `aria-label`,
 * `aria-labelledby` que aponte para texto real, um `<label>` que envolva o campo, um `label[for]`,
 * ou um `placeholder` (que vale, mas é fraco — some quando o campo é preenchido).
 *
 * ⚠️ `title` NÃO conta, de propósito. Era exatamente o que os dois campos defeituosos tinham.
 *
 * 🔴 O QUE ESTE PORTÃO **NÃO** MEDE, declarado porque isenção calada é buraco com outro nome: só o
 * que está na tela no momento da medida. Aba travada é destravada (gerando uma escala) e medida;
 * se alguma continuar travada, ela é NOMEADA na saída e o portão reprova — um portão que pula o que
 * não conseguiu abrir mede menos do que a frase dele promete.
 *
 * Uso: node scripts/portao-rotulos.mjs
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { subirServidor } from './lib/servidor-de-teste.mjs'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORTA = 4297

console.log('🏷️  TODO CAMPO TEM NOME ALCANÇÁVEL?\n')

const servidor = await subirServidor({ raiz: RAIZ, porta: PORTA, modo: 'preview' })
let navegador
try {
  navegador = await chromium.launch()
  const pagina = await navegador.newPage({ viewport: { width: 1400, height: 1400 } })

  // A medida roda dentro da página porque só lá existe o que a plataforma realmente resolve:
  // `offsetParent` para "está visível", `CSS.escape` para id com caractere esquisito.
  const medir = (cena) =>
    pagina.evaluate((nomeDaCena) => {
      const temNome = (el) => {
        if (el.getAttribute('aria-label')?.trim()) return true
        const apontado = el.getAttribute('aria-labelledby')
        if (apontado && apontado.split(/\s+/).some((id) => document.getElementById(id)?.textContent?.trim())) return true
        if (el.closest('label')?.textContent?.trim()) return true
        if (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)?.textContent?.trim()) return true
        if (el.getAttribute('placeholder')?.trim()) return true
        return false
      }
      const fora = []
      let vistos = 0
      for (const el of document.querySelectorAll('input:not([type=hidden]), select, textarea')) {
        if (!el.offsetParent && el.type !== 'checkbox') continue
        vistos++
        if (!temNome(el)) {
          const t = (el.getAttribute('title') ?? '').slice(0, 40)
          fora.push(`${nomeDaCena} · <${el.tagName.toLowerCase()} type=${el.type || '-'}>${t ? ` title="${t}"` : ' (nem title tem)'}`)
        }
      }
      return { vistos, fora }
    }, cena)

  let subiu = false
  for (let i = 0; i < 40 && !subiu; i++) {
    try { await pagina.goto(servidor.url + '#/admin', { waitUntil: 'networkidle', timeout: 3000 }); subiu = true }
    catch { await pagina.waitForTimeout(500) }
  }
  if (!subiu) throw new Error('o servidor não subiu')
  await pagina.waitForTimeout(1200)

  const achados = []
  let campos = 0
  const cenas = []
  const somar = (cena, r) => { campos += r.vistos; achados.push(...r.fora); cenas.push(`${cena} (${r.vistos})`) }

  somar('trava', await medir('trava'))

  await pagina.getByRole('button', { name: /Entrar agora — sem senha, sem token/i }).first().click()
  await pagina.waitForTimeout(1500)

  // As abas são LIDAS da tela, não escritas aqui. Uma lista minha envelheceria calada no dia em que
  // uma aba nova aparecesse — e aba não medida é o buraco que este portão existe para não ter.
  const nomesDasAbas = await pagina.evaluate(() =>
    [...document.querySelectorAll('button')]
      .filter((b) => b.className.includes('border-b-2'))
      .map((b) => b.textContent.trim())
      .filter(Boolean),
  )
  if (nomesDasAbas.length === 0) throw new Error('nenhuma aba encontrada — o seletor de abas mudou')

  const travadas = []
  for (const passada of [1, 2]) {
    for (const aba of nomesDasAbas) {
      if (cenas.some((c) => c.startsWith(aba + ' '))) continue
      const botao = pagina.getByRole('button', { name: new RegExp('^' + aba.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).first()
      if (!(await botao.count())) continue
      if (await botao.isDisabled()) { if (passada === 2) travadas.push(aba); continue }
      await botao.click()
      await pagina.waitForTimeout(900)
      somar(aba, await medir(aba))
    }
    // Entre as duas passadas, gera uma escala: é o que destrava "Ajustar" e "Conferir por fora".
    //
    // ⚠️ O botão que gera tem o MESMO texto da aba que o contém — "Gerar escala". `.first()` pega a
    // aba e não gera nada, calado. `.last()` pega o botão; a diferença entre os dois é a diferença
    // entre este portão medir 5 cenas ou 3.
    if (passada === 1 && nomesDasAbas.some((a) => cenas.every((c) => !c.startsWith(a + ' ')))) {
      await pagina.getByRole('button', { name: /^Gerar escala/i }).first().click()
      await pagina.waitForTimeout(700)
      const motor = pagina.getByRole('button', { name: /^Gerar escala$/ }).last()
      if (await motor.count()) {
        await motor.click()
        // Esperar o texto, não o relógio: em máquina lenta 6 s não bastam e o portão culparia a tela.
        await pagina.getByText(/Piso alcançado|não foi possível cobrir|Segunda opinião/i).first()
          .waitFor({ timeout: 90_000 }).catch(() => {})
      }
    }
  }

  await pagina.goto(servidor.url, { waitUntil: 'networkidle' })
  await pagina.waitForTimeout(1200)
  somar('tela dos irmãos', await medir('tela dos irmãos'))

  console.log(`  cenas medidas ............. ${cenas.join(' · ')}`)
  console.log(`  campos medidos ............ ${campos}`)
  console.log(`  sem nome alcançável ....... ${achados.length}`)
  if (travadas.length) console.log(`  🔴 abas que não abriram ... ${travadas.join(' · ')}`)
  console.log('')

  for (const a of achados) console.log(`  🔴 ${a}`)

  if (campos === 0) {
    console.log('🔴 nenhum campo foi medido — não há o que provar, e isso é defeito de população.')
    process.exit(1)
  }
  if (achados.length || travadas.length) {
    if (achados.length) {
      console.log('\n   Campo sem rótulo é campo invisível: para quem usa leitor de tela e para quem mede.')
      console.log('   Envolva o campo num <label> com texto, ou dê a ele um aria-label. `title` não basta.')
    }
    if (travadas.length) console.log('\n   E aba que não abriu é aba não medida — o portão não pode dar verde sobre o que não viu.')
    process.exit(1)
  }
  console.log(`✅ os ${campos} campos das ${cenas.length} cenas têm nome que dá para alcançar.`)
} finally {
  await navegador?.close()
  // 🔴 `derrubar`, NÃO `parar`. Escrevi `servidor.parar?.()` em três scripts hoje: o método não
  // existe, o `?.` engoliu em silêncio, e cada execução deixou um servidor vivo. Foi a raiz dos
  // conflitos de porta que atrapalharam a sessão inteira — e, no `vivo:publicar`, do processo que
  // terminava o trabalho com 9 de 9 e **nunca encerrava**, porque o servidor segurava o laço.
  // Encadeamento opcional em cima de nome errado transforma defeito em silêncio.
  await servidor.derrubar()
}
process.exit(0)
