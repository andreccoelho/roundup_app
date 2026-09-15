// RF06: perfil do aluno — leitura, edição (EditarPerfilScreen: nome, foto, faixa, modalidades),
// vínculos e sair.
// RF19: medalhas calculadas ao vivo a partir de check-ins e graduações do aluno — sem coleção
// persistida, marcos e valores PROVISÓRIOS (ver docs/DECISOES_PENDENTES.md).
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Cores, Espacamento, TamanhoFonte } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { PerfilAlunoNavigationProp } from '../../navigation/AlunoTabs';
import { listarHistoricoDoAluno } from '../../services/checkins';
import { listarGraduacoesPorAluno } from '../../services/graduacoes';
import { calcularMedalhas, calcularSequencia, MedalhaComEstado } from '../../utils/gamificacao';
import Avatar from '../../components/ui/Avatar';
import Botao from '../../components/ui/Botao';
import Medalha from '../../components/ui/Medalha';
import SeloFaixa from '../../components/ui/SeloFaixa';
import ExcluirContaSecao from '../compartilhado/ExcluirContaSecao';

export default function PerfilScreen() {
  const { usuario, logout } = useAuth();
  const navigation = useNavigation<PerfilAlunoNavigationProp>();
  const [medalhas, setMedalhas] = useState<MedalhaComEstado[]>([]);

  const modalidades = usuario?.modalidades?.join(', ');

  const carregarMedalhas = useCallback(async () => {
    if (!usuario) return;
    try {
      const [historico, graduacoes] = await Promise.all([
        listarHistoricoDoAluno(usuario.id),
        listarGraduacoesPorAluno(usuario.id),
      ]);
      const treinosValidados = historico.filter((c) => c.status === 'validado').length;
      const sequencia = calcularSequencia(historico);
      setMedalhas(calcularMedalhas(treinosValidados, sequencia, graduacoes.length));
    } catch {
      // Seção secundária — falha aqui não impede o resto do perfil (ex.: Sair).
      setMedalhas([]);
    }
  }, [usuario]);

  useEffect(() => {
    carregarMedalhas();
  }, [carregarMedalhas]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <View style={styles.cabecalho}>
        <Avatar nome={usuario?.nome ?? ''} fotoUrl={usuario?.fotoUrl} tamanho={64} />
        <View style={styles.cabecalhoTextos}>
          <Text style={styles.nome}>{usuario?.nome}</Text>
          {/* script.md, item 4: "badges de faixa... devem parecer emblemas reais" — SeloFaixa,
              não texto solto, aqui onde a graduação do aluno fica exposta. */}
          <View style={styles.seloLinha}>
            <SeloFaixa faixaOuGrau={usuario?.faixaOuGrau ?? 'Faixa não informada'} />
          </View>
          {modalidades ? <Text style={styles.detalhe}>{modalidades}</Text> : null}
          <Text style={styles.email}>{usuario?.email}</Text>
        </View>
      </View>

      <View style={styles.secaoPequena}>
        <Botao titulo="Editar perfil" variante="secundario" onPress={() => navigation.navigate('EditarPerfil')} />
      </View>
      <View style={styles.secao}>
        <Botao titulo="Meus vínculos" variante="secundario" onPress={() => navigation.navigate('VincularAluno')} />
      </View>
      <View style={styles.secaoPequena}>
        <Botao
          titulo="Preferências de notificação"
          variante="secundario"
          onPress={() => navigation.navigate('PreferenciasNotificacao')}
        />
      </View>

      {medalhas.length > 0 ? (
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Medalhas</Text>
          <View style={styles.linhaMedalhas}>
            {medalhas.map((medalha) => (
              <Medalha key={medalha.id} rotulo={medalha.rotulo} conquistada={medalha.conquistada} />
            ))}
          </View>
        </View>
      ) : null}

      <ExcluirContaSecao />

      <View style={styles.rodape}>
        <Botao titulo="Sair" variante="texto" onPress={logout} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.branco },
  conteudo: { padding: Espacamento.padrao, paddingBottom: Espacamento.enorme },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.padrao },
  cabecalhoTextos: { flex: 1 },
  nome: { fontSize: TamanhoFonte.xl, fontWeight: '700', color: Cores.preto },
  seloLinha: { marginTop: Espacamento.minimo },
  detalhe: { fontSize: TamanhoFonte.sm, color: Cores.cinzaMedio, marginTop: Espacamento.minimo },
  email: { fontSize: TamanhoFonte.sm, color: Cores.cinzaMedio, marginTop: 2 },
  secao: { marginTop: Espacamento.grande },
  secaoPequena: { marginTop: Espacamento.pequeno },
  secaoTitulo: { fontSize: TamanhoFonte.md, fontWeight: '600', color: Cores.preto, marginBottom: Espacamento.medio },
  linhaMedalhas: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacamento.medio },
  rodape: { alignItems: 'center', marginTop: Espacamento.grande },
});
