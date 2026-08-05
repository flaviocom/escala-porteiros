/**
 * INVENTÁRIO DE FONTES — de onde vem cada dado, a que custo, e se há caminho melhor.
 *
 * Regra global (`_padroes-globais/SOBERANIA_DE_DADOS.md`). As cinco perguntas que todo projeto com
 * fonte externa precisa responder: de onde vem · o que entrega · com que frequência · é pago e
 * quanto · estamos na melhor situação.
 *
 * ⚠️ O documento é **gerado**, nunca escrito à mão. Inventário escrito à mão envelhece em uma semana
 * e passa a mentir com autoridade.
 *
 * O que o código MEDE sozinho: o host chamado e quem o consome. O que uma pessoa DECLARA: o que a
 * fonte entrega em português, o custo com a data em que foi conferido, a alternativa conhecida e o
 * que quebra se ela cair.
 *
 * ⚠️ A variável de ambiente é DECLARADA, não inferida do arquivo. No ThetaLens a inferência listou a
 * fonte de opções exigindo o token do Telegram, porque um arquivo grande toca muitas variáveis —
 * e ruído numa tabela de custo faz perder a confiança no resto do documento.
 *
 * Uso: node scripts/inventariar-fontes.mjs [--conferir]
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * O que só uma pessoa sabe. Toda fonte externa precisa estar aqui — o portão reprova host chamado e
 * não declarado, que é como uma dependência nova entra sem ninguém perceber.
 */
const DECLARADAS = [
  {
    host: 'api.github.com',
    nome: 'API do GitHub (Contents)',
    entrega: 'grava e lê os arquivos de dados da escala (pessoas, blocos, configuração)',
    frequencia: 'sob demanda — uma vez por publicação',
    custo: 'gratuita nos limites da conta pessoal',
    custoConferidoEm: '04/08/2026',
    variavel: 'GITHUB_PAT_ESCALA_PORTEIROS',
    seCair: 'não publica pela tela; o botão "baixar JSON" continua salvando o trabalho',
    alternativa: 'commit manual pelo próprio site do GitHub, ou por linha de comando',
    derivavel: false,
  },
  {
    host: 'github.com',
    nome: 'Site do GitHub (páginas de upload)',
    // 🔴 É a única da lista que NÃO busca dado: são endereços que a tela oferece para publicar à
    // mão, apontando para a pasta certa. O portão exige declaração de todo host chamado, e reprovou
    // este assim que a constante entrou no código — antes de qualquer commit.
    entrega: 'nada — são links que a tela oferece para publicar à mão, apontando para a pasta certa',
    frequencia: 'nunca automaticamente: só se a pessoa clicar',
    custo: 'zero',
    custoConferidoEm: '04/08/2026',
    variavel: null,
    seCair: 'o caminho manual fica sem atalho; publicar pelo botão continua funcionando',
    alternativa: 'navegar até a pasta no GitHub à mão',
    derivavel: false,
  },
  {
    host: 'api.anthropic.com',
    nome: 'Motor de sugestão',
    entrega: 'proposta alternativa de distribuição, explicação em português, arbitragem quando a escala não fecha, e auditoria da escala pronta',
    frequencia: 'sob demanda — uma chamada por mês gerado',
    custo: 'por uso, conta separada. ⚠️ saldo zerado derruba o motor (HTTP 400)',
    custoConferidoEm: '04/08/2026',
    variavel: 'ANTHROPIC_API_KEY_ESCALA',
    seCair: 'o algoritmo continua gerando e validando; perde-se só a proposta e os textos',
    alternativa: 'nenhuma necessária — a distribuição é DERIVÁVEL e o algoritmo já a faz de graça',
    derivavel: true,
  },
  {
    host: 'flaviocom.github.io',
    nome: 'GitHub Pages',
    entrega: 'hospeda o site e serve os arquivos de dados',
    frequencia: 'a cada abertura do site',
    custo: 'gratuita para repositório público',
    custoConferidoEm: '04/08/2026',
    variavel: '—',
    seCair: 'o site sai do ar; os dados continuam no repositório',
    alternativa: 'qualquer hospedagem estática',
    derivavel: false,
  },
]

