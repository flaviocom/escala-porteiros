/**
 * Gera o bloco novo a partir dos dados publicados e MEDE o resultado.
 *
 * Não é ferramenta de produção — a geração de verdade acontece na área administrativa. Este script
 * existe para provar, fora do navegador, que o motor faz o que promete: descobre o piso, respeita as
 * restrições, e conserta o defeito de distanciamento medido no site que está no ar.
 *
 * Uso: node scripts/gerar-bloco.mjs [--de AAAA-MM-DD] [--ate AAAA-MM-DD] [--escrever]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')

// Compila o TypeScript do domínio na hora, para o script usar exatamente o mesmo código do produto.
// Sem cópia paralela: código duplicado é onde as duas versões divergem em silêncio.
const { createRequire } = await import('node:module')
const require = createRequire(import.meta.url)
const esbuild = (() => {
  try { return require('esbuild') } catch { return null }
})()

if (!esbuild) {
  console.error('🔴 esbuild não encontrado — rode `npm i -D esbuild` para usar este script.')
  process.exit(2)
}

// Um pacote só, para o Node não tropeçar em import sem extensão. Bundle, não transpile solto.
const entrada = join(RAIZ, 'node_modules', '.cache-dominio-entrada.ts')
const saidaJs = join(RAIZ, 'node_modules', '.cache-dominio.mjs')
writeFileSync(
  entrada,
  [
    "export * from '../src/dominio/datas'",
    "export * from '../src/dominio/malha'",
    "export * from '../src/dominio/regras'",
    "export * from '../src/dominio/validacao'",
    "export * from '../src/dominio/gerador'",
  ].join('\n'),
  'utf8',
)
esbuild.buildSync({ entryPoints: [entrada], outfile: saidaJs, format: 'esm', platform: 'node', bundle: true })

const dominio = await import(pathToFileURL(saidaJs).href)
const { construirGrade, MALHA_ATUAL, gerar, validar, resumir, menorIntervalo, formatarBR, diferencaEmDias } = dominio

// ---------------------------------------------------------------------------
const args = process.argv.slice(2)
const arg = (n, padrao) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : padrao }
const DE = arg('--de', '2026-08-05')
const ATE = arg('--ate', '2026-12-30')
const ESCREVER = args.includes('--escrever')
const SANTA_CEIA = ['2026-08-16']

const pessoasArq = JSON.parse(readFileSync(join(RAIZ, 'public/dados/pessoas.json'), 'utf8'))
const blocosArq = JSON.parse(readFileSync(join(RAIZ, 'public/dados/blocos.json'), 'utf8'))
const pessoas = pessoasArq.pessoas
const historico = blocosArq.blocos[0]

// Fronteira: última escala de cada um no bloco anterior.
const fronteira = {}
for (const t of historico.turnos) for (const id of t.pessoas) {
  if (!fronteira[id] || t.data > fronteira[id]) fronteira[id] = t.data
}

console.log(`GERAÇÃO DO BLOCO ${formatarBR(DE)} → ${formatarBR(ATE)}\n`)
console.log(`Santa Ceia cadastrada: ${SANTA_CEIA.map(formatarBR).join(', ')}`)
console.log(`Elenco: ${pessoas.filter((p) => p.ativo).length} pessoas\n`)

const grade = construirGrade({ inicio: DE, fim: ATE, malha: MALHA_ATUAL, capacidadePadrao: 3, santaCeia: SANTA_CEIA })
const r = gerar({
  inicio: DE, fim: ATE, grade, pessoas,
  elenco: pessoas.filter((p) => p.ativo).map((p) => p.id),
  malha: MALHA_ATUAL,
  ultimaEscalaAnterior: fronteira,
})

if (!r.ok) {
  console.error('🔴 NÃO FOI POSSÍVEL GERAR\n')
  console.error(r.motivo)
  if (r.turnoQueTravou) console.error(`\nTravou em ${formatarBR(r.turnoQueTravou.data)} ${r.turnoQueTravou.tipo}: faltaram ${r.turnoQueTravou.faltaram}`)
  console.error(`\nPisos tentados: ${r.pisosTentados.join(', ')}`)
  process.exit(1)
}

console.log('✅ ' + r.relato + '\n')

const ctx = { bloco: r.bloco, pessoas, ultimaEscalaAnterior: fronteira }
const rel = validar(ctx)
console.log('VALIDAÇÃO — ' + resumir(rel))
console.log(`Regras avaliadas: ${rel.avaliadas} de ${rel.totalNoCatalogo}\n`)
for (const res of rel.resultados) {
  const marca = res.status === 'ok' ? '✅' : res.status === 'aviso' ? '🟡' : '🔴'
  console.log(`  ${marca} ${res.id.padEnd(4)} ${res.titulo}`)
  console.log(`        ${res.medida}`)
  for (const v of res.violacoes.slice(0, 4)) console.log(`        · ${v.mensagem}`)
  if (res.violacoes.length > 4) console.log(`        · (+${res.violacoes.length - 4})`)
}

console.log('\nDISTANCIAMENTO POR PESSOA (o defeito que este projeto veio consertar)')
const linhas = pessoas.map((p) => {
  const total = r.bloco.turnos.filter((t) => t.pessoas.includes(p.id)).length
  return { nome: p.nome, total, min: menorIntervalo(ctx, p.id) }
}).sort((a, b) => (a.min ?? 999) - (b.min ?? 999))
for (const l of linhas) console.log(`  ${l.nome.padEnd(18)} ${String(l.total).padStart(3)} turnos · menor intervalo ${l.min ?? '-'} dia(s)`)

const menor = Math.min(...linhas.filter((l) => l.min != null).map((l) => l.min))
console.log(`\n  ANTES (site no ar): menor intervalo 1 dia (Williams, 7 ocorrências); 18 pares com ≤3 dias`)
console.log(`  AGORA:              menor intervalo ${menor} dia(s)`)

let curtos = 0
for (const p of pessoas) {
  const datas = r.bloco.turnos.filter((t) => t.pessoas.includes(p.id)).map((t) => t.data).sort()
  for (let i = 1; i < datas.length; i++) if (diferencaEmDias(datas[i - 1], datas[i]) <= 3) curtos++
}
console.log(`  Pares com ≤3 dias:  ${curtos}`)

const ceia = r.bloco.turnos.filter((t) => t.santaCeia)
console.log(`\nSANTA CEIA: ${ceia.length} dia(s) — ${ceia.map((t) => `${formatarBR(t.data)} com ${t.pessoas.length} pessoa(s)`).join(', ')}`)

if (ESCREVER) {
  // O bloco anterior termina na VÉSPERA do novo. Deixar `fim` igual a `DE` criaria um dia
  // governado por dois blocos — resolvível, mas é o tipo de ambiguidade que vira defeito depois.
  const vespera = dominio.somarDias(DE, -1)
  const truncado = { ...historico, fim: vespera, turnos: historico.turnos.filter((t) => diferencaEmDias(t.data, DE) > 0) }
  const novo = { versao: 1, blocos: [truncado, r.bloco] }
  writeFileSync(join(RAIZ, 'public/dados/blocos.json'), JSON.stringify(novo, null, 2) + '\n', 'utf8')
  console.log('\n✅ blocos.json atualizado (histórico truncado + bloco novo)')
} else {
  console.log('\n(simulação — use --escrever para gravar)')
}
