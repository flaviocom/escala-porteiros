/**
 * O QUE ACONTECE QUANDO O `config.json` PUBLICADO NÃO TEM UM CAMPO.
 *
 * 🔴 POR QUE ESTE ARQUIVO EXISTE. `carregarDados` chamava
 * `buscarJSON<Configuracao>('config.json', CONFIG_PADRAO)` — e o padrão só entra quando o
 * **download falha**. Um arquivo que baixa bem, mas veio de uma versão anterior do produto, entrega
 * `undefined` no campo novo, com o TypeScript afirmando que ali existe uma `string`.
 *
 * É a mentira mais cara que um tipo pode contar: some na revisão, passa no `tsc`, passa no teste que
 * monta a configuração à mão — e aparece como a palavra "undefined" impressa na tela do usuário.
 *
 * Não é hipótese. Em 05/08/2026 o vocabulário (`identidade.pessoa`) nasceu, e o `config.json` que
 * estava no ar naquele instante não o tinha. Sem `completarConfig`, a primeira abertura do site
 * depois do deploy mostraria *"Total de turnos por undefined e mês"*.
 *
 * O que se prova aqui é a CLASSE, não o campo: qualquer campo que nasça depois cai no mesmo lugar.
 */
import { describe, expect, it } from 'vitest'
import { completarConfig, type ConfigLida } from './carregar'
import type { DataISO } from '../dominio/datas'

describe('completarConfig — o arquivo publicado pode estar velho', () => {
  it('🔴 config sem `identidade.pessoa` não produz undefined na tela', () => {
    // Exatamente o `config.json` que estava no ar em 05/08/2026, às 18h.
    const doAr: ConfigLida = {
      versao: 1,
      capacidadePadrao: 3,
      malhaPadrao: { regras: [] },
      santaCeia: ['2026-08-16' as DataISO],
      identidade: { titulo: 'Escala Porteiros', subtitulo: 'JD. São Luiz' },
    }
    const c = completarConfig(doAr)

    expect(c.identidade.pessoa.singular).toBe('Pessoa')
    expect(c.identidade.pessoa.plural).toBe('pessoas')
    // E o que o arquivo TINHA continua valendo — completar não é sobrescrever.
    expect(c.identidade.titulo).toBe('Escala Porteiros')
    expect(c.santaCeia).toEqual(['2026-08-16'])
  })

  it('🔴 a mescla é campo a campo, não rasa', () => {
    // `{...padrao, ...lido}` devolveria `identidade` INTEIRA do arquivo — logo, sem `pessoa`.
    // Este teste é o que separa a correção de verdade da que só parece funcionar.
    const c = completarConfig({ identidade: { titulo: 'Portaria Bloco A' } })
    expect(c.identidade.titulo).toBe('Portaria Bloco A')
    expect(c.identidade.pessoa).toEqual({ singular: 'Pessoa', plural: 'pessoas' })
  })

  it('arquivo vazio, nulo ou ausente devolve uma configuração inteira e genérica', () => {
    for (const entrada of [null, undefined, {}]) {
      const c = completarConfig(entrada)
      expect(c.identidade.titulo).toBe('Escala de plantões')
      expect(c.identidade.pessoa.singular).toBe('Pessoa')
      expect(c.capacidadePadrao).toBe(3)
      expect(c.malhaPadrao.regras).toEqual([])
    }
  })

  it('título vazio ou só espaços cai no padrão — cabeçalho em branco não é escolha', () => {
    expect(completarConfig({ identidade: { titulo: '   ' } }).identidade.titulo).toBe('Escala de plantões')
    expect(completarConfig({ identidade: { titulo: '' } }).identidade.titulo).toBe('Escala de plantões')
  })

  it('🔴 subtítulo VAZIO é respeitado — nem todo cliente tem segunda linha', () => {
    // Aqui `??` e não `||`, de propósito: string vazia é uma decisão de quem configurou; ausência
    // é que não é. Trocar um pelo outro devolveria "JD. São Luiz" para a tela de quem apagou.
    expect(completarConfig({ identidade: { titulo: 'Portaria', subtitulo: '' } }).identidade.subtitulo).toBe('')
  })

  it('o padrão do produto é GENÉRICO — nenhum nome de cliente sobra no código', () => {
    const c = completarConfig(null)
    const tudo = JSON.stringify(c)
    for (const proibido of ['Porteiros', 'São Luiz', 'Congregação', 'Irmão', 'irmãos']) {
      expect(tudo).not.toContain(proibido)
    }
  })

  it('vocabulário do cliente sobrevive inteiro quando está no arquivo', () => {
    const c = completarConfig({ identidade: { titulo: 'Escala Porteiros', subtitulo: 'JD. São Luiz', pessoa: { singular: 'Irmão', plural: 'irmãos' } } })
    expect(c.identidade.pessoa).toEqual({ singular: 'Irmão', plural: 'irmãos' })
  })
})
