import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { listarAcademiasDisponiveis, listarProfessoresAutonomos, solicitarVinculo } from '../../services/vinculos';
import { PerfilDestinatario, Usuario } from '../../types';

interface OpcaoVinculo {
  usuario: Usuario;
  perfilDestinatario: PerfilDestinatario;
}

export default function VincularAlunoScreen() {
  const { usuario } = useAuth();
  const [carregando, setCarregando] = useState(true);
  const [academias, setAcademias] = useState<Usuario[]>([]);
  const [professores, setProfessores] = useState<Usuario[]>([]);
  const [solicitados, setSolicitados] = useState<Set<string>>(new Set());

  useEffect(() => {
    carregarOpcoes();
  }, []);

  async function carregarOpcoes() {
    setCarregando(true);
    try {
      const [listaAcademias, listaProfessores] = await Promise.all([
        listarAcademiasDisponiveis(),
        listarProfessoresAutonomos(),
      ]);
      setAcademias(listaAcademias);
      setProfessores(listaProfessores);
    } catch (erro: any) {
      Alert.alert('Erro ao carregar opções', erro.message);
    } finally {
      setCarregando(false);
    }
  }

  async function handleSolicitar({ usuario: destinatario, perfilDestinatario }: OpcaoVinculo) {
    if (!usuario) return;
    try {
      await solicitarVinculo(usuario.id, destinatario.id, 'aluno', perfilDestinatario);
      setSolicitados(prev => new Set(prev).add(destinatario.id));
    } catch (erro: any) {
      Alert.alert('Erro ao solicitar vínculo', erro.message);
    }
  }

  function renderItem({ usuario: destinatario, perfilDestinatario }: OpcaoVinculo) {
    const jaSolicitado = solicitados.has(destinatario.id);
    return (
      <View key={destinatario.id} style={styles.item}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemNome}>{destinatario.nome}</Text>
          <Text style={styles.itemTipo}>{perfilDestinatario === 'academia' ? 'Academia' : 'Professor autônomo'}</Text>
        </View>
        <TouchableOpacity
          style={[styles.botaoSolicitar, jaSolicitado && styles.botaoSolicitarDesabilitado]}
          disabled={jaSolicitado}
          onPress={() => handleSolicitar({ usuario: destinatario, perfilDestinatario })}
        >
          <Text style={styles.textoBotaoSolicitar}>{jaSolicitado ? 'Solicitado' : 'Solicitar vínculo'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (carregando) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={Colors.preto} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.lista}>
        <Text style={styles.secaoTitulo}>Academias</Text>
        {academias.length === 0 && <Text style={styles.vazio}>Nenhuma academia disponível.</Text>}
        {academias.map(academia => renderItem({ usuario: academia, perfilDestinatario: 'academia' }))}

        <Text style={styles.secaoTitulo}>Professores autônomos</Text>
        {professores.length === 0 && <Text style={styles.vazio}>Nenhum professor autônomo disponível.</Text>}
        {professores.map(professor => renderItem({ usuario: professor, perfilDestinatario: 'professor' }))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.branco,
  },
  lista: {
    padding: 16,
  },
  secaoTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.preto,
    marginTop: 16,
    marginBottom: 8,
  },
  vazio: {
    color: Colors.cinzaMedio,
    marginBottom: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.cinzaBorda,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemNome: {
    fontSize: 16,
    color: Colors.preto,
    fontWeight: 'bold',
  },
  itemTipo: {
    fontSize: 12,
    color: Colors.cinzaMedio,
    marginTop: 2,
  },
  botaoSolicitar: {
    backgroundColor: Colors.preto,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  botaoSolicitarDesabilitado: {
    backgroundColor: Colors.cinzaClaro,
  },
  textoBotaoSolicitar: {
    color: Colors.branco,
    fontWeight: 'bold',
    fontSize: 12,
  },
});
