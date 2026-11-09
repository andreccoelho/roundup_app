// RF28, RF29, RNF10: texto da política de privacidade exibido no consentimento LGPD
// (ConsentimentoLGPDScreen). O texto descreve o que o app faz de fato hoje — dados em
// src/types/index.ts, exclusão em functions/src/exclusaoConta.ts, regras em firestore.rules.
// Ao mudar a coleta, a retenção ou a visibilidade dos dados, atualize o texto E suba
// VERSAO_POLITICA_LGPD para que o consentimento seja pedido de novo.
export const VERSAO_POLITICA_LGPD = '1.0';

export interface SecaoPolitica {
  titulo: string;
  paragrafos: string[];
}

export const POLITICA_PRIVACIDADE: SecaoPolitica[] = [
  {
    titulo: '1. Quem somos e a que se aplica',
    paragrafos: [
      'O RoundUp é um aplicativo de gestão de treinos e gamificação para academias, professores e alunos de artes marciais e esportes de combate. Esta política explica como tratamos os dados pessoais de quem usa o app, conforme a Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018).',
      'O controlador dos dados é o responsável pelo RoundUp. Academias e professores que usam o app para gerir suas turmas também decidem quais alunos matricular e quais missões e pontuações criar; nesses casos, cada um responde pelo seu uso das informações dentro do app.',
    ],
  },
  {
    titulo: '2. Quais dados coletamos',
    paragrafos: [
      'Dados de cadastro (todos os perfis): nome, e-mail, senha (guardada de forma protegida pelo serviço de autenticação, nunca em texto legível), perfil escolhido (aluno, professor ou academia) e foto de perfil, que é opcional.',
      'Dados do perfil de aluno: modalidades praticadas, faixa ou grau e data de nascimento. Se o aluno tem menos de 18 anos, também pedimos nome e contato (e-mail ou telefone) do responsável legal.',
      'Dados do perfil de professor: modalidades lecionadas e graduação. Dados do perfil de academia: nome da academia, endereço e modalidades oferecidas.',
      'Dados de uso: matrículas em turmas, vínculos entre aluno, professor e academia, check-ins em sessões de treino (com data e hora), pontos e posição na classificação, progresso de missões, graduações registradas e preferências de notificação.',
      'Dados do aparelho: se você permitir notificações, guardamos o identificador (token) do seu aparelho para enviar os avisos. Na versão web não há notificações.',
      'Registro do seu consentimento: a versão desta política, se você aceitou e a data e hora do aceite.',
      'Não coletamos localização, contatos do telefone, nem usamos ferramentas de publicidade ou de análise de comportamento de terceiros.',
    ],
  },
  {
    titulo: '3. Para que usamos os dados',
    paragrafos: [
      'Criar e manter sua conta e identificar você no app (execução do serviço que você pediu).',
      'Organizar turmas, sessões, matrículas e check-ins, calcular pontos, níveis, missões e classificação, e registrar graduações.',
      'Enviar notificações de lembrete de treino, novas missões e conquistas, que você pode ligar ou desligar nas suas preferências.',
      'Verificar a idade e identificar o responsável legal de alunos menores de 18 anos, para que o tratamento dos dados de menores tenha o consentimento de um responsável.',
      'Manter a segurança do serviço e cumprir obrigações legais, incluindo guardar a prova do seu consentimento enquanto sua conta existir.',
      'Não vendemos seus dados e não os usamos para publicidade.',
    ],
  },
  {
    titulo: '4. Quem pode ver seus dados',
    paragrafos: [
      'Seus dados de perfil (nome, foto, perfil, modalidades, faixa ou graduação, e demais informações do cadastro) ficam acessíveis a outros usuários autenticados do RoundUp, porque isso é necessário para que alunos encontrem academias e professores, e para que gestores encontrem alunos para vínculo.',
      'Seu histórico de treino (check-ins, pontos, missões e graduações) é visível para você e para a academia ou professor responsável pela turma. A classificação mensal é visível aos participantes do mesmo vínculo; o aluno pode optar por não participar dela nas configurações.',
      'Usamos prestadores de serviço para operar o app: o Google Firebase (autenticação, banco de dados, armazenamento de fotos e funções do servidor) e o serviço de notificações push da Expo. Eles tratam os dados apenas para prestar o serviço, e alguns podem operar servidores fora do Brasil, com as garantias previstas na LGPD para transferência internacional.',
      'Só compartilhamos dados com autoridades quando houver obrigação legal.',
    ],
  },
  {
    titulo: '5. Por quanto tempo guardamos os dados',
    paragrafos: [
      'Guardamos seus dados enquanto sua conta existir. Quando você exclui a conta, apagamos seus dados pessoais, como descrito na seção 6.',
      'Cópias de segurança técnicas mantidas pelo provedor de infraestrutura podem permanecer por um curto período até serem sobrescritas, sem uso para outras finalidades.',
    ],
  },
  {
    titulo: '6. Seus direitos e como exercê-los',
    paragrafos: [
      'Pela LGPD você pode: confirmar que tratamos seus dados; acessá-los; corrigir dados incompletos ou desatualizados; pedir a eliminação dos dados; pedir informações sobre com quem os compartilhamos; e revogar o consentimento.',
      'Acesso e correção: você vê e edita seus dados no seu Perfil, em "Editar perfil".',
      'Eliminação: em Perfil > Conta e privacidade > "Excluir minha conta". A exclusão apaga sua conta de acesso, seu perfil, sua foto, suas matrículas, check-ins, pontos, missões, graduações, notificações e o registro do seu consentimento. A ação não pode ser desfeita.',
      'Se você é professor ou academia: turmas sem alunos matriculados são apagadas. Turmas com alunos são desativadas, as sessões futuras são canceladas e o histórico dos alunos é preservado, porque esses dados pertencem a eles. Nesses registros restam apenas identificadores técnicos que, depois da exclusão da conta, não permitem identificar você.',
      'Para os demais pedidos, ou se você não conseguir exercer um direito pelo app, fale com o responsável pelo RoundUp pelos canais de suporte do aplicativo. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).',
      'Alunos menores de 18 anos: os direitos podem ser exercidos pelo responsável legal.',
    ],
  },
  {
    titulo: '7. Segurança',
    paragrafos: [
      'Usamos autenticação com senha, regras de acesso por perfil no banco de dados e comunicação criptografada (HTTPS). Nenhum sistema é totalmente imune a falhas; se ocorrer um incidente que possa causar risco relevante a você, comunicaremos você e a ANPD, conforme a LGPD.',
    ],
  },
  {
    titulo: '8. Mudanças nesta política',
    paragrafos: [
      `Esta é a versão ${VERSAO_POLITICA_LGPD}. Se mudarmos a forma de tratar seus dados, publicaremos uma nova versão e pediremos seu consentimento novamente quando a lei exigir.`,
    ],
  },
];
