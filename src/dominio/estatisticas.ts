/**
 * A DISTRIBUIÇÃO — quantos turnos cada um pegou, por mês e por tipo de turno.
 *
 * 🔴 POR QUE ESTE ARQUIVO EXISTE, e por que ele é de DOMÍNIO e não de tela. Em 06/08/2026 o dono
 * pediu, na área administrativa, uma tabela de distribuição como a que a tela pública já tem —
 * *"somente das datas no intervalo de datas selecionado em De–Até"*.
 *
 * A saída fácil seria contar de novo dentro do componente novo. Seriam **duas réguas medindo a mesma
 * coisa**, e este projeto já pagou por isso: gerador e validação divergiam no site anterior, e a
 * divergência era invisível porque ninguém rodava os dois juntos. Duas contagens de turno teriam o
 * mesmo destino — divergiriam num caso de borda (o dia 1º, o mês virado, quem saiu do elenco) e a
 * tela administrativa mostraria um número que a tela pública desmente, sem ninguém notar.
 *
 * Então a contagem mora aqui, em função pura sobre os tipos do domínio, e **as duas telas consomem
 * esta**. Criar a fonte única sem migrar os consumidores não conserta nada.
 *
 * ── O QUE ESTA CONTAGEM DECIDE, e que a tela não deveria decidir sozinha ─────────────────────────
 *
 * **Quem aparece.** Todo mundo que tem turno no período, mais quem está ativo mesmo com zero. Os dois
 * lados importam: quem saiu do elenco continua contando o que já fez (nada é apagado), e quem está
 * ativo com **zero turnos** precisa ficar visível — é justamente o caso que se quer enxergar.
 *
 * ⚠️ **Id desconhecido vira linha, não sumiço.** A tela pública já teve um `if (counts[id])` que
 * descartava em silêncio o turno de quem não estivesse na lista: os cultos de quem saía do elenco
 * evaporavam do total. Aqui, id sem pessoa cadastrada aparece com o próprio id como nome — feio de
 * propósito, porque um número menor ninguém confere e um nome estranho na tela alguém pergunta.
 */
import type { DataISO } from './datas'
import type { Pessoa, TipoTurno, Turno } from './tipos'

export interface LinhaDeDistribuicao {
  id: string
  nome: string
  /** `false` para quem saiu do elenco — a tela marca, e os turnos continuam contando. */
  ativo: boolean
  total: number
  /** Chave `AAAA-MM` → quantos turnos naquele mês. */
  porMes: Record<string, number>
  porTipo: Record<TipoTurno, number>
  /** Teto mensal, quando a pessoa tem um. É o que a tira da conta de equilíbrio. */
  tetoMensal?: number
}

export interface Distribuicao {
  /** Meses `AAAA-MM` presentes no período, em ordem. */
  meses: string[]
  /** Tipos de turno que o período realmente tem — não a lista completa do domínio. */
  tipos: TipoTurno[]
  linhas: LinhaDeDistribuicao[]
  /**
   * Menor e maior total entre quem está ativo **e não tem teto mensal** — ver `comTeto`.
   */
  menor: number | null
  maior: number | null
  /**
   * 🔴 QUEM TEM TETO FICA FORA DA CONTA DE EQUILÍBRIO, E É NOMEADO — 06/08/2026.
   *
   * A primeira versão comparava todo mundo e a tela dizia *"diferença de 12 turnos"*, em âmbar, sobre
   * a escala de um ano. Medido: os 12 eram **inteiros** o teto do Williams — 3 por mês × 12 meses =
   * 36, contra 48 de quem não tem teto. Não havia desequilíbrio nenhum. O número estava certo e a
   * leitura era falsa.
   *
   * É a mesma armadilha que o dono apontou horas antes, noutro aviso: *"quando um aviso precisa ser
   * interpretado, ele ainda não está pronto"*. Um alarme que dispara sobre uma restrição que ele
   * mesmo cadastrou treina a ignorar o alarme — e aí ele deixa de servir no dia em que houver
   * desequilíbrio de verdade.
   *
   * Some fora da conta **e aparece por nome**, com o teto e o total: quem foi tirado da comparação
   * tem de ficar visível, senão o número de cima passa a esconder gente.
   */
  comTeto: { nome: string; tetoMensal: number; total: number }[]
}

