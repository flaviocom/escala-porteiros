/**
 * COMO OS BLOCOS SE ENCAIXAM QUANDO UMA ESCALA NOVA ENTRA.
 *
 * 🔴 POR QUE ESTE ARQUIVO EXISTE. Esta lógica estava escrita **duas vezes, à mão**: uma no botão
 * Publicar da tela, outra no `gerar-bloco.mjs`. E as duas divergiam — o script pegava `blocos[0]` e
 * montava `[truncado, novo]`, o que **apagaria o bloco do meio** no dia em que houvesse três.
 *
 * Fonte dupla é onde as duas versões divergem em silêncio, e a que erra é sempre a que ninguém está
 * olhando.
 *
 * ── A REGRA, UMA SÓ ──────────────────────────────────────────────────────────────────────────────
 *
 * O bloco novo **manda no período dele, e só nele**. Tudo o que já foi publicado fora desse período
 * continua publicado.
 *
 * Isso significa que um bloco anterior pode ser **partido em dois**: a cabeça (antes do novo) e a
 * cauda (depois do novo). Aparar as duas pontas é permitido; apagar o que sobra, não.
 *
 * 🔴 A CAUDA FOI UM DEFEITO REAL — achado por auditoria externa em 05/08/2026, e ele apagava escala
 * já divulgada. A versão anterior guardava só a cabeça: gerar `01/09 → 31/10` sobre um bloco
 * publicado que ia até 31/12 **apagava novembro e dezembro inteiros** — 73 turnos, medidos no dado
 * real —, e o conferidor **aprovava**, porque contava só o que vinha antes do corte.
 *
 * O cenário não era hipotético: "gerar um período menor para corrigir uma coisa" é o uso mais
 * natural da tela.
 */
import { diferencaEmDias, somarDias, type DataISO } from './datas'
import type { Bloco } from './tipos'

/** O turno cai dentro do intervalo? Inclusive nas duas pontas. */
const dentro = (data: DataISO, inicio: DataISO, fim: DataISO) =>
  diferencaEmDias(inicio, data) >= 0 && diferencaEmDias(data, fim) >= 0

/**
 * Monta a lista de blocos para publicar: os anteriores, aparados onde o novo entra, mais o novo.
 *
 * Um bloco anterior vira **dois** quando o novo cai no meio dele — cabeça e cauda. Pedaço que fica
 * sem nenhum turno some: bloco vazio não descreve nada, e a regra D11 o reprovaria.
 */
export function montarBlocosParaPublicar(anteriores: Bloco[], blocoNovo: Bloco | null): Bloco[] {
  if (!blocoNovo) return anteriores

  const vespera = somarDias(blocoNovo.inicio, -1)
  const diaSeguinte = somarDias(blocoNovo.fim, 1)
  const resultado: Bloco[] = []

  for (const b of anteriores) {
    // A CABEÇA: o que este bloco governa ANTES de o novo começar.
    const cabeca = b.turnos.filter((t) => diferencaEmDias(t.data, blocoNovo.inicio) > 0)
    if (b.inicio < blocoNovo.inicio && cabeca.length > 0) {
      resultado.push({ ...b, fim: b.fim > vespera ? vespera : b.fim, turnos: cabeca })
    }

    // A CAUDA: o que ele governa DEPOIS de o novo terminar. Sem isto, escala publicada some.
    const cauda = b.turnos.filter((t) => diferencaEmDias(blocoNovo.fim, t.data) > 0)
    if (b.fim > blocoNovo.fim && cauda.length > 0) {
      resultado.push({
        ...b,
        id: `${b.id}-cauda`,
        inicio: b.inicio < diaSeguinte ? diaSeguinte : b.inicio,
        turnos: cauda,
      })
    }
  }

  resultado.push(blocoNovo)
  return resultado.sort((a, b) => (a.inicio < b.inicio ? -1 : 1))
}

/**
 * Nenhum turno publicado FORA do período do bloco novo pode desaparecer.
 *
 * 🔴 A versão anterior contava só o que vinha **antes** do corte, e por isso aprovava o
 * desaparecimento da cauda. O conferidor existia para provar que *"o passado não se reescreve"* e
 * provava metade da frase — que é pior que não provar nada, porque dá licença.
 *
 * A pergunta certa: *de tudo que estava publicado e que o bloco novo NÃO cobre, sobrou tudo?*
 */
export function conferirPassadoPreservado(
  anteriores: Bloco[],
  montados: Bloco[],
  blocoNovo: Pick<Bloco, 'inicio' | 'fim'>,
): { antes: number; depois: number; ok: boolean; perdidos: DataISO[] } {
  const foraDoNovo = (bs: Bloco[]) =>
    bs
      .flatMap((b) => b.turnos.filter((t) => dentro(t.data, b.inicio, b.fim)))
      .filter((t) => !dentro(t.data, blocoNovo.inicio, blocoNovo.fim))

  const antes = foraDoNovo(anteriores)
  const depois = foraDoNovo(montados)

  const chave = (t: { data: DataISO; tipo: string }) => `${t.data}|${t.tipo}`
  const sobreviveram = new Set(depois.map(chave))
  const perdidos = [...new Set(antes.filter((t) => !sobreviveram.has(chave(t))).map((t) => t.data))]

  return { antes: antes.length, depois: depois.length, ok: perdidos.length === 0, perdidos }
}
