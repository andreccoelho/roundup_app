// Painel da Academia — RF09. Dado real: turmas ativas (`turmas`), professores e alunos com
// vínculo aceito (`vinculos`, RF07/RF08), e a contagem de turmas de cada professor (cruzando as
// duas coleções já reais). Frequência geral NÃO entra nesta tela ainda — RF26, Ciclo 3, exige
// uma agregação de check-ins por período que ainda não existe.
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Espacamento } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardAcademiaNavigationProp } from '../../navigation/AcademiaTabs';
import { listarTurmasPorResponsavel } from '../../services/turmas';
import { listarVinculosAceitosDaAcademia } from '../../services/vinculos';
import { buscarUsuario } from '../../services/usuarios';
import LinhaFina from '../../components/LinhaFina';
import Avatar from '../../components/ui/Avatar';
import Etiqueta from '../../components/ui/Etiqueta';
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';
import BandaIdentidade from '../../components/ui/BandaIdentidade';
import Estatistica from '../../components/ui/Estatistica';
import CabecalhoSecao from '../../components/ui/CabecalhoSecao';
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
    <Tela largura="lista" preenchimento={false}>
      <BandaIdentidade
        variante="gestor"
        compacta
        sobretitulo="Hoje"
        nome={usuario?.nomeAcademia ?? 'Painel da Academia'}
        fotoUrl={usuario?.fotoUrl}
        detalhes={usuario?.endereco ? [usuario.endereco] : []}
      >
        {modalidades.length > 0 ? (
          <View style={styles.chips}>
            {modalidades.map((m) => (
              <Etiqueta key={m} texto={m} />
            ))}
          </View>
        ) : null}
      </BandaIdentidade>

      <View style={styles.corpo}>
        {carregando ? (
          <>
            <Esqueleto altura={72} />
            <View style={styles.espaco} />
            <Esqueleto forma="linha" repeticoes={3} />
          </>
        ) : erro ? (
          <EstadoErro compacto mensagem={erro} onTentarNovamente={carregar} />
        ) : (
          <>
            <View style={styles.contadores}>
              <Estatistica valor={turmasAtivas} rotulo="Turmas ativas" tamanho="grande" />
              <Estatistica valor={professores.length} rotulo="Professores" tamanho="grande" />
              <Estatistica valor={alunosVinculados} rotulo="Alunos" tamanho="grande" />
            </View>

            <CabecalhoSecao titulo="Professores vinculados" contador={professores.length} />
            {professores.length === 0 ? (
              <Texto variante="subheadline" style={styles.vazio}>
                Nenhum professor vinculado ainda. Os pedidos chegam em Perfil, Gestão de professores.
              </Texto>
            ) : (
              professores.map((professor, i) => (
                <View key={professor.id}>
                  {i > 0 ? <LinhaFina /> : null}
                  <View style={styles.linha} accessible accessibilityLabel={`${professor.nome}, ${professor.quantidadeTurmas} turmas`}>
                    <Avatar nome={professor.nome} tamanho={36} />
                    <Texto variante="headline" style={styles.nome} numberOfLines={1}>
                      {professor.nome}
                    </Texto>
                    <Texto variante="numero">{professor.quantidadeTurmas}</Texto>
                    <Texto variante="caption" cor="texto3">
                      {professor.quantidadeTurmas === 1 ? 'turma' : 'turmas'}
                    </Texto>
                  </View>
                </View>
              ))
            )}

            <CabecalhoSecao titulo="Atalhos" />
            <ItemMenu rotulo="Gerenciar turmas" descricao="Turmas, sessões e relatório de frequência" icone={IconeTatame} onPress={() => navigation.navigate('Turmas')} />
          </>
        )}
      </View>
    </Tela>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacamento.pequeno },
  corpo: { paddingHorizontal: Espacamento.padrao, paddingTop: Espacamento.grande, paddingBottom: Espacamento.enorme },
  espaco: { height: Espacamento.padrao },
  contadores: { flexDirection: 'row', gap: Espacamento.padrao },
  vazio: { paddingVertical: Espacamento.medio },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.medio, minHeight: 56, paddingVertical: Espacamento.pequeno },
  nome: { flex: 1 },
});
