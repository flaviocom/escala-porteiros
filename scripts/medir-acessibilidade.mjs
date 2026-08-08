/**
 * ♿ A ESCALA É LEGÍVEL PARA QUEM VAI LÊ-LA?
 *
 * Quem usa este site são 16 irmãos porteiros, vários com mais de 60 anos, quase sempre no celular,
 * muitas vezes dentro da igreja — luz baixa, tela pequena, pressa. Contraste e tamanho de texto aqui
 * não são refinamento: são a diferença entre ler e não ler.
 *
 * Isto nunca tinha sido medido. Tooltip e alvo de toque foram (parte 4); **contraste, tamanho de
 * fonte e navegação por teclado, não**.
 *
 * O que se mede, e por quê:
 *   · contraste texto/fundo — piso WCAG AA: 4,5:1 para texto normal, 3:1 para texto grande
 *   · tamanho de fonte      — abaixo de 12px é ilegível no celular para quem tem presbiopia
 *   · foco visível          — quem navega por teclado precisa ver onde está
 *   · idioma declarado      — `lang="pt-BR"` é o que faz o leitor de tela pronunciar em português
 *
 * ⚠️ Mede a TELA RENDERIZADA, não o CSS. Uma classe do Tailwind não diz a cor final: herança,
 * sobreposição e opacidade só se resolvem no navegador.
 *
 * 🔴 E MEDE AS TELAS QUE A PESSOA ABRE — corrigido em 05/08/2026, quinta auditoria externa.
 *
 * Ele media UMA cena: o celular, como a página nasce. O veredito *"contraste, foco de teclado e
 * idioma dentro do piso WCAG AA"* era verdadeiro — e era verdadeiro sobre **6 elementos focáveis**.
 * A barra lateral inteira (busca, "Minha Escala", filtros de pessoa e mês, os dois botões de enviar)
 * vive sob `hidden md:flex`: no celular ela tem `getBoundingClientRect()` zerado e ficava fora da
 * conta; no desktop ela nunca era visitada; e a porta da área administrativa, nunca.
 *
 * Rodado nas telas que faltavam, o mesmo código de medição achou **4 falhas WCAG AA**. Portão que
 * mede menos do que diz é pior que portão ausente: ele responde "está tudo bem" a uma pergunta
 * maior do que a que ele fez.
 *
 * 🔴 P2.18 (08/08/2026): grupo LOCAL do `vivo:tudo` medindo a URL PUBLICADA era "verde de outra
 * árvore" dentro do gate — e não rodava onde a rede é fechada. O padrão agora é o build local;
 * a URL por argumento continua valendo para medir o site no ar.
 *
 * Uso: node scripts/medir-acessibilidade.mjs [url]
 */
import { chromium } from 'playwright'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { subirServidor } from './lib/servidor-de-teste.mjs'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORTA = 4304
const servidor = process.argv[2] ? null : await subirServidor({ raiz: RAIZ, porta: PORTA, modo: 'preview' })
const URL = process.argv[2] ?? servidor.url
const PISO_NORMAL = 4.5
const PISO_GRANDE = 3.0

console.log('♿ ACESSIBILIDADE — medida na tela, não no CSS\n')
console.log(`  url ... ${URL}\n`)

const navegador = await chromium.launch()

/**
 * As cenas medidas, e por que cada uma existe.
 *
 * Uma cena é (tamanho de tela + endereço + o que se abriu antes de medir). Elas não se somam por
 * gosto: cada uma esconde textos que as outras mostram, e foi exatamente nesse vão que as quatro
 * falhas WCAG estavam.
 */
const CENAS = [
  {
    nome: 'celular, como a página nasce',
    viewport: { width: 390, height: 844 },
    hash: '',
    preparar: async () => {},
  },
  {
    nome: 'celular, painel de filtros ABERTO',
    viewport: { width: 390, height: 844 },
    hash: '',
    // É o painel onde ficam a busca, "Minha Escala" e os dois filtros — tudo o que a pessoa usa
    // para achar o próprio nome, e nada disso era medido.
    preparar: async (p) => {
      const botao = p.locator('button[title*="filtro" i], button[title*="Filtros" i]').first()
      if (await botao.count()) await botao.click({ timeout: 5000 }).catch(() => {})
      await p.waitForTimeout(600)
    },
  },
  {
    nome: 'desktop 1440px',
    viewport: { width: 1440, height: 900 },
    hash: '',
    preparar: async (p) => { await p.waitForTimeout(600) },
  },
  {
    nome: 'porta da área administrativa',
    viewport: { width: 390, height: 844 },
    hash: '#/admin',
    preparar: async (p) => { await p.waitForTimeout(900) },
  },
]

