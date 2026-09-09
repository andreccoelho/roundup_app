# RoundUp

App React Native + Expo (SDK 57) com Firebase (Auth, Firestore, Storage). Veja
`docs/decisoes-tecnicas.md` para decisões e limitações conhecidas do modelo de segurança, e
`docs/roteiro-teste-ciclo1.md` para o roteiro de teste manual do Ciclo 1.

## Rodando o app

```
npm install
npm start
```

## Cloud Functions

`functions/` tem duas Cloud Functions (Admin SDK) que sincronizam `leitoresIds` das sessões
quando uma matrícula nasce, é cancelada ou reativada — ver `docs/decisoes-tecnicas.md` para o
motivo de existirem (o client sozinho não resolve, mesmo com as regras corretas). Deploy exige
o projeto Firebase estar no **plano Blaze** (pay-as-you-go); o gatilho em si tem cota gratuita
generosa. `functions/` tem seu próprio `package.json`/`node_modules` — rode `npm install`
dentro de `functions/` separadamente do `npm install` da raiz.

## Testes

- `npm run test:unit` — testes unitários puros (ex.: `src/utils/datas.test.ts`), rodam com Jest direto, sem emulador.
- `npm run test:rules` — suíte de regras de segurança do Firestore, roda contra o **emulador do Firestore** (`tests/rules/`).
- `npm run test:functions` — teste de integração das Cloud Functions (`tests/functions/`), roda contra os emuladores de **Functions + Firestore juntos** (compila `functions/` antes de subir os emuladores).

### Pré-requisitos do `npm run test:rules`

O emulador do Firestore (via `firebase-tools`) exige **Java 21 ou superior**. A suíte **não roda com Java 20** (nem versões anteriores) — o `firebase-tools` recusa a inicialização do emulador com uma mensagem explícita nesse caso.

Se sua máquina só tem uma versão mais antiga do Java instalada, não é necessário substituí-la: baixe um JDK 21 portátil (ex.: Eclipse Temurin) e extraia numa pasta local, sem alterar o `PATH` nem o `JAVA_HOME` do sistema. Este repositório usa `.tools/` para isso — a pasta está no `.gitignore` porque é um download local de ~200 MB específico da máquina, não reproduz clonando o repositório em outro lugar. Para rodar os testes apontando para esse JDK local (PowerShell):

```powershell
$env:JAVA_HOME = "<caminho completo até a pasta do JDK 21 extraído>"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
npm run test:rules
```

### Por que `test:rules` usa `--runInBand`

O script é `firebase emulators:exec --only firestore "jest tests/rules --runInBand"`. O
`--runInBand` (execução serial dos arquivos de teste, em vez do paralelismo padrão do Jest) é
**obrigatório**, não uma otimização: todos os arquivos em `tests/rules/` compartilham a mesma
instância do emulador do Firestore. Se o Jest rodar os arquivos em paralelo (padrão), o
`clearFirestore()` do `afterEach` de um arquivo pode apagar os dados que outro arquivo acabou
de semear, no meio da execução do teste — os testes falham de forma intermitente e
não-determinística. Rodando em série, cada arquivo termina (e limpa) antes do próximo começar.

### Pré-requisitos do `npm run test:functions`

Mesma exigência de Java 21+ do `test:rules` (o emulador do Firestore sobe junto). Além disso,
`functions/package.json` fixa `firebase-admin` em `13.10.0` de propósito: versões `14.x`
puxam uma versão de `jwks-rsa` que depende de um pacote ESM-only (`jose@6.x`), e o emulador de
Functions carrega o código via `require()` (CommonJS) — isso falha com `ERR_REQUIRE_ESM`. Se
for atualizar `firebase-admin`, confirme que a suíte ainda sobe antes de fixar uma versão mais
nova.

### Verificação de tipos

O app e a suíte de testes usam `tsconfig.json`s diferentes, porque o `tsconfig.json` do app
mira o bundler do Expo (Metro) — incompatível com o `require()` que o `ts-jest` precisa gerar
para rodar em Node puro. `tsconfig.json` (raiz) exclui `tests/` e `*.test.ts`; esses arquivos
são checados por `tsconfig.jest.json` (usado pelo `ts-jest`, configurado em `jest.config.js`).
Para checar os dois separadamente:

```
npx tsc --noEmit
npx tsc --noEmit -p tsconfig.jest.json
npm --prefix functions run build   # functions/ é um projeto TS separado, com seu próprio tsconfig.json
```
