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
 * ele, e desce-se de um em um até caber. O número final não foi escolhido por ninguém — foi o maior
 * que a escala aceitou —, e ele é **informado**, junto com os que foram tentados e não deram.
 *
 * Se não couber nem com piso 1, o gerador **declara que não foi possível** e diz onde travou. Nunca
 * entrega uma escala pela metade em silêncio.
 *
 * O que ele NÃO faz: escolher sozinho entre duas escalas válidas. Isso é do Flavio, na tela de
 * conferência.
 */
import { deData, diferencaEmDias, formatarBR, mesDe, type DataISO } from './datas'
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
  /** Última data de cada pessoa no bloco ANTERIOR — a fronteira. */
  ultimaEscalaAnterior?: Record<string, DataISO>
  /** Teto de piso a tentar. Ausente = calculado a partir da folga da escala. */
  pisoMaximo?: number
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
  /** Formações já usadas, para variar a companhia. */
  formacoes: Map<string, number>
}

const chaveMes = (id: string, data: DataISO) => `${id}|${mesDe(data)}`

function ultimaData(est: Estado, id: string): DataISO | undefined {
  const d = est.datas.get(id)
  return d?.length ? d[d.length - 1] : undefined
}

/**
 * Uma passada com um piso FIXO. Devolve os turnos preenchidos, ou o primeiro que travou.
 *
 * A escolha de quem entra é determinística: mesma entrada, mesma escala. Sem sorteio — uma escala
 * que muda a cada abertura da tela seria impossível de conferir.
 */
function tentarComPiso(
  op: OpcoesGeracao,
  piso: number,
): { ok: true; turnos: Turno[] } | { ok: false; turno: Turno; faltaram: number; barrados: { pessoa: string; motivo: string }[] } {
  const noElenco = new Set(op.elenco)
  const candidatas = op.pessoas.filter((p) => p.ativo && noElenco.has(p.id))

  const est: Estado = { datas: new Map(), porMes: new Map(), formacoes: new Map() }
  for (const p of candidatas) est.datas.set(p.id, [])

  // A fronteira com o bloco anterior: quem trabalhou em 30/08 não pode cair em 01/09.
  for (const [id, data] of Object.entries(op.ultimaEscalaAnterior ?? {})) {
    if (est.datas.has(id)) est.datas.set(id, [data])
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
      .slice(0, turno.capacidade)

    for (const p of escolhidas) {
      turno.pessoas.push(p.id)
      est.datas.get(p.id)!.push(turno.data)
      est.porMes.set(chaveMes(p.id, turno.data), (est.porMes.get(chaveMes(p.id, turno.data)) ?? 0) + 1)
    }
    const chave = [...turno.pessoas].sort().join('|')
    est.formacoes.set(chave, (est.formacoes.get(chave) ?? 0) + 1)
  }

  return { ok: true, turnos }
}

/**
 * Gera a escala, descobrindo o maior piso de distanciamento que cabe.
 */
export function gerar(op: OpcoesGeracao): Resultado {
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
        geradoEm: deData(new Date()),
        origem: 'algoritmo',
        pisoAlcancado: piso,
        elenco: [...op.elenco],
        malha: op.malha,
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
