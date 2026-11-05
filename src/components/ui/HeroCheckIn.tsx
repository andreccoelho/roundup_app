// HeroCheckIn — o "próximo treino" como peça central da Home do Aluno (RF13, RF14, RN08, RNF01).
// Horário em placar grande e um único botão de 56px, largura total, cujo lugar é ocupado pelos 3
// estados — sempre na mesma área, legíveis sem ler texto (forma, ícone e cor diferentes):
//   - disponível: CTA em acento "Fazer check-in" (o acento da tela);
//   - fora da janela: placa contornada com cadeado + contagem regressiva até abrir (ou
//     "Check-in encerrado");
//   - feito: placa verde com ✓ "Treino registrado".
// Na transição para "feito": punch (escala) + flash verde + haptic. Com reduce motion, só o
// haptic e a troca de estado.
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, View } from 'react-native';
import { Alturas, Cores, DuracaoAnimacao, Espacamento, Raios, TamanhoFonte } from '../../theme';
import { DRIVER_NATIVO } from '../../utils/animacao';
import type { EstadoCheckIn } from '../../utils/statusCheckIn';
import { formatarDuracao, formatarHora, rotuloDia } from '../../utils/apresentacao';
import { hapticaImpacto, hapticaSucesso } from '../../utils/haptica';
import { useMovimentoReduzido } from '../../hooks/useMovimentoReduzido';
import { estiloAnelFoco, estiloSemOutline, useFocoVisivel } from '../../hooks/useFocoVisivel';
import { IconeCadeado, IconeCheck, IconeLuva } from '../icones';
import Cartao from './Cartao';
import TexturaLona from './TexturaLona';
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

