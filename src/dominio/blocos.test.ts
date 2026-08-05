/**
 * COMO OS BLOCOS SE ENCAIXAM — a regra que estava escrita DUAS VEZES, à mão, e apagava escala no ar.
 *
 * 🔴 DOIS DEFEITOS, ACHADOS POR AUDITORIAS EXTERNAS NO MESMO DIA:
 *
 *  1. A montagem vivia na tela E no `gerar-bloco.mjs`, e as duas divergiam. O script pegava
 *     `blocos[0]` e montava `[truncado, novo]` — apagaria o bloco do meio com três blocos.
 *
 *  2. 🔴 **A CAUDA.** Mesmo a versão "certa" da tela guardava só o que vinha ANTES do bloco novo.
 *     Gerar `01/09 → 31/10` sobre um bloco publicado que ia até 31/12 apagava **novembro e dezembro
 *     inteiros** — 73 turnos no dado real —, e `conferirPassadoPreservado` **aprovava**, porque
 *     contava só o que vinha antes do corte. Um conferidor que prova metade da frase é pior que
 *     nenhum: ele dá licença.
 *
 * A regra, uma só: **o bloco novo manda no período dele, e só nele.**
 */
import { describe, expect, it } from 'vitest'
import { conferirPassadoPreservado, conferirReversao, montarBlocosParaPublicar, publicacaoImpedida, travaDeDataRetroativa } from './blocos'
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

    expect(montarBlocosParaPublicar([a, b], novo).map((x) => x.id)).toEqual(['inicio', 'meio', 'novo'])
  })

  it('🔴 A CAUDA: gerar período MENOR não pode apagar o que vem depois', () => {
    // O cenário real: publicado até 31/12, e o dono gera só setembro–outubro para corrigir algo.
    const publicado = bloco('atual', '2026-08-06', '2026-12-31',
      ['2026-08-08', '2026-09-05', '2026-10-03', '2026-11-07', '2026-12-05'])
    const novo = bloco('novo', '2026-09-01', '2026-10-31', ['2026-09-02', '2026-10-07'])

    const r = montarBlocosParaPublicar([publicado], novo)
    const datas = r.flatMap((b) => b.turnos.map((t) => t.data))

    expect(datas).toContain('2026-08-08')   // cabeça
    expect(datas).toContain('2026-11-07')   // 🔴 CAUDA — sumia
    expect(datas).toContain('2026-12-05')   // 🔴 CAUDA — sumia
    expect(datas).not.toContain('2026-09-05') // dentro do novo: substituído
    expect(datas).not.toContain('2026-10-03')
  })

  it('a cauda vira um bloco próprio, com início no dia seguinte ao fim do novo', () => {
    const publicado = bloco('atual', '2026-08-06', '2026-12-31', ['2026-08-08', '2026-11-07'])
    const novo = bloco('novo', '2026-09-01', '2026-10-31', ['2026-09-02'])

    const cauda = montarBlocosParaPublicar([publicado], novo).find((b) => b.id.endsWith('-cauda'))
    expect(cauda).toBeTruthy()
    expect(cauda!.inicio).toBe('2026-11-01')
    expect(cauda!.fim).toBe('2026-12-31')
  })

  it('🔴 só o bloco que se SOBREPÕE é aparado; os de trás ficam intocados', () => {
    const a = bloco('inicio', '2026-03-01', '2026-05-31', ['2026-03-01'])
    const b = bloco('meio', '2026-06-01', '2026-12-31', ['2026-06-07', '2026-09-01'])
    const novo = bloco('novo', '2026-08-06', '2026-12-31', ['2026-08-08'])

    const r = montarBlocosParaPublicar([a, b], novo)
    expect(r.find((x) => x.id === 'inicio')!.fim).toBe('2026-05-31')
    expect(r.find((x) => x.id === 'meio')!.fim).toBe('2026-08-05')
  })

  it('sem bloco novo, nada é tocado', () => {
    const a = bloco('a', '2026-03-01', '2026-08-05', ['2026-03-01'])
    expect(montarBlocosParaPublicar([a], null)).toEqual([a])
  })

  it('pedaço que fica sem turno nenhum some — bloco vazio não descreve nada', () => {
    const a = bloco('a', '2026-09-01', '2026-09-30', ['2026-09-15'])
    const novo = bloco('novo', '2026-09-01', '2026-09-30', ['2026-09-16'])
    expect(montarBlocosParaPublicar([a], novo).map((b) => b.id)).toEqual(['novo'])
  })

  it('a saída sai em ordem cronológica', () => {
    const a = bloco('velho', '2026-08-06', '2026-12-31', ['2026-08-08', '2026-11-07'])
    const novo = bloco('novo', '2026-09-01', '2026-10-31', ['2026-09-02'])
    const ini = montarBlocosParaPublicar([a], novo).map((b) => b.inicio)
    expect([...ini].sort()).toEqual(ini)
  })
})

