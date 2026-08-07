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
 *
 * 🔴 ESTE MODELO É DECISÃO DE FASE, não teto do produto — o dono perguntou em 07/08/2026 (S-043) se
 * "token no navegador" é o melhor formato de publicação em USABILIDADE, e a resposta registrada é:
 * para a fase 1 (um administrador, uso interno), sim — publica de verdade, ~1 minuto, custo zero.
 * Para comercializar (cliente leigo, N inquilinos), a publicação vira backend com conta e-mail/senha
 * — desenho em `docs/FASE2.md` (§ publicação comercializável), e o domínio não muda uma linha. Quem for reescrever este
 * arquivo naquela fase: os três JSON são o contrato; o histórico de commits vira tabela de versões.
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

/*
  🔴 SEM TOKEN, NÃO SE MANDA `Authorization` — achado da quinta auditoria externa, 05/08/2026.

  O cabeçalho saía como `Bearer ` (vazio) quando o Flavio entrava sem token, e o GitHub responde
  **401 a um cabeçalho inválido mesmo em repositório público**. Ou seja: mandar credencial vazia é
  pior que não mandar nenhuma — sem o cabeçalho, o histórico de um repositório público é legível
  anonimamente, e o painel funciona para quem publica à mão.
*/
function cabecalhos(token: string) {
  const base = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  }
  return token ? { ...base, Authorization: `Bearer ${token}` } : base
}

/** UTF-8 → base64, sem quebrar em acento (`btoa` sozinho quebra em "Luíz"). */
function paraBase64Utf8(texto: string): string {
  const bytes = new TextEncoder().encode(texto)
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}

/**
 * A mensagem que a pessoa lê quando o GitHub recusa — e ela precisa dizer O QUE CONSERTAR.
 *
 * 🔴 P4.2, achado pela auditoria independente de 04/08/2026 e corrigido em 05/08 antes da primeira
 * publicação real: a frase amigável sobre token expirado existia só no caminho do PUT, e o PUT nunca
 * era alcançado quando o problema era o token — porque o GET vem antes e falha primeiro. Resultado:
 * quem tivesse um token revogado lia *"Não consegui ler public/dados/pessoas.json (HTTP 401)"* e ia
 * procurar defeito no arquivo, não na credencial.
 *
 * E 403 tinha o problema oposto: era rotulado como "token recusado" mesmo quando a causa era limite
 * de requisições do GitHub, mandando a pessoa trocar um token que estava perfeito.
 */
function recusaDoGitHub(status: number, caminho: string, corpo = ''): string {
  if (status === 401)
    return `${caminho}: o GitHub recusou o token (HTTP 401). Ele expirou, foi revogado, ou o valor foi colado incompleto. Configure o acesso de novo com um token novo.`
  if (status === 403 && /rate limit|secondary/i.test(corpo))
    return `${caminho}: o GitHub pediu para esperar (limite de requisições, HTTP 403). O token está bom — tente de novo em alguns minutos.`
  if (status === 403)
    return `${caminho}: o token não tem permissão de escrita aqui (HTTP 403). Confira em Repository permissions → Contents: Read and write, e se o repositório escala-porteiros está marcado.`
  if (status === 404)
    return `${caminho}: o GitHub respondeu que não existe (HTTP 404). Num token fine-grained isso quase sempre é o REPOSITÓRIO não marcado, não erro de digitação no caminho.`
  if (status >= 500)
    return `${caminho}: o GitHub está com problema no servidor dele (HTTP ${status}). Não é o seu token. Tente de novo em alguns minutos.`
  return `${caminho}: o GitHub recusou (HTTP ${status}).${corpo ? ` ${corpo.slice(0, 160)}` : ''}`
}

/** Lê JSON sem deixar vazar `SyntaxError` em inglês quando a resposta não é JSON (P4.4). */
async function lerJSON<T>(r: Response, caminho: string): Promise<T> {
  const texto = await r.text()
  try {
    return JSON.parse(texto) as T
  } catch {
    throw new Error(
      `${caminho}: o GitHub respondeu algo que não é JSON. Costuma ser página de erro de rede ou de proxy no caminho. Tente de novo.`,
    )
  }
}

