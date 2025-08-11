// Building Configuration Generator Service
// Generates BEMEval-compatible IDF generation inputs from user form data

// Simple UUID generator since we don't have uuid package
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
import path from 'path';

/**
 * Generate complete building configuration from user input
 * @param {Object} formData - User input from NewProject form
 * @param {Object} projectData - Basic project information
 * @returns {Object} - Complete IDF generation inputs structure
 */
export function generateBuildingConfig(formData, projectData) {
  const config = {
    measures: generateMeasures(formData),
    hvac: generateHVACSystem(formData),
    hvac_components: generateHVACComponents(formData),
    schedules: generateSchedules(formData),
    construction_sets: generateConstructionSets(formData),
    space_types: generateSpaceTypes(formData),
    run_info: generateRunInfo(formData, projectData),
    building_info: generateBuildingInfo(formData, projectData)
  };

  return config;
}

/**
 * Generate measures configuration
 */
function generateMeasures(formData) {
  return {
    hvac_controls: {
      cooling_setpoint: parseFloat(formData.cooling_setpoint) || 24.0,
      heating_setpoint: parseFloat(formData.heating_setpoint) || 21.0,
      has_setback: formData.has_setback || false,
      has_weekend_occupancy: formData.has_weekend_occupancy || false,
      weekday_start_time: formData.weekday_start_time || '07:00',
      weekday_end_time: formData.weekday_end_time || '18:00',
      has_dcv: formData.has_dcv || false,
      night_cycle: 'CycleOnAny'
    },
    hvac_equipment: {
      fan_efficiency: getSystemFanEfficiency(formData.hvac_system_type),
      fan_pressure_rise: getSystemFanPressure(formData.hvac_system_type),
      fan_motor_efficiency: 0.93,
      has_dcv: formData.has_dcv || false,
      night_cycle: 'CycleOnAny'
    }
  };
}

/**
 * Generate HVAC system configuration based on selected system type
 */
function generateHVACSystem(formData) {
  const systemType = formData.hvac_system_type || 'System07';
  const baseConfig = {
    has_dcv: formData.has_dcv || false,
    night_cycle: 'CycleOnAny',
    availability_schedule: 'hvac_operation'
  };

  switch (systemType) {
    case 'System07': // VAV with Reheat
      return {
        hvac_system: {
          ...baseConfig,
          is_multi_zone: true,
          air_loops: {
            'VAV_Reheat_System': {
              supply_components: {
                outlet_node: ['oa_system', 'coil_cooling_water', 'coil_heating_water', 'fan_vav']
              },
              demand_components: {
                branches: {
                  default_air_terminal: 'terminal_vav_reheat'
                }
              }
            }
          },
          plant_loops: {
            hot_water_1: {
              plant_loop_type: 'hot_water',
              supply_components: {
                inlet_node: ['pump_var'],
                branches: ['boiler_hot_water', 'pipe_1']
              },
              demand_components: {
                branches: ['coil_heating_water', 'terminal_vav_reheat']
              }
            },
            chilled_water_1: {
              plant_loop_type: 'chilled_water',
              supply_components: {
                inlet_node: ['pump_var_2'],
                branches: ['chiller_elec_eir', 'pipe_2']
              },
              demand_components: {
                branches: ['coil_cooling_water']
              }
            },
            condenser_water_1: {
              plant_loop_type: 'condenser_water',
              supply_components: {
                inlet_node: ['pump_var_3'],
                branches: ['cooling_tower_single_speed', 'pipe_3']
              },
              demand_components: {
                branches: ['chiller_elec_eir']
              }
            }
          }
        }
      };

    case 'System01': // PTAC
      return {
        hvac_system: {
          ...baseConfig,
          is_multi_zone: false,
          air_loops: {
            'PTAC_System': {
              supply_components: {
                outlet_node: ['oa_system', 'coil_cooling_dx_single_speed', 'coil_heating_electric', 'fan_constant']
              },
              demand_components: {
                branches: {
                  default_air_terminal: 'terminal_single_duct_uncontrolled'
                }
              }
            }
          }
        }
      };

    case 'System05': // Packaged VAV with Reheat
      return {
        hvac_system: {
          ...baseConfig,
          is_multi_zone: true,
          air_loops: {
            'Packaged_VAV_System': {
              supply_components: {
                outlet_node: ['oa_system', 'coil_cooling_dx_two_speed', 'coil_heating_gas', 'fan_vav']
              },
              demand_components: {
                branches: {
                  default_air_terminal: 'terminal_vav_reheat'
                }
              }
            }
          }
        }
      };

    default:
      // Default to System07 VAV with Reheat
      return generateHVACSystem({ ...formData, hvac_system_type: 'System07' });
  }
}

