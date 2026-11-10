// RF06: seletor de graduação de UMA modalidade (faixas em chips + graus no Jiu-Jitsu).
// Modalidade sem graduação (Boxe, MMA...) mostra só "Não se aplica", sem escolha.
import { StyleSheet, View } from 'react-native';
import { Espacamento, useTema } from '../../theme';
import {
  EscolhaGraduacao,
  GRAUS,
  MODALIDADES_COM_GRAU,
  FAIXAS_POR_MODALIDADE,
  NAO_SE_APLICA,
  SEM_GRADUACAO,
  modalidadeSemGraduacao,
  textoGraduacao,
} from '../../constants/graduacoes';
import { IconeFaixa } from '../icones';
import Etiqueta from './Etiqueta';
import SeloFaixa from './SeloFaixa';
import Texto from './Texto';

interface GraduacaoSelectorProps {
  modalidade: string;
  escolha: EscolhaGraduacao;
  onAlterar: (escolha: EscolhaGraduacao) => void;
  erro?: string;
}

export default function GraduacaoSelector({ modalidade, escolha, onAlterar, erro }: GraduacaoSelectorProps) {
  const { cores } = useTema();
  const semGraduacao = modalidadeSemGraduacao(modalidade);
  const faixas = FAIXAS_POR_MODALIDADE[modalidade] ?? [];
  const temGrau = MODALIDADES_COM_GRAU.includes(modalidade);
  const faixaComGrau = escolha.faixa !== '' && escolha.faixa !== SEM_GRADUACAO;
  const texto = textoGraduacao(modalidade, escolha);

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
            <Etiqueta
              texto={SEM_GRADUACAO}
              selecionada={escolha.faixa === SEM_GRADUACAO}
              onPress={() => onAlterar({ faixa: SEM_GRADUACAO, grau: 0 })}
            />
            {faixas.map((faixa) => (
              <Etiqueta
                key={faixa}
                texto={faixa}
                selecionada={escolha.faixa === faixa}
                onPress={() => onAlterar({ faixa, grau: escolha.faixa === faixa ? escolha.grau : 0 })}
              />
            ))}
          </View>
          {temGrau && faixaComGrau ? (
            <View style={styles.grade}>
              <Etiqueta texto="Sem grau" selecionada={escolha.grau === 0} onPress={() => onAlterar({ ...escolha, grau: 0 })} />
              {GRAUS.map((g) => (
                <Etiqueta key={g} texto={`${g}º grau`} selecionada={escolha.grau === g} onPress={() => onAlterar({ ...escolha, grau: g })} />
              ))}
            </View>
          ) : null}
        </>
      )}

      {texto && !semGraduacao ? (
        <View style={styles.previa}>
          <SeloFaixa faixaOuGrau={texto} />
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
