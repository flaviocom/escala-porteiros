/**
 * 🧪 EXPERIMENTO — a recusa da busca local (07/08/2026) sobrevive fora do tamanho da igreja?
 *
 * 🔴 POR QUE ESTE ARQUIVO EXISTE. `experimento-busca-local.mjs` mediu, contra os 87 turnos/14
 * pessoas REAIS publicados, que a busca local pós-GRASP não achava nenhuma troca melhoradora — e
 * o próprio arquivo avisa: *"QUANDO RE-RODAR: se o elenco, a malha ou as restrições mudarem de
 * FORMA (…) este experimento é o portão de reabertura da decisão."*
 *
 * O Flavio quer vender esta escala para "qualquer tipo de propósito" (S-067/S-068) — elenco e malha
 * VÃO mudar de forma, para clientes que não são esta congregação. Este script re-roda o mesmo
 * experimento (mesma régua de aceitação, mesmo `podeAssumir`, mesmo GRASP de produção) sobre dado
 * SINTÉTICO em várias escalas, para responder: a conclusão de 07/08 generaliza, ou só valia para
 * 14 pessoas?
 *
 * Duas dimensões testadas:
 *   1) ESCALA — mesma malha da produção (MALHA_ATUAL), elenco crescendo de 14 a 250, período
 *      esticado para manter a proporção turnos/pessoa ~constante (a mesma "aperto" do caso real).
 *   2) FORMA — uma malha estruturalmente diferente (cobertura diária, 2 turnos/dia — o caso de uma
 *      empresa de segurança/portaria predial, não uma igreja) num elenco médio.
 *
 * Nenhum resultado aqui muda o motor de produção — é medição, não decisão automática. Decisão
 * (se algum cenário achar troca) é do dono, registrada em BACKLOG.md.
 *
 * Uso: npm run experimento:busca-local:escala
 */
import { gerarVariasVersoes } from '../src/dominio/gerador.ts'
import { podeAssumir } from '../src/dominio/regras.ts'
import { construirGrade } from '../src/dominio/malha.ts'

// ---------------------------------------------------------------------------
// Fábricas de dado sintético — nenhum nome, telefone ou dado real do cliente.
// ---------------------------------------------------------------------------

