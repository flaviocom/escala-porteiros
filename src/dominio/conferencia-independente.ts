/**
 * CONFERÊNCIA INDEPENDENTE — a segunda régua, que existe para DISCORDAR.
 *
 * 🔴 A DOR QUE ORIGINOU ESTE ARQUIVO, nas palavras do Flavio em 05/08/2026:
 *
 * > *"Você tem o agente inteligente interpolando as escalas e achando a melhor combinação. Só que eu
 * > quero uma outra forma de conferência, que mostre por auditoria — de outro agente, que não foi o
 * > mesmo que criou — que ele valide as regras da escala e veja se não houve nenhum furo."*
 *
 * É o maker–checker do método dele, aplicado ao produto: **quem verifica não pode ser quem fez**.
 *
 * ⚠️ O QUE ESTE ARQUIVO PODE E O QUE NÃO PODE PROMETER — e a diferença é honesta, não retórica.
 *
 * **Pode:** não compartilhar UMA LINHA de código com `regras.ts`. Ele não importa o catálogo, não
 * usa os auxiliares dele, e chega às mesmas conclusões por um caminho diferente: monta a **linha do
 * tempo de cada pessoa** e o **índice por dia**, em vez de percorrer o catálogo sobre os turnos. Um
 * erro de laço, de fronteira, de `<` no lugar de `<=`, ou uma regra que percorre a lista errada não
 * se repete igual em duas implementações escritas por ângulos opostos. Foi exatamente esse tipo de
 * defeito que a auditoria de 04/08 encontrou — D9 conferindo o bloco contra ele mesmo.
 *
 * **NÃO pode:** dizer que é imune a ponto cego. As duas réguas foram escritas pelo mesmo autor, e
 * o método do Flavio é explícito de que isso não basta — *"quem escreveu carrega os mesmos pontos
 * cegos ao testar"*. Por isso a tela **declara esse limite**, em vez de vender independência total.
 * Independência de verdade veio, e virá de novo, de auditores externos (P2.10 no backlog).
 *
 * O QUE VALE AQUI É A DISCORDÂNCIA. Concordância entre as duas réguas é o esperado e não prova
 * muito. **Divergência é ouro**: significa que uma das duas está errada, e nenhuma escala deve ser
 * publicada enquanto isso não for explicado.
 */
import { diaDaSemana, diferencaEmDias, formatarBR, mesDe, NOMES_DIA, type DataISO } from './datas'
import type { Bloco, Configuracao, Pessoa, Turno } from './tipos'

export interface AchadoIndependente {
  promessa: string
  /** O que esta régua encontrou, em português. */
  veredito: string
  furos: string[]
}

export interface RelatorioIndependente {
  achados: AchadoIndependente[]
  /** Promessas em que ESTA régua encontrou furo. */
  comFuro: AchadoIndependente[]
  /** Números apurados por fora, para cruzar com o outro lado. */
  numeros: { turnos: number; vagas: number; preenchidas: number; pessoasEscaladas: number; dias: number }
}

/** Linha do tempo de cada pessoa: a estrutura que a outra régua NÃO usa. */
interface Linha {
  pessoa: Pessoa
  datas: DataISO[]
  porMes: Map<string, number>
  turnos: Turno[]
}

function montarLinhas(bloco: Bloco, pessoas: Pessoa[]): Map<string, Linha> {
  const linhas = new Map<string, Linha>()
  for (const p of pessoas) linhas.set(p.id, { pessoa: p, datas: [], porMes: new Map(), turnos: [] })
  for (const t of bloco.turnos) {
    for (const id of t.pessoas) {
      const l = linhas.get(id)
      if (!l) continue // quem não está no cadastro é tratado na promessa do elenco
      l.datas.push(t.data)
      l.turnos.push(t)
      const m = mesDe(t.data)
      l.porMes.set(m, (l.porMes.get(m) ?? 0) + 1)
    }
  }
  for (const l of linhas.values()) l.datas.sort()
  return linhas
}

