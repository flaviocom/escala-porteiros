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
import { ROTULO_TURNO, type Bloco, type Pessoa, type TipoTurno, type Turno } from './tipos'

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
}

export interface Regra {
  id: string
  titulo: string
  familia: Familia
  avaliar(ctx: Contexto): ResultadoRegra
}

// ---------------------------------------------------------------------------
// Auxiliares
// ---------------------------------------------------------------------------

const nomeDe = (ctx: Contexto, id: string) => ctx.pessoas.find((p) => p.id === id)?.nome ?? id
const turnosComGente = (b: Bloco) => b.turnos.filter((t) => !t.santaCeia)

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
  avaliar(ctx) {
    const v: Violacao[] = []
    let comRestricao = 0
    for (const p of ctx.pessoas) {
      const permitidos = p.restricoes.diasPermitidos
      if (!permitidos) continue
      comRestricao++
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
      { id: D3.id, titulo: D3.titulo, familia: 'DURA', medida: `${comRestricao} pessoa(s) com dia restrito` },
      v,
    )
  },
}

const D4: Regra = {
  id: 'D4',
  titulo: 'Dias proibidos — quem nunca pode em certo dia da semana',
  familia: 'DURA',
  avaliar(ctx) {
    const v: Violacao[] = []
    let comRestricao = 0
    for (const p of ctx.pessoas) {
      const proibidos = p.restricoes.diasProibidos
      if (!proibidos?.length) continue
      comRestricao++
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
      { id: D4.id, titulo: D4.titulo, familia: 'DURA', medida: `${comRestricao} pessoa(s) com dia vetado` },
      v,
    )
  },
}

const D5: Regra = {
  id: 'D5',
  titulo: 'Turnos permitidos — quem só pode em certo turno',
  familia: 'DURA',
  avaliar(ctx) {
    const v: Violacao[] = []
    let comRestricao = 0
    for (const p of ctx.pessoas) {
      const permitidos = p.restricoes.turnosPermitidos
      if (!permitidos) continue
      comRestricao++
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
      { id: D5.id, titulo: D5.titulo, familia: 'DURA', medida: `${comRestricao} pessoa(s) com turno restrito` },
      v,
    )
  },
}

const D6: Regra = {
  id: 'D6',
  titulo: 'Ausências — férias, viagem, compromisso',
  familia: 'DURA',
  avaliar(ctx) {
    const v: Violacao[] = []
    let total = 0
    for (const p of ctx.pessoas) {
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
  avaliar(ctx) {
    const v: Violacao[] = []
    let comTeto = 0
    for (const p of ctx.pessoas) {
      const teto = p.restricoes.tetoMensal
      if (teto == null) continue
      comTeto++
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
      { id: D7.id, titulo: D7.titulo, familia: 'DURA', medida: `${comTeto} pessoa(s) com teto mensal` },
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

const D9: Regra = {
  id: 'D9',
  titulo: 'Santa Ceia — dia marcado não recebe ninguém',
  familia: 'DURA',
  avaliar(ctx) {
    const dias = ctx.bloco.turnos.filter((t) => t.santaCeia)
    const v: Violacao[] = dias
      .filter((t) => t.pessoas.length > 0)
      .map((t) => ({
        data: t.data,
        mensagem: `${formatarBR(t.data)} é Santa Ceia e tem ${t.pessoas.length} pessoa(s) escalada(s) — não se escala porteiro nesse dia`,
      }))
    return ok(
      { id: D9.id, titulo: D9.titulo, familia: 'DURA', medida: `${dias.length} dia(s) de Santa Ceia no bloco` },
      v,
    )
  },
}

const D10: Regra = {
  id: 'D10',
  titulo: 'Coerência do piso declarado',
  familia: 'DURA',
  avaliar(ctx) {
    const piso = ctx.bloco.pisoAlcancado
    if (piso == null)
      return {
        id: D10.id, titulo: D10.titulo, familia: 'DURA', status: 'ok',
        medida: 'piso não declarado (bloco importado) — nada a conferir', violacoes: [],
      }
    const v: Violacao[] = []
    for (const p of ctx.pessoas) {
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

// ---------------------------------------------------------------------------
// 🟡 REGRAS DE QUALIDADE — o motor maximiza, a validação MEDE e MOSTRA
// ---------------------------------------------------------------------------

const Q1: Regra = {
  id: 'Q1',
  titulo: 'Distanciamento — cada um o mais longe possível da própria escala anterior',
  familia: 'QUALIDADE',
  avaliar(ctx) {
    const linhas: Violacao[] = []
    let menorGlobal = Infinity
    let quem = ''
    for (const p of ctx.pessoas) {
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
      medida: `entre ${min} e ${max} turnos por pessoa (diferença de ${amplitude})`,
      violacoes,
    }
  },
}

const Q3: Regra = {
  id: 'Q3',
  titulo: 'Variedade de dia da semana — ninguém preso sempre no mesmo dia',
  familia: 'QUALIDADE',
  avaliar(ctx) {
    const violacoes: Violacao[] = []
    let avaliadas = 0
    for (const p of ctx.pessoas) {
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
  avaliar(ctx) {
    const violacoes: Violacao[] = []
    const meses = [...new Set(turnosComGente(ctx.bloco).map((t) => mesDe(t.data)))].sort()
    let comTeto = 0
    for (const p of ctx.pessoas) {
      const teto = p.restricoes.tetoMensal
      if (teto == null) continue
      comTeto++
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
      medida: `${comTeto} pessoa(s) com teto, em ${meses.length} mês(es)`,
      violacoes,
    }
  },
}

// ---------------------------------------------------------------------------
// O CATÁLOGO — a lista COMPLETA. A validação percorre todas.
// ---------------------------------------------------------------------------

export const REGRAS_DURAS: Regra[] = [D1, D2, D3, D4, D5, D6, D7, D8, D9, D10]
export const REGRAS_QUALIDADE: Regra[] = [Q1, Q2, Q3, Q4, Q5]
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
