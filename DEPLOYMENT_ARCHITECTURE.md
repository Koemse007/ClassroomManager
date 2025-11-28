# Classroom Management System - Future Deployment Architecture

## Overview
This document outlines the planned deployment architecture for scaling the Classroom Management System from development (SQLite) to production using PostgreSQL, Cloudinary, Render, and Vercel.

---

## 1. Current Architecture (Development)
```
┌─────────────────┐
│   Frontend      │
│   (Vite/React)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│   Backend (Express)     │
│  - SQLite Database      │
│  - Local File Storage   │
│  - JWT Authentication   │
└─────────────────────────┘
```

---

## 2. Future Production Architecture

### 2.1 System Overview
```
┌──────────────────────────┐
│   Frontend (Vercel)      │
│   - React + TypeScript   │
│   - React Query          │
│   - Material Design 3    │
└───────────┬──────────────┘
            │ HTTPS
            │
     ┌──────▼───────┐
     │   CDN Edge   │
     │ (Vercel Edge)│
     └──────┬───────┘
            │
     ┌──────▼────────────┐
     │  Backend (Render) │
     │  - Express.js     │
     │  - Node.js        │
     └──────┬────────────┘
            │
    ┌───────┼───────┐
    │       │       │
    ▼       ▼       ▼
┌────┐ ┌────────────┐ ┌──────────┐
│PG  │ │ Cloudinary │ │ Sessions │
│DB  │ │   (Files)  │ │(Redis-opt)
└────┘ └────────────┘ └──────────┘
```

---

## 3. Component Details

### 3.1 Frontend - Vercel Deployment

**Infrastructure**:
- **Platform**: Vercel (automatic deployment from GitHub)
- **Runtime**: Node.js 20+
- **Build Command**: `npm run build`
- **Start Command**: `npm run preview`

**Features**:
- Automatic deployments on git push
- Preview deployments for PRs
- Edge Functions for API routing
- Built-in analytics and monitoring
- Automatic SSL/TLS certificates
- Global CDN distribution

**Environment Variables** (Vercel Dashboard):
```
VITE_API_URL=https://api.classroom.com
VITE_JWT_SECRET=<from-render>
```

**Build Output**:
- Static React bundle
- Optimized for performance
- Automatic code splitting
- Image optimization

**Performance Optimizations**:
- Edge caching for static assets
- Incremental Static Regeneration
- Automatic minification and compression
- Service worker for offline capability (optional)

---

### 3.2 Backend - Render Deployment

**Infrastructure**:
- **Platform**: Render (Node.js native)
- **Runtime**: Node.js 20+
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start` (using tsx for production)

**Services Architecture**:

#### Main API Service
```
URL: api.classroom.com
- Auto-scaling based on load
- Health checks every 30 seconds
- Automatic restart on failure
- Environment-based configuration
```

**Environment Variables** (Render Dashboard):
```
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@db.render.com:5432/classroom
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
JWT_SECRET=<secure-random-secret>
SESSION_SECRET=<secure-random-secret>
CORS_ORIGIN=https://classroom.vercel.app
```

**Deployment Process**:
1. Connect GitHub repository
2. Render auto-deploys on push to `main` branch
3. Runs npm install
4. Builds TypeScript to JavaScript
5. Starts Express server on port 3000

---

### 3.3 Database - PostgreSQL (Render)

**Infrastructure**:
- **Service**: Render PostgreSQL Database
- **Version**: PostgreSQL 15+
- **Storage**: 10GB (scalable)
- **Backup**: Automatic daily backups (14-day retention)

**Connection Details**:
```
Host: db.render.com
Port: 5432
Database: classroom
User: classroom_user
Password: <secure-password>
```

**Migration from SQLite to PostgreSQL**:

1. **Schema Migration**:
   ```bash
   # Using Drizzle ORM (no manual SQL needed)
   npm run db:migrate
   npm run db:push
   ```

2. **Data Export/Import**:
   ```bash
   # Option A: Using Drizzle ORM
   npm run db:seed (for new databases)
   
   # Option B: Manual dump and restore
   # Export SQLite: sqlite3 classroom.db .dump > dump.sql
   # Import to PostgreSQL: psql -U user -d classroom < dump.sql
   ```

3. **Indexes & Optimization**:
   ```sql
   CREATE INDEX idx_users_email ON users(email);
   CREATE INDEX idx_groups_owner_id ON groups(owner_id);
   CREATE INDEX idx_tasks_group_id ON tasks(group_id);
   CREATE INDEX idx_tasks_due_date ON tasks(due_date);
   CREATE INDEX idx_submissions_student_id ON submissions(student_id);
   CREATE INDEX idx_submissions_task_id ON submissions(task_id);
   CREATE INDEX idx_announcements_group_id ON announcements(group_id);
   CREATE INDEX idx_announcement_reads_user_id ON announcement_reads(user_id);
   ```

**Connection Pooling** (using pg-pool):
```typescript
// Manage connections to prevent exhaustion
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

**Monitoring**:
- Render dashboard shows database size and connections
- Monitor query performance via PostgreSQL logs
- Set up alerts for high connection usage

---