/**
 * Generate HVAC components configuration
 */
function generateHVACComponents(formData) {
  const systemType = formData.hvac_system_type || 'System07';
  const baseComponents = {
    oa_system: {
      idd_object_type: 'AirLoopHVACOutdoorAirSystem',
      sub_components: {
        outdoor_air_controller: { idd_object_type: 'ControllerOutdoorAir' }
      }
    }
  };

  switch (systemType) {
    case 'System07': // VAV with Reheat
      return {
        ...baseComponents,
        coil_cooling_water: {
          idd_object_type: 'CoilCoolingWater'
        },
        coil_heating_water: {
          idd_object_type: 'CoilHeatingWater'
        },
        fan_vav: {
          idd_object_type: 'FanVariableVolume',
          component_values: {
            pressure_rise: 1250.0,
            motor_efficiency: 0.93,
            fan_efficiency: 0.7
          }
        },
        terminal_vav_reheat: {
          idd_object_type: 'AirTerminalSingleDuctVAVReheat',
          sub_components: {
            reheat_coil: {
              idd_object_type: 'CoilHeatingWater'
            }
          }
        },
        // Plant loop components
        pump_var: { idd_object_type: 'PumpVariableSpeed' },
        pump_var_2: { idd_object_type: 'PumpVariableSpeed' },
        pump_var_3: { idd_object_type: 'PumpVariableSpeed' },
        boiler_hot_water: { idd_object_type: 'BoilerHotWater' },
        chiller_elec_eir: { idd_object_type: 'ChillerElectricEIR' },
        cooling_tower_single_speed: { idd_object_type: 'CoolingTowerSingleSpeed' },
        pipe_1: { idd_object_type: 'PipeAdiabatic' },
        pipe_2: { idd_object_type: 'PipeAdiabatic' },
        pipe_3: { idd_object_type: 'PipeAdiabatic' }
      };

    case 'System01': // PTAC
      return {
        ...baseComponents,
        coil_cooling_dx_single_speed: {
          idd_object_type: 'CoilCoolingDXSingleSpeed'
        },
        coil_heating_electric: {
          idd_object_type: 'CoilHeatingElectric'
        },
        fan_constant: {
          idd_object_type: 'FanConstantVolume',
          component_values: {
            pressure_rise: 500.0,
            motor_efficiency: 0.9,
            fan_efficiency: 0.6
          }
        },
        terminal_single_duct_uncontrolled: {
          idd_object_type: 'AirTerminalSingleDuctUncontrolled'
        }
      };

    default:
      return generateHVACComponents({ ...formData, hvac_system_type: 'System07' });
  }
}

/**
 * Generate schedules configuration
 */
function generateSchedules(formData) {
  const startHour = parseInt(formData.weekday_start_time?.split(':')[0]) || 6;
  const endHour = parseInt(formData.weekday_end_time?.split(':')[0]) || 18;

  return {
    hvac_operation: {
      summer_design_day: {
        name: 'summer_design_day_schedule',
        values: { '00:00': 0, [`${startHour.toString().padStart(2, '0')}:00`]: 0, [`${endHour.toString().padStart(2, '0')}:00`]: 1, '22:00': 0 }
      },
      winter_design_day: {
        name: 'winter_design_day_schedule',
        values: { '00:00': 0, [`${startHour.toString().padStart(2, '0')}:00`]: 0, [`${endHour.toString().padStart(2, '0')}:00`]: 1, '22:00': 0 }
      },
      default_day: {
        name: 'default_day_schedule',
        values: { '00:00': 0, [`${startHour.toString().padStart(2, '0')}:00`]: 0, [`${endHour.toString().padStart(2, '0')}:00`]: 1, '22:00': 0 }
      },
      schedule_rules: {
        custom_schedule_rule: {
          apply_saturday: !formData.has_weekend_occupancy,
          apply_sunday: !formData.has_weekend_occupancy,
          name: 'rule',
          day_schedule: {
            name: 'weekend_day_schedule',
            values: formData.has_weekend_occupancy 
              ? { '00:00': 0, [`${startHour.toString().padStart(2, '0')}:00`]: 0, [`${endHour.toString().padStart(2, '0')}:00`]: 1, '22:00': 0 }
              : { '00:00': 0 }
          }
        }
      },
      name: 'hvac_operation'
    }
  };
}

