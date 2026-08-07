/**
 * 🔎 AUDITORIA INDEPENDENTE DO SITE — recontar tudo do zero e confrontar com a tela.
 *
 * 🔴 POR QUE ESTE SCRIPT EXISTE. Em 07/08/2026 o dono publicou a escala e pediu, com estas palavras:
 *
 *   > *"tem como você fazer agora uma outra auditoria independente na escala do site, trazer essa
 *   >  última data, os mesmos números de estatística e distanciamento por pessoas e distribuição de
 *   >  turnos, só para confrontar com o apresentado no site, usando as mesmas pessoas que estão na
 *   >  escala escalada no site hoje, de 6/8/2026 a 31/12/2026?"*
 *
 * ── O QUE TORNA ESTA AUDITORIA INDEPENDENTE, e o que NÃO a tornaria ──────────────────────────────
 *
 * **Ela não importa uma linha de `src/`.** Nem `distribuir()`, nem `menorIntervalo()`, nem
 * `construirGrade()`. Se importasse, estaria confirmando uma régua com ela mesma: um erro na régua
 * apareceria dos dois lados e o resultado sairia "conferido". Toda contagem aqui é reescrita do
 * zero, deste arquivo, a partir da definição em português da regra.
 *
 * **E ela lê o DADO PUBLICADO, pela URL**, não o arquivo local. O que está no disco desta máquina é
 * uma hipótese sobre o que o site serve; a única prova é baixar da URL. Este projeto já pagou por
 * essa distinção mais de uma vez.
 *
 * ⚠️ **A independência que ela NÃO tem, declarada:** quem escreveu esta segunda contagem foi o mesmo
 * autor da primeira. Um engano de INTERPRETAÇÃO da regra — entender "distanciamento" errado nas duas
 * pontas — passaria pelas duas. O que ela pega é engano de implementação, que é a classe comum; para
 * a outra, o remédio é a definição em português no cabeçalho de cada medida, que fica exposta para o
 * dono conferir com os olhos.
 *
 * Uso: node scripts/auditoria-independente-do-site.mjs [--de 2026-08-06] [--ate 2026-12-31]
 */
import { chromium } from 'playwright'

const SITE = 'https://flaviocom.github.io/escala-porteiros/'
const arg = (nome, padrao) => {
  const i = process.argv.indexOf(nome)
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : padrao
}
const DE = arg('--de', '2026-08-06')
const ATE = arg('--ate', '2026-12-31')

const achados = []
const acusar = (o) => achados.push(o)

/**
 * 🔴 AUTOTESTE — `--autoteste` faz a auditoria mentir de propósito, e ela tem de PEGAR.
 *
 * Um auditor que só sabe dizer "está tudo certo" não vale nada: ele é indistinguível de um que não
 * mede. Com esta bandeira, a segunda contagem recebe **um turno inventado** para a primeira pessoa da
 * lista — o dado do site fica intocado. A tela então mostra um número e a auditoria outro, e o
 * relatório TEM de acusar. Se sair verde, o problema é do auditor.
 *
 * É a mesma disciplina dos portões deste projeto: provar as duas pontas, sempre. Aqui ela é ainda
 * mais necessária, porque a ponta boa (zero divergências) é a que se espera — e expectativa
 * atendida é o pior momento para conferir se o instrumento estava ligado.
 */
const AUTOTESTE = process.argv.includes('--autoteste')

/** Baixa do site, com quebra de cache — CDN velho é resposta antiga com cara de atual. */
async function baixar(caminho) {
  const r = await fetch(`${SITE}${caminho}?cb=${Date.now()}`, { cache: 'no-store' })
  if (!r.ok) throw new Error(`${caminho} respondeu ${r.status}`)
  return r.json()
}

console.log('🔎 AUDITORIA INDEPENDENTE DO SITE PUBLICADO\n')
console.log(`  período auditado .......... ${DE} a ${ATE}`)

const blocos = await baixar('dados/blocos.json')
const pessoasArq = await baixar('dados/pessoas.json')