async function shaAtual(token: string, caminho: string): Promise<string | undefined> {
  const r = await fetch(`https://api.github.com/repos/${DONO}/${REPO}/contents/${caminho}?ref=${RAMO}`, {
    headers: cabecalhos(token),
    cache: 'no-store',
  })
  if (r.status === 404) return undefined // arquivo novo
  if (!r.ok) throw new Error(recusaDoGitHub(r.status, caminho, await r.text()))
  const j = await lerJSON<RespostaConteudo>(r, caminho)
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
    // Uma fonte só para o texto das recusas: o GET e o PUT diziam coisas diferentes para o mesmo
    // erro, e era o GET que a pessoa via primeiro.
    throw new Error(recusaDoGitHub(r.status, caminho, corpo))
  }
  const j = await lerJSON<{ commit?: { sha?: string } }>(r, caminho)
  return j.commit?.sha ?? '?'
}

/**
 * Publica um arquivo de dados nas duas pastas.
 *
 * @param nome  `blocos.json`, `pessoas.json` ou `config.json`
 */
/** Quebra de linha por código: este arquivo já foi reescrito por script, e a barra some. */
const QUEBRA = String.fromCharCode(10)

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
    const erro = e instanceof Error ? e.message : String(e)
    /*
      🔴 FALHA NO MEIO DEIXA AS DUAS PASTAS DIFERENTES — P5.2, tratado em 05/08/2026.

      `PASTAS` são duas: a origem e a que o GitHub Pages serve. Se a primeira grava e a segunda
      recusa (409 de outra pessoa publicando, limite de requisições, rede caindo), o repositório
      fica com **duas verdades** — e o site continua no ar, mostrando a antiga, sem erro nenhum.
      É o modo de falha mais silencioso deste produto.

      A resposta já dizia o que foi gravado. Faltava dizer **o que fazer**: publicar de novo
      resolve, porque a publicação escreve as duas. Sem essa frase, a pessoa vê metade do
      trabalho feito e não sabe se pode repetir sem estragar.
    */
    const faltou = PASTAS.length - commits.length
    const parcial = commits.length > 0 && faltou > 0
    return {
      ok: false,
      commits,
      erro: parcial
        ? `${erro}${QUEBRA}${QUEBRA}⚠️ A publicação parou no meio: ${commits.length} de ${PASTAS.length} pastas foram gravadas ` +
          `(${commits.map((c) => c.caminho).join(', ')}). O site ainda mostra a escala ANTERIOR. ` +
          'Resolva o motivo acima e **publique de novo** — a publicação grava as duas pastas, ' +
          'então repetir conserta; não estraga.'
        : erro,
    }
  }
}

/** Confere se o token funciona e tem permissão de escrita, ANTES de o Flavio depender dele. */
/** Onde se cria o token, com o que marcar. Um lugar só — a tela e o guia leem daqui. */
export const COMO_CRIAR_O_TOKEN = {
  url: 'https://github.com/settings/personal-access-tokens/new',
  passos: [
    { campo: 'Token name', valor: 'escala-porteiros' },
    { campo: 'Expiration', valor: '1 year (ou o que preferir)' },
    { campo: 'Repository access', valor: 'Only select repositories → escala-porteiros' },
    { campo: 'Permissions', valor: 'Repository permissions → Contents: Read and write' },
  ],
} as const

/**
 * Confere o token ANTES de guardar — e diz o que CONSERTAR, não só que deu errado.
 *
 * 🔴 As mensagens eram genéricas ("O GitHub recusou o token (HTTP 404)"), e 404 é justamente a
 * resposta mais confusa que existe aqui: num token fine-grained, **repositório não marcado** volta
 * como *não encontrado*, não como *sem permissão*. Quem lê "404" procura erro de digitação e o
 * problema está numa caixa de seleção da outra página.
 *
 * Cada recusa agora nomeia o campo exato a corrigir.
 */
