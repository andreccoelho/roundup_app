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
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Cores, Espacamento, FamiliaFonte, Raios, Sombras, TamanhoFonte } from '../../theme';
import { AuthStackParamList } from '../../navigation/AuthStack';
import Botao from '../../components/ui/Botao';
import Checkbox from '../../components/ui/Checkbox';

export const VERSAO_POLITICA_LGPD = '1.0';

type Rota = RouteProp<AuthStackParamList, 'ConsentimentoLGPD'>;
type Navegacao = NativeStackNavigationProp<AuthStackParamList, 'ConsentimentoLGPD'>;

const semAnelDeFoco = { outlineWidth: 0 } as const;

export default function ConsentimentoLGPDScreen() {
  const navigation = useNavigation<Navegacao>();
  const { destino } = useRoute<Rota>().params;
  const [aceito, setAceito] = useState(false);

  function handleContinuar() {
    navigation.navigate(destino, { consentimentoAceito: true, versaoConsentimento: VERSAO_POLITICA_LGPD });
  }

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Botao variante="voltar" onPress={() => navigation.goBack()} />

        <Text style={styles.titulo}>Privacidade dos seus dados</Text>
        <Text style={styles.subtitulo}>
          Antes de continuar, leia como o RoundUp trata seus dados pessoais (versão {VERSAO_POLITICA_LGPD}).
        </Text>

        <View style={styles.politica}>
          <Text style={styles.politicaTexto}>
            [Texto da política de privacidade — placeholder. Substituir pelo conteúdo jurídico
            definitivo antes da entrega, com a descrição real de quais dados são coletados, com
            que finalidade, por quanto tempo são retidos e como o usuário pode exercer seus
            direitos sob a LGPD (Lei 13.709/2018), incluindo acesso, correção e eliminação
            (RF29).]
          </Text>
        </View>

        <View style={styles.linhaAceite}>
          <Checkbox rotulo="Li e aceito a política de privacidade." marcado={aceito} onAlterar={setAceito} />
        </View>

        <View style={styles.espaco} />
        <Botao titulo="Continuar" onPress={handleContinuar} desabilitado={!aceito} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Cores.fundo },
  scroll: { flexGrow: 1, paddingHorizontal: Espacamento.grande, paddingTop: Espacamento.grande, paddingBottom: Espacamento.extraGrande },
  // script.md, item 2: título de tela em Homebase com efeito de "batida" (sombra dura).
  titulo: {
    fontFamily: FamiliaFonte.display,
    fontSize: TamanhoFonte.xxl,
    color: Cores.texto,
    marginTop: Espacamento.padrao,
  },
  subtitulo: { fontSize: TamanhoFonte.sm, color: Cores.texto2, marginTop: Espacamento.pequeno, marginBottom: Espacamento.grande },
  politica: {
    borderWidth: 1,
    borderColor: Cores.linha,
    borderRadius: Raios.pequeno,
    padding: Espacamento.padrao,
    maxHeight: 260,
  },
  politicaTexto: { fontSize: TamanhoFonte.sm, color: Cores.texto2, lineHeight: 20 },
  linhaAceite: { marginTop: Espacamento.grande },
  caixa: { width: 22, height: 22, borderRadius: Raios.pequeno, borderWidth: 1, borderColor: Cores.linhaForte },
  caixaMarcada: { backgroundColor: Cores.superficie2, borderColor: Cores.texto },
  textoAceite: { flex: 1, fontSize: TamanhoFonte.sm, color: Cores.texto },
  espaco: { height: Espacamento.padrao },
});