/*
  ── AS PESSOAS ────────────────────────────────────────────────────────────────────────────────────
  "as mesmas pessoas que estão na escala escalada no site hoje" — então a população NÃO é a lista de
  ativos do cadastro: é quem realmente aparece em algum turno do período, mais os ativos que ficaram
  com zero. Sem os de zero, alguém esquecido sumiria da auditoria justamente por ter sido esquecido.
*/
const nomeDe = new Map(pessoasArq.pessoas.map((p) => [p.id, p.nome]))
const ativo = new Map(pessoasArq.pessoas.map((p) => [p.id, p.ativo]))
const tetoDe = new Map(pessoasArq.pessoas.map((p) => [p.id, p.restricoes?.tetoMensal ?? null]))

/** Todos os turnos do período, de todos os blocos, sem sobreposição — em ordem de data e tipo. */
const ORDEM_TIPO = { MANHA: 0, TARDE: 1, NOITE: 2 }
const turnos = blocos.blocos
  .flatMap((b) => b.turnos)
  .filter((t) => t.data >= DE && t.data <= ATE)
  .sort((a, b) => a.data.localeCompare(b.data) || ORDEM_TIPO[a.tipo] - ORDEM_TIPO[b.tipo])

const escalados = new Set(turnos.flatMap((t) => t.pessoas))
const populacao = [...new Set([...escalados, ...pessoasArq.pessoas.filter((p) => p.ativo).map((p) => p.id)])]

console.log(`  turnos no período ......... ${turnos.length}`)
console.log(`  vagas ..................... ${turnos.reduce((s, t) => s + (t.santaCeia ? 0 : t.capacidade), 0)}`)
console.log(`  pessoas na população ...... ${populacao.length} (escaladas ou ativas)`)

/*
  ── MEDIDA 1 · DISTRIBUIÇÃO ───────────────────────────────────────────────────────────────────────
  "Quantos turnos cada pessoa pegou no período, no total, por mês e por tipo de turno."
  O mês sai da FATIA da data (`AAAA-MM`), nunca de um `Date`: `new Date('2026-08-01')` é meia-noite
  UTC e em fuso negativo cai em 31/07.
*/
const dist = new Map(populacao.map((id) => [id, { total: 0, mes: {}, tipo: { MANHA: 0, TARDE: 0, NOITE: 0 } }]))
for (const t of turnos) {
  for (const id of t.pessoas) {
    if (!dist.has(id)) dist.set(id, { total: 0, mes: {}, tipo: { MANHA: 0, TARDE: 0, NOITE: 0 } })
    const d = dist.get(id)
    d.total++
    const m = t.data.slice(0, 7)
    d.mes[m] = (d.mes[m] ?? 0) + 1
    d.tipo[t.tipo]++
  }
}

/*
  ── MEDIDA 2 · DISTANCIAMENTO ─────────────────────────────────────────────────────────────────────
  "Entre duas escalas seguidas da mesma pessoa, quantos dias inteiros passaram — o MENOR que houve."
  Dois turnos no MESMO dia (manhã e noite de domingo) contam distância 0, e é o certo: é o mesmo dia.
  A conta é em dias de calendário, feita em UTC de propósito — as duas datas viram meia-noite UTC, a
  subtração é exata, e nenhum fuso do mundo a desloca.
*/
const diasEntre = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000)
const distancia = new Map()
for (const id of dist.keys()) {
  const datas = [...new Set(turnos.filter((t) => t.pessoas.includes(id)).map((t) => t.data))].sort()
  let menor = null
  for (let i = 1; i < datas.length; i++) {
    const d = diasEntre(datas[i - 1], datas[i])
    if (menor == null || d < menor) menor = d
  }
  distancia.set(id, { menor, escalas: datas.length })
}

