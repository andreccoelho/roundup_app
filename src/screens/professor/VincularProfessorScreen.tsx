// RF07: professor solicita vínculo com uma academia
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Cores, Espacamento, TamanhoFonte } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { listarAcademiasDisponiveis, solicitarVinculo } from '../../services/vinculos';
import { Usuario } from '../../types';
import Cartao from '../../components/ui/Cartao';
import Botao from '../../components/ui/Botao';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoVazio from '../../components/ui/EstadoVazio';
import EstadoErro from '../../components/ui/EstadoErro';

export default function VincularProfessorScreen() {
  const { usuario } = useAuth();
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [academias, setAcademias] = useState<Usuario[]>([]);
  const [solicitados, setSolicitados] = useState<Set<string>>(new Set());
  const [erroSolicitacao, setErroSolicitacao] = useState<string | null>(null);

  const carregarAcademias = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      setAcademias(await listarAcademiasDisponiveis());
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarAcademias();
  }, [carregarAcademias]);

  async function handleSolicitar(academia: Usuario) {
    if (!usuario) return;
    setErroSolicitacao(null);
    try {
      await solicitarVinculo(usuario.id, academia.id, 'professor', 'academia');
      setSolicitados((prev) => new Set(prev).add(academia.id));
    } catch (e: any) {
      setErroSolicitacao(e.message);
    }
  }

  if (carregando) {
    return (
      <View style={styles.container}>
        <Esqueleto altura={64} repeticoes={4} />
      </View>
    );
  }

  if (erro) {
    return <EstadoErro mensagem={erro} onTentarNovamente={carregarAcademias} />;
  }

  if (academias.length === 0) {
    return (
      <View style={styles.container}>
        <EstadoVazio titulo="Nenhuma academia disponível" descricao="Ainda não há academias cadastradas para se vincular." />
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

      {academias.map((academia) => {
        const jaSolicitado = solicitados.has(academia.id);
        return (
          <Cartao key={academia.id} style={styles.item}>
            <View style={styles.itemLinha}>
              <Text style={styles.itemNome}>{academia.nome}</Text>
              <Botao
                titulo={jaSolicitado ? 'Solicitado' : 'Solicitar vínculo'}
                variante={jaSolicitado ? 'secundario' : 'primario'}
                desabilitado={jaSolicitado}
                onPress={() => handleSolicitar(academia)}
              />
            </View>
          </Cartao>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo, padding: Espacamento.padrao },
  conteudo: { paddingBottom: Espacamento.enorme },
  erroInline: { color: Cores.perigo, fontSize: TamanhoFonte.sm, marginBottom: Espacamento.padrao },
  item: { marginBottom: Espacamento.pequeno },
  itemLinha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Espacamento.medio },
  itemNome: { flex: 1, fontSize: TamanhoFonte.md, fontWeight: '700', color: Cores.texto },
});
