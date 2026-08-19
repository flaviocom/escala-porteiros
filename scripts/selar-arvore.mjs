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
 * 🔴 TERCEIRO ACHADO, da auditoria cega independente do conserto acima (mesmo dia, mesma sessão) —
 * higiene de parsing, NÃO um falso positivo: renomear um arquivo staged (`git add` depois de `mv`)
 * faz o `git status --porcelain` devolver uma linha `R  antigo.txt -> novo.txt`, e `l.slice(3).trim()`
 * — que existia desde a primeira versão deste arquivo — tratava a linha INTEIRA
 * (`"antigo.txt -> novo.txt"`) como se fosse um nome de arquivo. Esse "arquivo" fantasma nunca bate
 * com nada em disco, vira `:AUSENTE` no cálculo, e suja a impressão digital com lixo em vez do
 * caminho real.
 *
 * A auditoria descreveu isto como "a mesma classe do segundo defeito" — mas NÃO é: no segundo
 * defeito, nada mudava de verdade (mesmo arquivo, mesmo caminho, mesmos bytes, só a REPRESENTAÇÃO da
 * medição diferia). Numa renomeação, o CAMINHO em si muda — `antigo.txt` deixa de existir,
 * `novo.txt` passa a existir — e isto é uma mudança real na árvore, coerente com a regra deste
 * arquivo ("vale para qualquer edição feita entre o gate e o commit"). **O selo tem de continuar
 * acusando depois de uma renomeação — e continua, antes e depois deste conserto.** O que o conserto
 * faz é trocar o candidato fantasma pelo caminho real (`novo.txt`, extraído do separador literal
 * ` -> `), então o diagnóstico aponta para um arquivo que existe, em vez de um texto que não é
 * caminho nenhum. Ver caso G do autoteste — que prova ACUSA, não o contrário.
 *
 * 🔴 SEGUNDO DEFEITO, achado em 19/08/2026 (retomada de sessão, `retomaescala`): a primeira versão
 * misturava DUAS representações do mesmo arquivo. Para o que estava no ÍNDICE (staged/committed),
 * usava o hash de BLOB do git (`ls-files -s`) — que o `core.autocrlf=true` normaliza para LF antes
 * de gravar. Para o que estava só MODIFICADO no disco (unstaged), lia os bytes CRUS do arquivo
 * (CRLF, no Windows) e tirava sha256 direto. Fluxo comum deste projeto — `npm run gate` (termina em
 * `selo:gravar`) ANTES de `git add` — passa o mesmo arquivo pelas DUAS representações em sequência:
 * hash-de-bytes-crus no `--gravar` (arquivo ainda modificado), hash-de-blob-LF no `--conferir`
 * seguinte (arquivo já commitado). **Zero bytes mudaram de verdade, e o selo gritava "árvore
 * mudou"** — provado ao reproduzir: `git ls-files -s` devolve o MESMO hash antes e depois de editar
 * um arquivo sem dar `git add` (a leitura é do índice, não do disco), mas o hash final do selo
 * mudava mesmo assim, porque a metade "modificado" do cálculo pega o disco, não o índice.
 *
 * **O conserto:** parar de misturar as duas fontes. Toda a impressão digital agora lê o mesmo lugar
 * — o CONTEÚDO ATUAL NO DISCO de cada arquivo rastreado ou presente no `status`, sempre por
 * `readFileSync` — porque é isso, e só isso, que o gate de fato testou (`vitest`/`vite build` leem
 * do disco, nunca do índice do git). Um arquivo rastreado que sumiu do disco entra como `AUSENTE`,
 * em vez de ser silenciosamente pulado.
 *
 * Uso: node scripts/selar-arvore.mjs --gravar | --conferir [--raiz <caminho>]
 */
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const argRaiz = process.argv.indexOf('--raiz')
const RAIZ = argRaiz >= 0 ? process.argv[argRaiz + 1] : join(dirname(fileURLToPath(import.meta.url)), '..')
const SELO = join(RAIZ, 'node_modules', '.selo-do-gate')

/**
 * A impressão digital do conteúdo em disco de todo arquivo rastreado ou presente no `status` —
 * NUNCA do índice do git. Ver o comentário no topo do arquivo: misturar blob-do-índice com
 * bytes-do-disco foi o segundo defeito deste script.
 */
function impressao(raiz = RAIZ) {
  const rastreados = execFileSync('git', ['ls-files'], { cwd: raiz, encoding: 'utf8' })
    .split(String.fromCharCode(10))
    .filter((l) => l.trim())

  /*
    🔴 `-uall` NÃO É ENFEITE — 06/08/2026.

    Sem ele, o git resume uma pasta inteira não rastreada numa linha só: `?? .github/`. Listar
    arquivo por arquivo é o que permite tratar cada um individualmente abaixo — inclusive um
    arquivo novo dentro de uma pasta nova, que uma linha resumida esconderia em silêncio.
  */
  /*
    🔴 RENOMEAÇÃO NÃO É UM NOME DE ARQUIVO — terceiro defeito, ver comentário no topo do arquivo.
    `git status --porcelain` reporta rename como `XY antigo -> novo`. O separador é o literal
    ` -> ` (espaço, seta, espaço); sem tratar isso, a linha inteira vira um "arquivo" que não existe
    em lugar nenhum do disco.
  */
  const sujo = execFileSync('git', ['status', '--porcelain', '-uall'], { cwd: raiz, encoding: 'utf8' })
    .split(String.fromCharCode(10))
    .filter((l) => l.trim())
    .map((l) => l.slice(3).trim())
    .map((caminho) => {
      const seta = caminho.indexOf(' -> ')
      return seta >= 0 ? caminho.slice(seta + 4).trim() : caminho
    })

  const candidatos = [...new Set([...rastreados, ...sujo])].sort()

  const partes = candidatos.map((f) => {
    const caminho = join(raiz, f)
    if (!existsSync(caminho)) return `${f}:AUSENTE`
    if (statSync(caminho).isDirectory()) return null // não deveria sobrar depois do `-uall`; cinto de segurança
    return `${f}:${createHash('sha256').update(readFileSync(caminho)).digest('hex')}`
  }).filter(Boolean)

  return createHash('sha256').update(partes.join(String.fromCharCode(10))).digest('hex')
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
