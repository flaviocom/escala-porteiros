/**
 * O SOLUÇO DA REDE NÃO PODE VIRAR TELA DE ERRO PARA O IRMÃO.
 *
 * 🔴 POR QUE ESTE ARQUIVO EXISTE. Em 05/08/2026, durante um deploy, o GitHub Pages devolveu **503**
 * num dos arquivos de dados e a validação ao vivo pegou. Naquele caso foi o `config.json`, que tem
 * padrão — o site mostrou o nome genérico com a escala certa, feio mas inofensivo.
 *
 * Se tivesse pegado `blocos.json`, que **não tem padrão**, a tela teria mostrado **erro** para quem
 * só queria saber se está escalado no domingo. Um blip de CDN dura menos de um segundo; desistir na
 * primeira tentativa transforma-o em tela de erro.
 *
 * O que se prova aqui:
 *   1. 503 seguido de sucesso → o irmão vê a escala, não o erro;
 *   2. 404 **não** é repetido — o arquivo não existe, insistir só faz esperar mais;
 *   3. falha de rede também é repetida;
 *   4. quando tudo falha, o padrão vale (config) ou o erro sobe (blocos), como antes.
 *
 * ⚠️ Testa por `carregarDados`, a porta de verdade — não uma função interna exposta só para o teste.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { carregarDados } from './carregar'

const PESSOAS = { pessoas: [{ id: 'ana', nome: 'Ana', ativo: true, restricoes: {} }] }
const BLOCOS = {
  blocos: [{
    id: 'b', inicio: '2026-09-01', fim: '2026-09-30', geradoEm: '2026-09-01T00:00:00-03:00',
    origem: 'algoritmo', pisoAlcancado: 7, elenco: ['ana'], malha: { regras: [] },
    turnos: [{ data: '2026-09-02', tipo: 'NOITE', capacidade: 1, pessoas: ['ana'] }],
  }],
}
const CONFIG = {
  versao: 1, capacidadePadrao: 1, malhaPadrao: { regras: [] }, santaCeia: [],
  identidade: { titulo: 'Portaria X', subtitulo: 'Unidade Y', logo: '', pessoa: { singular: 'Plantonista', plural: 'plantonistas' } },
}

const ok = (corpo: unknown) => new Response(JSON.stringify(corpo), { status: 200, headers: { 'Content-Type': 'application/json' } })
const qual = (url: string) => (url.includes('pessoas') ? 'pessoas' : url.includes('blocos') ? 'blocos' : 'config')
const corpoDe = (k: string) => (k === 'pessoas' ? PESSOAS : k === 'blocos' ? BLOCOS : CONFIG)

/** Falha `quantas` vezes com `status` no arquivo `alvo`, depois entrega o conteúdo certo. */
function redeInstavel(alvo: string, status: number, quantas: number) {
  const falhas: Record<string, number> = {}
  const chamadas: string[] = []
  vi.stubGlobal('fetch', async (url: string) => {
    const k = qual(String(url))
    chamadas.push(k)
    if (k === alvo) {
      falhas[k] = (falhas[k] ?? 0) + 1
      if (falhas[k] <= quantas) return new Response('indisponível', { status })
    }
    return ok(corpoDe(k))
  })
  return chamadas
}

afterEach(() => vi.unstubAllGlobals())

describe('carregar — soluço de rede não vira tela de erro', () => {
  it('🔴 503 no `blocos.json` e depois sucesso: o irmão VÊ A ESCALA', () => {
    redeInstavel('blocos', 503, 1)
    return expect(carregarDados()).resolves.toMatchObject({ turnos: [{ data: '2026-09-02' }] })
  })

  it('🔴 503 no `config.json` NÃO derruba o nome para o genérico se a 2ª tentativa der certo', async () => {
    redeInstavel('config', 503, 2)
    const dados = await carregarDados()
    expect(dados.config.identidade.titulo).toBe('Portaria X')
  })

  it('falha de REDE (não HTTP) também é repetida', async () => {
    let n = 0
    vi.stubGlobal('fetch', async (url: string) => {
      const k = qual(String(url))
      if (k === 'blocos' && ++n === 1) throw new TypeError('Failed to fetch')
      return ok(corpoDe(k))
    })
    // 🔴 Era `resolves.toBeTruthy()`, que passa com QUALQUER objeto — inclusive um sem escala
    // nenhuma dentro. O que este teste promete é que o irmão VÊ A ESCALA depois do soluço.
    const d = await carregarDados()
    expect(n).toBe(2) // tentou de novo, e só uma vez
    expect(d.turnos.length).toBeGreaterThan(0)
  })

  it('🔴 404 NÃO é repetido — o arquivo não existe, insistir só faz a pessoa esperar', async () => {
    const chamadas = redeInstavel('blocos', 404, 99)
    await expect(carregarDados()).rejects.toThrow(/404/)
    expect(chamadas.filter((c) => c === 'blocos')).toHaveLength(1)
  })

  it('🔴 a outra ponta: 503 que NUNCA melhora ainda falha — a repetição não engole o erro', async () => {
    const chamadas = redeInstavel('blocos', 503, 99)
    await expect(carregarDados()).rejects.toThrow(/503/)
    expect(chamadas.filter((c) => c === 'blocos')).toHaveLength(3)
  })

  it('config que nunca carrega cai no padrão GENÉRICO, e a escala continua aparecendo', async () => {
    redeInstavel('config', 503, 99)
    const dados = await carregarDados()
    expect(dados.config.identidade.titulo).toBe('Escala de plantões')
    expect(dados.turnos).toHaveLength(1)
  })
})
