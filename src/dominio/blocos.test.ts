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
import { conferirBuracoNaEscala, conferirEscalaJaDivulgada, conferirPassadoPreservado, conferirReversao, cotaMensalJaPublicada, montarBlocosParaPublicar, publicacaoImpedida, travaDeDataRetroativa, pisoEntregue } from './blocos'
import { validar } from './validacao'
import type { Configuracao, Pessoa } from './tipos'

/** Um contexto mínimo com cota anterior, para exercer D7 atravessando a fronteira. */
const CONFIG_TETO: Configuracao = {
  versao: 1, capacidadePadrao: 1, malhaPadrao: { regras: [] }, santaCeia: [],
  identidade: { titulo: 'T', subtitulo: '', logo: '', pessoa: { singular: 'Pessoa', plural: 'pessoas' } },
}
const validarComCota = (
  turnos: Turno[],
  pessoas: Pessoa[],
  cota: Record<string, Record<string, number>> | undefined,
) =>
  validar({
    bloco: {
      id: 'x', inicio: turnos[0].data, fim: turnos[turnos.length - 1].data, geradoEm: '2026-08-05',
      origem: 'algoritmo', pisoAlcancado: null, elenco: pessoas.map((p) => p.id),
      malha: { regras: [] }, turnos,
    },
    pessoas,
    ultimaEscalaAnterior: {},
    config: CONFIG_TETO,
    ...(cota === undefined ? {} : { escalasPorMesAnterior: cota }),
  })
import type { Bloco, Turno } from './tipos'
import type { DataISO } from './datas'

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

/**
 * 🔴 GERAR POR CIMA DE ESCALA JÁ DIVULGADA — achado ao responder uma pergunta do Flavio, 05/08/2026.
 *
 * As duas travas que existiam perguntavam as coisas erradas: uma se a data já PASSOU, a outra se
 * algum turno SUMIU. Nenhuma perguntava se um turno **mudou de gente** — e é isso que faz o site
 * desmentir o que os irmãos já podem ver.
 */
describe('conferirEscalaJaDivulgada', () => {
  const b = (inicio: string, fim: string, turnos: Turno[]): Bloco => ({
    id: 'b', inicio, fim, geradoEm: '2026-08-05', origem: 'algoritmo',
    pisoAlcancado: 7, elenco: [], malha: { regras: [] }, turnos,
  })
  const t = (data: string, pessoas: string[]): Turno => ({ data, tipo: 'NOITE', pessoas, capacidade: 3 })

  it('🔴 turno publicado que MUDA de gente é contado, com os dois lados', () => {
    const pub = [b('2026-12-01', '2026-12-31', [t('2026-12-23', ['ana', 'bia', 'caio'])])]
    const novo = b('2026-12-15', '2027-06-30', [t('2026-12-23', ['dora', 'ana', 'bia'])])
    const r = conferirEscalaJaDivulgada(pub, novo)
    expect(r.reescritos).toBe(1)
    expect(r.dias).toEqual(['2026-12-23'])
    expect(r.exemplos[0].antes).toEqual(['ana', 'bia', 'caio'])
    expect(r.exemplos[0].depois).toEqual(['dora', 'ana', 'bia'])
  })

  it('🔴 vários dias afetados são todos listados, sem repetir a data', () => {
    const pub = [b('2026-12-01', '2026-12-31', [
      t('2026-12-16', ['ana', 'bia', 'caio']),
      t('2026-12-23', ['ana', 'bia', 'caio']),
    ])]
    const novo = b('2026-12-15', '2027-06-30', [
      t('2026-12-16', ['dora', 'ana', 'bia']),
      t('2026-12-23', ['dora', 'ana', 'bia']),
    ])
    expect(conferirEscalaJaDivulgada(pub, novo).dias).toEqual(['2026-12-16', '2026-12-23'])
  })

  it('a MESMA gente em outra ordem NÃO conta — para quem lê é a mesma escala', () => {
    const pub = [b('2026-12-01', '2026-12-31', [t('2026-12-23', ['ana', 'bia', 'caio'])])]
    const novo = b('2026-12-15', '2027-06-30', [t('2026-12-23', ['caio', 'ana', 'bia'])])
    expect(conferirEscalaJaDivulgada(pub, novo).reescritos).toBe(0)
  })

  it('a outra ponta: começar DEPOIS do publicado não reescreve nada', () => {
    const pub = [b('2026-12-01', '2026-12-31', [t('2026-12-23', ['ana', 'bia', 'caio'])])]
    const novo = b('2027-01-01', '2027-06-30', [t('2027-01-06', ['dora', 'ana', 'bia'])])
    const r = conferirEscalaJaDivulgada(pub, novo)
    expect(r.reescritos).toBe(0)
    expect(r.dias).toEqual([])
  })

  it('turno FORA do intervalo que o bloco publicado declara não conta como divulgado', () => {
    // O bloco diz dezembro e traz um turno de novembro: `emendarBlocos` o descarta, então ele nunca
    // foi ao ar. Contá-lo aqui acusaria uma reescrita que não existe.
    const pub = [b('2026-12-01', '2026-12-31', [t('2026-11-20', ['ana', 'bia', 'caio'])])]
    const novo = b('2026-11-01', '2027-06-30', [t('2026-11-20', ['dora', 'ana', 'bia'])])
    expect(conferirEscalaJaDivulgada(pub, novo).reescritos).toBe(0)
  })

  it('sem bloco novo, não há o que conferir', () => {
    expect(conferirEscalaJaDivulgada([], null).reescritos).toBe(0)
  })
})

