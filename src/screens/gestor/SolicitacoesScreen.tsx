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
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Cores, Espacamento, TamanhoFonte } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { listarSolicitacoesPendentes, listarVinculosAceitosDaAcademia, responderSolicitacao } from '../../services/vinculos';
import { buscarUsuario } from '../../services/usuarios';
import { PerfilSolicitante, Vinculo } from '../../types';
import Botao from '../../components/ui/Botao';
import LinhaFina from '../../components/LinhaFina';
import EstadoVazio from '../../components/ui/EstadoVazio';
import EstadoErro from '../../components/ui/EstadoErro';
import Esqueleto from '../../components/ui/Esqueleto';

interface SolicitacaoComSolicitante {
  vinculo: Vinculo;
  nomeSolicitante: string;
}

interface VinculadoComNome {
  id: string;
  nome: string;
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
    const comNome = await Promise.all(
      aceitos.map(async (vinculo) => {
        const solicitante = await buscarUsuario(vinculo.solicitanteId);
        return { id: vinculo.solicitanteId, nome: solicitante?.nome ?? rotuloFallback(vinculo) };
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
    } catch (e: any) {
      setErro(e.message);
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
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setRespondendoId(null);
    }
  }

  if (carregando) {
    return (
      <View style={styles.container}>
        <Esqueleto altura={72} repeticoes={4} />
      </View>
    );
  }

  if (erro && solicitacoes.length === 0 && vinculados.length === 0) {
    return <EstadoErro mensagem={erro} onTentarNovamente={carregar} />;
  }

  const rotuloPerfil = perfilFiltro === 'aluno' ? 'aluno' : 'professor';
  const tituloSecaoVinculados = perfilFiltro === 'aluno' ? 'Alunos vinculados' : 'Professores vinculados';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      {mostrarVinculados ? <Text style={styles.secaoTitulo}>Pendentes</Text> : null}

      {solicitacoes.length === 0 ? (
        <EstadoVazio
          titulo={mostrarVinculados ? `Nenhum ${rotuloPerfil} pendente` : 'Nenhuma solicitação pendente'}
          descricao={`Quando um ${rotuloPerfil} pedir vínculo, a solicitação aparece aqui.`}
        />
      ) : (
        solicitacoes.map(({ vinculo, nomeSolicitante }, i) => (
          <View key={vinculo.id}>
            <View style={styles.linha}>
              <Text style={styles.nome}>{nomeSolicitante}</Text>
              <View style={styles.acoes}>
                <Botao
                  titulo="Recusar"
                  variante="secundario"
                  onPress={() => handleResponder(vinculo.id, 'recusado')}
                  desabilitado={respondendoId === vinculo.id}
                />
                <Botao
                  titulo="Aceitar"
                  onPress={() => handleResponder(vinculo.id, 'aceito')}
                  carregando={respondendoId === vinculo.id}
                />
              </View>
            </View>
            {i < solicitacoes.length - 1 && <LinhaFina />}
          </View>
        ))
      )}

      {mostrarVinculados ? (
        <View style={styles.secaoVinculados}>
          <Text style={styles.secaoTitulo}>{tituloSecaoVinculados}</Text>
          {vinculados.length === 0 ? (
            <Text style={styles.vazioVinculados}>Nenhum {rotuloPerfil} vinculado ainda.</Text>
          ) : (
            vinculados.map((vinculado, i) => (
              <View key={vinculado.id}>
                <View style={styles.linha}>
                  <Text style={styles.nome}>{vinculado.nome}</Text>
                </View>
                {i < vinculados.length - 1 && <LinhaFina />}
              </View>
            ))
          )}
        </View>
      ) : null}

      {erro ? <Text style={styles.erroInline}>{erro}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.branco },
  conteudo: { padding: Espacamento.padrao, paddingBottom: Espacamento.enorme },
  secaoTitulo: { fontSize: TamanhoFonte.md, fontWeight: '600', color: Cores.preto, marginBottom: Espacamento.pequeno },
  secaoVinculados: { marginTop: Espacamento.grande },
  vazioVinculados: { color: Cores.cinzaMedio, fontSize: TamanhoFonte.sm },
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Espacamento.medio,
    gap: Espacamento.medio,
  },
  nome: { fontSize: TamanhoFonte.md, color: Cores.preto, fontWeight: '600', flexShrink: 1 },
  acoes: { flexDirection: 'row', gap: Espacamento.pequeno },
  erroInline: { color: Cores.alerta, fontSize: TamanhoFonte.sm, marginTop: Espacamento.medio },
});
