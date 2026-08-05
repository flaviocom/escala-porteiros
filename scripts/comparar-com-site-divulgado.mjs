/**
 * COMPARA O SITE NOVO COM O QUE JÁ FOI DIVULGADO — dia a dia, de hoje em diante.
 *
 * 🔴 POR QUE ESTE ARQUIVO EXISTE, e por que ele estava faltando.
 *
 * Em 05/08/2026 o Flavio percebeu, sozinho, que a escala nova trocava uma pessoa **no turno de
 * hoje** sem ninguém ter pedido. A medição que se seguiu devolveu:
 *
 *     turnos comparáveis IGUAIS ....... 0
 *     turnos comparáveis DIVERGENTES .. 87
 *
 * **Todos.** E nenhum dos portões do projeto pegou — porque todos comparavam o site novo com o
 * DADO do site novo. Coerência interna, que estava impecável enquanto a escala inteira contradizia
 * o que a congregação tinha em mãos.
 *
 * ⚠️ E o instrumento que fez essa medição foi escrito FORA do repositório, num arquivo solto. A
 * auditoria externa de documentação pegou: o handoff citava `comparar-sites.mjs` e o script não
 * existia em commit nenhum. **Número que ninguém consegue re-medir não é medição, é lembrança** —
 * e este era o número que justificou recortar o histórico e regerar a escala inteira.
 *
 * A LIÇÃO, que vale para qualquer projeto: coerência interna não é verdade. O que foi DIVULGADO é
 * a referência, e só uma medição contra a fonte divulgada podia pegar isto.
 *
 * Uso:
 *   node scripts/comparar-com-site-divulgado.mjs --antigo <url> [--novo <url>] [--desde AAAA-MM-DD]
 *
 * O `--antigo` é obrigatório e não tem padrão: qual site já foi divulgado é decisão de quem instala
 * o produto, não do código. (§0 do AGENTS.md — genérico e configurável.)
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { hojeSaoPaulo } from './lib/dominio.mjs'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const { chromium } = await import(`file:///${RAIZ.replace(/\\/g, '/')}/node_modules/playwright/index.mjs`)

const args = process.argv.slice(2)
const arg = (n, padrao) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : padrao }

const ANTIGO = arg('--antigo')
const NOVO = arg('--novo', 'https://flaviocom.github.io/escala-porteiros/')
const DESDE = arg('--desde') ?? (await hojeSaoPaulo())

if (!ANTIGO) {
  console.error('🔴 Falta `--antigo <url>` — o site que a congregação já tem o link.\n')
  console.error('   Exemplo:')
  console.error('   node scripts/comparar-com-site-divulgado.mjs --antigo https://example.com/escala-anterior/')
  process.exit(2)
}

/** Lê a página inteira, rolando até o fim: o que é renderizado sob demanda também conta. */
async function lerTudo(navegador, url) {
  const p = await navegador.newPage({ viewport: { width: 1400, height: 1000 } })
  await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
  await p.waitForTimeout(2500)
  for (let i = 0; i < 40; i++) { await p.mouse.wheel(0, 4000); await p.waitForTimeout(120) }
  const texto = await p.locator('body').innerText()
  await p.close()
  return texto
}

const MESES = { JAN: 1, FEV: 2, MAR: 3, ABR: 4, MAI: 5, JUN: 6, JUL: 7, AGO: 8, SET: 9, OUT: 10, NOV: 11, DEZ: 12 }

/**
 * Extrai `{ "AGO 05|NOITE": [nomes] }` do texto renderizado.
 *
 * Lê a TELA, não o dado: é o único jeito de comparar dois sites cujos formatos de arquivo podem ser
 * diferentes — e o site antigo pode nem ter arquivo de dado, sendo tudo código.
 */
