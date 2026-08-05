/**
 * A SEGUNDA RÉGUA precisa achar furo sozinha — senão é enfeite.
 *
 * Estes testes injetam, um a um, os furos que uma escala pode ter, e exigem que a conferência
 * independente os encontre **sem consultar `regras.ts`**. E, na outra ponta, exigem que ela aprove a
 * escala limpa — régua que sempre acusa é tão inútil quanto régua que nunca acusa.
 *
 * ⚠️ O teste mais importante é o último: as DUAS réguas, sobre o MESMO bloco, precisam chegar ao
 * mesmo veredito. Divergência entre elas significa que uma das duas está errada — e é justamente
 * esse sinal que a tela de conferência independente existe para mostrar.
 */
import { describe, expect, it } from 'vitest'
import { conferirPorFora } from './conferencia-independente'
import { validar } from './validacao'
import type { Bloco, Configuracao, Pessoa, Turno } from './tipos'

const CONFIG: Configuracao = {
  versao: 1,
  capacidadePadrao: 3,
  malhaPadrao: { regras: [] },
  santaCeia: ['2026-08-16'],
  identidade: { titulo: 'Teste', subtitulo: 'Teste' },
}

const pessoa = (id: string, extras: Partial<Pessoa> = {}): Pessoa =>
  ({ id, nome: id.toUpperCase(), ativo: true, restricoes: {}, ...extras })

const turno = (data: string, tipo: Turno['tipo'], pessoas: string[], extras: Partial<Turno> = {}): Turno =>
  ({ data, tipo, pessoas, capacidade: 3, ...extras })

const bloco = (turnos: Turno[], elenco: string[], extras: Partial<Bloco> = {}): Bloco => ({
  id: 'b', inicio: turnos[0]?.data ?? '2026-09-01', fim: turnos.at(-1)?.data ?? '2026-09-30',
  geradoEm: '2026-09-01', origem: 'algoritmo', pisoAlcancado: null,
  elenco, malha: { regras: [] }, turnos, ...extras,
})

const TRES = [pessoa('ana'), pessoa('bia'), pessoa('caio')]
const IDS = ['ana', 'bia', 'caio']
const furosDe = (r: ReturnType<typeof conferirPorFora>) => r.comFuro.flatMap((a) => a.furos).join(' | ')

describe('a segunda régua acha o furo sozinha', () => {
  it('turno com gente faltando', () => {
    const r = conferirPorFora(bloco([turno('2026-09-06', 'NOITE', ['ana', 'bia'])], IDS), TRES, CONFIG)
    expect(furosDe(r)).toContain('2 onde cabem 3')
  })

  it('turno com gente sobrando', () => {
    const r = conferirPorFora(bloco([turno('2026-09-06', 'NOITE', ['ana', 'bia', 'caio'], { capacidade: 2 })], IDS), TRES, CONFIG)
    expect(furosDe(r)).toContain('3 onde cabem 2')
  })

  it('a mesma pessoa duas vezes no mesmo dia', () => {
    const r = conferirPorFora(bloco([
      turno('2026-09-06', 'MANHA', ['ana', 'bia', 'caio']),
      turno('2026-09-06', 'NOITE', ['ana', 'bia', 'caio']),
    ], IDS), TRES, CONFIG)
    expect(furosDe(r)).toContain('ANA duas vezes')
  })

  it('escalado em dia que ele não pode', () => {
    const so_domingo = [pessoa('ana', { restricoes: { diasPermitidos: [0] } }), pessoa('bia'), pessoa('caio')]
    const r = conferirPorFora(bloco([turno('2026-09-02', 'NOITE', ['ana', 'bia', 'caio'])], IDS), so_domingo, CONFIG)
    expect(furosDe(r)).toContain('fora dos dias que pode')
  })

  it('escalado durante a própria ausência', () => {
    const deFerias = [pessoa('ana', { restricoes: { ausencias: [{ inicio: '2026-09-01', fim: '2026-09-30' }] } }), pessoa('bia'), pessoa('caio')]
    const r = conferirPorFora(bloco([turno('2026-09-06', 'NOITE', ['ana', 'bia', 'caio'])], IDS), deFerias, CONFIG)
    expect(furosDe(r)).toContain('dentro da ausência')
  })

  it('acima do teto mensal', () => {
    const teto1 = [pessoa('ana', { restricoes: { tetoMensal: 1 } }), pessoa('bia'), pessoa('caio')]
    const r = conferirPorFora(bloco([
      turno('2026-09-06', 'NOITE', ['ana', 'bia', 'caio']),
      turno('2026-09-13', 'NOITE', ['ana', 'bia', 'caio']),
    ], IDS), teto1, CONFIG)
    expect(furosDe(r)).toContain('acima do teto')
  })

  it('gente na escala que não está no elenco', () => {
    const r = conferirPorFora(bloco([turno('2026-09-06', 'NOITE', ['ana', 'bia', 'caio'])], ['ana', 'bia']), TRES, CONFIG)
    expect(furosDe(r)).toContain('não está no elenco')
  })

  it('gente fora da equipe ainda escalada', () => {
    const comInativo = [pessoa('ana'), pessoa('bia'), pessoa('caio', { ativo: false })]
    const r = conferirPorFora(bloco([turno('2026-09-06', 'NOITE', ['ana', 'bia', 'caio'])], IDS), comInativo, CONFIG)
    expect(furosDe(r)).toContain('fora da equipe')
  })

  it('dia sem escala com gente dentro', () => {
    const r = conferirPorFora(
      bloco([turno('2026-08-16', 'MANHA', ['ana'], { santaCeia: true, capacidade: 0 })], IDS),
      TRES, CONFIG,
    )
    expect(furosDe(r)).toContain('dia sem escala e tem 1')
  })

  it('🔴 o piso declarado é maior que o real — a escala se elogia demais', () => {
    const r = conferirPorFora(
      bloco([
        turno('2026-09-05', 'NOITE', ['ana', 'bia', 'caio']),
        turno('2026-09-06', 'NOITE', ['ana', 'bia', 'caio']),
      ], IDS, { pisoAlcancado: 7 }),
      TRES, CONFIG,
    )
    expect(furosDe(r)).toContain('declara piso de 7')
  })
})

