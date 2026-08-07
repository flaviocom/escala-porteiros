/**
 * 🧪 EXPERIMENTO — a busca local (swap 1-a-1) melhoraria a escala publicada?
 *
 * 🔴 POR QUE ESTE ARQUIVO EXISTE, E POR QUE ELE NÃO É PARTE DO MOTOR. A pesquisa de 07/08/2026
 * ([PESQUISA_2026-08-07-metodos-rostering.md](../docs/superpowers/specs/PESQUISA_2026-08-07-metodos-rostering.md),
 * §3) recomenda a hibridização vencedora das competições INRC: GRASP + busca local de trocas como
 * pós-otimização. Antes de pagar a complexidade (versionamento de motor no `refazer`, testes,
 * documentação), a recomendação foi MEDIDA aqui, sobre os dados reais publicados:
 *
 *   ANTES : piso 4 · 3 pessoa(s) no piso · Jain 0,9965
 *   DEPOIS: piso 4 · 3 pessoa(s) no piso · Jain 0,9965 · 0 troca(s)
 *
 * **Zero trocas melhoradoras, em DOIS critérios de aceitação** (piso global; e piso → nº de pessoas
 * no piso → Jain). A escala do GRASP já é um ótimo local, e Jain 0,9965 é o máximo que a aritmética
 * permite (258 vagas não dividem por 14). A busca local foi RECUSADA com esta medição como prova —
 * o registro da decisão está na auditoria do relatório de pesquisa e no DB-043.
 *
 * ⚠️ QUANDO RE-RODAR: se o elenco, a malha ou as restrições mudarem de FORMA (não só de valor) —
 * mais gente com teto, pares proibidos, alocação fixa por data — este experimento é o portão de
 * reabertura da decisão. Se ele passar a achar trocas, a recusa perde a prova e a discussão reabre.
 *
 * Uso: npm run experimento:busca-local
 */
import { readFileSync } from 'node:fs'
import { gerarVariasVersoes } from '../src/dominio/gerador.ts'
import { podeAssumir } from '../src/dominio/regras.ts'
import { construirGrade, MALHA_ATUAL } from '../src/dominio/malha.ts'

const pessoas = JSON.parse(readFileSync('public/dados/pessoas.json', 'utf8')).pessoas
const blocos = JSON.parse(readFileSync('public/dados/blocos.json', 'utf8')).blocos
const vigente = blocos.find((b) => b.origem === 'algoritmo')
const ativos = pessoas.filter((p) => p.ativo)
const { inicio, fim } = vigente

console.log('🧪 BUSCA LOCAL PÓS-GRASP — vale a pena?\n')
console.log(`  período ................... ${inicio} a ${fim} (o bloco vigente)`)
console.log(`  elenco .................... ${ativos.length} ativos`)

const grade = construirGrade({ inicio, fim, malha: MALHA_ATUAL, capacidadePadrao: 3 })
const op = {
  inicio, fim, grade, pessoas,
  elenco: ativos.map((p) => p.id), malha: MALHA_ATUAL,
  ultimaEscalaAnterior: {}, escalasPorMesAnterior: {},
}
const r = gerarVariasVersoes(op, 8, 3, 1).melhor
if (!r.ok) { console.log(`o gerador declarou falha: ${r.motivo}`); process.exit(1) }
const turnos = structuredClone(r.bloco.turnos)

const diasEntre = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000)

/** Piso global, quantas pessoas estão NELE, e o índice de Jain — a régua da comparação. */
function medir(ts) {
  const datas = new Map()
  for (const t of ts) for (const id of t.pessoas) { if (!datas.has(id)) datas.set(id, new Set()); datas.get(id).add(t.data) }
  const minPor = new Map()
  const cargas = []
  for (const [id, ds] of datas) {
    const a = [...ds].sort()
    cargas.push(a.length)
    let m = Infinity
    for (let i = 1; i < a.length; i++) m = Math.min(m, diasEntre(a[i - 1], a[i]))
    minPor.set(id, m)
  }
  const minG = Math.min(...minPor.values())
  const noPiso = [...minPor.values()].filter((v) => v === minG).length
  const soma = cargas.reduce((s, n) => s + n, 0)
  const jain = (soma * soma) / (cargas.length * cargas.reduce((s, n) => s + n * n, 0))
  return { minG, noPiso, jain }
}

const antes = medir(turnos)
console.log(`  ANTES ..................... piso ${antes.minG} · ${antes.noPiso} pessoa(s) no piso · Jain ${antes.jain.toFixed(4)}\n`)

const porMesDe = (ts, id) => {
  const m = {}
  for (const t of ts) if (t.pessoas.includes(id)) m[t.data.slice(0, 7)] = (m[t.data.slice(0, 7)] ?? 0) + 1
  return m
}

/*
  First-improvement determinístico: percorre turnos e candidatos SEMPRE na mesma ordem, aceita a
  primeira troca que melhora a régua lexicográfica (piso ↑, depois gente-no-piso ↓, depois Jain ↑)
  sem violar regra dura (`podeAssumir` re-checa tudo: dias, turnos, teto, ausência, mesmo-dia).
*/
const t0 = performance.now()
let trocas = 0
for (let pass = 0; pass < 200; pass++) {
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

const depois = medir(turnos)
console.log(`  DEPOIS .................... piso ${depois.minG} · ${depois.noPiso} pessoa(s) no piso · Jain ${depois.jain.toFixed(4)}`)
console.log(`  trocas melhoradoras ....... ${trocas} · ${(performance.now() - t0).toFixed(0)}ms\n`)

if (trocas === 0) {
  console.log('✅ ZERO ganho: a escala do GRASP já é ótimo local. A recusa da busca local segue provada.')
} else {
  console.log(`🔴 A BUSCA LOCAL ACHOU ${trocas} MELHORIA(S) — a recusa de 07/08/2026 PERDEU a prova.`)
  console.log('   Reabra a decisão: ver a auditoria em PESQUISA_2026-08-07-metodos-rostering.md e o DB-043.')
  process.exit(1)
}
