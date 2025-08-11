// Service for generating simulation configurations and running simulations
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function generateSimulationInput(project, ecms, additionalParams = {}) {
  // Generate the configuration structure that matches what the audit.Measure expects
  const config = {
    measures: generateMeasuresFromECMs(ecms),
    hvac: {
      hvac_system: selectHVACSystemConfig(project.building_type, project.building_area)
    },
    hvac_components: getHVACComponents(project.building_type),
    schedules: getDefaultSchedules(),
    construction_sets: {
      building_construction: {
        base_construction_set: 'default',
        base_building_type: mapBuildingType(project.building_type),
        building_age: 2004,
        climate_zone: additionalParams.climate_zone || '5A',
        building_standard: 'ASHRAE 90.1-2004',
        wall_type: '',
        roof_type: '',
        south_win_type: 'Reference',
        east_win_type: 'Reference',
        north_win_type: 'Reference',
        west_win_type: 'Reference'
      }
    },
    space_types: {
      main_space: {
        base_space_type: getSpaceType(project.building_type),
        base_building_type: mapBuildingType(project.building_type),
        building_age: 2004,
        climate_zone: additionalParams.climate_zone || '5A',
        building_standard: 'ASHRAE 90.1-2004',
        elec_plug_per_flr_area: 8.0,
        int_lighting_per_flr_area: 10.0,
        flr_area_per_person: 25.0,
        inf_flow_per_ext_surface_area: 0.0003,
        oa_flow_per_person: 0.0125,
        oa_flow_per_area: 0,
        cooling_setpoint: 24.0,
        heating_setpoint: 21.0,
        has_setback: false,
        has_weekend_occupancy: false,
        weekday_start_time: '06:00',
        weekday_end_time: '18:00'
      }
    },
    run_info: {
      uuid: `{ESPC-PROJECT-${project.id}-${Date.now()}}`,
      building_type: mapBuildingType(project.building_type),
      output_location: path.join(__dirname, '..', '..', 'simulations', `project_${project.id}`),
      temp_sim_location: path.join(__dirname, '..', '..', 'simulations', `project_${project.id}`, 'temp'),
      building_age: 2004,
      climate_zone: additionalParams.climate_zone || '5A',
      building_standard: 'ASHRAE 90.1-2004',
      simulation_year: 2014,
      timestep: 6
    },
    building_info: {
      has_drop_ceilings: false,
      floor_height: additionalParams.floor_to_floor_height || 3.0,
      use_multiplier: false,
      number_of_floors: additionalParams.number_of_floors || 2,
      orientation: additionalParams.building_orientation || 0,
      geometry_configuration: additionalParams.building_shape || 'Rectangle',
      zone_layout: 'Five_Zone',
      roof_style: 'flat',
      ext_lighting_intensity: 5000,
      length1: Math.sqrt(project.building_area / (additionalParams.number_of_floors || 2)),
      length2: 0,
      width1: Math.sqrt(project.building_area / (additionalParams.number_of_floors || 2)),
      width2: 0,
      end1: 0,
      end2: 0,
      offset1: 0,
      offset2: 0,
      offset3: 0,
      core_offset: 3,
      drop_ceiling_height: 0,
      number_of_zones: 5,
      south_wwr: additionalParams.window_to_wall_ratio || 0.40,
      east_wwr: additionalParams.window_to_wall_ratio || 0.40,
      north_wwr: additionalParams.window_to_wall_ratio || 0.40,
      west_wwr: additionalParams.window_to_wall_ratio || 0.40,
      space_type: 'main_space',
      construction_set: 'building_construction',
      hvac_system: 'hvac_system'
    }
  };
  
  return config;
}

// Map frontend building types to EnergyPlus building types
function mapBuildingType(type) {
  const typeMap = {
    'Office': 'Medium_Office',
    'Retail': 'Strip_Mall',
    'School': 'Secondary_School',
    'Hospital': 'Hospital',
    'Hotel': 'Large_Hotel',
    'Warehouse': 'Warehouse',
    'Restaurant': 'Full_Service_Restaurant',
    'Apartment': 'Mid_Rise_Apartment'
  };
  
  return typeMap[type] || 'Medium_Office';
}

