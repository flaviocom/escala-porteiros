import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

/**
 * Prova as DUAS PONTAS do portão de citações (`scripts/portao-citacoes.mjs`) numa árvore de
 * mentira: a limpa aprova, e cada tipo de apodrecimento reprova pelo motivo certo. Portão que só
 * foi visto verde é indistinguível de portão que não funciona (AGENTS.md §3, regra 4).
 */
const PORTAO = join(process.cwd(), 'scripts', 'portao-citacoes.mjs')
const pastas: string[] = []

function arvore(doc: string, codigo = 'export function alvo() {}\n'.repeat(1) + '\n'.repeat(30) + 'export const outro = 1\n') {
  const raiz = mkdtempSync(join(tmpdir(), 'citacoes-'))
  pastas.push(raiz)
  mkdirSync(join(raiz, 'src'))
  writeFileSync(join(raiz, 'src', 'a.ts'), codigo)
  writeFileSync(join(raiz, 'VIVO.md'), doc)
  return raiz
}

function rodar(raiz: string): { saida: number; texto: string } {
  try {
    const texto = execFileSync('node', [PORTAO, '--raiz', raiz], { encoding: 'utf8' })
    return { saida: 0, texto }
  } catch (e) {
    const err = e as { status: number; stdout: string }
    return { saida: err.status, texto: err.stdout }
  }
}

afterEach(() => {
  while (pastas.length) rmSync(pastas.pop()!, { recursive: true, force: true })
})

describe('portão de citações', () => {
  it('aprova a árvore limpa, com e sem símbolo', () => {
    const r = rodar(arvore('Veja `src/a.ts:1` (`alvo`) e `src/a.ts:32`.\n'))
    expect(r.saida).toBe(0)
    expect(r.texto).toContain('com símbolo declarado ... 1')
  })

  it('reprova arquivo inexistente', () => {
    const r = rodar(arvore('Veja `src/sumiu.ts:3`.\n'))
    expect(r.saida).toBe(1)
    expect(r.texto).toContain('NÃO EXISTE')
  })

  it('reprova linha além do fim do arquivo', () => {
    const r = rodar(arvore('Veja `src/a.ts:400`.\n'))
    expect(r.saida).toBe(1)
    expect(r.texto).toContain('o arquivo tem')
  })

  it('reprova a citação que escorregou: o símbolo não está perto da linha', () => {
    // `alvo` está na linha 1; `src/a.ts:32` fica a 31 linhas — fora da janela de 12.
    const r = rodar(arvore('Veja `src/a.ts:32` (`alvo`).\n'))
    expect(r.saida).toBe(1)
    expect(r.texto).toContain('a citação escorregou')
  })

  it('não confunde símbolo ausente com símbolo errado: sem símbolo, só confere a linha', () => {
    expect(rodar(arvore('Veja `src/a.ts:32`.\n')).saida).toBe(0)
  })
})
