// RF08: aluno solicita vínculo com academia ou professor autônomo
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Cores, Espacamento, TamanhoFonte } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { listarAcademiasDisponiveis, listarProfessoresAutonomos, solicitarVinculo } from '../../services/vinculos';
import { PerfilDestinatario, Usuario } from '../../types';
import Cartao from '../../components/ui/Cartao';
import Botao from '../../components/ui/Botao';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoVazio from '../../components/ui/EstadoVazio';
import EstadoErro from '../../components/ui/EstadoErro';

interface OpcaoVinculo {
  usuario: Usuario;
  perfilDestinatario: PerfilDestinatario;
}

export default function VincularAlunoScreen() {
  const { usuario } = useAuth();
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [academias, setAcademias] = useState<Usuario[]>([]);
  const [professores, setProfessores] = useState<Usuario[]>([]);
  const [solicitados, setSolicitados] = useState<Set<string>>(new Set());
  const [erroSolicitacao, setErroSolicitacao] = useState<string | null>(null);

  const carregarOpcoes = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const [listaAcademias, listaProfessores] = await Promise.all([
        listarAcademiasDisponiveis(),
        listarProfessoresAutonomos(),
      ]);
      setAcademias(listaAcademias);
      setProfessores(listaProfessores);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarOpcoes();
  }, [carregarOpcoes]);

  async function handleSolicitar({ usuario: destinatario, perfilDestinatario }: OpcaoVinculo) {
    if (!usuario) return;
    setErroSolicitacao(null);
    try {
      await solicitarVinculo(usuario.id, destinatario.id, 'aluno', perfilDestinatario);
      setSolicitados((prev) => new Set(prev).add(destinatario.id));
    } catch (e: any) {
      setErroSolicitacao(e.message);
    }
  }

  function renderItem({ usuario: destinatario, perfilDestinatario }: OpcaoVinculo) {
    const jaSolicitado = solicitados.has(destinatario.id);
    return (
      <Cartao key={destinatario.id} style={styles.item}>
        <View style={styles.itemLinha}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemNome}>{destinatario.nome}</Text>
            <Text style={styles.itemTipo}>{perfilDestinatario === 'academia' ? 'Academia' : 'Professor autônomo'}</Text>
          </View>
          <Botao
            titulo={jaSolicitado ? 'Solicitado' : 'Solicitar vínculo'}
            variante={jaSolicitado ? 'secundario' : 'primario'}
            desabilitado={jaSolicitado}
            onPress={() => handleSolicitar({ usuario: destinatario, perfilDestinatario })}
          />
        </View>
      </Cartao>
    );
  }

  if (carregando) {
    return (
      <View style={styles.container}>
        <Esqueleto altura={72} repeticoes={4} />
      </View>
    );
  }

  if (erro) {
    return <EstadoErro mensagem={erro} onTentarNovamente={carregarOpcoes} />;
  }

  if (academias.length === 0 && professores.length === 0) {
    return (
      <View style={styles.container}>
        <EstadoVazio titulo="Nenhuma opção disponível" descricao="Ainda não há academias nem professores autônomos cadastrados." />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      {erroSolicitacao ? (
        <Text style={styles.erroInline} accessibilityRole="alert">
          {erroSolicitacao}
        </Text>
      ) : null}

      <Text style={styles.secaoTitulo}>Academias</Text>
      {academias.length === 0 ? (
        <Text style={styles.vazio}>Nenhuma academia disponível.</Text>
      ) : (
        academias.map((academia) => renderItem({ usuario: academia, perfilDestinatario: 'academia' }))
      )}

      <Text style={styles.secaoTitulo}>Professores autônomos</Text>
      {professores.length === 0 ? (
        <Text style={styles.vazio}>Nenhum professor autônomo disponível.</Text>
      ) : (
        professores.map((professor) => renderItem({ usuario: professor, perfilDestinatario: 'professor' }))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.branco, padding: Espacamento.padrao },
  conteudo: { paddingBottom: Espacamento.enorme },
  erroInline: { color: Cores.alerta, fontSize: TamanhoFonte.sm, marginBottom: Espacamento.padrao },
  secaoTitulo: { fontSize: TamanhoFonte.lg, fontWeight: '700', color: Cores.preto, marginTop: Espacamento.padrao, marginBottom: Espacamento.pequeno },
  vazio: { color: Cores.cinzaMedio, fontSize: TamanhoFonte.sm, marginBottom: Espacamento.pequeno },
  item: { marginBottom: Espacamento.pequeno },
  itemLinha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Espacamento.medio },
  itemInfo: { flex: 1 },
  itemNome: { fontSize: TamanhoFonte.md, fontWeight: '700', color: Cores.preto },
  itemTipo: { fontSize: TamanhoFonte.xs, color: Cores.cinzaMedio, marginTop: Espacamento.minimo },
});
