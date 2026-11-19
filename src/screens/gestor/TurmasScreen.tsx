// RF10: lista as turmas do responsável e permite criar uma nova — com grade recorrente (dias da
// semana + horário) e professor vinculado, quando o responsável é uma academia.
import { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { criarEstilos, Espacamento, useTema } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { criarTurma, listarTurmasDoProfessor, listarTurmasPorResponsavel } from '../../services/turmas';
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
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';
import Folha from '../../components/ui/Folha';
import Aviso from '../../components/ui/Aviso';
import MensagemErro from '../../components/ui/MensagemErro';
import GrupoLista from '../../components/ui/GrupoLista';
import { IconeChevron, IconeMais, IconeTatame } from '../../components/icones';
import { rotuloNivel } from '../../utils/apresentacao';
import { mensagemErro } from '../../utils/mensagensErro';
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
  const styles = useEstilos();
  const { cores } = useTema();
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
  const [folhaAberta, setFolhaAberta] = useState(false);
  const [sucesso, setSucesso] = useState<string | null>(null);

  function alternarDiaSemana(valor: number) {
    setDiasSemana((atual) => (atual.includes(valor) ? atual.filter((d) => d !== valor) : [...atual, valor]));
  }

  const carregarTurmas = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      // RF10: o professor vê as turmas que criou como autônomo E as que uma academia atribuiu a ele
      // (o painel Hoje já fazia isso); a academia vê as dela.
      setTurmas(usuario.perfil === 'professor'
        ? await listarTurmasDoProfessor(usuario.id)
        : await listarTurmasPorResponsavel(usuario.id));
    } catch (e) {
      setErro(mensagemErro(e, 'Não foi possível carregar suas turmas agora.'));
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
    if (!usuario || criando || !nome.trim() || !modalidade.trim()) return;
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
      setFolhaAberta(false);
      setSucesso(datasSessoes.length > 0 ? `Turma criada com ${datasSessoes.length} sessões.` : 'Turma criada.');
      await carregarTurmas();
    } catch (e) {
      setErroForm(mensagemErro(e, 'Não foi possível criar a turma. Tente novamente.'));
    } finally {
      setCriando(false);
    }
  }

  const ativas = turmas.filter((t) => t.ativa).length;

  return (
    <Tela
      largura="lista"
      agrupada
      tituloGrande="Turmas"
      sobreposicao={<Aviso visivel={sucesso !== null} tipo="sucesso" mensagem={sucesso ?? ''} onFechar={() => setSucesso(null)} acimaDaTabBar />}
    >
      <Botao titulo="Nova turma" icone={IconeMais} variante="secundario" onPress={() => setFolhaAberta(true)} />

      {carregando ? (
        <View style={styles.topo}>
          <Esqueleto forma="linha" repeticoes={4} />
        </View>
      ) : erro ? (
        <EstadoErro mensagem={erro} onTentarNovamente={carregarTurmas} />
      ) : turmas.length === 0 ? (
        <EstadoVazio icone={IconeTatame} titulo="Nenhuma turma ainda" descricao="Toque em Nova turma para criar a primeira. Turmas que uma academia atribuir a você também aparecem aqui." />
      ) : (
        <>
          <GrupoLista titulo={`Minhas turmas: ${ativas} de ${turmas.length} ativas`}>
          {turmas.map((turma) => (
            <View key={turma.id}>
              <Pressable
                onPress={() => navigation.navigate('TurmaDetalhe', { turmaId: turma.id })}
                accessibilityRole="button"
                accessibilityLabel={`${turma.nome}, ${turma.modalidade}, ${rotuloNivel(turma.nivel)}, ${turma.ativa ? 'ativa' : 'inativa'}`}
                style={({ pressed }) => [styles.linha, pressed && styles.pressionada]}
              >
                <View style={styles.textos}>
                  <Texto variante="body">{turma.nome}</Texto>
                  <View style={styles.meta}>
                    <Etiqueta texto={turma.modalidade} />
                    <Etiqueta texto={rotuloNivel(turma.nivel)} />
                    {turma.responsavelId !== usuario?.id ? <Etiqueta texto="Atribuída pela academia" /> : null}
                    {!turma.ativa ? (
                      <Texto variante="footnote">
                        Inativa
                      </Texto>
                    ) : null}
                  </View>
                  {turma.diasSemana && turma.diasSemana.length > 0 ? (
                    <Texto variante="footnote">
                      {DIAS_SEMANA.filter((d) => turma.diasSemana!.includes(d.valor))
                        .map((d) => d.rotulo)
                        .join(', ')}
                      {turma.horarioInicio && turma.horarioFim ? `, ${turma.horarioInicio} às ${turma.horarioFim}` : ''}
                    </Texto>
                  ) : null}
                </View>
                <IconeChevron tamanho={18} cor={cores.texto3} />
              </Pressable>
            </View>
          ))}
          </GrupoLista>
        </>
      )}

      <Folha
        visivel={folhaAberta}
        onFechar={() => setFolhaAberta(false)}
        titulo="Nova turma"
        acao={{ titulo: 'Criar', onPress: handleCriar, carregando: criando, desabilitado: !nome.trim() || !modalidade.trim() }}
      >
        <MensagemErro mensagem={erroForm} />
        <CampoTexto rotulo="Nome da turma" placeholder="Ex.: Muay Thai — Turma A" valor={nome} onAlterar={setNome} />
        <CampoTexto rotulo="Modalidade" placeholder="Ex.: Muay Thai" valor={modalidade} onAlterar={setModalidade} />

        <Texto variante="subheadline" style={styles.rotuloCampo}>
          Nível
        </Texto>
        <View style={styles.linhaChips} accessibilityRole="radiogroup" accessibilityLabel="Nível">
          {NIVEIS.map((opcao) => (
            <Etiqueta key={opcao} texto={rotuloNivel(opcao)} selecionada={nivel === opcao} onPress={() => setNivel(opcao)} />
          ))}
        </View>

        {usuario?.perfil === 'academia' ? (
          <>
            <Texto variante="subheadline" style={styles.rotuloCampo}>
              Professor
            </Texto>
            {professores.length === 0 ? (
              <Texto variante="subheadline" cor="texto3" style={styles.ajuda}>
                Nenhum professor vinculado ainda. A turma pode ser criada sem professor por enquanto.
              </Texto>
            ) : (
              <View style={styles.linhaChips} accessibilityRole="radiogroup" accessibilityLabel="Professor">
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

        <Texto variante="subheadline" style={styles.rotuloCampo}>
          Grade recorrente (opcional)
        </Texto>
        <View style={styles.linhaChips}>
          {DIAS_SEMANA.map(({ valor, rotulo }) => (
            <Etiqueta key={valor} texto={rotulo} modo="multiplo" selecionada={diasSemana.includes(valor)} onPress={() => alternarDiaSemana(valor)} />
          ))}
        </View>
        <View style={styles.linhaHorarios}>
          <View style={styles.campoHorario}>
            <CampoTexto rotulo="Início" mascara="hora" valor={horarioInicio} onAlterar={setHorarioInicio} />
          </View>
          <View style={styles.campoHorario}>
            <CampoTexto rotulo="Fim" mascara="hora" valor={horarioFim} onAlterar={setHorarioFim} />
          </View>
        </View>
        {diasSemana.length > 0 ? (
          <Texto variante="subheadline" cor="texto3" style={styles.ajuda}>
            {`Cria sessões nesses dias pelas próximas ${SEMANAS_GRADE_INICIAL} semanas. Dá pra gerar mais depois, na tela da turma.`}
          </Texto>
        ) : null}

        {!nome.trim() || !modalidade.trim() ? (
          <Texto variante="footnote" alinhamento="center" style={styles.ajudaBotao}>
            Preencha nome e modalidade para criar.
          </Texto>
        ) : null}
      </Folha>
    </Tela>
  );
}

const useEstilos = criarEstilos((c) => ({
  topo: { marginTop: Espacamento.grande },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.medio, minHeight: 64, paddingVertical: Espacamento.medio - 2, paddingHorizontal: Espacamento.padrao },
  pressionada: { backgroundColor: c.preenchimento },
  textos: { flex: 1, gap: Espacamento.minimo + 2 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Espacamento.minimo + 2 },
  rotuloCampo: { marginBottom: Espacamento.pequeno },
  linhaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacamento.pequeno, marginBottom: Espacamento.padrao },
  linhaHorarios: { flexDirection: 'row', gap: Espacamento.padrao },
  campoHorario: { flex: 1 },
  ajuda: { marginTop: -Espacamento.pequeno, marginBottom: Espacamento.padrao },
  ajudaBotao: { marginTop: Espacamento.pequeno },
}));
