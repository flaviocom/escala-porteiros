# AGENTS.md — escala-porteiros

> **Você está assumindo este projeto.** Este arquivo é o padrão aberto lido por Codex, Cursor,
> Gemini CLI, Copilot e outros assistentes. Ele é autossuficiente: **você não precisa perguntar ao
> Flavio onde paramos, o que fazer ou o que faltava.**
>
> **Este arquivo é o ROTEADOR do projeto.** Ordem de leitura, e ela importa:
>
> **1.** este arquivo (como se trabalha) → **2.** [`ESTADO.md`](ESTADO.md) (onde estamos) →
> **3.** [`handoff mais recente`](docs/handoff/HANDOFF_2026-08-04-d.md) (o que aconteceu e por quê) →
> **4.** [`BACKLOG.md`](BACKLOG.md) (o que fazer a seguir)
>
> Só depois, e só o trecho de que precisar, os índices:
> [`solicitações`](docs/solicitacoes/INDICE_DE_SOLICITACOES.md) ·
> [`handoffs`](docs/handoff/INDICE.md) ·
> [`histórico`](docs/historico/INDICE.md) ·
> [`o desenho`](docs/superpowers/specs/2026-08-04-area-administrativa-escala-design.md)

---

## 1. O que é este projeto

Site da **escala de porteiros da Congregação Cristã no Brasil — Jardim São Luiz, Barueri/SP**, com
uma **área administrativa** que gera, valida e publica a escala sem tirar o site do ar. Substitui o
site atual (`flaviocom/escala-irmaos-2026-mar`), que é só de visualização e exige mexer no
código-fonte para trocar uma pessoa de lugar.

**A inversão que nunca pode acontecer:** **o portão determinístico decide se publica; o motor
propõe, explica e arbitra — jamais o contrário.** São centenas de vagas, 16 pessoas e 5 famílias de
restrição: um modelo de linguagem acerta quase sempre e erra em silêncio, e erro em silêncio numa
escala é o pior defeito possível, porque ninguém confere 549 linhas à mão.

O motor **distribui também** — foi pedido do Flavio —, mas a proposta dele passa pelas **mesmas**
regras da do algoritmo antes de chegar à tela de publicação.

**Estágio atual (04/08/2026):** **no ar e funcionando.**

- Site: <https://flaviocom.github.io/escala-porteiros/>
- Área administrativa: <https://flaviocom.github.io/escala-porteiros/#/admin>
- Escala publicada: 01/03 → 04/08 (histórico congelado) + 05/08 → 30/12 (piso de 6 dias)
- Falta: o Flavio colar as duas credenciais para publicar pela tela e ligar o motor.

## 2. Idioma e formatação

**Tudo em pt-BR**: respostas, comentários, commits, documentação, interface.

- Datas: `DD/MM/AAAA`
- Fuso: **America/Sao_Paulo**. Toda data de turno é **data local** — nunca `toISOString()` para
  derivar dia ou mês. Use `mesDeData()` de `src/dominio/datas.ts`.
  *Por quê:* em UTC−3 os dois concordam, então o defeito é **invisível daqui**; num fuso positivo,
  o turno do dia 1º passa a contar no mês anterior. O portão `npm run test:fuso:berlim` roda a
  suíte inteira em `Europe/Berlin` justamente para que isso não volte.
- Dinheiro: não se aplica a este projeto.

## 3. Regras que não se violam

1. **Bloco publicado não é reescrito.** Só pode ser **truncado** numa data. O trecho que permanece é
   imutável. *Por quê:* o passado já foi divulgado aos irmãos; reescrevê-lo faz o site desmentir o
   que as pessoas viram.
2. **Pessoa sai da escala sendo desativada, nunca apagada.** *Por quê:* os blocos passados a
   referenciam por `id`; apagar o registro deixa o histórico com nomes órfãos.
