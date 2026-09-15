// RF10: lista as turmas do responsável e permite criar uma nova
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Cores, Espacamento, TamanhoFonte } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { criarTurma, listarTurmasPorResponsavel } from '../../services/turmas';
import { NivelTurma, Turma } from '../../types';
import { GestorStackParamList } from '../../navigation/types';
import CampoTexto from '../../components/ui/CampoTexto';
import Etiqueta from '../../components/ui/Etiqueta';
import Botao from '../../components/ui/Botao';
import Cartao from '../../components/ui/Cartao';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoVazio from '../../components/ui/EstadoVazio';
import EstadoErro from '../../components/ui/EstadoErro';

const NIVEIS: NivelTurma[] = ['iniciante', 'intermediario', 'avancado'];

export default function TurmasScreen() {
  const { usuario } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<GestorStackParamList, 'Turmas'>>();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [turmas, setTurmas] = useState<Turma[]>([]);

  const [nome, setNome] = useState('');
  const [modalidade, setModalidade] = useState('');
  const [nivel, setNivel] = useState<NivelTurma>('iniciante');
  const [criando, setCriando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  const carregarTurmas = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      setTurmas(await listarTurmasPorResponsavel(usuario.id));
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  useEffect(() => {
    carregarTurmas();
  }, [carregarTurmas]);

  async function handleCriar() {
    if (!usuario || !nome.trim() || !modalidade.trim()) return;
    setCriando(true);
    setErroForm(null);
    try {
      await criarTurma({
        nome: nome.trim(),
        modalidade: modalidade.trim(),
        nivel,
        autorId: usuario.id,
        autorPerfil: usuario.perfil,
      });
      setNome('');
      setModalidade('');
      setNivel('iniciante');
      await carregarTurmas();
    } catch (e: any) {
      setErroForm(e.message);
    } finally {
      setCriando(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <Text style={styles.secaoTitulo}>Nova turma</Text>
      <CampoTexto rotulo="Nome da turma" placeholder="Ex.: Muay Thai — Turma A" valor={nome} onAlterar={setNome} />
      <CampoTexto rotulo="Modalidade" placeholder="Ex.: Muay Thai" valor={modalidade} onAlterar={setModalidade} />

      <Text style={styles.rotuloCampo}>Nível</Text>
      <View style={styles.linhaNiveis}>
        {NIVEIS.map((opcao) => (
          <Etiqueta key={opcao} texto={opcao} selecionada={nivel === opcao} onPress={() => setNivel(opcao)} />
        ))}
      </View>

      {erroForm ? (
        <Text style={styles.erroForm} accessibilityRole="alert">
          {erroForm}
        </Text>
      ) : null}

      <View style={styles.espaco} />
      <Botao titulo="Criar turma" onPress={handleCriar} carregando={criando} desabilitado={!nome.trim() || !modalidade.trim()} />

      <Text style={[styles.secaoTitulo, styles.secaoListaTitulo]}>Minhas turmas</Text>
      {carregando ? (
        <Esqueleto altura={64} repeticoes={3} />
      ) : erro ? (
        <EstadoErro mensagem={erro} onTentarNovamente={carregarTurmas} />
      ) : turmas.length === 0 ? (
        <EstadoVazio titulo="Nenhuma turma criada ainda" descricao="Crie sua primeira turma no formulário acima." />
      ) : (
        turmas.map((turma) => (
          <TouchableOpacity
            key={turma.id}
            onPress={() => navigation.navigate('TurmaDetalhe', { turmaId: turma.id })}
            accessibilityRole="button"
            accessibilityLabel={`${turma.nome}, ${turma.modalidade}, ${turma.nivel}, ${turma.ativa ? 'ativa' : 'inativa'}`}
          >
            <Cartao style={styles.item}>
              <Text style={styles.itemNome}>{turma.nome}</Text>
              <Text style={styles.itemDetalhe}>
                {turma.modalidade} · {turma.nivel} · {turma.ativa ? 'ativa' : 'inativa'}
              </Text>
            </Cartao>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.branco },
  conteudo: { padding: Espacamento.padrao, paddingBottom: Espacamento.enorme },
  secaoTitulo: { fontSize: TamanhoFonte.lg, fontWeight: '700', color: Cores.preto, marginBottom: Espacamento.pequeno },
  secaoListaTitulo: { marginTop: Espacamento.grande },
  rotuloCampo: { fontSize: TamanhoFonte.sm, color: Cores.cinzaMedio, marginBottom: Espacamento.pequeno },
  linhaNiveis: { flexDirection: 'row', gap: Espacamento.pequeno, marginBottom: Espacamento.padrao },
  erroForm: { color: Cores.alerta, fontSize: TamanhoFonte.sm, marginBottom: Espacamento.medio },
  espaco: { height: Espacamento.minimo },
  item: { marginBottom: Espacamento.pequeno },
  itemNome: { fontSize: TamanhoFonte.md, fontWeight: '700', color: Cores.preto },
  itemDetalhe: { fontSize: TamanhoFonte.xs, color: Cores.cinzaMedio, marginTop: Espacamento.minimo },
});
