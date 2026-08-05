/**
 * 🔴 A PONTE DADO→TELA NÃO TINHA UM ÚNICO TESTE — quinta auditoria externa, 05/08/2026.
 *
 * O auditor mediu, com mutantes injetados num espelho do projeto e a suíte inteira rodando:
 *
 *     `paraShifts` devolvendo `assignedBrothers: []` .... escala vazia para todo mundo ... 232/232 ✅
 *     `paraShifts` devolvendo `date: 01/01/2000` ........ a escala inteira vira 2000 ...... 232/232 ✅
 *     `paraShifts` devolvendo `type: 'NOITE'` .......... manhã e Santa Ceia somem ........ 232/232 ✅
 *     `filtrarTurnos` devolvendo `[]` .................. tela em branco .................. 232/232 ✅
 *
 * Quatro maneiras de apagar a escala de todos os irmãos, e o portão verde ao lado das quatro. O
 * domínio estava coberto até o osso; **o caminho que a pessoa realmente vê**, não.
 *
 * Estes testes existem para matar exatamente aqueles mutantes. Cada um afirma um campo por vez, com
 * valor absoluto — comparar `paraShifts(t)[0].type` com `TIPO_PARA_TELA[t.tipo]` seria escrever o
 * defeito duas vezes e chamar isso de prova.
 */
import { describe, expect, it } from 'vitest'
import { emendarBlocos, paraShifts } from './carregar'
import { filtrarTurnos } from './filtrar'
import { definirPessoas, type Shift } from '../types/scheduler'
import type { Bloco, Pessoa, Turno } from '../dominio/tipos'

const turno = (data: string, tipo: Turno['tipo'], pessoas: string[], extras: Partial<Turno> = {}): Turno =>
  ({ data, tipo, pessoas, capacidade: 3, ...extras })

const pessoa = (id: string, nome: string): Pessoa => ({ id, nome, ativo: true, restricoes: {} })

const ELENCO = [pessoa('ana', 'Ana Paula'), pessoa('luiz', 'Luíz Carlos'), pessoa('caio', 'Caio')]

describe('paraShifts — a conversão que a tela inteira consome', () => {
  it('🔴 os nomes escalados CHEGAM à tela — o mutante que os apagava passava em 232 testes', () => {
    const s = paraShifts([turno('2026-09-06', 'NOITE', ['ana', 'luiz', 'caio'])])
    expect(s[0].assignedBrothers).toEqual(['ana', 'luiz', 'caio'])
  })

  it('🔴 a DATA chega inteira, e é lida em hora local — não em UTC', () => {
    const s = paraShifts([turno('2026-09-06', 'NOITE', ['ana'])])
    // Valores absolutos: `getMonth()` é base zero, então 8 é setembro.
    expect(s[0].date.getFullYear()).toBe(2026)
    expect(s[0].date.getMonth()).toBe(8)
    expect(s[0].date.getDate()).toBe(6)
    // A prova de que não passou por UTC: às 00:00 locais, um `Date` montado em UTC voltaria
    // no dia anterior em São Paulo.
    expect(s[0].date.getHours()).toBe(0)
  })

  it('🔴 cada TIPO chega como o seu, e a Santa Ceia não vira turno comum', () => {
    const s = paraShifts([
      turno('2026-09-06', 'MANHA', ['ana']),
      turno('2026-09-06', 'TARDE', ['luiz']),
      turno('2026-09-06', 'NOITE', ['caio']),
      turno('2026-08-16', 'MANHA', [], { santaCeia: true, capacidade: 0 }),
    ])
    expect(s.map((x) => x.type)).toEqual(['MANHÃ', 'TARDE', 'NOITE', 'SANTA_CEIA'])
  })

  it('🔴 o RÓTULO do turno atravessa a ponte — "ENSAIO" era cravado no componente', () => {
    const s = paraShifts([
      turno('2026-08-01', 'TARDE', ['ana'], { rotulo: 'ENSAIO' }),
      turno('2026-09-06', 'TARDE', ['ana']),
    ])
    expect(s[0].rotulo).toBe('ENSAIO')
    // E a outra ponta: turno de tarde SEM rótulo não inventa nenhum.
    expect(s[1].rotulo).toBeUndefined()
  })

  it('🔴 a Santa Ceia carrega `rotulo` IGUAL ao nome do turno — quem imprime tem de não repetir', () => {
    const s = paraShifts([turno('2026-08-16', 'MANHA', [], { santaCeia: true, capacidade: 0, rotulo: 'SANTA CEIA' })])
    // O dado é este, e está certo. A imagem imprimiu "SANTA CEIA / SANTA CEIA" por concatenar sem
    // conferir — achado ao ABRIR o PNG, não por teste. Este caso existe para ninguém esquecer que
    // o rótulo pode coincidir com o nome do turno.
    expect(s[0].type).toBe('SANTA_CEIA')
    expect(s[0].rotulo).toBe('SANTA CEIA')
  })

  it('cada turno recebe um id próprio — a tela usa como chave de lista', () => {
    const s = paraShifts([turno('2026-09-06', 'MANHA', ['ana']), turno('2026-09-06', 'NOITE', ['caio'])])
    expect(new Set(s.map((x) => x.id)).size).toBe(2)
  })

  it('lista vazia entra e sai vazia, sem estourar', () => {
    expect(paraShifts([])).toEqual([])
  })
})

