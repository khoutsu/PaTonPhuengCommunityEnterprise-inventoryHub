# Docker Setup for Ecom-Warehouse

This guide explains how to run the Ecom-Warehouse application using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git

## Quick Start

### Development Mode

1. **Clone and setup environment files:**
   ```bash
   git clone <your-repo-url>
   cd Ecom-Warehouse
   
   # Copy environment templates
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```

2. **Edit environment files with your actual values:**
   - `backend/.env` - Configure Firebase credentials, JWT secrets, etc.
   - `frontend/.env.local` - Configure Firebase client config, API URLs, etc.

3. **Start development environment:**
   ```bash
   npm run dev
   ```
   
   This will start:
   - Backend API on http://localhost:5000
   - Frontend on http://localhost:3001
   - Auto-reload on code changes

### Production Mode

1. **Start production environment:**
   ```bash
   npm run prod
   ```
   
   This will start:
   - Backend API on http://localhost:5000
   - Frontend on http://localhost:3001
   - Nginx reverse proxy on http://localhost:80

## Available Scripts

### Root Directory Scripts
- `npm run dev` - Start development environment
- `npm run dev:detach` - Start development environment in background
- `npm run dev:down` - Stop development environment
- `npm run prod` - Start production environment
- `npm run prod:detach` - Start production environment in background
- `npm run prod:down` - Stop production environment
- `npm run build` - Build production images
- `npm run build:dev` - Build development images
- `npm run logs` - View all container logs
- `npm run logs:backend` - View backend logs only
- `npm run logs:frontend` - View frontend logs only
- `npm run clean` - Remove all containers, volumes, and images
- `npm run clean:dev` - Clean development environment

### Individual Service Scripts

#### Backend
```bash
cd backend
npm run docker:build       # Build production image
npm run docker:build:dev   # Build development image
npm run docker:run         # Run production container
npm run docker:run:dev     # Run development container
```

#### Frontend
```bash
cd frontend
npm run docker:build       # Build production image
npm run docker:build:dev   # Build development image
npm run docker:run         # Run production container
npm run docker:run:dev     # Run development container
```

## Architecture

### Services

1. **Backend (Node.js/Express)**
   - Port: 5000
   - Environment: Production/Development
   - Dependencies: Firebase Admin SDK, JWT, etc.

2. **Frontend (Next.js)**
   - Port: 3001
   - Environment: Production/Development
   - Dependencies: React, Firebase Client SDK, etc.

3. **Nginx (Reverse Proxy)**
   - Port: 80 (HTTP), 443 (HTTPS)
   - Routes API calls to backend
   - Serves frontend application
   - Includes rate limiting and security headers

### Network

All services communicate through a Docker bridge network called `ecom-network`.

## Environment Variables

### Backend (.env)
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 5000)
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_PRIVATE_KEY` - Firebase service account private key
- `FIREBASE_CLIENT_EMAIL` - Firebase service account email
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRES_IN` - JWT expiration time
- `ALLOWED_ORIGINS` - CORS allowed origins

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_FIREBASE_*` - Firebase client configuration
- `NEXT_PUBLIC_APP_NAME` - Application name
- `NEXT_TELEMETRY_DISABLED` - Disable Next.js telemetry

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check if ports are in use
   netstat -tulpn | grep :3001
   netstat -tulpn | grep :5000
   netstat -tulpn | grep :80
   ```

2. **Environment variables not loaded:**
   - Ensure `.env` files exist and have correct format
   - Check file permissions
   - Restart containers after changing environment variables

3. **Build failures:**
   ```bash
   # Clean and rebuild
   npm run clean
   npm run build
   ```

4. **Database connection issues:**
   - Verify Firebase credentials in backend/.env
   - Check Firebase project settings
   - Ensure service account has proper permissions

5. **CORS issues:**
   - Verify `ALLOWED_ORIGINS` in backend/.env
   - Check `NEXT_PUBLIC_API_URL` in frontend/.env.local

### Useful Commands

```bash
# View container status
docker ps

# View container logs
docker logs ecom-backend
docker logs ecom-frontend

# Execute commands in running container
docker exec -it ecom-backend /bin/sh
docker exec -it ecom-frontend /bin/sh

# View Docker images
docker images

# Remove unused Docker resources
docker system prune

# View network information
docker network ls
docker network inspect ecom_ecom-network
```

## Security Considerations

1. **Environment Variables:**
   - Never commit `.env` files to version control
   - Use strong, unique secrets for JWT
   - Rotate secrets regularly

2. **Network Security:**
   - Use HTTPS in production
   - Configure proper firewall rules
   - Implement rate limiting

3. **Container Security:**
   - Run containers as non-root users
   - Keep base images updated
   - Scan images for vulnerabilities

## Production Deployment

For production deployment:

1. Use Docker Swarm or Kubernetes for orchestration
2. Set up proper SSL certificates
3. Configure external databases (not containerized)
4. Implement monitoring and logging
5. Set up backup strategies
6. Use secrets management systems

## Development Tips

1. **Hot Reload:**
   - Development containers mount source code as volumes
   - Changes are reflected immediately without rebuilding

2. **Debugging:**
   - Use `docker logs` to view application logs
   - Access container shell for debugging
   - Use VS Code Remote-Containers extension

3. **Database:**
   - Consider using Docker volumes for data persistence
   - Set up database migrations
   - Create seed data for development