describe('conferirPassadoPreservado — nada publicado FORA do novo pode sumir', () => {
  it('aprova quando tudo o que o novo não cobre continua lá', () => {
    const a = bloco('a', '2026-03-01', '2026-05-31', ['2026-03-01', '2026-04-01'])
    const b = bloco('b', '2026-06-01', '2026-08-05', ['2026-06-07'])
    const novo = bloco('novo', '2026-08-06', '2026-12-31', ['2026-08-08'])

    const r = conferirPassadoPreservado([a, b], montarBlocosParaPublicar([a, b], novo), novo)
    expect(r).toMatchObject({ antes: 3, depois: 3, ok: true })
    expect(r.perdidos).toEqual([])
  })

  it('🔴 ACUSA a perda da CAUDA — que a versão anterior aprovava', () => {
    const publicado = bloco('atual', '2026-08-06', '2026-12-31',
      ['2026-08-08', '2026-11-07', '2026-12-05'])
    const novo = bloco('novo', '2026-09-01', '2026-10-31', ['2026-09-02'])

    // A montagem ERRADA: só a cabeça.
    const errada = [{ ...publicado, fim: '2026-08-31' as Bloco['fim'], turnos: [turno('2026-08-08')] }, novo]
    const r = conferirPassadoPreservado([publicado], errada, novo)

    expect(r.ok).toBe(false)
    expect(r.perdidos).toEqual(['2026-11-07', '2026-12-05'])
  })

  it('🔴 ACUSA quando um bloco inteiro some da montagem', () => {
    const a = bloco('a', '2026-03-01', '2026-05-31', ['2026-03-01', '2026-04-01'])
    const b = bloco('b', '2026-06-01', '2026-08-05', ['2026-06-07'])
    const novo = bloco('novo', '2026-08-06', '2026-12-31', ['2026-08-08'])

    const errada = [{ ...b, fim: '2026-08-05' as Bloco['fim'] }, novo]
    const r = conferirPassadoPreservado([a, b], errada, novo)
    expect(r.ok).toBe(false)
    expect(r.perdidos).toEqual(['2026-03-01', '2026-04-01'])
  })

  it('a montagem de verdade sempre passa no conferidor — as duas peças concordam', () => {
    const publicado = bloco('atual', '2026-08-06', '2026-12-31',
      ['2026-08-08', '2026-09-05', '2026-10-03', '2026-11-07', '2026-12-05'])
    for (const [ini, fim] of [['2026-09-01', '2026-10-31'], ['2026-08-06', '2026-12-31'], ['2026-11-01', '2027-06-30']]) {
      const novo = bloco('novo', ini, fim, [ini])
      const montados = montarBlocosParaPublicar([publicado], novo)
      expect(conferirPassadoPreservado([publicado], montados, novo).ok).toBe(true)
    }
  })
})

/**
 * 🔴 REVERTER TAMBÉM PODE APAGAR ESCALA DIVULGADA — sexta auditoria externa, 05/08/2026.
 *
 * O botão Publicar ganhou guarda de manhã; `Voltar a esta versão`, na mesma tela, gravava direto.
 * Medido pelo auditor sobre commits que a tela oferece: voltar só o elenco deixaria 120 de 543 nomes
 * saindo como **id cru** em 70 dias; voltar só a escala trocaria 70 turnos, um deles no passado.
 */
