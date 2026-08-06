# Pass Scout

Análise de passes de meio-campistas europeus — migrado de [Midfielders-passers](https://github.com/waltfilipe/Midfielders-passers) para **Next.js + FastAPI**.

## Arquitetura

```
Frontend (Vercel)              Backend (Render/Railway)
pass-scout.vercel.app    →     FastAPI + engines Python
     Next.js 15                      │
     /profile, /compare, /maps       ├── passes_engine, xp_engine
                                     └── data/ + models/ + CSVs (~300 MB)
```

## Páginas

| Rota | Equivalente Streamlit |
|------|----------------------|
| `/profile` | Player Profile — grade xP, barras, pass scores, heatmap |
| `/compare` | Compare — dois jogadores, pillars, pass grid |
| `/maps` | Maps — scatter, pass maps, visão agregada |
| `/players` | Lista filtrável de jogadores |

## Desenvolvimento local

```bash
# Backend
cd backend && pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd frontend && npm install
BACKEND_URL=http://127.0.0.1:8000 npm run dev
```

## Site local + Cloudflare Tunnel (privado, todas as funções)

Para rodar no seu PC com heatmaps/mapas completos e compartilhar só com convidados:

```bash
chmod +x scripts/start-pass-scout.sh scripts/start-cloudflared.sh
./scripts/start-pass-scout.sh          # http://localhost:3000
./scripts/start-cloudflared.sh         # imprime URL https://….trycloudflare.com
```

Guia completo (túnel fixo, domínio, Cloudflare Access): **[docs/LOCAL_CLOUDFLARE.md](docs/LOCAL_CLOUDFLARE.md)**

## Site estático para apresentação (opção B)

Sem backend em runtime — JSON + PNGs pré-gerados, link público na Vercel:

**[docs/STATIC_SITE.md](docs/STATIC_SITE.md)** — site 100% estático

**[docs/HYBRID_DEPLOY.md](docs/HYBRID_DEPLOY.md)** — Render + R2 + Vercel (recomendado para 527 jogadores com mapas)

```bash
./scripts/build-static-site.sh --family midfielders
cp frontend/.env.hybrid.example frontend/.env.local   # modo híbrido
cd frontend && npm run dev
```

## Deploy na nuvem (Render + Vercel)

### 1. Backend no Render (gratuito)

1. Conecte o repo em [render.com](https://render.com)
2. Use o `render.yaml` na raiz (Blueprint) ou crie Web Service:
   - **Root Directory:** `backend`
   - **Build:** `pip install -r requirements.txt`
   - **Start:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. Env: `CORS_ORIGINS=https://pass-scout.vercel.app`
4. Anote a URL: `https://pass-scout-api.onrender.com`

### 2. Frontend na Vercel

1. Importe o repo em [vercel.com](https://vercel.com)
2. **Root Directory:** `frontend`
3. Env: `NEXT_PUBLIC_API_URL=https://pass-scout-api.onrender.com`
4. Domínio custom: `pass-scout.vercel.app` (Project Settings → Domains)

Ou via CLI:

```bash
cd frontend
npx vercel --prod
# Defina NEXT_PUBLIC_API_URL no dashboard da Vercel
```

## API Endpoints

| Endpoint | Descrição |
|----------|-----------|
| `GET /api/meta` | Metadados e filtros |
| `GET /api/players` | Lista de jogadores |
| `GET /api/players/options` | Dropdown ranqueado |
| `GET /api/players/{id}` | Perfil completo |
| `GET /api/compare?player_a=&player_b=` | Comparação |
| `GET /api/maps/scatter` | Dados scatter |
| `GET /api/maps/players/{id}/pass-map` | Mapas de passe (PNG base64) |
| `GET /api/maps/aggregated` | Mapas agregados top-250 |
