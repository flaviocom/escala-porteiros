/**
 * O ÚLTIMO DIA DO MÊS É O ÚLTIMO — em qualquer fuso.
 *
 * 🔴 POR QUE ESTE ARQUIVO EXISTE. Em 05/08/2026, `ultimoDiaDoMes` nasceu misturando `Date.UTC` com
 * `deData()` (que lê getters locais). Em `America/Sao_Paulo` (UTC−3) ela devolvia o **penúltimo**
 * dia de TODOS os meses, e a regra Q5 passou a julgar como "mês inteiro" um mês faltando um dia —
 * voltando a emitir o aviso falso que aquela mudança existia para eliminar. Ficou VIVO em produção.
 *
 * ⚠️ E O PORTÃO DE FUSO NÃO PEGAVA, POR CONSTRUÇÃO. `test:fuso:berlim` roda em UTC+2, onde
 * `Date.UTC(ano, m, 0)` cai no mesmo dia local. O defeito só morde em fuso **negativo** — e o único
 * fuso alternativo testado é o positivo. A tese *"em UTC−3 um defeito de fuso é invisível"* tem um
 * inverso, e este é ele.
 *
 * Por isso as asserções aqui são **valores absolutos**: elas não dependem de qual fuso está rodando,
 * então acusam tanto em São Paulo quanto em Berlim.
 */
import { describe, expect, it } from 'vitest'
import { construirGrade } from './malha'
import { ultimoDiaDoMes } from './regras'

describe('ultimoDiaDoMes — o último dia é o último, em qualquer fuso', () => {
  it('🔴 meses de 31 dias', () => {
    expect(ultimoDiaDoMes('2026-01')).toBe('2026-01-31')
    expect(ultimoDiaDoMes('2026-08')).toBe('2026-08-31')
    expect(ultimoDiaDoMes('2026-12')).toBe('2026-12-31')
  })

  it('🔴 meses de 30 dias', () => {
    expect(ultimoDiaDoMes('2026-04')).toBe('2026-04-30')
    expect(ultimoDiaDoMes('2026-11')).toBe('2026-11-30')
  })

  it('🔴 fevereiro, comum e bissexto', () => {
    expect(ultimoDiaDoMes('2026-02')).toBe('2026-02-28')
    expect(ultimoDiaDoMes('2024-02')).toBe('2024-02-29')
    expect(ultimoDiaDoMes('2000-02')).toBe('2000-02-29')
    expect(ultimoDiaDoMes('1900-02')).toBe('1900-02-28')
  })

  it('🔴 a virada do ano — dezembro não pode virar janeiro', () => {
    expect(ultimoDiaDoMes('2026-12')).toBe('2026-12-31')
    expect(ultimoDiaDoMes('2027-01')).toBe('2027-01-31')
  })
})

/**
 * 🔴 DAS TRÊS PORTAS DE `construirGrade`, SÓ A DO MEIO TINHA TESTE — sétima auditoria externa.
 *
 * O guarda `ehDataValida` recusa data que não existe no calendário. O único teste que o alcançava
 * usava `fim: '2026-11-31'`. Injetando `if (false) throw` na porta do **início** e na da **Santa
 * Ceia**, os 25 passos do gate saíram verdes.
 */
describe('construirGrade recusa data que não existe — nas TRÊS portas', () => {
  const malha = { regras: [{ diaSemana: 0, turnos: ['NOITE' as const] }] }

  it('🔴 INÍCIO impossível', () => {
    expect(() => construirGrade({ inicio: '2026-02-31', fim: '2026-03-31', malha, capacidadePadrao: 3 }))
      .toThrow(/não existe no calendário/)
  })

  it('🔴 FIM impossível', () => {
    expect(() => construirGrade({ inicio: '2026-03-01', fim: '2026-11-31', malha, capacidadePadrao: 3 }))
      .toThrow(/não existe no calendário/)
  })

  it('🔴 SANTA CEIA impossível', () => {
    expect(() => construirGrade({ inicio: '2026-03-01', fim: '2026-03-31', malha, capacidadePadrao: 3, santaCeia: ['2026-02-30'] }))
      .toThrow(/não existe no calendário/)
  })

  it('a outra ponta: as três datas reais passam', () => {
    expect(() => construirGrade({ inicio: '2026-03-01', fim: '2026-03-31', malha, capacidadePadrao: 3, santaCeia: ['2026-03-08'] }))
      .not.toThrow()
  })
})
