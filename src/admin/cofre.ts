/**
 * COFRE — a senha do administrador é a chave que decifra as credenciais.
 *
 * 🔴 POR QUE O LOGIN NÃO É ENFEITE.
 *
 * Este site é estático e público: qualquer um que descubra o endereço `#/admin` **vê a tela**. Um
 * login que só compara duas strings não protegeria nada — bastaria ler o código-fonte, que vai
 * inteiro para o navegador de quem abre a página.
 *
 * Então a senha não é comparada: ela **deriva a chave** que decifra o token do GitHub e a chave do
 * motor. Sem a senha certa, o que está guardado no navegador é ruído — mesmo para quem estiver com
 * o aparelho do Flavio na mão. E não há hash de senha armazenado para alguém atacar offline: o
 * teste de "senha certa" é a própria decifragem funcionar.
 *
 * Parâmetros: PBKDF2-SHA256 com 310.000 iterações (recomendação OWASP de 2023 para PBKDF2-SHA256),
 * chave AES-GCM de 256 bits, sal e vetor de inicialização aleatórios por gravação.
 *
 * ⚠️ O QUE ISTO NÃO PROTEGE, dito antes que alguém confie demais: se o computador estiver
 * comprometido enquanto o cofre está ABERTO, o token está em memória e é alcançável. A proteção é
 * contra acesso ao aparelho depois, não contra um invasor assistindo em tempo real. A defesa real da
 * publicação continua sendo o escopo do token: conteúdo, num único repositório, revogável num clique.
 */

const CHAVE_ARMAZENAMENTO = 'escala-porteiros:cofre'
const ITERACOES = 310_000

export interface Segredos {
  /** Token fine-grained do GitHub: Contents read/write, só em flaviocom/escala-porteiros. */
  tokenGitHub: string
  /** Chave do motor. Opcional: sem ela o algoritmo continua gerando e validando. */
  chaveMotor?: string
}

interface CofreGravado {
  versao: 1
  sal: string
  iv: string
  dados: string
}

// --- utilidades de codificação ---------------------------------------------
const paraBase64 = (b: ArrayBuffer | Uint8Array): string => {
  const bytes = b instanceof Uint8Array ? b : new Uint8Array(b)
  let s = ''
  for (const x of bytes) s += String.fromCharCode(x)
  return btoa(s)
}
const deBase64 = (s: string): Uint8Array => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

async function derivarChave(senha: string, sal: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, [
    'deriveKey',
  ])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: sal as BufferSource, iterations: ITERACOES, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

/**
 * Existe cofre neste navegador?
 *
 * 🔴 Ele só perguntava `!== null` — quinta auditoria externa, 05/08/2026. Um valor corrompido (meia
 * gravação, extensão que mexeu no armazenamento, cota estourada no meio) contava como cofre, e a
 * tela de login respondia **"Senha incorreta."** para sempre: a senha certa também falha ao decifrar
 * lixo. Há saída por "Esqueci a senha", mas a mensagem manda a pessoa procurar o erro onde ele não
 * está.
 *
 * Agora "existe" significa **tem a forma de um cofre**. E `localStorage` pode lançar só de ser lido,
 * com cookies bloqueados: aí não há cofre, que é a resposta certa e não uma tela branca.
 */
export function cofreExiste(): boolean {
  try {
    const bruto = localStorage.getItem(CHAVE_ARMAZENAMENTO)
    if (!bruto) return false
    const j = JSON.parse(bruto)
    return typeof j?.sal === 'string' && typeof j?.iv === 'string' && typeof j?.dados === 'string'
  } catch {
    return false
  }
}

/** Cria ou substitui o cofre. Sal e vetor novos a cada gravação. */
export async function gravarCofre(senha: string, segredos: Segredos): Promise<void> {
  const sal = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const chave = await derivarChave(senha, sal)
  const cifrado = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    chave,
    new TextEncoder().encode(JSON.stringify(segredos)),
  )
  const gravado: CofreGravado = { versao: 1, sal: paraBase64(sal), iv: paraBase64(iv), dados: paraBase64(cifrado) }
  localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(gravado))
}

