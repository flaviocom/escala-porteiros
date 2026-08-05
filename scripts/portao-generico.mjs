/**
 * PORTÃO — o produto é GENÉRICO. Nome de cliente não mora no código.
 *
 * 🔴 POR QUE ESTE PORTÃO EXISTE. Em 05/08/2026 o Flavio instituiu a regra máxima de escopo (§0 do
 * `AGENTS.md`): *"é uma escala genérica, configurável, mas genérica, com intenção de
 * comercialização"*. No mesmo dia, a auditoria externa de documentação encontrou o contrário no
 * código: `config.identidade` existia no tipo, no dado e no padrão de carregamento — e **nunca era
 * lido**. O cabeçalho do site, o cabeçalho da área administrativa, a imagem que vai para o
 * WhatsApp, o nome do arquivo baixado, o título da aba e os três prompts do motor traziam
 * "Escala Porteiros", "JD. São Luiz" e "Congregação Cristã no Brasil" cravados.
 *
 * Consertar aquilo foi o trabalho de meia hora. O que fez o defeito existir foi não haver nada que
 * medisse — e é isso que este arquivo resolve. A regra do método é explícita: *regra sem portão é
 * disciplina, e disciplina falha*.
 *
 * O QUE ELE MEDE: texto de cliente em `src/` e no `index.html`, fora de comentários.
 *
 * POR QUE FORA DE COMENTÁRIOS: os comentários deste projeto CITAM o defeito para explicá-lo — o
 * comentário logo acima é um deles. Um portão que trombasse com a própria documentação seria
 * contornado no primeiro dia, e portão contornado não mede nada.
 *
 * Uso: node scripts/portao-generico.mjs [--json]
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

// `--raiz` existe para o AUTOTESTE: ele monta uma árvore de mentira com infratores plantados e
// aponta o portão para lá. Sem isso, a única forma de provar que este portão morde seria sujar o
// código de verdade e confiar em restaurá-lo depois — que é como se perde trabalho.
const argRaiz = process.argv.indexOf('--raiz')
const RAIZ = argRaiz >= 0 ? process.argv[argRaiz + 1] : join(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Os termos deste cliente. Cada um já apareceu cravado no código de verdade.
 *
 * Não entra "porteiro" solto: `escala-porteiros` é o nome do repositório e aparece em caminho, em
 * `package.json` e em documentação — coisas que não vão para a tela de ninguém. O que se mede é o
 * texto que o USUÁRIO LÊ, e esse vem sempre em uma destas formas.
 */
/*
  🔒 AUTODEFESA — o portão confere as PRÓPRIAS expressões antes de medir qualquer coisa.

  Isto aconteceu TRÊS vezes em 05/08/2026: um `\b` escrito por script vira byte de backspace
  (0x08) dentro da expressão. A regex continua sintaticamente válida, o portão roda, imprime
  "termos procurados ..... 6 · achados ..... 0" — e o 0 é verdade sobre uma busca que não procura
  nada. Das três, duas só apareceram por acaso.

  Um portão que pode adoecer em silêncio não é portão. Aqui ele morre alto, antes de dar verde.
*/
function conferirAsProprias(termos) {
  const doentes = termos.filter((t) => /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(t.re.source))
  if (doentes.length) {
    console.error('🔴 O PORTÃO ESTÁ QUEBRADO — não é o código que está limpo, é a busca que morreu.\n')
    for (const d of doentes) {
      const bytes = [...d.re.source].map((c) => (c.codePointAt(0) < 32 ? `<0x${c.codePointAt(0).toString(16).padStart(2, '0')}>` : c)).join('')
      console.error(`   termo "${d.nome}" tem caractere de controle: /${bytes}/`)
    }
    console.error('\n   Causa conhecida: `\\b` escrito por script vira backspace (0x08).')
    console.error('   Conserto: construir a expressão com `new RegExp(String.raw`...`, \'i\')`.')
    process.exit(2)
  }
}

const TERMOS = [
  { re: /JD\.?\s*S[ÃA]O\s*LUIZ/i, nome: 'JD. São Luiz' },
  { re: /Congrega[çc][ãa]o\s+Crist[ãa]/i, nome: 'Congregação Cristã' },
  { re: /Escala\s+(de\s+)?[Pp]orteiro/i, nome: 'Escala (de) Porteiros' },
  { re: /escala\s+de\s+porteiros\s+de\s+uma\s+congrega/i, nome: 'prompt do motor cravado' },
  // 🔴 Este termo entrou DEPOIS, e por isso está aqui: a frase "sem porteiros escalados" na imagem
  //    da Santa Ceia passou pelos 4 termos acima e só foi pega quando a imagem foi ABERTA e lida.
  //    Todo achado que escapa do portão vira termo do portão — senão o portão não aprende.
  //    ⚠️ E nasceu LARGO DEMAIS: com `\b` simples, acusou 10 linhas, das quais 9 eram o **nome do
  //    repositório** — `escala-porteiros` como slug do GitHub, chave do cofre, marca do arquivo
  //    cifrado e URL do site. Isso é identidade de INFRAESTRUTURA: não vai para tela nenhuma, e
  //    trocar o repositório é outra tarefa. Portão que acusa o inocente é portão que alguém desliga.
  //    A borda `(?<![-\w])…(?![-\w])` separa a palavra em prosa do pedaço de um identificador.
  { re: new RegExp(String.raw`(?<![-\w])porteiro(s)?(?![-\w])`, 'i'), nome: 'ofício cravado ("porteiro")' },
  // "Irmão" é vocabulário de congregação. Ele vive em `config.identidade.pessoa` desde 05/08/2026 —
  // aqui se garante que não volte para dentro de um `placeholder` ou de um `<th>` sem ninguém ver.
  // 🔴 Este termo NASCEU INERTE. Escrito por script, o `\b` do JavaScript virou um byte de
  //    backspace (0x08) dentro da expressão: a busca passou a procurar algo que não existe em
  //    arquivo nenhum, e o cabeçalho continuou anunciando "5 termos procurados" como se medisse.
  //    Construído por `RegExp` + `String.raw`, o escape sobrevive a qualquer script que reescreva
  //    este arquivo — e o autoteste ao lado prova que ele morde.
  { re: new RegExp(String.raw`\birm[ãa]os?\b`, 'i'), nome: 'vocabulário de congregação ("irmão")' },
]

