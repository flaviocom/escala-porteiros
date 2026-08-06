/**
 * COMO OS BLOCOS SE ENCAIXAM QUANDO UMA ESCALA NOVA ENTRA.
 *
 * 🔴 POR QUE ESTE ARQUIVO EXISTE. Esta lógica estava escrita **duas vezes, à mão**: uma no botão
 * Publicar da tela, outra no `gerar-bloco.mjs`. E as duas divergiam — o script pegava `blocos[0]` e
 * montava `[truncado, novo]`, o que **apagaria o bloco do meio** no dia em que houvesse três.
 *
 * Fonte dupla é onde as duas versões divergem em silêncio, e a que erra é sempre a que ninguém está
 * olhando.
 *
 * ── A REGRA, UMA SÓ ──────────────────────────────────────────────────────────────────────────────
 *
 * O bloco novo **manda no período dele, e só nele**. Tudo o que já foi publicado fora desse período
 * continua publicado.
 *
 * Isso significa que um bloco anterior pode ser **partido em dois**: a cabeça (antes do novo) e a
 * cauda (depois do novo). Aparar as duas pontas é permitido; apagar o que sobra, não.
 *
 * 🔴 A CAUDA FOI UM DEFEITO REAL — achado por auditoria externa em 05/08/2026, e ele apagava escala
 * já divulgada. A versão anterior guardava só a cabeça: gerar `01/09 → 31/10` sobre um bloco
 * publicado que ia até 31/12 **apagava novembro e dezembro inteiros** — 73 turnos, medidos no dado
 * real —, e o conferidor **aprovava**, porque contava só o que vinha antes do corte.
 *
 * O cenário não era hipotético: "gerar um período menor para corrigir uma coisa" é o uso mais
 * natural da tela.
 */
import { diferencaEmDias, somarDias, type DataISO } from './datas'
import type { Bloco } from './tipos'

/** O turno cai dentro do intervalo? Inclusive nas duas pontas. */
const dentro = (data: DataISO, inicio: DataISO, fim: DataISO) =>
  diferencaEmDias(inicio, data) >= 0 && diferencaEmDias(data, fim) >= 0

/**
 * Monta a lista de blocos para publicar: os anteriores, aparados onde o novo entra, mais o novo.
 *
 * Um bloco anterior vira **dois** quando o novo cai no meio dele — cabeça e cauda. Pedaço que fica
 * sem nenhum turno some: bloco vazio não descreve nada, e a regra D11 o reprovaria.
 */
export function montarBlocosParaPublicar(anteriores: Bloco[], blocoNovo: Bloco | null): Bloco[] {
  if (!blocoNovo) return anteriores

  const vespera = somarDias(blocoNovo.inicio, -1)
  const diaSeguinte = somarDias(blocoNovo.fim, 1)
  const resultado: Bloco[] = []

  for (const b of anteriores) {
    // A CABEÇA: o que este bloco governa ANTES de o novo começar.
    const cabeca = b.turnos.filter((t) => diferencaEmDias(t.data, blocoNovo.inicio) > 0)
    if (b.inicio < blocoNovo.inicio && cabeca.length > 0) {
      resultado.push({ ...b, fim: b.fim > vespera ? vespera : b.fim, turnos: cabeca })
    }

    // A CAUDA: o que ele governa DEPOIS de o novo terminar. Sem isto, escala publicada some.
    const cauda = b.turnos.filter((t) => diferencaEmDias(blocoNovo.fim, t.data) > 0)
    if (b.fim > blocoNovo.fim && cauda.length > 0) {
      resultado.push({
        ...b,
        id: `${b.id}-cauda`,
        inicio: b.inicio < diaSeguinte ? diaSeguinte : b.inicio,
        turnos: cauda,
      })
    }
  }

  resultado.push(blocoNovo)
  return resultado.sort((a, b) => (a.inicio < b.inicio ? -1 : 1))
}

/**
 * Nenhum turno publicado FORA do período do bloco novo pode desaparecer.
 *
 * 🔴 A versão anterior contava só o que vinha **antes** do corte, e por isso aprovava o
 * desaparecimento da cauda. O conferidor existia para provar que *"o passado não se reescreve"* e
 * provava metade da frase — que é pior que não provar nada, porque dá licença.
 *
 * A pergunta certa: *de tudo que estava publicado e que o bloco novo NÃO cobre, sobrou tudo?*
 */
