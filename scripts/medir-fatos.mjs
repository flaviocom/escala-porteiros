/**
 * MEDE OS FATOS DO PROJETO — e reprova documento vivo que os desminta.
 *
 * 🔴 POR QUE ESTE PORTÃO EXISTE. Um teste de portabilidade em 05/08/2026 deu a documentação a outra
 * inteligência artificial, proibida de abrir código, e pediu que reconstruísse o produto. Entre os
 * achados, um veredito estrutural:
 *
 *   > "O portão `contagem` existe justamente para impedir que documento vivo declare número que o
 *   > código desmente — e este conjunto contém **14 contradições numéricas** (piso 6/7, 30/12 vs
 *   > 31/12, 12/13 passos, 15/21 casos, 2/4 hosts…). **O portão responde só a pergunta que foi
 *   > feita** — número de *regras* — e o resto passou."
 *
 * A conclusão não é "escrever com mais cuidado". É que **número escrito à mão apodrece**, e o único
 * remédio que funciona é o mesmo do catálogo de regras: **medir, e cobrar**.
 *
 * Cada fato aqui é MEDIDO de uma fonte executável — `package.json`, o catálogo, a saída de um
 * portão, o dado publicado. Nenhum é digitado.
 *
 * Uso:
 *   node scripts/medir-fatos.mjs             # imprime os fatos medidos
 *   node scripts/medir-fatos.mjs --conferir  # PORTÃO: reprova documento vivo que os desminta
 *   node scripts/medir-fatos.mjs --json
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { carregarDominio } from './lib/dominio.mjs'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const ler = (p) => readFileSync(join(RAIZ, p), 'utf8')
const json = (p) => JSON.parse(ler(p))

/** Roda um script e devolve a saída, mesmo quando ele sai diferente de 0 (portão vermelho fala). */
function saidaDe(args) {
  try {
    return execFileSync(process.execPath, args.map((a) => (a.startsWith('scripts/') ? join(RAIZ, a) : a)), {
      encoding: 'utf8',
      cwd: RAIZ,
      // 🔴 stderr silenciado DE PROPÓSITO. O autoteste do portão genérico injeta a corrupção do
      //    escape num clone, para provar que a autodefesa morde — e o grito dela vazava para cá,
      //    parecendo que o portão de verdade estava quebrado. Custou uma investigação.
      stdio: ['ignore', 'pipe', 'ignore'],
    })
  } catch (e) {
    return String(e.stdout ?? '')
  }
}

const pacote = json('package.json')
const { CATALOGO } = await carregarDominio()
const blocos = json('public/dados/blocos.json').blocos
const inventario = ler('docs/INVENTARIO_DE_FONTES.md')

const autoteste = saidaDe(['scripts/autoteste-portao-generico.mjs'])
const generico = saidaDe(['scripts/portao-generico.mjs'])
const auditoria = saidaDe(['scripts/auditoria-adversarial.mjs'])
const comandos = saidaDe(['scripts/conferir-comandos-da-documentacao.mjs'])

const numeroEm = (texto, re) => {
  const m = texto.match(re)
  return m ? Number(m[1]) : null
}

const ultimoBloco = blocos[blocos.length - 1]
const congelado = blocos.find((b) => b.origem === 'importado') ?? blocos[0]

/**
 * OS FATOS.
 *
 * `chave` identifica o fato. `valor` é o que foi medido. `padroes` são as formas em que aquele
 * número aparece escrito nos documentos — cada uma com um grupo de captura no número.
 *
 * ⚠️ Os padrões são deliberadamente ESPECÍFICOS. Um padrão largo casaria com qualquer frase e
 * encheria o portão de ruído — e portão ruidoso é portão que alguém desliga.
 */
