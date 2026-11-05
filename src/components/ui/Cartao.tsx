// Cartão — superfície em `superficie` com canto contínuo, sem borda. Dois pesos:
//  - comum (raio 12): itens que agrupam conteúdo;
//  - `destaque` (raio 16 e sombra muito sutil só no tema claro): o dado principal da tela —
//    check-in do dia, progresso de nível, posição na classificação.
// Listas não são pilhas de cartões: usam GrupoLista.
import { View, type ViewProps } from 'react-native';
import { criarEstilos, Espacamento, Raios, useTema } from '../../theme';

interface CartaoProps extends ViewProps {
  destaque?: boolean;
  corFundo?: string;
  semPadding?: boolean;
  // Mantidos por compatibilidade com a direção anterior — não desenham mais nada.
  corteDiagonal?: boolean;
  corFilete?: string;
}

export default function Cartao({ style, destaque, corFundo, semPadding, children, corteDiagonal: _c, corFilete: _f, ...resto }: CartaoProps) {
  const styles = useEstilos();
  const { cores } = useTema();
  return (
    <View
      style={[styles.cartao, destaque && styles.destaque, { backgroundColor: corFundo ?? cores.superficie }, !semPadding && styles.conteudo, style]}
      {...resto}
    >
      {children}
    </View>
  );
}

const useEstilos = criarEstilos((_c, escuro) => ({
  cartao: { borderRadius: Raios.lista, borderCurve: 'continuous' },
  destaque: {
    borderRadius: Raios.destaque,
    ...(escuro ? {} : { boxShadow: '0px 1px 3px rgba(0,0,0,0.06), 0px 6px 16px rgba(0,0,0,0.05)' }),
  },
  conteudo: { padding: Espacamento.padrao },
}));
