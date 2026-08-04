import React, { useMemo, useEffect, useRef } from 'react';
import { format, isSameMonth, parseISO, startOfMonth, isWithinInterval, isSameDay, startOfToday, isAfter, startOfDay, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Shift, BROTHERS } from '../types/scheduler';
import { clsx } from 'clsx';
import { Calendar, Clock, Sun, MoonStar, CloudSun, AlertCircle } from 'lucide-react';

interface ScheduleTableProps {
  shifts: Shift[];
  selectedBrotherIds: string[];
  selectedMonthStrs: string[];
  dateSearchQuery?: string;
  dateRange?: { start: Date | null; end: Date | null } | null;
  isExporting?: boolean;
}

export const ScheduleTable: React.FC<ScheduleTableProps> = ({
  shifts,
  selectedBrotherIds,
  selectedMonthStrs,
  dateSearchQuery,
  dateRange,
  isExporting
}) => {
  const today = startOfToday();
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  const filteredShifts = useMemo(() => {
    // ... logic remains unmodified for filteredShifts
    const normalize = (val: string) =>
      val.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    return shifts.filter(shift => {
      // 1. Date Range Filter
      if (dateRange?.start && dateRange?.end) {
        if (!isWithinInterval(shift.date, { start: dateRange.start, end: dateRange.end })) {
          return false;
        }
      }

      // 2. Text Search Filter (Date or Day)
      if (dateSearchQuery) {
        const query = normalize(dateSearchQuery).trim();
        let isDateRangeText = false;

        if (dateRange?.start && dateRange?.end) {
          const rangeStr = isSameDay(dateRange.start, dateRange.end)
            ? format(dateRange.start, 'dd/MM/yyyy')
            : `${format(dateRange.start, 'dd/MM')} - ${format(dateRange.end, 'dd/MM')}`;

          if (query === normalize(rangeStr)) {
            isDateRangeText = true;
          }
        }

        if (!isDateRangeText) {
          const dateStrFull = format(shift.date, 'dd/MM/yyyy');
          const dateStrShort = format(shift.date, 'dd/MM');
          const dateStrNoZero = format(shift.date, 'd/M');
          const dateStrNoZeroFull = format(shift.date, 'd/M/yyyy');
          const monthName = normalize(format(shift.date, 'MMMM', { locale: ptBR }));
          const dayName = normalize(format(shift.date, 'EEEE', { locale: ptBR }));

          const matchesDate =
            dateStrFull.includes(query) ||
            dateStrShort.includes(query) ||
            dateStrNoZero.includes(query) ||
            dateStrNoZeroFull.includes(query) ||
            monthName.includes(query);

          const matchesBrother = shift.assignedBrothers.some(id => {
            const brother = BROTHERS.find(b => b.id === id);
            return brother && normalize(brother.name).includes(query);
          });

          if (!matchesDate && !dayName.includes(query) && !matchesBrother) {
            return false;
          }
        }
      }

      // 3. Month Filter
      if (selectedMonthStrs.length > 0) {
        const match = selectedMonthStrs.some(m => isSameMonth(parseISO(m), shift.date));
        if (!match) return false;
      }

      // 4. Brother Filter
      if (selectedBrotherIds.length > 0) {
        const hasBrother = shift.assignedBrothers.some(id => selectedBrotherIds.includes(id));
        if (!hasBrother) return false;
      }

      return true;
    });
  }, [shifts, selectedBrotherIds, selectedMonthStrs, dateSearchQuery, dateRange]);

  const finalShifts = useMemo(() => {
    let result = filteredShifts;
    if (isExporting) {
      // Acha o primeiro compromisso a partir de hoje
      const upcomingIndex = result.findIndex(s => isSameDay(s.date, today) || isAfter(s.date, today));
      const startIndex = upcomingIndex >= 0 ? upcomingIndex : 0;
      // Corta na origem para no máximo 5 itens!
      result = result.slice(startIndex, startIndex + 5);
    }
    return result;
  }, [filteredShifts, isExporting, today]);

  const months = useMemo(() => {
    const groups: Record<string, Shift[]> = {};
    finalShifts.forEach(shift => {
      const key = startOfMonth(shift.date).toISOString();
      if (!groups[key]) groups[key] = [];
      groups[key].push(shift);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [finalShifts]);

  useEffect(() => {
    if (!hasScrolled.current && scrollRef.current && months.length > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
      hasScrolled.current = true;
    }
  }, [months]);

  let firstUpcomingShiftId: string | null = null;
  const upcomingShift = filteredShifts.find(s => isSameDay(s.date, today) || isAfter(s.date, today));
  if (upcomingShift) {
    firstUpcomingShiftId = upcomingShift.id;
  }

  const getBrotherName = (id: string) => BROTHERS.find(b => b.id === id)?.name || id;

  const ShiftBadge = ({ type }: { type: string }) => {
    if (type === 'SANTA_CEIA') {
      return (
        <span className="px-2 py-1 inline-flex items-center gap-1 text-[10px] font-bold rounded-full bg-red-50 text-red-600 border border-red-200 uppercase tracking-tight">
          <AlertCircle className="h-3 w-3" />
          SANTA CEIA
        </span>
      );
    }

    const config = {
      'MANHÃ': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', icon: Sun },
      'TARDE': { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', icon: CloudSun },
      'NOITE': { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', icon: MoonStar },
    }[type] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', icon: Clock };

    const Icon = config.icon;

    if (type === 'TARDE') {
      return (
        <div className="flex flex-col items-center justify-center bg-orange-50 border border-orange-100 rounded-lg px-3 py-1">
          <CloudSun className="h-4 w-4 text-orange-500 mb-0.5" />
          <span className="text-[10px] font-bold text-orange-600 leading-none">TARDE</span>
          <span className="text-[9px] font-bold text-orange-700 uppercase mt-0.5 leading-none tracking-wider">
            ENSAIO
          </span>
        </div>
      );
    }

    return (
      <span className={clsx(
        "px-2 py-1 inline-flex items-center gap-1 text-[10px] font-bold rounded-full border uppercase tracking-tight",
        config.bg, config.text, config.border
      )}>
        <Icon className="h-3 w-3" />
        {type}
      </span>
    );
  };

  if (months.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 border-dashed">
        <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Nenhum turno encontrado</h3>
        <p className="text-gray-500 mt-1">Tente ajustar os filtros selecionados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {months.map(([monthStr, monthShifts]) => (
        <div key={monthStr} className="month-container bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-action-primary" />
            <h3 className="text-lg font-bold text-gray-900 capitalize">
              {format(parseISO(monthStr), 'MMMM yyyy', { locale: ptBR })}
            </h3>
          </div>

          <div className="flex flex-col gap-4 p-4 sm:p-6">
            {monthShifts.map((shift) => {
              const isToday = isSameDay(shift.date, today);

              const typeConfig = {
                'MANHÃ': { bg: 'bg-amber-500', text: 'text-white', sub: 'text-amber-700', border: 'border-amber-200' },
                'TARDE': { bg: 'bg-orange-500', text: 'text-white', sub: 'text-orange-700', border: 'border-orange-200' },
                'NOITE': { bg: 'bg-indigo-600', text: 'text-white', sub: 'text-indigo-800', border: 'border-indigo-200' },
                'SANTA_CEIA': { bg: 'bg-red-600', text: 'text-white', sub: 'text-red-800', border: 'border-red-200' }
              }[shift.type] || { bg: 'bg-blue-600', text: 'text-white', sub: 'text-blue-800', border: 'border-blue-200' };

              return (
                <div
                  key={shift.id}
                  ref={shift.id === firstUpcomingShiftId ? scrollRef : null}
                  id={shift.id}
                  className={clsx(
                    "group relative transition-all duration-300 scroll-mt-24 export-item border-2 rounded-3xl overflow-hidden shadow-sm hover:shadow-md",
                    isToday ? "bg-amber-50/40 border-amber-500 ring-4 ring-amber-500/20 z-10" : "bg-white border-gray-200"
                  )}
                >
                  <div className="flex p-4 sm:p-5 gap-4 sm:gap-6 items-center">
                    <div className="flex flex-col items-center justify-start min-w-[85px] sm:min-w-[100px]">
                      {isToday && (
                        <span className="mb-2 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded-full uppercase tracking-tighter animate-pulse shadow-sm">
                          HOJE
                        </span>
                      )}
                      <div className={clsx(
                        "w-14 h-14 sm:w-16 sm:h-16 flex flex-col items-center justify-center rounded-2xl transition-all shadow-md",
                        typeConfig.bg, typeConfig.text
                      )}>
                        <span className="text-xs sm:text-sm font-bold leading-none uppercase opacity-90">
                          {format(shift.date, 'MMM', { locale: ptBR }).replace('.', '')}
                        </span>
                        <span className="text-2xl sm:text-3xl font-black leading-none mt-1">
                          {format(shift.date, 'dd')}
                        </span>
                      </div>
                      <span className={clsx(
                        "text-[11px] sm:text-xs font-black mt-2 uppercase tracking-widest",
                        isToday ? "text-amber-700" : typeConfig.sub
                      )}>
                        {format(shift.date, 'EEEE', { locale: ptBR })}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-4">
                        <ShiftBadge type={shift.type} />
                        {shift.type === 'SANTA_CEIA' && (
                          <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                        )}
                      </div>

                      <div className="flex flex-col gap-2.5">
                        {shift.assignedBrothers.map((id) => {
                          const isSelected = selectedBrotherIds.includes(id);
                          return (
                            <div
                              key={`${shift.id}-${id}`}
                              className={clsx(
                                "flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all duration-300",
                                isSelected
                                  ? `${typeConfig.bg} text-white shadow-md scale-[1.03] ring-4 ring-offset-2 ring-transparent`
                                  : "bg-white text-gray-800 border-gray-100 hover:border-blue-200 shadow-sm"
                              )}
                              style={isSelected ? { borderColor: 'rgba(255,255,255,0.3)' } : {}}
                            >
                              <div className={clsx(
                                "w-10 h-10 rounded-full flex items-center justify-center text-lg font-black shrink-0 transition-colors",
                                isSelected ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600"
                              )}>
                                {getBrotherName(id).charAt(0)}
                              </div>
                              <span className={clsx(
                                "text-base sm:text-lg font-bold tracking-tight",
                                isSelected ? "text-white" : "text-gray-900"
                              )}>
                                {getBrotherName(id)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
