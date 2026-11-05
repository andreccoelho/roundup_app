import {
  Raios as RaiosNovos,
  Alturas as AlturasNovas,
  DuracaoAnimacao as DuracaoNova,
} from './tokens';
import { RaiosLegado, AlturasLegado, DuracaoLegado } from './legado';

export {
  CoresClaro,
  CoresEscuro,
  CorFoco,
  CoresFaixa,
  FamiliaFonte,
  Tipografia,
  Espacamento,
  LarguraMaxima,
  Mola,
} from './tokens';
export type { PaletaCores, NomeCor } from './tokens';
export { ProvedorTema, useTema, criarEstilos } from './tema';
export type { Esquema } from './tema';

// Os nomes antigos abaixo saem na fase 6 do redesign (ver legado.ts)
export { Cores, TamanhoFonte, Sombras, Geometria } from './legado';
export const Raios = { ...RaiosNovos, ...RaiosLegado };
export const Alturas = { ...AlturasNovas, ...AlturasLegado };
export const DuracaoAnimacao = { ...DuracaoNova, ...DuracaoLegado };
