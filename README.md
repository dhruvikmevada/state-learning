# State — Lessons Learned System

Production-ready, full-stack web application for **State Construction** to capture, categorize, approve, and track lessons learned across glazing/construction projects and departments.

## Architecture

```
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│   React + Vite   │─────▶│   Express + TS   │─────▶│   PostgreSQL 15  │
│   (Frontend)     │◀─────│   (REST API)     │◀─────│   (Database)     │
└──────────────────┘      └──────────────────┘      └──────────────────┘
       :3000                     :4000                      :5432
```

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Recharts, Framer Motion, Lucide  
**Backend:** Node.js, Express, TypeScript, Prisma ORM, Zod validation, JWT auth  
**Database:** PostgreSQL 15 with Prisma migrations  
**Auth:** Microsoft Entra ID (production) / local JWT (development)  
**Deployment:** Docker, docker-compose, CI/CD-ready

---

## Quick Start

### Prerequisites
- Node.js >= 18
- Docker & Docker Compose (for database)

### 1. Start Database
```bash
docker-compose up -d db
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App runs at **http://localhost:3000** with API at **http://localhost:4000**

### 4. Full Docker Stack
```bash
docker-compose up --build
```

---

## Login

In local dev mode (`AUTH_MODE=local`), login with any seeded user email:

| User | Email | Role |
|------|-------|------|
| Sarah Chen | admin@stateconstruction.com | Admin |
| James Martin | jmartin@stateconstruction.com | PM |
| Lisa Thompson | lthompson@stateconstruction.com | PMO |
| Marco Rodriguez | mrodriguez@stateconstruction.com | Department Approver |
| Patricia Nguyen | pnguyen@stateconstruction.com | Executive Read-Only |
| Dev Kumar | dkumar@stateconstruction.com | Standard Contributor |

---

## Roles & Permissions

| Capability | Admin | PM | PMO | Dept Approver | Executive | Contributor |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| View Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Submit Lessons | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| Approve PM | ✅ | ✅ | — | — | — | — |
| Approve PMO | ✅ | — | ✅ | — | — | — |
| Approve Dept | ✅ | — | — | ✅ | — | — |
| View Register | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage Config | ✅ | — | — | — | — | — |

---

## Application Sections

### Master Dashboard
Executive KPIs, severity/department/phase/category charts, watchout alerts, and top driver tables. All data is live from the backend and dynamically filtered.

### Lesson Add Form
Full intake form with project info, classification, narrative fields, impact assessment, vendor/claims flags, and reference links. Server-side validation and auto-generated lesson IDs.

### Lesson Learned Register
Searchable, filterable, sortable table with pagination. Click any row for a detail drawer showing full lesson data, approval actions (role-gated), and complete audit trail.

---

## Approval Workflow

1. Lesson submitted → Status = **Submitted**, all approvals = **Pending**
2. PM approves/rejects → Status moves to **In Review**
3. PMO approves/rejects
4. Department Approver approves/rejects
5. All 3 approved → Final = **Approved**, Status = **Approved (Reusable)**
6. Any rejection → Status = **Rejected**

Every approval change is recorded in the audit trail with actor, role, timestamp, old/new value.

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/login | — | Dev login by email |
| GET | /auth/me | JWT | Current user |
| GET | /api/lessons | JWT | List with pagination/filters |
| POST | /api/lessons | JWT | Create lesson |
| GET | /api/lessons/:id | JWT | Get lesson detail |
| PATCH | /api/lessons/:id | JWT | Update lesson |
| GET | /api/lessons/:id/audit | JWT | Audit trail |
| POST | /api/lessons/:id/approve/pm | JWT+PM | PM approval |
| POST | /api/lessons/:id/approve/pmo | JWT+PMO | PMO approval |
| POST | /api/lessons/:id/approve/department | JWT+Dept | Dept approval |
| GET | /api/dashboard/kpis | JWT | Dashboard KPIs |
| GET | /api/dashboard/breakdowns | JWT | Chart data |
| GET | /api/dashboard/watchouts | JWT | Watchout alerts |
| GET | /api/dashboard/top-drivers | JWT | Top drivers |
| GET | /api/config/thresholds | JWT | Config thresholds |
| GET | /health | — | Health check |

Swagger UI: **http://localhost:4000/api-docs**

---

## Testing

```bash
cd backend && npm test      # Validation + RBAC tests
cd frontend && npm test     # Component tests
```

---

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Azure deployment guide.  
See [docs/MONITORING.md](docs/MONITORING.md) for operational monitoring guidance.

---

## License

Proprietary — State Construction Company. All rights reserved.
