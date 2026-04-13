#!/bin/bash
set -e

# Update system
apt-get update -y
apt-get install -y curl git

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Install Redis locally
apt-get install -y redis-server
systemctl enable redis-server
systemctl start redis-server

# Install PostgreSQL client
apt-get install -y postgresql-client

# Clone the repo
cd /home/ubuntu
git clone https://github.com/MalekSaifali/skillnest.git app || true
cd app

# Write .env files for all services
cat > gateway/.env <<EOF
PORT=4000
JWT_SECRET=${jwt_secret}
EOF

cat > services/auth-service/.env <<EOF
PORT=4006
DATABASE_URL=postgresql://skillnest:${db_password}@${db_host}:5432/skillnest
JWT_SECRET=${jwt_secret}
EOF

cat > services/user-service/.env <<EOF
PORT=4001
DATABASE_URL=postgresql://skillnest:${db_password}@${db_host}:5432/skillnest
JWT_SECRET=${jwt_secret}
EOF

cat > services/follow-service/.env <<EOF
PORT=4002
DATABASE_URL=postgresql://skillnest:${db_password}@${db_host}:5432/skillnest
JWT_SECRET=${jwt_secret}
EOF

cat > services/connect-service/.env <<EOF
PORT=4003
DATABASE_URL=postgresql://skillnest:${db_password}@${db_host}:5432/skillnest
JWT_SECRET=${jwt_secret}
EOF

cat > services/chat-service/.env <<EOF
PORT=4004
DATABASE_URL=postgresql://skillnest:${db_password}@${db_host}:5432/skillnest
JWT_SECRET=${jwt_secret}
EOF

cat > services/search-service/.env <<EOF
PORT=4005
ELASTICSEARCH_URL=http://localhost:9200
JWT_SECRET=${jwt_secret}
EOF

# Install dependencies
npm install
cd gateway && npm install && cd ..
cd services/auth-service && npm install && cd ../..
cd services/user-service && npm install && cd ../..
cd services/follow-service && npm install && cd ../..
cd services/connect-service && npm install && cd ../..
cd services/chat-service && npm install && cd ../..
cd services/search-service && npm install && cd ../..

# Init DB tables
node init-db.js

# Start all services with PM2
pm2 start gateway/index.js --name gateway
pm2 start services/auth-service/index.js --name auth-service
pm2 start services/user-service/src/index.js --name user-service
pm2 start services/follow-service/src/index.js --name follow-service
pm2 start services/connect-service/src/index.js --name connect-service
pm2 start services/chat-service/src/index.js --name chat-service
pm2 start services/search-service/src/index.js --name search-service

pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu

echo "✅ SkillNest backend deployed successfully!"
