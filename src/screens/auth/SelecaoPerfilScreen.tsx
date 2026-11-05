// RF01: escolha do perfil decide qual formulário de cadastro é aberto em seguida.
// Toque na linha já navega — sem botão "Continuar" extra, um toque a menos no fluxo. Lista
// agrupada com um ícone em tint por perfil.
// Sem os 4 estados de carregando/vazio/erro: lista estática de 3 opções, não vem de busca de
// dados.
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { criarEstilos, Espacamento } from '../../theme';
import { AuthStackParamList } from '../../navigation/AuthStack';
import Botao from '../../components/ui/Botao';
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';
import GrupoLista from '../../components/ui/GrupoLista';
import LinhaLista from '../../components/ui/LinhaLista';
import { IconeFaixa, IconeLuva, IconePoste } from '../../components/icones';

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

export default function SelecaoPerfilScreen() {
  const navigation = useNavigation<Navegacao>();
  const styles = useEstilos();

  return (
    <Tela largura="formulario" bordas={['topo', 'base']} agrupada>
      <Botao variante="voltar" onPress={() => navigation.goBack()} />

      <Texto variante="largeTitle" style={styles.titulo}>
        Criar conta
      </Texto>
      <Texto variante="body" cor="texto2" style={styles.subtitulo}>
        Escolha como você vai usar o RoundUp. Isso define suas telas e permissões.
      </Texto>

      <GrupoLista semMargem>
        {OPCOES.map(({ destino, titulo, descricao, Icone }) => (
          <LinhaLista
            key={destino}
            rotulo={titulo}
            descricao={descricao}
            icone={Icone}
            onPress={() => navigation.navigate('ConsentimentoLGPD', { destino })}
          />
        ))}
      </GrupoLista>
    </Tela>
  );
}

const useEstilos = criarEstilos(() => ({
  titulo: { marginTop: Espacamento.padrao },
  subtitulo: { marginTop: Espacamento.minimo, marginBottom: Espacamento.grande },
}));
