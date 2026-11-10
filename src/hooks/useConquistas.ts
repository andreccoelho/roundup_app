// Detecta conquistas do aluno ao abrir a Home (RELATORIO_UI_UX.md, UX-16/R18): compara o estado
// atual (nível, faixa, medalhas) com o último estado salvo LOCALMENTE (AsyncStorage, por usuário)
// e devolve a fila de conquistas novas. Nada é gravado no Firebase.
//
// Primeira vez neste aparelho: só grava o estado, sem celebrar (senão todo aluno antigo veria
// todas as conquistas de uma vez na primeira abertura).
//
// Medalhas: só as de treinos e sequência — as de graduação dependem de `graduacoes`, que a Home
// não lê (ler exigiria uma consulta nova; ver docs/DECISOES_PENDENTES.md R-09). Subida de faixa
// vem do próprio `usuario.faixaOuGrau`.
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NAO_SE_APLICA, SEM_GRADUACAO } from '../constants/graduacoes';
import type { Conquista } from '../components/ui/MomentoConquista';
import type { MedalhaComEstado } from '../utils/gamificacao';

interface Estado {
  nivel: number;
  faixa: string;
  // RF25: graduação por modalidade — a celebração vale para qualquer uma. Ausente em estados salvos
  // por versões antigas (só tinham `faixa`): nesse caso só regrava, sem celebrar.
  graduacoes?: Record<string, string>;
  medalhas: string[];
}

interface Entrada {
  usuarioId?: string;
  nivel?: number;
  faixa?: string;
  graduacoes?: Record<string, string>;
  medalhas?: MedalhaComEstado[];
  // Só compara quando os dados secundários já chegaram (evita "subir" de 1 para N no carregamento).
  pronto: boolean;
}

// "Sem graduação" / "Não se aplica" não são conquistas.
const ehGraduacaoReal = (grau: string) => grau !== '' && grau !== SEM_GRADUACAO && grau !== NAO_SE_APLICA;

function graduacoesLimpas(graduacoes?: Record<string, string>): Record<string, string> {
  const limpas: Record<string, string> = {};
  for (const [m, g] of Object.entries(graduacoes ?? {})) limpas[m] = (g ?? '').trim();
  return limpas;
}

const chave = (usuarioId: string) => `roundup:conquistas:${usuarioId}`;

export function useConquistas({ usuarioId, nivel, faixa, graduacoes, medalhas, pronto }: Entrada) {
  const [fila, setFila] = useState<Conquista[]>([]);

  useEffect(() => {
    if (!pronto || !usuarioId || nivel === undefined) return;
    let ativo = true;
    const atual: Estado = {
      nivel,
      faixa: (faixa ?? '').trim(),
      graduacoes: graduacoesLimpas(graduacoes),
      medalhas: (medalhas ?? []).filter((m) => m.conquistada && m.tipo !== 'graduacoes').map((m) => m.id),
    };

    (async () => {
      let anterior: Estado | null = null;
      try {
        const salvo = await AsyncStorage.getItem(chave(usuarioId));
        anterior = salvo ? (JSON.parse(salvo) as Estado) : null;
      } catch {
        anterior = null;
      }

      const novas: Conquista[] = [];
      if (anterior) {
        if (atual.nivel > anterior.nivel) {
          novas.push({ tipo: 'nivel', valor: atual.nivel, rotulo: `Você chegou ao nível ${atual.nivel}.` });
        }
        if (anterior.graduacoes) {
          for (const [modalidade, grau] of Object.entries(atual.graduacoes ?? {})) {
            if (grau !== anterior.graduacoes[modalidade] && ehGraduacaoReal(grau)) {
              novas.push({ tipo: 'faixa', valor: grau, rotulo: `Graduação em ${modalidade} registrada pelo seu professor.` });
            }
          }
        } else if (atual.faixa && atual.faixa !== anterior.faixa) {
          novas.push({ tipo: 'faixa', valor: atual.faixa, rotulo: 'Graduação registrada pelo seu professor.' });
        }
        for (const id of atual.medalhas) {
          if (anterior.medalhas.includes(id)) continue;
          const m = medalhas?.find((x) => x.id === id);
          if (m) novas.push({ tipo: 'medalha', valor: m.quantidade, rotulo: m.rotulo, icone: m.tipo });
        }
      }

      try {
        await AsyncStorage.setItem(chave(usuarioId), JSON.stringify(atual));
      } catch {
        // Sem armazenamento local (ex.: navegação privada no web): só não celebra depois.
      }
      if (ativo && novas.length > 0) setFila(novas);
    })();

    return () => {
      ativo = false;
    };
  }, [pronto, usuarioId, nivel, faixa, graduacoes, medalhas]);

  const proxima = useCallback(() => setFila((f) => f.slice(1)), []);

  return { conquista: fila[0] ?? null, restantes: fila.length, proxima };
}
