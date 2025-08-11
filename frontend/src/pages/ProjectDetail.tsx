import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Play, Download, TrendingDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { projectAPI, ecmAPI, calculationAPI } from '../services/api'
import { Project, ECM, CalculationResult } from '../types'
import { SimulationResults } from '../types/simulation'

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [availableECMs, setAvailableECMs] = useState<ECM[]>([])
  const [selectedECMs, setSelectedECMs] = useState<number[]>([])
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null)
  const [simulationResults, setSimulationResults] = useState<SimulationResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [simulating, setSimulating] = useState(false)

  useEffect(() => {
    loadProjectData()
  }, [id])

  const loadProjectData = async () => {
    try {
      const [projectRes, ecmsRes] = await Promise.all([
        projectAPI.getById(parseInt(id!)),
        ecmAPI.getTemplates()
      ])
      
      setProject(projectRes.data)
      setAvailableECMs(ecmsRes.data)
      
      // Set initially selected ECMs if any
      if (projectRes.data.ecms) {
        setSelectedECMs(projectRes.data.ecms.map(e => e.id))
      }
    } catch (error) {
      console.error('Error loading project:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleECMToggle = (ecmId: number) => {
    setSelectedECMs(prev => 
      prev.includes(ecmId) 
        ? prev.filter(id => id !== ecmId)
        : [...prev, ecmId]
    )
  }

  const handleCalculate = async () => {
    if (!project) return
    
    setCalculating(true)
    try {
      // Add selected ECMs to project
      for (const ecmId of selectedECMs) {
        if (!project.ecms?.find(e => e.id === ecmId)) {
          await projectAPI.addECM(project.id, { ecm_id: ecmId })
        }
      }
      
      // Calculate savings
      const { data } = await calculationAPI.calculateProject(project.id)
      setCalculationResult(data)
    } catch (error) {
      console.error('Error calculating:', error)
    } finally {
      setCalculating(false)
    }
  }

  const handleRunSimulation = async () => {
    if (!project) return
    
    setSimulating(true)
    try {
      // This would call the actual simulation endpoint
      // For now, we'll use mock data
      const mockResults: SimulationResults = {
        baseline: {
          annual_energy_consumption: {
            electricity: 125000,
            natural_gas: 5000,
            total_site_energy: 450000
          },
          annual_energy_cost: {
            electricity: 12500,
            natural_gas: 3500,
            total: 16000
          },
          peak_demand: { electricity: 85 },
          emissions: { co2: 65000 }
        },
        hvac_equipment_improvements: {
          annual_energy_consumption: {
            electricity: 105000,
            natural_gas: 4200,
            total_site_energy: 380000
          },
          annual_energy_cost: {
            electricity: 10500,
            natural_gas: 2940,
            total: 13440
          },
          peak_demand: { electricity: 72 },
          emissions: { co2: 54600 }
        },
        hvac_controls_improvements: {
          annual_energy_consumption: {
            electricity: 100000,
            natural_gas: 4000,
            total_site_energy: 360000
          },
          annual_energy_cost: {
            electricity: 10000,
            natural_gas: 2800,
            total: 12800
          },
          peak_demand: { electricity: 68 },
          emissions: { co2: 52000 }
        }
      }
      
      setSimulationResults(mockResults)
    } catch (error) {
      console.error('Error running simulation:', error)
    } finally {
      setSimulating(false)
    }
  }

  if (loading || !project) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading project...</div>
      </div>
    )
  }

  // Prepare chart data
  const chartData = simulationResults ? [
    {
      name: 'Baseline',
      'Energy Cost': simulationResults.baseline.annual_energy_cost.total,
      'Peak Demand': simulationResults.baseline.peak_demand.electricity,
      'CO2 Emissions': simulationResults.baseline.emissions.co2 / 1000
    },
    {
      name: 'Equipment Upgrade',
      'Energy Cost': simulationResults.hvac_equipment_improvements.annual_energy_cost.total,
      'Peak Demand': simulationResults.hvac_equipment_improvements.peak_demand.electricity,
      'CO2 Emissions': simulationResults.hvac_equipment_improvements.emissions.co2 / 1000
    },
    {
      name: 'Controls Upgrade',
      'Energy Cost': simulationResults.hvac_controls_improvements.annual_energy_cost.total,
      'Peak Demand': simulationResults.hvac_controls_improvements.peak_demand.electricity,
      'CO2 Emissions': simulationResults.hvac_controls_improvements.emissions.co2 / 1000
    }
  ] : []

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Projects
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600">{project.description || 'No description provided'}</p>
          </div>
        </div>
      </div>

      {/* Project Info */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Building Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Building Type</p>
            <p className="font-medium">{project.building_type}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Floor Area</p>
            <p className="font-medium">{project.building_area.toLocaleString()} ft²</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Location</p>
            <p className="font-medium">{project.location}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Annual Energy Cost</p>
            <p className="font-medium">${project.annual_energy_cost.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* ECM Selection */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Energy Conservation Measures</h2>
        <div className="space-y-3">
          {availableECMs.map((ecm) => (
            <label key={ecm.id} className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={selectedECMs.includes(ecm.id)}
                onChange={() => handleECMToggle(ecm.id)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="ml-3 flex-1">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900">{ecm.name}</span>
                  <span className="text-sm text-gray-500">{ecm.category}</span>
                </div>
                <p className="text-sm text-gray-600">{ecm.description}</p>
                <div className="mt-1 flex gap-4 text-sm text-gray-500">
                  <span>Savings: {ecm.estimated_savings_percent}%</span>
                  <span>Cost: ${ecm.implementation_cost.toLocaleString()}</span>
                  <span>Payback: {ecm.payback_years} years</span>
                </div>
              </div>
            </label>
          ))}
        </div>
        
        <div className="mt-6 flex gap-4">
          <button
            onClick={handleCalculate}
            disabled={selectedECMs.length === 0 || calculating}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {calculating ? 'Calculating...' : 'Calculate Savings'}
          </button>
          
          <button
            onClick={handleRunSimulation}
            disabled={selectedECMs.length === 0 || simulating}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="h-4 w-4 mr-2" />
            {simulating ? 'Running Simulation...' : 'Run Full Simulation'}
          </button>
        </div>
      </div>

      {/* Calculation Results */}
      {calculationResult && (
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Calculation Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded">
              <p className="text-sm text-gray-600">Total Annual Savings</p>
              <p className="text-xl font-bold text-green-600">
                ${calculationResult.results_summary.total_annual_savings.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                {calculationResult.results_summary.total_savings_percent.toFixed(1)}% reduction
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded">
              <p className="text-sm text-gray-600">Implementation Cost</p>
              <p className="text-xl font-bold text-blue-600">
                ${calculationResult.results_summary.total_implementation_cost.toLocaleString()}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded">
              <p className="text-sm text-gray-600">Simple Payback</p>
              <p className="text-xl font-bold text-purple-600">
                {calculationResult.results_summary.simple_payback_years.toFixed(1)} years
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded">
              <p className="text-sm text-gray-600">20-Year NPV</p>
              <p className="text-xl font-bold text-orange-600">
                ${calculationResult.results_summary.npv_20_years.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Results */}
      {simulationResults && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Detailed Simulation Results
          </h2>
          
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-700 mb-3">Energy Cost Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="Energy Cost" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Equipment Savings</p>
              <p className="text-xl font-bold text-green-600">
                {((1 - simulationResults.hvac_equipment_improvements.annual_energy_cost.total / 
                   simulationResults.baseline.annual_energy_cost.total) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Controls Savings</p>
              <p className="text-xl font-bold text-green-600">
                {((1 - simulationResults.hvac_controls_improvements.annual_energy_cost.total / 
                   simulationResults.baseline.annual_energy_cost.total) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Peak Demand Reduction</p>
              <p className="text-xl font-bold text-blue-600">
                {(simulationResults.baseline.peak_demand.electricity - 
                  Math.min(simulationResults.hvac_equipment_improvements.peak_demand.electricity,
                          simulationResults.hvac_controls_improvements.peak_demand.electricity)).toFixed(0)} kW
              </p>
            </div>
          </div>

          <button className="mt-6 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      )}
    </div>
  )
}