/**
 * Mês de uma data ISO.
 *
 * 🔴 Fatia da string, e não `new Date(...).getMonth()`, de propósito. `new Date('2026-08-01')` é
 * interpretado como **meia-noite UTC**, que em qualquer fuso negativo é 31/07 — o dia 1º cairia no
 * mês anterior, exatamente o defeito que `mesDeData` documenta do outro lado. Uma data ISO já traz o
 * mês escrito; convertê-la para `Date` só para lê-lo é criar a chance de errar.
 */
const mesDaISO = (d: DataISO): string => d.slice(0, 7)

export function distribuir(turnos: Turno[], pessoas: Pessoa[]): Distribuicao {
  const porId = new Map(pessoas.map((p) => [p.id, p]))
  const linhas = new Map<string, LinhaDeDistribuicao>()
  const meses = new Set<string>()
  const tipos = new Set<TipoTurno>()

  const garantir = (id: string): LinhaDeDistribuicao => {
    let l = linhas.get(id)
    if (!l) {
      const p = porId.get(id)
      l = {
        id,
        // Id sem pessoa cadastrada mostra o próprio id — ver a nota do cabeçalho.
        nome: p?.nome ?? id,
        ativo: p?.ativo ?? false,
        total: 0,
        porMes: {},
        porTipo: { MANHA: 0, TARDE: 0, NOITE: 0 },
        ...(p?.restricoes.tetoMensal != null ? { tetoMensal: p.restricoes.tetoMensal } : {}),
      }
      linhas.set(id, l)
    }
    return l
  }

  // Quem está ativo entra ANTES da contagem: assim quem ficou com zero turnos aparece com zero, em
  // vez de sumir da tabela. Ausência que não aparece é a que ninguém investiga.
  for (const p of pessoas) if (p.ativo) garantir(p.id)

  for (const t of turnos) {
    const mes = mesDaISO(t.data)
    meses.add(mes)
    tipos.add(t.tipo)
    for (const id of t.pessoas) {
      const l = garantir(id)
      l.total++
      l.porMes[mes] = (l.porMes[mes] ?? 0) + 1
      l.porTipo[t.tipo]++
    }
  }

  /*
    A ordem: ativos primeiro, depois por nome. Não por total — ordenar por carga faria a tabela
    reordenar sozinha a cada geração, e comparar duas gerações lado a lado ficaria impossível.
  */
  const ordenadas = [...linhas.values()].sort(
    (a, b) => Number(b.ativo) - Number(a.ativo) || a.nome.localeCompare(b.nome, 'pt-BR'),
  )

  /*
    Equilíbrio é sobre quem está ATIVO e SEM TETO. Duas exclusões, cada uma pelo mesmo motivo: quem
    saiu costuma ter parado no meio do período, e quem tem teto está limitado de propósito. Os dois
    entrariam na conta como desequilíbrio, e nenhum dos dois é.
  */
  const comparaveis = ordenadas.filter((l) => l.ativo && l.tetoMensal == null).map((l) => l.total)
  return {
    meses: [...meses].sort(),
    tipos: (['MANHA', 'TARDE', 'NOITE'] as TipoTurno[]).filter((t) => tipos.has(t)),
    linhas: ordenadas,
    menor: comparaveis.length ? Math.min(...comparaveis) : null,
    maior: comparaveis.length ? Math.max(...comparaveis) : null,
    comTeto: ordenadas
      .filter((l) => l.ativo && l.tetoMensal != null)
      .map((l) => ({ nome: l.nome, tetoMensal: l.tetoMensal!, total: l.total })),
  }
}