/**
 * 🔴 A FRONTEIRA DA COTA MENSAL — sétima auditoria externa, 05/08/2026.
 *
 * `ultimaEscalaAnterior` fechou a fronteira do ESPAÇAMENTO em 04/08. A do **teto mensal** nunca
 * existiu: o contador nascia zerado a cada geração. Medido no dado NO AR: **Williams, teto 3, com 5
 * escalas em agosto de 2026** — três no bloco congelado, duas no novo. As duas réguas aprovavam.
 */
describe('cotaMensalJaPublicada', () => {
  const b = (inicio: string, fim: string, turnos: Turno[]): Bloco => ({
    id: `b-${inicio}`, inicio, fim, geradoEm: '2026-08-05', origem: 'algoritmo',
    pisoAlcancado: 7, elenco: [], malha: { regras: [] }, turnos,
  })
  const t = (data: string, pessoas: string[]): Turno => ({ data, tipo: 'NOITE', pessoas, capacidade: 3 })

  it('🔴 conta o que já está publicado no MÊS que o bloco novo começa', () => {
    const pub = [b('2026-08-01', '2026-08-31', [
      t('2026-08-02', ['ana', 'bia']),
      t('2026-08-05', ['ana']),
    ])]
    const r = cotaMensalJaPublicada(pub, '2026-08-06')
    expect(r.ana['2026-08']).toBe(2)
    expect(r.bia['2026-08']).toBe(1)
  })

  it('🔴 NÃO conta o que o bloco novo vai cobrir — seria contar duas vezes', () => {
    const pub = [b('2026-08-01', '2026-08-31', [
      t('2026-08-02', ['ana']),
      t('2026-08-20', ['ana']),   // depois do início do novo: será reescrito
    ])]
    expect(cotaMensalJaPublicada(pub, '2026-08-06').ana['2026-08']).toBe(1)
  })

  it('turno fora do intervalo que o bloco declara não conta — ele nunca foi ao ar', () => {
    const pub = [b('2026-08-01', '2026-08-31', [t('2026-07-20', ['ana'])])]
    expect(cotaMensalJaPublicada(pub, '2026-09-01').ana).toBeUndefined()
  })

  it('separa por mês, não soma tudo', () => {
    const pub = [b('2026-07-01', '2026-08-31', [
      t('2026-07-05', ['ana']), t('2026-07-12', ['ana']), t('2026-08-02', ['ana']),
    ])]
    const r = cotaMensalJaPublicada(pub, '2026-08-06')
    expect(r.ana['2026-07']).toBe(2)
    expect(r.ana['2026-08']).toBe(1)
  })

  it('sem bloco anterior, não há cota — e isso é diferente de zero mentiroso', () => {
    expect(cotaMensalJaPublicada([], '2026-08-06')).toEqual({})
  })
})

