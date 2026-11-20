# Roteiro de estudo — Defesa do RoundUp

Nov 20, 2026 · @André

Defesa na segunda-feira, Nov 23, 2026, com 20 minutos no máximo e 20 slides. Este roteiro traz o tempo de cada slide, o que falar em cada um, o roteiro da demonstração, os números para memorizar e as perguntas prováveis da banca.

**O que mudou em 20/11, depois do retorno da orientadora.** Ela aprovou a parte de requisitos e os cenários, mas disse que, como é uma defesa de TCC e não um pitch, faltava mostrar a engenharia. Pediu três diagramas: um de caso de uso (não todos), o de sequência e o do banco de dados. Por isso:

- O slide 13 virou **Casos de uso e sequência**: um recorte do pacote Treinos e o diagrama de sequência do registro de presença.
- Entrou o slide 14, **Modelo de dados**: as coleções do Firestore e três decisões de modelagem.
- O slide 15, **Desenvolvimento com IA**, ganhou os números do repositório.
- O slide 16, **Testes**, trocou o cartão da limitação do Firestore (que foi para o slide 14) pelos testes por camada.
- Para caber no tempo, os slides 2, 7, 9, 15, 16 e 19 ficaram mais curtos.

A mensagem que a banca precisa ouvir nos slides 13 a 16: o app foi feito com IA, mas com engenharia por trás. Houve modelagem, decisões técnicas justificadas e testes automatizados que funcionaram como guardrails.

## Tempo por slide

A ordem segue o fluxograma da Metodologia: requisitos; depois a frente da avaliação (respostas reais, personas, respostas das personas, comparação das notas, decisões e ideias novas); depois a construção (modelagem, desenvolvimento e testes); por fim, o app nos cenários. A soma dá cerca de 19 minutos e 35 segundos, com pouca margem. Use a coluna "Relógio" como ponto de controle. Se estiver atrasado no slide 12, encurte os slides 8 e 12 para 45 e 30 segundos. Se ainda estiver atrasado no slide 16, encurte o Cenário 2 para 1 minuto.

| Slide | Título | Tempo | Relógio ao terminar |
| --- | --- | --- | --- |
| 1 | Capa | 0:20 | 0:20 |
| 2 | Frase de Durant | 0:30 | 0:50 |
| 3 | Motivação | 1:00 | 1:50 |
| 4 | Proposta | 0:45 | 2:35 |
| 5 | Metodologia | 1:00 | 3:35 |
| 6 | Requisitos | 1:00 | 4:35 |
| 7 | Respostas reais | 0:30 | 5:05 |
| 8 | Personas | 1:00 | 6:05 |
| 9 | Respostas das personas | 0:30 | 6:35 |
| 10 | Avaliação das ideias | 1:15 | 7:50 |
| 11 | Decisões sobre os requisitos | 1:00 | 8:50 |
| 12 | Ideias novas | 0:45 | 9:35 |
| 13 | Casos de uso e sequência | 1:15 | 10:50 |
| 14 | Modelo de dados | 1:00 | 11:50 |
| 15 | Desenvolvimento com IA | 1:00 | 12:50 |
| 16 | Testes | 0:45 | 13:35 |
| 17 | Cenário 1: aluna iniciante | 1:30 | 15:05 |
| 18 | Cenário 2: aluno com 1 ano de treino | 1:30 | 16:35 |
| 19 | Cenário 3: professor e academia | 1:45 | 18:20 |
| 20 | Conclusão e encerramento | 1:15 | 19:35 |

## Abertura e contexto (slides 1 a 4)

Objetivo desta parte: em 2 minutos e meio, a banca entende o problema e o que o app faz.

1. **Capa (0:20).** Diga seu nome, o título do trabalho, a orientadora e agradeça aos professores William e Paulo.
2. **Frase de Durant (0:30).** Leia a frase devagar. Ligue com as lutas: técnica, faixa e saúde vêm da repetição dos treinos. Feche com o problema: muita gente para antes de criar o hábito.
3. **Motivação (1:00).** Três pontos, um por coluna:
   - Treinar faz bem: a meta-análise de Moore, Dudley e Woodcock (2020) mostrou menos ansiedade e depressão.
   - Muitos alunos desistem cedo: falta de percepção de evolução, falta de metas, mudança de rotina.
   - A academia também perde: receita e vínculo com o aluno.
   - Frase final: a ideia do trabalho foi usar gamificação para ajudar o aluno a continuar treinando.