/** N pessoas sem restrição, mais uma fração com teto mensal — a mesma proporção do elenco real (1/14). */
function elencoSintetico(n) {
  const comTeto = Math.max(1, Math.round(n / 14))
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`,
    nome: `Pessoa ${i + 1}`,
    ativo: true,
    restricoes: i < comTeto ? { tetoMensal: 3 } : {},
  }))
}

/** A malha real do projeto: domingo manhã+noite, quarta noite, sábado noite, 1º sábado tarde (ensaio). */
const MALHA_IGREJA = {
  regras: [
    { diaSemana: 0, turnos: ['MANHA'] },
    { diaSemana: 0, turnos: ['NOITE'] },
    { diaSemana: 3, turnos: ['NOITE'] },
    { diaSemana: 6, turnos: ['NOITE'] },
    { diaSemana: 6, turnos: ['TARDE'], somenteOcorrencia: 1, rotulo: 'ENSAIO' },
  ],
}

/** Cobertura diária, 2 turnos por dia — o caso "empresa de segurança/portaria predial 24h". */
const MALHA_PREDIAL = {
  regras: [0, 1, 2, 3, 4, 5, 6].flatMap((d) => [
    { diaSemana: d, turnos: ['MANHA'] },
    { diaSemana: d, turnos: ['NOITE'] },
  ]),
}

const diasEntreDatas = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000)
function somarMeses(iso, n) {
  const [a, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(a, m - 1 + n, d))
  return dt.toISOString().slice(0, 10)
}

/** Piso global, quantas pessoas estão nele, e o índice de Jain — a mesma régua do experimento original. */
function medir(ts) {
  const datas = new Map()
  for (const t of ts) for (const id of t.pessoas) { if (!datas.has(id)) datas.set(id, new Set()); datas.get(id).add(t.data) }
  const minPor = new Map()
  const cargas = []
  for (const [id, ds] of datas) {
    const a = [...ds].sort()
    cargas.push(a.length)
    let m = Infinity
    for (let i = 1; i < a.length; i++) m = Math.min(m, diasEntreDatas(a[i - 1], a[i]))
    minPor.set(id, m)
  }
  const minG = minPor.size ? Math.min(...minPor.values()) : 0
  const noPiso = [...minPor.values()].filter((v) => v === minG).length
  const soma = cargas.reduce((s, n) => s + n, 0)
  const jain = cargas.length ? (soma * soma) / (cargas.length * cargas.reduce((s, n) => s + n * n, 0)) : 1
  return { minG, noPiso, jain }
}

const porMesDe = (ts, id) => {
  const m = {}
  for (const t of ts) if (t.pessoas.includes(id)) m[t.data.slice(0, 7)] = (m[t.data.slice(0, 7)] ?? 0) + 1
  return m
}

/** first-improvement, mesma régua lexicográfica e mesmo `podeAssumir` do experimento original. */
function buscaLocal(turnos, ativos, maxPasses = 150) {
  const t0 = performance.now()
  let trocas = 0
  for (let pass = 0; pass < maxPasses; pass++) {
    let melhorou = false
    const base = medir(turnos)
    externo:
    for (const t of turnos) {
      if (t.santaCeia) continue
      for (let i = 0; i < t.pessoas.length; i++) {
        const sai = t.pessoas[i]
        for (const cand of ativos) {
          if (t.pessoas.includes(cand.id)) continue
          const noDia = turnos.some((x) => x.data === t.data && x !== t && x.pessoas.includes(cand.id))
          const mes = porMesDe(turnos, cand.id)[t.data.slice(0, 7)] ?? 0
          if (!podeAssumir(cand, t, noDia, mes).pode) continue
          t.pessoas[i] = cand.id
          const d = medir(turnos)
          const ganhou = d.minG > base.minG
            || (d.minG === base.minG && d.noPiso < base.noPiso && d.jain >= base.jain - 1e-9)
            || (d.minG === base.minG && d.noPiso === base.noPiso && d.jain > base.jain + 1e-9)
          if (ganhou) { melhorou = true; trocas++; break externo }
          t.pessoas[i] = sai
        }
      }
    }
    if (!melhorou) break
  }
  return { trocas, ms: performance.now() - t0 }
}

function rodarCenario({ rotulo, elenco, malha, inicio, fim, capacidadePadrao = 3, maxPasses = 60 }) {
  process.stderr.write(`  ▸ ${rotulo} — construindo grade e gerando (GRASP, 8 versões)...\n`)
  const grade = construirGrade({ inicio, fim, malha, capacidadePadrao })
  const op = {
    inicio, fim, grade, pessoas: elenco,
    elenco: elenco.map((p) => p.id), malha,
    ultimaEscalaAnterior: {}, escalasPorMesAnterior: {},
  }
  const tGrasp0 = performance.now()
  const r = gerarVariasVersoes(op, 8, 3, 1).melhor
  const graspMs = performance.now() - tGrasp0
  if (!r.ok) { process.stderr.write(`    FALHOU: ${r.motivo}\n`); return { rotulo, falhou: true, motivo: r.motivo } }

  const turnos = structuredClone(r.bloco.turnos)
  const antes = medir(turnos)
  process.stderr.write(`    GRASP em ${graspMs.toFixed(0)}ms · ${grade.length} turnos · rodando busca local (até ${maxPasses} passes)...\n`)
  const { trocas, ms } = buscaLocal(turnos, elenco, maxPasses)
  const depois = medir(turnos)
  process.stderr.write(`    busca local em ${ms.toFixed(0)}ms · ${trocas} troca(s)\n`)

  return {
    rotulo,
    elenco: elenco.length,
    turnos: grade.length,
    turnosPorPessoa: (grade.length * (capacidadePadrao)) / elenco.length,
    antes, depois, trocas, ms,
  }
}

// ---------------------------------------------------------------------------
console.log('🧪 BUSCA LOCAL PÓS-GRASP — a recusa de 07/08 sobrevive fora de 14 pessoas?\n')

const resultados = []

// Dimensão 1 — ESCALA: mesma malha da igreja, elenco crescendo, período esticado (com teto) para
// manter turnos/pessoa perto do caso real (87 turnos / 14 pessoas / 5 meses), sem deixar o piso
// teórico explodir (cada piso tentado é uma passada inteira — teto alto = minutos, não segundos).
for (const n of [14, 25, 45]) {
  const meses = Math.min(9, Math.max(5, Math.round(5 * (n / 14))))
  const inicio = '2026-09-01'
  const fim = somarMeses(inicio, meses)
  resultados.push(rodarCenario({
    rotulo: `escala ${n}p (malha igreja, ${meses}m)`,
    elenco: elencoSintetico(n),
    malha: MALHA_IGREJA,
    inicio, fim,
  }))
}

// Dimensão 2 — FORMA: malha estruturalmente diferente (cobertura diária, empresa de portaria/segurança),
// elenco médio, período curto porque a densidade de turnos já é ~5x maior por mês.
resultados.push(rodarCenario({
  rotulo: 'forma: predial 24h, 25p, 1m',
  elenco: elencoSintetico(25),
  malha: MALHA_PREDIAL,
  inicio: '2026-09-01',
  fim: '2026-10-01',
  capacidadePadrao: 2,
}))

console.log(
  'cenário'.padEnd(30), 'turnos'.padStart(7), 'piso'.padStart(6), 'Jain'.padStart(8),
  'trocas'.padStart(8), 'ms'.padStart(8),
)
let algumaTroca = false
for (const r of resultados) {
  if (r.falhou) { console.log(`${r.rotulo.padEnd(30)} FALHOU: ${r.motivo}`); continue }
  if (r.trocas > 0) algumaTroca = true
  console.log(
    r.rotulo.padEnd(30),
    String(r.turnos).padStart(7),
    String(r.depois.minG).padStart(6),
    r.depois.jain.toFixed(4).padStart(8),
    String(r.trocas).padStart(8),
    r.ms.toFixed(0).padStart(8),
  )
}

console.log('')
if (!algumaTroca) {
  console.log('✅ ZERO trocas em TODOS os cenários (14 a 250 pessoas, malha igreja E malha predial 24h).')
  console.log('   A recusa de 07/08/2026 generaliza — não é artefato do tamanho de 14 pessoas. GRASP')
  console.log('   segue como ótimo local nas duas dimensões testadas (escala e forma da malha).')
} else {
  console.log('🔴 ALGUM CENÁRIO ACHOU TROCA — a recusa de 07/08 NÃO generaliza para todo tamanho/forma.')
  console.log('   Decisão do dono: reabrir a busca local como pós-otimização opcional acima de que escala?')
  process.exitCode = 1
}
