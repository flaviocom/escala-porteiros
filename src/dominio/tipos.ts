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
 * As cinco famílias de restrição que o Flavio pediu (as quatro de 04/08/2026 mais as ausências,
 * que entraram em 05/08 quando ele pediu para marcar férias antes de gerar).
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
  /**
   * Nome completo, para SAUDAR a pessoa na mensagem do WhatsApp — ex.: "Carlos Henrique" em vez do
   * `nome` curto que a tela de escala usa. Ausente ou vazio: a mensagem usa `nome` mesmo (S-063/S-064).
   */
  nomeCompleto?: string
  /**
   * Telefone do WhatsApp, sempre normalizado para dígitos com DDI 55 (ex.: "5511999999999") por
   * `normalizarTelefone` (`src/utils/telefone.ts`) — nunca o texto cru que a pessoa digitou. Ausente
   * ou vazio: a pessoa não recebe lembrete individual, só continua na escala normalmente (S-064).
   */
  telefone?: string
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
  /**
   * ⚠️ ESCRITO E NUNCA LIDO — declarado em 05/08/2026 por auditoria externa, e mantido de propósito.
   *
   * `carga-inicial.mjs` grava aqui a proveniência do bloco congelado — inclusive a explicação da
   * Santa Ceia de 07/06 estar errada no site antigo. **Nenhuma tela mostra.**
   *
   * Fica porque o dado publicado é o registro de longo prazo do projeto, e quem abrir o
   * `blocos.json` daqui a dois anos vai querer saber de onde aquele bloco veio. Não é código morto:
   * é nota de rodapé no dado. Se um dia virar tela, ela lê daqui.
   */
  observacao?: string
  /**
   * A semente que produziu esta escala, quando ela veio de uma busca com sorteio (GRASP).
   *
   * 🔴 É ela que mantém a promessa de conferência viva depois de 05/08/2026: com a mesma entrada e
   * esta semente, qualquer pessoa reproduz esta escala byte a byte. Sem gravá-la, "gerar várias
   * versões e escolher a melhor" produziria uma escala que ninguém consegue refazer — e escala
   * irreproduzível é escala que ninguém audita.
   *
   * Ausente nos blocos anteriores a essa data e nos importados: eles vieram do guloso puro, que não
   * precisa de semente para ser reproduzido.
   */
  semente?: number
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
  /**
   * ⏱️ QUEM É O DONO DESTA ESCALA — e por que isto existe antes de existir um segundo cliente.
   *
   * O produto atende **uma** congregação hoje (fase 1 — `docs/FINALIDADE_E_FASES.md`). Vender é
   * plano futuro. Este campo não ajuda o cliente de hoje em nada: ele existe para que instalar a
   * escala numa segunda comum seja **trocar dado**, e não reescrever o produto.
   *
   * Quando ele foi criado, ficou aqui **sem nunca ser lido** — e o nome do cliente seguiu cravado em
   * nove lugares da tela. Configuração morta é pior que configuração ausente: parece que resolve.
   * Hoje `npm run generico` reprova o *build* se algum voltar.
   */
  identidade: {
    titulo: string
    subtitulo: string
    /**
     * 🔴 COMO ESTE CLIENTE CHAMA QUEM É ESCALADO — 05/08/2026, regra máxima de escopo (§0).
     *
     * A tela dizia "Irmão", "irmãos por turno", "Buscar dia ou Irmão" em 24 lugares. É o vocabulário
     * de uma congregação — correto aqui, errado em toda parte que o Flavio queira vender. O exemplo
     * que ele próprio deu foi *"uma portaria de prédio"*: lá são funcionários, não irmãos.
     *
     * O modelo de domínio sempre chamou de `Pessoa`. Era só a TELA que falava outra língua.
     */
    /**
     * 🔴 O EMBLEMA — achado da auditoria externa, 05/08/2026, e o mais visível de todos.
     *
     * O logotipo desta congregação estava cravado por `import` em `App.tsx`, renderizado no
     * cabeçalho do site em desktop E celular, com `alt="Logo CCB"` — texto que um leitor de tela
     * lê em voz alta. Não estava na lista dos oito lugares corrigidos, e o portão de escopo não o
     * alcançava: ele varre TEXTO, e um `import` de imagem não tem texto de cliente nenhum.
     *
     * Agora é um arquivo em `dados/`, como os outros. **Vazio significa sem emblema** — e um
     * produto genérico tem de abrir bonito sem emblema nenhum, porque a maioria dos compradores
     * não terá um no primeiro dia.
     */
    logo: string
    pessoa: {
      /** Como aparece sozinho, com maiúscula: "Irmão", "Funcionário", "Plantonista". */
      singular: string
      /** Como aparece em contagem, minúsculo: "irmãos", "funcionários". */
      plural: string
    }
  }
}
