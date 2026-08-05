/**
 * AMBIENTE DE TESTE DO PUBLICAR — um GitHub de mentira, e o código de VERDADE.
 *
 * 🔴 POR QUE ESTE ARQUIVO EXISTE. Em 05/08/2026 o Flavio perguntou: *"você testou o publicar num
 * ambiente de teste?"*. A resposta honesta era **não**. `github.test.ts` cobria a conferência do
 * token e o texto do guia — nada exercitava `publicarDados`, que é a função que **escreve na escala
 * que os irmãos veem**. O caminho mais consequente do produto era o único sem teste, justamente
 * porque testá-lo de verdade escreveria no repositório real.
 *
 * A saída é um GitHub de mentira: `fetch` é trocado por um servidor falso que guarda o que recebeu.
 * O código exercitado é o de produção, sem uma linha de adaptação — o que se troca é o mundo lá
 * fora, não o programa.
 *
 * O que se prova aqui, e cada item é uma forma de estragar a escala da congregação:
 *   1. as DUAS pastas recebem — subir em só uma é o erro que não avisa;
 *   2. o conteúdo gravado é EXATAMENTE o que o site vai servir, byte a byte;
 *   3. arquivo que já existe é substituído com `sha` (sem ele o GitHub recusa);
 *   4. arquivo novo é criado sem `sha` (mandar `sha` de arquivo inexistente falha);
 *   5. 🔴 quando a SEGUNDA pasta falha, a resposta traz o que JÁ foi gravado — é disso que a tela
 *      precisa para não mentir dizendo "nada foi publicado pela metade";
 *   6. o 409 (alguém publicou de outro aparelho) vira instrução, não código de erro cru.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { publicarDados } from './github'

const TOKEN_FALSO = 'github_pat_de_mentira_para_teste'

interface Gravacao { caminho: string; conteudo: string; sha?: string; mensagem: string }

/**
 * O GitHub de mentira.
 *
 * `existentes` são os arquivos que o repositório já tem — decide se o PUT vai com `sha` ou sem.
 * `falharEm` permite mandar uma pasta específica recusar, que é como se reproduz a falha parcial.
 */
function githubDeMentira(op: {
  existentes?: Record<string, string>
  falharEm?: { caminho: string; status: number; corpo?: string }
} = {}) {
  const existentes = op.existentes ?? {}
  const gravadas: Gravacao[] = []

  const resposta = (corpo: unknown, status = 200) =>
    new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })

  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    const caminho = decodeURIComponent(String(url).split('/contents/')[1] ?? '').split('?')[0]

    // GET — o `sha` atual, ou 404 se o arquivo ainda não existe.
    if (!init?.method || init.method === 'GET') {
      if (!(caminho in existentes)) return resposta({ message: 'Not Found' }, 404)
      return resposta({ sha: existentes[caminho] })
    }

    // PUT — a gravação.
    if (op.falharEm && caminho === op.falharEm.caminho)
      return new Response(op.falharEm.corpo ?? 'recusado', { status: op.falharEm.status })

    const corpo = JSON.parse(String(init.body)) as { content: string; sha?: string; message: string }
    // O conteúdo chega em base64; guardamos já decodificado, que é o que se quer conferir.
    gravadas.push({
      caminho,
      conteudo: new TextDecoder().decode(Uint8Array.from(atob(corpo.content), (c) => c.charCodeAt(0))),
      sha: corpo.sha,
      mensagem: corpo.message,
    })
    return resposta({ commit: { sha: `commit-de-${caminho}` } })
  })

  return gravadas
}

afterEach(() => vi.unstubAllGlobals())

const ESCALA = { versao: 1, blocos: [{ id: 'bloco-teste', turnos: [{ data: '2026-09-06', tipo: 'NOITE', pessoas: ['ana'] }] }] }

