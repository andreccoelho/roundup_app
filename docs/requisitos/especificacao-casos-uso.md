# Especificação dos casos de uso do RoundUp

Especificação textual dos 30 casos de uso (UC01–UC30), organizada pelas categorias da base de requisitos ([requisitos-v1-2026-09.csv](requisitos-v1-2026-09.csv)). As fontes dos diagramas estão em [`docs/relatorio-v2/figuras/uml-fonte/`](../relatorio-v2/figuras/uml-fonte/). Quando o ator é o professor, a academia herda o caso de uso por generalização de ator.

Algumas especificações descrevem o comportamento projetado, que ainda não foi implementado por inteiro; a situação de cada requisito está no capítulo 4 do relatório.

## Contas

### UC01 – Cadastrar Conta

- **Atores:** Aluno, Professor, Academia
- **Requisitos relacionados:** RF01
- **Pré-condições:** O usuário não possui conta cadastrada no sistema.
- **Fluxo principal:**
   1. O usuário acessa a tela de cadastro.
   2. O usuário seleciona o perfil desejado (Aluno, Professor ou Academia).
   3. O sistema exibe os campos obrigatórios correspondentes ao perfil escolhido.
   4. O usuário preenche os dados e confirma o cadastro.
   5. O sistema cria a conta e associa o perfil escolhido.
- **Fluxos alternativos:** A1. Dados inválidos ou incompletos: o sistema exibe mensagem de erro e mantém os dados já preenchidos.
- **Pós-condições:** Conta criada e usuário autenticado no perfil escolhido.

### UC02 – Autenticar-se e Recuperar Senha

- **Atores:** Aluno, Professor, Academia
- **Requisitos relacionados:** RF02, RNF03
- **Pré-condições:** O usuário possui conta cadastrada.
- **Fluxo principal:**
   1. O usuário informa e-mail e senha.
   2. O sistema delega a validação das credenciais ao serviço de autenticação do Firebase.
   3. O sistema autentica o usuário e o redireciona à tela inicial do seu perfil.
- **Fluxos alternativos:** A1. Senha esquecida: o usuário solicita recuperação por e-mail; o sistema envia link de redefinição via Firebase. A2. Credenciais inválidas: o sistema exibe mensagem de erro.
- **Pós-condições:** Sessão iniciada.

### UC03 – Gerenciar Perfil da Academia

- **Atores:** Academia
- **Requisitos relacionados:** RF04
- **Pré-condições:** Academia autenticada.
- **Fluxo principal:**
   1. A Academia acessa a tela de perfil institucional.
   2. A Academia edita nome, endereço, modalidades oferecidas e identidade visual.
   3. O sistema salva as alterações.
- **Fluxos alternativos:** A1. Dados inválidos: o sistema exibe mensagem de erro.
- **Pós-condições:** Perfil institucional atualizado.

### UC04 – Gerenciar Perfil do Professor

- **Atores:** Professor
- **Requisitos relacionados:** RF05
- **Pré-condições:** Professor autenticado.
- **Fluxo principal:**
   1. O Professor acessa seu perfil.
   2. Edita nome, modalidades que leciona, graduação e indicação de atuação autônoma ou vinculada a academia.
   3. O sistema salva as alterações.
- **Fluxos alternativos:** A1. Dados inválidos: o sistema exibe mensagem de erro.
- **Pós-condições:** Perfil do professor atualizado.

### UC05 – Gerenciar Perfil do Aluno

- **Atores:** Aluno
- **Requisitos relacionados:** RF06
- **Pré-condições:** Aluno autenticado.
- **Fluxo principal:**
   1. O Aluno acessa seu perfil.
   2. Visualiza e edita nome, modalidade praticada, faixa/grau atual e foto.
   3. O sistema salva as alterações.
- **Fluxos alternativos:** A1. Dados inválidos: o sistema exibe mensagem de erro.
- **Pós-condições:** Perfil do aluno atualizado.

## Vínculos

### UC06 – Solicitar Vínculo com Academia

- **Atores:** Professor
- **Requisitos relacionados:** RF07 , RN06
- **Pré-condições:** Professor autenticado.
- **Fluxo principal:**
   1. O Professor busca e seleciona a academia desejada.
   2. O Professor envia a solicitação de vínculo.
   3. O sistema registra a solicitação com status Pendente e notifica a academia.
- **Fluxos alternativos:** A1. O Professor cancela a solicitação antes da resposta da academia.
- **Pós-condições:** Solicitação registrada, aguardando aceite da academia.

### UC07 – Gerenciar Vínculos de Professores

