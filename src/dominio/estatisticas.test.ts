/**
 * Testes da DISTRIBUIÇÃO. O que interessa aqui não é somar — é o que a soma decide sobre quem
 * aparece, e é aí que a versão anterior desta contagem (dentro da tela pública) já errou uma vez,
 * descartando em silêncio o turno de quem tinha saído do elenco.
 */
import { describe, expect, it } from 'vitest'
import { distribuir } from './estatisticas'
import type { DataISO } from './datas'
import type { Pessoa, Turno } from './tipos'

const p = (id: string, nome: string, ativo = true): Pessoa => ({ id, nome, ativo, restricoes: {} })
const t = (data: string, tipo: Turno['tipo'], ...pessoas: string[]): Turno =>
  ({ data: data as DataISO, tipo, pessoas, capacidade: 3 })

describe('distribuição por pessoa, mês e tipo', () => {
  const pessoas = [p('a', 'Ana'), p('b', 'Bruno'), p('c', 'Carlos', false)]
  const turnos = [
    t('2026-08-02', 'MANHA', 'a', 'b'),
    t('2026-08-02', 'NOITE', 'a', 'c'),
    t('2026-09-06', 'MANHA', 'b'),
  ]

  it('conta por mês e por tipo, e o total bate com a soma dos meses', () => {
    const d = distribuir(turnos, pessoas)
    const ana = d.linhas.find((l) => l.id === 'a')!
    expect(ana.total).toBe(2)
    expect(ana.porMes).toEqual({ '2026-08': 2 })
    expect(ana.porTipo).toEqual({ MANHA: 1, TARDE: 0, NOITE: 1 })
    for (const l of d.linhas) {
      expect(Object.values(l.porMes).reduce((s, n) => s + n, 0)).toBe(l.total)
      expect(Object.values(l.porTipo).reduce((s, n) => s + n, 0)).toBe(l.total)
    }
  })

  it('só declara os meses e os tipos que o PERÍODO tem — não a lista completa do domínio', () => {
    const d = distribuir(turnos, pessoas)
    expect(d.meses).toEqual(['2026-08', '2026-09'])
    expect(d.tipos).toEqual(['MANHA', 'NOITE']) // não existe TARDE neste período
  })

  it('🔴 quem SAIU do elenco continua contando — nada é apagado', () => {
    const d = distribuir(turnos, pessoas)
    const carlos = d.linhas.find((l) => l.id === 'c')!
    expect(carlos.total).toBe(1)
    expect(carlos.ativo).toBe(false)
  })

  it('🔴 quem está ATIVO com ZERO turnos aparece — é o caso que se quer enxergar', () => {
    const d = distribuir([t('2026-08-02', 'MANHA', 'a')], pessoas)
    const bruno = d.linhas.find((l) => l.id === 'b')
    expect(bruno).toBeDefined()
    expect(bruno!.total).toBe(0)
  })

  it('🔴 id sem pessoa cadastrada vira LINHA, não sumiço silencioso', () => {
    const d = distribuir([t('2026-08-02', 'MANHA', 'fantasma')], pessoas)
    const f = d.linhas.find((l) => l.id === 'fantasma')
    expect(f).toBeDefined()
    expect(f!.nome).toBe('fantasma') // feio de propósito: alguém pergunta
    expect(f!.total).toBe(1)
  })

  it('o equilíbrio olha só quem está ATIVO — quem saiu no meio distorceria a diferença', () => {
    const d = distribuir(turnos, pessoas)
    // Ana 2, Bruno 2, Carlos (inativo) 1 — a diferença é 0, não 1.
    expect(d.menor).toBe(2)
    expect(d.maior).toBe(2)
  })

  it('sem turnos e sem ninguém ativo, não inventa menor nem maior', () => {
    const d = distribuir([], [p('c', 'Carlos', false)])
    expect(d.menor).toBeNull()
    expect(d.maior).toBeNull()
    expect(d.comTeto).toEqual([])
  })

  /*
    🔴 O CASO QUE MEDIU ERRADO NA TELA, 06/08/2026. Com os dados reais, a tabela anunciava
    "diferença de 12 turnos" em âmbar sobre uma escala de um ano — e os 12 eram INTEIROS o teto do
    Williams (3/mês × 12 = 36, contra 48 de quem não tem teto). O número estava certo e a leitura era
    falsa. Um alarme que dispara sobre uma restrição que o próprio dono cadastrou treina a ignorar o
    alarme.
  */
  describe('quem tem teto mensal sai da conta de equilíbrio — e é NOMEADO', () => {
    const comTeto: Pessoa = { id: 'w', nome: 'Williams', ativo: true, restricoes: { tetoMensal: 1 } }
    const elenco = [p('a', 'Ana'), p('b', 'Bruno'), comTeto]
    const turnos = [
      t('2026-08-02', 'MANHA', 'a', 'b', 'w'),
      t('2026-08-09', 'MANHA', 'a', 'b'),
      t('2026-08-16', 'MANHA', 'a', 'b'),
    ]

    it('o menor e o maior ignoram quem tem teto', () => {
      const d = distribuir(turnos, elenco)
      // Ana 3, Bruno 3, Williams 1 (teto). Sem a exclusão, menor seria 1 e a diferença, 2.
      expect(d.menor).toBe(3)
      expect(d.maior).toBe(3)
    })

    it('🔴 e quem saiu da conta aparece por NOME, com o teto e o total', () => {
      const d = distribuir(turnos, elenco)
      expect(d.comTeto).toEqual([{ nome: 'Williams', tetoMensal: 1, total: 1 }])
    })

    it('quem tem teto continua na tabela, com os números dele', () => {
      const d = distribuir(turnos, elenco)
      const w = d.linhas.find((l) => l.id === 'w')!
      expect(w.total).toBe(1)
      expect(w.tetoMensal).toBe(1)
    })

    it('se TODO MUNDO tem teto, não inventa uma comparação — devolve nulo e nomeia todos', () => {
      const d = distribuir([t('2026-08-02', 'MANHA', 'w')], [comTeto])
      expect(d.menor).toBeNull()
      expect(d.maior).toBeNull()
      expect(d.comTeto).toHaveLength(1)
    })
  })

  /*
    🔴 O DIA 1º É O CASO QUE MORDE. `new Date('2026-08-01')` é meia-noite UTC, que em qualquer fuso
    negativo cai em 31/07 — o turno do dia 1º contaria no mês anterior, calado. Este teste não depende
    do fuso de quem roda porque a contagem nunca converte a data para `Date`.
  */
  it('🔴 o turno do dia 1º conta no mês DELE, em qualquer fuso', () => {
    const d = distribuir([t('2026-08-01', 'NOITE', 'a')], [p('a', 'Ana')])
    expect(d.meses).toEqual(['2026-08'])
    expect(d.linhas.find((l) => l.id === 'a')!.porMes).toEqual({ '2026-08': 1 })
  })

  it('a ordem é ativos primeiro e depois por nome — nunca por carga, que reordenaria a cada geração', () => {
    // Turnos próprios, sem o `b`: a lista de pessoas aqui não o inclui, e ele viraria (com razão)
    // uma linha de id desconhecido, que é assunto do teste de cima.
    const so = [t('2026-08-02', 'MANHA', 'z', 'a'), t('2026-08-05', 'NOITE', 'c')]
    const d = distribuir(so, [p('z', 'Zeca'), p('a', 'Ana'), p('c', 'Carlos', false)])
    expect(d.linhas.map((l) => l.nome)).toEqual(['Ana', 'Zeca', 'Carlos'])
  })
})