export function conferirPassadoPreservado(
  anteriores: Bloco[],
  montados: Bloco[],
  blocoNovo: Pick<Bloco, 'inicio' | 'fim'>,
): { antes: number; depois: number; ok: boolean; perdidos: DataISO[] } {
  const foraDoNovo = (bs: Bloco[]) =>
    bs
      .flatMap((b) => b.turnos.filter((t) => dentro(t.data, b.inicio, b.fim)))
      .filter((t) => !dentro(t.data, blocoNovo.inicio, blocoNovo.fim))

  const antes = foraDoNovo(anteriores)
  const depois = foraDoNovo(montados)

  const chave = (t: { data: DataISO; tipo: string }) => `${t.data}|${t.tipo}`
  const sobreviveram = new Set(depois.map(chave))
  const perdidos = [...new Set(antes.filter((t) => !sobreviveram.has(chave(t))).map((t) => t.data))]

  /*
    🔴 `ok` OLHAVA SÓ `perdidos` — quinta auditoria externa, 05/08/2026.

    A chave é `data|tipo` e mora num `Set`, então dois blocos que se sobrepõem podem trazer o MESMO
    turno duas vezes: perder uma das cópias faz `antes` cair sem que nenhuma chave suma, e `perdidos`
    sai vazio com o total menor. O conferidor aprovava uma perda que ele mesmo tinha acabado de
    contar. É o mesmo defeito da cauda, um nível abaixo: medir uma coisa e julgar por outra.

    As duas condições agora precisam valer. `depois > antes` é permitido: o bloco novo pode acrescentar.
  */
  return {
    antes: antes.length,
    depois: depois.length,
    ok: perdidos.length === 0 && depois.length >= antes.length,
    perdidos,
  }
}

/**
 * 🔴 REVERTER TAMBÉM PODE APAGAR ESCALA DIVULGADA — sexta auditoria externa, 05/08/2026.
 *
 * O botão Publicar ganhou guarda em 05/08. `Voltar a esta versão`, na mesma tela, **não tinha
 * nenhum**: chamava `reverterPara` → `publicarDados` direto, sem passar por `validar`, por
 * `conferirPorFora`, por `conferirPassadoPreservado` nem por `conferirEsquema`. O único anteparo era
 * um `confirm()` de texto, e a mensagem de sucesso saía **verde**.
 *
 * E é o caminho de UM CLIQUE: `gravarArquivo` faz um commit por arquivo, então o histórico só
 * oferece "voltar pessoas", "voltar blocos" ou "voltar config" — um de cada vez. Voltar só o elenco
 * deixa a escala nova apontando para ids que sumiram; voltar só a escala reescreve dias que os
 * irmãos já viram.
 *
 * Medido pelo auditor, sobre commits que a tela oferece HOJE:
 *
 *     voltar pessoas.json →  120 incoerências · 120 de 543 nomes sairiam como **id cru** em 70 dias
 *     voltar blocos.json  →   70 turnos com nomes trocados, **1 deles no passado já divulgado**
 *
 * ── A REGRA, E POR QUE ELA TEM DOIS NÍVEIS ──────────────────────────────────────────────────────
 *
 * 🔴 **Passado reescrito BLOQUEIA.** É a primeira regra inviolável deste projeto: o site não pode
 *    desmentir o que as pessoas já viram. Não há caso em que reverter valha isso.
 *
 * ⚠️ **Futuro alterado AVISA, com o número.** Aí é escolha legítima — reverter existe justamente
 *    para desfazer uma escala futura ruim. O que não pode é acontecer sem a pessoa saber quanto.
 */
export interface EfeitoDaReversao {
  /** `false` quando a reversão reescreveria dia já passado, ou deixaria nome sem cadastro. */
  ok: boolean
  /** Turnos do passado que mudariam — se houver algum, a reversão é impedida. */
  passadoReescrito: DataISO[]
  /** Turnos futuros que mudariam. Legítimo, mas precisa ser dito. */
  futuroAlterado: number
  /** Ids citados na escala que não existiriam mais no elenco — a tela mostraria o id cru. */
  nomesQueSumiriam: string[]
  /** Uma frase por consequência, pronta para a tela. */
  avisos: string[]
}

