/**
 * ✳️ PORTÃO — markdown CRU vazando para a tela.
 *
 * 🔴 POR QUE ELE EXISTE. Em 06/08/2026, ao **olhar** uma captura da aba `Ajustar`, li isto na tela:
 *
 *     "…mas ficaria **abaixo do piso que este bloco declara** — e aí a escala fica inválida…"
 *
 * Com os asteriscos. JSX não é markdown: `**texto**` sai literal. O trecho tinha nascido num
 * comentário (onde markdown é normal) e escorregou para dentro de um `<p>`.
 *
 * **Nenhuma medição de DOM pegaria isso** — e várias rodaram por cima. Toda checagem de texto casava
 * normalmente, porque o texto *está lá*; só está feio. É a diferença entre "medir a tela" e "ver a
 * tela", e a razão de a verificação visual não poder ser substituída por medição.
 *
 * O que ele procura em texto que alguém lê (JSX solto, props visíveis, campos de objeto com prosa):
 * `**negrito**`, `*itálico*`, `` `código` `` e `[texto](link)`.
 *
 * 🔴 FORA DE ESCOPO, declarado: comentários (`//`, `/* *\u200b/`, `{/* *\u200b/}`) — lá markdown é a
 * convenção deste projeto e é onde ele deve mesmo estar. Também ficam de fora os arquivos `.md`,
 * pelo motivo óbvio.
 *
 * Uso: node scripts/portao-markdown-cru.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(RAIZ, 'src')

/** Tira comentários antes de medir — markdown neles é a convenção, não defeito. */
function semComentarios(codigo) {
  return codigo
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, ' ') // {/* … */}
    .replace(/\/\*[\s\S]*?\*\//g, ' ') //            /* … */
    .replace(/^\s*\/\/.*$/gm, ' ') //                // …
}

const FORMAS = [
  { nome: 'negrito **…**', re: /\*\*[^*\n]+\*\*/g },
  { nome: 'itálico *…*', re: /(?<![*\w])\*[^*\s][^*\n]*[^*\s]\*(?![*\w])/g },
  { nome: 'código `…`', re: /`[^`\n]+`/g },
  { nome: 'link [t](u)', re: /\[[^\]\n]+\]\([^)\n]+\)/g },
]

/** As mesmas superfícies do portão de denominação: é onde texto de tela mora. */
function trechosDeTela(codigo) {
  const s = semComentarios(codigo)
  const achados = []
  for (const m of s.matchAll(/>([^<>{}]*[A-Za-zÀ-ú][^<>{}]*)</g)) achados.push({ texto: m[1], onde: 'texto na tela' })
  for (const m of s.matchAll(/\b(title|placeholder|aria-label|alt|label|rotulo|subtitulo|texto|dica|motivo|mensagem|descricao)\s*=\s*(["'])((?:(?!\2).)*)\2/g)) {
    achados.push({ texto: m[3], onde: `prop ${m[1]}` })
  }
  for (const m of s.matchAll(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(["'`])((?:(?!\2).)*)\2/g)) {
    if (!/[a-zà-ÿ]/.test(m[3]) || !/\s/.test(m[3].trim())) continue
    achados.push({ texto: m[3], onde: `campo ${m[1]}` })
  }
  return achados
}

const arquivos = []
const varrer = (dir) => {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome)
    if (statSync(caminho).isDirectory()) { varrer(caminho); continue }
    if (/\.tsx?$/.test(nome) && !/\.test\.tsx?$/.test(nome)) arquivos.push(caminho)
  }
}
varrer(SRC)

console.log('✳️  MARKDOWN CRU NA TELA?\n')

// 🔴 Autodefesa: expressão com caractere de controle mede o vazio e imprime 0 achados.
for (const f of FORMAS) {
  if ([...f.re.source].some((c) => c.charCodeAt(0) < 32)) {
    console.log(`🔴 a expressão de "${f.nome}" tem caractere de controle — ela não procura o que diz.`)
    process.exit(2)
  }
}

const achados = []
let trechos = 0
for (const caminho of arquivos) {
  const rel = relative(RAIZ, caminho).split('\\').join('/')
  for (const t of trechosDeTela(readFileSync(caminho, 'utf8'))) {
    trechos++
    for (const f of FORMAS) {
      f.re.lastIndex = 0
      // 🔴 TODAS as ocorrências, não a primeira. A versão anterior guardava só `m[0]` e imprimia
      // "4 achados" onde havia 5: conserta-se o primeiro, roda de novo, e aparece outro — o portão
      // virava uma fila que ninguém sabia o tamanho. Portão que conta menos do que existe é a
      // classe de defeito que este projeto persegue, e ele nasceu com ela dentro.
      for (const achado of t.texto.match(f.re) ?? []) {
        achados.push(`${rel} [${t.onde}] — ${f.nome}: ${achado.slice(0, 46)}`)
      }
    }
  }
}

console.log(`  arquivos varridos ......... ${arquivos.length}`)
console.log(`  trechos de tela medidos ... ${trechos}`)
console.log(`  formas procuradas ......... ${FORMAS.map((f) => f.nome).join(' · ')}`)
console.log(`  fora de escopo ............ comentários (markdown neles é a convenção do projeto)`)
console.log(`  achados ................... ${achados.length}\n`)

for (const a of achados) console.log(`  🔴 ${a}`)

if (trechos === 0) {
  console.log('🔴 nenhum trecho de tela medido — não há o que provar, e isso é defeito de população.')
  process.exit(1)
}
if (achados.length) {
  console.log('\n   JSX não é markdown. Use <strong>, <em> ou <code> — os asteriscos saem literais na tela.')
  process.exit(1)
}
console.log(`✅ os ${trechos} trechos de tela não têm markdown cru.`)
