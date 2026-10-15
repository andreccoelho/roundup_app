// RF06: perfil do aluno — leitura, edição (EditarPerfilScreen: nome, foto, faixa, modalidades),
// vínculos, notificações, conta e privacidade, e sair.
// RF17, RF19, RF21: nível/XP, sequência e medalhas calculados ao vivo a partir de check-ins,
// graduações e classificações do aluno — sem coleção persistida, valores PROVISÓRIOS (ver
// docs/DECISOES_PENDENTES.md). Mesma fonte de dados que aluno/DashboardScreen.tsx já usa.
// Apresentação em PerfilAlunoVisao.tsx (a mesma da Galeria).
import { useCallback, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { PerfilAlunoNavigationProp } from '../../navigation/AlunoTabs';
import { listarHistoricoDoAluno } from '../../services/checkins';
import { listarGraduacoesPorAluno } from '../../services/graduacoes';
import { listarClassificacoesDoAluno } from '../../services/classificacoes';
import { calcularMedalhas, calcularProgressoNivel, calcularSequencia, MedalhaComEstado, ProgressoNivel } from '../../utils/gamificacao';
import { formatarMesAno } from '../../utils/datas';
import Tela from '../../components/ui/Tela';
import PerfilAlunoVisao from './PerfilAlunoVisao';

// docs/DECISOES_PENDENTES.md R-03: a única medalha em ouro é a mais alta da progressão principal.
const ID_MEDALHA_MAXIMA = 'treinos-100';

export default function PerfilScreen() {
  const { usuario, logout } = useAuth();
  const navigation = useNavigation<PerfilAlunoNavigationProp>();
  const [medalhas, setMedalhas] = useState<MedalhaComEstado[]>([]);
  const [progresso, setProgresso] = useState<ProgressoNivel | null>(null);
  const [sequencia, setSequencia] = useState(0);
  const [treinosValidados, setTreinosValidados] = useState(0);

  const carregarDetalhes = useCallback(async () => {
    if (!usuario) return;
    try {
      const [historico, graduacoes, classificacoes] = await Promise.all([
        listarHistoricoDoAluno(usuario.id),
        listarGraduacoesPorAluno(usuario.id),
        listarClassificacoesDoAluno(usuario.id),
      ]);
      const validados = historico.filter((c) => c.status === 'validado').length;
      const sequenciaAtual = calcularSequencia(historico);
      const pontosTotais = classificacoes.reduce((soma, c) => soma + c.pontos, 0);

      setTreinosValidados(validados);
      setSequencia(sequenciaAtual);
      setProgresso(calcularProgressoNivel(pontosTotais));
      setMedalhas(calcularMedalhas(validados, sequenciaAtual, graduacoes.length));
    } catch {
      // Seção secundária — falha aqui não impede o resto do perfil (ex.: Sair).
      setMedalhas([]);
      setProgresso(calcularProgressoNivel(0));
      setSequencia(0);
      setTreinosValidados(0);
    }
  }, [usuario]);

  useEffect(() => {
    carregarDetalhes();
  }, [carregarDetalhes]);

  return (
    <Tela largura="lista" preenchimento={false}>
      <PerfilAlunoVisao
        nome={usuario?.nome ?? ''}
        fotoUrl={usuario?.fotoUrl}
        faixa={usuario?.faixaOuGrau}
        email={usuario?.email}
        membroDesde={usuario?.criadoEm ? formatarMesAno(usuario.criadoEm) : undefined}
        nivel={progresso?.nivel ?? 1}
        sequencia={sequencia}
        treinos={treinosValidados}
        modalidades={usuario?.modalidades ?? []}
        medalhas={medalhas.map((m) => ({ ...m, maxima: m.id === ID_MEDALHA_MAXIMA }))}
        onEditar={() => navigation.navigate('EditarPerfil')}
        onVinculos={() => navigation.navigate('VincularAluno')}
        onNotificacoes={() => navigation.navigate('PreferenciasNotificacao')}
        onContaPrivacidade={() => navigation.navigate('ContaPrivacidade')}
        onSair={logout}
      />
    </Tela>
  );
}
