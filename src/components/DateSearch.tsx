import React, { useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, Search, X } from 'lucide-react';
import { isSameDay, format } from 'date-fns';
import { clsx } from 'clsx';

/** Como este cliente chama quem é escalado — vem de `config.identidade.pessoa`. */
export interface Vocabulario { singular: string; plural: string }

interface DateSearchProps {
  vocabulario: Vocabulario;
  value: string;
  onChange: (query: string) => void;
  onDateRangeChange: (range: { start: Date | null; end: Date | null } | null) => void;
  dateRange: { start: Date | null; end: Date | null } | null;
}

/**
 * O que a pessoa ACRESCENTOU a um texto que ela não escreveu.
 *
 * Compara as duas pontas: consome o prefixo comum, consome o sufixo comum, e o que sobra no meio do
 * texto novo é o que foi digitado. Apagar devolve string vazia, que é a resposta certa — quem mexe
 * no rótulo de um atalho está desfazendo o atalho, não construindo uma busca a partir dele.
 *
 * Exportada só para o teste: é a regra que impede a tela de esvaziar sem causa visível.
 */
export function apenasOAcrescentado(antigo: string, novo: string): string {
  let i = 0
  while (i < antigo.length && i < novo.length && antigo[i] === novo[i]) i++
  let j = 0
  while (j < antigo.length - i && j < novo.length - i && antigo[antigo.length - 1 - j] === novo[novo.length - 1 - j]) j++
  return novo.slice(i, novo.length - j)
}

