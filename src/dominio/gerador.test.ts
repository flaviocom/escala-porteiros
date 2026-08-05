/**
 * Testes do GERADOR — as duas coisas que o Flavio pediu explicitamente:
 *
 *   1. o piso de distanciamento é **descoberto**, não cravado;
 *   2. quando não dá para gerar, o sistema **diz que não deu** — nunca entrega escala pela metade.
 *
 * E a terceira, que é a mais importante e ninguém pede porque parece óbvia: **o que o gerador produz
 * tem de passar na validação**. No site anterior gerador e validação divergiam, e essa divergência
 * era invisível porque ninguém rodava os dois juntos.
 */
import { describe, expect, it } from 'vitest'
import { gerar, gerarVariasVersoes, indiceDeJain, pisoTeorico } from './gerador'
import { construirGrade, MALHA_ATUAL } from './malha'
import { validar } from './validacao'
import { menorIntervalo } from './regras'
import type { Configuracao, Pessoa } from './tipos'

function pessoas(n: number, extras: Partial<Pessoa>[] = []): Pessoa[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`,
    nome: `Pessoa ${i + 1}`,
    ativo: true,
    restricoes: {},
    ...(extras[i] ?? {}),
  }))
}

const SET_DEZ = { inicio: '2026-09-01', fim: '2026-12-30' }

/**
 * A configuração que as regras recebem. Precisa bater com o que `gradePadrao()` usa: é contra ela
 * que D11 confere se o bloco cobre o período, e contra `santaCeia` que D9 confere o calendário.
 * Divergir aqui faria o teste acusar o gerador por um descompasso do próprio teste.
 */
const CONFIG: Configuracao = {
  versao: 1,
  capacidadePadrao: 3,
  malhaPadrao: MALHA_ATUAL,
  santaCeia: [],
  identidade: { titulo: 'Teste', subtitulo: 'Teste' },
}

function gradePadrao(inicio = SET_DEZ.inicio, fim = SET_DEZ.fim) {
  return construirGrade({ inicio, fim, malha: MALHA_ATUAL, capacidadePadrao: 3 })
}

describe('piso teórico', () => {
  it('sai da folga real da escala, não de um número inventado', () => {
    const grade = gradePadrao()
    const p = pisoTeorico(grade, 16, SET_DEZ.inicio, SET_DEZ.fim)
    // 73 turnos x 3 vagas = 219 para 16 pessoas em 121 dias -> ~8,8 dias
    expect(p).toBeGreaterThanOrEqual(7)
    expect(p).toBeLessThanOrEqual(10)
  })
})

describe('geração com elenco folgado', () => {
  const r = gerar({
    ...SET_DEZ,
    grade: gradePadrao(),
    pessoas: pessoas(16),
    elenco: pessoas(16).map((p) => p.id),
    malha: MALHA_ATUAL,
  })

  it('gera com sucesso', () => {
    expect(r.ok).toBe(true)
  })

  it('descobre um piso e diz qual foi', () => {
    if (!r.ok) throw new Error(r.motivo)
    expect(r.pisoAlcancado).toBeGreaterThanOrEqual(1)
    expect(r.relato).toContain('Piso alcançado')
  })

  it('🔴 o piso descoberto é REAL — ninguém fica abaixo dele', () => {
    if (!r.ok) throw new Error(r.motivo)
    const ctx = { bloco: r.bloco, pessoas: pessoas(16), ultimaEscalaAnterior: {}, config: CONFIG }
    for (const p of pessoas(16)) {
      const min = menorIntervalo(ctx, p.id)
      if (min != null) expect(min).toBeGreaterThanOrEqual(r.pisoAlcancado)
    }
  })

  it('🔴 conserta o defeito medido no site antigo: ninguém com intervalo de 1 ou 3 dias', () => {
    if (!r.ok) throw new Error(r.motivo)
    const ctx = { bloco: r.bloco, pessoas: pessoas(16), ultimaEscalaAnterior: {}, config: CONFIG }
    const curtos = pessoas(16)
      .map((p) => ({ nome: p.nome, min: menorIntervalo(ctx, p.id) }))
      .filter((x) => x.min != null && x.min <= 3)
    expect(curtos).toEqual([])
  })

  it('🔒 o que o gerador produz PASSA na validação — gerador e regras não divergem', () => {
    if (!r.ok) throw new Error(r.motivo)
    const rel = validar({ bloco: r.bloco, pessoas: pessoas(16), ultimaEscalaAnterior: {}, config: CONFIG })
    expect(rel.falhasDuras.map((f) => `${f.id}: ${f.violacoes[0]?.mensagem ?? ''}`)).toEqual([])
    expect(rel.aprovada).toBe(true)
  })

  it('é determinístico — mesma entrada, mesma escala', () => {
    const r2 = gerar({
      ...SET_DEZ,
      grade: gradePadrao(),
      pessoas: pessoas(16),
      elenco: pessoas(16).map((p) => p.id),
      malha: MALHA_ATUAL,
    })
    if (!r.ok || !r2.ok) throw new Error('não gerou')
    expect(r2.bloco.turnos).toEqual(r.bloco.turnos)
    expect(r2.pisoAlcancado).toBe(r.pisoAlcancado)
  })
})

describe('geração respeitando as restrições reais do elenco atual', () => {
  const elenco = pessoas(16, [
    { id: 'p1', nome: 'Adilson', restricoes: { diasPermitidos: [0], turnosPermitidos: ['NOITE'] } },
    { id: 'p2', nome: 'Thiago', restricoes: { diasPermitidos: [3], turnosPermitidos: ['NOITE'], tetoMensal: 2 } },
    { id: 'p3', nome: 'Williams', restricoes: { tetoMensal: 3 } },
    { id: 'p4', nome: 'Eduardo', restricoes: { diasProibidos: [3] } },
    { id: 'p5', nome: 'Elson', restricoes: { diasProibidos: [3] } },
    { id: 'p6', nome: 'Carlos Henrique', restricoes: { diasProibidos: [3] } },
  ])

  const r = gerar({
    ...SET_DEZ,
    grade: gradePadrao(),
    pessoas: elenco,
    elenco: elenco.map((p) => p.id),
    malha: MALHA_ATUAL,
  })

  it('gera mesmo com as seis restrições ativas', () => {
    if (!r.ok) throw new Error(`${r.motivo} — travou em ${JSON.stringify(r.turnoQueTravou)}`)
    expect(r.ok).toBe(true)
  })

  it('🔒 e o resultado passa na validação inteira', () => {
    if (!r.ok) throw new Error(r.motivo)
    const rel = validar({ bloco: r.bloco, pessoas: elenco, ultimaEscalaAnterior: {}, config: CONFIG })
    expect(rel.falhasDuras.map((f) => f.id)).toEqual([])
  })
})

describe('🔴 quando NÃO dá para gerar, o sistema diz que não deu', () => {
  const r = gerar({
    ...SET_DEZ,
    grade: gradePadrao(),
    pessoas: pessoas(2),
    elenco: ['p1', 'p2'],
    malha: MALHA_ATUAL,
  })

  it('não devolve uma escala pela metade', () => {
    expect(r.ok).toBe(false)
  })

  it('explica em português e diz ONDE travou', () => {
    if (r.ok) throw new Error('deveria ter falhado')
    expect(r.motivo).toContain('Não foi possível gerar')
    expect(r.turnoQueTravou).toBeDefined()
    expect(r.turnoQueTravou!.faltaram).toBeGreaterThan(0)
  })

  it('mostra os pisos que tentou, para a decisão não ficar opaca', () => {
    if (r.ok) throw new Error('deveria ter falhado')
    expect(r.pisosTentados.length).toBeGreaterThan(0)
    expect(r.pisosTentados[r.pisosTentados.length - 1]).toBe(1)
  })
})

describe('🔴 a FRONTEIRA com o bloco anterior', () => {
  it('quem trabalhou na véspera não é escalado no primeiro dia do bloco novo', () => {
    const elenco = pessoas(16)
    const r = gerar({
      inicio: '2026-09-01',
      fim: '2026-09-30',
      grade: construirGrade({ inicio: '2026-09-01', fim: '2026-09-30', malha: MALHA_ATUAL, capacidadePadrao: 3 }),
      pessoas: elenco,
      elenco: elenco.map((p) => p.id),
      malha: MALHA_ATUAL,
      ultimaEscalaAnterior: { p1: '2026-08-31', p2: '2026-08-30' },
    })
    if (!r.ok) throw new Error(r.motivo)
    const primeiros = r.bloco.turnos.filter((t) => t.data === '2026-09-02') // 1ª quarta
    for (const t of primeiros) {
      expect(t.pessoas).not.toContain('p1')
      expect(t.pessoas).not.toContain('p2')
    }
  })
})

describe('Santa Ceia', () => {
  it('o dia marcado entra na escala sem ninguém e não recebe turnos normais', () => {
    const elenco = pessoas(16)
    const grade = construirGrade({
      inicio: '2026-08-01', fim: '2026-08-31',
      malha: MALHA_ATUAL, capacidadePadrao: 3, santaCeia: ['2026-08-16'],
    })
    const r = gerar({
      inicio: '2026-08-01', fim: '2026-08-31', grade,
      pessoas: elenco, elenco: elenco.map((p) => p.id), malha: MALHA_ATUAL,
    })
    if (!r.ok) throw new Error(r.motivo)
    const doDia = r.bloco.turnos.filter((t) => t.data === '2026-08-16')
    expect(doDia).toHaveLength(1)
    expect(doDia[0].santaCeia).toBe(true)
    expect(doDia[0].pessoas).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// GRASP — várias versões, e o determinismo que a promessa protege
// ---------------------------------------------------------------------------

describe('🔴 gerar várias versões sem quebrar a conferência', () => {
  const base = { ...SET_DEZ, grade: gradePadrao(), pessoas: pessoas(16), elenco: pessoas(16).map((p) => p.id), malha: MALHA_ATUAL }

  it('mesma entrada e MESMA semente → escala idêntica, byte a byte', () => {
    const a = gerar({ ...base, candidatos: 3, semente: 42 })
    const b = gerar({ ...base, candidatos: 3, semente: 42 })
    if (!a.ok || !b.ok) throw new Error('não gerou')
    expect(JSON.stringify(a.bloco.turnos)).toBe(JSON.stringify(b.bloco.turnos))
  })

  it('🔴 sementes DIFERENTES → escalas diferentes (senão "3 versões" seriam 3 cópias)', () => {
    const a = gerar({ ...base, candidatos: 3, semente: 1 })
    const b = gerar({ ...base, candidatos: 3, semente: 2 })
    if (!a.ok || !b.ok) throw new Error('não gerou')
    expect(JSON.stringify(a.bloco.turnos)).not.toBe(JSON.stringify(b.bloco.turnos))
  })

  it('sem semente, continua sendo o guloso de sempre — nada mudou para quem não pediu', () => {
    const a = gerar(base)
    const b = gerar(base)
    if (!a.ok || !b.ok) throw new Error('não gerou')
    expect(JSON.stringify(a.bloco.turnos)).toBe(JSON.stringify(b.bloco.turnos))
    expect(a.bloco.semente).toBeUndefined()
  })

  it('a semente fica GRAVADA no bloco — sem isso a escala é irreproduzível', () => {
    const r = gerar({ ...base, candidatos: 3, semente: 7 })
    if (!r.ok) throw new Error('não gerou')
    expect(r.bloco.semente).toBe(7)
  })

  it('candidatos = 1 é idêntico ao guloso — a porta de saída da técnica', () => {
    const guloso = gerar(base)
    const k1 = gerar({ ...base, candidatos: 1, semente: 999 })
    if (!guloso.ok || !k1.ok) throw new Error('não gerou')
    expect(JSON.stringify(k1.bloco.turnos)).toBe(JSON.stringify(guloso.bloco.turnos))
  })

  it('todas as versões geradas continuam VÁLIDAS pelas 16 regras', () => {
    const { versoes } = gerarVariasVersoes(base, 5, 3, 100)
    expect(versoes.length).toBe(5)
    for (const v of versoes) {
      if (!v.resultado.ok) continue
      const rel = validar({ bloco: v.resultado.bloco, pessoas: pessoas(16), ultimaEscalaAnterior: {}, config: CONFIG })
      expect(rel.falhasDuras.map((f) => f.id)).toEqual([])
    }
  })

  it('a PRIMEIRA versão é o guloso puro — a rede, caso as sorteadas saiam piores', () => {
    const { versoes } = gerarVariasVersoes(base, 3, 3, 100)
    const guloso = gerar(base)
    if (!versoes[0].resultado.ok || !guloso.ok) throw new Error('não gerou')
    expect(JSON.stringify(versoes[0].resultado.bloco.turnos)).toBe(JSON.stringify(guloso.bloco.turnos))
    expect(versoes[0].semente).toBe(0)
  })

  it('🔴 a escolhida nunca tem piso PIOR que a do guloso — a cascata não pode regredir', () => {
    const { melhor, versoes } = gerarVariasVersoes(base, 8, 3, 55)
    if (!melhor.ok || !versoes[0].resultado.ok) throw new Error('não gerou')
    expect(melhor.pisoAlcancado).toBeGreaterThanOrEqual(versoes[0].resultado.pisoAlcancado)
  })

  it('o índice de Jain é 1 com carga idêntica e cai quando alguém carrega mais', () => {
    expect(indiceDeJain([5, 5, 5, 5])).toBeCloseTo(1)
    expect(indiceDeJain([20, 1, 1, 1])).toBeLessThan(0.5)
    expect(indiceDeJain([])).toBe(1)
  })
})
