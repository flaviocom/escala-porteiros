/**
 * O rascunho só vale no dia em que foi feito — pedido do dono em 03/11/2026: um rascunho de 25/10
 * carregava mudanças antigas, invisíveis, e fazia a geração de hoje falhar.
 *
 * O ambiente de teste é Node: o `localStorage` é um dublê de mapa, e o relógio é fixado — o "hoje"
 * em São Paulo sai dele.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { gravarRascunho, lerRascunho, rascunhoDescartado } from './rascunho'
import type { Configuracao } from '../dominio/tipos'

const CONFIG = { versao: 1, capacidadePadrao: 3, malhaPadrao: { regras: [] }, santaCeia: [] } as unknown as Configuracao
const mapa = new Map<string, string>()

beforeEach(() => {
  mapa.clear()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => mapa.get(k) ?? null,
    setItem: (k: string, v: string) => void mapa.set(k, v),
    removeItem: (k: string) => void mapa.delete(k),
  })
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('rascunho — só vale no mesmo dia', () => {
  it('✅ CONTROLE: gravado hoje, lido hoje → volta inteiro', () => {
    vi.setSystemTime(new Date('2026-11-03T13:00:00-03:00'))
    gravarRascunho({ de: '2026-11-04', ate: '2027-12-31', config: CONFIG, pessoas: [] })
    vi.setSystemTime(new Date('2026-11-03T22:30:00-03:00'))
    expect(lerRascunho()?.de).toBe('2026-11-04')
  })

  it('🔴 INFRATOR: gravado ontem → descartado, e apagado do aparelho', () => {
    vi.setSystemTime(new Date('2026-10-25T12:33:00-03:00'))
    gravarRascunho({ de: '2026-11-03', ate: '2027-12-31', config: CONFIG, pessoas: [] })
    vi.setSystemTime(new Date('2026-11-03T20:00:00-03:00'))
    expect(lerRascunho()).toBeNull()
    expect(mapa.size).toBe(0)
  })

  it('🔴 o dia é o de SÃO PAULO, não o UTC: 22h de 03/11 em SP já é 04/11 em UTC', () => {
    vi.setSystemTime(new Date('2026-11-03T22:00:00-03:00'))
    gravarRascunho({ de: '2026-11-04', ate: '2027-12-31', config: CONFIG, pessoas: [] })
    vi.setSystemTime(new Date('2026-11-03T23:50:00-03:00'))
    expect(lerRascunho()).not.toBeNull()
  })

  it('rascunho antigo sem data (versão anterior) → descartado', () => {
    vi.setSystemTime(new Date('2026-11-03T20:00:00-03:00'))
    mapa.set('escala-porteiros:rascunho:v1', JSON.stringify({ de: 'x', ate: 'y', config: CONFIG, pessoas: [], salvoEm: '2026-08-29T03:11:33.779Z' }))
    expect(lerRascunho()).toBeNull()
  })
})

describe('rascunho vencido — o que a tela precisa para decidir se avisa', () => {
  it('guarda o descartado, com o dia, para comparar com o publicado', () => {
    vi.setSystemTime(new Date('2026-10-25T12:33:00-03:00'))
    gravarRascunho({ de: '2026-11-03', ate: '2027-12-31', config: CONFIG, pessoas: [] })
    vi.setSystemTime(new Date('2026-11-03T20:00:00-03:00'))
    expect(lerRascunho()).toBeNull()
    expect(rascunhoDescartado()?.dia).toBe('2026-10-25')
    expect(rascunhoDescartado()?.de).toBe('2026-11-03')
  })
})
