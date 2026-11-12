# Personas sintéticas

As 12 personas deste documento são **sintéticas**. Foram escritas em 26/10/2026, a partir do padrão das seis respostas reais do formulário (18 e 19/09/2026), e serviram para apoiar decisões de experiência do usuário e para orientar as regras do gerador de respostas de teste ([`respostas-sinteticas/`](respostas-sinteticas/)). As personas de professor e de dono de academia são hipóteses a validar, porque nenhum professor real respondeu ao questionário.

O uso das personas e das respostas sintéticas está descrito na seção 5.2 do relatório ("Teste do instrumento com respostas sintéticas"). Essas respostas não são evidência: servem só para testar o questionário e a análise. As 65 respostas enviadas foram geradas por *script* a partir de regras inspiradas nestas fichas e não correspondem uma a uma a elas.

Os dados derivados estão em [`docs/relatorio-v2/dados/`](../relatorio-v2/dados/) (`personas_anonimizado.csv`, `notas_por_ideia_personas.csv`) e são gerados por [`docs/relatorio-v2/scripts/analise_personas.py`](../relatorio-v2/scripts/analise_personas.py).

## Fichas (documento original de 26/10/2026)

O texto abaixo reproduz o documento de trabalho em que as fichas foram escritas. A seção final, "Implicações e próximos passos", registra o plano daquela data.

### Uso deste documento

As 12 personas abaixo são sintéticas. Servem para apoiar decisões de UX e requisitos no capítulo de Modelagem e para testar o formulário numa cópia separada. Nenhuma resposta gerada aqui entra na base real da pesquisa nem nos resultados do TCC.

A base real tem 6 respostas (18 e 19/09/2026), todas de alunos ou ex-alunos e nenhuma de professor. As personas de Professor e Academia são, por isso, hipóteses a validar.

### Padrão das respostas reais

Respostas abertas são curtas, informais e com pouco cuidado de escrita. A mediana fica em 1 a 4 palavras; só 2 das 6 pessoas passaram de uma frase.

| Traço | Exemplos reais | Como replicar |
| --- | --- | --- |
| Monossílabo ou recusa | "Nao", "Nada", "Nenhum", "Não sei", "Não consigo opinar" | Maioria dos campos opcionais vazios ou com 1 palavra |
| Sem acento e espaço sobrando | "Nao ", "Sim , contusões", "Frequência " | Espaço no fim, vírgula com espaço antes, acento faltando às vezes |
| Resposta que não casa com a pergunta | "Sim" para "que funcionalidade você gostaria", "Sou raiz" | Comum no perfil mais jovem ou menos engajado |
| Substantivo solto | "Frequência", "Tempo" | Responde com o tema, sem verbo |
| Frase única de contexto | "A rotina foi complicando devido a distância" | Usada só no relato de abandono ou de quase abandono |
| Comentário final generoso | "Achei bem interessante e válido.", "Parabéns pela iniciativa." | 1 a cada 3 pessoas, em geral quem não vai usar o app |

Nas escalas de 1 a 5 aparecem três comportamentos. Um terço marca tudo igual (5 em tudo, 4 em tudo). Outro terço varia pouco, entre 3 e 4. O restante discrimina de verdade, com notas 1 em notificações, mural e ranking.

Regularidades de conteúdo: falta de tempo é o motivo dominante de abandono; o contato do professor não trouxe ninguém de volta; "Frequência" é a informação mais citada como perdida; notificação e excesso de dados são os gatilhos de desinstalação.

### Subgrupos e mapa das personas

Os subgrupos seguem as faixas etárias do próprio formulário, para que as personas caiam nas mesmas categorias da análise. A faixa 35 a 44 tem duas personas de aluno porque concentra metade das respostas reais.

