/**
 * 🔒 O PORTÃO — cada regra do catálogo é provada nas DUAS PONTAS.
 *
 * Para toda regra existem dois testes: um que injeta um infrator e exige **reprovação**, e outro que
 * exige **aprovação** do caso limpo. Provar só um lado não distingue um portão que funciona de um
 * portão sempre-verde ou sempre-vermelho — e este projeto nasce de um site cuja especificação
 * prometia validar espaçamento e capacidade sem validar nem um nem outro.
 *
 * ⚠️ O infrator precisa DE FATO infringir. Já aconteceu neste método um teste injetar um infrator
 * que não infringia nada e passar por vacuidade. Por isso o último teste deste arquivo confere que
 * **todas** as regras do catálogo têm cobertura — se alguém acrescentar uma regra e esquecer o
 * teste, ele fica vermelho.
 */
import { describe, expect, it } from 'vitest'
import { CATALOGO, podeAssumir, type Contexto } from './regras'
import { validar } from './validacao'
import type { Bloco, Pessoa, Turno } from './tipos'

// ---------------------------------------------------------------------------
// Construtores de cenário
// ---------------------------------------------------------------------------

function pessoa(id: string, extras: Partial<Pessoa> = {}): Pessoa {
  return { id, nome: id.toUpperCase(), ativo: true, restricoes: {}, ...extras }
}

function turno(data: string, tipo: Turno['tipo'], pessoas: string[], extras: Partial<Turno> = {}): Turno {
  return { data, tipo, pessoas, capacidade: 3, ...extras }
}

function ctxDe(
  turnos: Turno[],
  pessoas: Pessoa[],
  extras: { elenco?: string[]; piso?: number | null; anterior?: Record<string, string> } = {},
): Contexto {
  const bloco: Bloco = {
    id: 'teste',
    inicio: turnos[0]?.data ?? '2026-09-01',
    fim: turnos[turnos.length - 1]?.data ?? '2026-09-30',
    geradoEm: '2026-08-04T12:00:00-03:00',
    origem: 'algoritmo',
    pisoAlcancado: extras.piso ?? null,
    elenco: extras.elenco ?? pessoas.map((p) => p.id),
    malha: { regras: [] },
    turnos,
  }
  return { bloco, pessoas, ultimaEscalaAnterior: extras.anterior ?? {} }
}

const TRES = [pessoa('ana'), pessoa('bia'), pessoa('caio')]

/** Roda uma regra pelo id e devolve o resultado. */
function rodar(id: string, ctx: Contexto) {
  const regra = CATALOGO.find((r) => r.id === id)
  if (!regra) throw new Error(`Regra ${id} não existe no catálogo`)
  return regra.avaliar(ctx)
}

// ---------------------------------------------------------------------------
// REGRAS DURAS
// ---------------------------------------------------------------------------

describe('D1 — capacidade', () => {
  it('reprova turno com vaga sobrando', () => {
    const r = rodar('D1', ctxDe([turno('2026-09-06', 'MANHA', ['ana', 'bia'])], TRES))
    expect(r.status).toBe('falha')
    expect(r.violacoes[0].mensagem).toContain('2 de 3')
  })
  it('aprova turno completo', () => {
    const r = rodar('D1', ctxDe([turno('2026-09-06', 'MANHA', ['ana', 'bia', 'caio'])], TRES))
    expect(r.status).toBe('ok')
  })
})

describe('D2 — sem repetição no mesmo dia', () => {
  it('reprova quem aparece de manhã e à noite no mesmo dia', () => {
    const r = rodar('D2', ctxDe([
      turno('2026-09-06', 'MANHA', ['ana', 'bia', 'caio']),
      turno('2026-09-06', 'NOITE', ['ana', 'bia', 'caio']),
    ], TRES))
    expect(r.status).toBe('falha')
    expect(r.violacoes).toHaveLength(3)
  })
  it('aprova quando os dois turnos do dia têm gente diferente', () => {
    const seis = [...TRES, pessoa('dora'), pessoa('elias'), pessoa('fabio')]
    const r = rodar('D2', ctxDe([
      turno('2026-09-06', 'MANHA', ['ana', 'bia', 'caio']),
      turno('2026-09-06', 'NOITE', ['dora', 'elias', 'fabio']),
    ], seis))
    expect(r.status).toBe('ok')
  })
})