describe('e a outra ponta', () => {
  it('escala limpa NÃO produz furo — régua sempre-vermelha não serve', () => {
    const r = conferirPorFora(bloco([turno('2026-09-06', 'NOITE', ['ana', 'bia', 'caio'])], IDS), TRES, CONFIG)
    expect(r.comFuro).toEqual([])
  })

  it('os números apurados por fora batem com o bloco', () => {
    const r = conferirPorFora(bloco([
      turno('2026-09-06', 'NOITE', ['ana', 'bia', 'caio']),
      turno('2026-09-13', 'NOITE', ['ana', 'bia', 'caio']),
    ], IDS), TRES, CONFIG)
    expect(r.numeros).toMatchObject({ turnos: 2, vagas: 6, preenchidas: 6, pessoasEscaladas: 3, dias: 2 })
  })
})

describe('🔴 as duas réguas precisam concordar — divergência é o sinal que importa', () => {
  const casos: { nome: string; bloco: Bloco; pessoas: Pessoa[] }[] = [
    { nome: 'escala limpa', bloco: bloco([turno('2026-09-06', 'NOITE', ['ana', 'bia', 'caio'])], IDS), pessoas: TRES },
    { nome: 'turno incompleto', bloco: bloco([turno('2026-09-06', 'NOITE', ['ana', 'bia'])], IDS), pessoas: TRES },
    {
      nome: 'repetido no mesmo dia',
      bloco: bloco([turno('2026-09-06', 'MANHA', ['ana', 'bia', 'caio']), turno('2026-09-06', 'NOITE', ['ana', 'bia', 'caio'])], IDS),
      pessoas: TRES,
    },
    {
      nome: 'pessoa fora da equipe escalada',
      bloco: bloco([turno('2026-09-06', 'NOITE', ['ana', 'bia', 'caio'])], IDS),
      pessoas: [pessoa('ana'), pessoa('bia'), pessoa('caio', { ativo: false })],
    },
  ]

  for (const c of casos) {
    it(`concordam sobre "${c.nome}"`, () => {
      const porFora = conferirPorFora(c.bloco, c.pessoas, CONFIG)
      const oficial = validar({ bloco: c.bloco, pessoas: c.pessoas, ultimaEscalaAnterior: {}, config: CONFIG })
      // As duas veem problema, ou nenhuma vê. O QUE elas chamam de problema pode ter nomes
      // diferentes; o veredito não pode divergir.
      expect(porFora.comFuro.length > 0).toBe(oficial.falhasDuras.length > 0)
    })
  }
})
