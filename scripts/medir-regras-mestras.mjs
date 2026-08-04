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
  const botoes = []
  const re = /<button\b/g
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
}

const codigoTodo = arquivos(join(RAIZ, 'src')).map((c) => readFileSync(c, 'utf8')).join('\n')
const temDesabilitado = (codigoTodo.match(new RegExp(TEM_DESABILITADO, 'g')) ?? []).length
const temCarregando = (codigoTodo.match(/animate-spin/g) ?? []).length

console.log('─'.repeat(70))
console.log('REGRA MESTRA 3 — tooltips, micro-interações, arrastar-e-soltar\n')
console.log(`  botões medidos ................. ${total}`)
console.log(`  com tooltip (title/aria-label) . ${comTooltip}  (${Math.round((comTooltip / total) * 100)}%)`)
console.log(`  com hover ...................... ${comHover}  (${Math.round((comHover / total) * 100)}%)`)
console.log(`  estados de desabilitado ........ ${temDesabilitado}`)
console.log(`  indicadores de carregando ...... ${temCarregando}`)

const PISO_TOOLTIP = 0.9
const proporcao = comTooltip / total

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
