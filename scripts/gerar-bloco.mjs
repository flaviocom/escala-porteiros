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
    "export * from '../src/dominio/blocos'",
  ].join('\n'),
  'utf8',
)
esbuild.buildSync({ entryPoints: [entrada], outfile: saidaJs, format: 'esm', platform: 'node', bundle: true })

const dominio = await import(pathToFileURL(saidaJs).href)
const { construirGrade, gerarVariasVersoes, validar, resumir, menorIntervalo, formatarBR, diferencaEmDias,
  montarBlocosParaPublicar, conferirPassadoPreservado } = dominio

// ---------------------------------------------------------------------------
const args = process.argv.slice(2)
const arg = (n, padrao) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : padrao }
const DE = arg('--de', '2026-08-05')
const ATE = arg('--ate', '2026-12-30')
const ESCREVER = args.includes('--escrever')

const pessoasArq = JSON.parse(readFileSync(join(RAIZ, 'public/dados/pessoas.json'), 'utf8'))
const blocosArq = JSON.parse(readFileSync(join(RAIZ, 'public/dados/blocos.json'), 'utf8'))
const pessoas = pessoasArq.pessoas
/*
  🔴 TODOS OS BLOCOS ANTERIORES, NÃO SÓ O PRIMEIRO — achado da auditoria externa de 05/08/2026.

  Isto era `blocosArq.blocos[0]`, e a gravação montava `[truncado, novo]`. Com dois blocos
  funcionava; **no dia em que houvesse três, rodar este script apagaria o do meio** — passado
  publicado, reescrito, em silêncio. E a tela já produz N blocos (`[...anteriores, novo]`), então o
  terceiro é questão de tempo.

  Agora todos os anteriores sobrevivem; só o ÚLTIMO é truncado na véspera do novo, que é o único que
  se sobrepõe ao período que vai ser gerado.
*/
const anteriores = blocosArq.blocos.filter((b) => b.inicio < DE)
const historico = anteriores[anteriores.length - 1] ?? blocosArq.blocos[0]

// 🔴 A CONFIGURAÇÃO VEM DO DADO, NUNCA DO CÓDIGO — corrigido em 04/08/2026 por auditoria.
//
// Até aqui este script trazia a Santa Ceia cravada (`['2026-08-16']`), a capacidade cravada (`3`) e
// a malha importada do código-fonte (`MALHA_ATUAL`). Os três batiam com `config.json` — por
// coincidência, não por construção.
//
// É a fonte dupla que o projeto inteiro existe para não ter: `malha.ts:8` diz, com todas as
// letras, *"aqui a malha é dado; trocar dias e turnos é editar configuração, não código"*. E este é
// o script que de fato escreveu o `blocos.json` publicado. Bastaria o Flavio cadastrar a Santa
// Ceia do ano que vem em `config.json` e rodar isto para conferir: geraria contra o dado ANTIGO,
// em silêncio, que é a forma exata do defeito que originou o projeto (o site antigo tem a Ceia em
// 07/06 porque a data estava no código).
//
// A tela nunca teve esse problema: o `Admin` sempre leu `dados.config`.
const config = JSON.parse(readFileSync(join(RAIZ, 'public/dados/config.json'), 'utf8'))
const SANTA_CEIA = config.santaCeia
const MALHA = config.malhaPadrao
const CAPACIDADE = config.capacidadePadrao

/**
 * Fronteira: a última escala de cada um ANTES do início do bloco novo.
 *
 * 🔴 O `t.data < DE` entrou em 05/08/2026, e a ausência dele era um defeito latente que só apareceu
 * quando o bloco congelado passou a cobrir o FUTURO.
 *
 * Antes, isto pegava o MAIOR `t.data` do bloco anterior, sem olhar a data de corte. Enquanto o
 * congelado terminava no passado, dava no mesmo. Quando ele passou a ir até 31/12 — para preservar a
 * escala vigente inteira, como o Flavio pediu —, a "última escala" de cada pessoa passou a ser uma
 * data À FRENTE do bloco novo. Resultado: todo mundo parecia ter servido há pouco, ninguém ficava
 * elegível, e o gerador declarava "não foi possível" em 08/08 mesmo com 16 pessoas livres.
 *
 * ⚠️ Falha HONESTA (o gerador disse que não deu, em vez de entregar escala pela metade), mas com
 * diagnóstico que apontava para o lugar errado: parecia falta de gente, era data contaminada. A tela
 * já filtrava certo (o `useMemo` da fronteira, em `AbaGerar`); era só este script que não.
 */
/*
  🔴 TODOS OS BLOCOS, NÃO SÓ O ÚLTIMO — segundo achado da mesma auditoria, 05/08/2026.

  A unificação da manhã pegou a MONTAGEM dos blocos e deixou a FRONTEIRA como fonte dupla, no mesmo
  arquivo: aqui ela varria só `historico.turnos` — o último bloco anterior —, enquanto a tela varre
  `dados.blocos` inteiro.

  Com três blocos publicados, quem teve a última escala num bloco do MEIO ficaria sem fronteira, e o
  gerador poderia escalá-lo no dia seguinte ao turno anterior — que é o defeito de distanciamento
  que originou este projeto.

  O comentário logo acima já dizia "TODOS OS BLOCOS ANTERIORES, NÃO SÓ O PRIMEIRO". Ele valia para a
  montagem, e não tinha sido aplicado aqui.
*/
const fronteira = {}
for (const b of blocosArq.blocos) {
  for (const t of b.turnos) {
    if (!(t.data < DE)) continue
    for (const id of t.pessoas) if (!fronteira[id] || t.data > fronteira[id]) fronteira[id] = t.data
  }
}

