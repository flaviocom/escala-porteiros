/**
 * O filtro da escala, num lugar só.
 *
 * 🔴 Por que virou função: ele morava **dentro** do `ScheduleTable`. Enquanto a imagem era uma
 * fotografia da tela, isso bastava. Com a imagem tendo layout próprio, "exportar o que está
 * aparecendo" passou a exigir o mesmo filtro em dois lugares — e duas cópias de uma regra é onde as
 * duas divergem em silêncio.
 *
 * A tela e a imagem chamam **esta** função. Se o filtro mudar, muda para as duas.
 */
import { format, isSameDay, isSameMonth, isWithinInterval, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BROTHERS, type Shift } from '../types/scheduler'

export interface CriteriosDeFiltro {
  selectedBrotherIds: string[]
  selectedMonthStrs: string[]
  dateSearchQuery?: string
  dateRange?: { start: Date | null; end: Date | null } | null
}

/** Sem acento e em minúsculas: "Luíz" e "luiz" precisam casar. */
const normalizar = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function filtrarTurnos(shifts: Shift[], c: CriteriosDeFiltro): Shift[] {
  const { selectedBrotherIds, selectedMonthStrs, dateSearchQuery, dateRange } = c

  return shifts.filter((shift) => {
    // 1. Intervalo de datas
    if (dateRange?.start && dateRange?.end) {
      if (!isWithinInterval(shift.date, { start: dateRange.start, end: dateRange.end })) return false
    }

    // 2. Busca livre — data, mês, dia da semana ou nome
    if (dateSearchQuery) {
      const query = normalizar(dateSearchQuery).trim()
      let ehTextoDoIntervalo = false

      if (dateRange?.start && dateRange?.end) {
        const rotulo = isSameDay(dateRange.start, dateRange.end)
          ? format(dateRange.start, 'dd/MM/yyyy')
          : `${format(dateRange.start, 'dd/MM')} - ${format(dateRange.end, 'dd/MM')}`
        if (query === normalizar(rotulo)) ehTextoDoIntervalo = true
      }

      if (!ehTextoDoIntervalo) {
        const casaData =
          format(shift.date, 'dd/MM/yyyy').includes(query) ||
          format(shift.date, 'dd/MM').includes(query) ||
          format(shift.date, 'd/M').includes(query) ||
          format(shift.date, 'd/M/yyyy').includes(query) ||
          normalizar(format(shift.date, 'MMMM', { locale: ptBR })).includes(query)

        const casaDia = normalizar(format(shift.date, 'EEEE', { locale: ptBR })).includes(query)

        const casaIrmao = shift.assignedBrothers.some((id) => {
          const b = BROTHERS.find((x) => x.id === id)
          return b && normalizar(b.name).includes(query)
        })

        if (!casaData && !casaDia && !casaIrmao) return false
      }
    }

    // 3. Meses escolhidos
    if (selectedMonthStrs.length > 0) {
      if (!selectedMonthStrs.some((m) => isSameMonth(parseISO(m), shift.date))) return false
    }

    // 4. Irmãos escolhidos
    if (selectedBrotherIds.length > 0) {
      if (!shift.assignedBrothers.some((id) => selectedBrotherIds.includes(id))) return false
    }

    return true
  })
}
