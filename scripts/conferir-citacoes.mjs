/**
 * PORTÃO — citação `arquivo:linha` aponta para o que diz apontar?
 *
 * 🔴 POR QUE ESTE PORTÃO EXISTE. O `BACKLOG.md` traz a lição escrita desde 05/08/2026:
 * *"citação de linha em documento vivo apodrece"*. E o projeto continuou apodrecendo: uma auditoria
 * externa achou **sete** citações mortas no mesmo dia, uma delas sete linhas abaixo da própria
 * lição, e outra apontando para código que **não existe mais em lugar nenhum**.
 *
 * Nomear a classe não fecha a classe. Regra sem portão é disciplina, e disciplina falha.
 *
 * ── COMO ELE DECIDE ──────────────────────────────────────────────────────────────────────────────
 *
 * Uma citação é `caminho/arquivo.ext:N` ou `:N-M`. O portão confere que:
 *   1. o arquivo existe;
 *   2. a linha existe (o arquivo tem pelo menos N linhas).
 *
 * ⚠️ **O que ele NÃO faz, e é limite declarado:** conferir se a linha diz o que o documento afirma.
 * Isso exigiria entender a frase. Ele pega a maior parte do apodrecimento — arquivo renomeado,
 * arquivo apagado, linha além do fim — e não pega a citação que apenas *deslizou* algumas linhas.
 * Para essa, existe uma segunda checagem: se o documento cita um **símbolo** entre crases junto da
 * linha (ex.: ``Admin.tsx:1529 (`publicacaoEmVoo`)``), o portão exige que o símbolo esteja **perto**
 * da linha citada. É barato, e é o que transforma a citação em algo verificável.
 *
 * Uso: node scripts/conferir-citacoes.mjs [--json]
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const argRaiz = process.argv.indexOf('--raiz')
const RAIZ = argRaiz >= 0 ? process.argv[argRaiz + 1] : join(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Append-only: registram o que era verdade então, e reescrevê-los falsifica o registro.
 *
 * ⚠️ Eles NÃO ficam de fora por serem menos importantes — ficam porque corrigir a citação de um
 * handoff seria mentir sobre o que se sabia naquele dia. A saída conta quantos foram pulados.
 */
const HISTORICOS = ['AI_MASTER_LOG.md', 'DIARIO_DE_BORDO.md', 'docs/handoff/', 'docs/historico/']

/** `caminho/arquivo.ext:123` ou `:123-145`, com ou sem crases em volta. */
const RE_CITACAO = /`?((?:[\w.-]+\/)*[\w.-]+\.(?:ts|tsx|mjs|js|json|md|html|css)):(\d+)(?:-(\d+))?`?/g
/** Um símbolo entre crases logo depois da citação — o que a torna verificável de verdade. */
const RE_SIMBOLO = /^\s*\(?`([A-Za-z_$][\w$]*)`/

function documentos(dir = RAIZ, acc = []) {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'capturas', 'dist'].includes(item.name)) continue
    const abs = join(dir, item.name)
    if (item.isDirectory()) { documentos(abs, acc); continue }
    if (!item.name.endsWith('.md')) continue
    acc.push(relative(RAIZ, abs).split(sep).join('/'))
  }
  return acc
}

const todos = documentos().sort()
const vivos = todos.filter((d) => !HISTORICOS.some((h) => d === h || d.startsWith(h)))
const achados = []
let citacoes = 0
let comSimbolo = 0

for (const rel of vivos) {
  const texto = readFileSync(join(RAIZ, rel), 'utf8')
  texto.split(/\r?\n/).forEach((linha, i) => {
    for (const m of linha.matchAll(RE_CITACAO)) {
      const [tudo, arquivo, deStr, ateStr] = m
      // Um `.md:N` que aponta para si mesmo quase sempre é exemplo dentro de um bloco de código.
      if (arquivo === rel) continue
      citacoes++

      const alvo = join(RAIZ, arquivo)
      if (!existsSync(alvo)) {
        achados.push({ arquivo: rel, linha: i + 1, citacao: tudo, motivo: `o arquivo \`${arquivo}\` não existe` })
        continue
      }
      const linhas = readFileSync(alvo, 'utf8').split(/\r?\n/).length
      const fim = Number(ateStr ?? deStr)
      if (fim > linhas) {
        achados.push({
          arquivo: rel, linha: i + 1, citacao: tudo,
          motivo: `\`${arquivo}\` tem ${linhas} linhas, e a citação vai até ${fim}`,
        })
        continue
      }

      // Se há um símbolo declarado junto, ele tem de estar por perto (±12 linhas).
      const depois = linha.slice((m.index ?? 0) + tudo.length)
      const s = depois.match(RE_SIMBOLO)
      if (!s) continue
      comSimbolo++
      const conteudo = readFileSync(alvo, 'utf8').split(/\r?\n/)
      const inicio = Math.max(0, Number(deStr) - 13)
      const trecho = conteudo.slice(inicio, Number(fim) + 12).join('\n')
      if (!trecho.includes(s[1])) {
        achados.push({
          arquivo: rel, linha: i + 1, citacao: `${tudo} (\`${s[1]}\`)`,
          motivo: `\`${s[1]}\` não está perto da linha ${deStr} em \`${arquivo}\` — a citação escorregou`,
        })
      }
    }
  })
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ vivos: vivos.length, citacoes, comSimbolo, achados }, null, 2))
} else {
  console.log('CITAÇÕES `arquivo:linha` EM DOCUMENTO VIVO\n')
  console.log(`  documentos vivos varridos ..... ${vivos.length}`)
  console.log(`  históricos pulados ............ ${todos.length - vivos.length} (append-only — corrigi-los falsificaria o registro)`)
  console.log(`  citações conferidas ........... ${citacoes}`)
  console.log(`  · destas, com símbolo declarado ${comSimbolo} (essas são verificadas de verdade)`)
  console.log(`  podres ........................ ${achados.length}\n`)
  for (const a of achados) {
    console.log(`  🔴 ${a.arquivo}:${a.linha} — ${a.citacao}`)
    console.log(`     ${a.motivo}`)
  }
  if (!achados.length) console.log('  ✅ Nenhuma citação aponta para arquivo ou linha que não existe.')
  else console.log('\n   Cite o SÍMBOLO junto da linha — assim a citação vira verificável, e não só uma coordenada.')
}

process.exit(achados.length ? 1 : 0)
