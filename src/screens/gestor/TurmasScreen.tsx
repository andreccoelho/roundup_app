// RF10: lista as turmas do responsável e permite criar uma nova — com grade recorrente (dias da
// semana + horário) e professor vinculado, quando o responsável é uma academia.
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Cores, Espacamento, TamanhoFonte } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { criarTurma, listarTurmasPorResponsavel } from '../../services/turmas';
import { criarSessao } from '../../services/sessoes';
import { listarVinculosAceitosDaAcademia } from '../../services/vinculos';
import { buscarUsuario } from '../../services/usuarios';
import { NivelTurma, Turma } from '../../types';
import { combinarDataHora, gerarDatasRecorrentes } from '../../utils/datas';
import { DIAS_SEMANA } from '../../constants/diasSemana';
import { GestorStackParamList } from '../../navigation/types';
import CampoTexto from '../../components/ui/CampoTexto';
import Etiqueta from '../../components/ui/Etiqueta';
import Botao from '../../components/ui/Botao';
import Cartao from '../../components/ui/Cartao';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoVazio from '../../components/ui/EstadoVazio';
import EstadoErro from '../../components/ui/EstadoErro';

const NIVEIS: NivelTurma[] = ['iniciante', 'intermediario', 'avancado'];
const SEMANAS_GRADE_INICIAL = 4;

interface ProfessorVinculado {
  id: string;
  nome: string;
}

