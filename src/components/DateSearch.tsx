import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, Search, X } from 'lucide-react';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx } from 'clsx';

interface DateSearchProps {
  value: string;
  onChange: (query: string) => void;
  onDateRangeChange: (range: { start: Date | null; end: Date | null } | null) => void;
  dateRange: { start: Date | null; end: Date | null } | null;
}

export const DateSearch: React.FC<DateSearchProps> = ({ value, onChange, onDateRangeChange, dateRange }) => {
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

  const [activeFilter, setActiveFilter] = useState<'15days' | 'week' | 'month' | null>(null);

  // Clear active filter when dateRange is null
  useEffect(() => {
    if (!dateRange) {
      setActiveFilter(null);
    }
  }, [dateRange]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    if (val) {
      onDateRangeChange(null);
      setActiveFilter(null);
    }
  };

  const handleQuickAction = (type: '15days' | 'week' | 'month') => {
    const today = new Date();
    let start: Date, end: Date;

    switch (type) {
      case '15days':
        start = today;
        end = addDays(today, 14);
        break;
      case 'week':
        start = startOfWeek(today, { locale: ptBR });
        end = endOfWeek(today, { locale: ptBR });
        break;
      case 'month':
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
    }

    setActiveFilter(type);
    onDateRangeChange({ start, end });
    // Query update handled by useEffect
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      // Parse as local date to avoid timezone issues
      const [year, month, day] = e.target.value.split('-').map(Number);
      const date = new Date(year, month - 1, day);

      setActiveFilter(null);
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
          type="text"
          value={value}
          onChange={handleTextChange}
          placeholder="Buscar dia ou Irmão (ex: 25/12, segunda, Flávio)"
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
                setActiveFilter(null);
              }}
              className="flex items-center text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-md transition-colors"
              title="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <div className="relative flex items-center h-full">
            <input
              type="date"
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              onChange={handleDateChange}
              title="Selecionar data"
            />
            <button className="p-1.5 text-gray-400 hover:text-black bg-white hover:bg-gray-50 rounded-lg transition-colors">
              <CalendarIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
