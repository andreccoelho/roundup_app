// RF33: a cópia da estrutura padrão e do casamento de texto nas functions (usada pela migração,
// scripts/migrar-faixas.cjs) dá o mesmo resultado que o app (src/utils/faixas.ts).
import { casarTexto, estruturaPadrao as padraoFunctions } from '../../functions/src/faixasRegras';
import { estruturaPadrao as padraoApp, resolverGraduacao } from '../../src/utils/faixas';
import { MODALIDADES } from '../../src/constants/modalidades';

describe('faixasRegras (RF33)', () => {
  test('estrutura padrão igual à do app em todas as modalidades', () => {
    for (const m of MODALIDADES) expect(padraoFunctions(m)).toEqual(padraoApp(m));
  });

  test('casamento do texto livre igual ao do app', () => {
    const textos = ['Faixa azul, 2º grau', 'faixa ROXA', 'Marrom 1 grau', 'Kruang 5', 'Faixa preta, 6º grau', 'Azulada', ''];
    for (const texto of textos) {
      const app = resolverGraduacao(padraoApp('Jiu-Jitsu'), null, texto);
      const fn = casarTexto(padraoFunctions('Jiu-Jitsu'), texto);
      expect(fn ? { id: fn.faixa.id, grau: fn.grau } : null).toEqual(app ? { id: app.faixa.id, grau: app.grau } : null);
    }
  });
});
