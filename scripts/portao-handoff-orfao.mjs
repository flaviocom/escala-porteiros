/**
 * 🔗 PORTÃO — nenhum handoff fica órfão, e nenhum link do índice aponta para o vazio.
 *
 * 🔴 POR QUE ESTE PORTÃO EXISTE. Em 06/08/2026, ao religar a cadeia para o handoff novo, encontrei
 * o `docs/handoff/INDICE.md` com **três linhas diferentes apontando para o MESMO arquivo**
 * (`HANDOFF_2026-08-05-f.md`). Os handoffs `-d` e `-e` existiam no disco e **não eram citados em
 * lugar nenhum** — a sessão que os escreveu tinha ficado invisível.
 *
 * A causa foi uma substituição cega: um script de sessão anterior trocou o nome do handoff antigo
 * pelo novo em *todos* os arquivos, e no índice — que é justamente o lugar onde os nomes antigos
 * **devem** ficar — isso apagou o histórico em vez de atualizá-lo.
 *
 * O `cadeia` (passo 9) já media que `AGENTS.md`, `ESTADO.md`, `BACKLOG.md` e o índice apontam para o
 * handoff **mais recente**. Ele respondia "o ponteiro está atualizado?" e respondia certo. Ninguém
 * perguntava "**e os outros continuam alcançáveis?**".
 *
 * É a terceira vez em dois dias que a mesma classe aparece: **o portão responde só à pergunta que se
 * fez a ele.** Aqui o preço é o registro do projeto — a regra do dono é *"nada órfão"*, e o método
 * inteiro se apoia em conseguir reconstruir por que cada decisão foi tomada.
 *
 * Confere as duas direções:
 *   · todo `HANDOFF_*.md` do disco é citado no índice — **pelo menos uma vez**;
 *   · todo `HANDOFF_*.md` citado no índice existe no disco;
 *   · nenhum handoff aparece em **duas linhas de tabela diferentes** (foi assim que o defeito se
 *     manifestou: linhas distintas descrevendo sessões distintas, todas apontando para o mesmo).
 *
 * Uso: node scripts/portao-handoff-orfao.mjs
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const PASTA = join(RAIZ, 'docs/handoff')
const INDICE = join(PASTA, 'INDICE.md')

console.log('🔗 NENHUM HANDOFF ÓRFÃO\n')

const noDisco = readdirSync(PASTA).filter((f) => /^HANDOFF_.*\.md$/.test(f))
const texto = readFileSync(INDICE, 'utf8')
const linhas = texto.split(/\r?\n/)

// Só as linhas de TABELA descrevem uma sessão. O cabeçalho ("handoff mais recente") aponta de novo
// para um arquivo que a tabela já cita, e isso é correto — não é duplicata.
const linhasDeTabela = linhas.filter((l) => l.trimStart().startsWith('|') && /HANDOFF_.*\.md/.test(l))

const citadosEmTabela = new Map()
for (const l of linhasDeTabela) {
  for (const nome of new Set([...l.matchAll(/(HANDOFF_[\w.-]*\.md)/g)].map((m) => m[1]))) {
    citadosEmTabela.set(nome, (citadosEmTabela.get(nome) ?? 0) + 1)
  }
}
const citadosNoTexto = new Set([...texto.matchAll(/(HANDOFF_[\w.-]*\.md)/g)].map((m) => m[1]))

const achados = []

for (const f of noDisco) {
  if (!citadosNoTexto.has(f)) achados.push(`${f} existe no disco e o índice NÃO cita — a sessão que o escreveu ficou invisível`)
}
for (const f of citadosNoTexto) {
  if (!noDisco.includes(f)) achados.push(`o índice cita ${f}, que não existe no disco — link para o vazio`)
}
for (const [f, n] of citadosEmTabela) {
  if (n > 1) achados.push(`${f} aparece em ${n} linhas de tabela diferentes — duas sessões apontando para o mesmo registro`)
}

console.log(`  handoffs no disco ......... ${noDisco.length}`)
console.log(`  linhas de tabela no índice  ${linhasDeTabela.length}`)
console.log(`  handoffs citados .......... ${citadosNoTexto.size}`)
console.log(`  achados ................... ${achados.length}\n`)

for (const a of achados) console.log(`  🔴 ${a}`)

if (noDisco.length === 0 || linhasDeTabela.length === 0) {
  console.log('🔴 nada foi medido — não há o que provar, e isso é defeito de população.')
  process.exit(1)
}
if (achados.length) {
  console.log('\n   O índice é o único caminho até um handoff antigo. Nome antigo no índice NÃO se')
  console.log('   substitui: acrescenta-se a linha nova por cima. Substituição cega apaga histórico.')
  process.exit(1)
}
console.log(`✅ os ${noDisco.length} handoffs estão no índice, cada um na sua linha, e nenhum link aponta para o vazio.`)
