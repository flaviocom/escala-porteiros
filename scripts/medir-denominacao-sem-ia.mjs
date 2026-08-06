/**
 * 🔒 PORTÃO DE DENOMINAÇÃO — o produto não se anuncia pelo jargão da moda.
 *
 * Regra global do método (`_padroes-globais/DENOMINACAO_SEM_JARGAO_DE_IA.md`), com a fronteira que a
 * torna aplicável sem virar problema:
 *
 *   TELA  (texto que alguém lê: JSX, rótulo, título, dica, mensagem de erro, URL) → jargão PROIBIDO
 *   CÓDIGO (nome de variável, arquivo, rota interna, comentário)                  → nome técnico MANTIDO
 *
 * Renomear no código criaria um dialeto que só esta casa entende — e quebraria a portabilidade que o
 * `AGENTS.md` existe para garantir. Por isso o portão **distingue os dois**, e imprime as exceções.
 *
 * ⚠️ TRÊS ARMADILHAS DE RÉGUA que o método já pagou para aprender, e que estão tratadas aqui:
 *   1. `\brobô\b` NUNCA casa — em JS o `\b` é definido sobre `[A-Za-z0-9_]`, e `ô` está fora.
 *   2. Composto flexiona os dois elementos: `rede neural` não casa "redes neurais".
 *   3. Lookbehind de tamanho variável falha em silêncio — a negação é tratada com lógica explícita.
 *
 * ⚠️ A NEGAÇÃO TEM DE PASSAR. "não é inteligência artificial" é texto que PROTEGE o produto; um
 * portão que o acusasse levaria alguém a removê-lo para calar o alarme — o pior desfecho possível.
 *
 * Uso:  node scripts/medir-denominacao-sem-ia.mjs [--autoteste]
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Termos proibidos em TELA. Cada um com a alternativa que descreve melhor o que existe. */
const PROIBIDOS = [
  { re: /intelig[êe]ncias?\s+artifici(al|ais)/giu, termo: 'inteligência artificial', use: 'motor' },
  { re: /(?<![A-Za-zÀ-ÿ0-9_])IAs?(?![A-Za-zÀ-ÿ0-9_])/gu, termo: 'IA', use: 'motor' },
  { re: /(?<![A-Za-zÀ-ÿ0-9_])AI(?![A-Za-zÀ-ÿ0-9_])/gu, termo: 'AI', use: 'motor' },
  { re: /prompts?/giu, termo: 'prompt', use: 'pergunta (do usuário) ou calibração (interna)' },
  { re: /chat\s?bots?/giu, termo: 'chatbot', use: 'o nome próprio do produto' },
  { re: /(?<![A-Za-zÀ-ÿ0-9_])GPTs?(?![A-Za-zÀ-ÿ0-9_])/gu, termo: 'GPT', use: 'motor' },
  { re: /(?<![A-Za-zÀ-ÿ0-9_])LLMs?(?![A-Za-zÀ-ÿ0-9_])/gu, termo: 'LLM', use: 'motor' },
  { re: /modelos?\s+de\s+linguagem/giu, termo: 'modelo de linguagem', use: 'motor' },
  { re: /machine\s+learning/giu, termo: 'machine learning', use: 'modelos quantitativos próprios' },
  { re: /aprendizado\s+de\s+m[áa]quina/giu, termo: 'aprendizado de máquina', use: 'modelos quantitativos próprios' },
  { re: /redes?\s+neura(l|is)/giu, termo: 'rede neural', use: 'modelos estatísticos calibrados' },
  // `\b` não funciona com `ô`: faixa acentuada explícita nas duas bordas.
  { re: /(?<![A-Za-zÀ-ÿ0-9_])rob[ôo]s?(?![A-Za-zÀ-ÿ0-9_])/giu, termo: 'robô', use: 'motor' },
]

/** Palavras de negação: se aparecerem antes do termo, o texto o está NEGANDO — e isso protege. */
const NEGACOES = /\b(n[ãa]o|nunca|jamais|sem|nenhum[a]?|em vez de|no lugar de|diferente de)\b/iu

/** Olha os 70 caracteres anteriores. Lógica explícita, nunca lookbehind de tamanho variável. */
function estaNegado(texto, indice) {
  return NEGACOES.test(texto.slice(Math.max(0, indice - 70), indice))
}

// ---------------------------------------------------------------------------
// Extração do que é TELA
// ---------------------------------------------------------------------------

/**
 * Troca cada `${expressão}` por um marcador.
 *
 * ERRO 30 do método: excluir o que atrapalha costuma excluir também o que a régua existe para ver.
 * A saída não é ignorar o texto com expressão — é NORMALIZAR, preservando a moldura da frase. Assim
 * "Restam ${n} dias" continua sendo lido como "Restam {…} dias", e o identificador `NOMES_DIA`
 * deixa de ser confundido com a sigla proibida.
 */
function normalizarExpressoes(texto) {
  return texto.replace(/\$\{[^}]*\}/g, '{…}')
}

