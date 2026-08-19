# AGENTS.md — escala-porteiros

> ## 🔑 GATILHO DE RETOMADA — a palavra é `retomaescala`
>
> O Flavio trabalha com **vários VS Code/terminais abertos ao mesmo tempo, um por projeto**. Quando
> ele digitar **`retomaescala`** (sozinha, em qualquer mensagem, neste repositório), isso significa
> **"retome este projeto exatamente de onde paramos"** — sem ele reexplicar nada. Ao ver a palavra:
>
> 1. Leia **este arquivo** inteiro (como se trabalha aqui).
> 2. Leia **[`ESTADO.md`](ESTADO.md)** ("Em uma frase" + "O mais recente" + "Como retomar").
> 3. Leia o **[handoff mais recente](docs/handoff/HANDOFF_2026-08-19-d.md)** (o que aconteceu e por quê).
> 4. Leia **[`BACKLOG.md`](BACKLOG.md)** (o que falta, e o que é 👤 decisão dele).
> 5. Responda com um resumo curto de onde as coisas estão e **o que você vai fazer a seguir** — não
>    pergunte "o que você quer que eu faça?": o `BACKLOG.md` já responde isso.
>
> Não é preciso ele dizer mais nada além da palavra — nenhum "continua o projeto X", nenhum caminho
> de pasta. Ele já está na pasta certa quando digita; a palavra é só para você **confirmar** que
> entendeu o pedido e seguir o roteiro acima, sem perguntas.

> **Você está assumindo este projeto.** Este arquivo é o padrão aberto lido por Codex, Cursor,
> Gemini CLI, Copilot e outros assistentes. Ele é autossuficiente: **você não precisa perguntar ao
> Flavio onde paramos, o que fazer ou o que faltava.**
>
> **Este arquivo é o ROTEADOR do projeto.** Ordem de leitura, e ela importa:
>
> **1.** este arquivo (como se trabalha) → **2.** [`ESTADO.md`](ESTADO.md) (onde estamos) →
> **3.** [`handoff mais recente`](docs/handoff/HANDOFF_2026-08-19-d.md) (o que aconteceu e por quê) →
> **4.** [`BACKLOG.md`](BACKLOG.md) (o que fazer a seguir)
>
> Só depois, e só o trecho de que precisar, os índices:
> [`solicitações`](docs/solicitacoes/INDICE_DE_SOLICITACOES.md) ·
> [`handoffs`](docs/handoff/INDICE.md) ·
> [`histórico`](docs/historico/INDICE.md) ·
> [`o desenho`](docs/superpowers/specs/2026-08-04-area-administrativa-escala-design.md) ·
> [`pesquisa: gerar N versões`](docs/superpowers/specs/PESQUISA_2026-08-05-gerar-n-versoes.md)

---

## 0. 🔴 REGRA MÁXIMA DE ESCOPO — leia antes de qualquer decisão de produto

> **Instituída pelo Flavio em 05/08/2026, textualmente:**
> *"É uma escala **genérica**, **configurável**, mas genérica, **com intenção de comercialização**.
> Coloque como regra máxima do escopo."*

Este projeto **nasceu** para a escala de porteiros de uma congregação, e é lá que ele roda hoje. Mas
o produto que se constrói daqui para a frente é **um gerador de escalas de turno para qualquer
equipe** — a portaria de um prédio, uma recepção, um plantão. A congregação é o **primeiro cliente**,
não o escopo.