describe('D7 — o teto atravessa a fronteira', () => {
  const pessoaTeto = (id: string, teto: number): Pessoa =>
    ({ id, nome: id.toUpperCase(), ativo: true, restricoes: { tetoMensal: teto } })

  it('🔴 3 já publicadas + 2 novas com teto 3 REPROVA, e a mensagem mostra a soma', () => {
    const rel = validarComCota(
      [
        { data: '2026-08-15', tipo: 'NOITE', pessoas: ['w'], capacidade: 1 },
        { data: '2026-08-26', tipo: 'NOITE', pessoas: ['w'], capacidade: 1 },
      ],
      [pessoaTeto('w', 3)],
      { w: { '2026-08': 3 } },
    )
    expect(rel.aprovada).toBe(false)
    const d7 = rel.resultados.find((r) => r.id === 'D7')!
    expect(d7.status).toBe('falha')
    expect(d7.violacoes[0].mensagem).toContain('5 escalas em 2026-08')
    expect(d7.violacoes[0].mensagem).toContain('3 já publicada')
  })

  it('a outra ponta: 1 já publicada + 2 novas com teto 3 PASSA', () => {
    const rel = validarComCota(
      [
        { data: '2026-08-15', tipo: 'NOITE', pessoas: ['w'], capacidade: 1 },
        { data: '2026-08-26', tipo: 'NOITE', pessoas: ['w'], capacidade: 1 },
      ],
      [pessoaTeto('w', 3)],
      { w: { '2026-08': 1 } },
    )
    expect(rel.resultados.find((r) => r.id === 'D7')!.status).toBe('ok')
  })

  it('🔒 a MEDIDA diz se a fronteira foi considerada — afrouxar em silêncio é indistinguível de furo', () => {
    const com = validarComCota([{ data: '2026-08-15', tipo: 'NOITE', pessoas: ['w'], capacidade: 1 }], [pessoaTeto('w', 3)], { w: {} })
    const sem = validarComCota([{ data: '2026-08-15', tipo: 'NOITE', pessoas: ['w'], capacidade: 1 }], [pessoaTeto('w', 3)], undefined)
    expect(com.resultados.find((r) => r.id === 'D7')!.medida).toContain('somando o que já está publicado')
    expect(sem.resultados.find((r) => r.id === 'D7')!.medida).toContain('SEM a contagem dos blocos anteriores')
  })
})

/**
 * 🔴 O BURACO — sétima auditoria externa, 05/08/2026.
 *
 * Gerar um período, NÃO publicar, e gerar o seguinte deixava 93 dias sem escala no ar — 39 deles com
 * culto — e o Publicar aceitava. `conferirPassadoPreservado` não pega porque nada DESAPARECE: o
 * trecho nunca chegou a existir. São duas perguntas, e só uma tinha guarda.
 */
describe('conferirBuracoNaEscala', () => {
  // Malha de teste: domingo (0) e quarta (3).
  const temCulto = (d: DataISO) => [0, 3].includes(new Date(`${d}T12:00:00`).getDay())
  const b = (inicio: string, fim: string, datas: string[]): Bloco => ({
    id: `b-${inicio}`, inicio, fim, geradoEm: '2026-08-05', origem: 'algoritmo', pisoAlcancado: 7,
    elenco: [], malha: { regras: [{ diaSemana: 0, turnos: ['NOITE'] }, { diaSemana: 3, turnos: ['NOITE'] }] },
    turnos: datas.map((data) => ({ data, tipo: 'NOITE' as const, pessoas: ['ana'], capacidade: 1 })),
  })

  it('🔴 vão entre dois blocos com dias de culto dentro é ACUSADO, com o maior vão', () => {
    const r = conferirBuracoNaEscala(
      [b('2026-09-01', '2026-09-30', ['2026-09-02', '2026-09-06']), b('2026-11-01', '2026-11-30', ['2026-11-01'])],
      temCulto,
    )
    expect(r.ok).toBe(false)
    expect(r.dias.length).toBeGreaterThan(0)
    expect(r.dias[0] > '2026-09-06').toBe(true)
    expect(r.maiorVao).toBeGreaterThan(30)
  })

  it('a outra ponta: blocos contíguos NÃO acusam', () => {
    const r = conferirBuracoNaEscala(
      [b('2026-09-01', '2026-09-30', ['2026-09-02', '2026-09-06', '2026-09-09', '2026-09-13', '2026-09-16', '2026-09-20', '2026-09-23', '2026-09-27', '2026-09-30'])],
      temCulto,
    )
    expect(r.ok).toBe(true)
    expect(r.dias).toEqual([])
  })

  it('dia SEM culto no vão não conta — não há o que escalar nele', () => {
    // 07 e 08/09 são segunda e terça: sem culto nesta malha.
    const r = conferirBuracoNaEscala([b('2026-09-01', '2026-09-30', ['2026-09-06', '2026-09-09'])], temCulto)
    expect(r.ok).toBe(true)
  })

  it('não olha ANTES do primeiro nem DEPOIS do último — a escala tem começo e fim', () => {
    const r = conferirBuracoNaEscala([b('2026-09-01', '2026-12-31', ['2026-09-06'])], temCulto)
    expect(r.ok).toBe(true)
  })

  it('sem turno nenhum, não há buraco a apontar — é outro defeito, e D11 o pega', () => {
    expect(conferirBuracoNaEscala([], temCulto).ok).toBe(true)
  })
})

