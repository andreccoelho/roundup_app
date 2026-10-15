// RF07: professor solicita vínculo com uma academia. Lista sobre o fundo (sem cards), busca local
// por nome/endereço (filtra a lista já carregada, sem nova consulta), loading por item e Aviso de
// sucesso.
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Cores, Espacamento } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { listarAcademiasDisponiveis, solicitarVinculo } from '../../services/vinculos';
import { Usuario } from '../../types';
import { mensagemErro } from '../../utils/mensagensErro';
import Botao from '../../components/ui/Botao';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoVazio from '../../components/ui/EstadoVazio';
import EstadoErro from '../../components/ui/EstadoErro';
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';
import Avatar from '../../components/ui/Avatar';
import Aviso from '../../components/ui/Aviso';
import CampoTexto from '../../components/ui/CampoTexto';
import MensagemErro from '../../components/ui/MensagemErro';
import CabecalhoSecao from '../../components/ui/CabecalhoSecao';
import LinhaFina from '../../components/LinhaFina';
import { IconeCheck, IconePoste } from '../../components/icones';

export default function VincularProfessorScreen() {
  const { usuario } = useAuth();
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [academias, setAcademias] = useState<Usuario[]>([]);
  const [solicitados, setSolicitados] = useState<Set<string>>(new Set());
  const [erroSolicitacao, setErroSolicitacao] = useState<string | null>(null);
  const [enviandoId, setEnviandoId] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  const carregarAcademias = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      setAcademias(await listarAcademiasDisponiveis());
    } catch (e) {
      setErro(mensagemErro(e, 'Não foi possível carregar as academias agora.'));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarAcademias();
  }, [carregarAcademias]);

  async function handleSolicitar(academia: Usuario) {
    if (!usuario || enviandoId) return;
    setErroSolicitacao(null);
    setEnviandoId(academia.id);
    try {
      await solicitarVinculo(usuario.id, academia.id, 'professor', 'academia');
      setSolicitados((prev) => new Set(prev).add(academia.id));
      setSucesso('Pedido enviado à academia.');
    } catch (e) {
      setErroSolicitacao(mensagemErro(e, 'Não foi possível enviar o pedido. Tente novamente.'));
    } finally {
      setEnviandoId(null);
    }
  }

  if (carregando) {
    return (
      <Tela largura="lista">
        <Esqueleto forma="linha" repeticoes={4} />
      </Tela>
    );
  }

  if (erro) {
    return <EstadoErro mensagem={erro} onTentarNovamente={carregarAcademias} />;
  }

  if (academias.length === 0) {
    return (
      <Tela largura="lista" centralizarVertical>
        <EstadoVazio icone={IconePoste} titulo="Nenhuma academia disponível" descricao="Ainda não há academias cadastradas para se vincular." />
      </Tela>
    );
  }

  const termo = busca.trim().toLocaleLowerCase('pt-BR');
  const filtradas = academias.filter(
    (a) => !termo || `${a.nomeAcademia ?? ''} ${a.nome} ${a.endereco ?? ''}`.toLocaleLowerCase('pt-BR').includes(termo),
  );

  return (
    <Tela
      largura="lista"
      teclado
      sobreposicao={<Aviso visivel={sucesso !== null} tipo="sucesso" mensagem={sucesso ?? ''} onFechar={() => setSucesso(null)} />}
    >
      <CampoTexto rotulo="Buscar" placeholder="Nome ou endereço da academia" valor={busca} onAlterar={setBusca} autoCorrect={false} />
      <MensagemErro mensagem={erroSolicitacao} />
      <CabecalhoSecao titulo="Academias" contador={filtradas.length} semMargem />
      {filtradas.length === 0 ? (
        <Texto variante="legenda" style={styles.vazio}>
          Nenhuma academia com esse nome.
        </Texto>
      ) : (
        filtradas.map((academia, i) => {
          const jaSolicitado = solicitados.has(academia.id);
          const nome = academia.nomeAcademia ?? academia.nome;
          return (
            <View key={academia.id}>
              {i > 0 ? <LinhaFina /> : null}
              <View style={styles.linha}>
                <Avatar nome={nome} fotoUrl={academia.fotoUrl} tamanho={40} />
                <View style={styles.textos}>
                  <Texto variante="corpoForte">{nome}</Texto>
                  {academia.endereco ? <Texto variante="legenda">{academia.endereco}</Texto> : null}
                </View>
                {jaSolicitado ? (
                  <View style={styles.solicitado} accessible accessibilityLabel="Solicitação enviada">
                    <IconeCheck tamanho={16} cor={Cores.texto2} />
                    <Texto variante="rotuloPlacar" cor="texto2">
                      Enviado
                    </Texto>
                  </View>
                ) : (
                  <Botao
                    titulo="Solicitar"
                    variante="secundario"
                    compacto
                    carregando={enviandoId === academia.id}
                    onPress={() => handleSolicitar(academia)}
                    accessibilityLabel={`Solicitar vínculo com ${nome}`}
                  />
                )}
              </View>
            </View>
          );
        })
      )}
    </Tela>
  );
}

const styles = StyleSheet.create({
  vazio: { paddingVertical: Espacamento.medio },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.medio, minHeight: 64, paddingVertical: Espacamento.medio },
  textos: { flex: 1, gap: 2 },
  solicitado: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.minimo, minHeight: 44 },
});
