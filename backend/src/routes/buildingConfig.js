// Building configuration generation routes
import express from 'express';
import { generateBuildingConfig } from '../services/buildingConfigGenerator.js';
import db from '../models/database.js';

const router = express.Router();

/**
 * Generate building configuration from project ID
 */
router.post('/generate/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { formData } = req.body;

    // Get project data from database
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Generate the complete building configuration
    const buildingConfig = generateBuildingConfig(formData, project);

    // Store the configuration in database (optional)
    const configStmt = db.prepare(`
      INSERT OR REPLACE INTO simulation_results (project_id, results, created_at)
      VALUES (?, ?, datetime('now'))
    `);
    configStmt.run(projectId, JSON.stringify(buildingConfig));

    res.json({
      success: true,
      project_id: projectId,
      building_config: buildingConfig,
      message: 'Building configuration generated successfully'
    });

  } catch (error) {
    console.error('Error generating building configuration:', error);
    res.status(500).json({ 
      error: 'Failed to generate building configuration',
      details: error.message 
    });
  }
});

/**
 * Get existing building configuration for a project
 */
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    // Get stored configuration from database
    const result = db.prepare('SELECT * FROM simulation_results WHERE project_id = ?').get(projectId);
    
    if (!result) {
      return res.status(404).json({ error: 'No building configuration found for this project' });
    }

    const buildingConfig = JSON.parse(result.results);
    
    res.json({
      success: true,
      project_id: projectId,
      building_config: buildingConfig,
      created_at: result.created_at
    });

  } catch (error) {
    console.error('Error retrieving building configuration:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve building configuration',
      details: error.message 
    });
  }
});

/**
 * Preview building configuration without saving
 */
router.post('/preview', async (req, res) => {
  try {
    const { formData, projectData } = req.body;

    if (!formData || !projectData) {
      return res.status(400).json({ error: 'Form data and project data are required' });
    }

    // Generate the configuration without saving
    const buildingConfig = generateBuildingConfig(formData, projectData);

    res.json({
      success: true,
      building_config: buildingConfig,
      message: 'Building configuration preview generated'
    });

  } catch (error) {
    console.error('Error generating configuration preview:', error);
    res.status(500).json({ 
      error: 'Failed to generate configuration preview',
      details: error.message 
    });
  }
});

/**
 * Export building configuration as JSON file
 */
router.get('/export/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    // Get project and configuration
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    const result = db.prepare('SELECT * FROM simulation_results WHERE project_id = ?').get(projectId);
    
    if (!project || !result) {
      return res.status(404).json({ error: 'Project or configuration not found' });
    }

    const buildingConfig = JSON.parse(result.results);
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${project.name}_building_config.json"`);
    
    res.json(buildingConfig);

  } catch (error) {
    console.error('Error exporting building configuration:', error);
    res.status(500).json({ 
      error: 'Failed to export building configuration',
      details: error.message 
    });
  }
});

export default router;