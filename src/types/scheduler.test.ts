/**
 * 🔴 O PASSADO DE QUEM SAIU NÃO PODE SUMIR DA TELA.
 *
 * `src/dominio/tipos.ts` diz, sobre o campo `ativo`:
 *
 *   *"Sair da escala é `ativo: false`, **nunca** apagar o registro: os blocos passados referenciam a
 *   pessoa por `id`, e apagá-la deixaria o histórico com nomes órfãos."*
 *
 * A regra estava certa e escrita — e a camada de tela a violava: `definirPessoas` filtrava
 * `.filter((p) => p.ativo)`, recriando exatamente o órfão que o comentário proibia, três camadas
 * abaixo de onde a regra foi escrita.
 *
 * O defeito era **latente**: hoje as 16 pessoas estão ativas, então nada aparece. Ele acorda no
 * primeiro uso do recurso que deu origem ao projeto — *"sempre acontece de saírem pessoas da
 * escala"*.
 *
 * Quatro consequências, todas na mesma causa:
 *   · estatísticas — a pessoa some da tabela E os turnos passados dela somem do total
 *   · busca por nome — buscar quem saiu não acha os cultos dele
 *   · escala — o nome vira o `id` cru, pelo `|| id` do `getBrotherName`
 *   · filtro / Minha Escala — quem saiu não existe na lista
 */
import { describe, expect, it } from 'vitest'
import { BROTHERS, definirPessoas } from './scheduler'
import type { Pessoa } from '../dominio/tipos'

const pessoa = (id: string, nome: string, ativo: boolean): Pessoa => ({
  id, nome, ativo, restricoes: {},
})

const ELENCO = [
  pessoa('ana', 'Ana', true),
  pessoa('bento', 'Bento', true),
  pessoa('caio', 'Caio Que Saiu', false), // escalado no passado, fora do elenco de hoje
]

describe('definirPessoas — quem saiu continua nomeável', () => {
  it('🔴 REGRESSÃO: quem tem `ativo: false` continua na lista', () => {
    definirPessoas(ELENCO)
    expect(BROTHERS.map((b) => b.id)).toContain('caio')
  })

  it('o nome de quem saiu resolve — nada de mostrar o id cru na escala do passado', () => {
    definirPessoas(ELENCO)
    const nome = BROTHERS.find((b) => b.id === 'caio')?.name
    expect(nome).toBe('Caio Que Saiu')
    expect(nome).not.toBe('caio')
  })

  it('quem saiu vem MARCADO, para a tela poder distinguir sem adivinhar', () => {
    definirPessoas(ELENCO)
    expect(BROTHERS.find((b) => b.id === 'caio')?.ativo).toBe(false)
    expect(BROTHERS.find((b) => b.id === 'ana')?.ativo).toBe(true)
  })

  it('e o caso limpo continua igual: quem está ativo aparece com as restrições traduzidas', () => {
    definirPessoas([
      { id: 'd', nome: 'Dora', ativo: true, restricoes: { tetoMensal: 2, turnosPermitidos: ['NOITE'], diasProibidos: [6] } },
    ])
    const d = BROTHERS.find((b) => b.id === 'd')
    expect(d?.name).toBe('Dora')
    expect(d?.constraints.fixedPerMonth).toBe(2)
    expect(d?.constraints.shiftsAllowed).toEqual(['NOITE'])
    expect(d?.constraints.forbiddenDays).toEqual([6])
  })

  it('trocar o elenco SUBSTITUI a lista — não acumula gente de uma carga anterior', () => {
    definirPessoas(ELENCO)
    definirPessoas([pessoa('zeca', 'Zeca', true)])
    expect(BROTHERS.map((b) => b.id)).toEqual(['zeca'])
  })
})
