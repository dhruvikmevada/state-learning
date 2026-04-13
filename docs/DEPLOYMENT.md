# Deployment Guide

## Azure Deployment

### Infrastructure Requirements

1. **Azure Database for PostgreSQL** (Flexible Server)
   - SKU: Standard_B1ms or higher
   - PostgreSQL 15
   - Enable SSL enforcement

2. **Azure Container Apps** or **Azure App Service** (Backend)
   - Node.js 20 LTS
   - Minimum 1 vCPU, 2 GB RAM
   - Configure health check: GET /health

3. **Azure Static Web Apps** or **Container Apps** (Frontend)
   - Serve built React app via nginx

4. **Azure Entra ID** (Authentication)
   - App Registration with redirect URIs
   - API permissions: User.Read, openid, profile, email

### Step-by-Step

#### 1. Database Setup

```bash
az postgres flexible-server create \
  --name state-lessons-db \
  --resource-group state-rg \
  --location canadacentral \
  --admin-user state_admin \
  --admin-password <secure-password> \
  --sku-name Standard_B1ms \
  --version 15

az postgres flexible-server db create \
  --server-name state-lessons-db \
  --resource-group state-rg \
  --database-name state_lessons
```

#### 2. Azure Entra ID App Registration

1. Go to Azure Portal > Entra ID > App registrations > New registration
2. Name: "State Lessons Learned"
3. Redirect URI: `https://your-backend-url/auth/callback`
4. Create client secret
5. Note: Tenant ID, Client ID, Client Secret

#### 3. Backend Deployment

```bash
# Build and push Docker image
docker build -t stateacr.azurecr.io/state-lessons-api:latest ./backend
docker push stateacr.azurecr.io/state-lessons-api:latest

# Deploy to Container Apps
az containerapp create \
  --name state-lessons-api \
  --resource-group state-rg \
  --image stateacr.azurecr.io/state-lessons-api:latest \
  --target-port 4000 \
  --env-vars \
    NODE_ENV=production \
    DATABASE_URL="postgresql://..." \
    AUTH_MODE=azure \
    AZURE_AD_TENANT_ID=<tenant-id> \
    AZURE_AD_CLIENT_ID=<client-id> \
    AZURE_AD_CLIENT_SECRET=<client-secret> \
    JWT_SECRET=<random-32-char-string> \
    SESSION_SECRET=<random-32-char-string> \
    FRONTEND_URL=https://your-frontend-url
```

#### 4. Run Migrations

```bash
# From a CI runner or local machine with DB access:
DATABASE_URL="postgresql://..." npx prisma migrate deploy
DATABASE_URL="postgresql://..." npx tsx prisma/seed.ts
```

#### 5. Frontend Deployment

```bash
# Build
cd frontend && npm run build

# Deploy to Azure Static Web Apps or as container
docker build -t stateacr.azurecr.io/state-lessons-ui:latest ./frontend
docker push stateacr.azurecr.io/state-lessons-ui:latest
```

### Environment Variables (Production)

| Variable | Required | Description |
|----------|----------|-------------|
| NODE_ENV | Yes | `production` |
| DATABASE_URL | Yes | PostgreSQL connection string |
| AUTH_MODE | Yes | `azure` |
| AZURE_AD_TENANT_ID | Yes | Entra ID tenant |
| AZURE_AD_CLIENT_ID | Yes | App registration client ID |
| AZURE_AD_CLIENT_SECRET | Yes | App registration secret |
| JWT_SECRET | Yes | Random 32+ char string |
| SESSION_SECRET | Yes | Random 32+ char string |
| FRONTEND_URL | Yes | Frontend origin for CORS |
| LOG_LEVEL | No | `info` (default) |

### SSL / TLS

- Database: Enforce SSL in PostgreSQL connection string (`?sslmode=require`)
- Backend: Terminate TLS at load balancer / Container Apps ingress
- Frontend: HTTPS via Azure Static Web Apps or Container Apps ingress

### Scaling

- Backend: Configure min/max replicas in Container Apps (2-10 recommended)
- Database: Monitor DTU/vCore usage, scale tier as needed
- Frontend: Static assets scale automatically via CDN