/**
 * 🔴 A OUTRA METADE DE `conferirPassadoPreservado.ok` — sétima auditoria externa (regressão).
 *
 * O teste da metade `depois >= antes` nasceu na sexta auditoria. A metade `perdidos.length === 0` —
 * a original, a que existe desde que o guarda foi escrito — **nunca teve mutante**. Injetada,
 * os 25 passos do gate saíram verdes: um dia já publicado some e o conferidor **aprova a perda que
 * ele mesmo acabou de listar**.
 *
 * Provar uma metade e deixar a outra é o mesmo que provar uma ponta e deixar a outra.
 */
describe('conferirPassadoPreservado — a metade `perdidos`', () => {
  const b2 = (id: string, inicio: string, fim: string, turnos: Turno[]): Bloco => ({
    id, inicio, fim, geradoEm: '2026-08-05', origem: 'algoritmo',
    pisoAlcancado: null, elenco: [], malha: { regras: [] }, turnos,
  })
  const t2 = (data: string, tipo: Turno['tipo'], pessoas: string[]): Turno => ({ data, tipo, pessoas, capacidade: 3 })

  it('🔴 dia publicado que SOME reprova, mesmo com a contagem batendo', () => {
    // `antes` e `depois` têm o MESMO tamanho: um turno some e outro entra no lugar. Só `perdidos` vê.
    const anteriores = [b2('a', '2026-01-01', '2026-01-31', [
      t2('2026-01-20', 'NOITE', ['ana']),
      t2('2026-01-27', 'NOITE', ['bia']),
    ])]
    const montados = [b2('a', '2026-01-01', '2026-01-31', [
      t2('2026-01-27', 'NOITE', ['bia']),
      t2('2026-01-28', 'NOITE', ['caio']),
    ])]
    const r = conferirPassadoPreservado(anteriores, montados, { inicio: '2026-06-01', fim: '2026-06-30' })
    expect(r.antes).toBe(2)
    expect(r.depois).toBe(2)          // a contagem bate — a outra metade não vê
    expect(r.perdidos).toEqual(['2026-01-20'])
    expect(r.ok).toBe(false)
  })
})

describe('pisoEntregue — o menor intervalo que a escala DE FATO tem', () => {
  const t = (data: string, pessoas: string[]) => ({ data: data as DataISO, pessoas })

  it('mede o menor intervalo entre dois turnos da mesma pessoa', () => {
    expect(pisoEntregue([t('2026-01-01', ['a']), t('2026-01-08', ['a'])])).toBe(7)
  })

  it('🔴 é o MENOR, não o último nem a média', () => {
    // Se pegasse o último par, daria 10. Se fizesse média, daria 6.
    expect(pisoEntregue([t('2026-01-01', ['a']), t('2026-01-03', ['a']), t('2026-01-13', ['a'])])).toBe(2)
  })

  it('cada pessoa conta o próprio intervalo — não mistura gente diferente', () => {
    // 'b' aparece 1 dia depois de 'a', mas são pessoas diferentes: não é intervalo de ninguém.
    expect(pisoEntregue([t('2026-01-01', ['a']), t('2026-01-02', ['b']), t('2026-01-09', ['a'])])).toBe(8)
  })

  it('não depende da ordem em que os turnos chegam', () => {
    const fora = [t('2026-01-13', ['a']), t('2026-01-01', ['a']), t('2026-01-03', ['a'])]
    expect(pisoEntregue(fora)).toBe(2)
  })

  it('ninguém escalado duas vezes: devolve null em vez de inventar um número', () => {
    expect(pisoEntregue([t('2026-01-01', ['a']), t('2026-01-08', ['b'])])).toBeNull()
    expect(pisoEntregue([])).toBeNull()
  })

  it('🔴 A OUTRA PONTA — distingue "entregue melhor" de "entregue igual"', () => {
    // É esta diferença que a tela mostra. Sem os dois casos, o teste não prova que ela existe.
    const exigencia = 5
    const melhor = pisoEntregue([t('2026-01-01', ['a']), t('2026-01-07', ['a'])])!
    const igual = pisoEntregue([t('2026-01-01', ['a']), t('2026-01-06', ['a'])])!
    expect(melhor).toBeGreaterThan(exigencia)
    expect(igual).toBe(exigencia)
  })
})
