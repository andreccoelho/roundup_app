// RF08: aluno solicita vínculo com academia ou professor autônomo
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { criarEstilos, Espacamento, useTema } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { listarAcademiasDisponiveis, listarProfessoresAutonomos, solicitarVinculo } from '../../services/vinculos';
import { PerfilDestinatario, Usuario } from '../../types';
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';
import Avatar from '../../components/ui/Avatar';
import Aviso from '../../components/ui/Aviso';
import CampoTexto from '../../components/ui/CampoTexto';
import MensagemErro from '../../components/ui/MensagemErro';
import GrupoLista from '../../components/ui/GrupoLista';
import { IconeCheck, IconeCorda } from '../../components/icones';
import { mensagemErro } from '../../utils/mensagensErro';
import Botao from '../../components/ui/Botao';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoVazio from '../../components/ui/EstadoVazio';
import EstadoErro from '../../components/ui/EstadoErro';

interface OpcaoVinculo {
  usuario: Usuario;
  perfilDestinatario: PerfilDestinatario;
}

export default function VincularAlunoScreen() {
  const styles = useEstilos();
  const { cores } = useTema();
  const { usuario } = useAuth();
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [academias, setAcademias] = useState<Usuario[]>([]);
  const [professores, setProfessores] = useState<Usuario[]>([]);
  const [solicitados, setSolicitados] = useState<Set<string>>(new Set());
  const [erroSolicitacao, setErroSolicitacao] = useState<string | null>(null);
  const [enviandoId, setEnviandoId] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  const carregarOpcoes = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const [listaAcademias, listaProfessores] = await Promise.all([
        listarAcademiasDisponiveis(),
        listarProfessoresAutonomos(),
      ]);
      setAcademias(listaAcademias);
      setProfessores(listaProfessores);
    } catch (e) {
      setErro(mensagemErro(e, 'Não foi possível carregar as opções agora.'));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarOpcoes();
  }, [carregarOpcoes]);

  async function handleSolicitar({ usuario: destinatario, perfilDestinatario }: OpcaoVinculo) {
    if (!usuario || enviandoId) return;
    setErroSolicitacao(null);
    setEnviandoId(destinatario.id);
    try {
      await solicitarVinculo(usuario.id, destinatario.id, 'aluno', perfilDestinatario);
      setSolicitados((prev) => new Set(prev).add(destinatario.id));
      setSucesso('Pedido enviado. Você será liberado assim que aceitarem.');
    } catch (e) {
      setErroSolicitacao(mensagemErro(e, 'Não foi possível enviar o pedido. Tente novamente.'));
    } finally {
      setEnviandoId(null);
    }
  }

  function renderItem({ usuario: destinatario, perfilDestinatario }: OpcaoVinculo) {
    const jaSolicitado = solicitados.has(destinatario.id);
    return (
      <View key={destinatario.id}>
        <View style={styles.linha}>
          <Avatar nome={destinatario.nomeAcademia ?? destinatario.nome} fotoUrl={destinatario.fotoUrl} tamanho={40} />
          <View style={styles.textos}>
            <Texto variante="body">{destinatario.nomeAcademia ?? destinatario.nome}</Texto>
            <Texto variante="footnote">{perfilDestinatario === 'academia' ? 'Academia' : 'Professor autônomo'}</Texto>
          </View>
          {jaSolicitado ? (
            <View style={styles.solicitado} accessible accessibilityLabel="Solicitação enviada">
              <IconeCheck tamanho={16} cor={cores.texto2} />
              <Texto variante="subheadline">
                Enviado
              </Texto>
            </View>
          ) : (
            <Botao
              titulo="Solicitar"
              variante="secundario"
              compacto
              carregando={enviandoId === destinatario.id}
              onPress={() => handleSolicitar({ usuario: destinatario, perfilDestinatario })}
              accessibilityLabel={`Solicitar vínculo com ${destinatario.nomeAcademia ?? destinatario.nome}`}
            />
          )}
        </View>
      </View>
    );
  }

  if (carregando) {
    return (
      <Tela largura="lista" agrupada>
        <Esqueleto forma="linha" repeticoes={5} />
      </Tela>
    );
  }

  if (erro) {
    return <EstadoErro mensagem={erro} onTentarNovamente={carregarOpcoes} />;
  }

  if (academias.length === 0 && professores.length === 0) {
    return (
      <Tela largura="lista" agrupada centralizarVertical>
        <EstadoVazio icone={IconeCorda} titulo="Nenhuma opção disponível" descricao="Ainda não há academias nem professores autônomos cadastrados." />
      </Tela>
    );
  }

  const termo = busca.trim().toLocaleLowerCase('pt-BR');
  const casa = (u: Usuario) => !termo || `${u.nomeAcademia ?? ''} ${u.nome} ${u.endereco ?? ''}`.toLocaleLowerCase('pt-BR').includes(termo);
  const academiasFiltradas = academias.filter(casa);
  const professoresFiltrados = professores.filter(casa);

  return (
    <Tela
      largura="lista"
      agrupada
      teclado
      sobreposicao={<Aviso visivel={sucesso !== null} tipo="sucesso" mensagem={sucesso ?? ''} onFechar={() => setSucesso(null)} />}
    >
      <Texto variante="body" cor="texto2" style={styles.intro}>
        Peça vínculo com sua academia ou professor. Assim que aceitarem, suas turmas e o check-in são liberados.
      </Texto>
      <CampoTexto rotulo="Buscar" placeholder="Nome da academia ou do professor" valor={busca} onAlterar={setBusca} autoCorrect={false} />
      <MensagemErro mensagem={erroSolicitacao} />

      <GrupoLista titulo={`Academias: ${academiasFiltradas.length}`} semMargem>
        {academiasFiltradas.length === 0 ? (
          <Texto variante="subheadline" style={styles.vazio}>
            {termo ? 'Nenhuma academia com esse nome.' : 'Nenhuma academia disponível.'}
          </Texto>
        ) : (
          academiasFiltradas.map((academia) => renderItem({ usuario: academia, perfilDestinatario: 'academia' }))
        )}
      </GrupoLista>

      <GrupoLista titulo={`Professores autônomos: ${professoresFiltrados.length}`}>
        {professoresFiltrados.length === 0 ? (
          <Texto variante="subheadline" style={styles.vazio}>
            {termo ? 'Nenhum professor com esse nome.' : 'Nenhum professor autônomo disponível.'}
          </Texto>
        ) : (
          professoresFiltrados.map((professor) => renderItem({ usuario: professor, perfilDestinatario: 'professor' }))
        )}
      </GrupoLista>
    </Tela>
  );
}

const useEstilos = criarEstilos((c) => ({
  intro: { marginBottom: Espacamento.padrao },
  vazio: { padding: Espacamento.padrao },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.medio, minHeight: 60, paddingVertical: Espacamento.pequeno + 2, paddingHorizontal: Espacamento.padrao },
  textos: { flex: 1, gap: 2 },
  solicitado: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.minimo, minHeight: 44 },
}));
