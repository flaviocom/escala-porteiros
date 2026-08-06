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
import type { Bloco, Configuracao, Pessoa, Turno } from './tipos'

// ---------------------------------------------------------------------------
// Construtores de cenário
// ---------------------------------------------------------------------------

function pessoa(id: string, extras: Partial<Pessoa> = {}): Pessoa {
  return { id, nome: id.toUpperCase(), ativo: true, restricoes: {}, ...extras }
}

function turno(data: string, tipo: Turno['tipo'], pessoas: string[], extras: Partial<Turno> = {}): Turno {
  return { data, tipo, pessoas, capacidade: 3, ...extras }
}

/**
 * Configuração dos testes. `santaCeia` traz 16/08/2026 porque é a data que os casos de D9 usam —
 * e, desde 04/08/2026, D9 confere o bloco contra ESTE calendário, não contra si mesmo.
 */
const CONFIG: Configuracao = {
  versao: 1,
  capacidadePadrao: 3,
  malhaPadrao: { regras: [] },
  santaCeia: ['2026-08-16'],
  identidade: { titulo: 'Teste', subtitulo: 'Teste', logo: '', pessoa: { singular: 'Pessoa', plural: 'pessoas' } },
}

function ctxDe(
  turnos: Turno[],
  pessoas: Pessoa[],
  extras: {
    elenco?: string[]
    piso?: number | null
    anterior?: Record<string, string>
    config?: Partial<Configuracao>
    malha?: Bloco['malha']
    origem?: Bloco['origem']
    // Q5 passou a julgar só MÊS INTEIRO, então o intervalo do bloco deixou de ser detalhe: um bloco
    // que vai do primeiro ao último turno quase nunca cobre um mês fechado.
    inicio?: string
    fim?: string
  } = {},
): Contexto {
  const bloco: Bloco = {
    id: 'teste',
    inicio: (extras.inicio ?? turnos[0]?.data ?? '2026-09-01') as Bloco['inicio'],
    fim: (extras.fim ?? turnos[turnos.length - 1]?.data ?? '2026-09-30') as Bloco['fim'],
    geradoEm: '2026-08-04T12:00:00-03:00',
    origem: extras.origem ?? 'algoritmo',
    pisoAlcancado: extras.piso ?? null,
    elenco: extras.elenco ?? pessoas.map((p) => p.id),
    malha: extras.malha ?? { regras: [] },
    turnos,
  }
  return {
    bloco,
    pessoas,
    ultimaEscalaAnterior: extras.anterior ?? {},
    config: { ...CONFIG, ...extras.config },
  }
}