4. **Proposta (0:45).** O RoundUp tem três perfis. Aluno: gamificação. Professor: gestão da turma, autônomo ou vinculado a uma academia. Academia: recursos do professor, gestão dos professores e indicadores. Diga o objetivo geral em uma frase: idear, desenvolver e verificar o app, avaliando as ideias com potenciais usuários.

## Metodologia, requisitos e avaliação (slides 5 a 12)

Objetivo desta parte: seguir o fluxograma. Das ideias aos requisitos, e da avaliação das ideias de volta aos requisitos. Termine no relógio 9:35.

1. **Metodologia (1:00).** Diga que, como o trabalho é prático, a metodologia é o processo de engenharia: um modelo iterativo e incremental com protótipo. Leia o fluxograma pelas fases: planejamento (13 ideias tratadas como hipóteses), requisitos, e depois duas frentes ao mesmo tempo, a construção (modelagem, 4 ciclos com IA, testes) e a avaliação (questionário real em setembro, respostas sintéticas em outubro). Aponte a seta vermelha: a avaliação fez você voltar aos requisitos. Anuncie a ordem: requisitos, avaliação, construção e o app.
2. **Requisitos (1:00).** 33 RF, 9 RN e 11 RNF, cada um com código, origem, ciclo, prioridade MoSCoW e situação. Os códigos aparecem nos comentários do código, o que permite seguir uma funcionalidade da ideia até o teste. Os 4 ciclos: contas e treinos (14 RF), gamificação (6), gestão (8), LGPD e retenção (5). Regras que protegem a gamificação: RN01, RN03 e RNF11.
3. **Respostas reais (0:30).** 6 respondentes (4 praticantes, 2 ex-praticantes), todos de Jiu-Jitsu, nenhum professor. Destaque só dois achados: os 2 ex-praticantes pararam por falta de tempo e disseram que um app não mudaria isso; e os motivos para desinstalar foram muitas notificações e muitos dados para inserir. Transição: faltou a visão do professor.
4. **Personas (1:00).** Por isso foram criadas 12 personas (6 alunos, 4 ex-alunos, 2 professores) com apoio de IA, a partir do padrão das respostas reais. Cite dois exemplos (Rafaela não quer ranking; Marcelo vê o app como trabalho extra). Usos: gerar ideias, sinal complementar, testar o questionário e, mais adiante, guiar os cenários.
5. **Respostas das personas (0:30).** 65 respostas: 32 de alunos, 23 de ex-alunos e 10 de professores, o perfil que faltava. Professores sintéticos: gestão com notas de 4,5 a 5,0 e ranking com 2,4.
6. **Avaliação das ideias (1:15).** O gráfico compara as duas fontes: vermelho = reais, cinza = personas. Só as reais decidem, com corte de 3,5: 6 de 12 confirmadas, com destaque para barra de graduação e histórico (3,8). As personas deram nota maior em 11 de 12 ideias (só o ranking ficou abaixo); nota mínima em 4% contra 15% das reais e máxima em 30% contra 16%. Conclusão: as personas foram mais otimistas, o que justifica não decidir por elas.
7. **Decisões sobre os requisitos (1:00).** É a seta vermelha do fluxograma. Dos 33 requisitos, 16 dependiam das ideias avaliadas: 4 mantidos, 3 ajustados (graduação por graus e ranking), 4 a revisar e 5 sem dados. Depois explique o painel escuro, o ajuste do ranking (RF20). Por que mudou: as respostas reais confirmaram a ideia (3,7), mas os professores sintéticos deram 2,4, citando lesão e exposição de quem treina menos, e Ryan e Deci (2000) alertam que a competição pode enfraquecer a motivação interna. Como ficou: mensal, só com os pontos do mês (RN04); restrito à academia ou à turma do aluno (RN09); e opcional, o aluno pode sair (RNF11). Diga que a opção de sair fica no perfil do aluno, que vai aparecer no Cenário 2.
8. **Ideias novas (0:45).** 9 requisitos candidatos que você não tinha previsto, 7 deles das personas. Dos professores: check-in por QR code, critérios para graduar e acompanhamento do aluno novo. Dos alunos: registro de técnicas e reserva de vaga. Dois RNF: sem trabalho extra para o professor e sem propaganda nem comparação forçada. Das respostas reais: o professor ver a progressão (já coberta) e benefícios aos assíduos (fora do escopo). Frase-chave: esse foi o principal ganho das personas. Transição: com os requisitos consolidados, passo à construção.

