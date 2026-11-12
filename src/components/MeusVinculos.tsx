// RF07, RF08, RN05: vínculos do próprio usuário (aluno ou professor) com opção de SAIR de um
// vínculo ativo — antes só o destinatário (academia/professor) conseguia encerrar. Compartilhado
// pelas telas de vincular do aluno e do professor.
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { criarEstilos, Espacamento } from '../theme';
import { encerrarVinculo, listarVinculosDoSolicitante } from '../services/vinculos';
import { buscarUsuario } from '../services/usuarios';
import { Vinculo } from '../types';
import { mensagemErro } from '../utils/mensagensErro';
import { notificarMudancaDeVinculos } from '../utils/eventosVinculo';
import Botao from './ui/Botao';
import Dialogo from './ui/Dialogo';
import Texto from './ui/Texto';
import Avatar from './ui/Avatar';
import MensagemErro from './ui/MensagemErro';
import GrupoLista from './ui/GrupoLista';

interface VinculoComNome {
  vinculo: Vinculo;
  nome: string;
}

interface Props {
  solicitanteId: string;
  // Chamado depois de sair de um vínculo — a tela de origem recarrega as listas dela
  onMudou?: () => void;
}

export default function MeusVinculos({ solicitanteId, onMudou }: Props) {
  const styles = useEstilos();
  const [itens, setItens] = useState<VinculoComNome[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [saindoId, setSaindoId] = useState<string | null>(null);
  const [paraSair, setParaSair] = useState<VinculoComNome | null>(null);

  const carregar = useCallback(async () => {
    try {
      const vinculos = (await listarVinculosDoSolicitante(solicitanteId))
        .filter((v) => v.status === 'aceito' || v.status === 'pendente');
      const comNome = await Promise.all(
        vinculos.map(async (vinculo) => {
          const destino = await buscarUsuario(vinculo.destinatarioId);
          return { vinculo, nome: destino?.nomeAcademia ?? destino?.nome ?? 'Vínculo' };
        }),
      );
      setItens(comNome);
    } catch (e) {
      setErro(mensagemErro(e, 'Não foi possível carregar seus vínculos agora.'));
    }
  }, [solicitanteId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function confirmarSaida() {
    if (!paraSair) return;
    const { vinculo } = paraSair;
    setParaSair(null);
    setSaindoId(vinculo.id);
    setErro(null);
    try {
      await encerrarVinculo(vinculo.id);
      await carregar();
      notificarMudancaDeVinculos();
      onMudou?.();
    } catch (e) {
      setErro(mensagemErro(e, 'Não foi possível sair do vínculo. Tente novamente.'));
    } finally {
      setSaindoId(null);
    }
  }

  if (itens.length === 0 && !erro) return null;

  const ativos = itens.filter((i) => i.vinculo.status === 'aceito');
  const pendentes = itens.filter((i) => i.vinculo.status === 'pendente');

  return (
    <View style={styles.raiz}>
      <MensagemErro mensagem={erro} />

      {ativos.length > 0 ? (
        <GrupoLista titulo={`Meus vínculos: ${ativos.length}`} semMargem>
          {ativos.map(({ vinculo, nome }) => (
            <View key={vinculo.id} style={styles.linha}>
              <Avatar nome={nome} tamanho={40} />
              <View style={styles.textos}>
                <Texto variante="body">{nome}</Texto>
                <Texto variante="footnote">Vínculo ativo</Texto>
              </View>
              <Botao
                titulo="Sair"
                variante="fantasma"
                compacto
                carregando={saindoId === vinculo.id}
                onPress={() => setParaSair({ vinculo, nome })}
                accessibilityLabel={`Sair do vínculo com ${nome}`}
              />
            </View>
          ))}
        </GrupoLista>
      ) : null}

      {pendentes.length > 0 ? (
        <GrupoLista titulo={`Aguardando resposta: ${pendentes.length}`} semMargem={ativos.length === 0}>
          {pendentes.map(({ vinculo, nome }) => (
            <View key={vinculo.id} style={styles.linha}>
              <Avatar nome={nome} tamanho={40} />
              <View style={styles.textos}>
                <Texto variante="body">{nome}</Texto>
                <Texto variante="footnote">Pedido enviado</Texto>
              </View>
            </View>
          ))}
        </GrupoLista>
      ) : null}

      <Dialogo
        visivel={paraSair !== null}
        titulo={`Sair do vínculo com ${paraSair?.nome ?? ''}?`}
        mensagem="Você deixa de ver as turmas, missões e a classificação deste vínculo, e suas matrículas nas turmas dele são canceladas. Seu histórico de treinos continua guardado. Dá para pedir o vínculo de novo depois."
        tituloConfirmar="Sair"
        onConfirmar={confirmarSaida}
        tituloCancelar="Cancelar"
        onCancelar={() => setParaSair(null)}
        destrutivo
      />
    </View>
  );
}

const useEstilos = criarEstilos(() => ({
  raiz: { marginBottom: Espacamento.padrao },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.medio, minHeight: 60, paddingVertical: Espacamento.pequeno + 2, paddingHorizontal: Espacamento.padrao },
  textos: { flex: 1, gap: 2 },
}));
