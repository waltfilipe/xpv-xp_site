# Pass Scout — site estático (opção B)

Hospede o Pass Scout como **apresentação estática**: JSON + imagens pré-gerados, **sem backend** em runtime. Perfil, compare, scatter, heatmaps e mapas de passe funcionam a partir de arquivos em `frontend/public/static/`.

## Visão geral

```
Build offline (seu PC, uma vez)
  build_api_pool_cache.py  → métricas em JSON
  build_static_site.py     → JSON + PNGs de mapas/heatmaps
        ↓
frontend/public/static/
  data/{family}/pool.json
  data/{family}/meta.json
  assets/heatmaps/…
  assets/maps/…
  assets/aggregated/…
        ↓
Vercel / GitHub Pages (NEXT_PUBLIC_STATIC_MODE=1)
  → link público, memória do servidor = 0
```

## Passo 1 — Gerar pool JSON (se ainda não existir)

```bash
cd backend
pip install -r requirements.txt
python scripts/build_api_pool_cache.py --family midfielders
```

Requer parquet em `backend/data/` e ~8 GB RAM na primeira execução.

## Passo 2 — Gerar site estático

Na raiz do projeto:

```bash
chmod +x scripts/build-static-site.sh
./scripts/build-static-site.sh --family midfielders
```

### Opções úteis

| Flag | Efeito |
|------|--------|
| `--family midfielders` | Só uma posição |
| `--limit 50` | Primeiros N jogadores (apresentação) |
| `--players 915812,12345` | IDs específicos |
| `--json-only` | Só JSON (sem PNGs) — perfil/compare/scatter ok, sem mapas |
| `--skip-maps` | Sem pass maps |
| `--skip-heatmaps` | Sem heatmap de origem |

**Exemplo para apresentação (20 jogadores, tudo incluído):**

```bash
./scripts/build-static-site.sh --family midfielders --limit 20
```

**Todas as posições com cache no repo:**

```bash
./scripts/build-static-site.sh
```

## Passo 3 — Ativar modo estático no frontend

```bash
cp frontend/.env.static.example frontend/.env.local
cd frontend
npm install
npm run dev
```

Abra http://localhost:3000 — não precisa subir o FastAPI.

## Passo 4 — Deploy (Vercel)

1. **Root Directory:** `frontend`
2. **Environment variable:** `NEXT_PUBLIC_STATIC_MODE=1`
3. Commit `frontend/public/static/` (ou gere no CI antes do build)

```bash
cd frontend
npx vercel --prod
```

O frontend serve os arquivos de `public/static/` diretamente; não há proxy `/api`.

## O que funciona em modo estático

| Funcionalidade | Fonte |
|----------------|-------|
| Lista + filtros | `pool.json` + lógica em `lib/static/` |
| Perfil (grades, barras, pass scores) | `pool.json` |
| Heatmap de origem | `assets/heatmaps/{family}/{id}.png` |
| Compare | `pool.json` + heatmaps PNG |
| Scatter | calculado no browser |
| Pass maps | `assets/maps/{family}/{id}/{filter}.json` + PNGs |
| Mapas agregados | `assets/aggregated/{family}.json` + PNGs |

## Tamanho estimado

| Escopo | Tamanho aprox. |
|--------|----------------|
| JSON pool (4 famílias) | ~34 MB |
| 20 jogadores + mapas | ~50 MB |
| 527 meio-campistas completos | ~2 GB |

Para apresentações, use `--limit` ou `--players`.

## Atualizar dados

Quando quiser dados novos:

```bash
python backend/scripts/build_api_pool_cache.py --family midfielders
./scripts/build-static-site.sh --family midfielders --limit 20
git add frontend/public/static
git commit -m "Update static presentation data"
```

## Solução de problemas

| Problema | Solução |
|----------|---------|
| Heatmap não aparece | Rode o build **sem** `--skip-heatmaps`; confira se o PNG existe em `public/static/assets/heatmaps/` |
| Pass map vazio | Parquet necessário no build; use `--family` com parquet disponível |
| `site.json` 404 | Rode `build_static_site.py` antes de `npm run dev` |
| Modo API ainda ativo | Confirme `NEXT_PUBLIC_STATIC_MODE=1` em `.env.local` e reinicie o Next |

## Modo híbrido

Sem `NEXT_PUBLIC_STATIC_MODE`, o frontend continua usando o backend FastAPI (opção A / local). As duas opções coexistem no mesmo código.
