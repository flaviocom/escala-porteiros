/**
 * 🧪 A VARREDURA DE VARIAÇÕES — todo campo de restrição, sozinho e em combinação.
 *
 * 🔴 POR QUE ESTE ARQUIVO EXISTE. Em 07/08/2026 o dono pediu: *"Corrija o motor que gera a escala
 * com todas as variações de campos. Valide, corrija e audite também o Validador independente."*
 *
 * Medido antes de escrever: o gerador tem **zero leituras diretas** de `diasPermitidos`,
 * `diasProibidos`, `turnosPermitidos` e `ausencias` — tudo passa por `podeAssumir`, a função
 * compartilhada. Isso é bom (uma régua só para elegibilidade) e é ruim pelo mesmo motivo: os testes
 * existentes exercitavam cada campo ISOLADO, e defeito de campo adora morar na COMBINAÇÃO — o teto
 * que só estoura quando a ausência empurra a carga para o mês seguinte, o `diasPermitidos` que vira
 * contradição com `diasProibidos`.
 *
 * O contrato que CADA cenário desta varredura cobra é o mesmo, e é inegociável:
 *
 *   1. o gerador devolve `ok: true` **ou** declara a falha — nunca meia escala;
 *   2. se gerou, a escala passa no catálogo duro INTEIRO (`validar`, 1ª régua);
 *   3. se gerou, a conferência independente (2ª régua, que não importa `regras.ts`) **concorda**;
 *   4. as restrições valem no dado, não só no relatório — o teste CONTA no bloco.
 *
 * A discordância entre as duas réguas é achado por si, ainda que a escala esteja certa: réguas que
 * divergem em silêncio foi exatamente o defeito que originou este projeto.
 */
import { describe, expect, it } from 'vitest'
import { gerar, gerarVariasVersoes } from './gerador'
import { construirGrade, MALHA_ATUAL } from './malha'
import { validar } from './validacao'
import { conferirPorFora } from './conferencia-independente'
import { diaDaSemana } from './datas'
import type { Configuracao, Pessoa, Restricoes } from './tipos'

const PERIODO = { inicio: '2026-09-01', fim: '2026-11-30' }

const CONFIG: Configuracao = {
  versao: 1,
  capacidadePadrao: 3,
  malhaPadrao: MALHA_ATUAL,
  santaCeia: [],
  identidade: { titulo: 'Teste', subtitulo: 'Teste', logo: '', pessoa: { singular: 'Pessoa', plural: 'pessoas' } },
}

