# HealthyBites Deployment Guide

This guide covers how to deploy the HealthyBites application to various platforms for production use.

## 🏗️ Build Process

### Backend Build
```bash
cd backend
npm run build
```

### Frontend Build
```bash
cd frontend
npm run build
```

## 🐳 Docker Deployment

### 1. Create Docker Files

**Backend Dockerfile:**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Docker Compose:**
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: healthybites-mongo
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:7-alpine
    container_name: healthybites-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    container_name: healthybites-api
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://admin:password123@mongodb:27017/healthybites?authSource=admin
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongodb
      - redis
    volumes:
      - ./backend/.env:/app/.env

  frontend:
    build: ./frontend
    container_name: healthybites-web
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
  redis_data:
```

### 2. Deploy with Docker
```bash
docker-compose up -d
```

## ☁️ Cloud Deployment

### AWS Deployment

#### 1. EC2 + Docker
```bash
# Connect to EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Docker
sudo apt update
sudo apt install docker.io docker-compose -y
sudo systemctl start docker
sudo systemctl enable docker

# Clone repository
git clone your-repo-url
cd healthy-food-delivery-app

# Setup environment
cp backend/.env.example backend/.env
# Edit backend/.env with production values

# Deploy
sudo docker-compose up -d
```

#### 2. Elastic Beanstalk
```bash
# Install EB CLI
pip install awsebcli

# Initialize EB application
eb init

# Create environment
eb create production

# Deploy
eb deploy
```

#### 3. ECS with Fargate
```yaml
# ecs-task-definition.json
{
  "family": "healthybites",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "healthybites-backend",
      "image": "your-account.dkr.ecr.region.amazonaws.com/healthybites-backend:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/healthybites",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### DigitalOcean Deployment

#### 1. Droplet Setup
```bash
# Create droplet with Ubuntu 20.04
# SSH into droplet
ssh root@your-droplet-ip

# Install dependencies
apt update
apt install nodejs npm nginx mongodb redis-server -y

# Setup MongoDB
systemctl start mongod
systemctl enable mongod

# Setup Redis
systemctl start redis-server
systemctl enable redis-server

# Setup application
git clone your-repo-url
cd healthy-food-delivery-app
npm install

# Build and start backend
cd backend
npm install
npm run build
pm2 start dist/server.js --name healthybites-api

# Build and serve frontend
cd ../frontend
npm install
npm run build
# Copy build files to nginx
cp -r dist/* /var/www/html/
```

#### 2. Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Heroku Deployment

#### 1. Backend (Heroku)
```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create healthybites-api

# Add MongoDB addon
heroku addons:create mongolab:sandbox

# Add Redis addon
heroku addons:create heroku-redis:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret-key

# Deploy
git subtree push --prefix backend heroku main
```

#### 2. Frontend (Netlify/Vercel)

**Netlify:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
cd frontend
npm run build
netlify deploy --prod --dir=dist
```

**Vercel:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel --prod
```

## 🔧 Environment Setup

### Production Environment Variables

**Backend (.env):**
```env
NODE_ENV=production
PORT=5000

# Database (Use MongoDB Atlas for production)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/healthybites
REDIS_URL=redis://username:password@redis-host:port

# JWT (Generate strong secrets)
JWT_SECRET=your-super-strong-jwt-secret-512-bits
JWT_REFRESH_SECRET=your-refresh-token-secret

# Email (Use production SMTP)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key

# SMS (Production Twilio)
TWILIO_ACCOUNT_SID=your-production-twilio-sid
TWILIO_AUTH_TOKEN=your-production-twilio-token

# File Upload (Production Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Payment Gateways (Production)
ESEWA_MERCHANT_ID=your-production-esewa-id
KHALTI_SECRET_KEY=your-production-khalti-key
STRIPE_SECRET_KEY=sk_live_your_stripe_key

# External APIs
OPENAI_API_KEY=your-openai-api-key
GOOGLE_MAPS_API_KEY=your-google-maps-key
```

## 🔒 Security Checklist

### Backend Security
- [ ] Use HTTPS/TLS certificates (Let's Encrypt)
- [ ] Set secure HTTP headers with Helmet.js
- [ ] Enable CORS only for trusted domains
- [ ] Use strong JWT secrets (512+ bits)
- [ ] Implement rate limiting
- [ ] Sanitize user inputs
- [ ] Use environment variables for secrets
- [ ] Enable MongoDB authentication
- [ ] Setup firewall rules
- [ ] Keep dependencies updated

### Database Security
```bash
# MongoDB security
use admin
db.createUser({
  user: "healthybites",
  pwd: "strong-password",
  roles: ["readWrite", "dbAdmin"]
})

# Enable authentication in mongod.conf
security:
  authorization: enabled
```

### SSL/TLS Setup (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoring & Logging

### Application Monitoring
```bash
# Install PM2 for process management
npm install -g pm2

# Start with PM2
pm2 start backend/dist/server.js --name healthybites-api
pm2 startup
pm2 save

# Monitor
pm2 monit
pm2 logs healthybites-api
```

### Log Aggregation (ELK Stack)
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  elasticsearch:
    image: elasticsearch:7.14.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"

  logstash:
    image: logstash:7.14.0
    ports:
      - "5000:5000"
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf

  kibana:
    image: kibana:7.14.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
```

## 🚀 Performance Optimization

### Backend Optimization
- Use Node.js clustering
- Implement Redis caching
- Database indexing
- CDN for static assets
- Gzip compression

### Frontend Optimization
- Code splitting with Vite
- Image optimization
- Service Worker for caching
- Bundle analysis

```bash
# Analyze bundle size
cd frontend
npm run build
npx vite-bundle-analyzer dist
```

## 🔄 CI/CD Pipeline

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Run tests
        run: npm test
        
      - name: Build backend
        run: cd backend && npm run build
        
      - name: Build frontend
        run: cd frontend && npm run build
        
      - name: Deploy to server
        run: |
          # Your deployment script here
```

## 📱 Mobile App Deployment

### Android (Google Play Store)
```bash
cd mobile
# Generate signed APK
npx react-native build-android --mode=release

# Generate AAB for Play Store
./gradlew bundleRelease
```

## 🆘 Troubleshooting

### Common Issues

1. **MongoDB Connection Issues**
   ```bash
   # Check MongoDB status
   systemctl status mongod
   
   # Check logs
   tail -f /var/log/mongodb/mongod.log
   ```

2. **Redis Connection Issues**
   ```bash
   # Test Redis connection
   redis-cli ping
   
   # Check Redis logs
   tail -f /var/log/redis/redis-server.log
   ```

3. **Application Not Starting**
   ```bash
   # Check PM2 status
   pm2 status
   
   # View application logs
   pm2 logs healthybites-api --lines 50
   ```

4. **High Memory Usage**
   ```bash
   # Monitor resource usage
   htop
   
   # Check Node.js heap usage
   node --inspect dist/server.js
   ```

## 📞 Support

For deployment issues:
- Email: devops@healthybites.com.np
- Slack: #deployment-support
- Documentation: https://docs.healthybites.com.np

---

**Remember:** Always test deployments in a staging environment before production!