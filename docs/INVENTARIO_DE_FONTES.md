# INVENTÁRIO DE FONTES — escala-porteiros

> 🤖 **Documento GERADO** por `scripts/inventariar-fontes.mjs` em 04/08/2026.
> Não edite à mão: inventário escrito à mão envelhece em uma semana e passa a mentir com autoridade.
> Para mudar o conteúdo, edite a lista `DECLARADAS` no script e gere de novo.
>
> **Cadeia de navegação:** [`ESTADO.md`](../ESTADO.md) → [`handoff`](handoff/INDICE.md) → [`BACKLOG.md`](../BACKLOG.md)
> **Roteador:** [`AGENTS.md`](../AGENTS.md) · Regra: `_padroes-globais/SOBERANIA_DE_DADOS.md`

---

## As cinco perguntas

De onde vem · o que entrega · com que frequência · é pago e quanto · estamos na melhor situação.

Este projeto tem **4 fontes externas**, e 1 delas entrega algo **derivável**.

### API do GitHub (Contents)

| | |
|---|---|
| **De onde vem** | `api.github.com` |
| **O que entrega** | grava e lê os arquivos de dados da escala (pessoas, blocos, configuração) |
| **Com que frequência** | sob demanda — uma vez por publicação |
| **Custo** | gratuita nos limites da conta pessoal · conferido em 04/08/2026 |
| **Credencial** | `GITHUB_PAT_ESCALA_PORTEIROS` — valor só na central |
| **Quem consome** | `src/admin/github.ts` |
| **Se cair** | não publica pela tela; o botão "baixar JSON" continua salvando o trabalho |
| **Alternativa** | commit manual pelo próprio site do GitHub, ou por linha de comando |

### Site do GitHub (páginas de upload)

| | |
|---|---|
| **De onde vem** | `github.com` |
| **O que entrega** | nada — são links que a tela oferece para publicar à mão, apontando para a pasta certa |
| **Com que frequência** | nunca automaticamente: só se a pessoa clicar |
| **Custo** | zero · conferido em 04/08/2026 |
| **Credencial** | `null` — valor só na central |
| **Quem consome** | `src/admin/github.ts` |
| **Se cair** | o caminho manual fica sem atalho; publicar pelo botão continua funcionando |
| **Alternativa** | navegar até a pasta no GitHub à mão |

### Motor de sugestão

| | |
|---|---|
| **De onde vem** | `api.anthropic.com` |
| **O que entrega** | proposta alternativa de distribuição, explicação em português, arbitragem quando a escala não fecha, e auditoria da escala pronta |
| **Com que frequência** | sob demanda — uma chamada por mês gerado |
| **Custo** | por uso, conta separada. ⚠️ saldo zerado derruba o motor (HTTP 400) · conferido em 04/08/2026 |
| **Credencial** | `ANTHROPIC_API_KEY_ESCALA` — valor só na central |
| **Quem consome** | `src/admin/motor.ts` |
| **Se cair** | o algoritmo continua gerando e validando; perde-se só a proposta e os textos |
| **Alternativa** | nenhuma necessária — a distribuição é DERIVÁVEL e o algoritmo já a faz de graça |

> ⚠️ **Este dado é DERIVÁVEL.** A distribuição da escala é calculada de graça pelo algoritmo em
> `src/dominio/gerador.ts`. O que se paga aqui é a *leitura da situação* e a *explicação* — não o
> resultado. É uma escolha, e está declarada como tal.

### GitHub Pages

| | |
|---|---|
| **De onde vem** | `flaviocom.github.io` |
| **O que entrega** | hospeda o site e serve os arquivos de dados |
| **Com que frequência** | a cada abertura do site |
| **Custo** | gratuita para repositório público · conferido em 04/08/2026 |
| **Credencial** | não exige |
| **Quem consome** | `src/admin/github.ts` |
| **Se cair** | o site sai do ar; os dados continuam no repositório |
| **Alternativa** | qualquer hospedagem estática |


---

## A pergunta que economiza dinheiro: pagamos por algo derivável?

**Sim, e de propósito.** A distribuição da escala é calculada pelo algoritmo, de graça, em
`src/dominio/gerador.ts` — inclusive com o piso de distanciamento descoberto por busca. O que o
motor acrescenta é outra coisa: a leitura da situação, a explicação em português, a arbitragem
quando a escala não fecha e a segunda opinião sobre a escala pronta.

**Se o motor sair do ar, nada essencial para.** Gerar, validar e publicar continuam funcionando.

## Portão

```bash
node scripts/inventariar-fontes.mjs --conferir
```

Reprova se algum host for **chamado no código e não declarado** aqui — que é como uma fonte externa
entra num projeto sem ninguém ter decidido por ela.

**Medido nesta geração:** 4 host(s) chamado(s), 4 declarado(s), 0 não declarado(s).

## Quando refazer

- Ao plugar fonte nova — o portão reprova antes de o commit passar.
- A cada trimestre: preço muda, plano muda, alternativa nova aparece.
- Ao receber a fatura: se a linha do extrato não bate com esta tabela, uma das duas está errada.
