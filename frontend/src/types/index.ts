// TypeScript interfaces for the application

export interface Project {
  id: number
  name: string
  description?: string
  building_type: string
  building_area: number
  location: string
  annual_energy_cost: number
  created_at: string
  updated_at: string
  ecms?: ProjectECM[]
}

export interface ECM {
  id: number
  name: string
  category: string
  description?: string
  estimated_savings_percent: number
  implementation_cost: number
  payback_years: number
  is_template: boolean
}

export interface ProjectECM extends ECM {
  custom_savings_percent?: number
  custom_implementation_cost?: number
  is_selected: boolean
}

export interface CalculationResult {
  project_summary: {
    name: string
    building_type: string
    building_area: number
    annual_energy_cost: number
  }
  results_summary: {
    total_ecms: number
    total_implementation_cost: number
    total_savings_percent: number
    total_annual_savings: number
    simple_payback_years: number
    npv_20_years: number
  }
  ecm_details: Array<{
    ecm_id: number
    name: string
    category: string
    savings_percent: number
    annual_savings: number
    implementation_cost: number
    simple_payback: number
  }>
  interaction_factor: number
}

export interface BuildingTypes {
  [key: string]: string
}

export const BUILDING_TYPES: BuildingTypes = {
  'Office': 'Office Building',
  'Retail': 'Retail Store',
  'School': 'School',
  'Hospital': 'Hospital',
  'Hotel': 'Hotel',
  'Warehouse': 'Warehouse',
  'Restaurant': 'Restaurant',
  'Apartment': 'Apartment Building'
}

export const ECM_CATEGORIES = [
  'Lighting',
  'HVAC',
  'Envelope',
  'Controls',
  'Motors',
  'Water',
  'Renewable'
]