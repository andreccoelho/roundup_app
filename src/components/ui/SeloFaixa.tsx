// SeloFaixa — faixa/graduação como faixa de tecido em SVG (RF06, RF25). O modelo de dados NÃO
// muda: `faixaOuGrau` continua texto livre ("Faixa roxa, 2º grau", "azul", "preta 3 dan"); o
// componente interpreta esse texto para desenhar a cor e as tarjas de grau na ponteira. Texto que
// não reconhece cai num fallback neutro (faixa cinza-escura, sem tarjas) e o texto original
// continua sempre visível ao lado — nada se perde.
import { StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { Cores, CoresFaixa, Espacamento } from '../../theme';
import Texto from './Texto';

type CorFaixa = keyof typeof CoresFaixa;

const PADROES: [RegExp, CorFaixa][] = [
  [/branc/i, 'branca'],
  [/cinz/i, 'cinza'],
  [/amarel/i, 'amarela'],
  [/laranj/i, 'laranja'],
  [/verd/i, 'verde'],
  [/azul/i, 'azul'],
  [/rox|lil[aá]s/i, 'roxa'],
  [/marr/i, 'marrom'],
  [/vermelh/i, 'vermelha'],
  [/pret/i, 'preta'],
];

export interface FaixaInterpretada {
  cor: CorFaixa;
  reconhecida: boolean;
  graus: number;
}

// Cor = primeira palavra de cor que aparece no texto (em "vermelha e preta" vence vermelha).
// Grau = número antes ou depois de "grau"/"dan"/"kyu" ("2º grau", "grau 2", "3 dan").
export function interpretarFaixa(texto: string): FaixaInterpretada {
  let melhor: { cor: CorFaixa; indice: number } | null = null;
  for (const [padrao, cor] of PADROES) {
    const m = padrao.exec(texto);
    if (m && (melhor === null || m.index < melhor.indice)) melhor = { cor, indice: m.index };
  }
  const grau = /(\d+)\s*(?:º|°|o|ª)?\s*(?:grau|graus|dan|kyu)/i.exec(texto) ?? /(?:grau|dan|kyu)\s*(\d+)/i.exec(texto);
  const graus = grau ? Math.min(6, Math.max(0, parseInt(grau[1], 10))) : 0;
  return { cor: melhor?.cor ?? 'neutra', reconhecida: melhor !== null, graus };
}

interface SeloFaixaProps {
  faixaOuGrau: string;
  tamanho?: 'normal' | 'grande';
  // Só a faixa, sem o texto ao lado (o texto vira apenas o rótulo acessível).
  semTexto?: boolean;
}

export default function SeloFaixa({ faixaOuGrau, tamanho = 'normal', semTexto }: SeloFaixaProps) {
  const { cor, reconhecida, graus } = interpretarFaixa(faixaOuGrau);
  const grande = tamanho === 'grande';
  const w = grande ? 168 : 56;
  const h = grande ? 26 : 12;
  // Ponteira (a ponta escura onde vão os graus): preta, exceto na faixa preta (vermelha).
  const corPonteira = cor === 'preta' ? CoresFaixa.vermelha : CoresFaixa.preta;
  const pontaX = w * 0.6;
  const pontaW = w * 0.26;
  const tarjaW = Math.max(2, w * 0.022);
  const passo = pontaW / 7;

  return (
    <View style={[styles.container, grande && styles.containerGrande]} accessible accessibilityLabel={`Faixa: ${faixaOuGrau}`}>
      <Svg width={w} height={h} aria-hidden>
        <Rect x={0.5} y={0.5} width={w - 1} height={h - 1} rx={1.5} fill={CoresFaixa[cor]} stroke={Cores.linhaForte} strokeWidth={1} />
        {reconhecida ? <Rect x={pontaX} y={0.5} width={pontaW} height={h - 1} fill={corPonteira} /> : null}
        {reconhecida
          ? Array.from({ length: graus }).map((_, i) => (
              <Rect key={i} x={pontaX + passo * (i + 0.6)} y={0.5} width={tarjaW} height={h - 1} fill={CoresFaixa.branca} />
            ))
          : null}
      </Svg>
      {semTexto ? null : (
        <Texto variante={grande ? 'corpoForte' : 'legenda'} cor={grande ? 'texto' : 'texto2'} numberOfLines={1} style={styles.texto}>
          {faixaOuGrau}
        </Texto>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.pequeno, alignSelf: 'flex-start' },
  containerGrande: { flexDirection: 'column', alignItems: 'center', gap: Espacamento.pequeno, alignSelf: 'center' },
  texto: { flexShrink: 1 },
});