### 3.4 File Storage - Cloudinary

**Infrastructure**:
- **Service**: Cloudinary CDN
- **Storage**: Cloud-based (unlimited, pay per usage)
- **API**: RESTful endpoints for upload/delete/transform

**File Types Supported**:
- Images: JPG, PNG, GIF, WebP
- Documents: PDF
- Video: MP4, MOV (for future announcements)

**Implementation Changes**:

1. **Dependency**:
   ```bash
   npm install cloudinary next-cloudinary
   # or use cloudinary SDK directly
   ```

2. **Backend Integration**:
   ```typescript
   // server/storage.ts - File Upload
   async uploadFile(file: Express.Multer.File): Promise<string> {
     const cloudinary = require('cloudinary').v2;
     
     const result = await cloudinary.uploader.upload_stream(
       {
         resource_type: 'auto',
         public_id: `classroom/${Date.now()}-${file.originalname}`,
         folder: 'classroom/uploads',
       },
       (error: any, result: any) => {
         if (error) throw error;
         return result.secure_url;
       }
     ).end(file.buffer);
     
     return result.secure_url;
   }
   ```

3. **Frontend Integration**:
   ```typescript
   // Upload with preview
   const handleFileUpload = async (file: File) => {
     const formData = new FormData();
     formData.append('file', file);
     
     const response = await fetch('/api/upload', {
       method: 'POST',
       body: formData,
     });
     
     const { url } = await response.json();
     return url; // Cloudinary URL
   };
   ```

4. **File Deletion**:
   ```typescript
   async deleteFile(publicId: string): Promise<void> {
     const cloudinary = require('cloudinary').v2;
     await cloudinary.uploader.destroy(publicId);
   }
   ```

**Benefits**:
- Automatic image optimization and resizing
- CDN distribution for fast downloads
- Virus scanning available
- Backup and redundancy
- No server storage limitations

**Cost Estimation**:
- Free tier: 25GB storage, 25M transformation
- Pro tier: ~$99/month for 1TB storage

---

### 3.5 Optional: Session Storage - Redis (Advanced)

**Use Case**: For high-traffic deployments requiring persistent sessions

**Infrastructure** (Render):
```
Host: redis.render.com
Port: 6379
Database: 0
```

**Implementation**:
```typescript
// server/index.ts
import RedisStore from 'connect-redis';
import { createClient } from 'redis';
import session from 'express-session';

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true, httpOnly: true, sameSite: 'strict' },
}));
```

---

## 4. Migration Strategy

### Phase 1: Setup Infrastructure (Week 1)
- [ ] Create Render PostgreSQL database
- [ ] Create Render Node.js service for backend
- [ ] Create Vercel project for frontend
- [ ] Set up Cloudinary account
- [ ] Configure environment variables

### Phase 2: Code Preparation (Week 2)
- [ ] Update database connection string in code
- [ ] Implement Cloudinary file upload/delete methods
- [ ] Add database migration scripts
- [ ] Update CORS settings for Vercel domain
- [ ] Test locally with PostgreSQL Docker

### Phase 3: Data Migration (Week 3)
- [ ] Export SQLite data
- [ ] Import to PostgreSQL with Drizzle ORM
- [ ] Verify all records migrated correctly
- [ ] Test all queries work with PostgreSQL

### Phase 4: Deployment (Week 4)
- [ ] Deploy backend to Render
- [ ] Deploy frontend to Vercel
- [ ] Run smoke tests
- [ ] Monitor for errors
- [ ] Gradual traffic rollout

### Phase 5: Optimization (Week 5+)
- [ ] Add Redis for sessions (if needed)
- [ ] Implement caching strategy
- [ ] Performance tuning
- [ ] Load testing
- [ ] Monitor costs and optimize

---

## 5. Configuration Changes Needed

### 5.1 Environment Variables by Stage

**Development** (current):
```
NODE_ENV=development
DATABASE_URL=sqlite:./classroom.db
```

**Production**:
```
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@db.render.com:5432/classroom
CLOUDINARY_CLOUD_NAME=xyz
CLOUDINARY_API_KEY=xyz
CLOUDINARY_API_SECRET=xyz
JWT_SECRET=<secure-random>
SESSION_SECRET=<secure-random>
CORS_ORIGIN=https://classroom.vercel.app
API_RATE_LIMIT=100 (requests per minute)
```

### 5.2 Build Configuration