const FATOS = [
  {
    chave: 'passos do gate',
    valor: pacote.scripts.gate.split('&&').length,
    padroes: [/GATE (?:tem|encadeia) (?:\*\*)?(\d+)(?:\*\*)? passos/gi, /npm run gate\s+#\s*(\d+) passos/gi, /encadeia \*\*(\d+)\*\* passos/gi],
    fonte: 'package.json → scripts.gate',
  },
  {
    chave: 'casos do autoteste do portão genérico',
    valor: numeroEm(autoteste, /de (\d+) casos corretos/),
    // ⚠️ APERTADOS depois de um falso positivo. A primeira versão usava `autoteste.{0,40}?(\d+) casos`
    //    e casou uma linha do BACKLOG que falava de outra coisa inteiramente. Portão que acusa o
    //    inocente é portão que alguém desliga — e aí ele não protege nem o culpado.
    // ⚠️ APERTADOS DUAS VEZES, e as duas por falso positivo:
    //    1ª — `autoteste.{0,40}?(\d+) casos` casou uma linha do BACKLOG sobre outra coisa;
    //    2ª — `autoteste (de |do portão )?(\d+) casos` casou o autoteste do PRÉ-VOO, que tem 8.
    //    Este projeto tem mais de um autoteste. O padrão precisa dizer de QUAL está falando —
    //    senão o portão acusa o inocente, e portão que acusa o inocente alguém desliga.
    padroes: [
      /generico:autoteste[^|\n]{0,70}?(\d+) casos/gi,
      /portão (?:acima |genérico )[^|\n]{0,30}?morde[^|\n]{0,25}?(\d+) casos/gi,
    ],
    fonte: 'node scripts/autoteste-portao-generico.mjs',
  },
  {
    chave: 'checagens da auditoria adversarial',
    valor: numeroEm(auditoria, /(\d+) checagem\(ns\)/),
    padroes: [/(\d+) ataques ao próprio código/gi],
    fonte: 'node scripts/auditoria-adversarial.mjs',
  },
  {
    chave: 'arquivos varridos pelo portão genérico',
    valor: numeroEm(generico, /arquivos varridos \.+ (\d+)/),
    padroes: [/(\d+) arquivos varridos/gi],
    fonte: 'node scripts/portao-generico.mjs',
  },
  {
    chave: 'termos do portão genérico',
    valor: numeroEm(generico, /termos procurados \.+ (\d+)/),
    padroes: [/(\d+) termos(?: de cliente)?, \d+ achados/gi],
    fonte: 'node scripts/portao-generico.mjs',
  },
  {
    chave: 'documentos vivos varridos',
    valor: numeroEm(comandos, /documentos vivos varridos \.+ (\d+)/),
    // ⚠️ ALARGADOS: a primeira versão exigia a palavra "documentos" COLADA no número, e deixou
    //    passar "agora descobre e mede **15**." — a frase mais natural de todas. Padrão que só pega
    //    a forma que o autor imaginou é padrão que cobre o autor, não o texto.
    padroes: [
      /mede \*\*(\d+)(?: documentos)?\*\*/gi,
      /descoberta de (\d+)/gi,
      /(\d+) documentos vivos/gi,
      /documentos vivos[^|\n]{0,20}?(\d+)/gi,
    ],
    fonte: 'node scripts/conferir-comandos-da-documentacao.mjs',
  },
  {
    chave: 'piso alcançado no bloco publicado',
    valor: ultimoBloco.pisoAlcancado,
    padroes: [/piso (?:alcançado )?(?:de )?\*\*(\d+)\*\* dias/gi, /piso de \*\*(\d+)\*\* dias/gi],
    fonte: 'public/dados/blocos.json → último bloco',
  },
  {
    chave: 'turnos do bloco congelado',
    valor: congelado.turnos.length,
    padroes: [/congelado[^.\n]{0,40}?(\d+) turnos/gi, /(\d+) turnos congelados/gi],
    fonte: 'public/dados/blocos.json → bloco importado',
  },
  {
    chave: 'fontes externas declaradas',
    // O portão de fontes já mede as duas pontas (chamadas e declaradas) e reprova se divergirem.
    // Aqui só se cobra que o TEXTO do inventário diga o mesmo número que ele conta.
    valor: numeroEm(saidaDe(['scripts/inventariar-fontes.mjs', '--conferir']), /hosts declarados \.+ (\d+)/),
    padroes: [/\*\*(\d+)\*\* fontes externas/gi],
    fonte: 'node scripts/inventariar-fontes.mjs --conferir',
  },
  {
    chave: 'regras no catálogo',
    valor: CATALOGO.length,
    padroes: [/(\d+) regras (?:do )?catálogo/gi, /catálogo de (\d+) regras/gi],
    fonte: 'src/dominio/regras.ts → CATALOGO',
  },
  {
    chave: 'regras duras',
    valor: CATALOGO.filter((r) => r.familia === 'DURA').length,
    padroes: [/(\d+) (?:regras )?duras/gi],
    fonte: 'src/dominio/regras.ts',
  },
]

// ---------------------------------------------------------------------------
const HISTORICOS = ['AI_MASTER_LOG.md', 'DIARIO_DE_BORDO.md', 'docs/handoff/', 'docs/historico/', 'docs/superpowers/']

function vivos(dir = RAIZ, acc = []) {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'capturas'].includes(item.name)) continue
    const abs = join(dir, item.name)
    if (item.isDirectory()) { vivos(abs, acc); continue }
    if (!item.name.endsWith('.md')) continue
    const rel = relative(RAIZ, abs).split(sep).join('/')
    if (HISTORICOS.some((h) => rel === h || rel.startsWith(h))) continue
    acc.push(rel)
  }
  return acc
}

