# Atlas Lease Extractor - Backend Deployment Plan

## Overview

This document outlines the deployment strategy for the Atlas Lease Extractor backend. Due to architecture incompatibilities with Cloudflare Workers, we recommend a hybrid approach using Railway or Google Cloud Run with Cloudflare as a CDN/proxy layer.

## Architecture Assessment

### ❌ Why Cloudflare Workers Won't Work
- **Stateful Architecture**: Your dual-server setup requires persistent processes
- **Complex Dependencies**: ChromaDB, SQLAlchemy, multiprocessing aren't supported
- **Storage Requirements**: Need persistent file system for vector databases
- **Memory/CPU**: ML workloads exceed serverless limitations

## Recommended Deployment Options

### Option 1: Railway + Cloudflare (Recommended)

**Pros:**
- Simple Python/Docker deployment
- Built-in persistent storage
- Automatic HTTPS
- Easy environment management
- Git-based deployments

**Architecture:**
```
Frontend (Vercel) → Cloudflare CDN → Railway Backend
```

#### Railway Setup Steps:

1. **Project Setup**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and init project
   railway login
   railway init
   ```

2. **Environment Configuration**
   ```bash
   # Set environment variables
   railway variables set OPENAI_API_KEY=your_key
   railway variables set LLAMA_CLOUD_API_KEY=your_key
   railway variables set LLAMA_CLOUD_ORG_ID=your_org_id
   railway variables set INDEX_SERVER_KEY=your_secure_key_min_16_chars
   railway variables set FLASK_ENV=production
   railway variables set CORS_ORIGINS=https://app.atlasdata.coop,https://atlasdata.coop
   ```

3. **Deploy**
   ```bash
   # Deploy from current directory
   railway up
   ```

4. **Configure Cloudflare Tunnel** (Optional)
   - Create Cloudflare tunnel pointing to your Railway URL
   - Add custom domain for branded API endpoint
   - Enable security features (rate limiting, bot protection)

### Option 2: Google Cloud Run + Cloudflare

**Pros:**
- Enterprise-grade scaling
- Per-request pricing
- Persistent volumes available
- Strong Google Cloud integration

#### Cloud Run Setup Steps:

1. **Build and Push Image**
   ```bash
   # Build image
   docker build -t atlas-backend .
   
   # Tag for Google Container Registry
   docker tag atlas-backend gcr.io/YOUR_PROJECT_ID/atlas-backend
   
   # Push to registry
   docker push gcr.io/YOUR_PROJECT_ID/atlas-backend
   ```

2. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy atlas-backend \
     --image gcr.io/YOUR_PROJECT_ID/atlas-backend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --memory 2Gi \
     --cpu 2 \
     --concurrency 10 \
     --max-instances 5
   ```

3. **Add Persistent Storage**
   ```bash
   # Create Cloud SQL instance for PostgreSQL
   gcloud sql instances create atlas-db \
     --database-version=POSTGRES_14 \
     --tier=db-f1-micro \
     --region=us-central1
   ```

## Docker Configuration

### Files Created:
- **Dockerfile**: Multi-stage Python 3.12 build with security hardening
- **docker-entrypoint.sh**: Startup script handling both Flask and Index servers
- **.dockerignore**: Optimized for minimal build context

### Key Features:
- **Health Checks**: Built-in health monitoring
- **Non-root User**: Security best practices
- **Graceful Shutdown**: Proper signal handling
- **Environment Validation**: Production safety checks

## Environment Variables

### Required Production Variables:
```bash
OPENAI_API_KEY=sk-...
LLAMA_CLOUD_API_KEY=llx-...
LLAMA_CLOUD_ORG_ID=org-...
INDEX_SERVER_KEY=your-secure-key-min-16-chars
FLASK_ENV=production
NODE_ENV=production
```

