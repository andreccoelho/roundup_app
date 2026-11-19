// RF33: personalização da estrutura de faixas da modalidade pelo responsável (academia ou professor
// autônomo): ordem, nome, cor e quantidade de graus de cada faixa. Aberta a partir de "Pontuação e
// níveis". Grava em estruturasFaixas/{uid}; modalidade sem personalização usa a estrutura padrão
// (src/utils/faixas.ts), e "Restaurar padrão" volta a ela.
// O id de cada faixa é fixo depois de criado: renomear uma faixa não tira o aluno dela (a
// graduação estruturada aponta para o id). Remover uma faixa em que já há aluno deixa esse aluno
// só com o texto (sem barra de progresso) até a próxima graduação — a tela avisa.
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';
import { Espacamento } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { buscarEstruturaFaixas, restaurarFaixasPadrao, salvarFaixasDaModalidade } from '../../services/estruturasFaixas';
import { MODALIDADES } from '../../constants/modalidades';
import { CORES_FAIXA, LIMITES_ESTRUTURA, estruturaDaModalidade, idDaFaixa, textoDaFaixa, validarEstrutura } from '../../utils/faixas';
import { mensagemErro } from '../../utils/mensagensErro';
import type { CorFaixa, EstruturaFaixas, FaixaConfig } from '../../types';
import Tela from '../../components/ui/Tela';
import Texto from '../../components/ui/Texto';
import Botao from '../../components/ui/Botao';
import BotaoCabecalho from '../../components/ui/BotaoCabecalho';
import Aviso from '../../components/ui/Aviso';
import Cartao from '../../components/ui/Cartao';
import CampoTexto from '../../components/ui/CampoTexto';
import CabecalhoSecao from '../../components/ui/CabecalhoSecao';
import Etiqueta from '../../components/ui/Etiqueta';
import SeloFaixa from '../../components/ui/SeloFaixa';
import MensagemErro from '../../components/ui/MensagemErro';
import Esqueleto from '../../components/ui/Esqueleto';
import EstadoErro from '../../components/ui/EstadoErro';
import { IconeMais } from '../../components/icones';

// Faixa em edição: graus como texto, para o campo aceitar apagar e digitar
interface FaixaEditada extends Omit<FaixaConfig, 'graus'> {
  graus: string;
}

const ROTULO_COR: Record<CorFaixa, string> = {
  branca: 'Branca', cinza: 'Cinza', amarela: 'Amarela', laranja: 'Laranja', verde: 'Verde',
  azul: 'Azul', roxa: 'Roxa', marrom: 'Marrom', vermelha: 'Vermelha', preta: 'Preta',
};

function paraEdicao(faixas: FaixaConfig[]): FaixaEditada[] {
  return faixas.map((f) => ({ ...f, graus: String(f.graus) }));
}

