/**
 * PORTÃO — a cadeia de navegação aponta para o handoff que É o mais recente?
 *
 * 🔴 POR QUE ELE EXISTE. Em 04/08/2026 uma auditoria independente achou o `AGENTS.md` — o arquivo
 * que qualquer assistente lê PRIMEIRO, e que promete *"você não precisa perguntar ao Flavio onde
 * paramos"* — chamando de "handoff mais recente" a **parte 4 de 7**. O `ESTADO.md` e o `BACKLOG.md`
 * já apontavam para a 7; só o roteador tinha ficado para trás.
 *
 * Quem seguisse a ordem prescrita não veria as partes 5, 6 e 7 — inclusive a reconstrução inteira da
 * imagem do WhatsApp e o achado de que quem saísse do elenco perdia o passado na tela.
 *
 * ⚠️ E o link FUNCIONAVA. Não era 404: era conteúdo velho atrás de um link válido, que nenhum
 * verificador de links pega. Ponteiro escrito à mão apodrece toda vez que um documento novo nasce —
 * e vai nascer um a cada sessão. Por isso a resposta é portão, não correção.
 *
 * Uso: node scripts/conferir-cadeia-de-navegacao.mjs
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const PASTA = join(RAIZ, 'docs', 'handoff')

/**
 * Ordena os handoffs de verdade.
 *
 * ⚠️ Ordenação alfabética simples MENTE aqui: `HANDOFF_2026-08-04.md` vem DEPOIS de
 * `HANDOFF_2026-08-04-g.md` porque `.` (46) é maior que `-` (45) na tabela de caracteres. O primeiro
 * handoff do dia (sem sufixo) seria eleito o mais recente, e o portão nasceria mentindo — que é
 * exatamente o defeito que ele existe para pegar.
 */
function ordenar(nomes) {
  const chave = (n) => {
    const m = n.match(/^HANDOFF_(\d{4}-\d{2}-\d{2})(?:-([a-z]+))?\.md$/)
    return m ? `${m[1]}-${m[2] ?? 'a'}` : null
  }
  return nomes.map((n) => ({ n, k: chave(n) })).filter((x) => x.k).sort((a, b) => (a.k < b.k ? -1 : 1))
}

const ordenados = ordenar(readdirSync(PASTA))
if (!ordenados.length) {
  console.log('🔴 Nenhum handoff encontrado em docs/handoff/.')
  process.exit(1)
}
const MAIS_RECENTE = ordenados[ordenados.length - 1].n

/*
  🔴 DESCOBERTO, NÃO LISTADO — corrigido em 05/08/2026.

  Esta lista tinha **quatro** arquivos, escritos à mão. E `AI_MASTER_LOG.md` e `DIARIO_DE_BORDO.md`
  também declaram a cadeia, no cabeçalho, com a mesma frase — e eram **invisíveis** para este
  portão. O `AI_MASTER_LOG` apontava para um handoff de 04/08 havia um dia inteiro, com o portão
  verde ao lado.

  É o mesmo padrão que apareceu em CINCO portões diferentes hoje: **a fronteira do portão é onde o
  defeito mora.** Lista escrita à mão erra em silêncio; descoberta erra alto.

  Agora: **todo `.md` que contenha a frase "handoff mais recente" é conferido**, e o número de
  documentos medidos aparece no relatório — para alguém notar se um dia ele encolher.
*/
function todosOsDocumentos(dir = RAIZ, acc = []) {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'capturas', 'assets'].includes(item.name)) continue
    const abs = join(dir, item.name)
    if (item.isDirectory()) { todosOsDocumentos(abs, acc); continue }
    if (!item.name.endsWith('.md')) continue
    const rel = relative(RAIZ, abs).split(sep).join('/')
    // Handoffs antigos CITAM o que era o mais recente na época — é o trabalho deles.
    if (rel.startsWith('docs/handoff/HANDOFF_')) continue
    if (rel.startsWith('docs/historico/')) continue
    acc.push(rel)
  }
  return acc
}