/** A medição, idêntica para toda cena — uma régua só, aplicada em quatro lugares. */
async function medirCena(pagina) {
  return await pagina.evaluate(({ PISO_NORMAL, PISO_GRANDE }) => {
  /** Luminância relativa, fórmula WCAG. */
  const lum = ([r, g, b]) => {
    const f = (v) => {
      const c = v / 255
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    }
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
  }
  const razao = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
    return (x + 0.05) / (y + 0.05)
  }
  const cor = (s) => {
    const m = s.match(/rgba?\(([^)]+)\)/)
    if (!m) return null
    const p = m[1].split(',').map((x) => parseFloat(x))
    // Transparente: a cor efetiva é a de trás; devolvemos null e subimos na árvore.
    if (p.length > 3 && p[3] === 0) return null
    return [p[0], p[1], p[2]]
  }
  /** Fundo efetivo: sobe na árvore até achar quem realmente pinta. */
  const fundoDe = (el) => {
    let n = el
    while (n && n !== document.documentElement) {
      const c = cor(getComputedStyle(n).backgroundColor)
      if (c) return c
      n = n.parentElement
    }
    return [255, 255, 255]
  }

  const ruins = []
  const pequenos = []
  let medidos = 0

  for (const el of document.querySelectorAll('body *')) {
    // Só elementos que REALMENTE mostram texto próprio.
    const proprio = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1)
    if (!proprio) continue
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) continue
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') continue

    const frente = cor(cs.color)
    if (!frente) continue
    const tamanho = parseFloat(cs.fontSize)
    const negrito = parseInt(cs.fontWeight, 10) >= 700
    const grande = tamanho >= 24 || (tamanho >= 18.66 && negrito)
    const piso = grande ? PISO_GRANDE : PISO_NORMAL

    medidos++
    const fundo = fundoDe(el)
    const rz = razao(frente, fundo)
    const texto = el.textContent.trim().slice(0, 28)
    const rgb = (c) => `rgb(${c.join(',')})`
    if (rz < piso) {
      ruins.push({ texto, razao: Math.round(rz * 100) / 100, piso, tamanho, frente: rgb(frente), fundo: rgb(fundo) })
    }
    if (tamanho < 12) pequenos.push({ texto, tamanho, classe: el.className?.toString?.().slice(0, 40) ?? '' })
  }

  /**
   * 🔴 AGRUPADO POR ESTILO, não por ocorrência. A primeira versão dizia "159 textos abaixo do
   * contraste" — mas eram **3 combinações** de cor/fundo/tamanho repetidas em 131 dias. Um número
   * grande sobre pouca coisa distinta faz procurar um problema sistêmico onde há três ajustes.
   */
  const agrupar = (lista, chave) => {
    const m = new Map()
    for (const x of lista) {
      const k = chave(x)
      if (!m.has(k)) m.set(k, { ...x, ocorrencias: 0 })
      m.get(k).ocorrencias++
    }
    return [...m.values()]
  }

  return {
    medidos,
    ruins: agrupar(ruins, (r) => `${r.frente}|${r.fundo}|${r.tamanho}`).sort((a, b) => a.razao - b.razao),
    totalRuins: ruins.length,
    pequenos: agrupar(pequenos, (p) => `${p.tamanho}|${p.classe}`),
    totalPequenos: pequenos.length,
    lang: document.documentElement.lang,
    titulo: document.title,
  }
  }, { PISO_NORMAL, PISO_GRANDE })
}

/**
 * 🔴 FOCO SE MEDE TABULANDO. A primeira versão chamava `el.focus()` e lia o `outline` — e deu
 * "sem foco visível", **falso**. Foco programático não dispara `:focus-visible`, que é a condição
 * que o CSS moderno (e o Tailwind) usa para desenhar o anel. A régua acusava o site de um defeito
 * que era dela.
 *
 * 🔴 E o limite era 6 tabulações fixas — quinta auditoria externa, 05/08/2026. No desktop há 14
 * focáveis e com o painel aberto há 22: o laço parava antes de a barra lateral começar. Agora ele
 * anda até o foco VOLTAR ao primeiro elemento, com um teto generoso só para não girar para sempre.
 */
