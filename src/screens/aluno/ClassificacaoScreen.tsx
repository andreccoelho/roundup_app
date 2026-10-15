// RF20, RN09: classificação do escopo do aluno (primeiro vínculo ativo — sem seletor de
// escopo ainda, ver docs/DECISOES_PENDENTES.md item 7). RNF11 (adesão opcional) e RN04 (janela
// de tempo) não estão implementadas nesta rodada — ver docs/DECISOES_PENDENTES.md item 4.
// Busca de dados aqui; apresentação em ClassificacaoVisao.tsx (a mesma da Galeria).
import { useCallback, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAuth } from '../../contexts/AuthContext';
import type { AlunoTabParamList } from '../../navigation/AlunoTabs';
import { listarResponsaveisAtivosDoAluno } from '../../services/vinculos';
import { listarClassificacao } from '../../services/classificacoes';
import { buscarUsuario } from '../../services/usuarios';
import { mensagemErro } from '../../utils/mensagensErro';
import Tela from '../../components/ui/Tela';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoVazio from '../../components/ui/EstadoVazio';
import EstadoErro from '../../components/ui/EstadoErro';
import { IconeCartaoPontuacao } from '../../components/icones';
import ClassificacaoVisao, { type LinhaRanking } from './ClassificacaoVisao';

export default function ClassificacaoScreen() {
  const { usuario } = useAuth();
  const navigation = useNavigation<BottomTabNavigationProp<AlunoTabParamList>>();
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [linhas, setLinhas] = useState<LinhaRanking[]>([]);

  const carregar = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      const responsaveis = await listarResponsaveisAtivosDoAluno(usuario.id);
      const responsavelId = responsaveis[0];
      if (!responsavelId) {
        setLinhas([]);
        return;
      }

      const classificacao = await listarClassificacao(responsavelId);
      const comNome = await Promise.all(
        classificacao.map(async (c) => {
          if (c.alunoId === usuario.id) return { alunoId: c.alunoId, nome: usuario.nome, pontos: c.pontos, fotoUrl: usuario.fotoUrl };
          const aluno = await buscarUsuario(c.alunoId);
          return { alunoId: c.alunoId, nome: aluno?.nome ?? 'Aluno', pontos: c.pontos, fotoUrl: aluno?.fotoUrl };
        }),
      );
      setLinhas(comNome);
    } catch (e) {
      setErro(mensagemErro(e, 'Não foi possível carregar a classificação agora.'));
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (carregando) {
    return (
      <Tela largura="lista">
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
      <Tela largura="lista" centralizarVertical>
        <EstadoVazio
          icone={IconeCartaoPontuacao}
          titulo="Ainda sem classificação"
          descricao="Faça check-in nos seus treinos para começar a pontuar."
          acaoTitulo="Ver agenda"
          onAcao={() => navigation.navigate('Agenda')}
        />
      </Tela>
    );
  }

  return (
    <Tela largura="lista">
      <ClassificacaoVisao linhas={linhas} usuarioId={usuario?.id} />
    </Tela>
  );
}
