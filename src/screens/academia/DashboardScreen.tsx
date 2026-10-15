// Painel da Academia — RF09. Dado real: turmas ativas (`turmas`), professores e alunos com
// vínculo aceito (`vinculos`, RF07/RF08), e a contagem de turmas de cada professor (cruzando as
// duas coleções já reais). Frequência geral NÃO entra nesta tela ainda — RF26, Ciclo 3, exige
// uma agregação de check-ins por período que ainda não existe.
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Cores, Espacamento, FamiliaFonte, TamanhoFonte } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardAcademiaNavigationProp } from '../../navigation/AcademiaTabs';
import { listarTurmasPorResponsavel } from '../../services/turmas';
import { listarVinculosAceitosDaAcademia } from '../../services/vinculos';
import { buscarUsuario } from '../../services/usuarios';
import LinhaFina from '../../components/LinhaFina';
import Avatar from '../../components/ui/Avatar';
import Etiqueta from '../../components/ui/Etiqueta';

interface ProfessorVinculado {
  id: string;
  nome: string;
  quantidadeTurmas: number;
}

export default function DashboardScreen() {
  const { usuario } = useAuth();
  const navigation = useNavigation<DashboardAcademiaNavigationProp>();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [turmasAtivas, setTurmasAtivas] = useState(0);
  const [alunosVinculados, setAlunosVinculados] = useState(0);
  const [professores, setProfessores] = useState<ProfessorVinculado[]>([]);

  const carregar = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      const [turmas, vinculosProfessores, vinculosAlunos] = await Promise.all([
        listarTurmasPorResponsavel(usuario.id),
        listarVinculosAceitosDaAcademia(usuario.id, 'professor'),
        listarVinculosAceitosDaAcademia(usuario.id, 'aluno'),
      ]);

      setTurmasAtivas(turmas.filter((t) => t.ativa).length);
      setAlunosVinculados(vinculosAlunos.length);

      const listaProfessores = await Promise.all(
        vinculosProfessores.map(async (vinculo) => {
          const professor = await buscarUsuario(vinculo.solicitanteId);
          const quantidadeTurmas = turmas.filter((t) => t.professorId === vinculo.solicitanteId).length;
          return { id: vinculo.solicitanteId, nome: professor?.nome ?? 'Professor', quantidadeTurmas };
        }),
      );
      setProfessores(listaProfessores);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color={Cores.texto} />
      </View>
    );
  }

  const modalidades = usuario?.modalidades ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      {/* Banda full-bleed encosta no topo — ícones claros, igual ao Login/Dashboard do Aluno. */}
      <View style={styles.cabecalho}>
        {/* Marca invertida como textura de fundo — mesmo tratamento do Dashboard do Aluno. */}
        <Image
          source={require('../../../assets/roundup_logo_invertida.png')}
          style={styles.marcaFundo}
          resizeMode="contain"
        />
        <View style={styles.cabecalhoTopo}>
          <Avatar nome={usuario?.nomeAcademia ?? usuario?.nome ?? ''} fotoUrl={usuario?.fotoUrl} tamanho={52} />
          <Text style={styles.saudacaoNome} numberOfLines={1} adjustsFontSizeToFit>
            {usuario?.nomeAcademia ?? 'Painel da Academia'}
          </Text>
        </View>
        {usuario?.endereco ? <Text style={styles.enderecoTexto}>{usuario.endereco}</Text> : null}
      </View>

      {modalidades.length > 0 ? (
        <View style={styles.modalidadesLinha}>
          {modalidades.map((modalidade) => (
            <Etiqueta key={modalidade} texto={modalidade} />
          ))}
        </View>
      ) : null}

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      <View style={styles.contadoresLinha}>
        <View style={styles.contadorItem}>
          <Text style={styles.contadorValor}>{turmasAtivas}</Text>
          <Text style={styles.contadorRotulo}>turmas ativas</Text>
        </View>
        <View style={styles.contadorItem}>
          <Text style={styles.contadorValor}>{professores.length}</Text>
          <Text style={styles.contadorRotulo}>professores vinculados</Text>
        </View>
        <View style={styles.contadorItem}>
          <Text style={styles.contadorValor}>{alunosVinculados}</Text>
          <Text style={styles.contadorRotulo}>alunos vinculados</Text>
        </View>
      </View>

      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Professores vinculados</Text>
        {professores.length === 0 ? (
          <Text style={styles.vazio}>Nenhum professor vinculado ainda.</Text>
        ) : (
          professores.map((professor, i) => (
            <View key={professor.id}>
              <View style={styles.linhaSimples}>
                <Text style={styles.itemNome}>{professor.nome}</Text>
                <Text style={styles.itemDetalhe}>{professor.quantidadeTurmas} turma(s)</Text>
              </View>
              {i < professores.length - 1 && <LinhaFina />}
            </View>
          ))
        )}
      </View>

      <View style={styles.rodape}>
        <TouchableOpacity onPress={() => navigation.navigate('Turmas')}>
          <Text style={styles.linkRodape}>Gerenciar turmas</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },
  conteudo: { paddingBottom: Espacamento.extraGrande, flexGrow: 1 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Cores.fundo },

  // Banda full-bleed preta — mesmo tratamento de identidade do Dashboard do Aluno/Professor.
  // A "identidade" aqui é a academia (nomeAcademia), não a pessoa de contato.
  cabecalho: {
    backgroundColor: Cores.superficie2,
    paddingHorizontal: Espacamento.grande,
    paddingTop: Espacamento.extraGrande,
    paddingBottom: Espacamento.grande,
    overflow: 'hidden',
  },
  marcaFundo: {
    position: 'absolute',
    top: -40,
    right: -70,
    width: 220,
    height: 220,
    opacity: 0.12,
  },
  cabecalhoTopo: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.medio },
  saudacaoNome: {
    flex: 1,
    fontFamily: FamiliaFonte.display,
    fontSize: TamanhoFonte.xxl,
    color: Cores.texto,
    letterSpacing: 1,
  },
  enderecoTexto: { color: Cores.texto3, fontSize: TamanhoFonte.sm, marginTop: Espacamento.padrao },
  modalidadesLinha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Espacamento.pequeno,
    paddingHorizontal: Espacamento.grande,
    paddingTop: Espacamento.padrao,
  },
  erro: { color: Cores.perigo, fontSize: TamanhoFonte.sm, marginHorizontal: Espacamento.grande, marginTop: Espacamento.padrao, marginBottom: Espacamento.pequeno },

  contadoresLinha: { flexDirection: 'row', paddingHorizontal: Espacamento.grande, gap: Espacamento.grande, marginTop: Espacamento.padrao },
  contadorItem: { flex: 1 },
  contadorValor: { fontSize: TamanhoFonte.xxl, fontWeight: '700', color: Cores.texto },
  contadorRotulo: { fontSize: TamanhoFonte.xs, color: Cores.texto2, marginTop: 2 },

  secao: { paddingHorizontal: Espacamento.grande, marginTop: Espacamento.grande },
  secaoTitulo: { fontSize: TamanhoFonte.md, fontWeight: '600', color: Cores.texto, marginBottom: Espacamento.pequeno },
  vazio: { color: Cores.texto2, fontSize: TamanhoFonte.sm },

  linhaSimples: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Espacamento.medio },
  itemNome: { fontSize: TamanhoFonte.md, color: Cores.texto, fontWeight: '600' },
  itemDetalhe: { fontSize: TamanhoFonte.sm, color: Cores.texto2 },

  rodape: { paddingHorizontal: Espacamento.grande, gap: Espacamento.medio, marginTop: Espacamento.grande + Espacamento.minimo, paddingTop: Espacamento.padrao },
  linkRodape: { color: Cores.texto2, fontSize: TamanhoFonte.sm },
});
