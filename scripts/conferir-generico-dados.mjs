/**
 * PORTÃO — a trilha GENÉRICA (S-059/S-060, 18/08/2026) não pode carregar texto de cliente.
 *
 * 🔴 POR QUE ESTE PORTÃO EXISTE. `npm run generico` prova que `src/` e `index.html` não têm nome de
 * cliente cravado — mas ele não alcança DADO, e a trilha genérica é dado: `public-generico/dados/`
 * (a fonte) e, depois do build, `docs/generico/` (o que o GitHub Pages serve). Se alguém copiar um
 * `config.json` de produção para lá "só para testar depressa", a demonstração que deveria provar
 * que o produto é genérico nasceria mostrando exatamente o cliente que ela existe para não mostrar.
 *
 * Os termos são os MESMOS do portão `generico` (`scripts/portao-generico.mjs`) — é o mesmo cliente,
 * a mesma lista fechada, sem reinventar.
 *
 * Uso: node scripts/conferir-generico-dados.mjs [--raiz <caminho>] [--json]
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const argRaiz = process.argv.indexOf('--raiz')
const RAIZ = argRaiz >= 0 ? process.argv[argRaiz + 1] : join(dirname(fileURLToPath(import.meta.url)), '..')
const JSON_OUT = process.argv.includes('--json')

/** Os termos deste cliente — mesma lista de `portao-generico.mjs` e `portao-generico-docs.mjs`. */
const TERMOS = [
  { nome: 'Congregação Cristã', re: /Congrega[çc][ãa]o\s+Crist[ãa]/gi },
  { nome: 'Jardim São Luiz', re: /(?:JD\.?|Jardim)\s+S[ãa]o\s+Luiz/gi },
  { nome: 'CCB', re: /(?<![A-Za-zÀ-ÿ0-9_])CCB(?![A-Za-zÀ-ÿ0-9_])/g },
  { nome: 'Irmão/Irmãos (vocabulário da congregação)', re: /(?<![A-Za-zÀ-ÿ0-9_])[Ii]rm[ãa]os?(?![A-Za-zÀ-ÿ0-9_])/g },
]

/** As pastas da trilha genérica: a FONTE (sempre existe) e o BUILD (só depois de `build:generico`). */
const ALVOS = ['public-generico', 'docs/generico']

function arquivosDeTexto(dir, acc = []) {
  if (!existsSync(dir)) return acc
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome)
    if (statSync(p).isDirectory()) { arquivosDeTexto(p, acc); continue }
    if (/\.(json|html|js|css)$/.test(nome)) acc.push(p)
  }
  return acc
}

export function conferir(raiz = RAIZ) {
  const achados = []
  let arquivosVistos = 0

  for (const alvo of ALVOS) {
    const dir = join(raiz, alvo)
    for (const arquivo of arquivosDeTexto(dir)) {
      arquivosVistos++
      const conteudo = readFileSync(arquivo, 'utf8')
      for (const termo of TERMOS) {
        termo.re.lastIndex = 0
        const m = conteudo.match(termo.re)
        if (m) achados.push({ arquivo: relative(raiz, arquivo).split('\\').join('/'), termo: termo.nome, ocorrencias: m.length })
      }
    }
  }

  return { ok: achados.length === 0, achados, arquivosVistos }
}

// Sem guarda de "módulo principal": este arquivo só roda como script standalone (`node
// conferir-generico-dados.mjs`, direto ou via `execFileSync` no autoteste) — nunca é importado. A
// guarda `import.meta.url === file://${process.argv[1]}` foi tentada e falhou no Windows (barra
// invertida em `process.argv[1]` contra barra normal em `import.meta.url`): o script "passava" sem
// medir nada. Mesmo padrão dos outros portões deste repositório (`portao-generico.mjs`).
const resultado = conferir()

if (JSON_OUT) {
  console.log(JSON.stringify(resultado, null, 2))
} else if (resultado.ok) {
  console.log(`✅ trilha genérica limpa — ${resultado.arquivosVistos} arquivo(s) conferido(s) em ${ALVOS.join(', ')}, 0 termo de cliente`)
} else {
  console.error(`🔴 A TRILHA GENÉRICA TEM TEXTO DE CLIENTE — ${resultado.achados.length} achado(s):`)
  for (const a of resultado.achados) console.error(`  · ${a.arquivo}: "${a.termo}" (${a.ocorrencias}×)`)
  console.error('\nA trilha genérica existe para provar que o produto NÃO depende deste cliente. Remova o termo do dado.')
}

process.exit(resultado.ok ? 0 : 1)
