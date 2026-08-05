# Especificação de Design — `escala-porteiros`

> **Área administrativa para geração, validação e publicação da escala de porteiros**
> CCB — Jardim São Luiz, Barueri/SP
> Data: 04/08/2026 · Autor: Flavio (decisões) + assistente (levantamento e desenho)
> Status: **aguardando aprovação**

---

## 1. Contexto e origem

O projeto atual está em produção:

| Item | Valor |
|---|---|
| Site | `https://flaviocom.github.io/escala-irmaos-2026-mar/` |
| Repositório | `flaviocom/escala-irmaos-2026-mar` (público) |
| Pasta local | `D:\Antigravity\Meus-Projetos\escala-irmaos-2026-mar` |
| Publicação | GitHub Pages em **modo branch** (`build_type: legacy`, `source: main /`) — serve o build commitado na raiz |
| Stack | React 18 + TypeScript + Vite + Tailwind + date-fns + lucide-react + html-to-image |

Existem 7 repositórios de escala na conta. Os relevantes para este trabalho:

- `escala-irmaos-2026-mar` — **a base deste projeto** (01/03/2026 → 30/12/2026)
- `escala-irmaos-2026-mai` — versão provisória da reforma, escala **estática**, com malha de dias diferente (ter/sex à noite + domingos de manhã a cada 14 dias)
- `escala-irmas-2026-mar` — escala das irmãs, 14 nomes, sem restrições individuais

A existência de duas malhas de dias diferentes prova que **dias e turnos não podem ser código** — precisam ser configuração.

### 1.1 Verificações feitas (não presumidas)

- O bundle publicado (`assets/index-D8_1_Rih.js`) foi extraído e **confere byte a byte com o `src/`** em regras e elenco. O `dist/` da pasta local é build antigo (hash diferente) e não é o que está no ar.
- O workflow `.github/workflows/deploy.yml` **falha** (última execução: `failure`, 18s, 01/07/2026). Quem publica é o build nativo do Pages (`pages build and deployment`, `success`). O workflow é peso morto.
- O algoritmo real foi **executado e medido** (não apenas lido). Resultados na seção 12.

---

## 2. Problema

Quando alguém sai da escala e outro entra, hoje é preciso **editar código-fonte e refazer o deploy**. A escala não é um dado: é uma função (`generateSchedule()`) que reconstrói tudo a cada abertura do navegador. Não existe "a escala" armazenada em lugar nenhum.

Consequências medidas:
- Não há como remover/adicionar pessoa sem mexer no código.
- Não há como cadastrar férias ou viagem de ninguém.
- O distanciamento entre escalas do mesmo irmão **não é regra**, é só critério de desempate — e falha na prática (seção 12).
- A validação **não confere** duas das regras que a própria especificação do projeto promete.

---

## 3. Escopo

### 3.1 Entra

1. Projeto novo, independente, herdando toda a interface pública do atual.
2. A escala vira **dado publicado** (JSON no repositório) em vez de código executado, incluindo a **carga inicial** que congela a escala já existente como bloco histórico (§5.4).
3. Área administrativa protegida: elenco, restrições, geração por intervalo de datas, conferência, ajuste manual e publicação.
4. Motor de geração híbrido: algoritmo determinístico **+ IA**, com portão determinístico entre a IA e a publicação.
5. Validação completa e executável de todas as regras, com teste que prova as duas pontas.
6. Publicação por commit via API do GitHub, sem tirar o site do ar e sem rebuild.
7. Histórico de publicações com reversão.

### 3.2 Não entra (declarado)

- Não mexe no repositório `escala-irmaos-2026-mar`. Ele **fica no ar exatamente como está** (decisão do Flavio).
- Não migra a escala das irmãs. O sistema fica preparado, mas a migração é outro passo.
- Não há domínio próprio nesta fase.
- Não há login multiusuário: **um único administrador**.

### 3.3 Identidade do projeto novo