function tirarComentarios(codigo) {
  // Comentário é CÓDIGO, não tela. Trocado por espaços para não deslocar os índices.
  return codigo
    .replace(/\/\*[\s\S]*?\*\//g, (m) => ' '.repeat(m.length))
    .replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length))
}

/**
 * Devolve os trechos que uma pessoa LÊ.
 *
 * A lista de superfícies nunca está completa — cada item abaixo foi acrescentado depois de um
 * vazamento real registrado no método. Ao achar um vazamento novo, acrescente a SUPERFÍCIE, não só
 * corrija o texto.
 */
function trechosDeTela(codigo) {
  const s = tirarComentarios(codigo)
  const achados = []

  // 1. Texto solto dentro de JSX: >  texto  <
  for (const m of s.matchAll(/>([^<>{}]*[A-Za-zÀ-ú][^<>{}]*)</g)) {
    achados.push({ texto: m[1], inicio: m.index + 1, onde: 'texto na tela' })
  }
  // 2. Props que viram texto visível ou lido por leitor de tela
  const PROPS = /\b(title|placeholder|aria-label|alt|label|rotulo|subtitulo|texto|dica|motivo|mensagem|descricao)\s*=\s*(["'])((?:(?!\2).)*)\2/g
  for (const m of s.matchAll(PROPS)) {
    achados.push({ texto: m[3], inicio: m.index, onde: `prop ${m[1]}` })
  }
  // 3. Props com string dentro de chaves: title={'…'}
  const PROPS_CHAVE = /\b(title|placeholder|aria-label|alt|label|rotulo|subtitulo|texto|dica|motivo|mensagem|descricao)\s*=\s*\{\s*(["'`])((?:(?!\2).)*)\2/g
  for (const m of s.matchAll(PROPS_CHAVE)) {
    achados.push({ texto: m[3], inicio: m.index, onde: `prop ${m[1]}` })
  }
  /*
    4. Campo de objeto com PROSA — qualquer nome de campo.

    🔴 Isto era uma LISTA DE PERMISSÃO de onze nomes, e o campo `explicacao:` não estava nela.
    São **18 campos `explicacao:` em `regras.ts`**, todos mostrados na tela da conferência — e o
    portão aprovava `explicacao: "Feito por inteligência artificial"` sem piscar. Medido em
    06/08/2026, quando a auditoria adversarial passou a exercitar a matriz inteira de termos ×
    extensões em vez de uma única célula.

    **Lista de permissão erra em silêncio; lista de exclusão erra alto** — o projeto já tinha
    aprendido isso no portão de contagem, e aqui a lição não tinha sido aplicada.

    O critério deixou de ser o NOME do campo e passou a ser a FORMA do valor: string com espaço e
    letra minúscula é **prosa**, e prosa dentro de `src/` ou é texto de tela ou vai virar. Um
    identificador ('MANHA', 'bg-red-50', './datas') não tem espaço e continua de fora.
  */
  const CAMPOS = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(["'`])((?:(?!\2).)*)\2/g
  for (const m of s.matchAll(CAMPOS)) {
    if (!/[a-zà-ÿ]/.test(m[3]) || !/\s/.test(m[3].trim())) continue
    achados.push({ texto: m[3], inicio: m.index, onde: `campo ${m[1]}` })
  }
  // 5. Parâmetro de URL — aparece na barra de endereços, e isso é tela
  for (const m of s.matchAll(/[?&]([a-z_]+)=/gi)) {
    achados.push({ texto: m[1], inicio: m.index, onde: 'parâmetro de URL' })
  }
  return achados
}

// ---------------------------------------------------------------------------

function arquivos(dir, saida = []) {
  for (const nome of readdirSync(dir)) {
    if (['node_modules', '.git', 'docs', 'dist', 'scripts'].includes(nome)) continue
    const caminho = join(dir, nome)
    if (statSync(caminho).isDirectory()) arquivos(caminho, saida)
    else if (['.tsx', '.ts', '.html'].includes(extname(caminho)) && !caminho.endsWith('.test.ts')) saida.push(caminho)
  }
  return saida
}

function varrer(raiz) {
  const vazamentos = []
  let trechos = 0
  for (const caminho of arquivos(join(raiz, 'src')).concat([join(raiz, 'index.html')])) {
    let codigo
    try { codigo = readFileSync(caminho, 'utf8') } catch { continue }
    for (const t of trechosDeTela(codigo)) {
      trechos++
      const texto = normalizarExpressoes(t.texto)
      for (const p of PROIBIDOS) {
        p.re.lastIndex = 0
        for (const m of texto.matchAll(p.re)) {
          if (estaNegado(texto, m.index)) continue // negação PROTEGE — deixa passar
          const linha = codigo.slice(0, t.inicio).split('\n').length
          vazamentos.push({
            arquivo: relative(raiz, caminho).replace(/\\/g, '/'),
            linha, onde: t.onde, termo: p.termo, use: p.use,
            trecho: texto.trim().slice(0, 90),
          })
        }
      }
    }
  }
  return { vazamentos, trechos }
}

// ---------------------------------------------------------------------------
// 🔒 AUTOTESTE — prova as DUAS pontas antes de qualquer verde ser confiável
// ---------------------------------------------------------------------------

function autoteste() {
  const deveAcusar = [
    ['<p>Gerado por inteligência artificial</p>', 'inteligência artificial'],
    ['<span>Nossa IA monta a escala</span>', 'IA'],
    ['title="Editar o prompt"', 'prompt'],
    ['<div>Fale com o chatbot</div>', 'chatbot'],
    ['{ titulo: "Escala por machine learning" }', 'machine learning'],
    ['<p>usamos redes neurais calibradas</p>', 'rede neural'],
    ['<p>um robô monta a escala</p>', 'robô'],
    ['<a href="/x?prompt=oi">ir</a>', 'prompt'],
    ['{ mensagem: "Erro no LLM" }', 'LLM'],
  ]
  const deveAbsolver = [
    ['<p>O motor monta a escala</p>', 'texto correto'],
    // 🔴 Falsos positivos REAIS, achados na primeira varredura. A régua passou no
    //    autoteste e mesmo assim acusou estes — porque a borda só cobria minúscula
    //    e a expressão de template era lida como texto.
    ['<span>SANTA CEIA</span>', '🔴 "CEIA" contém IA — borda maiúscula'],
    ['<span>ENSAIO</span>', '🔴 "ENSAIO" contém AI — borda maiúscula'],
    ['{ rotulo: "SANTA CEIA" }', '🔴 rótulo SANTA CEIA'],
    ['{ mensagem: `escalado em ${NOMES_DIA[d]}` }', '🔴 NOMES_DIA é expressão, não texto'],
    ['<p>Restam {n} dias na CEIA</p>', '🔴 mistura de palavra e expressão'],
    ['<p>não é inteligência artificial, é um motor próprio</p>', '🔴 NEGAÇÃO — protege o produto'],
    ['<p>isto nunca foi um chatbot</p>', '🔴 NEGAÇÃO'],
    ['<p>Maria vai à feira</p>', 'texto comum'],
    ['<p>o prompt do sistema</p>'.replace('<p>', '// ').replace('</p>', ''), 'COMENTÁRIO é código, não tela'],
    ['const SYSTEM_PROMPT = "x"', 'nome de variável é código'],
    ['<p>Adilson e Isac na portaria</p>', 'nomes de pessoas'],
    ['<p>a régua e o cálculo do motor</p>', 'vocabulário recomendado'],
  ]

  let falhas = 0
  console.log('AUTOTESTE — denominação sem jargão\n')

  for (const [codigo, esperado] of deveAcusar) {
    const achou = trechosDeTela(codigo).some((t) => {
      const texto = normalizarExpressoes(t.texto)
      return PROIBIDOS.some((p) => {
        p.re.lastIndex = 0
        return [...texto.matchAll(p.re)].some((m) => !estaNegado(texto, m.index))
      })
    })
    if (!achou) falhas++
    console.log(`  ${achou ? '✅' : '🔴'} acusa: ${esperado.padEnd(24)} — ${codigo.slice(0, 48)}`)
  }
  console.log()
  for (const [codigo, motivo] of deveAbsolver) {
    const achou = trechosDeTela(codigo).some((t) => {
      const texto = normalizarExpressoes(t.texto)
      return PROIBIDOS.some((p) => {
        p.re.lastIndex = 0
        return [...texto.matchAll(p.re)].some((m) => !estaNegado(texto, m.index))
      })
    })
    if (achou) falhas++
    console.log(`  ${!achou ? '✅' : '🔴'} absolve: ${motivo.padEnd(30)} — ${codigo.slice(0, 44)}`)
  }

  console.log(
    falhas === 0
      ? `\n✅ A régua acusa nos ${deveAcusar.length} infratores e absolve nos ${deveAbsolver.length} inocentes.`
      : `\n🔴 ${falhas} caso(s) falharam — a régua NÃO é confiável.`,
  )
  return falhas === 0
}

// ---------------------------------------------------------------------------

if (process.argv.includes('--autoteste')) {
  process.exit(autoteste() ? 0 : 1)
}

if (!autoteste()) {
  console.error('\n🔴 A régua reprovou no próprio autoteste — não vale confiar na varredura.')
  process.exit(1)
}

console.log('\n' + '─'.repeat(70) + '\nVARREDURA DA TELA\n')
const { vazamentos, trechos } = varrer(RAIZ)
console.log(`  ${trechos} trecho(s) de tela conferido(s)\n`)

if (!vazamentos.length) {
  console.log('✅ Nenhum jargão comoditizado em texto que alguém lê.')
  console.log('   (Nome técnico em código, comentário e nome de arquivo continua permitido — de propósito.)')
  process.exit(0)
}

console.log(`🔴 ${vazamentos.length} vazamento(s):\n`)
for (const v of vazamentos) {
  console.log(`  ${v.arquivo}:${v.linha}  [${v.onde}]`)
  console.log(`    termo "${v.termo}" → use: ${v.use}`)
  console.log(`    …${v.trecho}…\n`)
}
process.exit(1)
