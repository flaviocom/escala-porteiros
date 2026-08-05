/**
 * PORTÃO — documento dentro do teto do próprio regime.
 *
 * 🔴 POR QUE ESTE PORTÃO EXISTE, e por que ele é uma dívida sendo paga.
 *
 * Em 05/08/2026, uma auditoria externa achou que `docs/historico/INDICE.md` prometia:
 * *"Estado dos tetos — conferido por `checar-tamanho-docs.mjs` no pré-voo **e no GATE**"*. O GATE
 * deste projeto **não tinha** passo nenhum de tamanho. Eu **declarei** a dívida naquele momento em
 * vez de fechá-la — e regra declarada continua sendo regra sem portão.
 *
 * ── DE ONDE VÊM OS TETOS ─────────────────────────────────────────────────────────────────────────
 *
 * De `docs/regimes-documentos.json`, que é a declaração do PROJETO — não de um número escrito aqui.
 * O regime padrão vem do CAMINHO:
 *
 *   · **raiz** → documento **vivo**: carregado toda sessão, então 400 linhas / 40 KB;
 *   · **subpasta** → **referência**: lido sob demanda, então 800 / 100 KB;
 *   · lista `historico` → **append-only**: cresce por natureza, fatiado por PERÍODO (2.000 linhas);
 *   · `docs/historico/` → fatia fechada, **imutável e isenta** — medir o passado não faz sentido.
 *
 * ⚠️ Um documento estruturado por assunto NÃO entra em `historico`, mesmo grande: ele se divide por
 * assunto, não se fatia por data. Confundir os dois produz um arquivo de "março" com o assunto do
 * ano inteiro dentro.
 *
 * Uso: node scripts/conferir-tamanho-docs.mjs [--json] [--raiz <dir>]
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const argRaiz = process.argv.indexOf('--raiz')
const RAIZ = argRaiz >= 0 ? process.argv[argRaiz + 1] : join(dirname(fileURLToPath(import.meta.url)), '..')

/** Os tetos, por regime. Números do método, aplicados conforme a declaração do projeto. */
const TETOS = {
  vivo: { linhas: 400, kb: 40, porque: 'carregado toda sessão' },
  referencia: { linhas: 800, kb: 100, porque: 'lido sob demanda' },
  historico: { linhas: 2000, kb: 200, porque: 'append-only — fatiado por período, não dividido' },
}

const arqRegimes = join(RAIZ, 'docs', 'regimes-documentos.json')
const regimes = existsSync(arqRegimes)
  ? JSON.parse(readFileSync(arqRegimes, 'utf8'))
  : { historico: [], isento: [] }

const listaHistorico = regimes.historico ?? []
const listaIsento = regimes.isento ?? []

function documentos(dir = RAIZ, acc = []) {
  for (const nome of readdirSync(dir)) {
    if (['node_modules', '.git', 'capturas', 'assets'].includes(nome)) continue
    const p = join(dir, nome)
    if (statSync(p).isDirectory()) { documentos(p, acc); continue }
    if (nome.endsWith('.md')) acc.push(relative(RAIZ, p).split(sep).join('/'))
  }
  return acc
}

/** O regime de um documento vem do caminho, com duas exceções declaradas no JSON. */
function regimeDe(rel) {
  if (listaIsento.includes(rel)) return 'isento'
  if (rel.startsWith('docs/historico/')) return 'fatia'
  if (listaHistorico.includes(rel)) return 'historico'
  return rel.includes('/') ? 'referencia' : 'vivo'
}

const medidos = []
const isentos = []
const achados = []

for (const rel of documentos().sort()) {
  const regime = regimeDe(rel)
  if (regime === 'isento' || regime === 'fatia') { isentos.push({ rel, regime }); continue }

  const texto = readFileSync(join(RAIZ, rel), 'utf8')
  const linhas = texto.split(/\r?\n/).length
  const kb = Buffer.byteLength(texto) / 1024
  const teto = TETOS[regime]
  medidos.push({ rel, regime, linhas, kb })

  if (linhas > teto.linhas || kb > teto.kb) {
    achados.push({
      rel, regime, linhas, kb: kb.toFixed(1), teto,
      comoResolver: regime === 'historico'
        ? 'fatie por PERÍODO para `docs/historico/`, e registre a fatia no índice de lá'
        : 'divida por ASSUNTO num documento novo, e ligue os dois',
    })
  }
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ medidos: medidos.length, isentos: isentos.length, achados }, null, 2))
} else {
  console.log('TAMANHO DOS DOCUMENTOS — teto por regime declarado\n')
  console.log(`  documentos medidos ........ ${medidos.length}`)
  console.log(`  isentos ................... ${isentos.length} (fatias de \`docs/historico/\` e a lista \`isento\`)`)
  for (const [nome, t] of Object.entries(TETOS)) {
    const n = medidos.filter((m) => m.regime === nome).length
    console.log(`  · ${nome.padEnd(12)} ${String(n).padStart(3)} doc(s) · teto ${t.linhas} linhas / ${t.kb} KB — ${t.porque}`)
  }
  console.log(`  acima do teto ............. ${achados.length}\n`)

  for (const a of achados) {
    console.log(`  🔴 ${a.rel} — regime "${a.regime}"`)
    console.log(`     ${a.linhas} linhas · ${a.kb} KB · teto ${a.teto.linhas} / ${a.teto.kb} KB`)
    console.log(`     ${a.comoResolver}`)
  }
  if (!achados.length) {
    // O maior de cada regime, para a folga ser visível ANTES de acabar.
    for (const nome of Object.keys(TETOS)) {
      const doRegime = medidos.filter((m) => m.regime === nome).sort((a, b) => b.linhas - a.linhas)[0]
      if (doRegime) {
        console.log(`  ✅ maior "${nome}": ${doRegime.rel} — ${doRegime.linhas}/${TETOS[nome].linhas} linhas`)
      }
    }
  }
}

process.exit(achados.length ? 1 : 0)
