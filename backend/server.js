const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const Database = require('better-sqlite3');
const multer = require('multer');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Database
const db = new Database(process.env.DB_PATH || 'database.sqlite');
console.log('Connected to SQLite database.');

// Initialize Provider
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://127.0.0.1:8545');

// Routes
const propertiesRoutes = require('./routes/properties');
const transfersRoutes = require('./routes/transfers');
const documentsRoutes = require('./routes/documents');
const auditRoutes = require('./routes/audit');
app.use('/api/properties', propertiesRoutes);
app.use('/api/transfers', transfersRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/audit-log', auditRoutes);
app.use('/uploads', express.static('uploads'));

// Basic health check route
app.get('/api/health', async (req, res) => {
  try {
    const blockNumber = await provider.getBlockNumber();
    res.json({ status: 'ok', latestBlock: blockNumber });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'RPC connection failed' });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