| ID | Persona | Perfil no forms | Faixa etária | Modalidade | Postura com gamificação |
| --- | --- | --- | --- | --- | --- |
| A1 | Davi, 16 | Treino atualmente | Menos que 18 | Jiu-Jitsu | Gosta, mas responde no automático |
| A2 | Lucas, 21 | Treino atualmente | 18 a 24 | Muay Thai | Entusiasta de ranking e ofensiva |
| A3 | Rafaela, 29 | Treino atualmente | 25 a 34 | Boxe | Quer dados, rejeita exposição |
| A4 | Patrícia, 38 | Treino atualmente | 35 a 44 | Jiu-Jitsu | Aprova tudo de forma morna |
| A5 | Marcelo, 42 | Treino atualmente | 35 a 44 | Jiu-Jitsu | Cético, vê o app como trabalho extra |
| A6 | Sérgio, 51 | Treino atualmente | 45 ou mais | Muay Thai | Indiferente, valoriza só o histórico |
| E1 | Gabriel, 20 | Já treinei, mas parei | 18 a 24 | Jiu-Jitsu | Gosta da ideia, odeia notificação |
| E2 | Thiago, 31 | Já treinei, mas parei | 25 a 34 | Boxe | Neutro, nota 4 em tudo |
| E3 | Juliana, 40 | Já treinei, mas parei | 35 a 44 | Muay Thai | Acha que lembrete teria ajudado |
| E4 | Roberto, 48 | Já treinei, mas parei | 45 ou mais | Jiu-Jitsu | Resistente, prefere contato humano |
| P1 | Felipe, 27 | Dou aulas | 25 a 34 | Muay Thai | Quer alerta de ausência e relatório |
| P2 | Cláudio, 49 | Dou aulas (dono de academia) | 45 ou mais | Boxe e Muay Thai | Teme ranking, quer controle de graduação |

### Aluno ativo

Seis personas cobrem as cinco faixas. O contraste principal é entre quem enxerga o app como motivação (A1, A2) e quem enxerga como tarefa (A5, A6).

- **A1 Davi, 16.** Ensino médio, treina há 4 meses porque um amigo chamou. Quer competir no próximo campeonato da academia. Responde rápido pelo celular, não lê enunciado, preenche aberta com "Sim" ou "Nada".
- **A2 Lucas, 21.** Universitário, 1 ano e meio de Muay Thai, 4 treinos por semana. Usa Duolingo e Strava e gosta de ver número subir. Escreve um pouco mais, sem acento.
- **A3 Rafaela, 29.** Analista, boxe há 2 anos para condicionamento. Gosta de métrica pessoal, não quer aparecer em ranking. Escreve frases curtas e corretas.
- **A4 Patrícia, 38.** Mãe de dois, jiu-jitsu há mais de 3 anos, já parou por filhos e trabalho. Marca 4 em quase tudo. Responde "Frequência" e "Nada".
- **A5 Marcelo, 42.** Faixa roxa, treina há 6 anos, já parou por lesão. Desconfia de app que pede dado toda hora. Notas baixas, abertas curtas e secas.
- **A6 Sérgio, 51.** Comerciante, voltou ao Muay Thai por saúde. Pouca familiaridade com app. Valoriza histórico, ignora ranking e mural.

#### Respostas-modelo, perguntas fechadas e abertas

