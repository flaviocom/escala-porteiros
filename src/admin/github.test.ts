/**
 * 🔒 A RECUSA DO TOKEN PRECISA DIZER O QUE CONSERTAR.
 *
 * 🔴 Por que estes testes existem: as mensagens eram genéricas — *"O GitHub recusou o token
 * (HTTP 404)"*. E 404 é a resposta mais confusa que aparece aqui: num token *fine-grained*, o
 * **repositório não marcado** volta como *não encontrado*, não como *sem permissão*. Quem lê "404"
 * procura erro de digitação, e o problema está numa caixa de seleção da outra página.
 *
 * O Flavio ficou travado exatamente aqui: *"não houve uma maneira concreta de preparar o login"*.
 * Publicar pela tela é a funcionalidade principal — a mensagem que barra o caminho tem de nomear o
 * campo a corrigir, não o código HTTP.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { COMO_CRIAR_O_TOKEN, conferirToken } from './github'

const respostaFalsa = (status: number, corpo: unknown = {}) =>
  vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => corpo,
  } as unknown as Response)

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('conferirToken — cada recusa nomeia o campo a corrigir', () => {
  it('🔴 401 → manda conferir se o valor foi copiado inteiro', async () => {
    vi.stubGlobal('fetch', respostaFalsa(401))
    const r = await conferirToken('token-qualquer')
    expect(r.ok).toBe(false)
    expect(r.detalhe).toMatch(/INTEIRO/i)
    expect(r.detalhe).not.toMatch(/^O GitHub recusou o token \(HTTP/)
  })

  it('🔴 404 → explica que é o REPOSITÓRIO não marcado, não erro de digitação', async () => {
    vi.stubGlobal('fetch', respostaFalsa(404))
    const r = await conferirToken('token-qualquer')
    expect(r.ok).toBe(false)
    expect(r.detalhe).toMatch(/Only select repositories/)
    expect(r.detalhe).toMatch(/escala-porteiros/)
  })

  it('🔴 sem escrita → nomeia "Contents: Read and write"', async () => {
    vi.stubGlobal('fetch', respostaFalsa(200, { full_name: 'x/y', permissions: { push: false } }))
    const r = await conferirToken('token-qualquer')
    expect(r.ok).toBe(false)
    expect(r.detalhe).toMatch(/Contents/)
    expect(r.detalhe).toMatch(/Read and write/)
  })

  it('rede fora → diz que não falou com o GitHub, e manda conferir a conexão', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('failed to fetch')))
    const r = await conferirToken('token-qualquer')
    expect(r.ok).toBe(false)
    expect(r.detalhe).toMatch(/conexão/i)
  })

  it('e a outra ponta: token bom é ACEITO, com o repositório na mensagem', async () => {
    vi.stubGlobal('fetch', respostaFalsa(200, { full_name: 'flaviocom/escala-porteiros', permissions: { push: true } }))
    const r = await conferirToken('token-qualquer')
    expect(r.ok).toBe(true)
    expect(r.detalhe).toContain('flaviocom/escala-porteiros')
  })
})

describe('COMO_CRIAR_O_TOKEN — o guia e o verificador não podem divergir', () => {
  it('aponta para a página de token fine-grained do GitHub', () => {
    expect(COMO_CRIAR_O_TOKEN.url).toBe('https://github.com/settings/personal-access-tokens/new')
  })

  it('🔴 manda marcar EXATAMENTE o que o verificador exige', () => {
    const tudo = COMO_CRIAR_O_TOKEN.passos.map((p) => `${p.campo}: ${p.valor}`).join(' | ')
    // O que `conferirToken` cobra quando falta: o repositório na lista e Contents com escrita.
    expect(tudo).toMatch(/Only select repositories/)
    expect(tudo).toMatch(/escala-porteiros/)
    expect(tudo).toMatch(/Contents.*Read and write/)
  })
})
