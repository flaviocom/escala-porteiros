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
  /** Quantas escalas cada pessoa já tem em cada mês, nos blocos anteriores. Ver a promessa 6. */
  escalasPorMesAnterior: Record<string, Record<string, number>> = {},
): RelatorioIndependente {
  const achados: AchadoIndependente[] = []
  const registrar = (promessa: string, furos: string[], veredito: string) =>
    achados.push({ promessa, veredito, furos })

  const linhas = montarLinhas(bloco, pessoas)
  /*
    🔴 QUEM ESTÁ FORA DA EQUIPE NÃO ENTRA NA CONFERÊNCIA — 06/08/2026, regra dada pelo dono:

      > *"somente quem está ativo. Quem não está ativo não faz parte. Se eu determino um período e tem
      >  pessoas ativas, pessoas não ativas não fazem parte de toda a validação das regras."*

    O sintoma que ele viu: *"2 pessoa(s) com teto: **Thiago** (máx. 2/mês) · Williams"* — e o Thiago
    tinha sido tirado da equipe. Ele tem teto cadastrado, mas não participa desta escala; listá-lo
    entre os conferidos faz o leitor procurar por alguém que não está lá.

    ⚠️ **UMA EXCEÇÃO, e ela é o motivo de o filtro não descer até `montarLinhas`:** a promessa "só
    entra quem está no elenco e ativo" precisa **enxergar** o inativo que aparecer na escala — é o
    furo que ela existe para achar. Filtrar na origem cegaria justamente o guarda.

    Ou seja: a linha do tempo se monta para todos; as promessas se medem sobre os ATIVOS.
  */
  const ativas = [...linhas.values()].filter((l) => l.pessoa.ativo)
  const porNome = (id: string) => pessoas.find((p) => p.id === id)?.nome ?? `(id ${id})`
  const noElenco = new Set(bloco.elenco)
  const comuns = bloco.turnos.filter((t) => !t.santaCeia)

  /*
    🔴 PROMESSA 0 — ESTÁ TUDO AQUI? Achado da quinta auditoria externa, 05/08/2026.

    Esta régua existe para DISCORDAR da outra — e reproduzia exatamente a cegueira que fez D11
    nascer: nenhuma das sete promessas perguntava se havia escala ali. Medido:

        bloco com ZERO turnos ................ catálogo REPROVA (D11) · aqui: 0 furos de 7
        73 turnos com capacidade 0 ........... catálogo APROVAVA    · aqui: 0 furos de 7
        bloco declara nov e traz set ......... catálogo REPROVA     · aqui: 0 furos de 7

    Uma segunda opinião que só sabe olhar o conteúdo não vê a ausência dele — e a tela vende esta
    régua como maker–checker. Ela vem PRIMEIRO de propósito: se o bloco é vazio, tudo o que as outras
    seis disserem é verdadeiro por vacuidade.
  */
  {
    const furos: string[] = []
    if (bloco.turnos.length === 0) {
      furos.push(`o bloco de ${formatarBR(bloco.inicio)} a ${formatarBR(bloco.fim)} não tem um único turno`)
    }
    const semVaga = comuns.filter((t) => t.capacidade < 1)
    for (const t of semVaga.slice(0, 5))
      furos.push(`${formatarBR(t.data)} ${t.tipo}: pede ${t.capacidade} pessoa(s) — sai na escala como um dia sem ninguém`)
    if (semVaga.length > 5) furos.push(`… e mais ${semVaga.length - 5} turno(s) sem vaga`)

    const escalacoes = comuns.reduce((s, t) => s + t.pessoas.length, 0)
    if (comuns.length > 0 && escalacoes === 0 && semVaga.length === 0)
      furos.push(`${comuns.length} turno(s) no bloco e NINGUÉM escalado em nenhum deles`)

    // E os turnos estão dentro do período que o bloco DECLARA? Um bloco que diz novembro e traz
    // setembro passa por todas as outras promessas: cada turno, isolado, está perfeito.
    const fora = bloco.turnos.filter(
      (t) => diferencaEmDias(bloco.inicio, t.data) < 0 || diferencaEmDias(t.data, bloco.fim) < 0,
    )
    for (const t of fora.slice(0, 5))
      furos.push(`${formatarBR(t.data)} está fora do período declarado (${formatarBR(bloco.inicio)} a ${formatarBR(bloco.fim)})`)
    if (fora.length > 5) furos.push(`… e mais ${fora.length - 5} turno(s) fora do período`)

    registrar('O bloco não está vazio, e o que está nele é do período que ele declara', furos,
      `${bloco.turnos.length} turno(s) · ${comuns.reduce((s, t) => s + t.capacidade, 0)} vaga(s) · ${escalacoes} escalação(ões)`)
  }

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
    for (const l of ativas)
      for (let i = 1; i < l.datas.length; i++)
        if (l.datas[i] === l.datas[i - 1])
          furos.push(`${l.pessoa.nome} duas vezes em ${formatarBR(l.datas[i])}`)
    registrar('Ninguém serve dois turnos no mesmo dia', furos,
      `${linhas.size} linha(s) do tempo percorrida(s)`)
  }

  // ── 3, 4, 5. Restrições da pessoa, conferidas turno a turno da linha dela ─
  {
    const furos: string[] = []
    for (const l of ativas) {
      const r = l.pessoa.restricoes
      for (const t of l.turnos) {
        const dia = diaDaSemana(t.data)
        if (r.diasPermitidos && !r.diasPermitidos.includes(dia))
          furos.push(`${l.pessoa.nome} em ${NOMES_DIA[dia]} (${formatarBR(t.data)}), fora dos dias que pode`)
        if (r.diasProibidos?.includes(dia))
          furos.push(`${l.pessoa.nome} em ${NOMES_DIA[dia]} (${formatarBR(t.data)}), dia vetado para ele`)
        if (r.turnosPermitidos && !r.turnosPermitidos.includes(t.tipo))
          furos.push(`${l.pessoa.nome} no turno ${t.tipo} em ${formatarBR(t.data)}, turno que ele não faz`)
        for (const a of r.ausencias ?? []) {
          /*
            Ausência cobre os dias ENTRE as duas datas, em qualquer ordem — um intervalo invertido
            (fim < início) é dado torto, não permissão. A condição original nunca casava com o
            invertido, e o gerador tinha a MESMA cegueira: as duas réguas aprovavam juntas alguém
            escalado dentro da própria viagem. Normalização própria, de propósito — copiar a função
            da outra régua traria o defeito dela junto.
          */
          const ini = a.inicio <= a.fim ? a.inicio : a.fim
          const fim = a.inicio <= a.fim ? a.fim : a.inicio
          if (t.data >= ini && t.data <= fim)
            furos.push(`${l.pessoa.nome} escalado em ${formatarBR(t.data)}, dentro da ausência de ${formatarBR(ini)} a ${formatarBR(fim)}`)
        }
      }
    }
    registrar('Dias, turnos e ausências de cada pessoa são respeitados', furos,
      `${ativas.reduce((s, l) => s + l.turnos.length, 0)} escalação(ões) conferida(s) uma a uma`)
  }

  // ── 6. Teto mensal ───────────────────────────────────────────────────────
  {
    const furos: string[] = []
    /*
      🔴 O TETO ATRAVESSA A FRONTEIRA — sétima auditoria externa, 05/08/2026.

      Esta régua também contava só dentro do bloco, como a outra. Ou seja: as DUAS aprovavam um mês
      estourado, cada uma pela mesma janela. **Maker–checker só vale quando os dois olham por janelas
      diferentes** — aqui a implementação era independente e a PERGUNTA era a mesma.

      Medido no dado no ar: Williams, teto 3, com 5 escalas em agosto de 2026.
    */
    for (const l of ativas) {
      const teto = l.pessoa.restricoes.tetoMensal
      if (teto == null) continue
      const antesDele = escalasPorMesAnterior[l.pessoa.id] ?? {}
      for (const [m, n] of l.porMes) {
        const antes = antesDele[m] ?? 0
        const total = n + antes
        if (total > teto)
          furos.push(
            antes > 0
              ? `${l.pessoa.nome} com ${total} em ${m} (${antes} já publicada(s) + ${n} aqui), acima do teto de ${teto}`
              : `${l.pessoa.nome} com ${n} em ${m}, acima do teto de ${teto}`,
          )
      }
    }
    /*
      🔴 QUEM, E QUAL TETO — 06/08/2026. Dizia só *"2 pessoa(s) com teto"*, e o dono perguntou o
      óbvio: *"quem são as pessoas?"*. O dado existe na linha de cima; faltava sair.
    */
    const comTeto = ativas
      .filter((l) => l.pessoa.restricoes.tetoMensal != null)
      .map((l) => `${l.pessoa.nome} (máx. ${l.pessoa.restricoes.tetoMensal}/mês)`)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
    registrar('Ninguém passa do próprio teto mensal', furos,
      (comTeto.length ? `${comTeto.length} pessoa(s) com teto: ${comTeto.join(' · ')}` : 'ninguém tem teto mensal') +
        (Object.keys(escalasPorMesAnterior).length ? ' · somando o que já está publicado no mês' : ' · SEM os blocos anteriores'))
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
    /*
      🔴 QUAIS DIAS — 06/08/2026. Dizia *"1 data(s) no calendário · 1 marcada(s)"*, e a pergunta dele
      foi imediata: *"qual é ou quais são os dias?"*. Contar não informa; nomear informa.
    */
    const listar = (ds: readonly string[]) => ds.map((d) => formatarBR(d)).join(', ')
    registrar('Os dias sem escala ficam vazios e marcados', furos,
      canonicas.length === 0
        ? 'nenhum dia sem escala no calendário deste período'
        : `${canonicas.length} no calendário: ${listar(canonicas)} · ${marcadas.length} marcada(s) no bloco` +
          (marcadas.length ? `: ${listar(marcadas.map((t) => t.data))}` : ''))
  }

  // ── 9. Distanciamento real, medido por fora ──────────────────────────────
  {
    /*
      🔴 TODOS OS NOMES, NÃO O PRIMEIRO — 06/08/2026, apontado pelo dono.

      Esta promessa dizia *"menor intervalo real: 4 dia(s) (Donizete)"*. Ele conferiu contra o rodapé
      da aba Gerar e respondeu: *"não é só o Donizete que está com 4 dias — mostra Flavio, mostra
      Luiz Cezar, mostra Isac, mostra Williams"*.

      Medido: **5 pessoas no mínimo**, não uma. O código guardava `deQuem` do primeiro que batesse o
      recorde e sobrescrevia a cada novo menor — quem EMPATAVA no mínimo desaparecia.

      **Um nome ao lado de um número é lido como "é este".** Nomear um de cinco é pior que não nomear
      ninguém: quem lê conclui que os outros quatro estão bem, e vai conferir só um.
    */
    const furos: string[] = []
    let menor = Infinity
    /** Todos os que EMPATAM no mínimo — o empate é a regra aqui, não a exceção. */
    let noMinimo: string[] = []
    for (const l of ativas) {
      const datas = [...new Set([...(ultimaEscalaAnterior[l.pessoa.id] ? [ultimaEscalaAnterior[l.pessoa.id]] : []), ...l.datas])].sort()
      for (let i = 1; i < datas.length; i++) {
        const d = diferencaEmDias(datas[i - 1], datas[i])
        if (d <= 0) continue
        if (d < menor) { menor = d; noMinimo = [l.pessoa.nome] }
        else if (d === menor && !noMinimo.includes(l.pessoa.nome)) noMinimo.push(l.pessoa.nome)
      }
    }
    const quem = noMinimo.slice().sort((a, b) => a.localeCompare(b, 'pt-BR')).join(', ')
    const piso = bloco.pisoAlcancado
    if (piso != null && menor < piso)
      furos.push(`o bloco declara piso de ${piso} dia(s), e o menor intervalo real é ${menor} — ${noMinimo.length} pessoa(s): ${quem}`)
    registrar('O espaçamento declarado é o espaçamento real', furos,
      menor === Infinity
        ? 'ninguém com duas escalas'
        : `menor intervalo real: ${menor} dia(s) · ${noMinimo.length} pessoa(s) nesse mínimo: ${quem}`)
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
