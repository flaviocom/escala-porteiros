/**
 * ⚖️ VEREDITO DO PUBLICADO — as DUAS réguas sobre o que o site SERVE, regra a regra, com números.
 *
 * Pedido do dono (07/08/2026): *"me diga se a escala que está publicada hoje no ar está correta em
 * todas as suas validações (…) citando a quantidade e as validações, todas corretas. Se o validador,
 * de maneira independente também, chegou ao mesmo veredito."*
 *
 * O que este script faz, e nada além: baixa o dado PELA URL PUBLICADA (o que está no disco é
 * hipótese), roda a 1ª régua (catálogo, 17 regras) e a 2ª (conferência independente, 8 promessas,
 * zero linhas de regras.ts) sobre o bloco vigente, e imprime cada resultado NOMEADO. Sai 1 se
 * qualquer régua reprovar.
 *
 * Uso: npm run vivo:veredito   (vite-node — já vem com o vitest; nenhuma dependência nova)
 */
import { validar } from '../src/dominio/validacao.ts'
import { conferirPorFora } from '../src/dominio/conferencia-independente.ts'

const SITE = 'https://flaviocom.github.io/escala-porteiros/'
const baixar = async (c) => {
  const r = await fetch(`${SITE}${c}?cb=${Date.now()}`, { cache: 'no-store' })
  if (!r.ok) throw new Error(`${c} respondeu ${r.status}`)
  return r.json()
}

const [blocos, pessoasArq, config] = await Promise.all([
  baixar('dados/blocos.json'), baixar('dados/pessoas.json'), baixar('dados/config.json'),
])
const pessoas = pessoasArq.pessoas

console.log('⚖️  VEREDITO DO PUBLICADO — medido pela URL, não pelo disco\n')

/* A fronteira do bloco vigente vem dos blocos ANTERIORES a ele — igual ao que a tela faz. */
const vigente = blocos.blocos.find((b) => b.origem === 'algoritmo')
const anteriores = blocos.blocos.filter((b) => b.id !== vigente.id)
const ultimaEscalaAnterior = {}
const escalasPorMesAnterior = {}
for (const b of anteriores) for (const t of b.turnos) for (const id of t.pessoas) {
  if (!ultimaEscalaAnterior[id] || t.data > ultimaEscalaAnterior[id]) ultimaEscalaAnterior[id] = t.data
  const m = t.data.slice(0, 7)
  ;(escalasPorMesAnterior[id] ??= {})[m] = (escalasPorMesAnterior[id][m] ?? 0) + 1
}

const comuns = vigente.turnos.filter((t) => !t.santaCeia)
const vagas = comuns.reduce((s, t) => s + t.pessoas.length, 0)
console.log(`  bloco vigente ............. ${vigente.id}`)
console.log(`  turnos .................... ${vigente.turnos.length} (${comuns.length} comuns + ${vigente.turnos.length - comuns.length} Santa Ceia)`)
console.log(`  vagas preenchidas ......... ${vagas}`)
console.log(`  pessoas no elenco ......... ${vigente.elenco.length}`)
console.log(`  piso declarado ............ ${vigente.pisoAlcancado} dia(s)\n`)

console.log('── 1ª RÉGUA · catálogo de regras (a mesma da tela Validação) ──────────────────────')
const rel = validar({ bloco: vigente, pessoas, ultimaEscalaAnterior, config })
for (const r of rel.resultados) {
  const marca = r.status === 'ok' ? '✅' : r.status === 'aviso' ? '⚠️ ' : '🔴'
  console.log(`  ${marca} ${r.id.padEnd(4)} ${r.titulo}`)
}
console.log(`  → ${rel.avaliadas} de ${rel.totalNoCatalogo} regras avaliadas · ${rel.falhasDuras.length} falha(s) dura(s) · ${rel.avisos.length} aviso(s)\n`)

console.log('── 2ª RÉGUA · conferência independente (zero linhas de regras.ts) ─────────────────')
const fora = conferirPorFora(vigente, pessoas, config, ultimaEscalaAnterior, escalasPorMesAnterior)
for (const a of fora.achados) {
  console.log(`  ${a.furos.length ? '🔴' : '✅'} ${a.promessa} — ${a.veredito}`)
  for (const f of a.furos.slice(0, 3)) console.log(`       · ${f}`)
}
console.log(`  → números por fora: ${fora.numeros.turnos} turnos · ${fora.numeros.vagas} vagas · ${fora.numeros.preenchidas} preenchidas · ${fora.numeros.pessoasEscaladas} pessoas · ${fora.numeros.dias} dias\n`)

const reprovou = rel.falhasDuras.length > 0 || fora.comFuro.length > 0
if (reprovou) {
  console.log('🔴 AS RÉGUAS DISCORDAM DO PUBLICADO — o detalhe está acima, nomeado.')
  process.exit(1)
}
console.log('✅ AS DUAS RÉGUAS APROVAM O QUE ESTÁ NO AR — cada regra e cada promessa, nomeada acima.')
