// RF33: personalização da pontuação e dos níveis pelo responsável (professor autônomo ou
// academia), aberta a partir do Perfil. Grava em configuracoesGamificacao/{uid}; sem documento,
// valem os padrões de src/config/gamificacao.ts e a tela diz isso. A estrutura de faixas da
// modalidade, também citada no RF33, não entra aqui: a faixa ainda é texto livre (ver
// docs/DECISOES_PENDENTES.md, R-05 e item 8).
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Espacamento } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import {
  buscarConfiguracao, restaurarPadrao, salvarConfiguracao, valoresEfetivos, VALORES_PADRAO,
} from '../../services/configuracoesGamificacao';
import { LIMITES_CONFIGURACAO } from '../../config/gamificacao';
import { lerTabelaNiveis, validarConfiguracao, type ValoresGamificacao } from '../../utils/gamificacao';
import { mensagemErro } from '../../utils/mensagensErro';
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';
import Botao from '../../components/ui/Botao';
import Aviso from '../../components/ui/Aviso';
import CampoTexto from '../../components/ui/CampoTexto';
import CabecalhoSecao from '../../components/ui/CabecalhoSecao';
import MensagemErro from '../../components/ui/MensagemErro';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoErro from '../../components/ui/EstadoErro';

function paraTexto(valores: ValoresGamificacao) {
  return {
    pontosPorCheckin: String(valores.pontosPorCheckin),
    pontosPorMissao: String(valores.pontosPorMissao),
    niveis: valores.niveisXp.join(', '),
  };
}

export default function ConfiguracaoGamificacaoScreen() {
  const { usuario } = useAuth();
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [personalizada, setPersonalizada] = useState(false);
  const [campos, setCampos] = useState(paraTexto(VALORES_PADRAO));
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [restaurando, setRestaurando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      const config = await buscarConfiguracao(usuario.id);
      setPersonalizada(config !== null);
      setCampos(paraTexto(valoresEfetivos(config)));
    } catch (e) {
      setErro(mensagemErro(e, 'Não foi possível carregar a configuração agora.'));
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function handleSalvar() {
    if (!usuario) return;
    const niveisXp = lerTabelaNiveis(campos.niveis);
    if (!niveisXp) {
      setErroForm('Escreva a tabela de níveis como números inteiros separados por vírgula.');
      return;
    }
    const valores: ValoresGamificacao = {
      pontosPorCheckin: Number(campos.pontosPorCheckin),
      pontosPorMissao: Number(campos.pontosPorMissao),
      niveisXp,
    };
    const problema = validarConfiguracao(valores);
    if (problema) {
      setErroForm(problema);
      return;
    }

    setErroForm(null);
    setSalvando(true);
    try {
      await salvarConfiguracao(usuario.id, valores);
      setPersonalizada(true);
      setAviso('Configuração salva. Vale para os próximos check-ins validados.');
    } catch (e) {
      setErroForm(mensagemErro(e, 'Não foi possível salvar a configuração. Tente novamente.'));
    } finally {
      setSalvando(false);
    }
  }

  async function handleRestaurar() {
    if (!usuario) return;
    setErroForm(null);
    setRestaurando(true);
    try {
      await restaurarPadrao(usuario.id);
      setPersonalizada(false);
      setCampos(paraTexto(VALORES_PADRAO));
      setAviso('Valores padrão restaurados.');
    } catch (e) {
      setErroForm(mensagemErro(e, 'Não foi possível restaurar o padrão. Tente novamente.'));
    } finally {
      setRestaurando(false);
    }
  }

  if (carregando) {
    return (
      <Tela largura="formulario">
        <Esqueleto forma="linha" repeticoes={4} />
      </Tela>
    );
  }

  if (erro) {
    return <EstadoErro mensagem={erro} onTentarNovamente={carregar} />;
  }

  const { pontosPorCheckin: limCheckin, pontosPorMissao: limMissao, niveis: limNiveis } = LIMITES_CONFIGURACAO;

  return (
    <Tela
      largura="formulario"
      sobreposicao={<Aviso mensagem={aviso ?? ''} tipo="sucesso" visivel={aviso !== null} onFechar={() => setAviso(null)} acimaDaTabBar />}
    >
      <Texto variante="legenda" style={styles.intro}>
        {personalizada
          ? 'Estes são os valores da sua academia ou das suas turmas.'
          : 'Você está usando os valores padrão do RoundUp. Altere e salve para personalizar.'}
      </Texto>
      <MensagemErro mensagem={erroForm} />

      <CabecalhoSecao titulo="Pontuação" semMargem />
      <CampoTexto
        rotulo="Pontos por check-in validado"
        valor={campos.pontosPorCheckin}
        onAlterar={(texto) => setCampos((c) => ({ ...c, pontosPorCheckin: texto }))}
        keyboardType="number-pad"
        ajuda={`De ${limCheckin.minimo} a ${limCheckin.maximo}. Check-ins já validados mantêm os pontos que receberam.`}
      />
      <CampoTexto
        rotulo="Pontos sugeridos por missão"
        valor={campos.pontosPorMissao}
        onAlterar={(texto) => setCampos((c) => ({ ...c, pontosPorMissao: texto }))}
        keyboardType="number-pad"
        ajuda={`De ${limMissao.minimo} a ${limMissao.maximo}. Valor que já vem preenchido ao criar uma missão.`}
      />

      <CabecalhoSecao titulo="Níveis" />
      <CampoTexto
        rotulo="Pontos acumulados para completar cada nível"
        valor={campos.niveis}
        onAlterar={(texto) => setCampos((c) => ({ ...c, niveis: texto }))}
        keyboardType="numbers-and-punctuation"
        multiline
        ajuda={`Números crescentes separados por vírgula, de ${limNiveis.minimo} a ${limNiveis.maximo} níveis. O primeiro valor completa o nível 1.`}
      />

      <View style={styles.acoes}>
        <Botao titulo="Salvar" onPress={handleSalvar} carregando={salvando} desabilitado={restaurando} />
        {personalizada ? (
          <Botao titulo="Restaurar padrão" variante="texto" onPress={handleRestaurar} carregando={restaurando} desabilitado={salvando} />
        ) : null}
      </View>
    </Tela>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: Espacamento.padrao },
  acoes: { gap: Espacamento.padrao, marginTop: Espacamento.padrao },
});
