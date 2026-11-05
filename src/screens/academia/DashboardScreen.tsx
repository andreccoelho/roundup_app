// Painel da Academia — RF09. Dado real: turmas ativas (`turmas`), professores e alunos com
// vínculo aceito (`vinculos`, RF07/RF08), e a contagem de turmas de cada professor (cruzando as
// duas coleções já reais). Frequência geral NÃO entra nesta tela ainda — RF26, Ciclo 3, exige
// uma agregação de check-ins por período que ainda não existe. Visual: nome da academia, contadores
// num cartão de destaque e professores em lista agrupada.
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import GrupoLista from '../../components/ui/GrupoLista';
import Cartao from '../../components/ui/Cartao';
import { useNavigation } from '@react-navigation/native';
import { Espacamento } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardAcademiaNavigationProp } from '../../navigation/AcademiaTabs';
import { listarTurmasPorResponsavel } from '../../services/turmas';
import { listarVinculosAceitosDaAcademia } from '../../services/vinculos';
import { buscarUsuario } from '../../services/usuarios';
import LinhaLista from '../../components/ui/LinhaLista';
import FundoIdentidade from '../../components/ui/FundoIdentidade';
import Avatar from '../../components/ui/Avatar';
import Etiqueta from '../../components/ui/Etiqueta';
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';
import Estatistica from '../../components/ui/Estatistica';
import ItemMenu from '../../components/ui/ItemMenu';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoErro from '../../components/ui/EstadoErro';
import { IconeTatame } from '../../components/icones';
import { mensagemErro } from '../../utils/mensagensErro';

interface ProfessorVinculado {
  id: string;
  nome: string;
  quantidadeTurmas: number;
}

export default function DashboardScreen() {
  const { usuario } = useAuth();
  const navigation = useNavigation<DashboardAcademiaNavigationProp>();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [turmasAtivas, setTurmasAtivas] = useState(0);
  const [alunosVinculados, setAlunosVinculados] = useState(0);
  const [professores, setProfessores] = useState<ProfessorVinculado[]>([]);

  const carregar = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      const [turmas, vinculosProfessores, vinculosAlunos] = await Promise.all([
        listarTurmasPorResponsavel(usuario.id),
        listarVinculosAceitosDaAcademia(usuario.id, 'professor'),
        listarVinculosAceitosDaAcademia(usuario.id, 'aluno'),
      ]);

      setTurmasAtivas(turmas.filter((t) => t.ativa).length);
      setAlunosVinculados(vinculosAlunos.length);

      const listaProfessores = await Promise.all(
        vinculosProfessores.map(async (vinculo) => {
          const professor = await buscarUsuario(vinculo.solicitanteId);
          const quantidadeTurmas = turmas.filter((t) => t.professorId === vinculo.solicitanteId).length;
          return { id: vinculo.solicitanteId, nome: professor?.nome ?? 'Professor', quantidadeTurmas };
        }),
      );
      setProfessores(listaProfessores);
    } catch (e) {
      setErro(mensagemErro(e, 'Não foi possível carregar o painel agora.'));
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const modalidades = usuario?.modalidades ?? [];

  return (
    <Tela largura="lista" agrupada tituloGrande="Hoje">
      <FundoIdentidade compacto variante="gestor" style={styles.saudacaoFundo}>
        <View style={styles.saudacao}>
          <Avatar nome={usuario?.nomeAcademia ?? 'Academia'} fotoUrl={usuario?.fotoUrl} tamanho={44} />
          <View style={styles.saudacaoTextos}>
            <Texto variante="title3" cabecalho={false} numberOfLines={1}>
              {usuario?.nomeAcademia ?? 'Painel da Academia'}
            </Texto>
            {usuario?.endereco ? <Texto variante="footnote">{usuario.endereco}</Texto> : null}
          </View>
        </View>
      </FundoIdentidade>
      {modalidades.length > 0 ? (
        <View style={styles.chips}>
          {modalidades.map((m) => (
            <Etiqueta key={m} texto={m} />
          ))}
        </View>
      ) : null}

      {carregando ? (
        <>
          <Esqueleto altura={96} raio={16} />
          <View style={styles.espaco} />
          <Esqueleto forma="linha" repeticoes={3} />
        </>
      ) : erro ? (
        <Cartao>
          <EstadoErro compacto mensagem={erro} onTentarNovamente={carregar} />
        </Cartao>
      ) : (
        <>
          <Cartao destaque>
            <View style={styles.contadores}>
              <Estatistica valor={turmasAtivas} rotulo="Turmas ativas" tamanho="grande" />
              <Estatistica valor={professores.length} rotulo="Professores" tamanho="grande" />
              <Estatistica valor={alunosVinculados} rotulo="Alunos" tamanho="grande" />
            </View>
          </Cartao>

          <GrupoLista
            titulo={`Professores vinculados: ${professores.length}`}
            rodape={professores.length === 0 ? 'Os pedidos de vínculo chegam em Perfil, Gestão de professores.' : undefined}
          >
            {professores.length === 0 ? (
              <LinhaLista rotulo="Nenhum professor vinculado ainda" />
            ) : (
              professores.map((professor) => (
                <LinhaLista
                  key={professor.id}
                  valor={`${professor.quantidadeTurmas} ${professor.quantidadeTurmas === 1 ? 'turma' : 'turmas'}`}
                  accessibilityLabel={`${professor.nome}, ${professor.quantidadeTurmas} turmas`}
                >
                  <View style={styles.professor}>
                    <Avatar nome={professor.nome} tamanho={32} />
                    <Texto variante="body" style={styles.nome} numberOfLines={1}>
                      {professor.nome}
                    </Texto>
                  </View>
                </LinhaLista>
              ))
            )}
          </GrupoLista>

          <GrupoLista titulo="Atalhos">
            <ItemMenu rotulo="Gerenciar turmas" descricao="Turmas, sessões e relatório de frequência" icone={IconeTatame} onPress={() => navigation.navigate('Turmas')} />
          </GrupoLista>
        </>
      )}
    </Tela>
  );
}

const styles = StyleSheet.create({
  saudacaoFundo: { marginBottom: Espacamento.medio },
  saudacao: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.medio },
  saudacaoTextos: { flex: 1, gap: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacamento.pequeno, marginBottom: Espacamento.padrao },
  espaco: { height: Espacamento.padrao },
  contadores: { flexDirection: 'row', gap: Espacamento.padrao },
  professor: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.medio },
  nome: { flex: 1 },
});
