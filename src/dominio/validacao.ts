/**
 * A VALIDAÇÃO — percorre o catálogo INTEIRO e devolve o veredito.
 *
 * ⚠️ Escopo por exclusão explícita (ERRO 20): esta função avalia **todas** as regras de `CATALOGO`.
 * Não existe subconjunto escolhido a mão. Se um dia alguma precisar ficar de fora, isso vira campo
 * `ignoradas` no relatório — declarado e contado, nunca silencioso.
 */
import { CATALOGO, type Contexto, type ResultadoRegra } from './regras'

export interface Relatorio {
  resultados: ResultadoRegra[]
  /** Quantas regras do catálogo foram avaliadas, e quantas existem. Iguais, sempre. */
  avaliadas: number
  totalNoCatalogo: number
  /** Regras duras violadas. Enquanto não estiver vazio, **a escala não publica**. */
  falhasDuras: ResultadoRegra[]
  avisos: ResultadoRegra[]
  /** O veredito, em uma palavra. */
  aprovada: boolean
}

export function validar(ctx: Contexto): Relatorio {
  const resultados = CATALOGO.map((r) => r.avaliar(ctx))
  const falhasDuras = resultados.filter((r) => r.familia === 'DURA' && r.status === 'falha')
  const avisos = resultados.filter((r) => r.status === 'aviso')
  return {
    resultados,
    avaliadas: resultados.length,
    totalNoCatalogo: CATALOGO.length,
    falhasDuras,
    avisos,
    aprovada: falhasDuras.length === 0,
  }
}

/** Resumo em uma linha, em português, para tela e log. */
export function resumir(rel: Relatorio): string {
  if (!rel.aprovada) {
    const n = rel.falhasDuras.reduce((s, r) => s + r.violacoes.length, 0)
    return `Reprovada: ${rel.falhasDuras.length} regra(s) obrigatória(s) violada(s), ${n} ocorrência(s).`
  }
  if (rel.avisos.length) {
    const n = rel.avisos.reduce((s, r) => s + r.violacoes.length, 0)
    return `Aprovada, com ${rel.avisos.length} ponto(s) de atenção (${n} observação(ões)).`
  }
  return 'Aprovada, sem ressalvas.'
}