| Item | Valor |
|---|---|
| Nome | `escala-porteiros` |
| Pasta | `D:\Antigravity\Meus-Projetos\escala-porteiros` |
| Repositório | `github.com/flaviocom/escala-porteiros` (público) |
| Site | `https://flaviocom.github.io/escala-porteiros/` |
| Admin | `https://flaviocom.github.io/escala-porteiros/#/admin` |

Nome sem ano e sem mês, porque o sistema passa a administrar **qualquer intervalo de datas** — inclusive 2027 e 2028. Não haverá mais um repositório por período.

---

## 4. Decisões tomadas

| # | Decisão | Quem decidiu |
|---|---|---|
| D-01 | Base é a escala `mar` (01/03/2026 → 30/12/2026) | Flavio |
| D-02 | **Não cravar piso de distanciamento.** Cada irmão o mais distante possível da última escala; o número é descoberto pelo motor e informado | Flavio |
| D-03 | Quando não for possível gerar, o sistema **diz que não foi possível** em vez de entregar escala ruim | Flavio |
| D-04 | Geração por **intervalo de datas definido pelo Flavio**; dentro do intervalo a contagem zera e redistribui com o elenco novo; **o passado não é apagado** | Flavio |
| D-05 | Quatro famílias de restrição: dia da semana, turno, quantidade por mês, **intervalo de datas de ausência** | Flavio |
| D-06 | Cota mensal é **teto**, com aviso quando alguém fica abaixo (hoje há contradição: gerador trata como teto, validação cobra como exato) | Assistente, declarado ao Flavio |
| D-07 | Nome definitivo `escala-porteiros`; repositório antigo permanece intocado | Flavio |
| D-08 | Dados no próprio GitHub (JSON commitado via API), **não** Supabase | Assistente, aprovado pelo Flavio |
| D-09 | **A IA distribui também**, com o portão determinístico entre ela e a publicação | Flavio |
| D-10 | Santa Ceia: **1× por ano**, sem porteiros escalados, dia pulado na distribuição. Data cadastrável e pode estar vazia | Flavio |
| D-11 | Acesso ao admin por **ícone de engrenagem discreto → login e senha**; a senha descriptografa as credenciais guardadas | Flavio |
| D-12 | Mesmo com a contagem zerada, o gerador **lê a última data de cada irmão no bloco anterior** para o distanciamento na fronteira | Assistente, declarado ao Flavio |

---

## 5. Modelo de dados

Três arquivos JSON servidos estaticamente pelo GitHub Pages. Dado é separado de código: mudar a escala **não exige rebuild**.

### 5.1 `dados/pessoas.json`

```jsonc
{
  "versao": 1,
  "pessoas": [
    {
      "id": "thiago",
      "nome": "Thiago",
      "ativo": true,
      "restricoes": {
        "diasPermitidos": [3],           // 0=dom … 6=sáb; ausente = todos
        "diasProibidos": [],             // vetos explícitos
        "turnosPermitidos": ["NOITE"],   // ausente = todos
        "tetoMensal": 2,                 // máximo por mês; ausente = sem teto
        "ausencias": [                   // intervalos de férias/viagem
          { "inicio": "2026-10-10", "fim": "2026-10-25", "motivo": "viagem" }
        ]
      }
    }
  ]
}
```

**Sair da escala é `ativo: false`, nunca apagar.** Blocos passados referenciam a pessoa pelo `id`; apagar o registro deixaria o histórico com nomes órfãos.

### 5.2 `dados/blocos.json`

```jsonc
{
  "versao": 1,
  "blocos": [
    {
      "id": "bloco-2026-03-historico",
      "inicio": "2026-03-01",
      "fim": "2026-08-04",
      "geradoEm": "2026-08-04T14:30:00-03:00",
      "origem": "importado-do-site-antigo",   // ou "algoritmo" | "ia" | "manual"
      "pisoAlcancado": null,                  // desconhecido: veio do site antigo
      "elenco": ["adilson", "carlos_henrique", "..."],
      "malha": { /* ver 5.3 */ },
      "turnos": [
        { "data": "2026-03-01", "tipo": "MANHA", "pessoas": ["flavio", "isac", "leandro"] },
        { "data": "2026-06-07", "tipo": "SANTA_CEIA", "pessoas": [] }
      ]
    }
  ]
}
```