## Construção (slides 13 a 16)

Objetivo desta parte: mostrar a engenharia por trás do app, o ponto que a orientadora pediu para reforçar. Fale devagar e aponte os diagramas com o cursor. Termine no relógio 13:35.

1. **Casos de uso e sequência (1:15).** Comece pela esquerda e depois vá para a direita.
   - Casos de uso: 30 casos de uso em 7 pacotes, em UML. No slide está um recorte do pacote Treinos, com os quatro casos que formam o registro de presença: o aluno se matricula (UC10), o professor cria a sessão (UC11), o aluno faz check-in (UC12) e o professor valida (UC15). Aponte a seta com triângulo vazado: a academia é especialização do professor e herda os casos de uso dele.
   - Sequência: o app do aluno chama `realizarCheckIn`. O serviço lê a sessão e a matrícula numa transação e confere a janela de horário (RN08) e se já existe check-in (RN02). Grava o check-in como "pendente". Depois o professor chama `validarCheckIn`, e na mesma transação o sistema credita o XP no check-in e na classificação do mês (seta vermelha, RN01). Só então o aluno vê o novo XP, nível, sequência e medalhas.
   - Frase-chave: sem a validação do professor, não há pontos.
2. **Modelo de dados (1:00).** O Firestore é um banco NoSQL de documentos, então o modelo é de coleções, e não de tabelas. Aponte a linha do meio, que é o caminho da presença: turmas, sessões, check-ins e classificações. Depois, o cartão escuro com as três decisões:
   - ID determinístico: o check-in tem o id `sessaoId_alunoId`, então o próprio banco impede dois check-ins do mesmo aluno na mesma aula (RN02). A classificação usa aluno, responsável e mês, o que separa o ranking por vínculo e por mês.
   - Lista de leitores: o motor de regras não aceita consultas de lista cuja permissão depende de outra coleção, e você descobriu isso nos testes. Cada sessão guarda quem pode lê-la (`leitoresIds`), e Cloud Functions atualizam essa lista quando uma matrícula muda.
   - Dados derivados: nível e sequência são calculados no app a partir dos check-ins validados; não são gravados, para não ficarem fora de sincronia.
3. **Desenvolvimento com IA (1:00).** Leia os números do subtítulo: 129 commits em 12 dias, cerca de 18 mil linhas de TypeScript e 679 linhas de regras de segurança. Depois os 4 ciclos e os 4 controles (guardrails): instruções no repositório, plano antes do código, mudanças pequenas e testes automatizados. Frase-chave: com IA, qualquer alteração pode gerar defeitos em outro lugar, então os testes foram essenciais.
4. **Testes (0:45).** 288 testes aprovados, em três camadas: 62 de unidade, 163 das regras de segurança e 63 das Cloud Functions, no emulador do Firebase. As regras são as mais importantes, porque garantem no servidor, por exemplo, que não há pontos sem validação. Depois os números: 2,13 s em 4G (meta 3 s); 1 toque para o check-in (meta 3); 0 violações de acessibilidade. Feche com o iPhone (5 defeitos, corrigidos e cobertos por testes) e a LGPD testada. Transição: agora, o app pela perspectiva das personas.

## Cenários e demonstração (slides 17 a 19)

Objetivo desta parte: contar uma história contínua. A Marina faz check-in na aula do Felipe, o Felipe confirma a presença dela na chamada e, no fim, ela vê o XP subir. É o mesmo fluxo do diagrama de sequência do slide 13, agora no app; vale dizer isso na chamada do Felipe. Termine no relógio 18:20.

As contas são criadas por `scripts/seed-personas.cjs`, todas na Academia Arena Tatame e com a senha `Demo@2026`:

