import React, { useMemo } from 'react';
import { Shift, BROTHERS } from '../types/scheduler';
import { mesDeData } from '../dominio/datas';
import { clsx } from 'clsx';
import { BarChart3 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StatsViewProps {
  shifts: Shift[];
  /** Como este cliente chama quem é escalado — vem de `config.identidade.pessoa`. */
  vocabulario: { singular: string; plural: string };
}

export const StatsView: React.FC<StatsViewProps> = ({ shifts, vocabulario }) => {
  /*
    O período é DERIVADO dos turnos que chegaram — não passado por fora, não escrito à mão. Assim ele
    não pode discordar da tabela que está logo abaixo: é a mesma lista.
  */
  const periodo = useMemo(() => {
    if (shifts.length === 0) return null
    const datas = shifts.map((s) => s.date.getTime())
    const br = (t: number) => new Date(t).toLocaleDateString('pt-BR')
    return `${br(Math.min(...datas))} a ${br(Math.max(...datas))}`
  }, [shifts]);

  const stats = useMemo(() => {
    const counts: Record<string, { total: number; byMonth: Record<string, number> }> = {};

    BROTHERS.forEach(b => {
      counts[b.id] = { total: 0, byMonth: {} };
    });

    shifts.forEach(shift => {
      const monthKey = mesDeData(shift.date); // mes LOCAL, nunca UTC
      shift.assignedBrothers.forEach(bId => {
        // 🔴 Sem `if (counts[bId])`. O guard descartava EM SILÊNCIO todo turno de quem não estivesse
        // na lista — e quem saía do elenco caía exatamente aí: os cultos passados dele sumiam do
        // total, sem uma linha de aviso. Contar sempre é o certo; se aparecer um id desconhecido,
        // ele vira uma linha visível em vez de um número menor que ninguém confere.
        if (!counts[bId]) counts[bId] = { total: 0, byMonth: {} };
        counts[bId].total++;
        const m = counts[bId].byMonth;
        m[monthKey] = (m[monthKey] || 0) + 1;
      });
    });

    return counts;
  }, [shifts]);

  const months = useMemo(() => {
    const m = new Set<string>();
    shifts.forEach(s => m.add(mesDeData(s.date)));
    return Array.from(m).sort();
  }, [shifts]);

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

            Esta tabela recebe `shifts` INTEIRO, de propósito: distribuição só significa alguma coisa
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
              <th className="px-space-4 py-space-3 text-left font-semibold text-text-secondary uppercase tracking-wider text-text-xs sticky left-0 top-0 bg-surface-subtle z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] border-b border-border-subtle">{vocabulario.singular}</th>
              <th className="px-space-4 py-space-3 text-center font-semibold text-action-primary uppercase tracking-wider text-text-xs bg-surface-subtle border-b border-border-subtle">Total</th>
              {months.map(m => (
                <th key={m} className="px-space-2 py-space-3 text-center font-semibold text-text-secondary uppercase tracking-wider text-[10px] bg-surface-subtle border-b border-border-subtle">
                  {format(parseISO(m), 'MMM', { locale: ptBR }).replace(/^\w/, c => c.toUpperCase())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle bg-surface-card">
            {BROTHERS
              // Quem está no elenco aparece sempre; quem saiu, só se tiver turno no período em
              // vista — presente onde o passado dele existe, sem poluir onde não existe.
              .filter(b => b.ativo || (stats[b.id]?.total ?? 0) > 0)
              .sort((a, b) => Number(b.ativo) - Number(a.ativo))
              .map((brother, idx) => {
              const s = stats[brother.id] || { total: 0, byMonth: {} };
              return (
                <tr key={brother.id} className={clsx(
                  "hover:bg-surface-subtle transition-colors",
                  idx % 2 === 0 ? "bg-[#ffffff]" : "bg-[#f9fafb]"
                )}>
                  <td className={clsx(
                    "px-space-4 py-space-3 font-medium text-text-primary sticky left-0 z-10 border-r border-border-subtle shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]",
                    idx % 2 === 0 ? "bg-[#ffffff]" : "bg-[#f9fafb]"
                  )}>
                    {brother.name}
                    {!brother.ativo && (
                      <span
                        title="Saiu do elenco. Os turnos passados dele continuam contando — nada foi apagado."
                        className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 align-middle"
                      >
                        saiu
                      </span>
                    )}
                  </td>
                  <td className="px-space-4 py-space-3 text-center font-bold text-action-primary bg-surface-subtle/50">
                    {s.total}
                  </td>
                  {months.map(m => (
                    <td key={m} className="px-space-2 py-space-3 text-center text-text-secondary">
                      {s.byMonth[m] || '-'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