> O `2026-06-07` marcado como Santa Ceia neste exemplo é **dado histórico do site antigo**, preservado como está. A data válida daqui em diante é **16/08/2026** (D-10, A-04).

**Bloco publicado é imutável no trecho que permanece.** Gerar `01/09 → 30/12` **trunca** o bloco anterior em 31/08: o trecho de setembro em diante do bloco velho deixa de valer, e março a agosto permanece byte a byte. Truncar é permitido; reescrever o que ficou, não.

O site público monta a escala **emendando os blocos em ordem cronológica**. É assim que o passado nunca se perde.

### 5.4 Carga inicial

O sistema nasce vazio. A primeira operação é **congelar o que já existe**:

1. Rodar o gerador do site antigo uma única vez (ele é determinístico — produz sempre a mesma escala).
2. Gravar o resultado como **bloco histórico imutável**, do `01/03/2026` até o último culto já realizado.
3. Cadastrar o elenco e as restrições vigentes em `pessoas.json`.
4. Cadastrar `2026-08-16` como Santa Ceia em `config.json`.

Daí em diante, a primeira geração real no sistema novo cobre do **próximo culto até 30/12/2026** — e já nasce com a Santa Ceia na data certa e com o distanciamento maximizado.

> **Decisão operacional do Flavio no primeiro uso:** a escala de agosto já foi divulgada. Regenerar de 05/08 corrige a Santa Ceia mas muda os nomes de agosto para quem já viu. Regenerar só de 01/09 preserva agosto como divulgado, mas aí o dia 16/08 precisa ser esvaziado à mão (uma edição pontual, que a tela de ajuste permite). **Recomendo a segunda**: preserva o combinado e corrige o erro com uma edição cirúrgica.

### 5.3 `dados/config.json`

```jsonc
{
  "versao": 1,
  "capacidadePadrao": 3,
  "malhaPadrao": {
    "regras": [
      { "diaSemana": 0, "turnos": ["MANHA", "NOITE"] },
      { "diaSemana": 3, "turnos": ["NOITE"] },
      { "diaSemana": 6, "turnos": ["NOITE"] },
      { "diaSemana": 6, "turnos": ["TARDE"], "somenteOcorrencia": 1, "rotulo": "ENSAIO" }
    ]
  },
  "santaCeia": ["2026-08-16"],
  "identidade": { "titulo": "Escala Porteiros", "subtitulo": "JD. São Luiz" }
}
```

A malha precisa suportar, no mínimo, as duas variantes já usadas:
- **Atual**: dom manhã+noite · qua noite · sáb noite · 1º sáb tarde (Ensaio)
- **Reforma**: ter noite · sex noite · dom manhã **a cada 14 dias** (exige `cadaNDias` + data-âncora)

---

## 6. Catálogo de regras

Hoje as regras estão misturadas entre "o que o gerador respeita" e "o que a validação cobra", e as duas listas não batem. Aqui elas ficam separadas por natureza, e **cada uma tem validação executável correspondente**.

### 6.1 🔴 DURAS — violou, a escala é rejeitada e não publica

| # | Regra | Existe hoje? |
|---|---|---|
| **D1** | **Capacidade**: cada turno com exatamente N pessoas (padrão 3) | gerador respeita, **validação não confere** |
| **D2** | **Sem repetição no mesmo dia** (ex.: domingo manhã e noite) | ✅ |
| **D3** | **Dias permitidos**: se a pessoa tem lista, só neles | ✅ |
| **D4** | **Dias proibidos**: nunca nos vetados | ✅ |
| **D5** | **Turnos permitidos**: se tem lista, só neles | ✅ |
| **D6** | **Ausência por intervalo de datas** (férias, viagem) | ❌ **não existe** |
| **D7** | **Teto mensal**: não ultrapassa o máximo | ✅ como teto |
| **D8** | **Elenco**: só pessoas ativas no bloco | novo |
| **D9** | **Santa Ceia**: dia marcado não recebe ninguém e não consome cota | parcial (sem cadastro) |