| Conta | Persona | E-mail |
| --- | --- | --- |
| Aluna | Marina Alves, primeira semana, faixa branca, turma Jiu-Jitsu Iniciante | marina.aluna@example.com |
| Aluno | Davi Santos, 16 anos, 1 ano de treino, faixa branca 3º grau, turma Jiu-Jitsu Adulto | davi.aluno@example.com |
| Professor | Felipe Moraes, professor de Jiu-Jitsu da turma Iniciante (a da Marina), vinculado à academia | felipe.professor@example.com |
| Academia | Cláudio Ribeiro, dono da Academia Arena Tatame | academia.arena@example.com |

### Cenário 1: Marina, primeira semana (1:30)

Pergunta da persona: "Todo mundo aqui é mais graduado. O que eu preciso fazer para aprender o básico?"

1. Conta da Marina, tela Treinar: toque em "Fazer check-in" na Aula da demonstração, que é a aula do Felipe. Diga: um toque registra o treino, e o check-in fica pendente até o professor confirmar.
2. Perfil: mostre as medalhas ainda bloqueadas de 10 treinos e de 7 seguidos, as primeiras metas dela.
3. Missões: mostre "Fundamentos do mês", 12 treinos no mês, com prazo e recompensa.
4. Treinar: mostre o anel de nível e a sequência de 3 treinos. Anote o XP para comparar no fim.
5. Feche com o limite: trilha de técnicas básicas e acompanhamento do aluno novo ainda não existem; são requisitos candidatos.

### Cenário 2: Davi, 1 ano de treino (1:30)

Pergunta da persona: "Já treino direto, mas não sei quando vou graduar. Falta pouco ou muito?"

1. Conta do Davi, tela Treinar: sequência de 12 treinos seguidos e nível 5.
2. Perfil: barra de graduação no 3º grau de 4, próxima faixa azul. Diga que foi a ideia mais bem avaliada (3,8). Mostre as medalhas com data, inclusive a de primeira graduação.
3. Histórico: cerca de 85 treinos em um ano.
4. Classificação: ranking do mês da academia; o aluno pode sair dele.
5. Feche com o limite: o app não diz quando ele vai graduar, porque a decisão é sempre do professor (RN03).

### Cenário 3: Felipe e a academia (1:45)

Pergunta da persona: "Não sei quem está sumindo nem como cada um evolui." O Felipe é o professor da Marina. A academia tem mais dois professores: Otávio, do Jiu-Jitsu Adulto (a turma do Davi), e Ricardo, do Muay Thai.

1. Conta do Felipe, tela Hoje: abra a chamada da Aula da demonstração. A Marina aparece com o check-in do Cenário 1, ao lado de 4 colegas (Bruno, Carla, Beatriz e Mateus). Confirme todos. Diga: é essa confirmação que gera os pontos, a seta vermelha do diagrama de sequência.
2. Troque para a conta da academia. Explique: o professor vinculado faz a chamada; alunos, graduações e missões ficam com a academia, responsável pela turma. Mostre rapidamente os três professores vinculados.
3. Alunos: mostre o alerta de queda; o Leonardo, da turma do Felipe, veio uma vez e sumiu.
4. Registre uma graduação, por exemplo um grau para a Marina ou um colega dela.
5. Missões: crie uma missão para a turma. Se o tempo estiver apertado, só mostre a tela de missões sem criar.
6. Volte à conta da Marina e mostre o XP maior que no Cenário 1.
7. Feche com o limite: nenhum professor real respondeu ao questionário, então a gestão ainda precisa ser validada.

### Cuidados da demo

- O script também é o reset: rodar de novo apaga o que foi feito no app (check-in da Marina, presenças confirmadas, missões e graduações criadas) e volta tudo ao ponto de partida. Pode ensaiar à vontade e resetar depois.
- No dia 23, rode o reset depois de cada teste e uma última vez por volta das 15:30. A Aula da demonstração aceita check-in das 06:30 às 23:00. No PowerShell, na pasta roundup\_app, primeiro a credencial e depois o script:

