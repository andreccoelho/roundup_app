"""Analise descritiva do survey RoundUp (ideação).
Uso: python3 scripts/analise_survey.py "caminho/RoundUp (respostas).xlsx"
Gera: dados/survey_anonimizado.csv, dados/notas_por_ideia.csv,
      figuras/survey-notas-ideias.pdf e capitulos/relatorio/tab-survey.tex
Dados pessoais (e-mail, telefone, data/hora) sao descartados (LGPD).
"""
import sys, csv, statistics as st, os
import openpyxl
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
plt.rcParams["font.family"] = "DejaVu Sans"

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
wb = openpyxl.load_workbook(sys.argv[1], data_only=True)
ws = wb.active
rows = list(ws.iter_rows(values_only=True))
head, data = rows[0], rows[1:]

# Ideias canonicas (I01..I13) e o trecho do enunciado que as identifica
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
PERFIS = {"Treino atualmente": "Praticante", "Já treinei, mas parei": "Ex-praticante"}
# blocos de colunas por perfil (o formulario usa secoes condicionais)
def bloco(perfil):
    if perfil == "Praticante": return range(39, 51)
    if perfil == "Ex-praticante": return range(68, 80)
    return range(15, 24)  # Professor

def col_da_ideia(perfil, chave):
    chaves = chave if isinstance(chave, tuple) else (chave,)
    for c in bloco(perfil):
        if any(k.lower() in head[c].lower() for k in chaves):
            return c
    return None

perfil_col = 4
notas = {i[0]: {"Praticante": [], "Ex-praticante": [], "Professor": []} for i in IDEIAS}
anon = []
for n, r in enumerate(data, 1):
    perfil = PERFIS.get(r[perfil_col], "Professor")
    linha = {"respondente": f"R{n:02d}", "perfil": perfil,
             "faixa_etaria": r[2], "genero": r[3]}
    for cod, nome, chave in IDEIAS:
        c = col_da_ideia(perfil, chave)
        v = r[c] if c is not None else None
        linha[cod] = "" if v is None else int(v)
        if v is not None: notas[cod][perfil].append(int(v))
    anon.append(linha)

os.makedirs(f"{BASE}/dados", exist_ok=True)
with open(f"{BASE}/dados/survey_anonimizado.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(anon[0].keys())); w.writeheader(); w.writerows(anon)

def fmt(x): return "--" if x is None else f"{x:.1f}".replace(".", ",")
def media(v): return st.mean(v) if v else None
def mediana(v): return st.median(v) if v else None

resumo = []
for cod, nome, _ in IDEIAS:
    p, e = notas[cod]["Praticante"], notas[cod]["Ex-praticante"]
    todos = p + e
    resumo.append((cod, nome, media(p), media(e), media(todos), mediana(todos), len(todos)))
with open(f"{BASE}/dados/notas_por_ideia.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f); w.writerow(["ideia","nome","media_praticante","media_ex","media_geral","mediana_geral","n"])
    for r in resumo: w.writerow([r[0], r[1]] + [("" if x is None else round(x,2)) for x in r[2:6]] + [r[6]])

# Tabela LaTeX
with open(f"{BASE}/capitulos/relatorio/tab-survey.tex", "w", encoding="utf-8") as f:
    f.write("% Gerado por scripts/analise_survey.py -- nao edite a mao\n")
    for cod, nome, mp, me, mg, md, n in resumo:
        f.write(f"    {cod} & {nome} & {fmt(mp)} & {fmt(me)} & {fmt(mg)} & {fmt(md)} & {n} \\\\\n")
    f.write("    \\bottomrule\n")

# Grafico (pontos por perfil; ordenado pela media geral)
ok = [r for r in resumo if r[6] > 0]
ok.sort(key=lambda r: r[4])
fig, ax = plt.subplots(figsize=(6.3, 4.6))
y = range(len(ok))
for i, r in enumerate(ok):
    vals = [v for v in (r[2], r[3]) if v is not None]
    ax.plot([min(vals), max(vals)], [i, i], color="#c3c2b7", lw=2, zorder=1)
ax.scatter([r[2] for r in ok], y, s=60, color="#2a78d6", label="Praticantes (n = 4)", zorder=3, edgecolor="white", linewidth=1.5, marker="o")
ax.scatter([r[3] for r in ok], y, s=60, color="#eb6834", label="Ex-praticantes (n = 2)", zorder=3, edgecolor="white", linewidth=1.5, marker="s")
ax.set_yticks(list(y)); ax.set_yticklabels([f"{r[0]} {r[1]}" for r in ok], fontsize=8)
ax.set_xlim(0.8, 5.2); ax.set_xticks([1,2,3,4,5])
ax.set_xlabel("Nota média (1 = pouco útil; 5 = muito útil)", fontsize=8)
ax.tick_params(axis="x", labelsize=8)
ax.grid(axis="x", color="#e6e5e0", lw=0.8); ax.set_axisbelow(True)
for s in ("top","right","left"): ax.spines[s].set_visible(False)
ax.legend(loc="upper left", fontsize=8, frameon=False)
fig.tight_layout()
fig.savefig(f"{BASE}/figuras/survey-notas-ideias.pdf")
for r in resumo: print(r)