/**
 * O ÚNICO arquivo isento da varredura, e por quê: ele É a declaração.
 *
 * Este script contém a tabela `FONTES`, onde cada host aparece como texto. Varrê-lo faria a
 * declaração se autoconfirmar — todo host declarado passaria a contar como "host chamado", e a
 * conferência viraria uma tautologia. A isenção é declarada aqui, impressa no relatório e contada:
 * isenção silenciosa é como um portão apodrece.
 */
const ISENTO = 'scripts/inventariar-fontes.mjs'

/**
 * Hosts que NÃO são fonte externa — e por que cada grupo não é um afrouxamento.
 *
 * O inventário existe para responder "de onde vem cada dado, a que custo, e o que acontece se cair".
 * Duas famílias de host não respondem a nenhuma dessas perguntas:
 *
 *  • **Laço local** (`127.0.0.1`, `localhost`, `0.0.0.0`, `::1`) — é a própria máquina. Aparece nos
 *    scripts que sobem um servidor para validar ao vivo. Não tem dono, não tem custo, não cai.
 *  • **Domínios reservados pela RFC 2606** (`example.com/.net/.org`, `.test`, `.invalid`,
 *    `.localhost`) — a norma os reserva para documentação e teste, e garante que nunca serão
 *    registrados. São dados de teste por definição: `scripts/auditoria-adversarial.mjs` usa um
 *    deles como infrator do próprio autoteste.
 *
 * ⚠️ A exclusão é por REGRA, não por lista de arquivos, e o relatório imprime quantos caíram nela.
 * Isentar um arquivo esconderia junto qualquer host real que ele viesse a chamar.
 */
const RE_LACO_LOCAL = /^(127\.\d+\.\d+\.\d+|localhost|0\.0\.0\.0|::1|\[::1\])$/
const RE_RESERVADO_RFC2606 = /(^|\.)(example\.(com|net|org)|test|invalid|localhost)$/

const naoEhFonteExterna = (host) => RE_LACO_LOCAL.test(host) || RE_RESERVADO_RFC2606.test(host)

/** Varre o código e MEDE quais hosts são de fato chamados, e por quem. */
function medirHosts() {
  const encontrados = new Map()
  const arquivos = []
  const andar = (dir) => {
    for (const nome of readdirSync(dir)) {
      if (['node_modules', '.git', 'docs', 'dist'].includes(nome)) continue
      const c = join(dir, nome)
      if (statSync(c).isDirectory()) andar(c)
      else if (['.ts', '.tsx', '.mjs'].includes(extname(c))) arquivos.push(c)
    }
  }
  // 🔴 `scripts/` ENTROU EM 04/08/2026, por auditoria independente.
  //
  // A varredura começava e terminava em `src/`. Mas os scripts de build e de validação fazem
  // chamadas de rede DE VERDADE — `flaviocom.github.io` aparece em seis deles. Um auditor injetou
  // um host novo e não declarado em `scripts/gerar-imagem-exemplo.mjs` e o portão respondeu
  // "✅ toda fonte chamada está declarada", exit 0.
  //
  // O portão media metade da população e afirmava sobre o todo — que é a forma deste método de
  // ficar cego: não um vermelho ignorado, um verde que nunca teve como ser vermelho.
  andar(join(RAIZ, 'src'))
  andar(join(RAIZ, 'scripts'))

  const rel = (c) => relative(RAIZ, c).replace(/\\/g, '/')
  const isentados = arquivos.filter((c) => rel(c) === ISENTO)
  const foraDeEscopo = new Set()
  for (const caminho of arquivos.filter((c) => rel(c) !== ISENTO)) {
    const codigo = readFileSync(caminho, 'utf8')
    // Só chamadas de verdade, não menção em comentário: procura URL dentro de fetch/URL literal.
    // 🔴 O `//` de "https://" NÃO é comentário.
    //
    // A primeira versão usava /\/\/[^\n]*/ e comia a URL inteira a partir do "//", então a
    // varredura mediu ZERO hosts e o portão disse "✅ toda fonte declarada". Verde que não prova
    // nada é pior que vermelho: ele autoriza a seguir em frente.
    //
    // O lookbehind por ":" resolve, e o autoteste abaixo garante que não volte.
    const semComentario = codigo
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/(?<!:)\/\/[^\n]*/g, ' ')
    for (const m of semComentario.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)) {
      const host = m[1].toLowerCase()
      if (naoEhFonteExterna(host)) { foraDeEscopo.add(host); continue }
      if (!encontrados.has(host)) encontrados.set(host, new Set())
      encontrados.get(host).add(rel(caminho))
    }
  }
  // O número medido só significa alguma coisa junto com a população: "2 hosts" não diz se foram
  // 26 arquivos ou 4.
  console.log(
    `  varredura: ${arquivos.length - isentados.length} arquivo(s) em src/ e scripts/` +
      (isentados.length ? ` · ${isentados.length} isento (${ISENTO} — é a própria declaração)` : ''),
  )
  if (foraDeEscopo.size)
    console.log(`  fora de escopo: ${[...foraDeEscopo].sort().join(', ')} (laço local ou reservado pela RFC 2606)`)
  return encontrados
}