- **Atores:** Academia
- **Requisitos relacionados:** RF09 , RN06
- **Pré-condições:** Existem solicitações pendentes ou vínculos ativos com professores.
- **Fluxo principal:**
   1. A Academia consulta a lista de solicitações de vínculo pendentes e vínculos ativos.
   2. A Academia aceita ou recusa uma solicitação, ou encerra um vínculo ativo.
   3. Ao aceitar, a Academia atribui as turmas sob responsabilidade do professor.
   4. O sistema atualiza o status do vínculo e notifica o professor.
- **Fluxos alternativos:** A1. Academia recusa a solicitação: sistema notifica o professor e encerra o fluxo.
- **Pós-condições:** Vínculo atualizado (ativo, recusado ou encerrado).

### UC08 – Vincular-se a Academia ou Professor

- **Atores:** Aluno
- **Requisitos relacionados:** RF08 , RN05
- **Pré-condições:** Aluno autenticado.
- **Fluxo principal:**
   1. O Aluno busca uma academia ou um professor autônomo.
   2. O Aluno solicita o vínculo.
   3. O sistema registra o vínculo e define o escopo de turmas, missões, classificação e relatórios aplicáveis a esse aluno.
- **Fluxos alternativos:** A1. Aluno sem nenhum vínculo ativo: sistema bloqueia o acesso a turmas, sessões, missões e classificação (RN05).
- **Pós-condições:** Aluno vinculado, com escopo de uso definido.

## Treinos

### UC09 – Gerenciar Turmas

- **Atores:** Professor (Academia herda por generalização de ator)
- **Requisitos relacionados:** RF10 , RN07
- **Pré-condições:** Responsável autenticado (professor autônomo ou academia).
- **Fluxo principal:**
   1. O responsável cria uma turma informando nome, modalidade, nível e professor responsável.
   2. O responsável edita ou encerra turmas existentes.
- **Fluxos alternativos:** A1. Tentativa de definir mais de um responsável para a mesma turma: sistema impede, pois toda turma tem responsável único (RN07).
- **Pós-condições:** Turma criada, atualizada ou encerrada.

### UC10 – Matricular-se em Turma

- **Atores:** Aluno
- **Requisitos relacionados:** RF11
- **Pré-condições:** Aluno possui vínculo ativo que dá acesso à turma.
- **Fluxo principal:**
   1. O Aluno consulta as turmas disponíveis no escopo do seu vínculo.
   2. O Aluno se matricula em uma ou mais turmas.
- **Fluxos alternativos:** A1. Turma fora do escopo do vínculo do aluno: sistema não a exibe como disponível.
- **Pós-condições:** Matrícula registrada.

### UC11 – Criar Sessão de Treino

- **Atores:** Professor (Academia herda por generalização de ator)
- **Requisitos relacionados:** RF12
- **Pré-condições:** Existe turma cadastrada sob responsabilidade do solicitante.
- **Fluxo principal:**
   1. O responsável seleciona a turma.
   2. Informa data, horário de início e término e o professor responsável pela sessão.
   3. Opcionalmente, gera sessões recorrentes a partir de uma grade semanal.
- **Fluxos alternativos:** A1. Conflito de horário com outra sessão da mesma turma: sistema alerta o responsável.
- **Pós-condições:** Sessão(ões) de treino criada(s).

### UC12 – Realizar Check-in

- **Atores:** Aluno
- **Requisitos relacionados:** RF13, RN02, RN08, RNF01
- **Pré-condições:** Aluno autenticado, com vínculo ativo e matrícula ativa na turma da sessão.
- **Fluxo principal:**
   1. O aluno abre a tela inicial, que destaca a próxima sessão.
   2. O aluno toca em "Fazer check-in".
   3. O sistema verifica a sessão, a matrícula, a janela de tempo e a inexistência de check-in anterior.
   4. O sistema grava o check-in com situação "pendente" e atualiza o botão.
- **Fluxos alternativos:** 3a. Janela ainda não aberta ou já encerrada: o sistema informa o motivo e não grava (RN08). 3b. Check-in já existente: o sistema informa e não grava (RN02). 3c. Sessão cancelada ou aluno sem matrícula ativa: o sistema recusa.
- **Pós-condições:** Check-in pendente de validação; nenhum ponto creditado ainda (RN01).

### UC13 – Consultar Agenda de Treinos

- **Atores:** Aluno
- **Requisitos relacionados:** RF14
- **Pré-condições:** Aluno matriculado em ao menos uma turma.
- **Fluxo principal:**
   1. O Aluno acessa a agenda.
   2. O sistema exibe as próximas sessões das turmas em que está matriculado, com data, horário e professor responsável.
- **Pós-condições:** Agenda exibida.

### UC14 – Consultar Histórico de Presenças