### 6.2 🟡 DE QUALIDADE — o motor maximiza, a validação mede e mostra

| # | Regra | Existe hoje? |
|---|---|---|
| **Q1** | **Distanciamento**: maximizar o menor intervalo de cada pessoa | ❌ é só desempate |
| **Q2** | **Equilíbrio de carga** dentro do bloco | ✅ funciona bem |
| **Q3** | **Variedade de dia/turno**: evitar alguém sempre no mesmo dia da semana | ❌ |
| **Q4** | **Variedade de companhia**: evitar o mesmo trio se repetindo | ❌ |
| **Q5** | **Piso mensal**: avisar se quem tem teto de 3/mês ficou com menos | ❌ (hoje **reprova**, o que é pior) |

### 6.3 Restrições vigentes do elenco atual (16 irmãos)

| Irmão | Restrição |
|---|---|
| Thiago | Só quarta · só noite · teto 2/mês |
| Williams | Teto 3/mês |
| Adilson | Só domingo · só noite |
| Eduardo, Elson, Carlos Henrique | Nunca em quarta |
| Donizete, Flavio, Isac, Leandro, Lucas, Luis Henrique, Luiz Felipe, Luíz Cezar, Marcos, Vicente | Sem restrição |

---

## 7. Como o piso de distanciamento é descoberto

**O número nunca é arbitrado.** O motor calcula o piso teórico, tenta, e desce até caber.

Exemplo real, bloco 01/09 → 30/12/2026 com a malha atual:

> 73 turnos × 3 vagas = **219 vagas** para **16 pessoas** em **121 dias**
> → ~13,7 escalas por pessoa → **1 a cada 8,8 dias**

O motor tenta gerar com piso **8**. Não fechou, tenta **7**. Depois **6**. E assim por diante. A tela informa o resultado:

> *"Piso alcançado: 6 dias. Tentei 8 e 7 — não foi possível cobrir todos os turnos."*

O piso é calculado **por pessoa**, não global: Adilson só pode aos domingos à noite, então o teto natural dele é 7 dias e seria injusto cobrar dele o mesmo dos irmãos sem restrição. O piso individual parte do número de turnos elegíveis para aquela pessoa no intervalo.

Se não fechar nem com piso 1, o sistema **declara que não foi possível gerar** e mostra onde travou (D-03).

---

## 8. Motor de geração — três passos

### Passo 1 — Algoritmo gera a base
Busca com retrocesso, instantânea e gratuita. Garante as 11 regras duras por construção e descobre o maior piso possível. **É a rede**: sempre existe uma escala válida na mesa, independentemente do que a IA fizer.

### Passo 2 — IA gera a proposta dela
Recebe elenco, restrições, malha, última data de cada pessoa no bloco anterior e a base do algoritmo como referência. Devolve a distribuição em JSON estruturado.

**Fatiado mês a mês.** Um bloco de 4 meses seriam 219 nomes numa resposta só; mês a mês a taxa de erro cai e a correção fica barata. O estado acumulado (quem pegou quanto, quando foi a última vez) é passado adiante a cada fatia.

### Passo 3 — O portão julga as duas
1. Proposta que viola **regra dura** é **reprovada**, com o motivo em tela.
2. A IA recebe a lista de violações e tenta de novo — **até 3 vezes**.
3. As propostas válidas vão para um **placar lado a lado**: menor intervalo por pessoa, diferença entre quem mais e quem menos pegou, repetição de trios, variedade de dias.
4. **O Flavio escolhe qual publicar.**
5. A IA escreve, em português, por que fez as escolhas dela e onde teve que ceder.

**Degradação obrigatória:** se a chave da IA faltar ou os créditos acabarem (já aconteceu ao Flavio em outro projeto), o passo 2 é pulado, a tela avisa, e a base do algoritmo segue disponível para publicação. **A escala nunca fica refém de crédito de API.**

