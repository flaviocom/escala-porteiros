/**
 * 🎯 O ENSAIO DO CENÁRIO QUE DEU ORIGEM AO PROJETO.
 *
 * O pedido do Flavio, nas palavras dele:
 *
 *   *"sempre acontece de saírem pessoas da escala e acrescentarem nomes. Essas pessoas têm novas
 *   restrições, e eu preciso redistribuir a escala de acordo com as nossas regras."*
 *
 * A tela que faz isso existe e foi validada ao vivo. Mas **validar a tela não é validar o cenário**:
 * a tela renderiza, os botões respondem, a validação mostra as regras. Nada disso responde à
 * pergunta que importa — *quando alguém sai e alguém entra com restrições novas, a escala se refaz
 * inteira, válida, e o passado fica intocado?*
 *
 * Este ensaio roda o cenário de ponta a ponta, **sem rede e sem credencial**, usando exatamente o
 * mesmo código do produto (compilado na hora, sem cópia paralela). E ele não confia no "não deu
 * erro": mede cada promessa e falha com o número na mão.
 *
 * As 11 promessas verificadas:
 *    1. quem saiu tem ZERO escalas depois do corte
 *    2. quem entrou é escalado
 *  3–6. as restrições dele são respeitadas, uma família por promessa:
 *         dia da semana · turno · teto mensal · ausência
 *    7. o catálogo inteiro passa — nenhuma regra dura violada
 *    8. o passado (antes do corte) fica byte a byte idêntico
 *    9. o distanciamento não desaba: o piso continua ≥ 4 dias
 *   10. a carga continua equilibrada entre quem não tem restrição (amplitude ≤ 2)
 *   11. quem tem teto é aproveitado (≥ 80% da cota)
 *
 * ⚠️ Este cabeçalho dizia **6** e o script media **11** — e dizia "as 15 regras" para um catálogo
 *    de 16. Achado em 05/08/2026, quando o teste de portabilidade apontou que os portões deste
 *    projeto são descritos por fora e nunca por dentro. Documentação de script apodrece igual à
 *    dos documentos: aqui a lista das promessas passou a sair na SAÍDA, que não tem como mentir.
 *
 * Uso: node scripts/ensaio-troca-de-elenco.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)

// Mesmo código do produto, compilado na hora. Cópia paralela é onde as duas versões divergem calado.
const esbuild = (() => { try { return require('esbuild') } catch { return null } })()
if (!esbuild) {
  console.error('🔴 esbuild não encontrado — `npm i -D esbuild`.')
  process.exit(2)
}
const entrada = join(RAIZ, 'node_modules', '.cache-ensaio-entrada.ts')
const saidaJs = join(RAIZ, 'node_modules', '.cache-ensaio.mjs')
writeFileSync(entrada, [
  "export * from '../src/dominio/datas'",
  "export * from '../src/dominio/malha'",
  "export * from '../src/dominio/regras'",
  "export * from '../src/dominio/validacao'",
  "export * from '../src/dominio/gerador'",
].join('\n'), 'utf8')
esbuild.buildSync({ entryPoints: [entrada], outfile: saidaJs, format: 'esm', platform: 'node', bundle: true })
const { construirGrade, MALHA_ATUAL, gerar, validar, resumir, menorIntervalo, formatarBR, diaDaSemana, mesDeData } =
  await import(pathToFileURL(saidaJs).href)

// ---------------------------------------------------------------------------
// O ponto de partida: exatamente o que está publicado
// ---------------------------------------------------------------------------
const pessoas = JSON.parse(readFileSync(join(RAIZ, 'docs/dados/pessoas.json'), 'utf8')).pessoas
const blocos = JSON.parse(readFileSync(join(RAIZ, 'docs/dados/blocos.json'), 'utf8')).blocos
const blocoAtual = blocos.find((b) => b.origem === 'algoritmo')
if (!blocoAtual) { console.error('🔴 Não achei o bloco gerado no blocos.json publicado.'); process.exit(1) }

const CORTE = '2026-10-01' // a partir daqui a escala é refeita; antes disso, nada muda
const FIM = blocoAtual.fim

console.log('ENSAIO — SAI GENTE, ENTRA GENTE, A ESCALA SE REFAZ\n')
console.log(`  bloco atual ......... ${formatarBR(blocoAtual.inicio)} → ${formatarBR(blocoAtual.fim)}`)
console.log(`  corte ............... ${formatarBR(CORTE)}  (antes disso, o passado não se toca)`)
console.log(`  elenco de hoje ...... ${pessoas.filter((p) => p.ativo).length} ativos\n`)

// ---------------------------------------------------------------------------
// A MUDANÇA — quem sai é quem mais aparece (o caso que mais mexe na escala)
// ---------------------------------------------------------------------------
const contagem = new Map()
for (const t of blocoAtual.turnos) for (const id of t.pessoas ?? []) contagem.set(id, (contagem.get(id) ?? 0) + 1)
const QUEM_SAI = [...contagem.entries()].sort((a, b) => b[1] - a[1])[0][0]
const nomeQuemSai = pessoas.find((p) => p.id === QUEM_SAI).nome

/**
 * Quem entra carrega as QUATRO famílias ao mesmo tempo. Uma pessoa com uma restrição só provaria
 * uma família; o cenário do Flavio é justamente o caso difícil — irmão novo com agenda apertada.
 */
