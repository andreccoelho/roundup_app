// Tema claro/escuro (docs/DESIGN.md). Segue a aparência do aparelho (useColorScheme, que no web
// lê prefers-color-scheme); a Galeria pode forçar um dos dois para conferir os componentes.
//
// Componentes nunca importam uma paleta: leem `useTema().cores` para cores dinâmicas e montam os
// estilos com `criarEstilos`, que gera um StyleSheet por tema uma única vez e devolve o do tema
// atual a cada render.
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, useColorScheme, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import { CoresClaro, CoresEscuro, type PaletaCores } from './tokens';

export type Esquema = 'claro' | 'escuro';

interface ValorTema {
  esquema: Esquema;
  escuro: boolean;
  cores: PaletaCores;
  // Só a Galeria usa: null volta a seguir o aparelho.
  forcarEsquema: (esquema: Esquema | null) => void;
}

const TemaContext = createContext<ValorTema | null>(null);

export function ProvedorTema({ children }: { children: ReactNode }) {
  const doSistema = useColorScheme();
  const [forcado, setForcado] = useState<Esquema | null>(null);
  const esquema: Esquema = forcado ?? (doSistema === 'dark' ? 'escuro' : 'claro');
  const valor = useMemo<ValorTema>(
    () => ({ esquema, escuro: esquema === 'escuro', cores: esquema === 'escuro' ? CoresEscuro : CoresClaro, forcarEsquema: setForcado }),
    [esquema],
  );
  return <TemaContext.Provider value={valor}>{children}</TemaContext.Provider>;
}

// Fora do provedor (não deveria acontecer no app) cai no tema do sistema, sem quebrar.
export function useTema(): ValorTema {
  const contexto = useContext(TemaContext);
  const doSistema = useColorScheme();
  if (contexto) return contexto;
  const escuro = doSistema === 'dark';
  return { esquema: escuro ? 'escuro' : 'claro', escuro, cores: escuro ? CoresEscuro : CoresClaro, forcarEsquema: () => {} };
}

// Uso: `const useEstilos = criarEstilos((c) => ({ raiz: { backgroundColor: c.fundo } }));` no
// módulo e `const styles = useEstilos();` no componente.
// RN 0.88 (SDK 58) removeu o tipo StyleSheet.NamedStyles; o equivalente é um mapa de nome → estilo.
type EstilosNomeados<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export function criarEstilos<T extends EstilosNomeados<T>>(fabrica: (cores: PaletaCores, escuro: boolean) => T) {
  const cache: Partial<Record<Esquema, T>> = {};
  return function useEstilos(): T {
    const { esquema, cores, escuro } = useTema();
    const existente = cache[esquema];
    if (existente) return existente;
    const criado = StyleSheet.create(fabrica(cores, escuro));
    cache[esquema] = criado;
    return criado;
  };
}
