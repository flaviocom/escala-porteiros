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
import { readFileSync } from 'node:fs'
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

  /*
    🔴 O PADRÃO É LIDO AQUI, ANTES DE O TESTE TOCAR EM QUALQUER CAMPO.

    A primeira versão desta checagem lia o "Até" lá embaixo, depois de o próprio teste já ter
    preenchido os campos várias vezes — e então acusava o produto de sugerir seis meses quando a tela
    recém-aberta sugeria o ano inteiro. **Media o próprio rastro e chamava de defeito do produto.**
  */
  const ateInicialPadrao = await campoAte.inputValue()
  const janelaPadrao = (await pagina.locator('#root').innerText()).split(String.fromCharCode(10)).map((x) => x.trim()).find((x) => /dia\(s\)/.test(x)) ?? ''

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

  /*
    ── 2b. a tabela de distribuição está na tela, com linhas ────────────────
    🔴 Peça testada e SEM CONSUMIDOR é a classe de defeito que este projeto já pagou três vezes:
    código correto, teste verde, e ninguém chamando. `estatisticas.ts` tem 13 testes; nenhum deles
    prova que o cartão aparece depois de gerar.

    E a checagem exige LINHAS, não o título. Um cabeçalho sozinho — foi assim que a sonda do
    `vivo:outra` nasceu vermelha — passaria como se a tabela estivesse lá.
  */
  const tabela = pagina.getByRole('region', { name: 'Distribuição de turnos' })
  const temTabela = await tabela.count()
  const textoTabela = temTabela ? await tabela.innerText() : ''
  const linhasDaTabela = (textoTabela.match(/\n/g) ?? []).length
  conferir('a tabela de distribuição aparece depois de gerar, com linhas',
    temTabela > 0 && linhasDaTabela >= 5,
    temTabela ? `${linhasDaTabela} linhas de texto` : 'o cartão NÃO está na tela')
  conferir('a tabela diz o período que está contando',
    /só o que você acabou de gerar/i.test(textoTabela) && /\d{2}\/\d{2}\/\d{4} a \d{2}\/\d{2}\/\d{4}/.test(textoTabela),
    'período no subtítulo')
  /*
    🔴 E quem tem teto mensal precisa estar NOMEADO fora da conta de equilíbrio. Com os dados reais,
    o teto de 3/mês do Williams sozinho produzia "diferença de 12 turnos" em âmbar sobre um ano — um
    alarme sobre uma restrição que o próprio dono cadastrou. Nomear é a regra que ele deu para a
    conferência independente, e vale igual aqui: dizer QUANTOS não basta, tem de dizer QUEM.
  */
  /*
    ⚠️ A EXPECTATIVA VEM DO DADO, não de um `if` que se satisfaz sozinho. A primeira versão desta
    checagem era `!temALinha || formatoCerto` — e passou VERDE com o cartão inteiro fora da tela,
    porque sem cartão não há linha e a negação é verdadeira. **Propriedade negativa não mede
    ausência**; é a classe que o `ensaio` já tinha registrado neste projeto.

    Agora ela lê `pessoas.json`: se existe alguém ativo com teto, a linha é OBRIGATÓRIA. Se ninguém
    tiver teto um dia, a checagem se isenta sozinha — e diz na saída que se isentou.
  */
  const ativosComTeto = JSON.parse(readFileSync(join(RAIZ, 'public/dados/pessoas.json'), 'utf8'))
    .pessoas.filter((p) => p.ativo && p.restricoes?.tetoMensal != null)
  const nomeouOTeto = /Fora da conta acima/i.test(textoTabela) && /máx\. \d+\/mês — ficou com \d+/i.test(textoTabela)
  conferir('quem tem teto mensal é NOMEADO fora da conta de equilíbrio',
    ativosComTeto.length === 0 || nomeouOTeto,
    ativosComTeto.length === 0
      ? 'isento: ninguém ativo tem teto cadastrado'
      : `${ativosComTeto.length} com teto (${ativosComTeto.map((p) => p.nome).join(', ')}) — ${nomeouOTeto ? 'nomeado' : 'NÃO nomeado'}`)

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

  // ── 6. 🔴 GERAÇÃO RECUSADA NÃO DEIXA A PROPOSTA VELHA NA TELA ────────────
  //
  // Sétima auditoria, medido ao vivo: com uma escala já proposta, pedir um período SEM nenhum dia de
  // culto fazia a tela recusar — e continuar mostrando a escala do período anterior, com a aba
  // `Ajustar` destravada e o `Publicar` oferecendo publicá-la.
  //
  // O estrago não é visual: os campos "De" e "Até" já mostram o período NOVO, e a proposta na tela é
  // do período VELHO. Publicar dali põe no ar uma escala que a tela não está descrevendo.
  await pagina.getByRole('button', { name: /^Gerar escala/i }).first().click()
  await pagina.waitForTimeout(700)
  await campoDe.fill('2027-01-01')
  await campoAte.fill('2027-03-31')
  await pagina.waitForTimeout(300)
  await pagina.getByRole('button', { name: /^Gerar escala$/ }).last().click()
  await pagina.getByText(/Piso alcançado|não foi possível cobrir/i).first().waitFor({ timeout: 90_000 }).catch(() => {})
  const propostaNaTela = /Piso alcançado|não foi possível cobrir/i.test(await pagina.locator('body').innerText())
  // Sem esta primeira metade o teste passaria com a tela sempre vazia — provaria nada.
  conferir('há uma proposta na tela, para haver o que apagar', propostaNaTela, propostaNaTela ? 'proposta presente' : 'NADA foi gerado')

  // 01/04/2027 é uma quinta-feira: a malha não tem culto nesse dia.
  await campoDe.fill('2027-04-01')
  await campoAte.fill('2027-04-01')
  await pagina.waitForTimeout(300)
  await pagina.getByRole('button', { name: /^Gerar escala$/ }).last().click()
  await pagina.waitForTimeout(1500)
  const depoisDaRecusa = await pagina.locator('body').innerText()
  conferir('a recusa explica o motivo', /não há nenhum dia de culto/i.test(depoisDaRecusa), 'mensagem presente')
  conferir('🔴 geração recusada APAGA a proposta anterior',
    !/Piso alcançado/i.test(depoisDaRecusa), 'a escala do período velho sumiu da tela')
  const ajustar = pagina.getByRole('button', { name: /^Ajustar/ }).first()
  conferir('🔴 e a aba Ajustar volta a travar', await ajustar.isDisabled(), 'travada, como antes de gerar')
  await pagina.getByRole('button', { name: /^Publicar/i }).first().click()
  await pagina.waitForTimeout(800)
  conferir('🔴 e o Publicar avisa que não há escala nova',
    /Nenhuma escala nova foi gerada/i.test(await pagina.locator('body').innerText()),
    'aviso presente — publicar só mexe no elenco')

  // ── 7. 🔴 A MENSAGEM NOMEIA A CAUSA, NÃO O SINTOMA DE OUTRO PROBLEMA ────────
  //
  // Sétima auditoria: com "De" em 31/12/2026 e "Até" em 01/01/2026, a tela respondia *"não há nenhum
  // dia de culto — escolha um período mais longo"*. Cada palavra verdadeira, o diagnóstico inteiro
  // falso: quem seguisse o conselho só se afastaria da solução.
  await pagina.getByRole('button', { name: /^Gerar escala/i }).first().click()
  await pagina.waitForTimeout(700)
  await campoDe.fill('2026-12-31')
  await campoAte.fill('2026-01-01')
  await pagina.waitForTimeout(400)
  await pagina.getByRole('button', { name: /^Gerar escala$/ }).last().click()
  await pagina.waitForTimeout(1800)
  const foraDeOrdem = await pagina.locator('body').innerText()
  conferir('🔴 "Até" antes do "De" nomeia A ORDEM, não o calendário',
    /anterior à inicial/i.test(foraDeOrdem) && !/não há nenhum dia de culto/i.test(foraDeOrdem),
    'a mensagem fala das duas datas')

  // E o ano de cinco dígitos. ⚠️ O setter NATIVO é obrigatório: atribuir `el.value` direto burla o
  // rastreador de valor do React, o `onChange` não roda, e o teste mede a data ANTIGA achando que
  // mediu a nova — foi exatamente o que aconteceu na primeira tentativa desta checagem.
  await campoAte.fill('2027-06-30')
  await pagina.waitForTimeout(300)
  await campoDe.evaluate((el) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    setter.call(el, '12026-01-01')
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await pagina.waitForTimeout(500)
  await pagina.getByRole('button', { name: /^Gerar escala$/ }).last().click()
  await pagina.waitForTimeout(2000)
  const anoLongo = await pagina.locator('body').innerText()
  conferir('🔴 ano de 5 dígitos é recusado, e a mensagem diz por quê',
    /não é uma data válida/i.test(anoLongo) && /quatro dígitos/i.test(anoLongo),
    'recusado com a causa nomeada')

  // ── 8. 🔴 O ANO INTEIRO, E A JANELA À VISTA ────────────────────────────
  //
  // O dono publicou doze meses sem perceber, e eu concluí que o problema era o tamanho. Não era: era
  // o tamanho ser INVISÍVEL. Ele desfez a trava que inventei — *"eu não pedi para você travar aí em
  // 6 meses"*, *"você vai calcular o ano inteiro"*, *"não tem mínimo nem máximo"*.
  //
  // Ficam duas exigências, e só duas: o fim sugerido cobre o ano, e o tamanho aparece — **sem
  // julgamento**, porque informar é trabalho da tela e decidir é dele.
  conferir('🔴 o fim sugerido cobre o ANO INTEIRO, sem trava',
    ateInicialPadrao.endsWith('-12-31'),
    `Até = ${ateInicialPadrao}`)
  conferir('🔴 a tela mostra o TAMANHO da janela antes de gerar',
    /\d+ dia\(s\)/.test(janelaPadrao), janelaPadrao || '(sem etiqueta)')
  conferir('🔴 e NÃO julga o tamanho — sem mínimo nem máximo',
    !/⚠/.test(janelaPadrao), janelaPadrao || '(sem etiqueta)')

  // ── 9. 🔴 O QUE ELE DIGITOU NÃO SOME AO RECARREGAR ──────────────────────────
  //
  // 06/08/2026, palavras dele: *"você altera e elas voltam (…) quando eu salvar, tem que ficar fixo.
  // Inclusive as datas."* Medido antes de consertar: mudar De, Até, pessoas por turno e Santa Ceia e
  // recarregar devolvia TUDO ao padrão.
  //
  // As três checagens são inseparáveis: guardar sem avisar seria trocar "perder trabalho" por
  // "confiar no que não foi publicado", e sem o descarte ele ficaria preso ao rascunho.
  const recarregar = async () => {
    await pagina.goto(servidor.url + '#/admin', { waitUntil: 'networkidle' })
    await pagina.waitForTimeout(1300)
    const e = pagina.getByRole('button', { name: /Entrar agora — sem senha, sem token/i }).first()
    if (await e.count()) { await e.click(); await pagina.waitForTimeout(1600) }
    await pagina.getByRole('button', { name: /^Gerar escala/i }).first().click()
    await pagina.waitForTimeout(1100)
  }
  const temAviso = async () => /em andamento/.test(await pagina.locator('body').innerText())

  await pagina.locator('input[type="number"]').first().fill('4')
  await campoDe.fill('2027-03-01')
  await pagina.waitForTimeout(900)
  await recarregar()
  const deVolta = await campoDe.inputValue()
  const porTurno = await pagina.locator('input[type="number"]').first().inputValue()
  conferir('🔴 o que ele digitou SOBREVIVE ao recarregar',
    deVolta === '2027-03-01' && porTurno === '4', `De=${deVolta} · por turno=${porTurno}`)
  conferir('🔴 e a tela AVISA que está mostrando rascunho, não o publicado', await temAviso(),
    'rascunho invisível seria pior que nenhum')

  await pagina.getByRole('button', { name: /Descartar e usar o publicado/i }).first().click()
  await pagina.waitForTimeout(2500)
  const e3 = pagina.getByRole('button', { name: /Entrar agora — sem senha, sem token/i }).first()
  if (await e3.count()) { await e3.click(); await pagina.waitForTimeout(1600) }
  await pagina.getByRole('button', { name: /^Gerar escala/i }).first().click()
  await pagina.waitForTimeout(1100)
  const semRascunho = !(await temAviso()) && (await pagina.locator('input[type="number"]').first().inputValue()) === '3'
  conferir('🔴 "Descartar" devolve o publicado, e o aviso some', semRascunho,
    'sem o descarte ele ficaria preso ao rascunho')

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