/**
 * Abre o cofre. Devolve `null` quando a senha está errada.
 *
 * A distinção importa: AES-GCM é autenticado, então senha errada faz a decifragem **falhar**, não
 * produzir lixo silencioso. É o que permite dizer "senha incorreta" com honestidade.
 */
export async function abrirCofre(senha: string): Promise<Segredos | null> {
  const bruto = localStorage.getItem(CHAVE_ARMAZENAMENTO)
  if (!bruto) return null
  try {
    const g: CofreGravado = JSON.parse(bruto)
    const chave = await derivarChave(senha, deBase64(g.sal))
    const aberto = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: deBase64(g.iv) as BufferSource },
      chave,
      deBase64(g.dados) as BufferSource,
    )
    return JSON.parse(new TextDecoder().decode(aberto)) as Segredos
  } catch {
    return null // senha errada, ou cofre corrompido
  }
}

/** Apaga o cofre deste navegador. Não revoga o token — isso é no GitHub. */
export function apagarCofre(): void {
  localStorage.removeItem(CHAVE_ARMAZENAMENTO)
}

// ---------------------------------------------------------------------------
// LEVAR O COFRE PARA OUTRO APARELHO
// ---------------------------------------------------------------------------
/**
 * 🔴 O PROBLEMA QUE ISTO RESOLVE, e por que a solução é segura.
 *
 * O cofre vive no `localStorage` — ou seja, **por navegador**. Configurar no computador não
 * configura no celular. O caminho óbvio seria mandar o token para si mesmo por WhatsApp e colar no
 * telefone; e aí o token fica **em texto claro** num histórico de conversa, para sempre.
 *
 * O que se transporta aqui é o cofre **já cifrado** — `sal`, `iv` e o bloco AES-GCM. Sem a senha,
 * isto é ruído: pode ir por WhatsApp, e-mail, bloco de notas, o que for. A senha viaja **na sua
 * cabeça**, que é o único canal que não deixa cópia.
 *
 * Vantagem prática, além da segurança: ninguém digita 40 caracteres de token num teclado de celular.
 *
 * ⚠️ O que isto NÃO faz: não protege se alguém tiver o código **e** a senha. E, como o cofre é o
 * mesmo, revogar o token no GitHub derruba todos os aparelhos de uma vez — que é o comportamento
 * desejado quando um deles se perde.
 */
const MARCA = 'ESCALA-PORTEIROS-COFRE-V1'

/** O cofre deste navegador, pronto para ser copiado. `null` se não houver cofre aqui. */
export function exportarCofre(): string | null {
  const bruto = localStorage.getItem(CHAVE_ARMAZENAMENTO)
  if (!bruto) return null
  // A marca no começo faz o outro lado reconhecer o que foi colado — e recusar com clareza um
  // texto qualquer, em vez de falhar depois com "senha incorreta" e mandar procurar no lugar errado.
  return `${MARCA}.${btoa(bruto)}`
}

export type ResultadoImportacao =
  | { ok: true }
  | { ok: false; motivo: string }

/** Recebe o código de outro aparelho. Não abre o cofre: só o instala. A senha é pedida depois. */
export function importarCofre(codigo: string): ResultadoImportacao {
  const limpo = codigo.trim().replace(/\s+/g, '')
  if (!limpo) return { ok: false, motivo: 'Cole o código copiado do outro aparelho.' }
  if (!limpo.startsWith(`${MARCA}.`)) {
    return { ok: false, motivo: 'Este texto não é um código de cofre — copie o bloco inteiro, do começo ao fim.' }
  }
  try {
    const bruto = atob(limpo.slice(MARCA.length + 1))
    const g = JSON.parse(bruto) as CofreGravado
    // Confere a FORMA antes de gravar. Gravar um cofre quebrado trocaria "código inválido" — que se
    // resolve colando de novo — por "senha incorreta" para sempre, que manda procurar no lugar errado.
    if (g.versao !== 1 || !g.sal || !g.iv || !g.dados) {
      return { ok: false, motivo: 'O código veio incompleto ou de uma versão diferente.' }
    }
    localStorage.setItem(CHAVE_ARMAZENAMENTO, bruto)
    return { ok: true }
  } catch {
    return { ok: false, motivo: 'O código está corrompido — copie de novo, do começo ao fim.' }
  }
}