export function conferirReversao(
  arquivo: string,
  conteudo: unknown,
  atual: { blocos: Bloco[]; pessoas: { id: string; nome: string }[] },
  hoje: DataISO,
): EfeitoDaReversao {
  const passadoReescrito: DataISO[] = []
  const nomesQueSumiriam: string[] = []
  const avisos: string[] = []
  let futuroAlterado = 0

  const chave = (t: { data: DataISO; tipo: string }) => `${t.data}|${t.tipo}`
  const turnosDe = (bs: Bloco[]) => {
    const m = new Map<string, string[]>()
    for (const b of bs) for (const t of b.turnos) if (dentro(t.data, b.inicio, b.fim)) m.set(chave(t), t.pessoas)
    return m
  }

  if (arquivo === 'blocos.json') {
    const novos = (conteudo as { blocos?: Bloco[] })?.blocos
    if (!Array.isArray(novos)) {
      return { ok: false, passadoReescrito: [], futuroAlterado: 0, nomesQueSumiriam: [], avisos: ['O arquivo dessa versão não tem uma lista de blocos que dê para ler.'] }
    }
    const antes = turnosDe(atual.blocos)
    const depois = turnosDe(novos)
    // Percorre a UNIÃO: um turno que some é tão mudança quanto um turno que troca de gente.
    for (const k of new Set([...antes.keys(), ...depois.keys()])) {
      const a = antes.get(k)
      const d = depois.get(k)
      if (JSON.stringify(a ?? null) === JSON.stringify(d ?? null)) continue
      const data = k.split('|')[0] as DataISO
      if (diferencaEmDias(data, hoje) >= 0) passadoReescrito.push(data)
      else futuroAlterado++
    }
    const noElenco = new Set(atual.pessoas.map((p) => p.id))
    for (const ids of depois.values()) for (const id of ids) if (!noElenco.has(id) && !nomesQueSumiriam.includes(id)) nomesQueSumiriam.push(id)
  }

  if (arquivo === 'pessoas.json') {
    const novas = (conteudo as { pessoas?: { id: string; nome: string }[] })?.pessoas
    if (!Array.isArray(novas)) {
      return { ok: false, passadoReescrito: [], futuroAlterado: 0, nomesQueSumiriam: [], avisos: ['O arquivo dessa versão não tem uma lista de pessoas que dê para ler.'] }
    }
    const noElenco = new Set(novas.map((p) => p.id))
    // A escala NÃO muda, mas passa a citar gente que o elenco revertido não tem mais.
    for (const b of atual.blocos) for (const t of b.turnos) for (const id of t.pessoas)
      if (!noElenco.has(id) && !nomesQueSumiriam.includes(id)) nomesQueSumiriam.push(id)
  }

  const unicos = [...new Set(passadoReescrito)].sort()
  if (unicos.length)
    avisos.push(`Reescreveria ${unicos.length} dia(s) que JÁ PASSARAM — a partir de ${unicos[0]}. O site passaria a desmentir o que as pessoas já viram.`)
  if (nomesQueSumiriam.length)
    avisos.push(`${nomesQueSumiriam.length} pessoa(s) escalada(s) deixariam de existir no elenco — a tela mostraria o código no lugar do nome (ex.: "${nomesQueSumiriam[0]}").`)
  if (futuroAlterado)
    avisos.push(`${futuroAlterado} turno(s) FUTUROS mudariam de gente. Isso é o que reverter faz — só confira se é o que você quer.`)

  return { ok: unicos.length === 0 && nomesQueSumiriam.length === 0, passadoReescrito: unicos, futuroAlterado, nomesQueSumiriam, avisos }
}

