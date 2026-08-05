/**
 * CATÁLOGO DE REGRAS — a fonte única.
 *
 * 🔴 POR QUE ESTE ARQUIVO EXISTE COMO CATÁLOGO, E NÃO COMO `if`s ESPALHADOS.
 *
 * No site anterior as regras viviam em dois lugares que não conversavam: o gerador respeitava um
 * conjunto, e a validação cobrava outro — **procurando as pessoas por nome em texto** (`'Thiago'`,
 * `'Williams'`, `'Adilson'`). Consequências medidas:
 *
 *   • a especificação prometia validar "espaçamento mínimo" e "capacidade por turno", e **nenhuma
 *     das duas era conferida**;
 *   • tirar alguém da lista deixaria a validação **inerte**, sem erro visível;
 *   • a cota mensal era teto no gerador e exato na validação — quem ficasse abaixo era acusado de
 *     uma falha que não existia.
 *
 * Aqui existe **um** catálogo. O gerador o consulta para saber o que pode; a validação o percorre
 * inteiro para conferir o que saiu. Regra nova entra em um lugar só, e as duas pontas a enxergam.
 *
 * ⚠️ ESCOPO POR EXCLUSÃO EXPLÍCITA (ERRO 20): `CATALOGO` é a lista completa. A validação percorre
 * **todas** as entradas dela — não um subconjunto escolhido a mão. Se uma regra precisar ficar de
 * fora de alguma avaliação, isso é declarado e contado no relatório, nunca silenciado.
 */
import {
  diaDaSemana, diferencaEmDias, formatarBR, mesDe, NOMES_DIA, type DataISO,
} from './datas'
import { ROTULO_TURNO, type Bloco, type Configuracao, type Pessoa, type TipoTurno, type Turno } from './tipos'
import { construirGrade } from './malha'

export type Familia = 'DURA' | 'QUALIDADE'
export type Status = 'ok' | 'falha' | 'aviso'

export interface Violacao {
  mensagem: string
  data?: DataISO
  pessoaId?: string
}

export interface ResultadoRegra {
  id: string
  titulo: string
  familia: Familia
  status: Status
  /** O número que a regra apurou, em português. Aparece na tela mesmo quando está tudo certo. */
  medida: string
  violacoes: Violacao[]
}

/** Tudo o que uma regra precisa para julgar. */
export interface Contexto {
  bloco: Bloco
  pessoas: Pessoa[]
  /**
   * Última data em que cada pessoa foi escalada **antes** do início do bloco.
   *
   * Existe por causa da fronteira: mesmo com a contagem zerada, quem trabalhou em 30/08 não pode
   * cair em 01/09. Sem isto, todo bloco novo começa cego para o anterior.
   */
  ultimaEscalaAnterior: Record<string, DataISO>
  /**
   * 🔴 A CONFIGURAÇÃO — entrou em 04/08/2026, por auditoria independente, e o motivo importa.
   *
   * Sem ela, uma regra só conseguia comparar o bloco **consigo mesmo**. Foi assim que D9 ficou
   * estruturalmente cega: ela conferia que todo turno marcado `santaCeia` estava vazio, mas não
   * tinha de onde saber se a Santa Ceia **estava marcada**. Perdida a marca — num bloco importado,
   * num ajuste manual, num turno gerado sem a flag —, D9 respondia *"0 dia(s) de Santa Ceia no
   * bloco"* e aprovava.
   *
   * Que é exatamente o defeito que originou este projeto: o site antigo escala seis irmãos no dia
   * da Ceia porque a data mora no código, e ninguém confere contra o calendário de verdade.
   *
   * Com a configuração aqui, o calendário é a fonte, e o bloco é o que se confere contra ela.
   */
  config: Configuracao
}

export interface Regra {
  id: string
  titulo: string
  familia: Familia
  /**
   * O que esta regra confere, em linguagem de quem NÃO construiu o sistema.
   *
   * 🔴 Existe porque o produto vai ser vendido. Quem escala dois turnos na portaria de um prédio
   * precisa entender a conferência sem conhecer o vocabulário desta congregação — e sem conhecer
   * o nosso. `medida` diz o NÚMERO; isto aqui diz o SENTIDO, que é o que falta para decidir.
   */
  explicacao: string
  avaliar(ctx: Contexto): ResultadoRegra
}

// ---------------------------------------------------------------------------
// Auxiliares
// ---------------------------------------------------------------------------

const nomeDe = (ctx: Contexto, id: string) => ctx.pessoas.find((p) => p.id === id)?.nome ?? id
const turnosComGente = (b: Bloco) => b.turnos.filter((t) => !t.santaCeia)

/**
 * 🔴 QUEM ESTÁ NESTA ESCALA — e por que quase toda regra precisa disto.
 *
 * Achado do Flavio em 05/08/2026, olhando a tela: *"Eu deixei o Thiago de fora. Você, ainda assim,
 * contou ele em «quem tem teto e ficou abaixo dele». Quem está fora da escala não deve ser contado
 * para nada."*
 *
 * Ele estava certo. As regras percorriam `ctx.pessoas` — **todo mundo cadastrado** —, então quem foi
 * tirado da escala aparecia com "0 de 2 em cada mês", cinco vezes seguidas. Não é injustiça de
 * distribuição: é ausência de participação, e chamar uma de outra treina o administrador a ignorar o
 * aviso. Aviso que sempre acusa é aviso que ninguém lê.
 *
 * ⚠️ E a pergunta que ele fez junto — *"pode o sistema gerar uma escala contando quem está de
 * fora?"* — tem resposta medida: **não**. `gerador.ts` filtra `p.ativo && noElenco.has(p.id)` antes
 * de qualquer escolha. O defeito era só do RELATÓRIO. Mas relatório errado sobre escala certa é
 * exatamente o que faz alguém desconfiar da escala certa.
 *
 * Quem NÃO usa isto, de propósito: D8, cujo trabalho é justamente achar quem foi escalado sem
 * poder — ela precisa enxergar quem está fora.
 */