### Optional Configuration:
```bash
# Database
POSTGRES_HOST=your-db-host
POSTGRES_PORT=5432
POSTGRES_DB=atlas_db
POSTGRES_USER=atlas_user
POSTGRES_PASSWORD=secure_password

# Observability
PHOENIX_CLIENT_HEADERS=api_key=YOUR_ARIZE_KEY
PHOENIX_COLLECTOR_ENDPOINT=https://app.phoenix.arize.com

# Server Configuration
INDEX_SERVER_HOST=127.0.0.1
INDEX_SERVER_PORT=5602
CORS_ORIGINS=https://app.atlasdata.coop,https://atlasdata.coop
```

## Storage Requirements

### Persistent Volumes Needed:
- **ChromaDB**: `/app/chroma_db` (vector database)
- **Documents**: `/app/uploaded_documents` (user uploads)
- **Results**: `/app/extraction_results` (processed data)
- **Indexes**: `/app/persist_dir` (LlamaIndex storage)

### Railway Storage:
- Automatic persistent volumes
- No additional configuration needed

### Cloud Run Storage:
- Need Cloud Filestore or Cloud SQL for persistence
- Configure volume mounts in deployment

## Frontend Integration

### Update Frontend Environment Variables:
```bash
# Vercel environment variables for both apps
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
ATLAS_API_URL=https://your-backend-domain.com
```

### CORS Configuration:
Update `flask_server.py` CORS origins:
```python
CORS(app, origins=[
    "https://app.atlasdata.coop",
    "https://atlasdata.coop",
    "http://localhost:3001",  # Keep for development
    "http://localhost:3002"   # Keep for development
], supports_credentials=True)
```

## Security Considerations

### Production Checklist:
- [ ] Strong INDEX_SERVER_KEY (32+ characters)
- [ ] Environment secrets properly encrypted
- [ ] HTTPS enforced on all endpoints
- [ ] CORS properly configured
- [ ] Database credentials secured
- [ ] API rate limiting configured
- [ ] Monitoring and alerting set up

## Cost Estimates

### Railway:
- **Hobby**: $5/month (512MB RAM)
- **Pro**: $20/month (8GB RAM, better for your workload)

### Google Cloud Run:
- **Pay-per-use**: ~$0.40/hour when active
- **Estimated**: $50-150/month depending on usage

### Cloudflare:
- **Free Tier**: CDN and basic security
- **Pro**: $20/month for advanced features

## Testing Deployment

### Local Testing:
```bash
# Build and test locally
docker build -t atlas-backend .
docker run -p 5601:5601 -p 5602:5602 \
  -e OPENAI_API_KEY=your_key \
  -e LLAMA_CLOUD_API_KEY=your_key \
  -e LLAMA_CLOUD_ORG_ID=your_org \
  -e INDEX_SERVER_KEY=test-key-min-16-chars \
  atlas-backend
```

### Health Check Endpoints:
- **Flask Server**: `GET /health`
- **Index Server**: Monitor process status

## Migration Strategy

### Phase 1: Staging Deployment
1. Deploy to Railway/Cloud Run with staging domain
2. Update frontend to point to staging API
3. Test all functionality thoroughly

### Phase 2: Production Cutover
1. Configure production environment variables
2. Update DNS/Cloudflare settings
3. Monitor logs and performance
4. Rollback plan if issues occur

## Monitoring & Observability

### Built-in Features:
- **Phoenix/Arize**: ML pipeline observability
- **Flask Logging**: Application logs
- **Health Checks**: Container health monitoring

### Recommended Additions:
- **Sentry**: Error tracking
- **DataDog/New Relic**: Performance monitoring
- **Uptime Monitoring**: Service availability

## Next Steps

When you're ready to deploy:

1. **Choose platform** (Railway recommended for simplicity)
2. **Set up account** and CLI tools
3. **Configure environment variables**
4. **Deploy and test staging**
5. **Update frontend configuration**
6. **Go live with monitoring**

This deployment strategy maintains your sophisticated AI backend architecture while providing the scalability and reliability you need for production.