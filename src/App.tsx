import { useState, useEffect, useMemo } from 'react';
import { exportToImage } from './utils/export';
import { filtrarTurnos } from './dados/filtrar';
import { SeletorDeMeses, type MesDisponivel } from './components/SeletorDeMeses';
import { Shift, BROTHERS } from './types/scheduler';
import type { DadosPublicados } from './dados/carregar';
import { mesDeData } from './dominio/datas';
import { ScheduleTable } from './components/ScheduleTable';
import { StatsView } from './components/StatsView';
import { ValidationView } from './components/ValidationView';
import { MultiSelect } from './components/MultiSelect';
import { DateSearch } from './components/DateSearch';
import { Calendar, Filter, X, LayoutGrid, BarChart3, ShieldCheck, SlidersHorizontal, MessageCircle, User, ChevronRight, Search, Loader2, Settings } from 'lucide-react';
import { format, parseISO, addDays, startOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clsx } from 'clsx';
import { primeiraLetra } from './utils/nomes';

interface AppProps {
  /** A escala já publicada, vinda dos arquivos de dados — não mais gerada no navegador. */
  shifts: Shift[];
  dados: DadosPublicados;
}

/**
 * 🔴 AS DUAS PORTAS DO `localStorage`, E AS DUAS PODEM LANÇAR.
 *
 * Com cookies bloqueados, **ler** `localStorage` já lança `SecurityError`; com a cota cheia ou em
 * modo privado de alguns navegadores, **escrever** lança `QuotaExceededError`. Nos dois casos o que
 * está em jogo é uma preferência de conforto — qual é o seu nome, e se o filtro "Minha Escala" fica
 * ligado. Nenhuma delas vale uma tela em branco para quem só quer ver se está escalado no domingo.
 *
 * Falhar em silêncio aqui é a decisão certa, e é diferente de falhar em silêncio num dado: a pessoa
 * percebe na hora que a preferência não ficou guardada, e pode escolher de novo.
 */
function lerPreferencia(chave: string): string | null {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function gravarPreferencia(chave: string, valor: string): void {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    /* preferência não guardada — a tela continua funcionando exatamente igual */
  }
}

function apagarPreferencia(chave: string): void {
  try {
    localStorage.removeItem(chave);
  } catch {
    /* idem */
  }
}

