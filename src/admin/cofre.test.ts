/**
 * 🔒 O COFRE — e o código que o leva para outro aparelho.
 *
 * O que se prova aqui não é a criptografia (é a do navegador), e sim as **decisões**: que a senha
 * errada falha em vez de devolver lixo; que o código transportado é inútil sem a senha; e que um
 * texto adulterado é recusado **na hora**, e não vira um "senha incorreta" eterno que manda procurar
 * defeito no lugar errado.
 *
 * Contexto (04/08/2026): o Flavio pediu o token **embutido no código**, para só digitar a senha. Não
 * dá — o repositório é público e o GitHub revoga sozinho token que encontra em repositório público.
 * O cofre portátil entrega o mesmo conforto: cola-se uma vez por aparelho, e depois é só a senha.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { abrirCofre, apagarCofre, cofreExiste, exportarCofre, gravarCofre, importarCofre } from './cofre'

const SEGREDOS = { tokenGitHub: 'token-de-mentira-para-teste', chaveMotor: 'chave-de-mentira' }
const SENHA = 'uma-senha-comprida'

/**
 * `localStorage` de mentira, em memória — seis linhas em vez de trazer o `jsdom` inteiro só para
 * guardar três strings. A criptografia usada é a do próprio Node (`crypto.subtle`), a mesma API do
 * navegador: o que está sendo testado é a decisão, não a implementação de AES.
 */
const memoria = new Map<string, string>()
globalThis.localStorage = {
  getItem: (k: string) => memoria.get(k) ?? null,
  setItem: (k: string, v: string) => void memoria.set(k, v),
  removeItem: (k: string) => void memoria.delete(k),
  clear: () => memoria.clear(),
  key: (i: number) => [...memoria.keys()][i] ?? null,
  get length() { return memoria.size },
} as Storage

beforeEach(() => {
  localStorage.clear()
})

describe('cofre — a senha é a chave, não uma comparação', () => {
  it('grava e abre com a senha certa', async () => {
    await gravarCofre(SENHA, SEGREDOS)
    expect(await abrirCofre(SENHA)).toEqual(SEGREDOS)
  })

  it('🔴 senha errada devolve null — não devolve lixo silencioso', async () => {
    await gravarCofre(SENHA, SEGREDOS)
    expect(await abrirCofre('outra-senha-qualquer')).toBeNull()
  })

  it('sem cofre gravado, abrir devolve null', async () => {
    expect(await abrirCofre(SENHA)).toBeNull()
  })

  it('o token NÃO fica legível no armazenamento', async () => {
    await gravarCofre(SENHA, SEGREDOS)
    const bruto = localStorage.getItem('escala-porteiros:cofre') ?? ''
    expect(bruto).not.toContain(SEGREDOS.tokenGitHub)
    expect(bruto).not.toContain(SEGREDOS.chaveMotor)
  })

  it('apagar remove o cofre deste navegador', async () => {
    await gravarCofre(SENHA, SEGREDOS)
    expect(cofreExiste()).toBe(true)
    apagarCofre()
    expect(cofreExiste()).toBe(false)
  })
})

describe('levar para outro aparelho', () => {
  it('o código exportado abre no "outro aparelho" com a mesma senha', async () => {
    await gravarCofre(SENHA, SEGREDOS)
    const codigo = exportarCofre()!

    localStorage.clear() // ← o outro aparelho, sem nada
    expect(cofreExiste()).toBe(false)

    expect(importarCofre(codigo)).toEqual({ ok: true })
    expect(await abrirCofre(SENHA)).toEqual(SEGREDOS)
  })

  it('🔴 o código é INÚTIL sem a senha — é isto que o torna seguro de mandar por mensagem', async () => {
    await gravarCofre(SENHA, SEGREDOS)
    const codigo = exportarCofre()!
    expect(codigo).not.toContain(SEGREDOS.tokenGitHub)

    localStorage.clear()
    importarCofre(codigo)
    expect(await abrirCofre('senha-de-quem-interceptou')).toBeNull()
  })

  it('sem cofre neste navegador, não há o que exportar', () => {
    expect(exportarCofre()).toBeNull()
  })

  it('texto qualquer é recusado NA HORA, com motivo', () => {
    const r = importarCofre('bom dia, tudo bem?')
    expect(r.ok).toBe(false)
    expect(r).toHaveProperty('motivo')
  })

  it('🔴 código truncado é recusado — e não vira "senha incorreta" para sempre', async () => {
    await gravarCofre(SENHA, SEGREDOS)
    const codigo = exportarCofre()!
    localStorage.clear()

    expect(importarCofre(codigo.slice(0, codigo.length - 20)).ok).toBe(false)
    // O ponto do teste: nada foi gravado. Um cofre quebrado instalado trocaria um erro que se
    // resolve colando de novo por um que manda procurar a senha errada.
    expect(cofreExiste()).toBe(false)
  })

  it('espaços e quebras de linha da cópia não atrapalham', async () => {
    await gravarCofre(SENHA, SEGREDOS)
    const codigo = exportarCofre()!
    localStorage.clear()

    const sujo = `\n  ${codigo.slice(0, 30)}\n${codigo.slice(30)}  \n`
    expect(importarCofre(sujo)).toEqual({ ok: true })
    expect(await abrirCofre(SENHA)).toEqual(SEGREDOS)
  })
})
