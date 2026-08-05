/**
 * CARGA INICIAL — congela a escala que está no ar como bloco histórico imutável.
 *
 * 🔴 POR QUE ESTE SCRIPT REPRODUZ O ALGORITMO ANTIGO, DEFEITOS INCLUÍDOS.
 *
 * O site atual não guarda a escala: ele a **recalcula** a cada abertura do navegador. Para preservar
 * o passado exatamente como os irmãos viram, é preciso rodar o gerador antigo uma vez e gravar o
 * resultado. Qualquer "melhoria" aqui reescreveria o passado — que é justamente o que o Flavio
 * proibiu: *"você não vai apagar o passado"*.
 *
 * Então este arquivo é uma **cópia fiel** de `src/utils/scheduler.ts` do repositório
 * `flaviocom/escala-irmaos-2026-mar`, com os mesmos critérios de desempate e a mesma ordem. Ele não
 * é o gerador do produto — o gerador novo vive em `src/dominio/gerador.ts`.
 *
 * ⚠️ CONTAR AS DUAS PONTAS (ERRO 23 do catálogo de anteparos). Extração parcial **parece** completa:
 * cada item lido está correto, e nada acusa os que ficaram de fora. Por isso este script mede a
 * fonte e o produzido, e **falha explicitamente** se divergirem.
 *
 * Uso:  node scripts/carga-inicial.mjs [--ate AAAA-MM-DD] [--escrever]
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { hojeSaoPaulo } from './lib/dominio.mjs'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')

// ---------------------------------------------------------------------------
// Datas — locais, sem fuso, iguais às de src/dominio/datas.ts
// ---------------------------------------------------------------------------
const p2 = (n) => String(n).padStart(2, '0')
const iso = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`
const paraData = (s) => { const [a, m, d] = s.split('-').map(Number); return new Date(a, m - 1, d) }
const diaSemana = (s) => paraData(s).getDay()
const diffDias = (a, b) => {
  const [a1, m1, d1] = a.split('-').map(Number)
  const [a2, m2, d2] = b.split('-').map(Number)
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86400000)
}
const mesDe = (s) => s.slice(0, 7)

// ---------------------------------------------------------------------------
// O ELENCO E AS RESTRIÇÕES, como estão no ar hoje
// ---------------------------------------------------------------------------
const IRMAOS = [
  { id: 'adilson',         nome: 'Adilson',         r: { diasPermitidos: [0], turnosPermitidos: ['NOITE'] } },
  { id: 'carlos_henrique', nome: 'Carlos Henrique', r: { diasProibidos: [3] } },
  { id: 'donizete',        nome: 'Donizete',        r: {} },
  { id: 'eduardo',         nome: 'Eduardo',         r: { diasProibidos: [3] } },
  { id: 'elson',           nome: 'Elson',           r: { diasProibidos: [3] } },
  { id: 'flavio',          nome: 'Flavio',          r: {} },
  { id: 'isac',            nome: 'Isac',            r: {} },
  { id: 'leandro',         nome: 'Leandro',         r: {} },
  { id: 'lucas',           nome: 'Lucas',           r: {} },
  { id: 'luis_henrique',   nome: 'Luis Henrique',   r: {} },
  { id: 'luiz_felipe',     nome: 'Luiz Felipe',     r: {} },
  { id: 'luiz_cezar',      nome: 'Luíz Cezar',      r: {} },
  { id: 'marcos',          nome: 'Marcos',          r: {} },
  { id: 'thiago',          nome: 'Thiago',          r: { diasPermitidos: [3], turnosPermitidos: ['NOITE'], tetoMensal: 2 } },
  { id: 'vicente',         nome: 'Vicente',         r: {} },
  { id: 'williams',        nome: 'Williams',        r: { tetoMensal: 3 } },
]

/** Santa Ceia como está NO CÓDIGO ANTIGO. A data correta (16/08) entra no bloco novo. */
const SANTA_CEIA_ANTIGA = '2026-06-07'

