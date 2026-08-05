/**
 * GERA `docs/CATALOGO_DE_REGRAS.md` A PARTIR DO CÓDIGO — e reprova se o arquivo estiver velho.
 *
 * 🔴 POR QUE GERADO, E NÃO ESCRITO À MÃO. Num único dia, este projeto teve **três** lugares
 * afirmando um total de regras menor que o real — dois documentos vivos e um comentário de
 * componente —, sobre a coisa mais fácil de conferir do sistema.
 *
 * ⚠️ Os números daquele episódio não estão escritos aqui de propósito: eles são contagens de
 * catálogo, e um portão irmão (`npm run contagem`) reprovaria este próprio arquivo por citá-los.
 * A ironia é o argumento — nem o texto que EXPLICA o defeito consegue guardar um número à mão.
 *
 * Documentação que descreve código muda quando o código muda — **se for gerada**. Escrita à mão,
 * ela apodrece em silêncio, e apodrece exatamente onde alguém confia nela para não ler o código.
 *
 * Uso:
 *   node scripts/gerar-catalogo-de-regras.mjs            # escreve o arquivo
 *   node scripts/gerar-catalogo-de-regras.mjs --conferir # PORTÃO: reprova se estiver desatualizado
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { carregarDominio } from './lib/dominio.mjs'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const DESTINO = join(RAIZ, 'docs', 'CATALOGO_DE_REGRAS.md')
const CONFERIR = process.argv.includes('--conferir')

const { CATALOGO } = await carregarDominio()

const duras = CATALOGO.filter((r) => r.familia === 'DURA')
const qualidade = CATALOGO.filter((r) => r.familia === 'QUALIDADE')

/** A tabela de uma família. `explicacao` é o texto que o comprador lê na tela. */
const tabela = (regras) =>
  [
    '| # | O que confere | O que isso quer dizer, em português |',
    '|---|---|---|',
    ...regras.map((r) => `| **${r.id}** | ${r.titulo} | ${r.explicacao.replace(/\|/g, '\\|')} |`),
  ].join('\n')

const texto = `# Catálogo de regras

> ⚠️ **ARQUIVO GERADO.** Não edite à mão — as alterações somem na próxima geração. A fonte é
> \`src/dominio/regras.ts\`; para mudar o texto de uma regra, mude o campo \`explicacao\` dela.
>
> Regenerar: \`npm run doc:regras\` · Conferir se está atualizado: \`npm run doc:regras:conferir\`
> (roda dentro do \`npm run gate\`).
>
> **Cadeia:** [\`AGENTS.md\`](../AGENTS.md) → [\`docs/RECONSTRUIR.md\`](RECONSTRUIR.md) → **você está aqui**

---

## Como o catálogo funciona

São **${CATALOGO.length} regras**: **${duras.length} duras** e **${qualidade.length} de qualidade**. A diferença é o que acontece quando
falham:

| Família | Falha vira | Bloqueia publicar? |
|---|---|---|
| **DURA** | reprovação 🔴 | **Sim.** A tela não deixa publicar |
| **QUALIDADE** | aviso 🟡 | Não. É informação para quem administra decidir |

Toda regra é uma função que recebe a escala inteira e devolve as violações que achou. **Nenhuma
regra olha só um turno**: distanciamento, teto mensal e equilíbrio só existem no conjunto.

Cada uma tem teste que prova as **duas pontas** — reprova um infrator injetado de propósito **e**
aprova o caso limpo. Uma regra que só prova um lado pode estar sempre vermelha ou sempre verde sem
ninguém notar.

---

## Regras DURAS — reprovam, e travam a publicação

${tabela(duras)}

---

## Regras de QUALIDADE — avisam, nunca travam

${tabela(qualidade)}

---

## Onde cada coisa vive

| O quê | Onde |
|---|---|
| As ${CATALOGO.length} regras | \`src/dominio/regras.ts\` (a constante \`CATALOGO\`) |
| Os testes das duas pontas | \`src/dominio/regras.test.ts\` |
| A conferência independente (outra régua) | \`src/dominio/conferencia-independente.ts\` |
| A tela que mostra o resultado | \`src/components/ValidationView.tsx\` (público) e a aba **Conferir** (administrativo) |

## A segunda régua

Existe uma **conferência independente** que reimplementa as regras por outro caminho e **não importa
uma linha** de \`regras.ts\`. Ela monta a linha do tempo de cada pessoa, em vez de percorrer o
catálogo turno a turno.

Serve para discordar: se as duas concordam, a escala tem duas opiniões independentes a favor. Se
discordam, uma das duas está errada — e é melhor descobrir isso antes da congregação descobrir.
`

if (CONFERIR) {
  let atual = null
  try {
    atual = readFileSync(DESTINO, 'utf8')
  } catch {
    console.error('🔴 `docs/CATALOGO_DE_REGRAS.md` não existe. Rode `npm run doc:regras`.')
    process.exit(1)
  }
  // Compara ignorando fim de linha: o Windows reescreve CRLF e isso não é diferença de conteúdo.
  const igual = atual.replace(/\r\n/g, '\n') === texto.replace(/\r\n/g, '\n')
  console.log(`CATÁLOGO DE REGRAS — documento gerado\n`)
  console.log(`  regras no código .......... ${CATALOGO.length} (${duras.length} duras + ${qualidade.length} de qualidade)`)
  console.log(`  documento .. ${igual ? '✅ atualizado' : '🔴 DESATUALIZADO'}`)
  if (!igual) {
    console.log('\n   O código mudou e o documento não. Rode `npm run doc:regras` e commite.')
    process.exit(1)
  }
} else {
  writeFileSync(DESTINO, texto, 'utf8')
  console.log(`✅ docs/CATALOGO_DE_REGRAS.md gerado — ${CATALOGO.length} regras (${duras.length} duras + ${qualidade.length} de qualidade)`)
}
