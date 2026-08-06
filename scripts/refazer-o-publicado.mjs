/**
 * 🔁 PORTÃO — o bloco publicado ainda pode ser REFEITO a partir do que ele registra?
 *
 * 🔴 POR QUE ESTE PORTÃO EXISTE. O `ALGORITMO.md` promete, com todas as letras: *"mesma entrada +
 * mesma semente = mesma escala, byte a byte. Quem quiser conferir daqui a um ano consegue regerar
 * exatamente o mesmo resultado."*
 *
 * Essa promessa nunca tinha sido medida contra o dado que está NO AR. Ela é a diferença entre "o
 * gerador é determinístico" (que os testes provam, com entradas de teste) e "**esta escala**, a que
 * os irmãos estão vendo, pode ser refeita" — que é o que alguém precisaria no dia em que perguntar
 * *"por que eu fui escalado neste domingo?"*.
 *
 * O bloco guarda tudo o que é preciso: período, elenco, malha, piso e semente. Este portão pega
 * esses campos, refaz a escala e compara **turno a turno**.
 *
 * ⚠️ ELE VAI FICAR VERMELHO no dia em que o algoritmo mudar de propósito — e isso é o ponto. Nesse
 * dia a promessa de reprodutibilidade se quebra para as escalas já publicadas, e alguém tem de
 * decidir conscientemente: ou se aceita (e se declara aqui), ou se republica. O que não pode é a
 * promessa continuar escrita no documento depois de deixar de valer.
 *
 * Bloco `importado` é isento: ele veio do site antigo, não deste gerador. Isso é declarado, contado
 * e impresso — isenção silenciosa é buraco com outro nome.
 *
 * Uso: node scripts/refazer-o-publicado.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const esbuild = require('esbuild')

const entrada = join(RAIZ, 'node_modules', '.refazer-entrada.ts')
const saida = join(RAIZ, 'node_modules', '.refazer.mjs')
writeFileSync(
  entrada,
  [
    "export * from '../src/dominio/malha'",
    "export * from '../src/dominio/gerador'",
    "export * from '../src/dominio/datas'",
    "export * from '../src/dominio/blocos'",
  ].join(String.fromCharCode(10)),
  'utf8',
)
esbuild.buildSync({ entryPoints: [entrada], outfile: saida, format: 'esm', platform: 'node', bundle: true })
const { construirGrade, gerar, diferencaEmDias, cotaMensalJaPublicada, pisoEntregue } = await import(pathToFileURL(saida).href)

const cfg = JSON.parse(readFileSync(join(RAIZ, 'docs/dados/config.json'), 'utf8'))
const pessoas = JSON.parse(readFileSync(join(RAIZ, 'docs/dados/pessoas.json'), 'utf8')).pessoas
const blocos = JSON.parse(readFileSync(join(RAIZ, 'docs/dados/blocos.json'), 'utf8')).blocos

console.log('🔁 O PUBLICADO PODE SER REFEITO?\n')

const achados = []
let refeitos = 0
const isentos = []

for (const alvo of blocos) {
  if (alvo.origem !== 'algoritmo') {
    isentos.push(`${alvo.id} (origem "${alvo.origem}" — não saiu deste gerador)`)
    continue
  }

  // A fronteira que existia quando ele nasceu: os OUTROS blocos, antes do início dele.
  //
  // 🔴 SÃO DUAS FRONTEIRAS, NÃO UMA. Este portão nasceu (05/08/2026) enxergando só o descanso — a
  // última data de cada irmão — e ficou vermelho no dia em que o gerador passou a receber TAMBÉM a
  // cota mensal já cumprida do outro lado da emenda. O bloco continuava reproduzível; era o
  // refazedor que reconstruía menos entradas do que o gerador consome, e acusava o inocente.
  //
  // A regra que sobra daqui: **entrada nova no gerador é entrada nova aqui, no mesmo passo.** As
  // duas são derivadas da mesma coisa — os outros blocos, olhando só para trás do início deste —,
  // então a promessa de reprodutibilidade continua de pé: nada foi guardado a mais no bloco.
  const fronteira = {}
  for (const b of blocos) {
    if (b.id === alvo.id) continue
    for (const t of b.turnos) {
      if (diferencaEmDias(t.data, alvo.inicio) <= 0) continue
      for (const id of t.pessoas) if (!fronteira[id] || t.data > fronteira[id]) fronteira[id] = t.data
    }
  }
  const cota = cotaMensalJaPublicada(blocos.filter((b) => b.id !== alvo.id), alvo.inicio)

  const grade = construirGrade({
    inicio: alvo.inicio, fim: alvo.fim, malha: alvo.malha,
    capacidadePadrao: cfg.capacidadePadrao, santaCeia: cfg.santaCeia,
  })
  const r = gerar({
    inicio: alvo.inicio, fim: alvo.fim, grade, pessoas, elenco: alvo.elenco,
    malha: alvo.malha, ultimaEscalaAnterior: fronteira, escalasPorMesAnterior: cota,
    ...(alvo.semente == null ? {} : { semente: alvo.semente, candidatos: 3 }),
  })

  if (!r.ok) {
    achados.push({ id: alvo.id, detalhe: `não foi possível refazer: ${r.motivo}` })
    continue
  }
  const igual = JSON.stringify(r.bloco.turnos) === JSON.stringify(alvo.turnos)
  if (!igual) {
    // Onde divergiu, em números — "diferente" sozinho não ajuda ninguém.
    const porChave = new Map(alvo.turnos.map((t) => [`${t.data}|${t.tipo}`, t.pessoas]))
    let diferentes = 0
    let primeiro = null
    for (const t of r.bloco.turnos) {
      const o = porChave.get(`${t.data}|${t.tipo}`)
      if (!o || JSON.stringify(o) !== JSON.stringify(t.pessoas)) {
        diferentes++
        if (!primeiro) primeiro = `${t.data} ${t.tipo}: publicado [${(o ?? []).join(', ')}] · refeito [${t.pessoas.join(', ')}]`
      }
    }
    achados.push({ id: alvo.id, detalhe: `${diferentes} de ${alvo.turnos.length} turnos divergem — ${primeiro}` })
    continue
  }
  /*
    🔴 O PISO DECLARADO É EXATAMENTE O ENTREGUE? — 06/08/2026.

    A sétima auditoria apontou que o declarado pode ser MENOR que o entregue. Com `gerar` cru e
    semente fixa, acontece (1 em 20 medições). Pelo caminho que a tela usa — a cascata de
    `gerarVariasVersoes` — varri 36 combinações de período e semente-base: **zero divergências**. A
    cascata escolhe pelo maior piso, e por isso não sobra folga.

    Cheguei a pôr `piso 5 (entregue: 6)` na tela. **Era ramo inerte** — não renderizaria nunca. A
    medição vive aqui, sobre o bloco que está NO AR, que é o número que alguém lê e repete.

    ⚠️ A regra D "coerência do piso" já cobre a metade perigosa (anunciar MAIS do que entrega). Esta
    checagem cobre a outra: anunciar MENOS, que não engana ninguém sobre risco, mas significa que a
    cascata mudou de comportamento — e isso é notícia.
  */
  const entregue = pisoEntregue(alvo.turnos)
  if (entregue != null && alvo.pisoAlcancado != null && entregue !== alvo.pisoAlcancado) {
    achados.push({
      id: alvo.id,
      detalhe: `o bloco declara piso ${alvo.pisoAlcancado} e ENTREGA ${entregue} — pela cascata os dois batem sempre; se deixaram de bater, o algoritmo de escolha mudou`,
    })
    continue
  }
  if (r.pisoAlcancado !== alvo.pisoAlcancado) {
    achados.push({ id: alvo.id, detalhe: `os turnos batem, mas o piso registrado (${alvo.pisoAlcancado}) difere do refeito (${r.pisoAlcancado})` })
    continue
  }
  refeitos++
  console.log(`  ✅ ${alvo.id}`)
  console.log(`     ${alvo.turnos.length} turnos · piso ${alvo.pisoAlcancado} · semente ${alvo.semente ?? '(guloso puro)'} — idêntico, turno a turno`)
}

console.log('')
console.log(`  blocos refeitos ........... ${refeitos}`)
console.log(`  isentos ................... ${isentos.length}`)
for (const i of isentos) console.log(`     · ${i}`)
console.log(`  divergências .............. ${achados.length}\n`)

for (const a of achados) {
  console.log(`  🔴 ${a.id}`)
  console.log(`     ${a.detalhe}`)
}

if (achados.length) {
  console.log('\n   A escala publicada deixou de ser reproduzível a partir do que ela registra.')
  console.log('   Ou o algoritmo mudou (e aí a promessa do ALGORITMO.md precisa ser revista),')
  console.log('   ou o bloco foi editado à mão sem registrar como.')
  process.exit(1)
}
if (refeitos === 0) {
  console.log('🔴 nenhum bloco foi refeito — não há o que provar, e isso é defeito de população.')
  process.exit(1)
}
console.log('✅ A escala no ar pode ser refeita do zero, a partir do que ela mesma registra.')