> ### ⏱️ MAS NÃO CONFUNDA "intenção de comercialização" COM "está sendo vendido"
>
> **Hoje o produto atende UMA congregação, e só ela** — decisão do Flavio em 05/08/2026:
> *"eu pretendo somente disponibilizar para minha comum congregação, somente para os meus irmãos e
> somente para os porteiros da minha igreja. Outras igrejas, comercialização é um plano futuro."*
>
> São **três fases**: 1️⃣ uso próprio (🟢 é onde estamos) · 2️⃣ outras comuns e casas de oração ·
> 3️⃣ venda, possivelmente para uma central.
>
> **A §0 vale integralmente na fase 1** — mas o *escopo de trabalho* é a fase 1. Recurso que só a
> fase 2 ou 3 usaria vai para o `BACKLOG.md` com a fase marcada, não para o código de hoje.
>
> 🔴 **Por que ser genérico agora, então?** Porque cravar o nome é barato hoje e caríssimo depois:
> vira reescrita, não configuração. **O portão genérico não serve à fase 1 — ele serve a manter as
> fases 2 e 3 possíveis.**
>
> Detalhe, com as palavras dele e o que cada fase reabre:
> [`docs/FINALIDADE_E_FASES.md`](docs/FINALIDADE_E_FASES.md).

**O que isso obriga, em toda decisão:**

| | |
|---|---|
| **Nada cravado no código** | número de pessoas por turno, dias de culto, datas especiais, turnos — tudo é **dado configurável**. Um número no código é um cliente que o produto não atende |
| **Vocabulário de fora** | quem escala dois turnos numa portaria precisa entender a tela sem conhecer o vocabulário desta congregação. Toda regra tem `explicacao` em linguagem comum |
| **O específico é dado, não estrutura** | "Santa Ceia" é uma **data sem escala** cadastrada em `config.santaCeia`. Outro cliente cadastra feriado, dedetização, reforma. A estrutura é a mesma |
| **Configurável não é opcional** | se um comportamento varia de cliente para cliente e não tem tela para mudá-lo, ele **não existe** como recurso — existe como dívida |

⚠️ **Onde ainda há dívida de escopo,** declarada em vez de escondida: os rótulos de turno
(`MANHÃ/TARDE/NOITE`) e a malha de dias são dado, mas **a malha ainda não tem tela** — muda-se por
`config.json`. Está no [`BACKLOG.md`](BACKLOG.md).

✅ **Paga em 05/08/2026, e a forma como estava escondida vale registrar:** o nome do cliente, o
bairro, a instituição e o vocabulário ("Irmão") estavam **cravados em oito lugares** — cabeçalho
do site, cabeçalho da administração, tela de entrada, imagem do WhatsApp, nome do arquivo baixado,
título da aba e os três prompts do motor. E `config.identidade` **já existia** no tipo, no dado e
no padrão de carregamento: nunca era lido. **Configuração morta é pior que configuração ausente —
ela parece que resolve.** Quem lesse só o tipo concluiria que o produto já era configurável.

🔒 **O portão que impede a volta:** `npm run generico` varre `src/` e o `index.html` atrás de nome
de cliente fora de comentário, e `npm run generico:autoteste` prova que ele morde (21 casos, as
duas pontas). Os dois estão dentro do `npm run gate`. *Regra sem portão é disciplina, e disciplina
falha* — um dos termos deste portão nasceu inerte e só o autoteste mostrou.

---

## 1. O que é este projeto

Site da **escala de porteiros da Congregação Cristã no Brasil — Jardim São Luiz, Barueri/SP**, com
uma **área administrativa** que gera, valida e publica a escala sem tirar o site do ar. Substitui o
site atual (`flaviocom/escala-irmaos-2026-mar`), que é só de visualização e exige mexer no
código-fonte para trocar uma pessoa de lugar.

**A inversão que nunca pode acontecer:** **o portão determinístico decide se publica; o motor
propõe, explica e arbitra — jamais o contrário.** São centenas de vagas, 16 pessoas e cinco famílias de
restrição: um modelo de linguagem acerta quase sempre e erra em silêncio, e erro em silêncio numa
escala é o pior defeito possível, porque ninguém confere 549 linhas à mão.

O motor **distribui também** — foi pedido do Flavio —, mas a proposta dele passa pelas **mesmas**
regras da do algoritmo antes de chegar à tela de publicação.