console.log(`GERAÇÃO DO BLOCO ${formatarBR(DE)} → ${formatarBR(ATE)}\n`)
// Diz de ONDE veio cada número: o log é a única chance de alguém notar que a fonte mudou.
console.log(`Configuração lida de public/dados/config.json`)
console.log(`Santa Ceia cadastrada: ${SANTA_CEIA.length ? SANTA_CEIA.map(formatarBR).join(', ') : '(nenhuma)'}`)
console.log(`Capacidade padrão: ${CAPACIDADE} · malha com ${MALHA.regras.length} regra(s)`)
console.log(`Elenco: ${pessoas.filter((p) => p.ativo).length} pessoas\n`)

// `construirGrade` recusa data que não existe no calendário. Aqui as datas vêm de `--de`/`--ate`, ou
// seja, de quem digitou: sem isto, `--de 2027-02-31` devolvia um rastro de pilha do Node com a
// mensagem em português enterrada no meio.
let grade
try {
  grade = construirGrade({ inicio: DE, fim: ATE, malha: MALHA, capacidadePadrao: CAPACIDADE, santaCeia: SANTA_CEIA })
} catch (e) {
  console.error(`🔴 ${e instanceof Error ? e.message : String(e)}`)
  process.exit(1)
}
/*
  🔴 O MESMO CAMINHO DA TELA — corrigido em 05/08/2026.

  Este script escrevia com `gerar()` puro (guloso), enquanto a área administrativa usa
  `gerarVariasVersoes()`: monta OITO escalas internamente e entrega a melhor, comparando primeiro o
  piso de distanciamento e, no empate, o índice de Jain (equilíbrio de carga).

  Era fonte dupla silenciosa. O `blocos.json` publicado saía de um caminho **pior** que o da tela, e
  ninguém veria a diferença: as duas escalas passam nas 17 regras — só que uma distribui melhor que
  a outra. É a mesma classe de defeito que fez este script trazer a Santa Ceia cravada até 04/08.

  A primeira das oito é sempre o guloso puro, então o resultado nunca fica PIOR do que era.
*/
const escolha = gerarVariasVersoes({
  inicio: DE, fim: ATE, grade, pessoas,
  elenco: pessoas.filter((p) => p.ativo).map((p) => p.id),
  malha: MALHA,
  ultimaEscalaAnterior: fronteira,
})
const r = escolha.melhor

console.log(`VERSÕES INTERNAS COMPARADAS: ${escolha.versoes.length} (${escolha.descartadas} não fecharam)`)
for (const [i, v] of escolha.versoes.entries()) {
  const marca = v.resultado === escolha.melhor ? '→' : ' '
  const como = v.semente == null ? 'guloso puro (sem semente)' : `semente ${v.semente}`
  console.log(`  ${marca} versão ${i + 1} (${como}): ` +
    (v.resultado.ok ? `piso ${v.resultado.bloco.pisoAlcancado} · Jain ${v.jain.toFixed(4)}` : 'não fechou'))
}
console.log()

if (!r.ok) {
  console.error('🔴 NÃO FOI POSSÍVEL GERAR\n')
  console.error(r.motivo)
  if (r.turnoQueTravou) console.error(`\nTravou em ${formatarBR(r.turnoQueTravou.data)} ${r.turnoQueTravou.tipo}: faltaram ${r.turnoQueTravou.faltaram}`)
  console.error(`\nPisos tentados: ${r.pisosTentados.join(', ')}`)
  process.exit(1)
}

console.log('✅ ' + r.relato + '\n')

const ctx = { bloco: r.bloco, pessoas, ultimaEscalaAnterior: fronteira, config }
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
  /*
    🔴 A MESMA FUNÇÃO DA TELA — unificada em 05/08/2026, por auditoria externa.

    Este script montava `[truncado, r.bloco]` a partir de `blocos[0]`, e apagaria o bloco do meio
    assim que houvesse três. A tela sempre fez certo. Duas implementações da mesma regra, e a que
    errava era a que ninguém estava olhando.
  */
  const novo = { versao: 1, blocos: montarBlocosParaPublicar(blocosArq.blocos, r.bloco) }

  const conta = conferirPassadoPreservado(blocosArq.blocos, novo.blocos, { inicio: DE, fim: ATE })
  if (!conta.ok) {
    console.error(`
🔴 PERDA DE ESCALA PUBLICADA: fora do período ${DE}→${ATE} havia ${conta.antes} turno(s); depois de montar, ${conta.depois}.`)
    console.error(`   Dias que sumiriam: ${conta.perdidos.slice(0, 8).join(', ')}${conta.perdidos.length > 8 ? ` (+${conta.perdidos.length - 8})` : ''}`)
    console.error('   Nada foi gravado. Isto é passado sendo reescrito, e o produto promete que isso não acontece.')
    process.exit(3)
  }
  console.log(`
  blocos no arquivo ............... ${novo.blocos.length}`)
  console.log(`  escala publicada preservada ..... ${conta.depois} de ${conta.antes} turno(s) fora do período gerado`)

  const conteudo = JSON.stringify(novo, null, 2) + '\n'
  for (const pasta of ['public/dados', 'docs/dados']) {
    writeFileSync(join(RAIZ, pasta, 'blocos.json'), conteudo, 'utf8')
  }
  console.log('\n✅ blocos.json atualizado nas DUAS pastas (histórico truncado + bloco novo)')
} else {
  console.log('\n(simulação — use --escrever para gravar)')
}
