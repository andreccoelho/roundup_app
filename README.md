# RoundUp — Roteiro Completo do TCC

---

## 📋 Fase 0 — Planejamento (antes de tudo)

Antes de escrever uma linha de código ou do documento, você precisa definir:

- **Escopo fechado** — o que o aplicativo vai e **não vai** fazer na versão do TCC
- **Academia parceira** — encontre uma academia real para testar e validar
- **Orientador alinhado** — apresente a ideia e valide a viabilidade com ele
- **Ferramentas** — defina a pilha de tecnologias e garanta que sabe ou consegue aprender a tempo

---

## 📚 Fase 1 — Fundamentação Teórica (mês 1)

É a base acadêmica do seu trabalho. Você vai escrever sobre:

### Gamificação
- O que é, origem, principais estruturas de referência (Octalysis de Yu-kai Chou, MDA)
- Elementos: pontos de experiência, medalhas, rankings, missões, progressão
- Gamificação aplicada à saúde e exercício físico

### Artes Marciais & Evasão
- Perfil do praticante de Boxe/Muay Thai no Brasil
- Problema de evasão em academias e seus fatores
- Como o engajamento digital pode ajudar

### Trabalhos Relacionados
- Aplicativos existentes e suas limitações
- Lacuna que o RoundUp preenche

> 📖 Use Google Scholar, IEEE Xplore e ACM Digital Library para artigos científicos.

---

## 🔍 Fase 2 — Pesquisa com Usuários (mês 1-2)

Nenhum aplicativo bom nasce sem ouvir quem vai usar. Faça:

**Entrevistas** com 5 a 10 pessoas de cada perfil:
- Alunos de academias de Boxe/Muay Thai
- Professores e donos de academia

### Perguntas-chave para alunos:
- O que te faz perder motivação para treinar?
- Você usaria um aplicativo que mostrasse sua evolução em relação a outros alunos?
- Que tipo de recompensa te motivaria mais?

### Perguntas para professores:
- Como você acompanha a evolução dos alunos hoje?
- Quais informações você mais precisaria ver em um painel?

> O resultado vira a seção de **Levantamento de Requisitos** do TCC.

---

## 🎨 Fase 3 — Design e Prototipação (mês 2)

**Personas** — crie 2 ou 3 perfis fictícios baseados nas entrevistas:
- Ex: "Lucas, 22 anos, pratica Muay Thai há 3 meses, desmotiva fácil"
- Ex: "Professor João, 35 anos, tem 40 alunos e perde tempo com controle manual"

**Fluxos de tela** — mapeie as jornadas principais:
- Aluno: cadastro → treino → ganhar pontos → ver classificação
- Professor: criar missão → ver presença → validar graduação

### Prototipação no Figma:
- Comece com esboços simples de telas (preto e branco)
- Evolua para protótipo navegável com identidade visual do RoundUp
- Valide as telas com usuários antes de programar — isso economiza muito tempo

---

## 💻 Fase 4 — Desenvolvimento (mês 3-4)

Desenvolva em ordem de prioridade, do núcleo para o extra:

### Ciclo 1 — Base
- Autenticação (entrada do aluno / entrada do professor)
- Perfil do lutador (nome, faixa, avatar)
- Registro de presença no treino

### Ciclo 2 — Gamificação
- Sistema de pontos de experiência por presença e missões
- Medalhas e conquistas
- Classificação geral da academia

### Ciclo 3 — Gestão
- Painel do professor
- Criação de missões personalizadas
- Controle de graduação de faixa

### Ciclo 4 — Refinamento
- Notificações
- Ajustes de experiência do usuário com base nos testes
- Tratamento de dados (LGPD)

> 💡 **Dica importante:** é melhor entregar menos funcionalidades bem feitas do que muitas pela metade. Defina um produto mínimo viável e seja fiel a ele.

---

## 🧪 Fase 5 — Testes com Usuários Reais (mês 5)

Essa fase transforma seu aplicativo em um **trabalho científico de verdade:**

- Disponibilize o aplicativo para alunos da academia parceira por 2 a 4 semanas
- Colete métricas: frequência de uso, engajamento, presença nos treinos
- Aplique questionários antes e depois (escala SUS para usabilidade, por exemplo)
- Faça entrevistas de encerramento

> Os resultados viram os **gráficos e análises** do capítulo final do TCC.

---

## ✍️ Fase 6 — Escrita do TCC (paralela ao desenvolvimento)

Não deixe para escrever tudo no final. Estrutura sugerida:

```
1. Introdução
   - Contexto, problema, objetivos, justificativa
2. Fundamentação Teórica
   - Gamificação, artes marciais, engajamento digital
3. Trabalhos Relacionados
   - Aplicativos existentes e lacuna do RoundUp
4. Metodologia
   - Como o projeto foi conduzido
5. Levantamento de Requisitos
   - Resultados das entrevistas, personas, requisitos funcionais
6. Design e Arquitetura
   - Protótipos, modelo de banco de dados, arquitetura do sistema
7. Implementação
   - Tecnologias utilizadas, decisões técnicas, trechos de código relevantes
8. Avaliação
   - Testes com usuários, métricas, análise dos resultados
9. Conclusão
   - O que foi alcançado, limitações, trabalhos futuros
```

---

## 🗓️ Cronograma Resumido

| Mês | Foco principal |
|---|---|
| **1** | Fundamentação teórica + entrevistas com usuários |
| **2** | Requisitos + prototipação no Figma + validação |
| **3** | Desenvolvimento — base e gamificação |
| **4** | Desenvolvimento — painel do professor + refinamento |
| **5** | Testes com usuários reais + coleta de dados |
| **6** | Análise de resultados + escrita final + defesa |

---

## ⚠️ Erros comuns para evitar

- **Escopo grande demais** — defina um produto mínimo viável e seja fiel a ele
- **Não validar com usuários reais** — é o que diferencia um TCC de um projeto pessoal
- **Deixar a escrita para o fim** — escreva enquanto desenvolve
- **Não ter academia parceira** — sem ela, os testes ficam fracos academicamente
- **Ignorar a LGPD** — seu aplicativo vai armazenar dados de menores, isso precisa estar no TCC