function pessoas(n: number, restricoesDe: Record<number, Restricoes> = {}): Pessoa[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`,
    nome: `Pessoa ${i + 1}`,
    ativo: true,
    restricoes: restricoesDe[i + 1] ?? {},
  }))
}

function cenario(elenco: Pessoa[], extra: { santaCeia?: string[]; capacidade?: number; inicio?: string; fim?: string } = {}) {
  const inicio = extra.inicio ?? PERIODO.inicio
  const fim = extra.fim ?? PERIODO.fim
  const grade = construirGrade({
    inicio, fim, malha: MALHA_ATUAL,
    capacidadePadrao: extra.capacidade ?? 3,
    santaCeia: extra.santaCeia ?? [],
  })
  return {
    op: { inicio, fim, grade, pessoas: elenco, elenco: elenco.map((p) => p.id), malha: MALHA_ATUAL },
    config: { ...CONFIG, capacidadePadrao: extra.capacidade ?? 3, santaCeia: extra.santaCeia ?? [] },
  }
}

/**
 * O contrato comum: gera, e se gerou, AS DUAS réguas aprovam. Devolve o bloco para o teste contar
 * a restrição no dado — porque relatório verde sobre dado errado é o pior dos mundos.
 */
function gerarEConferir(elenco: Pessoa[], extra: Parameters<typeof cenario>[1] = {}) {
  const { op, config } = cenario(elenco, extra)
  const r = gerar(op)
  if (!r.ok) return { r, bloco: null }
  const rel = validar({ bloco: r.bloco, pessoas: elenco, ultimaEscalaAnterior: {}, config })
  expect(rel.falhasDuras.map((f) => f.id)).toEqual([])
  const fora = conferirPorFora(r.bloco, elenco, config)
  expect(fora.comFuro.map((a) => `${a.promessa}: ${a.furos[0]}`)).toEqual([])
  return { r, bloco: r.bloco }
}

const turnosDe = (bloco: { turnos: { data: string; tipo: string; pessoas: string[] }[] }, id: string) =>
  bloco.turnos.filter((t) => t.pessoas.includes(id))

describe('cada campo de restrição, sozinho — a restrição vale no DADO', () => {
  it('diasPermitidos: a pessoa só aparece nos dias listados', () => {
    const elenco = pessoas(14, { 1: { diasPermitidos: [0] } })
    const { bloco } = gerarEConferir(elenco)
    const dela = turnosDe(bloco!, 'p1')
    expect(dela.length).toBeGreaterThan(0) // restrição não pode virar exclusão silenciosa
    for (const t of dela) expect(diaDaSemana(t.data)).toBe(0)
  })

  it('diasProibidos: a pessoa nunca aparece no dia proibido', () => {
    const elenco = pessoas(14, { 1: { diasProibidos: [0] } })
    const { bloco } = gerarEConferir(elenco)
    const dela = turnosDe(bloco!, 'p1')
    expect(dela.length).toBeGreaterThan(0)
    for (const t of dela) expect(diaDaSemana(t.data)).not.toBe(0)
  })

  it('turnosPermitidos: a pessoa nunca aparece fora dos tipos listados', () => {
    const elenco = pessoas(14, { 1: { turnosPermitidos: ['NOITE'] } })
    const { bloco } = gerarEConferir(elenco)
    const dela = turnosDe(bloco!, 'p1')
    expect(dela.length).toBeGreaterThan(0)
    for (const t of dela) expect(t.tipo).toBe('NOITE')
  })

  it('tetoMensal: nenhum mês passa do teto', () => {
    const elenco = pessoas(14, { 1: { tetoMensal: 2 } })
    const { bloco } = gerarEConferir(elenco)
    const porMes = new Map<string, number>()
    for (const t of turnosDe(bloco!, 'p1')) {
      const m = t.data.slice(0, 7)
      porMes.set(m, (porMes.get(m) ?? 0) + 1)
    }
    for (const [, n] of porMes) expect(n).toBeLessThanOrEqual(2)
  })

  it('ausência: a pessoa some EXATAMENTE no intervalo, bordas inclusas', () => {
    const elenco = pessoas(14, { 1: { ausencias: [{ inicio: '2026-09-13', fim: '2026-09-27', motivo: 'viagem' }] } })
    const { bloco } = gerarEConferir(elenco)
    const dela = turnosDe(bloco!, 'p1')
    expect(dela.length).toBeGreaterThan(0)
    for (const t of dela) {
      const dentro = t.data >= '2026-09-13' && t.data <= '2026-09-27'
      expect(dentro, `p1 escalada em ${t.data}, dentro da ausência`).toBe(false)
    }
  })

  it('ausência cobrindo o período INTEIRO: zero turnos para ela, e o resto cobre', () => {
    const elenco = pessoas(14, { 1: { ausencias: [{ inicio: PERIODO.inicio, fim: PERIODO.fim, motivo: 'licença' }] } })
    const { bloco } = gerarEConferir(elenco)
    expect(turnosDe(bloco!, 'p1')).toHaveLength(0)
  })
})

describe('combinações — onde defeito de campo costuma morar', () => {
  it('diasPermitidos + turnosPermitidos: só domingo E só noite = só domingo à noite', () => {
    const elenco = pessoas(14, { 1: { diasPermitidos: [0], turnosPermitidos: ['NOITE'] } })
    const { bloco } = gerarEConferir(elenco)
    const dela = turnosDe(bloco!, 'p1')
    expect(dela.length).toBeGreaterThan(0)
    for (const t of dela) {
      expect(diaDaSemana(t.data)).toBe(0)
      expect(t.tipo).toBe('NOITE')
    }
  })

  it('CONTRADIÇÃO diasPermitidos=[0] + diasProibidos=[0]: zero turnos, sem quebrar o resto', () => {
    // `diasProibidos` vence — está documentado no tipo. A pessoa vira inescalável e o motor precisa
    // seguir de pé com as outras 13, sem estourar nem escalar a contraditória "só um pouquinho".
    const elenco = pessoas(14, { 1: { diasPermitidos: [0], diasProibidos: [0] } })
    const { bloco } = gerarEConferir(elenco)
    const soDomingo = turnosDe(bloco!, 'p1').filter((t) => diaDaSemana(t.data) === 0)
    expect(soDomingo).toHaveLength(0)
  })

  it('teto=1 + ausência no 1º mês: a cota não "acumula" para o mês seguinte', () => {
    const elenco = pessoas(14, {
      1: { tetoMensal: 1, ausencias: [{ inicio: '2026-09-01', fim: '2026-09-30', motivo: 'setembro fora' }] },
    })
    const { bloco } = gerarEConferir(elenco)
    const porMes = new Map<string, number>()
    for (const t of turnosDe(bloco!, 'p1')) porMes.set(t.data.slice(0, 7), (porMes.get(t.data.slice(0, 7)) ?? 0) + 1)
    expect(porMes.get('2026-09') ?? 0).toBe(0)
    for (const [, n] of porMes) expect(n).toBeLessThanOrEqual(1)
  })

  it('as CINCO restrições na mesma pessoa, de uma vez', () => {
    const elenco = pessoas(14, {
      1: {
        diasPermitidos: [0, 3],
        diasProibidos: [6],
        turnosPermitidos: ['NOITE'],
        tetoMensal: 2,
        ausencias: [{ inicio: '2026-10-01', fim: '2026-10-15', motivo: 'meio de outubro' }],
      },
    })
    const { bloco } = gerarEConferir(elenco)
    const dela = turnosDe(bloco!, 'p1')
    const porMes = new Map<string, number>()
    for (const t of dela) {
      expect([0, 3]).toContain(diaDaSemana(t.data))
      expect(t.tipo).toBe('NOITE')
      expect(t.data >= '2026-10-01' && t.data <= '2026-10-15').toBe(false)
      porMes.set(t.data.slice(0, 7), (porMes.get(t.data.slice(0, 7)) ?? 0) + 1)
    }
    for (const [, n] of porMes) expect(n).toBeLessThanOrEqual(2)
  })

  it('metade do elenco restrita ao mesmo tempo — e as duas réguas seguem concordando', () => {
    const elenco = pessoas(14, {
      1: { tetoMensal: 2 },
      2: { diasPermitidos: [0] },
      3: { turnosPermitidos: ['NOITE'] },
      4: { ausencias: [{ inicio: '2026-09-01', fim: '2026-09-15', motivo: 'a' }] },
      5: { diasProibidos: [3] },
      6: { tetoMensal: 3, turnosPermitidos: ['NOITE', 'MANHA'] },
      7: { diasProibidos: [0] },
    })
    const { r } = gerarEConferir(elenco)
    expect(r.ok).toBe(true)
  })
})

describe('variações estruturais — capacidade, elenco, Santa Ceia, fronteira', () => {
  it('capacidade 2 e capacidade 4 geram e passam nas duas réguas', () => {
    for (const capacidade of [2, 4]) {
      const { r, bloco } = gerarEConferir(pessoas(16), { capacidade })
      expect(r.ok).toBe(true)
      for (const t of bloco!.turnos.filter((x) => !x.santaCeia)) expect(t.pessoas).toHaveLength(capacidade)
    }
  })

  it('elenco apertado (7 pessoas): gera por inteiro OU declara que não deu — nunca meia escala', () => {
    const { op, config } = cenario(pessoas(7))
    const r = gerar(op)
    if (r.ok) {
      const rel = validar({ bloco: r.bloco, pessoas: op.pessoas, ultimaEscalaAnterior: {}, config })
      expect(rel.falhasDuras.map((f) => f.id)).toEqual([])
      for (const t of r.bloco.turnos.filter((x) => !x.santaCeia)) expect(t.pessoas).toHaveLength(3)
    } else {
      expect(r.motivo.length).toBeGreaterThan(0)
    }
  })

  it('Santa Ceia + restrições convivem: o dia fica vazio e as restrições continuam valendo', () => {
    const elenco = pessoas(14, { 1: { diasPermitidos: [0] } })
    const { bloco } = gerarEConferir(elenco, { santaCeia: ['2026-09-06'] })
    const doDia = bloco!.turnos.filter((t) => t.data === '2026-09-06')
    expect(doDia).toHaveLength(1)
    expect(doDia[0].santaCeia).toBe(true)
    expect(doDia[0].pessoas).toEqual([])
  })

  it('fronteira: quem serviu na véspera não abre o bloco novo', () => {
    const elenco = pessoas(14)
    const { op, config } = cenario(elenco)
    const vespera: Record<string, string> = { p1: '2026-08-31' }
    const r = gerar({ ...op, ultimaEscalaAnterior: vespera })
    if (!r.ok) throw new Error(r.motivo)
    const primeiroDia = r.bloco.turnos.filter((t) => !t.santaCeia).map((t) => t.data).sort()[0]
    const noPrimeiro = r.bloco.turnos.filter((t) => t.data === primeiroDia).flatMap((t) => t.pessoas)
    expect(noPrimeiro).not.toContain('p1')
    const rel = validar({ bloco: r.bloco, pessoas: elenco, ultimaEscalaAnterior: vespera, config })
    expect(rel.falhasDuras.map((f) => f.id)).toEqual([])
  })

  it('fronteira da COTA: quem já tem o teto do mês publicado não pega mais nada naquele mês', () => {
    const elenco = pessoas(14, { 1: { tetoMensal: 3 } })
    const { op } = cenario(elenco)
    const r = gerar({ ...op, escalasPorMesAnterior: { p1: { '2026-09': 3 } } })
    if (!r.ok) throw new Error(r.motivo)
    const emSetembro = turnosDe(r.bloco, 'p1').filter((t) => t.data.startsWith('2026-09'))
    expect(emSetembro).toHaveLength(0)
  })
})

describe('bordas que a varredura de 07/08/2026 encontrou QUEBRADAS — e agora têm dono', () => {
  it('🔴 ausência INVERTIDA (fim < início) vale como ausência, não como permissão', () => {
    /*
      Antes da correção: a condição nunca casava com o intervalo invertido e a pessoa era escalada
      DENTRO da própria viagem — e a segunda régua, com a mesma cegueira, aprovava junto. Dado
      editado à mão entra torto; torto tem de proteger, não liberar.
    */
    const elenco = pessoas(14, { 1: { ausencias: [{ inicio: '2026-09-27', fim: '2026-09-13', motivo: 'digitado ao contrário' }] } })
    const { bloco } = gerarEConferir(elenco)
    for (const t of turnosDe(bloco!, 'p1')) {
      const dentro = t.data >= '2026-09-13' && t.data <= '2026-09-27'
      expect(dentro, `p1 escalada em ${t.data}, dentro da ausência invertida`).toBe(false)
    }
  })

  it('🔴 a conferência independente ACUSA escalação dentro de ausência invertida', () => {
    // A outra ponta da mesma correção: se o gerador (ou uma edição manual do bloco) puser alguém
    // dentro do intervalo torto, a segunda régua tem de ver — antes, as duas cegavam juntas.
    const elenco = pessoas(14, { 1: { ausencias: [{ inicio: '2026-09-27', fim: '2026-09-13', motivo: 'x' }] } })
    const { op, config } = cenario(pessoas(14))
    const r = gerar(op) // gerado SEM a restrição…
    if (!r.ok) throw new Error(r.motivo)
    const escalouDentro = r.bloco.turnos.some(
      (t) => t.pessoas.includes('p1') && t.data >= '2026-09-13' && t.data <= '2026-09-27',
    )
    expect(escalouDentro).toBe(true) // …para garantir que há um infrator de verdade a ser visto
    const fora = conferirPorFora(r.bloco, elenco, config) // …e conferido COM ela
    const doCampo = fora.comFuro.find((a) => a.promessa.includes('ausências'))
    expect(doCampo, 'a régua engoliu a ausência invertida').toBeDefined()
  })

  it('🔴 período invertido: falha DECLARADA, não escala vazia com cara de sucesso', () => {
    const { op } = cenario(pessoas(14), { inicio: '2026-09-30', fim: '2026-09-01' })
    const r = gerar(op)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toContain('invertido')
  })

  it('🔴 período sem nenhum dia de culto: falha DECLARADA', () => {
    const { op } = cenario(pessoas(14), { inicio: '2026-09-01', fim: '2026-09-01' }) // terça
    const r = gerar(op)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toContain('dia de culto')
  })

  it('teto=0 é teto: a pessoa nunca é escalada, e o motor segue de pé', () => {
    const elenco = pessoas(14, { 1: { tetoMensal: 0 } })
    const { bloco } = gerarEConferir(elenco)
    expect(turnosDe(bloco!, 'p1')).toHaveLength(0)
  })
})

describe('varredura SEMEADA — 150 elencos aleatórios, o mesmo contrato', () => {
  /*
    A pesquisa de 07/08/2026 (PESQUISA_2026-08-07-metodos-rostering.md, §6) aponta property-based
    testing como o padrão da indústria para motores de escala: em vez de cenários que um humano
    imaginou, o teste FORJA combinações e cobra as leis do domínio em todas.

    Adotado aqui SEM dependência (`fast-check` ficou de fora de propósito — stdlib > dep): um PRNG
    semeado forja 150 elencos com restrições sorteadas, e cada um passa pelo contrato inteiro. Sem
    shrinking — em compensação, o cenário que falhar é REPRODUTÍVEL pela semente e sai impresso no
    erro, que é o que o shrinking existe para dar.

    ⚠️ O determinismo é parte do teste: sementes fixas, nada de `Math.random()`. Rodar duas vezes dá
    exatamente as mesmas 150 combinações — falha aqui nunca é "flaky", é defeito.
  */
  const mulberry32 = (a: number) => () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  function elencoForjado(semente: number): Pessoa[] {
    const rnd = mulberry32(semente)
    const n = 10 + Math.floor(rnd() * 7) // 10..16
    return Array.from({ length: n }, (_, i) => {
      const r: Restricoes = {}
      if (rnd() < 0.3) {
        const tipo = Math.floor(rnd() * 5)
        if (tipo === 0) r.tetoMensal = 1 + Math.floor(rnd() * 4)
        else if (tipo === 1) r.diasPermitidos = [[0], [3], [6], [0, 3], [0, 6]][Math.floor(rnd() * 5)]
        else if (tipo === 2) r.diasProibidos = [[0], [3], [6]][Math.floor(rnd() * 3)]
        else if (tipo === 3) r.turnosPermitidos = [['NOITE'], ['MANHA'], ['NOITE', 'MANHA']][Math.floor(rnd() * 3)] as Restricoes['turnosPermitidos']
        else {
          // Sem `Date` nenhum, de propósito: o período é Set–Nov/2026 e a conta é de calendário
          // puro (Set=30, Out=31, Nov=30). `Date.UTC` + leitura local é a classe de defeito que o
          // portão de datas persegue — e teste não é isento da regra da casa.
          const diaParaISO = (n: number) =>
            n < 30 ? `2026-09-${String(n + 1).padStart(2, '0')}`
            : n < 61 ? `2026-10-${String(n - 29).padStart(2, '0')}`
            : `2026-11-${String(n - 60).padStart(2, '0')}`
          const dia = 1 + Math.floor(rnd() * 80)
          const ini = diaParaISO(dia)
          const fim = diaParaISO(Math.min(dia + 3 + Math.floor(rnd() * 30), 89))
          // Metade das ausências sai INVERTIDA de propósito — dado torto entra torto na vida real.
          r.ausencias = rnd() < 0.5 ? [{ inicio: ini, fim, motivo: 'forjada' }] : [{ inicio: fim, fim: ini, motivo: 'forjada invertida' }]
        }
      }
      return { id: `p${i + 1}`, nome: `Pessoa ${i + 1}`, ativo: true, restricoes: r }
    })
  }

  it('150 combinações forjadas: gera por inteiro E passa nas duas réguas, ou declara a falha', () => {
    let gerou = 0
    for (let semente = 1; semente <= 150; semente++) {
      const elenco = elencoForjado(semente)
      const { op, config } = cenario(elenco)
      const r = gerar(op)
      const rotulo = `semente ${semente} (${elenco.length} pessoas, ${elenco.filter((p) => Object.keys(p.restricoes).length).length} restritas)`
      if (!r.ok) {
        expect(r.motivo.length, rotulo).toBeGreaterThan(0)
        continue
      }
      gerou++
      const rel = validar({ bloco: r.bloco, pessoas: elenco, ultimaEscalaAnterior: {}, config })
      expect(rel.falhasDuras.map((f) => `${rotulo} · ${f.id}`)).toEqual([])
      const fora = conferirPorFora(r.bloco, elenco, config)
      expect(fora.comFuro.map((a) => `${rotulo} · ${a.promessa}: ${a.furos[0]}`)).toEqual([])
    }
    // Sem este piso, 150 falhas declaradas passariam como 150 sucessos — contrato vazio.
    expect(gerou).toBeGreaterThan(50)
  })
})

describe('as variações atravessam gerarVariasVersoes — o caminho que a TELA usa', () => {
  it('com restrições pesadas, TODAS as versões válidas continuam respeitando-as', () => {
    const elenco = pessoas(14, {
      1: { tetoMensal: 2 },
      2: { diasPermitidos: [0] },
      3: { ausencias: [{ inicio: '2026-09-01', fim: '2026-09-30', motivo: 'x' }] },
    })
    const { op, config } = cenario(elenco)
    const { versoes } = gerarVariasVersoes(op, 8, 3, 42)
    const validas = versoes.filter((v) => v.resultado.ok)
    expect(validas.length).toBeGreaterThan(0)
    for (const v of validas) {
      if (!v.resultado.ok) continue
      const rel = validar({ bloco: v.resultado.bloco, pessoas: elenco, ultimaEscalaAnterior: {}, config })
      expect(rel.falhasDuras.map((f) => f.id)).toEqual([])
      const fora = conferirPorFora(v.resultado.bloco, elenco, config)
      expect(fora.comFuro.map((a) => a.promessa)).toEqual([])
    }
  })

  it('recusar uma escala não afrouxa restrição nenhuma na escala substituta', () => {
    const elenco = pessoas(14, { 1: { tetoMensal: 2, turnosPermitidos: ['NOITE'] } })
    const { op, config } = cenario(elenco)
    const primeira = gerarVariasVersoes(op, 8, 3, 1)
    if (!primeira.melhor.ok) throw new Error('não gerou')
    const outra = gerarVariasVersoes(op, 8, 3, 101, primeira.melhor.bloco.turnos)
    if (!outra.melhor.ok) throw new Error('não gerou')
    const rel = validar({ bloco: outra.melhor.bloco, pessoas: elenco, ultimaEscalaAnterior: {}, config })
    expect(rel.falhasDuras.map((f) => f.id)).toEqual([])
    for (const t of turnosDe(outra.melhor.bloco, 'p1')) expect(t.tipo).toBe('NOITE')
  })
})