export async function conferirToken(token: string): Promise<{ ok: boolean; detalhe: string }> {
  try {
    const r = await fetch(`https://api.github.com/repos/${DONO}/${REPO}`, {
      headers: cabecalhos(token),
      cache: 'no-store',
    })

    if (r.status === 401) {
      return {
        ok: false,
        detalhe:
          'O GitHub não reconheceu este token. Confira se copiou o valor INTEIRO (ele aparece uma ' +
          'única vez, logo depois de criado) — ou crie outro.',
      }
    }
    if (r.status === 404) {
      return {
        ok: false,
        detalhe:
          `O token é válido, mas não enxerga o repositório ${REPO}. Em "Repository access", escolha ` +
          `"Only select repositories" e marque ${REPO}. É o engano mais comum: o GitHub responde ` +
          '"não encontrado" quando o repositório não está na lista do token.',
      }
    }
    if (!r.ok) return { ok: false, detalhe: `O GitHub recusou o token (HTTP ${r.status}).` }

    const j = await r.json()
    if (!j.permissions?.push) {
      return {
        ok: false,
        detalhe:
          'O token enxerga o repositório, mas não pode escrever. Em "Repository permissions", ' +
          'ponha "Contents" em "Read and write".',
      }
    }
    return { ok: true, detalhe: `Token válido, com escrita em ${j.full_name}.` }
  } catch (e) {
    return {
      ok: false,
      detalhe: `Não deu para falar com o GitHub: ${e instanceof Error ? e.message : String(e)}. Confira a conexão.`,
    }
  }
}

/** Últimas publicações de dados, para a tela de histórico. */
export interface Publicacao {
  sha: string
  shaCurto: string
  quando: string
  mensagem: string
  /** Quais arquivos de dados esta publicação tocou. Sem isto não dá para reverter o certo. */
  arquivos: string[]
}

/** Últimas publicações de dados, para a tela de histórico. */
export async function historicoPublicacoes(token: string, limite = 15): Promise<Publicacao[]> {
  const r = await fetch(
    `https://api.github.com/repos/${DONO}/${REPO}/commits?path=docs/dados&per_page=${limite}`,
    { headers: cabecalhos(token), cache: 'no-store' },
  )
  if (!r.ok) throw new Error(`Não consegui ler o histórico (HTTP ${r.status}).`)
  const j = (await r.json()) as { sha: string; commit: { message: string; author: { date: string } } }[]

  // Quais arquivos cada commit tocou. Uma chamada por commit — por isso o limite é baixo.
  return Promise.all(
    j.map(async (c) => {
      let arquivos: string[] = []
      try {
        const d = await fetch(`https://api.github.com/repos/${DONO}/${REPO}/commits/${c.sha}`, {
          headers: cabecalhos(token),
          cache: 'no-store',
        })
        if (d.ok) {
          const det = (await d.json()) as { files?: { filename: string }[] }
          arquivos = (det.files ?? [])
            .map((f) => f.filename)
            .filter((f) => f.startsWith('docs/dados/'))
            .map((f) => f.replace('docs/dados/', ''))
        }
      } catch {
        // Falhar aqui não pode derrubar o histórico inteiro: a lista vale mesmo sem os arquivos.
      }
      return {
        sha: c.sha,
        shaCurto: c.sha.slice(0, 7),
        quando: c.commit.author.date,
        mensagem: c.commit.message.split('\n')[0],
        arquivos,
      }
    }),
  )
}

/**
 * Lê um arquivo de dados **como ele era** num commit específico.
 *
 * É a metade que faltava para a reversão significar alguma coisa: sem poder ler o passado, o
 * histórico seria uma lista bonita e inútil.
 */
export async function lerDadosNoCommit(token: string, nome: string, sha: string): Promise<unknown> {
  const r = await fetch(
    `https://api.github.com/repos/${DONO}/${REPO}/contents/docs/dados/${nome}?ref=${sha}`,
    { headers: cabecalhos(token), cache: 'no-store' },
  )
  if (!r.ok) throw new Error(`Não consegui ler ${nome} na versão ${sha.slice(0, 7)} (HTTP ${r.status}).`)
  const j = (await r.json()) as RespostaConteudo
  if (!j.content) throw new Error(`A versão ${sha.slice(0, 7)} de ${nome} veio vazia.`)
  // O GitHub devolve base64 com quebras de linha; e o conteúdo é UTF-8 (há "Luíz" nos dados).
  const bytes = Uint8Array.from(atob(j.content.replace(/\s/g, '')), (c) => c.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes))
}

