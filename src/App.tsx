import React, { useState, useEffect, useMemo } from 'react';
import { generateSchedule } from './utils/scheduler';
import { exportToImage } from './utils/export';
import { Shift, BROTHERS } from './types/scheduler';
import { ScheduleTable } from './components/ScheduleTable';
import { StatsView } from './components/StatsView';
import { ValidationView } from './components/ValidationView';
import { MultiSelect } from './components/MultiSelect';
import { DateSearch } from './components/DateSearch';
import { Calendar, Download, Filter, X, LayoutGrid, BarChart3, ShieldCheck, Menu, SlidersHorizontal, ChevronDown, MessageCircle, User, ChevronRight, Search, Loader2 } from 'lucide-react';
import { format, parseISO, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx } from 'clsx';
import logo from './assets/logo-ccb-light.png';

function App() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedBrotherIds, setSelectedBrotherIds] = useState<string[]>([]);
  const [selectedMonthStrs, setSelectedMonthStrs] = useState<string[]>([]);
  const [dateSearchQuery, setDateSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null } | null>(null);
  const [view, setView] = useState<'schedule' | 'stats' | 'validation'>('schedule');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // 🆕 E: Minha Escala — salva o nome do irmão no localStorage
  const [myBrotherId, setMyBrotherId] = useState<string | null>(() => {
    return localStorage.getItem('myBrotherId');
  });
  const [showMyShiftsOnly, setShowMyShiftsOnly] = useState<boolean>(() => {
    return localStorage.getItem('showMyShiftsOnly') === 'true';
  });
  const [showBrotherPicker, setShowBrotherPicker] = useState(false);
  const [brotherSearch, setBrotherSearch] = useState('');

  // Persistir estado do filtro
  useEffect(() => {
    localStorage.setItem('showMyShiftsOnly', showMyShiftsOnly.toString());
  }, [showMyShiftsOnly]);

  useEffect(() => {
    const newShifts = generateSchedule();
    setShifts(newShifts);
  }, []);

  // 🆕 Quando "Minha Escala" está ativo, filtra pelo meu irmão
  useEffect(() => {
    if (showMyShiftsOnly && myBrotherId) {
      setSelectedBrotherIds([myBrotherId]);
    } else if (!showMyShiftsOnly) {
      setSelectedBrotherIds([]);
    }
  }, [showMyShiftsOnly, myBrotherId]);

  const months = useMemo(() => {
    return Array.from(new Set(shifts.map(s => s.date.toISOString().slice(0, 7)))).sort();
  }, [shifts]);

  const brotherOptions = useMemo(() => BROTHERS.map(b => ({ value: b.id, label: b.name })), []);
  const monthOptions = useMemo(() => months.map(m => ({
    value: parseISO(m).toISOString(),
    label: format(parseISO(m), 'MMMM yyyy', { locale: ptBR }).replace(/^\w/, c => c.toUpperCase())
  })), [months]);

  const activeFiltersCount = selectedBrotherIds.length + selectedMonthStrs.length + (dateSearchQuery ? 1 : 0) + (dateRange ? 1 : 0);

  const clearFilters = () => {
    setSelectedBrotherIds([]);
    setSelectedMonthStrs([]);
    setDateSearchQuery('');
    setDateRange(null);
    setShowMyShiftsOnly(false);
  };

  const handleExport = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      await exportToImage('schedule-container');
    } finally {
      setIsGenerating(false);
      setIsMobileMenuOpen(false);
    }
  };

  // 🆕 Selecionar meu irmão
  const handleSelectMyBrother = (id: string) => {
    setMyBrotherId(id);
    localStorage.setItem('myBrotherId', id);
    setShowMyShiftsOnly(true);
    setShowBrotherPicker(false);
    setBrotherSearch('');
  };

  const myBrother = BROTHERS.find(b => b.id === myBrotherId);

  // 🆕 Filtros rápidos de data
  const handleQuickFilter = (type: '15days' | 'week' | 'month') => {
    const today = new Date();
    let start: Date, end: Date;
    if (type === '15days') { start = startOfDay(today); end = endOfDay(addDays(today, 14)); }
    else if (type === 'week') { start = startOfWeek(today, { locale: ptBR }); end = endOfWeek(today, { locale: ptBR }); }
    else { start = startOfMonth(today); end = endOfMonth(today); }
    setDateRange({ start, end });
    setDateSearchQuery('');
    setIsMobileMenuOpen(false);
  };

  const filteredBrothers = useMemo(() =>
    BROTHERS.filter(b => b.name.toLowerCase().includes(brotherSearch.toLowerCase())),
    [brotherSearch]
  );

  const sidebarContent = (
    <div className="flex flex-col h-full px-5 py-2 overflow-y-auto">
      {/* Desktop Logo */}
      <div className="hidden md:flex items-center gap-3 mb-8">
        <img src={logo} alt="Logo CCB" className="h-10 w-auto object-contain" />
        <div>
          <h1 className="text-base font-bold text-text-primary tracking-tight leading-none uppercase">
            Escala Porteiros
          </h1>
          <p className="text-[10px] text-text-secondary mt-1 font-medium tracking-wider">JD. SÃO LUIZ - 2026</p>
        </div>
      </div>

      {/* Título Mobile */}
      <div className="md:hidden mb-5 text-center">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">Filtros e Opções</h2>
      </div>

      {/* 🆕 E: MINHA ESCALA (destaque especial) */}
      <div className="mb-5">
        {myBrother ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowMyShiftsOnly(!showMyShiftsOnly)}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-base font-bold transition-all duration-200 shadow-sm border-2",
                showMyShiftsOnly
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-indigo-200 shadow-md"
                  : "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50"
              )}
            >
              <div className={clsx(
                "w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold shrink-0",
                showMyShiftsOnly ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-700"
              )}>
                {myBrother.name.charAt(0)}
              </div>
              <div className="flex-1 text-left">
                <div className="text-xs opacity-70 leading-none mb-0.5">{showMyShiftsOnly ? "Mostrando minha escala" : "Minha Escala"}</div>
                <div className="font-bold leading-tight">{myBrother.name}</div>
              </div>
              <ChevronRight className={clsx("h-5 w-5 transition-transform", showMyShiftsOnly ? "rotate-90" : "")} />
            </button>
            <button
              onClick={() => setShowBrotherPicker(true)}
              className="text-xs text-gray-400 hover:text-gray-600 text-right pr-1 underline"
            >
              Trocar nome
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowBrotherPicker(true)}
            className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-base font-bold bg-indigo-50 text-indigo-700 border-2 border-indigo-200 hover:bg-indigo-100 transition-all duration-200"
          >
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-xs text-indigo-400 leading-none mb-0.5">Toque para configurar</div>
              <div>Minha Escala</div>
            </div>
            <ChevronRight className="h-5 w-5 text-indigo-400" />
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col space-y-5">

        {/* 1. ESCALA */}
        <div>
          <button
            onClick={() => { setView('schedule'); setIsMobileMenuOpen(false); }}
            className={clsx(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
              view === 'schedule'
                ? "bg-action-primary text-text-on-brand shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <LayoutGrid className="h-5 w-5" />
            Escala
          </button>
        </div>

        {/* 🆕 C: Filtros rápidos VISÍVEIS (sem precisar abrir menu) */}
        <div className="px-1">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2 px-1">
            <Filter className="h-3.5 w-3.5 text-action-primary" />
            Acesso Rápido
          </h2>
          <div className="flex flex-col gap-2">
            {[
              { label: '📅 Próximos 15 dias', type: '15days' as const },
              { label: '📆 Esta Semana', type: 'week' as const },
              { label: '🗓️ Este Mês', type: 'month' as const },
            ].map(({ label, type }) => (
              <button
                key={type}
                onClick={() => handleQuickFilter(type)}
                className="w-full text-left px-4 py-3 rounded-xl text-base font-semibold text-gray-700 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 hover:border-blue-200 transition-all duration-200"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. FILTROS AVANÇADOS */}
        <div className="px-1">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-action-primary" />
              Filtros
            </h2>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-[11px] font-bold text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded-md transition-colors"
              >
                LIMPAR
              </button>
            )}
          </div>

          <div className="space-y-4 pl-3 border-l-2 border-gray-100 ml-2">
            <DateSearch
              value={dateSearchQuery}
              onChange={setDateSearchQuery}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />

            <MultiSelect
              options={brotherOptions}
              selected={selectedBrotherIds}
              onChange={setSelectedBrotherIds}
              placeholder="Irmão"
              icon={LayoutGrid}
            />

            <MultiSelect
              options={monthOptions}
              selected={selectedMonthStrs}
              onChange={setSelectedMonthStrs}
              placeholder="Mês"
              icon={Calendar}
            />
          </div>
        </div>

        {/* 3. ESTATÍSTICAS */}
        <div>
          <button
            onClick={() => { setView('stats'); setIsMobileMenuOpen(false); }}
            className={clsx(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
              view === 'stats'
                ? "bg-action-primary text-text-on-brand shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <BarChart3 className="h-5 w-5" />
            Estatísticas
          </button>
        </div>

        {/* 4. VALIDAÇÃO */}
        <div>
          <button
            onClick={() => { setView('validation'); setIsMobileMenuOpen(false); }}
            className={clsx(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
              view === 'validation'
                ? "bg-action-primary text-text-on-brand shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <ShieldCheck className="h-5 w-5" />
            Validação
          </button>
        </div>

      </div>

      {/* Ações (Exportar) */}
      <div className="pt-6 mt-6 border-t border-gray-100">
        <button
          onClick={handleExport}
          disabled={isGenerating}
          className={clsx(
            "w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl text-base font-bold text-white transition-all duration-200 shadow-md",
            isGenerating ? "bg-gray-400 cursor-not-allowed" : "bg-[#25D366] hover:bg-[#128C7E] shadow-green-200"
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Gerando Imagem...</span>
            </>
          ) : (
            <>
              <MessageCircle className="h-6 w-6 fill-current" />
              <span>Enviar Escala p/ WhatsApp</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-text-primary selection:bg-action-primary selection:text-text-on-brand flex">

      {/* 🆕 E: Modal seleção de irmão */}
      {showBrotherPicker && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl flex flex-col max-h-[85vh]">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 text-center">Qual é o seu nome?</h2>
              <p className="text-sm text-gray-500 text-center mt-1">Selecione para ver sua escala rapidamente</p>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={brotherSearch}
                  onChange={e => setBrotherSearch(e.target.value)}
                  placeholder="Digitar nome..."
                  className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  autoFocus
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 px-4 py-2">
              {filteredBrothers.map(b => (
                <button
                  key={b.id}
                  onClick={() => handleSelectMyBrother(b.id)}
                  className={clsx(
                    "w-full flex items-center gap-3 px-4 py-4 rounded-2xl mb-2 text-left transition-all",
                    myBrotherId === b.id
                      ? "bg-indigo-600 text-white font-bold"
                      : "hover:bg-indigo-50 text-gray-800 border border-gray-100"
                  )}
                >
                  <div className={clsx(
                    "w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0",
                    myBrotherId === b.id ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-700"
                  )}>
                    {b.name.charAt(0)}
                  </div>
                  <span className="text-base font-semibold">{b.name}</span>
                </button>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => { setShowBrotherPicker(false); setBrotherSearch(''); }}
                className="w-full py-3 text-gray-500 text-sm font-semibold hover:bg-gray-50 rounded-xl transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-[320px] fixed inset-y-0 left-0 border-r border-gray-200 z-40 bg-white shadow-sm">
        {sidebarContent}
      </aside>

      {/* Bottom Sheet Mobile */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-full flex flex-col pt-12">
            {/* Botão X em destaque e vermelho posicionado corretamente */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 z-50 bg-red-500 text-white p-2 rounded-full shadow-lg border-2 border-white transition-transform active:scale-90 flex items-center justify-center"
              title="Fechar filtros"
            >
              <X className="w-6 h-6 stroke-[3.5px]" />
            </button>

            <div className="relative w-full bg-white shadow-2xl rounded-t-[32px] flex flex-col animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-hidden">
              <div className="w-full h-8 flex items-center justify-center shrink-0">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
              </div>

              <div className="flex-1 overflow-y-auto pb-10">
                {sidebarContent}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col min-w-0 md:pl-[320px]">

        {/* Header Mobile melhorado */}
        <header className="md:hidden bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
          <div className="px-3 h-16 flex items-center justify-between gap-1">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <img src={logo} alt="Logo CCB" className="h-8 w-auto object-contain shrink-0" />
              <div className="flex flex-col min-w-0">
                <h1 className="text-xs font-bold text-text-primary tracking-tight leading-none uppercase truncate">
                  Escala Porteiros
                </h1>
                <p className="text-[9px] text-text-secondary mt-0.5 font-medium tracking-wider truncate uppercase">JD. SÃO LUIZ-2026</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Botão "Minha Escala" no header mobile */}
              <button
                onClick={() => myBrotherId ? setShowMyShiftsOnly(!showMyShiftsOnly) : setShowBrotherPicker(true)}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all",
                  showMyShiftsOnly && myBrotherId
                    ? "bg-indigo-600 text-white"
                    : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                )}
                title="Minha Escala"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{myBrother ? myBrother.name.split(' ')[0] : 'Minha Escala'}</span>
              </button>

              {/* Filtros */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="flex items-center gap-1 text-action-primary text-xs font-bold whitespace-nowrap hover:bg-blue-50 px-2.5 py-2 rounded-xl transition-colors border border-blue-200"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
              </button>
            </div>
          </div>

          {/* 🆕 C: Barra de filtros rápidos REATIVADA no mobile */}
          <div className="px-3 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
            {[
              { label: '15 dias', type: '15days' as const },
              { label: 'Esta Semana', type: 'week' as const },
              { label: 'Este Mês', type: 'month' as const },
            ].map(({ label, type }) => (
              <button
                key={type}
                onClick={() => handleQuickFilter(type)}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700 transition-all whitespace-nowrap"
              >
                {label}
              </button>
            ))}
            {(activeFiltersCount > 0 || showMyShiftsOnly) && (
              <button
                onClick={clearFilters}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-600 hover:bg-red-200 transition-all whitespace-nowrap"
              >
                ✕ Limpar
              </button>
            )}
          </div>
        </header>

        {/* 🆕 B: Botão WhatsApp maior e mais claro no mobile */}
        <button
          onClick={handleExport}
          disabled={isGenerating}
          className={clsx(
            "md:hidden hide-on-export fixed bottom-6 right-4 z-40 text-white rounded-2xl px-4 py-3.5 shadow-lg transition-all active:scale-95 flex items-center gap-2",
            isGenerating ? "bg-gray-400 cursor-not-allowed" : "bg-[#25D366] hover:bg-[#128C7E] shadow-[#25D366]/40"
          )}
          title="Enviar Escala p/ WhatsApp"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm font-bold">Gerando...</span>
            </>
          ) : (
            <>
              <MessageCircle className="h-6 w-6 fill-current" />
              <span className="text-sm font-bold">Enviar</span>
            </>
          )}
        </button>

        {/* View renderizada */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1 max-w-5xl mx-auto w-full bg-gray-50 pb-24" id="schedule-container">
          {/* Contador de filtros oculto para o sistema de exportação saber se deve limitar a foto */}
          <span id="active-filters-count" className="hidden active-filters-count">{activeFiltersCount}</span>

          {/* Cabeçalho de Exportação */}
          <div id="export-header" className="hidden items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <img src={logo} alt="Logo CCB" className="h-10 w-auto object-contain" />
            <div>
              <h1 className="text-xl font-bold text-text-primary tracking-tight leading-none uppercase">
                Escala Porteiros
              </h1>
              <p className="text-xs text-text-secondary mt-1 font-medium tracking-wider">JD. SÃO LUIZ - 2026</p>
            </div>
          </div>

          {view === 'schedule' && (
            <div className="bg-gray-50 pb-8">
              <ScheduleTable
                shifts={shifts}
                selectedBrotherIds={selectedBrotherIds}
                selectedMonthStrs={selectedMonthStrs}
                dateSearchQuery={dateSearchQuery}
                dateRange={dateRange}
                isExporting={isGenerating}
              />
            </div>
          )}

          {view === 'stats' && (
            <StatsView shifts={shifts} />
          )}

          {view === 'validation' && (
            <ValidationView shifts={shifts} />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
