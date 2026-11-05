// RF07 (lado destinatário): solicitações pendentes de vínculo, para Professor e Academia.
// Antes duas telas quase idênticas (professor/SolicitacoesProfessorScreen.tsx e
// academia/SolicitacoesAcademiaScreen.tsx) — consolidadas aqui.
//
// RF09: a academia pode receber solicitação tanto de aluno quanto de professor — sem o filtro
// perfilSolicitante (route param), as duas se misturavam na mesma lista, rotulada só como
// "Gestão de professores". AcademiaTabs.tsx registra esta tela duas vezes, uma por perfil
// (SolicitacoesProfessores/SolicitacoesAlunos), cada uma passando seu próprio filtro; a rota do
// professor (ProfessorTabs.tsx) continua sem param — só recebe solicitação de aluno, sem
// ambiguidade — e por isso também não mostra a seção "Vinculados" (só a academia tem os dois
// tipos de vínculo para gerenciar separadamente).
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Espacamento } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import {
  encerrarVinculo,
  listarSolicitacoesPendentes,
  listarVinculosAceitosDaAcademia,
  responderSolicitacao,
} from '../../services/vinculos';
import { listarAlunoIdsMatriculados } from '../../services/matriculas';
import { buscarUsuario } from '../../services/usuarios';
import { PerfilSolicitante, Vinculo } from '../../types';
import Botao from '../../components/ui/Botao';
import LinhaFina from '../../components/LinhaFina';
import EstadoVazio from '../../components/ui/EstadoVazio';
import EstadoErro from '../../components/ui/EstadoErro';
import Esqueleto from '../../components/ui/Esqueleto';
import Dialogo from '../../components/ui/Dialogo';
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';
import Avatar from '../../components/ui/Avatar';
import MensagemErro from '../../components/ui/MensagemErro';
import CabecalhoSecao from '../../components/ui/CabecalhoSecao';
import { IconeCorda } from '../../components/icones';
import { mensagemErro } from '../../utils/mensagensErro';

interface SolicitacaoComSolicitante {
  vinculo: Vinculo;
  nomeSolicitante: string;
}

interface VinculadoComNome {
  vinculoId: string;
  alunoId: string;
  nome: string;
  matriculado?: boolean; // só preenchido na lista de alunos (perfilFiltro === 'aluno')
}

function rotuloFallback(vinculo: Vinculo): string {
  return vinculo.perfilSolicitante === 'aluno' ? 'Aluno' : 'Professor';
}