/**
 * 🔴 AS DUAS TRAVAS QUE VIVIAM SÓ NA TELA — sexta auditoria externa, 05/08/2026.
 *
 * O auditor desligou cada uma com um mutante e rodou os **20 passos do gate**: `EXIT=0` nas duas.
 * Não por descuido dos portões — por fronteira: `vite.config.ts` restringe o vitest a
 * `src/**` + `.test.ts`, **não há um único teste de componente**, e nenhum passo do gate executa uma
 * linha de `Admin.tsx`. O gate cobre o domínio até o osso e não toca na camada onde o Flavio clica.
 *
 *     mutante `if (false && diferencaEmDias(de, hojeSaoPaulo()) > 0)`  → gate EXIT=0
 *     mutante `const impedido = (relatorio ? !relatorio.aprovada : false)` → gate EXIT=0
 *
 * A segunda é literalmente o defeito dos 73 turnos apagados, com o conserto de volta ao ponto de
 * partida e o portão verde ao lado.
 *
 * A correção não é escrever teste de componente: é **tirar a decisão da tela**. Regra que decide se
 * publica ou não é domínio — a tela só pergunta e pinta. Aqui elas ficam, com teste, e a tela passa a
 * ter uma linha em vez de uma condição.
 */
export function travaDeDataRetroativa(de: DataISO, hoje: DataISO): string | null {
  if (diferencaEmDias(de, hoje) <= 0) return null
  return (
    `A data inicial (${de}) é anterior a hoje (${hoje}).` +
    ' Gerar para trás reescreveria turnos que já foram vistos — e o passado divulgado não se' +
    ' reescreve. Escolha hoje ou uma data à frente.'
  )
}

/** Publicar está impedido? Uma resposta só, para a tela não recompor o julgamento. */
export function publicacaoImpedida(
  relatorio: { aprovada: boolean } | null,
  perda: { ok: boolean } | null,
): boolean {
  if (relatorio && !relatorio.aprovada) return true
  if (perda && !perda.ok) return true
  return false
}

/**
 * 🔴 GERAR POR CIMA DE ESCALA JÁ DIVULGADA — achado ao responder uma pergunta do Flavio, 05/08/2026.
 *
 * Ele perguntou se a geração olha para trás na fronteira. Olha, e o piso vale atravessando. Mas ao
 * medir isso apareceu o vão ao lado: **começar DENTRO do período já publicado não é impedido por
 * nada, e não avisa.**
 *
 *     gerar de 15/12 (o publicado vai até 30/12)
 *       trava de data retroativa ..... NÃO impede — 15/12 ainda é futuro
 *       conferirPassadoPreservado .... NÃO impede — nada se PERDE, é substituído
 *       turnos já publicados que mudam de gente: 6
 *         23/12 NOITE: [luiz_cezar, luiz_felipe, marcos] → [thiago, luiz_cezar, luiz_felipe]
 *
 * É o defeito de 05/08 pela manhã — *"você já alterou o Williams por Isaac hoje, sem eu sequer ter
 * solicitado"*, 87 turnos divergindo do que os irmãos tinham o link para ver — voltando por outra
 * porta. As duas travas existentes olhavam para as perguntas erradas: uma pergunta se a data já
 * PASSOU, a outra se algum turno SUMIU. Nenhuma pergunta se um turno **mudou de gente**.
 *
 * ── POR QUE AVISA EM VEZ DE IMPEDIR ──────────────────────────────────────────────────────────────
 *
 * Regerar um período futuro já publicado é uso legítimo: alguém saiu do elenco, entraram férias, a
 * malha mudou. O que não pode é acontecer **sem ele saber quantos** — porque o site passa a
 * desmentir o que já está no ar, e quem percebe é o irmão que combinou o domingo com a família.
 *
 * ⚠️ Turno que já ACONTECEU continua impedido, e por outra trava: `travaDeDataRetroativa`.
 */
export interface EscalaJaDivulgada {
  /** Turnos publicados que o bloco novo cobre e que mudariam de gente. */
  reescritos: number
  /** Os dias afetados, em ordem. */
  dias: DataISO[]
  /** Poucos exemplos, com os nomes dos dois lados — cem iguais não informam mais que três. */
  exemplos: { data: DataISO; tipo: string; antes: string[]; depois: string[] }[]
}