async function medirFoco(pagina) {
  const focos = []
  const vistos = new Set()
  for (let i = 0; i < 60; i++) {
    await pagina.keyboard.press('Tab')
    const f = await pagina.evaluate((primeiraVolta) => {
      const a = document.activeElement
      if (!a || a === document.body) return null
      // O PRIMEIRO elemento focado fica marcado no próprio nó: identidade não colide, descrição sim.
      const w = window
      if (primeiraVolta) w.__primeiroFocavel = a
      const cs = getComputedStyle(a)
      // 🔴 `outline-style: auto` É anel — o desenhado pelo próprio navegador. Um build do Chromium
      // computa a largura dele como 0px (medido em 08/08/2026, com prova por pixel: o anel pinta);
      // exigir largura > 0 nesse caso reprovava 19 elementos certos. A largura só desempata quando
      // o estilo não é `auto`.
      const temAnel = cs.outlineStyle === 'auto' || (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0)
      return {
        tag: a.tagName,
        marca: `${a.tagName}|${(a.textContent ?? '').trim().slice(0, 30)}|${a.className?.toString?.().slice(0, 30) ?? ''}`,
        ehOPrimeiro: !primeiraVolta && w.__primeiroFocavel === a,
        visivel: temAnel || cs.boxShadow !== 'none',
      }
    }, focos.length === 0)
    /*
      🔴 A "MARCA" NÃO É ÚNICA, E O `break` PARAVA NA METADE — sexta auditoria externa, 05/08/2026.

      A correção anterior trocou "6 tabulações fixas" por "anda até o foco VOLTAR ao primeiro" — e a
      volta era detectada por `tag|texto|classe`, que **dois elementos podem compartilhar**. Os dois
      `<input type="date">` (o calendário invisível, texto vazio, mesma classe) produzem marca
      idêntica, e o laço interrompia ali achando que tinha dado a volta.

      Medido: no desktop o portão contava **7** focáveis, e a volta completa tem **17**; no celular
      com o painel aberto, **12** contra **24**. Os dez que ele nunca alcançava incluem os dois
      botões de envio, os dois filtros, Estatísticas, Validação e a porta do administrativo — e há
      **um com foco invisível** dentro justamente dessa faixa cega. O portão imprimia
      *"foco visível ao tabular … 31 de 31"* e saía verde.

      A volta se detecta pelo ELEMENTO, não pela descrição dele: `document.activeElement === primeiro`
      é identidade, e identidade não colide. A descrição continua servindo para o relatório.
    */
    if (!f) continue
    if (f.ehOPrimeiro && focos.length > 0) break // deu a volta de verdade — mesmo NÓ, não mesma marca
    vistos.add(f.marca)
    focos.push(f)
  }
  return focos
}

// ---------------------------------------------------------------------------
// O laço das cenas
// ---------------------------------------------------------------------------

const porCena = []
for (const cena of CENAS) {
  const pagina = await navegador.newPage({ viewport: cena.viewport, deviceScaleFactor: 2 })
  await pagina.goto(URL + cena.hash, { waitUntil: 'networkidle', timeout: 60_000 })
  await pagina.waitForTimeout(2500)
  await cena.preparar(pagina)

  const m = await medirCena(pagina)
  const focos = await medirFoco(pagina)
  await pagina.close()

  porCena.push({ cena: cena.nome, ...m, focaveis: focos.length, semAnel: focos.filter((f) => !f.visivel).length })
  console.log(
    `  ${cena.nome.padEnd(38)} ${String(m.medidos).padStart(5)} textos · ` +
      `${String(focos.length).padStart(3)} focáveis · ${m.totalRuins} abaixo do contraste`,
  )
}
console.log()

