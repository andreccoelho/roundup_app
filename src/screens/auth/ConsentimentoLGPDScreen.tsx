// RF28, RNF10: consentimento LGPD, inserido no onboarding entre SelecaoPerfilScreen e a tela de
// Cadastro do perfil escolhido. O texto da política fica em src/constants/politicaPrivacidade.ts
// e precisa de revisão jurídica antes da entrega.
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
import { POLITICA_PRIVACIDADE, VERSAO_POLITICA_LGPD } from '../../constants/politicaPrivacidade';

export { VERSAO_POLITICA_LGPD };

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
          {POLITICA_PRIVACIDADE.map((secao) => (
            <View key={secao.titulo} style={styles.secao}>
              <Texto variante="headline">{secao.titulo}</Texto>
              {secao.paragrafos.map((p) => (
                <Texto key={p} variante="subheadline" style={styles.paragrafo}>
                  {p}
                </Texto>
              ))}
            </View>
          ))}
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
  secao: { marginBottom: Espacamento.padrao },
  paragrafo: { marginTop: Espacamento.pequeno },
  aceite: { marginTop: Espacamento.grande, marginBottom: Espacamento.padrao },
  ajuda: { marginTop: Espacamento.pequeno },
}));
