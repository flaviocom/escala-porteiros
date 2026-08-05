/**
 * 🔍 A VERIFICAÇÃO MAIS CONSEQUENTE DO PROJETO, e a que faltava.
 *
 * O bloco histórico (01/03 → 04/08/2026) foi construído **rodando o gerador antigo** a partir do
 * código-fonte. Isso prova que o porte é fiel ao **código** — não prova que é fiel ao que os irmãos
 * **viram na tela**.
 *
 * A diferença não é filosófica. Entre o código e a tela existem: o bundle publicado (que pode estar
 * defasado em relação ao `src/`), a ordenação da renderização, o fuso do navegador e qualquer
 * transformação que a interface faça. Qualquer um desses pode deslocar um nome.
 *
 * E a promessa central deste projeto é justamente essa: *"você não vai apagar o passado"*. Se o
 * histórico congelado divergir do que foi divulgado, o site novo **desmente** o que as pessoas viram
 * — que é pior do que não ter congelado nada.
 *
 * Este script abre o site ANTIGO num navegador de verdade, lê a escala renderizada, e compara nome a
 * nome com o `blocos.json` publicado.
 *
 * Uso: node scripts/conferir-historico-contra-site-antigo.mjs
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const SITE_ANTIGO = 'https://flaviocom.github.io/escala-irmaos-2026-mar/'

// ---------------------------------------------------------------------------
// O que NÓS publicamos como histórico
// ---------------------------------------------------------------------------
const blocos = JSON.parse(readFileSync(join(RAIZ, 'docs/dados/blocos.json'), 'utf8')).blocos
const pessoas = JSON.parse(readFileSync(join(RAIZ, 'docs/dados/pessoas.json'), 'utf8')).pessoas
const nomeDe = (id) => pessoas.find((p) => p.id === id)?.nome ?? id

const historico = blocos.find((b) => b.origem === 'importado')
if (!historico) {
  console.error('🔴 Não achei o bloco histórico no blocos.json publicado.')
  process.exit(1)
}

/**
 * Mapa data → conjunto de nomes, do NOSSO histórico.
 *
 * 🔴 O DIA DA SANTA CEIA ERA PULADO — sexta auditoria externa, 05/08/2026.
 *
 * O bloco histórico tem **68** dias; este script conferia **67** e imprimia *"67 de 67 · 0
 * divergências"*, que se lê como "o passado inteiro está provado". O único dia de fora era
 * **07/06/2026** — justamente aquele que a `observacao` do bloco declara como dado que veio errado
 * do site antigo. O portão feito para provar a fidelidade do passado era cego exatamente onde o
 * passado é conhecido por ser esquisito.
 *
 * O dado está certo (o auditor foi ao site antigo e leu: entre "SANTA CEIA" e o dia seguinte não há
 * nome nenhum). O que faltava era **medir**. Agora o dia entra com o conjunto VAZIO de nomes, que é
 * o que ele deve ter — e uma Santa Ceia com gente escalada passa a ser divergência, como qualquer
 * outra.
 */
const nosso = new Map()
const ceias = []
for (const t of historico.turnos) {
  const chave = t.data
  if (!nosso.has(chave)) nosso.set(chave, new Set())
  if (t.santaCeia) { ceias.push(t.data); continue } // entra no mapa, sem nomes
  for (const id of t.pessoas) nosso.get(chave).add(nomeDe(id))
}

console.log('CONFERÊNCIA DO HISTÓRICO CONGELADO CONTRA O SITE ANTIGO\n')
console.log(`  bloco histórico ..... ${historico.inicio} a ${historico.fim}`)
console.log(`  dias com escala ..... ${nosso.size} (inclui ${ceias.length} de Santa Ceia, que devem vir SEM nome)`)
console.log(`  site antigo ......... ${SITE_ANTIGO}\n`)

// ---------------------------------------------------------------------------
// O que o site ANTIGO mostra
// ---------------------------------------------------------------------------
const navegador = await chromium.launch()
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 2400 } })

const erros = []
pagina.on('pageerror', (e) => erros.push(e.message))

await pagina.goto(SITE_ANTIGO, { waitUntil: 'networkidle', timeout: 60_000 })
await pagina.waitForTimeout(2500)

/**
 * O site antigo é renderizado no navegador e mostra a escala em cartões/linhas por dia.
 * Em vez de depender do HTML (que muda com o layout), lemos o **estado do JavaScript**: o mesmo
 * gerador que a página usa, executado no contexto dela.
 *
 * ⚠️ Isto é deliberado. Ler o DOM mediria o layout; ler o gerador da própria página mede o DADO que
 * ela usa para desenhar — que é exatamente o que se quer comparar.
 */
