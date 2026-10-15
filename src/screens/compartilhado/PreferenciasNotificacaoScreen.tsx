// RF31: preferências de notificação por tipo, compartilhada pelas 3 raízes (aluno/professor/
// academia — a lista de tipos é a mesma para todos os perfis). Persiste em
// usuarios.preferenciasNotificacao via atualizarUsuario() — a regra de usuarios.update já
// permite o próprio dono alterar qualquer campo (só confere que `perfil` não muda), sem
// precisar de mudança em firestore.rules.
//
// PENDÊNCIA SINALIZADA, NÃO IMPLEMENTADA: isto só grava a preferência. O envio real de push
// (lembrete de sessão, nova missão, conquista) exigiria `expo-notifications` (permissão do
// dispositivo, token, registro em algum lugar) e um gatilho de backend que dispare no momento
// certo (ex.: Cloud Function agendada para lembrete de sessão, ou disparada por
// validarCheckIn()/criarMissao() para os outros dois) — nenhum dos dois existe no projeto hoje.
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Cores, Espacamento, TamanhoFonte } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { atualizarUsuario } from '../../services/usuarios';
import { PreferenciasNotificacao } from '../../types';
import Etiqueta from '../../components/ui/Etiqueta';

const PADRAO: PreferenciasNotificacao = { lembreteSessao: true, novaMissao: true, conquista: true };

const TIPOS: { chave: keyof PreferenciasNotificacao; titulo: string; descricao: string }[] = [
  { chave: 'lembreteSessao', titulo: 'Lembrete de sessão', descricao: 'Avisa antes do horário dos seus treinos agendados.' },
  { chave: 'novaMissao', titulo: 'Nova missão', descricao: 'Avisa quando uma missão nova for publicada para você.' },
  { chave: 'conquista', titulo: 'Conquista', descricao: 'Avisa quando você ganhar uma medalha ou subir de nível.' },
];

export default function PreferenciasNotificacaoScreen() {
  const { usuario } = useAuth();
  const [preferencias, setPreferencias] = useState<PreferenciasNotificacao>(PADRAO);
  const [salvandoChave, setSalvandoChave] = useState<keyof PreferenciasNotificacao | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (usuario?.preferenciasNotificacao) {
      setPreferencias(usuario.preferenciasNotificacao);
    }
  }, [usuario]);

  async function handleAlternar(chave: keyof PreferenciasNotificacao) {
    if (!usuario) return;
    const novasPreferencias = { ...preferencias, [chave]: !preferencias[chave] };
    setErro(null);
    setSalvandoChave(chave);
    try {
      await atualizarUsuario(usuario.id, { preferenciasNotificacao: novasPreferencias });
      setPreferencias(novasPreferencias);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setSalvandoChave(null);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      {erro ? (
        <Text style={styles.erro} accessibilityRole="alert">
          {erro}
        </Text>
      ) : null}

      {TIPOS.map(({ chave, titulo, descricao }) => (
        <View key={chave} style={styles.linha}>
          <View style={styles.linhaTextos}>
            <Text style={styles.linhaTitulo}>{titulo}</Text>
            <Text style={styles.linhaDescricao}>{descricao}</Text>
          </View>
          <Etiqueta
            texto={preferencias[chave] ? 'Ativado' : 'Desativado'}
            selecionada={preferencias[chave]}
            desabilitada={salvandoChave === chave}
            onPress={() => handleAlternar(chave)}
            accessibilityLabel={`${titulo}: ${preferencias[chave] ? 'ativado' : 'desativado'}. Toque para alternar.`}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo, padding: Espacamento.padrao },
  conteudo: { paddingBottom: Espacamento.enorme },
  erro: { color: Cores.perigo, fontSize: TamanhoFonte.sm, marginBottom: Espacamento.padrao },
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Espacamento.medio, paddingVertical: Espacamento.medio },
  linhaTextos: { flex: 1 },
  linhaTitulo: { fontSize: TamanhoFonte.md, fontWeight: '600', color: Cores.texto },
  linhaDescricao: { fontSize: TamanhoFonte.xs, color: Cores.texto2, marginTop: Espacamento.minimo },
});