- **Atores:** Aluno
- **Requisitos relacionados:** RF15
- **Pré-condições:** Aluno possui ao menos um *check-in* validado.
- **Fluxo principal:**
   1. O Aluno acessa o histórico de presenças.
   2. O sistema exibe os *check-ins* validados ao longo do tempo.
- **Pós-condições:** Histórico exibido.

### UC15 – Validar Check-in

- **Atores:** Professor (herdado pela Academia)
- **Requisitos relacionados:** RF22, RN01, RN07
- **Pré-condições:** Existem check-ins em sessões sob responsabilidade do gestor.
- **Fluxo principal:**
   1. O gestor abre a chamada da sessão do dia.
   2. O sistema lista os alunos matriculados e os check-ins feitos.
   3. O gestor confirma a presença de cada aluno que fez check-in.
   4. Ao confirmar, o sistema credita o XP no check-in e na classificação do aluno, na mesma transação.
- **Fluxos alternativos:** 3a. O gestor desfaz uma confirmação: o check-in volta a "pendente" e o sistema estorna os pontos. 3b. Aluno sem check-in: aparece como ausente, e o gestor não pode registrar presença em nome dele.
- **Pós-condições:** Presença confirmada e pontuação atualizada, ou check-in mantido como pendente.

## Gamificação

### UC16 – Visualizar Nível e Progresso

- **Atores:** Aluno
- **Requisitos relacionados:** RF16 , RF17
- **Pré-condições:** Aluno autenticado.
- **Fluxo principal:**
   1. O Aluno acessa seu painel.
   2. O sistema exibe o nível atual, o total de pontos acumulados (creditados a partir de *check-ins* validados e missões concluídas) e quanto falta para o próximo nível.
- **Pós-condições:** Nível e progresso exibidos.

### UC17 – Consultar Missões

- **Atores:** Aluno
- **Requisitos relacionados:** RF18
- **Pré-condições:** Aluno vinculado a uma academia ou professor com missões ativas no seu escopo.
- **Fluxo principal:**
   1. O Aluno acessa a lista de missões ativas no escopo do seu vínculo.
   2. O sistema exibe o progresso parcial de cada missão e sinaliza conclusão com a respectiva recompensa.
- **Pós-condições:** Missões e progresso exibidos.

### UC18 – Consultar Classificação

- **Atores:** Aluno
- **Requisitos relacionados:** RF20 , RN04 , RN09 , RNF11
- **Pré-condições:** Aluno optou por participar da classificação (adesão é opcional, conforme RNF11).
- **Fluxo principal:**
   1. O Aluno acessa a tela de classificação.
   2. O sistema exibe o ranking por pontos obtidos na janela de tempo vigente (RN04), respeitando o escopo do vínculo do aluno – academia, turma ou conjunto de alunos de um professor autônomo (RN09).
- **Fluxos alternativos:** A1. Aluno não participante: a tela informa que a classificação está desativada e oferece a opção de habilitar a adesão.
- **Pós-condições:** Classificação exibida, ou aviso de não adesão.

### UC19 – Consultar Sequência de Treinos

- **Atores:** Aluno
- **Requisitos relacionados:** RF21
- **Pré-condições:** Aluno autenticado.
- **Fluxo principal:**
   1. O Aluno acessa seu painel.
   2. O sistema exibe a sequência de treinos consecutivos do aluno.
- **Pós-condições:** Sequência exibida.

## Gestão

### UC20 – Criar Missão Personalizada

- **Atores:** Professor (Academia herda por generalização de ator)
- **Requisitos relacionados:** RF23
- **Pré-condições:** Responsável autenticado.
- **Fluxo principal:**
   1. O responsável acessa a criação de missões.
   2. Define título, critério de conclusão, recompensa em pontos, público-alvo e período de vigência.
   3. O sistema publica a missão e notifica os alunos do público-alvo (RF31).
- **Fluxos alternativos:** A1. Período de vigência inválido: sistema exibe erro e não publica a missão.
- **Pós-condições:** Missão publicada e visível aos alunos do público-alvo (UC17).

### UC21 – Consultar Alunos e Frequência

- **Atores:** Professor (Academia herda por generalização de ator)
- **Requisitos relacionados:** RF24
- **Pré-condições:** Responsável possui ao menos um aluno vinculado.
- **Fluxo principal:**
   1. O responsável acessa a lista de alunos sob sua responsabilidade.
   2. O sistema exibe a frequência recente de cada aluno.
- **Pós-condições:** Lista e frequência exibidas.

### UC22 – Registrar Graduação de Faixa

- **Atores:** Professor (Academia herda por generalização de ator)
- **Requisitos relacionados:** RF25 , RN03
- **Pré-condições:** Aluno vinculado ao responsável.
- **Fluxo principal:**
   1. O responsável seleciona o aluno.
   2. Registra a nova faixa/grau concedida.
   3. O sistema atualiza o perfil do aluno e o histórico de progressão.
