/**
 * O GERADOR — distribui as pessoas pelos turnos.
 *
 * 🔴 A DECISÃO QUE DEFINE ESTE ARQUIVO: o piso de distanciamento **não é cravado**.
 *
 * O Flavio foi explícito em 04/08/2026: *"não posso fixar um número mínimo de dias, porque senão eu
 * posso (…) não conseguir atender a escala. (…) Cada irmão deve estar o mais distante possível da
 * sua última escala. (…) E quando não tiver a possibilidade de gerar a escala, você vai me dizer que
 * não foi possível."*
 *
 * Então o piso é **descoberto**: calcula-se o maior espaçamento teoricamente possível, tenta-se com
 * ele, e desce-se de um em um até caber. O número final não foi escolhido por ninguém, e ele é
 * **informado**, junto com os que foram tentados e não deram.
 *
 * ⚠️ O QUE ESSE NÚMERO *NÃO* É — precisão exigida por auditoria independente em 04/08/2026.
 *
 * Cada piso é tentado **uma vez**, com escolha gulosa em ordem cronológica: no primeiro turno sem
 * gente suficiente, aquele piso é descartado inteiro. **Não há retrocesso.** Logo o piso alcançado é
 * *o maior que esta busca conseguiu*, não *o maior que existe* — o algoritmo não tem como distinguir
 * "impossível de verdade" de "esta sequência de escolhas travou".
 *
 * Na escala de 05/08 → 30/12 isso foi medido: o piso 7 falha em 03/10/2026 (sábado com Ensaio +
 * Noite, 6 vagas no mesmo dia) porque 9 das 16 pessoas estavam a 3–6 dias por escolhas feitas em
 * 20/09, 27/09 e 30/09. Inverter o desempate daquele dia **não** destravou — evidência de que 6 está
 * perto do limite real ali. Evidência, não prova.
 *
 * Dizer "o maior possível" seria afirmar mais do que o código sustenta. Se um dia a folga apertar,
 * cabe trocar a busca gulosa por uma com retrocesso — e aí, sim, o número passa a ser um máximo.
 *
 * Se não couber nem com piso 1, o gerador **declara que não foi possível** e diz onde travou. Nunca
 * entrega uma escala pela metade em silêncio.
 *
 * O que ele NÃO faz: escolher sozinho entre duas escalas válidas. Isso é do Flavio, na tela de
 * conferência.
 */
import { diferencaEmDias, formatarBR, hojeSaoPaulo, mesDe, type DataISO } from './datas'
import { podeAssumir } from './regras'
import type { Bloco, Malha, Pessoa, Turno } from './tipos'
import { ROTULO_TURNO } from './tipos'

export interface OpcoesGeracao {
  inicio: DataISO
  fim: DataISO
  grade: Turno[]
  pessoas: Pessoa[]
  /** IDs no elenco deste bloco. Quem não está aqui não é escalado. */
  elenco: string[]
  malha: Malha
  /** Última data de cada pessoa no bloco ANTERIOR — a fronteira do ESPAÇAMENTO. */
  ultimaEscalaAnterior?: Record<string, DataISO>
  /**
   * 🔴 A FRONTEIRA DA COTA — e ela não existia. Sétima auditoria externa, 05/08/2026.
   *
   * `ultimaEscalaAnterior` fechou a fronteira do **espaçamento** em 04/08. Ninguém perguntou pela
   * fronteira do **teto mensal**: o contador `porMes` nascia vazio a cada geração, então um bloco que
   * começa no meio do mês não enxergava as escalas daquele mês que já estavam publicadas.
   *
   * Medido no dado que está NO AR: **Williams tem teto de 3 e aparece 5 vezes em agosto de 2026** —
   * três no bloco congelado (01, 02 e 05/08) e duas no bloco novo (15 e 26/08). Cada bloco, isolado,
   * está dentro do teto; o mês que o irmão vive, não.
   *
   * `{ id → "AAAA-MM" → quantas vezes JÁ está escalado nesse mês }`, contado sobre o que já foi
   * publicado antes do início deste bloco.
   */
  escalasPorMesAnterior?: Record<string, Record<string, number>>
  /** Teto de piso a tentar. Ausente = calculado a partir da folga da escala. */
  pisoMaximo?: number
  /**
   * Tamanho da lista restrita de candidatos (GRASP). Ausente ou 1 = guloso puro, como sempre foi.
   * Ver `docs/superpowers/specs/PESQUISA_2026-08-05-gerar-n-versoes.md`.
   */
  candidatos?: number
  /**
   * Semente do sorteio. **Sem ela não há sorteio nenhum** — a escala volta a ser a gulosa.
   * Com ela, mesma entrada + mesma semente = mesma escala, byte a byte.
   */
  semente?: number
}