function pessoasDoBloco(ctx: Contexto): Pessoa[] {
  const elenco = new Set(ctx.bloco.elenco)
  return ctx.pessoas.filter((p) => p.ativo && elenco.has(p.id))
}

/**
 * Lista de nomes para a `medida`, cortada quando fica longa demais para uma linha.
 *
 * Pedido do Flavio em 05/08/2026: *"«2 pessoas com dia restrito» — ótimo, mas traga as pessoas,
 * para maior credibilidade e conferência de quem está gerando a escala."* Um número sozinho pede
 * confiança; o nome ao lado permite conferir.
 */
function comNomes(pessoas: Pessoa[], limite = 6): string {
  if (pessoas.length === 0) return ''
  const nomes = pessoas.map((p) => p.nome)
  return nomes.length <= limite
    ? `: ${nomes.join(', ')}`
    : `: ${nomes.slice(0, limite).join(', ')} e mais ${nomes.length - limite}`
}

function ok(r: Omit<ResultadoRegra, 'status' | 'violacoes'>, violacoes: Violacao[], statusSeFalha: Status = 'falha'): ResultadoRegra {
  return { ...r, status: violacoes.length ? statusSeFalha : 'ok', violacoes }
}

/** Datas em que a pessoa aparece, em ordem — incluindo a última do bloco anterior, se houver. */
export function datasDaPessoa(ctx: Contexto, pessoaId: string, comAnterior = true): DataISO[] {
  const datas = ctx.bloco.turnos
    .filter((t) => t.pessoas.includes(pessoaId))
    .map((t) => t.data)
  const anterior = ctx.ultimaEscalaAnterior[pessoaId]
  if (comAnterior && anterior) datas.push(anterior)
  return [...new Set(datas)].sort()
}

/** Menor intervalo, em dias, entre duas escalas consecutivas da pessoa. `null` se tiver menos de 2. */
export function menorIntervalo(ctx: Contexto, pessoaId: string): number | null {
  const datas = datasDaPessoa(ctx, pessoaId)
  if (datas.length < 2) return null
  let min = Infinity
  for (let i = 1; i < datas.length; i++) min = Math.min(min, diferencaEmDias(datas[i - 1], datas[i]))
  return min
}

// ---------------------------------------------------------------------------
// 🔴 REGRAS DURAS — violou, a escala é REPROVADA e não publica
// ---------------------------------------------------------------------------

const D1: Regra = {
  id: 'D1',
  titulo: 'Capacidade — cada turno com o número certo de pessoas',
  familia: 'DURA',
  explicacao:
    'Todo turno precisa ter exatamente o número de pessoas que ele pede. Com gente a menos, o posto fica descoberto; com gente a mais, alguém foi chamado à toa.',
  avaliar(ctx) {
    const v: Violacao[] = []
    let completos = 0
    for (const t of turnosComGente(ctx.bloco)) {
      if (t.pessoas.length === t.capacidade) completos++
      else
        v.push({
          data: t.data,
          mensagem: `${formatarBR(t.data)} ${ROTULO_TURNO[t.tipo]}: ${t.pessoas.length} de ${t.capacidade} vaga(s) preenchida(s)`,
        })
    }
    const total = turnosComGente(ctx.bloco).length
    return ok(
      { id: D1.id, titulo: D1.titulo, familia: 'DURA', medida: `${completos} de ${total} turnos completos` },
      v,
    )
  },
}

const D2: Regra = {
  id: 'D2',
  titulo: 'Sem repetição no mesmo dia',
  familia: 'DURA',
  explicacao:
    'Ninguém serve dois turnos no mesmo dia — nem manhã e noite do mesmo domingo.',
  avaliar(ctx) {
    const v: Violacao[] = []
    const porDia = new Map<DataISO, string[]>()
    for (const t of turnosComGente(ctx.bloco)) {
      porDia.set(t.data, [...(porDia.get(t.data) ?? []), ...t.pessoas])
    }
    for (const [data, ids] of porDia) {
      const vistos = new Set<string>()
      for (const id of ids) {
        if (vistos.has(id))
          v.push({ data, pessoaId: id, mensagem: `${nomeDe(ctx, id)} aparece duas vezes em ${formatarBR(data)}` })
        vistos.add(id)
      }
    }
    return ok(
      { id: D2.id, titulo: D2.titulo, familia: 'DURA', medida: `${porDia.size} dia(s) conferido(s)` },
      v,
    )
  },
}

