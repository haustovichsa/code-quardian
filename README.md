# Code Guardian

## Pre Requirements

### Local Development
- Node.js (v18 or higher)
- MongoDB (v7)
- Redis (v7)
- Trivy CLI installed

### Docker Deployment
- Docker
- Docker Compose

## Running Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file in the project root:
```env
PORT=3000
GRAPHQL_PORT=4000
NODE_ENV=development
LOG_LEVEL=info
MONGO_URI=mongodb://localhost:27017/code-guardian
REDIS_URL=redis://localhost:6379
```

### 3. Start MongoDB and Redis
Ensure MongoDB is running on port 27017 and Redis on port 6379.

### 4. Run the Services

**Development Mode (with hot reload):**
```bash
# Start both REST API and GraphQL servers
npm run dev

# Or start them separately:
npm run dev:rest      # REST API on port 3000
npm run dev:graphql   # GraphQL on port 4000

# Start worker process
npm run dev:worker
```

**Production Mode:**
```bash
# Build the project
npm run build

# Start both servers
npm start

# Or start them separately:
npm start:rest      # REST API on port 3000
npm start:graphql   # GraphQL on port 4000

# Start worker process
npm start:worker
```

## Running with Docker

### Start All Services
```bash
docker-compose up
```

This will start:
- MongoDB on port 27017
- Redis on port 6379
- REST API on port 3000
- GraphQL server on port 4000
- 2 worker processes


### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f graphql
docker-compose logs -f worker-1
```

## Testing

The `scripts/` directory contains testing utilities to verify Code Guardian functionality and performance.

### Pre Requirements

Ensure services are running before executing tests:
- **Local Development**: REST API (port 3000), GraphQL (port 4000), and worker process must be running
- **Docker**: `docker-compose up` starts all required services
- **Optional**: Install `jq` for GraphQL scripts
  ```bash
  # macOS
  brew install jq

  # Linux
  apt-get install jq
  ```

### Single Scan Tests

Test the complete scan workflow (create scan, poll status, retrieve results).

**REST API:**
```bash
# Default repository (NodeGoat)
./scripts/run-1-scan.rest-api.sh

# Custom repository
./scripts/run-1-scan.rest-api.sh https://github.com/user/repo
```

**GraphQL API:**
```bash
# Default repository (NodeGoat)
./scripts/run-1-scan.graphql.sh

# Custom repository
./scripts/run-1-scan.graphql.sh https://github.com/user/repo
```

Both scripts create a scan, poll every 0.5 seconds, and display the final result with all CRITICAL vulnerabilities found.

### Load Tests

Test system performance and worker scaling by creating 100 concurrent scans.

**REST API:**
```bash
./scripts/run-100-scans.rest-api.sh
```

**GraphQL API:**
```bash
./scripts/run-100-scans.graphql.sh
```

Load tests display real-time progress:
```
[21:45:32] Queued: 5 | Scanning: 10 | Finished: 80 | Failed: 5 | Progress: 85%
```

And show a final summary:
```
========================================
All scans completed!
========================================
Total scans:      100
Finished:         95
Failed:           5
Success rate:     95%
```

