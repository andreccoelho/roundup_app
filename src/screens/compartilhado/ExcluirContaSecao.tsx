// RF29: exclusão de conta — seção reaproveitada pelas 3 telas de Perfil (aluno/professor/
// academia), mesmo fluxo de confirmação explícita nas três. Ver comentário em
// AuthContext.tsx#excluirConta sobre a pendência de regra do Firestore que hoje faz a chamada
// real falhar (allow delete: if false em usuarios) — e por que essa falha, mesmo esperada, não
// pode aparecer como o texto técnico do Firebase na tela: `e.message` de um erro de permissão
// do Firestore é algo como "Missing or insufficient permissions", em inglês, que pra quem está
// tentando excluir a própria conta lê como uma exceção crua, não como uma mensagem do produto.
// Por isso a mensagem mostrada é sempre a mesma frase fixa em português, independente do que o
// SDK devolveu — o erro real vai só pro console, para depuração.
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Cores, Espacamento, TamanhoFonte } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import Botao from '../../components/ui/Botao';
import Dialogo from '../../components/ui/Dialogo';
import Aviso from '../../components/ui/Aviso';

const MENSAGEM_FALHA_EXCLUSAO = 'Não foi possível excluir sua conta agora.';

export default function ExcluirContaSecao() {
  const { excluirConta } = useAuth();
  const [confirmando, setConfirmando] = useState(false);
  const [avisoVisivel, setAvisoVisivel] = useState(false);

  async function handleConfirmar() {
    try {
      await excluirConta();
      // Sucesso desloga sozinho (Firebase Auth remove a sessão) — RootNavigator troca de raiz
      // sem navegação manual daqui.
    } catch (e) {
      console.warn('excluirConta() falhou:', e);
      setAvisoVisivel(true);
    } finally {
      setConfirmando(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Excluir conta</Text>
      <Text style={styles.descricao}>Remove sua conta e os dados pessoais associados. Esta ação não pode ser desfeita.</Text>

      <View style={styles.espaco} />
      {/* compacto + wrapper flex-start — ação rara e destrutiva, não precisa do mesmo peso
          visual de "Salvar"/"Confirmar"; um botão grande e cheio aqui lia como convite, não
          como último recurso. */}
      <View style={styles.botaoWrapper}>
        <Botao compacto titulo="Excluir minha conta" variante="destrutivo" onPress={() => setConfirmando(true)} />
      </View>

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

      <Aviso mensagem={MENSAGEM_FALHA_EXCLUSAO} tipo="erro" visivel={avisoVisivel} onFechar={() => setAvisoVisivel(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  // paddingHorizontal próprio: o componente não pode depender do pai já ter padding lateral —
  // as 3 telas de Perfil que o usam tiraram o padding do container geral (a banda de identidade
  // precisa ser full-bleed).
  container: { marginTop: Espacamento.grande, paddingHorizontal: Espacamento.padrao },
  // Wrapper só do botão, não do texto acima: alignItems:'flex-start' no container inteiro
  // quebraria o wrap do parágrafo de descrição (Text sem stretch tenta caber numa linha só).
  botaoWrapper: { alignItems: 'flex-start' },
  titulo: { fontSize: TamanhoFonte.md, fontWeight: '600', color: Cores.preto },
  descricao: { fontSize: TamanhoFonte.sm, color: Cores.cinzaMedio, marginTop: Espacamento.minimo },
  espaco: { height: Espacamento.medio },
});
