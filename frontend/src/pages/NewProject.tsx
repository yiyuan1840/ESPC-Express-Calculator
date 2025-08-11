import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, ArrowLeft, Building2, Zap, Wind, FileText, Download, Eye } from 'lucide-react'
import { projectAPI } from '../services/api'
import { BUILDING_TYPES } from '../types'

// Climate zones for dropdown
const CLIMATE_ZONES = [
  '1A', '1B', '2A', '2B', '3A', '3B', '3C',
  '4A', '4B', '4C', '5A', '5B', '5C',
  '6A', '6B', '7A', '8A'
]

// HVAC system types
const HVAC_SYSTEMS = {
  'System01': 'PTAC - Packaged Terminal Air Conditioner',
  'System02': 'PTHP - Packaged Terminal Heat Pump',
  'System03': 'PSZ-AC - Packaged Single Zone AC',
  'System04': 'PSZ-HP - Packaged Single Zone Heat Pump',
  'System05': 'Packaged VAV with Reheat',
  'System06': 'Packaged VAV with PFP Boxes',
  'System07': 'VAV with Reheat',
  'System08': 'VAV with PFP Boxes',
  'System09': 'Gas Fired Furnace',
  'System10': 'Electric Furnace'
}

export default function NewProject() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'building' | 'hvac'>('basic')
  const [buildingConfig, setBuildingConfig] = useState<any>(null)
  const [showConfig, setShowConfig] = useState(false)
  
  const [formData, setFormData] = useState({
    // Basic project info
    name: '',
    description: '',
    location: '',
    
    // Building configuration
    building_type: 'Office',
    building_area: '',
    number_of_floors: '2',
    floor_to_floor_height: '3.5',
    building_shape: 'Rectangle',
    building_orientation: '0',
    climate_zone: '5A',
    building_age: '2004',
    
    // Building envelope
    window_to_wall_ratio: '0.4',
    wall_type: 'Mass',
    roof_type: 'IEAD',
    
    // HVAC configuration
    hvac_system_type: 'System07',
    cooling_setpoint: '24',
    heating_setpoint: '21',
    has_setback: false,
    has_dcv: false,
    has_weekend_occupancy: false,
    weekday_start_time: '07:00',
    weekday_end_time: '18:00',
    
    // Energy costs
    electricity_rate: '0.10',
    gas_rate: '0.70',
    annual_energy_cost: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Calculate estimated annual energy cost if not provided
      const estimatedCost = formData.annual_energy_cost || 
        (parseFloat(formData.building_area) * 2.5) // Simple estimate: $2.50/sqft
      
      // Create the project with basic info
      const { data: project } = await projectAPI.create({
        name: formData.name,
        description: formData.description,
        building_type: formData.building_type,
        building_area: parseFloat(formData.building_area),
        location: formData.location,
        annual_energy_cost: parseFloat(estimatedCost)
      })
      
      // Store the full building configuration for later use
      localStorage.setItem(`project_${project.id}_config`, JSON.stringify(formData))
      
      // Navigate to the new project
      navigate(`/projects/${project.id}`)
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    })
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const response = await fetch('http://localhost:3000/api/building-config/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData,
          projectData: {
            name: formData.name || 'New Project',
            building_type: formData.building_type,
            building_area: parseFloat(formData.building_area) || 10000,
            location: formData.location || 'Unknown'
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        setBuildingConfig(data.building_config)
        setShowConfig(true)
      } else {
        alert('Failed to generate building configuration')
      }
    } catch (error) {
      console.error('Error generating configuration:', error)
      alert('Error generating building configuration')
    } finally {
      setGenerating(false)
    }
  }

  const downloadConfig = () => {
    if (!buildingConfig) return
    
    const dataStr = JSON.stringify(buildingConfig, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${formData.name || 'building_config'}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Projects
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create New Project</h1>
        <p className="text-gray-600">Configure building parameters for ESPC evaluation</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('basic')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'basic'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Building2 className="inline h-4 w-4 mr-2" />
            Basic Information
          </button>
          <button
            onClick={() => setActiveTab('building')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'building'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Building2 className="inline h-4 w-4 mr-2" />
            Building Configuration
          </button>
          <button
            onClick={() => setActiveTab('hvac')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'hvac'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Wind className="inline h-4 w-4 mr-2" />
            HVAC & Controls
          </button>
        </nav>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
        {/* Basic Information Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Project Name *
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., Downtown Office Complex"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Brief description of the project..."
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location *
              </label>
              <input
                type="text"
                name="location"
                id="location"
                required
                value={formData.location}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., Chicago, IL"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="electricity_rate" className="block text-sm font-medium text-gray-700">
                  Electricity Rate ($/kWh)
                </label>
                <input
                  type="number"
                  name="electricity_rate"
                  id="electricity_rate"
                  step="0.01"
                  value={formData.electricity_rate}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="gas_rate" className="block text-sm font-medium text-gray-700">
                  Natural Gas Rate ($/therm)
                </label>
                <input
                  type="number"
                  name="gas_rate"
                  id="gas_rate"
                  step="0.01"
                  value={formData.gas_rate}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Building Configuration Tab */}
        {activeTab === 'building' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="building_type" className="block text-sm font-medium text-gray-700">
                  Building Type *
                </label>
                <select
                  name="building_type"
                  id="building_type"
                  required
                  value={formData.building_type}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {Object.entries(BUILDING_TYPES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="climate_zone" className="block text-sm font-medium text-gray-700">
                  ASHRAE Climate Zone *
                </label>
                <select
                  name="climate_zone"
                  id="climate_zone"
                  required
                  value={formData.climate_zone}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {CLIMATE_ZONES.map(zone => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="building_area" className="block text-sm font-medium text-gray-700">
                  Total Floor Area (ft²) *
                </label>
                <input
                  type="number"
                  name="building_area"
                  id="building_area"
                  required
                  min="1000"
                  step="100"
                  value={formData.building_area}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., 50000"
                />
              </div>

              <div>
                <label htmlFor="number_of_floors" className="block text-sm font-medium text-gray-700">
                  Number of Floors *
                </label>
                <input
                  type="number"
                  name="number_of_floors"
                  id="number_of_floors"
                  required
                  min="1"
                  max="100"
                  value={formData.number_of_floors}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="floor_to_floor_height" className="block text-sm font-medium text-gray-700">
                  Floor to Floor Height (m)
                </label>
                <input
                  type="number"
                  name="floor_to_floor_height"
                  id="floor_to_floor_height"
                  step="0.1"
                  value={formData.floor_to_floor_height}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="building_orientation" className="block text-sm font-medium text-gray-700">
                  Building Orientation (degrees)
                </label>
                <input
                  type="number"
                  name="building_orientation"
                  id="building_orientation"
                  min="0"
                  max="359"
                  value={formData.building_orientation}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="building_shape" className="block text-sm font-medium text-gray-700">
                  Building Shape
                </label>
                <select
                  name="building_shape"
                  id="building_shape"
                  value={formData.building_shape}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="Rectangle">Rectangle</option>
                  <option value="L">L-Shape</option>
                  <option value="H">H-Shape</option>
                  <option value="T">T-Shape</option>
                  <option value="U">U-Shape</option>
                </select>
              </div>

              <div>
                <label htmlFor="window_to_wall_ratio" className="block text-sm font-medium text-gray-700">
                  Window to Wall Ratio
                </label>
                <input
                  type="number"
                  name="window_to_wall_ratio"
                  id="window_to_wall_ratio"
                  min="0"
                  max="0.95"
                  step="0.05"
                  value={formData.window_to_wall_ratio}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="wall_type" className="block text-sm font-medium text-gray-700">
                  Wall Construction Type
                </label>
                <select
                  name="wall_type"
                  id="wall_type"
                  value={formData.wall_type}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="Mass">Mass Wall</option>
                  <option value="SteelFramed">Steel Framed</option>
                  <option value="WoodFramed">Wood Framed</option>
                  <option value="Metal">Metal Building</option>
                </select>
              </div>

              <div>
                <label htmlFor="roof_type" className="block text-sm font-medium text-gray-700">
                  Roof Construction Type
                </label>
                <select
                  name="roof_type"
                  id="roof_type"
                  value={formData.roof_type}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="IEAD">Insulation Entirely Above Deck</option>
                  <option value="Attic">Attic</option>
                  <option value="Metal">Metal Building</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* HVAC & Controls Tab */}
        {activeTab === 'hvac' && (
          <div className="space-y-6">
            <div>
              <label htmlFor="hvac_system_type" className="block text-sm font-medium text-gray-700">
                HVAC System Type *
              </label>
              <select
                name="hvac_system_type"
                id="hvac_system_type"
                required
                value={formData.hvac_system_type}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {Object.entries(HVAC_SYSTEMS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="cooling_setpoint" className="block text-sm font-medium text-gray-700">
                  Cooling Setpoint (°C)
                </label>
                <input
                  type="number"
                  name="cooling_setpoint"
                  id="cooling_setpoint"
                  min="20"
                  max="30"
                  step="0.5"
                  value={formData.cooling_setpoint}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="heating_setpoint" className="block text-sm font-medium text-gray-700">
                  Heating Setpoint (°C)
                </label>
                <input
                  type="number"
                  name="heating_setpoint"
                  id="heating_setpoint"
                  min="15"
                  max="25"
                  step="0.5"
                  value={formData.heating_setpoint}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="has_setback"
                  checked={formData.has_setback}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Enable temperature setback during unoccupied hours</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="has_dcv"
                  checked={formData.has_dcv}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Demand Controlled Ventilation (DCV)</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="has_weekend_occupancy"
                  checked={formData.has_weekend_occupancy}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Weekend occupancy</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="weekday_start_time" className="block text-sm font-medium text-gray-700">
                  Weekday Start Time
                </label>
                <input
                  type="time"
                  name="weekday_start_time"
                  id="weekday_start_time"
                  value={formData.weekday_start_time}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="weekday_end_time" className="block text-sm font-medium text-gray-700">
                  Weekday End Time
                </label>
                <input
                  type="time"
                  name="weekday_end_time"
                  id="weekday_end_time"
                  value={formData.weekday_end_time}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            * Required fields
          </div>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || !formData.name || !formData.building_area}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="h-4 w-4 mr-2" />
              {generating ? 'Generating...' : 'Generate'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </div>
      </form>

      {/* Building Configuration Display */}
      {showConfig && buildingConfig && (
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Generated Building Configuration</h2>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowConfig(false)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Eye className="h-4 w-4 mr-2" />
                Hide
              </button>
              <button
                onClick={downloadConfig}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download JSON
              </button>
            </div>
          </div>
          
          {/* Configuration Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700">HVAC System</h3>
              <p className="text-lg font-semibold text-gray-900">
                {HVAC_SYSTEMS[formData.hvac_system_type as keyof typeof HVAC_SYSTEMS] || 'Unknown'}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700">Building Type</h3>
              <p className="text-lg font-semibold text-gray-900">{buildingConfig.run_info?.building_type}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700">Climate Zone</h3>
              <p className="text-lg font-semibold text-gray-900">{buildingConfig.run_info?.climate_zone}</p>
            </div>
          </div>

          {/* Configuration Preview */}
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96 text-sm font-mono">
            <pre>{JSON.stringify(buildingConfig, null, 2)}</pre>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Success!</strong> Your building configuration has been generated in BEMEval format. 
              This configuration includes HVAC systems, schedules, space types, and all necessary parameters 
              for energy modeling. You can download the JSON file to use with the BEMEval system.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}