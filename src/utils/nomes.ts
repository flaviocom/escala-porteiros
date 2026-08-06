/**
 * Nome de pessoa, tratado como TEXTO DE VERDADE — não como sequência de bytes latinos.
 *
 * 🔴 POR QUE ESTE ARQUIVO EXISTE. Sétima auditoria externa, 05/08/2026. Duas famílias de defeito, a
 * mesma causa: cinco lugares do produto tratavam nome como se toda letra coubesse em uma unidade de
 * código UTF-16, e como se todo nome tivesse pelo menos uma letra de a–z.
 *
 *   · `nome.charAt(0)` num nome que começa com emoji (ou com qualquer caractere fora do plano
 *     básico) devolve METADE de um par substituto. A metade sozinha não é texto válido, e a geração
 *     da imagem morria com *"URI malformed"* — mensagem que não diz nada a quem só quis publicar a
 *     escala do mês.
 *
 *   · o identificador vinha de `nome.replace(/[^a-z0-9]+/g, '_')`. Um nome escrito inteiro fora do
 *     alfabeto latino — 李明, Дмитрий — vira `_`, sozinho. **O segundo irmão nessa situação colide
 *     com o primeiro**, e o produto se defende com um alerta que fala de "identificador", palavra
 *     que ninguém do outro lado usou.
 *
 * O projeto é vendido como genérico, para qualquer congregação — inclusive uma que escreva os nomes
 * em outro alfabeto. Aqui isso deixa de ser sorte.
 */

/**
 * A primeira letra, para a bolinha da inicial. Por PONTO DE CÓDIGO, nunca por unidade de código.
 *
 * `[...nome]` itera por ponto de código (o iterador de string faz isso desde o ES2015), então um
 * emoji sai inteiro em vez de partido ao meio.
 *
 * ⚠️ Ainda não é "grafema": uma família 👨‍👩‍👧 é uma sequência colada por ZWJ e sai só o primeiro
 * bonequinho. Fica declarado porque meia-verdade calada é pior que limitação escrita — o que
 * importava era **parar de produzir texto inválido**, e isso está resolvido.
 */
export function primeiraLetra(nome: string): string {
  const primeiro = [...(nome ?? '')][0] ?? ''
  return primeiro.toLocaleUpperCase('pt-BR')
}

/**
 * O identificador de uma pessoa, a partir do nome — estável, e nunca vazio.
 *
 * Primeiro tenta o caminho de sempre: minúsculas, sem acento, o que não for `a–z0–9` vira `_`. Se
 * sobrar alguma coisa, é isso — e os identificadores de quem já está cadastrado continuam iguais,
 * que é o ponto (mudar identificador antigo apagaria o histórico de quem já foi escalado).
 *
 * Se NÃO sobrar nada — nome inteiro fora do alfabeto latino —, cai para os pontos de código do
 * próprio nome em hexadecimal. Feio de ler e ninguém precisa ler: é chave, não rótulo. O que
 * importa é que 李明 e Дмитрий deixem de ser a mesma pessoa.
 */
export function idDoNome(nome: string): string {
  const limpo = (nome ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  if (limpo) return limpo

  // 🔴 A queda para pontos de código vale para NOME, não para pontuação. Sem esta guarda, `...`
  // virava o identificador `p_2e2e2e` — o produto aceitaria cadastrar reticências como pessoa. O
  // teste que exigia vazio aqui foi escrito antes e reprovou a primeira versão desta função.
  //
  // `\p{L}` e `\p{N}` são "qualquer letra" e "qualquer número" em qualquer alfabeto — é o que
  // permite dizer "tem nome de verdade" sem listar alfabetos à mão.
  const temLetraOuNumero = /[\p{L}\p{N}]/u.test(nome ?? '')
  if (!temLetraOuNumero) return ''

  const codigos = [...(nome ?? '').trim()].map((c) => c.codePointAt(0)!.toString(16)).join('')
  return codigos ? `p_${codigos}` : ''
}