| Pergunta | A1 Davi | A2 Lucas | A3 Rafaela | A4 Patrícia | A5 Marcelo | A6 Sérgio |
| --- | --- | --- | --- | --- | --- | --- |
| Gênero | Masculino | Masculino | Feminino | Feminino | Masculino | Masculino |
| Modalidade | Jiu-Jitsu | Muay Thai | Boxe | Jiu-Jitsu | Jiu-Jitsu | Muay Thai |
| Há quanto tempo treina | De 3 a 6 meses | De 1 a 3 anos | De 1 a 3 anos | Mais de 3 anos | Mais de 3 anos | De 6 meses a 1 ano |
| Vezes por semana | 2 vezes | 4 vezes | 3 vezes | 3 vezes | 2 vezes | 2 vezes |
| O que faz continuar | Competição, Amizades e convívio com a turma, Saúde mental e alívio do estresse | Evolução técnica e aprendizado, Competição, Disciplina e rotina | Saúde física e condicionamento, Saúde mental e alívio do estresse, Disciplina e rotina | Saúde física e condicionamento, Saúde mental e alívio do estresse, Amizades e convívio com a turma, Evolução técnica e aprendizado | Evolução técnica e aprendizado, Defesa pessoal, Saúde mental e alívio do estresse | Saúde física e condicionamento, Disciplina e rotina |
| Percebe evolução (1 a 5) | 5 | 4 | 3 | 4 | 4 | 3 |
| Sabe o que falta p/ graduar | Não faço ideia | Tenho uma ideia aproximada | Tenho uma ideia aproximada | Sim, sei com clareza | Sim, sei com clareza | Não faço ideia |
| Já pensou em parar? | Nao | sim, na epoca de prova da faculdade | Sim, quando mudei de emprego e o horário apertou | Sim , filho pequeno e trabalho | Lesão no joelho | Sim, dor nas costas |
| Já parou e voltou | Não | Não | Não | Sim | Sim | Sim |
| Acompanha frequência | Só mentalmente, sem registro | Só mentalmente, sem registro | Anoto ou uso algum app | Não acompanho | Não acompanho | Só mentalmente, sem registro |
| Usaria se dados só p/ você e professor (1 a 5) | 2 | 5 | 5 | 4 | 2 | 3 |
| App de hábito que ajudou | Nenhum | duolingo, a ofensiva prende demais | Strava, ver o histórico da semana | Nao | Não | Não |
| Funcionalidade desejada | Sim | ver os ranking das outras turmas tbm | Gráfico da minha frequência por mês | Não consigo opinar | Não sei | Ver quantas aulas eu fiz |
| O que faria desinstalar | Nada | se ficasse pedindo pra marcar tudo | Expor meus dados pra turma toda | Nada | Inserir dado toda hora | Ser difícil de mexer |
| Informação que se perde | Sim | Quantos treinos fiz no mês | Frequência e carga de treino | Frequência | Nada | As aulas que fiz |
| Comentário | Não | achei top a ideia | Nao | Não | Não | Boa sorte no trabalho |
| Aceita teste | Sim | Sim | Sim | Sim | Não | Não |

#### Escala 1 a 5 dos recursos

| Recurso | A1 | A2 | A3 | A4 | A5 | A6 |
| --- | --- | --- | --- | --- | --- | --- |
| XP por treino | 4 | 5 | 3 | 4 | 2 | 2 |
| Check-in rápido | 4 | 5 | 4 | 4 | 1 | 3 |
| Contador de dias | 3 | 5 | 5 | 4 | 2 | 4 |
| Ofensiva | 4 | 5 | 4 | 4 | 1 | 2 |
| Missões do professor | 4 | 5 | 3 | 4 | 2 | 3 |
| Ranking de frequência | 5 | 5 | 1 | 4 | 1 | 1 |
| Medalhas por marco | 4 | 5 | 3 | 4 | 1 | 2 |
| Barra até a graduação | 3 | 4 | 4 | 4 | 3 | 3 |
| Histórico completo | 4 | 4 | 5 | 4 | 3 | 5 |
| Mural da turma | 4 | 4 | 1 | 4 | 1 | 1 |
| Lembretes | 3 | 3 | 2 | 4 | 1 | 3 |

A4 replica o padrão de nota uniforme visto em 2 das 6 respostas reais. A5 replica o respondente que discrimina com notas 1.

### Ex-aluno

Quatro personas, uma por faixa a partir de 18. Três param por fator externo, como nos dados reais; E3 é a única em que o app poderia ter mudado a decisão.

- **E1 Gabriel, 20.** Treinou 3 anos de jiu-jitsu à noite e parou quando a faculdade virou noturna. O professor chamou, não fez diferença. Gosta da proposta, odeia notificação.
- **E2 Thiago, 31.** Boxe por 2 anos, mudou de bairro e a academia ficou longe. Marca 4 em tudo, abertas com uma palavra.
- **E3 Juliana, 40.** Muay Thai por 1 ano, foi espaçando os treinos depois de uma lesão no ombro e não voltou. Ninguém ligou. Acha que um lembrete e um contato teriam feito diferença.
- **E4 Roberto, 48.** Jiu-jitsu por mais de 3 anos, parou pela mensalidade e pelo trabalho. Prefere conversa com o professor a app. Discrimina com notas 1 em tudo que é social.

