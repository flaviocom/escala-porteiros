/**
 * MEDE OS FATOS DO PROJETO — e reprova documento vivo que os desminta.
 *
 * 🔴 POR QUE ESTE PORTÃO EXISTE. Um teste de portabilidade em 05/08/2026 deu a documentação a outra
 * inteligência artificial, proibida de abrir código, e pediu que reconstruísse o produto. Entre os
 * achados, um veredito estrutural:
 *
 *   > "O portão `contagem` existe justamente para impedir que documento vivo declare número que o
 *   > código desmente — e este conjunto contém **14 contradições numéricas** (piso 6/7, 30/12 vs
 *   > 31/12, 12/13 passos, 15/21 casos, 2/4 hosts…). **O portão responde só a pergunta que foi
 *   > feita** — número de *regras* — e o resto passou."
 *
 * A conclusão não é "escrever com mais cuidado". É que **número escrito à mão apodrece**, e o único
 * remédio que funciona é o mesmo do catálogo de regras: **medir, e cobrar**.
 *
 * Cada fato aqui é MEDIDO de uma fonte executável — `package.json`, o catálogo, a saída de um
 * portão, o dado publicado. Nenhum é digitado.
 *
 * Uso:
 *   node scripts/medir-fatos.mjs             # imprime os fatos medidos
 *   node scripts/medir-fatos.mjs --conferir  # PORTÃO: reprova documento vivo que os desminta
 *   node scripts/medir-fatos.mjs --json
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { carregarDominio } from './lib/dominio.mjs'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const ler = (p) => readFileSync(join(RAIZ, p), 'utf8')
const json = (p) => JSON.parse(ler(p))

/** Roda um script e devolve a saída, mesmo quando ele sai diferente de 0 (portão vermelho fala). */
/**
 * Tira os códigos de cor ANSI.
 *
 * 🔴 Sem isto, o fato "testes na suíte" saía como `?`: o vitest imprime `Tests` e o número com
 * escapes de cor no meio, e a expressão não casava. Um fato que não mede é um fato que sempre
 * concorda — pior que fato ausente, porque conta como cobertura.
 */
const semCor = (t) => t.replace(new RegExp(String.fromCharCode(27) + String.raw`\[[0-9;]*m`, 'g'), '')

function saidaDe(args) {
  try {
    return semCor(execFileSync(process.execPath, args.map((a) => (a.startsWith('scripts/') ? join(RAIZ, a) : a)), {
      encoding: 'utf8',
      cwd: RAIZ,
      // 🔴 stderr silenciado DE PROPÓSITO. O autoteste do portão genérico injeta a corrupção do
      //    escape num clone, para provar que a autodefesa morde — e o grito dela vazava para cá,
      //    parecendo que o portão de verdade estava quebrado. Custou uma investigação.
      stdio: ['ignore', 'pipe', 'ignore'],
    }))
  } catch (e) {
    return semCor(String(e.stdout ?? ''))
  }
}

const pacote = json('package.json')
const { CATALOGO } = await carregarDominio()
const blocos = json('public/dados/blocos.json').blocos
const inventario = ler('docs/INVENTARIO_DE_FONTES.md')

const autoteste = saidaDe(['scripts/autoteste-portao-generico.mjs'])
const generico = saidaDe(['scripts/portao-generico.mjs'])
const auditoria = saidaDe(['scripts/auditoria-adversarial.mjs'])
const comandos = saidaDe(['scripts/conferir-comandos-da-documentacao.mjs'])

const numeroEm = (texto, re) => {
  const m = texto.match(re)
  return m ? Number(m[1]) : null
}

const ultimoBloco = blocos[blocos.length - 1]
const congelado = blocos.find((b) => b.origem === 'importado') ?? blocos[0]

