# Pass Scout

Análise de passes de meio-campistas europeus — migrado de [Midfielders-passers](https://github.com/waltfilipe/Midfielders-passers) para uma stack **Next.js + FastAPI**.

## Arquitetura

```
Frontend (Vercel)          Backend (Python host)
pass-scout.vercel.app  →   FastAPI + engines Python
     Next.js 15                 │
     React 19                   ├── passes_engine
     /players                   ├── xp_engine
                                ├── progression_engine
                                └── data/ + models/ + CSVs
```

- **Frontend**: Next.js 15 com página de jogadores, filtros por liga/posição/nome
- **Backend**: FastAPI reutilizando os engines Python originais via `load_player_analysis_bundle()`

## Estrutura

```
backend/
  main.py                 # FastAPI app
  services/
    player_bundle.py      # Lógica migrada do Streamlit
    serialization.py      # JSON helpers
  passes_engine.py        # (+ demais engines)
  data/                   # Parquet + caches JSON
  models/                 # joblib + xT surfaces
  *.csv                   # Eventos de passe por liga

frontend/
  app/
    page.tsx              # Home
    players/page.tsx      # Lista de jogadores
  lib/api.ts              # Cliente HTTP para o backend
```

## Desenvolvimento local

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Endpoints:
- `GET /health` — health check
- `GET /api/meta` — metadados do dataset
- `GET /api/players` — lista com filtros (`league`, `position_group`, `search`)
- `GET /api/players/{id}` — perfil completo

### Frontend

```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

Abra http://localhost:3000

## Deploy

### Frontend (Vercel)

1. Importe o repositório no Vercel
2. Defina **Root Directory** como `frontend`
3. Configure a variável de ambiente:
   - `NEXT_PUBLIC_API_URL` = URL do backend em produção

### Backend

O backend precisa de um host Python com ~300 MB de dados (CSVs + parquet). Opções:

- **Railway** / **Render** / **Fly.io**
- Comando de start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Configure `CORS_ORIGINS` com a URL do Vercel (ex: `https://pass-scout.vercel.app`)

## Próximos passos

- [ ] Página de perfil individual do jogador
- [ ] Comparação head-to-head
- [ ] Mapas de passes (Plotly/matplotlib via API)
- [ ] Tab xPass (leaderboard COE)
- [ ] Carries/dribbles (requer CSVs adicionais)
