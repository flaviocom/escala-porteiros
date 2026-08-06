/**
 * Testes das datas — com atenção especial ao vazamento de fuso.
 *
 * 🔴 O caso que este arquivo existe para travar: `data.toISOString().slice(0, 7)` lê o mês em **UTC**.
 * Em `America/Sao_Paulo` (UTC−3) isso concorda com o mês local, então o defeito é **invisível daqui**.
 * Num fuso positivo, o turno do **dia 1º** passa a contar no mês anterior — e o sintoma é silencioso:
 * o filtro perde o dia e a coluna das estatísticas mostra outro número.
 *
 * Por isso o portão roda **duas vezes**: no fuso da casa e num fuso positivo (`npm run test:fuso`).
 * Um teste que só roda em UTC−3 aprovaria o defeito.
 */
import { describe, expect, it } from 'vitest'
import {
  deData, diaDaSemana, diferencaEmDias, ehDataValida, formatarBR, intervaloDeDatas,
  mesDe, mesDeData, ocorrenciaNoMes, somarDias, sugerirFim } from './datas'

describe('validação de data', () => {
  it('aceita data real', () => {
    expect(ehDataValida('2026-08-16')).toBe(true)
  })
  it('🔴 rejeita 31 de fevereiro — o construtor "conserta" para 03/03 e o dia deixa de bater', () => {
    expect(ehDataValida('2026-02-31')).toBe(false)
  })
  it('rejeita formato errado', () => {
    expect(ehDataValida('16/08/2026')).toBe(false)
    expect(ehDataValida('2026-8-16')).toBe(false)
  })
})

describe('dia da semana', () => {
  it('16/08/2026 é domingo — a data da Santa Ceia', () => {
    expect(diaDaSemana('2026-08-16')).toBe(0)
  })
  it('05/08/2026 é quarta — o primeiro dia do bloco novo', () => {
    expect(diaDaSemana('2026-08-05')).toBe(3)
  })
})

describe('ocorrência no mês', () => {
  it('o 1º sábado do mês é a 1ª ocorrência (é o dia do Ensaio)', () => {
    expect(ocorrenciaNoMes('2026-08-01')).toBe(1)
    expect(ocorrenciaNoMes('2026-08-07')).toBe(1)
  })
  it('o dia 8 já é a 2ª ocorrência', () => {
    expect(ocorrenciaNoMes('2026-08-08')).toBe(2)
  })
})

describe('aritmética de dias', () => {
  it('conta a virada de mês', () => {
    expect(diferencaEmDias('2026-08-30', '2026-09-01')).toBe(2)
    expect(somarDias('2026-08-31', 1)).toBe('2026-09-01')
  })
  it('conta a virada de ano', () => {
    expect(diferencaEmDias('2026-12-30', '2027-01-02')).toBe(3)
  })
  it('o intervalo inclui as duas pontas', () => {
    expect(intervaloDeDatas('2026-08-01', '2026-08-03')).toEqual(['2026-08-01', '2026-08-02', '2026-08-03'])
  })
})

describe('formatação brasileira', () => {
  it('16/08/2026, não 2026-08-16', () => {
    expect(formatarBR('2026-08-16')).toBe('16/08/2026')
  })
})

// ---------------------------------------------------------------------------
// 🔒 O PORTÃO DE FUSO
// ---------------------------------------------------------------------------

describe('🔒 mês lido no fuso LOCAL, nunca em UTC', () => {
  const primeiroDeAgosto = new Date(2026, 7, 1) // meia-noite local de 01/08/2026

  it('devolve o mês local do dia 1º', () => {
    expect(mesDeData(primeiroDeAgosto)).toBe('2026-08')
  })

  it('e o do último dia do mês', () => {
    expect(mesDeData(new Date(2026, 7, 31))).toBe('2026-08')
  })

  it('mesDe (texto) e mesDeData (Date) concordam', () => {
    expect(mesDe(deData(primeiroDeAgosto))).toBe(mesDeData(primeiroDeAgosto))
  })

  /**
   * Este é o teste que morde. `getTimezoneOffset()` devolve MINUTOS a subtrair do horário local para
   * chegar a UTC — negativo em fusos positivos (Berlim: −120). Nesses fusos, a meia-noite do dia 1º
   * cai no mês anterior em UTC, e é aí que `toISOString()` mente.
   *
   * Em `America/Sao_Paulo` o teste não tem o que provar e diz isso, em vez de fingir cobertura.
   */
  it('🔴 num fuso positivo, toISOString() erraria o mês — e mesDeData não', () => {
    const offset = primeiroDeAgosto.getTimezoneOffset()
    const mesUtc = primeiroDeAgosto.toISOString().slice(0, 7)

    if (offset < 0) {
      // Fuso positivo: aqui o defeito é real e visível.
      expect(mesUtc).toBe('2026-07') // o que o código antigo devolvia
      expect(mesDeData(primeiroDeAgosto)).toBe('2026-08') // o que está certo
      expect(mesDeData(primeiroDeAgosto)).not.toBe(mesUtc)
    } else {
      // UTC−3 e demais fusos negativos: os dois concordam. O teste não prova nada aqui,
      // e é por isso que existe `npm run test:fuso`.
      expect(mesDeData(primeiroDeAgosto)).toBe('2026-08')
    }
  })

  it('a régua vale para todo dia 1º do ano', () => {
    for (let m = 0; m < 12; m++) {
      const d = new Date(2026, m, 1)
      expect(mesDeData(d)).toBe(`2026-${String(m + 1).padStart(2, '0')}`)
    }
  })
})

describe('sugerirFim — o ano inteiro, porque é o que o dono quer', () => {
  /*
    🔴 EU TINHA LIMITADO A SEIS MESES, E ESTAVA ERRADO. Ele publicou doze meses sem perceber e eu
    concluí que o problema era o tamanho. Era o tamanho ser INVISÍVEL. Nas palavras dele: *"eu não
    pedi para você travar aí em 6 meses"* e *"você vai calcular o ano inteiro"*.

    Estes testes existem para que a trava não volte por engano.
  */
  it('acompanha o ano civil', () => {
    expect(sugerirFim('2026-08-06')).toBe('2026-12-31')
    expect(sugerirFim('2027-01-01')).toBe('2027-12-31')
  })

  it('🔴 no fim do ano vai até o fim do ANO SEGUINTE — o ano inteiro, de propósito', () => {
    expect(sugerirFim('2026-12-31')).toBe('2027-12-31')
    expect(sugerirFim('2027-12-30')).toBe('2028-12-31')
  })

  it('a janela mínima de 30 dias continua de pé', () => {
    expect(diferencaEmDias('2026-12-15', sugerirFim('2026-12-15'))).toBeGreaterThanOrEqual(30)
  })
})