/*
  🔴 A CENA NÃO SE DILUI NO TOTAL. Somar tudo e imprimir um número faria uma falha de 4 telas
  parecer pequena ao lado de 5 mil textos medidos. Cada achado carrega a cena em que apareceu, que
  é a única informação que permite ir olhar.
*/
const medida = {
  medidos: porCena.reduce((s, c) => s + c.medidos, 0),
  totalRuins: porCena.reduce((s, c) => s + c.totalRuins, 0),
  totalPequenos: porCena.reduce((s, c) => s + c.totalPequenos, 0),
  ruins: porCena.flatMap((c) => c.ruins.map((r) => ({ ...r, cena: c.cena }))).sort((a, b) => a.razao - b.razao),
  pequenos: porCena.flatMap((c) => c.pequenos.map((p) => ({ ...p, cena: c.cena }))),
  lang: porCena[0].lang,
  titulo: porCena[0].titulo,
}
const tabulados = { length: porCena.reduce((s, c) => s + c.focaveis, 0) }
const semAnel = porCena.reduce((s, c) => s + c.semAnel, 0)

/**
 * 🔴 WCAG 2.1 AA §1.4.4 — "Resize text": o conteúdo continua legível e utilizável com o texto a
 * **200%**, sem rolagem horizontal e sem palavra cortada.
 *
 * Este portão media contraste, tamanho e foco — e não media isto, que é **norma**, ao contrário do
 * piso de 12px, que ele mesmo declara como convenção de casa. Norma que ninguém mede é norma que vai
 * embora sem aviso: medido em 05/08/2026, o rótulo do seletor ("Irmão") era **cortado inteiro** a
 * 200%, porque a caixa tinha `truncate`. Quem aumenta a fonte é exatamente quem precisa do rótulo.
 *
 * ⚠️ Aumenta a fonte-base do documento, e não o `deviceScaleFactor`: o zoom de página amplia tudo
 * junto e não exerceria o que a norma cobre.
 */
const zoom = []
for (const [nome, largura] of [['celular 200%', 390], ['desktop 200%', 1440]]) {
  const p = await navegador.newPage({ viewport: { width: largura, height: 900 } })
  await p.goto(URL, { waitUntil: 'networkidle', timeout: 60_000 })
  await p.waitForTimeout(2200)
  await p.evaluate(() => { document.documentElement.style.fontSize = '32px' })
  await p.waitForTimeout(900)
  const m = await p.evaluate(() => {
    const doc = document.documentElement
    const cortados = []
    for (const el of document.querySelectorAll('body *')) {
      const proprio = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1)
      if (!proprio) continue
      const cs = getComputedStyle(el)
      if (cs.display === 'none' || cs.visibility === 'hidden') continue
      if (el.getBoundingClientRect().width === 0) continue
      const escondido = cs.overflow === 'hidden' || cs.overflowY === 'hidden' || cs.textOverflow === 'ellipsis'
      if (escondido && (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2))
        cortados.push(el.textContent.trim().slice(0, 34))
    }
    return { rolaLado: doc.scrollWidth > doc.clientWidth + 1, cortados }
  })
  await p.close()
  zoom.push({ nome, ...m })
  console.log(`  ${nome.padEnd(38)} rolagem lateral: ${m.rolaLado ? '🔴 SIM' : 'não'} · texto cortado: ${m.cortados.length}`)
  for (const c of m.cortados.slice(0, 4)) console.log(`     🔴 cortado: "${c}"`)
}
console.log()
const achadosZoom = []
for (const z of zoom) {
  if (z.rolaLado) achadosZoom.push(`[${z.nome}] rolagem horizontal com o texto a 200% (WCAG 1.4.4)`)
  if (z.cortados.length) achadosZoom.push(`[${z.nome}] ${z.cortados.length} texto(s) cortado(s) a 200% (WCAG 1.4.4)`)
}

await navegador.close()

console.log(`  elementos de texto medidos ... ${medida.medidos}`)
console.log(`  abaixo do contraste mínimo ... ${medida.totalRuins}`)
console.log(`  fonte menor que 12px ......... ${medida.totalPequenos}`)
console.log(`  idioma declarado ............. ${medida.lang || '(vazio)'}`)
console.log(`  título da aba ................ ${medida.titulo || '(vazio)'}\n`)

// 🔒 Medir zero elementos é defeito de leitura, não página sem texto.
if (medida.medidos < 20) {
  console.error(`🔴 só ${medida.medidos} elementos de texto medidos — a página não renderizou ou o seletor quebrou.`)
  process.exit(1)
}

