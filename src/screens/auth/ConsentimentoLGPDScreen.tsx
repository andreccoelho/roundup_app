// RF28, RNF10: consentimento LGPD, inserido no onboarding entre SelecaoPerfilScreen e a tela de
// Cadastro do perfil escolhido. O texto da política abaixo é placeholder de conteúdo (decisão
// jurídica, não de UI) — só a estrutura (versão, aceite, registro) é real.
//
// O registro em `consentimentosLGPD` (RF28) exige `request.auth != null` e
// `usuarioId == meuId()` (ver firestore.rules) — não dá para gravar aqui, porque a conta ainda
// não existe neste ponto do fluxo (Firebase Auth só cria o usuário dentro de cadastrar(), na
// tela de Cadastro). Por isso o aceite marcado aqui só vira params de navegação
// (consentimentoAceito, versaoConsentimento); a gravação real acontece dentro de cada tela de
// Cadastro, logo depois que cadastrar() resolve e já existe um uid autenticado.
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { criarEstilos, Espacamento, Raios } from '../../theme';
import { AuthStackParamList } from '../../navigation/AuthStack';
import Botao from '../../components/ui/Botao';
import Checkbox from '../../components/ui/Checkbox';
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';

export const VERSAO_POLITICA_LGPD = '1.0';

type Rota = RouteProp<AuthStackParamList, 'ConsentimentoLGPD'>;
type Navegacao = NativeStackNavigationProp<AuthStackParamList, 'ConsentimentoLGPD'>;

export default function ConsentimentoLGPDScreen() {
  const styles = useEstilos();
  const navigation = useNavigation<Navegacao>();
  const { destino } = useRoute<Rota>().params;
  const [aceito, setAceito] = useState(false);

  function handleContinuar() {
    navigation.navigate(destino, { consentimentoAceito: true, versaoConsentimento: VERSAO_POLITICA_LGPD });
  }

  return (
    <Tela largura="formulario" bordas={['topo', 'base']} agrupada>
      <Botao variante="voltar" onPress={() => navigation.goBack()} />

      <Texto variante="largeTitle" style={styles.titulo}>
        Seus dados
      </Texto>
      <Texto variante="body" cor="texto2" style={styles.subtitulo}>
        {`Antes de continuar, leia como o RoundUp trata seus dados pessoais (versão ${VERSAO_POLITICA_LGPD}).`}
      </Texto>

      <View style={styles.politica}>
        <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
          <Texto variante="subheadline">
            [Texto da política de privacidade — placeholder. Substituir pelo conteúdo jurídico definitivo antes da
            entrega, com a descrição real de quais dados são coletados, com que finalidade, por quanto tempo são
            retidos e como o usuário pode exercer seus direitos sob a LGPD (Lei 13.709/2018), incluindo acesso,
            correção e eliminação (RF29).]
          </Texto>
        </ScrollView>
      </View>

      <View style={styles.aceite}>
        <Checkbox rotulo="Li e aceito a política de privacidade." marcado={aceito} onAlterar={setAceito} />
      </View>

      <Botao titulo="Continuar" onPress={handleContinuar} desabilitado={!aceito} />
      {!aceito ? (
        <Texto variante="subheadline" cor="texto3" alinhamento="center" style={styles.ajuda}>
          Marque o aceite para continuar.
        </Texto>
      ) : null}
    </Tela>
  );
}

const useEstilos = criarEstilos((c) => ({
  titulo: { marginTop: Espacamento.grande },
  subtitulo: { marginTop: Espacamento.pequeno, marginBottom: Espacamento.grande },
  politica: {
    backgroundColor: c.superficie,
    borderRadius: Raios.lista,
    borderCurve: 'continuous',
    padding: Espacamento.padrao,
    maxHeight: 280,
  },
  aceite: { marginTop: Espacamento.grande, marginBottom: Espacamento.padrao },
  ajuda: { marginTop: Espacamento.pequeno },
}));