const D3: Regra = {
  id: 'D3',
  titulo: 'Dias permitidos — quem só pode em certos dias da semana',
  familia: 'DURA',
  explicacao:
    'Quem só pode em certos dias da semana aparece somente neles.',
  avaliar(ctx) {
    const v: Violacao[] = []
    const contados: Pessoa[] = []
    for (const p of pessoasDoBloco(ctx)) {
      const permitidos = p.restricoes.diasPermitidos
      if (!permitidos) continue
      contados.push(p)
      for (const t of turnosComGente(ctx.bloco)) {
        if (!t.pessoas.includes(p.id)) continue
        const dia = diaDaSemana(t.data)
        if (!permitidos.includes(dia))
          v.push({
            data: t.data,
            pessoaId: p.id,
            mensagem: `${p.nome} escalado em ${NOMES_DIA[dia]} (${formatarBR(t.data)}), mas só pode em ${permitidos.map((d) => NOMES_DIA[d]).join(', ')}`,
          })
      }
    }
    return ok(
      { id: D3.id, titulo: D3.titulo, familia: 'DURA', medida: `${contados.length} pessoa(s) com dia restrito${comNomes(contados)}` },
      v,
    )
  },
}

const D4: Regra = {
  id: 'D4',
  titulo: 'Dias proibidos — quem nunca pode em certo dia da semana',
  familia: 'DURA',
  explicacao:
    'Quem nunca pode num certo dia da semana nunca é escalado nesse dia.',
  avaliar(ctx) {
    const v: Violacao[] = []
    const contados: Pessoa[] = []
    for (const p of pessoasDoBloco(ctx)) {
      const proibidos = p.restricoes.diasProibidos
      if (!proibidos?.length) continue
      contados.push(p)
      for (const t of turnosComGente(ctx.bloco)) {
        if (!t.pessoas.includes(p.id)) continue
        const dia = diaDaSemana(t.data)
        if (proibidos.includes(dia))
          v.push({
            data: t.data,
            pessoaId: p.id,
            mensagem: `${p.nome} escalado em ${NOMES_DIA[dia]} (${formatarBR(t.data)}), dia em que não pode`,
          })
      }
    }
    return ok(
      { id: D4.id, titulo: D4.titulo, familia: 'DURA', medida: `${contados.length} pessoa(s) com dia vetado${comNomes(contados)}` },
      v,
    )
  },
}

const D5: Regra = {
  id: 'D5',
  titulo: 'Turnos permitidos — quem só pode em certo turno',
  familia: 'DURA',
  explicacao:
    'Quem só pode num turno — só de manhã, só à noite — não é escalado no outro.',
  avaliar(ctx) {
    const v: Violacao[] = []
    const contados: Pessoa[] = []
    for (const p of pessoasDoBloco(ctx)) {
      const permitidos = p.restricoes.turnosPermitidos
      if (!permitidos) continue
      contados.push(p)
      for (const t of turnosComGente(ctx.bloco)) {
        if (!t.pessoas.includes(p.id)) continue
        if (!permitidos.includes(t.tipo))
          v.push({
            data: t.data,
            pessoaId: p.id,
            mensagem: `${p.nome} escalado no turno da ${ROTULO_TURNO[t.tipo]} (${formatarBR(t.data)}), mas só pode ${permitidos.map((x) => ROTULO_TURNO[x]).join(', ')}`,
          })
      }
    }
    return ok(
      { id: D5.id, titulo: D5.titulo, familia: 'DURA', medida: `${contados.length} pessoa(s) com turno restrito${comNomes(contados)}` },
      v,
    )
  },
}

const D6: Regra = {
  id: 'D6',
  titulo: 'Ausências — férias, viagem, compromisso',
  familia: 'DURA',
  explicacao:
    'Quem avisou que estará fora (férias, viagem, compromisso) não é escalado nesses dias.',
  avaliar(ctx) {
    const v: Violacao[] = []
    let total = 0
    for (const p of pessoasDoBloco(ctx)) {
      const ausencias = p.restricoes.ausencias ?? []
      total += ausencias.length
      for (const a of ausencias) {
        for (const t of turnosComGente(ctx.bloco)) {
          if (!t.pessoas.includes(p.id)) continue
          const dentro = diferencaEmDias(a.inicio, t.data) >= 0 && diferencaEmDias(t.data, a.fim) >= 0
          if (dentro)
            v.push({
              data: t.data,
              pessoaId: p.id,
              mensagem: `${p.nome} escalado em ${formatarBR(t.data)}, dentro da ausência de ${formatarBR(a.inicio)} a ${formatarBR(a.fim)}${a.motivo ? ` (${a.motivo})` : ''}`,
            })
        }
      }
    }
    return ok(
      { id: D6.id, titulo: D6.titulo, familia: 'DURA', medida: `${total} ausência(s) cadastrada(s)` },
      v,
    )
  },
}

const D7: Regra = {
  id: 'D7',
  titulo: 'Teto mensal — quem tem limite de escalas por mês',
  familia: 'DURA',
  explicacao:
    'Quem tem limite de quantas vezes pode servir por mês não passa desse limite.',
  avaliar(ctx) {
    const v: Violacao[] = []
    const contados: Pessoa[] = []
    for (const p of pessoasDoBloco(ctx)) {
      const teto = p.restricoes.tetoMensal
      if (teto == null) continue
      contados.push(p)
      const porMes = new Map<string, number>()
      for (const t of turnosComGente(ctx.bloco)) {
        if (!t.pessoas.includes(p.id)) continue
        const m = mesDe(t.data)
        porMes.set(m, (porMes.get(m) ?? 0) + 1)
      }
      for (const [m, n] of porMes) {
        if (n > teto)
          v.push({ pessoaId: p.id, mensagem: `${p.nome} tem ${n} escalas em ${m}, acima do teto de ${teto}` })
      }
    }
    return ok(
      { id: D7.id, titulo: D7.titulo, familia: 'DURA', medida: `${contados.length} pessoa(s) com teto mensal${comNomes(contados)}` },
      v,
    )
  },
}