/**
 * Generate construction sets configuration
 */
function generateConstructionSets(formData) {
  const buildingType = getBuildingTypeMapping(formData.building_type);
  
  return {
    building_construction: {
      base_construction_set: 'default',
      base_building_type: buildingType,
      building_age: parseInt(formData.building_age) || 2004,
      climate_zone: formData.climate_zone || '5A',
      building_standard: `ASHRAE 90.1-${formData.building_age || 2004}`,
      wall_type: formData.wall_type || '',
      roof_type: formData.roof_type || '',
      south_win_type: 'Reference',
      east_win_type: 'Reference',
      north_win_type: 'Reference',
      west_win_type: 'Reference'
    }
  };
}

/**
 * Generate space types configuration
 */
function generateSpaceTypes(formData) {
  const buildingType = getBuildingTypeMapping(formData.building_type);
  const spaceTypeDensity = getSpaceTypeDensity(formData.building_type);
  
  return {
    main_space: {
      base_space_type: buildingType,
      base_building_type: buildingType,
      building_age: parseInt(formData.building_age) || 2004,
      climate_zone: formData.climate_zone || '5A',
      building_standard: `ASHRAE 90.1-${formData.building_age || 2004}`,
      elec_plug_per_flr_area: spaceTypeDensity.elec_plug,
      int_lighting_per_flr_area: spaceTypeDensity.lighting,
      flr_area_per_person: spaceTypeDensity.occupancy,
      inf_flow_per_ext_surface_area: 0.0003,
      oa_flow_per_person: spaceTypeDensity.oa_per_person,
      oa_flow_per_area: spaceTypeDensity.oa_per_area,
      cooling_setpoint: parseFloat(formData.cooling_setpoint) || 24.0,
      heating_setpoint: parseFloat(formData.heating_setpoint) || 21.0,
      has_setback: formData.has_setback || false,
      has_weekend_occupancy: formData.has_weekend_occupancy || false,
      weekday_start_time: formData.weekday_start_time || '06:00',
      weekday_end_time: formData.weekday_end_time || '18:00'
    }
  };
}

/**
 * Generate run info configuration
 */
function generateRunInfo(formData, projectData) {
  return {
    uuid: `{${projectData.name.toUpperCase().replace(/\s+/g, '-')}-${Date.now()}}`,
    building_type: getBuildingTypeMapping(formData.building_type),
    output_location: path.resolve('./output'),
    temp_sim_location: path.resolve('./output/temp'),
    building_age: parseInt(formData.building_age) || 2004,
    climate_zone: formData.climate_zone || '5A',
    building_standard: `ASHRAE 90.1-${formData.building_age || 2004}`,
    simulation_year: new Date().getFullYear(),
    timestep: 6
  };
}

/**
 * Generate building info configuration
 */
function generateBuildingInfo(formData, projectData) {
  const buildingArea = parseFloat(formData.building_area) || 10000;
  const numFloors = parseInt(formData.number_of_floors) || 2;
  const floorHeight = parseFloat(formData.floor_to_floor_height) || 3.96;
  
  // Calculate building dimensions based on area and shape
  const { length1, width1 } = calculateBuildingDimensions(buildingArea, numFloors, formData.building_shape);
  
  return {
    has_drop_ceilings: false,
    floor_height: floorHeight,
    use_multiplier: numFloors > 3,
    number_of_floors: numFloors,
    orientation: parseFloat(formData.building_orientation) || 0,
    geometry_configuration: formData.building_shape || 'Rectangle',
    zone_layout: getZoneLayout(formData.hvac_system_type, buildingArea),
    roof_style: 'flat',
    ext_lighting_intensity: calculateExteriorLighting(buildingArea),
    length1: length1,
    length2: 0,
    width1: width1,
    width2: 0,
    end1: 0,
    end2: 0,
    offset1: 0,
    offset2: 0,
    offset3: 0,
    core_offset: Math.min(4.57, Math.min(length1, width1) * 0.1),
    drop_ceiling_height: 1.22,
    number_of_zones: getNumberOfZones(formData.hvac_system_type, buildingArea),
    south_wwr: parseFloat(formData.window_to_wall_ratio) || 0.33,
    east_wwr: parseFloat(formData.window_to_wall_ratio) || 0.33,
    north_wwr: parseFloat(formData.window_to_wall_ratio) || 0.33,
    west_wwr: parseFloat(formData.window_to_wall_ratio) || 0.33,
    space_type: 'main_space',
    construction_set: 'building_construction',
    hvac_system: 'hvac_system'
  };
}