```
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\André Costa\chaves\roundup-app-a5a82-firebase-adminsdk-fbsvc-d9070ed536.json"
$env:DEMO_DATA="2026-11-23"; node scripts/seed-personas.cjs --aplicar
```
- Deixe as 4 contas logadas antes de começar, cada uma num perfil de navegador.
- Plano B: as capturas de tela estão em `docs/apresentacao-defesa/img`, caso a internet ou o app falhem.

## Conclusão e encerramento (slide 20)

**Conclusão (1:15).** Quatro pontos: progresso visível foi o mais bem avaliado; parte da evasão tem causas externas; com IA, o desenvolvedor especifica, projeta e testa; respostas sintéticas geram ideias mas não substituem usuários. Depois as limitações e os trabalhos futuros da faixa de baixo. Para encerrar, como não há mais o slide de encerramento, volte em uma frase à ideia de Durant (o hábito se forma pela repetição, e o app tenta ajudar o aluno a chegar lá), agradeça e abra para perguntas.

## Números para memorizar

Todos vêm do relatório. Se esquecer um número na hora, diga que está no capítulo indicado.

| Tema | Número | Onde no relatório |
| --- | --- | --- |
| Ideias iniciais | 13 (I01 a I13) | Quadro 1 |
| Requisitos | 33 RF, 9 RN, 11 RNF | Cap. 2 |
| Ciclos | 4: contas e treinos, gamificação, gestão, LGPD e retenção | Seção 2.4 |
| Casos de uso | 30 (UC01 a UC30) em 7 pacotes; caso central UC12, completado pelo UC15 | Cap. 3 |
| Modelo de dados | Coleções no Firestore; IDs determinísticos: check-in `sessaoId_alunoId`, matrícula `turmaId_alunoId`, classificação `alunoId_responsavelId_AAAA-MM` | Seção 3.2 |
| Repositório | 129 commits em 12 dias, cerca de 18 mil linhas de TypeScript, 679 linhas de regras | Seção 4.4 |
| Testes | 288 (62 unidade, 163 regras, 63 Cloud Functions); eram 194 antes da etapa final | Tabela 6 |
| Carregamento | 2,13 s em 4G (2,25; 2,22; 1,92), meta 3 s | CT22 |
| Check-in | 1 toque na tela inicial, meta 3 | CT15 |
| Acessibilidade | 0 violações, WCAG 2.1 A e AA, 9 telas | Seção 5.3.2 |
| Defeitos no iPhone | 5, todos corrigidos | Seção 5.3.3 |
| Questionário real | 6 respostas (4 praticantes, 2 ex), 18 e 19 de setembro | Tabela 1 |
| Ideias confirmadas | 6 de 12 (corte 3,5) | Tabela 2 |
| Melhor nota | 3,8: barra de graduação e histórico | Tabela 2 |
| Decisões | 4 mantidos, 3 ajustados, 4 a revisar, 5 sem dados | Quadros 2 e 3 |
| Respostas sintéticas | 65, de 12 personas (32 alunos, 23 ex-alunos, 10 professores), 26 de outubro | Tabela 3 |
| Requisitos candidatos | 9, sendo 7 vindos das sintéticas | Quadro 4 |
| Viés das sintéticas | nota 1: 4% contra 15%; nota 5: 30% contra 16% | Tabela 5 |
| Gamificação padrão | 10 XP por presença; 10 níveis (100 a 3.250 pontos); medalhas de 10, 30 e 100 treinos e de 7 e 30 seguidos | Seção 4.5 |
| Uso de IA no mercado | cerca de 90% usam (DORA 2025); 55,8% mais rápido (Peng, 2023); 19% mais lento (Becker, 2025) | Cap. 1 |

## Perguntas prováveis da banca

Responda em duas ou três frases: a resposta primeiro, depois o motivo. Quando for uma limitação, admita e diga o próximo passo.

**Amostra e avaliação**