### 8.1 Papéis adicionais da IA

| Papel | O que faz |
|---|---|
| **Explicação** | "Não fechei 12/09 com 3 pessoas porque no intervalo só sobraram 4 disponíveis e 2 estavam a menos de 5 dias da última escala" |
| **Arbitragem** | Quando não fecha, propõe **quais** regras afrouxar, em que ordem e a que custo — e o Flavio escolhe |
| **Auditoria** | Segunda opinião sobre a escala pronta, caçando o que a regra não pega: mesmo trio repetido, alguém sempre no mesmo dia da semana, mês pesado demais para alguém |
| **Entender o pedido** | "tira o Leandro, entra o Rafael, só sábado, viaja de 10 a 25/10" → vira cadastro estruturado **para conferência antes de aplicar** |

**A IA nunca é a única validação.** Ela opina *depois* do portão determinístico, jamais no lugar dele.

---

## 9. Área administrativa

Ícone de **engrenagem discreto** no rodapé do site público → tela de login → área administrativa.

| Tela | O que faz |
|---|---|
| **Elenco** | Cada pessoa num cartão com as restrições como etiquetas. **X remove** (desativa). **+ adiciona**, com formulário cobrindo as quatro famílias de restrição |
| **Gerar** | Escolher o intervalo de datas, conferir malha e datas de Santa Ceia. Mostra a conta do piso **antes** de gerar |
| **Conferir** | Placar das duas propostas, validação regra por regra, explicação da IA, opções de afrouxamento quando algo não fecha |
| **Ajustar** | Trocar pessoa num turno arrastando ou clicando, com validação recalculando **na hora**. Aviso aparece antes de soltar |
| **Publicar** | Prévia do que muda (quantos turnos, quem entra e quem sai) e só então grava |
| **Histórico** | Toda publicação listada com data e resumo. **Reverter em um clique** |

### 9.1 Denominação na tela — regra global

`_padroes-globais/DENOMINACAO_SEM_JARGAO_DE_IA.md` vale aqui integralmente, com a fronteira que a
regra estabelece:

| Onde | Regra |
|---|---|
| **Texto que alguém lê** — tela, botão, tooltip, mensagem de erro, URL | 🔴 nunca "IA", "inteligência artificial", "prompt", "chatbot", "GPT". Diz-se **"motor"**, **"motor de distribuição"**, **"sugestão do motor"** |
| **Código e documentação técnica** — variável, arquivo, rota interna, comentário, este documento | ✅ nome técnico mantido, para não criar dialeto privado que quebre a portabilidade |

Na prática, o placar da §8 compara **"Proposta A — algoritmo"** e **"Proposta B — motor"**, nunca
"proposta da IA". Portão: `scripts/medir-denominacao-sem-ia.mjs`, provando **as duas pontas** —
acusa o infrator e absolve a negação legítima.

---

## 10. Segurança e credenciais

### 10.1 A senha destrava as credenciais

O token do GitHub e a chave da IA ficam no `localStorage` **criptografados com a senha do Flavio** (AES-GCM, chave derivada por PBKDF2 via WebCrypto). Sem a senha, o token armazenado é inútil mesmo para quem estiver com o aparelho na mão.

O login **não é enfeite**: ele é a chave de decifragem, não uma comparação de string.

### 10.2 Limites declarados com honestidade

- O site é estático e público. Quem descobrir `#/admin` **vê a tela**. O que ele não consegue é destravar as credenciais nem publicar.
- A proteção real da publicação é o **token**, não a senha.
- O token é **fine-grained**, com permissão de conteúdo **num único repositório**, revogável num clique.

### 10.3 Regra fixa sobre credenciais

**O assistente nunca digita, lê, copia ou transcreve o valor de senha, token ou chave.** Ele prepara o campo, cadastra a linha vazia na central de credenciais com a instrução, abre a página certa e deixa **um único passo** para o Flavio. Quem cola o valor é sempre o Flavio.

