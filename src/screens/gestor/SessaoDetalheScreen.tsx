// RF13: janela de check-in calculada e lista de check-ins recebidos. Sem validação
// de check-in ainda — isso é RF22 no Ciclo 3.
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Espacamento } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { buscarSessao, abrirSessao, encerrarSessao } from '../../services/sessoes';
import { listarCheckInsPorSessao } from '../../services/checkins';
import { buscarUsuario } from '../../services/usuarios';
import { CheckIn, Sessao } from '../../types';
import { paraData } from '../../utils/datas';
import { formatarDiaHora, formatarHora, rotuloDia, ROTULO_STATUS_CHECKIN, ROTULO_STATUS_SESSAO } from '../../utils/apresentacao';
import { mensagemErro } from '../../utils/mensagensErro';
import { GestorStackParamList } from '../../navigation/types';
import Botao from '../../components/ui/Botao';
import Cartao from '../../components/ui/Cartao';
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';
import Avatar from '../../components/ui/Avatar';
import MensagemErro from '../../components/ui/MensagemErro';
import GrupoLista from '../../components/ui/GrupoLista';
import LinhaLista from '../../components/ui/LinhaLista';
import Dialogo from '../../components/ui/Dialogo';
import { IconeSino } from '../../components/icones';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoVazio from '../../components/ui/EstadoVazio';
import EstadoErro from '../../components/ui/EstadoErro';

type SessaoDetalheRoute = RouteProp<GestorStackParamList, 'SessaoDetalhe'>;

interface CheckInComNome {
  checkIn: CheckIn;
  nomeAluno: string;
}