describe('D3 — dias permitidos', () => {
  const so_quarta = [pessoa('ana', { restricoes: { diasPermitidos: [3] } }), pessoa('bia'), pessoa('caio')]
  it('reprova quem só pode na quarta e foi escalado no domingo', () => {
    // 06/09/2026 é domingo
    const r = rodar('D3', ctxDe([turno('2026-09-06', 'NOITE', ['ana', 'bia', 'caio'])], so_quarta))
    expect(r.status).toBe('falha')
    expect(r.violacoes[0].mensagem).toContain('domingo')
  })
  it('aprova o mesmo escalado na quarta', () => {
    // 02/09/2026 é quarta
    const r = rodar('D3', ctxDe([turno('2026-09-02', 'NOITE', ['ana', 'bia', 'caio'])], so_quarta))
    expect(r.status).toBe('ok')
  })
})

describe('D4 — dias proibidos', () => {
  const sem_quarta = [pessoa('ana', { restricoes: { diasProibidos: [3] } }), pessoa('bia'), pessoa('caio')]
  it('reprova quem nunca pode na quarta e foi escalado na quarta', () => {
    const r = rodar('D4', ctxDe([turno('2026-09-02', 'NOITE', ['ana', 'bia', 'caio'])], sem_quarta))
    expect(r.status).toBe('falha')
  })
  it('aprova o mesmo escalado no domingo', () => {
    const r = rodar('D4', ctxDe([turno('2026-09-06', 'NOITE', ['ana', 'bia', 'caio'])], sem_quarta))
    expect(r.status).toBe('ok')
  })
})

describe('D5 — turnos permitidos', () => {
  const so_noite = [pessoa('ana', { restricoes: { turnosPermitidos: ['NOITE'] } }), pessoa('bia'), pessoa('caio')]
  it('reprova quem só pode à noite e foi escalado de manhã', () => {
    const r = rodar('D5', ctxDe([turno('2026-09-06', 'MANHA', ['ana', 'bia', 'caio'])], so_noite))
    expect(r.status).toBe('falha')
  })
  it('aprova o mesmo escalado à noite', () => {
    const r = rodar('D5', ctxDe([turno('2026-09-06', 'NOITE', ['ana', 'bia', 'caio'])], so_noite))
    expect(r.status).toBe('ok')
  })
})

describe('D6 — ausências', () => {
  const viajando = [
    pessoa('ana', { restricoes: { ausencias: [{ inicio: '2026-10-10', fim: '2026-10-25', motivo: 'viagem' }] } }),
    pessoa('bia'), pessoa('caio'),
  ]
  it('reprova quem foi escalado DENTRO da ausência', () => {
    const r = rodar('D6', ctxDe([turno('2026-10-18', 'NOITE', ['ana', 'bia', 'caio'])], viajando))
    expect(r.status).toBe('falha')
    expect(r.violacoes[0].mensagem).toContain('viagem')
  })
  it('reprova também nas BORDAS do intervalo, que é onde o erro se esconde', () => {
    const inicio = rodar('D6', ctxDe([turno('2026-10-10', 'NOITE', ['ana', 'bia', 'caio'])], viajando))
    const fim = rodar('D6', ctxDe([turno('2026-10-25', 'NOITE', ['ana', 'bia', 'caio'])], viajando))
    expect(inicio.status).toBe('falha')
    expect(fim.status).toBe('falha')
  })
  it('aprova um dia antes e um dia depois da ausência', () => {
    const antes = rodar('D6', ctxDe([turno('2026-10-09', 'NOITE', ['ana', 'bia', 'caio'])], viajando))
    const depois = rodar('D6', ctxDe([turno('2026-10-26', 'NOITE', ['ana', 'bia', 'caio'])], viajando))
    expect(antes.status).toBe('ok')
    expect(depois.status).toBe('ok')
  })
})