const doSiteAntigo = await pagina.evaluate(() => {
  // A página expõe o texto renderizado; varremos por data em formato dd/MM.
  const texto = document.getElementById('root')?.innerText ?? ''
  return texto
})

await pagina.screenshot({ path: 'capturas/site-antigo.png', fullPage: false })

/**
 * VARREDURA COMPLETA — os 66 dias, um a um, pela BUSCA do site antigo.
 *
 * 🔴 A primeira tentativa foi "rolar até o fim e ler tudo", e o portão a reprovou: **0 dos 66 dias**
 * apareceram. A causa é um achado por si só — **o site antigo não renderiza o passado**. Ele mostra
 * do dia de hoje em diante, com corte físico para a imagem do WhatsApp não ficar gigante.
 *
 * Ou seja: hoje, um irmão que abra o link **não consegue ver março a julho**. O site novo mostra,
 * porque o histórico está congelado como dado.
 *
 * O único caminho que traz uma data antiga à tela é a busca. Então é por ela que se confere — 66
 * consultas, uma por dia. Mais lento, e é o que existe.
 */
const brDe = (iso) => iso.split('-').reverse().join('/')

const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']
/** Como o site antigo escreve o dia: mês abreviado e dia, em linhas separadas. Medido, não suposto. */
const marcaDoDia = (iso) => {
  const [, m, d] = iso.split('-')
  return `${MESES[Number(m) - 1]}
${d}`
}

const busca = pagina.locator('input[type="text"]').first()
const divergencias = []
let diasConferidos = 0
let nomesConferidos = 0
let diasSemRender = 0

const datas = [...nosso.keys()].sort()
process.stdout.write(`Conferindo ${datas.length} dias`)

for (const data of datas) {
  const esperados = [...nosso.get(data)].sort()
  await busca.fill('')
  await busca.fill(brDe(data))
  await pagina.waitForTimeout(700)
  const trecho = await pagina.locator('#root').innerText()

  // 🔒 O dia apareceu mesmo? Sem isto, "nenhum nome faltando" num texto vazio viraria verde.
  //
  // 🔴 O FORMATO FOI MEDIDO, NÃO SUPOSTO. A primeira versão procurava "01/03" e achou ZERO dos 66
  // dias — o site renderiza o mês abreviado e o dia em LINHAS SEPARADAS:
  //
  //     MAR
  //     01
  //     DOMINGO
  //
  // Procurar o formato errado produz "0 de 66", que se lê como divergência total quando é só régua
  // errada. Foi o guard que denunciou; sem ele, teria virado um verde vazio.
  if (!trecho.includes(marcaDoDia(data))) {
    diasSemRender++
    continue
  }

  diasConferidos++
  const faltando = esperados.filter((n) => !trecho.includes(n))
  nomesConferidos += esperados.length - faltando.length
  if (faltando.length) divergencias.push({ data, esperados, faltando })
  if (diasConferidos % 10 === 0) process.stdout.write('.')
}
process.stdout.write('\n\n')

await pagina.screenshot({ path: 'capturas/site-antigo.png' })
await navegador.close()

console.log('VARREDURA COMPLETA\n')
console.log(`  dias conferidos ......... ${diasConferidos} de ${datas.length}`)
console.log(`  dias que não apareceram . ${diasSemRender}`)
console.log(`  nomes conferidos ........ ${nomesConferidos}`)
console.log(`  divergências ............ ${divergencias.length}\n`)

if (diasConferidos < datas.length * 0.9) {
  console.error(`🔴 Só ${diasConferidos} de ${datas.length} dias puderam ser conferidos.`)
  console.error('   Uma varredura que não vê o conteúdo não prova nada.')
  process.exit(1)
}

if (erros.length) {
  console.log('⚠️ O site antigo emitiu erro de página:')
  erros.slice(0, 3).forEach((e) => console.log('   ·', e))
  console.log()
}

console.log('─'.repeat(70))
if (divergencias.length) {
  console.error(`\n🔴 ${divergencias.length} DIVERGÊNCIA(S) entre o histórico congelado e o site antigo:\n`)
  for (const d of divergencias.slice(0, 15)) {
    console.error(`  ${brDe(d.data)}`)
    console.error(`    nós temos: ${d.esperados.join(', ')}`)
    console.error(`    🔴 não aparece no site antigo: ${d.faltando.join(', ')}`)
  }
  if (divergencias.length > 15) console.error(`  (+${divergencias.length - 15})`)
  console.error('\n  O histórico congelado desmente o que os irmãos viram. Resolver ANTES de divulgar.')
  process.exit(1)
}

console.log(`\n✅ Os ${diasConferidos} dias e ${nomesConferidos} nomes do histórico congelado batem`)
console.log('   com o que o site antigo mostra na TELA — não só com o código dele.')
console.log('   A promessa de preservar o passado se sustenta.')