/**
 * O ÚNICO lugar onde o nome do cliente pode estar: o valor padrão da configuração.
 *
 * É a fronteira do produto — o que um comprador troca sem tocar em código. Ele é uma exceção
 * DECLARADA, não uma omissão: se amanhã alguém acrescentar outro arquivo aqui, a linha aparece no
 * diff e alguém pergunta por quê.
 */
/*
  ⚠️ VAZIO, E ISSO É UM RESULTADO.

  A primeira versão isentava `src/dados/carregar.ts`, onde vive o padrão da configuração. Rodar o
  portão sem a isenção mostrou que ela não era necessária: o padrão foi reescrito para ser genérico
  ("Escala de plantões" / "Pessoa"), então não há mais nome de cliente nenhum dentro de `src/`.

  Isenção que não é precisa é buraco: no dia em que alguém cravasse "JD. São Luiz" DENTRO deste
  arquivo — o lugar mais natural do mundo para fazer isso — o portão teria olhado para o outro lado.
*/
conferirAsProprias(TERMOS)

const PERMITIDOS = new Set([])

/** Tira comentários e o conteúdo de blocos JSX de comentário, preservando o número da linha. */
function semComentarios(texto) {
  let fora = texto
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')) // bloco /* */
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(m.length - p.length)) // linha //
  // Comentário de HTML, para o index.html.
  fora = fora.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '))
  return fora
}

/*
  🔴 O QUE FOI PULADO, CONTADO E IMPRESSO.

  Ao ganhar a exclusão de `.test.ts`, a população varrida caiu de 38 para 29 arquivos — e o portão
  seguiu dizendo só "arquivos varridos ..... 29", sem nenhuma pista de que 9 tinham saído. Portão
  que mede menos do que diz é a forma mais silenciosa de perder cobertura: ninguém compara o número
  de hoje com o de ontem. Agora os dois números aparecem juntos e a conta fecha à vista.
*/
const pulados = []

function arquivos(dir, acc = []) {
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome)
    if (statSync(p).isDirectory()) { arquivos(p, acc); continue }
    /*
      ⚠️ TESTE FICA DE FORA, e o motivo importa.

      `carregar.test.ts` usa "Escala Porteiros" e "JD. São Luiz" como FIXTURE: ele prova que um
      `config.json` vindo desse cliente continua sendo lido direito. O nome ali não é um defeito —
      é o dado do caso. E teste não vai para o ar: o que este portão protege é o que o comprador vê.

      A troca é consciente: alguém poderia cravar um nome num arquivo `.test.ts` sem ser pego. Mas
      esse nome não chegaria a tela nenhuma, e o preço da alternativa seria um portão que reprova o
      próprio teste que prova a correção — portão que atrapalha é portão que alguém desliga.
    */
    if (/\.test\.(ts|tsx)$/.test(nome)) { pulados.push(relative(RAIZ, p).replace(/\\/g, '/')); continue }
    if (/\.(ts|tsx|html|css)$/.test(nome)) acc.push(p)
  }
  return acc
}

const html = join(RAIZ, 'index.html')
const alvos = [...arquivos(join(RAIZ, 'src')), ...(existsSync(html) ? [html] : [])]
const achados = []

for (const abs of alvos) {
  const rel = relative(RAIZ, abs).replace(/\\/g, '/')
  if (PERMITIDOS.has(rel)) continue
  const linhas = semComentarios(readFileSync(abs, 'utf8')).split(/\r?\n/)
  linhas.forEach((linha, i) => {
    for (const t of TERMOS) if (t.re.test(linha)) achados.push({ arquivo: rel, linha: i + 1, termo: t.nome, texto: linha.trim().slice(0, 110) })
  })
}

// 🔴 A POPULAÇÃO MEDIDA, IMPRESSA. Um portão que diz só "0 achados" não deixa ninguém perceber que
// ele parou de varrer metade dos arquivos. O número de arquivos é a única defesa contra isso.
const medidos = alvos.length - [...PERMITIDOS].length
if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ medidos, achados }, null, 2))
} else {
  console.log(`PORTÃO — produto genérico (§0 do AGENTS.md)\n`)
  console.log(`  arquivos varridos ......... ${medidos}`)
  console.log(`  testes pulados ............ ${pulados.length} (fixture não vai para o ar)`)
  console.log(`  isentos (declarados) ...... ${[...PERMITIDOS].join(', ') || '(nenhum)'}`)
  console.log(`  termos procurados ......... ${TERMOS.length}`)
  console.log(`  achados ................... ${achados.length}\n`)
  for (const a of achados) {
    console.log(`  🔴 ${a.arquivo}:${a.linha} — ${a.termo}`)
    console.log(`     ${a.texto}`)
  }
  if (!achados.length) console.log('  ✅ Nenhum nome de cliente cravado fora da configuração.')
}

process.exit(achados.length ? 1 : 0)
