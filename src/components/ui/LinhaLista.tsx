// LinhaLista — linha de lista agrupada inserida (inset grouped) do iOS: mínimo de 44pt, ícone
// opcional em tint à esquerda, rótulo em Body, descrição em Footnote, valor à direita e chevron
// quando a linha navega. `acessorio` substitui o chevron (ex.: um botão ou um selo). O separador
// é desenhado pela própria linha (`separadorAcima`), recuado até o início do texto — o GrupoLista
// liga isso em todas as linhas menos a primeira.
import type { ComponentType, ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Alturas, criarEstilos, Espacamento, useTema, type NomeCor } from '../../theme';
import { estiloAnelFoco, estiloSemOutline, useFocoVisivel } from '../../hooks/useFocoVisivel';
import { IconeChevron } from '../icones';
import LinhaFina from '../LinhaFina';
import Texto from './Texto';

export interface LinhaListaProps {
  rotulo?: string;
  descricao?: string;
  valor?: string;
  icone?: ComponentType<{ tamanho?: number; cor?: string }>;
  corIcone?: NomeCor;
  onPress?: () => void;
  destrutivo?: boolean;
  semChevron?: boolean;
  acessorio?: ReactNode;
  // Conteúdo livre no lugar de rótulo/descrição (ex.: avatar + nome + faixa)
  children?: ReactNode;
  separadorAcima?: boolean;
  accessibilityLabel?: string;
}

const LARGURA_ICONE = 28;

function LinhaLista({
  rotulo,
  descricao,
  valor,
  icone: Icone,
  corIcone = 'tint',
  onPress,
  destrutivo,
  semChevron,
  acessorio,
  children,
  separadorAcima,
  accessibilityLabel,
}: LinhaListaProps) {
  const { focado, propsFoco } = useFocoVisivel();
  const { cores } = useTema();
  const styles = useEstilos();
  const recuo = Espacamento.padrao + (Icone ? LARGURA_ICONE + Espacamento.medio : 0);

  const conteudo = (
    <>
      {Icone ? (
        <View style={styles.icone}>
          <Icone tamanho={22} cor={destrutivo ? cores.perigo : cores[corIcone]} />
        </View>
      ) : null}
      <View style={styles.textos}>
        {children ?? (
          <>
            {rotulo ? (
              <Texto variante="body" cor={destrutivo ? 'perigo' : 'texto'}>
                {rotulo}
              </Texto>
            ) : null}
            {descricao ? <Texto variante="footnote">{descricao}</Texto> : null}
          </>
        )}
      </View>
      {valor ? (
        <Texto variante="body" cor="texto2" style={styles.valor}>
          {valor}
        </Texto>
      ) : null}
      {acessorio ?? (onPress && !semChevron ? <IconeChevron tamanho={18} cor={cores.texto3} /> : null)}
    </>
  );

  return (
    <View>
      {separadorAcima ? <LinhaFina recuo={recuo} /> : null}
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          // Sem rótulo próprio, o nome acessível é o texto visível (rótulo + descrição), sem divergir dele
          accessibilityLabel={accessibilityLabel}
          style={({ pressed }) => [styles.linha, pressed && styles.pressionada, estiloSemOutline, focado && estiloAnelFoco]}
          {...propsFoco}
        >
          {conteudo}
        </Pressable>
      ) : (
        <View style={styles.linha} accessible={Boolean(accessibilityLabel)} accessibilityLabel={accessibilityLabel}>
          {conteudo}
        </View>
      )}
    </View>
  );
}

// O GrupoLista reconhece quem desenha o próprio separador por esta marca (evita import circular)
LinhaLista.desenhaSeparador = true;

export default LinhaLista;

const useEstilos = criarEstilos((c) => ({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.medio,
    minHeight: Alturas.linha,
    paddingVertical: Espacamento.pequeno + 3,
    paddingHorizontal: Espacamento.padrao,
  },
  pressionada: { backgroundColor: c.preenchimento },
  icone: { width: LARGURA_ICONE, alignItems: 'center' },
  textos: { flex: 1, gap: 2 },
  valor: { flexShrink: 0 },
}));