// Get space type based on building type
function getSpaceType(buildingType) {
  const spaceTypeMap = {
    'Office': 'Office',
    'Retail': 'Retail',
    'School': 'Classroom',
    'Hospital': 'Patient_Room',
    'Hotel': 'Guest_Room',
    'Warehouse': 'Warehouse',
    'Restaurant': 'Dining',
    'Apartment': 'Apartment'
  };
  
  return spaceTypeMap[buildingType] || 'Office';
}

// Select HVAC system configuration based on building type and size
function selectHVACSystemConfig(buildingType, area) {
  // Small buildings typically use packaged systems
  if (area < 25000) {
    return {
      zone_hvac: {
        default_zone_hvac: 'ptac'  // System 01
      },
      plant_loops: {
        hot_water_1: {
          plant_loop_type: 'hot_water',
          supply_components: {
            inlet_node: ['pump_var'],
            branches: ['boiler_hot_water', 'pipe_1']
          },
          demand_components: {
            branches: ['ptac']
          }
        }
      },
      has_dcv: false,
      night_cycle: 'CycleOnAny',
      availability_schedule: 'hvac_operation',
      is_multi_zone: false
    };
  }
  
  // Larger buildings use VAV systems
  return {
    air_loops: {
      air_loop_hvac: {
        design_supply_air_flow_rate: 'autosize',
        system_type: 'VAV',
        return_air_type: 'Direct_To_Fan',
        supply_components: {
          inlet_node: ['oa_controller', 'cooling_coil', 'heating_coil', 'fan_variable_volume']
        },
        demand_components: {
          inlet_node: ['vav_reheat']
        }
      }
    },
    plant_loops: {
      chilled_water_1: {
        plant_loop_type: 'chilled_water',
        supply_components: {
          inlet_node: ['pump_var'],
          branches: ['chiller_electric', 'pipe_1']
        },
        demand_components: {
          branches: ['cooling_coil']
        }
      },
      hot_water_1: {
        plant_loop_type: 'hot_water',
        supply_components: {
          inlet_node: ['pump_var'],
          branches: ['boiler_hot_water', 'pipe_1']
        },
        demand_components: {
          branches: ['heating_coil', 'vav_reheat']
        }
      }
    },
    has_dcv: true,
    availability_schedule: 'hvac_operation',
    is_multi_zone: true
  };
}

// Get HVAC components based on building type
function getHVACComponents(buildingType) {
  const baseComponents = {
    pump_var: {
      idd_object_type: 'PumpVariableSpeed'
    },
    boiler_hot_water: {
      idd_object_type: 'BoilerHotWater'
    },
    pipe_1: {
      idd_object_type: 'PipeAdiabatic'
    }
  };
  
  // Add system-specific components
  return {
    ...baseComponents,
    ptac: {
      idd_object_type: 'ZoneHVACPackagedTerminalAirConditioner',
      sub_components: {
        heating_coil: {
          idd_object_type: 'CoilHeatingWater'
        },
        cooling_coil: {
          idd_object_type: 'CoilCoolingDXSingleSpeed',
          component_values: { rated_cop: 3.2 }
        },
        fan: {
          idd_object_type: 'FanConstantVolume',
          component_values: {
            pressure_rise: 300.0,
            motor_efficiency: 0.85,
            fan_efficiency: 0.6
          }
        }
      }
    },
    fan_variable_volume: {
      idd_object_type: 'FanVariableVolume'
    },
    cooling_coil: {
      idd_object_type: 'CoilCoolingWater'
    },
    heating_coil: {
      idd_object_type: 'CoilHeatingWater'
    },
    vav_reheat: {
      idd_object_type: 'AirTerminalSingleDuctVAVReheat'
    },
    chiller_electric: {
      idd_object_type: 'ChillerElectricEIR'
    }
  };
}

