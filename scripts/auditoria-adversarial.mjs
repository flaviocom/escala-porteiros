/**
 * 🔍 AUDITORIA ADVERSARIAL — mandado de ACHAR DEFEITO, não de confirmar.
 *
 * ⚠️ LIMITE DECLARADO, e ele é estrutural. Esta auditoria é feita por quem escreveu o código, e o
 * próprio método do Flavio diz por que isso não basta: *"quem escreveu carrega os mesmos pontos
 * cegos ao testá-lo"*. Num dia, três auditores independentes acharam 23 defeitos que a
 * autoverificação não tinha visto.
 *
 * O que isto **é**: um ataque sistemático aos pontos onde este projeto tem mais chance de estar
 * errado, com infrator injetado e medição — não leitura de código.
 * O que isto **não é**: substituto de auditor independente. Fica registrado como pendência.
 *
 * Uso: node scripts/auditoria-adversarial.mjs
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const esbuild = require('esbuild')

// Compila o domínio para atacá-lo com o MESMO código que roda em produção.
const entrada = join(RAIZ, 'node_modules', '.auditoria-entrada.ts')
const saida = join(RAIZ, 'node_modules', '.auditoria.mjs')
require('node:fs').writeFileSync(
  entrada,
  [
    ...['datas', 'malha', 'regras', 'validacao', 'gerador'].map(
      (m) => `export * from '../src/dominio/${m}'`,
    ),
    // A ponte para a interface entra no pacote atacado: foi lá que nasceu o defeito de
    // 04/08/2026 — uma regra do domínio ("nunca apagar quem saiu") violada três camadas
    // acima, na tela, onde nenhum teste de domínio alcançava.
    "export { BROTHERS, definirPessoas } from '../src/types/scheduler'",
  ].join('\n'),
  'utf8',
)
esbuild.buildSync({ entryPoints: [entrada], outfile: saida, format: 'esm', platform: 'node', bundle: true })
const D = await import(pathToFileURL(saida).href)

const achados = []
const ok = []
function conferir(frente, pergunta, fn) {
  try {
    const r = fn()
    if (r.defeito) achados.push({ frente, pergunta, ...r })
    else ok.push({ frente, pergunta, detalhe: r.detalhe })
  } catch (e) {
    achados.push({ frente, pergunta, defeito: true, detalhe: `a própria checagem quebrou: ${e.message}` })
  }
}

const pessoa = (id, r = {}) => ({ id, nome: id, ativo: true, restricoes: r })
const turno = (data, tipo, pessoas, extras = {}) => ({ data, tipo, pessoas, capacidade: 3, ...extras })
const bloco = (turnos, elenco, piso = null) => ({
  id: 'auditoria', inicio: turnos[0]?.data ?? '2026-09-01', fim: turnos.at(-1)?.data ?? '2026-09-30',
  geradoEm: '2026-08-04', origem: 'algoritmo', pisoAlcancado: piso, elenco,
  malha: { regras: [] }, turnos,
})

// ═══ FRENTE 1 — a validação pode ser enganada? ═════════════════════════════
const F1 = 'validação'

conferir(F1, 'turno com gente A MAIS passa?', () => {
  const ps = [pessoa('a'), pessoa('b'), pessoa('c'), pessoa('d')]
  const rel = D.validar({
    bloco: bloco([turno('2026-09-06', 'NOITE', ['a', 'b', 'c', 'd'])], ['a', 'b', 'c', 'd']),
    pessoas: ps, ultimaEscalaAnterior: {},
  })
  return rel.aprovada
    ? { defeito: true, detalhe: '4 pessoas num turno de 3 vagas foi APROVADO — D1 só olha "menor que"' }
    : { detalhe: 'reprovado corretamente' }
})

conferir(F1, 'pessoa repetida DENTRO do mesmo turno passa?', () => {
  const ps = [pessoa('a'), pessoa('b')]
  const rel = D.validar({
    bloco: bloco([turno('2026-09-06', 'NOITE', ['a', 'a', 'b'])], ['a', 'b']),
    pessoas: ps, ultimaEscalaAnterior: {},
  })
  return rel.aprovada
    ? { defeito: true, detalhe: 'a mesma pessoa DUAS VEZES no mesmo turno foi aprovada' }
    : { detalhe: 'reprovado' }
})

conferir(F1, 'pessoa INATIVA escalada passa?', () => {
  const ps = [pessoa('a'), pessoa('b'), { ...pessoa('c'), ativo: false }]
  const rel = D.validar({
    bloco: bloco([turno('2026-09-06', 'NOITE', ['a', 'b', 'c'])], ['a', 'b', 'c']),
    pessoas: ps, ultimaEscalaAnterior: {},
  })
  return rel.aprovada
    ? { defeito: true, detalhe: 'pessoa DESATIVADA escalada foi aprovada — D8 confere o elenco do bloco, não o campo ativo' }
    : { detalhe: 'reprovado' }
})

conferir(F1, 'lista de dias permitidos VAZIA é tratada como "todos"?', () => {
  const ps = [pessoa('a', { diasPermitidos: [] }), pessoa('b'), pessoa('c')]
  const rel = D.validar({
    bloco: bloco([turno('2026-09-06', 'NOITE', ['a', 'b', 'c'])], ['a', 'b', 'c']),
    pessoas: ps, ultimaEscalaAnterior: {},
  })
  return rel.aprovada
    ? { defeito: true, detalhe: 'lista VAZIA deveria significar "nenhum dia", e foi tratada como "sem restrição"' }
    : { detalhe: 'lista vazia barra corretamente' }
})

conferir(F1, 'ausência com fim ANTES do início barra alguém indevidamente?', () => {
  const ps = [pessoa('a', { ausencias: [{ inicio: '2026-09-20', fim: '2026-09-10' }] }), pessoa('b'), pessoa('c')]
  const rel = D.validar({
    bloco: bloco([turno('2026-09-15', 'NOITE', ['a', 'b', 'c'])], ['a', 'b', 'c']),
    pessoas: ps, ultimaEscalaAnterior: {},
  })
  return rel.aprovada
    ? { detalhe: 'intervalo invertido não barra ninguém (comportamento defensável)' }
    : { defeito: true, detalhe: 'intervalo INVERTIDO barrou alguém — a tela precisa impedir isso na entrada' }
})

// ═══ FRENTE 2 — o gerador cumpre o que declara? ════════════════════════════
const F2 = 'gerador'

conferir(F2, 'com elenco no limite, o piso declarado é real?', () => {
  const ps = Array.from({ length: 6 }, (_, i) => pessoa(`p${i}`))
  const grade = D.construirGrade({ inicio: '2026-09-01', fim: '2026-10-31', malha: D.MALHA_ATUAL, capacidadePadrao: 3 })
  const r = D.gerar({ inicio: '2026-09-01', fim: '2026-10-31', grade, pessoas: ps, elenco: ps.map((p) => p.id), malha: D.MALHA_ATUAL })
  if (!r.ok) return { detalhe: `não gerou com 6 pessoas, e disse por quê (correto)` }
  const ctx = { bloco: r.bloco, pessoas: ps, ultimaEscalaAnterior: {} }
  const abaixo = ps.filter((p) => {
    const m = D.menorIntervalo(ctx, p.id)
    return m != null && m < r.pisoAlcancado
  })
  return abaixo.length
    ? { defeito: true, detalhe: `${abaixo.length} pessoa(s) abaixo do piso declarado de ${r.pisoAlcancado}` }
    : { detalhe: `piso ${r.pisoAlcancado} é real para as 6 pessoas` }
})

conferir(F2, 'elenco VAZIO trava ou devolve escala vazia em silêncio?', () => {
  const grade = D.construirGrade({ inicio: '2026-09-01', fim: '2026-09-30', malha: D.MALHA_ATUAL, capacidadePadrao: 3 })
  const r = D.gerar({ inicio: '2026-09-01', fim: '2026-09-30', grade, pessoas: [], elenco: [], malha: D.MALHA_ATUAL })
  return r.ok
    ? { defeito: true, detalhe: 'gerou com elenco VAZIO — deveria declarar que não foi possível' }
    : { detalhe: 'declarou que não foi possível, com o turno que travou' }
})

conferir(F2, 'todo mundo ausente no período: declara ou finge?', () => {
  const ps = Array.from({ length: 16 }, (_, i) =>
    pessoa(`p${i}`, { ausencias: [{ inicio: '2026-09-01', fim: '2026-09-30' }] }))
  const grade = D.construirGrade({ inicio: '2026-09-01', fim: '2026-09-30', malha: D.MALHA_ATUAL, capacidadePadrao: 3 })
  const r = D.gerar({ inicio: '2026-09-01', fim: '2026-09-30', grade, pessoas: ps, elenco: ps.map((p) => p.id), malha: D.MALHA_ATUAL })
  return r.ok
    ? { defeito: true, detalhe: 'gerou escala com TODOS ausentes' }
    : { detalhe: 'declarou impossível' }
})

conferir(F2, 'período de um dia só quebra?', () => {
  const ps = Array.from({ length: 16 }, (_, i) => pessoa(`p${i}`))
  const grade = D.construirGrade({ inicio: '2026-09-06', fim: '2026-09-06', malha: D.MALHA_ATUAL, capacidadePadrao: 3 })
  const r = D.gerar({ inicio: '2026-09-06', fim: '2026-09-06', grade, pessoas: ps, elenco: ps.map((p) => p.id), malha: D.MALHA_ATUAL })
  return r.ok && r.bloco.turnos.length === 2
    ? { detalhe: 'um domingo isolado gera manhã + noite' }
    : { defeito: true, detalhe: `período de 1 dia devolveu ${r.ok ? r.bloco.turnos.length + ' turnos' : 'falha'}` }
})

conferir(F2, 'a fronteira é respeitada mesmo com o elenco apertado?', () => {
  const ps = Array.from({ length: 16 }, (_, i) => pessoa(`p${i}`))
  const grade = D.construirGrade({ inicio: '2026-09-01', fim: '2026-09-30', malha: D.MALHA_ATUAL, capacidadePadrao: 3 })
  const fronteira = Object.fromEntries(ps.map((p) => [p.id, '2026-08-31']))
  const r = D.gerar({
    inicio: '2026-09-01', fim: '2026-09-30', grade, pessoas: ps,
    elenco: ps.map((p) => p.id), malha: D.MALHA_ATUAL, ultimaEscalaAnterior: fronteira,
  })
  if (!r.ok) return { detalhe: 'com todos trabalhando na véspera, declarou impossível (correto)' }
  const ctx = { bloco: r.bloco, pessoas: ps, ultimaEscalaAnterior: fronteira }
  const violando = ps.filter((p) => {
    const m = D.menorIntervalo(ctx, p.id)
    return m != null && m < r.pisoAlcancado
  })
  return violando.length
    ? { defeito: true, detalhe: `${violando.length} pessoa(s) violam o piso considerando a fronteira` }
    : { detalhe: `piso ${r.pisoAlcancado} respeitado inclusive contra a véspera` }
})

// ═══ FRENTE 3 — o que está publicado bate com o que está no ar? ═══════════
const F3 = 'dados publicados'

conferir(F3, 'os dois arquivos de dados (public e docs) são iguais?', () => {
  const a = readFileSync(join(RAIZ, 'public/dados/blocos.json'), 'utf8')
  const b = readFileSync(join(RAIZ, 'docs/dados/blocos.json'), 'utf8')
  return a === b
    ? { detalhe: 'idênticos' }
    : { defeito: true, detalhe: 'public/dados e docs/dados DIVERGEM — o site serviria o antigo' }
})

conferir(F3, 'a escala publicada passa na própria validação?', () => {
  const blocos = JSON.parse(readFileSync(join(RAIZ, 'docs/dados/blocos.json'), 'utf8')).blocos
  const pessoas = JSON.parse(readFileSync(join(RAIZ, 'docs/dados/pessoas.json'), 'utf8')).pessoas
  const problemas = []
  for (let i = 0; i < blocos.length; i++) {
    const b = blocos[i]
    const fronteira = {}
    for (const ant of blocos.slice(0, i)) {
      for (const t of ant.turnos) for (const id of t.pessoas) {
        if (!fronteira[id] || t.data > fronteira[id]) fronteira[id] = t.data
      }
    }
    const rel = D.validar({ bloco: b, pessoas, ultimaEscalaAnterior: fronteira })
    if (!rel.aprovada) problemas.push(`${b.id}: ${rel.falhasDuras.map((f) => f.id).join(', ')}`)
  }
  return problemas.length
    ? { defeito: true, detalhe: `a escala NO AR reprova: ${problemas.join(' · ')}` }
    : { detalhe: `${blocos.length} bloco(s) publicados passam nas 15 regras` }
})

conferir(F3, 'há buraco ou sobreposição entre os blocos?', () => {
  const blocos = JSON.parse(readFileSync(join(RAIZ, 'docs/dados/blocos.json'), 'utf8')).blocos
    .slice().sort((a, b) => (a.inicio < b.inicio ? -1 : 1))
  const problemas = []
  for (let i = 1; i < blocos.length; i++) {
    const gap = D.diferencaEmDias(blocos[i - 1].fim, blocos[i].inicio)
    if (gap > 1) problemas.push(`buraco de ${gap - 1} dia(s) entre ${blocos[i - 1].fim} e ${blocos[i].inicio}`)
    if (gap < 1) problemas.push(`sobreposição entre ${blocos[i - 1].id} e ${blocos[i].id}`)
  }
  return problemas.length
    ? { defeito: true, detalhe: problemas.join(' · ') }
    : { detalhe: 'os blocos se emendam sem buraco nem sobreposição' }
})

conferir(F3, '16/08 está mesmo vazio no dado publicado?', () => {
  const t = JSON.parse(readFileSync(join(RAIZ, 'docs/dados/blocos.json'), 'utf8'))
    .blocos.flatMap((b) => b.turnos).filter((x) => x.data === '2026-08-16')
  if (t.length !== 1) return { defeito: true, detalhe: `16/08 tem ${t.length} turno(s), esperado 1` }
  return t[0].santaCeia && t[0].pessoas.length === 0
    ? { detalhe: 'um marcador de Santa Ceia, sem ninguém' }
    : { defeito: true, detalhe: `16/08 com ${t[0].pessoas.length} pessoa(s)` }
})

// ═══ FRENTE 4 — código produzido e não ligado ══════════════════════════════
const F4 = 'código morto'

/**
 * 🔴 A PRIMEIRA VERSÃO DESTE DETECTOR ERA FROUXA — acusou 8 funções, quase todas inocentes.
 *
 * Ela ignorava dois consumidores legítimos: o **próprio arquivo** (uma função pode ser exportada e
 * usada ao lado, como `lerDadosNoCommit` dentro de `reverterPara`) e os **testes** (`ehDataValida` e
 * `pisoTeorico` existem justamente para serem testados).
 *
 * Régua frouxa não é conservadora: é **ruidosa**. E ruído em portão é o que faz alguém desligá-lo —
 * levando junto a proteção. O que sobra depois de contar direito é o achado de verdade.
 */