const ONDE = todosOsDocumentos()
  .filter((rel) => /handoff mais recente|última sessão/i.test(readFileSync(join(RAIZ, rel), 'utf8')))
  .map((arquivo) => ({ arquivo, gatilhos: [/handoff mais recente/i, /última sessão/i] }))

/** Linhas que se dizem "a mais recente" e apontam para um handoff que não é. */
function conferirTexto(rotulo, texto, gatilhos, esperado) {
  const erros = []
  texto.split('\n').forEach((linha, i) => {
    if (!gatilhos.some((g) => g.test(linha))) return
    for (const m of linha.matchAll(/HANDOFF_[0-9a-z-]+\.md/g))
      if (m[0] !== esperado) erros.push(`${rotulo}:${i + 1} chama ${m[0]} de mais recente — o mais recente é ${esperado}`)
  })
  return erros
}

// ---------------------------------------------------------------------------
// 🔒 AUTOTESTE — as duas pontas, e a armadilha da ordenação
// ---------------------------------------------------------------------------
console.log('AUTOTESTE — cadeia de navegação\n')
const CASOS = [
  {
    nome: '🔴 ordena certo: o sem sufixo é o PRIMEIRO do dia, não o último',
    ok: () => {
      const r = ordenar(['HANDOFF_2026-08-04.md', 'HANDOFF_2026-08-04-b.md', 'HANDOFF_2026-08-04-g.md'])
      return r[0].n === 'HANDOFF_2026-08-04.md' && r[r.length - 1].n === 'HANDOFF_2026-08-04-g.md'
    },
  },
  {
    nome: 'acusa ponteiro para handoff antigo',
    ok: () => conferirTexto('t', '> handoff mais recente: HANDOFF_2026-08-04-d.md', [/handoff mais recente/i], 'HANDOFF_2026-08-04-g.md').length === 1,
  },
  {
    nome: 'aprova ponteiro correto',
    ok: () => conferirTexto('t', '> handoff mais recente: HANDOFF_2026-08-04-g.md', [/handoff mais recente/i], 'HANDOFF_2026-08-04-g.md').length === 0,
  },
  {
    nome: '🔴 ignora link para handoff antigo FORA de linha que se diz recente',
    ok: () => conferirTexto('t', 'veja também HANDOFF_2026-08-04-b.md', [/handoff mais recente/i], 'HANDOFF_2026-08-04-g.md').length === 0,
  },
]
let falhou = 0
for (const c of CASOS) {
  const passou = c.ok()
  if (!passou) falhou++
  console.log(`  ${passou ? '✅' : '🔴'} ${c.nome}`)
}
if (falhou) {
  console.log('\n🔴 O CONFERIDOR NÃO FAZ O QUE PROMETE.')
  process.exit(2)
}
console.log('✅ O conferidor ordena certo, acusa o antigo e aprova o atual.\n')

// ---------------------------------------------------------------------------
console.log('CADEIA DE NAVEGAÇÃO\n')
console.log(`  ${ordenados.length} handoff(s) · mais recente: ${MAIS_RECENTE}`)

const problemas = []
for (const o of ONDE) {
  let texto
  try {
    texto = readFileSync(join(RAIZ, o.arquivo), 'utf8')
  } catch {
    problemas.push(`${o.arquivo} — declarado na cadeia e AUSENTE`)
    continue
  }
  problemas.push(...conferirTexto(o.arquivo, texto, o.gatilhos, MAIS_RECENTE))
}
console.log(`  conferidos: ${ONDE.map((o) => o.arquivo).join(', ')}\n`)

if (problemas.length) {
  console.log(`🔴 ${problemas.length} ponteiro(s) apontando para trás:\n`)
  for (const p of problemas) console.log(`   · ${p}`)
  console.log('\n   Handoff novo entra na cadeia no MESMO passo em que é escrito.')
  process.exit(1)
}
console.log('✅ Toda a cadeia aponta para o handoff mais recente.')
