// RF29, RNF10: "Conta e privacidade" — subtela compartilhada pelos 3 perfis. A exclusão de conta
// saiu da tela principal do Perfil (era um botão vermelho logo acima de "Sair",
// RELATORIO_UI_UX.md UI-08/UX-09) e mora aqui, atrás de uma navegação e de uma confirmação.
//
// Ver comentário em AuthContext.tsx#excluirConta sobre a pendência de regra do Firestore que hoje
// faz a chamada real falhar (allow delete: if false em usuarios) — e por que essa falha não pode
// aparecer como o texto técnico do Firebase: a mensagem mostrada é sempre a mesma frase fixa em
// português; o erro real vai só pro console, para depuração.
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Cores, Espacamento } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';
import Botao from '../../components/ui/Botao';
import Dialogo from '../../components/ui/Dialogo';
import Aviso from '../../components/ui/Aviso';
import CabecalhoSecao from '../../components/ui/CabecalhoSecao';
import { IconeAlerta } from '../../components/icones';

const MENSAGEM_FALHA_EXCLUSAO = 'Não foi possível excluir sua conta agora.';

export default function ContaPrivacidadeScreen() {
  const { usuario, excluirConta } = useAuth();
  const [confirmando, setConfirmando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [avisoVisivel, setAvisoVisivel] = useState(false);

  async function handleConfirmar() {
    setExcluindo(true);
    try {
      await excluirConta();
      // Sucesso desloga sozinho (Firebase Auth remove a sessão) — RootNavigator troca de raiz
      // sem navegação manual daqui.
    } catch (e) {
      console.warn('excluirConta() falhou:', e);
      setAvisoVisivel(true);
    } finally {
      setExcluindo(false);
      setConfirmando(false);
    }
  }

  return (
    <Tela
      largura="formulario"
      sobreposicao={
        <Aviso mensagem={MENSAGEM_FALHA_EXCLUSAO} tipo="erro" visivel={avisoVisivel} onFechar={() => setAvisoVisivel(false)} acimaDaTabBar />
      }
    >
      <CabecalhoSecao titulo="Conta" semMargem />
      <Texto variante="legenda">E-mail de acesso</Texto>
      <Texto variante="corpoForte" style={styles.email}>
        {usuario?.email ?? ''}
      </Texto>

      <CabecalhoSecao titulo="Privacidade" />
      <Texto variante="corpo" cor="texto2">
        Seus dados são tratados conforme a política de privacidade aceita no cadastro (LGPD, Lei 13.709/2018).
      </Texto>

      <CabecalhoSecao titulo="Zona de risco" />
      <View style={styles.risco}>
        <View style={styles.riscoTitulo}>
          <IconeAlerta tamanho={20} cor={Cores.perigo} />
          <Texto variante="corpoForte">Excluir conta</Texto>
        </View>
        <Texto variante="legenda" style={styles.riscoTexto}>
          Remove sua conta e os dados pessoais associados. Esta ação não pode ser desfeita.
        </Texto>
        <View style={styles.riscoAcao}>
          <Botao compacto titulo="Excluir minha conta" variante="destrutivo" onPress={() => setConfirmando(true)} />
        </View>
      </View>

      <Dialogo
        visivel={confirmando}
        titulo="Excluir sua conta?"
        mensagem="Esta ação apaga sua conta e os dados pessoais associados, e não pode ser desfeita."
        tituloConfirmar="Excluir"
        destrutivo
        carregando={excluindo}
        onConfirmar={handleConfirmar}
        tituloCancelar="Cancelar"
        onCancelar={() => setConfirmando(false)}
      />
    </Tela>
  );
}

const styles = StyleSheet.create({
  email: { marginTop: 2 },
  risco: { borderLeftWidth: 2, borderLeftColor: Cores.perigo, paddingLeft: Espacamento.medio, paddingVertical: Espacamento.pequeno },
  riscoTitulo: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.pequeno },
  riscoTexto: { marginTop: Espacamento.minimo },
  riscoAcao: { alignItems: 'flex-start', marginTop: Espacamento.medio },
});
