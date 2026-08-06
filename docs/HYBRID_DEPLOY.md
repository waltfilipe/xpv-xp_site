# Modo híbrido — Render (dados) + Cloudflare R2 (mapas) + Vercel (frontend)

Use esta arquitetura para **link público** com os **527 meio-campistas**, mapas completos e **Render leve** (sem parquet em memória).

```
Visitante
   │
   ▼
Vercel (Next.js)
   ├── perfil / lista / compare / scatter ──► Render API (JSON, ~50 MB RAM)
   └── heatmaps + pass maps (sob demanda) ──► Cloudflare R2 CDN (~500 MB)
```

---

## Checklist rápido

- [ ] 1. Merge do PR com modo estático/híbrido (`cursor/static-site-option-b-1b5d`)
- [ ] 2. Backend no Render (já existente ou novo deploy)
- [ ] 3. Build offline dos 527 no seu PC
- [ ] 4. Bucket R2 + upload dos PNGs/JSONs de mapas
- [ ] 5. Frontend na Vercel com variáveis híbridas
- [ ] 6. CORS no Render apontando para o domínio Vercel
- [ ] 7. Testar perfil + pass map de um jogador

---

## Passo 1 — Código no repositório

Certifique-se de ter o branch com:
- `scripts/build-static-site.sh`
- `frontend/lib/assets.ts` (CDN híbrido)
- `NEXT_PUBLIC_STATIC_ASSETS_URL`

```bash
git checkout cursor/static-site-option-b-1b5d
# ou merge do PR #12 na main
```

---

## Passo 2 — Backend no Render (API JSON)

