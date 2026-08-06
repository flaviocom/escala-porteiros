import React, { useMemo, useEffect, useRef } from 'react';
import { format, parseISO, startOfMonth, isSameDay, startOfToday, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Shift, BROTHERS } from '../types/scheduler';
import { filtrarTurnos } from '../dados/filtrar';
import { clsx } from 'clsx';
import { primeiraLetra } from '../utils/nomes';
import { Calendar, Clock, Sun, MoonStar, CloudSun, AlertCircle } from 'lucide-react';

interface ScheduleTableProps {
  shifts: Shift[];
  selectedBrotherIds: string[];
  selectedMonthStrs: string[];
  dateSearchQuery?: string;
  dateRange?: { start: Date | null; end: Date | null } | null;
}

export const ScheduleTable: React.FC<ScheduleTableProps> = ({
  shifts,
  selectedBrotherIds,
  selectedMonthStrs,
  dateSearchQuery,
  dateRange
}) => {
  const today = startOfToday();
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  // O filtro vive em `dados/filtrar.ts` — a tela e a IMAGEM chamam a mesma função. Duas cópias
  // de uma regra é onde as duas divergem em silêncio.
  const filteredShifts = useMemo(
    () => filtrarTurnos(shifts, { selectedBrotherIds, selectedMonthStrs, dateSearchQuery, dateRange }),
    [shifts, selectedBrotherIds, selectedMonthStrs, dateSearchQuery, dateRange]
  );

  /**
   * 🔴 Não há mais corte para exportar. Havia um `isExporting` que fatiava a lista em **5 dias** a
   * partir de hoje — numa escala de cinco meses, a imagem saía com cinco dias. O corte existia
   * porque a imagem era uma fotografia desta tela; agora ela tem layout próprio
   * (`src/export/EscalaImagem.tsx`) e o período inteiro cabe.
   */
  const finalShifts = filteredShifts;

  const months = useMemo(() => {
    const groups: Record<string, Shift[]> = {};
    finalShifts.forEach(shift => {
      const key = startOfMonth(shift.date).toISOString();
      if (!groups[key]) groups[key] = [];
      groups[key].push(shift);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [finalShifts]);

  /*
    🔴 A ROLAGEM PARA O PRÓXIMO CULTO NUNCA ACONTECIA — medido em 06/08/2026, no site NO AR.

    Quem abria o link caía em **MAR 01**, cinco meses no passado, com o próximo turno **32.496 px**
    abaixo. O dono achava que o site levava para a próxima data; eu também. Nenhum dos dois tinha
    medido.

    A causa é a soma de duas correções certas:

      · a quinta auditoria mandou CANCELAR o temporizador na limpeza (senão ele mexia em algo que já
        tinha saído da tela) — certo;
      · a trava `hasScrolled` existe para rolar só uma vez, e não a cada filtro — certo.

    Só que `months` muda **duas vezes** (a segunda quando o dado termina de carregar). Sequência:
    1ª execução marca `hasScrolled = true` e agenda os 300 ms → `months` muda → **a limpeza cancela
    o temporizador** → 2ª execução vê `hasScrolled` já ligado e **se recusa a reagendar**. Resultado:
    a rolagem some, e nada acusa, porque as duas peças estão fazendo exatamente o que prometem.

    O conserto é mover a trava para DEPOIS da rolagem: quem foi cancelado nunca rolou, logo pode
    tentar de novo. A limpeza continua igual, e a promessa "rola uma vez só" também.
  */
  useEffect(() => {
    if (hasScrolled.current || !scrollRef.current || months.length === 0) return;
    const t = setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      hasScrolled.current = true; // só depois de rolar DE VERDADE
    }, 300);
    return () => clearTimeout(t);
  }, [months]);

  let firstUpcomingShiftId: string | null = null;
  const upcomingShift = filteredShifts.find(s => isSameDay(s.date, today) || isAfter(s.date, today));
  if (upcomingShift) {
    firstUpcomingShiftId = upcomingShift.id;
  }

  const getBrotherName = (id: string) => BROTHERS.find(b => b.id === id)?.name || id;

  /*
    🔴 A SEGUNDA LINHA VEM DO DADO, NÃO DO CÓDIGO — quinta auditoria externa, 05/08/2026.

    Aqui estava `if (type === 'TARDE') … ENSAIO`, cravado: **todo** turno de tarde imprimia "ENSAIO",
    viesse o rótulo de onde viesse. `Turno.rotulo` existe no modelo, é gravado por `construirGrade`,
    vive no `blocos.json` e é documentado como "Etiqueta na tela, ex.: ENSAIO" — e era lido em um
    único lugar, a aba Ajustar. O site que os irmãos abrem e a imagem do WhatsApp não o consultavam.

    Agora o rótulo do dado manda, e a segunda linha só aparece quando ele existe. Uma escala sem
    ensaio nenhum não imprime a palavra em lugar nenhum.
  */
  const ShiftBadge = ({ type, rotulo }: { type: string; rotulo?: string }) => {
    if (type === 'SANTA_CEIA') {
      return (
        <span className="px-2 py-1 inline-flex items-center gap-1 text-[10px] font-bold rounded-full bg-red-50 text-red-700 border border-red-200 uppercase tracking-tight">
          <AlertCircle className="h-3 w-3" />
          SANTA CEIA
        </span>
      );
    }

    const config = {
      'MANHÃ': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-100', icon: Sun },
      'TARDE': { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-100', icon: CloudSun },
      'NOITE': { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', icon: MoonStar },
    }[type] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', icon: Clock };

    const Icon = config.icon;

    /*
      🔴 A CORREÇÃO DO RÓTULO DUPLICADO FOI ASSIMÉTRICA — sexta auditoria externa, 05/08/2026.

      Quando a etiqueta do dado passou a atravessar, a imagem do WhatsApp imprimiu "SANTA CEIA /
      SANTA CEIA" e ganhou a comparação `t.rotulo !== TURNO[t.type].rotulo`. **Aqui não.** A Santa
      Ceia escapa por acaso (o `if (type === 'SANTA_CEIA')` retorna antes), mas qualquer outro turno
      cujo `rotulo` do dado coincida com o nome do turno duplicava — e `rotulo` é texto livre no
      `config.json`, editável à mão pelo caminho documentado.

      Medido: `rotulo: "NOITE"` num turno NOITE imprimia **"NOITE / NOITE"** na tabela do site, com a
      imagem mostrando a mesma coisa certa ao lado. Fechar a ponte que doeu e deixar a outra é o
      defeito de fonte dupla com outro nome.
    */
    if (rotulo && rotulo !== type) {
      return (
        <div className={clsx('flex flex-col items-center justify-center rounded-lg border px-3 py-1', config.bg, config.border)}>
          <Icon className={clsx('h-4 w-4 mb-0.5', config.text)} />
          <span className={clsx('text-[10px] font-bold leading-none', config.text)}>{type}</span>
          {/*
            `whitespace-pre-line` porque a imagem do WhatsApp honra a quebra de linha do rótulo e a
            tela não honrava — sexta auditoria externa, 05/08/2026. Duas superfícies desenhando o
            MESMO dado de formas diferentes é a fonte dupla de sempre, só que em pixel.
          */}
          <span className={clsx('text-[10px] font-bold uppercase mt-0.5 leading-none tracking-wider whitespace-pre-line text-center', config.text)}>
            {rotulo}
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
    // 🔴 A mensagem tem de dizer a CAUSA certa. Ela era sempre "ajuste os filtros" — inclusive
    // quando não havia escala nenhuma publicada, e aí a pessoa vai caçar um filtro que nunca
    // aplicou. Como este componente recebe a lista COMPLETA e os filtros, ele sabe qual é o caso:
    // lista vazia = não há escala; lista cheia e nada aparecendo = os filtros excluíram tudo.
    const semEscalaPublicada = shifts.length === 0;
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 border-dashed">
        <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">
          {semEscalaPublicada ? 'Ainda não há escala publicada' : 'Nenhum turno encontrado'}
        </h3>
        <p className="text-gray-500 mt-1">
          {semEscalaPublicada
            ? 'Assim que a escala do período for publicada, ela aparece aqui.'
            : 'Tente ajustar os filtros selecionados.'}
        </p>
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
                'MANHÃ': { bg: 'bg-amber-700', text: 'text-white', sub: 'text-amber-800', border: 'border-amber-200' },
                'TARDE': { bg: 'bg-orange-700', text: 'text-white', sub: 'text-orange-800', border: 'border-orange-200' },
                'NOITE': { bg: 'bg-indigo-600', text: 'text-white', sub: 'text-indigo-800', border: 'border-indigo-200' },
                'SANTA_CEIA': { bg: 'bg-red-700', text: 'text-white', sub: 'text-red-800', border: 'border-red-200' }
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
                        <span className="mb-2 px-2 py-0.5 bg-amber-700 text-white text-[10px] font-black rounded-full uppercase tracking-tighter animate-pulse shadow-sm">
                          HOJE
                        </span>
                      )}
                      <div className={clsx(
                        "w-14 h-14 sm:w-16 sm:h-16 flex flex-col items-center justify-center rounded-2xl transition-all shadow-md",
                        typeConfig.bg, typeConfig.text
                      )}>
                        <span className="text-xs sm:text-sm font-bold leading-none uppercase">
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
                        <ShiftBadge type={shift.type} rotulo={shift.rotulo} />
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
                                {primeiraLetra(getBrotherName(id))}
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
