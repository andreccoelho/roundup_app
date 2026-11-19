// CampoTexto — único campo de texto do app (docs/DESIGN.md). Campo arredondado preenchido, no
// estilo do iOS: rótulo sempre visível acima (é ele, e não uma borda, que identifica o campo),
// fundo `preenchimento`, borda de 2px em tint no foco e em perigo no erro. Rótulo vira o nome
// acessível do input; erro é anunciado (live region). Senha com mostrar/ocultar. Máscara opcional
// de data (DD/MM/AAAA) e hora (HH:MM) com teclado numérico — o valor entregue continua sendo o
// texto formatado, exatamente como as telas já validavam antes.
import { useState, type Ref } from 'react';
import { Pressable, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';
import { Alturas, criarEstilos, Espacamento, Raios, Tipografia, useTema } from '../../theme';
import { estiloAnelFoco, estiloSemOutline, useFocoVisivel } from '../../hooks/useFocoVisivel';
import { IconeOlho, IconeOlhoFechado } from '../icones';
import Texto from './Texto';

type Mascara = 'data' | 'hora';

interface CampoTextoProps
  extends Pick<
    TextInputProps,
    | 'secureTextEntry'
    | 'keyboardType'
    | 'autoCapitalize'
    | 'autoCorrect'
    | 'placeholder'
    | 'onSubmitEditing'
    | 'returnKeyType'
    | 'autoComplete'
    | 'textContentType'
    | 'multiline'
    | 'editable'
  > {
  rotulo: string;
  valor: string;
  onAlterar: (texto: string) => void;
  erro?: string;
  ajuda?: string;
  mascara?: Mascara;
  // Para encadear campos (Enter/"próximo" foca o seguinte).
  refCampo?: Ref<TextInputInstance>;
}

function aplicarMascara(texto: string, mascara: Mascara): string {
  const digitos = texto.replace(/\D/g, '');
  if (mascara === 'hora') {
    const d = digitos.slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}:${d.slice(2)}` : d;
  }
  const d = digitos.slice(0, 8);
  if (d.length > 4) return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
  if (d.length > 2) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return d;
}

export default function CampoTexto({
  rotulo,
  valor,
  onAlterar,
  erro,
  ajuda,
  mascara,
  secureTextEntry,
  keyboardType,
  placeholder,
  multiline,
  refCampo,
  ...resto
}: CampoTextoProps) {
  const [focado, setFocado] = useState(false);
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const olho = useFocoVisivel();
  const { cores } = useTema();
  const styles = useEstilos();

  const corBorda = erro ? cores.perigo : focado ? cores.tint : 'transparent';
  const ehSenha = Boolean(secureTextEntry);

  return (
    <View style={styles.container}>
      <Texto variante="footnote" style={styles.rotulo} cabecalho={false}>
        {rotulo}
      </Texto>
      <View style={[styles.caixa, { borderColor: corBorda }]}>
        <TextInput
          ref={refCampo}
          style={[styles.campo, multiline && styles.campoMultilinha, estiloSemOutline]}
          value={valor}
          onChangeText={(texto) => onAlterar(mascara ? aplicarMascara(texto, mascara) : texto)}
          onFocus={() => setFocado(true)}
          onBlur={() => setFocado(false)}
          placeholder={placeholder ?? (mascara === 'data' ? 'DD/MM/AAAA' : mascara === 'hora' ? 'HH:MM' : undefined)}
          placeholderTextColor={cores.texto3}
          selectionColor={cores.tint}
          cursorColor={cores.tint}
          secureTextEntry={ehSenha && !senhaVisivel}
          keyboardType={mascara ? 'number-pad' : keyboardType}
          maxLength={mascara === 'data' ? 10 : mascara === 'hora' ? 5 : undefined}
          multiline={multiline}
          accessibilityLabel={rotulo}
          accessibilityHint={erro ? `Erro: ${erro}` : ajuda}
          {...resto}
        />
        {ehSenha ? (
          <Pressable
            onPress={() => setSenhaVisivel((v) => !v)}
            hitSlop={8}
            style={[styles.olho, estiloSemOutline, olho.focado && estiloAnelFoco]}
            accessibilityRole="button"
            accessibilityLabel={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}
            {...olho.propsFoco}
          >
            {senhaVisivel ? <IconeOlhoFechado tamanho={20} cor={cores.texto2} /> : <IconeOlho tamanho={20} cor={cores.texto2} />}
          </Pressable>
        ) : null}
      </View>
      {erro ? (
        <Texto variante="footnote" cor="perigo" style={styles.mensagem} accessibilityRole="alert" accessibilityLiveRegion="polite">
          {erro}
        </Texto>
      ) : ajuda ? (
        <Texto variante="footnote" cor="texto2" style={styles.mensagem}>
          {ajuda}
        </Texto>
      ) : null}
    </View>
  );
}

const useEstilos = criarEstilos((c) => ({
  container: { marginBottom: Espacamento.padrao },
  rotulo: { marginBottom: Espacamento.minimo + 2, marginLeft: Espacamento.minimo },
  caixa: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.preenchimento,
    borderRadius: Raios.campo,
    borderCurve: 'continuous',
    borderWidth: 2,
  },
  campo: {
    flex: 1,
    minHeight: Alturas.campo,
    paddingHorizontal: Espacamento.medio,
    paddingVertical: Espacamento.pequeno + 2,
    ...Tipografia.body,
    color: c.texto,
  },
  campoMultilinha: { minHeight: 96, textAlignVertical: 'top' },
  olho: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: Espacamento.minimo },
  mensagem: { marginTop: Espacamento.minimo, marginLeft: Espacamento.minimo },
}));
