/**
 * 🔒 PORTÃO DAS REGRAS MESTRAS DE INTERFACE.
 *
 * A Regra Mestra 3 do Flavio, verbatim: *"UX padrão-ouro: tooltips em tudo; micro-interações
 * (hover/loading/disabled); drag-and-drop em listas/dashboards."*
 *
 * Era uma regra sem portão — e o método já provou três vezes que regra sem portão fica inerte.
 * Este script a torna medível.
 *
 * ⚠️ POR QUE UM GREP INGÊNUO NÃO SERVE. `grep '<button[^>]*title='` não encontra nada em JSX real,
 * porque um botão bem formatado ocupa 6 linhas e o `title` está na terceira. Medir errado aqui
 * produziria "0 de 46 botões com tooltip" — um alarme falso que faria alguém desligar o portão.
 * Por isso a análise é feita sobre o **elemento inteiro**, com contagem de chaves.
 *
 * Uso: node scripts/medir-regras-mestras.mjs [--autoteste]
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Extrai cada elemento `<button …>` INTEIRO, mesmo quebrado em várias linhas.
 *
 * Percorre caractere a caractere depois de achar `<button`, contando o aninhamento de `{}` — porque
 * uma prop pode conter um objeto ou uma arrow function com `>` dentro, e parar no primeiro `>` daria
 * um elemento truncado.
 */
export function extrairBotoes(codigo) {
  return extrairElementos(codigo, 'button')
}

/**
 * O mesmo varredor, para qualquer tag.
 *
 * 🔴 POR QUE ELE FOI GENERALIZADO em 04/08/2026, por auditoria independente: o portão só enxergava
 * `<button>` e cravava "100% dos botões têm tooltip" — enquanto o backdrop do menu no celular era um
 * `<div onClick>` sem título, sem papel e sem foco. Clicável de verdade, inacessível por teclado, e
 * 100% fora do radar. A Regra Mestra 3 diz "tooltips em tudo"; o portão media um subconjunto de
 * "tudo" e afirmava sobre o todo.
 */
export function extrairElementos(codigoBruto, tag) {
  // Comentário não é elemento. Sem isto, uma linha de documentação que MENCIONE `<button>` entra na
  // contagem como um botão sem tooltip e derruba o percentual — foi o que aconteceu em 04/08/2026,
  // ao documentar por que um `<div onClick>` virou botão. É a mesma armadilha que a auditoria tinha
  // no detector de código morto: contar o texto bruto em vez do código.
  //
  // O `(?<!:)` protege o `//` de "https://" — outro portão deste projeto já mediu zero por causa
  // disso, e disse que estava tudo certo.
  const codigo = codigoBruto.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(?<!:)\/\/[^\n]*/g, ' ')
  const botoes = []
  const re = new RegExp(`<${tag}\\b`, 'g')
  let m
  while ((m = re.exec(codigo)) !== null) {
    let i = m.index + m[0].length
    let chaves = 0
    let aspas = null
    while (i < codigo.length) {
      const c = codigo[i]
      if (aspas) {
        if (c === aspas) aspas = null
      } else if (c === '"' || c === "'" || c === '`') {
        aspas = c
      } else if (c === '{') chaves++
      else if (c === '}') chaves--
      else if (c === '>' && chaves === 0) break
      i++
    }
    const linha = codigo.slice(0, m.index).split('\n').length
    botoes.push({ texto: codigo.slice(m.index, i + 1), linha })
  }
  return botoes
}

const TEM_TOOLTIP = /\b(title|aria-label)\s*=/
const TEM_HOVER = /hover:/
const TEM_DESABILITADO = /\bdisabled\b/

/**
 * 🔴 Dica com ASPAS DUPLAS dentro quebra o atributo — e quebra o arquivo inteiro.
 *
 * Aconteceu em 04/08/2026: a dica `Escolher outro irmão para o filtro "Minha Escala"` virou
 * `title="… o filtro "Minha Escala""` e o TypeScript acusou 4 erros de JSX em cascata, três deles
 * em linhas que não tinham defeito nenhum — o que faz procurar no lugar errado.
 *
 * O portão passa a pegar isto, porque é uma classe inteira de defeito, não um caso.
 */
const TITULO_MAL_FORMADO = /\btitle\s*=\s*"[^"]*"[A-Za-zÀ-ÿ]/

// ---------------------------------------------------------------------------