conferir(F4, 'alguma função exportada não tem consumidor NENHUM (nem teste, nem o próprio arquivo)?', () => {
  const arquivos = []
  ;(function andar(dir) {
    for (const n of readdirSync(dir)) {
      const c = join(dir, n)
      if (statSync(c).isDirectory()) andar(c)
      else if (['.ts', '.tsx'].includes(extname(c))) arquivos.push(c)
    }
  })(join(RAIZ, 'src'))

  const fontes = arquivos.map((a) => ({ caminho: a, texto: readFileSync(a, 'utf8') }))
  const orfas = []
  for (const f of fontes) {
    if (f.caminho.endsWith('.test.ts')) continue
    for (const m of f.texto.matchAll(/export (?:async )?function (\w+)/g)) {
      const nome = m[1]
      // Mais de uma ocorrência no próprio arquivo = a declaração + pelo menos um uso.
      const noProprio = (f.texto.match(new RegExp(`\\b${nome}\\b`, 'g')) ?? []).length > 1
      const noutro = fontes.some(
        (o) => o.caminho !== f.caminho && new RegExp(`\\b${nome}\\b`).test(o.texto),
      )
      if (!noProprio && !noutro) orfas.push(`${f.caminho.replace(RAIZ, '').replace(/\\/g, '/')}:${nome}`)
    }
  }
  return orfas.length
    ? { defeito: true, detalhe: `sem consumidor NENHUM: ${orfas.join(', ')}` }
    : { detalhe: 'toda função exportada é usada — pelo próprio arquivo, por outro, ou por teste' }
})

