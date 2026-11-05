// Home do Aluno — RF14 (agenda + check-in inline), RF17/RF21 (nível e sequência). Dado real:
// faixa/grau e modalidades (de `usuarios`), próximas sessões e estado de check-in (de
// `sessoes`/`checkins`, mesma lógica de AgendaScreen/statusCheckIn), pontos totais
// (`classificacoes`, somados entre todos os vínculos) e sequência (histórico de check-ins). Base
// de pontuação é PROVISÓRIA — ver docs/DECISOES_PENDENTES.md.
//
// Esta tela só busca dados e reage a ações; a apresentação inteira está em HomeAlunoVisao.tsx
// (a mesma usada pela Galeria, com dados fictícios).
import { useCallback, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardAlunoNavigationProp } from '../../navigation/AlunoTabs';
import { listarProximasSessoesDoAluno } from '../../services/sessoes';
import { realizarCheckIn, buscarCheckInDaSessao, listarHistoricoDoAluno } from '../../services/checkins';
import { buscarTurma } from '../../services/turmas';
import { listarClassificacoesDoAluno } from '../../services/classificacoes';
import { buscarNiveisDoAluno } from '../../services/configuracoesGamificacao';
import { paraData } from '../../utils/datas';
import { estadoCheckIn, motivoJanelaFechada } from '../../utils/statusCheckIn';
import { calcularMedalhas, calcularProgressoNivel, calcularSequencia, MedalhaComEstado, ProgressoNivel } from '../../utils/gamificacao';
import { mensagemErro } from '../../utils/mensagensErro';
import Tela from '../../components/ui/Tela';
import Aviso from '../../components/ui/Aviso';
import MomentoConquista from '../../components/ui/MomentoConquista';
import { useConquistas } from '../../hooks/useConquistas';
import HomeAlunoVisao, { type SessaoHome } from './HomeAlunoVisao';

const MAXIMO_SESSOES_EXIBIDAS = 4;

export default function DashboardScreen() {
  const { usuario } = useAuth();
  const navigation = useNavigation<DashboardAlunoNavigationProp>();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [itens, setItens] = useState<SessaoHome[]>([]);
  const [enviandoId, setEnviandoId] = useState<string | null>(null);
  const [erroCheckIn, setErroCheckIn] = useState<string | null>(null);

  const [progresso, setProgresso] = useState<ProgressoNivel | null>(null);
  const [sequencia, setSequencia] = useState(0);
  const [medalhas, setMedalhas] = useState<MedalhaComEstado[] | undefined>(undefined);
  const [progressoPronto, setProgressoPronto] = useState(false);

  const carregar = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      const sessoes = await listarProximasSessoesDoAluno(usuario.id);
      const comDados = await Promise.all(
        sessoes.slice(0, MAXIMO_SESSOES_EXIBIDAS).map(async (sessao): Promise<SessaoHome> => {
          const [turma, checkIn] = await Promise.all([
            buscarTurma(sessao.turmaId),
            buscarCheckInDaSessao(sessao.id, usuario.id),
          ]);
          const estado = estadoCheckIn(sessao, checkIn !== null);
          return {
            id: sessao.id,
            nomeTurma: turma?.nome ?? 'Turma',
            inicio: paraData(sessao.inicio),
            janelaInicio: paraData(sessao.janelaCheckInInicio),
            janelaFim: paraData(sessao.janelaCheckInFim),
            estado,
            motivo: estado === 'foraDaJanela' ? motivoJanelaFechada(sessao) : undefined,
          };
        }),
      );
      setItens(comDados);
    } catch (e) {
      setErro(mensagemErro(e, 'Não foi possível carregar seus treinos agora.'));
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (!usuario) return;
    // Progresso é conteúdo secundário desta tela — falha aqui não deve bloquear o check-in, que é
    // a RNF01. Em erro, mostra nível 1 / sequência 0 em vez de estado de erro.
    // RF33: a tabela de níveis é a do responsável em que o aluno mais pontuou (buscarNiveisDoAluno)
    Promise.all([listarClassificacoesDoAluno(usuario.id), listarHistoricoDoAluno(usuario.id)])
      .then(async ([classificacoes, historico]) => {
        const pontosTotais = classificacoes.reduce((soma, c) => soma + c.pontos, 0);
        const sequenciaAtual = calcularSequencia(historico);
        const validados = historico.filter((c) => c.status === 'validado').length;
        const niveis = await buscarNiveisDoAluno(classificacoes);
        setProgresso(calcularProgressoNivel(pontosTotais, niveis));
        setSequencia(sequenciaAtual);
        // Medalhas de graduação ficam de fora: dependem de `graduacoes`, que esta tela não lê.
        setMedalhas(calcularMedalhas(validados, sequenciaAtual, 0));
        setProgressoPronto(true);
      })
      .catch(() => {
        setProgresso(calcularProgressoNivel(0));
        setSequencia(0);
      });
  }, [usuario]);

  // Celebração do lado do aluno: compara com o último estado salvo neste aparelho.
  const { conquista, restantes, proxima } = useConquistas({
    usuarioId: usuario?.id,
    nivel: progresso?.nivel,
    faixa: usuario?.faixaOuGrau,
    medalhas,
    pronto: progressoPronto,
  });

  async function handleCheckIn(sessaoId: string) {
    if (!usuario || enviandoId) return;
    setEnviandoId(sessaoId);
    setErroCheckIn(null);
    try {
      await realizarCheckIn(sessaoId, usuario.id);
      setItens((prev) => prev.map((item) => (item.id === sessaoId ? { ...item, estado: 'realizado' } : item)));
    } catch (e) {
      setErroCheckIn(mensagemErro(e, 'Não foi possível fazer o check-in. Tente novamente.'));
    } finally {
      setEnviandoId(null);
    }
  }

  return (
    <Tela
      largura="lista"
      preenchimento={false}
      sobreposicao={
        <Aviso visivel={erroCheckIn !== null} tipo="erro" mensagem={erroCheckIn ?? ''} onFechar={() => setErroCheckIn(null)} acimaDaTabBar />
      }
    >
      <HomeAlunoVisao
        nome={usuario?.nome ?? ''}
        fotoUrl={usuario?.fotoUrl}
        faixa={usuario?.faixaOuGrau}
        modalidades={usuario?.modalidades ?? []}
        sessoes={itens}
        carregando={carregando}
        erro={erro}
        enviandoId={enviandoId}
        progresso={progresso}
        sequencia={sequencia}
        onCheckIn={handleCheckIn}
        onTentarNovamente={carregar}
        onVerAgenda={() => navigation.navigate('Agenda')}
        onTurmasDisponiveis={() => navigation.navigate('TurmasDisponiveis')}
        onHistorico={() => navigation.navigate('Historico')}
      />
      <MomentoConquista conquista={conquista} onFechar={proxima} posicaoFila={restantes > 1 ? `Mais ${restantes - 1} a seguir` : undefined} />
    </Tela>
  );
}
