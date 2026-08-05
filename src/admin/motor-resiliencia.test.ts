/**
 * O MOTOR NÃO PODE JOGAR FORA O TRABALHO JÁ ACEITO POR CAUSA DE UM JSON TRUNCADO.
 *
 * 🔴 POR QUE ESTE ARQUIVO EXISTE (P4.8). Uma falha de **validação** ganhava 3 tentativas, com a
 * lista de violações entregue ao motor para corrigir. Uma resposta **malformada** ganhava zero: o
 * `catch` devolvia `{ ok: false }` e levava junto os meses já aceitos.
 *
 * Modelo de linguagem devolve JSON cortado com alguma frequência — é a falha mais banal do caminho,
 * e era a única sem rede. Num bloco de cinco meses, quatro meses de trabalho aceito iam embora
 * porque o quinto veio com uma chave a menos.
 *
 * ⚠️ A DISTINÇÃO QUE ESTE ARQUIVO TRAVA: rede fora, chave errada e crédito zerado **não melhoram
 * com insistência** e continuam abortando na hora. Só a resposta malformada é retentada. Sem os
 * dois lados, "retentar" viraria "insistir para sempre num erro que não passa".
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { pedirProposta } from './motor'
import type { Bloco, Configuracao, Pessoa } from '../dominio/tipos'

const CONFIG: Configuracao = {
  versao: 1,
  capacidadePadrao: 1,
  malhaPadrao: { regras: [] },
  santaCeia: [],
  identidade: { titulo: 'Teste', subtitulo: '', logo: '', pessoa: { singular: 'Pessoa', plural: 'pessoas' } },
}

const pessoas: Pessoa[] = [
  { id: 'ana', nome: 'Ana', ativo: true, restricoes: {} },
  { id: 'bia', nome: 'Bia', ativo: true, restricoes: {} },
]

/** Dois meses, um turno em cada — o mínimo para provar que o 1º sobrevive ao tropeço do 2º. */
const base: Bloco = {
  id: 'b', inicio: '2026-09-01', fim: '2026-10-31',
  geradoEm: '2026-09-01', origem: 'algoritmo', pisoAlcancado: null,
  elenco: ['ana', 'bia'], malha: { regras: [] },
  turnos: [
    { data: '2026-09-02', tipo: 'NOITE', capacidade: 1, pessoas: [] },
    { data: '2026-10-07', tipo: 'NOITE', capacidade: 1, pessoas: [] },
  ],
}

/** Resposta boa para o mês pedido, lida do próprio prompt. */
function respostaBoa(prompt: string) {
  const turnos = [...prompt.matchAll(/- (\d{4}-\d{2}-\d{2}) \(.*?,\s*(Manhã|Tarde|Noite)/g)].map((m) => ({
    data: m[1],
    tipo: m[2] === 'Noite' ? 'NOITE' : m[2] === 'Manhã' ? 'MANHA' : 'TARDE',
    pessoas: ['ana'],
  }))
  return JSON.stringify({ turnos, raciocinio: 'ok' })
}

/** Um motor de mentira: `roteiro` diz o que responder em cada chamada, na ordem. */
function motorDeMentira(roteiro: Array<'boa' | 'truncada' | { erro: number }>) {
  let i = 0
  const prompts: string[] = []
  vi.stubGlobal('fetch', async (_url: string, init?: RequestInit) => {
    const corpo = JSON.parse(String(init?.body ?? '{}'))
    const prompt = corpo.messages?.[0]?.content ?? ''
    prompts.push(prompt)
    const passo = roteiro[Math.min(i++, roteiro.length - 1)]

    if (typeof passo === 'object') {
      return new Response(JSON.stringify({ error: { message: 'recusado' } }), { status: passo.erro })
    }
    const texto = passo === 'boa' ? respostaBoa(prompt) : '{ "turnos": [ { "data": "2026-' // cortado no meio
    return new Response(JSON.stringify({ content: [{ type: 'text', text: texto }] }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })
  })
  return prompts
}

afterEach(() => vi.unstubAllGlobals())

const pedir = () => pedirProposta('chave-de-mentira', base, pessoas, {}, CONFIG)

describe('motor — resposta malformada não descarta o trabalho aceito (P4.8)', () => {
  it('🔴 JSON truncado no 2º mês: RETENTA, e o 1º mês sobrevive', async () => {
    // setembro: boa · outubro: truncada, depois boa.
    const prompts = motorDeMentira(['boa', 'truncada', 'boa'])
    const r = await pedir()

    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.proposta.bloco.turnos).toHaveLength(2)
    expect(r.proposta.bloco.turnos.every((t) => t.pessoas.length === 1)).toBe(true)
    // E o mês que tropeçou registra as 2 tentativas — o número é a prova de que houve retentativa.
    expect(r.proposta.tentativasPorMes['2026-10']).toBe(2)
    // Houve 3 chamadas: setembro, outubro (falhou), outubro de novo.
    expect(prompts).toHaveLength(3)
  })

  it('🔴 e o motor é AVISADO do que fez de errado — senão a retentativa é chute', async () => {
    const prompts = motorDeMentira(['truncada', 'boa'])
    await pedir()
    expect(prompts[1]).toMatch(/não era JSON válido/i)
    expect(prompts[1]).toMatch(/SOMENTE com o objeto JSON/i)
  })

  it('🔴 A OUTRA PONTA: truncada SEMPRE ainda falha — a retentativa não é infinita', async () => {
    const prompts = motorDeMentira(['truncada'])
    const r = await pedir()

    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.causa).toBe('resposta-invalida')
    // 3 tentativas no mês que travou, e nem uma a mais.
    expect(prompts).toHaveLength(3)
  })

  it('🔴 rede/chave/crédito NÃO são retentados — insistir não conserta credencial errada', async () => {
    const prompts = motorDeMentira([{ erro: 401 }])
    const r = await pedir()

    expect(r.ok).toBe(false)
    expect(prompts).toHaveLength(1)
  })

  it('sem nenhum tropeço, nada muda: uma chamada por mês', async () => {
    const prompts = motorDeMentira(['boa'])
    const r = await pedir()
    expect(r.ok).toBe(true)
    expect(prompts).toHaveLength(2)
  })
})
