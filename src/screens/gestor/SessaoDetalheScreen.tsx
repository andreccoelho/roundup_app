// RF13: janela de check-in calculada e lista de check-ins recebidos. Sem validação
// de check-in ainda — isso é RF22 no Ciclo 3.
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Cores, Espacamento, TamanhoFonte } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { buscarSessao, abrirSessao, encerrarSessao } from '../../services/sessoes';
import { listarCheckInsPorSessao } from '../../services/checkins';
import { buscarUsuario } from '../../services/usuarios';
import { CheckIn, Sessao } from '../../types';
import { formatarDataHora } from '../../utils/datas';
import { GestorStackParamList } from '../../navigation/types';
import Botao from '../../components/ui/Botao';
import Cartao from '../../components/ui/Cartao';
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
    } catch (e: any) {
      setErro(e.message);
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
    } catch (e: any) {
      setErroAcao(e.message);
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
    } catch (e: any) {
      setErroAcao(e.message);
    } finally {
      setProcessando(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.container}>
        <Esqueleto altura={64} repeticoes={3} />
      </View>
    );
  }

  if (erro) {
    return <EstadoErro mensagem={erro} onTentarNovamente={carregarTudo} />;
  }

  if (!sessao) {
    return (
      <View style={styles.container}>
        <EstadoVazio titulo="Sessão não encontrada" descricao="Ela pode ter sido removida ou você não tem mais acesso a ela." />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <Text style={styles.titulo}>{formatarDataHora(sessao.inicio)}</Text>
      <Text style={styles.subtitulo}>status: {sessao.status}</Text>
      <Text style={styles.subtitulo}>
        Janela de check-in: {formatarDataHora(sessao.janelaCheckInInicio)} até {formatarDataHora(sessao.janelaCheckInFim)}
      </Text>

      <View style={styles.linhaBotoes}>
        <Botao titulo="Abrir sessão" variante="secundario" desabilitado={processando || sessao.status !== 'agendada'} onPress={handleAbrir} />
        <Botao titulo="Encerrar sessão" variante="secundario" desabilitado={processando || sessao.status !== 'aberta'} onPress={handleEncerrar} />
      </View>

      {erroAcao ? (
        <Text style={styles.erroAcao} accessibilityRole="alert">
          {erroAcao}
        </Text>
      ) : null}

      <Text style={styles.secaoTitulo}>Check-ins recebidos</Text>
      {checkIns.length === 0 ? (
        <Text style={styles.vazio}>Nenhum check-in recebido ainda.</Text>
      ) : (
        checkIns.map(({ checkIn, nomeAluno }) => (
          <Cartao key={checkIn.id} style={styles.item}>
            <Text style={styles.itemNome}>{nomeAluno}</Text>
            <Text style={styles.itemDetalhe}>
              {formatarDataHora(checkIn.dataHora)} · status: {checkIn.status}
            </Text>
          </Cartao>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo, padding: Espacamento.padrao },
  conteudo: { paddingBottom: Espacamento.enorme },
  titulo: { fontSize: TamanhoFonte.xxl, fontWeight: '700', color: Cores.texto },
  subtitulo: { fontSize: TamanhoFonte.sm, color: Cores.texto2, marginTop: Espacamento.minimo },
  secaoTitulo: { fontSize: TamanhoFonte.lg, fontWeight: '700', color: Cores.texto, marginTop: Espacamento.grande, marginBottom: Espacamento.pequeno },
  linhaBotoes: { flexDirection: 'row', gap: Espacamento.pequeno, marginTop: Espacamento.padrao },
  erroAcao: { color: Cores.perigo, fontSize: TamanhoFonte.sm, marginTop: Espacamento.medio },
  vazio: { color: Cores.texto2, fontSize: TamanhoFonte.sm },
  item: { marginBottom: Espacamento.pequeno },
  itemNome: { fontSize: TamanhoFonte.md, fontWeight: '700', color: Cores.texto },
  itemDetalhe: { fontSize: TamanhoFonte.xs, color: Cores.texto2, marginTop: Espacamento.minimo },
});
