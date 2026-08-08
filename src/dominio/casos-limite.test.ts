/**
 * CASOS-LIMITE DO ERRO 10 — a saída esperada, escrita e travada.
 *
 * O desenho (§ERRO 10) manda escrever primeiro os casos-limite que a proteção deve pegar, e lista
 * três: elenco vazio, bloco de um dia só, todo mundo ausente no mesmo período. O P5.7 registrou o
 * furo: os três estavam LISTADOS, mas nenhum documento dizia qual é a saída correta — e regra sem
 * saída esperada não tem como ter teste.
 *
 * Em 08/08/2026 os três foram MEDIDOS antes de afirmados (a régua deste projeto): o código já fazia
 * o certo em todos — a decisão D-03 ("quando não fecha, o sistema declara que não fechou") cobre os
 * três sem exceção. O que faltava era travar, para uma mudança futura do gerador não trocar uma
 * recusa declarada por uma escala vazia em silêncio — que é a forma do defeito fundador.
 *
 * A saída esperada, caso a caso, também está escrita em `docs/ALGORITMO.md` (§ Casos-limite).
 */
import { describe, expect, it } from 'vitest'
import { gerar } from './gerador'
import { construirGrade, MALHA_ATUAL } from './malha'
import type { Pessoa } from './tipos'

function pessoas(n: number, extras: Partial<Pessoa>[] = []): Pessoa[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`,
    nome: `Pessoa ${i + 1}`,
    ativo: true,
    restricoes: {},
    ...(extras[i] ?? {}),
  }))
}

const SETEMBRO = { inicio: '2026-09-01', fim: '2026-09-30' }
const grade = (inicio: string, fim: string) =>
  construirGrade({ inicio, fim, malha: MALHA_ATUAL, capacidadePadrao: 3 })

describe('casos-limite do ERRO 10 — recusa DECLARADA, nunca escala vazia em silêncio', () => {
  it('elenco vazio → ok: false, com motivo acionável e o turno que travou', () => {
    const r = gerar({ ...SETEMBRO, grade: grade(SETEMBRO.inicio, SETEMBRO.fim), pessoas: [], elenco: [], malha: MALHA_ATUAL })
    expect(r.ok).toBe(false)
    if (r.ok) return
    // O motivo NOMEIA os três remédios possíveis — não é um "erro" seco.
    expect(r.motivo).toContain('acrescentar pessoas ao elenco')
    expect(r.turnoQueTravou).toBeDefined()
  })

  it('bloco de um dia COM culto → gera normalmente, piso 1', () => {
    const dia = '2026-09-06' // domingo: manhã e noite na malha vigente
    const r = gerar({ inicio: dia, fim: dia, grade: grade(dia, dia), pessoas: pessoas(8), elenco: pessoas(8).map((p) => p.id), malha: MALHA_ATUAL })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.bloco.turnos.length).toBeGreaterThan(0)
    expect(r.bloco.turnos.every((t) => t.data === dia)).toBe(true)
  })

  it('bloco de um dia SEM culto → ok: false, dizendo que não existe turno a escalar', () => {
    const dia = '2026-09-01' // terça: fora da malha
    const r = gerar({ inicio: dia, fim: dia, grade: grade(dia, dia), pessoas: pessoas(8), elenco: pessoas(8).map((p) => p.id), malha: MALHA_ATUAL })
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.motivo).toContain('não existe turno a escalar')
  })

  it('todo mundo ausente no período inteiro → ok: false, mesma recusa declarada do elenco vazio', () => {
    const ausentes = pessoas(8, Array.from({ length: 8 }, () => ({
      restricoes: { ausencias: [{ inicio: SETEMBRO.inicio, fim: SETEMBRO.fim }] },
    })))
    const r = gerar({ ...SETEMBRO, grade: grade(SETEMBRO.inicio, SETEMBRO.fim), pessoas: ausentes, elenco: ausentes.map((p) => p.id), malha: MALHA_ATUAL })
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.motivo).toContain('afrouxar alguma restrição')
    // E jamais o pior mundo: ok com zero turnos preenchidos ninguém pediria — mas é exatamente o
    // que uma regressão silenciosa entregaria. `ok: false` aqui é a trava contra essa classe.
  })
})