// ---------------------------------------------------------------------------
// 🔒 AUTOTESTE — um medidor que nunca foi visto ACHANDO é indistinguível de um quebrado
// ---------------------------------------------------------------------------

function autoteste() {
  const casos = [
    {
      nome: 'acha host em template literal',
      codigo: 'const r = await fetch(`https://api.github.com/repos/${x}`)',
      espera: 'api.github.com',
    },
    {
      nome: 'acha host em string comum',
      codigo: "const URL_API = 'https://api.anthropic.com/v1/messages'",
      espera: 'api.anthropic.com',
    },
    {
      nome: '🔴 NÃO confunde "://" com comentário',
      codigo: 'fetch("https://api.exemplo.com/x") // chamada real',
      espera: 'api.exemplo.com',
    },
    { nome: 'ignora host citado em comentário de linha', codigo: '// veja https://so-comentario.com', espera: null },
    { nome: 'ignora host citado em comentário de bloco', codigo: '/* https://so-bloco.com */', espera: null },
  ]

  let falhas = 0
  console.log('AUTOTESTE — medidor de hosts\n')
  for (const c of casos) {
    const semComentario = c.codigo
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/(?<!:)\/\/[^\n]*/g, ' ')
    const achados = [...semComentario.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)].map((m) => m[1].toLowerCase())
    const ok = c.espera ? achados.includes(c.espera) : achados.length === 0
    if (!ok) falhas++
    console.log(`  ${ok ? '✅' : '🔴'} ${c.nome} — achou: ${achados.join(', ') || '(nada)'}`)
  }
  console.log(falhas === 0 ? '\n✅ O medidor acha o que deve e ignora o que deve.\n' : `\n🔴 ${falhas} caso(s) falharam.\n`)
  return falhas === 0
}

if (!autoteste()) {
  console.error('🔴 O medidor reprovou no próprio autoteste — não vale confiar no que ele mediu.')
  process.exit(1)
}

const medidos = medirHosts()
const declarados = new Set(DECLARADAS.map((d) => d.host))

// 🔒 O PORTÃO: host chamado e não declarado é fonte que entrou sem ninguém decidir.
const naoDeclarados = [...medidos.keys()].filter((h) => !declarados.has(h))

if (process.argv.includes('--conferir')) {
  console.log('CONFERÊNCIA DO INVENTÁRIO DE FONTES\n')
  console.log(`  hosts chamados no código ... ${medidos.size}`)
  console.log(`  hosts declarados .......... ${declarados.size}`)
  if (medidos.size === 0 && DECLARADAS.some((d) => d.variavel !== '—')) {
    console.error('\n🔴 O medidor achou ZERO hosts num projeto que declara fontes externas.')
    console.error('   Isso é medidor quebrado, não projeto sem fonte. Um verde aqui não valeria nada.')
    process.exit(1)
  }
  if (naoDeclarados.length) {
    console.error(`\n🔴 ${naoDeclarados.length} host(s) chamado(s) e NÃO declarado(s):`)
    for (const h of naoDeclarados) console.error(`   · ${h} — em ${[...medidos.get(h)].join(', ')}`)
    console.error('\n   Fonte externa nova entra no inventário no MESMO passo em que entra no código.')
    process.exit(1)
  }
  console.log('\n✅ Toda fonte chamada está declarada.')
  process.exit(0)
}

