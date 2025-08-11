// Simulation routes for running EnergyPlus simulations and processing results
import express from 'express';
import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import db from '../models/database.js';
import { generateSimulationInput } from '../services/simulationService.js';

const router = express.Router();

// Run simulation for a project
router.post('/project/:id/run', async (req, res) => {
  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get selected ECMs
    const ecms = db.prepare(`
      SELECT e.*, pe.custom_savings_percent, pe.custom_implementation_cost
      FROM project_ecms pe
      JOIN ecms e ON pe.ecm_id = e.id
      WHERE pe.project_id = ? AND pe.is_selected = 1
    `).all(req.params.id);
    
    // Generate simulation input configuration
    const simulationConfig = generateSimulationInput(project, ecms, req.body);
    
    // Save configuration to temporary file
    const configPath = path.join(process.cwd(), 'temp', `project_${project.id}_config.json`);
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(simulationConfig, null, 2));
    
    // Run the Python simulation script
    const pythonScript = path.join(process.cwd(), '..', '..', 'energyplus_example_file_generator', 'tests', 'ashrae_systems', 'run_simulation.py');
    
    const simulation = spawn('python', [pythonScript, configPath]);
    
    let output = '';
    let error = '';
    
    simulation.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    simulation.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    simulation.on('close', async (code) => {
      if (code !== 0) {
        console.error('Simulation error:', error);
        return res.status(500).json({ error: 'Simulation failed', details: error });
      }
      
      // Read the enable_output.json file
      const outputPath = path.join(path.dirname(configPath), `project_${project.id}_enable_output.json`);
      try {
        const results = await fs.readFile(outputPath, 'utf-8');
        const parsedResults = JSON.parse(results);
        
        // Store results in database
        db.prepare(`
          INSERT OR REPLACE INTO simulation_results (project_id, results, created_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
        `).run(project.id, results);
        
        res.json({
          message: 'Simulation completed successfully',
          results: parsedResults
        });
      } catch (err) {
        res.status(500).json({ error: 'Failed to read simulation results' });
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get simulation results for a project
router.get('/project/:id/results', async (req, res) => {
  try {
    const results = db.prepare(`
      SELECT results, created_at 
      FROM simulation_results 
      WHERE project_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `).get(req.params.id);
    
    if (!results) {
      return res.status(404).json({ error: 'No simulation results found' });
    }
    
    const parsedResults = JSON.parse(results.results);
    
    // Calculate savings comparisons
    const comparisons = calculateComparisons(parsedResults);
    
    res.json({
      results: parsedResults,
      comparisons,
      timestamp: results.created_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Calculate comparisons between baseline and improvements
function calculateComparisons(results) {
  const baseline = results.baseline;
  const equipment = results.hvac_equipment_improvements;
  const controls = results.hvac_controls_improvements;
  
  const comparisons = {
    equipment_vs_baseline: {
      energy_savings: baseline.annual_energy_cost.total - equipment.annual_energy_cost.total,
      energy_savings_percent: ((baseline.annual_energy_cost.total - equipment.annual_energy_cost.total) / baseline.annual_energy_cost.total) * 100,
      demand_reduction: baseline.peak_demand.electricity - equipment.peak_demand.electricity,
      co2_reduction: baseline.emissions.co2 - equipment.emissions.co2
    },
    controls_vs_baseline: {
      energy_savings: baseline.annual_energy_cost.total - controls.annual_energy_cost.total,
      energy_savings_percent: ((baseline.annual_energy_cost.total - controls.annual_energy_cost.total) / baseline.annual_energy_cost.total) * 100,
      demand_reduction: baseline.peak_demand.electricity - controls.peak_demand.electricity,
      co2_reduction: baseline.emissions.co2 - controls.emissions.co2
    },
    combined_potential: {
      energy_savings: baseline.annual_energy_cost.total - Math.min(equipment.annual_energy_cost.total, controls.annual_energy_cost.total),
      energy_savings_percent: ((baseline.annual_energy_cost.total - Math.min(equipment.annual_energy_cost.total, controls.annual_energy_cost.total)) / baseline.annual_energy_cost.total) * 100
    }
  };
  
  return comparisons;
}

export default router;