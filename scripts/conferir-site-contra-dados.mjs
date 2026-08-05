/**
 * 🔍 O SITE MOSTRA O QUE O DADO DIZ? Todos os dias, um a um.
 *
 * A validação ao vivo prova que a tela **renderizou** e que 7 pontos escolhidos estão certos.
 * Isso é diferente de provar que **cada dia** da escala aparece com **cada nome** que o
 * `blocos.json` publicou. Entre o dado e a tela existem o filtro, a ordenação, o agrupamento por
 * mês, o corte de exibição e o fuso do navegador — qualquer um pode sumir com um dia inteiro.
 *
 * A conferência simétrica já foi feita contra o site **antigo** (66 dias, 282 nomes, 0
 * divergências), e ali ela encontrou um comportamento que ninguém imaginava: o site antigo **não
 * renderiza o passado**. Se aquela suposição estava errada, não há razão para confiar nesta sem
 * medir.
 *
 * O que este script NÃO faz: julgar se a escala está boa. Isso é do catálogo de regras. Aqui só se
 * pergunta uma coisa — **o que foi publicado como dado chegou inteiro à tela?**
 *
 * Uso: node scripts/conferir-site-contra-dados.mjs [url]
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const URL = process.argv[2] ?? 'https://flaviocom.github.io/escala-porteiros/'

// ---------------------------------------------------------------------------
// O DADO — lido do que está publicado em docs/, que é o que o site baixa
// ---------------------------------------------------------------------------
const blocos = JSON.parse(readFileSync(join(RAIZ, 'docs/dados/blocos.json'), 'utf8')).blocos
const pessoas = JSON.parse(readFileSync(join(RAIZ, 'docs/dados/pessoas.json'), 'utf8')).pessoas
const nomeDe = (id) => pessoas.find((p) => p.id === id)?.nome ?? id

/** data → { nomes: Set, santaCeia: boolean } */
const esperado = new Map()
for (const b of blocos) {
  for (const t of b.turnos) {
    if (!esperado.has(t.data)) esperado.set(t.data, { nomes: new Set(), santaCeia: false })
    const dia = esperado.get(t.data)
    if (t.santaCeia) dia.santaCeia = true
    for (const id of t.pessoas ?? []) dia.nomes.add(nomeDe(id))
  }
}

const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']
const brDe = (iso) => iso.split('-').reverse().join('/')
/** Como a tela escreve o dia. Medido no site, não suposto — foi o erro que custou duas rodadas. */
const marcaDoDia = (iso) => {
  const [, m, d] = iso.split('-')
  return `${MESES[Number(m) - 1]}\n${d}`
}

const datas = [...esperado.keys()].sort()
const comEscala = datas.filter((d) => esperado.get(d).nomes.size > 0)

console.log('O SITE MOSTRA O QUE O DADO DIZ?\n')
console.log(`  url ................. ${URL}`)
console.log(`  blocos publicados ... ${blocos.length}`)
console.log(`  dias no dado ........ ${datas.length}  (${comEscala.length} com gente, ${datas.length - comEscala.length} sem)`)
console.log(`  escalações .......... ${[...esperado.values()].reduce((s, d) => s + d.nomes.size, 0)}\n`)

// ---------------------------------------------------------------------------
// A TELA
// ---------------------------------------------------------------------------
const navegador = await chromium.launch()
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 2000 } })

const errosConsole = []
pagina.on('pageerror', (e) => errosConsole.push(e.message))
pagina.on('console', (m) => { if (m.type() === 'error') errosConsole.push(m.text()) })

await pagina.goto(URL, { waitUntil: 'networkidle', timeout: 60_000 })
await pagina.waitForTimeout(2500)

const busca = pagina.locator('input[type="text"]').first()
if (!(await busca.count())) {
  console.error('🔴 Não achei o campo de busca — a tela mudou ou não renderizou.')
  await navegador.close()
  process.exit(1)
}

const divergencias = []
const semRender = []
let conferidos = 0
let nomesOk = 0

process.stdout.write(`Conferindo ${datas.length} dias`)
for (const data of datas) {
  const dia = esperado.get(data)
  await busca.fill('')
  await busca.fill(brDe(data))
  await pagina.waitForTimeout(550)
  const trecho = await pagina.locator('#root').innerText()

  // 🔒 O dia apareceu? Sem isto, "nenhum nome faltando" num texto vazio viraria verde — foi
  // exatamente o que o guard da conferência do site antigo impediu.
  if (!trecho.includes(marcaDoDia(data))) {
    semRender.push(data)
    continue
  }
  conferidos++

  const faltando = [...dia.nomes].sort().filter((n) => !trecho.includes(n))
  nomesOk += dia.nomes.size - faltando.length
  if (faltando.length) divergencias.push({ data, tipo: 'nome ausente na tela', detalhe: faltando.join(', ') })

  // Santa Ceia: o dia aparece, e NINGUÉM é escalado. Um nome aqui é o defeito que motivou o projeto.
  if (dia.santaCeia) {
    const intrusos = pessoas.map((p) => p.nome).filter((n) => trecho.includes(n))
    if (intrusos.length) divergencias.push({ data, tipo: '🔴 SANTA CEIA com gente na tela', detalhe: intrusos.join(', ') })
    if (!/SANTA CEIA/i.test(trecho)) divergencias.push({ data, tipo: 'Santa Ceia sem o aviso na tela', detalhe: '—' })
  }

  if (conferidos % 20 === 0) process.stdout.write('.')
}
process.stdout.write('\n\n')

await pagina.screenshot({ path: 'capturas/site-novo-conferencia.png' })
await navegador.close()

// ---------------------------------------------------------------------------
console.log('RESULTADO\n')
console.log(`  dias conferidos ......... ${conferidos} de ${datas.length}`)
console.log(`  dias que não apareceram . ${semRender.length}`)
console.log(`  nomes conferidos ........ ${nomesOk}`)
console.log(`  divergências ............ ${divergencias.length}\n`)

let falhou = false

if (semRender.length) {
  console.error(`🔴 ${semRender.length} dia(s) do dado NÃO aparecem na tela:\n`)
  for (const d of semRender.slice(0, 20)) console.error(`  ${brDe(d)}`)
  if (semRender.length > 20) console.error(`  (+${semRender.length - 20})`)
  console.error('\n  Dado publicado que não chega à tela é dado que não existe para quem lê.\n')
  falhou = true
}

if (divergencias.length) {
  console.error(`🔴 ${divergencias.length} DIVERGÊNCIA(S) entre o dado e a tela:\n`)
  for (const d of divergencias.slice(0, 20)) {
    console.error(`  ${brDe(d.data)} — ${d.tipo}`)
    console.error(`    ${d.detalhe}`)
  }
  if (divergencias.length > 20) console.error(`  (+${divergencias.length - 20})`)
  console.error()
  falhou = true
}

if (errosConsole.length) {
  console.error(`🔴 ${errosConsole.length} erro(s) no console do navegador:`)
  errosConsole.slice(0, 5).forEach((e) => console.error(`   · ${e}`))
  console.error()
  falhou = true
}

if (falhou) process.exit(1)

console.log('─'.repeat(70))
console.log(`\n✅ Os ${conferidos} dias e ${nomesOk} nomes publicados como DADO chegam inteiros à TELA.`)
console.log('   Nenhum dia sumiu, nenhum nome ficou pelo caminho, e a Santa Ceia aparece sem ninguém.\n')