// Helper functions

function getSystemFanEfficiency(systemType) {
  const efficiencies = {
    'System01': 0.6, // PTAC
    'System02': 0.6, // PTHP
    'System03': 0.65, // PSZ-AC
    'System04': 0.65, // PSZ-HP
    'System05': 0.68, // Packaged VAV
    'System06': 0.68, // Packaged VAV PFP
    'System07': 0.7, // VAV Reheat
    'System08': 0.7, // VAV PFP
    'System09': 0.6, // Gas Furnace
    'System10': 0.6  // Electric Furnace
  };
  return efficiencies[systemType] || 0.65;
}

function getSystemFanPressure(systemType) {
  const pressures = {
    'System01': 500, // PTAC
    'System02': 500, // PTHP
    'System03': 750, // PSZ-AC
    'System04': 750, // PSZ-HP
    'System05': 1100, // Packaged VAV
    'System06': 1100, // Packaged VAV PFP
    'System07': 1250, // VAV Reheat
    'System08': 1250, // VAV PFP
    'System09': 500, // Gas Furnace
    'System10': 500  // Electric Furnace
  };
  return pressures[systemType] || 750;
}

function getBuildingTypeMapping(buildingType) {
  const mappings = {
    'Office': 'LargeOffice',
    'Retail': 'RetailStandalone',
    'School': 'SecondarySchool',
    'Hospital': 'Hospital',
    'Hotel': 'LargeHotel',
    'Restaurant': 'FullServiceRestaurant',
    'Warehouse': 'Warehouse',
    'Apartment': 'MidriseApartment'
  };
  return mappings[buildingType] || 'LargeOffice';
}

function getSpaceTypeDensity(buildingType) {
  const densities = {
    'Office': { elec_plug: 10.76, lighting: 10.76, occupancy: 18.6, oa_per_person: 0.0125, oa_per_area: 0 },
    'Retail': { elec_plug: 6.88, lighting: 16.15, occupancy: 4.65, oa_per_person: 0.0038, oa_per_area: 0.0006 },
    'School': { elec_plug: 6.5, lighting: 15.77, occupancy: 4.65, oa_per_person: 0.0038, oa_per_area: 0.0006 },
    'Hospital': { elec_plug: 7.5, lighting: 16.0, occupancy: 8.0, oa_per_person: 0.0125, oa_per_area: 0.0006 },
    'Hotel': { elec_plug: 8.0, lighting: 11.0, occupancy: 23.0, oa_per_person: 0.0063, oa_per_area: 0.0003 },
    'Restaurant': { elec_plug: 15.0, lighting: 22.0, occupancy: 1.4, oa_per_person: 0.0094, oa_per_area: 0.0018 },
    'Warehouse': { elec_plug: 3.0, lighting: 8.0, occupancy: 200.0, oa_per_person: 0.0063, oa_per_area: 0.0002 },
    'Apartment': { elec_plug: 4.0, lighting: 7.0, occupancy: 38.0, oa_per_person: 0.0063, oa_per_area: 0.0003 }
  };
  return densities[buildingType] || densities['Office'];
}

function calculateBuildingDimensions(totalArea, numFloors, shape) {
  const floorArea = totalArea / numFloors;
  
  switch (shape) {
    case 'Rectangle':
      // Assume 3:2 aspect ratio for rectangles
      const width = Math.sqrt(floorArea * 2 / 3);
      const length = floorArea / width;
      return { length1: Math.round(length * 10) / 10, width1: Math.round(width * 10) / 10 };
    
    case 'L':
    case 'H':
    case 'T':
    case 'U':
      // For complex shapes, use square footprint as base
      const side = Math.sqrt(floorArea);
      return { length1: Math.round(side * 10) / 10, width1: Math.round(side * 10) / 10 };
    
    default:
      return { length1: 50.0, width1: 33.0 };
  }
}

function getZoneLayout(systemType, buildingArea) {
  if (buildingArea < 5000) return 'Single_Zone';
  if (buildingArea < 20000) return 'Three_Zone';
  return 'Five_Zone';
}

function getNumberOfZones(systemType, buildingArea) {
  if (buildingArea < 5000) return 1;
  if (buildingArea < 20000) return 3;
  return 5;
}

function calculateExteriorLighting(buildingArea) {
  // Estimate exterior lighting based on building area
  return Math.max(5000, buildingArea * 0.3);
}

export default {
  generateBuildingConfig
};