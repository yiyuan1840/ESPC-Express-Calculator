// Calculation routes for ECM evaluation
import express from 'express';
import db from '../models/database.js';
import { calculateSavings, generateMeasuresConfig } from '../services/calculationService.js';

const router = express.Router();

// Calculate savings for a project
router.post('/project/:id/calculate', async (req, res) => {
  try {
    // Get project details
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get selected ECMs for the project
    const ecms = db.prepare(`
      SELECT e.*, pe.custom_savings_percent, pe.custom_implementation_cost
      FROM project_ecms pe
      JOIN ecms e ON pe.ecm_id = e.id
      WHERE pe.project_id = ? AND pe.is_selected = 1
    `).all(req.params.id);
    
    // Calculate savings
    const results = calculateSavings(project, ecms);
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate simulation configuration for a project
router.post('/project/:id/simulation-config', async (req, res) => {
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
    
    // Generate measures configuration based on ECMs
    const measuresConfig = generateMeasuresConfig(ecms);
    
    // Base configuration structure (simplified for MVP)
    const simulationConfig = {
      building_inputs: {
        building_name: project.name,
        location: project.location,
        building_type: project.building_type,
        total_floor_area: project.building_area,
        number_of_floors: req.body.number_of_floors || 2,
        floor_to_floor_height: req.body.floor_to_floor_height || 3.5,
        building_shape: req.body.building_shape || 'Rectangle',
        building_orientation: req.body.building_orientation || 0
      },
      measures: measuresConfig
    };
    
    res.json(simulationConfig);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Quick calculation endpoint (without full simulation)
router.post('/quick-calculate', (req, res) => {
  try {
    const { annual_energy_cost, ecms } = req.body;
    
    if (!annual_energy_cost || !ecms || !Array.isArray(ecms)) {
      return res.status(400).json({ error: 'Invalid input' });
    }
    
    // Calculate combined savings
    let totalSavingsPercent = 0;
    let totalImplementationCost = 0;
    
    // Simple additive model for MVP (in reality, ECMs interact)
    ecms.forEach(ecm => {
      totalSavingsPercent += ecm.estimated_savings_percent || 0;
      totalImplementationCost += ecm.implementation_cost || 0;
    });
    
    // Cap total savings at a realistic maximum
    totalSavingsPercent = Math.min(totalSavingsPercent, 50);
    
    const annualSavings = annual_energy_cost * (totalSavingsPercent / 100);
    const simplePayback = totalImplementationCost / annualSavings;
    
    res.json({
      annual_energy_cost,
      total_savings_percent: totalSavingsPercent,
      annual_savings: annualSavings,
      total_implementation_cost: totalImplementationCost,
      simple_payback_years: simplePayback,
      ecm_count: ecms.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ECM categories with typical measures configurations
router.get('/ecm-templates', (req, res) => {
  try {
    // Return ECM templates with their corresponding measures configurations
    const templates = {
      'Lighting': {
        measures: {
          lighting_equipment: {
            lighting_power_density_reduction: 0.3,
            lighting_control_type: 'occupancy'
          }
        }
      },
      'HVAC': {
        measures: {
          hvac_controls: {
            cooling_setpoint: 24.0,
            heating_setpoint: 21.0,
            has_setback: true,
            has_dcv: true
          },
          hvac_equipment: {
            fan_efficiency: 0.8,
            fan_motor_efficiency: 0.95,
            chiller_cop: 6.0,
            boiler_efficiency: 0.95
          }
        }
      },
      'Envelope': {
        measures: {
          envelope: {
            wall_insulation_r_value: 20,
            roof_insulation_r_value: 30,
            window_u_value: 0.3,
            window_shgc: 0.4
          }
        }
      },
      'Controls': {
        measures: {
          hvac_controls: {
            has_dcv: true,
            has_setback: true,
            night_cycle: 'CycleOnAny',
            optimal_start: true
          }
        }
      }
    };
    
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;