/**
 * 🔴 A CAIXA DE BUSCA É COMPARTILHADA COM OS ATALHOS DE PERÍODO, e isso já esvaziou a tela duas vezes.
 *
 * Clicar "Este Mês" escreve `01/08 - 31/08` **na mesma caixa em que a pessoa digita**. Qualquer
 * tecla depois disso mexe num texto que ela não escreveu — e o que sobrar ali vira busca literal,
 * que não casa com data, dia da semana nem nome: zero turnos, tela em branco, sem causa visível.
 *
 * A quinta auditoria pegou o caso "digitar no fim". A sexta mediu os sete gestos e achou **três**
 * ainda quebrados — todos com o cursor no meio, que é gesto trivial, não exótico:
 *
 *     Home, →→→, digitar "9"  →  "01/908 - 31/08"  →  "Nenhum turno encontrado"
 *     Home, →→→, Backspace    →  "0108 - 31/08"    →  idem
 *     Home, Delete            →  "1/08 - 31/08"    →  idem
 *
 * `apenasOAcrescentado` é a regra única que fecha os sete: o que sobra é o que a pessoa
 * ACRESCENTOU, e nunca um pedaço de rótulo.
 */
import { describe, expect, it } from 'vitest'
import { apenasOAcrescentado } from './DateSearch'

const ROTULO = '01/08 - 31/08'

describe('apenasOAcrescentado — o que a pessoa realmente digitou', () => {
  it('digitou no fim', () => {
    expect(apenasOAcrescentado(ROTULO, ROTULO + 'F')).toBe('F')
  })

  it('🔴 digitou no MEIO — era o caso que deixava "01/908 - 31/08" na caixa', () => {
    expect(apenasOAcrescentado(ROTULO, '01/908 - 31/08')).toBe('9')
  })

  it('🔴 apagou no meio com Backspace — era "0108 - 31/08"', () => {
    expect(apenasOAcrescentado(ROTULO, '0108 - 31/08')).toBe('')
  })

  it('🔴 apagou no começo com Delete — era "1/08 - 31/08"', () => {
    expect(apenasOAcrescentado(ROTULO, '1/08 - 31/08')).toBe('')
  })

  it('apagou tudo', () => {
    expect(apenasOAcrescentado(ROTULO, '')).toBe('')
  })

  it('selecionou tudo e digitou por cima', () => {
    expect(apenasOAcrescentado(ROTULO, 'Adilson')).toBe('Adilson')
  })

  it('colou uma data por cima', () => {
    expect(apenasOAcrescentado(ROTULO, '26/12')).toBe('26/12')
  })

  it('digitou no COMEÇO', () => {
    expect(apenasOAcrescentado(ROTULO, 'X' + ROTULO)).toBe('X')
  })

  it('a outra ponta: texto igual devolve vazio, não o texto inteiro', () => {
    expect(apenasOAcrescentado(ROTULO, ROTULO)).toBe('')
  })

  /*
    🔒 O QUE ESTA FUNÇÃO NÃO PROMETE, dito para ninguém confundir com defeito.

    Ela não reconstrói a intenção — reconstrói a DIFERENÇA. Digitar um caractere que já existe na
    borda comum é indistinguível de não ter digitado nada, e nesses casos ela devolve menos do que
    foi teclado. É a escolha certa: o pior desfecho aqui é sobrar pedaço de rótulo virando busca
    literal, e essa possibilidade fica fechada em todos os casos.
  */
  it('caractere igual ao da borda: devolve menos, nunca pedaço de rótulo', () => {
    const r = apenasOAcrescentado(ROTULO, '001/08 - 31/08')
    expect(r).toBe('0')
    expect(r).not.toContain('/')
  })
})