function extrair(texto, ano) {
  const linhas = texto.split('\n').map((l) => l.trim()).filter(Boolean)
  const mapa = new Map()
  let dia = null
  let turno = null
  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i]
    if (/^(MANHÃ|TARDE|NOITE|TARDE \(ENSAIO\)|SANTA CEIA|ENSAIO)$/i.test(l)) turno = l.toUpperCase()
    const mes = l.match(/^(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)$/i)
    if (mes && /^\d{1,2}$/.test(linhas[i + 1] ?? '')) dia = `${mes[1].toUpperCase()} ${linhas[i + 1].padStart(2, '0')}`
    // Nome próprio: começa com maiúscula, é curto, e não é um dia da semana nem um rótulo.
    if (dia && turno && /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]+/.test(l) && l.length < 30 &&
        !/^(DOMINGO|SEGUNDA|TERÇA|QUARTA|QUINTA|SEXTA|SÁBADO|HOJE)/i.test(l)) {
      const k = `${dia}|${turno}`
      if (!mapa.has(k)) mapa.set(k, [])
      if (!mapa.get(k).includes(l)) mapa.get(k).push(l)
    }
  }
  return { mapa, ano }
}

const deChave = (k, ano) => {
  const [d] = k.split('|')
  const [m, dia] = d.split(' ')
  return `${ano}-${String(MESES[m]).padStart(2, '0')}-${dia}`
}

const ano = DESDE.slice(0, 4)
const navegador = await chromium.launch()
let divergentes = 0
let iguais = 0

try {
  const [textoAntigo, textoNovo] = await Promise.all([lerTudo(navegador, ANTIGO), lerTudo(navegador, NOVO)])
  const a = extrair(textoAntigo, ano).mapa
  const n = extrair(textoNovo, ano).mapa

  const daqui = (mapa) => [...mapa.keys()].filter((k) => deChave(k, ano) >= DESDE)
  const chaves = [...new Set([...daqui(a), ...daqui(n)])].sort((x, y) => (deChave(x, ano) < deChave(y, ano) ? -1 : 1))

  console.log(`COMPARAÇÃO COM O SITE DIVULGADO — de ${DESDE} em diante\n`)
  console.log(`  divulgado ... ${ANTIGO}`)
  console.log(`  novo ........ ${NOVO}\n`)
  console.log(`  turnos no site DIVULGADO (a partir da data) ... ${daqui(a).length}`)
  console.log(`  turnos no site NOVO      (a partir da data) ... ${daqui(n).length}\n`)

  const exemplos = []
  for (const k of chaves) {
    const A = (a.get(k) ?? []).slice().sort().join(', ')
    const N = (n.get(k) ?? []).slice().sort().join(', ')
    // Só compara o que existe dos DOIS lados: turno que só um tem não é divergência, é período
    // diferente — e tratar como divergência inflaria o número que motiva decisão.
    if (!A || !N) continue
    if (A === N) iguais++
    else { divergentes++; if (exemplos.length < 12) exemplos.push({ k, A, N }) }
  }

  console.log(`  turnos comparáveis IGUAIS ....... ${iguais}`)
  console.log(`  turnos comparáveis DIVERGENTES .. ${divergentes}\n`)
  for (const e of exemplos) {
    console.log(`  ${e.k}`)
    console.log(`     divulgado: ${e.A}`)
    console.log(`     novo:      ${e.N}`)
  }
  if (divergentes > exemplos.length) console.log(`  (+${divergentes - exemplos.length} não listados)`)

  if (divergentes) {
    console.log(`\n🔴 ${divergentes} turno(s) do site novo DESMENTEM o que já foi divulgado.`)
    console.log('   Isso pode ser legítimo — uma escala nova conserta defeitos —, mas é DECISÃO de quem')
    console.log('   administra, não efeito colateral. Quem já viu a escala antiga precisa ser avisado.')
  } else {
    console.log('\n✅ Nenhum turno já divulgado foi contrariado pelo site novo.')
  }
} finally {
  await navegador.close()
}

// Saída 1 quando há divergência: é informação para decidir, e um script que sempre sai 0 não pode
// entrar em portão nenhum depois.
process.exit(divergentes ? 1 : 0)
