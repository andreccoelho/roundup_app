// RF06: perfil do aluno — leitura, edição (EditarPerfilScreen: nome, foto, faixa, modalidades),
// vínculos, notificações, participação na classificação (RNF11), conta e privacidade, e sair.
// RF17, RF19, RF21: nível/XP e sequência calculados ao vivo a partir de check-ins, graduações e
// classificações do aluno; medalhas conquistadas lidas do registro do servidor
// (usuarios/{uid}/medalhas, com a data), valores PROVISÓRIOS (ver docs/DECISOES_PENDENTES.md). Mesma fonte de dados que aluno/DashboardScreen.tsx já usa.
// Apresentação em PerfilAlunoVisao.tsx (a mesma da Galeria).
import { useCallback, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { PerfilAlunoNavigationProp } from '../../navigation/AlunoTabs';
import { listarHistoricoDoAluno } from '../../services/checkins';
import { listarSessoesPassadasDoAluno } from '../../services/sessoes';
import { listarGraduacoesPorAluno } from '../../services/graduacoes';
import { listarClassificacoesDoAluno } from '../../services/classificacoes';
import { buscarNiveisDoAluno } from '../../services/configuracoesGamificacao';
import { listarMedalhasDoAluno } from '../../services/medalhas';
import { buscarEstruturaFaixas } from '../../services/estruturasFaixas';
import { listarResponsaveisAtivosDoAluno } from '../../services/vinculos';
import { faixasDoAluno, type FaixaDoAluno } from '../../utils/faixas';
import type { EstruturaFaixas } from '../../types';
import {
  calcularMedalhas, calcularProgressoNivel, calcularSequencia, combinarMedalhas, formatarDataConquista,
  MedalhaComEstado, ProgressoNivel,
} from '../../utils/gamificacao';
import { formatarMesAno } from '../../utils/datas';
import Tela from '../../components/ui/Tela';
import PerfilAlunoVisao from './PerfilAlunoVisao';

// docs/DECISOES_PENDENTES.md R-03: a única medalha em ouro é a mais alta da progressão principal.
const ID_MEDALHA_MAXIMA = 'treinos-100';

export default function PerfilScreen() {
  const { usuario, logout, atualizarPerfil } = useAuth();
  const navigation = useNavigation<PerfilAlunoNavigationProp>();
  const [medalhas, setMedalhas] = useState<MedalhaComEstado[]>([]);
  const [progresso, setProgresso] = useState<ProgressoNivel | null>(null);
  const [sequencia, setSequencia] = useState(0);
  const [treinosValidados, setTreinosValidados] = useState(0);
  const [salvandoParticipacao, setSalvandoParticipacao] = useState(false);
  // RF33: faixa estruturada e progresso até a próxima graduação, por modalidade
  const [faixas, setFaixas] = useState<Record<string, FaixaDoAluno>>({});

  // RNF11: grava em usuarios.participaClassificacao; a Cloud Function atualizarLeitoresNaParticipacao
  // reescreve os leitoresIds das classificações do aluno. Falha aqui só mantém o valor anterior —
  // o Toggle volta sozinho, porque o valor exibido vem do usuário do contexto.
  async function alternarParticipacao(participa: boolean) {
    setSalvandoParticipacao(true);
    try {
      await atualizarPerfil({ participaClassificacao: participa });
    } catch (e) {
      console.warn('Não foi possível salvar a participação na classificação:', e);
    } finally {
      setSalvandoParticipacao(false);
    }
  }

  const carregarDetalhes = useCallback(async () => {
    if (!usuario) return;
    try {
      const [historico, graduacoes, classificacoes, sessoesPassadas, registradas] = await Promise.all([
        listarHistoricoDoAluno(usuario.id),
        listarGraduacoesPorAluno(usuario.id),
        listarClassificacoesDoAluno(usuario.id),
        listarSessoesPassadasDoAluno(usuario.id),
        // RF19: falha ao ler o registro não esconde as medalhas — cai no cálculo ao vivo, sem data
        listarMedalhasDoAluno(usuario.id).catch(() => []),
      ]);
      const validados = historico.filter((c) => c.status === 'validado').length;
      const sequenciaAtual = calcularSequencia(sessoesPassadas, historico);
      const pontosTotais = classificacoes.reduce((soma, c) => soma + c.pontos, 0);
      // RF33: tabela de níveis do responsável em que o aluno mais pontuou
      const niveis = await buscarNiveisDoAluno(classificacoes);

      setTreinosValidados(validados);
      setSequencia(sequenciaAtual);
      setProgresso(calcularProgressoNivel(pontosTotais, niveis));
      setMedalhas(combinarMedalhas(calcularMedalhas(validados, sequenciaAtual, graduacoes.length), registradas));
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

  // RF33: estrutura de faixas de quem registrou cada graduação (ou do primeiro responsável). Falha
  // aqui só tira a barra de progresso; o texto da graduação continua aparecendo.
  useEffect(() => {
    if (!usuario?.graduacoes) return;
    let ativo = true;
    (async () => {
      try {
        const responsaveis = await listarResponsaveisAtivosDoAluno(usuario.id);
        const ids = new Set<string>(responsaveis.slice(0, 1));
        Object.values(usuario.faixasEstruturadas ?? {}).forEach((f) => f.responsavelId && ids.add(f.responsavelId));
        const estruturas = new Map<string, EstruturaFaixas | null>();
        await Promise.all([...ids].map(async (id) => estruturas.set(id, await buscarEstruturaFaixas(id).catch(() => null))));
        if (ativo) {
          setFaixas(faixasDoAluno(
            usuario.graduacoes, usuario.faixasEstruturadas, (id) => (id ? estruturas.get(id)?.modalidades : null), responsaveis[0],
          ));
        }
      } catch {
        if (ativo) setFaixas(faixasDoAluno(usuario.graduacoes, usuario.faixasEstruturadas, () => null, undefined));
      }
    })();
    return () => {
      ativo = false;
    };
  }, [usuario]);

  return (
    <Tela largura="lista" agrupada tituloGrande="Perfil">
      <PerfilAlunoVisao
        nome={usuario?.nome ?? ''}
        fotoUrl={usuario?.fotoUrl}
        faixa={usuario?.faixaOuGrau}
        graduacoes={usuario?.graduacoes}
        faixasEstruturadas={faixas}
        email={usuario?.email}
        membroDesde={usuario?.criadoEm ? formatarMesAno(usuario.criadoEm) : undefined}
        nivel={progresso?.nivel ?? 1}
        sequencia={sequencia}
        treinos={treinosValidados}
        modalidades={usuario?.modalidades ?? []}
        medalhas={medalhas.map((m) => ({
          ...m,
          maxima: m.id === ID_MEDALHA_MAXIMA,
          conquistadaEm: m.conquistadaEm ? formatarDataConquista(m.conquistadaEm) : undefined,
        }))}
        onEditar={() => navigation.navigate('EditarPerfil')}
        onVinculos={() => navigation.navigate('VincularAluno')}
        onNotificacoes={() => navigation.navigate('PreferenciasNotificacao')}
        participaClassificacao={usuario?.participaClassificacao !== false}
        salvandoParticipacao={salvandoParticipacao}
        onAlternarParticipacao={alternarParticipacao}
        onContaPrivacidade={() => navigation.navigate('ContaPrivacidade')}
        onSair={logout}
      />
    </Tela>
  );
}
