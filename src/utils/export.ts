/**
 * Entrega da imagem: compartilhar no celular, baixar no computador.
 *
 * 🔴 O QUE MUDOU EM 04/08/2026: antes, esta função **fotografava a tela** — pegava o
 * `#schedule-container`, ligava um modo `is-exporting` que sobrescrevia largura, cores e pesos de
 * fonte no meio da captura, e fatiava a lista em **5 dias** com um alerta pedindo *"filtre um
 * período menor"*.
 *
 * A imagem saía parecida com um site. O modelo que o Flavio usa é um **documento**, e documento não
 * se faz com captura de tela: o layout agora é próprio (`src/export/EscalaImagem.tsx`). Aqui ficou
 * só o que sempre foi desta camada — **entregar o arquivo**.
 *
 * E quando o período passa de um mês, são **vários** arquivos: um por mês. Não é preferência —
 * uma imagem de cinco meses bate no teto de canvas do navegador e sai encolhida.
 */
import { gerarImagensDaEscala, type Identidade } from '../export/gerarImagem'
import type { Shift } from '../types/scheduler'

/**
 * 🔴 COMPARTILHAR SÓ EM APARELHO DE TOQUE — 03/11/2026, relato do dono: *"ao baixar imagem da
 * escala, isso não sai da tela, já fechei o chrome"*. O cabeçalho deste arquivo sempre prometeu
 * "baixar no computador", mas a decisão era só "o navegador sabe compartilhar?" — e o Chrome no
 * Windows sabe: abria a janela "Compartilhar" do sistema, que ainda ficou presa depois de fechar o
 * Chrome. Agora o que decide é o aparelho: ponteiro principal de toque (celular, tablet) compartilha;
 * mouse baixa. Exportada para o teste provar as duas pontas sem navegador.
 */
export function deveCompartilhar(ambiente: {
  temShare: boolean
  aceitaArquivos: boolean
  toquePrincipal: boolean
}): boolean {
  const { temShare, aceitaArquivos, toquePrincipal } = ambiente || { temShare: false, aceitaArquivos: false, toquePrincipal: false }
  return Boolean(temShare && aceitaArquivos && toquePrincipal)
}

export async function exportToImage(shifts: Shift[], porTurno: number, identidade: Identidade): Promise<void> {
  const imagens = await gerarImagensDaEscala(shifts, porTurno, identidade)
  const arquivos = imagens.map((i) => new File([i.blob], i.nome, { type: 'image/png' }))

  // No celular, o compartilhamento nativo leva direto ao WhatsApp — que é o destino real da imagem.
  // `canShare` é consultado com os arquivos DE VERDADE: alguns aparelhos aceitam um e recusam vários.
  const temShare = typeof navigator !== 'undefined' && 'share' in navigator && 'canShare' in navigator
  const podeCompartilhar = deveCompartilhar({
    temShare,
    aceitaArquivos: temShare && navigator.canShare({ files: arquivos }),
    toquePrincipal: typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches,
  })

  if (podeCompartilhar) {
    try {
      await navigator.share({
        files: arquivos,
        title: identidade.titulo,
        text: imagens.length > 1 ? `Escala de ${imagens.map((i) => i.periodo).join(', ')}` : undefined,
      })
      return
    } catch (e) {
      // Cancelar o compartilhamento NÃO é erro — e cair no download depois de cancelar seria
      // entregar o que a pessoa acabou de recusar.
      if (e instanceof DOMException && e.name === 'AbortError') return
    }
  }

  for (const [i, imagem] of imagens.entries()) {
    const url = URL.createObjectURL(imagem.blob)
    const link = document.createElement('a')
    link.href = url
    link.download = imagem.nome
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
    // O navegador ignora downloads disparados no mesmo instante — um respiro entre eles é o que
    // faz os 5 arquivos chegarem, em vez de só o primeiro.
    if (i < imagens.length - 1) await new Promise((r) => setTimeout(r, 350))
  }
}
