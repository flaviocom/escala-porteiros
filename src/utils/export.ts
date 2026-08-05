/**
 * Entrega da imagem: compartilhar no celular, baixar no computador.
 *
 * 🔴 O QUE MUDOU EM 04/08/2026: antes, esta função **fotografava a tela** — pegava o
 * `#schedule-container`, ligava um modo `is-exporting` que sobrescrevia largura, cores e pesos de
 * fonte no meio da captura, e fatiava a lista em 10 dias com um alerta pedindo *"filtre um período
 * menor"*.
 *
 * A imagem saía parecida com um site. O modelo que o Flavio usa é um **documento**, e documento não
 * se faz com captura de tela: o layout agora é próprio (`src/export/EscalaImagem.tsx`), montado fora
 * do campo de visão. Aqui ficou só o que sempre foi desta camada — **entregar o arquivo**.
 */
import { gerarImagemDaEscala } from '../export/gerarImagem'
import type { Shift } from '../types/scheduler'

const doisDigitos = (n: number) => String(n).padStart(2, '0')

/** `escala-porteiros-05-08-2026-a-30-12-2026.png` — o nome já diz o período, sem abrir o arquivo. */
function nomeDoArquivo(shifts: Shift[]): string {
  const datas = shifts.map((s) => s.date).sort((a, b) => a.getTime() - b.getTime())
  const rotulo = (d: Date) => `${doisDigitos(d.getDate())}-${doisDigitos(d.getMonth() + 1)}-${d.getFullYear()}`
  if (!datas.length) return 'escala-porteiros.png'
  const [i, f] = [datas[0], datas[datas.length - 1]]
  return rotulo(i) === rotulo(f)
    ? `escala-porteiros-${rotulo(i)}.png`
    : `escala-porteiros-${rotulo(i)}-a-${rotulo(f)}.png`
}

export async function exportToImage(shifts: Shift[]): Promise<void> {
  const blob = await gerarImagemDaEscala(shifts)
  const nome = nomeDoArquivo(shifts)
  const arquivo = new File([blob], nome, { type: 'image/png' })

  // No celular, o compartilhamento nativo leva direto ao WhatsApp — que é o destino real da imagem.
  const podeCompartilhar =
    typeof navigator !== 'undefined' &&
    'share' in navigator &&
    'canShare' in navigator &&
    navigator.canShare({ files: [arquivo] })

  if (podeCompartilhar) {
    try {
      await navigator.share({ files: [arquivo], title: 'Escala de Porteiros' })
      return
    } catch (e) {
      // Cancelar o compartilhamento NÃO é erro — e cair no download depois de cancelar seria
      // entregar o que a pessoa acabou de recusar.
      if (e instanceof DOMException && e.name === 'AbortError') return
    }
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nome
  document.body.appendChild(link)
  link.click()
  setTimeout(() => {
    link.remove()
    URL.revokeObjectURL(url)
  }, 1000)
}
