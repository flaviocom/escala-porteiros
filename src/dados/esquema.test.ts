/**
 * O DADO PUBLICADO É INTERNAMENTE COERENTE? — P5.4.
 *
 * 🔴 POR QUE ESTE ARQUIVO EXISTE. `config.json` tinha `completarConfig`, que preenche o que faltar.
 * `pessoas.json` e `blocos.json` **não tinham nada**: um `id` duplicado, uma pessoa sem nome, ou um
 * turno citando alguém que não existe passavam direto até a tela.
 *
 * O sintoma conhecido é o **id cru aparecendo no lugar do nome** — já aconteceu neste projeto, e é
 * daquele tipo que ninguém reporta como defeito, porque parece que "o nome dele é assim mesmo".
 *
 * ⚠️ O QUE ESTE CONFERIDOR NÃO FAZ, e é decisão declarada:
 *   · **não derruba o site.** Quem abre o link quer ver a escala; tela branca por causa de um id
 *     repetido é cura pior que a doença. O aviso vai para o console, e a tela serve o que dá;
 *   · **não julga regra de escala.** Isso é do catálogo (`regras.ts`). Aqui só se pergunta se o
 *     arquivo é coerente consigo mesmo.
 */
import { describe, expect, it, vi } from 'vitest'
import { conferirEsquema } from './carregar'
import type { Bloco, Pessoa } from '../dominio/tipos'

const pessoa = (id: string, nome = id.toUpperCase()): Pessoa => ({ id, nome, ativo: true, restricoes: {} })

const bloco = (pessoas: string[][]): Bloco => ({
  id: 'b', inicio: '2026-09-01', fim: '2026-09-30', geradoEm: '2026-09-01',
  origem: 'algoritmo', pisoAlcancado: null, elenco: [], malha: { regras: [] },
  turnos: pessoas.map((ps, i) => ({ data: `2026-09-0${i + 1}`, tipo: 'NOITE' as const, capacidade: ps.length, pessoas: ps })),
})

/** Silencia o `console.warn` — o teste mede o retorno, não o barulho. */
const semRuido = () => vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('conferirEsquema — incoerências que chegariam à tela', () => {
  it('dado limpo não acusa nada', () => {
    semRuido()
    expect(conferirEsquema([pessoa('ana'), pessoa('bia')], [bloco([['ana', 'bia']])])).toEqual([])
  })

  it('🔴 `id` repetido em pessoas.json', () => {
    semRuido()
    const r = conferirEsquema([pessoa('ana'), pessoa('ana', 'Ana Segunda')], [])
    expect(r).toHaveLength(1)
    expect(r[0]).toMatch(/repetido/i)
  })

  it('🔴 pessoa sem nome — é assim que o id cru vaza para a tela', () => {
    semRuido()
    const r = conferirEsquema([{ id: 'ana', nome: '  ', ativo: true, restricoes: {} }], [])
    expect(r[0]).toMatch(/sem nome/i)
    expect(r[0]).toMatch(/id cru/i)
  })

  it('🔴 turno escala alguém que NÃO existe em pessoas.json', () => {
    semRuido()
    const r = conferirEsquema([pessoa('ana')], [bloco([['ana', 'fantasma']])])
    expect(r).toHaveLength(1)
    expect(r[0]).toMatch(/fantasma/)
    expect(r[0]).toMatch(/não existe/i)
  })

  it('🔴 a mesma pessoa duas vezes no MESMO turno', () => {
    semRuido()
    const r = conferirEsquema([pessoa('ana')], [bloco([['ana', 'ana']])])
    expect(r.some((p) => /duas vezes/i.test(p))).toBe(true)
  })

  it('avisa no console, para quem administra encontrar', () => {
    const aviso = semRuido()
    conferirEsquema([pessoa('ana'), pessoa('ana')], [])
    expect(aviso).toHaveBeenCalled()
    expect(String(aviso.mock.calls[0][0])).toMatch(/A escala continua sendo mostrada/i)
  })

  it('🔴 e NÃO estoura — dado ruim não pode virar tela branca para o irmão', () => {
    semRuido()
    expect(() => conferirEsquema(
      [null as unknown as Pessoa, pessoa('ana')],
      [{ ...bloco([]), turnos: [{ data: '2026-09-01', tipo: 'NOITE', capacidade: 1 } as never] }],
    )).not.toThrow()
  })
})
