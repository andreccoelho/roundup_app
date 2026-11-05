// RF20, RN04, RN09, RNF11: classificação mensal do escopo do aluno. Com mais de um vínculo ativo
// (RN05), um seletor de escopo (Abas) escolhe a academia ou o professor — antes a tela mostrava só
// o primeiro vínculo (docs/DECISOES_PENDENTES.md, item 7). A consulta só devolve quem tem o aluno
// em `leitoresIds`, então alunos que não participam (RNF11) não aparecem para os outros.
// Busca de dados aqui; apresentação em ClassificacaoVisao.tsx (a mesma da Galeria).
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Espacamento } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import type { AlunoTabParamList } from '../../navigation/AlunoTabs';
import { listarResponsaveisAtivosDoAluno } from '../../services/vinculos';
import { listarClassificacao } from '../../services/classificacoes';
import { buscarUsuario } from '../../services/usuarios';
import { mensagemErro } from '../../utils/mensagensErro';
import { periodoDe } from '../../utils/datas';
import Tela from '../../components/ui/Tela';
import Abas from '../../components/ui/Abas';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoVazio from '../../components/ui/EstadoVazio';
import EstadoErro from '../../components/ui/EstadoErro';
import { IconeCartaoPontuacao } from '../../components/icones';
import ClassificacaoVisao, { type LinhaRanking } from './ClassificacaoVisao';

interface Escopo {
  responsavelId: string;
  nome: string;
}

export default function ClassificacaoScreen() {
  const { usuario } = useAuth();
  const navigation = useNavigation<BottomTabNavigationProp<AlunoTabParamList>>();
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [escopos, setEscopos] = useState<Escopo[]>([]);
  const [escopoId, setEscopoId] = useState<string | null>(null);
  const [linhas, setLinhas] = useState<LinhaRanking[]>([]);

  const agora = new Date();
  const mes = agora.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  const carregar = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      const responsaveis = await listarResponsaveisAtivosDoAluno(usuario.id);
      const comNome = await Promise.all(
        responsaveis.map(async (id) => {
          const r = await buscarUsuario(id);
          return { responsavelId: id, nome: r?.nomeAcademia ?? r?.nome ?? 'Responsável' };
        }),
      );
      setEscopos(comNome);

      const escolhido = escopoId && responsaveis.includes(escopoId) ? escopoId : responsaveis[0];
      if (!escolhido) {
        setEscopoId(null);
        setLinhas([]);
        return;
      }
      setEscopoId(escolhido);

      const classificacao = await listarClassificacao(escolhido, periodoDe(new Date()), usuario.id);
      const linhasComNome = await Promise.all(
        classificacao.map(async (c) => {
          if (c.alunoId === usuario.id) return { alunoId: c.alunoId, nome: usuario.nome, pontos: c.pontos, fotoUrl: usuario.fotoUrl };
          const aluno = await buscarUsuario(c.alunoId);
          return { alunoId: c.alunoId, nome: aluno?.nome ?? 'Aluno', pontos: c.pontos, fotoUrl: aluno?.fotoUrl };
        }),
      );
      setLinhas(linhasComNome);
    } catch (e) {
      setErro(mensagemErro(e, 'Não foi possível carregar a classificação agora.'));
    } finally {
      setCarregando(false);
    }
  }, [usuario, escopoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const seletor = escopos.length > 1 && escopoId ? (
    <View style={styles.seletor}>
      <Abas
        opcoes={escopos.map((e) => ({ valor: e.responsavelId, rotulo: e.nome }))}
        selecionada={escopoId}
        onSelecionar={setEscopoId}
        accessibilityLabel="Escolher academia ou professor"
      />
    </View>
  ) : null;

  if (carregando) {
    return (
      <Tela largura="lista" agrupada tituloGrande="Classificação">
        {seletor}
        <Esqueleto altura={220} />
        <Esqueleto forma="linha" repeticoes={4} />
      </Tela>
    );
  }

  if (erro) {
    return <EstadoErro mensagem={erro} onTentarNovamente={carregar} />;
  }

  if (linhas.length === 0) {
    return (
      <Tela largura="lista" agrupada tituloGrande="Classificação" centralizarVertical={!seletor}>
        {seletor}
        <EstadoVazio
          icone={IconeCartaoPontuacao}
          titulo="Ainda sem classificação"
          descricao={`Ninguém pontuou em ${mes} ainda. Faça check-in nos seus treinos para começar a pontuar.`}
          acaoTitulo="Ver agenda"
          onAcao={() => navigation.navigate('Agenda')}
        />
      </Tela>
    );
  }

  return (
    <Tela largura="lista" agrupada tituloGrande="Classificação">
      {seletor}
      <ClassificacaoVisao
        linhas={linhas}
        usuarioId={usuario?.id}
        mes={mes}
        participa={usuario?.participaClassificacao !== false}
      />
    </Tela>
  );
}

const styles = StyleSheet.create({
  seletor: { marginBottom: Espacamento.padrao },
});
