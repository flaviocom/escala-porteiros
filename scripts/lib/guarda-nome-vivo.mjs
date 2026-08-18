/**
 * 🔒 FONTE ÚNICA do padrão que um nome de script `vivo:*` tem de bater, antes de entrar numa
 * `execSync` que monta a linha de comando por concatenação de string.
 *
 * Nasceu junto da correção do DEP0190 em `rodar-validacoes-ao-vivo.mjs`: `execFileSync(file, args,
 * {shell:true})` é o padrão que o Node.js está depreciando, porque com shell os argumentos são
 * concatenados sem escapar. Ali `nome` só vinha de `Object.keys(package.json.scripts)` — nunca de
 * entrada externa —, mas essa garantia vivia implícita no fluxo de dados. Esta trava a torna
 * EXPLÍCITA e testável: quem usa `execSync` com string montada tem de provar que o pedaço
 * interpolado bate neste padrão antes de montar a string.
 */
export const NOME_VALIDO = /^vivo(?::[a-z-]+)?$/

/** @throws {Error} se `nome` não bater no padrão — nunca deixa passar silencioso. */
export function exigirNomeValido(nome) {
  if (!NOME_VALIDO.test(nome)) throw new Error(`nome de validação fora do padrão esperado: "${nome}"`)
  return nome
}