function App({ shifts, dados }: AppProps) {
  // Como este cliente chama quem é escalado. Um apelido curto porque aparece em oito lugares da
  // tela — e porque `dados.config.identidade.pessoa.singular` no meio de um `title` não se lê.
  const voc = {
    ...dados.config.identidade.pessoa,
    /*
      O emblema é servido de `dados/`, como os JSON — não empacotado pelo build.

      `BASE_URL` é obrigatório: o GitHub Pages serve este projeto sob `/escala-porteiros/`, e um
      caminho sem ele apontaria para a raiz do domínio. Vazio = sem emblema, e a tela se arranja.
    */
    logo: dados.config.identidade.logo ? `${import.meta.env.BASE_URL}dados/${dados.config.identidade.logo}` : '',
  };
  const [selectedBrotherIds, setSelectedBrotherIds] = useState<string[]>([]);
  const [selectedMonthStrs, setSelectedMonthStrs] = useState<string[]>([]);
  const [dateSearchQuery, setDateSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null } | null>(null);
  const [view, setView] = useState<'schedule' | 'stats' | 'validation'>('schedule');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [escolhendoMeses, setEscolhendoMeses] = useState(false);

  /*
    🔴 `localStorage` PODE LANÇAR — quinta auditoria externa, 05/08/2026.

    Estas duas leituras estavam nuas dentro do inicializador de `useState` do componente raiz. Com
    cookies bloqueados (Safari em navegação privada, política de empresa, extensão de privacidade), o
    **mero acesso** a `localStorage` lança `SecurityError` — e, sem `ErrorBoundary` no projeto, a
    página fica em branco. É exatamente o desfecho que o `main.tsx` declara como o pior possível:
    *"tela branca sem explicação"*. O `.catch(mostrarErro)` de lá só cobre a promessa de carregamento.

    Não há nada a decidir aqui: preferência guardada é conforto, e conforto não derruba escala.
  */
  const [myBrotherId, setMyBrotherId] = useState<string | null>(() => lerPreferencia('myBrotherId'));
  const [showMyShiftsOnly, setShowMyShiftsOnly] = useState<boolean>(
    () => lerPreferencia('showMyShiftsOnly') === 'true',
  );
  const [showBrotherPicker, setShowBrotherPicker] = useState(false);
  const [brotherSearch, setBrotherSearch] = useState('');

  // Persistir estado do filtro
  useEffect(() => {
    gravarPreferencia('showMyShiftsOnly', showMyShiftsOnly.toString());
  }, [showMyShiftsOnly]);

  /*
    🔴 O ID GUARDADO PODE NÃO EXISTIR MAIS — quinta auditoria externa, 05/08/2026.

    `myBrotherId` nunca era conferido contra o elenco. Se a pessoa sai do `pessoas.json` — o que
    "Voltar a esta versão" no Histórico provoca —, `myBrother` fica `undefined` e a barra volta a
    dizer "Toque para configurar"; mas o efeito abaixo continuava filtrando por um id que não existe,
    e a tela mostrava **"Nenhum turno encontrado · Tente ajustar os filtros"**.

    Quem lê isso conclui que não está escalado. É a pior mentira que esta tela pode contar, e ela sai
    exatamente para quem já configurou o nome — ou seja, para quem mais confia nela.
  */
  useEffect(() => {
    if (myBrotherId && !BROTHERS.some((b) => b.id === myBrotherId)) {
      setMyBrotherId(null);
      setShowMyShiftsOnly(false);
      apagarPreferencia('myBrotherId');
    }
  }, [myBrotherId]);

  // 🆕 Quando "Minha Escala" está ativo, filtra pelo meu irmão
  useEffect(() => {
    if (showMyShiftsOnly && myBrotherId) {
      setSelectedBrotherIds([myBrotherId]);
    } else if (!showMyShiftsOnly) {
      setSelectedBrotherIds([]);
    }
  }, [showMyShiftsOnly, myBrotherId]);

  const months = useMemo(() => {
    return Array.from(new Set(shifts.map(s => mesDeData(s.date)))).sort();
  }, [shifts]);

  // Quem saiu do elenco CONTINUA aqui — o passado dele está na escala e precisa ser filtrável.
  // Vem marcado e no fim da lista: presente para consulta, sem competir com quem escala hoje.
  const brotherOptions = useMemo(
    () => [...BROTHERS]
      .sort((a, b) => Number(b.ativo) - Number(a.ativo))
      .map(b => ({ value: b.id, label: b.ativo ? b.name : `${b.name} (saiu da escala)` })),
    []
  );
  const monthOptions = useMemo(() => months.map(m => ({
    value: parseISO(m).toISOString(),
    label: format(parseISO(m), 'MMMM yyyy', { locale: ptBR }).replace(/^\w/, c => c.toUpperCase())
  })), [months]);

  const activeFiltersCount = selectedBrotherIds.length + selectedMonthStrs.length + (dateSearchQuery ? 1 : 0) + (dateRange ? 1 : 0);

  /*
    🔴 "LIMPAR FILTROS" NÃO APAGAVA O NOME — quinta auditoria externa, 05/08/2026.

    Ele desligava `showMyShiftsOnly` e deixava `myBrotherId` gravado. Num aparelho compartilhado — e
    numa congregação isso é o caso comum, o celular que fica na secretaria — o próximo visitante
    abria o site já com o nome de outra pessoa configurado, sem ter escolhido nada.

    Limpar é limpar: quem clica aqui está dizendo "quero ver a escala inteira, do zero".
  */
  const clearFilters = () => {
    setSelectedBrotherIds([]);
    setSelectedMonthStrs([]);
    setDateSearchQuery('');
    setDateRange(null);
    setShowMyShiftsOnly(false);
    setMyBrotherId(null);
    apagarPreferencia('myBrotherId');
  };

  /** O que está aparecendo — mesma função de filtro que a tabela usa. */
  const turnosVisiveis = useMemo(
    () => filtrarTurnos(shifts, { selectedBrotherIds, selectedMonthStrs, dateSearchQuery, dateRange }),
    [shifts, selectedBrotherIds, selectedMonthStrs, dateSearchQuery, dateRange]
  );

  /** Meses presentes no que está em vista, com quantos turnos cada um tem. */
  const mesesEmVista = useMemo<MesDisponivel[]>(() => {
    // 🔴 A MESMA RÉGUA DA IMAGEM. Antes isto contava TODO turno visível e o seletor dizia 19
    // enquanto a imagem gerada por ele dizia 18. Santa Ceia não é turno: é um dia sem porteiros,
    // e vai ao lado, nunca somada. Ver `EscalaImagem.tsx` → `resumo`.
    const mapa = new Map<string, { turnos: number; ceias: number }>();
    for (const s of turnosVisiveis) {
      const k = mesDeData(s.date);
      const atual = mapa.get(k) ?? { turnos: 0, ceias: 0 };
      if (s.type === 'SANTA_CEIA') atual.ceias += 1;
      else if (s.assignedBrothers.length > 0) atual.turnos += 1;
      mapa.set(k, atual);
    }
    return [...mapa.entries()].sort().map(([chave, { turnos, ceias }]) => ({
      chave,
      turnos,
      ceias,
      rotulo: format(parseISO(chave + '-01'), 'MMMM yyyy', { locale: ptBR }),
    }));
  }, [turnosVisiveis]);

  const gerar = async (chaves: string[]) => {
    setIsGenerating(true);
    try {
      await exportToImage(turnosVisiveis.filter((s) => chaves.includes(mesDeData(s.date))), dados.config.capacidadePadrao, dados.config.identidade);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Não foi possível gerar a imagem.');
    } finally {
      setIsGenerating(false);
      setIsMobileMenuOpen(false);
    }
  };

  /**
   * 🔴 Um mês em vista → gera direto. Vários → pergunta ANTES.
   *
   * A imagem sai uma por mês, então clicar com a escala inteira em vista disparava dez downloads
   * de uma vez. Mas perguntar sempre cobraria um passo a mais do caso comum — que é mandar o mês
   * corrente. A caixa só aparece quando há de fato o que escolher.
   */
  const handleExport = async () => {
    if (isGenerating) return;
    if (!turnosVisiveis.length) {
      alert('Não há turnos no período selecionado para gerar a imagem.');
      return;
    }
    if (mesesEmVista.length > 1) {
      setEscolhendoMeses(true);
      return;
    }
    await gerar(mesesEmVista.map((m) => m.chave));
  };

  // 🆕 Selecionar meu irmão
  const handleSelectMyBrother = (id: string) => {
    setMyBrotherId(id);
    gravarPreferencia('myBrotherId', id);
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
    /*
      🔴 "ESTA SEMANA" VAI DE DOMINGO A DOMINGO — pedido do Flavio em 06/08/2026, e a razão é boa:
      *"não são todas as pessoas que sabem que a semana inicia no domingo. Tem gente que acha que
      começa na segunda, então ela não veria a escala do domingo próximo."*

      Antes era domingo → sábado (`endOfWeek`). Para quem conta a semana de segunda a domingo, o
      domingo que ele chama de "fim desta semana" ficava **de fora do filtro** — justo o dia de
      culto mais cheio.

      A correção é incluir o domingo seguinte: 8 dias, e ninguém perde o próprio domingo por
      discordar do calendário. Custa um dia a mais de lista e resolve o mal-entendido inteiro.
    */
    else if (type === 'week') {
      const domingo = startOfWeek(today, { locale: ptBR })
      start = domingo
      end = endOfDay(addDays(domingo, 7))
    }
    else { start = startOfMonth(today); end = endOfMonth(today); }
    setDateRange({ start, end });
    setDateSearchQuery('');
    setIsMobileMenuOpen(false);
  };

  const filteredBrothers = useMemo(() =>
    BROTHERS
      .filter(b => b.name.toLowerCase().includes(brotherSearch.toLowerCase()))
      .sort((a, b) => Number(b.ativo) - Number(a.ativo)),
    [brotherSearch]
  );

  const sidebarContent = (
    <div className="flex flex-col h-full px-5 py-2 overflow-y-auto">
      {/* Desktop Logo */}
      <div className="hidden md:flex items-center gap-3 mb-8">
        {voc.logo && <img src={voc.logo} alt={dados.config.identidade.titulo} className="h-10 w-auto object-contain" />}
        <div>
          {/*
            🔴 O NOME VEM DA CONFIGURAÇÃO — achado da auditoria externa de documentação, 05/08/2026.
            `config.identidade` existia no modelo de dados, no tipo e no padrão de carregamento —
            e NUNCA era lido. Configuração morta: outro cliente teria de editar este arquivo para
            trocar o nome do próprio site, o que contradiz a regra máxima de escopo (§0 do
            AGENTS.md): "se varia de cliente para cliente e não tem tela, não existe como recurso".
          */}
          <h1 className="text-base font-bold text-text-primary tracking-tight leading-none uppercase">
            {dados.config.identidade.titulo}
          </h1>
          <p className="text-[10px] text-text-secondary mt-1 font-medium tracking-wider">{dados.config.identidade.subtitulo}</p>
        </div>
      </div>

      {/* Título Mobile */}
      <div className="md:hidden mb-5 text-center">
        <h2 className="text-sm font-bold text-gray-600 uppercase tracking-[0.2em]">Filtros e Opções</h2>
      </div>

      {/* 🆕 E: MINHA ESCALA (destaque especial) */}
      <div className="mb-5">
        {myBrother ? (
          <div className="flex flex-col gap-2">
            <button title="Liga e desliga o filtro que mostra só os seus turnos"
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
                {primeiraLetra(myBrother.name)}
              </div>
              <div className="flex-1 text-left">
                <div className="text-xs opacity-70 leading-none mb-0.5">{showMyShiftsOnly ? "Mostrando minha escala" : "Minha Escala"}</div>
                <div className="font-bold leading-tight">{myBrother.name}</div>
              </div>
              <ChevronRight className={clsx("h-5 w-5 transition-transform", showMyShiftsOnly ? "rotate-90" : "")} />
            </button>
            <button title={`Escolher outro ${voc.singular.toLowerCase()} para o filtro Minha Escala`}
              onClick={() => setShowBrotherPicker(true)}
              className="text-xs text-gray-600 hover:text-gray-800 text-right pr-1 underline"
            >
              Trocar nome
            </button>
          </div>
        ) : (
          <button title="Escolha o seu nome para ver só os seus turnos"
            onClick={() => setShowBrotherPicker(true)}
            className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-base font-bold bg-indigo-50 text-indigo-700 border-2 border-indigo-200 hover:bg-indigo-100 transition-all duration-200"
          >
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-xs text-indigo-700 leading-none mb-0.5">Toque para configurar</div>
              <div>Minha Escala</div>
            </div>
            <ChevronRight className="h-5 w-5 text-indigo-400" />
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col space-y-5">

        {/* 1. ESCALA */}
        <div>
          <button title="Ver a escala completa, dia a dia"
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
            {/*
              A ordem é do MENOR para o MAIOR período — pedido do Flavio em 06/08/2026. Quem abre o
              site quer saber "e agora?" antes de "e este mês?", e a lista de cima é a que se lê
              primeiro.
            */}
            {[
              { label: '📆 Esta Semana', type: 'week' as const, dica: 'De domingo a domingo — inclui o próximo domingo' },
              { label: '📅 Próximos 15 dias', type: '15days' as const, dica: 'De hoje até daqui a 14 dias' },
              { label: '🗓️ Este Mês', type: 'month' as const, dica: 'Do dia 1º ao último dia deste mês' },
            ].map(({ label, type, dica }) => (
              <button title={dica}
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
              <button title="Remove todos os filtros e volta a mostrar a escala inteira"
                onClick={clearFilters}
                className="text-[11px] font-bold text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded-md transition-colors"
              >
                LIMPAR
              </button>
            )}
          </div>

          <div className="space-y-4 pl-3 border-l-2 border-gray-100 ml-2">
            <DateSearch
              vocabulario={voc}
              value={dateSearchQuery}
              onChange={setDateSearchQuery}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />

            <MultiSelect
              options={brotherOptions}
              selected={selectedBrotherIds}
              onChange={setSelectedBrotherIds}
              placeholder={voc.singular}
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
          <button title={`Quantos turnos cada ${voc.singular.toLowerCase()} tem, mês a mês`}
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
          <button title="Confere a escala contra todas as regras e mostra o resultado de cada uma"
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
        <button title="Gera uma imagem da escala pronta para enviar no WhatsApp"
          onClick={handleExport}
          disabled={isGenerating}
          className={clsx(
            "w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl text-base font-bold transition-all duration-200 shadow-md",
            // Texto ESCURO sobre o verde da marca: branco sobre #25D366 dá 1,98:1 (piso 4,5:1).
            // Escurecer o fundo tiraria o verde do WhatsApp; escurecer o texto dá ~9:1 e mantém a cor.
            isGenerating ? "bg-gray-400 text-white cursor-not-allowed" : "bg-[#25D366] text-[#0a3d22] hover:bg-[#1fb457] shadow-green-200"
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

        {/* Engrenagem discreta: só quem sabe que ela existe clica. A proteção de verdade é o
            cofre atrás dela — sem a senha, o token guardado no navegador é ruído. */}
        <div className="flex justify-center mt-4">
          <a
            href="#/admin"
            title="Área administrativa"
            aria-label="Área administrativa"
            className="hide-on-export p-2 rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Settings className="h-4 w-4" />
          </a>
        </div>
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
                <button title="Escolhe este nome para o filtro Minha Escala"
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
                    {primeiraLetra(b.name)}
                  </div>
                  <span className="text-base font-semibold">{b.name}</span>
                  {!b.ativo && (
                    <span
                      title="Saiu do elenco. A escala passada dele continua aqui — nada foi apagado."
                      className="ml-auto text-[11px] font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-500 shrink-0"
                    >
                      saiu
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-gray-100">
              <button title="Fecha sem escolher"
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
          {/*
            Era um `<div onClick>` sem título, sem papel e sem foco — invisível para o teclado e
            para o leitor de tela, e invisível também para o portão `regras-mestras`, que só olhava
            `<button>`. Achado de auditoria independente em 04/08/2026.

            Virou `<button>` de verdade: ganha foco, responde a Enter e Espaço de graça, entra na
            contagem de tooltips do portão, e some do fluxo de leitura com `aria-hidden` — o menu
            logo abaixo já oferece a mesma saída a quem navega por teclado.
          */}
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            title="Fechar o menu"
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
              {voc.logo && <img src={voc.logo} alt={dados.config.identidade.titulo} className="h-8 w-auto object-contain shrink-0" />}
              <div className="flex flex-col min-w-0">
                <h1 className="text-xs font-bold text-text-primary tracking-tight leading-none uppercase truncate">
                  {dados.config.identidade.titulo}
                </h1>
                <p className="text-[9px] text-text-secondary mt-0.5 font-medium tracking-wider truncate uppercase">{dados.config.identidade.subtitulo}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Botão "Minha Escala" no header mobile */}
              <button
                onClick={() => myBrotherId ? setShowMyShiftsOnly(!showMyShiftsOnly) : setShowBrotherPicker(true)}
                className={clsx(
                  // 44px é o piso de alvo de toque da casa (Apple recomenda 44, Material 48). Este
                  // botão media 34px e o portão do celular nunca o viu — ele media a tela do admin.
                  "flex items-center gap-1.5 min-h-[44px] px-3 rounded-xl text-xs font-bold transition-all",
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
              <button title={`Abre os filtros por ${voc.singular.toLowerCase()}, mês e data`}
                onClick={() => setIsMobileMenuOpen(true)}
                className="flex items-center gap-1 min-h-[44px] text-action-primary text-xs font-bold whitespace-nowrap hover:bg-blue-50 px-3 rounded-xl transition-colors border border-blue-200"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
              </button>
            </div>
          </div>

          {/* 🆕 C: Barra de filtros rápidos REATIVADA no mobile */}
          <div className="px-3 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
            {/* A MESMA ordem da barra lateral — menor para maior. Duas ordens para os mesmos três
                botões é o tipo de diferença que ninguém nota e todo mundo estranha. */}
            {[
              { label: 'Esta Semana', type: 'week' as const, dica: 'De domingo a domingo — inclui o próximo domingo' },
              { label: '15 dias', type: '15days' as const, dica: 'De hoje até daqui a 14 dias' },
              { label: 'Este Mês', type: 'month' as const, dica: 'Do dia 1º ao último dia deste mês' },
            ].map(({ label, type, dica }) => (
              <button title={dica}
                key={type}
                onClick={() => handleQuickFilter(type)}
                className="shrink-0 min-h-[44px] px-4 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700 transition-all whitespace-nowrap"
              >
                {label}
              </button>
            ))}
            {(activeFiltersCount > 0 || showMyShiftsOnly) && (
              <button title="Remove todos os filtros e volta a mostrar a escala inteira"
                onClick={clearFilters}
                className="shrink-0 min-h-[44px] px-4 rounded-full text-xs font-semibold bg-red-100 text-red-600 hover:bg-red-200 transition-all whitespace-nowrap"
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
            "md:hidden hide-on-export fixed bottom-6 right-4 z-40 rounded-2xl px-4 py-3.5 shadow-lg transition-all active:scale-95 flex items-center gap-2",
            isGenerating ? "bg-gray-400 text-white cursor-not-allowed" : "bg-[#25D366] text-[#0a3d22] hover:bg-[#1fb457] shadow-[#25D366]/40"
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
          {/*
            Aqui viviam um `#active-filters-count` e um `#export-header`, ambos ocultos, ambos sem
            um único leitor em `src/` ou `scripts/` — removidos em 04/08/2026 por auditoria.

            O comentário do primeiro dizia servir "para o sistema de exportação saber se deve limitar
            a foto". Esse sistema não existe mais: a imagem tem layout próprio desde a parte 7 e não
            fotografa a tela. Comentário que descreve um mecanismo extinto é pior que código morto —
            o código morto ninguém lê, o comentário engana quem for mexer depois.
          */}
          {view === 'schedule' && (
            <div className="bg-gray-50 pb-8">
              <ScheduleTable
                shifts={shifts}
                selectedBrotherIds={selectedBrotherIds}
                selectedMonthStrs={selectedMonthStrs}
                dateSearchQuery={dateSearchQuery}
                dateRange={dateRange}
              />
            </div>
          )}

          {view === 'stats' && (
            <StatsView dados={dados} vocabulario={voc} />
          )}

          {view === 'validation' && (
            <ValidationView dados={dados} />
          )}
        </div>
      </main>

      {escolhendoMeses && (
        <SeletorDeMeses
          meses={mesesEmVista}
          aoFechar={() => setEscolhendoMeses(false)}
          aoConfirmar={(chaves) => { setEscolhendoMeses(false); gerar(chaves); }}
        />
      )}
    </div>
  );
}

export default App;
