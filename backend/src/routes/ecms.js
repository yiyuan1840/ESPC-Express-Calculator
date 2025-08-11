// ECM (Energy Conservation Measures) routes
import express from 'express';
import db from '../models/database.js';

const router = express.Router();

// GET all ECM templates
router.get('/templates', (req, res) => {
  try {
    const ecms = db.prepare('SELECT * FROM ecms WHERE is_template = 1 ORDER BY category, name').all();
    res.json(ecms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all ECMs (templates and custom)
router.get('/', (req, res) => {
  try {
    const ecms = db.prepare('SELECT * FROM ecms ORDER BY category, name').all();
    res.json(ecms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single ECM
router.get('/:id', (req, res) => {
  try {
    const ecm = db.prepare('SELECT * FROM ecms WHERE id = ?').get(req.params.id);
    if (!ecm) {
      return res.status(404).json({ error: 'ECM not found' });
    }
    res.json(ecm);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE new ECM
router.post('/', (req, res) => {
  try {
    const { name, category, description, estimated_savings_percent, implementation_cost, is_template } = req.body;
    
    // Validate required fields
    if (!name || !category || !estimated_savings_percent || !implementation_cost) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const stmt = db.prepare(`
      INSERT INTO ecms (name, category, description, estimated_savings_percent, implementation_cost, payback_years, is_template)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Calculate simple payback
    const payback_years = implementation_cost / (estimated_savings_percent / 100 * 100000); // Assuming $100k baseline
    
    const result = stmt.run(name, category, description, estimated_savings_percent, implementation_cost, payback_years, is_template || 0);
    const newECM = db.prepare('SELECT * FROM ecms WHERE id = ?').get(result.lastInsertRowid);
    
    res.status(201).json(newECM);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE ECM
router.put('/:id', (req, res) => {
  try {
    const { name, category, description, estimated_savings_percent, implementation_cost } = req.body;
    
    // Calculate simple payback
    const payback_years = implementation_cost / (estimated_savings_percent / 100 * 100000);
    
    const stmt = db.prepare(`
      UPDATE ecms 
      SET name = ?, category = ?, description = ?, estimated_savings_percent = ?, 
          implementation_cost = ?, payback_years = ?
      WHERE id = ?
    `);
    
    stmt.run(name, category, description, estimated_savings_percent, implementation_cost, payback_years, req.params.id);
    const updatedECM = db.prepare('SELECT * FROM ecms WHERE id = ?').get(req.params.id);
    
    res.json(updatedECM);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE ECM
router.delete('/:id', (req, res) => {
  try {
    // Check if it's a template
    const ecm = db.prepare('SELECT is_template FROM ecms WHERE id = ?').get(req.params.id);
    if (ecm && ecm.is_template) {
      return res.status(400).json({ error: 'Cannot delete template ECMs' });
    }
    
    // Delete from projects first
    db.prepare('DELETE FROM project_ecms WHERE ecm_id = ?').run(req.params.id);
    // Delete ECM
    db.prepare('DELETE FROM ecms WHERE id = ?').run(req.params.id);
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;