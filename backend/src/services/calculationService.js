// Calculation service for ECM evaluation
export function calculateSavings(project, ecms) {
  let totalSavingsPercent = 0;
  let totalImplementationCost = 0;
  const ecmResults = [];
  
  // Calculate individual ECM impacts
  ecms.forEach(ecm => {
    const savingsPercent = ecm.custom_savings_percent || ecm.estimated_savings_percent;
    const implementationCost = ecm.custom_implementation_cost || ecm.implementation_cost;
    const annualSavings = project.annual_energy_cost * (savingsPercent / 100);
    
    ecmResults.push({
      ecm_id: ecm.id,
      name: ecm.name,
      category: ecm.category,
      savings_percent: savingsPercent,
      annual_savings: annualSavings,
      implementation_cost: implementationCost,
      simple_payback: implementationCost / annualSavings
    });
    
    totalSavingsPercent += savingsPercent;
    totalImplementationCost += implementationCost;
  });
  
  // Apply interaction factors (simplified for MVP)
  // In reality, ECMs don't add linearly
  const interactionFactor = calculateInteractionFactor(ecms);
  const adjustedSavingsPercent = Math.min(totalSavingsPercent * interactionFactor, 50);
  
  const totalAnnualSavings = project.annual_energy_cost * (adjustedSavingsPercent / 100);
  const overallPayback = totalImplementationCost / totalAnnualSavings;
  
  return {
    project_summary: {
      name: project.name,
      building_type: project.building_type,
      building_area: project.building_area,
      annual_energy_cost: project.annual_energy_cost
    },
    results_summary: {
      total_ecms: ecms.length,
      total_implementation_cost: totalImplementationCost,
      total_savings_percent: adjustedSavingsPercent,
      total_annual_savings: totalAnnualSavings,
      simple_payback_years: overallPayback,
      npv_20_years: calculateNPV(totalAnnualSavings, totalImplementationCost, 20, 0.03)
    },
    ecm_details: ecmResults,
    interaction_factor: interactionFactor
  };
}

// Calculate interaction factor between ECMs
function calculateInteractionFactor(ecms) {
  // Simplified interaction model
  // Multiple ECMs in same category have diminishing returns
  const categories = {};
  ecms.forEach(ecm => {
    categories[ecm.category] = (categories[ecm.category] || 0) + 1;
  });
  
  let factor = 1.0;
  Object.values(categories).forEach(count => {
    if (count > 1) {
      // Each additional ECM in same category reduces effectiveness by 10%
      factor *= Math.pow(0.9, count - 1);
    }
  });
  
  return factor;
}

// Calculate Net Present Value
function calculateNPV(annualSavings, initialCost, years, discountRate) {
  let npv = -initialCost;
  for (let year = 1; year <= years; year++) {
    npv += annualSavings / Math.pow(1 + discountRate, year);
  }
  return npv;
}

// Generate measures configuration for simulation
export function generateMeasuresConfig(ecms) {
  const measures = {};
  
  ecms.forEach(ecm => {
    switch (ecm.category) {
      case 'Lighting':
        measures.lighting_equipment = {
          ...measures.lighting_equipment,
          lighting_power_density_reduction: 0.3,
          lighting_control_type: 'occupancy'
        };
        break;
        
      case 'HVAC':
        measures.hvac_controls = {
          ...measures.hvac_controls,
          cooling_setpoint: 24.0,
          heating_setpoint: 21.0,
          has_setback: true,
          has_dcv: ecm.name.includes('Variable') || ecm.name.includes('VAV')
        };
        measures.hvac_equipment = {
          ...measures.hvac_equipment,
          fan_efficiency: 0.8,
          fan_motor_efficiency: 0.95
        };
        break;
        
      case 'Envelope':
        measures.envelope = {
          ...measures.envelope,
          wall_insulation_r_value: 20,
          roof_insulation_r_value: 30,
          window_u_value: 0.3
        };
        break;
        
      case 'Controls':
        measures.hvac_controls = {
          ...measures.hvac_controls,
          has_dcv: true,
          has_setback: true,
          optimal_start: true
        };
        break;
        
      case 'Motors':
        measures.hvac_equipment = {
          ...measures.hvac_equipment,
          has_vfd: true,
          motor_efficiency: 0.95
        };
        break;
    }
  });
  
  // Add default values for any missing controls
  if (measures.hvac_controls) {
    measures.hvac_controls = {
      cooling_setpoint: 23.0,
      heating_setpoint: 21.0,
      has_setback: false,
      has_weekend_occupancy: false,
      weekday_start_time: '07:00',
      weekday_end_time: '18:00',
      has_dcv: false,
      night_cycle: 'CycleOnAny',
      ...measures.hvac_controls
    };
  }
  
  if (measures.hvac_equipment) {
    measures.hvac_equipment = {
      fan_efficiency: 0.7,
      fan_pressure_rise: 500.0,
      fan_motor_efficiency: 0.9,
      has_dcv: false,
      night_cycle: 'CycleOnAny',
      ...measures.hvac_equipment
    };
  }
  
  return measures;
}