// ---------------------------------------------------------------------------
// A grade antiga: 01/03 a 31/12/2026 — dom manhã+noite · qua noite · sáb noite · 1º sáb tarde
// ---------------------------------------------------------------------------
function gradeAntiga() {
  const turnos = []
  const fim = '2026-12-31'
  for (let d = '2026-03-01'; diffDias(d, fim) >= 0; ) {
    const dow = diaSemana(d)
    if (d === SANTA_CEIA_ANTIGA) {
      turnos.push({ data: d, tipo: 'MANHA', pessoas: [], capacidade: 0, santaCeia: true, rotulo: 'SANTA CEIA' })
    } else {
      if (dow === 0) {
        turnos.push({ data: d, tipo: 'MANHA', pessoas: [], capacidade: 3 })
        turnos.push({ data: d, tipo: 'NOITE', pessoas: [], capacidade: 3 })
      }
      if (dow === 3) turnos.push({ data: d, tipo: 'NOITE', pessoas: [], capacidade: 3 })
      if (dow === 6) {
        // 1º sábado do mês: Tarde (Ensaio) + Noite. O original testa `getDate() <= 7`.
        if (Number(d.slice(8, 10)) <= 7) {
          turnos.push({ data: d, tipo: 'TARDE', pessoas: [], capacidade: 3, rotulo: 'ENSAIO' })
        }
        turnos.push({ data: d, tipo: 'NOITE', pessoas: [], capacidade: 3 })
      }
    }
    const dt = paraData(d); dt.setDate(dt.getDate() + 1); d = iso(dt)
  }
  return turnos
}

// ---------------------------------------------------------------------------
// O algoritmo antigo, fielmente: guloso, com pontuação e sem retrocesso
// ---------------------------------------------------------------------------
function distribuirComoAntes(turnos) {
  const podeAssumir = (irmao, turno) => {
    if (turnos.some((s) => s.data === turno.data && s.pessoas.includes(irmao.id))) return false
    const dow = diaSemana(turno.data)
    const r = irmao.r
    if (r.diasProibidos?.includes(dow)) return false
    if (r.diasPermitidos && !r.diasPermitidos.includes(dow)) return false
    if (r.turnosPermitidos && !r.turnosPermitidos.includes(turno.tipo)) return false
    if (r.tetoMensal) {
      const m = mesDe(turno.data)
      const n = turnos.filter((s) => s.pessoas.includes(irmao.id) && mesDe(s.data) === m).length
      if (n >= r.tetoMensal) return false
    }
    return true
  }

  const pontuar = (irmao, turno) => {
    const meus = turnos.filter((s) => s.pessoas.includes(irmao.id))
    const total = meus.length
    let desdeUltima = 100
    if (meus.length) {
      const ultima = [...meus].sort((a, b) => (a.data < b.data ? 1 : -1))[0]
      desdeUltima = ultima.data < turno.data ? diffDias(ultima.data, turno.data) : 0
    }
    let s = desdeUltima * 2 - total * 10
    if (irmao.r.tetoMensal) s += 50
    return s
  }

  for (const turno of turnos) {
    if (turno.santaCeia) continue
    const cand = IRMAOS.filter((i) => podeAssumir(i, turno))
    cand.sort((a, b) => pontuar(b, turno) - pontuar(a, turno))
    for (let i = 0; i < turno.capacidade; i++) if (cand[i]) turno.pessoas.push(cand[i].id)
  }
  return turnos
}

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------
const args = process.argv.slice(2)
const idxAte = args.indexOf('--ate')
const ATE = idxAte >= 0 ? args[idxAte + 1] : '2026-08-04'
const ESCREVER = args.includes('--escrever')

console.log('CARGA INICIAL — congelando a escala que está no ar\n')

const grade = gradeAntiga()
const completa = distribuirComoAntes(grade)

// ---- PORTÃO: contar as DUAS pontas -----------------------------------------
const ESPERADO_TURNOS = 184 // medido no site no ar em 04/08/2026
const ESPERADO_VAGAS = 549

const vagas = completa.filter((t) => !t.santaCeia).reduce((s, t) => s + t.capacidade, 0)
const preenchidas = completa.reduce((s, t) => s + t.pessoas.length, 0)

console.log('Conferência contra a fonte (o site que está no ar):')
console.log(`  turnos produzidos ...... ${completa.length}   (esperado ${ESPERADO_TURNOS})`)
console.log(`  vagas ................. ${vagas}   (esperado ${ESPERADO_VAGAS})`)
console.log(`  vagas preenchidas ..... ${preenchidas}`)