export default function EstruturaFaixasScreen() {
  const { usuario } = useAuth();
  const navigation = useNavigation();
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [estrutura, setEstrutura] = useState<EstruturaFaixas | null>(null);
  const [modalidade, setModalidade] = useState('');
  const [faixas, setFaixas] = useState<FaixaEditada[]>([]);
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [restaurando, setRestaurando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  // Modalidades do responsável primeiro; depois as da lista padrão e as já personalizadas
  const modalidades = [...new Set([
    ...(usuario?.modalidades ?? []),
    ...MODALIDADES,
    ...Object.keys(estrutura?.modalidades ?? {}),
  ])];
  const personalizada = Boolean(estrutura?.modalidades?.[modalidade]?.length);

  const escolherModalidade = useCallback((m: string, base: EstruturaFaixas | null) => {
    setModalidade(m);
    setFaixas(paraEdicao(estruturaDaModalidade(base?.modalidades, m)));
    setErroForm(null);
  }, []);

  const carregar = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      const atual = await buscarEstruturaFaixas(usuario.id);
      setEstrutura(atual);
      escolherModalidade(usuario.modalidades?.[0] ?? MODALIDADES[0], atual);
    } catch (e) {
      setErro(mensagemErro(e, 'Não foi possível carregar as faixas agora.'));
    } finally {
      setCarregando(false);
    }
  }, [usuario, escolherModalidade]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function alterar(indice: number, mudanca: Partial<FaixaEditada>) {
    setFaixas((atual) => atual.map((f, i) => (i === indice ? { ...f, ...mudanca } : f)));
  }

  function mover(indice: number, direcao: -1 | 1) {
    setFaixas((atual) => {
      const destino = indice + direcao;
      if (destino < 0 || destino >= atual.length) return atual;
      const copia = [...atual];
      [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
      return copia;
    });
  }

  function adicionar() {
    setFaixas((atual) => [...atual, { id: '', nome: '', cor: 'cinza', graus: '0' }]);
  }

  async function handleSalvar() {
    if (!usuario || !modalidade) return;
    // Faixa nova ganha id pelo nome; as que já existiam mantêm o id (renomear não tira ninguém dela)
    const ids: string[] = [];
    const prontas: FaixaConfig[] = faixas.map((f) => {
      const id = f.id || idDaFaixa(f.nome, [...ids, ...faixas.map((x) => x.id).filter(Boolean)]);
      ids.push(id);
      return { id, nome: f.nome.trim(), cor: f.cor, graus: Number(f.graus.trim() === '' ? NaN : f.graus) };
    });
    const problema = validarEstrutura(prontas);
    if (problema) {
      setErroForm(problema);
      return;
    }
    setErroForm(null);
    setSalvando(true);
    try {
      await salvarFaixasDaModalidade(usuario.id, modalidade, prontas);
      const nova: EstruturaFaixas = {
        id: usuario.id,
        responsavelId: usuario.id,
        modalidades: { ...(estrutura?.modalidades ?? {}), [modalidade]: prontas },
        atualizadoEm: new Date(),
      };
      setEstrutura(nova);
      setFaixas(paraEdicao(prontas));
      setAviso(`Faixas de ${modalidade} salvas. Valem para as próximas graduações.`);
    } catch (e) {
      setErroForm(mensagemErro(e, 'Não foi possível salvar as faixas. Tente novamente.'));
    } finally {
      setSalvando(false);
    }
  }

  async function handleRestaurar() {
    if (!usuario || !modalidade) return;
    setErroForm(null);
    setRestaurando(true);
    try {
      await restaurarFaixasPadrao(usuario.id, modalidade);
      const resto = { ...(estrutura?.modalidades ?? {}) };
      delete resto[modalidade];
      const nova = estrutura ? { ...estrutura, modalidades: resto } : null;
      setEstrutura(nova);
      escolherModalidade(modalidade, nova);
      setAviso(`Faixas padrão de ${modalidade} restauradas.`);
    } catch (e) {
      setErroForm(mensagemErro(e, 'Não foi possível restaurar o padrão. Tente novamente.'));
    } finally {
      setRestaurando(false);
    }
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <BotaoCabecalho titulo="Salvar" forte carregando={salvando} desabilitado={carregando || restaurando} onPress={handleSalvar} />,
    });
  });

  if (carregando) {
    return (
      <Tela largura="formulario" agrupada>
        <Esqueleto forma="linha" repeticoes={4} />
      </Tela>
    );
  }

  if (erro) {
    return <EstadoErro mensagem={erro} onTentarNovamente={carregar} />;
  }

  return (
    <Tela
      largura="formulario"
      agrupada
      teclado
      sobreposicao={<Aviso mensagem={aviso ?? ''} tipo="sucesso" visivel={aviso !== null} onFechar={() => setAviso(null)} acimaDaTabBar />}
    >
      <Texto variante="subheadline" style={styles.intro}>
        Defina a ordem das faixas, o nome, a cor e quantos graus cada uma tem. É a estrutura usada ao registrar uma
        graduação e na barra de progresso do aluno até a próxima faixa.
      </Texto>

      <View style={styles.grade} accessibilityRole="radiogroup" accessibilityLabel="Modalidade">
        {modalidades.map((m) => (
          <Etiqueta key={m} texto={m} selecionada={modalidade === m} onPress={() => escolherModalidade(m, estrutura)} />
        ))}
      </View>

      <Texto variante="footnote" cor="texto2" style={styles.intro}>
        {personalizada
          ? `Estrutura personalizada de ${modalidade}.`
          : faixas.length > 0
            ? `${modalidade} está com a estrutura padrão do RoundUp. Altere e salve para personalizar.`
            : `${modalidade} não tem faixas no padrão. Adicione faixas para registrar graduações nela.`}
      </Texto>
      <MensagemErro mensagem={erroForm} />

      <CabecalhoSecao titulo={`Faixas, da primeira à última`} contador={faixas.length} formulario semMargem />
      {faixas.map((faixa, i) => {
        const graus = Number(faixa.graus) || 0;
        return (
          <Cartao key={`${faixa.id || 'nova'}-${i}`} style={styles.cartao}>
            <View style={styles.linhaTopo}>
              <Texto variante="headline">{`${i + 1}.`}</Texto>
              <SeloFaixa faixaOuGrau={faixa.nome.trim() ? textoDaFaixa(faixa, 0) : 'Nova faixa'} cor={faixa.cor} graus={graus} />
            </View>
            <CampoTexto
              rotulo="Nome"
              valor={faixa.nome}
              onAlterar={(nome) => alterar(i, { nome })}
              placeholder="Ex.: Roxa"
              ajuda={`Até ${LIMITES_ESTRUTURA.nome.maximo} letras.`}
            />
            <Texto variante="subheadline" style={styles.rotulo}>Cor</Texto>
            <View style={styles.grade} accessibilityRole="radiogroup" accessibilityLabel={`Cor da faixa ${i + 1}`}>
              {CORES_FAIXA.map((cor) => (
                <Etiqueta key={cor} texto={ROTULO_COR[cor]} selecionada={faixa.cor === cor} onPress={() => alterar(i, { cor })} />
              ))}
            </View>
            <CampoTexto
              rotulo="Graus nesta faixa"
              valor={faixa.graus}
              onAlterar={(texto) => alterar(i, { graus: texto })}
              keyboardType="number-pad"
              ajuda={`De ${LIMITES_ESTRUTURA.graus.minimo} a ${LIMITES_ESTRUTURA.graus.maximo}. Use 0 se a faixa não tem graus.`}
            />
            <View style={styles.acoesFaixa}>
              <Botao titulo="Subir" variante="texto" compacto desabilitado={i === 0} onPress={() => mover(i, -1)} accessibilityLabel={`Subir a faixa ${i + 1}`} />
              <Botao titulo="Descer" variante="texto" compacto desabilitado={i === faixas.length - 1} onPress={() => mover(i, 1)} accessibilityLabel={`Descer a faixa ${i + 1}`} />
              <Botao
                titulo="Remover"
                variante="texto"
                compacto
                onPress={() => setFaixas((atual) => atual.filter((_, j) => j !== i))}
                accessibilityLabel={`Remover a faixa ${i + 1}`}
              />
            </View>
          </Cartao>
        );
      })}

      <View style={styles.acoes}>
        <Botao
          titulo="Adicionar faixa"
          icone={IconeMais}
          variante="secundario"
          desabilitado={faixas.length >= LIMITES_ESTRUTURA.faixas.maximo}
          onPress={adicionar}
        />
        <Texto variante="footnote" cor="texto2">
          Renomear uma faixa não muda a graduação de quem já está nela. Se remover uma faixa em que há alunos, eles
          continuam com o texto da graduação, sem a barra de progresso, até a próxima graduação.
        </Texto>
        {personalizada ? (
          <Botao titulo="Restaurar padrão desta modalidade" variante="texto" onPress={handleRestaurar} carregando={restaurando} desabilitado={salvando} />
        ) : null}
      </View>
    </Tela>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: Espacamento.padrao },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacamento.pequeno, marginBottom: Espacamento.padrao },
  cartao: { marginBottom: Espacamento.padrao, gap: Espacamento.pequeno },
  linhaTopo: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.medio, marginBottom: Espacamento.pequeno },
  rotulo: { marginBottom: Espacamento.minimo },
  acoesFaixa: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacamento.pequeno },
  acoes: { gap: Espacamento.padrao, marginTop: Espacamento.padrao },
});
