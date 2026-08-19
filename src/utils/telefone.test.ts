/**
 * Formato confirmado contra código de referência real na VPS do Charmway (skill
 * `int-evolution-api`, `_format_number`, 19/08/2026) — não é suposição.
 */
import { describe, it, expect } from 'vitest'
import { normalizarTelefone, formatarTelefone } from './telefone'

describe('normalizarTelefone — sempre dígitos com DDI 55, ou vazio', () => {
  it('celular sem DDI, com formatação — o caso comum de digitação', () => {
    expect(normalizarTelefone('(11) 99999-9999')).toBe('5511999999999')
  })

  it('já com +55 e formatação', () => {
    expect(normalizarTelefone('+55 11 99999-9999')).toBe('5511999999999')
  })

  it('só dígitos, sem DDI', () => {
    expect(normalizarTelefone('11999999999')).toBe('5511999999999')
  })

  it('já normalizado — idempotente', () => {
    expect(normalizarTelefone('5511999999999')).toBe('5511999999999')
  })

  it('fixo (10 dígitos com DDD) também aceita — quem decide se é WhatsApp é a Evolution API', () => {
    expect(normalizarTelefone('1133334444')).toBe('551133334444')
  })

  it('vazio devolve vazio, sem explodir', () => {
    expect(normalizarTelefone('')).toBe('')
  })

  it('lixo sem tamanho plausível devolve vazio, para a tela recusar', () => {
    expect(normalizarTelefone('123')).toBe('')
    expect(normalizarTelefone('abc')).toBe('')
  })
})

describe('formatarTelefone — só para EXIBIR, nunca para guardar', () => {
  it('celular normalizado vira (DDD) NNNNN-NNNN', () => {
    expect(formatarTelefone('5511999999999')).toBe('(11) 99999-9999')
  })

  it('fixo normalizado vira (DDD) NNNN-NNNN', () => {
    expect(formatarTelefone('551133334444')).toBe('(11) 3333-4444')
  })

  it('fora do formato devolve como veio, sem inventar', () => {
    expect(formatarTelefone('')).toBe('')
    expect(formatarTelefone('123')).toBe('123')
  })
})