describe('D7 — teto mensal', () => {
  const teto2 = [pessoa('ana', { restricoes: { tetoMensal: 2 } }), pessoa('bia'), pessoa('caio')]
  it('reprova quem passou do teto', () => {
    const r = rodar('D7', ctxDe([
      turno('2026-09-02', 'NOITE', ['ana', 'bia', 'caio']),
      turno('2026-09-09', 'NOITE', ['ana', 'bia', 'caio']),
      turno('2026-09-16', 'NOITE', ['ana', 'bia', 'caio']),
    ], teto2))
    expect(r.status).toBe('falha')
    expect(r.violacoes[0].mensagem).toContain('3 escalas')
  })
  it('aprova exatamente no teto', () => {
    const r = rodar('D7', ctxDe([
      turno('2026-09-02', 'NOITE', ['ana', 'bia', 'caio']),
      turno('2026-09-09', 'NOITE', ['ana', 'bia', 'caio']),
    ], teto2))
    expect(r.status).toBe('ok')
  })
  it('conta por mês CALENDÁRIO — 2 em setembro e 2 em outubro não estoura', () => {
    const r = rodar('D7', ctxDe([
      turno('2026-09-23', 'NOITE', ['ana', 'bia', 'caio']),
      turno('2026-09-30', 'NOITE', ['ana', 'bia', 'caio']),
      turno('2026-10-07', 'NOITE', ['ana', 'bia', 'caio']),
      turno('2026-10-14', 'NOITE', ['ana', 'bia', 'caio']),
    ], teto2))
    expect(r.status).toBe('ok')
  })
})

describe('D8 — elenco', () => {
  it('reprova quem está na escala mas fora do elenco', () => {
    const r = rodar('D8', ctxDe(
      [turno('2026-09-06', 'NOITE', ['ana', 'bia', 'caio'])],
      TRES,
      { elenco: ['ana', 'bia'] },
    ))
    expect(r.status).toBe('falha')
    expect(r.violacoes[0].pessoaId).toBe('caio')
  })
  it('aprova quando todos estão no elenco', () => {
    const r = rodar('D8', ctxDe([turno('2026-09-06', 'NOITE', ['ana', 'bia', 'caio'])], TRES))
    expect(r.status).toBe('ok')
  })

  /**
   * 🔴 Achado da auditoria adversarial de 04/08/2026.
   *
   * A regra só olhava `bloco.elenco`. Quem fosse DESATIVADO mas continuasse no elenco do bloco
   * passava — e é justamente o caso que este projeto existe para tratar: *"sempre acontece de
   * saírem pessoas da escala"*. O gerador já barrava; a validação, que é a última linha antes de
   * publicar, não.
   */
  it('🔴 reprova quem foi TIRADO da escala e continua escalado', () => {
    const comInativo = [pessoa('ana'), pessoa('bia'), pessoa('caio', { ativo: false })]
    const r = rodar('D8', ctxDe([turno('2026-09-06', 'NOITE', ['ana', 'bia', 'caio'])], comInativo))
    expect(r.status).toBe('falha')
    expect(r.violacoes[0].mensagem).toContain('tirado da escala')
  })

  it('e a escala inteira é reprovada por causa disso', () => {
    const comInativo = [pessoa('ana'), pessoa('bia'), pessoa('caio', { ativo: false })]
    const rel = validar(ctxDe([turno('2026-09-06', 'NOITE', ['ana', 'bia', 'caio'])], comInativo))
    expect(rel.aprovada).toBe(false)
    expect(rel.falhasDuras.map((f) => f.id)).toContain('D8')
  })
})

describe('D9 — Santa Ceia', () => {
  it('reprova Santa Ceia com gente escalada', () => {
    const r = rodar('D9', ctxDe(
      [turno('2026-08-16', 'MANHA', ['ana', 'bia', 'caio'], { santaCeia: true, capacidade: 0 })],
      TRES,
    ))
    expect(r.status).toBe('falha')
    expect(r.violacoes[0].mensagem).toContain('16/08/2026')
  })
  it('aprova Santa Ceia vazia', () => {
    const r = rodar('D9', ctxDe(
      [turno('2026-08-16', 'MANHA', [], { santaCeia: true, capacidade: 0 })],
      TRES,
    ))
    expect(r.status).toBe('ok')
  })
})

