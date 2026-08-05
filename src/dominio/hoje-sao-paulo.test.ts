/**
 * 🔴 `hojeSaoPaulo` ESTAVA PROTEGIDA CONTRA A FORMA ERRADA, NÃO CONTRA O VALOR ERRADO.
 *
 * Sexta auditoria externa, 05/08/2026. Não havia teste unitário dela: quem a protegia era o
 * `portao-datas`, que casa TEXTO. Medido com dois mutantes:
 *
 *     `return new Date().toISOString().slice(0, 10)`   → `npm run test` EXIT=0 · `npm run datas` EXIT=1 ✅
 *     `return deData(new Date())`                       → os 20 passos do gate, EXIT=0 🔴
 *
 * O segundo é o perigoso: lê a data da **máquina**. Num navegador em Lisboa às 21h de São Paulo, o
 * `min` do campo de data e a trava contra geração retroativa passam a usar o dia errado — e a trava
 * é a primeira regra inviolável deste projeto.
 *
 * ⚠️ Estes testes fixam o RELÓGIO, não o fuso. Comparar `hojeSaoPaulo()` com outro cálculo do "hoje"
 * seria escrever o defeito duas vezes; aqui a resposta é um valor absoluto, sabido de antemão.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { hojeSaoPaulo } from './datas'

afterEach(() => vi.useRealTimers())

/** Congela o relógio num instante UTC exato. */
function em(instanteUtc: string) {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(instanteUtc))
}

describe('hojeSaoPaulo — o dia em São Paulo, não o da máquina', () => {
  it('🔴 às 21h de São Paulo (00h UTC do dia seguinte) ainda é HOJE aqui', () => {
    // 06/08/2026 00:30 UTC = 05/08/2026 21:30 em São Paulo (UTC−3).
    em('2026-08-06T00:30:00Z')
    expect(hojeSaoPaulo()).toBe('2026-08-05')
  })

  it('🔴 às 02h UTC continua sendo o dia anterior em São Paulo', () => {
    em('2026-01-01T02:00:00Z')
    expect(hojeSaoPaulo()).toBe('2025-12-31')
  })

  it('às 12h UTC os dois calendários coincidem', () => {
    em('2026-08-05T12:00:00Z')
    expect(hojeSaoPaulo()).toBe('2026-08-05')
  })

  it('🔴 às 03h01 UTC já virou o dia em São Paulo — a outra borda', () => {
    em('2026-08-05T03:01:00Z')
    expect(hojeSaoPaulo()).toBe('2026-08-05')
  })

  it('a forma é sempre AAAA-MM-DD, com zero à esquerda', () => {
    em('2026-03-07T15:00:00Z')
    expect(hojeSaoPaulo()).toBe('2026-03-07')
    expect(hojeSaoPaulo()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