export interface Sucesso {
  ok: true
  bloco: Bloco
  pisoAlcancado: number
  pisosTentados: number[]
  relato: string
}

export interface Falha {
  ok: false
  motivo: string
  /** Onde travou: o primeiro turno que não conseguiu ser preenchido nem com piso 1. */
  turnoQueTravou?: { data: DataISO; tipo: string; faltaram: number }
  candidatosBarrados: { pessoa: string; motivo: string }[]
  pisosTentados: number[]
}

export type Resultado = Sucesso | Falha

// ---------------------------------------------------------------------------

/**
 * Maior piso que vale a pena tentar.
 *
 * A conta é a folga da escala: se há V vagas para N pessoas em D dias, cada pessoa pega V/N escalas,
 * o que dá um intervalo médio de D·N/V dias. Não adianta tentar um piso acima da média — ele é
 * impossível por aritmética, e cada tentativa custa uma passada inteira.
 */
export function pisoTeorico(grade: Turno[], qtdPessoas: number, inicio: DataISO, fim: DataISO): number {
  const vagas = grade.filter((t) => !t.santaCeia).reduce((s, t) => s + t.capacidade, 0)
  if (vagas === 0 || qtdPessoas === 0) return 1
  const dias = diferencaEmDias(inicio, fim) + 1
  const escalasPorPessoa = vagas / qtdPessoas
  if (escalasPorPessoa <= 1) return dias
  return Math.max(1, Math.floor(dias / escalasPorPessoa))
}

interface Estado {
  /** Datas em que cada pessoa já foi escalada, em ordem. */
  datas: Map<string, DataISO[]>
  /** Contagem por pessoa e mês, para o teto. */
  porMes: Map<string, number>
}

/**
 * ⚖️ VARIEDADE DE COMPANHIA: medida, não perseguida — e isto é decisão declarada.
 *
 * Até 04/08/2026 havia aqui um `formacoes: Map<string, number>` com o comentário *"formações já
 * usadas, para variar a companhia"*. Ele era inicializado e **gravado a cada turno — e nunca lido**.
 * O desempate de quem entra (adiante, em `tentarComPiso`) olha total de turnos, distância desde a
 * última escala e teto mensal; nunca consultou as formações. Estado morto sob um comentário que
 * prometia um recurso: quem lesse o código — pessoa ou assistente — concluiria que existe controle
 * de variedade, e não existe. Uma auditoria independente o encontrou.
 *
 * Removido em vez de ligado, de propósito: ligar mudaria a escala já publicada, e escala publicada
 * não se reescreve por conta própria. A regra **Q4 mede** a repetição de formações e avisa (hoje:
 * 7 trios repetidos 3+ vezes) — o número aparece na aba Validação. Se um dia isso passar a incomodar,
 * é item de backlog com nova geração e nova publicação, não um efeito colateral silencioso.
 */

const chaveMes = (id: string, data: DataISO) => `${id}|${mesDe(data)}`

function ultimaData(est: Estado, id: string): DataISO | undefined {
  const d = est.datas.get(id)
  return d?.length ? d[d.length - 1] : undefined
}

/**
 * Gerador de números pseudoaleatórios semeado — 32 bits, `mulberry32`.
 *
 * `Math.random()` NÃO serve aqui: não aceita semente, então a escala deixaria de ser reproduzível
 * e a promessa de conferência cairia junto. Este cabe em cinco linhas, é determinístico por
 * construção, e não traz dependência nova para um problema deste tamanho.
 */
