# Respostas sintéticas do formulário (Apêndice C)

Scripts usados para gerar e enviar as 65 respostas sintéticas do formulário "Todo mundo começa. Poucos continuam.". Essas respostas servem só para testar o instrumento e a análise. Não são dados de pesquisa e não entram nos resultados do TCC.

| Arquivo | Função |
| --- | --- |
| `gerar_respostas.py` | Gera as 65 respostas a partir de bancos de respostas curtas e regras por perfil e faixa etária, com semente fixa `26102026`. A saída (`respostas.json`) é reproduzível. |
| `enviar_respostas.gs` | Google Apps Script com as mesmas 65 respostas embutidas (`DADOS`). `validarRespostas` confere cada uma contra as alternativas do formulário; `enviarRespostas` registra tudo via `FormApp.createResponse` e se recusa a rodar se a cópia já tiver respostas sintéticas. |

## Como foi feito

- Ferramenta: Claude (Anthropic), modelo configurado `claude-opus-5-5`, sessão de 26/10/2026.
- Referência de estilo: as 6 respostas reais de 18 e 19/09/2026.
- Envio: editor de scripts da "Cópia de RoundUp", sem planilha vinculada, em 26/10/2026, das 13h12 às 13h14. Não passou pelo link público.
- Identificação: o campo de contato de cada resposta traz `sintetico-<ID>` (A01 a A32, E01 a E23, P01 a P10).

| Perfil | Respostas |
| --- | --- |
| Treino atualmente | 32 |
| Já treinei, mas parei | 23 |
| Sou professor ou instrutor (4 donos de academia) | 10 |

## Reprodução

```bash
python3 gerar_respostas.py   # gera respostas.json
```

O `respostas.json` gerado é idêntico ao array `DADOS` de `enviar_respostas.gs`. As chaves de cada resposta são o índice do item no formulário (`form.getItems()`). Se o formulário mudar de ordem, os índices precisam ser revistos.
