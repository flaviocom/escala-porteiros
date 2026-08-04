/**
 * Modelo de dados da escala.
 *
 * A mudança de fundo em relação ao site anterior: lá **não existia "a escala"** — existia uma função
 * que reconstruía tudo a cada abertura do navegador. É por isso que não havia como editar: não havia
 * o que editar. Aqui a escala é **dado publicado**, e por isso passa a ser editável, versionável e
 * reversível.
 */
import type { DataISO } from './datas'

export type TipoTurno = 'MANHA' | 'TARDE' | 'NOITE'

/** Rótulo que a tela mostra. `MANHA` sem acento no código, "Manhã" na tela. */
export const ROTULO_TURNO: Record<TipoTurno, string> = {
  MANHA: 'Manhã',
  TARDE: 'Tarde',
  NOITE: 'Noite',
}

// ---------------------------------------------------------------------------
// PESSOAS
// ---------------------------------------------------------------------------

/** Intervalo de ausência: férias, viagem, compromisso. Inclusivo nas duas pontas. */
export interface Ausencia {
  inicio: DataISO
  fim: DataISO
  motivo?: string
}

/**
 * As quatro famílias de restrição que o Flavio pediu em 04/08/2026.
 *
 * Toda lista ausente significa "sem restrição". Lista **vazia** significa "não pode nenhum" — e é
 * por isso que a validação precisa distinguir `undefined` de `[]`: são coisas diferentes, e tratá-las
 * igual é como um `null` que liga um modo especial (ERRO 22 do catálogo de anteparos).
 */
export interface Restricoes {
  /** Dias da semana em que PODE (0=dom … 6=sáb). Ausente = todos. */
  diasPermitidos?: number[]
  /** Dias da semana em que NUNCA pode. Vence `diasPermitidos` em caso de conflito. */
  diasProibidos?: number[]
  /** Turnos em que PODE. Ausente = todos. */
  turnosPermitidos?: TipoTurno[]
  /**
   * Máximo de escalas por mês. É **teto**, não meta.
   *
   * O site anterior tinha uma contradição ativa: o gerador tratava como teto e a validação cobrava
   * como exato — quem ficasse abaixo era acusado de falha inexistente. Aqui o teto barra, e ficar
   * abaixo vira **aviso** (regra Q5), nunca reprovação.
   */
  tetoMensal?: number
  /** Intervalos de ausência. */
  ausencias?: Ausencia[]
}

export interface Pessoa {
  id: string
  nome: string
  /**
   * Sair da escala é `ativo: false`, **nunca** apagar o registro: os blocos passados referenciam a
   * pessoa por `id`, e apagá-la deixaria o histórico com nomes órfãos.
   */
  ativo: boolean
  restricoes: Restricoes
}

export interface ArquivoPessoas {
  versao: 1
  pessoas: Pessoa[]
}

// ---------------------------------------------------------------------------
// MALHA — quais dias têm culto, e com que turnos
// ---------------------------------------------------------------------------

/**
 * Uma regra da malha. Precisa cobrir, no mínimo, as duas variantes que a congregação já usou:
 *
 *   • atual   — dom manhã+noite · qua noite · sáb noite · 1º sáb tarde (Ensaio)
 *   • reforma — ter noite · sex noite · dom manhã a cada 14 dias
 *
 * É por isso que a malha é DADO e não código: ela já mudou uma vez.
 */
export interface RegraMalha {
  /** 0=dom … 6=sáb */
  diaSemana: number
  turnos: TipoTurno[]
  /** Só na N-ésima ocorrência do mês (1 = primeiro sábado do mês). Ausente = toda semana. */
  somenteOcorrencia?: number
  /** A cada N dias a partir de `ancora`. Para a malha alternada da reforma. */
  cadaNDias?: number
  ancora?: DataISO
  /** Etiqueta extra na tela, ex.: "ENSAIO". */
  rotulo?: string
  /** Capacidade específica desta regra. Ausente = `capacidadePadrao` da configuração. */
  capacidade?: number
}

export interface Malha {
  regras: RegraMalha[]
}

// ---------------------------------------------------------------------------
// TURNOS E BLOCOS
// ---------------------------------------------------------------------------

export interface Turno {
  data: DataISO
  tipo: TipoTurno
  /** IDs das pessoas escaladas. */
  pessoas: string[]
  /** Quantas vagas este turno tem. */
  capacidade: number
  rotulo?: string
  /** Santa Ceia: dia marcado, sem porteiros, e que não consome cota de ninguém. */
  santaCeia?: true
}

export type OrigemBloco = 'importado' | 'algoritmo' | 'motor' | 'manual'

/**
 * Um bloco é um trecho da escala com um elenco e uma malha vigentes.
 *
 * **Bloco publicado é imutável no trecho que permanece.** Ele só pode ser **truncado** numa data —
 * gerar `01/09 → 30/12` corta o bloco anterior em 31/08 e março–agosto continua byte a byte.
 * Truncar é permitido; reescrever o que ficou, não. O passado já foi divulgado aos irmãos.
 */
export interface Bloco {
  id: string
  inicio: DataISO
  fim: DataISO
  geradoEm: string
  origem: OrigemBloco
  /** Maior piso de distanciamento que coube. `null` quando desconhecido (bloco importado). */
  pisoAlcancado: number | null
  elenco: string[]
  malha: Malha
  turnos: Turno[]
  observacao?: string
}

export interface ArquivoBlocos {
  versao: 1
  blocos: Bloco[]
}

// ---------------------------------------------------------------------------
// CONFIGURAÇÃO
// ---------------------------------------------------------------------------

export interface Configuracao {
  versao: 1
  capacidadePadrao: number
  malhaPadrao: Malha
  /**
   * Datas de Santa Ceia. **Uma por ano**, decidida no início do ano, e pode estar vazia enquanto
   * não for marcada. No dia marcado não se escala ninguém: irmãos de outra igreja atendem, e os
   * daqui participam.
   */
  santaCeia: DataISO[]
  identidade: {
    titulo: string
    subtitulo: string
  }
}
