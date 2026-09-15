// Cartão — usar só quando agrupa informação que pertence junto, nunca como invólucro padrão
// de toda tela (ver DESIGN_BRIEF.md, "kit de card de SaaS"). `raio` é prop, não constante, para
// que tipos de conteúdo diferentes possam ter tratamentos diferentes.
import { StyleSheet, View, ViewProps } from 'react-native';
import { Cores, Espacamento, Raios } from '../../theme';

interface CartaoProps extends ViewProps {
  raio?: number;
  semBorda?: boolean;
}

export default function Cartao({ style, raio = Raios.medio, semBorda, children, ...resto }: CartaoProps) {
  return (
    <View style={[styles.cartao, { borderRadius: raio }, semBorda && styles.semBorda, style]} {...resto}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    borderWidth: 1,
    borderColor: Cores.cinzaBorda,
    padding: Espacamento.padrao,
  },
  semBorda: { borderWidth: 0 },
});