const TRES = [pessoa('ana'), pessoa('bia'), pessoa('caio')]
/** Elenco de quatro, para exercer o lado "sobrou gente" da capacidade (ver D1). */
const QUATRO = [...TRES, pessoa('dora')]

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
  // A OUTRA METADE DA INFRAÇÃO — acrescentada em 04/08/2026 por auditoria independente.
  //
  // Os dois casos acima só cobriam "faltou gente". D1 compara com `===`, então já pegava
  // "sobrou gente" — mas nenhum teste exercia esse lado, e um mutante com `>=` no lugar de `===`
  // passava nos dois. O ajuste manual escala uma pessoa por clique: excesso é plausível.
  it('reprova turno com gente A MAIS que a capacidade', () => {
    const r = rodar('D1', ctxDe([turno('2026-09-06', 'MANHA', ['ana', 'bia', 'caio', 'dora'])], QUATRO))
    expect(r.status).toBe('falha')
    expect(r.violacoes[0].mensagem).toMatch(/\b4 de 3\b/)
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

  // ── O QUE D9 NÃO ENXERGAVA ATÉ 04/08/2026 ────────────────────────────────
  //
  // Ela só conferia turnos que JÁ estivessem marcados `santaCeia` — isto é, conferia o bloco
  // contra ele mesmo. Perdida a marca, a resposta era "0 dia(s) de Santa Ceia no bloco", e
  // aprovava. É o defeito que originou este projeto: o site antigo escala seis irmãos no dia da
  // Ceia porque a data mora no código e ninguém confere contra o calendário.
  it('🔴 reprova quando a data do CALENDÁRIO virou turno comum — a marca se perdeu', () => {
    const r = rodar('D9', ctxDe(
      [turno('2026-08-16', 'MANHA', ['ana', 'bia', 'caio'])], // sem santaCeia: true
      TRES,
    ))
    expect(r.status).toBe('falha')
    expect(r.violacoes[0].mensagem).toContain('16/08/2026')
    expect(r.violacoes[0].mensagem).toContain('3 pessoa(s)')
  })

  it('🔴 reprova dia marcado no bloco que não consta do calendário', () => {
    const r = rodar('D9', ctxDe(
      [turno('2026-09-06', 'MANHA', [], { santaCeia: true, capacidade: 0 })],
      TRES,
    ))
    expect(r.status).toBe('falha')
    expect(r.violacoes[0].mensagem).toContain('não consta do calendário')
  })

  it('aprova quando o dia da Ceia foi PULADO — sem turno nenhum, que é o certo', () => {
    const r = rodar('D9', ctxDe(
      [turno('2026-08-15', 'NOITE', ['ana', 'bia', 'caio']), turno('2026-08-17', 'NOITE', ['ana', 'bia', 'caio'])],
      TRES,
    ))
    expect(r.status).toBe('ok')
  })

  // ── A FRONTEIRA DO PASSADO ────────────────────────────────────────────────
  //
  // O bloco histórico traz 07/06/2026 marcada como Santa Ceia — a data ERRADA do site antigo,
  // congelada de propósito porque é o que os irmãos viram. Cobrar dela o calendário de hoje seria
  // pedir para reescrever o passado, que é a primeira regra que este projeto não viola.
  it('não cobra o calendário de hoje de um bloco IMPORTADO — o passado não se reescreve', () => {
    const r = rodar('D9', ctxDe(
      [turno('2026-06-07', 'MANHA', [], { santaCeia: true, capacidade: 0 })],
      TRES,
      { origem: 'importado' },
    ))
    expect(r.status).toBe('ok')
    expect(r.medida).toContain('bloco importado')
  })

  it('🔴 mas a isenção do passado NÃO é porta dos fundos: com gente escalada, reprova mesmo importado', () => {
    const r = rodar('D9', ctxDe(
      [turno('2026-06-07', 'MANHA', ['ana', 'bia'], { santaCeia: true, capacidade: 0 })],
      TRES,
      { origem: 'importado' },
    ))
    expect(r.status).toBe('falha')
    expect(r.violacoes[0].mensagem).toContain('2 pessoa(s)')
  })

  it('🔴 e o MESMO bloco, gerado pelo sistema, reprova — a isenção é só do passado importado', () => {
    const r = rodar('D9', ctxDe(
      [turno('2026-06-07', 'MANHA', [], { santaCeia: true, capacidade: 0 })],
      TRES,
      { origem: 'algoritmo' },
    ))
    expect(r.status).toBe('falha')
    expect(r.violacoes[0].mensagem).toContain('não consta do calendário')
  })

  it('reprova quando não recebe a configuração — falha FECHADA, nunca aprova no escuro', () => {
    const ctx = ctxDe([turno('2026-08-16', 'MANHA', ['ana'])], TRES)
    // Simula um chamador que não passou a configuração (só possível fora do TypeScript, num script).
    const r = rodar('D9', { ...ctx, config: undefined as unknown as Configuracao })
    expect(r.status).toBe('falha')
    expect(r.medida).toContain('impossível conferir')
  })
})

// ---------------------------------------------------------------------------
// D11 — a regra que pergunta "está tudo aqui?", e não "o que está aqui está certo?"
// ---------------------------------------------------------------------------

