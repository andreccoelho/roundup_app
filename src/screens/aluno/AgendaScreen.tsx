// RF14, RF13, RNF01: próximas sessões do aluno, com check-in em até 3 toques a partir da
// tela inicial — por isso o botão de check-in fica direto no item da lista, sem tela intermediária.
// Os 3 estados de RN08 (disponível / fora da janela / já realizado) precisam ser legíveis de
// relance: cada um tem forma, ícone e texto próprios — nunca só uma mudança de cor.
// Visual: sessões agrupadas por dia (cabeçalho "Hoje", "Amanhã", "Qui 17/10"), linhas sobre o
// fundo; erro de carga com "Tentar novamente"; erro de check-in em Aviso, sem esconder a lista.
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { listarProximasSessoesDoAluno } from '../../services/sessoes';
import { realizarCheckIn, buscarCheckInDaSessao } from '../../services/checkins';
import { buscarTurma } from '../../services/turmas';
import { buscarUsuario } from '../../services/usuarios';
import { Sessao } from '../../types';
import { paraData } from '../../utils/datas';
import { rotuloDia } from '../../utils/apresentacao';
import { mensagemErro } from '../../utils/mensagensErro';
import { estadoCheckIn, motivoJanelaFechada, EstadoCheckIn } from '../../utils/statusCheckIn';
import LinhaFina from '../../components/LinhaFina';
import CartaoSessao from '../../components/ui/CartaoSessao';
import CabecalhoSecao from '../../components/ui/CabecalhoSecao';
import Tela from '../../components/ui/Tela';
import Aviso from '../../components/ui/Aviso';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoErro from '../../components/ui/EstadoErro';
import EstadoVazio from '../../components/ui/EstadoVazio';
import { IconeFichaTecnica } from '../../components/icones';

interface ItemAgenda {
  sessao: Sessao;
  nomeTurma: string;
  nomeProfessor: string;
  estado: EstadoCheckIn;
}

export default function AgendaScreen() {
  const { usuario } = useAuth();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [erroCheckIn, setErroCheckIn] = useState<string | null>(null);
  const [itens, setItens] = useState<ItemAgenda[]>([]);
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      const sessoes = await listarProximasSessoesDoAluno(usuario.id);
      const comDados = await Promise.all(
        sessoes.map(async (sessao) => {
          const [turma, professor, checkIn] = await Promise.all([
            buscarTurma(sessao.turmaId),
            buscarUsuario(sessao.professorId),
            buscarCheckInDaSessao(sessao.id, usuario.id),
          ]);
          return {
            sessao,
            nomeTurma: turma?.nome ?? 'Turma',
            nomeProfessor: professor?.nome ?? 'Professor',
            estado: estadoCheckIn(sessao, checkIn !== null),
          };
        }),
      );
      setItens(comDados);
    } catch (e) {
      setErro(mensagemErro(e, 'Não foi possível carregar sua agenda agora.'));
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function handleCheckIn(sessaoId: string) {
    if (!usuario || processandoId) return;
    setProcessandoId(sessaoId);
    setErroCheckIn(null);
    try {
      await realizarCheckIn(sessaoId, usuario.id);
      setItens((prev) => prev.map((item) => (item.sessao.id === sessaoId ? { ...item, estado: 'realizado' } : item)));
    } catch (e) {
      setErroCheckIn(mensagemErro(e, 'Não foi possível fazer o check-in. Tente novamente.'));
    } finally {
      setProcessandoId(null);
    }
  }

  // Agrupa por dia, preservando a ordem que o service já devolve.
  const grupos: { dia: string; itens: ItemAgenda[] }[] = [];
  for (const item of itens) {
    const dia = rotuloDia(paraData(item.sessao.inicio));
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.dia === dia) ultimo.itens.push(item);
    else grupos.push({ dia, itens: [item] });
  }

  return (
    <Tela
      largura="lista"
      sobreposicao={<Aviso visivel={erroCheckIn !== null} tipo="erro" mensagem={erroCheckIn ?? ''} onFechar={() => setErroCheckIn(null)} acimaDaTabBar />}
    >
      {carregando ? (
        <Esqueleto forma="linha" repeticoes={5} />
      ) : erro ? (
        <EstadoErro mensagem={erro} onTentarNovamente={carregar} />
      ) : itens.length === 0 ? (
        <EstadoVazio
          icone={IconeFichaTecnica}
          titulo="Nenhum treino na agenda"
          descricao="Quando suas turmas tiverem sessões marcadas, elas aparecem aqui."
        />
      ) : (
        grupos.map((grupo, g) => (
          <View key={grupo.dia}>
            <CabecalhoSecao titulo={grupo.dia} contador={grupo.itens.length === 1 ? '1 treino' : `${grupo.itens.length} treinos`} semMargem={g === 0} />
            {grupo.itens.map(({ sessao, nomeTurma, nomeProfessor, estado }, i) => (
              <View key={sessao.id}>
                {i > 0 ? <LinhaFina /> : null}
                <CartaoSessao
                  nomeTurma={nomeTurma}
                  detalhe={`com ${nomeProfessor}`}
                  inicio={paraData(sessao.inicio)}
                  estado={estado}
                  carregando={processandoId === sessao.id}
                  motivo={estado === 'foraDaJanela' ? motivoJanelaFechada(sessao) : undefined}
                  onCheckIn={() => handleCheckIn(sessao.id)}
                />
              </View>
            ))}
          </View>
        ))
      )}
    </Tela>
  );
}
