// ItemMenu — linha de navegação (ícone + rótulo + chevron), para atalhos e listas de
// configurações. Substitui a "nuvem de botões" contornados dos perfis e os links cinza de rodapé
// dos dashboards. Separação entre itens: `separador` desenha a LinhaFina acima.
import type { ComponentType } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Alturas, Cores, Espacamento, TamanhoFonte } from '../../theme';
import { estiloAnelFoco, estiloSemOutline, useFocoVisivel } from '../../hooks/useFocoVisivel';
import { IconeChevron } from '../icones';
import LinhaFina from '../LinhaFina';
import Texto from './Texto';

interface ItemMenuProps {
  rotulo: string;
  onPress: () => void;
  icone?: ComponentType<{ tamanho?: number; cor?: string }>;
  descricao?: string;
  valor?: string;
  destrutivo?: boolean;
  separador?: boolean;
  semChevron?: boolean;
}

export default function ItemMenu({ rotulo, onPress, icone: Icone, descricao, valor, destrutivo, separador, semChevron }: ItemMenuProps) {
  const { focado, propsFoco } = useFocoVisivel();
  const cor = destrutivo ? 'perigo' : 'texto';
  return (
    <>
      {separador ? <LinhaFina /> : null}
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={descricao ? `${rotulo}. ${descricao}` : rotulo}
        style={({ pressed }) => [styles.linha, pressed && styles.pressionado, estiloSemOutline, focado && estiloAnelFoco]}
        {...propsFoco}
      >
        {Icone ? (
          <View style={styles.icone}>
            <Icone tamanho={22} cor={destrutivo ? Cores.perigo : Cores.texto2} />
          </View>
        ) : null}
        <View style={styles.textos}>
          <Texto variante="corpo" cor={cor}>
            {rotulo}
          </Texto>
          {descricao ? <Texto variante="legenda">{descricao}</Texto> : null}
        </View>
        {valor ? (
          <Texto variante="placar" cor="texto2" style={styles.valor}>
            {valor}
          </Texto>
        ) : null}
        {semChevron ? null : <IconeChevron tamanho={20} cor={Cores.texto3} />}
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.medio,
    minHeight: Alturas.botaoHero,
    paddingVertical: Espacamento.medio,
  },
  pressionado: { backgroundColor: Cores.superficie1 },
  icone: { width: 28, alignItems: 'center' },
  textos: { flex: 1, gap: 2 },
  valor: { fontSize: TamanhoFonte.lg },
});
