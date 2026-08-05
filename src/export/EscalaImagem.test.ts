/**
 * 🔒 A LÓGICA DA IMAGEM — o que dá para errar sem que apareça no pixel.
 *
 * O desenho se confere olhando. Estas quatro coisas, não: se um dia com manhã e noite virar dois
 * cartões, se a noite aparecer antes da manhã, se a Santa Ceia entrar na contagem de turnos, ou se
 * ela sumir da legenda — nada disso grita numa imagem bonita.
 *
 * O modelo é `D:\Documentos\CCB_Escalas\Porteiros\escalaagosto2026.png`, que o Flavio usa hoje.
 */
import { describe, expect, it } from 'vitest'
import { porDia, resumirPeriodo } from './EscalaImagem'
import type { Shift, ShiftType } from '../types/scheduler'

const t = (dia: number, tipo: ShiftType, pessoas: string[]): Shift => ({
  id: `2026-08-${String(dia).padStart(2, '0')}-${tipo}`,
  date: new Date(2026, 7, dia, 12),
  type: tipo,
  assignedBrothers: pessoas,
})

describe('porDia — um cartão por DIA, não por turno', () => {
  it('junta manhã e noite do mesmo domingo num cartão só', () => {
    const dias = porDia([t(2, 'NOITE', ['a']), t(2, 'MANHÃ', ['b'])])
    expect(dias).toHaveLength(1)
    expect(dias[0]).toHaveLength(2)
  })

  it('🔴 e a MANHÃ vem antes da NOITE, mesmo entrando fora de ordem', () => {
    const [dia] = porDia([t(2, 'NOITE', ['a']), t(2, 'MANHÃ', ['b'])])
    expect(dia.map((s) => s.type)).toEqual(['MANHÃ', 'NOITE'])
  })

  it('o ENSAIO de sábado vem antes da noite dele', () => {
    const [dia] = porDia([t(1, 'NOITE', ['a']), t(1, 'TARDE', ['b'])])
    expect(dia.map((s) => s.type)).toEqual(['TARDE', 'NOITE'])
  })

  it('dias diferentes ficam em cartões diferentes, em ordem de data', () => {
    const dias = porDia([t(9, 'NOITE', ['a']), t(2, 'NOITE', ['b']), t(5, 'NOITE', ['c'])])
    expect(dias.map((d) => d[0].date.getDate())).toEqual([2, 5, 9])
  })
})

describe('resumirPeriodo — o que o cabeçalho e a legenda afirmam', () => {
  const AGOSTO = [
    t(1, 'TARDE', ['a', 'b', 'c']),
    t(1, 'NOITE', ['d', 'e', 'f']),
    t(2, 'MANHÃ', ['a', 'b', 'c']),
    t(16, 'SANTA_CEIA', []),
  ]

  it('🔴 Santa Ceia NÃO entra na contagem de turnos — é dia sem porteiros', () => {
    expect(resumirPeriodo(AGOSTO).resumo).toBe('3 turnos · 1 Santa Ceia')
  })

  it('sem Santa Ceia no período, a contagem não inventa a menção', () => {
    expect(resumirPeriodo(AGOSTO.slice(0, 3)).resumo).toBe('3 turnos')
  })

  it('🔴 a legenda mostra a SANTA CEIA quando ela existe — era a cor sem explicação', () => {
    expect(resumirPeriodo(AGOSTO).presentes).toEqual(['MANHÃ', 'TARDE', 'NOITE', 'SANTA_CEIA'])
  })

  it('e não mostra turno que não acontece no período', () => {
    expect(resumirPeriodo([t(5, 'NOITE', ['a'])]).presentes).toEqual(['NOITE'])
  })

  it('um mês só → "AGOSTO / 2026"', () => {
    const { titulo } = resumirPeriodo(AGOSTO)
    expect(titulo).toEqual({ linha1: 'AGOSTO', linha2: '2026' })
  })

  it('vários meses → o intervalo real, não o primeiro mês', () => {
    const { titulo } = resumirPeriodo([t(5, 'NOITE', ['a']), { ...t(5, 'NOITE', ['b']), date: new Date(2026, 11, 30, 12) }])
    expect(titulo).toEqual({ linha1: 'AGO – DEZ', linha2: '2026' })
  })

  it('período vazio não quebra nem inventa data', () => {
    const r = resumirPeriodo([])
    expect(r.inicio).toBeUndefined()
    expect(r.titulo).toEqual({ linha1: '', linha2: '' })
    expect(r.resumo).toBe('0 turnos')
  })
})