// ---------------------------------------------------------------------------
// Gera o documento
// ---------------------------------------------------------------------------

const hoje = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })

const linhas = DECLARADAS.map((d) => {
  const consumidores = medidos.get(d.host)
  return `### ${d.nome}

| | |
|---|---|
| **De onde vem** | \`${d.host}\` |
| **O que entrega** | ${d.entrega} |
| **Com que frequência** | ${d.frequencia} |
| **Custo** | ${d.custo} · conferido em ${d.custoConferidoEm} |
| **Credencial** | ${d.variavel === '—' ? 'não exige' : `\`${d.variavel}\` — valor só na central`} |
| **Quem consome** | ${consumidores ? [...consumidores].map((c) => `\`${c}\``).join(', ') : '_(medido: nenhum arquivo chama este host)_'} |
| **Se cair** | ${d.seCair} |
| **Alternativa** | ${d.alternativa} |
${d.derivavel ? '\n> ⚠️ **Este dado é DERIVÁVEL.** A distribuição da escala é calculada de graça pelo algoritmo em\n> `src/dominio/gerador.ts`. O que se paga aqui é a *leitura da situação* e a *explicação* — não o\n> resultado. É uma escolha, e está declarada como tal.\n' : ''}`
}).join('\n')

const doc = `# INVENTÁRIO DE FONTES — escala-porteiros

> 🤖 **Documento GERADO** por \`scripts/inventariar-fontes.mjs\` em ${hoje}.
> Não edite à mão: inventário escrito à mão envelhece em uma semana e passa a mentir com autoridade.
> Para mudar o conteúdo, edite a lista \`DECLARADAS\` no script e gere de novo.
>
> **Cadeia de navegação:** [\`ESTADO.md\`](../ESTADO.md) → [\`handoff\`](handoff/INDICE.md) → [\`BACKLOG.md\`](../BACKLOG.md)
> **Roteador:** [\`AGENTS.md\`](../AGENTS.md) · Regra: \`_padroes-globais/SOBERANIA_DE_DADOS.md\`

---

## As cinco perguntas

De onde vem · o que entrega · com que frequência · é pago e quanto · estamos na melhor situação.

Este projeto tem **${DECLARADAS.length} fontes externas**, e ${DECLARADAS.filter((d) => d.derivavel).length} delas entrega algo **derivável**.

${linhas}

---

## A pergunta que economiza dinheiro: pagamos por algo derivável?

**Sim, e de propósito.** A distribuição da escala é calculada pelo algoritmo, de graça, em
\`src/dominio/gerador.ts\` — inclusive com o piso de distanciamento descoberto por busca. O que o
motor acrescenta é outra coisa: a leitura da situação, a explicação em português, a arbitragem
quando a escala não fecha e a segunda opinião sobre a escala pronta.

**Se o motor sair do ar, nada essencial para.** Gerar, validar e publicar continuam funcionando.

## Portão

\`\`\`bash
node scripts/inventariar-fontes.mjs --conferir
\`\`\`

Reprova se algum host for **chamado no código e não declarado** aqui — que é como uma fonte externa
entra num projeto sem ninguém ter decidido por ela.

**Medido nesta geração:** ${medidos.size} host(s) chamado(s), ${declarados.size} declarado(s), ${naoDeclarados.length} não declarado(s).

## Quando refazer

- Ao plugar fonte nova — o portão reprova antes de o commit passar.
- A cada trimestre: preço muda, plano muda, alternativa nova aparece.
- Ao receber a fatura: se a linha do extrato não bate com esta tabela, uma das duas está errada.
`

writeFileSync(join(RAIZ, 'docs', 'INVENTARIO_DE_FONTES.md'), doc, 'utf8')
console.log(`✅ docs/INVENTARIO_DE_FONTES.md gerado (${DECLARADAS.length} fontes, ${medidos.size} host(s) medido(s))`)
if (naoDeclarados.length) {
  console.error(`\n🔴 ${naoDeclarados.length} host(s) não declarado(s): ${naoDeclarados.join(', ')}`)
  process.exit(1)
}
