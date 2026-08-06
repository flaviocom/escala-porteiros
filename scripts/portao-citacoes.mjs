/**
 * 🔗 PORTÃO — as citações `arquivo:linha` dos documentos vivos ainda apontam para algo.
 *
 * 🔴 POR QUE ELE EXISTE — o próprio BACKLOG pediu, e ninguém ouviu. O item P4.8 traz esta frase,
 * escrita à mão por quem percebeu o problema e não tinha como impedir que ele voltasse:
 *
 *     "⚠️ as linhas 218-221 citadas antes envelheceram, SEGUNDA OCORRÊNCIA do mesmo
 *      apodrecimento no mesmo documento"
 *
 * Citação de linha é a única referência que apodrece **sozinha**: ninguém precisa mexer no
 * documento para ela ficar errada — basta alguém acrescentar dez linhas no arquivo citado. E ela
 * apodrece em silêncio, porque continua *parecendo* precisa.
 *
 * O que ele confere:
 *   · o arquivo citado existe;
 *   · o arquivo tem pelo menos aquela linha (citar a linha 400 de um arquivo de 120 é rot certo).
 *
 * 🔴 O QUE ELE **NÃO** MEDE, declarado, porque isenção calada é buraco com outro nome: se o
 * *conteúdo* daquela linha ainda é o que a citação descreve. Isso exigiria entender a frase. Ele
 * pega o apodrecimento grosseiro — que é o que aconteceu duas vezes — e não finge pegar o resto.
 *
 * ISENTOS: os append-only (`AI_MASTER_LOG`, `DIARIO_DE_BORDO`, `docs/handoff/`, `docs/historico/`,
 * `docs/solicitacoes/`). Eles registram o que era verdade ENTÃO — uma citação que envelheceu ali é
 * o registro funcionando, não um defeito.
 *
 * Uso: node scripts/portao-citacoes.mjs
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const ISENTOS = ['AI_MASTER_LOG.md', 'DIARIO_DE_BORDO.md', 'docs/handoff', 'docs/historico', 'docs/solicitacoes', 'docs/superpowers']

console.log('🔗 AS CITAÇÕES `arquivo:linha` AINDA APONTAM PARA ALGO?\n')

const isento = (rel) => ISENTOS.some((i) => rel === i || rel.startsWith(i + '/'))

const documentos = []
const varrer = (dir) => {
  for (const nome of readdirSync(dir)) {
    if (['node_modules', '.git', 'dist', 'capturas', 'assets'].includes(nome)) continue
    const caminho = join(dir, nome)
    const rel = relative(RAIZ, caminho).split('\\').join('/')
    if (statSync(caminho).isDirectory()) { if (!isento(rel)) varrer(caminho); continue }
    if (nome.endsWith('.md') && !isento(rel)) documentos.push(rel)
  }
}
varrer(RAIZ)

// `src/admin/motor.ts:97` ou `scripts/validar-admin.mjs:44-45` — sempre dentro de crase, que é como
// o projeto escreve caminho. Fora da crase, "algo:12" apanharia hora, proporção e dois-pontos solto.
const RE = /`([\w./-]+\.(?:ts|tsx|mjs|js|json|md|html|css)):(\d+)(?:-(\d+))?`/g

const achados = []
let citacoes = 0
for (const doc of documentos) {
  const texto = readFileSync(join(RAIZ, doc), 'utf8')
  for (const m of texto.matchAll(RE)) {
    const [, alvo, deStr, ateStr] = m
    const linha = Number(ateStr ?? deStr)
    citacoes++
    const caminho = join(RAIZ, alvo)
    const ondeNoDoc = texto.slice(0, m.index).split('\n').length
    if (!existsSync(caminho)) {
      achados.push(`${doc}:${ondeNoDoc} cita \`${alvo}\`, que NÃO EXISTE`)
      continue
    }
    const total = readFileSync(caminho, 'utf8').split(/\r?\n/).length
    if (linha > total) {
      achados.push(`${doc}:${ondeNoDoc} cita \`${alvo}:${deStr}${ateStr ? '-' + ateStr : ''}\`, e o arquivo tem ${total} linhas`)
    }
  }
}

console.log(`  documentos varridos ....... ${documentos.length}`)
console.log(`  isentos (append-only) ..... ${ISENTOS.join(', ')}`)
console.log(`  citações conferidas ....... ${citacoes}`)
console.log(`  apodrecidas ............... ${achados.length}\n`)

for (const a of achados) console.log(`  🔴 ${a}`)

if (citacoes === 0) {
  console.log('🔴 nenhuma citação encontrada — o padrão mudou, e isso é defeito de população.')
  process.exit(1)
}
if (achados.length) {
  console.log('\n   Citação de linha apodrece sozinha: basta alguém acrescentar linhas no arquivo citado.')
  console.log('   Corrija o número, ou troque a citação por algo estável (o nome da função).')
  process.exit(1)
}
console.log(`✅ as ${citacoes} citações apontam para arquivos que existem, em linhas que existem.`)
