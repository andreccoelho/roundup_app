# Template de TCC — Engenharias Ibmec (LaTeX)

Modelo para escrever o TCC dos cursos de Engenharia Civil, de Computação, Mecânica e de Produção do Centro Universitário Ibmec. Ele já vem formatado conforme:

- **Regulamento de TCC dos Cursos de Engenharia** (v2026.1);
- **Manual para Elaboração de Trabalhos Científicos** do Ibmec (4. ed., 2022);
- normas da **ABNT** (NBR 14724, 6023, 6024, 6027, 6028 e 10520).

Você **não precisa se preocupar com margens, fontes, espaçamento, numeração de páginas, sumário ou formato das referências**: o template já faz isso. Seu trabalho é **escrever o conteúdo**.

---

## 1. O que é LaTeX (em 30 segundos)

No Word, você formata o texto enquanto escreve. No LaTeX, você escreve o texto em arquivos `.tex` com alguns **comandos** (que começam com `\`), e um programa transforma tudo num **PDF** já formatado. O processo de gerar o PDF chama-se **compilar**.

Três coisas que você precisa saber:

| Você escreve | O que acontece |
|---|---|
| Uma linha em branco | Começa um novo parágrafo |
| `% texto` | É um **comentário**: não aparece no PDF (usado para instruções) |
| `\comando{texto}` | Aplica o comando ao texto. Ex.: `\textbf{importante}` → **importante** |

Caracteres especiais: para escrever `%`, `&`, `$`, `#` ou `_` no texto, coloque uma barra antes: `\%`, `\&`, `\$`, `\#`, `\_`.

---

## 2. Começando no Overleaf (recomendado)

O [Overleaf](https://www.overleaf.com) é um editor de LaTeX on-line e gratuito; nada precisa ser instalado.

1. Crie uma conta (pode usar o e-mail institucional).
2. Clique em **New Project → Upload Project** e envie o arquivo **.zip** deste template (sem descompactar).
3. Abra o **Menu** (canto superior esquerdo) e confira:
   - **Compiler:** `pdfLaTeX`
   - **Main document:** `main.tex`
4. Clique em **Recompile**. O PDF aparece à direita.

> Dica: o Overleaf permite compartilhar o projeto com o(a) orientador(a) (**Share**), que pode acompanhar e comentar o texto.

---

## 3. Passo a passo para escrever o seu TCC

### Passo 1 — Seus dados: `config/dados.tex`
Preencha nome, título, curso, orientador(a) e banca. Esses dados vão automaticamente para a capa, a folha de rosto e a folha de aprovação.

### Passo 2 — Escolha o formato: `main.tex`
O Regulamento (Art. 6º) admite dois formatos. Escolha um com a ajuda do seu orientador e altere **uma linha** no `main.tex`:

| Formato | Linha no `main.tex` | Capítulos usados |
|---|---|---|
| **Pesquisa científica** → monografia | `\relatoriofalse` | pasta `capitulos/monografia/` |
| **Projeto aplicado** → relatório técnico + protótipo | `\relatoriotrue` | pasta `capitulos/relatorio/` |

O texto da natureza do trabalho (na folha de rosto) muda sozinho.

### Passo 3 — Escreva os capítulos
Cada capítulo fica em um arquivo `.tex` separado. Em cada um há:
- um **comentário no topo** explicando para que serve o capítulo;
- **caixas de orientação** (no PDF) com dicas do que escrever;
- textos-modelo para você **substituir** pelo seu.

**Monografia** (`capitulos/monografia/`):

| Arquivo | Capítulo |
|---|---|
| `01-introducao.tex` | Introdução (problema, objetivos, justificativa) |
| `02-referencial-teorico.tex` | Referencial teórico (**ensina a citar**) |
| `03-metodologia.tex` | Metodologia (**ensina a escrever equações**) |
| `04-resultados-discussao.tex` | Resultados e discussão (**ensina figuras e tabelas**) |
| `05-conclusao.tex` | Conclusão |

**Relatório técnico** (`capitulos/relatorio/`), conforme o Art. 9º do Regulamento:

| Arquivo | Capítulo |
|---|---|
| `01-introducao.tex` | Introdução e objetivos do projeto |
| `02-requisitos.tex` | Requisitos funcionais e não funcionais |
| `03-modelagem.tex` | Modelagens funcional, estática e dinâmica |
| `04-implementacao.tex` | Estratégias de implementação (**ensina a inserir código**) |
| `05-testes-validacao.tex` | Procedimentos de testes e validação |
| `06-resultados-consideracoes-finais.tex` | Resultados e considerações finais |

**Quer adicionar um capítulo?** Crie um arquivo novo na pasta (ex.: `capitulos/monografia/04-estudo-de-caso.tex`), comece-o com `\chapter{Estudo de caso}` e acrescente a linha `\input{capitulos/monografia/04-estudo-de-caso}` no `main.tex`, na posição desejada.

### Passo 4 — Elementos pré-textuais (`pretextuais/`)
Escreva o **resumo** (`resumo.tex`), o **abstract** (`abstract.tex`) e, se quiser, dedicatória, agradecimentos e epígrafe. Em `listas.tex` ficam as listas de **siglas** e **símbolos** (as listas de figuras, quadros e tabelas são automáticas).

Para **remover** um elemento opcional, coloque `%` no início da linha correspondente no `main.tex`.

### Passo 5 — Referências: `referencias/referencias.bib`
Cada obra consultada é cadastrada uma vez nesse arquivo, com uma **chave** (ex.: `gil2017`). A lista de referências no final do trabalho é montada sozinha, em ordem alfabética e no padrão ABNT, **somente com as obras citadas no texto**.

### Passo 6 — Versão final
1. No `main.tex`, troque `\mostrarorientacoestrue` por `\mostrarorientacoesfalse` para **esconder todas as caixas de orientação**.
2. Apague os textos-modelo que sobraram.
3. **Ficha catalográfica** (obrigatória na versão final — Regulamento, Art. 21): gere a ficha, salve o PDF como `ficha/ficha-catalografica.pdf` e recompile. Ela entra sozinha no verso da folha de rosto.
4. **Folha de aprovação assinada** (opcional): se quiser incluir a folha assinada pela banca, digitalize-a e salve como `ficha/folha-aprovacao-assinada.pdf`.

---

## 4. Colinha de comandos

### Citações (sistema autor-data)

| Você escreve | Resultado no PDF |
|---|---|
| `\citeonline{gil2017}` | Gil (2017) |
| `\cite{gil2017}` | (GIL, 2017) |
| `\cite[p.~25]{gil2017}` | (GIL, 2017, p. 25) |
| `\citeonline[p.~25]{gil2017}` | Gil (2017, p. 25) |
| `\cite{gil2017,marconi2017}` | (GIL, 2017; MARCONI; LAKATOS, 2017) |

- **Citação direta curta** (até 3 linhas): entre aspas `` ``assim'' `` + página.
- **Citação direta longa** (mais de 3 linhas): `\begin{citacao} ... \end{citacao}` (recuo de 4 cm e fonte menor automáticos).

### Figura
```latex
\begin{figure}[!htb]
  \centering
  \caption{Título da figura}            % título EM CIMA
  \label{fig:apelido}
  \includegraphics[width=0.8\textwidth]{figuras/arquivo.png}
  \fonte{Elaborado pelo autor (2026).}   % fonte EMBAIXO (obrigatória)
\end{figure}
```
No texto: `A \autoref{fig:apelido} mostra...` → "A Figura 1 mostra...".
As imagens ficam na pasta `figuras/` (formatos `.png`, `.jpg` ou `.pdf`).

### Tabela, quadro e código
- **Tabela** (`\begin{table}`): dados **numéricos**; laterais abertas, linhas só no cabeçalho e no fim (`\toprule`, `\midrule`, `\bottomrule`).
- **Quadro** (`\begin{quadro}`): conteúdo **textual**, todas as bordas fechadas.
- **Código** (`\begin{codigo}` + `\begin{lstlisting}`): trechos de código-fonte.

Há um exemplo pronto de cada um nos capítulos. Sempre: **título em cima** (`\caption`), **fonte embaixo** (`\fonte`) e **citar no texto antes** de aparecer.

### Seções (até 5 níveis)
```latex
\chapter{Título}            % 1 SEÇÃO PRIMÁRIA      (começa em nova página)
\section{Título}            % 1.1 SEÇÃO SECUNDÁRIA
\subsection{Título}         % 1.1.1 Seção terciária
\subsubsection{Título}      % 1.1.1.1 Seção quaternária
\subsubsubsection{Título}   % 1.1.1.1.1 Seção quinária
```

### Listas (alíneas)
```latex
\begin{enumerate}
  \item primeiro item;
  \item último item.
\end{enumerate}
```

### Equação numerada
```latex
\begin{equation}
  \sigma = \frac{F}{A}
  \label{eq:tensao}
\end{equation}
```

---

## 5. Estrutura de pastas

```
tcc-ibmec/
├── main.tex                  ← arquivo principal (compile este)
├── LEIA-ME.md                ← este guia
├── config/
│   ├── dados.tex             ← EDITE: seus dados
│   └── estilo.tex            ← NÃO edite: formatação ABNT/Ibmec
├── pretextuais/              ← capa, folha de rosto, resumo, listas, sumário...
├── capitulos/
│   ├── monografia/           ← capítulos da pesquisa científica
│   └── relatorio/            ← capítulos do projeto aplicado
├── postextuais/              ← glossário, apêndices, anexos
├── referencias/
│   └── referencias.bib       ← EDITE: suas referências
├── figuras/                  ← suas imagens
└── ficha/                    ← ficha catalográfica (PDF) na versão final
```

---

## 6. Problemas comuns

| Sintoma | Causa provável e solução |
|---|---|
| Aparece **(?)** ou **??** no lugar de citação/referência | Chave digitada errada ou falta compilar de novo. Confira a chave no `.bib` e clique em **Recompile**. |
| Sumário desatualizado | Compile mais uma vez. |
| Erro `Undefined control sequence` | Comando digitado errado (ex.: `\txtbf` em vez de `\textbf`). O Overleaf mostra a linha do erro. |
| Erro `Missing $ inserted` | Você usou `_` ou `^` fora de uma equação. Escreva `\_` ou coloque entre `$ $`. |
| Erro com `%` ou `&` | Escreva `\%` e `\&`. |
| Imagem não aparece | Confira o nome do arquivo (maiúsculas/minúsculas e extensão) e se ele está em `figuras/`. |
| Referência não aparece no final | Ela só aparece se for citada no texto com `\cite` ou `\citeonline`. |

Erros no Overleaf: clique no ícone de **logs** ao lado de *Recompile*; o primeiro erro da lista é o que importa — corrija-o e recompile.

---

## 7. Observações sobre a formatação

- **Fonte:** o Manual recomenda Arial 12. O template usa **Helvetica**, a fonte equivalente da Arial disponível no LaTeX (mesmas medidas e aparência praticamente idêntica).
- **Impressão:** o template vem em modo *somente frente* (`oneside`). Se o orientador pedir frente e verso, troque `oneside` por `twoside` na primeira linha do `\documentclass` do `main.tex`; as margens se espelham e os capítulos passam a começar em página ímpar.
- **Logotipo na capa:** é opcional; para retirar, comente a linha `\includegraphics` em `pretextuais/capa.tex`.
- Em caso de conflito entre o Manual e as normas ABNT, prevalecem as normas ABNT (Regulamento, Art. 8º).
