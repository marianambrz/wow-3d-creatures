# Animal Controller API

Back end sem dependências (Node >= 22.13: `http` + `node:sqlite` + `node:crypto`).

```bash
node server.js     # http://localhost:3000
```
Variáveis: `PORT` (3000) · `DB_FILE` (animal.db) · `JWT_SECRET` (se vazio, gera `.secret` local) · `CORS_ORIGIN` (`*`; em produção use o domínio do front).

Rotas autenticadas usam `Authorization: Bearer <token>` (token vem de register/login, vale 7 dias).

| Área | Rota |
|---|---|
| Auth | `POST /api/auth/register` · `POST /api/auth/login` `{email,password}` · `GET /api/me` |
| Catálogo | `GET /api/species` · `GET /api/catalog?species=gato` (grupos, comportamentos, níveis/cores) |
| Medidor ao vivo | `POST /api/score` `{species, behaviors:[...]}` → pontuação, nível, cor, `gauge` 0–100 (não salva) |
| Animais | `GET/POST /api/animals` · `GET/PATCH/DELETE /api/animals/:id` (`species,name,tutorName,breed,birthDate,notes`) |
| Observações | `POST /api/animals/:id/observations` `{behaviors,note?}` · `GET .../status` · `GET .../history?days=30` |
| Vacinas | `GET/POST /api/animals/:id/vaccines` `{name,appliedOn,nextDose?}` (AAAA-MM-DD) · `DELETE /api/vaccines/:id` |
| Diário | `GET/POST /api/animals/:id/diary` `{text}` · `DELETE /api/diary/:id` |
| Assistente | `POST /api/animals/:id/assistant` → resposta por regras sobre a última observação |

Espécies: `cao, gato, ave, coelho, porquinho_da_india, cavalo, hamster`.

## Pontuação
Cada comportamento tem um peso (em `catalog.js`). A soma vira o nível:
`>= +3` Bem disposto · `0 a +2` Tranquilo · `-1 a -4` Atenção · `<= -5` Alerta.
Alguns sinais (respiração difícil; vômito, diarreia, tremores, dificuldade de movimento) forçam um nível mínimo
independentemente da soma. Toda resposta inclui o aviso de que não substitui avaliação veterinária.

## Pontos para revisar (eu não vi o código original)
- Pesos, faixas dos níveis e comportamentos por espécie são suposições minhas, ajustadas para bater com os prints (`+5` = "Bem disposto").
- Os campos de "Tutor e animal" abaixo do nome do animal não apareciam nos prints; adicionei raça, nascimento e observações.
- O assistente é um stub por regras: é o ponto para plugar um modelo de linguagem.
- Senhas com scrypt, tokens HS256 e limite de tentativas de login em memória. Em produção, defina `JWT_SECRET` e `CORS_ORIGIN`.