// ═══ FRENTE 5 — os portões mordem mesmo? ═══════════════════════════════════
const F5 = 'portões'

conferir(F5, 'o portão de denominação reprova um infrator injetado no código real?', () => {
  const alvo = join(RAIZ, 'src', '__infrator_temporario.tsx')
  require('node:fs').writeFileSync(alvo, 'export const X = () => <p>Feito por inteligência artificial</p>\n', 'utf8')
  let saiu = 0
  try {
    execFileSync('node', [join(RAIZ, 'scripts', 'medir-denominacao-sem-ia.mjs')], { stdio: 'pipe' })
  } catch (e) {
    saiu = e.status ?? 1
  } finally {
    require('node:fs').unlinkSync(alvo)
  }
  return saiu === 0
    ? { defeito: true, detalhe: 'o portão APROVOU um arquivo com "inteligência artificial" na tela' }
    : { detalhe: 'reprovou o infrator injetado' }
})

conferir(F5, 'o portão de fontes reprova um host não declarado?', () => {
  const alvo = join(RAIZ, 'src', '__fonte_temporaria.ts')
  require('node:fs').writeFileSync(alvo, "export const u = 'https://fonte-nao-declarada.example.com/x'\n", 'utf8')
  let saiu = 0
  try {
    execFileSync('node', [join(RAIZ, 'scripts', 'inventariar-fontes.mjs'), '--conferir'], { stdio: 'pipe' })
  } catch (e) {
    saiu = e.status ?? 1
  } finally {
    require('node:fs').unlinkSync(alvo)
  }
  return saiu === 0
    ? { defeito: true, detalhe: 'o portão APROVOU um host não declarado' }
    : { detalhe: 'reprovou o host não declarado' }
})