export default function SessaoDetalheScreen() {
  const { usuario } = useAuth();
  const route = useRoute<SessaoDetalheRoute>();
  const { sessaoId } = route.params;

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  // R-08: encerrar não tem volta — pede confirmação no alerta do sistema
  const [confirmandoEncerrar, setConfirmandoEncerrar] = useState(false);
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [checkIns, setCheckIns] = useState<CheckInComNome[]>([]);

  const carregarTudo = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      const [sessaoEncontrada, listaCheckIns] = await Promise.all([
        buscarSessao(sessaoId),
        listarCheckInsPorSessao(sessaoId, usuario.id),
      ]);
      setSessao(sessaoEncontrada);
      const comNome = await Promise.all(
        listaCheckIns.map(async (checkIn) => {
          const aluno = await buscarUsuario(checkIn.alunoId);
          return { checkIn, nomeAluno: aluno?.nome ?? 'Aluno' };
        }),
      );
      setCheckIns(comNome);
    } catch (e) {
      setErro(mensagemErro(e, 'Não foi possível carregar a sessão agora.'));
    } finally {
      setCarregando(false);
    }
  }, [usuario, sessaoId]);

  useEffect(() => {
    carregarTudo();
  }, [carregarTudo]);

  async function handleAbrir() {
    setProcessando(true);
    setErroAcao(null);
    try {
      await abrirSessao(sessaoId);
      await carregarTudo();
    } catch (e) {
      setErroAcao(mensagemErro(e, 'Não foi possível abrir a sessão. Tente novamente.'));
    } finally {
      setProcessando(false);
    }
  }

  async function handleEncerrar() {
    setProcessando(true);
    setErroAcao(null);
    try {
      await encerrarSessao(sessaoId);
      await carregarTudo();
    } catch (e) {
      setErroAcao(mensagemErro(e, 'Não foi possível encerrar a sessão. Tente novamente.'));
    } finally {
      setProcessando(false);
    }
  }

  if (carregando) {
    return (
      <Tela largura="lista" agrupada>
        <Esqueleto altura={120} />
        <Esqueleto forma="linha" repeticoes={3} />
      </Tela>
    );
  }

  if (erro) {
    return <EstadoErro mensagem={erro} onTentarNovamente={carregarTudo} />;
  }

  if (!sessao) {
    return (
      <Tela largura="lista" agrupada centralizarVertical>
        <EstadoVazio icone={IconeSino} titulo="Sessão não encontrada" descricao="Ela pode ter sido removida ou você não tem mais acesso a ela." />
      </Tela>
    );
  }

  const inicio = paraData(sessao.inicio);
  const pendentes = checkIns.filter((c) => c.checkIn.status === 'pendente').length;

  return (
    <Tela largura="lista" agrupada>
      <Cartao destaque>
        <Texto variante="subheadline" cor={sessao.status === 'aberta' ? 'sucesso' : 'texto2'}>
          {ROTULO_STATUS_SESSAO[sessao.status]}
        </Texto>
        <View style={styles.horario}>
          <Texto variante="numeroGrande">{formatarHora(inicio)}</Texto>
          <Texto variante="headline" cor="texto2">
            {rotuloDia(inicio)}
          </Texto>
        </View>
        <Texto variante="footnote">
          {`Janela de check-in: ${formatarDiaHora(paraData(sessao.janelaCheckInInicio))} até ${formatarHora(paraData(sessao.janelaCheckInFim))}`}
        </Texto>
      </Cartao>

      <View style={styles.acao}>
        {sessao.status === 'agendada' ? (
          <Botao titulo="Abrir check-in" icone={IconeSino} onPress={handleAbrir} carregando={processando} />
        ) : sessao.status === 'aberta' ? (
          <Botao titulo="Encerrar sessão" variante="destrutivo" onPress={() => setConfirmandoEncerrar(true)} carregando={processando} />
        ) : (
          <Texto variante="subheadline" alinhamento="center">
            {sessao.status === 'encerrada' ? 'Sessão encerrada. Os check-ins abaixo ficam no histórico.' : 'Sessão cancelada.'}
          </Texto>
        )}
      </View>
      <MensagemErro mensagem={erroAcao} />

      <GrupoLista titulo={pendentes > 0 ? `Check-ins recebidos: ${checkIns.length} (${pendentes} aguardando)` : `Check-ins recebidos: ${checkIns.length}`} semMargem>
        {checkIns.length === 0 ? (
          <LinhaLista rotulo="Nenhum check-in recebido ainda" />
        ) : (
          checkIns.map(({ checkIn, nomeAluno }) => (
            <View
              key={checkIn.id}
              style={styles.linha}
              accessible
              accessibilityLabel={`${nomeAluno}, ${formatarHora(paraData(checkIn.dataHora))}, ${ROTULO_STATUS_CHECKIN[checkIn.status]}`}
            >
              <Avatar nome={nomeAluno} tamanho={36} />
              <View style={styles.textos}>
                <Texto variante="body">{nomeAluno}</Texto>
                <Texto variante="footnote">{`Check-in às ${formatarHora(paraData(checkIn.dataHora))}`}</Texto>
              </View>
              <Texto variante="subheadline" cor={checkIn.status === 'validado' ? 'sucesso' : checkIn.status === 'rejeitado' ? 'perigo' : 'texto2'}>
                {ROTULO_STATUS_CHECKIN[checkIn.status]}
              </Texto>
            </View>
          ))
        )}
      </GrupoLista>

      <Dialogo
        visivel={confirmandoEncerrar}
        titulo="Encerrar a sessão?"
        mensagem="O check-in fecha para todos os alunos e a sessão não pode ser reaberta."
        tituloConfirmar="Encerrar"
        destrutivo
        onConfirmar={() => {
          setConfirmandoEncerrar(false);
          handleEncerrar();
        }}
        tituloCancelar="Cancelar"
        onCancelar={() => setConfirmandoEncerrar(false)}
      />
    </Tela>
  );
}

const styles = StyleSheet.create({
  horario: { flexDirection: 'row', alignItems: 'baseline', gap: Espacamento.pequeno, marginVertical: Espacamento.minimo },
  acao: { marginTop: Espacamento.padrao, marginBottom: Espacamento.grande },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.medio, minHeight: 60, paddingVertical: Espacamento.pequeno, paddingHorizontal: Espacamento.padrao },
  textos: { flex: 1, gap: 2 },
});