if (AUTOTESTE) {
  const vitima = [...dist.keys()][0]
  dist.get(vitima).total += 1
  dist.get(vitima).tipo.NOITE += 1
  const primeiroMes = meses0(turnos)[0]
  dist.get(vitima).mes[primeiroMes] = (dist.get(vitima).mes[primeiroMes] ?? 0) + 1
  /*
    ⚠️ E o DISTANCIAMENTO também mente — auditoria do auditor, 07/08/2026. A primeira versão do
    autoteste só distorcia a distribuição; o confronto de "mín. N dias" nunca teve prova de mordida.
    Um confronto sem prova de mordida é exatamente o que este autoteste existe para não permitir:
    encolher o mínimo medido para 1 obriga a tela (que mostra o real, maior) a divergir — e o
    auditor TEM de acusar essa linha também.
  */
  const d = distancia.get(vitima)
  if (d?.menor != null && d.menor > 1) distancia.set(vitima, { ...d, menor: 1 })
  console.log(`\n  🧪 AUTOTESTE LIGADO — ${nomeDe.get(vitima)} recebeu 1 turno inventado e mínimo encolhido para 1, NA AUDITORIA.`)
  console.log('     O dado do site está intocado. O relatório TEM de acusar; verde aqui é defeito do auditor.\n')
}

function meses0(ts) {
  return [...new Set(ts.map((t) => t.data.slice(0, 7)))].sort()
}

const linhas = populacao
  .map((id) => ({
    id,
    nome: nomeDe.get(id) ?? id,
    ativo: ativo.get(id) ?? false,
    teto: tetoDe.get(id),
    ...dist.get(id),
    ...distancia.get(id),
  }))
  .sort((a, b) => Number(b.ativo) - Number(a.ativo) || a.nome.localeCompare(b.nome, 'pt-BR'))

const meses = [...new Set(turnos.map((t) => t.data.slice(0, 7)))].sort()
const ROTULO_MES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

console.log('\n── O QUE A SEGUNDA CONTAGEM ENCONTROU ─────────────────────────────────────────────\n')
const cab = ['pessoa'.padEnd(16), 'tot', 'mín', ' MAN', ' TAR', ' NOI', ...meses.map((m) => ROTULO_MES[+m.slice(5, 7) - 1].padStart(4))]
console.log('  ' + cab.join(' '))
for (const l of linhas) {
  console.log('  ' + [
    (l.nome + (l.ativo ? '' : ' (saiu)')).padEnd(16),
    String(l.total).padStart(3),
    String(l.menor ?? '-').padStart(3),
    String(l.tipo.MANHA || '-').padStart(4),
    String(l.tipo.TARDE || '-').padStart(4),
    String(l.tipo.NOITE || '-').padStart(4),
    ...meses.map((m) => String(l.mes[m] ?? '-').padStart(4)),
  ].join(' '))
}

/*
  ── CONFERÊNCIAS QUE NÃO DEPENDEM DA TELA ─────────────────────────────────────────────────────────
  Antes de abrir o navegador: coisas que só o dado pode responder, e que valem por si.
*/
const somaTotais = linhas.reduce((s, l) => s + l.total, 0)
const vagas = turnos.reduce((s, t) => s + (t.santaCeia ? 0 : t.pessoas.length), 0)
// ⚠️ Sob autoteste estas conferências internas acusariam sozinhas — e mascarariam a prova de que
// quem pegou a mentira foi o CONFRONTO COM A TELA, que é o que se quer demonstrar.
if (!AUTOTESTE && somaTotais !== vagas) acusar({ o: 'a soma dos totais não bate com as vagas ocupadas', esperado: vagas, veio: somaTotais })

