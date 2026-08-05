/**
 * PORTÃO — o que os documentos VIVOS dizem sobre o catálogo bate com o catálogo?
 *
 * 🔴 POR QUE ELE EXISTE. Em 04/08/2026 uma auditoria independente achou isto: o código tinha **10**
 * regras duras e a especificação — o arquivo que o `AGENTS.md` aponta como fonte para "as regras da
 * escala" — dizia **9**, em quatro lugares. D10 tinha sido acrescentada ao código e ao `AGENTS.md`,
 * e ninguém voltou no desenho. Aqui é a DOCUMENTAÇÃO que mede menos do que o código executa.
 *
 * No mesmo dia, ao acrescentar D11, a contagem quebrou em oito arquivos de uma vez. Corrigir os oito
 * à mão resolveria hoje e voltaria a quebrar na próxima regra: por isso o conserto é um portão, não
 * uma revisão. **Número decorado é como um texto passa a mentir sem ninguém notar.**
 *
 * ⚠️ SÓ DOCUMENTO VIVO. Handoffs, `AI_MASTER_LOG` e `DIARIO_DE_BORDO` são append-only: registram o
 * que era verdade NAQUELE dia, e reescrevê-los seria falsificar o histórico — a mesma regra que
 * proíbe reescrever bloco publicado. Eles ficam de fora, e a lista de isentos é impressa.
 *
 * Uso: node scripts/conferir-contagem-de-regras.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, dirname, relative, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const esbuild = require('esbuild')

// O catálogo REAL, compilado do mesmo código que roda em produção — não relido por regex.
const entrada = join(RAIZ, 'node_modules', '.contagem-entrada.ts')
const saida = join(RAIZ, 'node_modules', '.contagem.mjs')
writeFileSync(entrada, "export * from '../src/dominio/regras'\n", 'utf8')
esbuild.buildSync({ entryPoints: [entrada], outfile: saida, format: 'esm', platform: 'node', bundle: true })
const { CATALOGO } = await import(pathToFileURL(saida).href)

const DURAS = CATALOGO.filter((r) => r.familia === 'DURA').length
const QUALIDADE = CATALOGO.filter((r) => r.familia === 'QUALIDADE').length
const TOTAL = CATALOGO.length

/*
  🔴 VARRE TUDO, E ISENTA POR DECLARAÇÃO — invertido em 05/08/2026.

  A primeira versão tinha uma LISTA FIXA de 5 documentos. Funciona enquanto ninguém escreve um
  documento novo — e a auditoria externa pegou o buraco: `INDICE_DE_SOLICITACOES.md`,
  `docs/handoff/INDICE.md`, `docs/historico/INDICE.md` e `INVENTARIO_DE_FONTES.md` não estavam nem
  na lista nem nas isenções. Eram simplesmente **invisíveis**.

  No mesmo dia nasceram seis documentos de reconstrução, todos citando o número de regras. Com a
  lista fixa, os seis entrariam cegos.

  Lista de permissão erra em silêncio; lista de exclusão erra alto. Agora o portão varre **todo
  `.md` do repositório** e só pula o que está declarado abaixo — e imprime os dois números.
*/
const HISTORICOS = ['AI_MASTER_LOG.md', 'DIARIO_DE_BORDO.md', 'docs/handoff/', 'docs/historico/']

/** Todo `.md` do repositório, menos `node_modules` e o que o histórico já cobre. */
function todosOsDocumentos(dir = RAIZ, acc = []) {
  for (const nome of readdirSync(dir, { withFileTypes: true })) {
    if (nome.name === 'node_modules' || nome.name === '.git' || nome.name === 'capturas') continue
    const abs = join(dir, nome.name)
    if (nome.isDirectory()) { todosOsDocumentos(abs, acc); continue }
    if (!nome.name.endsWith('.md')) continue
    const rel = relative(RAIZ, abs).split(sep).join('/')
    if (HISTORICOS.some((h) => rel === h || rel.startsWith(h))) continue
    acc.push(rel)
  }
  return acc
}

const VIVOS = todosOsDocumentos().sort()

/**
 * As formas em que a contagem aparece escrita. Cada uma diz qual número ela afirma.
 * Deliberadamente específicas: `/(\d+) regras/` casaria com qualquer frase e encheria de ruído.
 */
