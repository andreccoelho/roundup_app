// HeroCheckIn — o "próximo treino" como cartão de destaque da Home do Aluno (RF13, RF14, RN08,
// RNF01). Horário em número grande, nome da turma e, na mesma área, um dos 3 estados — legíveis sem
// ler texto (forma, ícone e cor diferentes):
//   - disponível: botão cheio no tint, em cápsula, "Fazer check-in" (a ação principal da tela);
//   - fora da janela: cápsula cinza com cadeado + contagem regressiva até abrir (ou "encerrado");
//   - feito: ✓ verde preenchido "Treino registrado", que entra com uma mola curta.
// Na transição para "feito": haptic de sucesso e o ✓ crescendo com mola. Com reduce motion, só o
// haptic e a troca de estado.
import { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { criarEstilos, Espacamento, Mola, Raios, useTema } from '../../theme';
import { DRIVER_NATIVO } from '../../utils/animacao';
import type { EstadoCheckIn } from '../../utils/statusCheckIn';
import { formatarDuracao, formatarHora, rotuloDia } from '../../utils/apresentacao';
import { hapticaImpacto, hapticaSucesso } from '../../utils/haptica';
import { useMovimentoReduzido } from '../../hooks/useMovimentoReduzido';
import { IconeCadeado, IconeCheckCirculo, IconeLuva } from '../icones';
import Botao from './Botao';
import Cartao from './Cartao';
import Texto from './Texto';

interface HeroCheckInProps {
  nomeTurma: string;
  inicio: Date;
  janelaInicio: Date;
  janelaFim: Date;
  estado: EstadoCheckIn;
  professor?: string;
  carregando?: boolean;
  onCheckIn: () => void;
}

function useAgora(ativo: boolean): Date {
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    if (!ativo) return;
    const id = setInterval(() => setAgora(new Date()), 15000);
    return () => clearInterval(id);
  }, [ativo]);
  return agora;
}

export default function HeroCheckIn({ nomeTurma, inicio, janelaInicio, janelaFim, estado, professor, carregando, onCheckIn }: HeroCheckInProps) {
  const reduzido = useMovimentoReduzido();
  const agora = useAgora(estado === 'foraDaJanela');
  const { cores } = useTema();
  const styles = useEstilos();
  const estadoAnterior = useRef(estado);
  const escalaCheck = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (estadoAnterior.current !== 'realizado' && estado === 'realizado') {
      hapticaSucesso();
      if (!reduzido) {
        escalaCheck.setValue(0.4);
        Animated.spring(escalaCheck, { toValue: 1, ...Mola, useNativeDriver: DRIVER_NATIVO }).start();
      }
    }
    estadoAnterior.current = estado;
  }, [estado, reduzido, escalaCheck]);

  const antesDeAbrir = agora < janelaInicio;
  const textoFechado = antesDeAbrir ? `Abre em ${formatarDuracao(janelaInicio.getTime() - agora.getTime())}` : 'Check-in encerrado';

  return (
    <Cartao destaque>
      <View
        accessible
        accessibilityLabel={`Próximo treino: ${nomeTurma}, ${rotuloDia(inicio)} às ${formatarHora(inicio)}${professor ? `, com ${professor}` : ''}`}
      >
        <Texto variante="footnote">Próximo treino</Texto>
        <View style={styles.horario}>
          <Texto variante="numeroGrande">{formatarHora(inicio)}</Texto>
          <Texto variante="headline" cor="texto2">
            {rotuloDia(inicio)}
          </Texto>
        </View>
        <Texto variante="title3" numberOfLines={2} cabecalho={false}>
          {nomeTurma}
        </Texto>
        {professor ? <Texto variante="subheadline">{`com ${professor}`}</Texto> : null}
      </View>

      <View style={styles.area} accessibilityLiveRegion="polite">
        {estado === 'disponivel' ? (
          <>
            <Botao
              titulo="Fazer check-in"
              icone={IconeLuva}
              carregando={carregando}
              accessibilityLabel={carregando ? 'Enviando check-in' : `Fazer check-in em ${nomeTurma}`}
              onPress={() => {
                hapticaImpacto();
                onCheckIn();
              }}
            />
            <Texto variante="footnote" alinhamento="center" style={styles.nota}>
              {`Check-in aberto até ${formatarHora(janelaFim)}`}
            </Texto>
          </>
        ) : estado === 'foraDaJanela' ? (
          <View style={[styles.placa, styles.placaFechada]} accessible accessibilityLabel={textoFechado}>
            <IconeCadeado tamanho={18} cor={cores.texto2} />
            <Texto variante="headline" cor="texto2">
              {textoFechado}
            </Texto>
          </View>
        ) : (
          <View style={styles.placa} accessible accessibilityLabel="Check-in feito. Treino registrado.">
            <Animated.View style={{ transform: [{ scale: escalaCheck }] }}>
              <IconeCheckCirculo tamanho={30} cor={cores.sucesso} preenchido />
            </Animated.View>
            <Texto variante="headline">Treino registrado</Texto>
          </View>
        )}
      </View>
    </Cartao>
  );
}

const useEstilos = criarEstilos((c) => ({
  horario: { flexDirection: 'row', alignItems: 'baseline', gap: Espacamento.pequeno, marginTop: 2, marginBottom: Espacamento.minimo },
  area: { marginTop: Espacamento.padrao },
  placa: {
    minHeight: 50,
    borderRadius: Raios.capsula,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacamento.pequeno,
    paddingHorizontal: Espacamento.padrao,
  },
  placaFechada: { backgroundColor: c.preenchimento },
  nota: { marginTop: Espacamento.pequeno },
}));
