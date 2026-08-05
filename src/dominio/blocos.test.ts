/**
 * COMO OS BLOCOS SE ENCAIXAM — a regra que estava escrita DUAS VEZES, à mão.
 *
 * 🔴 POR QUE ESTE ARQUIVO EXISTE. A montagem dos blocos para publicar vivia em dois lugares: no
 * botão Publicar da tela e no `gerar-bloco.mjs`. E as duas divergiam — o script pegava `blocos[0]`
 * e montava `[truncado, novo]`, o que **apagaria o bloco do meio** no dia em que houvesse três.
 * A tela fazia certo; o script, não. Nenhum teste cobria nenhuma das duas.
 *
 * Fonte dupla é onde as duas versões divergem em silêncio — e a que erra é sempre a que ninguém
 * está olhando. Achado por auditoria externa em 05/08/2026.
 *
 * A regra, uma só: **todo bloco anterior sobrevive, truncado na véspera do novo. Truncar é
 * permitido; reescrever o que fica, não.**
 */
import { describe, expect, it } from 'vitest'
import { conferirPassadoPreservado, montarBlocosParaPublicar } from './blocos'
import type { Bloco, Turno } from './tipos'

const turno = (data: string): Turno => ({
  data: data as Turno['data'], tipo: 'NOITE', capacidade: 1, pessoas: ['ana'],
})

const bloco = (id: string, inicio: string, fim: string, datas: string[]): Bloco => ({
  id, inicio: inicio as Bloco['inicio'], fim: fim as Bloco['fim'],
  geradoEm: '2026-08-05', origem: 'algoritmo', pisoAlcancado: null,
  elenco: ['ana'], malha: { regras: [] }, turnos: datas.map(turno),
})

describe('montarBlocosParaPublicar', () => {
  it('🔴 com TRÊS blocos, o do MEIO sobrevive — era o defeito do script', () => {
    const a = bloco('inicio', '2026-03-01', '2026-05-31', ['2026-03-01', '2026-05-30'])
    const b = bloco('meio', '2026-06-01', '2026-08-05', ['2026-06-07', '2026-08-05'])
    const novo = bloco('novo', '2026-08-06', '2026-12-31', ['2026-08-08'])

    const r = montarBlocosParaPublicar([a, b], novo)
    expect(r.map((x) => x.id)).toEqual(['inicio', 'meio', 'novo'])
  })

  it('🔴 só o bloco que se SOBREPÕE é truncado; os de trás ficam intocados', () => {
    const a = bloco('inicio', '2026-03-01', '2026-05-31', ['2026-03-01'])
    const b = bloco('meio', '2026-06-01', '2026-12-31', ['2026-06-07', '2026-09-01'])
    const novo = bloco('novo', '2026-08-06', '2026-12-31', ['2026-08-08'])

    const [i, m] = montarBlocosParaPublicar([a, b], novo)
    expect(i.fim).toBe('2026-05-31')
    expect(i.turnos).toHaveLength(1)
    expect(m.fim).toBe('2026-08-05')
    expect(m.turnos.map((t) => t.data)).toEqual(['2026-06-07'])
  })

  it('sem bloco novo, nada é tocado', () => {
    const a = bloco('a', '2026-03-01', '2026-08-05', ['2026-03-01'])
    expect(montarBlocosParaPublicar([a], null)).toEqual([a])
  })

  it('bloco que começa DEPOIS do novo é descartado — ele seria reescrito de qualquer forma', () => {
    const futuro = bloco('futuro', '2027-01-01', '2027-06-30', ['2027-01-06'])
    const novo = bloco('novo', '2026-08-06', '2026-12-31', ['2026-08-08'])
    expect(montarBlocosParaPublicar([futuro], novo).map((b) => b.id)).toEqual(['novo'])
  })
})

describe('conferirPassadoPreservado — o passado não se reescreve', () => {
  it('aprova quando nenhum turno anterior ao corte se perde', () => {
    const a = bloco('a', '2026-03-01', '2026-05-31', ['2026-03-01', '2026-04-01'])
    const b = bloco('b', '2026-06-01', '2026-08-05', ['2026-06-07'])
    const novo = bloco('novo', '2026-08-06', '2026-12-31', ['2026-08-08'])

    const montados = montarBlocosParaPublicar([a, b], novo)
    expect(conferirPassadoPreservado([a, b], montados, '2026-08-06')).toMatchObject({ antes: 3, depois: 3, ok: true })
  })

  it('🔴 a outra ponta: ACUSA quando um bloco some da montagem', () => {
    const a = bloco('a', '2026-03-01', '2026-05-31', ['2026-03-01', '2026-04-01'])
    const b = bloco('b', '2026-06-01', '2026-08-05', ['2026-06-07'])
    const novo = bloco('novo', '2026-08-06', '2026-12-31', ['2026-08-08'])

    // A montagem ERRADA que o script fazia: joga fora todos menos o último.
    const errada = [{ ...b, fim: '2026-08-05' as Bloco['fim'] }, novo]
    const r = conferirPassadoPreservado([a, b], errada, '2026-08-06')
    expect(r.ok).toBe(false)
    expect(r.antes).toBe(3)
    expect(r.depois).toBe(1)
  })
})
