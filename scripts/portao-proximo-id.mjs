/**
 * 🆔 PORTÃO — o "próximo identificador livre" é mesmo o próximo livre?
 *
 * 🔴 POR QUE ESTE PORTÃO EXISTE. O `INDICE_DE_SOLICITACOES.md` abre com uma linha que diz qual é o
 * próximo ID a usar, e explica ao lado: *"calculado sobre **todas** as fatias, nunca lido da última
 * linha"*. A explicação existe porque, depois de uma rotação, o maior ID **sai de vista** — quem
 * escreve a solicitação nova não enxerga de onde escreve qual foi o último usado. O método registra
 * o prejuízo: **cinco colisões de ID de uma vez**, num projeto anterior.
 *
 * E em 06/08/2026 a linha estava errada aqui também: dizia **S-032** com o **S-033** já escrito
 * logo abaixo. A regra estava documentada, explicada, com o motivo ao lado — e inerte, porque nada
 * a media. É o padrão que este projeto tem por tese: **regra sem portão é disciplina, e disciplina
 * falha.**
 *
 * Confere duas coisas:
 *   · a linha do cabeçalho anuncia exatamente `maior ID encontrado + 1`;
 *   · nenhum ID aparece em **duas linhas de tabela** — colisão é o dano que a linha existe para
 *     evitar, e de nada adianta o anúncio certo se já houver duplicata no corpo.
 *
 * A busca é feita em **todo** `.md` de `docs/solicitacoes/` — as fatias arquivadas inclusive, que é
 * exatamente o ponto: o maior ID pode estar numa fatia que ninguém abre há semanas.
 *
 * Uso: node scripts/portao-proximo-id.mjs
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const PASTA = join(RAIZ, 'docs/solicitacoes')
const INDICE = join(PASTA, 'INDICE_DE_SOLICITACOES.md')

console.log('🆔 O "PRÓXIMO ID LIVRE" É O PRÓXIMO LIVRE?\n')

const arquivos = readdirSync(PASTA).filter((f) => f.endsWith('.md'))
let maior = 0
let vistos = 0
for (const f of arquivos) {
  for (const linha of readFileSync(join(PASTA, f), 'utf8').split(/\r?\n/)) {
    // 🔴 A própria linha do anúncio NÃO conta. O ID anunciado é o que ainda vai ser usado; contá-lo
    // como "em uso" faz o portão exigir sempre um a mais, e ele nasceria eternamente vermelho —
    // exatamente a falha que este projeto já registrou duas vezes (portão sempre-vermelho lido como
    // acerto). Pego na primeira execução.
    if (/Próximo identificador livre/.test(linha)) continue
    for (const m of linha.matchAll(/\bS-(\d{3})\b/g)) {
      vistos++
      maior = Math.max(maior, Number(m[1]))
    }
  }
}

const texto = readFileSync(INDICE, 'utf8')
const anunciado = texto.match(/Próximo identificador livre:\s*\*{0,2}S-(\d{3})/)

// Colisão no corpo: um ID que abre duas linhas de tabela diferentes.
const porId = new Map()
for (const linha of texto.split(/\r?\n/)) {
  if (!linha.trimStart().startsWith('|')) continue
  const m = linha.match(/\|\s*\*{0,2}S-(\d{3})\*{0,2}\s*\|/)
  if (m) porId.set(m[1], (porId.get(m[1]) ?? 0) + 1)
}
const colisoes = [...porId.entries()].filter(([, n]) => n > 1)

const esperado = String(maior + 1).padStart(3, '0')
const achados = []
if (!anunciado) achados.push('o cabeçalho não anuncia "Próximo identificador livre" — a linha sumiu, e com ela a defesa')
else if (anunciado[1] !== esperado) achados.push(`o cabeçalho anuncia S-${anunciado[1]}, e o maior ID em uso é S-${String(maior).padStart(3, '0')} — o próximo livre é S-${esperado}`)
for (const [id, n] of colisoes) achados.push(`S-${id} abre ${n} linhas de tabela diferentes — duas solicitações com o mesmo identificador`)

console.log(`  arquivos varridos ......... ${arquivos.length} (fatias arquivadas inclusive)`)
console.log(`  ocorrências de ID ......... ${vistos}`)
console.log(`  maior ID em uso ........... S-${String(maior).padStart(3, '0')}`)
console.log(`  cabeçalho anuncia ......... ${anunciado ? `S-${anunciado[1]}` : '(nada)'}`)
console.log(`  achados ................... ${achados.length}\n`)

for (const a of achados) console.log(`  🔴 ${a}`)

if (vistos === 0) {
  console.log('🔴 nenhum ID foi encontrado — não há o que provar, e isso é defeito de população.')
  process.exit(1)
}
if (achados.length) {
  console.log('\n   Depois de uma rotação o maior ID sai de vista. Esta linha é a única defesa contra')
  console.log('   escrever a solicitação nova com um número que já é de outra.')
  process.exit(1)
}
console.log(`✅ o próximo livre é S-${esperado}, e nenhum identificador está duplicado.`)