const PADROES = [
  { re: /(\d+)\s+(?:regras\s+)?duras/gi, esperado: () => DURAS, oQue: 'regras duras' },
  { re: /(\d+)\s+de\s+qualidade/gi, esperado: () => QUALIDADE, oQue: 'regras de qualidade' },
  { re: /(\d+)\s+regras\s+num\s+catálogo/gi, esperado: () => TOTAL, oQue: 'total do catálogo' },
  { re: /catálogo\s+de\s+(\d+)\s+regras/gi, esperado: () => TOTAL, oQue: 'total do catálogo' },
  { re: /(?:as\s+)?(\d+)\s+regras\s+do\s+catálogo/gi, esperado: () => TOTAL, oQue: 'total do catálogo' },
  { re: /(\d+)\s+de\s+(\d+)\s+regras/gi, esperado: () => TOTAL, oQue: 'total do catálogo', grupo: 2 },
]

function conferirTexto(rotulo, texto) {
  const erros = []
  for (const p of PADROES) {
    for (const m of texto.matchAll(p.re)) {
      const achado = Number(m[p.grupo ?? 1])
      const devido = p.esperado()
      if (achado !== devido) {
        const linha = texto.slice(0, m.index).split('\n').length
        erros.push(`${rotulo}:${linha} diz "${m[0].trim()}" — hoje são ${devido} ${p.oQue}`)
      }
    }
  }
  return erros
}

// ---------------------------------------------------------------------------
// 🔒 AUTOTESTE — as duas pontas, antes de confiar no veredito
// ---------------------------------------------------------------------------
const CASOS = [
  { nome: 'acusa contagem de duras errada', texto: `são ${DURAS + 1} duras hoje`, acusa: true },
  { nome: 'acusa total errado', texto: `catálogo de ${TOTAL + 3} regras`, acusa: true },
  { nome: 'acusa "N de M regras" com M errado', texto: `${TOTAL} de ${TOTAL - 1} regras`, acusa: true },
  { nome: 'aprova contagem certa de duras', texto: `são ${DURAS} duras + ${QUALIDADE} de qualidade`, acusa: false },
  { nome: 'aprova total certo', texto: `catálogo de ${TOTAL} regras`, acusa: false },
  { nome: '🔴 não confunde número solto', texto: 'levou 15 minutos e 9 tentativas', acusa: false },
]

console.log('AUTOTESTE — conferência de contagem\n')
let falhasAutoteste = 0
for (const c of CASOS) {
  const acusou = conferirTexto('teste', c.texto).length > 0
  const ok = acusou === c.acusa
  if (!ok) falhasAutoteste++
  console.log(`  ${ok ? '✅' : '🔴'} ${c.nome}`)
}
if (falhasAutoteste) {
  console.log('\n🔴 O CONFERIDOR NÃO FAZ O QUE PROMETE — não dá para confiar no veredito abaixo.')
  process.exit(2)
}
console.log(`✅ O conferidor acusa o errado e aprova o certo.\n`)

// ---------------------------------------------------------------------------
console.log('CONTAGEM DE REGRAS NOS DOCUMENTOS VIVOS\n')
console.log(`  catálogo real: ${DURAS} duras + ${QUALIDADE} de qualidade = ${TOTAL}`)

const problemas = []
for (const rel of VIVOS) {
  let texto
  try {
    texto = readFileSync(join(RAIZ, rel), 'utf8')
  } catch {
    problemas.push(`${rel} — documento vivo listado e AUSENTE`)
    continue
  }
  problemas.push(...conferirTexto(rel, texto))
}
console.log(`  medidos: ${VIVOS.length} documento(s) vivo(s) — descobertos, não listados à mão`)
console.log(`  isentos: ${HISTORICOS.join(', ')} (append-only — registram o que era verdade então)\n`)

if (problemas.length) {
  console.log(`🔴 ${problemas.length} contagem(ns) que o catálogo desmente:\n`)
  for (const p of problemas) console.log(`   · ${p}`)
  console.log('\n   Regra nova entra no catálogo E no texto no MESMO passo.')
  process.exit(1)
}
console.log('✅ Todo documento vivo conta o catálogo como ele é.')
