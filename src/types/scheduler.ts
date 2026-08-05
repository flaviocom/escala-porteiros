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
  /**
   * `false` = saiu do elenco. **Continua na lista mesmo assim**, e é isto que preserva o passado:
   * os blocos já publicados referenciam a pessoa por `id`, e a tela precisa saber o nome dela para
   * desenhar março. Quem escala é o domínio, que filtra por `ativo` no lugar certo.
   */
  ativo: boolean
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

/**
 * 🔴 SEM `.filter(ativo)` — e a ausência dele é a correção, não um esquecimento.
 *
 * A versão anterior filtrava aqui, e com isso recriava na tela exatamente o órfão que o
 * `dominio/tipos.ts` proíbe: *"apagá-la deixaria o histórico com nomes órfãos"*. O defeito era
 * **latente** — com as 16 pessoas ativas, nada aparecia — e acordaria no primeiro uso do recurso
 * que originou o projeto: alguém sair da escala.
 *
 * Quatro coisas quebravam de uma vez: as estatísticas perdiam os turnos passados da pessoa
 * (`if (counts[bId])` descartava em silêncio), a busca por nome não a encontrava, a escala mostrava
 * o `id` cru (`|| id`) e o filtro "Minha Escala" não a listava.
 *
 * **Filtrar por `ativo` é decisão de QUEM ESCALA, não de quem desenha.** O domínio já filtra —
 * `gerar()` recebe o elenco e `podeAssumir` barra inativo (regra D8). Aqui, o certo é lembrar de
 * todos.
 */
export function definirPessoas(pessoas: Pessoa[]): void {
  BROTHERS = pessoas
    .map((p) => ({
      id: p.id,
      name: p.nome,
      ativo: p.ativo,
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
