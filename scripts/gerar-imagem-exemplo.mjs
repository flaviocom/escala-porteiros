/**
 * Gera a imagem da escala pelo caminho REAL — clicando o botão no site — e salva o arquivo.
 *
 * Não chama a função por dentro: aperta o botão que o Flavio aperta. Se o clique não levar ao
 * download, o defeito é do produto, não do script — e é isso que se quer descobrir.
 *
 * Uso: node scripts/gerar-imagem-exemplo.mjs [mês AAAA-MM] [url]
 *      (sem mês, exporta tudo o que estiver na tela)
 */
import { chromium } from 'playwright'
import { subirServidor } from './lib/servidor-de-teste.mjs'
import { mkdirSync, statSync, readFileSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const MES = process.argv[2] ?? '2026-08'
const PORTA = 4179
const SAIDA = join(RAIZ, 'capturas')

mkdirSync(SAIDA, { recursive: true })
console.log(`GERANDO A IMAGEM PELO BOTÃO — mês ${MES}\n`)

// `preview`: serve o build de `docs/`, que é o que o irmão realmente abre. Se a porta estiver
// ocupada, isto ESTOURA em vez de conversar com um servidor alheio — em 04/08/2026 um órfão desta
// mesma porta serviu um bundle antigo e o script aprovou a imagem citando um nome de arquivo que
// já não existia no código.
const servidor = await subirServidor({ raiz: RAIZ, porta: PORTA, modo: 'preview' })

try {
  const navegador = await chromium.launch()
  const pagina = await navegador.newPage({ viewport: { width: 1400, height: 1000 } })
  const erros = []
  pagina.on('pageerror', (e) => erros.push(e.message))

  let subiu = false
  for (let i = 0; i < 40 && !subiu; i++) {
    try {
      await pagina.goto(servidor.url, { waitUntil: 'networkidle', timeout: 3000 })
      subiu = true
    } catch { await pagina.waitForTimeout(500) }
  }
  if (!subiu) throw new Error(`o servidor não subiu na porta ${PORTA}`)
  await pagina.waitForTimeout(1800)

  // Filtra pelo mês usando a busca — o caminho que uma pessoa usaria.
  if (MES !== 'tudo') {
    const [ano, mes] = MES.split('-')
    const nomes = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
    await pagina.locator('input[type="text"]').first().fill(nomes[Number(mes) - 1])
    await pagina.waitForTimeout(900)
    console.log(`  filtro aplicado: ${nomes[Number(mes) - 1]} ${ano}`)
  }

  const botao = pagina.getByRole('button', { name: /Enviar Escala/i }).first()
  if (!(await botao.count())) throw new Error('não achei o botão de enviar a escala')

  // Um mes -> um arquivo. Varios meses -> um POR MES: e o unico jeito de cada imagem caber no
  // teto de canvas do navegador (16384px). Coletamos todos os downloads, nao so o primeiro.
  const baixados = []
  pagina.on('download', (d) => baixados.push(d))
  await botao.click()
  for (let i = 0; i < 60 && baixados.length === 0; i++) await pagina.waitForTimeout(500)
  if (!baixados.length) throw new Error('o clique nao gerou download nenhum')
  // Espera parar de chegar arquivo novo.
  let antes = -1
  while (antes !== baixados.length) { antes = baixados.length; await pagina.waitForTimeout(1500) }

  console.log(`  arquivos gerados ...... ${baixados.length}`)
  const download = baixados[0]

  const destino = join(SAIDA, `exemplo-${MES}.png`)
  await download.saveAs(destino)
  const kb = Math.round(statSync(destino).size / 1024)

  // Confere TODOS, nao so o primeiro: um mes pode sair encolhido e os outros nao.
  for (const d of baixados) {
    const tmp = join(SAIDA, `_conf-${d.suggestedFilename()}`)
    await d.saveAs(tmp)
    const c = readFileSync(tmp).subarray(16, 24)
    const l = c.readUInt32BE(0), a2 = c.readUInt32BE(4)
    console.log(`    ${d.suggestedFilename().padEnd(42)} ${l} x ${a2}`)
    if (l !== 1440) throw new Error(`${d.suggestedFilename()}: largura ${l}, esperada 1440 — o navegador encolheu`)
    if (a2 > 16384) throw new Error(`${d.suggestedFilename()}: altura ${a2} acima do teto do canvas`)
    rmSync(tmp, { force: true })
  }

  console.log(`  nome sugerido pelo site: ${download.suggestedFilename()}`)
  console.log(`  salvo em .............. ${destino}  (${kb} KB)`)
  if (erros.length) {
    console.log(`\n🔴 ${erros.length} erro(s) de JavaScript durante a geração:`)
    erros.slice(0, 3).forEach((e) => console.log('   ·', e))
  }

  await navegador.close()
  console.log(erros.length ? '\n🔴 gerou, mas com erro no console\n' : '\n✅ imagem gerada pelo botão, sem erro no console\n')
  process.exitCode = erros.length ? 1 : 0
} finally {
  await servidor.derrubar()
}
