// CampoTexto — único campo de texto do app (docs/DESIGN.md). Fundo superficie1, sublinhado
// linhaForte (3,6:1) que vira acento 2px no foco e perigo no erro. Rótulo vira o nome
// acessível do input; erro é anunciado (live region). Senha com mostrar/ocultar. Máscara opcional
// de data (DD/MM/AAAA) e hora (HH:MM) com teclado numérico — o valor entregue continua sendo o
// texto formatado, exatamente como as telas já validavam antes.
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { Cores, Espacamento, Raios, TamanhoFonte } from '../../theme';
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
  ...resto
}: CampoTextoProps) {
  const [focado, setFocado] = useState(false);
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const olho = useFocoVisivel();

  const corBorda = erro ? Cores.perigo : focado ? Cores.foco : Cores.linhaForte;
  const ehSenha = Boolean(secureTextEntry);

  return (
    <View style={styles.container}>
      <Texto variante="legenda" cor={focado ? 'texto' : 'texto2'} style={styles.rotulo} cabecalho={false}>
        {rotulo}
      </Texto>
      <View style={[styles.caixa, { borderBottomColor: corBorda }, (focado || erro) && styles.caixaRealce]}>
        <TextInput
          style={[styles.campo, multiline && styles.campoMultilinha, estiloSemOutline]}
          value={valor}
          onChangeText={(texto) => onAlterar(mascara ? aplicarMascara(texto, mascara) : texto)}
          onFocus={() => setFocado(true)}
          onBlur={() => setFocado(false)}
          placeholder={placeholder ?? (mascara === 'data' ? 'DD/MM/AAAA' : mascara === 'hora' ? 'HH:MM' : undefined)}
          placeholderTextColor={Cores.texto3}
          selectionColor={Cores.acento}
          cursorColor={Cores.acento}
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
            {senhaVisivel ? <IconeOlhoFechado tamanho={20} cor={Cores.texto2} /> : <IconeOlho tamanho={20} cor={Cores.texto2} />}
          </Pressable>
        ) : null}
      </View>
      {erro ? (
        <Texto variante="legenda" cor="perigo" style={styles.mensagem} accessibilityRole="alert" accessibilityLiveRegion="polite">
          {erro}
        </Texto>
      ) : ajuda ? (
        <Texto variante="legenda" cor="texto3" style={styles.mensagem}>
          {ajuda}
        </Texto>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Espacamento.padrao },
  rotulo: { marginBottom: Espacamento.minimo + 2 },
  caixa: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Cores.superficie1,
    borderTopLeftRadius: Raios.pequeno,
    borderTopRightRadius: Raios.pequeno,
    borderBottomWidth: 1,
    marginBottom: 1, // compensa o 2px do foco/erro sem pular o layout
  },
  caixaRealce: { borderBottomWidth: 2, marginBottom: 0 },
  campo: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: Espacamento.medio,
    paddingVertical: Espacamento.medio,
    fontSize: TamanhoFonte.md,
    color: Cores.texto,
  },
  campoMultilinha: { minHeight: 96, textAlignVertical: 'top' },
  olho: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: Espacamento.minimo },
  mensagem: { marginTop: Espacamento.minimo },
});