// ═══ Relatório ═════════════════════════════════════════════════════════════
console.log('🔍 AUDITORIA ADVERSARIAL — mandado de achar defeito\n')
// ---------------------------------------------------------------------------
const F6 = 'camada de tela'

conferir(F6, 'quem SAIU do elenco some da lista que a tela usa?', () => {
  D.definirPessoas([
    { id: 'fica', nome: 'Fica', ativo: true, restricoes: {} },
    { id: 'saiu', nome: 'Saiu', ativo: false, restricoes: {} },
  ])
  const achou = D.BROTHERS.find((b) => b.id === 'saiu')
  return achou
    ? { detalhe: `quem saiu continua nomeável ("${achou.name}"), marcado com ativo: ${achou.ativo}` }
    : {
        defeito: true,
        detalhe:
          'quem tem `ativo: false` sumiu de BROTHERS — na tela o passado dele vira id cru, ' +
          'some das estatísticas e a busca por nome não o encontra',
      }
})

conferir(F6, 'a tela consegue distinguir quem saiu de quem está no elenco?', () => {
  D.definirPessoas([{ id: 'x', nome: 'X', ativo: false, restricoes: {} }])
  const b = D.BROTHERS[0]
  return b && b.ativo === false
    ? { detalhe: 'o campo `ativo` atravessa a ponte' }
    : { defeito: true, detalhe: 'sem `ativo` na ponte, quem saiu aparece como se ainda escalasse' }
})

