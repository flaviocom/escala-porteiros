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
  identidade: { titulo: 'Teste', subtitulo: 'Teste', logo: '', pessoa: { singular: 'Pessoa', plural: 'pessoas' } },
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

  /*
    🔴 OS DOIS TESTES DO PISO PASSAVAM POR VACUIDADE — quinta auditoria externa, 05/08/2026.

    Eles eram `if (min != null) expect(...)` e `.filter(x => x.min != null && …)`. Com um mutante que
    faz `menorIntervalo` devolver `null` sempre — ou seja, com a régua do piso completamente cega —,
    este arquivo saía **23/23 verde**. Quem matou o mutante na suíte inteira foi `regras.test.ts`,
    por acaso: o teste que carrega a promessa central deste projeto não a provava.

    A correção é contar quantos foram DE FATO medidos, e exigir que sejam quase todos. Sem esse
    número, "ninguém ficou abaixo do piso" e "não medi ninguém" são a mesma frase verde.
  */
  it('🔴 o piso descoberto é REAL — ninguém fica abaixo dele', () => {
    if (!r.ok) throw new Error(r.motivo)
    const ctx = { bloco: r.bloco, pessoas: pessoas(16), ultimaEscalaAnterior: {}, config: CONFIG }
    let medidos = 0
    for (const p of pessoas(16)) {
      const min = menorIntervalo(ctx, p.id)
      if (min == null) continue // quem tem uma escala só não tem intervalo — é o único caso legítimo
      medidos++
      expect(min).toBeGreaterThanOrEqual(r.pisoAlcancado)
    }
    // Num período de quatro meses com 16 pessoas, todo mundo é escalado mais de uma vez.
    expect(medidos).toBe(16)
  })

  it('🔴 conserta o defeito medido no site antigo: ninguém com intervalo de 1 ou 3 dias', () => {
    if (!r.ok) throw new Error(r.motivo)
    const ctx = { bloco: r.bloco, pessoas: pessoas(16), ultimaEscalaAnterior: {}, config: CONFIG }
    const medidas = pessoas(16).map((p) => ({ nome: p.nome, min: menorIntervalo(ctx, p.id) }))
    // A população medida, ANTES do filtro: sem isto, `min` sempre `null` faria a lista sair vazia
    // e o teste verde — que é exatamente o mutante que passava.
    expect(medidas.filter((x) => x.min != null)).toHaveLength(16)
    expect(medidas.filter((x) => x.min != null && x.min <= 3)).toEqual([])
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
    // A população medida, antes de percorrer: um filtro que não casa com nada faria o `for` não
    // rodar e o teste passar sem ter olhado a fronteira. É o mesmo defeito dos testes do piso.
    expect(primeiros.length).toBeGreaterThan(0)
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

  /*
    🔴 "GERO 8 VERSÕES E ESCOLHO A MELHOR" PODIA SER "GERO 1" — quinta auditoria externa, 05/08/2026.

    Este teste tinha `if (!v.resultado.ok) continue` e media `versoes.length`, que `gerador.ts`
    preenche mesmo quando a versão falha. Com um mutante em que **as 7 versões sorteadas devolvem
    `{ok:false}` sempre**, a suíte inteira saía 232/232 verde — e os três testes vizinhos também
    não pegavam: "a PRIMEIRA versão é o guloso" olha `versoes[0]`, e "a escolhida nunca tem piso
    pior" compara a melhor com `versoes[0]`, o que é verdadeiro por construção.

    Ou seja: a frase que a tela mostra ao Flavio — *"esta escala é a melhor de 8 versões"* — não
    tinha um teste que a sustentasse. Agora tem, e ele conta quantas DERAM CERTO.
  */
  it('todas as versões geradas continuam VÁLIDAS pelo catálogo inteiro — e elas EXISTEM', () => {
    const { versoes } = gerarVariasVersoes(base, 5, 3, 100)
    expect(versoes.length).toBe(5)
    const boas = versoes.filter((v) => v.resultado.ok)
    // A população medida: sem esta linha, cinco fracassos passariam como cinco sucessos.
    expect(boas).toHaveLength(5)
    for (const v of boas) {
      if (!v.resultado.ok) throw new Error('impossível — já filtrado')
      const rel = validar({ bloco: v.resultado.bloco, pessoas: pessoas(16), ultimaEscalaAnterior: {}, config: CONFIG })
      expect(rel.falhasDuras.map((f) => f.id)).toEqual([])
    }
  })

  it('🔴 as versões SORTEADAS são diferentes entre si — senão "8 versões" são 8 cópias', () => {
    const { versoes } = gerarVariasVersoes(base, 5, 3, 100)
    const assinaturas = new Set(
      versoes.filter((v) => v.resultado.ok).map((v) => JSON.stringify(v.resultado.ok && v.resultado.bloco.turnos)),
    )
    // Não se exige 5 distintas: com este elenco, duas sementes podem convergir. Exige-se que a
    // exploração TENHA ACONTECIDO — uma assinatura só significaria que a semente não faz nada.
    expect(assinaturas.size).toBeGreaterThan(1)
  })

  it('a PRIMEIRA versão é o guloso puro — a rede, caso as sorteadas saiam piores', () => {
    const { versoes } = gerarVariasVersoes(base, 3, 3, 100)
    const guloso = gerar(base)
    if (!versoes[0].resultado.ok || !guloso.ok) throw new Error('não gerou')
    expect(JSON.stringify(versoes[0].resultado.bloco.turnos)).toBe(JSON.stringify(guloso.bloco.turnos))
    // `null`, e não `0`: ela não usou semente nenhuma, e registrar `0` fazia a lista mentir sobre
    // como reproduzi-la (`semente: 0` + `candidatos: 3` dá outra escala). Ver `VersaoGerada`.
    expect(versoes[0].semente).toBeNull()
  })

  it('🔴 a escolhida nunca tem piso PIOR que a do guloso — a cascata não pode regredir', () => {
    const { melhor, versoes } = gerarVariasVersoes(base, 8, 3, 55)
    if (!melhor.ok || !versoes[0].resultado.ok) throw new Error('não gerou')
    expect(melhor.pisoAlcancado).toBeGreaterThanOrEqual(versoes[0].resultado.pisoAlcancado)
  })

  /*
    🔴 O BOTÃO "NÃO GOSTEI" — os dois lados da mesma trava, 06/08/2026.

    Ele clicou várias vezes e recebeu sempre a mesma escala; chamou o botão de farsa, e estava certo.
    A causa não era a semente: as oito versões saem DISTINTAS. É a cascata que escolhe sempre a
    gulosa, que semente nenhuma alcança — medido neste mesmo `base`: quatro sementes, UMA escala.

    Um teste só do lado bom não valeria nada aqui. O segundo prova que, sem `recusada`, a resposta
    continua sendo a MELHOR de todas — porque uma "correção" que piorasse a primeira geração para
    fazer a segunda variar teria trocado um defeito por outro pior, e em silêncio.
  */
  it('🔴 recusar uma escala devolve OUTRA — é o que o botão "Não gostei" promete', () => {
    const primeira = gerarVariasVersoes(base, 8, 3, 1)
    if (!primeira.melhor.ok) throw new Error('não gerou')
    // A premissa do teste, medida e não suposta: sem exclusão, a semente nova devolve a MESMA
    // escala. Sem esta linha, o teste de baixo passaria num fixture que já variava sozinho — foi
    // exatamente o que aconteceu na primeira tentativa, e o mutante injetado não derrubou nada.
    const soComSemente = gerarVariasVersoes(base, 8, 3, 101)
    if (!soComSemente.melhor.ok) throw new Error('não gerou')
    expect(JSON.stringify(soComSemente.melhor.bloco.turnos)).toBe(JSON.stringify(primeira.melhor.bloco.turnos))

    const outra = gerarVariasVersoes(base, 8, 3, 101, primeira.melhor.bloco.turnos)
    if (!outra.melhor.ok) throw new Error('não gerou')
    expect(JSON.stringify(outra.melhor.bloco.turnos)).not.toBe(JSON.stringify(primeira.melhor.bloco.turnos))
    // E a outra não pode ser QUALQUER outra: continua passando pelo catálogo duro inteiro.
    const rel = validar({ bloco: outra.melhor.bloco, pessoas: pessoas(16), ultimaEscalaAnterior: {}, config: CONFIG })
    expect(rel.falhasDuras.map((f) => f.id)).toEqual([])
  })

  it('sem recusa, a escolha continua sendo a MELHOR — a correção não pode piorar a 1ª geração', () => {
    const semRecusa = gerarVariasVersoes(base, 8, 3, 7)
    if (!semRecusa.melhor.ok) throw new Error('não gerou')
    const melhorPiso = Math.max(
      ...semRecusa.versoes.filter((v) => v.resultado.ok).map((v) => (v.resultado.ok ? v.resultado.pisoAlcancado : 0)),
    )
    expect(semRecusa.melhor.pisoAlcancado).toBe(melhorPiso)
  })

  it('recusar uma escala que ninguém gerou não muda nada — a recusa não inventa exclusão', () => {
    const normal = gerarVariasVersoes(base, 8, 3, 3)
    const comFantasma = gerarVariasVersoes(base, 8, 3, 3, [])
    if (!normal.melhor.ok || !comFantasma.melhor.ok) throw new Error('não gerou')
    expect(JSON.stringify(comFantasma.melhor.bloco.turnos)).toBe(JSON.stringify(normal.melhor.bloco.turnos))
  })

  it('o índice de Jain é 1 com carga idêntica e cai quando alguém carrega mais', () => {
    expect(indiceDeJain([5, 5, 5, 5])).toBeCloseTo(1)
    expect(indiceDeJain([20, 1, 1, 1])).toBeLessThan(0.5)
    expect(indiceDeJain([])).toBe(1)
  })
})
