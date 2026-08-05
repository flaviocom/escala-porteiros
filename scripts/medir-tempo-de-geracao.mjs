/**
 * Quanto custa gerar uma escala — MEDIDO, para decidir se vale um Web Worker.
 *
 * 🔴 Por que medir antes: a pesquisa de 05/08/2026 recomendou Web Worker, e os limiares de Nielsen
 * dizem que acima de ~1s o usuário sente, acima de 10s ele desiste. Mas Worker é complexidade real
 * (mensagens, serialização, um segundo ponto de falha). Comprá-la sem saber se a espera existe é
 * exatamente o tipo de decisão que este método chama de garantia escrita junto com a intenção.
 *
 * Uso: node scripts/medir-tempo-de-geracao.mjs [quantas-versoes]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const esbuild = require('esbuild')

const entrada = join(RAIZ, 'node_modules', '.medir-entrada.ts')
const saida = join(RAIZ, 'node_modules', '.medir.mjs')
writeFileSync(entrada, ['datas', 'malha', 'gerador'].map((m) => `export * from '../src/dominio/${m}'`).join('\n'), 'utf8')
esbuild.buildSync({ entryPoints: [entrada], outfile: saida, format: 'esm', platform: 'node', bundle: true })
const D = await import(pathToFileURL(saida).href)

const config = JSON.parse(readFileSync(join(RAIZ, 'public/dados/config.json'), 'utf8'))
const pessoas = JSON.parse(readFileSync(join(RAIZ, 'public/dados/pessoas.json'), 'utf8')).pessoas
const blocos = JSON.parse(readFileSync(join(RAIZ, 'public/dados/blocos.json'), 'utf8')).blocos

const DE = '2026-08-05'
const ATE = '2026-12-30'
const VERSOES = Number(process.argv[2] ?? 8)

const fronteira = {}
for (const b of blocos) for (const t of b.turnos) {
  if (D.diferencaEmDias(t.data, DE) <= 0) continue
  for (const id of t.pessoas) if (!fronteira[id] || t.data > fronteira[id]) fronteira[id] = t.data
}
const elenco = pessoas.filter((p) => p.ativo).map((p) => p.id)

function umaGeracao() {
  const grade = D.construirGrade({
    inicio: DE, fim: ATE, malha: config.malhaPadrao,
    capacidadePadrao: config.capacidadePadrao, santaCeia: config.santaCeia,
  })
  return D.gerar({ inicio: DE, fim: ATE, grade, pessoas, elenco, malha: config.malhaPadrao, ultimaEscalaAnterior: fronteira })
}

// Um aquecimento: a primeira execução paga a compilação do motor de JavaScript, e medi-la
// contaria um custo que o usuário nunca paga duas vezes.
umaGeracao()

const amostras = []
for (let i = 0; i < 5; i++) {
  const t0 = performance.now()
  const r = umaGeracao()
  amostras.push(performance.now() - t0)
  if (!r.ok) { console.log('🔴 a geração falhou — medição sem sentido'); process.exit(1) }
}
amostras.sort((a, b) => a - b)
const mediana = amostras[Math.floor(amostras.length / 2)]

console.log('TEMPO DE GERAÇÃO — medido, não estimado\n')
console.log(`  período ................ ${DE} a ${ATE}`)
console.log(`  elenco ................. ${elenco.length} pessoas`)
console.log(`  uma escala (mediana) ... ${mediana.toFixed(0)} ms`)
console.log(`  amostras ............... ${amostras.map((n) => n.toFixed(0)).join(', ')} ms`)
console.log(`  ${VERSOES} versões (projetado) .. ${(mediana * VERSOES).toFixed(0)} ms\n`)

// Os limiares de Nielsen, que são a régua da decisão.
const total = mediana * VERSOES
const veredito =
  total < 100 ? '✅ abaixo de 100 ms — nem indicador de carregando é necessário. Web Worker seria complexidade sem dor.'
  : total < 1000 ? '✅ abaixo de 1 s — o raciocínio do usuário não é interrompido. Basta um indicador simples; Web Worker não se justifica.'
  : total < 10000 ? '⚠️ entre 1 s e 10 s — indicador de progresso é obrigatório. Web Worker passa a valer, porque a tela trava enquanto calcula.'
  : '🔴 acima de 10 s — passa do limite de atenção. Web Worker e progresso por etapa são obrigatórios.'
console.log(`  ${veredito}`)
console.log('\n  Régua: Nielsen — 0,1 s instantâneo · 1 s sem interromper o raciocínio · 10 s limite da atenção.')
