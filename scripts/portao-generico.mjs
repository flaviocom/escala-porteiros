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
 * ⏱️ **A QUEM ESTE PORTÃO SERVE — porque não é ao cliente de hoje.**
 *
 * O produto atende UMA congregação, e só ela (fase 1 — ver `docs/FINALIDADE_E_FASES.md`). Vender é
 * plano futuro, e não começou. Alguém vai olhar este arquivo e perguntar por que um projeto com um
 * único cliente reprova o *build* por causa do nome desse cliente.
 *
 * **Porque a alternativa não tem volta.** Cravar o nome é barato hoje e caríssimo depois: no dia em
 * que a segunda comum pedir, o trabalho não é configurar — é **reescrever**, achando cada lugar
 * onde o nome vazou. E ele vaza onde ninguém procura: no `alt` de uma imagem, na descrição do
 * `package.json`, no nome do arquivo baixado, dentro do texto que o motor recebe. Eram **nove**
 * lugares quando isto foi medido pela primeira vez.
 *
 * Este portão não serve à fase 1. **Ele serve a manter as fases 2 e 3 possíveis.**
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
  {
    re: /Congrega[çc][ãa]o\s+Crist[ãa]/i,
    nome: 'Congregação Cristã',
    /*
      🔴 O README É EXCEÇÃO DECLARADA PARA ESTE TERMO — sexta auditoria externa, 05/08/2026.

      Ele diz, em citação destacada: *"**Esta instalação** atende a Congregação Cristã no Brasil —
      Jardim São Luiz. Tudo o que é dela está em `public/dados/`; o código não sabe o nome de cliente
      nenhum."* Isso não é vazamento: é a **declaração da fronteira**, escrita para quem chega. Acusá-la
      empurraria alguém a apagar justamente o texto que explica a regra.

      O que continua proibido ali é o nome do cliente no LUGAR DO PRODUTO — "Escala de Porteiros",
      "JD. São Luiz", "CCB" —, que é o que a auditoria injetou como infrator.
    */
    excetoEm: /^README\.md$/,
  },
  // A sigla da instituição, que aparecia no `alt` do emblema ("Logo CCB") e no nome do arquivo.
  //    ⚠️ Escrito SEM barra invertida nenhuma, de propósito: a borda vem de classe de
  //    caracteres, não de `\b`. É a terceira vez que um `\b` gerado por script vira byte de
  //    backspace — e desta vez a autodefesa logo acima o pegou na execução seguinte, que é
  //    exatamente para o que ela foi feita.
  { re: /(^|[^A-Za-z])CCB([^A-Za-z]|$)/, nome: 'sigla da instituição ("CCB")' },
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
  {
    re: new RegExp(String.raw`\birm[ãa]os?\b`, 'i'),
    nome: 'vocabulário de congregação ("irmão")',
    // No README a palavra aparece na LISTA de vocabulários possíveis — "Irmão", "Funcionário",
    // "Plantonista" —, que é a demonstração da configurabilidade, o oposto de um vazamento. E na
    // linha que conta de qual projeto este é sucessor, que é história.
    excetoEm: /^README\.md$/,
  },
  /*
    🔴 "ENSAIO" — terceiro achado que escapa deste portão e vira termo dele, 05/08/2026.

    O rótulo estava cravado em DOIS lugares: `ScheduleTable` imprimia "ENSAIO" em todo turno de
    tarde do site público, e `EscalaImagem` levava "TARDE\nENSAIO" e "TARDE (ENSAIO)" para a imagem
    que vai ao WhatsApp. Uma portaria de prédio com turno de tarde receberia a palavra impressa no
    documento que manda para os funcionários.

    É o mesmo furo de "sem porteiros escalados": o portão varria 38 arquivos, dava 0 achados, e o
    termo não estava na lista. Todo achado que escapa vira termo — senão o portão não aprende.

    A etiqueta agora vem de `Turno.rotulo`, que é dado. O termo continua aqui para o dia em que
    alguém a escrever de volta no componente.

    ⚠️ E ele nasceu LARGO DEMAIS, como o de "porteiro" antes dele. Rodado sem fronteira, acusou dois
    inocentes: `malha.ts`, onde `rotulo: 'ENSAIO'` é **o dado** — o exemplo do campo configurável que
    esta correção existe para usar —, e o comando `npm run ensaio`, que é "ensaio" no sentido de
    simulação e não vai para tela nenhuma. Portão que acusa o inocente é portão que alguém desliga.

    A fronteira é `.tsx`, e ela é a definição exata do problema: **o que renderiza**. Em dado a
    palavra é legítima; em componente, é texto cravado.
  */
  {
    re: new RegExp(String.raw`(?<![-\w])ensaio(?![-\w])`, 'i'),
    nome: 'etiqueta cravada ("ensaio") — use `Turno.rotulo`',
    apenas: /\.tsx$/,
  },
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
    if (/\.(ts|tsx|html|css|json)$/.test(nome)) acc.push(p)
  }
  return acc
}

