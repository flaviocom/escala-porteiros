/**
 * MALHA — quais dias têm culto, e com que turnos.
 *
 * No site anterior isto era código: um `if (diaDaSemana === 0) …` dentro do gerador. E a malha
 * **já mudou uma vez** — na versão da reforma virou terça e sexta à noite, com domingos de manhã a
 * cada 14 dias. Trocar a malha exigiu reescrever o gerador e refazer o deploy.
 *
 * Aqui a malha é **dado**. Trocar dias e turnos é editar configuração, não código.
 */
import { diaDaSemana, diferencaEmDias, intervaloDeDatas, ocorrenciaNoMes, type DataISO } from './datas'
import type { Malha, Turno } from './tipos'

export interface OpcoesMalha {
  inicio: DataISO
  fim: DataISO
  malha: Malha
  capacidadePadrao: number
  /** Datas de Santa Ceia. Nesses dias não se escala ninguém. */
  santaCeia?: DataISO[]
}

/** Uma regra vale nesta data? */
function regraValeEm(regra: Malha['regras'][number], data: DataISO): boolean {
  if (diaDaSemana(data) !== regra.diaSemana) return false

  if (regra.somenteOcorrencia != null && ocorrenciaNoMes(data) !== regra.somenteOcorrencia) return false

  if (regra.cadaNDias != null) {
    if (!regra.ancora) return false
    const delta = diferencaEmDias(regra.ancora, data)
    if (delta < 0 || delta % regra.cadaNDias !== 0) return false
  }
  return true
}

/**
 * Constrói a grade vazia de turnos do período.
 *
 * Dia de Santa Ceia entra como **um** turno marcado, sem vagas, substituindo os turnos que aquele
 * dia teria. É o que o Flavio descreveu: *"vêm irmãos de outra igreja atender à Santa Ceia, no lugar
 * dos irmãos escalados"*.
 */
export function construirGrade(op: OpcoesMalha): Turno[] {
  const ceias = new Set(op.santaCeia ?? [])
  const turnos: Turno[] = []

  for (const data of intervaloDeDatas(op.inicio, op.fim)) {
    if (ceias.has(data)) {
      // Só marca o dia se ele teria culto — Santa Ceia numa quinta-feira sem culto
      // não precisa aparecer na escala.
      const teriaCulto = op.malha.regras.some((r) => regraValeEm(r, data))
      if (teriaCulto) {
        turnos.push({ data, tipo: 'MANHA', pessoas: [], capacidade: 0, santaCeia: true, rotulo: 'SANTA CEIA' })
      }
      continue
    }

    for (const regra of op.malha.regras) {
      if (!regraValeEm(regra, data)) continue
      for (const tipo of regra.turnos) {
        turnos.push({
          data,
          tipo,
          pessoas: [],
          capacidade: regra.capacidade ?? op.capacidadePadrao,
          ...(regra.rotulo ? { rotulo: regra.rotulo } : {}),
        })
      }
    }
  }

  // Ordem cronológica estável: por data e, no mesmo dia, manhã → tarde → noite.
  const peso: Record<Turno['tipo'], number> = { MANHA: 0, TARDE: 1, NOITE: 2 }
  return turnos.sort((a, b) => (a.data === b.data ? peso[a.tipo] - peso[b.tipo] : a.data < b.data ? -1 : 1))
}

/** A malha que a congregação usa hoje: dom manhã+noite · qua noite · sáb noite · 1º sáb tarde. */
export const MALHA_ATUAL: Malha = {
  regras: [
    { diaSemana: 0, turnos: ['MANHA', 'NOITE'] },
    { diaSemana: 3, turnos: ['NOITE'] },
    { diaSemana: 6, turnos: ['NOITE'] },
    { diaSemana: 6, turnos: ['TARDE'], somenteOcorrencia: 1, rotulo: 'ENSAIO' },
  ],
}