for (const l of linhas) {
  const somaMes = Object.values(l.mes).reduce((s, n) => s + n, 0)
  const somaTipo = Object.values(l.tipo).reduce((s, n) => s + n, 0)
  if (!AUTOTESTE && somaMes !== l.total) acusar({ o: `${l.nome}: meses somam ${somaMes}, total diz ${l.total}` })
  if (!AUTOTESTE && somaTipo !== l.total) acusar({ o: `${l.nome}: tipos somam ${somaTipo}, total diz ${l.total}` })
  if (!l.ativo && l.total > 0) acusar({ o: `🔴 ${l.nome} SAIU do elenco e tem ${l.total} turnos no período` })
  if (l.teto != null) {
    for (const [m, n] of Object.entries(l.mes)) {
      if (n > l.teto) acusar({ o: `🔴 ${l.nome} estourou o teto em ${m}`, esperado: `≤ ${l.teto}`, veio: n })
    }
  }
}
const semNinguem = turnos.filter((t) => !t.santaCeia && t.pessoas.length < t.capacidade)
if (semNinguem.length) acusar({ o: `🔴 ${semNinguem.length} turno(s) com vaga aberta`, veio: semNinguem.slice(0, 3).map((t) => `${t.data} ${t.tipo}`).join(', ') })

const ativos = linhas.filter((l) => l.ativo && l.teto == null)
const menorTotal = Math.min(...ativos.map((l) => l.total))
const maiorTotal = Math.max(...ativos.map((l) => l.total))
const piorDistancia = Math.min(...linhas.filter((l) => l.menor != null).map((l) => l.menor))
console.log(`\n  equilíbrio (ativos sem teto) ... menor ${menorTotal} · maior ${maiorTotal} · diferença ${maiorTotal - menorTotal}`)
console.log(`  menor distanciamento do período ${piorDistancia} dia(s) — ` +
  linhas.filter((l) => l.menor === piorDistancia).map((l) => l.nome).join(', '))
for (const l of linhas.filter((l) => l.teto != null)) {
  console.log(`  com teto ...................... ${l.nome}: máx. ${l.teto}/mês, ficou com ${l.total}`)
}

/*
  ── CONFRONTO 1 · A TELA PÚBLICA DE ESTATÍSTICAS — roda SEMPRE ────────────────────────────────────

  🔴 Por que ela é o alvo principal, e não a área administrativa — 07/08/2026. A primeira versão
  deste confronto gerava o período `--de … --ate` na aba Gerar do admin. Funcionou no dia da
  publicação e QUEBROU no dia seguinte: a tela recusa geração retroativa (regra fixa do produto), e
  um período que ontem começava "hoje" passou a começar "ontem". **Auditor que só funciona no dia da
  publicação é auditor de um dia só** — e o defeito era meu, não da tela.

  A tela pública de Estatísticas descreve a ESCALA PUBLICADA INTEIRA, sem depender de gerar nada —
  está disponível todo dia, para qualquer visitante, e é exatamente "o apresentado no site". A
  recontagem dela aqui é feita à parte, sobre TODOS os turnos publicados (todos os blocos), porque é
  isso que a tabela declara contar.
*/
console.log('\n── CONFRONTO 1 · TELA PÚBLICA DE ESTATÍSTICAS (a escala publicada inteira) ────────\n')
const todosOsTurnos = blocos.blocos.flatMap((b) => b.turnos)
const distTudo = new Map()
for (const t of todosOsTurnos) {
  for (const id of t.pessoas) {
    if (!distTudo.has(id)) distTudo.set(id, { total: 0, mes: {} })
    const d = distTudo.get(id)
    d.total++
    d.mes[t.data.slice(0, 7)] = (d.mes[t.data.slice(0, 7)] ?? 0) + 1
  }
}
if (AUTOTESTE) {
  // A mesma mentira, na recontagem da escala inteira — o confronto público também tem de morder.
  const vitima = [...distTudo.keys()][0]
  distTudo.get(vitima).total += 1
  const m1 = Object.keys(distTudo.get(vitima).mes).sort()[0]
  distTudo.get(vitima).mes[m1] += 1
}

