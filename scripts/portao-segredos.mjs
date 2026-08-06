/**
 * 🔐 PORTÃO — nenhum segredo dentro do repositório. E ele é PÚBLICO.
 *
 * 🔴 POR QUE ESTE PORTÃO EXISTE. O `ARQUITETURA.md` promete: *"o token fica cifrado no navegador de
 * quem administra — **nunca** vai para o repositório"*. E o `OPERACAO.md` explica que esse token tem
 * `Contents: Read and write` sobre este repositório.
 *
 * A promessa estava escrita em dois documentos e **não havia nada que a medisse**. As 20 checagens da
 * auditoria adversarial cobrem escala, dado, código morto e portões — nenhuma olha para segredo.
 *
 * O que está em jogo, escrito sem eufemismo: um token colado por engano num arquivo e commitado fica
 * **público no mesmo instante**, e dá a quem o achar permissão de reescrever a escala que a
 * congregação lê. O GitHub varre e revoga alguns formatos automaticamente — mas nem todos, e "alguém
 * de fora revoga por nós" não é uma defesa que se possa declarar.
 *
 * ⚠️ **Varre o que está VERSIONADO** (`git ls-files`), não o disco: `.env.local` fora do repositório
 * é o caminho certo e não pode ser acusado. É a diferença entre "existe na máquina" e "vai para o ar".
 *
 * Uso: node scripts/portao-segredos.mjs [--json]
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const EU = 'scripts/portao-segredos.mjs'

/**
 * As formas de segredo que este projeto pode produzir. Cada uma com o motivo de estar aqui.
 *
 * Escritas com `String.raw` e sem `\b`: é a quinta vez neste projeto que um escape gerado por script
 * vira byte de controle e deixa a busca inerte. A autodefesa logo abaixo confere.
 */
const FORMAS = [
  { nome: 'token fine-grained do GitHub', re: new RegExp(String.raw`github_pat_[A-Za-z0-9_]{20,}`) },
  { nome: 'token clássico do GitHub', re: new RegExp(String.raw`gh[pousr]_[A-Za-z0-9]{30,}`) },
  { nome: 'chave da Anthropic', re: new RegExp(String.raw`sk-ant-[A-Za-z0-9-]{20,}`) },
  { nome: 'chave da OpenAI', re: new RegExp(String.raw`sk-[A-Za-z0-9]{40,}`) },
  {
    nome: 'atribuição a variável de segredo',
    // `token = "…"` com valor longo. O que se procura é o VALOR colado, não a palavra.
    re: new RegExp(String.raw`(token|senha|password|secret|apiKey|api_key|chave)\s*[:=]\s*["'][A-Za-z0-9_\-+/=]{24,}["']`, 'i'),
  },
]

// 🔒 Régua com caractere de controle é régua inerte — e este projeto já viu isso quatro vezes.
for (const f of FORMAS) {
  if ([...f.re.source].some((c) => c.charCodeAt(0) < 32)) {
    console.error(`🔴 A forma "${f.nome}" tem caractere de controle na expressão — ela está INERTE.`)
    process.exit(2)
  }
}

/**
 * O que NÃO é segredo, e por que cada isenção existe.
 *
 * Isenção sem motivo escrito é buraco com outro nome — e uma isenção larga demais aqui apagaria
 * justamente a defesa que o portão existe para dar.
 */
const ISENTOS = new Map([
  [EU, 'este arquivo CITA os formatos para poder procurá-los'],
  ['src/admin/publicar.test.ts', 'usa um token de mentira, declarado como tal no nome da constante'],
  ['src/admin/github.test.ts', 'idem — o teste precisa de algo com a forma de um token'],
  ['src/admin/cofre.test.ts', 'senhas de teste, e o cofre guarda cifrado por construção'],
])

const versionados = execFileSync('git', ['ls-files'], { cwd: RAIZ, encoding: 'utf8' })
  .split(String.fromCharCode(10))
  .map((l) => l.trim())
  .filter(Boolean)

const achados = []
let varridos = 0

for (const rel of versionados) {
  if (ISENTOS.has(rel)) continue
  const abs = join(RAIZ, rel)
  let texto
  try {
    // Binário grande (imagem, fonte) não tem segredo em texto e só faria o portão engasgar.
    if (statSync(abs).size > 2_000_000) continue
    texto = readFileSync(abs, 'utf8')
  } catch {
    continue
  }
  if (texto.includes(String.fromCharCode(0))) continue // binário
  varridos++

  texto.split(/\r?\n/).forEach((linha, i) => {
    for (const f of FORMAS) {
      const m = linha.match(f.re)
      if (!m) continue
      achados.push({
        arquivo: rel,
        linha: i + 1,
        forma: f.nome,
        // 🔴 NUNCA imprimir o valor. Um portão que vaza o segredo no log é pior que o segredo no
        //    arquivo: o log vai para o terminal, para o CI e para o histórico da sessão.
        trecho: `${m[0].slice(0, 6)}… (${m[0].length} caracteres)`,
      })
    }
  })
}

/*
  🔴 E O ARQUIVO DE AMBIENTE NÃO PODE ESTAR VERSIONADO — nem vazio.
  Um `.env` rastreado hoje é o convite para alguém colar o valor nele amanhã.
*/
const ambienteVersionado = versionados.filter((f) => /(^|\/)\.env($|\.)/.test(f))
for (const f of ambienteVersionado)
  achados.push({ arquivo: f, linha: 0, forma: 'arquivo de ambiente VERSIONADO', trecho: 'ele não deve existir no repositório, nem vazio' })

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ varridos, isentos: ISENTOS.size, achados }, null, 2))
} else {
  console.log('🔐 SEGREDOS — o repositório é PÚBLICO\n')
  console.log(`  arquivos versionados varridos . ${varridos}`)
  console.log(`  isentos (declarados) .......... ${ISENTOS.size}`)
  for (const [f, motivo] of ISENTOS) console.log(`     · ${f} — ${motivo}`)
  console.log(`  formas procuradas ............. ${FORMAS.length}`)
  console.log(`  achados ....................... ${achados.length}\n`)
  for (const a of achados) {
    console.log(`  🔴 ${a.arquivo}:${a.linha} — ${a.forma}`)
    console.log(`     ${a.trecho}`)
  }
  if (achados.length) {
    console.log('\n   O repositório é PÚBLICO: um segredo commitado fica exposto no mesmo instante.')
    console.log('   1. REVOGUE o segredo agora, na origem dele — remover o arquivo não desfaz a exposição.')
    console.log('   2. Só depois tire do arquivo e commite.')
  } else {
    console.log('  ✅ Nenhum segredo em arquivo versionado. O token vive cifrado no navegador, como prometido.')
  }
}

process.exit(achados.length ? 1 : 0)