Credenciais necessárias (a cadastrar por nome na central, nunca por valor):
- `GITHUB_PAT_ESCALA_PORTEIROS` — fine-grained, Contents: write, só em `flaviocom/escala-porteiros`
- `ANTHROPIC_API_KEY_ESCALA` — para o motor de IA no navegador do admin

---

## 11. Publicação e reversão

1. **Publicar** grava `dados/blocos.json` (e `pessoas.json`/`config.json` quando mudarem) pela API do GitHub — **um commit por publicação**, com mensagem descritiva.
2. O Pages serve o arquivo novo em cerca de um minuto. **Sem rebuild** (dado ≠ código) e **sem o site sair do ar** em momento nenhum.
3. **Reverter** é reverter o commit — pela própria tela de histórico.
4. **Rede de segurança**: botão "baixar JSON" sempre presente, para o dia em que o token expirar ou a API falhar.

Como o Pages roda em modo branch e o workflow `deploy.yml` do projeto antigo falha, o build do site continua sendo **commitado na raiz** — caminho já comprovado em produção. Mudança de *dado* não passa por esse caminho.

---

## 12. Achados no projeto atual (medidos, não presumidos)

O algoritmo foi executado e o resultado medido em `America/Sao_Paulo` e `Europe/Lisbon`.

### 12.1 O que funciona

| Medição | Resultado |
|---|---|
| Período | 01/03/2026 → 30/12/2026 · 184 turnos · 549 vagas |
| Turnos incompletos | **0** de 183 |
| Distribuição entre os 14 sem cota | **35–36 turnos** cada |
| Cota do Thiago | 2/mês nos 10 meses ✅ |
| Cota do Williams | 3/mês nos 10 meses ✅ |

### 12.2 Defeitos confirmados

| # | Defeito | Prova |
|---|---|---|
| **A-01** | **Distanciamento não é regra** | Williams tem **7 casos de intervalo de 1 dia** (ex.: sáb 04/04 → dom 05/04). No total, **18 pares com ≤3 dias** |
| **A-02** | **O caso "quarta → sábado" acontece hoje** | 6 ocorrências, todas do Williams: 01/04→04/04, 03/06→06/06, 01/07→04/07, 02/09→05/09, 04/11→07/11, 02/12→05/12 |
| **A-03** | **Validação não confere o que a especificação promete** | `ESPECIFICACAO_PROJETO.md` §4.2 promete validar "espaçamento mínimo" e "capacidade por turno". `runValidation()` tem 6 regras e **nenhuma é espaçamento ou capacidade** |
| **A-04** | 🔴 **Data da Santa Ceia errada no site no ar** | Código tem `2026-06-07`. A data correta é **16/08/2026** — **daqui a 12 dias**. Como 16/08 é domingo, o site vai exibir 3 porteiros de manhã e 3 à noite num dia sem escala |
| **A-05** | **Ausências por data não existem** | A especificação promete "restrições de datas (férias, compromissos)"; o tipo `constraints` só tem dia-da-semana. Não há campo de data |
| **A-06** | **Regras duplicadas e por nome-texto** | `runValidation()` procura `'Thiago'`, `'Williams'`, `'Adilson'` por string. **Remover alguém deixa a validação inerte, sem erro visível** |
| **A-07** | **Contradição teto × exato** | `canTakeShift` trata `fixedPerMonth` como teto; `runValidation` reprova se `count !== fixedPerMonth`. Se alguém ficar abaixo, a validação acusa falha sem que haja falha |
| **A-08** | **Nada é persistido** | A escala é recalculada no navegador a cada abertura |
| **A-09** | **Workflow morto** | `deploy.yml` falha há meses; quem publica é o Pages nativo |

### 12.3 Não confirmado (medido e descartado)

A chave de mês usa `toISOString()` (UTC) em vez da data local, o que seria frágil para quem abrisse o site em fuso positivo. **Medi nos dois fusos e o resultado não mudou** nesta escala. Fica registrado como fragilidade de construção, **não** como defeito ativo. No projeto novo, datas serão sempre locais (`America/Sao_Paulo`).

---

## 13. Portões e testes

