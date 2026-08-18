# ESTADO — escala-porteiros

> **Onde o projeto está agora.** Documento **vivo**: sobrescrito, não acumulado.
>
> **Última atualização:** 18/08/2026 · **Fuso:** America/São_Paulo
>
> **Cadeia de navegação, nesta ordem:**
> **`ESTADO.md` (você está aqui)** → [`handoff mais recente`](docs/handoff/HANDOFF_2026-08-18-b.md) → [`BACKLOG.md`](BACKLOG.md)
> *onde estamos · o que aconteceu na última sessão e por quê · o que fazer a seguir*
>
> **Reconstruir do zero (portabilidade entre IAs):** [`docs/RECONSTRUIR.md`](docs/RECONSTRUIR.md)
> **Roteador do projeto:** [`AGENTS.md`](AGENTS.md) ·
> **Solicitações:** [`docs/solicitacoes/INDICE_DE_SOLICITACOES.md`](docs/solicitacoes/INDICE_DE_SOLICITACOES.md) ·
> **Histórico:** [`docs/historico/INDICE.md`](docs/historico/INDICE.md) ·
> **Fontes de dados:** [`docs/INVENTARIO_DE_FONTES.md`](docs/INVENTARIO_DE_FONTES.md)

---

## 🪑 MESA DO DONO

> Recado do Flavio para quem assumir a sessão — lido ANTES de tudo o mais. **Vazio agora.** Como
> usar: o dono escreve aqui em texto livre (prioridade, decisão, contexto que não cabe no
> `BACKLOG.md`); a sessão seguinte lê isto primeiro, ao abrir o `ESTADO.md` — ordem de leitura
> completa (e por quê) em [`AGENTS.md`](AGENTS.md) — e apaga o recado depois de atender: esta mesa
> nunca acumula.

*(nada na mesa agora)*

---

## Handoff ativo

Sem handoff ativo.

Formato em `COEXISTENCIA_HANDOFF_E_CONTEXTO.md`, dos padrões globais — usar quando houver troca de
agente/harness ou trabalho paralelo em arquivos disjuntos.

---

## Em uma frase

**O produto está no ar, divulgado e em uso: os irmãos consultam a própria escala pelo site**
(palavras do dono, 08/08 — S-054). Auditado por fora CINCO vezes, escala de 06/08 a 31/12 publicada
e conferida, o nome do cliente fora do código. **P0 e P1 estão sem item aberto** — a única
credencial em aberto é a chave do motor, **opcional**; nada trava sem ela.

## O mais recente: 3 defeitos achados sem pedido, numa sessão que começou como "resume" (18/08)

10 dias sem sessão. A cópia local tinha ficado 6 commits atrás do `origin/main` — reconciliada
(`git reset --hard`) antes de qualquer dado errado ser empurrado. Com a cópia certa, `vivo:no-ar`
saiu verde mas com aviso `DEP0190` (corrigido: `execFileSync`+`shell:true` → `execSync` + guarda
testável, mesma classe que o P2.16 já baniu uma vez); `npm run citacoes` estava VERMELHO por
citações cruzando para o repositório charmway-erp num documento de comparação — corrigidas 6,
duas delas com **conteúdo errado** que o portão não detecta (prova arquivo+linha, não conteúdo); e
**P5.3 fechado com fonte oficial** (teto geral do GitHub, ~997 anos de folga no ritmo atual — era
"por medir" desde 08/08 por falta de rede). Detalhe: [`HANDOFF_2026-08-18.md`](docs/handoff/HANDOFF_2026-08-18.md) · [DB-053](DIARIO_DE_BORDO.md).

**Rotação do próprio documento:** este arquivo estourou o teto do regime "vivo" (400 linhas) nesta
mesma sessão — o narrativo de 04/08 a 08/08 (auditorias, o que entrou em cada dia) mudou para
[`docs/HISTORICO_ESTADO_2026-08.md`](docs/HISTORICO_ESTADO_2026-08.md), regime referência. Nada foi
perdido; é o mesmo texto, movido por assunto.

## Onde roda