function autoteste() {
  const casos = [
    { nome: 'botão de uma linha com title', codigo: '<button title="x" onClick={f}>ok</button>', tooltip: true },
    {
      nome: 'botão de VÁRIAS linhas com title na 3ª',
      codigo: '<button\n  onClick={() => f(a > b)}\n  title="Sair"\n  className="p-2"\n>\n  <X />\n</button>',
      tooltip: true,
    },
    {
      nome: '🔴 prop com arrow function contendo ">" não trunca o elemento',
      codigo: '<button onClick={() => (a > b ? x : y)} aria-label="Comparar">z</button>',
      tooltip: true,
    },
    {
      nome: '🔴 objeto na prop não trunca',
      codigo: '<button style={{ width: 10 }} title="Largo">z</button>',
      tooltip: true,
    },
    { nome: 'botão SEM tooltip é detectado', codigo: '<button onClick={f}>Salvar</button>', tooltip: false },
    {
      nome: '🔴 dica com ASPAS DUPLAS dentro é acusada',
      codigo: '<button title="use o filtro "Minha Escala"">z</button>',
      tooltip: true,
      malFormado: true,
    },
    {
      nome: 'botão multilinha SEM tooltip é detectado',
      codigo: '<button\n  onClick={f}\n  className="x"\n>\n  Publicar\n</button>',
      tooltip: false,
    },
  ]

  let falhas = 0
  console.log('AUTOTESTE — leitor de botões JSX\n')
  for (const c of casos) {
    const bs = extrairBotoes(c.codigo)
    const achou = bs.length === 1 && TEM_TOOLTIP.test(bs[0].texto)
    const malFormado = bs.length === 1 && TITULO_MAL_FORMADO.test(bs[0].texto)
    const ok = achou === c.tooltip && malFormado === Boolean(c.malFormado)
    if (!ok) falhas++
    console.log(`  ${ok ? '✅' : '🔴'} ${c.nome}`)
    if (!ok) console.log(`       leu: ${JSON.stringify(bs[0]?.texto ?? '(nenhum)')}`)
  }
  console.log(falhas === 0 ? '\n✅ O leitor acha o tooltip onde ele está, e a ausência onde ela está.\n' : `\n🔴 ${falhas} falha(s).\n`)
  return falhas === 0
}

if (!autoteste()) process.exit(1)
if (process.argv.includes('--autoteste')) process.exit(0)

// ---------------------------------------------------------------------------

function arquivos(dir, saida = []) {
  for (const n of readdirSync(dir)) {
    const c = join(dir, n)
    if (statSync(c).isDirectory()) arquivos(c, saida)
    else if (extname(c) === '.tsx') saida.push(c)
  }
  return saida
}

let total = 0
let comTooltip = 0
let comHover = 0
const semTooltip = []
/**
 * Clicáveis que NÃO são `<button>` — a população que o portão não via até 04/08/2026.
 *
 * Um `<div onClick>` funciona no mouse e não existe para o teclado: sem foco, sem Enter, sem
 * Espaço, sem nome para o leitor de tela. `<button>` dá tudo isso de graça. Quando for mesmo
 * decorativo (um backdrop, por exemplo), o jeito de dizer isso é `aria-hidden` — declarado, não
 * subentendido.
 */
const clicaveisNaoBotao = []
/*
  🔴 A LISTA COBRIA CINCO TAGS E A FRASE PROMETIA TODAS — sexta auditoria externa, 05/08/2026.

  O relatório imprime "clicáveis fora de `<button>` ..... 0", que se lê como *"não há elemento
  clicável inacessível"*. Era 0 entre `div|span|li|section|article`. Medido: `<a onClick>` sem papel
  e `<tr onClick>` sem papel passavam com `0`, EXIT=0.

  `<a>` sem `href` não é focável; `<tr>`, `<td>`, `<label>` e `<img>` nunca são. Todos aparecem em
  tabela de escala, que é a tela inteira deste produto. Medir um subconjunto e afirmar sobre o todo é
  o mesmo defeito que gerou a generalização de `extrairElementos` em 04/08.
*/
const TAGS_CLICAVEIS = ['div', 'span', 'li', 'section', 'article', 'a', 'tr', 'td', 'th', 'label', 'img', 'p', 'h1', 'h2', 'h3', 'svg', 'path']
const TEM_ONCLICK = /\bonClick\s*=/
const ACESSIVEL = /\b(role|aria-hidden|aria-label|title)\s*=/
const malFormados = []

