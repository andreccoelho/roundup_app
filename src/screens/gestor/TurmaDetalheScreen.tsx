// RF10, RF11, RF12: detalhe da turma — alunos matriculados, sessões e criação de sessão
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Cores, Espacamento, TamanhoFonte } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { buscarTurma } from '../../services/turmas';
import { listarMatriculasPorTurma } from '../../services/matriculas';
import { listarSessoesPorTurma, criarSessao } from '../../services/sessoes';
import { buscarUsuario } from '../../services/usuarios';
import { Matricula, Sessao, Turma } from '../../types';
import { combinarDataHora, formatarDataHora, gerarDatasRecorrentes, parseDataBr, semanaContendo } from '../../utils/datas';
import { GestorStackParamList } from '../../navigation/types';
import { DIAS_SEMANA } from '../../constants/diasSemana';
import CampoTexto from '../../components/ui/CampoTexto';
import Etiqueta from '../../components/ui/Etiqueta';
import Botao from '../../components/ui/Botao';
import Cartao from '../../components/ui/Cartao';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoVazio from '../../components/ui/EstadoVazio';
import EstadoErro from '../../components/ui/EstadoErro';

type TurmaDetalheRoute = RouteProp<GestorStackParamList, 'TurmaDetalhe'>;

interface MatriculaComNome {
  matricula: Matricula;
  nomeAluno: string;
}

