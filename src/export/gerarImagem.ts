/**
 * Gera a imagem da escala a partir do layout dedicado — não da tela.
 *
 * O componente é montado **fora do campo de visão**, medido e capturado. Assim a imagem não depende
 * do tamanho da janela, do que está rolado, do filtro visual nem do CSS `is-exporting` que a versão
 * anterior usava para forçar largura e cor no meio da captura.
 *
 * Duas consequências práticas, e as duas eram defeito antes:
 *   · **não há mais fatia de 10 dias.** O período inteiro sai na imagem — era a tela que não
 *     aguentava, não o formato.
 *   · a imagem fica igual em qualquer aparelho, porque nada nela vem do aparelho.
 */
import { createRoot } from 'react-dom/client'
import { createElement } from 'react'
import { toBlob } from 'html-to-image'
import { EscalaImagem } from './EscalaImagem'
import type { Shift } from '../types/scheduler'

const LARGURA = 1440

export async function gerarImagemDaEscala(shifts: Shift[]): Promise<Blob> {
  if (!shifts.length) throw new Error('Não há turnos no período selecionado para gerar a imagem.')

  // Fora da vista, mas RENDERIZADO: `display:none` não tem layout, e o que não tem layout não
  // vira imagem. Por isso vai para fora da tela, não para o nada.
  const palco = document.createElement('div')
  palco.style.cssText = `position:fixed;left:-99999px;top:0;width:${LARGURA}px;pointer-events:none;`
  document.body.appendChild(palco)

  const raiz = createRoot(palco)
  try {
    raiz.render(createElement(EscalaImagem, { shifts, geradoEm: new Date() }))

    // Espera o React pintar e as fontes assentarem. Sem isto, a primeira linha sai com a fonte
    // de fallback e a imagem fica com dois tipos diferentes — defeito que só aparece na 1ª geração.
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    if ('fonts' in document) await (document as Document & { fonts: FontFaceSet }).fonts.ready
    await new Promise((r) => setTimeout(r, 120))

    const alvo = palco.firstElementChild as HTMLElement | null
    if (!alvo) throw new Error('Falha ao montar o layout da imagem.')

    const blob = await toBlob(alvo, {
      pixelRatio: 1,
      backgroundColor: '#eceff5',
      width: LARGURA,
      height: alvo.scrollHeight,
      cacheBust: true,
    })
    if (!blob) throw new Error('Falha ao gerar a imagem.')
    return blob
  } finally {
    // `unmount` síncrono dentro do próprio ciclo do React dispara aviso; adiar um tique resolve.
    setTimeout(() => {
      raiz.unmount()
      palco.remove()
    }, 0)
  }
}