/**
 * OS FATOS.
 *
 * `chave` identifica o fato. `valor` é o que foi medido. `padroes` são as formas em que aquele
 * número aparece escrito nos documentos — cada uma com um grupo de captura no número.
 *
 * ⚠️ Os padrões são deliberadamente ESPECÍFICOS. Um padrão largo casaria com qualquer frase e
 * encheria o portão de ruído — e portão ruidoso é portão que alguém desliga.
 */
/**
 * 🔴 NÚMERO ENTRE ASPAS É CITAÇÃO, NÃO AFIRMAÇÃO — mesma régua do portão de contagem, 05/08/2026.
 *
 * O `PORTOES.md` registra, em citação, que *"o documento dizia «17 testes pulados» e «os 7 termos»"*.
 * Esse texto é o registro do defeito, e é o que impede repeti-lo. Acusá-lo empurraria alguém a apagar
 * a lição para calar o portão — que é a pior troca possível.
 */
function dentroDeAspas(texto, indice) {
  const inicio = texto.lastIndexOf(String.fromCharCode(10), indice) + 1
  const antes = texto.slice(inicio, indice)
  return ((antes.match(/["“”«»]/g) ?? []).length) % 2 === 1
}

const FATOS = [
  {
    chave: 'passos do gate',
    valor: pacote.scripts.gate.split('&&').length,
    /*
      🔴 O NÚMERO PODE VIR ANTES DE "GATE" — quarto buraco de fronteira, achado em 05/08/2026.

      Os três padrões originais exigiam o número **à direita** da palavra `gate`. Quatro documentos
      vivos afirmavam a contagem, e este portão cobria **um**. O `PORTOES.md` escrevia
      *"Os 16 passos do `npm run gate`"* — número à ESQUERDA — com o gate em 19, e
      `fatos:conferir` saía 0 com o defeito na frente dele.

      É o padrão que três auditorias já nomearam neste projeto — *"o portão responde só a pergunta
      que foi feita"* — repetindo dentro do portão criado para fechar exatamente essa classe.

      ⚠️ Número **por extenso** ("dezenove") continua fora do alcance, e isso é limite declarado:
      cobrir extenso exigiria um dicionário, e dicionário incompleto é pior que ausência — dá a
      impressão de cobertura. Quem escrever por extenso escreve também o algarismo ao lado.
    */
    padroes: [
      /GATE (?:tem|encadeia) (?:\*\*)?(\d+)(?:\*\*)? passos/gi,
      /npm run gate\s+#\s*(\d+) passos/gi,
      /encadeia \*\*(\d+)\*\* passos/gi,
      /(?:os\s+)?(\d+)\s+passos\s+do\s+`?npm run gate`?/gi,
      /^(\d+) passos, \*\*nesta ordem\*\*/gim,
    ],
    fonte: 'package.json → scripts.gate',
  },
  {
    chave: 'casos do autoteste do portão genérico',
    valor: numeroEm(autoteste, /de (\d+) casos corretos/),
    // ⚠️ APERTADOS depois de um falso positivo. A primeira versão usava `autoteste.{0,40}?(\d+) casos`
    //    e casou uma linha do BACKLOG que falava de outra coisa inteiramente. Portão que acusa o
    //    inocente é portão que alguém desliga — e aí ele não protege nem o culpado.
    // ⚠️ APERTADOS DUAS VEZES, e as duas por falso positivo:
    //    1ª — `autoteste.{0,40}?(\d+) casos` casou uma linha do BACKLOG sobre outra coisa;
    //    2ª — `autoteste (de |do portão )?(\d+) casos` casou o autoteste do PRÉ-VOO, que tem 8.
    //    Este projeto tem mais de um autoteste. O padrão precisa dizer de QUAL está falando —
    //    senão o portão acusa o inocente, e portão que acusa o inocente alguém desliga.
    padroes: [
      /generico:autoteste[^|\n]{0,70}?(\d+) casos/gi,
      /portão (?:acima |genérico )[^|\n]{0,30}?morde[^|\n]{0,25}?(\d+) casos/gi,
    ],
    fonte: 'node scripts/autoteste-portao-generico.mjs',
  },
  {
    chave: 'checagens da auditoria adversarial',
    valor: numeroEm(auditoria, /(\d+) checagem\(ns\)/),
    padroes: [/(\d+) ataques ao próprio código/gi],
    fonte: 'node scripts/auditoria-adversarial.mjs',
  },
  {
    chave: 'arquivos varridos pelo portão genérico',
    valor: numeroEm(generico, /arquivos varridos \.+ (\d+)/),
    padroes: [/(\d+) arquivos varridos/gi],
    fonte: 'node scripts/portao-generico.mjs',
  },
  {
    chave: 'termos do portão genérico',
    valor: numeroEm(generico, /termos procurados \.+ (\d+)/),
    /*
      🔴 O PADRÃO EXIGIA "N termos, M achados" NA MESMA LINHA — sexta auditoria externa, 05/08/2026.
      O `PORTOES.md` escreve **"Os 7 termos:"** e depois lista, que é a forma natural de documentar.
      O fato existia, o documento mentia, e o portão dava verde. Oitava vez que a fronteira do portão
      é onde o defeito mora.
    */
    padroes: [/(\d+) termos(?: de cliente)?,? \d* ?achados/gi, /os\s+\*{0,2}(\d+)\*{0,2}\s+termos/gi],
    fonte: 'node scripts/portao-generico.mjs',
  },
  {
    /*
      Não existia fato nenhum para este número, e o `PORTOES.md` afirmava um valor errado. O portão
      pula os testes de propósito (as fixtures usam o nome do cliente), e o NÚMERO de pulados é a
      única defesa contra ele passar a pular o que não devia.
    */
    chave: 'testes pulados pelo portão genérico',
    valor: numeroEm(generico, /testes pulados \.+ (\d+)/),
    padroes: [/\*{0,2}(\d+)\*{0,2}\s+testes pulados/gi],
    fonte: 'node scripts/portao-generico.mjs',
  },
  {
    chave: 'documentos vivos varridos',
    valor: numeroEm(comandos, /documentos vivos varridos \.+ (\d+)/),
    // ⚠️ ALARGADOS: a primeira versão exigia a palavra "documentos" COLADA no número, e deixou
    //    passar "agora descobre e mede **15**." — a frase mais natural de todas. Padrão que só pega
    //    a forma que o autor imaginou é padrão que cobre o autor, não o texto.
    padroes: [
      /mede \*\*(\d+)(?: documentos)?\*\*/gi,
      /descoberta de (\d+)/gi,
      /(\d+) documentos vivos/gi,
      /documentos vivos[^|\n]{0,20}?(\d+)/gi,
    ],
    fonte: 'node scripts/conferir-comandos-da-documentacao.mjs',
  },
  {
    chave: 'piso alcançado no bloco publicado',
    valor: ultimoBloco.pisoAlcancado,
    padroes: [/piso (?:alcançado )?(?:de )?\*\*(\d+)\*\* dias/gi, /piso de \*\*(\d+)\*\* dias/gi],
    fonte: 'public/dados/blocos.json → último bloco',
  },
  {
    chave: 'turnos do bloco congelado',
    valor: congelado.turnos.length,
    padroes: [/congelado[^.\n]{0,40}?(\d+) turnos/gi, /(\d+) turnos congelados/gi],
    fonte: 'public/dados/blocos.json → bloco importado',
  },
  {
    chave: 'fontes externas declaradas',
    // O portão de fontes já mede as duas pontas (chamadas e declaradas) e reprova se divergirem.
    // Aqui só se cobra que o TEXTO do inventário diga o mesmo número que ele conta.
    valor: numeroEm(saidaDe(['scripts/inventariar-fontes.mjs', '--conferir']), /hosts declarados \.+ (\d+)/),
    padroes: [/\*\*(\d+)\*\* fontes externas/gi],
    fonte: 'node scripts/inventariar-fontes.mjs --conferir',
  },
  {
    chave: 'regras no catálogo',
    valor: CATALOGO.length,
    padroes: [/(\d+) regras (?:do )?catálogo/gi, /catálogo de (\d+) regras/gi],
    fonte: 'src/dominio/regras.ts → CATALOGO',
  },
  {
    chave: 'regras duras',
    valor: CATALOGO.filter((r) => r.familia === 'DURA').length,
    padroes: [/(\d+) (?:regras )?duras/gi],
    fonte: 'src/dominio/regras.ts',
  },
  /*
    🔴 O NÚMERO MAIS CITADO DO PROJETO NÃO ERA MEDIDO POR NADA — sexta auditoria externa, 05/08/2026.

    "175 testes", "232 testes", "263 testes" aparecem em dezenas de frases — em `ESTADO.md`, em
    `ARQUITETURA.md`, no índice de solicitações — e os onze fatos medidos não incluíam este. Medido
    naquele dia: `ESTADO.md` dizia **175**, `ARQUITETURA.md` dizia **232**, e a suíte tinha **263**.
    `fatos:conferir` saía com "0 contradições".

    É o número que alguém usa para julgar se o projeto está coberto. Ele agora vem do vitest.
  */
  /*
    🔴 QUATRO POPULAÇÕES DO `PORTOES.md` APODRECERAM EM UM DIA — sétima auditoria (regressão),
    05/08/2026. O item P7.8, *"populações erradas no PORTOES.md"*, foi fechado em 05/08 **corrigindo
    os números à mão, sem portão** — e no dia seguinte os quatro estavam errados de novo: 83 contra
    90, 83 contra 89, 62 contra 66, 11 contra 13.

    É a frase que este arquivo imprime no rodapé, aplicada a ele mesmo: **meça, ou não escreva.**
  */
  {
    chave: 'arquivos varridos pelo portão de fontes',
    valor: numeroEm(saidaDe(['scripts/inventariar-fontes.mjs', '--conferir']), /varredura: (\d+) arquivo/),
    // ⚠️ Construído por `RegExp` + `String.raw`: um `\n` dentro da classe de caracteres, escrito por
    //    script, vira quebra de linha DE VERDADE e o arquivo nem carrega. Sexta vez neste projeto.
    padroes: [new RegExp(String.raw`\*{0,2}(\d+)\*{0,2} arquivos?[^.\n]{0,30}fontes`, 'gi')],
    fonte: 'node scripts/inventariar-fontes.mjs --conferir',
  },
  {
    chave: 'arquivos varridos pelo portão de datas',
    valor: numeroEm(saidaDe(['scripts/portao-datas.mjs']), /arquivos varridos \.+ (\d+)/),
    padroes: [new RegExp(String.raw`\*{0,2}(\d+)\*{0,2} arquivos?[^.\n]{0,30}(?:datas|toISOString)`, 'gi')],
    fonte: 'node scripts/portao-datas.mjs',
  },
  {
    chave: 'botões medidos pelas regras mestras',
    valor: numeroEm(saidaDe(['scripts/medir-regras-mestras.mjs']), /botões medidos \.+ (\d+)/),
    padroes: [/\*{0,2}(\d+)\*{0,2} botões medidos/gi],
    fonte: 'node scripts/medir-regras-mestras.mjs',
  },
  {
    chave: 'testes na suíte',
    valor: numeroEm(saidaDe(['node_modules/vitest/vitest.mjs', 'run', '--reporter=basic']), /Tests\s+(\d+) passed/),
    /*
      ⚠️ O padrão exige que a frase se declare como TOTAL DE HOJE — "N testes na suíte", "N testes no
      total", "N testes hoje", ou a linha de tabela `| Testes | … | N |`.

      A primeira versão era `(\d+) testes` e acusou oito linhas, das quais SETE eram legítimas: "5
      testes" sobre uma correção específica, "17 testes pulados" pelo portão genérico, e — as mais
      instrutivas — *"passavam nos 232 testes"*, que **conta o tamanho da suíte no momento em que o
      defeito foi medido**. Esse texto é o registro, e apagá-lo para calar o portão seria perder a
      medição.

      Mesma régua da contagem de regras: narrativa não é afirmação. Quem quer a garantia escreve a
      frase que a pede.
    */
    padroes: [
      /(\d+)\s+testes\s+(?:verdes\s+)?(?:na suíte|no total|hoje)/gi,
      /\|\s*Testes\s*\|[^|]*\|\s*\*{0,2}(\d+)\*{0,2}[^|]*\|/gi,
    ],
    fonte: 'npx vitest run',
  },
]

// ---------------------------------------------------------------------------
const HISTORICOS = ['AI_MASTER_LOG.md', 'DIARIO_DE_BORDO.md', 'docs/handoff/', 'docs/historico/', 'docs/superpowers/']

function vivos(dir = RAIZ, acc = []) {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'capturas'].includes(item.name)) continue
    const abs = join(dir, item.name)
    if (item.isDirectory()) { vivos(abs, acc); continue }
    if (!item.name.endsWith('.md')) continue
    const rel = relative(RAIZ, abs).split(sep).join('/')
    if (HISTORICOS.some((h) => rel === h || rel.startsWith(h))) continue
    acc.push(rel)
  }
  return acc
}

const documentos = vivos().sort()
const achados = []
let conferidas = 0

for (const rel of documentos) {
  const linhas = ler(rel).split(/\r?\n/)
  linhas.forEach((linha, i) => {
    for (const fato of FATOS) {
      if (fato.valor == null) continue
      for (const re of fato.padroes) {
        re.lastIndex = 0
        for (const m of linha.matchAll(re)) {
          conferidas++
          if (Number(m[1]) === fato.valor) continue
          // Citação de um número antigo é registro, não afirmação. Ver `dentroDeAspas`.
          if (dentroDeAspas(linha, m.index)) continue
          // Dois padrões podem casar a MESMA afirmação (ex.: uma frase que cita o portão e o verbo
          // "morde"). Relatar duas vezes o mesmo defeito faz o número de achados mentir para cima.
          const jaTem = achados.some((a) => a.arquivo === rel && a.linha === i + 1 && a.fato === fato.chave)
          if (jaTem) continue
          achados.push({
            arquivo: rel, linha: i + 1, fato: fato.chave,
            escrito: Number(m[1]), medido: fato.valor, fonte: fato.fonte,
            trecho: linha.trim().slice(0, 100),
          })
        }
      }
    }
  })
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ fatos: FATOS.map(({ chave, valor, fonte }) => ({ chave, valor, fonte })), conferidas, achados }, null, 2))
  process.exit(achados.length ? 1 : 0)
}

console.log('FATOS MEDIDOS DO PROJETO\n')
for (const f of FATOS) {
  console.log(`  ${String(f.valor ?? '?').padStart(4)}  ${f.chave.padEnd(42)} ← ${f.fonte}`)
}

if (!process.argv.includes('--conferir')) process.exit(0)

console.log(`\nCONFERÊNCIA NOS DOCUMENTOS VIVOS\n`)
console.log(`  documentos varridos ......... ${documentos.length}`)
console.log(`  isentos ..................... ${HISTORICOS.join(', ')} (append-only)`)
console.log(`  afirmações conferidas ....... ${conferidas}`)
console.log(`  contradições ................ ${achados.length}\n`)

for (const a of achados) {
  console.log(`  🔴 ${a.arquivo}:${a.linha} — ${a.fato}`)
  console.log(`     escrito: ${a.escrito} · medido: ${a.medido} (${a.fonte})`)
  console.log(`     ${a.trecho}`)
}

if (!achados.length) console.log('  ✅ Nenhum documento vivo desmente um fato medido.')
else console.log('\n   Número escrito à mão apodrece. Meça, ou não escreva.')

process.exit(achados.length ? 1 : 0)
