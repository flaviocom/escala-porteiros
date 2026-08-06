/**
 * 📅 ESCOLHER OS MESES ANTES DE GERAR.
 *
 * 🔴 O QUE ISTO CONSERTA: a imagem sai **uma por mês** (uma de cinco meses bateria no teto de canvas
 * do navegador). Sem escolha, clicar em "Enviar Escala p/ WhatsApp" com a escala inteira em vista
 * disparava **dez downloads de uma vez** — o navegador enfileira, o celular pergunta dez vezes, e
 * ninguém queria nove daqueles arquivos.
 *
 * Três decisões de desenho, e o porquê de cada uma:
 *
 * 1. **Um mês em vista → nenhuma pergunta.** O caso comum não paga o preço da escolha. A caixa só
 *    aparece quando há de fato o que escolher.
 * 2. **`<dialog>` nativo**, não um painel posicionado. A barra lateral tem rolagem própria, e um
 *    menu absoluto ali seria **recortado**. De brinde vêm foco preso, Esc e fundo inerte, sem código.
 * 3. **O botão diz quantos arquivos vão sair.** "Gerar 3 imagens" é a informação que faltava no
 *    clique anterior — surpresa de download é o defeito original, não o número de meses.
 */
import { useEffect, useRef, useState } from 'react'
import { Calendar, X } from 'lucide-react'
import clsx from 'clsx'

export interface MesDisponivel {
  /** `2026-11` */
  chave: string
  rotulo: string
  /**
   * 🔴 Turnos COM GENTE — a mesma régua da imagem, e por isso ela existe aqui separada.
   *
   * Sétima auditoria: este seletor dizia **19** e a imagem gerada por ele dizia **18**. Dois números
   * para a mesma coisa, na mesma tela, e nenhum dos dois errado por si: o seletor contava todo turno
   * visível, a imagem contava só os que têm porteiro e mostrava a Santa Ceia à parte.
   *
   * Santa Ceia **não é turno**: é um dia sem porteiros. Somá-la infla um número que alguém repete
   * depois como se fosse trabalho escalado.
   */
  turnos: number
  /** Quantas Santas Ceias caem no mês — mostradas ao lado, nunca somadas. */
  ceias: number
}

interface Props {
  meses: MesDisponivel[]
  aoConfirmar: (chaves: string[]) => void
  aoFechar: () => void
}

export function SeletorDeMeses({ meses, aoConfirmar, aoFechar }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null)
  // Começa com o mês corrente marcado, se ele estiver na lista. É o que se quer mandar quase sempre.
  const [marcados, setMarcados] = useState<Set<string>>(() => {
    const hoje = new Date()
    const atual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
    return new Set(meses.some((m) => m.chave === atual) ? [atual] : meses.length ? [meses[0].chave] : [])
  })

  /*
    🔴 `showModal()` num diálogo JÁ ABERTO lança `InvalidStateError` — e o `StrictMode` roda os
    efeitos duas vezes em desenvolvimento, então isto estourava exatamente onde ninguém olha: no
    ambiente de quem está mexendo no código. Conferir `open` custa uma condição.
  */
  useEffect(() => {
    const d = dialogo.current
    if (d && !d.open) d.showModal()
    return () => d?.close()
  }, [])

  const alternar = (chave: string) =>
    setMarcados((antes) => {
      const novo = new Set(antes)
      if (novo.has(chave)) novo.delete(chave)
      else novo.add(chave)
      return novo
    })

  const escolhidos = meses.filter((m) => marcados.has(m.chave))
  const turnosTotal = escolhidos.reduce((s, m) => s + m.turnos, 0)
  const ceiasTotal = escolhidos.reduce((s, m) => s + m.ceias, 0)

  return (
    <dialog
      ref={dialogo}
      onCancel={aoFechar}
      onClose={aoFechar}
      className="w-[min(92vw,30rem)] rounded-2xl border border-gray-200 p-0 backdrop:bg-slate-900/40 open:animate-[surgir_.18s_cubic-bezier(.22,1,.36,1)] motion-reduce:open:animate-none"
    >
      <div className="flex items-start justify-between gap-4 px-5 pt-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-50 p-2">
            <Calendar className="h-5 w-5 text-indigo-700" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Quais meses enviar?</h2>
            <p className="text-sm text-slate-600">Sai uma imagem por mês.</p>
          </div>
        </div>
        <button
          title="Fechar sem gerar"
          onClick={aoFechar}
          className="-mr-1 -mt-1 grid h-11 w-11 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 max-h-[50vh] overflow-y-auto px-5">
        {meses.map((m) => {
          const marcado = marcados.has(m.chave)
          return (
            <label
              key={m.chave}
              title={`${m.turnos} turno(s) com gente escalada em ${m.rotulo}${m.ceias ? ` · ${m.ceias} Santa Ceia, que não é turno` : ''}`}
              className={clsx(
                'mb-2 flex min-h-[3rem] cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors',
                marcado ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 hover:bg-slate-50',
              )}
            >
              <input
                type="checkbox"
                checked={marcado}
                onChange={() => alternar(m.chave)}
                className="h-5 w-5 accent-indigo-600"
              />
              <span className="flex-1 font-semibold capitalize text-slate-900">{m.rotulo}</span>
              <span className="text-sm font-medium text-slate-600">
                {m.turnos} turnos{m.ceias ? ` · ${m.ceias} Santa Ceia` : ''}
              </span>
            </label>
          )
        })}
      </div>

      {/*
        Alvos de 44px: medido num iPhone 13 em 04/08/2026, "Todos" e "Nenhum" saíam com 36px de
        altura. É a mesma classe do defeito já corrigido nos alternadores de senha — dedo não tem
        a precisão do ponteiro, e 8px a menos é a diferença entre tocar e errar.
      */}
      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-gray-100 px-5 py-4">
        <button
          title="Marca todos os meses da lista"
          onClick={() => setMarcados(new Set(meses.map((m) => m.chave)))}
          className="min-h-[2.75rem] rounded-lg px-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
        >
          Todos
        </button>
        <button
          title="Desmarca todos"
          onClick={() => setMarcados(new Set())}
          className="min-h-[2.75rem] rounded-lg px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100"
        >
          Nenhum
        </button>
        <button
          title={escolhidos.length ? `Gera ${escolhidos.length} arquivo(s)` : 'Marque ao menos um mês'}
          disabled={!escolhidos.length}
          onClick={() => aoConfirmar([...marcados])}
          className="ml-auto min-h-[2.75rem] rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700 disabled:bg-slate-300"
        >
          {escolhidos.length === 0
            ? 'Escolha um mês'
            : `Gerar ${escolhidos.length} ${escolhidos.length === 1 ? 'imagem' : 'imagens'} · ${turnosTotal} turnos${ceiasTotal ? ` · ${ceiasTotal} Santa Ceia` : ''}`}
        </button>
      </div>
    </dialog>
  )
}