for (const caminho of arquivos(join(RAIZ, 'src'))) {
  const codigo = readFileSync(caminho, 'utf8')
  for (const b of extrairBotoes(codigo)) {
    total++
    if (TEM_TOOLTIP.test(b.texto)) comTooltip++
    else semTooltip.push({ arquivo: relative(RAIZ, caminho).replace(/\\/g, '/'), linha: b.linha, trecho: b.texto.replace(/\s+/g, ' ').slice(0, 80) })
    if (TEM_HOVER.test(b.texto)) comHover++
    if (TITULO_MAL_FORMADO.test(b.texto)) {
      malFormados.push(`${relative(RAIZ, caminho).replace(/\\/g, '/')}:${b.linha}`)
    }
  }
  // A população que faltava: clicável que não é botão não aparece na conta acima.
  for (const tag of TAGS_CLICAVEIS) {
    for (const e of extrairElementos(codigo, tag)) {
      if (!TEM_ONCLICK.test(e.texto) || ACESSIVEL.test(e.texto)) continue
      clicaveisNaoBotao.push({
        arquivo: relative(RAIZ, caminho).replace(/\\/g, '/'), linha: e.linha, tag,
        trecho: e.texto.replace(/\s+/g, ' ').slice(0, 80),
      })
    }
  }
}

const codigoTodo = arquivos(join(RAIZ, 'src')).map((c) => readFileSync(c, 'utf8')).join('\n')
const temDesabilitado = (codigoTodo.match(new RegExp(TEM_DESABILITADO, 'g')) ?? []).length
const temCarregando = (codigoTodo.match(/animate-spin/g) ?? []).length

console.log('─'.repeat(70))
console.log('REGRA MESTRA 3 — tooltips, micro-interações, arrastar-e-soltar\n')
console.log(`  botões medidos ................. ${total}`)
console.log(`  clicáveis fora de <button> ..... ${clicaveisNaoBotao.length}  (${TAGS_CLICAVEIS.length} tags com onClick e sem papel declarado)`)
console.log(`  com tooltip (title/aria-label) . ${comTooltip}  (${Math.round((comTooltip / total) * 100)}%)`)
console.log(`  com hover ...................... ${comHover}  (${Math.round((comHover / total) * 100)}%)`)
console.log(`  estados de desabilitado ........ ${temDesabilitado}`)
console.log(`  indicadores de carregando ...... ${temCarregando}`)

/*
  🔴 O PISO ERA 90%, E A REGRA MESTRA DIZ "TOOLTIPS EM TUDO" — sexta auditoria externa, 05/08/2026.

  Medido: com 7 botões sem dica o portão imprimia "90% · ✅ acima do piso" e saía EXIT=0. Sete botões
  mudos é uma tela inteira sem explicação, aprovada por uma régua que o próprio projeto declara como
  "em tudo".

  Noventa por cento é o número que se escolhe quando não se quer consertar os últimos casos. Se
  algum botão de fato não precisar de dica, o jeito de dizer isso é `aria-label` ou `aria-hidden` —
  declarado, como em todo o resto deste projeto —, não uma folga de 10% que ninguém revisita.
*/
const PISO_TOOLTIP = 1
const proporcao = comTooltip / total

if (clicaveisNaoBotao.length) {
  console.log(`\n🔴 ${clicaveisNaoBotao.length} elemento(s) clicável(is) que o teclado não alcança:\n`)
  for (const c of clicaveisNaoBotao) console.log(`  ${c.arquivo}:${c.linha}  <${c.tag} onClick …>\n    ${c.trecho}`)
  console.log('\n   Use <button>, que já vem com foco, Enter e Espaço. Se for mesmo decorativo,')
  console.log('   diga isso com `aria-hidden` — declarado, não subentendido.')
  process.exit(1)
}

if (semTooltip.length) {
  console.log(`\n${semTooltip.length} botão(ões) sem tooltip:\n`)
  for (const s of semTooltip.slice(0, 40)) console.log(`  ${s.arquivo}:${s.linha}\n    ${s.trecho}`)
  if (semTooltip.length > 40) console.log(`  (+${semTooltip.length - 40})`)
}

if (malFormados.length) {
  console.error(`\n🔴 ${malFormados.length} dica(s) com ASPAS DUPLAS dentro — isso quebra o JSX:`)
  malFormados.forEach((m) => console.error('   ·', m))
  process.exit(1)
}

if (proporcao < PISO_TOOLTIP) {
  console.error(`\n🔴 ${Math.round(proporcao * 100)}% dos botões têm tooltip — o piso é ${PISO_TOOLTIP * 100}%.`)
  console.error('   Regra Mestra 3 do Flavio: "tooltips em tudo".')
  process.exit(1)
}

console.log(`\n✅ ${Math.round(proporcao * 100)}% dos botões têm tooltip, acima do piso de ${PISO_TOOLTIP * 100}%.`)
process.exit(0)