#### Respostas-modelo, perguntas fechadas e abertas

| Pergunta | E1 Gabriel | E2 Thiago | E3 Juliana | E4 Roberto |
| --- | --- | --- | --- | --- |
| Gênero | Masculino | Masculino | Feminino | Masculino |
| Modalidade praticada | Jiu-Jitsu | Boxe | Muay Thai | Jiu-Jitsu |
| Tempo antes de parar | Mais de 3 anos | De 1 a 3 anos | De 6 meses a 1 ano | Mais de 3 anos |
| Há quanto parou | Menos de 6 meses | De 6 meses a 1 ano | Mais de 1 ano | De 6 meses a 1 ano |
| Vezes por semana | 3 vezes | 2 vezes | 2 vezes | 2 vezes |
| Fatores | Falta de tempo ou conflito com a rotina, Horários das aulas | Mudança de endereço ou distância | Lesão ou problema de saúde, Falta de motivação | Custo da mensalidade, Falta de tempo ou conflito com a rotina |
| Principal | Horários das aulas | Mudança de endereço ou distância | Lesão ou problema de saúde | Custo da mensalidade |
| Relato | Comecei a faculdade a noite e bateu com o horário do treino | Mudei de bairro | Machuquei o ombro, fiquei umas semanas parada e fui perdendo o ritmo. Quando vi ja tinha meses | Ficou caro e o trabalho apertou |
| Evolução antes de parar (1 a 5) | 4 | 4 | 2 | 4 |
| Sabia o que faltava p/ graduar | Sim, sabia com clareza | Tenho uma ideia aproximada | Não fazia ideia | Sim, sabia com clareza |
| Alguém chamou de volta | Sim, o professor ou instrutor me chamou de volta | Não, ninguém entrou em contato | Não, ninguém entrou em contato | Sim, o professor ou instrutor me chamou de volta |
| Considerou voltar | Não fez diferença | (em branco) | (em branco) | Sim, considerei, mas não voltei |
| Vontade de voltar | Sim, pretendo voltar em breve | Sim, pretendo voltar em breve | Talvez | Sim, pretendo voltar em breve |
| O que faria voltar | Terminar a faculdade | Academia perto | Ter alguem cobrando | Preço |
| App teria mudado a decisão | Não, o motivo pelo qual parei não tem relação com isso | Não, o motivo pelo qual parei não tem relação com isso | Talvez | Não, o motivo pelo qual parei não tem relação com isso |
| Recurso que incomodaria | Lembretes e notificações | Nenhum me incomodaria | Nenhum me incomodaria | Ranking e mural |
| Funcionalidade p/ voltar e ficar | Não impactaria, mas a ideia é boa | Nenhuma | Mensagem quando eu sumir | Desconto pra quem vai mais |
| O que faria desinstalar | Muita notificação | Nada | Muita propaganda | Ficar me comparando com os outros |
| Comentário | Boa sorte no tcc | Nao | Achei legal | Não |
| Aceita teste | Não | Não | Sim | Não |

#### Escala 1 a 5 dos recursos

| Recurso | E1 | E2 | E3 | E4 |
| --- | --- | --- | --- | --- |
| XP por treino | 4 | 4 | 4 | 2 |
| Check-in rápido | 3 | 4 | 4 | 3 |
| Contador de dias | 4 | 4 | 5 | 3 |
| Ofensiva | 4 | 4 | 4 | 2 |
| Missões do professor | 2 | 4 | 4 | 3 |
| Ranking de frequência | 4 | 4 | 3 | 1 |
| Medalhas por marco | 4 | 4 | 4 | 2 |
| Barra até a graduação | 4 | 4 | 5 | 4 |
| Histórico completo | 3 | 4 | 5 | 4 |
| Mural da turma | 1 | 4 | 3 | 1 |
| Mensagem automática do professor | 1 | 4 | 5 | 2 |
| Lembretes | 1 | 4 | 5 | 2 |