export const DateSearch: React.FC<DateSearchProps> = ({ value, onChange, onDateRangeChange, dateRange, vocabulario }) => {
  const campoDeData = useRef<HTMLInputElement>(null);
  // Sync query with currentRange if it changes externally or via quick actions
  useEffect(() => {
    if (dateRange?.start && dateRange?.end) {
      if (isSameDay(dateRange.start, dateRange.end)) {
        onChange(format(dateRange.start, 'dd/MM/yyyy'));
      } else {
        onChange(`${format(dateRange.start, 'dd/MM')} - ${format(dateRange.end, 'dd/MM')}`);
      }
    }
  }, [dateRange]);

  /*
    🔴 O `useState` fantasma foi removido em 05/08/2026 — achado de auditoria externa.

    Era `const [, setActiveFilter] = useState(...)`: o valor descartado no próprio destructuring, e o
    setter chamado 4 vezes, **sempre com `null`**. Os atalhos de período migraram para o `App`, e esta
    cópia local ficou — estado que existe, é escrito, e ninguém lê. O React re-renderizava por causa
    dele, sem nada mudar na tela.
  */

  /*
    🔴 O `useEffect` de corpo VAZIO foi removido em 05/08/2026 — quinta auditoria externa.

    Era `useEffect(() => { if (!dateRange) {} }, [dateRange])`: sobrevivente da mesma limpeza descrita
    logo acima, e a única coisa que ele fazia era rodar a cada mudança. Código que não faz nada mas
    parece que faz é pior que código ausente — o próximo leitor procura o efeito e não acha.
  */

  /** O rótulo que os atalhos escrevem na caixa. Mesma forma do efeito acima, num lugar só. */
  const rotuloDoIntervalo = (): string | null => {
    if (!dateRange?.start || !dateRange?.end) return null;
    return isSameDay(dateRange.start, dateRange.end)
      ? format(dateRange.start, 'dd/MM/yyyy')
      : `${format(dateRange.start, 'dd/MM')} - ${format(dateRange.end, 'dd/MM')}`;
  };

  /*
    🔴 DIGITAR DEPOIS DE UM ATALHO ZERAVA A ESCALA — quinta auditoria externa, 05/08/2026.

    Clicar "Este Mês" escreve `01/08 - 31/08` **nesta caixa**, que é a mesma em que a pessoa digita.
    O filtro tolerava esse texto só enquanto o intervalo existisse, e por igualdade EXATA. Bastava
    uma tecla: `onDateRangeChange(null)` derrubava o intervalo, o texto continuava lá, e
    `"01/08 - 31/08F"` virava busca literal — que não casa com data, dia da semana nem nome. Zero
    turnos, tela em branco, e para voltar era preciso apagar 15 caracteres que a pessoa não escreveu.

    A correção pergunta o que de fato aconteceu: se o que estava na caixa era o rótulo do atalho, o
    que a pessoa acrescentou é o que ela quis buscar — e é só isso que fica.
  */
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    const rotulo = rotuloDoIntervalo();
    const mexeuNoRotulo = rotulo !== null && value === rotulo;

    /*
      🔴 "EDITAR NO MEIO" NÃO ERA INDECIFRÁVEL — sexta auditoria externa, 05/08/2026.

      A primeira correção tratou dois gestos (digitar no fim, apagar no fim) e deixou o resto cair no
      `else` implícito, com o comentário *"não há como adivinhar melhor que isso"*. Mas o código
      **sabe** que a pessoa mexeu no rótulo de um atalho que ela não escreveu, e mantinha o rótulo
      MUTILADO como busca literal — a pior das opções. Medido ao vivo, em 3 de 7 gestos:

          Home, →→→, digitar "9"  →  caixa "01/908 - 31/08"  →  🔴 "Nenhum turno encontrado"
          Home, →→→, Backspace    →  caixa "0108 - 31/08"    →  🔴 idem
          Home, Delete            →  caixa "1/08 - 31/08"    →  🔴 idem

      Exatamente o sintoma original: escala em branco, sem causa visível, e 11 a 13 caracteres para
      apagar que a pessoa não digitou.

      A regra passa a ser uma só: **o que sobra é o que a pessoa ACRESCENTOU** — os caracteres que não
      estavam no rótulo. Se ela só apagou, sobra vazio, e a escala inteira volta. Nunca sobra pedaço
      de rótulo.
    */
    if (mexeuNoRotulo) {
      if (val.startsWith(rotulo)) val = val.slice(rotulo.length);      // digitou no fim
      else if (rotulo.startsWith(val)) val = '';                        // apagou com backspace no fim
      else val = apenasOAcrescentado(rotulo, val);                      // mexeu no meio
    }

    onChange(val);
    // Mexer no rótulo do atalho é DESFAZER o atalho, mesmo que o resultado seja texto vazio: sem
    // isto, o efeito lá em cima reescreveria o rótulo e a tecla da pessoa não teria efeito nenhum.
    if (val || mexeuNoRotulo) onDateRangeChange(null);
  };

  // Os atalhos rápidos (15 dias / semana / mês) vivem no App, não aqui — este componente
  // ficou só com a busca por texto e por data. A cópia local estava morta desde então.

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      // Parse as local date to avoid timezone issues
      const [year, month, day] = e.target.value.split('-').map(Number);
      const date = new Date(year, month - 1, day);

      onDateRangeChange({ start: date, end: date });
      // Query update handled by useEffect
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400 group-focus-within:text-black transition-colors" />
        </div>

        <input
          id="busca-texto"
          name="busca-texto"
          type="text"
          value={value}
          onChange={handleTextChange}
          placeholder={`Buscar dia ou ${vocabulario.singular} (ex: 25/12, segunda, Flávio)`}
          className={clsx(
            "w-full pl-10 pr-24 h-12 bg-white rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-all shadow-sm",
            value || dateRange ? "border-2 border-amber-400" : "border border-gray-200 focus:ring-2 focus:ring-black/5 focus:border-gray-300"
          )}
        />

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
          {value && (
            <button
              onClick={() => {
                onChange('');
                onDateRangeChange(null);
              }}
              className="flex items-center text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-md transition-colors"
              title="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/*
            🔴 UM CAMPO INVISÍVEL NÃO PODE ESTAR NA ORDEM DE TABULAÇÃO — sexta auditoria externa,
            05/08/2026, achado no trecho que o portão de acessibilidade nunca alcançava.

            Este `<input type="date">` é `opacity-0` e fica POR CIMA do botão, para o clique do mouse
            abrir o calendário nativo. Só que ele também recebia foco: quem navega por teclado
            tabulava para um elemento **invisível**, sem anel nenhum (não há como desenhar contorno
            em opacidade zero), e ficava sem saber onde estava. É a violação da WCAG 2.4.7 que a
            faixa cega do portão escondia — medido: 1 dos 17 focáveis do desktop.

            `tabIndex={-1}` o tira da ordem sem tirar o clique do mouse, e o botão VISÍVEL — que tem
            anel — passa a abrir o calendário pelo teclado. Cada entrada com a sua superfície.
          */}
          <div className="relative flex items-center h-full">
            <input
              id="busca-data"
              name="busca-data"
              ref={campoDeData}
              type="date"
              tabIndex={-1}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              onChange={handleDateChange}
              title="Selecionar data"
              /*
                Campo invisível por cima do botão: ele existe só para abrir o calendário nativo. Está
                fora da ordem de tabulação (`tabIndex={-1}`), mas um leitor de tela ainda chega nele
                em modo de leitura — e `title` sozinho é lido tarde, quando é lido.

                `aria-hidden` seria o gesto óbvio e seria errado: o botão ao lado dá foco a este
                campo, e esconder de AT um elemento que recebe foco é violação de ARIA. Então ele
                ganha nome próprio, igual ao do botão.
              */
              aria-label="Escolher uma data no calendário"
            />
            <button
              type="button"
              title="Escolher uma data no calendário"
              onClick={() => {
                const c = campoDeData.current
                if (!c) return
                // `showPicker` é o caminho certo; onde não existe, focar + clicar faz o mesmo.
                if (typeof c.showPicker === 'function') c.showPicker()
                else { c.focus(); c.click() }
              }}
              className="p-1.5 text-gray-400 hover:text-black bg-white hover:bg-gray-50 rounded-lg transition-colors"
            >
              <CalendarIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
