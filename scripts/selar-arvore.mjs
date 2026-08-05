/**
 * 🔒 O SELO — o GATE foi verde SOBRE ESTA ÁRVORE, ou sobre outra?
 *
 * 🔴 POR QUE ESTE ARQUIVO EXISTE. Em 05/08/2026, com três auditores rodando em paralelo, um deles
 * tinha um mutante vivo no disco (`mesDe` devolvendo o ANO em vez do mês) quando eu rodei
 * `git add -A && git commit`. O commit `3f8e366` entrou na história de `main` com o produto quebrado
 * dentro, e a mensagem dele afirma `EXIT_GATE=0`.
 *
 * O gate tinha sido verde — **minutos antes**, sobre uma árvore que já não era a mesma. Nada mentiu:
 * o resultado era válido para o estado em que rodou, e eu o apliquei a outro.
 *
 * ⚠️ O bundle publicado NUNCA carregou o defeito (medido: o commit não tocou `docs/assets/`, e
 * produção sempre serviu `slice(0, 7)`). O dano foi à HISTÓRIA — um `bisect` ou um `checkout`
 * daquele commit encontra o mês errado. E história não se reescreve neste projeto, pela mesma regra
 * que proíbe reescrever escala publicada: o commit fica, e o registro dele fica junto.
 *
 * ── O QUE ESTE SELO FAZ ──────────────────────────────────────────────────────────────────────────
 *
 * `--gravar` (último passo do gate) guarda a impressão digital do conteúdo de TODO arquivo versionado.
 * `--conferir` (antes de commitar) compara. Diferiu, o verde do gate é de outra árvore.
 *
 * Não é paranoia com agente paralelo: vale para qualquer edição feita entre o gate e o commit —
 * inclusive as minhas, que é o caso comum. **Um veredito só vale para o estado que ele mediu.**
 *
 * Uso: node scripts/selar-arvore.mjs --gravar | --conferir
 */
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const SELO = join(RAIZ, 'node_modules', '.selo-do-gate')

/** A impressão digital do conteúdo versionado, na visão do próprio git. */
function impressao() {
  // `ls-files -s` lista o hash de cada arquivo do ÍNDICE; `status --porcelain` traz o que difere do
  // disco. Os dois juntos descrevem a árvore de trabalho sem ler 40 MB de arquivo à mão.
  const indice = execFileSync('git', ['ls-files', '-s'], { cwd: RAIZ, encoding: 'utf8' })
  const sujo = execFileSync('git', ['status', '--porcelain'], { cwd: RAIZ, encoding: 'utf8' })
  const naoVersionados = sujo
    .split(String.fromCharCode(10))
    .filter((l) => l.trim())
    .map((l) => l.slice(3).trim())
    .filter((f) => existsSync(join(RAIZ, f)))
    .map((f) => `${f}:${createHash('sha256').update(readFileSync(join(RAIZ, f))).digest('hex')}`)
    .join(String.fromCharCode(10))
  return createHash('sha256').update(indice + naoVersionados).digest('hex')
}

const agora = impressao()

if (process.argv.includes('--gravar')) {
  writeFileSync(SELO, agora, 'utf8')
  console.log(`🔒 selo gravado — ${agora.slice(0, 12)}`)
  process.exit(0)
}

if (!existsSync(SELO)) {
  console.error('🔴 Não há selo. Rode `npm run gate` ANTES de commitar — o verde dele é o que este selo guarda.')
  process.exit(1)
}

const guardado = readFileSync(SELO, 'utf8').trim()
if (guardado !== agora) {
  console.error('🔴 A ÁRVORE MUDOU DEPOIS DO GATE.\n')
  console.error(`   selo do gate ... ${guardado.slice(0, 12)}`)
  console.error(`   árvore agora ... ${agora.slice(0, 12)}\n`)
  console.error('   O verde do gate vale para o estado em que ele rodou, e este não é aquele.')
  console.error('   Rode `npm run gate` de novo antes de commitar.\n')
  console.error('   Em 05/08/2026 isto custou um commit com o produto quebrado dentro e a mensagem')
  console.error('   afirmando EXIT_GATE=0 — o gate tinha sido verde minutos antes, sobre outra árvore.')
  process.exit(1)
}
console.log(`✅ a árvore é a mesma que o gate mediu — ${agora.slice(0, 12)}`)
