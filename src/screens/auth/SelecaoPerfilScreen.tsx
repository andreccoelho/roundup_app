// RF01: escolha do perfil decide qual formulário de cadastro é aberto em seguida.
// Toque na linha já navega — sem botão "Continuar" extra, um toque a menos no fluxo.
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/typography';
import { AuthStackParamList } from '../../navigation/AuthStack';
import LinhaFina from '../../components/LinhaFina';
import Botao from '../../components/ui/Botao';
import { IconeFaixa, IconeLuva, IconePoste } from '../../components/icones';

type Navegacao = NativeStackNavigationProp<AuthStackParamList, 'SelecaoPerfil'>;

const semAnelDeFoco = { outlineWidth: 0 } as const;

const OPCOES: Array<{
  destino: 'CadastroAcademia' | 'CadastroProfessor' | 'CadastroAluno';
  titulo: string;
  descricao: string;
  Icone: typeof IconeFaixa;
}> = [
  {
    destino: 'CadastroAcademia',
    titulo: 'Academia',
    descricao: 'Sou dono ou gestor de uma academia. Vinculo professores e alunos, acompanho as métricas da unidade.',
    Icone: IconePoste,
  },
  {
    destino: 'CadastroProfessor',
    titulo: 'Professor',
    descricao: 'Dou aula, de forma autônoma ou vinculado a uma academia. Controlo presença e graduação dos alunos.',
    Icone: IconeLuva,
  },
  {
    destino: 'CadastroAluno',
    titulo: 'Aluno',
    descricao: 'Treino e quero acompanhar meu progresso: check-in, missões, XP, ranking e faixas.',
    Icone: IconeFaixa,
  },
];

export default function SelecaoPerfilScreen() {
  const navigation = useNavigation<Navegacao>();

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Botao titulo="‹ Voltar" variante="texto" onPress={() => navigation.goBack()} />

      <Text style={styles.titulo}>Como você vai usar o RoundUp?</Text>
      <Text style={styles.subtitulo}>Isso define suas telas e permissões.</Text>

      <View style={styles.lista}>
        <LinhaFina />
        {OPCOES.map(({ destino, titulo, descricao, Icone }) => (
          <View key={destino}>
            <TouchableOpacity style={[styles.linha, semAnelDeFoco]} onPress={() => navigation.navigate(destino)}>
              <Icone tamanho={28} cor={Colors.preto} />
              <View style={styles.linhaTextos}>
                <Text style={styles.linhaTitulo}>{titulo}</Text>
                <Text style={styles.linhaDescricao}>{descricao}</Text>
              </View>
            </TouchableOpacity>
            <LinhaFina />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32, backgroundColor: Colors.branco },
  titulo: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.preto, marginTop: 16 },
  subtitulo: { fontSize: FontSize.sm, color: Colors.cinzaMedio, marginTop: 8, marginBottom: 28 },
  lista: { flexGrow: 0 },
  linha: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 20, gap: 16 },
  linhaTextos: { flex: 1 },
  linhaTitulo: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.preto, marginBottom: 4 },
  linhaDescricao: { fontSize: FontSize.sm, color: Colors.cinzaMedio, lineHeight: 20 },
});