/**
 * 🔴 Confere DUAS coisas — e a segunda foi achada por auditoria adversarial em 04/08/2026.
 *
 * A primeira versão só olhava `bloco.elenco`. Uma pessoa **desativada** cujo id continuasse no
 * elenco do bloco passava batido, e a escala com ela era **aprovada**.
 *
 * Por que não aparecia: o gerador consulta `podeAssumir`, que já barra quem está inativo, então a
 * escala *gerada* nunca continha o caso. O buraco só se abre pelo **ajuste manual**, por um bloco
 * **importado**, ou por alguém desativado **depois** de a escala ter sido gerada — que é exatamente
 * o cenário deste projeto: *"sempre acontece de saírem pessoas da escala"*.
 *
 * É a diferença entre provar a REGRA e provar o CAMINHO: o gerador estava certo, e a validação —
 * que é a última linha antes de publicar — não cobria a porta que sobrou.
 */
const D8: Regra = {
  id: 'D8',
  titulo: 'Elenco — só quem está no elenco do bloco, e ativo',
  familia: 'DURA',
  explicacao:
    'Só entra na escala quem está na equipe e ativo hoje. Quem saiu continua aparecendo no passado já publicado, mas não é escalado para a frente.',
  avaliar(ctx) {
    const v: Violacao[] = []
    const elenco = new Set(ctx.bloco.elenco)
    const inativos = new Set(ctx.pessoas.filter((p) => !p.ativo).map((p) => p.id))
    const jaAcusados = new Set<string>()
    for (const t of turnosComGente(ctx.bloco)) {
      for (const id of t.pessoas) {
        if (jaAcusados.has(id)) continue
        if (!elenco.has(id)) {
          jaAcusados.add(id)
          v.push({ pessoaId: id, mensagem: `${nomeDe(ctx, id)} aparece na escala mas não está no elenco deste bloco` })
        } else if (inativos.has(id)) {
          jaAcusados.add(id)
          v.push({ pessoaId: id, mensagem: `${nomeDe(ctx, id)} foi tirado da escala, mas continua escalado` })
        }
      }
    }
    return ok(
      {
        id: D8.id, titulo: D8.titulo, familia: 'DURA',
        medida: `${elenco.size} no elenco, ${inativos.size} fora da escala`,
      },
      v,
    )
  },
}

/**
 * A grade que o bloco DEVERIA ter, expandida da própria malha dele sobre o próprio período.
 *
 * É a mesma função que o gerador usa (`construirGrade`) — de propósito. Duas expansões da malha
 * seriam duas regras que divergem em silêncio; este projeto já pagou por fonte dupla.
 *
 * Devolve `null` quando não há configuração: quem chama decide o que fazer, e nas regras abaixo a
 * decisão é REPROVAR. Falhar fechado é a única saída honesta — sem o calendário, uma regra que
 * "aprova porque não tinha o que conferir" é indistinguível de uma regra desligada.
 */
function gradeEsperada(ctx: Contexto): Turno[] | null {
  if (!ctx.config) return null
  return construirGrade({
    inicio: ctx.bloco.inicio,
    fim: ctx.bloco.fim,
    malha: ctx.bloco.malha,
    capacidadePadrao: ctx.config.capacidadePadrao,
    santaCeia: ctx.config.santaCeia,
  })
}

/**
 * 🔴 A FRONTEIRA DO PASSADO — decidida em 04/08/2026, ao ligar D9 ao calendário e criar D11.
 *
 * Assim que as duas regras passaram a existir, a escala PUBLICADA reprovou. Não por defeito: o
 * bloco histórico traz **07/06/2026 marcada como Santa Ceia**, que é a data errada do site antigo —
 * e está ali de propósito, porque o passado foi congelado **fiel à tela que os irmãos viram** (66
 * dias, 282 nomes, 0 divergências). O calendário de hoje diz 16/08.
 *
 * Cobrar coerência com o calendário atual num bloco importado é pedir para **reescrever o passado**,
 * que é a primeira regra que este projeto não viola: *"o passado já foi divulgado aos irmãos;
 * reescrevê-lo faz o site desmentir o que as pessoas viram"*.
 *
 * Então a fronteira é: o sistema responde pelo que **ele gera** e pelo que vai ao ar daqui para a
 * frente. Do passado importado ele cobra só o que continua valendo — nenhum turno de Santa Ceia com
 * gente escalada, e não estar vazio.
 *
 * ⚠️ E a fronteira é DITA na medida de cada regra, nunca silenciosa: um portão que afrouxa sem
 * avisar é indistinguível de um portão furado.
 */
const congelado = (ctx: Contexto) => ctx.bloco.origem === 'importado'

const semConfig = (id: string, titulo: string): ResultadoRegra => ({
  id, titulo, familia: 'DURA', status: 'falha',
  medida: 'configuração não recebida — impossível conferir',
  violacoes: [{ mensagem: 'Esta regra precisa da configuração (calendário e malha) e não a recebeu. Conferir era impossível, então a escala é reprovada em vez de aprovada no escuro.' }],
})

