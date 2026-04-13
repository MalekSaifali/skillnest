const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
}

function proxy(target, pathPrefix) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: { [`^${pathPrefix}`]: '' },
    onProxyReq: (proxyReq, req) => {
      const email = req.user?.email || '';
      const name = req.user?.name || '';
      const sub = req.user?.sub || String(req.user?.id || '');
      proxyReq.setHeader('x-user-email', email);
      proxyReq.setHeader('x-user-name', name);
      proxyReq.setHeader('x-user-sub', sub);
      if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    }
  });
}

app.get('/health', (req, res) => res.json({ status: 'gateway ok' }));

app.use('/api/users',       verifyToken, proxy('http://localhost:4001', '/api/users'));
app.use('/api/posts',       verifyToken, proxy('http://localhost:4001', '/api/posts'));
app.use('/api/follow',      verifyToken, proxy('http://localhost:4002', '/api/follow'));
app.use('/api/connections', verifyToken, proxy('http://localhost:4003', '/api/connections'));
app.use('/api/connect',     verifyToken, proxy('http://localhost:4003', '/api/connect'));
app.use('/api/chat',        verifyToken, proxy('http://localhost:4004', '/api/chat'));
app.use('/api/search',      verifyToken, proxy('http://localhost:4005', '/api/search'));
app.use('/api/auth',        proxy('http://localhost:4006', '/api/auth'));

app.listen(4000, () => console.log('✅ API Gateway running on port 4000'));