/**
 * Volta um arquivo de dados para como ele estava num commit.
 *
 * 🔴 A reversão é uma PUBLICAÇÃO NOVA, não um apagamento.
 *
 * Poderia ser um `git revert`, mas restaurar o conteúdo como um commit novo é melhor aqui por três
 * razões: o histórico **nada perde** (o erro continua registrado, e saber que ele existiu é o que
 * impede repeti-lo); a operação usa o mesmo caminho já provado da publicação; e é o que "voltar para
 * como estava em tal dia" significa para quem administra.
 *
 * 🔴 E ELA DEVOLVE O CONTEÚDO RESTAURADO — quinta auditoria externa, 05/08/2026.
 *
 * Sem isso, quem chamou continuava com o retrato anterior na memória: reverter o elenco e publicar
 * em seguida republicava o elenco velho por cima da reversão. O conteúdo já é lido aqui para poder
 * gravar; devolvê-lo custa uma propriedade e fecha a porta.
 */
export async function reverterPara(
  token: string,
  nome: string,
  sha: string,
  quando: string,
): Promise<ResultadoPublicacao & { conteudo?: unknown }> {
  try {
    const conteudo = await lerDadosNoCommit(token, nome, sha)
    const r = await publicarDados(token, nome, conteudo, `volta ${nome} para a versão de ${quando}`)
    return { ...r, conteudo: r.ok ? conteudo : undefined }
  } catch (e) {
    return { ok: false, commits: [], erro: e instanceof Error ? e.message : String(e) }
  }
}

/** Baixar o JSON — a rede para o dia em que o token expirar ou a API falhar. */
export function baixarJSON(nome: string, conteudo: unknown): void {
  baixarTexto(nome, JSON.stringify(conteudo, null, 2) + '\n', 'application/json')
}

function baixarTexto(nome: string, texto: string, tipo: string): void {
  const url = URL.createObjectURL(new Blob([texto], { type: tipo }))
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 3000)
}

/** As duas pastas que precisam receber o arquivo, e a página do GitHub que abre cada uma. */
export const DESTINOS = PASTAS.map((pasta) => ({
  pasta,
  url: `https://github.com/${DONO}/${REPO}/upload/${RAMO}/${pasta}`,
  porque:
    pasta === 'docs/dados'
      ? 'é o que o site serve — mexer aqui muda a escala no ar'
      : 'é a fonte do build — sem isto, a próxima montagem do site desfaz a mudança',
}))

/**
 * 📦 PUBLICAR SEM TOKEN — o caminho de mão, feito para não dar para errar.
 *
 * O botão "Publicar" precisa do token porque o site é estático: não há servidor, e escrever no
 * repositório a partir do navegador só é possível pela API do GitHub. Quem não quiser cadastrar
 * token faz o mesmo à mão — e este pacote existe para que isso seja seguro.
 *
 * 🔴 O RISCO QUE ELE FECHA: o arquivo tem de ir para **duas** pastas. Subir só em `docs/dados` muda
 * o site agora e a **próxima montagem desfaz**; subir só em `public/dados` não muda nada. As duas
 * falhas são silenciosas — a publicação "dá certo" e a escala fica errada.
 *
 * Por isso o guia desce junto com os arquivos, com os dois endereços prontos.
 */
export function baixarPacoteManual(conteudos: { nome: string; dados: unknown }[]): void {
  for (const c of conteudos) baixarJSON(c.nome, c.dados)

  const guia = [
    'COMO PUBLICAR A ESCALA SEM TOKEN',
    '='.repeat(60),
    '',
    `Arquivos baixados: ${conteudos.map((c) => c.nome).join(', ')}`,
    '',
    'CADA ARQUIVO VAI PARA AS DUAS PASTAS ABAIXO. As duas, sempre.',
    '',
    ...DESTINOS.flatMap((d, i) => [
      `${i + 1}) ${d.pasta}`,
      `   ${d.url}`,
      `   Por que: ${d.porque}`,
      '   Arraste o arquivo para a pagina, role ate o fim e clique em "Commit changes".',
      '',
    ]),
    'Subir em so uma das duas e o erro que nao avisa:',
    '  - so docs/dados   -> o site muda agora, e a proxima montagem desfaz',
    '  - so public/dados -> o site nao muda',
    '',
    'Depois de subir nas duas, o site atualiza em cerca de um minuto.',
    'Confira abrindo https://flaviocom.github.io/escala-porteiros/',
    '',
    `Gerado em ${new Date().toLocaleString('pt-BR')}`,
  ].join('\n')

  baixarTexto('COMO-PUBLICAR.txt', guia, 'text/plain;charset=utf-8')
}
