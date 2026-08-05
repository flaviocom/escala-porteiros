/**
 * PORTÃO — as duas invariantes de arquitetura que a documentação AFIRMA.
 *
 * 🔴 POR QUE ESTE PORTÃO EXISTE. `docs/ARQUITETURA.md` afirma duas coisas como fato medido:
 *
 *   1. **`src/dominio/` não importa nada de fora dele.** É o que permite testar as regras sem montar
 *      tela, e o que deixa os scripts fora do navegador usarem o MESMO código do produto. No dia em
 *      que alguém importar React lá dentro — para um `useMemo` "só neste caso" —, o domínio deixa de
 *      rodar fora do navegador e metade dos scripts para de funcionar.
 *
 *   2. **A conferência independente não importa `regras.ts`.** Ela existe para DISCORDAR. Se um dia
 *      alguém "aproveitar" uma função do catálogo ali dentro, ela vira um espelho — continua verde,
 *      continua concordando, e para de valer qualquer coisa. Seria a pior falha possível: uma
 *      segunda opinião que é a primeira disfarçada.
 *
 * As duas eram verdade quando foram escritas. Nenhuma tinha portão. **Regra sem portão é
 * disciplina, e disciplina falha.**
 *
 * Uso: node scripts/conferir-arquitetura.mjs [--json]
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

function arquivos(dir, acc = []) {
  for (const nome of readdirSync(dir)) {
    const p = path.join(dir, nome)
    if (statSync(p).isDirectory()) { arquivos(p, acc); continue }
    if (/\.tsx?$/.test(nome) && !/\.test\./.test(nome)) acc.push(p.split(path.sep).join('/'))
  }
  return acc
}

/** Todo `from '...'` de um arquivo, com a linha em que aparece. */
function importacoes(abs) {
  const texto = readFileSync(path.join(RAIZ, abs), 'utf8')
  return [...texto.matchAll(/from\s+'([^']+)'/g)].map((m) => ({
    alvo: m[1],
    linha: texto.slice(0, m.index).split('\n').length,
  }))
}

const doDominio = arquivos(path.join(RAIZ, 'src', 'dominio')).map((a) => path.relative(RAIZ, a).split(path.sep).join('/'))
const achados = []

// ── Invariante 1: o domínio é uma ilha ────────────────────────────────────────────────────────
for (const arq of doDominio) {
  for (const imp of importacoes(arq)) {
    // Relativo que sobe de pasta (`../`) sai do domínio. Pacote externo (sem `.`) também.
    const saiDoDominio = imp.alvo.startsWith('..') || !imp.alvo.startsWith('.')
    if (saiDoDominio) {
      achados.push({
        invariante: 'o domínio é uma ilha',
        arquivo: arq,
        linha: imp.linha,
        detalhe: `importa '${imp.alvo}', que está FORA de src/dominio/`,
      })
    }
  }
}

// ── Invariante 2: a segunda régua é independente ──────────────────────────────────────────────
const SEGUNDA_REGUA = 'src/dominio/conferencia-independente.ts'
const PROIBIDO_PARA_A_SEGUNDA_REGUA = ['regras', 'validacao', 'gerador']

for (const imp of importacoes(SEGUNDA_REGUA)) {
  const nome = imp.alvo.replace(/^\.\//, '')
  if (PROIBIDO_PARA_A_SEGUNDA_REGUA.includes(nome)) {
    achados.push({
      invariante: 'a segunda régua é independente',
      arquivo: SEGUNDA_REGUA,
      linha: imp.linha,
      detalhe: `importa '${imp.alvo}' — deixa de ser uma segunda opinião e vira espelho da primeira`,
    })
  }
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ arquivosDoDominio: doDominio.length, achados }, null, 2))
} else {
  console.log('ARQUITETURA — as invariantes que a documentação afirma\n')
  console.log(`  arquivos em src/dominio/ .......... ${doDominio.length}`)
  console.log(`  invariantes conferidas ............ 2`)
  console.log(`  violações ......................... ${achados.length}\n`)
  for (const a of achados) {
    console.log(`  🔴 ${a.invariante}`)
    console.log(`     ${a.arquivo}:${a.linha} — ${a.detalhe}`)
  }
  if (!achados.length) {
    console.log('  ✅ O domínio não importa nada de fora dele.')
    console.log('  ✅ A conferência independente não importa o catálogo de regras.')
  }
}

process.exit(achados.length ? 1 : 0)
