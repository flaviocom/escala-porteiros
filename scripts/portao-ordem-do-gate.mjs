/**
 * 🔢 PORTÃO — a ORDEM dos passos escrita nos documentos é a ordem que o gate roda?
 *
 * 🔴 POR QUE ESTE PORTÃO EXISTE. O `medir-fatos.mjs` já media o **total** de passos, e por isso os
 * quatro documentos que dizem "N passos" nunca ficam desatualizados. Mas ele mede um número, e o
 * `OPERACAO.md` promete mais do que um número: *"nesta ordem — lida do `package.json`, não de
 * memória"*.
 *
 * Em 06/08/2026, ao acrescentar um passo, descobri que a lista numerada do `PORTOES.md` **já estava
 * fora de ordem antes**: `build` aparecia como passo 21 quando roda em 24º. O total batia; a ordem
 * não. Ninguém tinha como notar, porque nada olhava para ela.
 *
 * É a mesma classe de defeito que este projeto já registrou três vezes: **o portão responde só a
 * pergunta que se fez a ele.** "Quantos passos?" foi perguntado. "Em que ordem?" não.
 *
 * E é pior do que um número errado: quem lê a lista para saber o que roda antes do quê toma decisão
 * com base nela — se `build` viesse mesmo antes de `ensaio`, os testes de ponta a ponta rodariam
 * contra um `docs/` velho.
 *
 * O que ele confere, nos dois documentos que numeram passos:
 *   · `docs/PORTOES.md`  — títulos no formato `### N. \`nome\``
 *   · `docs/OPERACAO.md` — linhas de tabela no formato `| N | \`nome\` |`
 *
 * Contra a única fonte que manda: `package.json` → `scripts.gate`.
 *
 * 🔴 O QUE ELE **NÃO** MEDE, declarado: passo citado em prosa solta, fora de lista numerada. A lista
 * é o que alguém lê como sequência; a prosa cita um passo por nome, sem prometer posição.
 *
 * Uso: node scripts/portao-ordem-do-gate.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')

const gate = JSON.parse(readFileSync(join(RAIZ, 'package.json'), 'utf8')).scripts.gate
const verdade = gate
  .split('&&')
  .map((p) => p.trim().replace(/^npm run /, ''))
  .filter(Boolean)

console.log('🔢 A ORDEM ESCRITA É A ORDEM QUE RODA?\n')
console.log(`  passos no package.json .... ${verdade.length}`)

const documentos = [
  {
    arquivo: 'docs/PORTOES.md',
    // ### 21. `vivo:rotulos` — …
    padrao: /^### (\d+)\.\s+`([^`]+)`/gm,
  },
  {
    arquivo: 'docs/OPERACAO.md',
    // | 21 | `vivo:rotulos` | … |
    padrao: /^\|\s*(\d+)\s*\|\s*`([^`]+)`\s*\|/gm,
  },
]

const achados = []
let listasMedidas = 0
let linhasMedidas = 0

for (const { arquivo, padrao } of documentos) {
  const texto = readFileSync(join(RAIZ, arquivo), 'utf8')
  const lidos = [...texto.matchAll(padrao)].map((m) => ({ n: Number(m[1]), nome: m[2] }))
  if (lidos.length === 0) {
    achados.push(`${arquivo} — nenhuma lista numerada encontrada. O padrão mudou, ou a lista sumiu.`)
    continue
  }
  listasMedidas++
  linhasMedidas += lidos.length
  console.log(`  ${arquivo.padEnd(20)} ${lidos.length} passos numerados`)

  for (const { n, nome } of lidos) {
    const esperado = verdade[n - 1]
    if (esperado === undefined) {
      achados.push(`${arquivo} — passo ${n} (\`${nome}\`) não existe: o gate tem ${verdade.length}`)
    } else if (esperado !== nome) {
      const ondeDeVerdade = verdade.indexOf(nome)
      achados.push(
        `${arquivo} — passo ${n} está escrito como \`${nome}\`, mas o ${n}º do gate é \`${esperado}\`` +
          (ondeDeVerdade >= 0 ? ` (\`${nome}\` roda em ${ondeDeVerdade + 1}º)` : ` (\`${nome}\` não está no gate)`),
      )
    }
  }

  // E os números têm de CRESCER na ordem em que aparecem no arquivo. Sem isto, um documento com
  // "21, 24, 22, 23" passaria — cada número certo, a leitura embaralhada. Quem lê a lista lê de
  // cima para baixo, não pelo número.
  for (let i = 1; i < lidos.length; i++) {
    if (lidos[i].n <= lidos[i - 1].n) {
      achados.push(
        `${arquivo} — \`${lidos[i].nome}\` (${lidos[i].n}) aparece DEPOIS de \`${lidos[i - 1].nome}\` (${lidos[i - 1].n}) no arquivo: a lista está fora de ordem para quem lê de cima para baixo`,
      )
    }
  }

  // Um passo do gate que nenhuma lista menciona é um passo que ninguém sabe que existe.
  const nomes = new Set(lidos.map((l) => l.nome))
  for (const [i, p] of verdade.entries()) {
    if (!nomes.has(p)) achados.push(`${arquivo} — o passo ${i + 1} (\`${p}\`) não aparece na lista`)
  }
}

console.log(`  listas medidas ............ ${listasMedidas}`)
console.log(`  linhas conferidas ......... ${linhasMedidas}`)
console.log(`  divergências .............. ${achados.length}\n`)

for (const a of achados) console.log(`  🔴 ${a}`)

if (listasMedidas === 0 || linhasMedidas === 0) {
  console.log('🔴 nada foi medido — não há o que provar, e isso é defeito de população.')
  process.exit(1)
}
if (achados.length) {
  console.log('\n   A ordem escrita apodrece igual a número escrito à mão — só que mais devagar,')
  console.log('   porque o total continua batendo. Corrija a lista pelo `package.json`.')
  process.exit(1)
}
console.log(`✅ as ${listasMedidas} listas descrevem os ${verdade.length} passos na ordem em que eles rodam.`)