const QUEM_ENTRA = {
  id: 'ensaio-irmao-novo',
  nome: 'Irmão Novo Ensaio',
  ativo: true,
  restricoes: {
    diasPermitidos: [0, 3], // só domingo e quarta
    diasProibidos: [6], // nunca sábado (vence `diasPermitidos` se houver conflito)
    turnosPermitidos: ['NOITE'], // só de noite
    tetoMensal: 2, // no máximo 2 por mês
    ausencias: [{ inicio: '2026-11-01', fim: '2026-11-30', motivo: 'viagem' }],
  },
}

console.log('A MUDANÇA')
console.log(`  🔴 SAI  ${nomeQuemSai} (${contagem.get(QUEM_SAI)} turnos no bloco atual — o mais escalado)`)
console.log(`  ✅ ENTRA ${QUEM_ENTRA.nome}`)
console.log('          só dom e qua · nunca sáb · só noite · teto 2/mês · fora o novembro inteiro\n')

const novoElencoPessoas = [
  ...pessoas.map((p) => (p.id === QUEM_SAI ? { ...p, ativo: false } : p)),
  QUEM_ENTRA,
]
const idsAtivos = novoElencoPessoas.filter((p) => p.ativo).map((p) => p.id)

// Fronteira: a última escala de cada um ANTES do corte — inclui os dois blocos.
const fronteira = {}
for (const b of blocos) for (const t of b.turnos) {
  if (t.data >= CORTE) continue
  for (const id of t.pessoas ?? []) if (!fronteira[id] || t.data > fronteira[id]) fronteira[id] = t.data
}

// ---------------------------------------------------------------------------
// A REGERAÇÃO
// ---------------------------------------------------------------------------
// 🔴 A configuração vem do DADO, não dos blocos nem do código — corrigido em 04/08/2026.
//
// A Santa Ceia era deduzida dos turnos já marcados nos blocos, e a malha e a capacidade vinham
// cravadas. Deduzir o calendário do próprio resultado é circular: se a marca se perdesse, o ensaio
// concordaria com o erro em vez de acusá-lo. E é exatamente contra isso que D9 passou a conferir.
const config = JSON.parse(readFileSync(join(RAIZ, 'public/dados/config.json'), 'utf8'))
const santaCeia = config.santaCeia.filter((d) => d >= CORTE)
const grade = construirGrade({
  inicio: CORTE, fim: FIM, malha: config.malhaPadrao,
  capacidadePadrao: config.capacidadePadrao, santaCeia,
})
const r = gerar({
  inicio: CORTE, fim: FIM, grade, pessoas: novoElencoPessoas,
  elenco: idsAtivos, malha: config.malhaPadrao, ultimaEscalaAnterior: fronteira,
})

if (!r.ok) {
  console.error('🔴 NÃO FOI POSSÍVEL GERAR — e este é o comportamento certo se não couber.\n')
  console.error(r.motivo)
  if (r.turnoQueTravou) console.error(`Travou em ${formatarBR(r.turnoQueTravou.data)} ${r.turnoQueTravou.tipo}: faltaram ${r.turnoQueTravou.faltaram}`)
  console.error(`Pisos tentados: ${r.pisosTentados.join(', ')}`)
  process.exit(1)
}
console.log(`✅ ${r.relato}\n`)

// ---------------------------------------------------------------------------
// AS 6 PROMESSAS — cada uma medida, nenhuma presumida
// ---------------------------------------------------------------------------
const provas = []
const provar = (nome, ok, medida) => provas.push({ nome, ok, medida })

// 1 — quem saiu não aparece mais
const restosDoQueSaiu = r.bloco.turnos.filter((t) => t.pessoas.includes(QUEM_SAI))
provar(
  `${nomeQuemSai} saiu: zero escalas depois do corte`,
  restosDoQueSaiu.length === 0,
  restosDoQueSaiu.length === 0 ? '0 turnos' : `🔴 ${restosDoQueSaiu.length} turnos — ${restosDoQueSaiu.map((t) => formatarBR(t.data)).join(', ')}`,
)