| | |
|---|---|
| Site | **https://flaviocom.github.io/escala-porteiros/** |
| Área administrativa | **https://flaviocom.github.io/escala-porteiros/#/admin** |
| Repositório | [`flaviocom/escala-porteiros`](https://github.com/flaviocom/escala-porteiros) — público |
| Publicação | GitHub Pages, modo branch, `main` + `/docs` |
| Usuários | 16 irmãos porteiros + 1 administrador |

⚠️ **O site antigo continua no ar e intocado**, como decidido: `escala-irmaos-2026-mar`.

### 🔴 A pasta local é lenta a ponto de inviabilizar o desenvolvimento

Medido em 04/08/2026, com o disco em repouso: escrever 100 arquivos pequenos leva **79.844 ms em
`D:`** contra **45 ms em `C:`** — **0,8 segundo por arquivo**, cerca de **1.775× mais lento**. Um
`npm install` (~30 mil arquivos) levaria **horas**; na cópia em `C:` levou **14 segundos**.

Não é "disco lento": é antivírus varrendo cada escrita, ou disco com defeito. **Enquanto isso não for
resolvido, o build e os testes rodam numa cópia em `C:`**, e o GitHub é a ponte:

```bash
git clone https://github.com/flaviocom/escala-porteiros.git /c/.../build-escala-porteiros
# trabalha, testa e publica de lá; a pasta em D: recebe por `git pull`
```

⚠️ Junção (`mklink /J`) **não resolve**: o npm apaga um `node_modules` que não seja diretório real
(`npm warn reify Removing non-directory`).

## O que está em curso

**Nada em execução.**

**A imagem que vai para o WhatsApp tem layout próprio** (partes 7 e 8), no modelo do arquivo que o
Flavio usa — com os nomes em **colunas alinhadas** e um **seletor de meses** antes de gerar. A anterior fotografava a tela e **fatiava em 5 dias** — numa escala de cinco meses, saíam cinco
dias. Agora o período inteiro cabe, e o filtro é o mesmo da tela. Exemplo em
`capturas/exemplo-2026-08.png` — ⚠️ `capturas/` está no `.gitignore`, então quem clonar o repositório
não encontra o arquivo: **regerar com `npm run imagem`**, que é rápido e usa o dado publicado.

🔴 **O achado mais consequente do dia veio de mapear o grafo de importações** (parte 6):
`definirPessoas` filtrava por `ativo` e, com isso, **quem saísse do elenco perdia o passado na
tela** — nome virava id cru, a busca não o achava, e os turnos dele sumiam das estatísticas. Sem
erro, sem tela branca: **silencioso**. Latente hoje (as 16 pessoas estão ativas), certo no primeiro
uso do recurso que originou o projeto. Corrigido, com 5 testes e uma frente nova na auditoria.

**O cenário que originou o projeto está provado de ponta a ponta:** `npm run ensaio` tira o mais
escalado, põe um irmão com as **quatro** famílias de restrição de uma vez, refaz a escala e mede
**11 promessas** — inclusive que o passado fica byte a byte idêntico. 11 de 11.

**Na quinta parte**, sem tarefa na lista, a ordem foi conferir a afirmação mais consequente que
nunca tinha sido testada: o histórico congelado foi montado a partir do **código** do site antigo,
nunca contra o que ele **mostra na tela**. Conferido dia a dia:
**66 de 66 dias, 282 nomes, 0 divergências.** A promessa *"você não vai apagar o passado"* está
medida, não presumida.

E a ponta simétrica também foi fechada: **o site novo mostra o que o dado diz** — 131 dias, 543
escalações, 0 divergências, com a Santa Ceia conferida pelos dois lados (o aviso aparece, e nenhum
dos 16 irmãos está na tela). `npm run vivo:conferir`.

🔴 **E apareceu um achado de lado:** o **site antigo não mostra o passado**. Ele lista do dia de hoje
em diante — um irmão que abra aquele link hoje **não vê março a julho**, só digitando a data na
busca. O site novo mostra, porque ali o passado é dado congelado. Virou P1.3.

**Na quarta parte** entraram a Regra Mestra 3 (tooltips 17%→100%), o README, a validação em celular
(alvo de toque de 16px corrigido para 44px) e a decisão declarada de **não** implementar
arrastar-e-soltar.

**Na terceira parte** entraram os dois últimos itens: **P3.10** (histórico com reversão — que
revelou `historicoPublicacoes()` sem consumidor, o ERRO 12 no código desta própria sessão) e
**P2.10** (auditoria adversarial: 17 checagens, **2 achados corrigidos**).

🔴 O achado mais sério: **pessoa desativada escalada era APROVADA** pela validação. O gerador já
barrava, mas o ajuste manual e os blocos importados abriam a porta — que é exatamente o cenário
deste projeto. Corrigido, com teste.

⚠️ Aquela auditoria foi feita por quem escreveu o código, e o método dizia que não bastava.
**Isso foi resolvido em 04/08/2026** — ver a seção do topo.

## O que bloqueia

| O que | De quem depende |
|---|---|
| O motor funcionar | 👤 Flavio cola `ANTHROPIC_API_KEY_ESCALA` (opcional — sem ela o algoritmo segue) |
| Desenvolver na pasta `D:` | 👤 Flavio decide se investiga o antivírus/disco |

✅ **Publicar pela tela deixou de bloquear em 06/08** — o token está no navegador dele, provado
pelos commits de dados com autor via API (DB-050).

O pré-voo **não reprova mais** por causa do disco: a ausência de `node_modules` em `D:` é proposital
e agora está declarada em `docs/pre-voo.json`, com motivo escrito. Ela aparece no relatório em ⚪ com
a explicação ao lado, em vez de 🔴 sem contexto — e a checagem continua acusando instalação parcial.

## Como retomar

1. Leia [`AGENTS.md`](AGENTS.md).
2. Leia este arquivo e o [`BACKLOG.md`](BACKLOG.md).
3. Rode o pré-voo: `node D:/Antigravity/_padroes-globais/scripts/pre-voo.mjs .`
4. Clone numa pasta em `C:` antes de rodar `npm install` — ver o aviso acima.

**Você não precisa perguntar ao Flavio onde paramos.** Se este arquivo não responde isso, ele está
desatualizado — e atualizá-lo é parte de fechar qualquer passo.
