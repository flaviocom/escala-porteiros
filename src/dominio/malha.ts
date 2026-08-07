/**
 * MALHA — quais dias têm culto, e com que turnos.
 *
 * No site anterior isto era código: um `if (diaDaSemana === 0) …` dentro do gerador. E a malha
 * **já mudou uma vez** — na versão da reforma virou terça e sexta à noite, com domingos de manhã a
 * cada 14 dias. Trocar a malha exigiu reescrever o gerador e refazer o deploy.
 *
 * Aqui a malha é **dado**. Trocar dias e turnos é editar configuração, não código.
 */
import { diaDaSemana, diferencaEmDias, ehDataValida, intervaloDeDatas, ocorrenciaNoMes, type DataISO } from './datas'
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
 * Este dia teria culto nesta malha?
 *
 * Exportado para o guarda de continuidade (`conferirBuracoNaEscala`): sem ele, o guarda teria de
 * reimplementar a malha, e fonte dupla é o que produziu metade dos defeitos deste projeto.
 */
export function diaTemCulto(data: DataISO, malha: Malha): boolean {
  return malha.regras.some((r) => regraValeEm(r, data))
}

/**
 * Constrói a grade vazia de turnos do período.
 *
 * Dia de Santa Ceia entra como **um** turno marcado, sem vagas, substituindo os turnos que aquele
 * dia teria. É o que o Flavio descreveu: *"vêm irmãos de outra igreja atender à Santa Ceia, no lugar
 * dos irmãos escalados"*.
 */
export function construirGrade(op: OpcoesMalha): Turno[] {
  /*
    🔴 DATA QUE NÃO EXISTE ENTRAVA E VIRAVA TURNO — quinta auditoria externa, 05/08/2026.

    `ehDataValida` estava escrita, exportada e provada em quatro testes — e não tinha **um único
    chamador em produção**. Medido: com `inicio = "2026-02-31"`, o produto gerava um turno em 31 de
    fevereiro, pulava 01 a 03 de março, e o veredito era *"Aprovada, sem ressalvas."* Nenhuma das
    dezesseis regras confere se a data existe no calendário, e nenhuma tem por quê: isso é conferência
    de ENTRADA, e ela pertence à porta por onde a entrada passa.

    Aqui é essa porta — a única por onde toda geração passa, tanto a da tela quanto a dos scripts.
  */
  if (!ehDataValida(op.inicio)) throw new Error(`Data inicial "${op.inicio}" não existe no calendário.`)
  if (!ehDataValida(op.fim)) throw new Error(`Data final "${op.fim}" não existe no calendário.`)
  for (const d of op.santaCeia ?? [])
    if (!ehDataValida(d)) throw new Error(`Data de Santa Ceia "${d}" não existe no calendário.`)

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

/**
 * A malha que a congregação usa hoje: dom manhã+noite · qua noite · sáb noite · 1º sáb tarde.
 *
 * 🔴 ESTA CONSTANTE É A FRONTEIRA DA FASE 2 — requisito do dono, 07/08/2026 (S-048):
 * *"é muito importante ser parametrizável (…) o dia da semana e o horário de início e fim; pode se
 * repetir no mesmo dia (…) escala ampla, não religiosa: porteiros de prédio, segurança."*
 *
 * O MODELO (`RegraMalha`) já cobre quase tudo — dois eventos no mesmo dia, "1º sábado do mês"
 * (`somenteOcorrencia`), rótulo livre, capacidade por regra. O que falta, e mora AQUI: (1) a malha
 * é CRAVADA nesta constante em vez de vir da configuração editável na tela; (2) o evento é um TIPO
 * fixo (MANHA/TARDE/NOITE) em vez de horário real de início e fim; (3) não há evento avulso em data
 * específica; (4) o vocabulário (culto/ensaio/Santa Ceia) não é configurável. O desenho completo,
 * com o mapa "já existe × falta", está em `docs/FASE2.md` (§ malha parametrizável).
 */
export const MALHA_ATUAL: Malha = {
  regras: [
    { diaSemana: 0, turnos: ['MANHA', 'NOITE'] },
    { diaSemana: 3, turnos: ['NOITE'] },
    { diaSemana: 6, turnos: ['NOITE'] },
    { diaSemana: 6, turnos: ['TARDE'], somenteOcorrencia: 1, rotulo: 'ENSAIO' },
  ],
}
