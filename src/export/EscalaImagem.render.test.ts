/**
 * O QUE A IMAGEM DESENHA — renderizada de verdade, dentro do GATE (P4.6).
 *
 * 🔴 POR QUE ESTE ARQUIVO EXISTE. `npm run imagem` é o único passo que produz o pixel, e ele estava
 * **fora do GATE**. Os testes da imagem cobriam só as funções puras (`porDia`, `resumirPeriodo`).
 * Trocar a cor de MANHÃ pela de NOITE, cortar um nome, ou perder o rodapé passaria pelo GATE
 * inteiro sem uma reclamação — e a imagem é o documento MAIS VISTO do produto: é ela que vai para o
 * WhatsApp da congregação.
 *
 * Aqui o componente é renderizado para HTML (`renderToStaticMarkup`) e se confere o que ele
 * escreveu. É rápido — não precisa de navegador nem de servidor — e por isso pôde entrar no GATE.
 *
 * ⚠️ O QUE ISTO **NÃO** SUBSTITUI: olhar a imagem. Fonte errada, cartão sobreposto e contraste ruim
 * continuam invisíveis aqui. `npm run imagem` continua existindo, e continua sendo o único que
 * prova o pixel. Este arquivo cobre o que dá para afirmar sem olhar — que é bastante, e era zero.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { EscalaImagem } from './EscalaImagem'
import { definirPessoas, type Shift } from '../types/scheduler'

definirPessoas([
  { id: 'ana', nome: 'Ana', ativo: true, restricoes: {} },
  { id: 'bia', nome: 'Bia Carolina de Souza', ativo: true, restricoes: {} },
  { id: 'caio', nome: 'Caio', ativo: true, restricoes: {} },
])

const IDENTIDADE = {
  titulo: 'Escala de Teste',
  subtitulo: 'Unidade Alfa',
  pessoa: { singular: 'Plantonista', plural: 'plantonistas' },
}

const turno = (data: string, tipo: Shift['type'], pessoas: string[]): Shift => ({
  id: `${data}-${tipo}`,
  date: new Date(`${data}T12:00:00`),
  type: tipo,
  assignedBrothers: pessoas,
})

const desenhar = (shifts: Shift[], porTurno = 3) =>
  renderToStaticMarkup(createElement(EscalaImagem, { shifts, geradoEm: new Date('2026-08-05T12:00:00'), porTurno, identidade: IDENTIDADE }))

const CHEIA = [
  turno('2026-08-02', 'MANHÃ', ['ana', 'bia', 'caio']),
  turno('2026-08-02', 'NOITE', ['caio', 'ana', 'bia']),
  turno('2026-08-16', 'SANTA_CEIA', []),
]

describe('a imagem desenha o que promete', () => {
  it('🔴 todo nome escalado aparece — nome comprido não some nem é cortado no meio', () => {
    const html = desenhar(CHEIA)
    for (const nome of ['Ana', 'Bia Carolina de Souza', 'Caio']) expect(html).toContain(nome)
  })

  it('🔴 a identidade vem do DADO — nada de nome de cliente cravado', () => {
    const html = desenhar(CHEIA)
    expect(html).toContain('Escala de Teste')
    expect(html).toContain('Unidade Alfa')
    expect(html).toContain('plantonistas')
    expect(html).not.toMatch(/Escala de Porteiros|JD\. São Luiz|irmãos/i)
  })

  it('🔴 cada turno tem a SUA cor — trocar MANHÃ por NOITE não pode passar', () => {
    const html = desenhar(CHEIA)
    // Âmbar na manhã, índigo na noite, vermelho na Santa Ceia. São as três famílias da tela.
    expect(html).toContain('#fffbeb') // pílula da MANHÃ
    expect(html).toContain('#eef2ff') // pílula da NOITE
    expect(html).toContain('#fef2f2') // pílula da SANTA CEIA
  })

  /*
    🔴 ESTE TESTE AFIRMAVA O DEFEITO — sexta auditoria externa, 05/08/2026.

    Ele passava `porTurno = 2` sobre uma escala de **3 nomes por turno** e exigia que o rodapé
    dissesse *"2 plantonistas por turno"*. Ou seja: exigia que a legenda contradissesse o desenho.

    O caminho real: "pessoas por turno" é editável na tela e vai para o `config.json` na publicação
    seguinte, **mesmo sem escala nova** — mas os turnos publicados têm a capacidade gravada em cada
    um e não mudam. Medido pelo auditor com `capacidadePadrao = 4` sobre setembro: a imagem saía
    dizendo "4 irmãos por turno" com três nomes em cada dia, e ainda abria uma quarta coluna vazia
    nos 18 dias. O irmão recebe isso no WhatsApp e pergunta quem está faltando.

    **Dado real vale mais que configuração.** O rodapé agora conta o que está na imagem.
  */
  it('🔴 o rodapé conta o que está DESENHADO, e uma configuração que discorda não vence', () => {
    const html = desenhar(CHEIA, 4)
    expect(html).toContain('05/08/2026')
    expect(html).toMatch(/3 plantonistas por turno/)
    expect(html).not.toMatch(/4 plantonistas por turno/)
  })

  it('sem turno nenhum, aí sim `porTurno` vale — não há dado do qual derivar', () => {
    const html = desenhar([], 2)
    expect(html).toMatch(/2 plantonistas por turno/)
  })

  it('🔴 e nenhuma coluna vazia sobra: a grade acompanha o turno mais cheio', () => {
    // Com `porTurno = 4` sobre turnos de 3, a versão anterior abria uma 4ª coluna vazia em TODO dia.
    const html = desenhar(CHEIA, 4)
    expect(html).toContain('repeat(3, 1fr)')
    expect(html).not.toContain('repeat(4, 1fr)')
  })

  it('🔴 dia com manhã E noite sai num cartão só — não em dois', () => {
    const html = desenhar(CHEIA)
    // "AGO" + "02" aparece uma vez; se o dia virasse dois cartões, apareceria duas.
    expect(html.split('>02<').length - 1).toBe(1)
  })

  it('🔴 a Santa Ceia aparece SEM ninguém, e diz isso com o vocabulário do cliente', () => {
    const html = desenhar(CHEIA)
    expect(html).toContain('SANTA CEIA')
    expect(html).toMatch(/sem plantonistas escalados/)
  })

  it('escala de um turno só não quebra o desenho', () => {
    expect(() => desenhar([turno('2026-08-02', 'NOITE', ['ana'])])).not.toThrow()
  })

  it('🔴 turno com MAIS gente que o padrão continua cabendo — a grade cresce com o conteúdo', () => {
    const html = desenhar([turno('2026-08-02', 'NOITE', ['ana', 'bia', 'caio'])], 1)
    for (const nome of ['Ana', 'Bia Carolina de Souza', 'Caio']) expect(html).toContain(nome)
  })
})
