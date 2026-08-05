# ESTADO — escala-porteiros

> **Onde o projeto está agora.** Documento **vivo**: sobrescrito, não acumulado.
>
> **Última atualização:** 04/08/2026 · **Fuso:** America/São_Paulo
>
> **Cadeia de navegação, nesta ordem:**
> **`ESTADO.md` (você está aqui)** → [`handoff mais recente`](docs/handoff/HANDOFF_2026-08-05-b.md) → [`BACKLOG.md`](BACKLOG.md)
> *onde estamos · o que aconteceu na última sessão e por quê · o que fazer a seguir*
>
> **Roteador do projeto:** [`AGENTS.md`](AGENTS.md) ·
> **Solicitações:** [`docs/solicitacoes/INDICE_DE_SOLICITACOES.md`](docs/solicitacoes/INDICE_DE_SOLICITACOES.md) ·
> **Histórico:** [`docs/historico/INDICE.md`](docs/historico/INDICE.md) ·
> **Fontes de dados:** [`docs/INVENTARIO_DE_FONTES.md`](docs/INVENTARIO_DE_FONTES.md)

---

## Em uma frase

**O produto está pronto, no ar e agora auditado por fora**: site, área administrativa, motor,
histórico com reversão, 16 regras com portão dos dois lados, e o passado congelado **conferido contra
a tela do site antigo**. Falta só o que depende do Flavio — as duas credenciais.

## O que acabou de entrar: a auditoria independente (P2.10)

Era o único item autônomo em aberto, e o método se recusava a dar o projeto por encerrado sem ele:
*"quem auditou escreveu o código"*. **Seis auditores em frentes disjuntas, mandado adversarial,
obrigados a provar com comando e saída real. Vinte achados** — nenhum deles visto pela
autoverificação, que roda 20 checagens todo dia. Os quatro mais graves:

| O que estava errado | Por que ninguém tinha visto |
|---|---|
| **Bloco VAZIO era aprovado "sem ressalvas"** — e é isso que destrava o Publicar | as 15 regras percorriam `turnos`; sem turnos, todas respondiam "nada a apontar" |
| **D9 era cega ao calendário da Santa Ceia** — conferia o bloco contra ele mesmo | `Contexto` não carregava a configuração. É o defeito que originou o projeto |
| **Três portões não mordiam** — o de fontes ignorava `scripts/` inteiro | infrator injetado passava verde; ninguém tinha atacado os portões |
| **O verde "ao vivo" podia ser de outro código** | o vite ficava órfão no Windows e a execução seguinte falava com ele — chegou a aprovar um **bundle antigo** |

**Consertados e provados nas duas pontas.** Dois portões novos (`contagem`, `cadeia`) existem porque
número escrito à mão e ponteiro mantido à mão apodrecem sozinhos — o `AGENTS.md` apontava para a
parte 4 de 7 como se fosse a última. Detalhe em [`HANDOFF_2026-08-04-i.md`](docs/handoff/HANDOFF_2026-08-04-i.md).

⚠️ **Sete achados menores ficaram abertos**, em P4 do [`BACKLOG.md`](BACKLOG.md), com `arquivo:linha`
e reprodução. Nenhum bloqueia o uso.

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

## O que acabou de entrar

**O núcleo, medido e testado.** 16 regras num catálogo único (11 duras + 5 de qualidade), cada uma
com teste que **reprova um infrator injetado e aprova o caso limpo** — 55 testes verdes.

**O gerador descobre o piso de distanciamento** em vez de recebê-lo cravado. Na escala real ele
relatou: *"Piso alcançado: 6 dias. Tentei 9, 8, 7 — não foi possível cobrir todos os turnos."*

**O defeito que motivou o projeto está consertado**, e a prova é numérica:

| | Site no ar hoje | Bloco novo (05/08 → 30/12) |
|---|---|---|
| Menor intervalo | **1 dia** (Williams, 7 casos) | **6 dias** |
| Pares com ≤3 dias | **18** | **0** |
| Quarta → sábado | 6 casos | **0** |
| Santa Ceia | 07/06 errada; 16/08 com 6 escalados | **16/08 correta, 0 escalados** |
| Validação | 6 regras, nenhuma de espaçamento ou capacidade | **15 de 15** |
| Testes | nenhum | **71**, verdes em 2 fusos |
| Equilíbrio | — | 16–17 turnos, diferença de **1** |

**A área administrativa está no ar**: elenco com X para tirar e + para acrescentar, as quatro
famílias de restrição, geração por intervalo de datas, conferência regra a regra e publicação por
commit. Publicar fica **bloqueado** enquanto a validação reprovar.

**Achado no caminho:** o `tsconfig` herdado do template vinha com **`"strict"` comentado**. Sem
`strictNullChecks` o TypeScript não estreita união discriminada — foi o que produziu 12 erros
falsos. Ligar o `strict` resolveu todos e revelou 9 trechos de código morto, removidos.

**Tudo validado ao vivo, no navegador** — não só por `curl`: a tela renderiza, os nomes aparecem, o
16/08 mostra SANTA CEIA sem ninguém, as 15 regras aparecem na aba Validação, o cofre cifra de
verdade (senha errada não abre) e um token inválido é recusado antes de ser guardado.

**Depois disso, na segunda parte da sessão**, entraram quatro itens do backlog:

- **P3.13** — o mês era lido em UTC (invisível em UTC−3). Corrigido em 3 pontos, com um portão que
  roda a suíte inteira em `Europe/Berlin` **depois de provar que a troca de fuso surtiu efeito**.
- **P3.12** — ajuste manual turno a turno, com o **motivo escrito antes do clique**.
- **P3.9** — o **motor**: propõe, o portão determinístico julga, e o placar compara os dois lado a
  lado. Sem chave, tudo o mais segue funcionando.
- **P2.9 e P2.7** — portões de denominação e de inventário de fontes.

🔴 **Os dois portões novos nasceram mentindo**, e os dois passavam no próprio autoteste: o de
denominação produziu **9 falsos positivos** na varredura real (`SANTA CEIA` contém "IA"), e o de
inventário mediu **zero hosts** e disse "toda fonte declarada" (o `//` de `https://` era lido como
comentário). Consertados, com os casos reais virando teste permanente.

## O que está em curso

**Nada em execução.**

**A imagem que vai para o WhatsApp tem layout próprio** (partes 7 e 8), no modelo do arquivo que o
Flavio usa — com os nomes em **colunas alinhadas** e um **seletor de meses** antes de gerar. A anterior fotografava a tela e **fatiava em 5 dias** — numa escala de cinco meses, saíam cinco
dias. Agora o período inteiro cabe, e o filtro é o mesmo da tela. Exemplo em
`capturas/exemplo-2026-08.png`; regerar com `npm run imagem`.

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
| Publicar pela tela | 👤 Flavio cola `GITHUB_PAT_ESCALA_PORTEIROS` no primeiro acesso |
| O motor funcionar | 👤 Flavio cola `ANTHROPIC_API_KEY_ESCALA` (opcional — sem ela o algoritmo segue) |
| Desenvolver na pasta `D:` | 👤 Flavio decide se investiga o antivírus/disco |

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
