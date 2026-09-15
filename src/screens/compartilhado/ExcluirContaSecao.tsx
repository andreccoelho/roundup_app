// RF29: exclusão de conta — seção reaproveitada pelas 3 telas de Perfil (aluno/professor/
// academia), mesmo fluxo de confirmação explícita nas três. Ver comentário em
// AuthContext.tsx#excluirConta sobre a pendência de regra do Firestore que hoje faz a chamada
// real falhar (allow delete: if false em usuarios).
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Cores, Espacamento, TamanhoFonte } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import Botao from '../../components/ui/Botao';
import Dialogo from '../../components/ui/Dialogo';

export default function ExcluirContaSecao() {
  const { excluirConta } = useAuth();
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleConfirmar() {
    setErro(null);
    try {
      await excluirConta();
      // Sucesso desloga sozinho (Firebase Auth remove a sessão) — RootNavigator troca de raiz
      // sem navegação manual daqui.
    } catch (e: any) {
      setErro(e.message ?? 'Não foi possível excluir sua conta agora.');
    } finally {
      setConfirmando(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Excluir conta</Text>
      <Text style={styles.descricao}>Remove sua conta e os dados pessoais associados. Esta ação não pode ser desfeita.</Text>
      {erro ? (
        <Text style={styles.erro} accessibilityRole="alert">
          {erro}
        </Text>
      ) : null}
      <View style={styles.espaco} />
      <Botao titulo="Excluir minha conta" variante="destrutivo" onPress={() => setConfirmando(true)} />

      <Dialogo
        visivel={confirmando}
        titulo="Excluir sua conta?"
        mensagem="Esta ação apaga sua conta e os dados pessoais associados, e não pode ser desfeita."
        tituloConfirmar="Excluir"
        destrutivo
        onConfirmar={handleConfirmar}
        tituloCancelar="Cancelar"
        onCancelar={() => setConfirmando(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: Espacamento.grande },
  titulo: { fontSize: TamanhoFonte.md, fontWeight: '600', color: Cores.preto },
  descricao: { fontSize: TamanhoFonte.sm, color: Cores.cinzaMedio, marginTop: Espacamento.minimo },
  erro: { color: Cores.alerta, fontSize: TamanhoFonte.sm, marginTop: Espacamento.medio },
  espaco: { height: Espacamento.medio },
});