const D9: Regra = {
  id: 'D9',
  titulo: 'Santa Ceia — o dia do calendário está marcado, e não recebe ninguém',
  familia: 'DURA',
  explicacao:
    'Existem dias marcados no calendário em que ninguém deve ser escalado — aqui, a Santa Ceia. A conferência é contra o CALENDÁRIO, não contra a própria escala: se a marca se perder, ela acusa.',
  avaliar(ctx) {
    if (!ctx.config) return semConfig(D9.id, D9.titulo)

    const v: Violacao[] = []
    const dentroDoPeriodo = (d: DataISO) =>
      diferencaEmDias(ctx.bloco.inicio, d) >= 0 && diferencaEmDias(d, ctx.bloco.fim) >= 0

    // (1) O que o bloco tem marcado não pode receber ninguém. Era a ÚNICA coisa que se conferia —
    //     e conferir isso é conferir o bloco contra ele mesmo.
    const marcadosNoBloco = ctx.bloco.turnos.filter((t) => t.santaCeia)
    for (const t of marcadosNoBloco)
      if (t.pessoas.length > 0)
        v.push({
          data: t.data,
          mensagem: `${formatarBR(t.data)} é Santa Ceia e tem ${t.pessoas.length} pessoa(s) escalada(s) — não se escala ninguém nesse dia`,
        })

    // (2) 🔴 O QUE FALTAVA: conferir contra o CALENDÁRIO, que é a fonte.
    //
    //     Se a data canônica cai no período e o bloco tem turno comum nela, a marca se perdeu —
    //     e é assim que aparece gente escalada no dia da Ceia. Se o bloco não tem turno nenhum
    //     naquele dia, está certo: dia sem culto, ou dia pulado.
    const datasCanonicas = new Set(ctx.config.santaCeia.filter(dentroDoPeriodo))
    const datasMarcadas = new Set(marcadosNoBloco.map((t) => t.data))

    if (congelado(ctx))
      return ok(
        {
          id: D9.id, titulo: D9.titulo, familia: 'DURA',
          medida:
            `${datasMarcadas.size} dia(s) marcado(s), nenhum com gente escalada · bloco importado: ` +
            `não se cobra o calendário de hoje do passado já publicado`,
        },
        v,
      )

    for (const data of datasCanonicas) {
      if (datasMarcadas.has(data)) continue
      const turnosNoDia = ctx.bloco.turnos.filter((t) => t.data === data)
      if (turnosNoDia.length === 0) continue
      const escalados = turnosNoDia.flatMap((t) => t.pessoas)
      v.push({
        data,
        mensagem:
          `${formatarBR(data)} é Santa Ceia no calendário, mas o bloco tem ${turnosNoDia.length} turno(s) comum(ns) nesse dia` +
          (escalados.length ? `, com ${escalados.length} pessoa(s) escalada(s)` : ''),
      })
    }

    // (3) E o contrário: dia marcado no bloco que não é Santa Ceia nenhuma.
    for (const data of datasMarcadas)
      if (!datasCanonicas.has(data))
        v.push({
          data,
          mensagem: `${formatarBR(data)} está marcada como Santa Ceia no bloco, mas não consta do calendário`,
        })

    return ok(
      {
        id: D9.id, titulo: D9.titulo, familia: 'DURA',
        medida: `${datasCanonicas.size} data(s) de Santa Ceia no calendário dentro do período · ${datasMarcadas.size} marcada(s) no bloco`,
      },
      v,
    )
  },
}

const D10: Regra = {
  id: 'D10',
  titulo: 'Coerência do piso declarado',
  familia: 'DURA',
  explicacao:
    'O intervalo mínimo que esta escala afirma ter garantido é conferido pessoa por pessoa. Serve para o número anunciado não ser maior do que a realidade.',
  avaliar(ctx) {
    const piso = ctx.bloco.pisoAlcancado
    if (piso == null)
      return {
        id: D10.id, titulo: D10.titulo, familia: 'DURA', status: 'ok',
        medida: 'piso não declarado (bloco importado) — nada a conferir', violacoes: [],
      }
    const v: Violacao[] = []
    for (const p of pessoasDoBloco(ctx)) {
      const min = menorIntervalo(ctx, p.id)
      if (min != null && min < piso)
        v.push({
          pessoaId: p.id,
          mensagem: `${p.nome} tem intervalo mínimo de ${min} dia(s), abaixo do piso de ${piso} que o bloco declara`,
        })
    }
    return ok(
      { id: D10.id, titulo: D10.titulo, familia: 'DURA', medida: `piso declarado: ${piso} dia(s)` },
      v,
    )
  },
}

/**
 * 🔴 D11 EXISTE POR CAUSA DE UM BURACO ENCONTRADO EM AUDITORIA INDEPENDENTE, 04/08/2026.
 *
 * Um bloco com **zero turnos** era APROVADO — e não por descuido de uma regra: por construção. As
 * quinze regras percorrem `bloco.turnos`; sem turnos, cada uma delas responde "nada a apontar", e o
 * relatório sai *"Aprovada, sem ressalvas."* Nenhuma perguntava se havia escala ali.
 *
 * E "aprovada" não é enfeite: é o que destrava o botão Publicar (`Admin.tsx`). Um bloco importado
 * torto, ou uma malha que por engano não produzisse turno nenhum, publicaria **uma escala vazia de
 * setembro a dezembro** com o sistema dizendo que estava tudo certo. O irmão abriria o site e não
 * veria ninguém escalado — sem um erro em lugar nenhum.
 *
 * Todas as outras regras perguntam "o que está aqui está certo?". Esta pergunta **"está tudo aqui?"**
 * — e é a diferença entre validar o conteúdo e validar a ausência dele.
 */
