// Mock database for testing when SQLite is not available
let projects = [];
let ecms = [];
let projectECMs = [];
let simulationResults = [];
let idCounter = 1;

// Mock database object with SQLite-like interface
const mockDb = {
  prepare: (sql) => {
    return {
      run: (...params) => {
        if (sql.includes('INSERT INTO projects')) {
          const [name, description, building_type, building_area, location, annual_energy_cost] = params;
          const project = {
            id: idCounter++,
            name,
            description,
            building_type,
            building_area,
            location,
            annual_energy_cost,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          projects.push(project);
          return { lastInsertRowid: project.id };
        } else if (sql.includes('INSERT INTO ecms')) {
          const [name, category, description, estimated_savings_percent, implementation_cost, payback_years, is_template] = params;
          const ecm = {
            id: idCounter++,
            name,
            category,
            description,
            estimated_savings_percent,
            implementation_cost,
            payback_years,
            is_template: is_template || 0
          };
          ecms.push(ecm);
          return { lastInsertRowid: ecm.id };
        }
        return { lastInsertRowid: idCounter++ };
      },
      get: (...params) => {
        if (sql.includes('SELECT COUNT(*) as count FROM ecms WHERE is_template = 1')) {
          return { count: ecms.filter(e => e.is_template === 1).length };
        } else if (sql.includes('SELECT * FROM projects WHERE id = ?')) {
          return projects.find(p => p.id === params[0]) || null;
        } else if (sql.includes('SELECT * FROM ecms WHERE is_template = 1')) {
          return ecms.filter(e => e.is_template === 1);
        }
        return null;
      },
      all: (...params) => {
        if (sql.includes('SELECT * FROM projects')) {
          return projects;
        } else if (sql.includes('SELECT * FROM ecms WHERE is_template = 1')) {
          return ecms.filter(e => e.is_template === 1);
        }
        return [];
      }
    };
  },
  exec: (sql) => {
    // Mock table creation - just log it
    console.log('Mock DB: Executing SQL:', sql.substring(0, 50) + '...');
    return true;
  }
};

// Initialize database tables (mock)
export function initializeDatabase() {
  console.log('Mock database initialized');
  
  // Seed default ECM templates if empty
  if (ecms.filter(e => e.is_template === 1).length === 0) {
    seedDefaultECMs();
  }
}

// Seed default ECM templates
function seedDefaultECMs() {
  const defaultECMs = [
    {
      name: 'LED Lighting Retrofit',
      category: 'Lighting',
      description: 'Replace existing lighting with LED fixtures',
      estimated_savings_percent: 15,
      implementation_cost: 50000,
      payback_years: 3.5
    },
    {
      name: 'HVAC System Upgrade',
      category: 'HVAC',
      description: 'Replace aging HVAC equipment with high-efficiency units',
      estimated_savings_percent: 25,
      implementation_cost: 150000,
      payback_years: 5
    },
    {
      name: 'Building Envelope Improvements',
      category: 'Envelope',
      description: 'Add insulation and seal air leaks',
      estimated_savings_percent: 10,
      implementation_cost: 75000,
      payback_years: 7
    },
    {
      name: 'Smart Building Controls',
      category: 'Controls',
      description: 'Install occupancy sensors and programmable thermostats',
      estimated_savings_percent: 12,
      implementation_cost: 40000,
      payback_years: 3
    },
    {
      name: 'Variable Frequency Drives',
      category: 'Motors',
      description: 'Install VFDs on motors and pumps',
      estimated_savings_percent: 8,
      implementation_cost: 30000,
      payback_years: 4
    }
  ];

  for (const ecm of defaultECMs) {
    const newECM = {
      id: idCounter++,
      name: ecm.name,
      category: ecm.category,
      description: ecm.description,
      estimated_savings_percent: ecm.estimated_savings_percent,
      implementation_cost: ecm.implementation_cost,
      payback_years: ecm.payback_years,
      is_template: 1
    };
    ecms.push(newECM);
  }

  console.log('Default ECM templates seeded');
}

export default mockDb;