export default function TurmasScreen() {
  const { usuario } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<GestorStackParamList, 'Turmas'>>();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [turmas, setTurmas] = useState<Turma[]>([]);

  const [nome, setNome] = useState('');
  const [modalidade, setModalidade] = useState('');
  const [nivel, setNivel] = useState<NivelTurma>('iniciante');
  const [diasSemana, setDiasSemana] = useState<number[]>([]);
  const [horarioInicio, setHorarioInicio] = useState('');
  const [horarioFim, setHorarioFim] = useState('');
  const [professorId, setProfessorId] = useState<string | null>(null);
  const [professores, setProfessores] = useState<ProfessorVinculado[]>([]);
  const [criando, setCriando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  function alternarDiaSemana(valor: number) {
    setDiasSemana((atual) => (atual.includes(valor) ? atual.filter((d) => d !== valor) : [...atual, valor]));
  }

  const carregarTurmas = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      setTurmas(await listarTurmasPorResponsavel(usuario.id));
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  useEffect(() => {
    carregarTurmas();
  }, [carregarTurmas]);

  // RF10: só a academia atribui professor a uma turma — o professor autônomo é o próprio
  // professor da turma, sem precisar escolher ninguém (professorId fica de fora nesse caso).
  useEffect(() => {
    if (!usuario || usuario.perfil !== 'academia') return;
    listarVinculosAceitosDaAcademia(usuario.id, 'professor')
      .then((vinculos) =>
        Promise.all(
          vinculos.map(async (vinculo) => {
            const professor = await buscarUsuario(vinculo.solicitanteId);
            return { id: vinculo.solicitanteId, nome: professor?.nome ?? 'Professor' };
          }),
        ),
      )
      .then(setProfessores)
      .catch(() => setProfessores([]));
  }, [usuario]);

  async function handleCriar() {
    if (!usuario || !nome.trim() || !modalidade.trim()) return;
    setErroForm(null);

    // Grade recorrente é opcional: uma turma pode nascer sem dia/horário e ganhar sessões
    // avulsas depois, na tela de detalhe. Mas se algum dos três campos foi preenchido, os três
    // juntos precisam fazer sentido antes de criar qualquer coisa.
    const grade = diasSemana.length > 0 || horarioInicio.trim() || horarioFim.trim();
    let datasSessoes: { inicio: Date; fim: Date }[] = [];
    if (grade) {
      if (diasSemana.length === 0) {
        setErroForm('Selecione ao menos um dia da semana para a grade recorrente.');
        return;
      }
      const hoje = new Date();
      const fimJanela = new Date(hoje);
      fimJanela.setDate(fimJanela.getDate() + SEMANAS_GRADE_INICIAL * 7);
      const dias = gerarDatasRecorrentes(hoje, fimJanela, diasSemana);
      const combinadas = dias.map((dia) => ({
        inicio: combinarDataHora(dia, horarioInicio),
        fim: combinarDataHora(dia, horarioFim),
      }));
      if (combinadas.some(({ inicio, fim }) => !inicio || !fim)) {
        setErroForm('Preencha os horários de início e fim no formato HH:MM.');
        return;
      }
      if (combinadas.some(({ inicio, fim }) => fim!.getTime() <= inicio!.getTime())) {
        setErroForm('O horário de término deve ser depois do horário de início.');
        return;
      }
      // já validadas acima — nenhuma é null aqui
      datasSessoes = combinadas as { inicio: Date; fim: Date }[];
    }

    setCriando(true);
    try {
      const novaTurma = await criarTurma({
        nome: nome.trim(),
        modalidade: modalidade.trim(),
        nivel,
        autorId: usuario.id,
        autorPerfil: usuario.perfil,
        ...(professorId ? { professorId } : {}),
        ...(grade ? { diasSemana, horarioInicio: horarioInicio.trim(), horarioFim: horarioFim.trim() } : {}),
      });

      for (const { inicio, fim } of datasSessoes) {
        await criarSessao({ turmaId: novaTurma.id, inicio, fim, autorId: usuario.id });
      }

      setNome('');
      setModalidade('');
      setNivel('iniciante');
      setDiasSemana([]);
      setHorarioInicio('');
      setHorarioFim('');
      setProfessorId(null);
      await carregarTurmas();
    } catch (e: any) {
      setErroForm(e.message);
    } finally {
      setCriando(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <Text style={styles.secaoTitulo}>Nova turma</Text>
      <CampoTexto rotulo="Nome da turma" placeholder="Ex.: Muay Thai — Turma A" valor={nome} onAlterar={setNome} />
      <CampoTexto rotulo="Modalidade" placeholder="Ex.: Muay Thai" valor={modalidade} onAlterar={setModalidade} />

      <Text style={styles.rotuloCampo}>Nível</Text>
      <View style={styles.linhaNiveis}>
        {NIVEIS.map((opcao) => (
          <Etiqueta key={opcao} texto={opcao} selecionada={nivel === opcao} onPress={() => setNivel(opcao)} />
        ))}
      </View>

      {usuario?.perfil === 'academia' ? (
        <>
          <Text style={styles.rotuloCampo}>Professor</Text>
          {professores.length === 0 ? (
            <Text style={styles.vazio}>Nenhum professor vinculado ainda — a turma pode ser criada sem professor por enquanto.</Text>
          ) : (
            <View style={styles.linhaNiveis}>
              {professores.map((professor) => (
                <Etiqueta
                  key={professor.id}
                  texto={professor.nome}
                  selecionada={professorId === professor.id}
                  onPress={() => setProfessorId((atual) => (atual === professor.id ? null : professor.id))}
                />
              ))}
            </View>
          )}
        </>
      ) : null}

      <Text style={styles.rotuloCampo}>Grade recorrente (opcional)</Text>
      <View style={styles.linhaNiveis}>
        {DIAS_SEMANA.map(({ valor, rotulo }) => (
          <Etiqueta key={valor} texto={rotulo} selecionada={diasSemana.includes(valor)} onPress={() => alternarDiaSemana(valor)} />
        ))}
      </View>
      <View style={styles.linhaHorarios}>
        <View style={styles.campoHorario}>
          <CampoTexto rotulo="Início" placeholder="HH:MM" valor={horarioInicio} onAlterar={setHorarioInicio} />
        </View>
        <View style={styles.campoHorario}>
          <CampoTexto rotulo="Fim" placeholder="HH:MM" valor={horarioFim} onAlterar={setHorarioFim} />
        </View>
      </View>
      {diasSemana.length > 0 ? (
        <Text style={styles.notaGrade}>
          Cria sessões toda semana nesses dias pelas próximas {SEMANAS_GRADE_INICIAL} semanas — dá pra gerar mais depois, na tela da turma.
        </Text>
      ) : null}

      {erroForm ? (
        <Text style={styles.erroForm} accessibilityRole="alert">
          {erroForm}
        </Text>
      ) : null}

      <View style={styles.espaco} />
      <Botao titulo="Criar turma" onPress={handleCriar} carregando={criando} desabilitado={!nome.trim() || !modalidade.trim()} />

      <Text style={[styles.secaoTitulo, styles.secaoListaTitulo]}>Minhas turmas</Text>
      {carregando ? (
        <Esqueleto altura={64} repeticoes={3} />
      ) : erro ? (
        <EstadoErro mensagem={erro} onTentarNovamente={carregarTurmas} />
      ) : turmas.length === 0 ? (
        <EstadoVazio titulo="Nenhuma turma criada ainda" descricao="Crie sua primeira turma no formulário acima." />
      ) : (
        turmas.map((turma) => (
          <TouchableOpacity
            key={turma.id}
            onPress={() => navigation.navigate('TurmaDetalhe', { turmaId: turma.id })}
            accessibilityRole="button"
            accessibilityLabel={`${turma.nome}, ${turma.modalidade}, ${turma.nivel}, ${turma.ativa ? 'ativa' : 'inativa'}`}
          >
            <Cartao style={styles.item}>
              <Text style={styles.itemNome}>{turma.nome}</Text>
              <Text style={styles.itemDetalhe}>
                {turma.modalidade} · {turma.nivel} · {turma.ativa ? 'ativa' : 'inativa'}
              </Text>
            </Cartao>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.branco },
  conteudo: { padding: Espacamento.padrao, paddingBottom: Espacamento.enorme },
  secaoTitulo: { fontSize: TamanhoFonte.lg, fontWeight: '700', color: Cores.preto, marginBottom: Espacamento.pequeno },
  secaoListaTitulo: { marginTop: Espacamento.grande },
  rotuloCampo: { fontSize: TamanhoFonte.sm, color: Cores.cinzaMedio, marginBottom: Espacamento.pequeno },
  linhaNiveis: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacamento.pequeno, marginBottom: Espacamento.padrao },
  linhaHorarios: { flexDirection: 'row', gap: Espacamento.padrao },
  campoHorario: { flex: 1 },
  notaGrade: { fontSize: TamanhoFonte.xs, color: Cores.cinzaMedio, marginTop: -Espacamento.pequeno, marginBottom: Espacamento.padrao },
  vazio: { color: Cores.cinzaMedio, fontSize: TamanhoFonte.sm, marginBottom: Espacamento.padrao },
  erroForm: { color: Cores.alerta, fontSize: TamanhoFonte.sm, marginBottom: Espacamento.medio },
  espaco: { height: Espacamento.minimo },
  item: { marginBottom: Espacamento.pequeno },
  itemNome: { fontSize: TamanhoFonte.md, fontWeight: '700', color: Cores.preto },
  itemDetalhe: { fontSize: TamanhoFonte.xs, color: Cores.cinzaMedio, marginTop: Espacamento.minimo },
});
