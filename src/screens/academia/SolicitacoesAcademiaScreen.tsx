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
import { listarSolicitacoesPendentes, responderSolicitacao } from '../../services/vinculos';
import { buscarUsuario } from '../../services/usuarios';
import { Vinculo } from '../../types';

interface SolicitacaoComSolicitante {
  vinculo: Vinculo;
  nomeSolicitante: string;
}

export default function SolicitacoesAcademiaScreen() {
  const { usuario } = useAuth();
  const [carregando, setCarregando] = useState(true);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoComSolicitante[]>([]);

  useEffect(() => {
    carregarSolicitacoes();
  }, []);

  async function carregarSolicitacoes() {
    if (!usuario) return;
    setCarregando(true);
    try {
      const vinculos = await listarSolicitacoesPendentes(usuario.id);
      const comSolicitante = await Promise.all(
        vinculos.map(async (vinculo) => {
          const solicitante = await buscarUsuario(vinculo.solicitanteId);
          return { vinculo, nomeSolicitante: solicitante?.nome ?? 'Professor' };
        }),
      );
      setSolicitacoes(comSolicitante);
    } catch (erro: any) {
      Alert.alert('Erro ao carregar solicitações', erro.message);
    } finally {
      setCarregando(false);
    }
  }

  async function handleResponder(vinculoId: string, resposta: 'aceito' | 'recusado') {
    try {
      await responderSolicitacao(vinculoId, resposta);
      setSolicitacoes(prev => prev.filter(s => s.vinculo.id !== vinculoId));
    } catch (erro: any) {
      Alert.alert('Erro ao responder solicitação', erro.message);
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
        {solicitacoes.length === 0 && <Text style={styles.vazio}>Nenhuma solicitação pendente.</Text>}
        {solicitacoes.map(({ vinculo, nomeSolicitante }) => (
          <View key={vinculo.id} style={styles.item}>
            <Text style={styles.itemNome}>{nomeSolicitante}</Text>
            <View style={styles.acoes}>
              <TouchableOpacity
                style={[styles.botao, styles.botaoRecusar]}
                onPress={() => handleResponder(vinculo.id, 'recusado')}
              >
                <Text style={styles.textoBotaoRecusar}>Recusar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.botao, styles.botaoAceitar]}
                onPress={() => handleResponder(vinculo.id, 'aceito')}
              >
                <Text style={styles.textoBotaoAceitar}>Aceitar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
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
    marginBottom: 8,
  },
  acoes: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  botao: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  botaoAceitar: {
    backgroundColor: Colors.preto,
  },
  botaoRecusar: {
    borderWidth: 1,
    borderColor: Colors.cinzaEscuro,
  },
  textoBotaoAceitar: {
    color: Colors.branco,
    fontWeight: 'bold',
    fontSize: 12,
  },
  textoBotaoRecusar: {
    color: Colors.cinzaEscuro,
    fontWeight: 'bold',
    fontSize: 12,
  },
});
