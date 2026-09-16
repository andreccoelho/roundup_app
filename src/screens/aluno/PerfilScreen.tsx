// RF06: perfil do aluno — leitura, edição (EditarPerfilScreen: nome, foto, faixa, modalidades),
// vínculos e sair.
// RF17, RF19, RF21: nível/XP, sequência e medalhas calculados ao vivo a partir de check-ins,
// graduações e classificações do aluno — sem coleção persistida, valores PROVISÓRIOS (ver
// docs/DECISOES_PENDENTES.md). Mesma fonte de dados que aluno/DashboardScreen.tsx já usa.
import { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Cores, Espacamento, FamiliaFonte, Sombras, TamanhoFonte } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { PerfilAlunoNavigationProp } from '../../navigation/AlunoTabs';
import { listarHistoricoDoAluno } from '../../services/checkins';
import { listarGraduacoesPorAluno } from '../../services/graduacoes';
import { listarClassificacoesDoAluno } from '../../services/classificacoes';
import { calcularMedalhas, calcularProgressoNivel, calcularSequencia, MedalhaComEstado, ProgressoNivel } from '../../utils/gamificacao';
import { formatarMesAno } from '../../utils/datas';
import Avatar from '../../components/ui/Avatar';
import Botao from '../../components/ui/Botao';
import Medalha from '../../components/ui/Medalha';
import SeloFaixa from '../../components/ui/SeloFaixa';
import Etiqueta from '../../components/ui/Etiqueta';
import TexturaLona from '../../components/ui/TexturaLona';
import ExcluirContaSecao from '../compartilhado/ExcluirContaSecao';

