/**
 * Nome não é sequência de bytes latinos — sétima auditoria externa, 05/08/2026.
 *
 * Os dois defeitos que estes testes fixam existiram no produto e chegaram ao ar:
 *   · emoji no começo do nome partia o par substituto e a IMAGEM morria com "URI malformed";
 *   · nome inteiro fora do alfabeto latino virava o identificador `_`, e o segundo colidia com o
 *     primeiro — duas pessoas viravam uma.
 */
import { describe, it, expect } from 'vitest'
import { primeiraLetra, idDoNome } from './nomes'

describe('primeiraLetra — por ponto de código, nunca por unidade de código', () => {
  it('o caso de sempre: nome latino', () => {
    expect(primeiraLetra('Adilson')).toBe('A')
    expect(primeiraLetra('érico')).toBe('É')
  })

  it('🔴 emoji no começo sai INTEIRO — era aqui que a imagem morria', () => {
    const inicial = primeiraLetra('🙏 Irmão Zé')
    expect(inicial).toBe('🙏')
    // A prova de que é texto válido, e não meio par substituto: sobreviver a uma ida e volta por
    // encodeURIComponent, que é exatamente o passo que estourava com "URI malformed".
    expect(() => encodeURIComponent(inicial)).not.toThrow()
    expect(decodeURIComponent(encodeURIComponent(inicial))).toBe(inicial)
  })

  it('a outra ponta: `charAt(0)` cru realmente produziria lixo', () => {
    // Sem este caso, o teste acima passaria mesmo se `primeiraLetra` fosse `charAt(0)` num nome
    // latino — e não provaria nada sobre o defeito.
    expect(() => encodeURIComponent('🙏 Irmão Zé'.charAt(0))).toThrow()
  })

  it('alfabeto não latino atravessa inteiro', () => {
    expect(primeiraLetra('李明')).toBe('李')
    expect(primeiraLetra('Дмитрий')).toBe('Д')
  })

  it('nome vazio não explode', () => {
    expect(primeiraLetra('')).toBe('')
  })
})

describe('idDoNome — estável, e NUNCA vazio', () => {
  it('o caso de sempre continua igual — mexer nisto apagaria histórico', () => {
    expect(idDoNome('Luis Henrique')).toBe('luis_henrique')
    expect(idDoNome('José')).toBe('jose')
  })

  it('🔴 dois nomes sem ASCII NÃO colidem — era `_` para os dois', () => {
    const a = idDoNome('李明')
    const b = idDoNome('Дмитрий')
    expect(a).not.toBe('_')
    expect(b).not.toBe('_')
    expect(a).not.toBe(b)
  })

  it('o mesmo nome dá sempre o mesmo identificador', () => {
    expect(idDoNome('李明')).toBe(idDoNome('李明'))
  })

  it('nome só de pontuação devolve vazio, para a tela poder recusar', () => {
    expect(idDoNome('...')).toBe('')
    expect(idDoNome('   ')).toBe('')
  })
})
