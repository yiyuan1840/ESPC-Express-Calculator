# Developer Guide - ESPC Express Calculator

This guide explains how to maintain and extend the ESPC Express Calculator application.

## Architecture Overview

The application follows a modern full-stack architecture:

```
Frontend (React + TypeScript)
         ↓ HTTP/REST API
Backend (Node.js + Express)
         ↓ Python subprocess
EnergyPlus Simulation Engine
         ↓ JSON output
enable_output.json results
```

## Key Technologies

### Frontend
- **React 18**: Modern functional components with hooks
- **TypeScript**: Type safety and better developer experience  
- **Tailwind CSS**: Utility-first CSS framework
- **Recharts**: Data visualization for energy results
- **Vite**: Fast build tool and dev server

### Backend
- **Node.js + Express**: REST API server
- **SQLite**: Local database with better-sqlite3
- **Child Process**: Spawns Python scripts for simulations

## Project Structure Explained

```
espc-express-calculator/
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   └── Layout.tsx  # Main app layout with navigation
│   │   ├── pages/          # Route components
│   │   │   ├── Dashboard.tsx        # Main dashboard with stats
│   │   │   ├── Projects.tsx         # Project listing
│   │   │   ├── NewProject.tsx       # Building configuration form
│   │   │   ├── ProjectDetail.tsx    # ECM selection & results
│   │   │   └── ECMLibrary.tsx       # ECM management (future)
│   │   ├── services/       # API communication
│   │   │   └── api.ts      # Axios-based API client
│   │   ├── types/          # TypeScript interfaces
│   │   │   ├── index.ts    # Core types (Project, ECM, etc.)
│   │   │   └── simulation.ts  # Simulation result types
│   │   └── utils/          # Helper functions
│   ├── package.json        # Frontend dependencies
│   └── vite.config.ts      # Build configuration
│
├── backend/
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   │   ├── projects.js    # CRUD operations for projects
│   │   │   ├── ecms.js        # ECM templates and management  
│   │   │   ├── calculations.js # Quick savings calculations
│   │   │   └── simulation.js   # EnergyPlus integration
│   │   ├── models/         # Data layer
│   │   │   └── database.js    # SQLite setup and schemas
│   │   ├── services/       # Business logic
│   │   │   ├── calculationService.js # ECM calculations
│   │   │   └── simulationService.js  # EnergyPlus config generation
│   │   └── index.js        # Express server setup
│   └── package.json        # Backend dependencies
│
└── docs/                   # Documentation
```

## How to Add New Features

### 1. Adding a New ECM Category

**Backend Changes:**
1. Update `backend/src/models/database.js` to add new default ECMs
2. Modify `backend/src/services/simulationService.js` to handle the new category in `generateMeasuresFromECMs()`

**Frontend Changes:**
1. Update `frontend/src/types/index.ts` to add the category to `ECM_CATEGORIES`
2. The ECM selection UI will automatically include the new category

### 2. Adding New Building Configuration Options

**Frontend Changes:**
1. Add new form fields to `frontend/src/pages/NewProject.tsx`
2. Update the `formData` state object
3. Add validation and UI components

**Backend Changes:**
1. Modify `backend/src/services/simulationService.js` to use the new parameters
2. Update the simulation configuration generation

### 3. Adding New Chart Types

**Frontend Changes:**
1. Install additional chart components: `npm install recharts`
2. Create new chart components in `frontend/src/components/charts/`
3. Use them in `ProjectDetail.tsx` for visualization

### 4. Integrating with External APIs

**Backend Changes:**
1. Add new service in `backend/src/services/`
2. Create new routes in `backend/src/routes/`
3. Update the main server file to include new routes

## Database Schema

The SQLite database includes these key tables:

