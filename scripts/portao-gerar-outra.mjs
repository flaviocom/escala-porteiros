/**
 * 🔁 PORTÃO — "Não gostei — gerar outra combinação" entrega mesmo OUTRA?
 *
 * 🔴 POR QUE ESTE PORTÃO EXISTE. 06/08/2026, palavras do dono:
 *
 *   > *"Distanciamento por pessoa, mesmo clicando várias vezes, não muda nada. O 'Não gostei —
 *   >  gerar outra combinação' é uma farsa."*
 *
 * Ele estava certo, e o mais caro do defeito é que **tudo por baixo parecia funcionar**. A semente
 * mudava a cada clique; as oito versões saíam de fato distintas; havia teste provando que sementes
 * diferentes dão escalas diferentes, e ele passava. O que ninguém media era a ÚLTIMA etapa: a
 * cascata escolhe a melhor por piso e por Jain, e a vencedora era sempre a versão GULOSA — a única
 * que não usa semente nenhuma. O botão montava oito alternativas e descartava as oito.
 *
 * Nenhum dos testes de unidade podia pegar isso, porque cada um estava certo sozinho. O defeito
 * morava na junção — e a junção só existe inteira na tela, com este elenco.
 *
 * ── O QUE ESTE PORTÃO MEDE ───────────────────────────────────────────────────────────────────────
 *
 * Abre a tela, gera uma escala e clica em "Não gostei" quatro vezes, lendo a cada clique o cartão
 * **Distanciamento por pessoa** — que é onde ele olhava. Dois cliques seguidos com o mesmo texto
 * reprovam.
 *
 * ⚠️ Compara com o clique ANTERIOR, não com o conjunto de todos. Voltar a uma combinação de três
 * cliques atrás é legítimo: são poucas escalas válidas e boas, e ele pediu *outra*, não *inédita*.
 * Repetir a que está na tela é que quebra a promessa do botão.
 *
 * 🔴 O QUE ESTE PORTÃO **NÃO** MEDE, declarado porque isenção calada é buraco com outro nome: não
 * julga se a escala nova é melhor — disso cuidam o catálogo duro e os testes do gerador. Aqui a
 * pergunta é só uma: **o botão faz o que a etiqueta dele diz?**
 *
 * Uso: node scripts/portao-gerar-outra.mjs
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { subirServidor } from './lib/servidor-de-teste.mjs'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORTA = 4301
const CLIQUES = 4

console.log('🔁 "GERAR OUTRA COMBINAÇÃO" ENTREGA OUTRA?\n')

const servidor = await subirServidor({ raiz: RAIZ, porta: PORTA, modo: 'preview' })
let navegador
try {
  navegador = await chromium.launch()
  const pagina = await navegador.newPage({ viewport: { width: 1400, height: 1400 } })

  let subiu = false
  for (let i = 0; i < 40 && !subiu; i++) {
    try { await pagina.goto(servidor.url + '#/admin', { waitUntil: 'networkidle', timeout: 3000 }); subiu = true }
    catch { await pagina.waitForTimeout(500) }
  }
  if (!subiu) throw new Error('o servidor não subiu')
  await pagina.waitForTimeout(1200)

  await pagina.getByRole('button', { name: /Entrar agora — sem senha, sem token/i }).first().click()
  await pagina.waitForTimeout(1200)
  await pagina.getByRole('button', { name: /^Gerar escala/i }).first().click()
  await pagina.waitForTimeout(700)

  const esperarResultado = () =>
    pagina.getByText(/Piso alcançado|não foi possível cobrir|Segunda opinião/i).first().waitFor({ timeout: 90_000 })

  // ⚠️ `.last()`: a ABA e o BOTÃO têm o mesmo texto "Gerar escala". `.first()` pega a aba e não gera
  // nada, calado — a mesma armadilha que o portão de rótulos documenta.
  await pagina.getByRole('button', { name: /^Gerar escala$/ }).last().click()
  await esperarResultado()
  await pagina.waitForTimeout(500)

  /*
    A digital é o cartão que ELE olhava. Ler o bloco inteiro, e não só um nome, é de propósito: um
    trecho pequeno pode coincidir entre escalas diferentes e transformaria este portão num que
    reprova o certo.

    🔴 E é lido pelo NOME da região, não por texto solto. A primeira versão fazia
    `locator('div').filter({ hasText: /^Distanciamento por pessoa/ }).last()` e pegava o cabeçalho —
    83 caracteres imutáveis. O portão acusou "MESMA escala" nos quatro cliques **com a correção já
    aplicada**: a sonda estava medindo o próprio rastro. Por isso `Cartao` agora tem
    `aria-labelledby`, e por isso a linha abaixo confere que o que veio contém as linhas de verdade.
  */
  const digital = async () => {
    const cartao = pagina.getByRole('region', { name: 'Distanciamento por pessoa' })
    if (!(await cartao.count())) throw new Error('o cartão "Distanciamento por pessoa" não está na tela')
    const texto = (await cartao.innerText()).replace(/\s+/g, ' ').trim()
    // Sinal de vida da própria sonda: sem as linhas por pessoa, o que sobrou é o cabeçalho — e
    // cabeçalho nunca muda, o que faria este portão reprovar para sempre, pelo motivo errado.
    const linhas = (texto.match(/turnos · mín\./g) ?? []).length
    if (linhas < 2) throw new Error(`o cartão veio sem as linhas por pessoa (${linhas}) — a sonda está medindo o cabeçalho`)
    return texto
  }

  const botao = pagina.getByRole('button', { name: /Não gostei — gerar outra combinação/i }).first()
  if (!(await botao.count())) throw new Error('o botão "Não gostei" não está na tela — nada a medir')

  /*
    🔴 E A FRASE DE BAIXO TAMBÉM É MEDIDA — porque ela promete um número.

    "A melhor de 8 versões" é verdade na primeira geração e deixa de ser depois de uma recusa: a
    escolha passa a ser entre as que DIFEREM da recusada, e a melhor de todas pode ter ficado de
    fora. Deixar a frase antiga ali seria repor em texto o defeito que este portão acabou de fechar
    no botão — um rótulo descrevendo algo que já não acontece.
  */
  const frase = async () => {
    const p = pagina.getByText(/é a melhor de|ficaram diferentes da que você recusou|melhor entre as/i).first()
    return (await p.count()) ? (await p.innerText()).replace(/\s+/g, ' ').trim() : ''
  }
  const fraseAntes = await frase()
  if (!/é a melhor de/i.test(fraseAntes)) {
    console.log(`🔴 antes de qualquer recusa, a frase deveria dizer "é a melhor de N versões". Veio: "${fraseAntes.slice(0, 80)}"`)
    process.exit(1)
  }

  let anterior = await digital()
  const repetidos = []
  const vistas = new Set([anterior])
  for (let i = 1; i <= CLIQUES; i++) {
    await botao.click()
    await esperarResultado()
    await pagina.waitForTimeout(500)
    const agora = await digital()
    if (agora === anterior) repetidos.push(i)
    else vistas.add(agora)
    console.log(`  clique ${i} ................... ${agora === anterior ? '🔴 MESMA escala' : '✅ mudou'}`)
    anterior = agora
  }

  const fraseDepois = await frase()
  const fraseMudou = /diferentes da que você recusou/i.test(fraseDepois)

  console.log(`\n  cliques medidos ........... ${CLIQUES}`)
  console.log(`  combinações distintas ..... ${vistas.size}`)
  console.log(`  a frase se corrigiu ....... ${fraseMudou ? 'sim' : '🔴 NÃO'}`)

  if (repetidos.length) {
    console.log(`\n🔴 o botão repetiu a escala que já estava na tela nos cliques: ${repetidos.join(', ')}.`)
    console.log('   "Não gostei" é um pedido explícito por outra. Devolver a mesma é uma etiqueta que mente.')
    console.log('   Ver `recusada` em src/dominio/gerador.ts — a escala recusada tem de sair da disputa.')
    process.exit(1)
  }
  if (!fraseMudou) {
    console.log(`\n🔴 depois da recusa, a frase continua dizendo: "${fraseDepois.slice(0, 100)}"`)
    console.log('   Ela promete "a melhor de N versões", e isso deixou de ser verdade: a melhor pode')
    console.log('   ser justamente a que ele recusou. Ver `jaRecusouAlguma` em src/admin/Admin.tsx.')
    process.exit(1)
  }
  console.log(`\n✅ os ${CLIQUES} cliques devolveram, cada um, uma escala diferente da que estava na tela,`)
  console.log('   e a frase abaixo do botão parou de prometer "a melhor de todas" depois da recusa.')
} finally {
  await navegador?.close()
  // `derrubar`, NÃO `parar` — ver a nota em portao-rotulos.mjs.
  await servidor.derrubar()
}
process.exit(0)