export function conferirPorFora(
  bloco: Bloco,
  pessoas: Pessoa[],
  config: Configuracao,
  ultimaEscalaAnterior: Record<string, DataISO> = {},
): RelatorioIndependente {
  const achados: AchadoIndependente[] = []
  const registrar = (promessa: string, furos: string[], veredito: string) =>
    achados.push({ promessa, veredito, furos })

  const linhas = montarLinhas(bloco, pessoas)
  const porNome = (id: string) => pessoas.find((p) => p.id === id)?.nome ?? `(id ${id})`
  const noElenco = new Set(bloco.elenco)
  const comuns = bloco.turnos.filter((t) => !t.santaCeia)

  // ── 1. Cada turno com o número certo ─────────────────────────────────────
  {
    const furos = comuns
      .filter((t) => t.pessoas.length !== t.capacidade)
      .map((t) => `${formatarBR(t.data)} ${t.tipo}: ${t.pessoas.length} onde cabem ${t.capacidade}`)
    registrar('Cada turno tem o número de pessoas que pede', furos,
      `${comuns.length - furos.length} de ${comuns.length} turnos com o número certo`)
  }

  // ── 2. Ninguém duas vezes no mesmo dia ───────────────────────────────────
  // Pelo ângulo da PESSOA: procura data repetida na linha do tempo dela.
  {
    const furos: string[] = []
    for (const l of linhas.values())
      for (let i = 1; i < l.datas.length; i++)
        if (l.datas[i] === l.datas[i - 1])
          furos.push(`${l.pessoa.nome} duas vezes em ${formatarBR(l.datas[i])}`)
    registrar('Ninguém serve dois turnos no mesmo dia', furos,
      `${linhas.size} linha(s) do tempo percorrida(s)`)
  }

  // ── 3, 4, 5. Restrições da pessoa, conferidas turno a turno da linha dela ─
  {
    const furos: string[] = []
    for (const l of linhas.values()) {
      const r = l.pessoa.restricoes
      for (const t of l.turnos) {
        const dia = diaDaSemana(t.data)
        if (r.diasPermitidos && !r.diasPermitidos.includes(dia))
          furos.push(`${l.pessoa.nome} em ${NOMES_DIA[dia]} (${formatarBR(t.data)}), fora dos dias que pode`)
        if (r.diasProibidos?.includes(dia))
          furos.push(`${l.pessoa.nome} em ${NOMES_DIA[dia]} (${formatarBR(t.data)}), dia vetado para ele`)
        if (r.turnosPermitidos && !r.turnosPermitidos.includes(t.tipo))
          furos.push(`${l.pessoa.nome} no turno ${t.tipo} em ${formatarBR(t.data)}, turno que ele não faz`)
        for (const a of r.ausencias ?? [])
          if (diferencaEmDias(a.inicio, t.data) >= 0 && diferencaEmDias(t.data, a.fim) >= 0)
            furos.push(`${l.pessoa.nome} escalado em ${formatarBR(t.data)}, dentro da ausência de ${formatarBR(a.inicio)} a ${formatarBR(a.fim)}`)
      }
    }
    registrar('Dias, turnos e ausências de cada pessoa são respeitados', furos,
      `${[...linhas.values()].reduce((s, l) => s + l.turnos.length, 0)} escalação(ões) conferida(s) uma a uma`)
  }

  // ── 6. Teto mensal ───────────────────────────────────────────────────────
  {
    const furos: string[] = []
    for (const l of linhas.values()) {
      const teto = l.pessoa.restricoes.tetoMensal
      if (teto == null) continue
      for (const [m, n] of l.porMes) if (n > teto) furos.push(`${l.pessoa.nome} com ${n} em ${m}, acima do teto de ${teto}`)
    }
    registrar('Ninguém passa do próprio teto mensal', furos,
      `${[...linhas.values()].filter((l) => l.pessoa.restricoes.tetoMensal != null).length} pessoa(s) com teto`)
  }

  // ── 7. Só quem está no elenco e ativo ────────────────────────────────────
  {
    const furos: string[] = []
    const vistos = new Set<string>()
    for (const t of bloco.turnos)
      for (const id of t.pessoas) {
        if (vistos.has(id)) continue
        vistos.add(id)
        if (!noElenco.has(id)) furos.push(`${porNome(id)} aparece na escala e não está no elenco`)
        else if (!pessoas.find((p) => p.id === id)?.ativo) furos.push(`${porNome(id)} está fora da equipe e aparece na escala`)
      }
    registrar('Só entra quem está no elenco e ativo', furos, `${vistos.size} pessoa(s) distinta(s) na escala`)
  }

  // ── 8. Dia sem escala (aqui, a Santa Ceia) ───────────────────────────────
  {
    const furos: string[] = []
    const dentro = (d: DataISO) => diferencaEmDias(bloco.inicio, d) >= 0 && diferencaEmDias(d, bloco.fim) >= 0
    const canonicas = config.santaCeia.filter(dentro)
    const marcadas = bloco.turnos.filter((t) => t.santaCeia)
    for (const t of marcadas) if (t.pessoas.length > 0) furos.push(`${formatarBR(t.data)} é dia sem escala e tem ${t.pessoas.length} pessoa(s)`)
    // Só cobra o calendário de bloco que o sistema gerou — o passado importado é o que já foi visto.
    if (bloco.origem !== 'importado')
      for (const d of canonicas)
        if (!marcadas.some((t) => t.data === d) && bloco.turnos.some((t) => t.data === d))
          furos.push(`${formatarBR(d)} é dia sem escala no calendário e o bloco tem turno comum nele`)
    registrar('Os dias sem escala ficam vazios e marcados', furos,
      `${canonicas.length} data(s) no calendário dentro do período · ${marcadas.length} marcada(s)`)
  }

  // ── 9. Distanciamento real, medido por fora ──────────────────────────────
  {
    const furos: string[] = []
    let menor = Infinity
    let deQuem = ''
    for (const l of linhas.values()) {
      const datas = [...new Set([...(ultimaEscalaAnterior[l.pessoa.id] ? [ultimaEscalaAnterior[l.pessoa.id]] : []), ...l.datas])].sort()
      for (let i = 1; i < datas.length; i++) {
        const d = diferencaEmDias(datas[i - 1], datas[i])
        if (d > 0 && d < menor) { menor = d; deQuem = l.pessoa.nome }
      }
    }
    const piso = bloco.pisoAlcancado
    if (piso != null && menor < piso)
      furos.push(`o bloco declara piso de ${piso} dia(s), e o menor intervalo real é ${menor} (${deQuem})`)
    registrar('O espaçamento declarado é o espaçamento real', furos,
      menor === Infinity ? 'ninguém com duas escalas' : `menor intervalo real: ${menor} dia(s) (${deQuem})`)
  }

  const vagas = comuns.reduce((s, t) => s + t.capacidade, 0)
  const preenchidas = comuns.reduce((s, t) => s + t.pessoas.length, 0)
  return {
    achados,
    comFuro: achados.filter((a) => a.furos.length > 0),
    numeros: {
      turnos: comuns.length,
      vagas,
      preenchidas,
      pessoasEscaladas: new Set(bloco.turnos.flatMap((t) => t.pessoas)).size,
      dias: new Set(bloco.turnos.map((t) => t.data)).size,
    },
  }
}