const nav = await chromium.launch()
try {
  const p = await nav.newPage({ viewport: { width: 1500, height: 1600 } })
  await p.goto(SITE, { waitUntil: 'networkidle', timeout: 60_000 })
  await p.waitForTimeout(1500)
  await p.getByRole('button', { name: /Estatísticas/i }).first().click()
  await p.waitForTimeout(1200)

  const tabela = await p.evaluate(() => {
    const t = document.querySelector('table')
    if (!t) return null
    const cab = [...t.querySelectorAll('thead th')].map((th) => th.textContent.trim())
    const corpo = [...t.querySelectorAll('tbody tr')].map((tr) =>
      [...tr.children].map((td) => td.textContent.replace(/\s+/g, ' ').trim()))
    return { cab, corpo }
  })
  if (!tabela || tabela.corpo.length === 0) {
    acusar({ o: '🔴 a tabela de Estatísticas não foi encontrada na tela pública — confronto vazio não é acordo' })
  } else {
    console.log(`  linhas lidas da tabela pública ... ${tabela.corpo.length} · colunas: ${tabela.cab.join(' ')}`)
    const MES_DE = { Mar: '03', Abr: '04', Mai: '05', Jun: '06', Jul: '07', Ago: '08', Set: '09', Out: '10', Nov: '11', Dez: '12', Jan: '01', Fev: '02' }
    const anoDe = (rot) => {
      // O cabeçalho traz "Ago/26" ou "Ago"; sem ano, vale o ano dos turnos publicados naquele mês.
      const m = rot.match(/^([A-Za-zç]{3})[./]?(\d{2})?$/)
      if (!m || !MES_DE[m[1]]) return null
      if (m[2]) return `20${m[2]}-${MES_DE[m[1]]}`
      const candidato = [...new Set(todosOsTurnos.map((t) => t.data.slice(0, 7)))].find((x) => x.slice(5) === MES_DE[m[1]])
      return candidato ?? null
    }
    const nomesNaTela = new Set()
    for (const tr of tabela.corpo) {
      /*
        ⚠️ A célula do nome pode vir com o selo "saiu" COLADO ("Eduardosaiu") — o badge é um
        elemento irmão e o textContent não põe espaço. Mesma classe do "Adilson19 turnos" do
        confronto do admin. A regra certa não é regex sobre o texto: é casar contra o CADASTRO —
        o nome da tela ou é um nome publicado, ou é um nome publicado + "saiu", ou é furo.
      */
      const cru = tr[0]
      const idDaPessoa = [...nomeDe.entries()].find(([, n]) => cru === n || cru === `${n}saiu` || cru === `${n} saiu`)?.[0]
      const nome = idDaPessoa ? nomeDe.get(idDaPessoa) : cru
      nomesNaTela.add(nome)
      if (!idDaPessoa) { acusar({ o: `🔴 a tabela pública mostra "${cru}" e o cadastro publicado não tem esse nome` }); continue }
      const meu = distTudo.get(idDaPessoa) ?? { total: 0, mes: {} }
      if (Number(tr[1]) !== meu.total) acusar({ o: `🔴 TOTAL público diverge — ${nome}`, tela: tr[1], auditoria: meu.total })
      tabela.cab.slice(2).forEach((rot, i) => {
        const chave = anoDe(rot)
        if (!chave) return
        const valorTela = tr[i + 2] === '-' || tr[i + 2] === '' ? 0 : Number(tr[i + 2])
        const meuValor = meu.mes[chave] ?? 0
        if (valorTela !== meuValor) acusar({ o: `🔴 ${nome} · ${rot} (público)`, tela: valorTela, auditoria: meuValor })
      })
    }
    // E a população: quem tem turno publicado tem de estar na tabela — sumir é o furo mais grave.
    for (const [id, d] of distTudo) {
      if (d.total > 0 && !nomesNaTela.has(nomeDe.get(id) ?? id))
        acusar({ o: `🔴 ${nomeDe.get(id) ?? id} tem ${d.total} turno(s) publicados e NÃO aparece na tabela pública` })
    }
  }

  /*
    ── CONFRONTO 2 · A ÁREA ADMINISTRATIVA — só quando o período NÃO é retroativo ──────────────────
    A aba Gerar recusa data no passado (regra do produto). Quando `--de` já ficou para trás, este
    confronto é IMPOSSÍVEL de fazer honestamente — e isenção calada é buraco, então ela sai NOMEADA
    no relatório em vez de fingir que mediu.
  */
  const hoje = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
  if (DE < hoje) {
    console.log('\n── CONFRONTO 2 · ÁREA ADMINISTRATIVA — PULADO, e declarado ────────────────────────\n')
    console.log(`  o período começa em ${DE} e hoje é ${hoje}: a tela recusa geração retroativa (regra do produto).`)
    console.log('  O distanciamento por pessoa foi recontado acima só por esta régua, sem confronto de tela.')
  } else {
  console.log('\n── CONFRONTO 2 · ÁREA ADMINISTRATIVA (distanciamento e distribuição) ──────────────\n')
  await p.goto(SITE + '#/admin', { waitUntil: 'networkidle', timeout: 60_000 })
  await p.waitForTimeout(1500)
  await p.getByRole('button', { name: /Entrar agora/i }).first().click()
  await p.waitForTimeout(1500)
  await p.getByRole('button', { name: /^Gerar escala/i }).first().click()
  await p.waitForTimeout(800)
  const campos = p.locator('input[type=date]')
  await campos.nth(0).fill(DE)
  await campos.nth(1).fill(ATE)
  await p.waitForTimeout(500)
  await p.getByRole('button', { name: /^Gerar escala$/ }).last().click()
  await p.getByText(/Piso alcançado|não foi possível cobrir/i).first().waitFor({ timeout: 90_000 })
  await p.waitForTimeout(900)

  /** Lê "Nome  N turnos · mín. M dias" do cartão de distanciamento. */
  const naTela = await p.evaluate(() => {
    const achar = (titulo) => [...document.querySelectorAll('section')]
      .find((s) => s.querySelector('h2')?.textContent?.trim() === titulo)
    const dist = achar('Distanciamento por pessoa')
    const distribuicao = achar('Distribuição de turnos')
    const linhasDist = dist
      ? [...dist.querySelectorAll('div')].filter((d) => d.children.length === 2 && /turnos · mín\./.test(d.textContent))
          .map((d) => d.textContent.replace(/\s+/g, ' ').trim())
      : []
    const linhasTab = distribuicao
      ? [...distribuicao.querySelectorAll('tbody tr')].map((tr) =>
          [...tr.querySelectorAll('td')].map((td) => td.textContent.replace(/\s+/g, ' ').trim()))
      : []
    const cabecalho = distribuicao
      ? [...distribuicao.querySelectorAll('thead th')].map((th) => th.textContent.trim())
      : []
    return { linhasDist, linhasTab, cabecalho, equilibrio: distribuicao?.textContent?.match(/Quem pegou menos.*?turnos?\./s)?.[0] ?? '' }
  })

  console.log(`  linhas lidas de "Distanciamento por pessoa" .. ${naTela.linhasDist.length}`)
  console.log(`  linhas lidas de "Distribuição de turnos" ..... ${naTela.linhasTab.length}`)
  if (naTela.linhasDist.length === 0 || naTela.linhasTab.length === 0) {
    acusar({ o: '🔴 não consegui ler um dos cartões na tela — o confronto ficaria vazio, e vazio não é acordo' })
  }

  // ── distanciamento: "Nome N turnos · mín. M dias"
  for (const linha of naTela.linhasDist) {
    /*
      ⚠️ SEM `\s+` ENTRE O NOME E O NÚMERO. Os dois `<span>` são irmãos e o `textContent` os cola:
      vem "Adilson19 turnos · mín. 7 dias", sem espaço. A primeira versão exigia o espaço e acusou
      **as 14 linhas** como divergentes — com os números batendo em todas.

      Vale registrar porque é a classe de defeito mais cara que um auditor pode ter: **ele acusou o
      auditado por um erro dele mesmo.** Quatorze acusações falsas custam mais que nenhuma medição,
      porque quem lê passa a desconfiar do relatório inteiro — inclusive das partes certas.
    */
    const m = linha.match(/^(.*?)\s*(\d+) turnos · mín\. (\d+|-) dias$/)
    if (!m) { acusar({ o: `não entendi a linha do cartão: "${linha}"` }); continue }
    const [, nome, totalTela, minTela] = m
    const meu = linhas.find((l) => l.nome === nome.trim())
    if (!meu) { acusar({ o: `🔴 a tela mostra "${nome}" e a auditoria não tem essa pessoa no período` }); continue }
    if (Number(totalTela) !== meu.total) {
      acusar({ o: `🔴 TOTAL diverge — ${nome}`, tela: totalTela, auditoria: meu.total })
    }
    // ⚠️ O cartão da tela conta a fronteira com o bloco anterior; a auditoria olha só o período.
    // Divergir para MENOS na tela é legítimo (a escala anterior aproxima); para MAIS, não.
    const meuMin = meu.menor
    if (minTela !== '-' && meuMin != null && Number(minTela) > meuMin) {
      acusar({ o: `🔴 MÍNIMO da tela é MAIOR que o medido — ${nome}`, tela: minTela, auditoria: meuMin })
    }
  }

  // ── distribuição: primeira coluna nome, segunda total, depois tipos e meses
  for (const tr of naTela.linhasTab) {
    const nome = tr[0].replace(/\s*saiu\s*$/, '').trim()
    const meu = linhas.find((l) => l.nome === nome)
    if (!meu) { acusar({ o: `🔴 a tabela mostra "${nome}" e a auditoria não tem essa pessoa` }); continue }
    if (Number(tr[1]) !== meu.total) acusar({ o: `🔴 TOTAL na tabela diverge — ${nome}`, tela: tr[1], auditoria: meu.total })
    // As colunas seguem o cabeçalho: [pessoa, Total, ...tipos, ...meses]
    const colunas = naTela.cabecalho.slice(2)
    colunas.forEach((rot, i) => {
      const valorTela = tr[i + 2] === '-' ? 0 : Number(tr[i + 2])
      const tipo = { 'Manhã': 'MANHA', 'Tarde': 'TARDE', 'Noite': 'NOITE' }[rot]
      const mes = meses.find((m) => ROTULO_MES[+m.slice(5, 7) - 1] === rot)
      const meuValor = tipo ? meu.tipo[tipo] : mes ? (meu.mes[mes] ?? 0) : null
      if (meuValor == null) { acusar({ o: `coluna "${rot}" não reconhecida` }); return }
      if (valorTela !== meuValor) acusar({ o: `🔴 ${nome} · coluna ${rot}`, tela: valorTela, auditoria: meuValor })
    })
  }
  console.log(`  equilíbrio na tela .......... ${naTela.equilibrio || '(não encontrado)'}`)
  console.log(`  equilíbrio na auditoria ..... menor ${menorTotal}, maior ${maiorTotal}, diferença ${maiorTotal - menorTotal}`)
  if (naTela.equilibrio) {
    const nums = naTela.equilibrio.match(/\d+/g)?.map(Number) ?? []
    if (nums[0] !== menorTotal || nums[1] !== maiorTotal) {
      acusar({ o: '🔴 a linha de equilíbrio da tela diverge', tela: nums.join('/'), auditoria: `${menorTotal}/${maiorTotal}` })
    }
  }
  } // fim do confronto 2 (condicional ao período não ser retroativo)
} finally {
  await nav.close()
}

console.log('\n────────────────────────────────────────────────────────────────────────────────────')
if (achados.length === 0) {
  console.log(`\n✅ NENHUMA DIVERGÊNCIA. A segunda contagem, escrita sem uma linha de \`src/\`, chegou aos`)
  console.log(`   mesmos números que a tela mostra — pessoa a pessoa, mês a mês, tipo a tipo.`)
  process.exit(0)
}
console.log(`\n🔴 ${achados.length} DIVERGÊNCIA(S):\n`)
for (const a of achados) {
  console.log(`  · ${a.o}`)
  if (a.tela !== undefined) console.log(`      tela: ${a.tela} · auditoria: ${a.auditoria}`)
  if (a.esperado !== undefined) console.log(`      esperado: ${a.esperado} · veio: ${a.veio}`)
}
process.exit(1)