```sql
-- Core project information
CREATE TABLE projects (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  building_type TEXT NOT NULL,
  building_area REAL NOT NULL,
  location TEXT NOT NULL,
  annual_energy_cost REAL NOT NULL,
  created_at DATETIME,
  updated_at DATETIME
);

-- ECM templates and custom ECMs
CREATE TABLE ecms (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  estimated_savings_percent REAL NOT NULL,
  implementation_cost REAL NOT NULL,
  payback_years REAL,
  is_template BOOLEAN DEFAULT 0
);

-- Many-to-many relationship: projects can have multiple ECMs
CREATE TABLE project_ecms (
  id INTEGER PRIMARY KEY,
  project_id INTEGER NOT NULL,
  ecm_id INTEGER NOT NULL,
  custom_savings_percent REAL,
  custom_implementation_cost REAL,
  is_selected BOOLEAN DEFAULT 1
);

-- Simulation results from enable_output.json
CREATE TABLE simulation_results (
  id INTEGER PRIMARY KEY,
  project_id INTEGER NOT NULL UNIQUE,
  results TEXT NOT NULL,  -- JSON string of simulation results
  created_at DATETIME
);
```

## API Endpoints

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details with ECMs
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/ecms` - Add ECM to project

### ECMs
- `GET /api/ecms/templates` - Get ECM templates
- `POST /api/ecms` - Create custom ECM

### Calculations
- `POST /api/calculations/quick-calculate` - Quick savings estimate
- `POST /api/calculations/project/:id/calculate` - Detailed project calculations

### Simulations
- `POST /api/simulations/project/:id/run` - Run EnergyPlus simulation
- `GET /api/simulations/project/:id/results` - Get simulation results

## Simulation Integration

The application integrates with your EnergyPlus example file generator through:

1. **Configuration Generation**: `simulationService.js` creates the JSON configuration that matches your test file structure
2. **Python Execution**: Spawns a Python process to run the `Measure` class
3. **Results Parsing**: Reads the `enable_output.json` file with baseline, equipment, and controls results

### Simulation Flow:
```
User selects ECMs → Backend generates config → Python runs simulation → Results stored in DB → Frontend displays charts
```

## Common Tasks

### Adding New HVAC System Types
1. Update `HVAC_SYSTEMS` in `frontend/src/pages/NewProject.tsx`
2. Add system-specific logic in `backend/src/services/simulationService.js`

### Modifying Calculation Logic
1. Edit `backend/src/services/calculationService.js`
2. Update interaction factors, NPV calculations, etc.

### Customizing the UI Theme
1. Modify `frontend/tailwind.config.js`
2. Update color schemes in components

### Adding Authentication
1. Add auth middleware to backend routes
2. Create login/logout pages in frontend
3. Store JWT tokens for API requests

## Testing

### Running Backend Tests
```bash
cd backend
npm test
```

### Running Frontend Tests  
```bash
cd frontend
npm run test
```

### Manual Testing
1. Create a test project with various building types
2. Select different ECM combinations
3. Run quick calculations and full simulations
4. Verify results match expected energy savings

## Deployment

### Development
- Frontend: `npm run dev` (port 5173)
- Backend: `npm run dev` (port 3000)

### Production Build
```bash
# Frontend
cd frontend
npm run build

# Backend (no build needed for Node.js)
cd backend
npm start
```

### Environment Variables
Create `.env` files for:
- Database paths
- API keys
- Python environment paths
- Port configurations

## Troubleshooting

### Common Issues
1. **Python script fails**: Check Python path and dependencies
2. **Database locked**: Ensure proper connection cleanup
3. **CORS errors**: Verify Vite proxy configuration
4. **Missing simulation results**: Check EnergyPlus installation and file paths

### Debug Mode
- Enable debug logging in backend: `DEBUG=true npm run dev`
- Use browser dev tools for frontend debugging
- Check SQLite database with DB Browser for SQLite

## Contributing

1. Follow the existing code style
2. Add TypeScript types for new features
3. Update tests when modifying calculations
4. Document new API endpoints
5. Test with multiple building configurations

This architecture allows for easy extension while maintaining clean separation of concerns between the web interface and the simulation engine.