describe('D10 — coerência do piso declarado', () => {
  const turnosColados = [
    turno('2026-09-05', 'NOITE', ['ana', 'bia', 'caio']),
    turno('2026-09-06', 'NOITE', ['ana', 'bia', 'caio']),
  ]
  it('reprova bloco que declara piso 7 e tem intervalo de 1 dia', () => {
    const r = rodar('D10', ctxDe(turnosColados, TRES, { piso: 7 }))
    expect(r.status).toBe('falha')
    expect(r.violacoes[0].mensagem).toContain('1 dia')
  })
  it('aprova quando o piso declarado bate com a realidade', () => {
    const r = rodar('D10', ctxDe(turnosColados, TRES, { piso: 1 }))
    expect(r.status).toBe('ok')
  })
  it('não inventa veredito quando o piso é desconhecido (bloco importado)', () => {
    const r = rodar('D10', ctxDe(turnosColados, TRES, { piso: null }))
    expect(r.status).toBe('ok')
    expect(r.medida).toContain('não declarado')
  })
})

// ---------------------------------------------------------------------------
// REGRAS DE QUALIDADE
// ---------------------------------------------------------------------------

describe('Q1 — distanciamento', () => {
  it('avisa quando alguém tem intervalo de 3 dias ou menos (quarta -> sábado)', () => {
    const r = rodar('Q1', ctxDe([
      turno('2026-09-02', 'NOITE', ['ana', 'bia', 'caio']), // quarta
      turno('2026-09-05', 'NOITE', ['ana', 'bia', 'caio']), // sábado
    ], TRES))
    expect(r.status).toBe('aviso')
    expect(r.medida).toContain('3 dia')
  })
  it('fica ok quando todos ficam a 7 dias', () => {
    const r = rodar('Q1', ctxDe([
      turno('2026-09-02', 'NOITE', ['ana', 'bia', 'caio']),
      turno('2026-09-09', 'NOITE', ['ana', 'bia', 'caio']),
    ], TRES))
    expect(r.status).toBe('ok')
  })
  it('🔴 enxerga a FRONTEIRA: escala em 30/08 encosta na de 01/09 do bloco novo', () => {
    const r = rodar('Q1', ctxDe(
      [turno('2026-09-01', 'NOITE', ['ana', 'bia', 'caio'])],
      TRES,
      { anterior: { ana: '2026-08-30' } },
    ))
    expect(r.status).toBe('aviso')
    expect(r.violacoes.some((v) => v.pessoaId === 'ana')).toBe(true)
  })
})

describe('Q2 — equilíbrio de carga', () => {
  it('avisa quando a diferença passa de 2 turnos', () => {
    const r = rodar('Q2', ctxDe([
      turno('2026-09-02', 'NOITE', ['ana', 'bia', 'caio']),
      turno('2026-09-09', 'NOITE', ['ana', 'bia', 'caio']),
      turno('2026-09-16', 'NOITE', ['ana', 'bia', 'caio']),
      turno('2026-09-23', 'NOITE', ['ana', 'bia', 'caio']),
    ], [...TRES, pessoa('dora')]))
    expect(r.status).toBe('aviso') // dora com 0, os outros com 4
  })
  it('fica ok quando a carga está pareja', () => {
    const r = rodar('Q2', ctxDe([
      turno('2026-09-02', 'NOITE', ['ana', 'bia', 'caio']),
      turno('2026-09-09', 'NOITE', ['ana', 'bia', 'caio']),
    ], TRES))
    expect(r.status).toBe('ok')
  })
  it('NÃO acusa quem tem teto mensal — a diferença ali é a regra funcionando', () => {
    const comTeto = [...TRES, pessoa('dora', { restricoes: { tetoMensal: 1 } })]
    const r = rodar('Q2', ctxDe([
      turno('2026-09-02', 'NOITE', ['ana', 'bia', 'caio']),
      turno('2026-09-09', 'NOITE', ['ana', 'bia', 'caio']),
      turno('2026-09-16', 'NOITE', ['ana', 'bia', 'caio']),
      turno('2026-09-23', 'NOITE', ['ana', 'bia', 'dora']),
    ], comTeto))
    expect(r.violacoes.some((v) => v.pessoaId === 'dora')).toBe(false)
  })
})

