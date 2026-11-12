"""Analise descritiva das respostas SINTETICAS do RoundUp (teste do instrumento).

As respostas sinteticas foram geradas por script a partir de personas e
nao sao evidencia da percepcao de usuarios; esta analise so verifica o
formulario e o procedimento de analise.

Uso: python3 scripts/analise_personas.py dados/brutos/personas_ia_respostas.csv

Entrada: o CSV exportado do formulario aplicado as personas (mesmas colunas do
formulario dos usuarios reais). Le tambem dados/survey_anonimizado.csv (usuarios
reais, gerado por analise_survey.py) para a comparacao.

Gera:
  dados/personas_anonimizado.csv          uma linha por persona (sem data/hora)
  dados/notas_por_ideia_personas.csv      medias e medianas por ideia e perfil
  capitulos/relatorio/tab-personas.tex    linhas da Tabela de comparacao
  capitulos/relatorio/tab-dispersao.tex   linhas da Tabela de dispersao
"""
import sys, csv, statistics as st, os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

IDEIAS = [
 ("I01", "Pontos de experiência (XP)", "Pontos de experiência"),
 ("I02", "Check-in de presença", "check-in"),
 ("I03", "Contador de frequência", "Contador de dias"),
 ("I04", "Ofensiva (sequência)", "ofensiva"),
 ("I05", "Missões e desafios semanais", "Missões"),
 ("I06", "Ranking de frequência", "Ranking"),
 ("I07", "Medalhas por marcos", "Medalhas"),
 ("I08", "Barra de progresso da graduação", "Barra de progresso"),
 ("I09", "Histórico de presença e evolução", "Histórico"),
 ("I10", "Mural/feed da turma", "Mural"),
 ("I11", "Lembretes nos dias de treino", "Lembretes"),
 ("I12", "Alerta/mensagem após ausência", ("Alerta automático", "Mensagem automática")),
 ("I13", "Relatório da turma (professor)", "Relatório de frequência"),
]
PERFIS = {"Treino atualmente": "Praticante", "Já treinei, mas parei": "Ex-praticante",
          "Sou professor ou instrutor": "Professor"}


def bloco(perfil):
    if perfil == "Praticante": return range(39, 50)
    if perfil == "Ex-praticante": return range(68, 80)
    return range(15, 24)


with open(sys.argv[1], encoding="utf-8-sig") as f:
    linhas = list(csv.reader(f))
head, data = linhas[0], linhas[1:]


def col_da_ideia(perfil, chave):
    chaves = chave if isinstance(chave, tuple) else (chave,)
    for c in bloco(perfil):
        if any(k.lower() in head[c].lower() for k in chaves):
            return c
    return None


notas = {i[0]: {"Praticante": [], "Ex-praticante": [], "Professor": []} for i in IDEIAS}
anon = []
for n, r in enumerate(data, 1):
    perfil = PERFIS[r[4].strip()]
    ident = r[86].strip() or f"S{n:02d}"   # o formulario guarda o codigo da persona no campo de contato
    linha = {"persona": ident.replace("sintetico-", ""), "perfil": perfil,
             "faixa_etaria": r[2], "genero": r[3]}
    for cod, _, chave in IDEIAS:
        c = col_da_ideia(perfil, chave)
        v = r[c].strip() if c is not None else ""
        linha[cod] = int(v) if v else ""
        if v: notas[cod][perfil].append(int(v))
    anon.append(linha)

