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

  /*
    🔴 O PALCO DA IMAGEM É REMOVIDO DEPOIS DE VIRAR PIXEL (`gerarImagem.ts` → `palco.remove()`), então
    medir o conteúdo depois do clique acha uma página vazia. O observador entra ANTES e guarda as
    medidas no instante em que o nó existe.

    Isto é o que faltava neste portão: ele conferia erro de console e o tamanho do PNG, e **nada sobre
    o que está desenhado**. Três vezes hoje um defeito da imagem escapou de todos os portões e só
    apareceu quando alguém ABRIU o arquivo — "sem porteiros escalados", o "ENSAIO" cravado em toda
    tarde, e a pílula da Santa Ceia imprimindo o rótulo duas vezes.
  */
  await pagina.evaluate(() => {
    const w = window
    w.__medidasDaImagem = []
    const medir = (raiz) => {
      const cortados = []
      const duplicados = []
      for (const el of raiz.querySelectorAll('*')) {
        const proprio = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1)
        if (!proprio) continue
        const cs = getComputedStyle(el)
        const escondido = cs.overflow === 'hidden' || cs.textOverflow === 'ellipsis'
        if (escondido && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1))
          cortados.push(el.textContent.trim().slice(0, 40))
        const linhas = el.textContent.trim().split(String.fromCharCode(10)).map((x) => x.trim()).filter(Boolean)
        if (linhas.length === 2 && linhas[0] === linhas[1]) duplicados.push(linhas[0].slice(0, 40))
      }
      const texto = raiz.textContent ?? ''
      const rodape = texto.match(/(\d+)\s+\S+\s+por turno/)
      w.__medidasDaImagem.push({
        caracteres: texto.length,
        cortados: [...new Set(cortados)],
        duplicados: [...new Set(duplicados)],
        rodape: rodape ? Number(rodape[1]) : null,
      })
    }
    new MutationObserver((muts) => {
      for (const m of muts)
        for (const n of m.addedNodes)
          if (n.nodeType === 1 && n.textContent && n.textContent.length > 200) {
            // Espera o React pintar os filhos antes de medir.
            setTimeout(() => { try { medir(n) } catch { /* nó já saiu */ } }, 120)
          }
    }).observe(document.body, { childList: true, subtree: false })
  })

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

  /*
    🔴 O QUE ESTÁ DESENHADO, E NÃO SÓ QUE DESENHOU. As medidas vêm do observador instalado antes do
    clique — ver o comentário longo lá em cima.

    Três perguntas, e cada uma corresponde a um defeito real que já passou por aqui:
      · algum texto está CORTADO pela própria caixa?    (nome comprido encavalando)
      · algum rótulo aparece DUPLICADO na mesma pílula? ("SANTA CEIA / SANTA CEIA")
      · o rodapé diz quantos por turno?                 (dizia 4 com três nomes desenhados)
  */
  const medidas = await pagina.evaluate(() => window.__medidasDaImagem ?? [])
  console.log(`  conteúdo medido no DOM: ${medidas.length} imagem(ns)`)
  if (!medidas.length) {
    console.log('    🔴 o observador não capturou nada — a medição de conteúdo NÃO rodou')
    erros.push('a medição de conteúdo da imagem não rodou')
  }
  for (const [i, m] of medidas.entries()) {
    console.log(`    imagem ${i + 1}: ${m.caracteres} caracteres · cortados ${m.cortados.length} · duplicados ${m.duplicados.length} · rodapé "${m.rodape ?? '(não achei)'} por turno"`)
    if (m.cortados.length) { console.log(`       🔴 cortado: ${m.cortados.slice(0, 3).join(' | ')}`); erros.push(`texto cortado na imagem: ${m.cortados[0]}`) }
    if (m.duplicados.length) { console.log(`       🔴 duplicado: ${m.duplicados.join(' | ')}`); erros.push(`rótulo duplicado na imagem: ${m.duplicados[0]}`) }
    if (m.rodape == null) erros.push('o rodapé da imagem não diz quantos por turno')
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
