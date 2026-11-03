/**
 * O RASCUNHO — o que a área administrativa lembra entre uma visita e outra.
 *
 * 🔴 POR QUE ISTO EXISTE. 06/08/2026, palavras do dono:
 *
 *   > *"é necessário também salvar as informações. Hoje não salva: você altera e elas voltam. Por
 *   >  exemplo, o nome da escala e como chamar quem é escalado. Isso, quando eu salvar, tem que ficar
 *   >  fixo. Inclusive as datas que forem salvas, assim como todo o resto na tela."*
 *
 * Medido antes de escrever uma linha: ele muda De, Até, pessoas por turno e acrescenta uma Santa
 * Ceia; recarrega; **volta tudo ao padrão.** Nada daquela aba sobrevivia a um F5 — só o que fosse
 * PUBLICADO, e publicar é um gesto grande demais para guardar um ajuste em andamento.
 *
 * O efeito prático era pior do que perder digitação: ele mexia, era interrompido, voltava, e a tela
 * o recebia como se nada tivesse acontecido. Trabalho que some sem avisar ensina a não confiar na
 * ferramenta.
 *
 * ── O QUE ESTE RASCUNHO NÃO É ────────────────────────────────────────────────────────────────────
 *
 * **Não é publicação.** Ele vive no navegador deste aparelho. Nenhum irmão vê nada disto até o botão
 * Publicar — e é exatamente por isso que ele pode guardar qualquer coisa sem risco.
 *
 * ⚠️ E por isso ele precisa se DECLARAR na tela: um rascunho invisível é pior que nenhum, porque a
 * pessoa passa a ver números que não estão no ar sem saber disso. Quem chama esta função mostra a
 * data do rascunho e oferece descartá-lo.
 */
import type { Configuracao, Pessoa } from '../dominio/tipos'
import { hojeSaoPaulo } from '../dominio/datas'

const CHAVE = 'escala-porteiros:rascunho:v1'

let descartado: (Partial<Rascunho> & { dia: string }) | null = null
/**
 * O rascunho vencido que a última leitura descartou — com o dia —, para a tela decidir se avisa.
 * A tela grava o rascunho só de abrir; por isso quem chama compara com o publicado e só avisa quando
 * havia mudança de verdade (2ª auditoria de 03/11/2026: sem isso, o aviso aparecia toda manhã).
 */
export function rascunhoDescartado(): (Partial<Rascunho> & { dia: string }) | null {
  return descartado
}

/** O dia, em São Paulo, de um instante ISO — `Intl` com fuso explícito, nunca a data da máquina. */
function diaEmSaoPaulo(instante: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(instante))
  } catch {
    return ''
  }
}

export interface Rascunho {
  de: string
  ate: string
  config: Configuracao
  pessoas: Pessoa[]
  /** Quando foi guardado — é o que a tela mostra para ele decidir se ainda serve. */
  em: string
}

/**
 * 🔴 AS TRÊS PORTAS DO `localStorage` PODEM LANÇAR, e nenhuma vale uma tela em branco.
 *
 * Com cookies bloqueados, o **mero acesso** lança `SecurityError`; com a cota cheia, escrever lança
 * `QuotaExceededError`. O `App.tsx` já aprendeu isso na quinta auditoria — aqui a lição vem de
 * fábrica, em vez de esperar o mesmo incidente do outro lado do produto.
 *
 * Falhar em silêncio aqui é a decisão certa: o pior caso é a tela abrir com o publicado, que é
 * exatamente o comportamento de antes deste arquivo existir.
 */
export function lerRascunho(): Rascunho | null {
  try {
    const cru = localStorage.getItem(CHAVE)
    if (!cru) return null
    const r = JSON.parse(cru) as Partial<Rascunho>
    // Rascunho de uma versão anterior, ou corrompido, não derruba a tela: é ignorado.
    if (!r || typeof r.de !== 'string' || typeof r.ate !== 'string' || !r.config || !Array.isArray(r.pessoas)) {
      return null
    }
    /*
      🔴 RASCUNHO SÓ VALE NO DIA EM QUE FOI FEITO — pedido do dono em 03/11/2026: *"tem escala no
      cache, no navegador (…) eu quero entrar e ter acesso a gerar a escala e pronto."* Um rascunho
      de 25/10 carregava mudanças antigas que ele não via e fazia a geração de hoje falhar. Interromper
      e voltar no mesmo dia continua preservado (o pedido de 06/08); em outro dia, vale o publicado.
    */
    if (typeof r.em !== 'string' || diaEmSaoPaulo(r.em) !== hojeSaoPaulo()) {
      // Descartar em silêncio era o mesmo defeito do outro lado: mudança que some sem aviso.
      descartado = { ...r, dia: typeof r.em === 'string' ? diaEmSaoPaulo(r.em) : '' }
      limparRascunho()
      return null
    }
    return r as Rascunho
  } catch {
    return null
  }
}

export function gravarRascunho(r: Omit<Rascunho, 'em'>): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify({ ...r, em: new Date().toISOString() }))
  } catch {
    /* preferência não guardada — a tela continua funcionando exatamente igual */
  }
}

export function limparRascunho(): void {
  try {
    localStorage.removeItem(CHAVE)
  } catch {
    /* idem */
  }
}