// 2 — quem entrou aparece E respeita as quatro famílias
const doNovo = r.bloco.turnos.filter((t) => t.pessoas.includes(QUEM_ENTRA.id))
provar('o irmão novo foi escalado', doNovo.length > 0, `${doNovo.length} turnos`)

const diasErrados = doNovo.filter((t) => ![0, 3].includes(diaDaSemana(t.data)))
provar('família 1 — dia da semana (só dom e qua)', diasErrados.length === 0,
  diasErrados.length === 0 ? 'nenhum fora' : `🔴 ${diasErrados.map((t) => formatarBR(t.data)).join(', ')}`)

const turnosErrados = doNovo.filter((t) => t.tipo !== 'NOITE')
provar('família 2 — turno (só noite)', turnosErrados.length === 0,
  turnosErrados.length === 0 ? 'nenhum fora' : `🔴 ${turnosErrados.map((t) => `${formatarBR(t.data)} ${t.tipo}`).join(', ')}`)

const porMes = new Map()
for (const t of doNovo) porMes.set(mesDeData(new Date(`${t.data}T12:00:00`)), (porMes.get(mesDeData(new Date(`${t.data}T12:00:00`))) ?? 0) + 1)
const mesesEstourados = [...porMes.entries()].filter(([, n]) => n > 2)
provar('família 3 — teto mensal (máx. 2)', mesesEstourados.length === 0,
  mesesEstourados.length === 0
    ? [...porMes.entries()].map(([m, n]) => `${m}:${n}`).join(' · ') || 'nenhum mês'
    : `🔴 ${mesesEstourados.map(([m, n]) => `${m} com ${n}`).join(', ')}`)

const naAusencia = doNovo.filter((t) => t.data >= '2026-11-01' && t.data <= '2026-11-30')
provar('família 4 — ausência (novembro inteiro)', naAusencia.length === 0,
  naAusencia.length === 0 ? 'nenhum turno em novembro' : `🔴 ${naAusencia.map((t) => formatarBR(t.data)).join(', ')}`)

// 3 — o catálogo inteiro. O número NÃO é escrito à mão: sai de `rel.totalNoCatalogo`. Regra nova
// entra na conta sozinha — número decorado é como o texto passa a mentir sem ninguém notar.
const rel = validar({ bloco: r.bloco, pessoas: novoElencoPessoas, ultimaEscalaAnterior: fronteira, config })
provar(`as ${rel.totalNoCatalogo} regras do catálogo`, rel.falhasDuras.length === 0,
  `${rel.avaliadas} de ${rel.totalNoCatalogo} avaliadas · ${rel.falhasDuras.length} falha(s) dura(s) · ${rel.avisos.length} aviso(s)`)

// 4 — o passado intocado. A prova forte: comparação byte a byte do que existia antes do corte.
const antesPublicado = JSON.stringify(
  blocos.flatMap((b) => b.turnos.filter((t) => t.data < CORTE)).sort((a, b) => (a.data + a.tipo).localeCompare(b.data + b.tipo)),
)
const antesDepois = JSON.stringify(
  [...blocos.flatMap((b) => b.turnos.filter((t) => t.data < CORTE)), ...r.bloco.turnos.filter((t) => t.data < CORTE)]
    .sort((a, b) => (a.data + a.tipo).localeCompare(b.data + b.tipo)),
)
/*
  🔴 COBERTURA — a promessa que faltava, e que as outras não cobrem.

  Em 06/08/2026 injetei um mutante que jogava fora METADE dos turnos gerados. O ensaio reprovou
  (4 promessas caíram), mas **cinco delas passaram intactas**: as quatro famílias de restrição e o
  distanciamento. É da natureza delas — são propriedades do tipo *"nada fora do permitido"*, e meia
  escala também não tem nada fora do permitido. **Propriedade negativa não mede ausência.**

  Quem segurou a barra foram as regras do catálogo (D12 `Vaga`) e o equilíbrio. Depender disso é
  depender de outro portão — e o dia em que aquele mudar de escopo, este fica cego sem avisar.

  Então a cobertura vira promessa PRÓPRIA: todo dia de culto do período tem turno, e o total bate com
  a grade que foi pedida.
*/
const turnosEsperados = grade.length
const turnosEntregues = r.bloco.turnos.length
provar(
  'cobertura: todo turno da grade foi entregue',
  turnosEntregues === turnosEsperados,
  `${turnosEntregues} de ${turnosEsperados} turnos da grade`,
)