const D11: Regra = {
  id: 'D11',
  titulo: 'Cobertura — o bloco tem os turnos que o período dele exige',
  familia: 'DURA',
  explicacao:
    'A escala cobre todos os dias e turnos que o período exige — nem falta dia, nem sobra dia que não é de culto. É o que impede publicar uma escala vazia ou pela metade.',
  avaliar(ctx) {
    const esperada = gradeEsperada(ctx)
    if (!esperada) return semConfig(D11.id, D11.titulo)

    const v: Violacao[] = []

    // (1) VAZIO É SEMPRE ERRADO, venha de onde vier. Vale mesmo para bloco importado, sem malha
    //     declarada: um trecho de escala que não escala ninguém não é uma escala.
    if (ctx.bloco.turnos.length === 0) {
      v.push({
        mensagem: `o bloco de ${formatarBR(ctx.bloco.inicio)} a ${formatarBR(ctx.bloco.fim)} está VAZIO — não há um único turno`,
      })
      return ok(
        { id: D11.id, titulo: D11.titulo, familia: 'DURA', medida: '0 turno(s) no bloco' },
        v,
      )
    }

    // (2) Sem malha declarada não há de onde derivar o que era esperado. Bloco importado pode ser
    //     assim — é o mesmo caso que D10 já trata com "nada a conferir". Diz-se o que foi conferido
    //     e o que não foi, em vez de aprovar dando a impressão de ter conferido tudo.
    if (ctx.bloco.malha.regras.length === 0 || congelado(ctx))
      return {
        id: D11.id, titulo: D11.titulo, familia: 'DURA', status: 'ok',
        medida:
          `${ctx.bloco.turnos.length} turno(s) · ` +
          (congelado(ctx)
            ? 'bloco importado: o passado é conferido contra a tela do site antigo, não contra a malha de hoje'
            : 'malha não declarada — conferida só a não-vacuidade'),
        violacoes: [],
      }

    const chave = (t: Turno) => `${t.data}|${t.tipo}`
    const noBloco = new Set(ctx.bloco.turnos.map(chave))
    const devidos = new Set(esperada.map(chave))
    const faltando = esperada.filter((t) => !noBloco.has(chave(t)))
    const sobrando = ctx.bloco.turnos.filter((t) => !devidos.has(chave(t)))

    // Poucos exemplos, e o total ao lado: cem violações iguais não informam mais que três.
    for (const t of faltando.slice(0, 5))
      v.push({ data: t.data, mensagem: `falta o turno de ${formatarBR(t.data)} ${ROTULO_TURNO[t.tipo]}` })
    if (faltando.length > 5) v.push({ mensagem: `… e mais ${faltando.length - 5} turno(s) faltando` })
    for (const t of sobrando.slice(0, 5))
      v.push({ data: t.data, mensagem: `${formatarBR(t.data)} ${ROTULO_TURNO[t.tipo]} não é dia de culto nesta malha` })
    if (sobrando.length > 5) v.push({ mensagem: `… e mais ${sobrando.length - 5} turno(s) sobrando` })

    return ok(
      {
        id: D11.id, titulo: D11.titulo, familia: 'DURA',
        medida: `${ctx.bloco.turnos.length} turno(s) no bloco · ${esperada.length} previsto(s) pela malha do período`,
      },
      v,
    )
  },
}

// ---------------------------------------------------------------------------
// 🟡 REGRAS DE QUALIDADE — o motor maximiza, a validação MEDE e MOSTRA
// ---------------------------------------------------------------------------

const Q1: Regra = {
  id: 'Q1',
  titulo: 'Distanciamento — cada um o mais longe possível da própria escala anterior',
  familia: 'QUALIDADE',
  explicacao:
    'Cada pessoa o mais longe possível da própria escala anterior. É o defeito que originou este projeto: alguém servindo quarta e voltando no sábado.',
  avaliar(ctx) {
    const linhas: Violacao[] = []
    let menorGlobal = Infinity
    let quem = ''
    for (const p of pessoasDoBloco(ctx)) {
      const min = menorIntervalo(ctx, p.id)
      if (min == null) continue
      if (min < menorGlobal) {
        menorGlobal = min
        quem = p.nome
      }
      if (min <= 3)
        linhas.push({ pessoaId: p.id, mensagem: `${p.nome}: menor intervalo de ${min} dia(s)` })
    }
    const medida =
      menorGlobal === Infinity
        ? 'ninguém tem duas escalas para comparar'
        : `menor intervalo do bloco: ${menorGlobal} dia(s) (${quem})`
    return {
      id: Q1.id, titulo: Q1.titulo, familia: 'QUALIDADE',
      status: linhas.length ? 'aviso' : 'ok',
      medida, violacoes: linhas,
    }
  },
}