3. **Toda regra do catálogo tem validação executável** — hoje são **10 duras + 5 de qualidade**, e o teste `regras.test.ts` fica vermelho se alguém acrescentar regra sem cobertura. *Por quê:* o site antigo promete na
   especificação que valida espaçamento e capacidade, e o código não valida nem um nem outro. Regra
   escrita e não executada é o defeito que este projeto existe para não repetir.
4. **O portão prova as duas pontas** — reprova a escala com infrator injetado **e** aprova a limpa.
   *Por quê:* portão que nasce sempre-verde é indistinguível de portão que não funciona.
5. **Quando a escala não fecha, o sistema declara que não fechou.** Nunca entrega escala ruim em
   silêncio. *Por quê:* decisão explícita do Flavio em 04/08/2026.
6. **Na tela, jamais "IA", "prompt", "chatbot".** Diz-se **"motor"**. No código, o nome técnico é
   mantido. *Por quê:* `_padroes-globais/DENOMINACAO_SEM_JARGAO_DE_IA.md` — e renomear no código
   criaria dialeto privado que quebra a portabilidade.

## 4. Convenções de domínio já pesquisadas

| Assunto | Convenção | Por quê |
|---|---|---|
| **Distanciamento entre escalas** | **Não há número fixo.** O motor tenta o maior piso possível e desce até caber; informa o piso alcançado | Decisão do Flavio: número fixo pode inviabilizar a escala quando o elenco encolhe |
| **Piso de distanciamento** | Calculado **por pessoa**, não global | Quem só pode aos domingos tem teto natural menor; cobrar o mesmo dos outros seria injusto |
| **Cota mensal** | **Teto**, com aviso se ficar abaixo | O site antigo trata como teto no gerador e cobra como exato na validação — contradição ativa |
| **Santa Ceia** | **1× por ano**, sem porteiros, dia **pulado** na distribuição; data cadastrável e pode estar vazia | Irmãos de outra igreja atendem nesse dia; os daqui participam |
| **Data da Santa Ceia** | **16/08/2026** | O site antigo tem `2026-06-07`, que está errado |
| **1º sábado do mês** | Tem turno de **Tarde (Ensaio)** além da Noite | Malha vigente da escala `mar` |
| **Malha de dias** | **Configurável por bloco**, nunca em código | Já mudou uma vez: a versão da reforma usa ter+sex noite e domingos de manhã a cada 14 dias |

## 5. Comandos

```bash
npm install
npm run dev
```

**O GATE — nenhuma mudança significativa passa sem:**

```bash
npm run gate      # typecheck + testes (2 fusos) + denominação + fontes + build
```

O que ele encadeia, e por que cada um existe:

| Passo | O que prova |
|---|---|
| `npm run typecheck` | `strict` ligado — sem ele o TypeScript nem estreita união discriminada |
| `npm test` | a suíte **completa**, nunca escopada |
| `npm run test:fuso:berlim` | a mesma suíte noutro fuso, **depois de provar que o fuso mudou** |
| `npm run denominacao` | nenhum jargão em texto que alguém lê (autoteste 9 + 13) |
| `npm run fontes` | nenhuma fonte externa chamada e não declarada |
| `npm run build` | compila e gera em `docs/` |

⚠️ Cuidado com pipe mascarando o código de saída: `comando | head && echo OK` imprime OK mesmo com o
comando vermelho. Use sem pipe, ou `${PIPESTATUS[0]}`.

🔴 **`npm install` na pasta `D:` leva HORAS.** Medido: 0,8 s por arquivo pequeno, ~1.775× mais lento
que `C:`. Clone numa pasta em `C:` para trabalhar, e traga de volta por `git pull` — ver `ESTADO.md`.

## 6. Git

- **Autor obrigatório:** `Flavio Oliveira <brflaviooliveira@gmail.com>`
- **Nunca force-push** — é pare-e-pergunte.
- Mensagem longa: `git commit -F arquivo`.
- Ao commitar, **leia o `--stat` inteiro** e confirme que `main` mudou. `push` respondendo
  "Everything up-to-date" com trabalho novo no disco significa que o commit caiu noutra branch.
