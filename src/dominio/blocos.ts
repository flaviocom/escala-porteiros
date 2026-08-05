/**
 * COMO OS BLOCOS SE ENCAIXAM QUANDO UMA ESCALA NOVA ENTRA.
 *
 * 🔴 POR QUE ESTE ARQUIVO EXISTE. Esta lógica estava escrita **duas vezes, à mão**: uma no botão
 * Publicar da tela, outra no `gerar-bloco.mjs`. E as duas divergiam — o script pegava
 * `blocos[0]` e montava `[truncado, novo]`, o que **apagaria o bloco do meio** no dia em que
 * houvesse três. A tela fazia certo; o script, não.
 *
 * Achado por auditoria externa em 05/08/2026. É a fonte dupla que este projeto inteiro existe para
 * não ter: duas implementações da mesma regra divergem em silêncio, e a que erra é sempre a que
 * ninguém está olhando.
 *
 * ── A REGRA, UMA SÓ ──────────────────────────────────────────────────────────────────────────────
 *
 *   1. todo bloco que começa ANTES do novo sobrevive;
 *   2. cada um deles é **truncado** na véspera do novo — `fim` recuado, turnos de lá para frente
 *      descartados;
 *   3. o bloco novo entra por último.
 *
 * **Truncar é permitido; reescrever o que fica, não.** O passado já foi divulgado.
 */
import { diferencaEmDias, somarDias } from './datas'
import type { Bloco } from './tipos'

export function montarBlocosParaPublicar(anteriores: Bloco[], blocoNovo: Bloco | null): Bloco[] {
  if (!blocoNovo) return anteriores

  const vespera = somarDias(blocoNovo.inicio, -1)
  const truncados = anteriores
    .filter((b) => b.inicio < blocoNovo.inicio)
    .map((b) => ({
      ...b,
      fim: b.fim > vespera ? vespera : b.fim,
      turnos: b.turnos.filter((t) => diferencaEmDias(t.data, blocoNovo.inicio) > 0),
    }))

  return [...truncados, blocoNovo]
}

/**
 * Quantos turnos anteriores ao corte existiam, e quantos sobraram. Se divergir, houve perda.
 *
 * 🔴 Existe porque "o passado não se reescreve" era uma promessa sem medição. O script agora aborta
 * quando os dois números não batem — e abortar é o certo: um bloco que some é passado reescrito.
 */
export function conferirPassadoPreservado(
  anteriores: Bloco[],
  montados: Bloco[],
  inicioDoNovo: string,
): { antes: number; depois: number; ok: boolean } {
  const contar = (bs: Bloco[]) =>
    bs.flatMap((b) => b.turnos).filter((t) => diferencaEmDias(t.data, inicioDoNovo) > 0).length
  const antes = contar(anteriores)
  const depois = contar(montados.filter((b) => b.inicio < inicioDoNovo))
  return { antes, depois, ok: antes === depois }
}