const problemas = []
if (completa.length !== ESPERADO_TURNOS) problemas.push(`turnos: ${completa.length} ≠ ${ESPERADO_TURNOS}`)
if (vagas !== ESPERADO_VAGAS) problemas.push(`vagas: ${vagas} ≠ ${ESPERADO_VAGAS}`)
if (preenchidas !== vagas) problemas.push(`preenchidas: ${preenchidas} ≠ ${vagas} (turno incompleto)`)

if (problemas.length) {
  console.error('\n🔴 A carga NÃO bate com a fonte. Parcial que não é contado se disfarça de completo.')
  problemas.forEach((p) => console.error('   ·', p))
  process.exit(1)
}
console.log('  ✅ as duas pontas batem\n')

// ---- Recorte histórico ------------------------------------------------------
const historico = completa.filter((t) => diffDias(t.data, ATE) >= 0)
const futuro = completa.filter((t) => diffDias(t.data, ATE) < 0)

console.log(`Recorte em ${ATE}:`)
console.log(`  bloco HISTÓRICO (congelado) .. ${historico.length} turnos, ${historico[0]?.data} a ${historico[historico.length - 1]?.data}`)
console.log(`  descartado (será regerado) ... ${futuro.length} turnos, ${futuro[0]?.data} a ${futuro[futuro.length - 1]?.data}`)

const pessoas = {
  versao: 1,
  pessoas: IRMAOS.map((i) => ({ id: i.id, nome: i.nome, ativo: true, restricoes: i.r })),
}

const blocos = {
  versao: 1,
  blocos: [
    {
      id: 'bloco-historico-2026-03',
      inicio: '2026-03-01',
      fim: ATE,
      /*
        🔴 `hojeSaoPaulo()`, NUNCA `new Date().toISOString().slice(0, 10)` — P4.7, fechado 05/08/2026.

        `toISOString()` devolve UTC. Às 21h de São Paulo já é o dia seguinte em UTC, então esta linha
        gravaria uma data de geração **um dia à frente** para quem rodasse o script à noite — e
        `datas.ts` inteiro existe para impedir exatamente isso. Era o único ponto do repositório que
        ainda usava a forma perigosa.

        Agora vem do MESMO código do produto, via `scripts/lib/dominio.mjs`. Sem cópia paralela.
      */
      geradoEm: await hojeSaoPaulo(),
      origem: 'importado',
      pisoAlcancado: null,
      elenco: IRMAOS.map((i) => i.id),
      malha: {
        regras: [
          { diaSemana: 0, turnos: ['MANHA', 'NOITE'] },
          { diaSemana: 3, turnos: ['NOITE'] },
          { diaSemana: 6, turnos: ['NOITE'] },
          { diaSemana: 6, turnos: ['TARDE'], somenteOcorrencia: 1, rotulo: 'ENSAIO' },
        ],
      },
      turnos: historico,
      observacao:
        'Importado do site flaviocom/escala-irmaos-2026-mar rodando o gerador antigo uma vez. ' +
        'IMUTÁVEL: é o que os irmãos já viram. A Santa Ceia de 07/06/2026 aqui é dado histórico ' +
        'do site antigo; a data correta, 16/08/2026, vale do bloco seguinte em diante.',
    },
  ],
}

// A última data de cada pessoa no histórico — a fronteira que o bloco novo precisa respeitar.
const fronteira = {}
for (const t of historico) for (const id of t.pessoas) {
  if (!fronteira[id] || t.data > fronteira[id]) fronteira[id] = t.data
}
console.log('\nFronteira (última escala de cada um no histórico):')
for (const i of IRMAOS) console.log(`  ${i.nome.padEnd(18)} ${fronteira[i.id] ?? '(nenhuma)'}`)

if (ESCREVER) {
  const dir = join(RAIZ, 'public', 'dados')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'pessoas.json'), JSON.stringify(pessoas, null, 2) + '\n', 'utf8')
  writeFileSync(join(dir, 'blocos.json'), JSON.stringify(blocos, null, 2) + '\n', 'utf8')
  console.log(`\n✅ Gravado em ${dir}`)
} else {
  console.log('\n(simulação — rode com --escrever para gravar os JSON)')
}
