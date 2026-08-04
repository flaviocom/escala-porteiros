import React, { useMemo } from 'react';
import { Shift, BROTHERS } from '../types/scheduler';
import { clsx } from 'clsx';
import { BarChart3 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StatsViewProps {
  shifts: Shift[];
}

export const StatsView: React.FC<StatsViewProps> = ({ shifts }) => {
  const stats = useMemo(() => {
    const counts: Record<string, { total: number; byMonth: Record<string, number> }> = {};

    BROTHERS.forEach(b => {
      counts[b.id] = { total: 0, byMonth: {} };
    });

    shifts.forEach(shift => {
      const monthKey = shift.date.toISOString().slice(0, 7); // YYYY-MM
      shift.assignedBrothers.forEach(bId => {
        if (counts[bId]) {
          counts[bId].total++;
          const m = counts[bId].byMonth;
          m[monthKey] = (m[monthKey] || 0) + 1;
        }
      });
    });

    return counts;
  }, [shifts]);

  const months = useMemo(() => {
    const m = new Set<string>();
    shifts.forEach(s => m.add(s.date.toISOString().slice(0, 7)));
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
          <p className="text-text-xs text-text-secondary font-medium">
            Total de turnos por irmão e mês
          </p>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
        <table className="min-w-full divide-y divide-border-subtle text-text-sm relative">
          <thead className="bg-surface-subtle sticky top-0 z-20 shadow-sm">
            <tr>
              <th className="px-space-4 py-space-3 text-left font-semibold text-text-secondary uppercase tracking-wider text-text-xs sticky left-0 top-0 bg-surface-subtle z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] border-b border-border-subtle">Irmão</th>
              <th className="px-space-4 py-space-3 text-center font-semibold text-action-primary uppercase tracking-wider text-text-xs bg-surface-subtle border-b border-border-subtle">Total</th>
              {months.map(m => (
                <th key={m} className="px-space-2 py-space-3 text-center font-semibold text-text-secondary uppercase tracking-wider text-[10px] bg-surface-subtle border-b border-border-subtle">
                  {format(parseISO(m), 'MMM', { locale: ptBR }).replace(/^\w/, c => c.toUpperCase())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle bg-surface-card">
            {BROTHERS.map((brother, idx) => {
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
