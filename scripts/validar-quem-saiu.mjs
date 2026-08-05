/**
 * 🔴 A TELA AGUENTA ALGUÉM SAIR DO ELENCO?
 *
 * O recurso que deu origem ao projeto é *"sempre acontece de saírem pessoas da escala"*. Tirar
 * alguém é marcar `ativo: false` — o registro **nunca** é apagado, porque os blocos passados o
 * referenciam por `id`.
 *
 * Só que isso nunca tinha sido **renderizado**. Com as 16 pessoas ativas, a tela nunca viu um
 * inativo, e o defeito ficou latente: `definirPessoas` filtrava por `ativo`, e no dia em que o
 * Flavio tirasse alguém, quatro coisas quebrariam de uma vez — sem erro, sem tela branca, sem nada
 * que chamasse atenção.
 *
 * Este script desativa **de verdade** uma pessoa com escala no passado, sobe o site, e confere as
 * quatro na tela. Depois devolve o arquivo ao que era.
 *
 * ⚠️ Mexe só em `public/dados/` (o que o servidor de desenvolvimento lê). `docs/dados/`, que é o
 * publicado, não é tocado — e o `finally` restaura mesmo se algo estourar no meio.
 *
 * Uso: node scripts/validar-quem-saiu.mjs
 */
import { chromium } from 'playwright'
import { readFileSync, writeFileSync, copyFileSync, rmSync, existsSync } from 'node:fs'
import { subirServidor } from './lib/servidor-de-teste.mjs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const ARQ = join(RAIZ, 'public/dados/pessoas.json')
const BACKUP = join(RAIZ, 'public/dados/.pessoas.json.antes-do-teste')
const PORTA = 5199

const blocos = JSON.parse(readFileSync(join(RAIZ, 'public/dados/blocos.json'), 'utf8')).blocos
const pessoasOriginais = JSON.parse(readFileSync(ARQ, 'utf8'))

/** Quem sai: alguém com bastante escala no PASSADO — é o passado dele que não pode sumir. */
const contagem = new Map()
for (const b of blocos) for (const t of b.turnos) for (const id of t.pessoas ?? []) {
  contagem.set(id, (contagem.get(id) ?? 0) + 1)
}
const [ALVO, TURNOS_DELE] = [...contagem.entries()].sort((a, b) => b[1] - a[1])[0]
const NOME = pessoasOriginais.pessoas.find((p) => p.id === ALVO).nome

console.log('A TELA AGUENTA ALGUÉM SAIR DO ELENCO?\n')
console.log(`  quem sai ......... ${NOME} (${ALVO})`)
console.log(`  escala no passado  ${TURNOS_DELE} turnos — é isto que não pode sumir\n`)

copyFileSync(ARQ, BACKUP)
let servidor = null
const checagens = []
const conferir = (nome, ok, detalhe) => checagens.push({ nome, ok, detalhe })

try {
  writeFileSync(
    ARQ,
    JSON.stringify(
      { ...pessoasOriginais, pessoas: pessoasOriginais.pessoas.map((p) => (p.id === ALVO ? { ...p, ativo: false } : p)) },
      null,
      2,
    ),
    'utf8',
  )

  // Estoura se a porta estiver ocupada. Em 04/08/2026 este script deu 🔴 quatro vezes seguidas
  // conversando com um vite órfão de execuções anteriores; matando os órfãos, o MESMO código deu
  // 5 de 5. Falso vermelho e falso verde saem da mesma causa.
  servidor = await subirServidor({ raiz: RAIZ, porta: PORTA, modo: 'dev' })

  const navegador = await chromium.launch()
  const pagina = await navegador.newPage({ viewport: { width: 1400, height: 1600 } })
  const errosConsole = []
  pagina.on('pageerror', (e) => errosConsole.push(e.message))

  // Espera o servidor subir — sem `sleep` cego: tenta até responder.
  let subiu = false
  for (let i = 0; i < 40 && !subiu; i++) {
    try {
      await pagina.goto(servidor.url, { waitUntil: 'networkidle', timeout: 3000 })
      subiu = true
    } catch { await pagina.waitForTimeout(500) }
  }
  if (!subiu) throw new Error(`o servidor não subiu na porta ${PORTA}`)
  await pagina.waitForTimeout(1500)

  const texto = () => pagina.locator('#root').innerText()

  // 1 — a escala mostra o NOME, não o id cru
  const inicial = await texto()
  conferir(
    'a escala mostra o nome de quem saiu (não o id cru)',
    inicial.includes(NOME) && !inicial.includes(ALVO),
    inicial.includes(NOME) ? `"${NOME}" na tela` : `🔴 nome ausente; id cru presente: ${inicial.includes(ALVO)}`,
  )

  // 2 — a busca por nome ainda encontra os cultos dele
  const busca = pagina.locator('input[type="text"]').first()
  await busca.fill(NOME)
  await pagina.waitForTimeout(900)
  const buscado = await texto()
  conferir(
    'a busca por nome encontra a escala passada dele',
    buscado.includes(NOME),
    buscado.includes(NOME) ? 'encontrou' : '🔴 buscar por quem saiu não acha nada',
  )
  await busca.fill('')
  await pagina.waitForTimeout(600)

  // 3 — as estatísticas contam os turnos passados e marcam quem saiu
  const abaEstat = pagina.getByRole('button', { name: /Estat/i }).first()
  if (await abaEstat.count()) {
    await abaEstat.click()
    await pagina.waitForTimeout(1200)
  }
  const estat = await texto()
  const linha = estat.split('\n').findIndex((l) => l.includes(NOME))
  const trecho = estat.split('\n').slice(linha, linha + 4).join(' ')
  conferir(
    'as estatísticas mantêm a pessoa e os turnos dela',
    linha >= 0 && /\d/.test(trecho),
    linha >= 0 ? `linha presente: ${trecho.trim().slice(0, 60)}` : '🔴 sumiu da tabela de estatísticas',
  )
  conferir(
    'a tela MARCA que a pessoa saiu (não finge que está no elenco)',
    /saiu/i.test(estat),
    /saiu/i.test(estat) ? 'marcador "saiu" visível' : '🔴 nenhum marcador — parece gente do elenco',
  )

  // 4 — nenhum erro de console pelo caminho
  conferir('nenhum erro no console', errosConsole.length === 0, errosConsole.slice(0, 2).join(' · ') || 'limpo')

  await pagina.screenshot({ path: 'capturas/quem-saiu.png', fullPage: false })
  await navegador.close()
} finally {
  if (servidor) await servidor.derrubar()
  if (existsSync(BACKUP)) {
    copyFileSync(BACKUP, ARQ)
    rmSync(BACKUP, { force: true })
    console.log('  (dados de desenvolvimento restaurados)\n')
  }
}

for (const c of checagens) console.log(`  ${c.ok ? '✅' : '🔴'} ${c.nome.padEnd(52)} ${c.detalhe}`)

const falhas = checagens.filter((c) => !c.ok)
console.log(`\n  ${checagens.length - falhas.length} de ${checagens.length} checagens aprovadas\n`)
if (falhas.length) {
  console.error('🔴 Tirar alguém do elenco quebra a tela. É o recurso que originou o projeto.\n')
  process.exit(1)
}
console.log('✅ Alguém sai do elenco e o passado dele continua inteiro na tela, marcado como quem saiu.\n')
