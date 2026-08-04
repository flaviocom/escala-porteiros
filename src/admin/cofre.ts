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

/** Existe cofre neste navegador? */
export function cofreExiste(): boolean {
  return localStorage.getItem(CHAVE_ARMAZENAMENTO) !== null
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