- **Pós-condições:** Graduação registrada. A concessão é sempre uma decisão humana do responsável, nunca automática por acúmulo de pontos (RN03).

### UC23 – Gerar Relatório de Frequência

- **Atores:** Professor (Academia herda por generalização de ator)
- **Requisitos relacionados:** RF26
- **Pré-condições:** Existem sessões e *check-ins* registrados no período selecionado.
- **Fluxo principal:**
   1. O responsável seleciona a turma e o período desejado.
   2. O sistema gera o relatório de frequência.
- **Pós-condições:** Relatório gerado, disponível também como fonte de dados para a avaliação do TCC.

### UC24 – Consultar Visão Consolidada

- **Atores:** Academia (uso exclusivo)
- **Requisitos relacionados:** RF27
- **Pré-condições:** Academia autenticada, com turmas, professores e alunos cadastrados.
- **Fluxo principal:**
   1. A Academia acessa o painel consolidado.
   2. O sistema exibe todas as turmas, professores e alunos da academia, com indicadores agregados de frequência.
- **Pós-condições:** Visão consolidada exibida.

### UC25 – Personalizar Pontuação e Graduação

- **Atores:** Professor (Academia herda por generalização de ator)
- **Requisitos relacionados:** RF33
- **Pré-condições:** Responsável autenticado.
- **Fluxo principal:**
   1. O responsável acessa as configurações de gamificação do seu perfil.
   2. Personaliza a quantidade de pontos por presença, os critérios de subida de nível e a estrutura de faixas da modalidade.
   3. O sistema salva a configuração (ConfiguracaoGamificacao) associada ao perfil.
- **Fluxos alternativos:** A1. Responsável não personaliza: o sistema aplica a configuração padrão pré-definida.
- **Pós-condições:** Configuração de gamificação salva e aplicada aos alunos do escopo do responsável.

## Conformidade

### UC26 – Registrar Consentimento LGPD

- **Atores:** Aluno, Professor, Academia
- **Requisitos relacionados:** RF28 , RNF10
- **Pré-condições:** Usuário está realizando o cadastro (UC01).
- **Fluxo principal:**
   1. O sistema apresenta a política de privacidade durante o cadastro.
   2. O usuário registra o consentimento quanto ao tratamento de dados pessoais.
- **Fluxos alternativos:** A1. Usuário não consente: cadastro não é concluído.
- **Pós-condições:** Consentimento registrado, associado à conta.

### UC27 – Solicitar Exclusão de Conta e Dados

- **Atores:** Aluno, Professor, Academia
- **Requisitos relacionados:** RF29
- **Pré-condições:** Usuário autenticado.
- **Fluxo principal:**
   1. O usuário acessa as configurações da conta.
   2. Solicita a exclusão da conta e dos dados pessoais associados.
   3. O sistema processa a exclusão conforme a LGPD (Lei 13.709/2018).
- **Pós-condições:** Conta e dados pessoais eliminados, conforme direito de eliminação previsto na LGPD.

### UC28 – Registrar Responsável Legal

- **Atores:** Aluno menor de 18 anos
- **Requisitos relacionados:** RF30
- **Pré-condições:** Aluno identificado como menor de idade no cadastro.
- **Fluxo principal:**
   1. O sistema solicita a identificação do responsável legal.
   2. O responsável legal fornece o consentimento necessário.
   3. O sistema registra o vínculo de responsabilidade.
- **Pós-condições:** Responsável legal registrado e vinculado à conta do aluno menor.

## Retenção

### UC29 – Receber Notificações

- **Atores:** Aluno
- **Requisitos relacionados:** RF31
- **Pré-condições:** Aluno com conta ativa e notificações habilitadas.
- **Fluxo principal:**
   1. O sistema envia notificação de lembrete de sessão de treino, publicação de nova missão ou conquista obtida.
   2. O Aluno visualiza a notificação no aplicativo.
- **Pós-condições:** Notificação entregue e marcada como lida ao ser aberta.

### UC30 – Consultar Alertas de Queda de Frequência

- **Atores:** Professor (Academia herda por generalização de ator)
- **Requisitos relacionados:** RF32
- **Pré-condições:** Existe aluno sob responsabilidade do solicitante com queda relevante de frequência no período.
- **Fluxo principal:**
   1. O sistema sinaliza, no painel do responsável, os alunos com queda relevante de frequência.
   2. O responsável consulta o alerta e pode tomar uma ação, como contatar o aluno.
- **Pós-condições:** Alerta consultado. É o requisito que mais dialoga diretamente com a hipótese de redução da evasão.
