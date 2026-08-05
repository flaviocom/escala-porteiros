/**
 * PORTÃO — as duas invariantes de arquitetura que a documentação AFIRMA.
 *
 * 🔴 POR QUE ESTE PORTÃO EXISTE. `docs/ARQUITETURA.md` afirma duas coisas como fato medido:
 *
 *   1. **`src/dominio/` não importa nada de fora dele.** É o que permite testar as regras sem montar
 *      tela, e o que deixa os scripts fora do navegador usarem o MESMO código do produto. No dia em
 *      que alguém importar React lá dentro — para um `useMemo` "só neste caso" —, o domínio deixa de
 *      rodar fora do navegador e metade dos scripts para de funcionar.
 *
 *   2. **A conferência independente não importa `regras.ts`.** Ela existe para DISCORDAR. Se um dia
 *      alguém "aproveitar" uma função do catálogo ali dentro, ela vira um espelho — continua verde,
 *      continua concordando, e para de valer qualquer coisa. Seria a pior falha possível: uma
 *      segunda opinião que é a primeira disfarçada.
 *
 * As duas eram verdade quando foram escritas. Nenhuma tinha portão. **Regra sem portão é
 * disciplina, e disciplina falha.**
 *
 * Uso: node scripts/conferir-arquitetura.mjs [--json]
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

function arquivos(dir, acc = []) {
  for (const nome of readdirSync(dir)) {
    const p = path.join(dir, nome)
    if (statSync(p).isDirectory()) { arquivos(p, acc); continue }
    if (/\.tsx?$/.test(nome) && !/\.test\./.test(nome)) acc.push(p.split(path.sep).join('/'))
  }
  return acc
}

/**
 * Toda dependência declarada num arquivo, com a linha.
 *
 * 🔴 ASPAS DUPLAS TAMBÉM — achado da auditoria externa de 05/08/2026.
 *
 * A primeira versão casava só aspas simples: `/from\s+'([^']+)'/`. O auditor injetou
 * `import clsx from "clsx"` dentro de `src/dominio/` e este portão imprimiu, sem piscar,
 * *"✅ O domínio não importa nada de fora dele"*. A mesma injeção com aspas simples era acusada
 * corretamente — a outra ponta funcionava, e foi isso que escondeu o buraco.
 *
 * O projeto **não tem linter** forçando um estilo de aspas, então a porta estava escancarada
 * justamente na invariante que o `ARQUITETURA.md` chama de *"a pior falha possível"*.
 *
 * Cobre também `import()` dinâmico, `require()` e o import só de efeito colateral — todos saíam do
 * domínio pelo mesmo motivo: ninguém tinha escrito o padrão deles.
 */
function importacoes(abs) {
  const texto = readFileSync(path.join(RAIZ, abs), 'utf8')
  const formas = [
    /from\s+["']([^"']+)["']/g,
    /import\s*\(\s*["']([^"']+)["']\s*\)/g,
    /require\s*\(\s*["']([^"']+)["']\s*\)/g,
    /import\s+["']([^"']+)["']/g,
  ]
  return formas.flatMap((re) =>
    [...texto.matchAll(re)].map((m) => ({ alvo: m[1], linha: texto.slice(0, m.index).split('\n').length })),
  )
}

const doDominio = arquivos(path.join(RAIZ, 'src', 'dominio')).map((a) => path.relative(RAIZ, a).split(path.sep).join('/'))
const achados = []

// ── Invariante 1: o domínio é uma ilha ────────────────────────────────────────────────────────
for (const arq of doDominio) {
  for (const imp of importacoes(arq)) {
    // Relativo que sobe de pasta (`../`) sai do domínio. Pacote externo (sem `.`) também.
    const saiDoDominio = imp.alvo.startsWith('..') || !imp.alvo.startsWith('.')
    if (saiDoDominio) {
      achados.push({
        invariante: 'o domínio é uma ilha',
        arquivo: arq,
        linha: imp.linha,
        detalhe: `importa '${imp.alvo}', que está FORA de src/dominio/`,
      })
    }
  }
}

// ── Invariante 2: a segunda régua é independente ──────────────────────────────────────────────
const SEGUNDA_REGUA = 'src/dominio/conferencia-independente.ts'
const PROIBIDO_PARA_A_SEGUNDA_REGUA = ['regras', 'validacao', 'gerador']

for (const imp of importacoes(SEGUNDA_REGUA)) {
  // 🔴 Tira `./` **e qualquer extensão**: `'./regras.js'` escapava da comparação por igualdade
  //    exata contra `['regras','validacao','gerador']` — segundo achado do mesmo auditor.
  const nome = imp.alvo.replace(/^\.\//, '').replace(/\.(ts|tsx|js|mjs)$/, '')
  if (PROIBIDO_PARA_A_SEGUNDA_REGUA.includes(nome)) {
    achados.push({
      invariante: 'a segunda régua é independente',
      arquivo: SEGUNDA_REGUA,
      linha: imp.linha,
      detalhe: `importa '${imp.alvo}' — deixa de ser uma segunda opinião e vira espelho da primeira`,
    })
  }
}

/*
  🔴 INVARIANTE 3 — O SITE É SERVIDO SEM JEKYLL. Sexta auditoria externa, 05/08/2026.

  `docs/.nojekyll` foi criado no primeiro commit e **apagado** em `7078186`, sem uma linha de
  registro em lugar nenhum. Sem ele, o GitHub Pages roda **Jekyll sobre `docs/` a cada push** — e
  `docs/` tem 30 arquivos Markdown, entre eles handoffs e specs cheios de crase, chave e cifrão.

  O modo de falha é o pior que este projeto pode ter: se o Jekyll engasgar (um `{%`, um `---` no topo
  de um handoff), **o deploy inteiro falha e o site ANTERIOR continua no ar** — enquanto a tela de
  publicação já disse *"✅ escala publicada · o site mostra a escala nova em cerca de um minuto"*.
  Ninguém no painel fica sabendo, porque `AbaPublicar` não busca a URL pública depois de gravar. O
  irmão ficaria com a escala do mês passado por tempo indeterminado.

  Um arquivo vazio de 0 byte elimina a classe inteira. E ele já sumiu uma vez sem ninguém ver — que
  é exatamente o argumento para ter portão em vez de disciplina.
*/
if (!existsSync(path.join(RAIZ, 'docs', '.nojekyll'))) {
  achados.push({
    invariante: 'o site é servido sem Jekyll',
    arquivo: 'docs/.nojekyll',
    linha: 0,
    detalhe: 'o arquivo sumiu — sem ele o Pages roda Jekyll sobre os 30 .md de docs/, e uma falha desse build deixa o site ANTIGO no ar com a tela dizendo que publicou',
  })
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ arquivosDoDominio: doDominio.length, achados }, null, 2))
} else {
  console.log('ARQUITETURA — as invariantes que a documentação afirma\n')
  console.log(`  arquivos em src/dominio/ .......... ${doDominio.length}`)
  console.log(`  invariantes conferidas ............ 3`)
  console.log(`  violações ......................... ${achados.length}\n`)
  for (const a of achados) {
    console.log(`  🔴 ${a.invariante}`)
    console.log(`     ${a.arquivo}:${a.linha} — ${a.detalhe}`)
  }
  if (!achados.length) {
    console.log('  ✅ O domínio não importa nada de fora dele.')
    console.log('  ✅ A conferência independente não importa o catálogo de regras.')
    console.log('  ✅ `docs/.nojekyll` existe — o Pages serve os arquivos como estão.')
  }
}

process.exit(achados.length ? 1 : 0)
