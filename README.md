# Escala de Porteiros — CCB Jd. São Luiz

Site da escala de porteiros da Congregação Cristã no Brasil, Jardim São Luiz (Barueri/SP), **com
área administrativa**: gera, valida e publica a escala sem tirar o site do ar.

**🔗 <https://flaviocom.github.io/escala-porteiros/>**

---

## O que ele resolve

Antes, trocar uma pessoa de lugar exigia **editar código-fonte e refazer o deploy**. A escala não era
um dado guardado: era uma função que a recalculava a cada abertura do navegador. Não havia como
editar porque não havia o que editar.

Aqui a escala é **dado publicado**. Sai gente, entra gente, muda restrição — e a escala nova vai ao
ar por uma tela, em um minuto.

## As regras, e por que elas existem

O coração do projeto é um **catálogo único de regras** que o gerador consulta e a validação percorre
inteiro. No site anterior essas duas listas eram diferentes, e a diferença era invisível.

**11 regras duras** — violou, não publica: capacidade do turno · ninguém duas vezes no mesmo dia ·
dias permitidos · dias proibidos · turnos permitidos · ausências (férias, viagem) · teto mensal ·
elenco (e ativo) · Santa Ceia conferida contra o calendário · coerência do piso declarado ·
cobertura do período.

**5 de qualidade** — o gerador maximiza, a validação mede e mostra: distanciamento · equilíbrio de
carga · variedade de dia da semana · variedade de companhia · piso mensal.

Cada uma tem teste que **reprova um infrator injetado e aprova o caso limpo**. Provar só um lado não
distingue um portão que funciona de um sempre-verde.

## O distanciamento não tem número fixo

A decisão que define o gerador. Um piso cravado inviabiliza a escala quando o elenco encolhe — então
ele é **descoberto**: calcula-se o maior espaçamento que a folga permite, tenta-se, e desce-se até
caber. O número final é informado junto com os que não deram:

> *"Piso alcançado: 6 dias. Tentei 9, 8, 7 — não foi possível cobrir todos os turnos."*

E se não couber nem no mínimo, o sistema **diz que não foi possível** e mostra onde travou. Nunca
entrega escala pela metade em silêncio.

## Como funciona por baixo

Site estático no GitHub Pages. Os dados vivem em `docs/dados/*.json` e são publicados **por commit
via API do GitHub** — o que dá histórico e reversão de graça. Mudar a escala **não exige rebuild**,
porque dado não é código.

O token fica só no navegador do administrador, **cifrado pela senha dele** (PBKDF2 + AES-GCM): sem a
senha, o que está guardado é ruído.

## O motor

Além do algoritmo, um motor de sugestão propõe a própria distribuição. **O portão determinístico fica
entre a proposta e a publicação**: o que viola regra é reprovado e devolvido com a lista de
violações. As duas escalas válidas vão para um placar, e a escolha é de quem administra.

Sem chave do motor, tudo o mais continua funcionando.

## Rodando

```bash
npm install
npm run dev      # http://127.0.0.1:5173
npm run gate     # typecheck · testes (2 fusos) · denominação · fontes · contagem · cadeia · genérico · auditoria · regras-mestras · build
```

O GATE encadeia **doze** passos. Os mais incomuns, e o porquê:

| Passo | O que prova |
|---|---|
| `test:fuso:berlim` | a suíte inteira noutro fuso, **depois de provar que o fuso mudou** — em UTC−3 um defeito de fuso é invisível |
| `denominacao` | nenhum jargão comoditizado em texto que alguém lê |
| `fontes` | nenhuma fonte externa chamada e não declarada no inventário |
| `auditoria` | **20** ataques ao próprio código, com infrator injetado |
| `generico` | nenhum nome de cliente cravado — o produto é genérico (§0 do `AGENTS.md`) |
| `generico:autoteste` | prova que o portão acima **morde**: 15 casos, infratores e limpos |
| `contagem` · `cadeia` | o catálogo de regras e a cadeia de documentos batem com o que se afirma |

## Onde ler mais

| | |
|---|---|
| Como se trabalha aqui | [`AGENTS.md`](AGENTS.md) — o roteador |
| Onde o projeto está | [`ESTADO.md`](ESTADO.md) |
| O que aconteceu, e por quê | [`docs/handoff/INDICE.md`](docs/handoff/INDICE.md) |
| O que falta | [`BACKLOG.md`](BACKLOG.md) |
| O desenho completo | [`docs/superpowers/specs/`](docs/superpowers/specs/2026-08-04-area-administrativa-escala-design.md) |
| De onde vem cada dado | [`docs/INVENTARIO_DE_FONTES.md`](docs/INVENTARIO_DE_FONTES.md) |

---

Sucessor de [`escala-irmaos-2026-mar`](https://github.com/flaviocom/escala-irmaos-2026-mar), que
continua no ar e não é tocado.
