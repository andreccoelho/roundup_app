// RF06: seletor de graduação de UMA modalidade (faixas em chips + graus da faixa escolhida).
// Modalidade sem graduação (Boxe, MMA...) mostra só "Não se aplica", sem escolha.
// RF33, RF25: `faixas` é a estrutura do responsável (registro de graduação); sem ela, a estrutura
// padrão (cadastro do aluno). A escolha continua guardando o NOME da faixa e o grau.
import { StyleSheet, View } from 'react-native';
import { Espacamento, useTema } from '../../theme';
import { EscolhaGraduacao, NAO_SE_APLICA, SEM_GRADUACAO } from '../../constants/graduacoes';
import { estruturaPadrao, textoDaFaixa } from '../../utils/faixas';
import type { FaixaConfig } from '../../types';
import { IconeFaixa } from '../icones';
import Etiqueta from './Etiqueta';
import SeloFaixa from './SeloFaixa';
import Texto from './Texto';

interface GraduacaoSelectorProps {
  modalidade: string;
  escolha: EscolhaGraduacao;
  onAlterar: (escolha: EscolhaGraduacao) => void;
  erro?: string;
  faixas?: FaixaConfig[];
  // Esconde a opção "Sem graduação" (no registro de graduação ela não faz sentido)
  semOpcaoSemGraduacao?: boolean;
}

export default function GraduacaoSelector({ modalidade, escolha, onAlterar, erro, faixas: faixasDoResponsavel, semOpcaoSemGraduacao }: GraduacaoSelectorProps) {
  const { cores } = useTema();
  const faixas = faixasDoResponsavel ?? estruturaPadrao(modalidade);
  const semGraduacao = faixas.length === 0;
  const selecionada = faixas.find((f) => f.nome === escolha.faixa);
  const texto = escolha.faixa === SEM_GRADUACAO ? SEM_GRADUACAO : selecionada ? textoDaFaixa(selecionada, escolha.grau) : '';

  return (
    <View style={styles.container} role="group" aria-label={`Graduação em ${modalidade}`}>
      <View style={styles.cabecalho}>
        <IconeFaixa tamanho={18} cor={cores.texto2} />
        <Texto variante="subheadline" cabecalho={false}>
          Graduação em {modalidade}
        </Texto>
      </View>

      {semGraduacao ? (
        <Etiqueta texto={NAO_SE_APLICA} modo="unico" selecionada onPress={() => {}} />
      ) : (
        <>
          <View style={styles.grade}>
            {semOpcaoSemGraduacao ? null : (
              <Etiqueta
                texto={SEM_GRADUACAO}
                selecionada={escolha.faixa === SEM_GRADUACAO}
                onPress={() => onAlterar({ faixa: SEM_GRADUACAO, grau: 0 })}
              />
            )}
            {faixas.map((faixa) => (
              <Etiqueta
                key={faixa.id}
                texto={faixa.nome}
                selecionada={escolha.faixa === faixa.nome}
                onPress={() => onAlterar({ faixa: faixa.nome, grau: escolha.faixa === faixa.nome ? escolha.grau : 0 })}
              />
            ))}
          </View>
          {selecionada && selecionada.graus > 0 ? (
            <View style={styles.grade}>
              <Etiqueta texto="Sem grau" selecionada={escolha.grau === 0} onPress={() => onAlterar({ ...escolha, grau: 0 })} />
              {Array.from({ length: selecionada.graus }, (_, i) => i + 1).map((g) => (
                <Etiqueta key={g} texto={`${g}º grau`} selecionada={escolha.grau === g} onPress={() => onAlterar({ ...escolha, grau: g })} />
              ))}
            </View>
          ) : null}
        </>
      )}

      {texto && !semGraduacao ? (
        <View style={styles.previa}>
          <SeloFaixa faixaOuGrau={texto} cor={selecionada?.cor} graus={selecionada ? escolha.grau : undefined} />
        </View>
      ) : null}
      {erro ? (
        <Texto variante="subheadline" cor="perigo" accessibilityRole="alert" accessibilityLiveRegion="polite">
          {erro}
        </Texto>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Espacamento.padrao, gap: Espacamento.pequeno },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.pequeno },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacamento.pequeno },
  previa: { marginTop: Espacamento.minimo },
});
