/**
 * AUTOTESTE — o portão da trilha genérica reprova o infrator E aprova o limpo.
 *
 * Mesma disciplina de `autoteste-portao-generico.mjs`: um portão que sempre reprova não prova nada
 * (a ponta "limpo passa" também precisa de caso), e um portão que sempre aprova é pior que ausente.
 *
 * Uso: node scripts/autoteste-conferir-generico-dados.mjs
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const PORTAO = join(AQUI, 'conferir-generico-dados.mjs')

function medir(arquivos) {
  const raiz = mkdtempSync(join(tmpdir(), 'generico-dados-'))
  try {
    for (const [nome, conteudo] of Object.entries(arquivos)) {
      mkdirSync(dirname(join(raiz, nome)), { recursive: true })
      writeFileSync(join(raiz, nome), conteudo, 'utf8')
    }
    try {
      const saida = execFileSync(process.execPath, [PORTAO, '--raiz', raiz, '--json'], { encoding: 'utf8' })
      return { codigo: 0, ...JSON.parse(saida) }
    } catch (e) {
      return { codigo: e.status, ...JSON.parse(e.stdout) }
    }
  } finally {
    rmSync(raiz, { recursive: true, force: true })
  }
}

const CONFIG_LIMPO = JSON.stringify({
  versao: 1,
  identidade: { titulo: 'Escala de plantões', subtitulo: 'Demonstração', pessoa: { singular: 'Plantonista', plural: 'plantonistas' } },
})

const CASOS = [
  {
    nome: 'config.json de produção copiado por engano para a fonte genérica',
    arquivos: { 'public-generico/dados/config.json': JSON.stringify({ identidade: { titulo: 'Escala Porteiros', subtitulo: 'JD. São Luiz' } }) },
    esperaAchado: true,
  },
  {
    nome: '"CCB" solto no build genérico já publicado',
    arquivos: { 'docs/generico/dados/config.json': JSON.stringify({ identidade: { titulo: 'Escala CCB' } }) },
    esperaAchado: true,
  },
  {
    nome: 'vocabulário "Irmãos" vazado para a trilha genérica',
    arquivos: { 'public-generico/dados/config.json': JSON.stringify({ identidade: { pessoa: { plural: 'Irmãos' } } }) },
    esperaAchado: true,
  },
  {
    nome: 'config genérico de verdade (Plantonista/demonstração) passa limpo',
    arquivos: { 'public-generico/dados/config.json': CONFIG_LIMPO },
    esperaAchado: false,
  },
  {
    nome: 'pasta ausente (build genérico ainda não rodou) não é erro, é 0 achado',
    arquivos: { 'public-generico/dados/config.json': CONFIG_LIMPO }, // sem docs/generico/ — só a fonte
    esperaAchado: false,
  },
  {
    nome: 'arquivo fora dos alvos (ex.: docs/OPERACAO.md citando o cliente) NÃO é varrido por este portão',
    arquivos: {
      'public-generico/dados/config.json': CONFIG_LIMPO,
      'docs/OPERACAO.md': 'Este documento fala de Congregação Cristã — é o portão generico:docs que cuida disto.',
    },
    esperaAchado: false,
  },
]

console.log('AUTOTESTE — portão da trilha genérica (dados)\n')
let falhas = 0

for (const c of CASOS) {
  const r = medir(c.arquivos)
  const achou = r.achados.length > 0
  const ok = achou === c.esperaAchado && (achou ? r.codigo === 1 : r.codigo === 0)
  if (!ok) falhas++
  console.log(`  ${ok ? '✅' : '🔴'} ${c.nome}`)
  console.log(`       esperava ${c.esperaAchado ? 'ACHADO' : 'limpo'}; portão devolveu ${r.achados.length} achado(s), saída ${r.codigo}`)
  if (!ok && r.achados.length) console.log(`       ${r.achados.map((a) => `${a.arquivo} · ${a.termo}`).join(' · ')}`)
}

console.log(`\n  ${falhas ? '🔴' : '✅'} ${CASOS.length - falhas} de ${CASOS.length} casos corretos`)
if (falhas) console.log('  O portão da trilha genérica NÃO está medindo o que diz medir.')
process.exit(falhas ? 1 : 0)
