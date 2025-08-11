// Main server file for ESPC Express Calculator
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import projectRoutes from './routes/projects.js';
import ecmRoutes from './routes/ecms.js';
import calculationRoutes from './routes/calculations.js';
import simulationRoutes from './routes/simulation.js';
import buildingConfigRoutes from './routes/buildingConfig.js';
import { initializeDatabase } from './models/database.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allow cross-origin requests from frontend
app.use(express.json()); // Parse JSON request bodies

// Initialize database
initializeDatabase();

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/ecms', ecmRoutes);
app.use('/api/calculations', calculationRoutes);
app.use('/api/simulations', simulationRoutes);
app.use('/api/building-config', buildingConfigRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'ESPC Express Calculator API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`ESPC Express Calculator API running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});