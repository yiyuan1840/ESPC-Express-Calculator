// Types for simulation results from enable_output.json

export interface SimulationResults {
  baseline: SimulationRun
  hvac_equipment_improvements: SimulationRun
  hvac_controls_improvements: SimulationRun
}

export interface SimulationRun {
  annual_energy_consumption: {
    electricity: number  // kWh
    natural_gas: number  // therms or MJ
    total_site_energy: number  // kBtu or MJ
  }
  annual_energy_cost: {
    electricity: number  // $
    natural_gas: number  // $
    total: number  // $
  }
  peak_demand: {
    electricity: number  // kW
  }
  emissions: {
    co2: number  // kg or tons
  }
  end_uses?: {
    heating: number
    cooling: number
    lighting: number
    equipment: number
    fans: number
    pumps: number
    heat_rejection: number
    hot_water: number
  }
}

export interface ECMComparison {
  measure_name: string
  baseline_value: number
  improved_value: number
  savings: number
  savings_percent: number
}