describe('D11 — cobertura do período', () => {
  // Domingos à noite. 06, 13 e 20 de setembro de 2026 são domingos.
  const SO_DOMINGO = { regras: [{ diaSemana: 0, turnos: ['NOITE' as const] }] }

  it('🔴 reprova bloco VAZIO — era APROVADO "sem ressalvas" até 04/08/2026', () => {
    const r = rodar('D11', ctxDe([], TRES))
    expect(r.status).toBe('falha')
    expect(r.violacoes[0].mensagem).toContain('VAZIO')
  })

  it('🔴 e o bloco vazio agora REPROVA a validação inteira — é ela que destrava o Publicar', () => {
    const rel = validar(ctxDe([], TRES))
    expect(rel.aprovada).toBe(false)
    expect(rel.falhasDuras.map((f) => f.id)).toContain('D11')
  })

  it('🔴 reprova quando falta um turno que a malha do período prevê', () => {
    const r = rodar('D11', ctxDe(
      [turno('2026-09-06', 'NOITE', ['ana', 'bia', 'caio']), turno('2026-09-20', 'NOITE', ['ana', 'bia', 'caio'])],
      TRES,
      { malha: SO_DOMINGO },
    ))
    expect(r.status).toBe('falha')
    expect(r.violacoes.some((v) => v.mensagem.includes('13/09/2026'))).toBe(true)
  })

  it('🔴 reprova turno em dia que não é de culto nesta malha', () => {
    const r = rodar('D11', ctxDe(
      [turno('2026-09-06', 'NOITE', ['ana', 'bia', 'caio']), turno('2026-09-07', 'NOITE', ['ana', 'bia', 'caio'])],
      TRES,
      { malha: SO_DOMINGO },
    ))
    expect(r.status).toBe('falha')
    expect(r.violacoes.some((v) => v.mensagem.includes('07/09/2026'))).toBe(true)
  })

  it('aprova quando o bloco cobre exatamente o que a malha prevê', () => {
    const r = rodar('D11', ctxDe(
      [
        turno('2026-09-06', 'NOITE', ['ana', 'bia', 'caio']),
        turno('2026-09-13', 'NOITE', ['ana', 'bia', 'caio']),
        turno('2026-09-20', 'NOITE', ['ana', 'bia', 'caio']),
      ],
      TRES,
      { malha: SO_DOMINGO },
    ))
    expect(r.status).toBe('ok')
  })

  it('bloco importado (sem malha declarada) — confere a não-vacuidade e DIZ que só conferiu isso', () => {
    const r = rodar('D11', ctxDe([turno('2026-09-06', 'NOITE', ['ana', 'bia', 'caio'])], TRES))
    expect(r.status).toBe('ok')
    expect(r.medida).toContain('malha não declarada')
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
    // `toMatch` com limite de palavra, não `toContain('1 dia')`: a segunda também casaria com
    // "11 dia(s)" ou "21 dia(s)" — passaria por um valor estruturalmente errado. Achado de
    // auditoria independente em 04/08/2026.
    expect(r.violacoes[0].mensagem).toMatch(/\b1 dia\b/)
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
    expect(r.medida).toMatch(/\b3 dia/)
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

/*
  Nome diferente do bloco lá de cima de propósito — quinta auditoria externa, 05/08/2026: eram dois
  `describe('Q2 — equilíbrio de carga')` idênticos, e a saída do vitest mostrava o mesmo título duas
  vezes. Quem lê o relatório procurando por que Q2 quebrou não sabe em qual dos dois olhar.
*/
describe('Q2 — quem saiu do elenco não conta', () => {
  /*
    🔴 Achado da auditoria externa de 05/08/2026: Q2 era a ÚNICA regra de contagem que percorria o
    `elenco` cru do bloco, e não `pessoasDoBloco`. Quem foi tirado da escala entrava com 0 turnos e
    derrubava a amplitude — textualmente a reclamação do Flavio, na única regra que sobrou.
  */
  it('🔴 quem NÃO está mais no elenco não entra na comparação de carga', () => {
    const gente = [pessoa('ana'), pessoa('bia'), pessoa('caio'), pessoa('fora', { ativo: false })]
    const r = rodar('Q2', ctxDe([
      turno('2026-09-02', 'NOITE', ['ana', 'bia', 'caio']),
      turno('2026-09-09', 'NOITE', ['ana', 'bia', 'caio']),
      turno('2026-09-16', 'NOITE', ['ana', 'bia', 'caio']),
    ], gente, { elenco: ['ana', 'bia', 'caio', 'fora'] }))

    expect(r.status).toBe('ok')
    expect(r.medida).not.toContain('FORA')
  })

  it('🔴 e um id do elenco que NEM EXISTE em pessoas.json também não conta', () => {
    const r = rodar('Q2', ctxDe([
      turno('2026-09-02', 'NOITE', ['ana', 'bia']),
      turno('2026-09-09', 'NOITE', ['ana', 'bia']),
      turno('2026-09-16', 'NOITE', ['ana', 'bia']),
    ], [pessoa('ana'), pessoa('bia')], { elenco: ['ana', 'bia', 'fantasma'] }))

    expect(r.status).toBe('ok')
  })

  it('a outra ponta: desigualdade REAL entre quem está na escala continua sendo acusada', () => {
    const gente = [pessoa('ana'), pessoa('bia')]
    const r = rodar('Q2', ctxDe([
      turno('2026-09-02', 'NOITE', ['ana']),
      turno('2026-09-09', 'NOITE', ['ana']),
      turno('2026-09-16', 'NOITE', ['ana']),
      turno('2026-09-23', 'NOITE', ['ana']),
    ], gente, { elenco: ['ana', 'bia'] }))

    expect(r.status).toBe('aviso')
  })
})

describe('Q5 — piso mensal', () => {
  const teto3 = [pessoa('ana', { restricoes: { tetoMensal: 3 } }), pessoa('bia'), pessoa('caio')]

  /*
    🔴 O MÊS PRECISA SER INTEIRO — mudança de 05/08/2026, pedida pelo Flavio.

    Antes, `ctxDe` fazia o bloco ir do primeiro ao último turno, e um bloco de um dia era "setembro".
    Como Q5 passou a julgar só mês fechado, esses testes precisam DECLARAR o mês — e é bom que
    precisem: a declaração explícita é o que torna visível qual mês está sendo cobrado.
  */
  const setembroInteiro = { inicio: '2026-09-01', fim: '2026-09-30' }

  it('avisa quem tem teto de 3 e ficou com 1', () => {
    const r = rodar('Q5', ctxDe([turno('2026-09-02', 'NOITE', ['ana', 'bia', 'caio'])], teto3, setembroInteiro))
    expect(r.status).toBe('aviso')
    expect(r.violacoes[0].mensagem).toMatch(/\b1 de 3\b/)
  })
  /*
    ── A TOLERÂNCIA, E O QUE ELA NÃO PODE VIRAR ──────────────────────────────────────────────────

    🔴 Instituída pelo Flavio em 05/08/2026: *"elas têm um teto e elas não podem ultrapassar o teto,
    mas ficar abaixo, desde que não fiquem muito abaixo, com tolerância. Tudo bem também."*

    O risco de toda tolerância é virar uma regra que nunca acusa — e uma regra que nunca acusa é
    indistinguível de uma regra apagada. Por isso os dois lados estão aqui: 1 abaixo passa, 2 abaixo
    acusa. Se alguém subir a tolerância sem pensar, o segundo teste fica vermelho.
  */
  it('🔴 ficar 1 abaixo do teto NÃO acusa — teto é máximo, não meta', () => {
    const r = rodar('Q5', ctxDe([
      turno('2026-09-02', 'NOITE', ['ana', 'bia', 'caio']),
      turno('2026-09-09', 'NOITE', ['ana', 'bia', 'caio']),
    ], teto3, setembroInteiro))
    expect(r.status).toBe('ok')
    expect(r.violacoes).toEqual([])
  })

  it('🔴 e a outra ponta: 2 abaixo do teto AINDA acusa — a tolerância não pode calar a regra', () => {
    const r = rodar('Q5', ctxDe([turno('2026-09-02', 'NOITE', ['ana', 'bia', 'caio'])], teto3, setembroInteiro))
    expect(r.status).toBe('aviso')
    expect(r.violacoes[0].mensagem).toContain('1 de 3')
  })

  it('🔴 mês CORTADO não é julgado — não se cobra conta mensal de quem teve meio mês', () => {
    // Foi a origem dos dois avisos de 05/08/2026: o bloco começava em 06/08 e agosto entrava com
    // 24 dos 31 dias. Aqui setembro entra pela metade, com alguém a 3 de distância do teto.
    const r = rodar('Q5', ctxDe(
      [turno('2026-09-16', 'NOITE', ['bia', 'caio'])],
      [pessoa('ana', { restricoes: { tetoMensal: 3 } }), pessoa('bia'), pessoa('caio')],
      { inicio: '2026-09-15', fim: '2026-09-30' },
    ))
    expect(r.status).toBe('ok')
    expect(r.medida).toContain('cortado')
  })

  it('🔴 o par: o MESMO caso num mês inteiro É julgado', () => {
    const r = rodar('Q5', ctxDe(
      [turno('2026-09-16', 'NOITE', ['bia', 'caio'])],
      [pessoa('ana', { restricoes: { tetoMensal: 3 } }), pessoa('bia'), pessoa('caio')],
      { inicio: '2026-09-01', fim: '2026-09-30' },
    ))
    expect(r.status).toBe('aviso')
    expect(r.violacoes[0].mensagem).toContain('0 de 3')
  })

  it('a medida DIZ quantos meses pulou — silêncio sobre mês pulado lê-se como cobertura total', () => {
    const r = rodar('Q5', ctxDe([turno('2026-09-16', 'NOITE', ['ana'])], teto3, { inicio: '2026-09-15', fim: '2026-09-30' }))
    expect(r.medida).toMatch(/0 mês\(es\) inteiro\(s\)/)
    expect(r.medida).toContain('tolerância')
  })

  it('fica ok quando o teto foi atingido', () => {
    const r = rodar('Q5', ctxDe([
      turno('2026-09-02', 'NOITE', ['ana', 'bia', 'caio']),
      turno('2026-09-09', 'NOITE', ['ana', 'bia', 'caio']),
      turno('2026-09-16', 'NOITE', ['ana', 'bia', 'caio']),
    ], teto3))
    expect(r.status).toBe('ok')
  })

  // ── QUEM ESTÁ FORA DA ESCALA NÃO É CONTADO ────────────────────────────────
  //
  // 🔴 Achado do Flavio em 05/08/2026, olhando a tela: ele tirou o Thiago da escala e o sistema
  // continuou acusando "Thiago ficou com 0 de 2" — cinco meses seguidos. Não é injustiça de
  // distribuição: é ausência de participação. Aviso que sempre acusa é aviso que ninguém lê.
  it('🔴 quem NÃO está no elenco deste bloco não é contado nem acusado', () => {
    const r = rodar('Q5', ctxDe(
      [turno('2026-09-02', 'NOITE', ['bia', 'caio'])],
      teto3,
      { elenco: ['bia', 'caio'] }, // ana ficou de fora desta escala
    ))
    expect(r.status).toBe('ok')
    expect(r.violacoes).toEqual([])
    expect(r.medida).not.toContain('ANA')
  })

  it('e a outra ponta: quem ESTÁ no elenco e ficou abaixo continua sendo acusado', () => {
    const r = rodar('Q5', ctxDe(
      [turno('2026-09-02', 'NOITE', ['ana', 'bia', 'caio'])],
      teto3,
      { elenco: ['ana', 'bia', 'caio'], ...setembroInteiro },
    ))
    expect(r.status).toBe('aviso')
    expect(r.violacoes[0].mensagem).toMatch(/\b1 de 3\b/)
  })

  // O fixture põe o nome em maiúsculas (`nome: id.toUpperCase()`), então é 'ANA' que se espera.
  it('a medida NOMEIA de quem está falando — número sozinho pede confiança', () => {
    const r = rodar('Q5', ctxDe([turno('2026-09-02', 'NOITE', ['ana', 'bia', 'caio'])], teto3))
    expect(r.medida).toContain('ANA')
  })
  it('🔴 ficar abaixo do teto NUNCA reprova — só avisa', () => {
    const rel = validar(ctxDe([turno('2026-09-02', 'NOITE', ['ana', 'bia', 'caio'])], teto3))
    expect(rel.aprovada).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// D12 — vaga
// ---------------------------------------------------------------------------

/**
 * 🔴 O CASO QUE AS DUAS RÉGUAS APROVAVAM — quinta auditoria externa, 05/08/2026.
 *
 * `capacidadePadrao: 0` produzia 73 turnos com zero vagas e zero pessoas, e o veredito era
 * *"Aprovada, sem ressalvas."* D1 conta `0 === 0` como completo; D11 compara a grade com ela mesma e
 * casa; Q2 vê amplitude zero. A pergunta que faltava é anterior a todas: **o turno pediu um número
 * que faz sentido?**
 */
describe('D12 — todo turno que existe pede pelo menos uma pessoa', () => {
  it('🔴 turno com capacidade 0 REPROVA — era aprovado como "0 de 0 completo"', () => {
    const rel = validar(ctxDe([turno('2026-09-02', 'NOITE', [], { capacidade: 0 })], TRES))
    expect(rel.aprovada).toBe(false)
    const d12 = rel.resultados.find((r) => r.id === 'D12')!
    expect(d12.status).toBe('falha')
    expect(d12.violacoes[0].mensagem).toContain('sem vaga')
  })

  it('🔴 a escala INTEIRA com capacidade 0 reprova, e não passa por vacuidade', () => {
    const rel = validar(ctxDe(
      [
        turno('2026-09-02', 'NOITE', [], { capacidade: 0 }),
        turno('2026-09-06', 'MANHA', [], { capacidade: 0 }),
        turno('2026-09-09', 'NOITE', [], { capacidade: 0 }),
      ],
      TRES,
    ))
    expect(rel.aprovada).toBe(false)
    expect(rel.resultados.find((r) => r.id === 'D12')!.violacoes).toHaveLength(3)
    // E a prova de que o buraco era real: D1 continua achando tudo "completo".
    expect(rel.resultados.find((r) => r.id === 'D1')!.status).toBe('ok')
  })

  it('🔴 turnos com vaga e NINGUÉM escalado também reprovam', () => {
    const rel = validar(ctxDe(
      [turno('2026-09-02', 'NOITE', []), turno('2026-09-09', 'NOITE', [])],
      TRES,
    ))
    const d12 = rel.resultados.find((r) => r.id === 'D12')!
    expect(d12.status).toBe('falha')
    expect(d12.violacoes.some((v) => v.mensagem.includes('NINGUÉM escalado'))).toBe(true)
  })

  /**
   * 🔴 ESTE TESTE NASCEU DE UM DEFEITO NA PRÓPRIA D12, medido no dado real em 05/08/2026.
   *
   * A primeira versão da regra fazia `for (const t of comGente.slice(0, 5))`, achando que estava
   * limitando o número de mensagens. Estava limitando a CONFERÊNCIA: um turno sem vaga na posição 10
   * saía aprovado. A regra escrita para fechar a classe "portão que mede menos do que diz" tinha o
   * defeito dentro dela — e só apareceu porque a correção foi medida contra o dado real, não só
   * contra o cenário que a inspirou.
   */
  it('🔴 turno sem vaga LONGE do começo também reprova — o `slice` limita o relato, não a busca', () => {
    const turnos = Array.from({ length: 12 }, (_, i) =>
      turno(`2026-09-${String(i + 1).padStart(2, '0')}`, 'NOITE', ['ana', 'bia', 'caio']),
    )
    turnos[10] = turno('2026-09-11', 'NOITE', [], { capacidade: 0 })
    const rel = validar(ctxDe(turnos, TRES))
    const d12 = rel.resultados.find((r) => r.id === 'D12')!
    expect(d12.status).toBe('falha')
    expect(d12.violacoes[0].mensagem).toContain('11/09/2026')
  })

  it('Santa Ceia tem capacidade 0 POR DEFINIÇÃO e não é violação', () => {
    const rel = validar(ctxDe(
      [
        turno('2026-09-02', 'NOITE', ['ana', 'bia', 'caio']),
        turno('2026-08-16', 'MANHA', [], { capacidade: 0, santaCeia: true }),
      ],
      TRES,
      { inicio: '2026-08-16', fim: '2026-09-02' },
    ))
    expect(rel.resultados.find((r) => r.id === 'D12')!.status).toBe('ok')
  })

  it('a outra ponta: escala normal passa, e a medida conta vagas e escalações', () => {
    const rel = validar(ctxDe([turno('2026-09-02', 'NOITE', ['ana', 'bia', 'caio'])], TRES))
    const d12 = rel.resultados.find((r) => r.id === 'D12')!
    expect(d12.status).toBe('ok')
    expect(d12.medida).toContain('3 vaga(s)')
    expect(d12.medida).toContain('3 escalação')
  })
})

/**
 * 🔴 A CAUSA QUE D11 DAVA ERA FALSA — sexta auditoria externa, 05/08/2026.
 *
 * Com um bloco declarando `fim: "2026-11-31"`, `construirGrade` lança (data que não existe), e D11
 * caía no `catch` devolvendo `null` — o que faz a tela dizer *"configuração não recebida — impossível
 * conferir"*. O veredito continuava certo, e só a explicação mentia. Basta isso para mandar alguém
 * procurar o defeito na configuração, que está inteira.
 */
describe('D11 — data que não existe no calendário', () => {
  it('🔴 REPROVA, e a medida diz que a DATA é o problema — não a configuração', () => {
    const rel = validar(ctxDe([turno('2026-11-06', 'NOITE', ['ana', 'bia', 'caio'])], TRES, {
      inicio: '2026-11-01', fim: '2026-11-31',
    }))
    expect(rel.aprovada).toBe(false)
    const d11 = rel.resultados.find((r) => r.id === 'D11')!
    expect(d11.status).toBe('falha')
    expect(d11.medida).toContain('não existe no calendário')
    expect(d11.medida).not.toContain('configuração não recebida')
  })

  it('a outra ponta: período com datas reais é conferido normalmente', () => {
    const rel = validar(ctxDe([turno('2026-11-06', 'NOITE', ['ana', 'bia', 'caio'])], TRES, {
      inicio: '2026-11-01', fim: '2026-11-30',
    }))
    const d11 = rel.resultados.find((r) => r.id === 'D11')!
    expect(d11.medida).not.toContain('não existe no calendário')
  })
})

// ---------------------------------------------------------------------------
// O portão do portão
// ---------------------------------------------------------------------------

describe('cobertura do catálogo', () => {
  it('🔒 TODA regra do catálogo tem teste — regra nova sem teste deixa isto vermelho', () => {
    const comTeste = new Set([
      'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12',
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

describe('D8 — quem saiu continua no passado congelado, e deve continuar', () => {
  /*
    🔴 A `explicacao` da regra sempre prometeu isto — *"quem saiu continua aparecendo no passado
    já publicado, mas não é escalado para a frente"* — e o código não fazia. Apareceu em 06/08/2026
    no gesto mais banal do produto: o dono desativou dois irmãos, e a auditoria passou a acusar o
    bloco HISTÓRICO, de turnos que já aconteceram. Para a acusação sumir seria preciso reescrever o
    passado — a primeira coisa que este projeto proíbe.
  */
  const doisIrmaos: Pessoa[] = [
    { id: 'a', nome: 'Ativo', ativo: true, restricoes: {} },
    { id: 'saiu', nome: 'Quem Saiu', ativo: false, restricoes: {} },
  ]
  const umTurno = [{ data: '2026-03-01', tipo: 'MANHA', pessoas: ['a', 'saiu'], capacidade: 2 } as unknown as Turno]

  it('🔴 bloco IMPORTADO não acusa quem foi desativado — isso é o passado', () => {
    const r = rodar('D8', ctxDe(umTurno, doisIrmaos, { origem: 'importado', elenco: ['a', 'saiu'] }))
    expect(r.violacoes).toHaveLength(0)
    expect(r.medida).toMatch(/passado/i)
  })

  it('🔴 A OUTRA PONTA — no bloco do ALGORITMO, acusa', () => {
    // Sem este caso, o de cima passaria com a regra desligada de vez.
    const r = rodar('D8', ctxDe(umTurno, doisIrmaos, { origem: 'algoritmo', elenco: ['a', 'saiu'] }))
    expect(r.violacoes).toHaveLength(1)
    expect(r.violacoes[0].mensagem).toMatch(/continua escalado/i)
  })

  it('quem está fora do elenco é acusado MESMO no importado — dado corrompido não é história', () => {
    const r = rodar('D8', ctxDe(umTurno, doisIrmaos, { origem: 'importado', elenco: ['a'] }))
    expect(r.violacoes.length).toBeGreaterThan(0)
  })
})
