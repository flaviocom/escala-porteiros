/**
 * 📄 PORTÃO — o nome do cliente na DOCUMENTAÇÃO é inventário fechado, não texto livre.
 *
 * 🔴 POR QUE ELE EXISTE, E POR QUE NÃO É UMA PROIBIÇÃO. O portão `generico` (§0) varre `src/` e
 * proíbe o nome do cliente cravado — o produto é vendido como genérico, e cada nome no código é uma
 * venda que exige recompilar. Ele **declara não varrer `docs/*.md`**, e a declaração estava certa
 * pelo motivo errado: ninguém tinha medido o que havia lá.
 *
 * Medido em 06/08/2026: **9 ocorrências, em 5 arquivos, todas legítimas** — o `README.md` diz
 * *"**esta instalação** atende…"*, o `MODELO_DE_DADOS.md` mostra o valor num exemplo de JSON de
 * configuração (que é o oposto de cravar: é a prova de que o nome é dado), e o `PORTOES.md` cita os
 * termos porque descreve o portão que os procura.
 *
 * Proibir seria errado — apagaria a documentação de quem o produto atende. Não medir também era
 * errado: **a décima ocorrência entraria em silêncio**, e a primeira que aparecesse dentro de um
 * documento de produto (uma tela descrita, um texto de marketing) passaria como as nove anteriores.
 *
 * Então o critério não é "zero", é **inventário fechado**: cada arquivo tem uma cota conhecida.
 * Ocorrência a mais reprova. Ocorrência a menos também — porque significa que alguém apagou uma
 * cita\u00e7\u00e3o e o inventário deixou de descrever a realidade.
 *
 * 🔴 ISENTOS, declarados: os append-only (`AI_MASTER_LOG`, `DIARIO_DE_BORDO`, `docs/handoff/`,
 * `docs/historico/`, `docs/solicitacoes/`) e as especificações em `docs/superpowers/`. Registram o
 * que era verdade então; reescrevê-los apagaria história.
 *
 * Uso: node scripts/portao-generico-docs.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Os termos que identificam ESTA congregação. Mesmos do portão `generico`. */
const TERMOS = [
  { nome: 'Congregação Cristã', re: /Congrega[çc][ãa]o\s+Crist[ãa]/gi },
  { nome: 'Jardim São Luiz', re: /(?:JD\.?|Jardim)\s+S[ãa]o\s+Luiz/gi },
  { nome: 'CCB', re: /(?<![A-Za-zÀ-ÿ0-9_])CCB(?![A-Za-zÀ-ÿ0-9_])/g },
]

/** Append-only e especificações: registram o que era verdade então. */
const ISENTOS = ['AI_MASTER_LOG.md', 'DIARIO_DE_BORDO.md', 'docs/handoff', 'docs/historico', 'docs/solicitacoes', 'docs/superpowers']

/**
 * O INVENTÁRIO. Cada linha é uma citação que alguém leu e aprovou.
 *
 * Mexeu aqui? A pergunta a responder é: **este documento descreve a INSTALAÇÃO (legítimo) ou
 * descreve o PRODUTO (e aí o nome não devia estar lá)?**
 */
const INVENTARIO = {
  'README.md': 2, //           "esta instalação atende a Congregação Cristã — Jardim São Luiz"
  'AGENTS.md': 2, //           a mesma frase, para quem chega pelo roteador
  'docs/FINALIDADE_E_FASES.md': 2, // (1) quem a fase atende hoje · (2) o termo como EXEMPLO do que não se crava
  'docs/MODELO_DE_DADOS.md': 1, //    o valor dentro de um exemplo de JSON de configuração
  'docs/PORTOES.md': 8, //            descreve os termos que os portões `generico` (3) e o novo `generico:dados` (mais 5, 18/08/2026 — S-060) procuram
  'docs/HISTORICO_ESTADO_2026-08.md': 1, // rotacionado de ESTADO.md em 18/08: "os porteiros da comum do Jd. São Luiz"
  'BACKLOG.md': 1, //                 cita o `alt="Logo CCB"` que foi REMOVIDO — registro de defeito fechado
  'docs/COMUNICACOES.md': 1, //       o modelo de comunicação DESTA instalação: a tradução bíblica (ARC) é a dos impressos oficiais da congregação — decisão S-045, 07/08/2026
}

console.log('📄 O NOME DO CLIENTE NA DOCUMENTAÇÃO — inventário fechado\n')

const isento = (rel) => ISENTOS.some((i) => rel === i || rel.startsWith(i + '/') || rel.startsWith(i + '\\'))

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

const medido = {}
for (const rel of documentos) {
  const texto = readFileSync(join(RAIZ, rel), 'utf8')
  let n = 0
  for (const t of TERMOS) { t.re.lastIndex = 0; n += [...texto.matchAll(t.re)].length }
  if (n > 0) medido[rel] = n
}

const achados = []
for (const [arq, n] of Object.entries(medido)) {
  const esperado = INVENTARIO[arq]
  if (esperado === undefined) achados.push(`${arq} — ${n} citação(ões) do nome do cliente, e este arquivo NÃO está no inventário`)
  else if (n !== esperado) achados.push(`${arq} — o inventário diz ${esperado}, encontrei ${n}`)
}
for (const arq of Object.keys(INVENTARIO)) {
  if (medido[arq] === undefined) achados.push(`${arq} — está no inventário e não tem nenhuma citação: o inventário parou de descrever a realidade`)
}

const total = Object.values(medido).reduce((s, n) => s + n, 0)
console.log(`  documentos varridos ....... ${documentos.length}`)
console.log(`  isentos (append-only) ..... ${ISENTOS.join(', ')}`)
console.log(`  citações encontradas ...... ${total} em ${Object.keys(medido).length} arquivo(s)`)
console.log(`  inventário declara ........ ${Object.values(INVENTARIO).reduce((s, n) => s + n, 0)} em ${Object.keys(INVENTARIO).length} arquivo(s)`)
console.log(`  divergências .............. ${achados.length}\n`)

for (const a of achados) console.log(`  🔴 ${a}`)

if (documentos.length === 0) {
  console.log('🔴 nenhum documento foi varrido — não há o que provar, e isso é defeito de população.')
  process.exit(1)
}
if (achados.length) {
  console.log('\n   Citação nova não é proibida — é uma DECISÃO. Este documento descreve a INSTALAÇÃO')
  console.log('   (legítimo: acrescente ao inventário) ou descreve o PRODUTO (e aí o nome não devia')
  console.log('   estar lá, porque ele é vendido como genérico)?')
  process.exit(1)
}
console.log(`✅ as ${total} citações são exatamente as ${total} que o inventário conhece.`)