describe('conferirReversao — o guarda que faltava no botão Voltar', () => {
  const HOJE = '2026-09-15'
  const bloco = (turnos: Turno[], extras: Partial<Bloco> = {}): Bloco => ({
    id: 'b', inicio: '2026-09-01', fim: '2026-09-30', geradoEm: '2026-09-01', origem: 'algoritmo',
    pisoAlcancado: 7, elenco: ['ana', 'bia', 'caio'], malha: { regras: [] }, turnos, ...extras,
  })
  const t = (data: string, pessoas: string[]): Turno => ({ data, tipo: 'NOITE', pessoas, capacidade: 3 })
  const ELENCO = [{ id: 'ana', nome: 'Ana' }, { id: 'bia', nome: 'Bia' }, { id: 'caio', nome: 'Caio' }]

  it('🔴 IMPEDE quando a versão antiga reescreve um dia que já passou', () => {
    const atual = { blocos: [bloco([t('2026-09-06', ['ana', 'bia', 'caio'])])], pessoas: ELENCO }
    const antigo = { blocos: [bloco([t('2026-09-06', ['caio', 'bia', 'ana'])])] }
    const r = conferirReversao('blocos.json', antigo, atual, HOJE)
    expect(r.ok).toBe(false)
    expect(r.passadoReescrito).toEqual(['2026-09-06'])
    expect(r.avisos[0]).toContain('JÁ PASSARAM')
  })

  it('🔴 IMPEDE quando o elenco revertido não tem mais quem está escalado', () => {
    const atual = { blocos: [bloco([t('2026-09-20', ['ana', 'bia', 'caio'])])], pessoas: ELENCO }
    const antigo = { pessoas: [{ id: 'ana', nome: 'Ana' }] }
    const r = conferirReversao('pessoas.json', antigo, atual, HOJE)
    expect(r.ok).toBe(false)
    expect(r.nomesQueSumiriam.sort()).toEqual(['bia', 'caio'])
    expect(r.avisos[0]).toContain('código no lugar do nome')
  })

  it('mudar só o FUTURO é permitido — mas o número aparece', () => {
    const atual = { blocos: [bloco([t('2026-09-20', ['ana', 'bia', 'caio']), t('2026-09-27', ['ana', 'bia', 'caio'])])], pessoas: ELENCO }
    const antigo = { blocos: [bloco([t('2026-09-20', ['caio', 'bia', 'ana']), t('2026-09-27', ['ana', 'bia', 'caio'])])] }
    const r = conferirReversao('blocos.json', antigo, atual, HOJE)
    expect(r.ok).toBe(true)
    expect(r.futuroAlterado).toBe(1)
    expect(r.passadoReescrito).toEqual([])
  })

  it('🔴 turno que SOME conta como mudança — não só o que troca de gente', () => {
    const atual = { blocos: [bloco([t('2026-09-20', ['ana', 'bia', 'caio']), t('2026-09-27', ['ana', 'bia', 'caio'])])], pessoas: ELENCO }
    const antigo = { blocos: [bloco([t('2026-09-20', ['ana', 'bia', 'caio'])])] }
    const r = conferirReversao('blocos.json', antigo, atual, HOJE)
    expect(r.futuroAlterado).toBe(1)
  })

  it('a outra ponta: reversão idêntica ao que está no ar passa sem aviso nenhum', () => {
    const atual = { blocos: [bloco([t('2026-09-06', ['ana', 'bia', 'caio']), t('2026-09-20', ['ana', 'bia', 'caio'])])], pessoas: ELENCO }
    const r = conferirReversao('blocos.json', { blocos: atual.blocos }, atual, HOJE)
    expect(r.ok).toBe(true)
    expect(r.futuroAlterado).toBe(0)
    expect(r.avisos).toEqual([])
  })

  it('arquivo ilegível não passa por engano', () => {
    const atual = { blocos: [bloco([t('2026-09-20', ['ana'])])], pessoas: ELENCO }
    expect(conferirReversao('blocos.json', { lixo: 1 }, atual, HOJE).ok).toBe(false)
    expect(conferirReversao('pessoas.json', null, atual, HOJE).ok).toBe(false)
  })
})