function sorteioSemeado(semente: number): () => number {
  let a = semente >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Uma passada com um piso FIXO. Devolve os turnos preenchidos, ou o primeiro que travou.
 *
 * ⚠️ Este comentário dizia *"sem sorteio"* até 05/08/2026, e passou a mentir quando o GRASP entrou.
 * A promessa correta hoje: **mesma entrada e mesma semente dão a mesma escala, byte a byte**. Sem
 * semente, não há sorteio nenhum e o comportamento é o guloso de sempre. O que a promessa protegia —
 * uma escala que se possa conferir e reproduzir — continua de pé.
 */
function tentarComPiso(
  op: OpcoesGeracao,
  piso: number,
): { ok: true; turnos: Turno[] } | { ok: false; turno: Turno; faltaram: number; barrados: { pessoa: string; motivo: string }[] } {
  // Uma semente por PISO, derivada da semente do bloco: assim tentar 9, 8, 7… não repete a
  // mesma sequência de sorteios em cada tentativa, o que enviesaria todas para o mesmo lado.
  const sorteio = op.semente != null ? sorteioSemeado(op.semente + piso * 7919) : null
  const noElenco = new Set(op.elenco)
  const candidatas = op.pessoas.filter((p) => p.ativo && noElenco.has(p.id))

  const est: Estado = { datas: new Map(), porMes: new Map() }
  for (const p of candidatas) est.datas.set(p.id, [])

  // A fronteira com o bloco anterior: quem trabalhou em 30/08 não pode cair em 01/09.
  for (const [id, data] of Object.entries(op.ultimaEscalaAnterior ?? {})) {
    if (est.datas.has(id)) est.datas.set(id, [data])
  }

  /*
    🔴 E A COTA DO MÊS TAMBÉM ATRAVESSA. Ver `escalasPorMesAnterior` para a medição que expôs isto:
    o contador nascia zerado, e quem já tinha 3 escalas em agosto num bloco publicado entrava no
    bloco novo como se tivesse zero.
  */
  for (const [id, meses] of Object.entries(op.escalasPorMesAnterior ?? {})) {
    if (!est.datas.has(id)) continue
    for (const [m, n] of Object.entries(meses)) est.porMes.set(`${id}|${m}`, n)
  }

  const turnos = op.grade.map((t) => ({ ...t, pessoas: [] as string[] }))

  for (const turno of turnos) {
    if (turno.santaCeia || turno.capacidade === 0) continue

    const noDia = new Set(
      turnos.filter((t) => t.data === turno.data).flatMap((t) => t.pessoas),
    )

    const barrados: { pessoa: string; motivo: string }[] = []
    const elegiveis = candidatas.filter((p) => {
      const r = podeAssumir(p, turno, noDia.has(p.id), est.porMes.get(chaveMes(p.id, turno.data)) ?? 0)
      if (!r.pode) {
        barrados.push({ pessoa: p.nome, motivo: r.motivo ?? 'restrição' })
        return false
      }
      const ultima = ultimaData(est, p.id)
      if (ultima) {
        const gap = diferencaEmDias(ultima, turno.data)
        if (gap < piso) {
          barrados.push({ pessoa: p.nome, motivo: `${gap} dia(s) desde ${formatarBR(ultima)}, abaixo do piso ${piso}` })
          return false
        }
      }
      return true
    })

    if (elegiveis.length < turno.capacidade) {
      return { ok: false, turno, faltaram: turno.capacidade - elegiveis.length, barrados }
    }

    // Ordem de preferência, e cada critério existe por um motivo:
    //  1. quem pegou MENOS turnos até aqui        → equilíbrio de carga
    //  2. quem está há MAIS tempo sem escalar     → maximiza o distanciamento
    //  3. quem tem teto mensal e está atrasado    → a cota precisa caber no mês
    //  4. o id, para desempate estável            → mesma entrada, mesma escala
    const escolhidas = [...elegiveis]
      .sort((a, b) => {
        const totalA = est.datas.get(a.id)!.length
        const totalB = est.datas.get(b.id)!.length
        if (totalA !== totalB) return totalA - totalB

        const ua = ultimaData(est, a.id)
        const ub = ultimaData(est, b.id)
        const gapA = ua ? diferencaEmDias(ua, turno.data) : 9999
        const gapB = ub ? diferencaEmDias(ub, turno.data) : 9999
        if (gapA !== gapB) return gapB - gapA

        const faltaA = a.restricoes.tetoMensal != null
          ? a.restricoes.tetoMensal - (est.porMes.get(chaveMes(a.id, turno.data)) ?? 0)
          : 0
        const faltaB = b.restricoes.tetoMensal != null
          ? b.restricoes.tetoMensal - (est.porMes.get(chaveMes(b.id, turno.data)) ?? 0)
          : 0
        if (faltaA !== faltaB) return faltaB - faltaA

        return a.id < b.id ? -1 : 1
      })

    /**
     * 🔴 GRASP — a lista restrita de candidatos, e por que ela não quebra o determinismo.
     *
     * Decisão registrada em `docs/superpowers/specs/PESQUISA_2026-08-05-gerar-n-versoes.md`.
     *
     * O Flavio pediu que o sistema gerasse várias versões e escolhesse a melhor. A armadilha: este
     * algoritmo é **determinístico**, então rodá-lo N vezes com a mesma entrada devolve N cópias
     * idênticas — "três versões" seriam a mesma escala três vezes.
     *
     * A técnica que resolve isso chama-se GRASP: em vez de pegar sempre o topo da ordenação, monta-se
     * uma lista com os `k` melhores e sorteia-se **dentro dela**. A heurística continua mandando —
     * quem está há mais tempo sem servir segue favorecido —, mas caminhos que o guloso puro nunca
     * visitava passam a existir.
     *
     * ⚠️ E o determinismo, que `gerador.ts` prometia com todas as letras? Continua de pé, mais forte:
     * o sorteio é **semeado**. Mesma entrada **e mesma semente** dão a mesma escala byte a byte, e a
     * semente fica gravada no bloco. A promessa deixa de ser *"não há sorteio"* e passa a ser
     * *"não há sorteio irreproduzível"* — antes havia um caminho só; agora há muitos, cada um com
     * endereço.
     *
     * Com `k = 1` (o padrão quando não há semente), isto é exatamente o guloso de antes.
     */
    const k = Math.max(1, Math.min(op.candidatos ?? 1, escolhidas.length))
    const escolhidasFinal: Pessoa[] = []
    const restantes = [...escolhidas]
    while (escolhidasFinal.length < turno.capacidade && restantes.length > 0) {
      // A lista restrita só existe entre os que ainda não foram escolhidos para ESTE turno.
      const lista = restantes.slice(0, k)
      const i = lista.length > 1 && sorteio ? Math.floor(sorteio() * lista.length) : 0
      escolhidasFinal.push(restantes.splice(i, 1)[0])
    }

    for (const p of escolhidasFinal) {
      turno.pessoas.push(p.id)
      est.datas.get(p.id)!.push(turno.data)
      est.porMes.set(chaveMes(p.id, turno.data), (est.porMes.get(chaveMes(p.id, turno.data)) ?? 0) + 1)
    }
  }

  return { ok: true, turnos }
}

/**
 * Gera a escala, descobrindo o maior piso de distanciamento que cabe.
 */
export function gerar(op: OpcoesGeracao): Resultado {
  /*
    🔴 GRADE VAZIA NÃO É SUCESSO — varredura de 07/08/2026.

    Período invertido (fim < início) e período sem nenhum dia de culto produziam uma grade vazia, e
    o laço abaixo "preenchia" zero turnos com zero falhas: `ok: true` com uma escala vazia. É a
    definição literal de meia escala com cara de sucesso — o contrato deste gerador é gerar por
    inteiro OU dizer que não deu.

    A tela já recusava esses períodos antes de chamar; o guarda aqui protege quem chama por script,
    que é exatamente por onde os dados entram sem a tela no meio.
  */
  if (op.grade.length === 0) {
    return {
      ok: false,
      motivo: op.fim < op.inicio
        ? `O período está invertido: começa em ${formatarBR(op.inicio)} e termina em ${formatarBR(op.fim)}.`
        : `Não há nenhum dia de culto entre ${formatarBR(op.inicio)} e ${formatarBR(op.fim)} — não existe turno a escalar.`,
      pisosTentados: [],
      candidatosBarrados: [],
    }
  }

  const teto = op.pisoMaximo ?? pisoTeorico(op.grade, op.elenco.length, op.inicio, op.fim)
  const tentados: number[] = []
  let ultimaFalha: Extract<ReturnType<typeof tentarComPiso>, { ok: false }> | null = null

  for (let piso = teto; piso >= 1; piso--) {
    tentados.push(piso)
    const r = tentarComPiso(op, piso)
    if (r.ok) {
      const bloco: Bloco = {
        id: `bloco-${op.inicio}-${op.fim}`,
        inicio: op.inicio,
        fim: op.fim,
        // `hojeSaoPaulo()`, não `deData(new Date())`: o segundo lê a data local da MÁQUINA que
        // gerou. O projeto tem a função certa para isto desde o começo (`datas.ts:117`) e este era
        // o único ponto que não a usava — achado de auditoria independente em 04/08/2026.
        geradoEm: hojeSaoPaulo(),
        origem: 'algoritmo',
        pisoAlcancado: piso,
        elenco: [...op.elenco],
        malha: op.malha,
        // Gravada para que esta escala possa ser refeita exatamente igual, por qualquer pessoa.
        ...(op.semente != null ? { semente: op.semente } : {}),
        turnos: r.turnos,
      }
      const naoCouberam = tentados.filter((p) => p !== piso)
      const relato = naoCouberam.length
        ? `Piso alcançado: ${piso} dia(s). Tentei ${naoCouberam.join(', ')} — não foi possível cobrir todos os turnos.`
        : `Piso alcançado: ${piso} dia(s), o maior que a folga desta escala permite.`
      return { ok: true, bloco, pisoAlcancado: piso, pisosTentados: tentados, relato }
    }
    ultimaFalha = r
  }

  // Nem com piso 1. Aqui a resposta honesta é dizer que não deu — e onde travou.
  const t = ultimaFalha?.turno
  return {
    ok: false,
    motivo:
      'Não foi possível gerar a escala: mesmo sem exigir nenhum espaçamento, um turno ficaria sem gente suficiente. ' +
      'Para resolver, é preciso acrescentar pessoas ao elenco, afrouxar alguma restrição, ou reduzir a capacidade do turno.',
    ...(t ? { turnoQueTravou: { data: t.data, tipo: ROTULO_TURNO[t.tipo], faltaram: ultimaFalha!.faltaram } } : {}),
    candidatosBarrados: ultimaFalha?.barrados ?? [],
    pisosTentados: tentados,
  }
}

/**
 * GERAR VÁRIAS VERSÕES E ESCOLHER A MELHOR.
 *
 * 🔴 Pedido do Flavio em 05/08/2026, e a decisão inteira — com o que foi RECUSADO da pesquisa —
 * está em `docs/superpowers/specs/PESQUISA_2026-08-05-gerar-n-versoes.md`.
 *
 * 🔴 E a SEGUNDA pesquisa (07/08/2026, mundial — nurse rostering, competições INRC, sistemas de
 * igreja) confirmou este desenho e teve a recomendação central MEDIDA E RECUSADA: busca local
 * pós-GRASP achou **zero trocas melhoradoras** nos dados reais publicados — esta cascata já produz
 * um ótimo local, e Jain 0,9965 é o máximo que a aritmética permite (258 vagas ∤ 14 pessoas).
 * Registro auditado: `docs/superpowers/specs/PESQUISA_2026-08-07-metodos-rostering.md` · prova
 * re-rodável: `npm run experimento:busca-local` (se um dia achar troca, a recusa perde a prova e a
 * decisão reabre — é o portão de reabertura, não um enfeite).
 *
 * O critério de escolha é em CASCATA, e a ordem importa mais que os pesos:
 *
 *   1. **maior piso alcançado** — espaçamento é o defeito que originou o projeto, e nenhum ganho de
 *      equilíbrio compensa alguém servindo quarta e voltando no sábado;
 *   2. **maior equidade**, pelo índice de Jain sobre a carga de quem não tem teto próprio.
 *
 * ⚠️ Por que cascata e não soma ponderada: somar critérios com pesos escolhidos a dedo é a armadilha
 * que a literatura documenta — produz um ótimo agregado que concentra todo o sacrifício numa pessoa,
 * e o sistema fica cego para a injustiça individual. Cascata não tem peso para escolher errado.
 */
export interface VersaoGerada {
  resultado: Resultado
  /**
   * 🔴 `null` NA VERSÃO 0, e isso importa — quinta auditoria externa, 05/08/2026.
   *
   * Ela era registrada com `semente: 0`, mas foi gerada **sem semente e com `candidatos: 1`**. Quem
   * lesse a lista e tentasse refazê-la com `semente: 0` e `candidatos: 3` obteria outra escala — e
   * concluiria que o gerador não é determinístico, quando o defeito estava no registro.
   *
   * `null` é a única resposta honesta: esta versão não tem semente porque não usou nenhuma.
   */
  semente: number | null
  jain: number
}

export interface EscolhaDeVersoes {
  melhor: Resultado
  /** Todas as tentativas, para a tela poder dizer o que foi comparado. */
  versoes: VersaoGerada[]
  /**
   * ⚠️ Sem leitor hoje (auditoria externa, 05/08/2026): `Admin.tsx` recalcula o complemento à mão,
   * e `gerar-bloco.mjs` imprime este campo. Fica porque é a resposta direta de "quantas das oito
   * não fecharam?", e recalcular na tela é a fonte dupla que este projeto evita. O caminho certo é
   * a tela passar a lê-lo — não este campo sumir.
   */
  descartadas: number
}

/**
 * Índice de Jain sobre a carga por pessoa: `(Σx)² / (n · Σx²)`, de 0 a 1 — 1 é carga idêntica.
 *
 * Quem tem teto mensal fica FORA da conta: ele joga outro jogo, e incluí-lo faria uma escala justa
 * parecer injusta só por respeitar a restrição de alguém.
 */
export function indiceDeJain(cargas: number[]): number {
  if (cargas.length === 0) return 1
  const soma = cargas.reduce((s, n) => s + n, 0)
  const somaQuadrados = cargas.reduce((s, n) => s + n * n, 0)
  if (somaQuadrados === 0) return 1
  return (soma * soma) / (cargas.length * somaQuadrados)
}

export function gerarVariasVersoes(
  op: OpcoesGeracao,
  quantas = 8,
  candidatos = 3,
  sementeBase = 1,
  /**
   * 🔴 A ESCALA QUE ELE ACABOU DE RECUSAR — e o motivo de este parâmetro existir.
   *
   * 06/08/2026, o dono, depois de clicar em "Não gostei — gerar outra combinação" várias vezes:
   * *"mesmo clicando várias vezes não muda nada, o 'Não gostei' é uma farsa."*
   *
   * Ele estava certo, e a causa não era a semente. Medido: **cada rodada produz 8 versões
   * distintas** — as sementes funcionam. Só que a cascata escolhe sempre a versão **gulosa**, que
   * não usa semente nenhuma; então o botão gerava oito alternativas e descartava todas em favor da
   * mesma de sempre. Com este elenco, isso acontece em toda rodada.
   *
   * "Não gostei" é um pedido explícito: **dê-me outra**. Quando ele chega com a escala recusada, a
   * escolha passa a ser feita entre as que DIFEREM dela — mesmo que a melhor delas seja um pouco
   * pior. Preferir a mesma resposta a uma resposta um pouco pior é ignorar o pedido.
   *
   * ⚠️ Sem `recusada`, o comportamento é o de antes: a melhor de todas, ponto. É assim que a
   * primeira geração continua sendo a melhor poss√≠vel.
   */
  recusada?: Turno[],
): EscolhaDeVersoes {
  const versoes: VersaoGerada[] = []
  const semTeto = new Set(
    op.pessoas.filter((p) => p.ativo && op.elenco.includes(p.id) && p.restricoes.tetoMensal == null).map((p) => p.id),
  )

  for (let i = 0; i < Math.max(1, quantas); i++) {
    // A primeira versão é o GULOSO PURO, sem sorteio. Ela é a rede: se todas as sorteadas saírem
    // piores, a escala de sempre continua na mesa.
    const semente = sementeBase + i
    const resultado = i === 0
      ? gerar({ ...op, candidatos: 1, semente: undefined })
      : gerar({ ...op, candidatos, semente })
    let jain = 0
    if (resultado.ok) {
      const cargas = [...semTeto].map(
        (id) => resultado.bloco.turnos.filter((t) => t.pessoas.includes(id)).length,
      )
      jain = indiceDeJain(cargas)
    }
    // `null` na versão 0: ela é o guloso puro, e não usou semente nenhuma. Ver `VersaoGerada`.
    versoes.push({ resultado, semente: i === 0 ? null : semente, jain })
  }

  const validas = versoes.filter((v) => v.resultado.ok)
  if (validas.length === 0) return { melhor: versoes[0].resultado, versoes, descartadas: versoes.length }

  const escolher = (entre: VersaoGerada[]) =>
    entre.reduce((a, b) => {
      const pa = (a.resultado as Sucesso).pisoAlcancado
      const pb = (b.resultado as Sucesso).pisoAlcancado
      if (pa !== pb) return pa > pb ? a : b
      return a.jain >= b.jain ? a : b
    })

  /*
    Se ele recusou uma escala, as iguais a ela saem da disputa. Comparação por CONTEÚDO — o mesmo
    conjunto de turnos gerado duas vezes é a mesma escala, e é exatamente isso que ele não quer ver
    de novo.
  */
  if (recusada) {
    const digital = JSON.stringify(recusada)
    const diferentes = validas.filter((v) => JSON.stringify((v.resultado as Sucesso).bloco.turnos) !== digital)
    // Todas iguais à recusada? Então a resposta honesta é a de sempre — e a tela dirá que repetiu.
    if (diferentes.length > 0) {
      const outra = escolher(diferentes)
      return { melhor: outra.resultado, versoes, descartadas: versoes.length - validas.length }
    }
  }

  const melhor = escolher(validas)
  return { melhor: melhor.resultado, versoes, descartadas: versoes.length - validas.length }
}
