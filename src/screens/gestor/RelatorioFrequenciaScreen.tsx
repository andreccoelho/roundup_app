// RF26: relatório de frequência por turma e período — período em texto DD/MM/AAAA, mesmo
// padrão de TurmaDetalheScreen.tsx (sem date picker nesta rodada).
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Espacamento } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { relatorioFrequenciaPorTurma, LinhaRelatorioFrequencia } from '../../services/frequencia';
import { parseDataBr } from '../../utils/datas';
import { GestorStackParamList } from '../../navigation/types';
import Botao from '../../components/ui/Botao';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoVazio from '../../components/ui/EstadoVazio';
import CampoTexto from '../../components/ui/CampoTexto';
import GrupoLista from '../../components/ui/GrupoLista';
import MensagemErro from '../../components/ui/MensagemErro';
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';
import { IconeFichaTecnica } from '../../components/icones';
import { mensagemErro } from '../../utils/mensagensErro';

type Rota = RouteProp<GestorStackParamList, 'RelatorioFrequencia'>;

export default function RelatorioFrequenciaScreen() {
  const { usuario } = useAuth();
  const { turmaId } = useRoute<Rota>().params;

  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [gerado, setGerado] = useState(false);
  const [linhas, setLinhas] = useState<LinhaRelatorioFrequencia[]>([]);

  async function handleGerar() {
    if (!usuario) return;
    const inicio = parseDataBr(dataInicio);
    const fim = parseDataBr(dataFim);
    if (!inicio || !fim) {
      setErro('Preencha as duas datas no formato DD/MM/AAAA.');
      return;
    }
    if (fim.getTime() < inicio.getTime()) {
      setErro('A data final deve ser depois da inicial.');
      return;
    }

    setErro(null);
    setCarregando(true);
    try {
      const fimDoDia = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate(), 23, 59, 59);
      const resultado = await relatorioFrequenciaPorTurma(turmaId, usuario.id, inicio, fimDoDia);
      setLinhas(resultado);
      setGerado(true);
    } catch (e: any) {
      setErro(mensagemErro(e, 'Não foi possível gerar o relatório. Tente novamente.'));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Tela largura="lista" agrupada teclado>
      <View style={styles.periodo}>
        <View style={styles.campo}>
          <CampoTexto rotulo="Data inicial" valor={dataInicio} onAlterar={setDataInicio} mascara="data" />
        </View>
        <View style={styles.campo}>
          <CampoTexto rotulo="Data final" valor={dataFim} onAlterar={setDataFim} mascara="data" />
        </View>
      </View>

      <MensagemErro mensagem={erro} />

      <Botao titulo="Gerar relatório" onPress={handleGerar} carregando={carregando} />

      {carregando ? (
        <View style={styles.resultado}>
          <Esqueleto forma="linha" repeticoes={4} />
        </View>
      ) : !gerado ? null : linhas.length === 0 ? (
        <EstadoVazio icone={IconeFichaTecnica} titulo="Nenhum aluno matriculado" descricao="Não há alunos ativos nesta turma para o período." />
      ) : (
        <>
          <GrupoLista titulo={`Presenças no período: ${linhas.length} alunos`}>
          {linhas.map((linha) => (
            <View key={linha.alunoId}>
              <View
                style={styles.linha}
                accessible
                accessibilityLabel={`${linha.nome}: ${linha.presencas} de ${linha.totalSessoes} sessões`}
              >
                <Texto variante="body" style={styles.nome}>
                  {linha.nome}
                </Texto>
                <Texto variante="headline" style={styles.tabular}>
                  {linha.presencas}
                </Texto>
                <Texto variante="subheadline" style={styles.tabular}>
                  {`de ${linha.totalSessoes}`}
                </Texto>
              </View>
            </View>
          ))}
          </GrupoLista>
        </>
      )}
    </Tela>
  );
}

const styles = StyleSheet.create({
  periodo: { flexDirection: 'row', gap: Espacamento.padrao },
  campo: { flex: 1 },
  resultado: { marginTop: Espacamento.grande },
  linha: { flexDirection: 'row', alignItems: 'baseline', gap: Espacamento.minimo + 2, paddingVertical: Espacamento.medio, paddingHorizontal: Espacamento.padrao },
  tabular: { fontVariant: ['tabular-nums'] },
  nome: { flex: 1 },
});