with open(f"{BASE}/dados/personas_anonimizado.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(anon[0].keys())); w.writeheader(); w.writerows(anon)

# --- usuarios reais (ja anonimizados) ---------------------------------
reais = {i[0]: [] for i in IDEIAS}
reais_linhas = []
with open(f"{BASE}/dados/survey_anonimizado.csv", encoding="utf-8") as f:
    for r in csv.DictReader(f):
        reais_linhas.append(r)
        for cod, _, _ in IDEIAS:
            if r[cod]: reais[cod].append(int(r[cod]))


def media(v): return st.mean(v) if v else None
def mediana(v): return st.median(v) if v else None
def fmt(x, sinal=False):
    if x is None: return "--"
    s = f"{x:+.1f}" if sinal else f"{x:.1f}"
    return s.replace(".", ",").replace("-", "$-$")


resumo = []
for cod, nome, _ in IDEIAS:
    p, e, pr = (notas[cod][k] for k in ("Praticante", "Ex-praticante", "Professor"))
    todos = p + e + pr
    alunos = p + e  # mesmo publico dos usuarios reais (sem professores)
    mr, mpa = media(reais[cod]), media(alunos)
    dif = (mpa - mr) if (mr is not None and mpa is not None) else None
    resumo.append(dict(cod=cod, nome=nome, prat=media(p), ex=media(e), prof=media(pr),
                       geral=media(todos), mediana=mediana(todos), n=len(todos),
                       alunos=mpa, reais=mr, dif=dif))

with open(f"{BASE}/dados/notas_por_ideia_personas.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["ideia", "nome", "media_praticante", "media_ex", "media_professor", "media_geral",
                "mediana_geral", "n", "media_alunos_personas", "media_reais", "diferenca"])
    for r in resumo:
        w.writerow([r["cod"], r["nome"]] + ["" if r[k] is None else round(r[k], 2)
                   for k in ("prat", "ex", "prof", "geral", "mediana")] + [r["n"]] +
                   ["" if r[k] is None else round(r[k], 2) for k in ("alunos", "reais", "dif")])

with open(f"{BASE}/capitulos/relatorio/tab-personas.tex", "w", encoding="utf-8") as f:
    f.write("% Gerado por scripts/analise_personas.py -- nao edite a mao\n")
    for r in resumo:
        f.write(f"    {r['cod']} & {r['nome']} & {fmt(r['prat'])} & {fmt(r['ex'])} & {fmt(r['prof'])}"
                f" & {fmt(r['alunos'])} & {fmt(r['reais'])} & {fmt(r['dif'], True)} \\\\\n")
    f.write("    \\bottomrule\n")

# --- dispersao: as personas respondem de forma mais homogenea? ---------
def notas_resp(linhas_):
    out = []
    for r in linhas_:
        v = [int(r[c]) for c, _, _ in IDEIAS if str(r[c]) != ""]
        if v: out.append(v)
    return out

def indicadores(grupo):
    todas = [x for v in grupo for x in v]
    return dict(n=len(grupo), dp_geral=st.pstdev(todas),
                dp_intra=st.mean(st.pstdev(v) for v in grupo),
                altas=100 * sum(x >= 4 for x in todas) / len(todas),
                baixas=100 * sum(x <= 2 for x in todas) / len(todas))

alunos_personas = [r for r in anon if r["perfil"] != "Professor"]
ind_r = indicadores(notas_resp(reais_linhas))
ind_p = indicadores(notas_resp(alunos_personas))

def pct(x): return f"{x:.0f}\\%"
with open(f"{BASE}/capitulos/relatorio/tab-dispersao.tex", "w", encoding="utf-8") as f:
    f.write("% Gerado por scripts/analise_personas.py -- nao edite a mao\n")
    f.write(f"    Respondentes (praticantes e ex-praticantes) & {ind_r['n']} & {ind_p['n']} \\\\\n")
    f.write(f"    Desvio-padrão de todas as notas & {fmt(ind_r['dp_geral'])} & {fmt(ind_p['dp_geral'])} \\\\\n")
    f.write(f"    Desvio-padrão médio dentro de cada respondente & {fmt(ind_r['dp_intra'])} & {fmt(ind_p['dp_intra'])} \\\\\n")
    f.write(f"    Notas 4 ou 5 & {pct(ind_r['altas'])} & {pct(ind_p['altas'])} \\\\\n")
    f.write(f"    Notas 1 ou 2 & {pct(ind_r['baixas'])} & {pct(ind_p['baixas'])} \\\\\n")
    f.write("    \\bottomrule\n")

for r in resumo: print(r["cod"], {k: (round(v, 2) if isinstance(v, float) else v) for k, v in r.items() if k not in ("cod", "nome")})
print("reais", ind_r); print("personas", ind_p)