conferir(F6, 'a contagem de estatísticas descarta turno de id desconhecido em silêncio?', () => {
  const bruto = require('node:fs').readFileSync(join(RAIZ, 'src/components/StatsView.tsx'), 'utf8')

  // 🔴 COMENTÁRIO NÃO É CÓDIGO. A primeira versão desta checagem acusou o próprio comentário que
  // documenta o defeito — o texto "Sem `if (counts[bId])`" escrito para explicar por que o guard
  // saiu. É a mesma família do portão de denominação que reprovava "SANTA CEIA" por conter "IA":
  // régua que lê texto sobre código como se fosse código.
  //
  // O `(?<!:)` antes de `//` é deliberado: sem ele, o `//` de uma URL vira início de comentário e
  // engole o resto da linha — foi assim que o portão de inventário de fontes nasceu sempre-verde.
  const fonte = bruto.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(?<!:)\/\/[^\n]*/g, ' ')

  return /if\s*\(\s*counts\[bId\]\s*\)/.test(fonte)
    ? { defeito: true, detalhe: 'o guard `if (counts[bId])` voltou: turno de id fora da lista some do total' }
    : { detalhe: 'a contagem cria o contador sob demanda — nada é descartado calado' }
})

console.log('─'.repeat(74))
for (const frente of ['validação', 'gerador', 'dados publicados', 'código morto', 'portões', 'camada de tela']) {
  const doGrupo = [...ok, ...achados].filter((x) => x.frente === frente)
  if (!doGrupo.length) continue
  console.log(`\n${frente.toUpperCase()}`)
  for (const x of doGrupo) {
    const ehAchado = achados.includes(x)
    console.log(`  ${ehAchado ? '🔴' : '✅'} ${x.pergunta}`)
    console.log(`       ${x.detalhe}`)
  }
}
console.log('\n' + '─'.repeat(74))
console.log(`\n${ok.length} checagem(ns) sem achado · ${achados.length} ACHADO(S)\n`)

if (achados.length) {
  console.log('ACHADOS, em ordem:')
  achados.forEach((a, i) => console.log(`  ${i + 1}. [${a.frente}] ${a.pergunta}\n     ${a.detalhe}`))
} else {
  console.log('⚠️ NENHUM ACHADO — e um relatório de auditoria sem achados é SUSPEITO.')
  console.log('   Ou a instrução foi frouxa, ou o auditor não procurou direito. Aqui há um motivo')
  console.log('   estrutural: quem auditou escreveu o código, e carrega os mesmos pontos cegos.')
  console.log('   Auditor independente continua PENDENTE no backlog (P2.10).')
}

process.exit(achados.length ? 1 : 0)