/*
  🔒 E CADA CENA PRECISA TER MEDIDO ALGUMA COISA — a defesa contra o defeito que este portão teve.

  Se o seletor do painel de filtros mudar de nome, `preparar` falha em silêncio e a cena passa a
  medir a tela fechada de novo: o portão volta a dizer "tudo certo" sobre menos do que promete, e
  ninguém percebe, porque o total continua grande. O número de FOCÁVEIS é o sinal: com o painel
  aberto ele mais que triplica.
*/
for (const c of porCena) {
  /*
    ⚠️ O PISO É POR CENA, e a porta do administrativo é pequena de propósito: ela tem 21 textos contra
    um piso de 20 — margem de UM. Sexta auditoria externa, 05/08/2026: qualquer texto a menos no login
    derrubaria o portão pelo motivo errado, e "portão cronicamente vermelho é portão que se ignora".

    O piso dela desce para 10, que ainda denuncia uma tela que não renderizou (a porta tem título,
    subtítulo, dois rótulos, dois botões e três linhas de ajuda), sem reprovar por um ajuste de texto.
  */
  const piso = c.cena.includes('administrativa') ? 10 : 20
  if (c.medidos < piso || c.focaveis < 3) {
    console.error(`🔴 a cena "${c.cena}" mediu ${c.medidos} textos e ${c.focaveis} focáveis — ela não abriu.`)
    process.exit(1)
  }
}
const comPainel = porCena.find((c) => c.cena.includes('filtros'))
const semPainel = porCena.find((c) => c.cena.includes('nasce'))
if (comPainel && semPainel && comPainel.focaveis <= semPainel.focaveis) {
  console.error(
    `🔴 o painel de filtros não abriu: ${comPainel.focaveis} focáveis com ele, ${semPainel.focaveis} sem. ` +
      'A cena existe para medir a barra lateral, e ela continua escondida.',
  )
  process.exit(1)
}

const problemas = [...achadosZoom]

if (medida.totalRuins) {
  problemas.push(`${medida.totalRuins} texto(s) abaixo do contraste mínimo`)
  console.log(`🔴 CONTRASTE ABAIXO DO PISO (WCAG AA) — ${medida.ruins.length} combinação(ões) distinta(s):\n`)
  for (const r of medida.ruins) {
    console.log(`  ${String(r.razao).padStart(5)}:1  piso ${r.piso}:1 · ${r.tamanho}px · ${r.ocorrencias}× · [${r.cena}]`)
    console.log(`         ${r.frente} sobre ${r.fundo}   ex.: "${r.texto}"`)
  }
  console.log()
}

// ⚠️ AVISO, não reprovação — e a diferença é deliberada.
//
// Contraste tem piso normativo (WCAG AA). **Tamanho de fonte não tem**: os 12px são régua minha.
// Rótulo em caixa-alta, negrito e com espaçamento largo é legível a 10px, e a informação
// principal (o número do dia, 24px; os nomes, 14px) está muito acima disso.
//
// Reprovar por régua de gosto deixa o portão vermelho para sempre — e portão cronicamente
// vermelho é portão que alguém aprende a ignorar, junto com os achados de verdade que ele leva.
if (medida.totalPequenos) {
  console.log(`⚠️ TEXTO ABAIXO DE 12px — ${medida.pequenos.length} caso(s), para decisão de quem desenha:\n`)
  for (const p of medida.pequenos) console.log(`  ${p.tamanho}px · ${p.ocorrencias}× na tela   ex.: "${p.texto}"`)
  console.log()
}

if (medida.lang !== 'pt-BR') problemas.push(`idioma "${medida.lang || 'vazio'}" — o leitor de tela vai pronunciar em inglês`)

console.log(`  foco visível ao tabular ...... ${tabulados.length - semAnel} de ${tabulados.length} elementos`)
if (!tabulados.length) problemas.push('nada recebe foco ao tabular — navegação por teclado impossível')
else if (semAnel) problemas.push(`${semAnel} elemento(s) sem anel de foco visível`)

console.log('─'.repeat(70))
await servidor?.derrubar()
if (problemas.length) {
  console.error(`\n🔴 ${problemas.join(' · ')}\n`)
  process.exit(1)
}
console.log('\n✅ Contraste, foco de teclado e idioma dentro do piso WCAG AA.')
if (medida.totalPequenos) console.log('   (o aviso de tamanho de fonte acima é recomendação, não norma.)')
console.log()