const FILETE: Record<EstadoCheckIn, string> = {
  disponivel: Cores.acento,
  foraDaJanela: Cores.linhaForte,
  realizado: Cores.sucesso,
};

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
  const foco = useFocoVisivel();
  const estadoAnterior = useRef(estado);
  const escala = useRef(new Animated.Value(1)).current;
  const flash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (estadoAnterior.current !== 'realizado' && estado === 'realizado') {
      hapticaSucesso();
      if (!reduzido) {
        escala.setValue(1);
        flash.setValue(0);
        Animated.parallel([
          Animated.sequence([
            Animated.timing(escala, { toValue: 1.06, duration: DuracaoAnimacao.rapida, useNativeDriver: DRIVER_NATIVO }),
            Animated.spring(escala, { toValue: 1, friction: 4, tension: 120, useNativeDriver: DRIVER_NATIVO }),
          ]),
          Animated.sequence([
            Animated.timing(flash, { toValue: 1, duration: 80, useNativeDriver: DRIVER_NATIVO }),
            Animated.timing(flash, { toValue: 0, duration: DuracaoAnimacao.lenta, useNativeDriver: DRIVER_NATIVO }),
          ]),
        ]).start();
      }
    }
    estadoAnterior.current = estado;
  }, [estado, reduzido, escala, flash]);

  const antesDeAbrir = agora < janelaInicio;
  const descricaoEstado =
    estado === 'realizado'
      ? 'Check-in feito'
      : estado === 'disponivel'
        ? `Check-in aberto até ${formatarHora(janelaFim)}`
        : antesDeAbrir
          ? `Check-in abre em ${formatarDuracao(janelaInicio.getTime() - agora.getTime())}`
          : 'Check-in encerrado';

  return (
    <Animated.View style={{ transform: [{ scale: escala }] }}>
      <Cartao corteDiagonal corFilete={FILETE[estado]} semPadding>
        <TexturaLona opacidade={0.05} />
        <View style={styles.conteudo}>
          <View style={styles.topo} accessible accessibilityLabel={`Próximo treino: ${nomeTurma}, ${rotuloDia(inicio)} às ${formatarHora(inicio)}${professor ? `, com ${professor}` : ''}`}>
            <View style={styles.horario}>
              <Texto variante="caption">{rotuloDia(inicio)}</Texto>
              <Texto variante="numeroGrande">{formatarHora(inicio)}</Texto>
            </View>
            <View style={styles.textos}>
              <Texto variante="caption" cor="texto3">
                Próximo treino
              </Texto>
              <Texto variante="headline" numberOfLines={2}>
                {nomeTurma}
              </Texto>
              {professor ? <Texto variante="subheadline">{`com ${professor}`}</Texto> : null}
            </View>
          </View>

          <View style={styles.area} accessibilityLiveRegion="polite">
            {estado === 'disponivel' ? (
              <Pressable
                onPress={() => {
                  hapticaImpacto();
                  onCheckIn();
                }}
                disabled={carregando}
                accessibilityRole="button"
                accessibilityLabel={carregando ? 'Enviando check-in' : `Fazer check-in em ${nomeTurma}`}
                accessibilityState={{ disabled: Boolean(carregando), busy: Boolean(carregando) }}
                style={({ pressed }) => [styles.placa, styles.placaCta, pressed && styles.pressionado, estiloSemOutline, foco.focado && estiloAnelFoco]}
                {...foco.propsFoco}
              >
                {carregando ? (
                  <ActivityIndicator color={Cores.sobreCor} />
                ) : (
                  <>
                    <IconeLuva tamanho={24} cor={Cores.sobreCor} espessura={2} />
                    <Texto variante="footnote" cor="sobreTint" style={styles.rotuloCta} cabecalho={false}>
                      Fazer check-in
                    </Texto>
                  </>
                )}
              </Pressable>
            ) : estado === 'foraDaJanela' ? (
              <View style={[styles.placa, styles.placaFechada]} accessible accessibilityLabel={descricaoEstado}>
                <IconeCadeado tamanho={20} cor={Cores.texto2} />
                <Texto variante="footnote" cor="texto2" cabecalho={false}>
                  {antesDeAbrir ? `Abre em ${formatarDuracao(janelaInicio.getTime() - agora.getTime())}` : 'Check-in encerrado'}
                </Texto>
              </View>
            ) : (
              <View style={[styles.placa, styles.placaFeita]} accessible accessibilityLabel="Check-in feito. Treino registrado.">
                <Animated.View style={[styles.flash, { opacity: flash }]} />
                <IconeCheck tamanho={24} cor={Cores.sobreCor} espessura={2.5} />
                <Texto variante="footnote" cor="sobreTint" cabecalho={false}>
                  Treino registrado
                </Texto>
              </View>
            )}
            {estado === 'disponivel' ? (
              <Texto variante="subheadline" cor="texto3" style={styles.nota}>
                {descricaoEstado}
              </Texto>
            ) : null}
          </View>
        </View>
      </Cartao>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  conteudo: { padding: Espacamento.padrao, paddingTop: Espacamento.padrao + 2, paddingBottom: Espacamento.grande },
  topo: { flexDirection: 'row', gap: Espacamento.padrao, alignItems: 'flex-end' },
  horario: { minWidth: 104 },
  textos: { flex: 1, paddingBottom: Espacamento.minimo, gap: 2 },
  area: { marginTop: Espacamento.padrao },
  placa: {
    minHeight: Alturas.botaoHero,
    borderRadius: Raios.vivo,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacamento.pequeno,
    paddingHorizontal: Espacamento.padrao,
    overflow: 'hidden',
  },
  placaCta: { backgroundColor: Cores.acento },
  rotuloCta: { fontSize: TamanhoFonte.lg, lineHeight: 24 },
  placaFechada: { borderWidth: 1.5, borderColor: Cores.linhaForte, borderStyle: 'dashed' },
  placaFeita: { backgroundColor: Cores.sucesso },
  flash: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Cores.texto },
  pressionado: { opacity: 0.85 },
  nota: { marginTop: Espacamento.pequeno, textAlign: 'center' },
});