const html = join(RAIZ, 'index.html')
/*
  🔴 `package.json` ENTROU DEPOIS — achado da auditoria externa, 05/08/2026.

  O campo `description` dizia "Escala de porteiros CCB Jd. São Luiz". É o texto que aparece no
  cartão do repositório e em qualquer listagem de pacote — a vitrine de um repositório PÚBLICO de um
  produto "com intenção de comercialização". O portão varria `src/` e o `index.html` e nunca olhou
  para lá. Fronteira de portão é onde o defeito se esconde.
*/
const pacote = join(RAIZ, 'package.json')
/*
  🔴 E O `README.md` FICOU DE FORA — sexta auditoria externa, 05/08/2026.

  O argumento escrito acima para incluir o `package.json` é *"a vitrine de um repositório PÚBLICO de
  um produto com intenção de comercialização"*. O README é **a vitrine maior desse mesmo
  repositório**: é o que o GitHub renderiza na primeira tela, antes de qualquer arquivo.

  Medido: `## Escala de Porteiros da Congregação Cristã — JD. São Luiz` injetado no README passava os
  20 passos do gate com `achados 0`. A fronteira do portão é onde o defeito mora — sétima vez.

  ⚠️ Só o README, e não `docs/`: os documentos de lá contam a HISTÓRIA deste cliente, e é para isso
  que existem. Varrê-los transformaria o portão em censor do próprio registro.
*/
const leiame = join(RAIZ, 'README.md')
// 🔴 Uma varredura só. A primeira versão chamava `arquivos()` duas vezes — aqui e no laço dos
//    emblemas — e `pulados` acumulava as duas, imprimindo "20 testes pulados" onde havia 10. O
//    número que existe para denunciar cobertura perdida estava ele próprio errado.
const naPasta = arquivos(join(RAIZ, 'src'))
const alvos = [...naPasta, ...(existsSync(html) ? [html] : []), ...(existsSync(pacote) ? [pacote] : []), ...(existsSync(leiame) ? [leiame] : [])]
const achados = []

/*
  🔴 A CLASSE QUE O PORTÃO NÃO ENXERGAVA: emblema importado.

  O logotipo desta congregação era `import logo from './assets/logo-ccb-light.png'`, renderizado no
  cabeçalho do site em desktop e celular. O portão varreu 29 arquivos, deu 0 achados — e estava
  certo pelo critério dele: **um `import` de imagem não tem texto de cliente nenhum**. O nome do
  cliente estava no NOME DO ARQUIVO e nos BYTES da imagem.

  Emblema é identidade visual: varia de cliente para cliente mais do que o próprio nome. Agora vive
  em `dados/`, como os JSON, e `identidade.logo` vazio significa "sem emblema".
*/
for (const abs of naPasta) {
  const rel = relative(RAIZ, abs).replace(/\\/g, '/')
  const fonte = readFileSync(abs, 'utf8')
  for (const m of fonte.matchAll(/^\s*import\s+[^'"]*from\s+['"]([^'"]*\/assets\/[^'"]+)['"]/gm)) {
    achados.push({
      arquivo: rel,
      linha: fonte.slice(0, m.index).split('\n').length,
      termo: 'emblema/asset EMPACOTADO (identidade visual pertence a `dados/`)',
      texto: m[0].trim().slice(0, 110),
    })
  }
}

for (const abs of alvos) {
  const rel = relative(RAIZ, abs).replace(/\\/g, '/')
  if (PERMITIDOS.has(rel)) continue
  const linhas = semComentarios(readFileSync(abs, 'utf8')).split(/\r?\n/)
  linhas.forEach((linha, i) => {
    for (const t of TERMOS) {
      // `apenas` é a fronteira DECLARADA de um termo. Sem ela, vale em toda parte — que é o padrão
      // certo: um termo só ganha fronteira quando se provou que ela é necessária, com o motivo ao lado.
      if (t.apenas && !t.apenas.test(rel)) continue
      // `excetoEm` é o simétrico de `apenas`: o termo vale em toda parte MENOS onde está declarado,
      // sempre com o motivo escrito ao lado. Exceção sem motivo é buraco com outro nome.
      if (t.excetoEm && t.excetoEm.test(rel)) continue
      if (t.re.test(linha)) achados.push({ arquivo: rel, linha: i + 1, termo: t.nome, texto: linha.trim().slice(0, 110) })
    }
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
