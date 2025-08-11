# ESPC Express Calculator

A web-based Energy Savings Performance Contract (ESPC) calculator for evaluating Energy Conservation Measures (ECMs) in energy performance contracts.

## Overview

This MVP provides:
- Building configuration input
- ECM selection and evaluation
- Energy savings calculations
- Simple reporting

## Prerequisites

Before running this application, you need to install:

1. **Node.js** (v18 or higher): Download from https://nodejs.org/
2. **Python** (3.8+): Already installed with your BEMEval setup

## Project Structure

```
espc-express-calculator/
├── frontend/          # React TypeScript application
├── backend/           # Express API server
├── shared/           # Shared types and utilities
└── docs/             # Documentation
```

## Quick Start

### 1. Install Dependencies

After installing Node.js, open a terminal in the project directory:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Start Development Servers

```bash
# Terminal 1: Start backend (from backend directory)
npm run dev

# Terminal 2: Start frontend (from frontend directory)
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### 3. How to Use

1. **Create a New Project**
   - Click "New Project" from the dashboard
   - Fill in comprehensive building configuration across 3 tabs:
     - **Basic Information**: Project details and utility rates
     - **Building Configuration**: Geometry, envelope, climate zone
     - **HVAC & Controls**: System type, setpoints, schedules

2. **Select ECMs (Energy Conservation Measures)**
   - Choose from pre-defined ECM templates
   - Customize savings percentages and costs if needed
   - ECMs are organized by category (HVAC, Lighting, Controls, etc.)

3. **Calculate Savings**
   - Quick calculation provides immediate estimates
   - Run full simulation for detailed analysis using EnergyPlus

4. **View Results**
   - Energy cost savings and payback analysis
   - Interactive charts showing baseline vs improvements
   - Export reports for stakeholders

## Features

### MVP Features
- Create and manage ESPC projects
- Input building parameters
- Select from pre-defined ECMs
- Calculate energy savings
- View results summary

### Future Enhancements
- Integration with EnergyPlus simulations
- Advanced ECM customization
- PDF report generation
- Historical data tracking