describe('Q3 — variedade de dia da semana', () => {
  const quatroDomingos = [
    turno('2026-09-06', 'NOITE', ['ana', 'bia', 'caio']),
    turno('2026-09-13', 'NOITE', ['ana', 'bia', 'caio']),
    turno('2026-09-20', 'NOITE', ['ana', 'bia', 'caio']),
    turno('2026-09-27', 'NOITE', ['ana', 'bia', 'caio']),
  ]
  it('avisa quem caiu sempre no mesmo dia da semana', () => {
    const r = rodar('Q3', ctxDe(quatroDomingos, TRES))
    expect(r.status).toBe('aviso')
    expect(r.violacoes[0].mensagem).toContain('domingo')
  })
  it('fica ok quando os dias variam', () => {
    const r = rodar('Q3', ctxDe([
      turno('2026-09-02', 'NOITE', ['ana', 'bia', 'caio']), // quarta
      turno('2026-09-06', 'NOITE', ['ana', 'bia', 'caio']), // domingo
      turno('2026-09-12', 'NOITE', ['ana', 'bia', 'caio']), // sábado
      turno('2026-09-16', 'NOITE', ['ana', 'bia', 'caio']), // quarta
    ], TRES))
    expect(r.status).toBe('ok')
  })
  it('NÃO acusa quem tem dia restrito — seria cobrar que ele viole a própria restrição', () => {
    const soDomingo = [pessoa('ana', { restricoes: { diasPermitidos: [0] } }), pessoa('bia'), pessoa('caio')]
    const r = rodar('Q3', ctxDe(quatroDomingos, soDomingo))
    expect(r.violacoes.some((v) => v.pessoaId === 'ana')).toBe(false)
  })
})

describe('Q4 — variedade de companhia', () => {
  it('avisa quando o mesmo trio se repete 3 vezes', () => {
    const r = rodar('Q4', ctxDe([
      turno('2026-09-02', 'NOITE', ['ana', 'bia', 'caio']),
      turno('2026-09-09', 'NOITE', ['ana', 'bia', 'caio']),
      turno('2026-09-16', 'NOITE', ['ana', 'bia', 'caio']),
    ], TRES))
    expect(r.status).toBe('aviso')
    expect(r.violacoes[0].mensagem).toContain('juntos 3 vezes')
  })
  it('fica ok quando as formações variam', () => {
    const seis = [...TRES, pessoa('dora'), pessoa('elias'), pessoa('fabio')]
    const r = rodar('Q4', ctxDe([
      turno('2026-09-02', 'NOITE', ['ana', 'bia', 'caio']),
      turno('2026-09-09', 'NOITE', ['dora', 'elias', 'fabio']),
      turno('2026-09-16', 'NOITE', ['ana', 'dora', 'caio']),
    ], seis))
    expect(r.status).toBe('ok')
  })
})