describe('publicar — as duas pastas, e o conteúdo exato', () => {
  it('🔴 grava nas DUAS pastas: subir em só uma é o erro que não avisa', async () => {
    const gravadas = githubDeMentira({ existentes: { 'public/dados/blocos.json': 'sha-a', 'docs/dados/blocos.json': 'sha-b' } })
    const r = await publicarDados(TOKEN_FALSO, 'blocos.json', ESCALA, 'escala de setembro')

    expect(r.ok).toBe(true)
    expect(gravadas.map((g) => g.caminho)).toEqual(['public/dados/blocos.json', 'docs/dados/blocos.json'])
  })

  it('🔴 o que vai para o GitHub é EXATAMENTE o que o site vai servir', async () => {
    const gravadas = githubDeMentira({ existentes: { 'public/dados/blocos.json': 'sha-a', 'docs/dados/blocos.json': 'sha-b' } })
    await publicarDados(TOKEN_FALSO, 'blocos.json', ESCALA, 'escala de setembro')

    const esperado = JSON.stringify(ESCALA, null, 2) + '\n'
    for (const g of gravadas) expect(g.conteudo).toBe(esperado)
    // E o que foi gravado volta a ser a MESMA escala quando lido — nada se perde na ida e volta.
    expect(JSON.parse(gravadas[0].conteudo)).toEqual(ESCALA)
  })

  it('acentos sobrevivem à viagem — o base64 é de UTF-8, não de bytes soltos', async () => {
    const gravadas = githubDeMentira({ existentes: { 'public/dados/pessoas.json': 'x', 'docs/dados/pessoas.json': 'y' } })
    const comAcento = { pessoas: [{ nome: 'Luíz Cezar · São Luiz — Ceia' }] }
    await publicarDados(TOKEN_FALSO, 'pessoas.json', comAcento, 'elenco')

    expect(JSON.parse(gravadas[0].conteudo).pessoas[0].nome).toBe('Luíz Cezar · São Luiz — Ceia')
  })

  it('arquivo que JÁ existe é substituído com o sha; arquivo novo vai sem sha', async () => {
    // Só `public` existe: `docs` é a estreia. Os dois caminhos no mesmo publicar.
    const gravadas = githubDeMentira({ existentes: { 'public/dados/config.json': 'sha-existente' } })
    await publicarDados(TOKEN_FALSO, 'config.json', { versao: 1 }, 'configuração')

    expect(gravadas.find((g) => g.caminho.startsWith('public'))?.sha).toBe('sha-existente')
    // 🔴 `?.sha` sozinho passaria também se `docs` NUNCA tivesse sido gravado — sexta auditoria
    //    externa, 05/08/2026. A promessa é "o segundo arquivo é CRIADO, sem sha"; então afirma-se
    //    primeiro que ele existe.
    const emDocs = gravadas.find((g) => g.caminho.startsWith('docs'))
    expect(emDocs).toBeDefined()
    expect(emDocs!.sha).toBeUndefined()
  })

  it('a mensagem do commit carrega a descrição — é o que se lê no histórico depois', async () => {
    const gravadas = githubDeMentira({ existentes: { 'public/dados/blocos.json': 'a', 'docs/dados/blocos.json': 'b' } })
    await publicarDados(TOKEN_FALSO, 'blocos.json', ESCALA, 'escala de 01/09 a 30/09')

    expect(gravadas[0].mensagem).toContain('escala de 01/09 a 30/09')
  })
})

describe('publicar — quando dá errado no meio', () => {
  it('🔴 falhando a SEGUNDA pasta, a resposta diz o que JÁ foi gravado', async () => {
    // É a informação de que a tela precisa para não afirmar "nada foi publicado pela metade".
    const gravadas = githubDeMentira({
      existentes: { 'public/dados/blocos.json': 'a', 'docs/dados/blocos.json': 'b' },
      falharEm: { caminho: 'docs/dados/blocos.json', status: 500, corpo: 'boom' },
    })
    const r = await publicarDados(TOKEN_FALSO, 'blocos.json', ESCALA, 'escala')

    expect(r.ok).toBe(false)
    expect(gravadas.map((g) => g.caminho)).toEqual(['public/dados/blocos.json'])
    expect(r.commits.map((c) => c.caminho)).toEqual(['public/dados/blocos.json'])
  })

  /*
    🔴 P5.2 — a falha no MEIO tem de dizer O QUE FAZER, não só o que aconteceu.

    Duas pastas: a origem e a que o GitHub Pages serve. Se a primeira grava e a segunda recusa — 409
    de outra pessoa publicando ao mesmo tempo, limite de requisições, rede caindo —, o repositório
    fica com duas verdades e o site continua no ar mostrando a ANTERIOR, sem erro nenhum. É o modo
    de falha mais silencioso deste produto.

    Saber que parou no meio não basta: a pessoa precisa saber que **repetir conserta**, porque a
    publicação grava as duas. Sem essa frase, ela vê metade do trabalho feito e não ousa repetir.
  */
  it('🔴 falha no MEIO diz quantas pastas foram, que o site mostra a anterior, e que repetir conserta', async () => {
    githubDeMentira({
      existentes: { 'public/dados/blocos.json': 'a', 'docs/dados/blocos.json': 'b' },
      falharEm: { caminho: 'docs/dados/blocos.json', status: 409 },
    })
    const r = await publicarDados(TOKEN_FALSO, 'blocos.json', ESCALA, 'escala')

    expect(r.ok).toBe(false)
    expect(r.erro).toMatch(/parou no meio/i)
    expect(r.erro).toMatch(/1 de 2 pastas/i)
    expect(r.erro).toMatch(/escala ANTERIOR/i)
    expect(r.erro).toMatch(/publique de novo/i)
    expect(r.erro).toMatch(/não estraga/i)
  })

  it('🔴 a outra ponta: falhando a PRIMEIRA, não fala em "parou no meio" — nada foi gravado', async () => {
    githubDeMentira({
      existentes: { 'public/dados/blocos.json': 'a', 'docs/dados/blocos.json': 'b' },
      falharEm: { caminho: 'public/dados/blocos.json', status: 409 },
    })
    const r = await publicarDados(TOKEN_FALSO, 'blocos.json', ESCALA, 'escala')
    expect(r.ok).toBe(false)
    expect(r.erro).not.toMatch(/parou no meio/i)
  })

  it('falhando a PRIMEIRA, nada é gravado e a lista volta vazia', async () => {
    const gravadas = githubDeMentira({
      existentes: { 'public/dados/blocos.json': 'a', 'docs/dados/blocos.json': 'b' },
      falharEm: { caminho: 'public/dados/blocos.json', status: 500 },
    })
    const r = await publicarDados(TOKEN_FALSO, 'blocos.json', ESCALA, 'escala')

    expect(r.ok).toBe(false)
    expect(gravadas).toEqual([])
    expect(r.commits).toEqual([])
  })

  it('🔴 409 vira instrução do que fazer, não código de erro cru', async () => {
    githubDeMentira({
      existentes: { 'public/dados/blocos.json': 'a', 'docs/dados/blocos.json': 'b' },
      falharEm: { caminho: 'public/dados/blocos.json', status: 409 },
    })
    const r = await publicarDados(TOKEN_FALSO, 'blocos.json', ESCALA, 'escala')

    expect(r.ok).toBe(false)
    expect(r.erro).toContain('Recarregue a página')
    expect(r.erro).toContain('outro aparelho')
  })

  it('token recusado é dito como token, e não como "erro 401"', async () => {
    githubDeMentira({
      existentes: { 'public/dados/blocos.json': 'a', 'docs/dados/blocos.json': 'b' },
      falharEm: { caminho: 'public/dados/blocos.json', status: 403 },
    })
    const r = await publicarDados(TOKEN_FALSO, 'blocos.json', ESCALA, 'escala')

    expect(r.ok).toBe(false)
    expect(r.erro?.toLowerCase()).toContain('token')
  })

  it('rede fora não estoura para cima — vira resposta com motivo', async () => {
    vi.stubGlobal('fetch', async () => { throw new TypeError('Failed to fetch') })
    const r = await publicarDados(TOKEN_FALSO, 'blocos.json', ESCALA, 'escala')

    expect(r.ok).toBe(false)
    // O QUE o motivo diz, e não só que existe: `toBeTruthy()` passaria com a string "undefined".
    expect(r.erro).toContain('Failed to fetch')
    // E nada foi gravado — que é a parte que importa para quem publica.
    expect(r.commits).toEqual([])
  })
})