export default function PerfilScreen() {
  const { usuario, logout } = useAuth();
  const navigation = useNavigation<PerfilAlunoNavigationProp>();
  const [medalhas, setMedalhas] = useState<MedalhaComEstado[]>([]);
  const [progresso, setProgresso] = useState<ProgressoNivel | null>(null);
  const [sequencia, setSequencia] = useState(0);
  const [treinosValidados, setTreinosValidados] = useState(0);

  const modalidades = usuario?.modalidades ?? [];

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

  const conquistadas = medalhas.filter((m) => m.conquistada).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      {/* Banda full-bleed, mesma linguagem de identidade do Dashboard do Aluno — DESIGN_BRIEF.md
          continua valendo aqui: motivo assinatura (marca invertida) usado uma única vez nesta
          tela, mesmo já usado uma vez em outra tela também. */}
      <View style={styles.cabecalho}>
        <TexturaLona opacidade={0.08} cor={Cores.branco} />
        <Image
          source={require('../../../assets/roundup_logo_invertida.png')}
          style={styles.marcaFundo}
          resizeMode="contain"
        />
        <Avatar nome={usuario?.nome ?? ''} fotoUrl={usuario?.fotoUrl} tamanho={72} />
        <Text style={[styles.nome, Sombras.duraTitulo, { textShadowColor: Cores.cinzaClaro }]} numberOfLines={1} adjustsFontSizeToFit>
          {usuario?.nome ?? ''}
        </Text>
        <View style={styles.seloLinha}>
          <SeloFaixa faixaOuGrau={usuario?.faixaOuGrau ?? 'Faixa não informada'} sobreEscuro />
        </View>
        {usuario?.criadoEm ? <Text style={styles.membroDesde}>Membro desde {formatarMesAno(usuario.criadoEm)}</Text> : null}
      </View>

      {/* script.md, item 4: onde a progressão fica visível — nível, sequência e treinos ao lado
          da faixa, não escondidos em outra aba. */}
      <View style={styles.statsLinha}>
        <View style={styles.statItem}>
          <Text style={styles.statValor}>{progresso?.nivel ?? 1}</Text>
          <Text style={styles.statRotulo}>Nível</Text>
        </View>
        <View style={styles.statDivisor} />
        <View style={styles.statItem}>
          <Text style={styles.statValor}>{sequencia}</Text>
          <Text style={styles.statRotulo}>Sequência</Text>
        </View>
        <View style={styles.statDivisor} />
        <View style={styles.statItem}>
          <Text style={styles.statValor}>{treinosValidados}</Text>
          <Text style={styles.statRotulo}>Treinos</Text>
        </View>
      </View>

      {modalidades.length > 0 ? (
        <View style={styles.modalidadesLinha}>
          {modalidades.map((modalidade) => (
            <Etiqueta key={modalidade} texto={modalidade} />
          ))}
        </View>
      ) : null}

      <Text style={styles.email}>{usuario?.email}</Text>

      <View style={styles.botoesLinha}>
        <Botao compacto titulo="Editar perfil" variante="secundario" onPress={() => navigation.navigate('EditarPerfil')} />
        <Botao compacto titulo="Meus vínculos" variante="secundario" onPress={() => navigation.navigate('VincularAluno')} />
        <Botao
          compacto
          titulo="Preferências de notificação"
          variante="secundario"
          onPress={() => navigation.navigate('PreferenciasNotificacao')}
        />
      </View>

      {medalhas.length > 0 ? (
        <View style={styles.secao}>
          <View style={styles.secaoCabecalho}>
            <Text style={styles.secaoTitulo}>Medalhas</Text>
            <Text style={styles.secaoContagem}>
              {conquistadas} de {medalhas.length}
            </Text>
          </View>
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
  conteudo: { paddingBottom: Espacamento.enorme },

  cabecalho: {
    backgroundColor: Cores.preto,
    alignItems: 'center',
    paddingTop: Espacamento.extraGrande,
    paddingBottom: Espacamento.grande,
    paddingHorizontal: Espacamento.grande,
    overflow: 'hidden',
  },
  marcaFundo: { position: 'absolute', top: -30, right: -60, width: 180, height: 180, opacity: 0.12 },
  nome: {
    fontFamily: FamiliaFonte.homebaseDisplay,
    fontSize: TamanhoFonte.xxl,
    color: Cores.branco,
    letterSpacing: 1,
    marginTop: Espacamento.medio,
    maxWidth: '100%',
  },
  seloLinha: { marginTop: Espacamento.pequeno },
  membroDesde: { fontSize: TamanhoFonte.xs, color: Cores.cinzaClaro, marginTop: Espacamento.pequeno, textTransform: 'capitalize' },

  statsLinha: {
    flexDirection: 'row',
    backgroundColor: Cores.cinzaFundo,
    paddingVertical: Espacamento.padrao,
    paddingHorizontal: Espacamento.grande,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivisor: { width: 1, backgroundColor: Cores.cinzaBorda },
  statValor: { fontFamily: FamiliaFonte.placarSemiBold, fontSize: TamanhoFonte.xl, color: Cores.preto },
  statRotulo: { fontSize: TamanhoFonte.xs, color: Cores.cinzaMedio, marginTop: 2 },

  modalidadesLinha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Espacamento.pequeno,
    paddingHorizontal: Espacamento.padrao,
    paddingTop: Espacamento.padrao,
  },
  email: { fontSize: TamanhoFonte.sm, color: Cores.cinzaMedio, paddingHorizontal: Espacamento.padrao, marginTop: Espacamento.pequeno },

  botoesLinha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Espacamento.pequeno,
    paddingHorizontal: Espacamento.padrao,
    marginTop: Espacamento.padrao,
  },
  secao: { marginTop: Espacamento.grande, paddingHorizontal: Espacamento.padrao },
  secaoCabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: Espacamento.medio },
  secaoTitulo: { fontSize: TamanhoFonte.md, fontWeight: '600', color: Cores.preto },
  secaoContagem: { fontSize: TamanhoFonte.sm, color: Cores.cinzaMedio },
  linhaMedalhas: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacamento.medio },
  rodape: { alignItems: 'center', marginTop: Espacamento.grande },
});
