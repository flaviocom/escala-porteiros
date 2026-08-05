/**
 * Dá aos scripts o MESMO código de domínio que o produto usa — nunca uma cópia.
 *
 * 🔴 POR QUE ISTO EXISTE. `gerar-bloco.mjs` já compilava o domínio na hora com esbuild, com este
 * comentário ao lado: *"Sem cópia paralela: código duplicado é onde as duas versões divergem em
 * silêncio."* Quando um segundo script precisou de `hojeSaoPaulo()`, a tentação óbvia era colar as
 * cinco linhas do `Intl.DateTimeFormat` — e aí passariam a existir duas noções de "hoje" no mesmo
 * repositório, que é exatamente a forma de defeito que `datas.ts` inteiro existe para impedir.
 *
 * Compila em memória, uma vez por processo. O custo é uns 200 ms; o preço da alternativa é um bug
 * de fuso que só aparece perto da meia-noite.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

let cache = null

/** Devolve o módulo de domínio já compilado (datas, malha, regras, validação, gerador). */
export async function carregarDominio() {
  if (cache) return cache

  const require = createRequire(import.meta.url)
  let esbuild
  try {
    esbuild = require('esbuild')
  } catch {
    throw new Error('esbuild não encontrado — rode `npm i -D esbuild` para usar os scripts de domínio.')
  }

  const entrada = join(RAIZ, 'node_modules', '.cache-dominio-entrada.ts')
  const saida = join(RAIZ, 'node_modules', '.cache-dominio.mjs')
  writeFileSync(
    entrada,
    [
      "export * from '../src/dominio/datas'",
      "export * from '../src/dominio/malha'",
      "export * from '../src/dominio/regras'",
      "export * from '../src/dominio/validacao'",
      "export * from '../src/dominio/gerador'",
    ].join('\n'),
    'utf8',
  )
  esbuild.buildSync({ entryPoints: [entrada], outfile: saida, format: 'esm', platform: 'node', bundle: true })

  // `?v=` derrota o cache de módulos do Node entre execuções que recompilam o mesmo caminho.
  cache = await import(`${pathToFileURL(saida).href}?v=${readFileSync(saida).length}`)
  return cache
}

/** Atalho para o caso mais comum: a data de hoje em São Paulo, do jeito que o produto a calcula. */
export async function hojeSaoPaulo() {
  const { hojeSaoPaulo: fn } = await carregarDominio()
  return fn()
}