E3 contrasta com os dados reais: é o caso de abandono gradual, sem contato, que o alerta de 15 dias do RoundUp mira.

### Professor e Academia

Duas personas, uma por papel do modelo de atores: o professor autônomo e o dono de academia, que no forms respondem blocos separados. Sem nenhuma resposta real de professor, o estilo de escrita e as alternativas das fechadas são estimados e precisam ser conferidos no forms.

- **P1 Felipe, 27.** Instrutor de Muay Thai há 5 anos, dá aula em duas academias e tem alunos particulares. Controla presença de cabeça e pelo grupo de WhatsApp. Escreve direto, frases de uma linha.
- **P2 Cláudio, 49.** Dono de academia de boxe e Muay Thai há 15 anos, 3 instrutores. Usa sistema de mensalidade que não mostra frequência. Teme ranking expondo aluno iniciante. Escreve mais, com pontuação solta.

| Pergunta | P1 Felipe | P2 Cláudio |
| --- | --- | --- |
| Gênero | Masculino | Masculino |
| Há quanto tempo dá aulas | De 3 a 5 anos | Mais de 10 anos |
| Modalidades | Muay Thai | Boxe, Muay Thai |
| Alunos ativos | 45 | 180 |
| De cada 10, quantos ficam 6 meses | 4 | 5 |
| Momento de maior desistência | Nos primeiros 3 meses | Nos primeiros 3 meses |
| Principais motivos | Falta de tempo ou conflito com a rotina, Custo da mensalidade, Falta de motivação | Falta de tempo ou conflito com a rotina, Não percebe evolução, Lesão ou problema de saúde |
| Como acompanha frequência | De cabeça, pelo grupo da turma | Catraca e o professor anota no caderno |
| Graduação | Exame a cada 6 meses, eu vejo quem tá treinando direito | Tem tempo minimo e frequência, mas hoje é no olho, cada professor decide |
| Contata quem some | Às vezes | Sim, a recepção manda mensagem |
| Maior dificuldade | Saber quem sumiu | Padronizar entre os professores. e o aluno novo que some rapido |
| Riscos do ranking | Iniciante desanimar vendo os outros | Aluno se machucar querendo treinar demais pra subir. iniciante se sentir mal |
| Tempo por semana p/ alimentar | Até 30 minutos | Até 1 hora |
| Sistema atual | Não, só whatsapp | Sim, sistema de mensalidade. não mostra frequência nem evolução |
| Uma funcionalidade | Aviso quando aluno some | Controle de quem pode graduar |
| O que faria desistir do app | Aluno não usar | Dar mais trabalho pra recepção |
| Prática que segura aluno | Treino especial no sábado | Graduação com festa e foto |

| Recurso (1 a 5) | P1 | P2 |
| --- | --- | --- |
| XP automático | 4 | 3 |
| Check-in rápido | 5 | 5 |
| Contador de dias | 4 | 4 |
| Missões criadas por você | 3 | 3 |
| Ranking de frequência | 4 | 2 |
| Medalhas e conquistas | 4 | 4 |
| Barra até a graduação | 4 | 5 |
| Alerta de 15 dias sem aparecer | 5 | 5 |
| Relatório da turma | 4 | 5 |

### Implicações e próximos passos

As personas apontam três tensões de requisito: notificação ajuda uns e expulsa outros, ranking motiva o jovem e afasta o adulto, e qualquer entrada manual de dado vira motivo de desinstalação. Configuração de privacidade e de notificação por aluno resolve parte das três.

- Conferir no forms as alternativas que aqui foram estimadas (tempo de treino, fatores de abandono, todas as fechadas de professor)
- Duplicar o forms e preencher a cópia com as 12 personas, após sua aprovação
- Buscar ao menos uma resposta real de professor para calibrar P1 e P2