### 13.1 O portão precisa morder (as duas pontas)

Para **cada** uma das 11 regras duras e 5 de qualidade:
- um teste que injeta uma escala **com a violação proposital** e prova que a validação **reprova**;
- um teste que prova que a validação **aprova** a escala limpa.

Sem as duas pontas, uma validação pode nascer sempre-vermelha ou sempre-verde e passar por acerto.

### 13.2 Nenhuma regra sem validação correspondente

Regra escrita e não executada é o defeito que este projeto já tem (A-03). O portão de build **falha** se existir regra no catálogo sem teste correspondente.

### 13.3 Validação ao vivo

Antes de declarar pronto: abrir o site publicado no navegador, conferir a escala contra o `blocos.json`, publicar uma alteração de teste e reverter. Portão verde no computador **não** é portão verde em produção.

---

## 14. Riscos e limites declarados

| Risco | Mitigação |
|---|---|
| Token de escrita no navegador | Fine-grained, um repositório, permissão de conteúdo, criptografado pela senha, revogável num clique |
| IA propõe escala inválida | Portão determinístico entre a IA e a publicação; até 3 tentativas com as violações em mãos; base do algoritmo sempre disponível |
| Créditos da IA acabarem | Passo 2 é pulado com aviso; o algoritmo continua gerando e validando |
| Propagação do Pages (~1 min) | A tela avisa e oferece link para conferir; o site nunca fica fora do ar |
| Perder o histórico | Bloco publicado é imutável; pessoa é desativada, nunca apagada; toda publicação é um commit reversível |
| Escala impossível de gerar | O sistema declara que não foi possível e mostra onde travou, com as opções de afrouxamento (D-03) |

---

## 15. Conformidade com os padrões globais