**Estágio atual (08/08/2026):** **no ar, divulgado e em uso** — os irmãos consultam a própria
escala pelo site (S-054).

- Site: <https://flaviocom.github.io/escala-porteiros/>
- Área administrativa: <https://flaviocom.github.io/escala-porteiros/#/admin>
- Escala publicada: **01/03 → 05/08** (histórico congelado, 96 turnos) + **06/08 → 31/12**
  (87 turnos, piso de **4** dias — caiu de 7 em 06/08, quando Eduardo e Thiago saíram do elenco)
- ⚠️ O recorte para 05/08 foi o trabalho de `47fb59f`: a escala nova desmentia, em **todos** os
  turnos de hoje em diante, o site que a congregação já tem o link. Medível de novo com
  `npm run vivo:divulgado -- --antigo <url do site anterior>`.
- O token de publicação está pago desde 06/08 (provado pelos commits via API — DB-050). A única
  credencial em aberto é a chave do **motor**, opcional: nada trava sem ela.

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
3. **Toda regra do catálogo tem validação executável** — hoje são **12 duras + 5 de qualidade**, e o teste `regras.test.ts` fica vermelho se alguém acrescentar regra sem cobertura — assim como `npm run contagem`, que reprova documento vivo declarando um número que o catálogo desmente. *Por quê:* o site antigo promete na
   especificação que valida espaçamento e capacidade, e o código não valida nem um nem outro. Regra
   escrita e não executada é o defeito que este projeto existe para não repetir.
4. **O portão prova as duas pontas** — reprova a escala com infrator injetado **e** aprova a limpa.
   *Por quê:* portão que nasce sempre-verde é indistinguível de portão que não funciona.
5. **Quando a escala não fecha, o sistema declara que não fechou.** Nunca entrega escala ruim em
   silêncio. *Por quê:* decisão explícita do Flavio em 04/08/2026.
6. **Na tela, jamais "IA", "prompt", "chatbot".** Diz-se **"motor"**. No código, o nome técnico é
   mantido. *Por quê:* `_padroes-globais/DENOMINACAO_SEM_JARGAO_DE_IA.md` — e renomear no código
   criaria dialeto privado que quebra a portabilidade.

## 3.1 MÉTODO — o global diz o quê, aqui se diz o como