- Remoto: <https://github.com/flaviocom/escala-porteiros> (público, Pages em `main` + `/docs`).
- ⚠️ O `git fetch` na pasta `D:` cai com `early EOF` por causa do disco. Se acontecer:
  `git config http.postBuffer 524288000 && git config core.compression 0` e repita.

## 7. Onde ler o quê

| Vou mexer em… | Leia antes |
|---|---|
| Estado atual | [`ESTADO.md`](ESTADO.md) |
| O que aconteceu na última sessão, e por quê | [`docs/handoff/HANDOFF_2026-08-04-d.md`](docs/handoff/HANDOFF_2026-08-04-d.md) · [índice](docs/handoff/INDICE.md) |
| O que falta | [`BACKLOG.md`](BACKLOG.md) |
| Regras da escala, modelo de dados, motor | [`o desenho`](docs/superpowers/specs/2026-08-04-area-administrativa-escala-design.md) |
| **Por que** uma decisão foi tomada, e como revertê-la | [`DIARIO_DE_BORDO.md`](DIARIO_DE_BORDO.md) |
| O que já foi feito, passo a passo | [`AI_MASTER_LOG.md`](AI_MASTER_LOG.md) |
| **O que o Flavio pediu**, e onde cada pedido foi parar | [`docs/solicitacoes/INDICE_DE_SOLICITACOES.md`](docs/solicitacoes/INDICE_DE_SOLICITACOES.md) |
| Fatias arquivadas dos logs | [`docs/historico/INDICE.md`](docs/historico/INDICE.md) |
| **De onde vem cada dado**, a que custo, e se dá para pagar menos | [`docs/INVENTARIO_DE_FONTES.md`](docs/INVENTARIO_DE_FONTES.md) |
| Método de trabalho | `D:\Antigravity\_padroes-globais\` |

## 8. Como se trabalha

**Ciclo:** Orientar → Planejar → Executar → **Verificar** → Registrar → Decidir.

- **Antes de afirmar ou mexer, mapeie todas as ligações** — consumidores, chamadores, rotas, telas,
  documentos. Criar a função única não conserta nada se os chamadores seguirem na cópia antiga.
- **Nada é fato até a fonte provar.** Cite `arquivo:linha`.
- **"Pronto" exige reprodução ao vivo**, com dados reais e console limpo. Suíte verde não substitui.
- **Teste que não morde é pior que teste ausente.** Prove que a trava reprova, injetando um infrator.
- **Antes de começar, rode o pré-voo:**
  `node D:/Antigravity/_padroes-globais/scripts/pre-voo.mjs .`

## 9. Nunca faça

1. Criar conta, fazer login, autenticar ou digitar senha/credencial/token em nome do Flavio — nem
   com autorização. Entregue **um arquivo que ele clica**, não um comando que ele monta.
2. Mover dinheiro ou executar ordem real.
3. Force-push, apagar dado irreversível, ou reescrever bloco publicado.
4. Escrever segredo em arquivo versionado. Variáveis por **nome**, nunca por valor.
5. Mexer no repositório `flaviocom/escala-irmaos-2026-mar` — ele **fica no ar como está** (decisão do
   Flavio em 04/08/2026).
6. Escrever "IA", "prompt" ou "chatbot" em texto que alguém lê na tela.

## 10. Só o Flavio faz

- Colar o valor de `GITHUB_PAT_ESCALA_PORTEIROS` e `ANTHROPIC_API_KEY_ESCALA`.
- Decidir o intervalo de datas de cada geração e quem entra ou sai do elenco.
- Aprovar a publicação de uma escala nova.
- Recarregar crédito da API quando acabar.

---

**Método completo:** `D:\Antigravity\_padroes-globais\`
