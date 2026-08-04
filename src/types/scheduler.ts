/**
 * Tipos da INTERFACE herdada do site anterior.
 *
 * As telas (`ScheduleTable`, `StatsView`, `MultiSelect`, exportação para o WhatsApp) foram
 * preservadas porque funcionam bem. Elas falam esta linguagem: `Shift` com `Date`, e uma lista
 * `BROTHERS`.
 *
 * 🔴 O QUE MUDOU, E É A MUDANÇA CENTRAL DO PROJETO: antes esta lista era **fixa no código** — 16
 * nomes escritos à mão. Trocar alguém exigia editar o arquivo e refazer o deploy, e a validação
 * procurava as pessoas por nome em texto (`'Thiago'`, `'Williams'`), então remover alguém a deixava
 * inerte, sem erro visível.
 *
 * Agora a lista vem de `dados/pessoas.json` e é preenchida **uma vez, antes de a tela montar**
 * (ver `main.tsx`). Não há corrida: quando o React renderiza, os nomes já estão aqui.
 *
 * O modelo de verdade é `src/dominio/tipos.ts`. Este arquivo é a ponte para a interface antiga.
 */
import type { Pessoa } from '../dominio/tipos'

export type ShiftType = 'MANHÃ' | 'TARDE' | 'NOITE' | 'SANTA_CEIA'

export interface Brother {
  id: string
  name: string
  constraints: {
    fixedPerMonth?: number
    daysAllowed?: number[] // 0=dom … 6=sáb
    shiftsAllowed?: ShiftType[]
    forbiddenDays?: number[]
  }
}

export interface Shift {
  id: string
  date: Date
  type: ShiftType
  assignedBrothers: string[] // IDs
}

/**
 * Preenchida por `definirPessoas()` antes do primeiro render. É `let` exportado — e não `const` —
 * justamente porque a fonte dela agora é um arquivo publicado, não o código.
 */
export let BROTHERS: Brother[] = []

const TURNO_PARA_TELA: Record<string, ShiftType> = { MANHA: 'MANHÃ', TARDE: 'TARDE', NOITE: 'NOITE' }

export function definirPessoas(pessoas: Pessoa[]): void {
  BROTHERS = pessoas
    .filter((p) => p.ativo)
    .map((p) => ({
      id: p.id,
      name: p.nome,
      constraints: {
        ...(p.restricoes.tetoMensal != null ? { fixedPerMonth: p.restricoes.tetoMensal } : {}),
        ...(p.restricoes.diasPermitidos ? { daysAllowed: p.restricoes.diasPermitidos } : {}),
        ...(p.restricoes.diasProibidos?.length ? { forbiddenDays: p.restricoes.diasProibidos } : {}),
        ...(p.restricoes.turnosPermitidos
          ? { shiftsAllowed: p.restricoes.turnosPermitidos.map((t) => TURNO_PARA_TELA[t]) }
          : {}),
      },
    }))
}