Método de engenharia = **Gauntlet Loop**, padrão global desde 14/08/2026:
`D:\Antigravity\_padroes-globais\METODO_GAUNTLET_LOOP.md` (§8 — "o global diz O QUÊ, o projeto diz
COMO"). Protocolo de ciclo completo em `D:\Antigravity\_padroes-globais\ENGINEERING_LOOP.md`.

**A adaptação local deste projeto mora NESTE arquivo** — o GATE de 10 passos (§5), o ciclo de
trabalho (§8) e os "nunca faça" (§9) são o "como" concreto de escala-porteiros: fuso testado em
Berlim, publicação bloqueada enquanto a validação reprovar, bloco publicado nunca reescrito.

## 4. Convenções de domínio já pesquisadas

| Assunto | Convenção | Por quê |
|---|---|---|
| **Distanciamento entre escalas** | **Não há número fixo.** O motor tenta o maior piso possível e desce até caber; informa o piso alcançado | Decisão do Flavio: número fixo pode inviabilizar a escala quando o elenco encolhe |
| **Piso de distanciamento** | Calculado **por pessoa**, não global | Quem só pode aos domingos tem teto natural menor; cobrar o mesmo dos outros seria injusto |
| **Cota mensal** | **Teto = MÁXIMO, nunca meta.** Nunca se ultrapassa; ficar abaixo **não é falha**. Só vira aviso quem fica **2 ou mais** abaixo, e **só em mês inteiro** | O site antigo tratava como teto no gerador e cobrava como exato na validação — contradição ativa. A tolerância é do Flavio (05/08/2026): *"ficar abaixo, desde que não fiquem muito abaixo, com tolerância"* |
| **Tolerância abaixo do teto** | **1** — 🏠 **convenção de casa, não padrão de mercado** | Não existe fonte externa para "quanto abaixo do teto é demais" numa escala de voluntários. Com tetos de 2 e 3, ficar 1 abaixo é 50–67%; 2 abaixo já é metade ou menos. Declarada no código (`TOLERANCIA_ABAIXO_DO_TETO`), na tela e aqui |
| **Mês cortado** | **Não se julga cota mensal de mês pela metade** | O primeiro e o último mês de qualquer escala entram incompletos. Cobrar teto mensal cheio de quem teve meio mês é cobrar conta que ninguém podia fechar — foi o que produziu 2 avisos falsos em 05/08/2026 |
| **Repetição de trio (Q4)** | **Aceita.** Avisa, nunca reprova | Decisão do Flavio em 05/08/2026, vendo 4 trios repetidos 3× em 5 meses: *"tudo bem, não é grave, não infringe nenhuma regra"* |
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
npm run gate      # 37 passos: typecheck · testes (2 fusos) · denominação · fontes · contagem · cadeia · genérico + autoteste · catálogo gerado · comandos citados · arquitetura · auditoria · regras mestras · build · build genérico
```

O que ele encadeia, e por que cada um existe:

| Passo | O que prova |
|---|---|
| `npm run typecheck` | `strict` ligado — sem ele o TypeScript nem estreita união discriminada |
| `npm test` | a suíte **completa**, nunca escopada |
| `npm run test:fuso:berlim` | a mesma suíte noutro fuso, **depois de provar que o fuso mudou** |
| `npm run denominacao` | nenhum jargão em texto que alguém lê (autoteste 9 + 13) |
| `npm run fontes` | nenhuma fonte externa chamada e não declarada — em `src/` **e** `scripts/` |
| `npm run contagem` | nenhum documento vivo declara um número de regras que o catálogo desmente |
| `npm run cadeia` | `AGENTS.md`/`ESTADO.md`/`BACKLOG.md` apontam para o handoff que É o mais recente |
| `npm run generico` | nenhum nome de cliente cravado — o produto é genérico (§0) |
| `npm run generico:autoteste` | prova que o portão acima **morde**: 21 casos, infratores e limpos, mais a autodefesa |
| `npm run doc:regras:conferir` | o catálogo de regras documentado bate com o código |
| `npm run doc:comandos` | todo comando citado na documentação existe |
| `npm run arquitetura` | o domínio continua sendo uma ilha; a 2ª régua não virou espelho |
| `npm run fatos` | nenhum documento vivo desmente um número medido |
| `npm run auditoria` | 21 ataques ao próprio código, com infrator injetado |
| `npm run regras-mestras` | tooltip em todo botão, sem aspas duplas quebrando o atributo |
| `npm run build` | compila e gera em `docs/` |

Os três últimos portões nasceram em 04/08/2026, de auditoria independente: **dois deles mediam menos
do que diziam** (o de fontes ignorava `scripts/` inteiro; a auditoria não via `export const` nem
comparava `pessoas.json`), e os dois novos existem porque um número escrito à mão e um ponteiro
mantido à mão apodrecem sozinhos.

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

## 6.1 Capacidades locais — nada de script órfão

Os 65 scripts de `scripts/` (portões, validações ao vivo, ferramentas de dados) estão catalogados
em [`docs/capacidades.json`](docs/capacidades.json), cada um com ramo, gatilho, propósito e o
portão que prova que funciona — padrão de
`D:\Antigravity\_padroes-globais\ARVORE_DE_CAPACIDADES.md`. Ao criar um script novo em `scripts/`,
registre a folha no mesmo passo; `node D:/Antigravity/_padroes-globais/scripts/checar-capilaridade.mjs .`
reprova capacidade local sem folha (o `pre-voo.mjs` já roda isso sozinho quando o manifesto existe).

## 7. Onde ler o quê

### 🔵 Nunca viu este projeto? Comece aqui

**[`docs/RECONSTRUIR.md`](docs/RECONSTRUIR.md)** — o documento de portabilidade. Explica o que é o
produto, por que cada decisão é como é, em que ordem reconstruir e quais armadilhas já custaram caro
aqui. Escrito para quem **não participou de nada** — inclusive outra inteligência artificial.

| Assunto | Documento |
|---|---|
| Os 3 arquivos JSON, campo a campo | [`docs/MODELO_DE_DADOS.md`](docs/MODELO_DE_DADOS.md) |
| As 17 regras — ⚙️ **gerado do código** | [`docs/CATALOGO_DE_REGRAS.md`](docs/CATALOGO_DE_REGRAS.md) |
| Como a escala é montada, e o que o algoritmo **não** garante | [`docs/ALGORITMO.md`](docs/ALGORITMO.md) |
| As camadas, medidas no grafo de importações | [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) |
| A trilha GENÉRICA (build de demonstração, sem cliente) | [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) § "A segunda trilha" |
| Como usar, conferir, e o que fazer quando dá errado | [`docs/OPERACAO.md`](docs/OPERACAO.md) |
| Instalar do zero, e publicar para **outro cliente** | [`docs/INSTALAR.md`](docs/INSTALAR.md) |
| **Para quem este produto é, e quando** — as três fases | [`docs/FINALIDADE_E_FASES.md`](docs/FINALIDADE_E_FASES.md) |
| Cada portão **por dentro**: critério, população, isenções | [`docs/PORTOES.md`](docs/PORTOES.md) |

### O registro do que aconteceu

| Vou mexer em… | Leia antes |
|---|---|
| Estado atual | [`ESTADO.md`](ESTADO.md) |
| O que aconteceu na última sessão, e por quê | [`docs/handoff/HANDOFF_2026-08-19-d.md`](docs/handoff/HANDOFF_2026-08-19-d.md) · [índice](docs/handoff/INDICE.md) |
| O que falta | [`BACKLOG.md`](BACKLOG.md) |
| Regras da escala, modelo de dados, motor | [`o desenho`](docs/superpowers/specs/2026-08-04-area-administrativa-escala-design.md) |
| **Por que** uma decisão foi tomada, e como revertê-la | [`DIARIO_DE_BORDO.md`](DIARIO_DE_BORDO.md) |
| O que já foi feito, passo a passo | [`AI_MASTER_LOG.md`](AI_MASTER_LOG.md) |
| **O que o Flavio pediu**, e onde cada pedido foi parar | [`docs/solicitacoes/INDICE_DE_SOLICITACOES.md`](docs/solicitacoes/INDICE_DE_SOLICITACOES.md) |
| Comunicar com os irmãos porteiros (modelo de WhatsApp, versículos ARC) | [`docs/COMUNICACOES.md`](docs/COMUNICACOES.md) |
| Requisitos e sugestões da FASE 2 (malha parametrizável, logo, lembretes) | [`docs/FASE2.md`](docs/FASE2.md) |
| Lembrete de véspera no WhatsApp (ponte Charmway, VPS, passos do dono) | [`docs/LEMBRETE_WHATSAPP.md`](docs/LEMBRETE_WHATSAPP.md) |
| Fatias arquivadas dos logs | [`docs/historico/INDICE.md`](docs/historico/INDICE.md) |
| **De onde vem cada dado**, a que custo, e se dá para pagar menos | [`docs/INVENTARIO_DE_FONTES.md`](docs/INVENTARIO_DE_FONTES.md) |
| Comparação de conformidade com o projeto-irmão `charmway-erp` | [`docs/TABELA_CONFORMIDADE_PROJETOS_IRMAOS.md`](docs/TABELA_CONFORMIDADE_PROJETOS_IRMAOS.md) |
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
