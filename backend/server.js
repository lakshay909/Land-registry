const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const path = require('path');
const multer = require('multer');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[API] ${req.method} ${req.originalUrl} ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// Initialize Database
const db = require('./db');
console.log('Connected to SQLite database.');

// Initialize Provider
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://127.0.0.1:8545');

// Routes
const propertiesRoutes = require('./routes/properties');
const transfersRoutes = require('./routes/transfers');
const documentsRoutes = require('./routes/documents');
const auditRoutes = require('./routes/audit');
const valuationRoutes = require('./routes/valuation');
app.use('/api/properties', propertiesRoutes);
app.use('/api/transfers', transfersRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/audit-log', auditRoutes);
app.use('/api/valuation', valuationRoutes);

// Marketplace direct route alias
app.get('/api/marketplace', (req, res, next) => {
  req.url = '/marketplace';
  propertiesRoutes(req, res, next);
});

// Basic health check route
app.get('/api/health', async (req, res) => {
  try {
    const blockNumber = await provider.getBlockNumber();
    res.json({ status: 'ok', latestBlock: blockNumber });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'RPC connection failed' });
  }
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
  });
}

module.exports = app;