1. **Seis respostas bastam para concluir algo?** Não para generalizar. A análise foi descritiva, com média e mediana, e serviu para orientar decisões. O próximo passo é reaplicar com mais pessoas, outras modalidades e professores.
2. **Por que todos são de Jiu-Jitsu?** O link foi divulgado pelo WhatsApp no meu círculo de contatos, e eu treino Jiu-Jitsu. Isso está registrado como limitação.
3. **Por que o corte em 3,5?** É o ponto que separa a metade superior da escala de 1 a 5. A mediana foi usada para conferir se uma média estava puxada por respostas extremas.
4. **Se o check-in teve 3,2, por que ele continua no app?** Porque é a base do sistema: pontos, sequência e relatórios dependem dele. A nota baixa veio dos ex-praticantes (2,5); entre praticantes foi 3,5. O comentário sobre "inserir muitos dados" reforçou o critério de poucos toques, e hoje é um toque.
5. **Para que servem respostas sintéticas se não validam nada?** Para gerar ideias de perfis que a coleta não alcançou, como o professor, e para testar o questionário e a análise. Ficaram separadas e marcadas, e nenhuma decisão sobre requisito dependeu delas.

**Modelagem e dados**

6. **Por que um banco NoSQL e não um relacional?** O Firestore vem junto com autenticação, regras de segurança declarativas e Cloud Functions, e as regras podem ser testadas no emulador. O preço é modelar por coleções e às vezes duplicar dados, como a lista de leitores, porque não há junções.
7. **Como o sistema garante um check-in por aluno por aula?** De duas formas. O id do check-in é `sessaoId_alunoId`, então um segundo check-in cairia no mesmo documento. E a transação de `realizarCheckIn` confere se ele já existe antes de gravar (RN02).
8. **Por que nível e sequência não ficam gravados no banco?** São dados derivados dos check-ins validados. Calcular no app evita que fiquem fora de sincronia quando uma validação é desfeita. As medalhas são exceção: uma Cloud Function grava a data da conquista (RF19).
9. **O que acontece se o professor desfizer uma confirmação?** O check-in volta a "pendente" e o sistema estorna os pontos, na mesma transação. É o fluxo alternativo 3a do UC15.
10. **Por que a academia é especialização do professor?** Porque ela faz tudo o que o professor faz e ainda gerencia professores e indicadores. Foi uma correção durante o projeto, que antes tinha só dois atores, e ela mudou requisitos, modelo de dados, regras e telas.

**Engenharia e segurança**

11. **O aluno consegue ganhar pontos sem treinar?** Não. Pela RN01, os pontos só entram depois da validação do professor, na mesma transação que atualiza a classificação. As regras do Firestore validam isso no servidor, então um app alterado também não consegue. Há testes para isso (CT05, CT07, CT08).
12. **Onde roda a lógica: no app ou no servidor?** O check-in e a validação rodam no app, em transações do Firestore, e as regras de segurança conferem cada escrita no servidor. O que o cliente não pode fazer sozinho fica em Cloud Functions: listas de leitores, medalhas, missões, notificações e exclusão de conta.
13. **Qual foi a maior dificuldade técnica?** O motor de regras do Firestore não aceita consultas de lista cuja permissão depende de outra coleção. A solução foi guardar em cada sessão a lista de quem pode lê-la, mantida por Cloud Functions. Outro caso: o emulador subia no projeto errado, e os testes de Cloud Functions travavam.
14. **Por que o app não funciona sem internet (RNF06)?** Foi uma decisão. O servidor precisa garantir a janela de horário e o limite de um check-in por aula. Um registro feito offline poderia ser recusado depois, quando o aluno já achava que tinha os pontos.
15. **Por que React Native e Firebase?** Uma base de código para Android, iOS e web, e serviços gerenciados com regras de segurança declarativas e testáveis em emulador.
16. **Foi testado no Android?** Não em aparelho. A compatibilidade vem da versão mínima do SDK. O teste em Android está nos trabalhos futuros.
17. **Como a sequência é calculada?** Por aula, não por dia. Aula cancelada não conta e dia sem aula não quebra a sequência. Ela só quebra quando houve aula e o aluno faltou.

**Uso de IA**

18. **Quanto do código foi escrito pela IA?** A maior parte, mas o histórico do Git não separa o que foi do agente e o que foi meu. Por isso o relatório não mede produtividade, só descreve o processo e os controles.
19. **Se a IA escreveu o código, qual foi o seu trabalho?** Definir ideias, requisitos, casos de uso, modelo de dados e regras de negócio; escrever os roteiros com critérios de aceite; revisar cada etapa; definir e rodar os testes; executar no aparelho. A responsabilidade pelo resultado é minha.
20. **Como garantir que o agente não quebrou algo?** Com mudanças pequenas, uma por commit, e com 288 testes rodando sobre a versão final. Os testes chegaram a refutar hipóteses técnicas adotadas durante o desenvolvimento, como no caso da lista de leitores.

