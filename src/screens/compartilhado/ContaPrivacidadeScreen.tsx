// RF29, RNF10: "Conta e privacidade" — subtela compartilhada pelos 3 perfis. A exclusão de conta
// saiu da tela principal do Perfil (era um botão vermelho logo acima de "Sair",
// RELATORIO_UI_UX.md UI-08/UX-09) e mora aqui, atrás de uma navegação e de uma confirmação.
//
// A exclusão roda na Cloud Function excluirConta (ver AuthContext.tsx#excluirConta). Uma falha
// nunca aparece como o texto técnico do Firebase: a mensagem mostrada é sempre a mesma frase fixa
// em português; o erro real vai só pro console, para depuração.
import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useTema } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import Tela from '../../components/ui/Tela';
import Dialogo from '../../components/ui/Dialogo';
import Aviso from '../../components/ui/Aviso';
import GrupoLista from '../../components/ui/GrupoLista';
import LinhaLista from '../../components/ui/LinhaLista';
import { IconeAlerta } from '../../components/icones';

const MENSAGEM_FALHA_EXCLUSAO = 'Não foi possível excluir sua conta agora.';

export default function ContaPrivacidadeScreen() {
  const { cores } = useTema();
  const { usuario, excluirConta } = useAuth();
  const [confirmando, setConfirmando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [avisoVisivel, setAvisoVisivel] = useState(false);

  async function handleConfirmar() {
    setExcluindo(true);
    try {
      await excluirConta();
      // Sucesso desloga (excluirConta() chama signOut) — RootNavigator troca de raiz sem
      // navegação manual daqui.
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
      agrupada
      sobreposicao={
        <Aviso mensagem={MENSAGEM_FALHA_EXCLUSAO} tipo="erro" visivel={avisoVisivel} onFechar={() => setAvisoVisivel(false)} acimaDaTabBar />
      }
    >
      <GrupoLista titulo="Conta" semMargem>
        <LinhaLista rotulo="E-mail" valor={usuario?.email ?? ''} />
      </GrupoLista>

      <GrupoLista titulo="Privacidade" rodape="Seus dados são tratados conforme a política de privacidade aceita no cadastro (LGPD, Lei 13.709/2018).">
        <LinhaLista rotulo="Política de privacidade" valor="Aceita no cadastro" />
      </GrupoLista>

      <GrupoLista rodape="Remove sua conta e os dados pessoais associados. Esta ação não pode ser desfeita.">
        <LinhaLista
          rotulo="Excluir minha conta"
          icone={IconeAlerta}
          destrutivo
          semChevron
          acessorio={excluindo ? <ActivityIndicator color={cores.perigo} accessibilityLabel="Carregando" /> : undefined}
          onPress={() => setConfirmando(true)}
        />
      </GrupoLista>

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