const Q2: Regra = {
  id: 'Q2',
  titulo: 'Equilíbrio de carga dentro do bloco',
  familia: 'QUALIDADE',
  explicacao:
    'A carga fica parecida entre quem não tem limite próprio. Quem tem teto mensal fica fora da comparação, porque joga outro jogo.',
  avaliar(ctx) {
    const contagem = new Map<string, number>()
    for (const id of ctx.bloco.elenco) contagem.set(id, 0)
    for (const t of turnosComGente(ctx.bloco))
      for (const id of t.pessoas) contagem.set(id, (contagem.get(id) ?? 0) + 1)

    // Quem tem teto mensal joga outro jogo: comparar com quem não tem acusaria uma
    // desigualdade que é a regra funcionando, não falhando.
    const semTeto = [...contagem.entries()].filter(
      ([id]) => ctx.pessoas.find((p) => p.id === id)?.restricoes.tetoMensal == null,
    )
    if (!semTeto.length)
      return { id: Q2.id, titulo: Q2.titulo, familia: 'QUALIDADE', status: 'ok', medida: 'todos têm teto mensal — nada a comparar', violacoes: [] }

    const valores = semTeto.map(([, n]) => n)
    const min = Math.min(...valores)
    const max = Math.max(...valores)
    const amplitude = max - min
    const violacoes: Violacao[] =
      amplitude > 2
        ? semTeto
            .filter(([, n]) => n === min || n === max)
            .map(([id, n]) => ({ pessoaId: id, mensagem: `${nomeDe(ctx, id)}: ${n} turno(s)` }))
        : []
    return {
      id: Q2.id, titulo: Q2.titulo, familia: 'QUALIDADE',
      status: violacoes.length ? 'aviso' : 'ok',
      // ⚠️ A MEDIDA DIZ SOBRE QUEM ELA FALA — corrigido em 04/08/2026 por auditoria independente.
      //
      // Antes: "entre 16 e 17 turnos por pessoa (diferença de 1)". Verdadeiro para 14 das 16
      // pessoas, e lido por qualquer um como valendo para as 16 — enquanto Thiago tinha 10 e
      // Williams 15, ambos no próprio teto mensal (a regra funcionando, não falhando). O cálculo
      // sempre excluiu quem tem teto; só o texto não contava.
      //
      // Número que descreve um subconjunto e soa total é a forma mais barata de mentir sem mentir.
      medida:
        `entre ${min} e ${max} turnos (diferença de ${amplitude}) entre as ${semTeto.length} pessoas ` +
        `sem teto mensal` +
        (contagem.size - semTeto.length > 0
          ? ` · ${contagem.size - semTeto.length} com teto ficam fora da comparação, por terem limite próprio`
          : ''),
      violacoes,
    }
  },
}

const Q3: Regra = {
  id: 'Q3',
  titulo: 'Variedade de dia da semana — ninguém preso sempre no mesmo dia',
  familia: 'QUALIDADE',
  explicacao:
    'Ninguém preso sempre no mesmo dia da semana — quem sempre pega sábado acaba nunca indo ao culto de domingo com a família.',
  avaliar(ctx) {
    const violacoes: Violacao[] = []
    let avaliadas = 0
    for (const p of pessoasDoBloco(ctx)) {
      // Quem tem dia restrito não tem escolha: cobrar variedade dele seria cobrar
      // que ele viole a própria restrição.
      if (p.restricoes.diasPermitidos) continue
      const dias = ctx.bloco.turnos.filter((t) => t.pessoas.includes(p.id)).map((t) => diaDaSemana(t.data))
      if (dias.length < 4) continue
      avaliadas++
      const freq = new Map<number, number>()
      for (const d of dias) freq.set(d, (freq.get(d) ?? 0) + 1)
      const [diaMaisComum, n] = [...freq.entries()].sort((a, b) => b[1] - a[1])[0]
      const proporcao = n / dias.length
      if (proporcao > 0.7)
        violacoes.push({
          pessoaId: p.id,
          mensagem: `${p.nome}: ${Math.round(proporcao * 100)}% das escalas em ${NOMES_DIA[diaMaisComum]} (${n} de ${dias.length})`,
        })
    }
    return {
      id: Q3.id, titulo: Q3.titulo, familia: 'QUALIDADE',
      status: violacoes.length ? 'aviso' : 'ok',
      medida: `${avaliadas} pessoa(s) sem dia restrito avaliada(s)`,
      violacoes,
    }
  },
}

const Q4: Regra = {
  id: 'Q4',
  titulo: 'Variedade de companhia — evitar o mesmo grupo se repetindo',
  familia: 'QUALIDADE',
  explicacao:
    'Evita que o mesmo trio se repita muitas vezes. Não impede publicar; é para você saber.',
  avaliar(ctx) {
    const freq = new Map<string, number>()
    for (const t of turnosComGente(ctx.bloco)) {
      if (t.pessoas.length < 2) continue
      const chave = [...t.pessoas].sort().join('|')
      freq.set(chave, (freq.get(chave) ?? 0) + 1)
    }
    const repetidos = [...freq.entries()].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1])
    const violacoes: Violacao[] = repetidos.slice(0, 10).map(([chave, n]) => ({
      mensagem: `${chave.split('|').map((id) => nomeDe(ctx, id)).join(' + ')}: juntos ${n} vezes`,
    }))
    return {
      id: Q4.id, titulo: Q4.titulo, familia: 'QUALIDADE',
      status: violacoes.length ? 'aviso' : 'ok',
      medida: `${freq.size} formação(ões) distinta(s); ${repetidos.length} repetida(s) 3+ vezes`,
      violacoes,
    }
  },
}