const diasDaGrade = new Set(grade.map((g) => g.data))
const diasEntregues = new Set(r.bloco.turnos.map((t) => t.data))
const diasSemNada = [...diasDaGrade].filter((d) => !diasEntregues.has(d))
provar(
  'cobertura: nenhum dia de culto ficou sem turno',
  diasSemNada.length === 0,
  diasSemNada.length ? `${diasSemNada.length} dia(s) vazios, o 1º em ${formatarBR(diasSemNada[0])}` : `${diasDaGrade.size} dias, todos com turno`,
)

provar('o passado ficou intocado (byte a byte)', antesPublicado === antesDepois,
  antesPublicado === antesDepois
    ? `${JSON.parse(antesPublicado).length} turnos antes do corte, idênticos`
    : '🔴 o bloco novo invadiu datas anteriores ao corte')

// 5 — o distanciamento não desabou
const pisos = novoElencoPessoas
  .filter((p) => p.ativo)
  .map((p) => menorIntervalo({ bloco: r.bloco, pessoas: novoElencoPessoas, ultimaEscalaAnterior: fronteira, config }, p.id))
  .filter((v) => v != null)
const menorPiso = pisos.length ? Math.min(...pisos) : null
provar('o distanciamento não desabou (≥ 4 dias)', menorPiso != null && menorPiso >= 4,
  `menor intervalo: ${menorPiso} dia(s) · piso descoberto: ${r.bloco.pisoAlcancado}`)

// 6 — carga: DUAS medidas, porque uma só mentia
//
// 🔴 A primeira versão media a amplitude bruta e reprovava com "6 a 12 turnos". Não era defeito: o
// Thiago tem teto de 2/mês, então o máximo dele em 3 meses **é 6** — ele estava no limite, não
// sub-escalado. Comparar a carga de quem tem teto com a de quem não tem é comparar coisas
// incomparáveis, e produz um vermelho que faz consertar o que não está quebrado.
//
// As duas perguntas que valem, separadas:
//   a) entre quem tem a MESMA disponibilidade, a carga é parecida?
//   b) quem tem teto está sendo aproveitado, ou o gerador o esqueceu?
const semRestricao = novoElencoPessoas.filter(
  (p) => p.ativo && p.restricoes?.tetoMensal == null && !p.restricoes?.diasPermitidos
    && !p.restricoes?.turnosPermitidos && !p.restricoes?.ausencias?.length,
)
const cargasLivres = semRestricao.map((p) => r.bloco.turnos.filter((t) => t.pessoas.includes(p.id)).length)
const amplitude = Math.max(...cargasLivres) - Math.min(...cargasLivres)
provar(`a) equilíbrio entre os ${semRestricao.length} sem restrição (amplitude ≤ 2)`, amplitude <= 2,
  `${Math.min(...cargasLivres)} a ${Math.max(...cargasLivres)} turnos — amplitude ${amplitude}`)

/** Cota de quem tem teto: `tetoMensal` × meses em que ele não está ausente o mês inteiro. */
const mesesDoBloco = [...new Set(r.bloco.turnos.map((t) => t.data.slice(0, 7)))].sort()
const comTeto = novoElencoPessoas.filter((p) => p.ativo && p.restricoes?.tetoMensal != null)
const aproveitamento = comTeto.map((p) => {
  const mesesUteis = mesesDoBloco.filter(
    (m) => !(p.restricoes.ausencias ?? []).some((a) => a.inicio <= `${m}-01` && a.fim >= `${m}-28`),
  ).length
  const cota = p.restricoes.tetoMensal * mesesUteis
  const usou = r.bloco.turnos.filter((t) => t.pessoas.includes(p.id)).length
  return { nome: p.nome.split(' ')[0], usou, cota, pct: cota ? (usou / cota) * 100 : 100 }
})
const ociosos = aproveitamento.filter((a) => a.pct < 80)
provar('b) quem tem teto é aproveitado (≥ 80% da cota)', ociosos.length === 0,
  aproveitamento.map((a) => `${a.nome} ${a.usou}/${a.cota}`).join(' · '))

// ---------------------------------------------------------------------------
console.log('AS PROMESSAS, MEDIDAS\n')
for (const p of provas) console.log(`  ${p.ok ? '✅' : '🔴'} ${p.nome.padEnd(46)} ${p.medida}`)

const falhas = provas.filter((p) => !p.ok)
console.log(`\n  ${provas.length - falhas.length} de ${provas.length} promessas cumpridas\n`)

if (falhas.length) {
  console.error('🔴 O cenário que deu origem ao projeto NÃO se cumpre. Detalhe acima.\n')
  process.exit(1)
}

console.log('─'.repeat(70))
console.log('\n✅ Sai gente, entra gente com quatro restrições, e a escala se refaz inteira:')
console.log('   válida pelo catálogo inteiro, equilibrada, distante — e com o passado intacto.')
console.log('   É o pedido original, medido e não presumido.\n')