**Produto e LGPD**

21. **O ranking não pode desmotivar quem treina menos?** Pode, e por isso ele é mensal, opcional e limitado ao vínculo do aluno. Os professores sintéticos deram 2,4 e citaram lesões e exposição, o que reforçou essas salvaguardas.
22. **Como os valores de pontos e níveis foram definidos?** São valores-padrão para construir e testar o app, ainda não calibrados com uso real. O professor ou a academia podem personalizar (RF33).
23. **Como a LGPD foi tratada, inclusive com menores?** Consentimento no cadastro, registro do responsável legal de menores de 18, dados pessoais visíveis só ao próprio usuário, isolamento entre academias e exclusão de conta em cascata. Fica em aberto se o registro de consentimento deve ser guardado após a exclusão, o que depende de orientação jurídica.
24. **Qual o diferencial em relação aos apps de gestão de academia?** O relatório não fez uma comparação sistemática. A proposta junta gamificação para o aluno e gestão para o professor, com pontos que dependem da validação do professor.
25. **O app reduz a evasão?** Isso não foi medido no prazo do TCC. Parte da evasão tem causas externas, como falta de tempo. O próximo passo é comparar a frequência antes e depois do uso.

## Checklist do ensaio e do dia

A orientadora marcou o ensaio para hoje, sexta, Nov 20, 2026, às 21:00 (ela vai mandar o convite). Ela não vai interromper: é como se fosse a banca. Por isso o ensaio de hoje precisa ter demonstração e cronômetro.

**Antes do ensaio de hoje (21:00)**

- [ ] Compartilhar o link dos slides com a orientadora (menu Compartilhar), porque ele é privado
- [ ] Ler os slides 13 e 14 em voz alta umas três vezes, apontando cada parte do diagrama, até a explicação sair sem ler
- [ ] Ensaiar sozinho uma vez, completo, com a demonstração e cronômetro; anotar onde passou do tempo da tabela
- [ ] Rodar o reset antes desse ensaio e de novo antes das 21:00, com DEMO\_DATA=2026-11-20 (as duas linhas do comando no fim da lista, credencial primeiro)
- [ ] Ler em voz alta as respostas das perguntas 1, 4, 6, 7, 11, 12 e 18, as mais prováveis

**Antes da defesa**

- [ ] No Firebase Console, em Authentication > Configurações > Domínios autorizados, adicionar roundup-tcc.web.app e roundup-tcc.firebaseapp.com; depois testar o login e o check-in nesse endereço
- [ ] Ajustar o que a orientadora apontar no ensaio de hoje
- [ ] Domingo, 22/11: ensaio completo com a demonstração e cronômetro. Rodar o reset antes, com DEMO\_DATA=2026-11-22, e de novo depois
- [ ] Dia 23, às 14:30: rodar o reset com DEMO\_DATA=2026-11-23 (comando abaixo)
- [ ] Logo depois, entrar nas 4 contas em roundup-tcc.web.app, cada uma num perfil de navegador: Marina, Davi, Felipe e academia
- [ ] Se testar alguma interação (check-in, chamada, graduação, missão), rodar o reset de novo
- [ ] Por volta das 15:30: reset final. Depois disso, não mexer mais no app até a demonstração
- [ ] Testar a internet da sala e ter o 4G do celular como reserva
- [ ] Ter as capturas de docs/apresentacao-defesa/img abertas como plano B

Comando do reset (PowerShell, na pasta roundup\_app; troque a data pelo dia do ensaio):

```
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\André Costa\chaves\roundup-app-a5a82-firebase-adminsdk-fbsvc-d9070ed536.json"
$env:DEMO_DATA="2026-11-23"; node scripts/seed-personas.cjs --aplicar
```

**Na hora**

- [ ] Conferir o relógio no slide 12 (meta 9:35) e no slide 16 (meta 13:35)
- [ ] Se atrasar no slide 12, encurtar os slides 8 e 12; se atrasar no slide 16, encurtar o Cenário 2 para 1 minuto