const Q5: Regra = {
  id: 'Q5',
  titulo: 'Piso mensal — quem tem teto e ficou abaixo dele',
  familia: 'QUALIDADE',
  explicacao:
    'Quem tem um teto mensal e ficou bem abaixo dele. Pode ser injustiça de distribuição, ou pode ser a restrição dele funcionando.',
  avaliar(ctx) {
    const violacoes: Violacao[] = []
    const meses = [...new Set(turnosComGente(ctx.bloco).map((t) => mesDe(t.data)))].sort()
    const contados: Pessoa[] = []
    for (const p of pessoasDoBloco(ctx)) {
      const teto = p.restricoes.tetoMensal
      if (teto == null) continue
      contados.push(p)
      for (const m of meses) {
        const n = turnosComGente(ctx.bloco).filter(
          (t) => mesDe(t.data) === m && t.pessoas.includes(p.id),
        ).length
        if (n < teto)
          violacoes.push({ pessoaId: p.id, mensagem: `${p.nome} ficou com ${n} de ${teto} em ${m}` })
      }
    }
    return {
      id: Q5.id, titulo: Q5.titulo, familia: 'QUALIDADE',
      status: violacoes.length ? 'aviso' : 'ok',
      medida: `${contados.length} pessoa(s) com teto nesta escala${comNomes(contados)} · ${meses.length} mês(es)`,
      violacoes,
    }
  },
}

// ---------------------------------------------------------------------------
// O CATÁLOGO — a lista COMPLETA. A validação percorre todas.
// ---------------------------------------------------------------------------

// Deixaram de ser exportadas em 04/08/2026: eram superfície pública sem um único consumidor fora
// deste arquivo. Quem precisa agrupar por família tem `familia` em cada resultado.
const REGRAS_DURAS: Regra[] = [D1, D2, D3, D4, D5, D6, D7, D8, D9, D10, D11]
const REGRAS_QUALIDADE: Regra[] = [Q1, Q2, Q3, Q4, Q5]
export const CATALOGO: Regra[] = [...REGRAS_DURAS, ...REGRAS_QUALIDADE]

// ---------------------------------------------------------------------------
// O que o GERADOR pergunta antes de escalar alguém
// ---------------------------------------------------------------------------

/**
 * Uma pessoa pode assumir este turno? Só as regras DURAS que dependem da própria pessoa —
 * capacidade e coerência do bloco são conferidas depois, sobre a escala inteira.
 *
 * ⚠️ Esta função e as regras D2–D8 precisam concordar. Se divergirem, o gerador produz uma escala
 * que a validação reprova — e foi exatamente esse descompasso que quebrou o site anterior. O teste
 * `gerador.test.ts` prova a concordância gerando e validando.
 */
export function podeAssumir(
  pessoa: Pessoa,
  turno: Turno,
  jaEscaladoNoDia: boolean,
  contagemNoMes: number,
): { pode: boolean; motivo?: string } {
  /**
   * 🔴 Rótulo que NUNCA some. `['noite']` (minúsculo, valor inválido — o literal é `'NOITE'`)
   * produzia `ROTULO_TURNO['noite'] === undefined`, e `join` transforma `undefined` em string
   * vazia: a pessoa via **"só pode "** e ficava sem o motivo.
   *
   * O tipo impede isso dentro do app, mas `pessoas.json` é um arquivo que alguém pode editar à mão
   * — e foi exatamente assim que apareceu. Motivo mudo é pior que motivo feio: com o valor cru na
   * tela (`só pode noite`) dá para desconfiar do dado; sem nada, procura-se defeito no gerador.
   */
  const rotuloDoTurno = (t: TipoTurno) => ROTULO_TURNO[t] ?? String(t)
  const nomeDoDia = (d: number) => NOMES_DIA[d] ?? `dia ${d}`

  if (!pessoa.ativo) return { pode: false, motivo: 'fora do elenco' }
  if (jaEscaladoNoDia) return { pode: false, motivo: 'já está escalado neste dia' }

  const dia = diaDaSemana(turno.data)
  const r = pessoa.restricoes

  if (r.diasProibidos?.includes(dia)) return { pode: false, motivo: `não pode em ${NOMES_DIA[dia]}` }
  if (r.diasPermitidos && !r.diasPermitidos.includes(dia))
    return { pode: false, motivo: `só pode em ${r.diasPermitidos.map(nomeDoDia).join(', ')}` }
  if (r.turnosPermitidos && !r.turnosPermitidos.includes(turno.tipo))
    return { pode: false, motivo: `só pode ${r.turnosPermitidos.map(rotuloDoTurno).join(', ')}` }
  if (r.tetoMensal != null && contagemNoMes >= r.tetoMensal)
    return { pode: false, motivo: `já atingiu o teto de ${r.tetoMensal} no mês` }
  for (const a of r.ausencias ?? []) {
    if (diferencaEmDias(a.inicio, turno.data) >= 0 && diferencaEmDias(turno.data, a.fim) >= 0)
      return { pode: false, motivo: `ausente de ${formatarBR(a.inicio)} a ${formatarBR(a.fim)}` }
  }
  return { pode: true }
}

export type { TipoTurno }
