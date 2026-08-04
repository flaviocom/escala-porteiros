/**
 * PUBLICAÇÃO — grava os dados no repositório pela API do GitHub.
 *
 * Cada publicação é **um commit**. Isso não é detalhe de implementação: é o que dá, de graça,
 * histórico de quem mudou o quê e quando, e reversão em um clique. Um banco de dados daria a
 * escrita, mas não daria o histórico sem eu construí-lo.
 *
 * O site continua estático: mudar a escala **não exige rebuild**, porque dado não é código. O Pages
 * serve o JSON novo em cerca de um minuto, e o site nunca sai do ar no meio.
 *
 * ⚠️ O ARQUIVO VAI PARA DOIS LUGARES. `public/dados/` é a fonte (entra no build) e `docs/dados/` é o
 * que o Pages serve. Gravar só num deles produziria o pior desfecho possível: a publicação "dá
 * certo", e o site continua mostrando a escala velha. Por isso `publicarDados` escreve nos dois e
 * confere os dois.
 */

const DONO = 'flaviocom'
const REPO = 'escala-porteiros'
const RAMO = 'main'
const PASTAS = ['public/dados', 'docs/dados'] as const

export interface ResultadoPublicacao {
  ok: boolean
  commits: { caminho: string; sha: string }[]
  erro?: string
}

interface RespostaConteudo {
  sha: string
  content?: string
}

function cabecalhos(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  }
}

/** UTF-8 → base64, sem quebrar em acento (`btoa` sozinho quebra em "Luíz"). */
function paraBase64Utf8(texto: string): string {
  const bytes = new TextEncoder().encode(texto)
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}

async function shaAtual(token: string, caminho: string): Promise<string | undefined> {
  const r = await fetch(`https://api.github.com/repos/${DONO}/${REPO}/contents/${caminho}?ref=${RAMO}`, {
    headers: cabecalhos(token),
    cache: 'no-store',
  })
  if (r.status === 404) return undefined // arquivo novo
  if (!r.ok) throw new Error(`Não consegui ler ${caminho} (HTTP ${r.status})`)
  const j = (await r.json()) as RespostaConteudo
  return j.sha
}

async function gravarArquivo(token: string, caminho: string, conteudo: string, mensagem: string): Promise<string> {
  // O `sha` do arquivo atual é obrigatório para substituir, e é ele que impede sobrescrever, sem
  // perceber, uma publicação feita de outro aparelho: se o arquivo mudou, o GitHub recusa com 409.
  const sha = await shaAtual(token, caminho)
  const r = await fetch(`https://api.github.com/repos/${DONO}/${REPO}/contents/${caminho}`, {
    method: 'PUT',
    headers: cabecalhos(token),
    body: JSON.stringify({
      message: mensagem,
      content: paraBase64Utf8(conteudo),
      branch: RAMO,
      ...(sha ? { sha } : {}),
      committer: { name: 'Flavio Oliveira', email: 'brflaviooliveira@gmail.com' },
    }),
  })
  if (!r.ok) {
    const corpo = await r.text()
    if (r.status === 409)
      throw new Error(
        `${caminho}: a escala mudou no repositório desde que esta tela carregou. ` +
          'Recarregue a página para não sobrescrever uma publicação feita de outro aparelho.',
      )
    if (r.status === 401 || r.status === 403)
      throw new Error(`${caminho}: o token foi recusado (HTTP ${r.status}). Confira se ele expirou ou foi revogado.`)
    throw new Error(`${caminho}: HTTP ${r.status} — ${corpo.slice(0, 200)}`)
  }
  const j = await r.json()
  return j.commit?.sha ?? '?'
}

/**
 * Publica um arquivo de dados nas duas pastas.
 *
 * @param nome  `blocos.json`, `pessoas.json` ou `config.json`
 */
export async function publicarDados(
  token: string,
  nome: string,
  conteudo: unknown,
  descricao: string,
): Promise<ResultadoPublicacao> {
  const texto = JSON.stringify(conteudo, null, 2) + '\n'
  const commits: { caminho: string; sha: string }[] = []
  try {
    for (const pasta of PASTAS) {
      const caminho = `${pasta}/${nome}`
      const sha = await gravarArquivo(token, caminho, texto, `dados: ${descricao}\n\nPublicado pela área administrativa.`)
      commits.push({ caminho, sha })
    }
    return { ok: true, commits }
  } catch (e) {
    return { ok: false, commits, erro: e instanceof Error ? e.message : String(e) }
  }
}

/** Confere se o token funciona e tem permissão de escrita, ANTES de o Flavio depender dele. */
export async function conferirToken(token: string): Promise<{ ok: boolean; detalhe: string }> {
  try {
    const r = await fetch(`https://api.github.com/repos/${DONO}/${REPO}`, {
      headers: cabecalhos(token),
      cache: 'no-store',
    })
    if (!r.ok) return { ok: false, detalhe: `O GitHub recusou o token (HTTP ${r.status}).` }
    const j = await r.json()
    if (!j.permissions?.push)
      return { ok: false, detalhe: 'O token é válido, mas não tem permissão de escrita neste repositório.' }
    return { ok: true, detalhe: `Token válido, com escrita em ${j.full_name}.` }
  } catch (e) {
    return { ok: false, detalhe: e instanceof Error ? e.message : String(e) }
  }
}

/** Últimas publicações de dados, para a tela de histórico. */
export async function historicoPublicacoes(token: string, limite = 20) {
  const r = await fetch(
    `https://api.github.com/repos/${DONO}/${REPO}/commits?path=docs/dados&per_page=${limite}`,
    { headers: cabecalhos(token), cache: 'no-store' },
  )
  if (!r.ok) throw new Error(`Não consegui ler o histórico (HTTP ${r.status})`)
  const j = (await r.json()) as { sha: string; commit: { message: string; author: { date: string } } }[]
  return j.map((c) => ({
    sha: c.sha.slice(0, 7),
    quando: c.commit.author.date,
    mensagem: c.commit.message.split('\n')[0],
  }))
}

/** Baixar o JSON — a rede para o dia em que o token expirar ou a API falhar. */
export function baixarJSON(nome: string, conteudo: unknown): void {
  const blob = new Blob([JSON.stringify(conteudo, null, 2) + '\n'], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  a.click()
  URL.revokeObjectURL(url)
}