// ---------------------------------------------------------------------------

describe('filtrarTurnos — o filtro da tela principal', () => {
  definirPessoas(ELENCO)

  const TURNOS: Shift[] = paraShifts([
    turno('2026-09-06', 'MANHA', ['ana']),
    turno('2026-09-06', 'NOITE', ['luiz']),
    turno('2026-10-04', 'MANHA', ['caio']),
    turno('2026-10-07', 'NOITE', ['ana', 'luiz']),
  ])

  const VAZIO = { selectedBrotherIds: [], selectedMonthStrs: [] }

  it('🔴 sem critério nenhum, devolve TUDO — o mutante `return []` deixava a tela em branco', () => {
    expect(filtrarTurnos(TURNOS, VAZIO)).toHaveLength(4)
  })

  it('filtra por pessoa', () => {
    const r = filtrarTurnos(TURNOS, { ...VAZIO, selectedBrotherIds: ['caio'] })
    expect(r).toHaveLength(1)
    expect(r[0].date.getMonth()).toBe(9)
  })

  it('filtra por mês', () => {
    expect(filtrarTurnos(TURNOS, { ...VAZIO, selectedMonthStrs: ['2026-10-01'] })).toHaveLength(2)
  })

  it('filtra por intervalo de datas', () => {
    const r = filtrarTurnos(TURNOS, {
      ...VAZIO,
      dateRange: { start: new Date(2026, 9, 1), end: new Date(2026, 9, 5) },
    })
    expect(r).toHaveLength(1)
  })

  it('busca por NOME, e o acento não atrapalha — "luiz" acha "Luíz Carlos"', () => {
    expect(filtrarTurnos(TURNOS, { ...VAZIO, dateSearchQuery: 'luiz' })).toHaveLength(2)
  })

  it('busca por dia da semana', () => {
    // 06/09/2026 é domingo; 04/10/2026 também.
    expect(filtrarTurnos(TURNOS, { ...VAZIO, dateSearchQuery: 'domingo' })).toHaveLength(3)
  })

  it('busca por data escrita', () => {
    expect(filtrarTurnos(TURNOS, { ...VAZIO, dateSearchQuery: '07/10' })).toHaveLength(1)
  })

  it('busca que não casa com nada devolve vazio — e isso é diferente de não filtrar', () => {
    expect(filtrarTurnos(TURNOS, { ...VAZIO, dateSearchQuery: 'abacaxi' })).toHaveLength(0)
  })

  it('os critérios se somam, não se substituem', () => {
    const r = filtrarTurnos(TURNOS, {
      selectedBrotherIds: ['ana'],
      selectedMonthStrs: ['2026-10-01'],
    })
    expect(r).toHaveLength(1)
    expect(r[0].date.getDate()).toBe(7)
  })
})

// ---------------------------------------------------------------------------

describe('emendarBlocos — o que a tela recebe quando há mais de um bloco', () => {
  const b = (id: string, inicio: string, fim: string, turnos: Turno[]): Bloco => ({
    id, inicio, fim, geradoEm: '2026-08-05', origem: 'algoritmo',
    pisoAlcancado: null, elenco: [], malha: { regras: [] }, turnos,
  })

  it('o bloco que começa DEPOIS manda no trecho compartilhado', () => {
    const t = emendarBlocos([
      b('velho', '2026-09-01', '2026-09-30', [turno('2026-09-06', 'NOITE', ['ana'])]),
      b('novo', '2026-09-06', '2026-10-31', [turno('2026-09-06', 'NOITE', ['caio'])]),
    ])
    expect(t).toHaveLength(1)
    expect(t[0].pessoas).toEqual(['caio'])
  })

  it('turno fora do intervalo do próprio bloco é descartado', () => {
    const t = emendarBlocos([
      b('x', '2026-09-01', '2026-09-30', [
        turno('2026-09-06', 'NOITE', ['ana']),
        turno('2026-10-15', 'NOITE', ['caio']), // fora do que o bloco declara
      ]),
    ])
    expect(t).toHaveLength(1)
  })

  it('a saída sai em ordem cronológica, e manhã vem antes de noite no mesmo dia', () => {
    const t = emendarBlocos([
      b('x', '2026-09-01', '2026-09-30', [
        turno('2026-09-13', 'NOITE', ['ana']),
        turno('2026-09-06', 'NOITE', ['caio']),
        turno('2026-09-06', 'MANHA', ['luiz']),
      ]),
    ])
    expect(t.map((x) => `${x.data} ${x.tipo}`)).toEqual([
      '2026-09-06 MANHA',
      '2026-09-06 NOITE',
      '2026-09-13 NOITE',
    ])
  })
})