export default function SolicitacoesScreen() {
  const { usuario } = useAuth();
  const route = useRoute();
  const perfilFiltro = (route.params as { perfilSolicitante?: PerfilSolicitante } | undefined)?.perfilSolicitante;
  const mostrarVinculados = usuario?.perfil === 'academia' && Boolean(perfilFiltro);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoComSolicitante[]>([]);
  const [vinculados, setVinculados] = useState<VinculadoComNome[]>([]);
  const [respondendoId, setRespondendoId] = useState<string | null>(null);
  const [encerrandoId, setEncerrandoId] = useState<string | null>(null);
  const [vinculoParaEncerrar, setVinculoParaEncerrar] = useState<VinculadoComNome | null>(null);

  const buscarDados = useCallback(async () => {
    if (!usuario) return;
    const [pendentes, aceitos] = await Promise.all([
      listarSolicitacoesPendentes(usuario.id, perfilFiltro),
      mostrarVinculados && perfilFiltro ? listarVinculosAceitosDaAcademia(usuario.id, perfilFiltro) : Promise.resolve([]),
    ]);
    const comSolicitante = await Promise.all(
      pendentes.map(async (vinculo) => {
        const solicitante = await buscarUsuario(vinculo.solicitanteId);
        return { vinculo, nomeSolicitante: solicitante?.nome ?? rotuloFallback(vinculo) };
      }),
    );
    // RF09: "situação da matrícula" só faz sentido para alunos — professores não se matriculam.
    const idsMatriculados =
      perfilFiltro === 'aluno' && aceitos.length > 0 ? await listarAlunoIdsMatriculados(usuario.id) : null;
    const comNome = await Promise.all(
      aceitos.map(async (vinculo) => {
        const solicitante = await buscarUsuario(vinculo.solicitanteId);
        return {
          vinculoId: vinculo.id,
          alunoId: vinculo.solicitanteId,
          nome: solicitante?.nome ?? rotuloFallback(vinculo),
          matriculado: idsMatriculados ? idsMatriculados.has(vinculo.solicitanteId) : undefined,
        };
      }),
    );
    setSolicitacoes(comSolicitante);
    setVinculados(comNome);
  }, [usuario, perfilFiltro, mostrarVinculados]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      await buscarDados();
    } catch (e) {
      setErro(mensagemErro(e, 'Não foi possível carregar as solicitações agora.'));
    } finally {
      setCarregando(false);
    }
  }, [buscarDados]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function handleResponder(vinculoId: string, resposta: 'aceito' | 'recusado') {
    setRespondendoId(vinculoId);
    setErro(null);
    try {
      await responderSolicitacao(vinculoId, resposta);
      if (resposta === 'aceito' && mostrarVinculados) {
        // Aceitar move a linha de "Pendentes" para "Vinculados" — busca os dois de novo em vez
        // de só filtrar localmente, para não duplicar a lógica de listarVinculosAceitosDaAcademia()
        // aqui. buscarDados() (sem setCarregando) evita o flash de tela cheia de carregar().
        await buscarDados();
      } else {
        setSolicitacoes((prev) => prev.filter((s) => s.vinculo.id !== vinculoId));
      }
    } catch (e) {
      setErro(mensagemErro(e, 'Não foi possível responder a solicitação. Tente novamente.'));
    } finally {
      setRespondendoId(null);
    }
  }

  async function handleEncerrar() {
    if (!vinculoParaEncerrar) return;
    const { vinculoId } = vinculoParaEncerrar;
    setEncerrandoId(vinculoId);
    setErro(null);
    setVinculoParaEncerrar(null);
    try {
      await encerrarVinculo(vinculoId);
      setVinculados((prev) => prev.filter((v) => v.vinculoId !== vinculoId));
    } catch (e) {
      setErro(mensagemErro(e, 'Não foi possível encerrar o vínculo. Tente novamente.'));
    } finally {
      setEncerrandoId(null);
    }
  }

  if (carregando) {
    return (
      <Tela largura="lista">
        <Esqueleto forma="linha" repeticoes={4} />
      </Tela>
    );
  }

  if (erro && solicitacoes.length === 0 && vinculados.length === 0) {
    return <EstadoErro mensagem={erro} onTentarNovamente={carregar} />;
  }

  const rotuloPerfil = perfilFiltro === 'aluno' ? 'aluno' : 'professor';
  const tituloSecaoVinculados = perfilFiltro === 'aluno' ? 'Alunos vinculados' : 'Professores vinculados';

  return (
    <Tela largura="lista">
      <MensagemErro mensagem={erro} />

      <CabecalhoSecao titulo="Pendentes" contador={solicitacoes.length} semMargem />
      {solicitacoes.length === 0 ? (
        <EstadoVazio
          icone={IconeCorda}
          titulo={mostrarVinculados ? `Nenhum ${rotuloPerfil} pendente` : 'Nenhuma solicitação pendente'}
          descricao={`Quando um ${rotuloPerfil} pedir vínculo, a solicitação aparece aqui.`}
        />
      ) : (
        solicitacoes.map(({ vinculo, nomeSolicitante }, i) => (
          <View key={vinculo.id}>
            {i > 0 ? <LinhaFina /> : null}
            <View style={styles.linha}>
              <Avatar nome={nomeSolicitante} tamanho={40} />
              <View style={styles.textos}>
                <Texto variante="headline">{nomeSolicitante}</Texto>
                <Texto variante="subheadline">{vinculo.perfilSolicitante === 'aluno' ? 'Quer treinar com você' : 'Quer dar aula na academia'}</Texto>
              </View>
            </View>
            <View style={styles.acoes}>
              <View style={styles.acao}>
                <Botao
                  titulo="Recusar"
                  variante="fantasma"
                  compacto
                  onPress={() => handleResponder(vinculo.id, 'recusado')}
                  desabilitado={respondendoId === vinculo.id}
                  accessibilityLabel={`Recusar ${nomeSolicitante}`}
                />
              </View>
              <View style={styles.acao}>
                <Botao
                  titulo="Aceitar"
                  variante="secundario"
                  compacto
                  onPress={() => handleResponder(vinculo.id, 'aceito')}
                  carregando={respondendoId === vinculo.id}
                  accessibilityLabel={`Aceitar ${nomeSolicitante}`}
                />
              </View>
            </View>
          </View>
        ))
      )}

      {mostrarVinculados ? (
        <>
          <CabecalhoSecao titulo={tituloSecaoVinculados} contador={vinculados.length} />
          {vinculados.length === 0 ? (
            <Texto variante="subheadline">{`Nenhum ${rotuloPerfil} vinculado ainda.`}</Texto>
          ) : (
            vinculados.map((vinculado, i) => (
              <View key={vinculado.vinculoId}>
                {i > 0 ? <LinhaFina /> : null}
                <View style={styles.linha}>
                  <Avatar nome={vinculado.nome} tamanho={40} />
                  <View style={styles.textos}>
                    <Texto variante="headline">{vinculado.nome}</Texto>
                    {vinculado.matriculado !== undefined ? (
                      <Texto variante="subheadline" cor={vinculado.matriculado ? 'texto2' : 'texto3'}>
                        {vinculado.matriculado ? 'Matriculado em uma turma' : 'Vinculado, sem matrícula ainda'}
                      </Texto>
                    ) : null}
                  </View>
                  <Botao
                    titulo="Encerrar"
                    variante="fantasma"
                    compacto
                    onPress={() => setVinculoParaEncerrar(vinculado)}
                    carregando={encerrandoId === vinculado.vinculoId}
                    accessibilityLabel={`Encerrar vínculo com ${vinculado.nome}`}
                  />
                </View>
              </View>
            ))
          )}
        </>
      ) : null}

      <Dialogo
        visivel={vinculoParaEncerrar !== null}
        titulo={`Encerrar vínculo com ${vinculoParaEncerrar?.nome ?? ''}?`}
        mensagem={
          perfilFiltro === 'aluno'
            ? 'O aluno deixa de ter você como responsável. Matrículas e histórico já registrados não são apagados.'
            : 'O professor deixa de ter você como academia e volta a atuar como autônomo. Turmas já criadas não são apagadas.'
        }
        tituloConfirmar="Encerrar"
        onConfirmar={handleEncerrar}
        tituloCancelar="Cancelar"
        onCancelar={() => setVinculoParaEncerrar(null)}
        destrutivo
      />
    </Tela>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.medio, minHeight: 60, paddingVertical: Espacamento.pequeno },
  textos: { flex: 1, gap: 2 },
  acoes: { flexDirection: 'row', gap: Espacamento.pequeno, paddingBottom: Espacamento.medio, paddingLeft: 52 },
  acao: { flex: 1 },
});