1. [render.com](https://render.com) → Web Service → repo `xpv-xp_site`
2. **Root Directory:** `backend`
3. **Build:** `pip install -r requirements.txt`
4. **Start:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Variáveis:
   - `PASS_SCOUT_MODE=cloud` (padrão)
   - `CORS_ORIGINS=https://SEU-APP.vercel.app`
6. Anote a URL: `https://pass-scout-api.onrender.com`

Teste:

```bash
curl https://pass-scout-api.onrender.com/health
# mode: cloud, heavy_maps: false

curl "https://pass-scout-api.onrender.com/api/players?position_family=midfielders&limit=2"
```

---

## Passo 3 — Build offline (527 jogadores, no seu PC)

Requisitos: **8 GB+ RAM**, Python 3.12, parquet em `backend/data/`.

```bash
cd backend
pip install -r requirements.txt

# Pool JSON (se ainda não tiver)
python scripts/build_api_pool_cache.py --family midfielders

# Mapas + heatmaps para TODOS os 527 (várias horas)
cd ..
./scripts/build-static-site.sh --family midfielders
```

Saída:

```
frontend/public/static/assets/
  heatmaps/midfielders/{player_id}.png
  maps/midfielders/{player_id}/{filter}.json
  maps/midfielders/{player_id}/{filter}_pass.png
  maps/midfielders/{player_id}/{filter}_dest.png
  aggregated/midfielders.json
  aggregated/midfielders_common.png
  aggregated/midfielders_rare.png
```

Tamanho esperado: **~450–550 MB**.

---

## Passo 4 — Cloudflare R2 (CDN dos mapas)

### 4.1 Criar bucket

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2**
2. **Create bucket** → ex.: `pass-scout-maps`
3. **Settings** → **Public access** → Allow Access / habilitar domínio público `r2.dev`
4. Anote a URL pública, ex.: `https://pub-xxxxxxxx.r2.dev`

### 4.2 Upload da pasta `assets/`

Envie **o conteúdo interno** de `frontend/public/static/assets/` para a **raiz do bucket**:

```
bucket/
  heatmaps/midfielders/915812.png
  maps/midfielders/915812/progressive.json
  maps/midfielders/915812/progressive_pass.png
  ...
  aggregated/midfielders.json
```

**Não** inclua `static/assets` no caminho — a URL final deve ser:

`https://pub-xxx.r2.dev/heatmaps/midfielders/915812.png`

#### Upload via Wrangler (CLI)

```bash
npm install -g wrangler
wrangler login

cd frontend/public/static/assets
wrangler r2 object put pass-scout-maps/heatmaps/midfielders/915812.png --file=heatmaps/midfielders/915812.png
# Para upload em massa, use rclone ou o painel R2 (arrastar pasta)
```

#### Upload via rclone (recomendado para 500 MB)

```bash
rclone copy frontend/public/static/assets/ r2:pass-scout-maps/ --progress
```

### 4.3 CORS no bucket (obrigatório)

No bucket R2 → **Settings** → **CORS**:

```json
[
  {
    "AllowedOrigins": ["https://SEU-APP.vercel.app", "http://localhost:3000"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"]
  }
]
```

### 4.4 Testar um arquivo

```bash
curl -I "https://pub-xxx.r2.dev/heatmaps/midfielders/915812.png"
# HTTP 200
```

---

## Passo 5 — Frontend na Vercel (modo híbrido)

1. Importe o repo → **Root Directory:** `frontend`
2. **Environment variables** (Production):

| Variável | Valor | Notas |
|----------|-------|-------|
| `NEXT_PUBLIC_API_URL` | `https://pass-scout-api.onrender.com` | API Render |
| `NEXT_PUBLIC_STATIC_ASSETS_URL` | `https://pub-xxx.r2.dev` | CDN R2 (sem barra final) |
| `NEXT_PUBLIC_STATIC_MODE` | *(não definir ou `0`)* | Dados vêm do Render |

**Não** ative `NEXT_PUBLIC_STATIC_MODE=1` no híbrido — só os mapas vêm do CDN; métricas vêm do Render.

3. Deploy:

```bash
cd frontend
npx vercel --prod
```

Ou copie localmente para testar:

```bash
cp frontend/.env.hybrid.example frontend/.env.local
# edite as URLs
npm run dev
```

---

## Passo 6 — CORS no Render

No dashboard Render, atualize:

```
CORS_ORIGINS=https://pass-scout.vercel.app,https://SEU-APP.vercel.app
```

Reinicie o serviço se necessário.

---

## Passo 7 — Validar o fluxo

| Ação | O que deve acontecer |
|------|----------------------|
| Abrir `/players` | Lista dos 527 via Render API |
| Abrir perfil de um jogador | Grades/barras do Render + heatmap do R2 |
| `/compare` | Métricas do Render + 2 heatmaps do R2 |
| `/maps` → Pass map | 2 PNGs do R2 para o filtro escolhido |
| `/maps` → Scatter | Pontos calculados a partir dos dados do Render |

No DevTools → Network:
- `pass-scout-api.onrender.com/api/...` → JSON
- `pub-xxx.r2.dev/heatmaps/...` → PNG (só ao abrir perfil)
- `pub-xxx.r2.dev/maps/...` → PNG/JSON (só na aba Pass map)

---

## Atualizar dados no futuro

```bash
# 1. Novos ratings no pool
python backend/scripts/build_api_pool_cache.py --family midfielders
git add backend/data/api_pool_midfielders.json && git push
# Render redeploy automático

# 2. Novos mapas
./scripts/build-static-site.sh --family midfielders
rclone sync frontend/public/static/assets/ r2:pass-scout-maps/
# Frontend não precisa redeploy (mapas no CDN)
```

---

## Alternativa mais simples (sem Render)

Se não precisar de API dinâmica:

1. `./scripts/build-static-site.sh --family midfielders`
2. Deploy **tudo** no **Cloudflare Pages** (frontend + `public/static/`)
3. `NEXT_PUBLIC_STATIC_MODE=1`
4. Sem Render, sem R2 separado

Bom para apresentação com dados fixos.

---

## Solução de problemas

| Problema | Causa provável | Solução |
|----------|----------------|---------|
| Heatmap quebrado (ícone) | URL R2 errada ou CORS | Confira `NEXT_PUBLIC_STATIC_ASSETS_URL` e CORS do bucket |
| 404 no PNG | Estrutura errada no bucket | Deve ser `heatmaps/...`, não `static/assets/heatmaps/...` |
| API funciona, mapas não | `STATIC_ASSETS_URL` ausente na Vercel | Adicione a variável e redeploy |
| CORS no perfil | Render bloqueando | Adicione domínio Vercel em `CORS_ORIGINS` |
| Build OOM | Pouca RAM | Feche outros apps; use máquina com 8 GB+ |
