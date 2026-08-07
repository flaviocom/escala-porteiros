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
  identidade: { titulo: 'Teste', subtitulo: 'Teste', logo: '', pessoa: { singular: 'Pessoa', plural: 'pessoas' } },
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

/**
 * 🔴 A CEGUEIRA QUE ELA REPRODUZIA — quinta auditoria externa, 05/08/2026.
 *
 * Esta régua existe para DISCORDAR da outra, e nenhuma das promessas perguntava se havia escala ali.
 * Nos três casos abaixo ela dizia **0 furos**: bloco sem turno nenhum, bloco com turnos e zero
 * vagas, e bloco que declara um mês e traz outro. Em dois deles o catálogo reprovava — ou seja, a
 * "segunda opinião" concordava por vacuidade com o que não tinha olhado.
 */
describe('a segunda régua pergunta ANTES: está tudo aqui?', () => {
  it('🔴 bloco com ZERO turnos tem furo — dizia "0 de 0 turnos com o número certo"', () => {
    const r = conferirPorFora(bloco([], IDS, { inicio: '2026-09-01', fim: '2026-09-30' }), TRES, CONFIG)
    expect(furosDe(r)).toContain('não tem um único turno')
  })

  it('🔴 turnos com capacidade 0 têm furo — o caso que NENHUMA das duas réguas via', () => {
    const r = conferirPorFora(
      bloco([turno('2026-09-06', 'NOITE', [], { capacidade: 0 })], IDS),
      TRES,
      CONFIG,
    )
    expect(furosDe(r)).toContain('sai na escala como um dia sem ninguém')
  })

  it('🔴 turnos com vaga e ninguém escalado têm furo', () => {
    const r = conferirPorFora(
      bloco([turno('2026-09-06', 'NOITE', []), turno('2026-09-13', 'NOITE', [])], IDS),
      TRES,
      CONFIG,
    )
    expect(furosDe(r)).toContain('NINGUÉM escalado')
  })

  it('🔴 turno fora do período que o bloco declara tem furo', () => {
    const r = conferirPorFora(
      bloco([turno('2026-09-06', 'NOITE', ['ana', 'bia', 'caio'])], IDS, {
        inicio: '2026-11-01', fim: '2026-11-30',
      }),
      TRES,
      CONFIG,
    )
    expect(furosDe(r)).toContain('fora do período declarado')
  })

  it('a outra ponta: bloco cheio e coerente NÃO acusa vacuidade', () => {
    const r = conferirPorFora(
      bloco([turno('2026-09-06', 'NOITE', ['ana', 'bia', 'caio'])], IDS, {
        inicio: '2026-09-01', fim: '2026-09-30',
      }),
      TRES,
      CONFIG,
    )
    const vacuidade = r.comFuro.find((a) => a.promessa.startsWith('O bloco não está vazio'))
    expect(vacuidade).toBeUndefined()
  })
})

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

  /*
    🔴 OS DOIS INFRATORES QUE NUNCA TINHAM SIDO INJETADOS — auditoria da régua, 07/08/2026.

    A promessa "Dias, turnos e ausências" confere QUATRO campos, e só dois tinham teste com
    infrator. Medido com mutante: a régua podia parar de conferir `diasProibidos` e
    `turnosPermitidos` — `if (false)` no lugar da condição — e **as 28 verdes continuavam verdes**.
    Promessa com teste não é o mesmo que campo com teste: o portão media menos do que dizia.
  */
  it('🔴 escalado em dia VETADO para ele (diasProibidos)', () => {
    const semQuarta = [pessoa('ana', { restricoes: { diasProibidos: [3] } }), pessoa('bia'), pessoa('caio')]
    const r = conferirPorFora(bloco([turno('2026-09-02', 'NOITE', ['ana', 'bia', 'caio'])], IDS), semQuarta, CONFIG)
    expect(furosDe(r)).toContain('dia vetado')
  })

  it('🔴 escalado em TURNO que ele não faz (turnosPermitidos)', () => {
    const soNoite = [pessoa('ana', { restricoes: { turnosPermitidos: ['NOITE'] } }), pessoa('bia'), pessoa('caio')]
    const r = conferirPorFora(bloco([turno('2026-09-06', 'MANHA', ['ana', 'bia', 'caio'])], IDS), soNoite, CONFIG)
    expect(furosDe(r)).toContain('turno que ele não faz')
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

// ---------------------------------------------------------------------------
// O portão do portão da SEGUNDA RÉGUA
// ---------------------------------------------------------------------------

/**
 * 🔴 A SEGUNDA RÉGUA NÃO TINHA PORTÃO DO PORTÃO — sexta auditoria externa, 05/08/2026.
 *
 * `regras.test.ts` trava quando uma regra nova entra no `CATALOGO` sem teste. Aqui não havia nada
 * equivalente. Medido pelo auditor: acrescentar uma promessa nova a `conferirPorFora`, **sem teste
 * nenhum**, saía `npm run test` EXIT=0.
 *
 * As promessas que existem hoje têm teste, uma a uma — o que faltava era a trava para a PRÓXIMA. E
 * esta régua é a que a tela vende como maker–checker: uma promessa que ninguém prova é uma segunda
 * opinião que ninguém conferiu.
 *
 * ⚠️ A lista abaixo é escrita À MÃO de propósito. Derivá-la da saída da própria função faria o teste
 * concordar com qualquer coisa que ela devolvesse — que é exatamente o defeito que ele existe para
 * pegar.
 */
describe('cobertura das promessas da segunda régua', () => {
  const COM_TESTE = [
    'O bloco não está vazio, e o que está nele é do período que ele declara',
    'Cada turno tem o número de pessoas que pede',
    'Ninguém serve dois turnos no mesmo dia',
    'Dias, turnos e ausências de cada pessoa são respeitados',
    'Ninguém passa do próprio teto mensal',
    'Só entra quem está no elenco e ativo',
    'Os dias sem escala ficam vazios e marcados',
    'O espaçamento declarado é o espaçamento real',
  ]

  it('🔒 TODA promessa tem teste — promessa nova sem teste deixa isto vermelho', () => {
    // Um bloco qualquer, só para a régua rodar e listar TODAS as promessas que ela faz.
    const r = conferirPorFora(
      bloco([turno('2026-09-06', 'NOITE', ['ana', 'bia', 'caio'])], IDS, { inicio: '2026-09-01', fim: '2026-09-30' }),
      TRES,
      CONFIG,
    )
    const todas = r.achados.map((a) => a.promessa)
    expect(todas.filter((p) => !COM_TESTE.includes(p))).toEqual([])
    // E o contrário: nenhuma promessa listada aqui pode ter sumido da régua.
    expect(COM_TESTE.filter((p) => !todas.includes(p))).toEqual([])
  })
})

/**
 * 🔴 O GÊMEO DO DEFEITO DE D12, aqui — sétima auditoria externa (regressão), 05/08/2026.
 *
 * D12 nasceu com `for (const t of comGente.slice(0, 5))`: fatiava os TURNOS achando que limitava as
 * MENSAGENS, e um turno sem vaga na posição 10 saía aprovado. Foi corrigido lá com um teste.
 *
 * A promessa 0 desta régua tem a mesma forma — e **não tinha o teste gêmeo**. O auditor injetou
 * `comuns.slice(0, 5).filter(…)` e os 25 passos do gate saíram verdes: turno sem vaga na **posição
 * 30** devolvia `furos = 0`.
 *
 * O código está certo; o que faltava era o que o segura.
 */
describe('promessa 0 — o furo LONGE do começo também é achado', () => {
  it('🔴 turno sem vaga na posição 30 é acusado — o `slice` limita o relato, não a busca', () => {
    const turnos = Array.from({ length: 40 }, (_, i) =>
      turno(`2026-09-${String((i % 28) + 1).padStart(2, '0')}`, i % 2 ? 'NOITE' : 'MANHA', ['ana', 'bia', 'caio']),
    )
    turnos[30] = turno('2026-09-15', 'TARDE', [], { capacidade: 0 })
    const r = conferirPorFora(bloco(turnos, IDS, { inicio: '2026-09-01', fim: '2026-09-30' }), TRES, CONFIG)
    expect(furosDe(r)).toContain('sai na escala como um dia sem ninguém')
  })

  it('🔴 e "ninguém escalado" também é visto num bloco grande', () => {
    const turnos = Array.from({ length: 40 }, (_, i) =>
      turno(`2026-09-${String((i % 28) + 1).padStart(2, '0')}`, i % 2 ? 'NOITE' : 'MANHA', []),
    )
    const r = conferirPorFora(bloco(turnos, IDS, { inicio: '2026-09-01', fim: '2026-09-30' }), TRES, CONFIG)
    expect(furosDe(r)).toContain('NINGUÉM escalado')
  })
})

describe('🔴 a conferência nomeia TODOS, não o primeiro que encontra', () => {
  /*
    06/08/2026. A tela dizia "menor intervalo real: 4 dia(s) (Donizete)". O dono conferiu contra o
    rodapé da aba Gerar: *"não é só o Donizete — mostra Flavio, Luiz Cezar, Isac, Williams"*.

    Medido no dado real: 5 pessoas no mínimo, não uma. O código guardava o primeiro que batia o
    recorde e sobrescrevia; quem EMPATAVA sumia.

    Um nome ao lado de um número é lido como "é este". Nomear um de cinco é pior que não nomear
    ninguém: quem lê conclui que os outros quatro estão bem.
  */
  const tres: Pessoa[] = [
    { id: 'a', nome: 'Ana', ativo: true, restricoes: {} },
    { id: 'b', nome: 'Bia', ativo: true, restricoes: {} },
    { id: 'c', nome: 'Caio', ativo: true, restricoes: {} },
  ]
  // Ana e Bia com 4 dias de intervalo; Caio com 8.
  const turnos = [
    { data: '2026-09-06', tipo: 'MANHA', pessoas: ['a', 'b', 'c'], capacidade: 3 },
    { data: '2026-09-10', tipo: 'MANHA', pessoas: ['a', 'b'], capacidade: 2 },
    { data: '2026-09-14', tipo: 'MANHA', pessoas: ['c'], capacidade: 1 },
  ] as unknown as Turno[]

  it('lista os DOIS que empatam no mínimo, e diz quantos são', () => {
    const r = conferirPorFora(bloco(turnos, ['a', 'b', 'c'], { pisoAlcancado: 4 }), tres, CONFIG, {}, {})
    const espaco = r.achados.find((a) => /espaçamento/i.test(a.promessa))!
    expect(espaco.veredito).toMatch(/4 dia/)
    expect(espaco.veredito).toMatch(/2 pessoa/)
    expect(espaco.veredito).toMatch(/Ana/)
    expect(espaco.veredito).toMatch(/Bia/)
  })

  it('🔴 A OUTRA PONTA — quem NÃO está no mínimo fica de fora da lista', () => {
    // Sem isto, a checagem passaria com a régua listando o elenco inteiro.
    const r = conferirPorFora(bloco(turnos, ['a', 'b', 'c'], { pisoAlcancado: 4 }), tres, CONFIG, {}, {})
    const espaco = r.achados.find((a) => /espaçamento/i.test(a.promessa))!
    expect(espaco.veredito).not.toMatch(/Caio/)
  })
})

describe('🔴 quem está FORA da equipe não entra na conferência', () => {
  /*
    Regra dada pelo dono em 06/08/2026: *"somente quem está ativo. Quem não está ativo não faz parte
    de toda a validação das regras."*

    O sintoma: a tela dizia "2 pessoa(s) com teto: Thiago (máx. 2/mês) · Williams", e o Thiago tinha
    sido tirado da equipe. Listar quem não participa faz o leitor procurar por alguém que não está lá.

    ⚠️ Com UMA exceção, e estes testes existem para provar as duas metades: a promessa do elenco
    precisa continuar ENXERGANDO o inativo que apareça na escala — é o furo que ela existe para achar.
  */
  const comSaido: Pessoa[] = [
    { id: 'a', nome: 'Ana', ativo: true, restricoes: { tetoMensal: 3 } },
    { id: 'z', nome: 'Zeca', ativo: false, restricoes: { tetoMensal: 2 } },
  ]

  it('o inativo NÃO aparece entre os medidos, mesmo tendo teto cadastrado', () => {
    const turnos = [{ data: '2026-09-06', tipo: 'MANHA', pessoas: ['a'], capacidade: 1 }] as unknown as Turno[]
    const r = conferirPorFora(bloco(turnos, ['a'], { pisoAlcancado: 1 }), comSaido, CONFIG, {}, {})
    const teto = r.achados.find((x) => /teto mensal/i.test(x.promessa))!
    expect(teto.veredito).toMatch(/Ana/)
    expect(teto.veredito).not.toMatch(/Zeca/)
  })

  it('🔴 A EXCEÇÃO — se o inativo ESTIVER na escala, o guarda continua acusando', () => {
    // Sem este caso, "filtrar inativos" viraria "cegar o guarda", que é o oposto do pedido.
    const turnos = [{ data: '2026-09-06', tipo: 'MANHA', pessoas: ['a', 'z'], capacidade: 2 }] as unknown as Turno[]
    const r = conferirPorFora(bloco(turnos, ['a', 'z'], { pisoAlcancado: 1 }), comSaido, CONFIG, {}, {})
    const elenco = r.achados.find((x) => /elenco/i.test(x.promessa))!
    expect(elenco.furos.join(' ')).toMatch(/Zeca/)
    expect(elenco.furos.join(' ')).toMatch(/fora da equipe/i)
  })
})
