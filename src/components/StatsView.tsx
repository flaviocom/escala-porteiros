import React, { useMemo } from 'react';
import type { DadosPublicados } from '../dados/carregar';
import { distribuir } from '../dominio/estatisticas';
import { formatarBR, ROTULO_MES } from '../dominio/datas';
import { clsx } from 'clsx';
import { BarChart3 } from 'lucide-react';

interface StatsViewProps {
  dados: DadosPublicados;
  /** Como este cliente chama quem é escalado — vem de `config.identidade.pessoa`. */
  vocabulario: { singular: string; plural: string };
}

/**
 * 🔴 A CONTAGEM NÃO MORA MAIS AQUI — 06/08/2026.
 *
 * Este componente somava turnos por conta própria: um `Record` montado com `forEach`, a chave do mês
 * tirada de um `Date`, e a decisão de quem aparece embutida no `filter` do JSX. Quando o dono pediu a
 * mesma tabela na área administrativa, a saída fácil era escrever a soma de novo lá — **duas réguas
 * medindo a mesma coisa**, que é como gerador e validação divergiam no site anterior sem ninguém
 * notar.
 *
 * A contagem virou `src/dominio/estatisticas.ts`, função pura e testada, e as duas telas consomem
 * ela. Criar a fonte única sem migrar os consumidores não conserta nada: o defeito continuaria vivo
 * do lado que ninguém migrou.
 *
 * Duas decisões que eram DAQUI e passaram a ser do domínio, onde podem ser testadas:
 *
 * - **quem aparece** (todo mundo com turno, mais quem está ativo com zero) — o `if (counts[bId])`
 *   que descartava em silêncio o turno de quem tinha saído do elenco morreu junto;
 * - **o mês de cada turno**, lido da string ISO em vez de um `Date`. `new Date('2026-08-01')` é
 *   meia-noite UTC, que em fuso negativo cai em 31/07: o turno do dia 1º contava no mês anterior.
 *
 * ⚠️ O que este componente continua decidindo, porque é mesmo de tela: o rótulo do mês, as cores, e
 * a frase do cabeçalho.
 */
export const StatsView: React.FC<StatsViewProps> = ({ dados, vocabulario }) => {
  const d = useMemo(() => distribuir(dados.turnos, dados.pessoas), [dados]);

  /*
    O período é DERIVADO dos turnos que chegaram — não passado por fora, não escrito à mão. Assim ele
    não pode discordar da tabela que está logo abaixo: é a mesma lista.
  */
  const periodo = useMemo(() => {
    if (dados.turnos.length === 0) return null;
    const datas = dados.turnos.map((t) => t.data).sort();
    return `${formatarBR(datas[0])} a ${formatarBR(datas[datas.length - 1])}`;
  }, [dados.turnos]);

  return (
    <div className="bg-surface-card rounded-radius-2xl shadow-card border border-border-default overflow-hidden">
      <div className="bg-surface-subtle px-space-6 py-space-4 border-b border-border-subtle flex items-center gap-space-3">
        <div className="bg-surface-card p-space-2 rounded-radius-lg shadow-sm border border-border-subtle">
          <BarChart3 className="h-5 w-5 text-action-primary" />
        </div>
        <div>
          <h3 className="text-text-lg font-bold text-text-primary tracking-tight">
            Estatísticas de Distribuição
          </h3>
          {/*
            🔴 A TELA PRECISA DIZER QUAL PERÍODO ELA ESTÁ CONTANDO — 06/08/2026.

            Esta tabela conta a escala INTEIRA, de propósito: distribuição só significa alguma coisa
            sobre o período todo; uma semana não diz nada sobre equilíbrio de carga. Mas ela ignora os
            filtros da escala **em silêncio**, e o filtro fica visível ao lado, em vermelho.

            Medido: com "02/08 - 09/08" ligado, a tabela mostrava março a dezembro, idêntica. Quem
            olha conclui que os números são da semana — e conclui errado, sem nada que o corrija.

            A régua da casa: *dado que existe aparece mastigado, onde a pessoa já está.* O período é
            um dado que existe; faltava aparecer.
          */}
          <p className="text-text-xs text-text-secondary font-medium">
            Total de turnos por {vocabulario.singular.toLowerCase()} e mês
            {periodo && <> · <strong>{periodo}</strong> — a escala inteira publicada, sem os filtros da tela</>}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
        <table className="min-w-full divide-y divide-border-subtle text-text-sm relative">
          <thead className="bg-surface-subtle sticky top-0 z-20 shadow-sm">
            <tr>
              <th scope="col" className="px-space-4 py-space-3 text-left font-semibold text-text-secondary uppercase tracking-wider text-text-xs sticky left-0 top-0 bg-surface-subtle z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] border-b border-border-subtle">{vocabulario.singular}</th>
              <th scope="col" className="px-space-4 py-space-3 text-center font-semibold text-action-primary uppercase tracking-wider text-text-xs bg-surface-subtle border-b border-border-subtle">Total</th>
              {d.meses.map(m => (
                <th scope="col" key={m} className="px-space-2 py-space-3 text-center font-semibold text-text-secondary uppercase tracking-wider text-[10px] bg-surface-subtle border-b border-border-subtle">
                  {ROTULO_MES[Number(m.slice(5, 7)) - 1]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle bg-surface-card">
            {d.linhas.map((linha, idx) => (
              <tr key={linha.id} className={clsx(
                "hover:bg-surface-subtle transition-colors",
                idx % 2 === 0 ? "bg-[#ffffff]" : "bg-[#f9fafb]"
              )}>
                <td className={clsx(
                  "px-space-4 py-space-3 font-medium text-text-primary sticky left-0 z-10 border-r border-border-subtle shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]",
                  idx % 2 === 0 ? "bg-[#ffffff]" : "bg-[#f9fafb]"
                )}>
                  {linha.nome}
                  {!linha.ativo && (
                    <span
                      title="Saiu do elenco. Os turnos passados dele continuam contando — nada foi apagado."
                      className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 align-middle"
                    >
                      saiu
                    </span>
                  )}
                </td>
                <td className="px-space-4 py-space-3 text-center font-bold text-action-primary bg-surface-subtle/50">
                  {linha.total}
                </td>
                {d.meses.map(m => (
                  <td key={m} className="px-space-2 py-space-3 text-center text-text-secondary">
                    {linha.porMes[m] || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
