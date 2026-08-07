/**
 * Datas — sempre LOCAIS, sempre `AAAA-MM-DD`.
 *
 * 🔴 POR QUE NÃO USAR `Date` COMO CHAVE, NEM `toISOString()`.
 *
 * O site anterior derivava o mês com `data.toISOString().slice(0, 7)`, que é **UTC**. Em
 * `America/Sao_Paulo` (UTC−3) isso funciona por sorte: a meia-noite local vira 03:00 do MESMO dia
 * em UTC. Num fuso positivo (Europa, por exemplo) a meia-noite local vira o dia ANTERIOR em UTC, e
 * o turno do dia 1º passa a contar no mês passado — bagunçando cota mensal e estatística.
 *
 * Medi nos dois fusos e o resultado não mudou *naquela* escala. Ou seja: era uma fragilidade que
 * ainda não tinha mordido — o pior tipo, porque some do radar. Aqui a data é **texto** do começo ao
 * fim, e só vira `Date` para calcular dia da semana. Assim não existe fuso para errar.
 */

/** Data no formato `AAAA-MM-DD`. É a forma canônica em todo o projeto. */
export type DataISO = string

const RE_DATA = /^\d{4}-\d{2}-\d{2}$/

export function ehDataValida(d: string): d is DataISO {
  if (!RE_DATA.test(d)) return false
  const [a, m, dia] = d.split('-').map(Number)
  if (m < 1 || m > 12 || dia < 1 || dia > 31) return false
  const dt = new Date(a, m - 1, dia)
  // Rejeita 31/02 e afins: o construtor "conserta" para 03/03, e o dia deixa de bater.
  return dt.getFullYear() === a && dt.getMonth() === m - 1 && dt.getDate() === dia
}

function partes(d: DataISO): [number, number, number] {
  const [a, m, dia] = d.split('-').map(Number)
  return [a, m, dia]
}

/** `Date` em meia-noite LOCAL. Só para cálculo de dia da semana e aritmética de dias. */
export function paraData(d: DataISO): Date {
  const [a, m, dia] = partes(d)
  return new Date(a, m - 1, dia)
}

export function deData(dt: Date): DataISO {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`
}

/** 0 = domingo … 6 = sábado. */
export function diaDaSemana(d: DataISO): number {
  return paraData(d).getDay()
}

/** Mês no formato `AAAA-MM`, derivado do TEXTO — nunca de UTC. */
export function mesDe(d: DataISO): string {
  return d.slice(0, 7)
}

export function diaDoMes(d: DataISO): number {
  return partes(d)[2]
}

/** Quantas vezes este dia da semana já ocorreu no mês, contando o próprio dia (1 = a primeira). */
export function ocorrenciaNoMes(d: DataISO): number {
  return Math.floor((diaDoMes(d) - 1) / 7) + 1
}

export function somarDias(d: DataISO, n: number): DataISO {
  const dt = paraData(d)
  dt.setDate(dt.getDate() + n)
  return deData(dt)
}

/**
 * Diferença em dias de CALENDÁRIO. Usa UTC internamente de propósito: as duas datas são
 * normalizadas do mesmo jeito, então o horário de verão não pode deslocar a conta — que é
 * justamente o defeito clássico de subtrair dois `Date` locais.
 */
export function diferencaEmDias(de: DataISO, ate: DataISO): number {
  const [a1, m1, d1] = partes(de)
  const [a2, m2, d2] = partes(ate)
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86_400_000)
}

/** Todas as datas de `inicio` a `fim`, inclusive nas duas pontas. */
export function intervaloDeDatas(inicio: DataISO, fim: DataISO): DataISO[] {
  const out: DataISO[] = []
  for (let d = inicio; diferencaEmDias(d, fim) >= 0; d = somarDias(d, 1)) out.push(d)
  return out
}

export const NOMES_DIA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'] as const
export const NOMES_DIA_CURTO = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'] as const

/** `2026-08-16` → `16/08/2026`. Formatação brasileira, como manda a casa. */
export function formatarBR(d: DataISO): string {
  const [a, m, dia] = partes(d)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(dia)}/${p(m)}/${a}`
}

/**
 * Mês (`AAAA-MM`) de um `Date`, lido no fuso LOCAL.
 *
 * 🔴 Existe para substituir `data.toISOString().slice(0, 7)`, que lê em UTC.
 *
 * A diferença só aparece no **dia 1º** e só em fuso positivo — e é exatamente aí que ela é pior:
 * num navegador em Berlim (UTC+2), a meia-noite local de 01/08 é 31/07 às 22h em UTC, então o turno
 * do dia 1º passa a contar no mês anterior. O filtro de mês perde o dia, e a coluna das estatísticas
 * mostra o número errado — sem erro, sem aviso, sem nada que denuncie.
 *
 * Em `America/Sao_Paulo` (UTC−3) os dois concordam, o que torna o defeito invisível daqui. É o tipo
 * de fragilidade que só morde quando alguém viaja — e aí ninguém liga o sintoma à causa.
 */
export function mesDeData(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Data de hoje no fuso America/Sao_Paulo, independente de onde o navegador esteja. */
export function hojeSaoPaulo(): DataISO {
  const partesFmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  return partesFmt // en-CA já produz AAAA-MM-DD
}

/**
 * O FIM SUGERIDO para uma escala que começa em `inicio`.
 *
 * **31/12 do ano do início.** Se sobrar menos de 30 dias, 31/12 do ano SEGUINTE — senão a tela abre
 * com uma janela de um dia, numa quinta-feira que a malha não tem, e quem clica em Gerar recebe
 * *"a escala ficou inválida"* sem entender por quê.
 *
 * 🔴 EU JÁ LIMITEI ISTO A SEIS MESES, E ESTAVA ERRADO — 06/08/2026.
 *
 * O dono publicou doze meses sem perceber, e eu concluí que o problema era o tamanho. Não era. Ele
 * corrigiu na hora: *"eu não pedi para você travar aí em 6 meses. De onde você tirou isso?"* — e,
 * sobre o gesto que ele planeja: *"você vai calcular o ano inteiro"*.
 *
 * **Escala de um ano é o que ele quer.** O defeito nunca foi o tamanho: era o tamanho ser **invisível**.
 * A correção que fica é a outra — a janela aparece ao lado dos campos, em dias e meses, antes de
 * gerar. O produto sugere; quem decide é ele.
 *
 * A lição, para mim: **ele reclamou de um número e eu inventei uma trava.** Reclamação sobre um valor
 * pede que o valor fique visível e controlável, não que a escolha seja tirada dele.
 */
export function sugerirFim(inicio: DataISO): DataISO {
  const anoDoInicio = Number(inicio.slice(0, 4))
  const fimDoAno = `${anoDoInicio}-12-31` as DataISO
  return diferencaEmDias(inicio, fimDoAno) >= 30 ? fimDoAno : (`${anoDoInicio + 1}-12-31` as DataISO)
}

/**
 * Rótulo curto de mês, indexado por 0 (janeiro).
 *
 * 🔴 Existe para que a tela possa rotular a coluna a partir da string `AAAA-MM` **sem construir um
 * `Date`**. `parseISO('2026-08')` e `new Date('2026-08-01')` caem em meia-noite UTC, que em fuso
 * negativo é 31/07 — o rótulo passaria a dizer "Jul" sobre a coluna de agosto, e ninguém confere um
 * cabeçalho. O mês já vem escrito na chave; convertê-lo só cria a chance de errar.
 */
export const ROTULO_MES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'] as const