// Get default schedules
function getDefaultSchedules() {
  return {
    hvac_operation: {
      summer_design_day: {
        name: 'summer_design_day_schedule',
        values: {'00:00': 0, '06:00': 0, '18:00': 1, '22:00': 0}
      },
      winter_design_day: {
        name: 'winter_design_day_schedule',
        values: {'00:00': 0, '06:00': 0, '18:00': 1, '22:00': 0}
      },
      default_day: {
        name: 'default_day_schedule',
        values: {'00:00': 0, '06:00': 0, '18:00': 1, '22:00': 0}
      },
      schedule_rules: {
        custom_schedule_rule: {
          apply_saturday: true,
          apply_sunday: true,
          name: 'rule',
          day_schedule: {
            name: 'default_day_schedule',
            values: {'00:00': 0}
          }
        }
      },
      name: 'hvac_operation'
    }
  };
}

// Generate measures configuration from selected ECMs
function generateMeasuresFromECMs(ecms) {
  const measures = {
    hvac_controls: {
      cooling_setpoint: 24.0,
      heating_setpoint: 21.0,
      has_setback: false,
      has_weekend_occupancy: false,
      weekday_start_time: '07:00',
      weekday_end_time: '18:00',
      has_dcv: false,
      night_cycle: 'CycleOnAny'
    },
    hvac_equipment: {
      fan_efficiency: 0.6,
      fan_pressure_rise: 500.0,
      fan_motor_efficiency: 0.85,
      has_dcv: false,
      night_cycle: 'CycleOnAny'
    }
  };
  
  // Apply ECM modifications
  ecms.forEach(ecm => {
    switch (ecm.category) {
      case 'HVAC':
        // HVAC equipment improvements
        if (ecm.name.includes('High-efficiency') || ecm.name.includes('Upgrade')) {
          measures.hvac_equipment.fan_efficiency = 0.85;
          measures.hvac_equipment.fan_motor_efficiency = 0.95;
          measures.hvac_equipment.chiller_cop = 6.5;
          measures.hvac_equipment.boiler_efficiency = 0.95;
        }
        break;
        
      case 'Controls':
        // Control improvements
        measures.hvac_controls.has_setback = true;
        measures.hvac_controls.has_dcv = true;
        measures.hvac_controls.cooling_setpoint = 25.0;  // Wider deadband
        measures.hvac_controls.heating_setpoint = 20.0;
        measures.hvac_equipment.has_dcv = true;
        break;
        
      case 'Motors':
        // VFD and motor improvements
        measures.hvac_equipment.has_vfd = true;
        measures.hvac_equipment.fan_motor_efficiency = 0.95;
        break;
    }
  });
  
  return measures;
}

// Run simulation using Python script
export async function runSimulation(config) {
  const configPath = path.join(config.run_info.output_location, 'simulation_config.json');
  
  // Ensure output directory exists
  await fs.mkdir(config.run_info.output_location, { recursive: true });
  await fs.mkdir(config.run_info.temp_sim_location, { recursive: true });
  
  // Save configuration
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  
  // Create Python script to run the simulation
  const pythonScript = `
import sys
import json
sys.path.insert(0, r'${path.join(__dirname, '..', '..', '..', '..')}')
from energyplus_example_file_generator.audit.audit import Measure

# Load configuration
with open('${configPath.replace(/\\/g, '\\\\')}', 'r') as f:
    config = json.load(f)

# Run simulation
measure = Measure(config)
print("Simulation completed")
`;
  
  const scriptPath = path.join(config.run_info.output_location, 'run_simulation.py');
  await fs.writeFile(scriptPath, pythonScript);
  
  return new Promise((resolve, reject) => {
    const python = spawn('python', [scriptPath], {
      cwd: config.run_info.output_location
    });
    
    let output = '';
    let error = '';
    
    python.stdout.on('data', (data) => {
      output += data.toString();
      console.log('Python output:', data.toString());
    });
    
    python.stderr.on('data', (data) => {
      error += data.toString();
      console.error('Python error:', data.toString());
    });
    
    python.on('close', async (code) => {
      if (code !== 0) {
        reject(new Error(`Simulation failed: ${error}`));
      } else {
        // Read the enable_output.json file
        const outputPath = path.join(config.run_info.output_location, 'enable_output.json');
        try {
          const results = await fs.readFile(outputPath, 'utf-8');
          resolve(JSON.parse(results));
        } catch (err) {
          reject(new Error('Failed to read simulation results'));
        }
      }
    });
  });
}