export function conferirEscalaJaDivulgada(publicados: Bloco[], blocoNovo: Bloco | null): EscalaJaDivulgada {
  const vazio: EscalaJaDivulgada = { reescritos: 0, dias: [], exemplos: [] }
  if (!blocoNovo) return vazio

  const antes = new Map<string, string[]>()
  for (const b of publicados)
    for (const t of b.turnos)
      if (dentro(t.data, b.inicio, b.fim)) antes.set(`${t.data}|${t.tipo}`, t.pessoas)

  const dias = new Set<DataISO>()
  const exemplos: EscalaJaDivulgada['exemplos'] = []
  let reescritos = 0

  for (const t of blocoNovo.turnos) {
    const anterior = antes.get(`${t.data}|${t.tipo}`)
    if (!anterior) continue // dia novo, não havia nada publicado ali
    // A ORDEM não conta: os mesmos três nomes em outra ordem é a mesma escala para quem lê.
    if (JSON.stringify([...anterior].sort()) === JSON.stringify([...t.pessoas].sort())) continue
    reescritos++
    dias.add(t.data)
    if (exemplos.length < 3) exemplos.push({ data: t.data, tipo: t.tipo, antes: anterior, depois: t.pessoas })
  }

  return { reescritos, dias: [...dias].sort(), exemplos }
}

/**
 * 🔴 A FRONTEIRA DA COTA MENSAL — sétima auditoria externa, 05/08/2026.
 *
 * Irmã de `ultimaEscalaAnterior`, que fecha a fronteira do ESPAÇAMENTO desde 04/08. A do **teto
 * mensal** nunca existiu: o contador nascia zerado a cada geração, e um bloco que começa no meio do
 * mês não enxergava as escalas daquele mês que já estavam publicadas.
 *
 * Medido no dado que está NO AR: **Williams, teto de 3, com 5 escalas em agosto de 2026** — três no
 * bloco congelado (01, 02 e 05/08) e duas no bloco novo (15 e 26/08). Cada bloco, isolado, dentro do
 * teto; o mês que o irmão vive, estourado. E as DUAS réguas aprovaram, porque as duas julgam um
 * bloco por vez — o maker–checker dá conforto falso quando os dois olham pela mesma janela.
 *
 * Fica aqui, no domínio, e não em três lugares: a tela, a validação e o gerador precisam do MESMO
 * número, e foi fonte dupla que produziu metade dos defeitos deste projeto.
 */
export function cotaMensalJaPublicada(publicados: Bloco[], inicioDoNovo: DataISO): Record<string, Record<string, number>> {
  const fora: Record<string, Record<string, number>> = {}
  for (const b of publicados) {
    for (const t of b.turnos) {
      // Só o que o bloco realmente governa, e só o que vem ANTES do bloco novo: o que ele cobre
      // será reescrito, e contar duas vezes inventaria um estouro que não existe.
      if (!dentro(t.data, b.inicio, b.fim)) continue
      if (diferencaEmDias(t.data, inicioDoNovo) <= 0) continue
      const mes = t.data.slice(0, 7)
      for (const id of t.pessoas) {
        fora[id] ??= {}
        fora[id][mes] = (fora[id][mes] ?? 0) + 1
      }
    }
  }
  return fora
}

/**
 * 🔴 O BURACO — publicar deixando dias de culto sem ninguém, e nada avisava.
 *
 * Sétima auditoria externa, 05/08/2026, no gesto que o próprio dono descreveu: *"quando eu tiver a
 * data, eu gero a partir de onde nós paramos"*. Ele gera 31/12→31/03, **não publica**, muda o "De"
 * para 01/04 e gera de novo. A escala do primeiro período some da sessão sem uma palavra — e o
 * Publicar aceita.
 *
 * Medido no arquivo que iria ao ar:
 *
 *     blocos: 01/03→05/08 · 06/08→31/12 · 01/04→30/06
 *     maior vão: 30/12/2026 → 03/04/2027 = 93 dias, com 39 dias de culto sem NINGUÉM
 *
 * E o site responde, para quem filtra janeiro: *"Nenhum turno encontrado — tente ajustar os filtros"*.
 * A culpa parece do filtro do irmão.
 *
 * ⚠️ **Por que `conferirPassadoPreservado` não pega:** ele mede DESAPARECIMENTO, e nada desapareceu —
 * janeiro a março nunca chegou a existir no arquivo. São duas perguntas diferentes, e só uma tinha
 * guarda. Esta pergunta é: **o que vai ao ar cobre todos os dias de culto entre o primeiro e o
 * último?**
 *
 * Compara com a MALHA de cada bloco vizinho, que é quem sabe quais dias teriam culto no vão.
 */
