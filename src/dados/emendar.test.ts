/**
 * A EMENDA DOS BLOCOS — o que sobrevive quando dois blocos falam do mesmo dia.
 *
 * 🔴 POR QUE ESTE ARQUIVO EXISTE. A chave de deduplicação incluía `santaCeia`. O mesmo dia e turno,
 * marcado num bloco e não marcado no outro, tinha **duas chaves** — e os dois sobreviviam. O dia da
 * Ceia aparecia duas vezes: uma vazia, outra com gente escalada ao lado.
 *
 * É a forma exata do defeito que originou este projeto — o site antigo escalava seis irmãos no dia
 * da Santa Ceia — reintroduzida por uma linha de deduplicação bem-intencionada.
 *
 * ⚠️ E NINGUÉM VALIDAVA O RESULTADO: D9 julga **um bloco por vez**, e `vivo:conferir` compara a tela
 * com o dado **já emendado**. Coerência interna perfeita sobre um dia duplicado. Achado por uma
 * auditoria externa que foi ler a função, não a saída.
 *
 * A regra, uma só: **o bloco que começa depois manda no trecho compartilhado.**
 */
import { describe, expect, it } from 'vitest'
import { emendarBlocos } from './carregar'
import type { Bloco, Turno } from '../dominio/tipos'

const turno = (data: string, tipo: Turno['tipo'], pessoas: string[], santaCeia?: true): Turno => ({
  data: data as Turno['data'], tipo, capacidade: pessoas.length, pessoas, ...(santaCeia ? { santaCeia } : {}),
})

const bloco = (id: string, inicio: string, fim: string, turnos: Turno[]): Bloco => ({
  id, inicio: inicio as Bloco['inicio'], fim: fim as Bloco['fim'],
  geradoEm: '2026-08-05', origem: 'algoritmo', pisoAlcancado: null,
  elenco: [], malha: { regras: [] }, turnos,
})

describe('emendarBlocos — o que começa depois manda', () => {
  it('🔴 o MESMO dia e turno não pode aparecer duas vezes só porque um é Santa Ceia', () => {
    const antigo = bloco('velho', '2026-08-01', '2026-08-31', [turno('2026-08-16', 'MANHA', ['ana', 'bia', 'caio'])])
    const novo = bloco('novo', '2026-08-10', '2026-08-31', [turno('2026-08-16', 'MANHA', [], true)])

    const r = emendarBlocos([antigo, novo])
    const em16 = r.filter((t) => t.data === '2026-08-16' && t.tipo === 'MANHA')

    expect(em16).toHaveLength(1)
    expect(em16[0].santaCeia).toBe(true)
    expect(em16[0].pessoas).toEqual([])
  })

  it('🔴 e o contrário também: a marca some se o bloco novo não a tiver', () => {
    const antigo = bloco('velho', '2026-08-01', '2026-08-31', [turno('2026-08-16', 'MANHA', [], true)])
    const novo = bloco('novo', '2026-08-10', '2026-08-31', [turno('2026-08-16', 'MANHA', ['ana'])])

    const r = emendarBlocos([antigo, novo]).filter((t) => t.data === '2026-08-16')
    expect(r).toHaveLength(1)
    expect(r[0].santaCeia).toBeUndefined()
    expect(r[0].pessoas).toEqual(['ana'])
  })

  it('turnos DIFERENTES no mesmo dia continuam existindo os dois', () => {
    const b = bloco('b', '2026-08-01', '2026-08-31', [
      turno('2026-08-02', 'MANHA', ['ana']),
      turno('2026-08-02', 'NOITE', ['bia']),
    ])
    expect(emendarBlocos([b]).filter((t) => t.data === '2026-08-02')).toHaveLength(2)
  })

  it('🔴 um bloco só governa dentro do próprio intervalo', () => {
    const b = bloco('b', '2026-08-10', '2026-08-20', [
      turno('2026-08-05', 'NOITE', ['ana']), // antes do início — ignorado
      turno('2026-08-15', 'NOITE', ['bia']),
      turno('2026-08-25', 'NOITE', ['caio']), // depois do fim — ignorado
    ])
    expect(emendarBlocos([b]).map((t) => t.data)).toEqual(['2026-08-15'])
  })

  it('a ordem de saída é cronológica, e manhã vem antes de noite no mesmo dia', () => {
    const b = bloco('b', '2026-08-01', '2026-08-31', [
      turno('2026-08-09', 'NOITE', ['a']),
      turno('2026-08-02', 'NOITE', ['b']),
      turno('2026-08-09', 'MANHA', ['c']),
    ])
    expect(emendarBlocos([b]).map((t) => `${t.data}|${t.tipo}`))
      .toEqual(['2026-08-02|NOITE', '2026-08-09|MANHA', '2026-08-09|NOITE'])
  })

  it('🔴 o passado do bloco antigo sobrevive fora do trecho compartilhado', () => {
    const antigo = bloco('velho', '2026-03-01', '2026-08-31', [
      turno('2026-03-01', 'MANHA', ['ana']),
      turno('2026-08-16', 'MANHA', ['bia']),
    ])
    const novo = bloco('novo', '2026-08-10', '2026-12-31', [turno('2026-08-16', 'MANHA', ['caio'])])

    const r = emendarBlocos([antigo, novo])
    expect(r.find((t) => t.data === '2026-03-01')?.pessoas).toEqual(['ana'])
    expect(r.find((t) => t.data === '2026-08-16')?.pessoas).toEqual(['caio'])
  })
})
