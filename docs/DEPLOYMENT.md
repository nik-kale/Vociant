# Deployment Guide

Deploy Vociant to production on Vercel, AWS, or self-hosted infrastructure.

---

## Table of Contents

1. [Vercel Deployment](#vercel-deployment)
2. [AWS Deployment](#aws-deployment)
3. [Self-Hosted Deployment](#self-hosted-deployment)
4. [Database Setup](#database-setup)
5. [Environment Variables](#environment-variables)
6. [Security Checklist](#security-checklist)
7. [Monitoring](#monitoring)

---

## Vercel Deployment

Vociant's Next.js console deploys seamlessly to Vercel.

### Prerequisites

- Vercel account
- GitHub repository
- Postgres database (Vercel Postgres, Supabase, or Neon)

### Steps

1. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/yourusername/vociant.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - **Root Directory**: Leave empty (Vercel will auto-detect monorepo)
   - **Framework Preset**: Next.js

3. **Configure Build Settings**
   - **Build Command**: `cd apps/vociant-console && pnpm run build`
   - **Output Directory**: `apps/vociant-console/.next`
   - **Install Command**: `pnpm install`

4. **Set Environment Variables**
   ```env
   DATABASE_URL=postgresql://user:pass@host/db
   OPENAI_API_KEY=sk-...
   ELEVENLABS_API_KEY=sk_...
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

5. **Deploy**
   - Click **Deploy**
   - Vercel will build and deploy your app

6. **Run Database Migrations**
   ```bash
   # After first deploy, run Prisma migrations
   vercel env pull .env.local
   pnpm --filter vociant-console db:push
   ```

---

## AWS Deployment

Deploy to AWS ECS/Fargate for full control.

### Architecture

```
┌─────────────┐
│ CloudFront  │ ← CDN
└──────┬──────┘
       │
┌──────▼──────┐
│     ALB     │ ← Load Balancer
└──────┬──────┘
       │
┌──────▼──────┐
│  ECS Fargate│ ← Next.js app
│  (Containers)│
└──────┬──────┘
       │
┌──────▼──────┐
│   RDS PG    │ ← Postgres database
└─────────────┘
```

### Prerequisites

- AWS account
- Docker installed locally
- AWS CLI configured

---

### 1. Build Docker Image

```dockerfile
# apps/vociant-console/Dockerfile
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm

FROM base AS dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/vociant-core/package.json ./packages/vociant-core/
COPY apps/vociant-console/package.json ./apps/vociant-console/
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY . .
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages/vociant-core/node_modules ./packages/vociant-core/node_modules
COPY --from=dependencies /app/apps/vociant-console/node_modules ./apps/vociant-console/node_modules

# Build vociant-core
RUN pnpm --filter @vociant/core build

# Build console
RUN pnpm --filter vociant-console build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

COPY --from=build /app/apps/vociant-console/.next/standalone ./
COPY --from=build /app/apps/vociant-console/.next/static ./apps/vociant-console/.next/static
COPY --from=build /app/apps/vociant-console/public ./apps/vociant-console/public

EXPOSE 3000

CMD ["node", "apps/vociant-console/server.js"]
```

---

### 2. Push to ECR

```bash
# Create ECR repository
aws ecr create-repository --repository-name vociant-console

# Build and tag image
docker build -t vociant-console -f apps/vociant-console/Dockerfile .
docker tag vociant-console:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/vociant-console:latest

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

# Push
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/vociant-console:latest
```

---

### 3. Create RDS Postgres Database

```bash
aws rds create-db-instance \
  --db-instance-identifier vociant-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username vociant \
  --master-user-password <password> \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name my-subnet-group \
  --backup-retention-period 7 \
  --publicly-accessible false
```

---

### 4. Create ECS Task Definition

```json
{
  "family": "vociant-console",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "vociant-console",
      "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/vociant-console:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "NEXT_PUBLIC_APP_URL", "value": "https://vociant.example.com" }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:vociant-db-url"
        },
        {
          "name": "OPENAI_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:openai-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/vociant-console",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

---

### 5. Create ECS Service

```bash
aws ecs create-service \
  --cluster vociant-cluster \
  --service-name vociant-console \
  --task-definition vociant-console \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-zzz],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=vociant-console,containerPort=3000"
```

---

## Self-Hosted Deployment

Deploy to your own Linux server using Docker Compose.

### Prerequisites

- Ubuntu/Debian server
- Docker & Docker Compose installed
- Domain name pointed to server

---

### 1. Clone Repository

```bash
ssh user@your-server.com
git clone https://github.com/yourusername/vociant.git
cd vociant
```

---

### 2. Create `docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: vociant
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: vociant
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  console:
    build:
      context: .
      dockerfile: apps/vociant-console/Dockerfile
    environment:
      DATABASE_URL: postgresql://vociant:${POSTGRES_PASSWORD}@postgres:5432/vociant
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      ELEVENLABS_API_KEY: ${ELEVENLABS_API_KEY}
      NEXT_PUBLIC_APP_URL: https://vociant.yourdomain.com
    ports:
      - "3000:3000"
    depends_on:
      - postgres

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - console

volumes:
  postgres-data:
```

---

### 3. Configure Nginx

```nginx
# nginx.conf
http {
  upstream vociant_console {
    server console:3000;
  }

  server {
    listen 80;
    server_name vociant.yourdomain.com;
    return 301 https://$server_name$request_uri;
  }

  server {
    listen 443 ssl http2;
    server_name vociant.yourdomain.com;

    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    location / {
      proxy_pass http://vociant_console;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection 'upgrade';
      proxy_set_header Host $host;
      proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /api/voice {
      proxy_pass http://vociant_console;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "Upgrade";
      proxy_set_header Host $host;
    }
  }
}
```

---

### 4. Deploy

```bash
# Create .env file
cat > .env << EOF
POSTGRES_PASSWORD=your_secure_password
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=sk_...
EOF

# Start services
docker-compose up -d

# Run database migrations
docker-compose exec console pnpm db:push
```

---

### 5. Set Up SSL with Let's Encrypt

```bash
sudo apt install certbot
sudo certbot certonly --standalone -d vociant.yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/vociant.yourdomain.com/fullchain.pem ./certs/
sudo cp /etc/letsencrypt/live/vociant.yourdomain.com/privkey.pem ./certs/

# Restart nginx
docker-compose restart nginx
```

---

## Database Setup

### SQLite (Development)

```env
DATABASE_URL="file:./dev.db"
```

### PostgreSQL (Production)

```env
DATABASE_URL="postgresql://user:password@host:5432/vociant?schema=public"
```

### Migrations

```bash
# Push schema to database
pnpm db:push

# Or use migrations (recommended for production)
pnpm --filter vociant-console prisma migrate deploy
```

---

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Postgres connection string | `postgresql://...` |
| `OPENAI_API_KEY` | OpenAI API key (for LLM) | `sk-...` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `ELEVENLABS_API_KEY` | ElevenLabs API key | - |
| `ANTHROPIC_API_KEY` | Anthropic API key | - |
| `DEEPGRAM_API_KEY` | Deepgram API key | - |
| `NEXT_PUBLIC_APP_URL` | Public app URL | `http://localhost:3000` |

---

## Security Checklist

### Before Going Live

- [ ] **Encrypt provider credentials** in database (use AES-256)
- [ ] **Add authentication** (NextAuth.js with OAuth)
- [ ] **Enable CORS** restrictions on WebSocket endpoints
- [ ] **Set up rate limiting** (use Vercel Edge Config or express-rate-limit)
- [ ] **Use HTTPS** everywhere (Let's Encrypt or AWS ACM)
- [ ] **Sanitize user inputs** in tools and prompts
- [ ] **Audit logs** for tool executions and session access
- [ ] **Rotate API keys** regularly
- [ ] **Set up monitoring** (Sentry, DataDog, or CloudWatch)

---

## Monitoring

### Recommended Stack

- **Errors**: [Sentry](https://sentry.io/)
- **Logs**: AWS CloudWatch or [BetterStack](https://betterstack.com/)
- **Metrics**: Prometheus + Grafana
- **Uptime**: UptimeRobot or Pingdom

### Metrics to Track

- WebSocket connection count
- Average session duration
- TTS/STT/LLM latency (p50, p95, p99)
- Error rates by provider
- Tool execution success rate
- Database connection pool usage

---

## Scaling

### Horizontal Scaling

- Run multiple Next.js instances behind a load balancer
- Use Redis for session state if needed (WebSocket sticky sessions)

### Database Scaling

- Read replicas for analytics queries
- Connection pooling (PgBouncer)

### Provider Costs

- Monitor usage via provider dashboards
- Set up budget alerts
- Consider caching TTS audio for repeated phrases

---

*For architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md).*
