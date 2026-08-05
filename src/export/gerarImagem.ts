/**
 * Gera a imagem da escala a partir do layout dedicado — não da tela.
 *
 * O componente é montado **fora do campo de visão**, medido e capturado. Assim a imagem não depende
 * do tamanho da janela, do que está rolado, do filtro visual nem do CSS `is-exporting` que a versão
 * anterior usava para forçar largura e cor no meio da captura.
 *
 * 🔴 UMA IMAGEM POR MÊS, E ISTO É O CORAÇÃO DO ARQUIVO.
 *
 * A versão anterior fatiava a escala em **5 dias** para exportar. Tirei o corte — e, ao gerar o
 * período inteiro (131 dias), o resultado foi **969 × 16384**: o navegador **corta o canvas em
 * 16384px** e, para caber, encolheu a largura de 1440 para 969. A imagem saía **truncada e
 * distorcida, sem erro nenhum**. Eu tinha trocado uma falha declarada por uma falha silenciosa.
 *
 * Fatiar por **mês** é o que resolve, e não é remendo: é como a escala é usada. O arquivo que o
 * Flavio manda hoje no WhatsApp é de um mês; uma imagem de cinco meses teria 16 mil pixels de
 * altura e ninguém conseguiria ler no celular.
 *
 * E cada imagem é **conferida depois de pronta**: se a largura sair diferente de 1440, o navegador
 * encolheu — e aí é erro, não arquivo.
 */
import { createRoot } from 'react-dom/client'
import { createElement } from 'react'
import { toBlob } from 'html-to-image'
import { EscalaImagem } from './EscalaImagem'
import type { Shift } from '../types/scheduler'

const LARGURA = 1440

/** Teto do canvas nos navegadores. Passar disto não dá erro: dá imagem encolhida. */
const TETO_DE_ALTURA = 16384

const MES_ARQUIVO = ['01-janeiro', '02-fevereiro', '03-marco', '04-abril', '05-maio', '06-junho',
  '07-julho', '08-agosto', '09-setembro', '10-outubro', '11-novembro', '12-dezembro']

/** O nome que vai impresso na imagem — vem de `config.identidade`, nunca do código. */
export interface Identidade { titulo: string; subtitulo: string; pessoa: { singular: string; plural: string } }

export interface ImagemGerada {
  nome: string
  blob: Blob
  /** Rótulo legível do que está nesta imagem — vai para a mensagem quando são várias. */
  periodo: string
}

/** Separa por mês, preservando a ordem cronológica. */
function porMes(shifts: Shift[]): Shift[][] {
  const mapa = new Map<string, Shift[]>()
  for (const s of [...shifts].sort((a, b) => a.date.getTime() - b.date.getTime())) {
    const k = `${s.date.getFullYear()}-${s.date.getMonth()}`
    if (!mapa.has(k)) mapa.set(k, [])
    mapa.get(k)!.push(s)
  }
  return [...mapa.values()]
}

async function capturar(shifts: Shift[], porTurno: number, identidade: Identidade): Promise<Blob> {
  // Fora da vista, mas RENDERIZADO: `display:none` não tem layout, e o que não tem layout não
  // vira imagem. Por isso vai para fora da tela, não para o nada.
  const palco = document.createElement('div')
  palco.style.cssText = `position:fixed;left:-99999px;top:0;width:${LARGURA}px;pointer-events:none;`
  document.body.appendChild(palco)

  const raiz = createRoot(palco)
  try {
    // 🔴 `porTurno` VEM DA CONFIGURAÇÃO — achado de auditoria independente em 04/08/2026.
    //
    // Sem ser passado, o componente caía no padrão `= 3` e o rodapé afirmava "3 irmãos por turno"
    // como fato. Mas `capacidadePadrao` é editável pelo administrador: no dia em que ele mudasse, a
    // imagem que vai para o WhatsApp continuaria dizendo 3 — número errado, impresso como fato, no
    // documento que a congregação lê.
    raiz.render(createElement(EscalaImagem, { shifts, geradoEm: new Date(), porTurno, identidade }))

    // Espera o React pintar e as fontes assentarem. Sem isto, a primeira linha sai com a fonte
    // de fallback e a imagem fica com dois tipos diferentes — defeito que só aparece na 1ª geração.
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    if ('fonts' in document) await (document as Document & { fonts: FontFaceSet }).fonts.ready
    await new Promise((r) => setTimeout(r, 120))

    const alvo = palco.firstElementChild as HTMLElement | null
    if (!alvo) throw new Error('Falha ao montar o layout da imagem.')

    const altura = alvo.scrollHeight
    if (altura > TETO_DE_ALTURA) {
      // Falhar aqui é melhor que entregar a imagem encolhida que o navegador produziria.
      throw new Error(
        `Este período daria uma imagem de ${altura}px de altura, acima do limite de ${TETO_DE_ALTURA}px ` +
        'do navegador. Gere por mês.',
      )
    }

    const blob = await toBlob(alvo, {
      pixelRatio: 1,
      backgroundColor: '#eceff5',
      width: LARGURA,
      height: altura,
      cacheBust: true,
    })
    if (!blob) throw new Error('Falha ao gerar a imagem.')

    // 🔒 Confere o que SAIU, não o que foi pedido. Quando o navegador encolhe para caber no teto,
    // ele não avisa: devolve um PNG menor, distorcido, com cara de arquivo bom.
    const bitmap = await createImageBitmap(blob)
    const largura = bitmap.width
    bitmap.close()
    if (largura !== LARGURA) {
      throw new Error(`A imagem saiu com ${largura}px de largura em vez de ${LARGURA}px — o navegador a encolheu.`)
    }

    return blob
  } finally {
    // `unmount` síncrono dentro do próprio ciclo do React dispara aviso; adiar um tique resolve.
    setTimeout(() => {
      raiz.unmount()
      palco.remove()
    }, 0)
  }
}

/**
 * Uma imagem por mês do período selecionado.
 *
 * Um mês só → um arquivo, como sempre foi. Vários meses → um arquivo por mês, porque é assim que a
 * escala é lida e é o único jeito de cada imagem caber no que o navegador desenha.
 */
/**
 * O título vira nome de arquivo: sem acento, sem espaço, sem maiúscula.
 *
 * `normalize('NFD')` separa a letra do acento; a faixa `̀-ͯ` são exatamente os acentos
 * soltos, que então caem fora. É por isso que "Congregação" vira `congregacao` e não `congregao`.
 */
export function apelidoDeArquivo(titulo: string): string {
  const limpo = titulo
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  // Título só de símbolos (ou vazio) deixaria o arquivo começando com "-2026": nome quebrado.
  return limpo || 'escala'
}

export async function gerarImagensDaEscala(shifts: Shift[], porTurno: number, identidade: Identidade): Promise<ImagemGerada[]> {
  if (!shifts.length) throw new Error('Não há turnos no período selecionado para gerar a imagem.')

  const meses = porMes(shifts)
  const imagens: ImagemGerada[] = []
  const apelido = apelidoDeArquivo(identidade.titulo)

  for (const doMes of meses) {
    const d = doMes[0].date
    const blob = await capturar(doMes, porTurno, identidade)
    imagens.push({
      blob,
      nome: `${apelido}-${d.getFullYear()}-${MES_ARQUIVO[d.getMonth()]}.png`,
      periodo: `${MES_ARQUIVO[d.getMonth()].slice(3)} de ${d.getFullYear()}`,
    })
  }

  return imagens
}