export default function TurmaDetalheScreen() {
  const { usuario } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<GestorStackParamList, 'TurmaDetalhe'>>();
  const route = useRoute<TurmaDetalheRoute>();
  const { turmaId } = route.params;

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [turma, setTurma] = useState<Turma | null>(null);
  const [matriculas, setMatriculas] = useState<MatriculaComNome[]>([]);
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [nomeProfessor, setNomeProfessor] = useState<string | null>(null);

  const [data, setData] = useState('');
  const [diasSemana, setDiasSemana] = useState<number[]>([]);
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFim, setHoraFim] = useState('');
  const [descricao, setDescricao] = useState('');
  const [criando, setCriando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  function alternarDiaSemana(valor: number) {
    setDiasSemana((atual) => (atual.includes(valor) ? atual.filter((d) => d !== valor) : [...atual, valor]));
  }

  const carregarTudo = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      const [turmaEncontrada, listaMatriculas, listaSessoes] = await Promise.all([
        buscarTurma(turmaId),
        listarMatriculasPorTurma(turmaId, usuario.id),
        listarSessoesPorTurma(turmaId, usuario.id),
      ]);
      setTurma(turmaEncontrada);
      setSessoes(listaSessoes.sort((a, b) => b.inicio.toMillis() - a.inicio.toMillis()));
      setNomeProfessor(
        turmaEncontrada?.professorId ? (await buscarUsuario(turmaEncontrada.professorId))?.nome ?? 'Professor' : null,
      );

      const comNome = await Promise.all(
        listaMatriculas
          .filter((m) => m.status === 'ativa')
          .map(async (matricula) => {
            const aluno = await buscarUsuario(matricula.alunoId);
            return { matricula, nomeAluno: aluno?.nome ?? 'Aluno' };
          }),
      );
      setMatriculas(comNome);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [usuario, turmaId]);

  useEffect(() => {
    carregarTudo();
  }, [carregarTudo]);

  // RF12: gera uma sessão por dia da semana selecionado, dentro da semana (segunda a domingo)
  // que contém a data informada — "grade semanal" da RF12, não apenas uma sessão avulsa, sem
  // exigir uma data final separada.
  async function handleCriarSessao() {
    if (!usuario) return;
    setErroForm(null);

    const referencia = parseDataBr(data);
    if (!referencia) {
      setErroForm('Preencha a data no formato DD/MM/AAAA.');
      return;
    }
    if (diasSemana.length === 0) {
      setErroForm('Selecione ao menos um dia da semana.');
      return;
    }

    // toda semana (segunda a domingo) contém exatamente um dia para cada valor de getDay(),
    // então `datas` sempre tem uma entrada por dia selecionado — no máximo 7.
    const { inicio, fim } = semanaContendo(referencia);
    const datas = gerarDatasRecorrentes(inicio, fim, diasSemana);

    const inicios = datas.map((dia) => combinarDataHora(dia, horaInicio));
    const fins = datas.map((dia) => combinarDataHora(dia, horaFim));
    if (inicios.some((d) => !d) || fins.some((d) => !d)) {
      setErroForm('Preencha os horários de início e fim no formato HH:MM.');
      return;
    }
    if (inicios.some((ini, i) => fins[i]!.getTime() <= ini!.getTime())) {
      setErroForm('O horário de término deve ser depois do horário de início.');
      return;
    }

    setCriando(true);
    try {
      for (let i = 0; i < datas.length; i++) {
        await criarSessao({
          turmaId,
          inicio: inicios[i]!,
          fim: fins[i]!,
          descricao: descricao.trim() || undefined,
          autorId: usuario.id,
        });
      }
      setData('');
      setDiasSemana([]);
      setHoraInicio('');
      setHoraFim('');
      setDescricao('');
      await carregarTudo();
    } catch (e: any) {
      setErroForm(e.message);
    } finally {
      setCriando(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.container}>
        <Esqueleto altura={72} repeticoes={3} />
      </View>
    );
  }

  if (erro) {
    return <EstadoErro mensagem={erro} onTentarNovamente={carregarTudo} />;
  }

  if (!turma) {
    return (
      <View style={styles.container}>
        <EstadoVazio titulo="Turma não encontrada" descricao="Ela pode ter sido removida ou você não tem mais acesso a ela." />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <Text style={styles.titulo}>{turma.nome}</Text>
      <Text style={styles.subtitulo}>
        {turma.modalidade} · {turma.nivel} · {turma.ativa ? 'ativa' : 'inativa'}
      </Text>
      {nomeProfessor ? <Text style={styles.subtitulo}>Professor: {nomeProfessor}</Text> : null}
      {turma.diasSemana && turma.diasSemana.length > 0 ? (
        <Text style={styles.subtitulo}>
          Grade:{' '}
          {DIAS_SEMANA.filter((item) => turma.diasSemana!.includes(item.valor))
            .map((item) => item.rotulo)
            .join(', ')}
          {turma.horarioInicio && turma.horarioFim ? ` às ${turma.horarioInicio}–${turma.horarioFim}` : ''}
        </Text>
      ) : null}

      <TouchableOpacity
        style={styles.linkRelatorioToque}
        onPress={() => navigation.navigate('RelatorioFrequencia', { turmaId })}
        accessibilityRole="button"
        accessibilityLabel="Relatório de frequência"
      >
        <Text style={styles.linkRelatorio}>Relatório de frequência</Text>
      </TouchableOpacity>

      <Text style={styles.secaoTitulo}>Alunos matriculados</Text>
      {matriculas.length === 0 ? (
        <Text style={styles.vazio}>Nenhum aluno matriculado ainda.</Text>
      ) : (
        matriculas.map(({ matricula, nomeAluno }) => (
          <Cartao key={matricula.id} style={styles.itemSimples}>
            <Text style={styles.itemNome}>{nomeAluno}</Text>
          </Cartao>
        ))
      )}

      <Text style={styles.secaoTitulo}>Nova sessão</Text>
      <Text style={styles.rotuloCampo}>Dias da semana</Text>
      <View style={styles.linhaNiveis}>
        {DIAS_SEMANA.map(({ valor, rotulo }) => (
          <Etiqueta key={valor} texto={rotulo} selecionada={diasSemana.includes(valor)} onPress={() => alternarDiaSemana(valor)} />
        ))}
      </View>
      <CampoTexto rotulo="Data" placeholder="DD/MM/AAAA" valor={data} onAlterar={setData} />
      <CampoTexto rotulo="Início" placeholder="HH:MM" valor={horaInicio} onAlterar={setHoraInicio} />
      <CampoTexto rotulo="Fim" placeholder="HH:MM" valor={horaFim} onAlterar={setHoraFim} />
      <CampoTexto rotulo="Descrição (opcional)" placeholder="Ex.: Foco em defesa pessoal" valor={descricao} onAlterar={setDescricao} />

      {erroForm ? (
        <Text style={styles.erroForm} accessibilityRole="alert">
          {erroForm}
        </Text>
      ) : null}

      <View style={styles.espaco} />
      <Botao titulo="Criar sessão" onPress={handleCriarSessao} carregando={criando} />

      <Text style={styles.secaoTitulo}>Sessões</Text>
      {sessoes.length === 0 ? (
        <Text style={styles.vazio}>Nenhuma sessão criada ainda.</Text>
      ) : (
        sessoes.map((sessao) => (
          <TouchableOpacity
            key={sessao.id}
            onPress={() => navigation.navigate('SessaoDetalhe', { sessaoId: sessao.id })}
            accessibilityRole="button"
            accessibilityLabel={`Sessão de ${formatarDataHora(sessao.inicio)}, status ${sessao.status}`}
          >
            <Cartao style={styles.item}>
              <Text style={styles.itemNome}>{formatarDataHora(sessao.inicio)}</Text>
              <Text style={styles.itemDetalhe}>status: {sessao.status}</Text>
            </Cartao>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.branco, padding: Espacamento.padrao },
  conteudo: { paddingBottom: Espacamento.enorme },
  titulo: { fontSize: TamanhoFonte.xxl, fontWeight: '700', color: Cores.preto },
  subtitulo: { fontSize: TamanhoFonte.sm, color: Cores.cinzaMedio, marginTop: Espacamento.minimo },
  linkRelatorioToque: { marginTop: Espacamento.medio, minHeight: 44, justifyContent: 'center' },
  linkRelatorio: { fontSize: TamanhoFonte.sm, color: Cores.cinzaMedio, textDecorationLine: 'underline' },
  secaoTitulo: { fontSize: TamanhoFonte.lg, fontWeight: '700', color: Cores.preto, marginTop: Espacamento.grande, marginBottom: Espacamento.pequeno },
  rotuloCampo: { fontSize: TamanhoFonte.sm, color: Cores.cinzaMedio, marginBottom: Espacamento.minimo },
  linhaNiveis: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacamento.pequeno, marginBottom: Espacamento.padrao },
  erroForm: { color: Cores.alerta, fontSize: TamanhoFonte.sm, marginTop: Espacamento.pequeno },
  espaco: { height: Espacamento.minimo },
  vazio: { color: Cores.cinzaMedio, fontSize: TamanhoFonte.sm },
  item: { marginBottom: Espacamento.pequeno },
  itemSimples: { marginBottom: Espacamento.pequeno },
  itemNome: { fontSize: TamanhoFonte.md, fontWeight: '700', color: Cores.preto },
  itemDetalhe: { fontSize: TamanhoFonte.xs, color: Cores.cinzaMedio, marginTop: Espacamento.minimo },
});