describe('🔴 as recusas dizem O QUE CONSERTAR — P4.2 e P4.4, fechados em 05/08/2026', () => {
  it('401 no GET (o caminho mais comum) fala em TOKEN, não em "não consegui ler o arquivo"', async () => {
    vi.stubGlobal('fetch', async () => new Response('unauthorized', { status: 401 }))
    const r = await publicarDados(TOKEN_FALSO, 'blocos.json', ESCALA, 'escala')
    expect(r.ok).toBe(false)
    expect(r.erro).toMatch(/token/i)
    expect(r.erro).toMatch(/expirou|revogado|incompleto/i)
    expect(r.erro).not.toMatch(/não consegui ler/i)
  })

  it('403 por LIMITE DE REQUISIÇÕES não manda trocar um token que está bom', async () => {
    vi.stubGlobal('fetch', async () => new Response('You have exceeded a secondary rate limit', { status: 403 }))
    const r = await publicarDados(TOKEN_FALSO, 'blocos.json', ESCALA, 'escala')
    expect(r.erro).toMatch(/limite de requisições/i)
    expect(r.erro).toMatch(/token está bom/i)
  })

  it('403 por PERMISSÃO nomeia a caixa a marcar no GitHub', async () => {
    vi.stubGlobal('fetch', async () => new Response('forbidden', { status: 403 }))
    const r = await publicarDados(TOKEN_FALSO, 'blocos.json', ESCALA, 'escala')
    expect(r.erro).toMatch(/Contents: Read and write/i)
  })

  it('500 diz que NÃO é o token — senão a pessoa troca uma credencial boa', async () => {
    vi.stubGlobal('fetch', async () => new Response('boom', { status: 500 }))
    const r = await publicarDados(TOKEN_FALSO, 'blocos.json', ESCALA, 'escala')
    expect(r.erro).toMatch(/não é o seu token/i)
  })

  it('🔴 resposta 200 que NÃO é JSON vira frase em português, não SyntaxError em inglês', async () => {
    vi.stubGlobal('fetch', async () =>
      new Response('<html><body>502 Bad Gateway</body></html>', { status: 200, headers: { 'Content-Type': 'text/html' } }))
    const r = await publicarDados(TOKEN_FALSO, 'blocos.json', ESCALA, 'escala')
    expect(r.ok).toBe(false)
    expect(r.erro).toMatch(/não é JSON/i)
    expect(r.erro).not.toMatch(/Unexpected token|SyntaxError/i)
  })
})