describe('Q5 — piso mensal', () => {
  const teto3 = [pessoa('ana', { restricoes: { tetoMensal: 3 } }), pessoa('bia'), pessoa('caio')]
  it('avisa quem tem teto de 3 e ficou com 1', () => {
    const r = rodar('Q5', ctxDe([turno('2026-09-02', 'NOITE', ['ana', 'bia', 'caio'])], teto3))
    expect(r.status).toBe('aviso')
    expect(r.violacoes[0].mensagem).toContain('1 de 3')
  })
  it('fica ok quando o teto foi atingido', () => {
    const r = rodar('Q5', ctxDe([
      turno('2026-09-02', 'NOITE', ['ana', 'bia', 'caio']),
      turno('2026-09-09', 'NOITE', ['ana', 'bia', 'caio']),
      turno('2026-09-16', 'NOITE', ['ana', 'bia', 'caio']),
    ], teto3))
    expect(r.status).toBe('ok')
  })
  it('🔴 ficar abaixo do teto NUNCA reprova — só avisa', () => {
    const rel = validar(ctxDe([turno('2026-09-02', 'NOITE', ['ana', 'bia', 'caio'])], teto3))
    expect(rel.aprovada).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// O portão do portão
// ---------------------------------------------------------------------------

describe('cobertura do catálogo', () => {
  it('🔒 TODA regra do catálogo tem teste — regra nova sem teste deixa isto vermelho', () => {
    const comTeste = new Set([
      'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10',
      'Q1', 'Q2', 'Q3', 'Q4', 'Q5',
    ])
    const semTeste = CATALOGO.filter((r) => !comTeste.has(r.id)).map((r) => `${r.id} — ${r.titulo}`)
    expect(semTeste).toEqual([])
    // E o contrário: nenhum id listado aqui pode ter sumido do catálogo.
    const idsReais = new Set(CATALOGO.map((r) => r.id))
    expect([...comTeste].filter((id) => !idsReais.has(id))).toEqual([])
  })

  it('a validação percorre o catálogo INTEIRO, sem subconjunto escondido', () => {
    const rel = validar(ctxDe([turno('2026-09-06', 'NOITE', ['ana', 'bia', 'caio'])], TRES))
    expect(rel.avaliadas).toBe(rel.totalNoCatalogo)
    expect(rel.avaliadas).toBe(CATALOGO.length)
  })

  it('escala limpa é APROVADA — senão o portão seria sempre-vermelho', () => {
    const seis = [...TRES, pessoa('dora'), pessoa('elias'), pessoa('fabio')]
    const rel = validar(ctxDe([
      turno('2026-09-02', 'NOITE', ['ana', 'bia', 'caio']),
      turno('2026-09-09', 'NOITE', ['dora', 'elias', 'fabio']),
    ], seis, { piso: 7 }))
    expect(rel.aprovada).toBe(true)
    expect(rel.falhasDuras).toEqual([])
  })

  it('uma única violação dura já REPROVA a escala inteira', () => {
    const rel = validar(ctxDe([turno('2026-09-06', 'NOITE', ['ana', 'bia'])], TRES))
    expect(rel.aprovada).toBe(false)
    expect(rel.falhasDuras.map((r) => r.id)).toContain('D1')
  })
})

// ---------------------------------------------------------------------------
// O MOTIVO NUNCA FICA MUDO
//
// Achado pelo ensaio de troca de elenco (04/08/2026): um `turnosPermitidos: ['noite']` — minúsculo,
// valor inválido, porque o literal é `'NOITE'` — fazia `ROTULO_TURNO['noite']` virar `undefined`, e
// `join` transforma `undefined` em **string vazia**. A mensagem saía como **"só pode "**, sem dizer
// o quê. Passei duas rodadas procurando defeito no gerador por causa disso.
//
// O tipo impede dentro do app, mas `pessoas.json` é um arquivo que alguém pode editar à mão — e foi
// exatamente assim que apareceu. Motivo mudo é pior que motivo feio: com o valor cru na tela
// ("só pode noite") dá para desconfiar do dado; sem nada, procura-se no lugar errado.
// ---------------------------------------------------------------------------
describe('podeAssumir — o motivo nunca fica mudo', () => {
  const turnoNoite: Turno = { data: '2026-10-04', tipo: 'NOITE', pessoas: [], capacidade: 3 }
  const alguem = (restricoes: Pessoa['restricoes']): Pessoa =>
    ({ id: 'x', nome: 'Fulano', ativo: true, restricoes })

  it('turno com valor INVÁLIDO ainda produz motivo legível', () => {
    const r = podeAssumir(alguem({ turnosPermitidos: ['noite' as unknown as 'NOITE'] }), turnoNoite, false, 0)
    expect(r.pode).toBe(false)
    expect(r.motivo).toBe('só pode noite')
  })

  it('dia da semana INVÁLIDO ainda produz motivo legível', () => {
    const r = podeAssumir(alguem({ diasPermitidos: [9] }), turnoNoite, false, 0)
    expect(r.pode).toBe(false)
    expect(r.motivo).toBe('só pode em dia 9')
  })

  it('e o caso limpo continua com o rótulo bonito', () => {
    const r = podeAssumir(alguem({ turnosPermitidos: ['MANHA'] }), turnoNoite, false, 0)
    expect(r.pode).toBe(false)
    expect(r.motivo).toBe('só pode Manhã')
  })

  it('nenhum motivo termina em espaço — a marca do rótulo que sumiu', () => {
    const casos: Pessoa['restricoes'][] = [
      { turnosPermitidos: ['xpto' as unknown as 'NOITE'] },
      { diasPermitidos: [42] },
      { diasProibidos: [0] },
      { tetoMensal: 0 },
    ]
    for (const restricoes of casos) {
      const r = podeAssumir(alguem(restricoes), { ...turnoNoite, data: '2026-10-04' }, false, 5)
      expect(r.pode).toBe(false)
      expect(r.motivo).toBeTruthy()
      expect(r.motivo).toBe(r.motivo!.trimEnd())
    }
  })
})
