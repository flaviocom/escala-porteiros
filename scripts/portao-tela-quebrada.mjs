/**
 * 🖼️ PORTÃO — texto quebrado e layout estourado, nas telas de verdade.
 *
 * 🔴 POR QUE ELE EXISTE. Em 06/08/2026 o dono perguntou se a verificação visual tinha sido feita, e
 * a resposta honesta era **não**: eu media o DOM de todas as telas e não abria nenhuma captura. Ao
 * abrir, achei markdown cru aparecendo na tela — defeito que nenhuma medição de texto pega, porque o
 * texto *está lá*, só está feio.
 *
 * O `markdown-cru` (passo 6) fechou aquela forma. Mas a categoria é maior que ela, e dizer "o resto
 * exige olho" e parar por aí é deixar a parte automatizável sem ninguém. Este portão é essa parte.
 *
 * O que ele procura, nas 7 cenas do produto:
 *
 *   1. **Texto quebrado** — `undefined`, `NaN`, `[object Object]`, `Invalid Date`, `null` como
 *      palavra, `TODO`/`FIXME`, `lorem ipsum`. São os restos que aparecem quando um dado não chegou
 *      e ninguém tratou. Não são feios: são **errados**, e passam por qualquer checagem que só
 *      pergunta "o texto existe?".
 *   2. **Rolagem horizontal na página** — `scrollWidth > clientWidth` no documento. Numa tela que
 *      alguém abre no celular, isso é conteúdo que some pela direita.
 *   3. **Texto cortado dentro da própria caixa** — elemento com `overflow: hidden` cujo conteúdo não
 *      cabe. É como um nome comprido some no meio.
 *
 * 🔴 O QUE ELE **NÃO** MEDE, declarado: se está bonito, se a hierarquia está clara, se a frase está
 * confusa. Isso continua exigindo abrir a captura e ler — e o registro deste projeto diz, com data,
 * que medição e olho pegam coisas diferentes.
 *
 * ⚠️ Tolerância de 2px no corte de texto: navegador arredonda sub-pixel, e 1px de diferença é ruído
 * de renderização, não defeito. Sem a tolerância o portão acusaria a tela inteira.
 *
 * Uso: node scripts/portao-tela-quebrada.mjs
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { subirServidor } from './lib/servidor-de-teste.mjs'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORTA = 4296

console.log('🖼️  TEXTO QUEBRADO E LAYOUT ESTOURADO\n')

const servidor = await subirServidor({ raiz: RAIZ, porta: PORTA, modo: 'preview' })
let navegador
try {
  navegador = await chromium.launch()
  const pagina = await navegador.newPage({ viewport: { width: 1400, height: 1400 } })

  const medir = (cena) =>
    pagina.evaluate((nomeDaCena) => {
      const RESTOS = [
        { nome: 'undefined', re: /\bundefined\b/ },
        { nome: 'NaN', re: /\bNaN\b/ },
        { nome: '[object Object]', re: /\[object Object\]/ },
        { nome: 'Invalid Date', re: /Invalid Date/i },
        { nome: 'null', re: /(?<![\w.])null(?![\w.])/ },
        { nome: 'TODO/FIXME', re: /\b(TODO|FIXME|XXX)\b/ },
        { nome: 'lorem ipsum', re: /lorem ipsum/i },
      ]
      const achados = []

      // 1. restos no texto visível
      const visivel = document.body.innerText ?? ''
      for (const r of RESTOS) {
        const m = visivel.match(r.re)
        if (m) {
          const i = visivel.indexOf(m[0])
          achados.push(`${nomeDaCena} · resto na tela "${r.nome}" — …${visivel.slice(Math.max(0, i - 40), i + 40).replace(/\n/g, ' ')}…`)
        }
      }

      /*
        2. conteúdo empurrado para fora da tela, pela direita.

        🔴 A primeira versão media `documentElement.scrollWidth > clientWidth` — e o autoteste a
        reprovou: injetei um `<div style={{width: 3000}}>` e o portão aprovou. A casca do aplicativo
        tem `overflow-x: hidden`, então o documento **não rola**: o conteúdo simplesmente some pela
        direita, calado. A sonda media a rolagem, e a rolagem tinha sido desligada.

        Medir a BORDA DIREITA de cada elemento pega os dois casos — o que rola e o que é clipado.
      */
      const larguraDaTela = document.documentElement.clientWidth
      for (const el of document.querySelectorAll('body *')) {
        if (!el.offsetParent) continue
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) continue
        if (r.right > larguraDaTela + 2) {
          const t = (el.textContent ?? '').trim().slice(0, 40)
          achados.push(`${nomeDaCena} · conteúdo fora da tela pela direita: termina em ${Math.round(r.right)}px numa tela de ${larguraDaTela}px${t ? ` — "${t}"` : ` — <${el.tagName.toLowerCase()}>`}`)
          break // um por cena basta: o resto é o mesmo estouro propagando pelos filhos
        }
      }

      // 3. texto cortado dentro da própria caixa
      let medidos = 0
      for (const el of document.querySelectorAll('body *')) {
        if (!el.offsetParent) continue
        if (el.children.length > 0) continue // só folhas: o pai herda o overflow do filho
        const texto = (el.textContent ?? '').trim()
        if (!texto) continue
        medidos++
        const estilo = getComputedStyle(el)
        if (estilo.overflow === 'hidden' || estilo.overflowX === 'hidden') {
          // `text-overflow: ellipsis` é corte DELIBERADO, com reticências à vista: não é defeito.
          if (estilo.textOverflow === 'ellipsis') continue
          if (el.scrollWidth > el.clientWidth + 2) {
            achados.push(`${nomeDaCena} · texto cortado (${el.scrollWidth}px em ${el.clientWidth}px): "${texto.slice(0, 46)}"`)
          }
        }
      }
      return { achados, medidos }
    }, cena)

  let subiu = false
  for (let i = 0; i < 40 && !subiu; i++) {
    try { await pagina.goto(servidor.url + '#/admin', { waitUntil: 'networkidle', timeout: 3000 }); subiu = true }
    catch { await pagina.waitForTimeout(500) }
  }
  if (!subiu) throw new Error('o servidor não subiu')
  await pagina.waitForTimeout(1200)

  const achados = []
  const cenas = []
  let elementos = 0
  const somar = async (cena) => {
    const r = await medir(cena)
    achados.push(...r.achados)
    elementos += r.medidos
    cenas.push(`${cena} (${r.medidos})`)
  }

  await somar('trava')
  await pagina.getByRole('button', { name: /Entrar agora — sem senha, sem token/i }).first().click()
  await pagina.waitForTimeout(1500)

  const nomesDasAbas = await pagina.evaluate(() =>
    [...document.querySelectorAll('button')].filter((b) => b.className.includes('border-b-2')).map((b) => b.textContent.trim()).filter(Boolean),
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
      await somar(aba)
    }
    if (passada === 1) {
      await pagina.getByRole('button', { name: /^Gerar escala/i }).first().click()
      await pagina.waitForTimeout(700)
      const motor = pagina.getByRole('button', { name: /^Gerar escala$/ }).last()
      if (await motor.count()) {
        await motor.click()
        await pagina.getByText(/Piso alcançado|não foi possível cobrir|Segunda opinião/i).first().waitFor({ timeout: 90_000 }).catch(() => {})
      }
    }
  }

  await pagina.goto(servidor.url, { waitUntil: 'networkidle' })
  await pagina.waitForTimeout(1200)
  await somar('tela dos irmãos')

  // E no celular, onde a rolagem horizontal realmente machuca.
  await pagina.setViewportSize({ width: 390, height: 844 })
  await pagina.waitForTimeout(900)
  await somar('tela dos irmãos (celular 390px)')

  console.log(`  cenas medidas ............. ${cenas.join(' · ')}`)
  console.log(`  elementos de texto ........ ${elementos}`)
  console.log(`  procurados ................ undefined · NaN · [object Object] · Invalid Date · null · TODO/FIXME · lorem`)
  console.log(`  fora de escopo ............ "está bonito?", "a frase está clara?" — isso é olho, e está declarado`)
  if (travadas.length) console.log(`  🔴 abas que não abriram ... ${travadas.join(' · ')}`)
  console.log(`  achados ................... ${achados.length}\n`)

  for (const a of achados) console.log(`  🔴 ${a}`)

  if (elementos === 0) {
    console.log('🔴 nenhum elemento medido — não há o que provar, e isso é defeito de população.')
    process.exit(1)
  }
  if (achados.length || travadas.length) {
    if (travadas.length) console.log('\n   Aba que não abriu é aba não medida.')
    process.exit(1)
  }
  console.log(`✅ ${elementos} elementos em ${cenas.length} cenas: nenhum resto, nenhum estouro, nenhum corte.`)
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