**Vercel** (`vercel.json`):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_API_URL": "@api_url"
  }
}
```

**Render** (`render.yaml`):
```yaml
services:
  - type: web
    name: classroom-api
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
```

---

## 6. Monitoring & Logging

### 6.1 Render Monitoring
- Backend logs: Real-time in Render dashboard
- Database metrics: CPU, memory, connections
- Automatic alerts for service failures

### 6.2 Vercel Monitoring
- Frontend performance metrics
- Error tracking
- Analytics dashboard
- Deployment history

### 6.3 Application Monitoring (Recommended)
```bash
npm install winston # Logging
npm install sentry # Error tracking
```

**Implementation**:
```typescript
// server/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
  ],
});
```

---

## 7. Performance Metrics & Targets

### 7.1 Frontend (Vercel)
| Metric | Target |
|--------|--------|
| First Contentful Paint (FCP) | < 1.8s |
| Largest Contentful Paint (LCP) | < 2.5s |
| Cumulative Layout Shift (CLS) | < 0.1 |
| Time to Interactive (TTI) | < 3.5s |
| Bundle Size | < 250KB gzipped |

### 7.2 Backend (Render)
| Metric | Target |
|--------|--------|
| API Response Time | < 200ms |
| Database Query Time | < 100ms |
| Error Rate | < 0.1% |
| Uptime | 99.9% |

### 7.3 Database (PostgreSQL)
| Metric | Target |
|--------|--------|
| Query Response | < 50ms |
| Connection Pool Usage | < 80% |
| Backup Success | 100% |

---

## 8. Cost Estimation (Monthly)

### Render
| Service | Cost |
|---------|------|
| PostgreSQL (10GB) | $15 |
| Node.js Service (starter) | $12 |
| **Subtotal** | **$27** |

### Vercel
| Service | Cost |
|---------|------|
| Hobby plan (free) | $0 |
| Pro plan (if needed) | $20 |
| **Subtotal** | **$0-20** |

### Cloudinary
| Service | Cost |
|---------|------|
| Free tier (25GB) | $0 |
| Pro (if exceeded) | $99 |
| **Subtotal** | **$0-99** |

### **Total Monthly: $27-146** (depending on scale)

---

## 9. Disaster Recovery Plan

### 9.1 Backup Strategy
- **Database**: Render auto-backup (14-day retention)
- **Files**: Cloudinary backup included
- **Code**: GitHub as source of truth

### 9.2 Rollback Plan
- Keep previous Docker image available
- Tag releases in GitHub
- Render allows instant rollback to previous deployment
- Vercel preview deployments for testing

### 9.3 Data Recovery
```sql
-- PostgreSQL Point-in-time recovery
-- Restore from backup: Render dashboard handles this
-- Test restoration in staging environment first
```

---

## 10. Security Considerations

### 10.1 Infrastructure Security
- Render: Auto SSL/TLS certificates
- Vercel: Edge security, DDoS protection
- PostgreSQL: Encrypted connections, authentication
- Cloudinary: API key rotation, rate limiting

### 10.2 Application Security
- CORS: Restrict to Vercel domain only
- CSRF: Token-based protection
- XSS: Content Security Policy headers
- SQL Injection: Parameterized queries via Drizzle ORM
- File Upload: Validate type/size, scan with Cloudinary

### 10.3 Secrets Management
- Never commit `.env` files
- Use Render/Vercel secret management
- Rotate secrets periodically
- Monitor access logs

---

## 11. DNS Configuration

**Domain Setup** (example: `classroom.com`):
```
Subdomain          Points To           TTL
─────────────────────────────────────────
classroom.com      vercel.com          3600
*.classroom.com    vercel.com          3600
api.classroom.com  render.onrender.com 3600
```

---

## 12. CI/CD Pipeline

### Deploy Flow:
```
GitHub Commit
    ↓
GitHub Actions (optional)
    ├─ Run tests
    ├─ Lint code
    ├─ Build
    ↓
Vercel Auto-Deploy (Frontend)
Render Auto-Deploy (Backend)
    ↓
Staging Environment (Preview)
    ├─ Smoke tests
    ├─ Performance tests
    ↓
Production Deployment
    ├─ Blue-green deployment
    ├─ Health checks
    ↓
Monitor & Alert
```

---

## 13. Scaling Strategy

### 13.1 When to Scale
- Frontend: >10,000 monthly users → Professional Vercel plan
- Backend: >100 concurrent users → Render higher tier
- Database: >1GB data → Upgrade PostgreSQL tier
- Storage: >25GB files → Cloudinary paid plan

### 13.2 Horizontal Scaling
- **Vercel**: Automatic, no configuration needed
- **Render**: Add multiple instances with load balancer
- **PostgreSQL**: Read replicas for read-heavy queries
- **Cloudinary**: Inherent scalability

### 13.3 Vertical Scaling
- Render: Upgrade to Standard or Premium instance
- PostgreSQL: Upgrade storage and RAM
- Vercel: Built on auto-scaling infrastructure

---

## 14. Maintenance Schedule

### Daily
- Monitor error rates and performance
- Check backup completion

### Weekly
- Review logs for anomalies
- Test failover processes
- Monitor cost trends

### Monthly
- Update dependencies
- Security patches
- Performance optimization review
- Database maintenance (VACUUM, ANALYZE)

### Quarterly
- Load testing
- Disaster recovery drill
- Architecture review
- Cost optimization analysis

---

## Summary

**Current (Development)**:
- SQLite + Local storage + Vite/Express

**Future (Production)**:
- PostgreSQL (Render) + Cloudinary + Express (Render) + React (Vercel)

**Benefits**:
- Unlimited scalability
- Professional CDN distribution
- Automated backups and disaster recovery
- Enterprise-grade infrastructure
- Cost-effective ($27-146/month)
- Global distribution
- 99.9% uptime SLA

**Timeline**: 4-5 weeks from planning to full production deployment