export interface BuracoNaEscala {
  /** Dias de culto sem nenhum turno, entre o primeiro e o último dia publicado. */
  dias: DataISO[]
  /** O maior vão contínuo, em dias de calendário — o número que dói. */
  maiorVao: number
  ok: boolean
}

export function conferirBuracoNaEscala(
  blocos: Bloco[],
  diaTemCulto: (data: DataISO, malha: Bloco['malha']) => boolean,
): BuracoNaEscala {
  const comTurno = new Set<DataISO>()
  for (const b of blocos) for (const t of b.turnos) if (dentro(t.data, b.inicio, b.fim)) comTurno.add(t.data)
  if (comTurno.size === 0) return { dias: [], maiorVao: 0, ok: true }

  const todas = [...comTurno].sort()
  const primeiro = todas[0]
  const ultimo = todas[todas.length - 1]

  /** A malha vigente num dia: a do bloco que o cobre; no vão, a do bloco anterior mais próximo. */
  const malhaEm = (d: DataISO): Bloco['malha'] | null => {
    const cobre = blocos.find((b) => dentro(d, b.inicio, b.fim))
    if (cobre) return cobre.malha
    const anteriores = blocos.filter((b) => b.fim < d).sort((a, b) => (a.fim < b.fim ? 1 : -1))
    return anteriores[0]?.malha ?? blocos[0]?.malha ?? null
  }

  const dias: DataISO[] = []
  let vao = 0
  let maiorVao = 0
  for (let d = primeiro; d <= ultimo; d = somarDias(d, 1)) {
    if (comTurno.has(d)) { vao = 0; continue }
    vao++
    if (vao > maiorVao) maiorVao = vao
    const m = malhaEm(d)
    if (m && diaTemCulto(d, m)) dias.push(d)
  }
  return { dias, maiorVao, ok: dias.length === 0 }
}

/**
 * O piso REALMENTE ENTREGUE — o menor intervalo, em dias, entre dois turnos da mesma pessoa.
 *
 * 🔴 POR QUE ISTO EXISTE, e por que NÃO substitui `pisoAlcancado`. Sétima auditoria, medido em 20
 * combinações de período e semente: em 1 delas o bloco registrava **piso 5** e a escala entregava
 * **6**. O número nunca exagera — ele subestima —, mas continua sendo um número na tela que não
 * descreve a escala que está embaixo dele.
 *
 * A causa é do desenho, e o desenho está certo: o gerador desce o piso EXIGIDO até um em que
 * consegue cobrir todos os turnos, e grava esse. A escala resultante pode, por sorte da distribuição,
 * fazer melhor do que a exigência.
 *
 * **`pisoAlcancado` continua sendo a EXIGÊNCIA**, e não pode virar a medição: é ele que entra de
 * volta no gerador quando alguém refaz o bloco (portão `refazer`), e é ele que a D10 usa para
 * reprovar. Trocar o significado quebraria a reprodutibilidade de tudo o que já foi publicado.
 *
 * Então a medição vive aqui, **derivada** — nada é gravado, nada migra — e a tela mostra as duas
 * quando diferem: *"piso 5 (entregue: 6)"*.
 */
export function pisoEntregue(turnos: { data: DataISO; pessoas: string[] }[]): number | null {
  const ultima: Record<string, DataISO> = {}
  let menor = Infinity
  // Os turnos vêm ordenados por data, mas ordenar de novo custa nada e tira a dependência disso.
  for (const t of [...turnos].sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0))) {
    for (const id of t.pessoas) {
      if (ultima[id]) menor = Math.min(menor, Math.abs(diferencaEmDias(ultima[id], t.data)))
      ultima[id] = t.data
    }
  }
  // Ninguém escalado duas vezes: não há intervalo para medir, e inventar um seria pior.
  return Number.isFinite(menor) ? menor : null
}
