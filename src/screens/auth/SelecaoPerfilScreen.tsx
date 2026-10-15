// RF01: escolha do perfil decide qual formulário de cadastro é aberto em seguida.
// Toque na linha já navega — sem botão "Continuar" extra, um toque a menos no fluxo.
// Sem os 4 estados de carregando/vazio/erro: lista estática de 3 opções, não vem de busca de
// dados.
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alturas, Cores, Espacamento } from '../../theme';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { estiloAnelFoco, estiloSemOutline, useFocoVisivel } from '../../hooks/useFocoVisivel';
import LinhaFina from '../../components/LinhaFina';
import Botao from '../../components/ui/Botao';
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';
import { IconeChevron, IconeFaixa, IconeLuva, IconePoste } from '../../components/icones';

type Navegacao = NativeStackNavigationProp<AuthStackParamList, 'SelecaoPerfil'>;
type Destino = 'CadastroAcademia' | 'CadastroProfessor' | 'CadastroAluno';

const OPCOES: Array<{ destino: Destino; titulo: string; descricao: string; Icone: typeof IconeFaixa }> = [
  {
    destino: 'CadastroAluno',
    titulo: 'Aluno',
    descricao: 'Treino e quero acompanhar meu progresso: check-in, missões, XP, ranking e faixas.',
    Icone: IconeFaixa,
  },
  {
    destino: 'CadastroProfessor',
    titulo: 'Professor',
    descricao: 'Dou aula, de forma autônoma ou vinculado a uma academia. Controlo presença e graduação dos alunos.',
    Icone: IconeLuva,
  },
  {
    destino: 'CadastroAcademia',
    titulo: 'Academia',
    descricao: 'Sou dono ou gestor de uma academia. Vinculo professores e alunos, acompanho as métricas da unidade.',
    Icone: IconePoste,
  },
];

function Opcao({ titulo, descricao, Icone, onPress }: { titulo: string; descricao: string; Icone: typeof IconeFaixa; onPress: () => void }) {
  const { focado, propsFoco } = useFocoVisivel();
  return (
    <Pressable
      style={({ pressed }) => [styles.linha, pressed && styles.pressionada, estiloSemOutline, focado && estiloAnelFoco]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${titulo}. ${descricao}`}
      {...propsFoco}
    >
      <View style={styles.icone}>
        <Icone tamanho={32} cor={Cores.texto} />
      </View>
      <View style={styles.textos}>
        <Texto variante="titulo" cabecalho={false}>
          {titulo}
        </Texto>
        <Texto variante="legenda">{descricao}</Texto>
      </View>
      <IconeChevron tamanho={20} cor={Cores.texto3} />
    </Pressable>
  );
}

export default function SelecaoPerfilScreen() {
  const navigation = useNavigation<Navegacao>();

  return (
    <Tela largura="formulario" bordas={['topo', 'base']}>
      <Botao variante="voltar" onPress={() => navigation.goBack()} />

      <Texto variante="display" style={styles.titulo}>
        Quem entra no ringue?
      </Texto>
      <Texto variante="corpo" cor="texto2" style={styles.subtitulo}>
        Escolha como você vai usar o RoundUp. Isso define suas telas e permissões.
      </Texto>

      {OPCOES.map(({ destino, titulo, descricao, Icone }, i) => (
        <View key={destino}>
          {i > 0 ? <LinhaFina /> : null}
          <Opcao titulo={titulo} descricao={descricao} Icone={Icone} onPress={() => navigation.navigate('ConsentimentoLGPD', { destino })} />
        </View>
      ))}
    </Tela>
  );
}

const styles = StyleSheet.create({
  titulo: { marginTop: Espacamento.grande },
  subtitulo: { marginTop: Espacamento.pequeno, marginBottom: Espacamento.grande },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.padrao,
    minHeight: Alturas.botaoHero + 24,
    paddingVertical: Espacamento.padrao,
  },
  pressionada: { backgroundColor: Cores.superficie1 },
  icone: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: Cores.linhaForte, alignItems: 'center', justifyContent: 'center' },
  textos: { flex: 1, gap: 2 },
});
