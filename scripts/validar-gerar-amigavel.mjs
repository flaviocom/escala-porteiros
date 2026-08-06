/**
 * Os cinco pedidos do Flavio de 05/08/2026, provados na tela — não no código.
 *
 *   1. o intervalo NÃO volta ao padrão ao trocar de aba, e começa onde a escala publicada terminou;
 *   2. a conferência regra a regra explica cada regra em linguagem comum, e separa o que REPROVA
 *      do que só avisa;
 *   3. a proposta do motor tem explicação de "o que é isto";
 *   4. dá para marcar uma ausência ANTES de gerar, e a escala a respeita;
 *   5. o histórico de publicações diz, em português, que nada é apagado e qual está no ar.
 *
 * Uso: node scripts/validar-gerar-amigavel.mjs
 */
import { chromium } from 'playwright'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { subirServidor } from './lib/servidor-de-teste.mjs'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORTA = 4293

const checagens = []
const conferir = (nome, ok, detalhe = '') => checagens.push({ nome, ok, detalhe })

console.log('GERAR ESCALA — amigável para quem não conhece o sistema\n')

const servidor = await subirServidor({ raiz: RAIZ, porta: PORTA, modo: 'preview' })
let navegador
try {
  navegador = await chromium.launch()
  const pagina = await navegador.newPage({ viewport: { width: 1400, height: 1200 } })
  const erros = []
  pagina.on('pageerror', (e) => erros.push(e.message))

  let subiu = false
  for (let i = 0; i < 40 && !subiu; i++) {
    try { await pagina.goto(servidor.url + '#/admin', { waitUntil: 'networkidle', timeout: 3000 }); subiu = true }
    catch { await pagina.waitForTimeout(500) }
  }
  if (!subiu) throw new Error('o servidor não subiu')
  await pagina.waitForTimeout(1200)

  await pagina.getByRole('button', { name: /Entrar agora — sem senha, sem token/i }).first().click()
  await pagina.waitForTimeout(1500)
  await pagina.getByRole('button', { name: /^Gerar escala/i }).first().click()
  await pagina.waitForTimeout(900)

  const campoDe = pagina.locator('input[type="date"]').first()
  const campoAte = pagina.locator('input[type="date"]').nth(1)

  // ── 1. o intervalo começa DEPOIS do último turno publicado ───────────────
  const deInicial = await campoDe.inputValue()
  conferir('o intervalo começa depois da escala já publicada', deInicial >= '2026-12-31',
    `De = ${deInicial} (o publicado termina em 30/12/2026)`)

  // ── 4. ausência ANTES de gerar ───────────────────────────────────────────
  const painel = await pagina.getByText(/Quem estará ausente no período/i).count()
  conferir('existe o painel de ausências na aba Gerar', painel > 0, painel ? 'presente' : 'AUSENTE')

  // Um período onde caiba escala, para o teste ter o que gerar.
  await campoDe.fill('2026-09-01')
  await campoAte.fill('2026-09-30')
  await pagina.waitForTimeout(400)

  const quem = pagina.locator('select').first()
  const nomeAusente = await quem.locator('option').nth(1).innerText()
  await quem.selectOption({ index: 1 })
  // 🔴 POR RÓTULO, NUNCA POR POSIÇÃO. Estas duas linhas eram `nth(2)` e `nth(3)`. Em 05/08/2026 um
  // campo de data novo (a Santa Ceia) entrou na aba, no meio, e empurrou os dois para nth(3)/nth(4).
  // O teste passou a digitar a data da ausência DENTRO do campo da Santa Ceia e a deixar o "último
  // dia" vazio — a tela recusava a ausência, com razão, e o teste acusava a tela.
  //
  // Posição não é identidade. `getByLabel` quebra alto no dia em que o rótulo sumir (e o rótulo
  // sumindo é, ele mesmo, um defeito de acessibilidade que a gente quer ver quebrar).
  await pagina.getByLabel('primeiro dia').fill('2026-09-01')
  await pagina.getByLabel('último dia').fill('2026-09-30')
  await pagina.getByRole('button', { name: /Marcar ausência/i }).click()
  await pagina.waitForTimeout(600)

  const marcada = await pagina.getByText(new RegExp(`${nomeAusente}.*de 01/09/2026 a 30/09/2026`, 'i')).count()
  conferir('a ausência aparece marcada no período', marcada > 0, `${nomeAusente}, 01/09 a 30/09`)

  // ⚠️ `.first()` PEGAVA A ABA: "Gerar escala" é o nome da aba E do botão de ação. O clique caía na
  // aba, nada era gerado, e as checagens seguintes passavam no vazio — a da ausência chegou a dar
  // VERDE porque "não aparece na lista" também é verdade quando não há lista nenhuma.
  await pagina.getByRole('button', { name: /^Gerar escala$/i }).last().click()
  await pagina.waitForTimeout(6000)

  const corpo = await pagina.locator('body').innerText()

  // Portão do portão: sem escala gerada, nada abaixo significa coisa alguma.
  const gerou = /Conferência regra a regra/i.test(corpo)
  conferir('a escala foi de fato gerada (sem isto, o resto é vácuo)', gerou,
    gerou ? 'conferência na tela' : 'NADA foi gerado — as checagens seguintes seriam falso verde')
  // Quem está ausente o mês inteiro não pode ter sido escalado nenhuma vez.
  const escalouAusente = new RegExp(`${nomeAusente}\\s+\\d+ turnos`).test(corpo)
  const zeroTurnos = new RegExp(`${nomeAusente}\\s+0 turnos`).test(corpo)
  conferir('🔴 quem está ausente NÃO foi escalado', gerou && (!escalouAusente || zeroTurnos),
    zeroTurnos ? `${nomeAusente}: 0 turnos` : (escalouAusente ? `${nomeAusente} FOI escalado` : 'não aparece na lista'))

  // ── 2. conferência amigável ──────────────────────────────────────────────
  conferir('a conferência explica cada regra em linguagem comum',
    /o posto fica descoberto/i.test(corpo) && /férias, viagem, compromisso\) não é escalado/i.test(corpo),
    'explicações de D1 e D6 presentes')
  conferir('separa o que IMPEDE publicar do que só avisa',
    /impede publicar/i.test(corpo) && /não impede publicar/i.test(corpo), 'legenda presente')

  // ── 3. o motor explicado ─────────────────────────────────────────────────
  conferir('a proposta do motor tem "o que é isto"',
    /O que é isto, exatamente\?/i.test(corpo) && /Segunda opinião do motor/i.test(corpo),
    'explicação disponível')

  // ── 1b. trocar de aba e voltar NÃO perde o intervalo ─────────────────────
  await pagina.getByRole('button', { name: /^Elenco/i }).first().click()
  await pagina.waitForTimeout(700)
  await pagina.getByRole('button', { name: /^Gerar escala/i }).first().click()
  await pagina.waitForTimeout(700)
  const deDepois = await pagina.locator('input[type="date"]').first().inputValue()
  conferir('🔴 trocar de aba e voltar NÃO apaga o intervalo', deDepois === '2026-09-01',
    `antes 2026-09-01 → depois ${deDepois}`)

  // ── 1c. ESPELHO: Elenco e Gerar são a MESMA lista, não duas cópias ───────
  //
  // *"A parte do elenco replica aqui, correto? É um espelho."* — Flavio, 05/08/2026.
  //
  // Provar só que os dois mostram algo não basta: duas cópias sincronizadas na hora do carregamento
  // também mostrariam. O que distingue é o ESCRITO NUM aparecer no OUTRO, e o APAGADO sumir dos dois.
  await pagina.getByRole('button', { name: /^Elenco/i }).first().click()
  await pagina.waitForTimeout(800)
  const noElenco = await pagina.locator('body').innerText()
  const linhaDoAusente = noElenco.split('\n').findIndex((l) => l.includes(nomeAusente))
  const etiquetaNoElenco = noElenco.split('\n').slice(linhaDoAusente, linhaDoAusente + 3).join(' ')
  conferir('🔴 o que foi marcado em GERAR aparece no ELENCO', /1 ausência\(s\)/.test(etiquetaNoElenco),
    etiquetaNoElenco.trim().slice(0, 60) || '(sem etiqueta)')

  // E a volta: apagar pela porta de Gerar precisa sumir do Elenco também.
  await pagina.getByRole('button', { name: /^Gerar escala/i }).first().click()
  await pagina.waitForTimeout(700)
  await pagina.getByTitle(`Tirar a ausência de ${nomeAusente}`).click()
  await pagina.waitForTimeout(600)
  await pagina.getByRole('button', { name: /^Elenco/i }).first().click()
  await pagina.waitForTimeout(800)
  const depoisDeApagar = await pagina.locator('body').innerText()
  const linha2 = depoisDeApagar.split('\n').findIndex((l) => l.includes(nomeAusente))
  const etiqueta2 = depoisDeApagar.split('\n').slice(linha2, linha2 + 3).join(' ')
  conferir('🔴 e o apagado em GERAR some do ELENCO — uma lista só, não duas',
    !/ausência\(s\)/.test(etiqueta2), etiqueta2.trim().slice(0, 60) || '(sem etiqueta, como esperado)')

  // ── 7. GRASP: comparou várias e deixa pedir outra ───────────────────────
  //
  // ⚠️ O botão vive na aba GERAR, e a checagem anterior deixou a tela no ELENCO. Sem voltar, o
  // portão acusaria "AUSENTE" um botão que existe — defeito da régua, não do produto.
  await pagina.getByRole('button', { name: /^Gerar escala/i }).first().click()
  await pagina.waitForTimeout(800)
  conferir('diz que comparou VÁRIAS versões antes de escolher', /melhor de \d+ versões/i.test(corpo),
    corpo.match(/melhor de \d+ versões/i)?.[0] ?? '(não anuncia)')
  const botaoOutra = await pagina.getByRole('button', { name: /gerar outra combinação/i }).count()
  conferir('oferece "gerar outra combinação"', botaoOutra > 0, botaoOutra ? 'presente' : 'AUSENTE')

  // E ele PRECISA produzir uma escala diferente — senão é um botão que finge trabalhar.
  const antesDoRegerar = await pagina.locator('body').innerText()
  const assinatura = (t) => t.split('\n').filter((l) => /\d+ turnos · mín\./.test(l)).join('|')
  await pagina.getByRole('button', { name: /gerar outra combinação/i }).click()
  await pagina.waitForTimeout(7000)
  const depoisDoRegerar = await pagina.locator('body').innerText()
  conferir('🔴 "gerar outra" produz escala DIFERENTE, não a mesma de novo',
    assinatura(antesDoRegerar) !== '' && assinatura(antesDoRegerar) !== assinatura(depoisDoRegerar),
    assinatura(antesDoRegerar) === assinatura(depoisDoRegerar) ? 'saiu IGUAL — o botão não faz nada' : 'distribuição mudou')

  // ── 6. A SEGUNDA RÉGUA na tela, e o cruzamento ──────────────────────────
  await pagina.getByRole('button', { name: /^Conferir por fora/i }).first().click()
  await pagina.waitForTimeout(1200)
  const naConferencia = await pagina.locator('body').innerText()
  conferir('a aba "Conferir por fora" existe e roda', /Conferência independente/i.test(naConferencia),
    naConferencia.match(/As duas conferências[^\n]*|AS DUAS CONFERÊNCIAS[^\n]*/i)?.[0]?.slice(0, 60) ?? '(sem veredito)')
  conferir('🔴 ela mostra o CRUZAMENTO das duas, não só a própria opinião',
    /Conferência normal:/i.test(naConferencia) && /Conferência independente:/i.test(naConferencia),
    'os dois vereditos lado a lado')
  conferir('e DECLARA o próprio limite, em vez de vender independência total',
    /mesmo autor/i.test(naConferencia) && /auditor externo/i.test(naConferencia),
    'limite declarado na tela')
  conferir('sobre a escala recém-gerada, as duas CONCORDAM',
    /nenhum furo nesta escala/i.test(naConferencia) || /concordam no veredito/i.test(naConferencia),
    naConferencia.match(/(✅|⚠️)[^\n]*/)?.[0]?.slice(0, 70) ?? '(?)')

  // ── 5. histórico de publicações amigável ────────────────────────────────
  await pagina.getByRole('button', { name: /^Publicar/i }).first().click()
  await pagina.waitForTimeout(900)
  const naPublicar = await pagina.locator('body').innerText()
  conferir('o histórico explica que nada é apagado',
    /não é apagada/i.test(naPublicar) && /que está no ar agora/i.test(naPublicar),
    'descrição presente')

  conferir('nenhum erro no console', erros.length === 0, erros.slice(0, 2).join(' · ') || 'limpo')
  await pagina.screenshot({ path: join(RAIZ, 'capturas', 'gerar-amigavel.png'), fullPage: false })
} finally {
  if (navegador) await navegador.close()
  await servidor.derrubar()
}

console.log('')
for (const c of checagens) console.log(`  ${c.ok ? '✅' : '🔴'} ${c.nome.padEnd(52)} ${c.detalhe}`)
const falhas = checagens.filter((c) => !c.ok)
console.log(`\n  ${checagens.length - falhas.length} de ${checagens.length} checagens aprovadas`)
if (falhas.length) { console.log('\n🔴 Algum dos cinco pedidos NÃO está cumprido.'); process.exit(1) }
console.log('\n✅ Os cinco pedidos de 05/08 estão na tela, provados.')
