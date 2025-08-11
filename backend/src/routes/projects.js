// Project routes
import express from 'express';
import db from '../models/database.js';

const router = express.Router();

// GET all projects
router.get('/', (req, res) => {
  try {
    const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single project
router.get('/:id', (req, res) => {
  try {
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get associated ECMs
    const ecms = db.prepare(`
      SELECT e.*, pe.custom_savings_percent, pe.custom_implementation_cost, pe.is_selected
      FROM project_ecms pe
      JOIN ecms e ON pe.ecm_id = e.id
      WHERE pe.project_id = ?
    `).all(req.params.id);
    
    project.ecms = ecms;
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE new project
router.post('/', (req, res) => {
  try {
    const { name, description, building_type, building_area, location, annual_energy_cost } = req.body;
    
    // Validate required fields
    if (!name || !building_type || !building_area || !location || !annual_energy_cost) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const stmt = db.prepare(`
      INSERT INTO projects (name, description, building_type, building_area, location, annual_energy_cost)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(name, description, building_type, building_area, location, annual_energy_cost);
    const newProject = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
    
    res.status(201).json(newProject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE project
router.put('/:id', (req, res) => {
  try {
    const { name, description, building_type, building_area, location, annual_energy_cost } = req.body;
    
    const stmt = db.prepare(`
      UPDATE projects 
      SET name = ?, description = ?, building_type = ?, building_area = ?, 
          location = ?, annual_energy_cost = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(name, description, building_type, building_area, location, annual_energy_cost, req.params.id);
    const updatedProject = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    
    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE project
router.delete('/:id', (req, res) => {
  try {
    // Delete associated ECMs first
    db.prepare('DELETE FROM project_ecms WHERE project_id = ?').run(req.params.id);
    // Delete project
    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADD ECM to project
router.post('/:id/ecms', (req, res) => {
  try {
    const { ecm_id, custom_savings_percent, custom_implementation_cost } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO project_ecms (project_id, ecm_id, custom_savings_percent, custom_implementation_cost)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(req.params.id, ecm_id, custom_savings_percent, custom_implementation_cost);
    res.status(201).json({ message: 'ECM added to project' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;