/**
 * 🔴 AS DUAS TRAVAS QUE O GATE NÃO ALCANÇAVA — sexta auditoria externa, 05/08/2026.
 *
 * O auditor desligou cada uma na tela e rodou os 20 passos: `EXIT=0` nas duas. Elas vieram para o
 * domínio para que estes testes existam. E `conferirPassadoPreservado.ok` ganhou aqui a prova da
 * segunda metade — `depois.length >= antes.length` —, que também passava com mutante.
 */
describe('travaDeDataRetroativa', () => {
  it('🔴 data ANTERIOR a hoje é recusada, com o motivo', () => {
    const m = travaDeDataRetroativa('2026-08-04', '2026-08-05')
    expect(m).not.toBeNull()
    expect(m).toContain('não se')
  })
  it('hoje é permitido — é a borda, e ela vale', () => {
    expect(travaDeDataRetroativa('2026-08-05', '2026-08-05')).toBeNull()
  })
  it('amanhã é permitido', () => {
    expect(travaDeDataRetroativa('2026-08-06', '2026-08-05')).toBeNull()
  })
  it('🔴 véspera por UM dia também é recusada — a borda do lado errado', () => {
    expect(travaDeDataRetroativa('2026-12-31', '2027-01-01')).not.toBeNull()
  })
})

describe('publicacaoImpedida', () => {
  it('🔴 escala reprovada impede', () => {
    expect(publicacaoImpedida({ aprovada: false }, { ok: true })).toBe(true)
  })
  it('🔴 perda de escala publicada impede — era o defeito dos 73 turnos', () => {
    expect(publicacaoImpedida({ aprovada: true }, { ok: false })).toBe(true)
  })
  it('os dois problemas juntos impedem', () => {
    expect(publicacaoImpedida({ aprovada: false }, { ok: false })).toBe(true)
  })
  it('a outra ponta: tudo certo NÃO impede', () => {
    expect(publicacaoImpedida({ aprovada: true }, { ok: true })).toBe(false)
  })
  it('sem escala gerada ainda, publicar só o elenco é permitido', () => {
    expect(publicacaoImpedida(null, null)).toBe(false)
  })
})

describe('conferirPassadoPreservado — a SEGUNDA metade do veredito', () => {
  const b = (id: string, inicio: string, fim: string, turnos: Turno[]): Bloco => ({
    id, inicio, fim, geradoEm: '2026-08-05', origem: 'algoritmo',
    pisoAlcancado: null, elenco: [], malha: { regras: [] }, turnos,
  })
  const t = (data: string, tipo: Turno['tipo'], pessoas: string[]): Turno => ({ data, tipo, pessoas, capacidade: 3 })

  it('🔴 turno DUPLICADO perdido derruba o veredito, mesmo com `perdidos` vazio', () => {
    // A chave é `data|tipo` num Set: dois blocos sobrepostos trazendo o MESMO turno somam 2 em
    // `antes` e 1 em `depois`, sem nenhuma chave sumir. `ok` julgava só por `perdidos`.
    const anteriores = [
      b('a', '2026-09-01', '2026-09-30', [t('2026-09-06', 'NOITE', ['ana'])]),
      b('b', '2026-09-01', '2026-09-30', [t('2026-09-06', 'NOITE', ['ana'])]),
    ]
    const montados = [b('a', '2026-09-01', '2026-09-30', [t('2026-09-06', 'NOITE', ['ana'])])]
    const r = conferirPassadoPreservado(anteriores, montados, { inicio: '2026-10-01', fim: '2026-10-31' })
    expect(r.antes).toBe(2)
    expect(r.depois).toBe(1)
    expect(r.perdidos).toEqual([])   // a primeira metade não vê
    expect(r.ok).toBe(false)         // a segunda vê
  })

  it('a outra ponta: acrescentar turnos fora do bloco novo continua permitido', () => {
    const anteriores = [b('a', '2026-09-01', '2026-09-30', [t('2026-09-06', 'NOITE', ['ana'])])]
    const montados = [b('a', '2026-09-01', '2026-09-30', [
      t('2026-09-06', 'NOITE', ['ana']),
      t('2026-09-13', 'NOITE', ['bia']),
    ])]
    const r = conferirPassadoPreservado(anteriores, montados, { inicio: '2026-10-01', fim: '2026-10-31' })
    expect(r.ok).toBe(true)
  })
})