const documentos = vivos().sort()
const achados = []
let conferidas = 0

for (const rel of documentos) {
  const linhas = ler(rel).split(/\r?\n/)
  linhas.forEach((linha, i) => {
    for (const fato of FATOS) {
      if (fato.valor == null) continue
      for (const re of fato.padroes) {
        re.lastIndex = 0
        for (const m of linha.matchAll(re)) {
          conferidas++
          if (Number(m[1]) === fato.valor) continue
          // Dois padrões podem casar a MESMA afirmação (ex.: uma frase que cita o portão e o verbo
          // "morde"). Relatar duas vezes o mesmo defeito faz o número de achados mentir para cima.
          const jaTem = achados.some((a) => a.arquivo === rel && a.linha === i + 1 && a.fato === fato.chave)
          if (jaTem) continue
          achados.push({
            arquivo: rel, linha: i + 1, fato: fato.chave,
            escrito: Number(m[1]), medido: fato.valor, fonte: fato.fonte,
            trecho: linha.trim().slice(0, 100),
          })
        }
      }
    }
  })
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ fatos: FATOS.map(({ chave, valor, fonte }) => ({ chave, valor, fonte })), conferidas, achados }, null, 2))
  process.exit(achados.length ? 1 : 0)
}

console.log('FATOS MEDIDOS DO PROJETO\n')
for (const f of FATOS) {
  console.log(`  ${String(f.valor ?? '?').padStart(4)}  ${f.chave.padEnd(42)} ← ${f.fonte}`)
}

if (!process.argv.includes('--conferir')) process.exit(0)

console.log(`\nCONFERÊNCIA NOS DOCUMENTOS VIVOS\n`)
console.log(`  documentos varridos ......... ${documentos.length}`)
console.log(`  isentos ..................... ${HISTORICOS.join(', ')} (append-only)`)
console.log(`  afirmações conferidas ....... ${conferidas}`)
console.log(`  contradições ................ ${achados.length}\n`)

for (const a of achados) {
  console.log(`  🔴 ${a.arquivo}:${a.linha} — ${a.fato}`)
  console.log(`     escrito: ${a.escrito} · medido: ${a.medido} (${a.fonte})`)
  console.log(`     ${a.trecho}`)
}

if (!achados.length) console.log('  ✅ Nenhum documento vivo desmente um fato medido.')
else console.log('\n   Número escrito à mão apodrece. Meça, ou não escreva.')

process.exit(achados.length ? 1 : 0)
