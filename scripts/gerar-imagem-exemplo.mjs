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
import { spawn } from 'node:child_process'
import { mkdirSync, statSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const MES = process.argv[2] ?? '2026-08'
const PORTA = 4179
const SAIDA = join(RAIZ, 'capturas')

mkdirSync(SAIDA, { recursive: true })
console.log(`GERANDO A IMAGEM PELO BOTÃO — mês ${MES}\n`)

const servidor = spawn('npx', ['vite', 'preview', '--port', String(PORTA), '--strictPort'], {
  cwd: RAIZ, shell: true, stdio: 'ignore',
})

try {
  const navegador = await chromium.launch()
  const pagina = await navegador.newPage({ viewport: { width: 1400, height: 1000 } })
  const erros = []
  pagina.on('pageerror', (e) => erros.push(e.message))

  let subiu = false
  for (let i = 0; i < 40 && !subiu; i++) {
    try {
      await pagina.goto(`http://127.0.0.1:${PORTA}/`, { waitUntil: 'networkidle', timeout: 3000 })
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

  const esperaDownload = pagina.waitForEvent('download', { timeout: 60_000 })
  await botao.click()
  const download = await esperaDownload

  const destino = join(SAIDA, `exemplo-${MES}.png`)
  await download.saveAs(destino)
  const kb = Math.round(statSync(destino).size / 1024)

  // Dimensoes lidas do cabecalho do PNG (bytes 16..24) — sem dependencia nova para uma leitura
  // de 8 bytes. Sem isto, "gerou o arquivo" nao distingue a imagem certa de um PNG de 1 pixel.
  const cab = readFileSync(destino).subarray(16, 24)
  const largura = cab.readUInt32BE(0)
  const altura = cab.readUInt32BE(4)
  console.log(`  dimensoes ............. ${largura} x ${altura}`)
  if (largura !== 1440) throw new Error(`largura ${largura}, esperada 1440 — o layout mudou de tamanho`)
  if (altura < 600) throw new Error(`altura ${altura} — a imagem saiu curta demais para uma escala`)

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
  servidor.kill()
}