`D:\Antigravity\_padroes-globais\` foi lido integralmente em 04/08/2026 (17 documentos, 4 skills,
template). O que ele obriga neste projeto:

### 15.1 Portabilidade entre IAs — os três arquivos são portão

O pré-voo rodado em 04/08/2026 **reprovou com exit 1**: `AGENTS.md`, `ESTADO.md` e `BACKLOG.md`
ausentes. Antes da primeira linha de código de produto:

1. Copiar `_padroes-globais/template-projeto/` para a raiz.
2. Preencher os três **sem placeholder** — `{{…}}` remanescente é o mesmo defeito do ERRO 3
   (garantia escrita junto com a intenção).
3. Preencher `docs/pre-voo.json` e `docs/regimes-documentos.json` com a realidade deste projeto.
4. Rodar o pré-voo **até ficar verde**.

Teste de portabilidade (§5 da regra): abrir só esses três arquivos e responder — o que é o projeto?
o que está no ar? qual o próximo item? o que não posso fazer sem perguntar? como rodo o portão?
Qualquer resposta que exija um quarto arquivo é lacuna, e corrige-se no ato.

### 15.2 Soberania de dados — este projeto tem fontes externas

Duas, e ambas com custo:

| Fonte | O que entrega | Frequência | Custo | Se cair |
|---|---|---|---|---|
| **API do GitHub** (Contents) | grava e lê os JSON de dados | por publicação | gratuita nos limites da conta | não publica; o botão "baixar JSON" é a rede |
| **API da Anthropic** | a proposta do motor, a explicação e a auditoria | por geração | por token, **conta separada** | o passo 2 é pulado; o algoritmo continua gerando |

Vira `docs/INVENTARIO_DE_FONTES.md`, **gerado por script**, nunca escrito à mão. E a pergunta que a
regra manda fazer — *"pagamos por algo derivável?"* — tem resposta honesta aqui: **a distribuição é
derivável** (o algoritmo faz de graça). O que se paga é a leitura da situação e a explicação. É uma
escolha, e está declarada como tal.

### 15.3 Credenciais

Duas, cadastradas na central **por nome** no mesmo passo em que nascerem:

- `GITHUB_PAT_ESCALA_PORTEIROS` — fine-grained, Contents: write, só em `flaviocom/escala-porteiros`
- `ANTHROPIC_API_KEY_ESCALA` — motor no navegador do administrador

Antes de pedir qualquer uma: **abrir a central e conferir** se já existe. E o padrão que a regra
manda usar quando o Flavio precisa colar um segredo é **um arquivo que ele clica**, não um comando
que ele monta — `.cmd` na Área de Trabalho, com caminho absoluto, explicação antes de agir, aviso de
que "nada aparece na tela enquanto você cola, é proposital", e `pause` no fim.

### 15.4 Git e GATE

- **Autor obrigatório:** `Flavio Oliveira <brflaviooliveira@gmail.com>`
- **GATE:** typecheck + suíte **completa** (nunca escopada) + build. Sem pipe mascarando o código de
  saída — `cmd | head && echo OK` imprime OK com o comando vermelho.
- **`.gitignore` exclui `.claude/` e `.agents/`** antes do primeiro deploy (ERRO 26: symlink de
  ferramenta de agente já derrubou um empacotamento).

### 15.5 Registro

`AI_MASTER_LOG.md` e `DIARIO_DE_BORDO.md` (solicitação → pesquisa → decisão → **porquê** → como
reverter), com rotação automática ao estourar o teto: vivo divide por **assunto**, histórico fatia
por **período** em `docs/historico/` com índice. **Nada é excluído, nunca.**

### 15.6 Auditoria independente

Pelo peso desta mudança — projeto novo, com portões e com um motor que decide por pessoas —
**2 auditores em frentes disjuntas**, com instrução **adversarial**: mandados de achar defeito, não
de confirmar. Cada um cita `arquivo:linha` e prova com comando e saída real. **Relatório sem achados
é suspeito.**

---

## 16. Anteparos que mordem especificamente neste projeto

Do catálogo de 30 erros, estes são os que a natureza deste trabalho convida:

| Erro | Como apareceria aqui | O que fazer |
|---|---|---|
| **ERRO 23** — parcial disfarçado de completo | Importar o histórico e trazer 150 dos 184 turnos sem ninguém notar | **Contar as duas pontas**: o gerador antigo produz N turnos; o bloco importado precisa ter N. Falhar explicitamente se divergir |
| **ERRO 12** — produzido ≠ ligado | `blocos.json` commitado e o site continuar lendo do gerador antigo | O portão pergunta **"o consumidor já tem?"**, e a resposta vem do site, não do disco |
| **ERRO 27** — três verdes sobre trabalho parado | Commit cair em branch errada, `push` dizer "up-to-date", e `main` intacta | Ler o `--stat` inteiro e **conferir que `main` mudou** — não só o "push OK" |
| **ERRO 17** — teste verde testando o vazio | Teste do gerador que só exercita caminhos de recusa | Pelo menos **um teste do caminho feliz** que afirma que a escala saiu completa |
| **ERRO 10** — a rede não pega o caso que existe para pegar | Elenco vazio, bloco de um dia só, todo mundo com ausência no mesmo período | Escrever **primeiro** os casos-limite que a proteção deve pegar |
| **ERRO 20** — portão com escopo implícito | Validação que confere 8 das 11 regras duras e não avisa | Enumerar o universo de regras **primeiro**; exceção é declarada e contada |
| **ERRO 15** — herdar diagnóstico sem reconferir | Acreditar que a Santa Ceia é 07/06 porque está no código | A fonte diz o que **é**; o registro diz o que **era**. Já mordeu: a data correta é 16/08 |
| **ERRO 29** — rótulo lido como veredito | Interpretar um assunto citado numa lista como decisão tomada | Decisão de produto **vem com verbo**. Na dúvida entre nomear e escolher, é nomear |

---

## 17. Fora de escopo — possível futuro

- Migrar a escala das irmãs para o mesmo sistema (a estrutura já suporta).
- Cada irmão pedir a própria ausência (exigiria multiusuário e, aí sim, um banco).
- Domínio próprio.
- Notificação automática no WhatsApp quando a escala mudar.
- Restrição de par (duas pessoas que não devem, ou devem, ficar no mesmo turno).
