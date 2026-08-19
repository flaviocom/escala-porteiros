/**
 * Telefone do WhatsApp, normalizado para o formato que a Evolution API espera.
 *
 * Confirmado contra código de referência real (skill `int-evolution-api` da própria VPS do
 * Charmway, `_format_number`, 19/08/2026): a API aceita `"5511999999999@s.whatsapp.net"` — dígitos
 * puros, com DDI 55, sem `+`, sem parênteses, sem traço, e o `@s.whatsapp.net` entra na hora de
 * montar a mensagem (`scripts/vps/`), não aqui. Este arquivo só resolve a ponta da TELA: a pessoa
 * digita do jeito que for natural — "(11) 99999-9999", "+55 11 99999-9999", "11999999999" — e o
 * cadastro guarda sempre a MESMA forma.
 */

/**
 * Limpa o que a pessoa digitou e devolve dígitos com DDI 55, ou `''` se não sobrar um número
 * plausível — a tela usa o vazio para recusar sem travar em exceção.
 *
 * Não valida DDD nem tenta adivinhar se o número existe: só normaliza forma. Confirmar que o
 * WhatsApp existe de verdade é o que a própria Evolution API faz no envio.
 */
export function normalizarTelefone(bruto: string): string {
  const digitos = (bruto ?? '').replace(/\D/g, '')
  if (digitos.startsWith('55') && (digitos.length === 12 || digitos.length === 13)) return digitos
  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`
  return ''
}

/** Para MOSTRAR na tela — "5511999999999" vira "(11) 99999-9999". Fora do formato, devolve como veio. */
export function formatarTelefone(normalizado: string): string {
  const m = /^55(\d{2})(\d{4,5})(\d{4})$/.exec(normalizado ?? '')
  if (!m) return normalizado ?? ''
  return `(${m[1]}) ${m[2]}-${m[3]}`
}
