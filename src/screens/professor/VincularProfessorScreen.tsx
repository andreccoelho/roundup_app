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
import { listarAcademiasDisponiveis, solicitarVinculo } from '../../services/vinculos';
import { Usuario } from '../../types';

export default function VincularProfessorScreen() {
  const { usuario } = useAuth();
  const [carregando, setCarregando] = useState(true);
  const [academias, setAcademias] = useState<Usuario[]>([]);
  const [solicitados, setSolicitados] = useState<Set<string>>(new Set());

  useEffect(() => {
    carregarAcademias();
  }, []);

  async function carregarAcademias() {
    setCarregando(true);
    try {
      const lista = await listarAcademiasDisponiveis();
      setAcademias(lista);
    } catch (erro: any) {
      Alert.alert('Erro ao carregar academias', erro.message);
    } finally {
      setCarregando(false);
    }
  }

  async function handleSolicitar(academia: Usuario) {
    if (!usuario) return;
    try {
      await solicitarVinculo(usuario.id, academia.id, 'professor', 'academia');
      setSolicitados(prev => new Set(prev).add(academia.id));
    } catch (erro: any) {
      Alert.alert('Erro ao solicitar vínculo', erro.message);
    }
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
        {academias.length === 0 && <Text style={styles.vazio}>Nenhuma academia disponível.</Text>}
        {academias.map(academia => {
          const jaSolicitado = solicitados.has(academia.id);
          return (
            <View key={academia.id} style={styles.item}>
              <Text style={styles.itemNome}>{academia.nome}</Text>
              <TouchableOpacity
                style={[styles.botaoSolicitar, jaSolicitado && styles.botaoSolicitarDesabilitado]}
                disabled={jaSolicitado}
                onPress={() => handleSolicitar(academia)}
              >
                <Text style={styles.textoBotaoSolicitar}>{jaSolicitado ? 'Solicitado' : 'Solicitar vínculo'}</Text>
              </TouchableOpacity>
            </View>
          );
        })}
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
  vazio: {
    color: Colors.cinzaMedio,
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
  itemNome: {
    fontSize: 16,
    color: Colors.preto,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
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
