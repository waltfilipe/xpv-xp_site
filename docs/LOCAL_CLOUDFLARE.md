# Pass Scout — site local + Cloudflare Tunnel (opção D)

Hospede o app no **seu PC** com todas as funcionalidades (heatmaps, mapas, bundle completo) e exponha com **Cloudflare Tunnel** + **Cloudflare Access** (só pessoas autorizadas).

## Arquitetura

```
Internet
   │
   ▼
Cloudflare Access (login por e-mail)
   │
   ▼
cloudflared (túnel)
   │
   ▼
Next.js :3000  ──proxy /api──►  FastAPI :8000 (só localhost)
```

O backend **não** fica aberto na internet — só o Next.js é exposto pelo túnel.

---

## Pré-requisitos

| Item | Notas |
|------|--------|
| **RAM** | 8 GB+ recomendado (bundle completo usa ~2 GB no pico) |
| **Node.js 20+** | Frontend |
| **Python 3.12** | Backend |
| **Conta Cloudflare** | Grátis; domínio opcional para túnel rápido |
| **cloudflared** | CLI do túnel |

### Instalar cloudflared

- **macOS:** `brew install cloudflared`
- **Windows:** `winget install Cloudflare.cloudflared`
- **Linux:** [downloads Cloudflare](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)

---

## Passo 1 — Subir o Pass Scout localmente

```bash
cd xpv-xp_site
chmod +x scripts/start-pass-scout.sh scripts/start-cloudflared.sh

# Backend + frontend (modo local, analytics completos)
./scripts/start-pass-scout.sh
```

Abra **http://localhost:3000** e confirme que o app funciona.

- Primeira carga de jogadores pode levar **1–3 minutos** (bundle em memória).
- `/health` deve retornar `"mode": "local"` e `"heavy_maps": "true"`.

Para parar:

```bash
./scripts/start-pass-scout.sh stop
```

### Todas as posições (laterais, extremos, zagueiros)

Só **meio-campistas** vêm prontos no git (`api_pool_midfielders.json` + parquet). Para as outras posições, rode **uma vez** na sua máquina:

```bash
chmod +x scripts/setup-position-data.sh
./scripts/setup-position-data.sh
```

Isso gera os parquets e os arquivos `api_pool_{family}.json`. Sem isso, laterais/extremos retornam erro ao carregar.

Confirme que o backend está em modo local:

```bash
curl http://127.0.0.1:8000/health
# deve mostrar "mode":"local"
```

Use sempre `./scripts/start-pass-scout.sh` (não `uvicorn` direto sem `PASS_SCOUT_MODE=local`).

### Modo 24/7 (opcional)

```bash
export PASS_SCOUT_PRODUCTION=1
./scripts/start-pass-scout.sh
```

Usa `next build` + `next start` em vez de `next dev`.

---

## Passo 2 — Túnel rápido (teste, ~5 minutos)

Em **outro terminal**, com o Pass Scout rodando:

```bash
./scripts/start-cloudflared.sh
```

O `cloudflared` imprime uma URL pública, por exemplo:

```
https://random-words-abc123.trycloudflare.com
```

**Esse é o link de acesso.** Envie para quem for testar.

| | |
|--|--|
| **Vantagem** | Sem domínio, sem config |
| **Desvantagem** | URL **muda** cada vez que reinicia o túnel |
| **Privacidade** | Qualquer um com o link acessa — use só para teste |

---

## Passo 3 — Túnel fixo + domínio (recomendado)

### 3.1 Login no Cloudflare

```bash
cloudflared tunnel login
```

Escolha o domínio que você controla (ex. `seudominio.com`).

### 3.2 Criar o túnel

```bash
cloudflared tunnel create pass-scout
```

Anote o **Tunnel ID** (UUID).

### 3.3 Configurar DNS

```bash
cloudflared tunnel route dns pass-scout pass-scout.seudominio.com
```

Substitua pelo subdomínio desejado.

### 3.4 Arquivo de config

Copie o exemplo e edite:

```bash
cp cloudflare/config.yml.example cloudflare/config.yml
```

```yaml
tunnel: SEU_TUNNEL_UUID
credentials-file: /home/SEU_USUARIO/.cloudflared/SEU_TUNNEL_UUID.json

ingress:
  - hostname: pass-scout.seudominio.com
    service: http://127.0.0.1:3000
  - service: http_status:404
```

### 3.5 Rodar o túnel

```bash
cloudflared tunnel --config cloudflare/config.yml run pass-scout
```

**Link fixo:** `https://pass-scout.seudominio.com`

### 3.6 CORS (se necessário)

Se o browser bloquear API, adicione o hostname:

```bash
export CORS_ORIGINS="http://localhost:3000,https://pass-scout.seudominio.com"
./scripts/start-pass-scout.sh stop
./scripts/start-pass-scout.sh
```

---

## Passo 4 — Cloudflare Access (privado, só convidados)

Sem Access, quem tiver o link entra. Para restringir:

1. Acesse [Cloudflare Zero Trust](https://one.dash.cloudflare.com/)
2. **Access** → **Applications** → **Add an application**
3. Tipo: **Self-hosted**
4. **Application domain:** `pass-scout.seudominio.com` (ou o hostname do túnel)
5. **Policy:** Allow → **Emails** → liste os e-mails permitidos (ex. `voce@gmail.com`, `amigo@empresa.com`)
6. Salve

A partir daí, ao abrir o link, o visitante faz login (e-mail + código) antes de ver o site.

---

## Como outras pessoas acessam (resumo)

| Cenário | O que você faz | O que elas fazem |
|---------|----------------|------------------|
| **Teste rápido** | `./scripts/start-cloudflared.sh` → copia URL `*.trycloudflare.com` | Abrem o link no navegador |
| **Produção privada** | Túnel fixo + Access com e-mails | Abrem `https://pass-scout.seudominio.com` → login Cloudflare |
| **Só você** | Só `localhost:3000` | — |

**Importante:** seu PC (ou servidor) precisa estar **ligado** com os dois scripts rodando:

1. `./scripts/start-pass-scout.sh`
2. `cloudflared tunnel …` (rápido ou nomeado)

---

## Checklist diário

```bash
# Terminal 1
./scripts/start-pass-scout.sh

# Terminal 2 (teste)
./scripts/start-cloudflared.sh

# Terminal 2 (produção)
cloudflared tunnel --config cloudflare/config.yml run pass-scout
```

---

## Solução de problemas

| Problema | Solução |
|----------|---------|
| `502` no túnel | Pass Scout não está em `:3000` — rode `start-pass-scout.sh` |
| API lenta na 1ª vez | Normal — carregando bundle; aguarde 1–3 min |
| CORS error | Adicione `https://seu-host` em `CORS_ORIGINS` |
| OOM / processo morto | Precisa de mais RAM; feche outros apps |
| URL trycloudflare mudou | Reiniciou o túnel — envie o link novo |

---

## Variáveis de ambiente

| Variável | Valor local | Efeito |
|----------|-------------|--------|
| `PASS_SCOUT_MODE` | `local` | Bundle completo (não usa JSON cache) |
| `HEAVY_MAPS_ENABLED` | `1` (automático em local) | Mapas e heatmaps ativos |
| `BACKEND_URL` | `http://127.0.0.1:8000` | Proxy Next → API |
| `CORS_ORIGINS` | hostnames do túnel | CORS do FastAPI |
| `PASS_SCOUT_PRODUCTION` | `1` | Next em modo produção |

Ver `pass-scout.env.example`.
