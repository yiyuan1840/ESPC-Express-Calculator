idf_generation_inputs = {
        'measures': {
            'hvac_controls': {
                'cooling_setpoint': 24.0,
                'heating_setpoint': 21.0,
                'has_setback': False,
                'has_weekend_occupancy': False,
                'weekday_start_time': '07:00',
                'weekday_end_time': '18:00',
                'has_dcv': True,        # System 07 has DCV
                'night_cycle': 'CycleOnAny'
            },
            'hvac_equipment': {
                'fan_efficiency': 0.7,      # System 07 central fan
                'fan_pressure_rise': 1250.0, # System 07 higher pressure
                'fan_motor_efficiency': 0.93,
                'has_dcv': True,
                'night_cycle': 'CycleOnAny'
            }
        },
        'hvac': {
            'hvac_system': {
                'air_loops': {
                    'VAV_Reheat_System': {  # System 07 specific name
                        'supply_components': {
                            'outlet_node': ['oa_system', 'coil_cooling_water', 'coil_heating_water', 'fan_vav']
                        },
                        'demand_components': {
                            'branches': {
                                'default_air_terminal': 'terminal_vav_reheat'
                            }
                        }
                    }
                },
                'plant_loops': {
                    'hot_water_1': {
                        'plant_loop_type': 'hot_water',
                        'supply_components': {
                            'inlet_node': ['pump_var'],
                            'branches': ['boiler_hot_water', 'pipe_1']
                        },
                        'demand_components': {
                            'branches': ['coil_heating_water', 'terminal_vav_reheat']
                        }
                    },
                    'chilled_water_1': {
                        'plant_loop_type': 'chilled_water',
                        'supply_components': {
                            'inlet_node': ['pump_var_2'],
                            'branches': ['chiller_elec_eir', 'pipe_2']
                        },
                        'demand_components': {
                            'branches': ['coil_cooling_water']
                        }
                    },
                    'condenser_water_1': {
                        'plant_loop_type': 'condenser_water',
                        'supply_components': {
                            'inlet_node': ['pump_var_3'],
                            'branches': ['cooling_tower_single_speed', 'pipe_3']
                        },
                        'demand_components': {
                            'branches': ['chiller_elec_eir']
                        }
                    }
                },
                'has_dcv': True,
                'night_cycle': 'CycleOnAny',
                'availability_schedule': 'hvac_operation',
                'is_multi_zone': True   # System 07 is multi-zone
            }
        },
        'hvac_components': {
            'oa_system': {
                'idd_object_type': 'AirLoopHVACOutdoorAirSystem',
                'sub_components': {
                    'outdoor_air_controller': {'idd_object_type': 'ControllerOutdoorAir'}
                }
            },
            'coil_cooling_water': {
                'idd_object_type': 'CoilCoolingWater'  # System 07 chilled water cooling
            },
            'coil_heating_water': {
                'idd_object_type': 'CoilHeatingWater'  # System 07 hot water heating
            },
            'fan_vav': {
                'idd_object_type': 'FanVariableVolume',
                'component_values': {
                    'pressure_rise': 1250.0,    # System 07 central fan pressure
                    'motor_efficiency': 0.93,
                    'fan_efficiency': 0.7       # System 07 central fan efficiency
                }
            },
            'terminal_vav_reheat': {
                'idd_object_type': 'AirTerminalSingleDuctVAVReheat',
                'sub_components': {
                    'reheat_coil': {
                        'idd_object_type': 'CoilHeatingWater'  # System 07 hot water reheat
                    }
                }
            },
            # Plant loop components
            'pump_var': {
                'idd_object_type': 'PumpVariableSpeed'
            },
            'pump_var_2': {
                'idd_object_type': 'PumpVariableSpeed'
            },
            'pump_var_3': {
                'idd_object_type': 'PumpVariableSpeed'
            },
            'boiler_hot_water': {
                'idd_object_type': 'BoilerHotWater'
            },
            'chiller_elec_eir': {
                'idd_object_type': 'ChillerElectricEIR'
            },
            'cooling_tower_single_speed': {
                'idd_object_type': 'CoolingTowerSingleSpeed'
            },
            'pipe_1': {
                'idd_object_type': 'PipeAdiabatic'
            },
            'pipe_2': {
                'idd_object_type': 'PipeAdiabatic'
            },
            'pipe_3': {
                'idd_object_type': 'PipeAdiabatic'
            }
        },
        'schedules': {
            'hvac_operation': {
                'summer_design_day': {
                    'name': 'summer_design_day_schedule',
                    'values': {'00:00': 0, '06:00': 0, '18:00': 1, '22:00': 0}
                },
                'winter_design_day': {
                    'name': 'winter_design_day_schedule',
                    'values': {'00:00': 0, '06:00': 0, '18:00': 1, '22:00': 0}
                },
                'default_day': {
                    'name': 'default_day_schedule',
                    'values': {'00:00': 0, '06:00': 0, '18:00': 1, '22:00': 0}
                },
                'schedule_rules': {
                    'custom_schedule_rule': {
                        'apply_saturday': True,
                        'apply_sunday': True,
                        'name': 'rule',
                        'day_schedule': {
                            'name': 'default_day_schedule',
                            'values': {'00:00': 0}
                        }
                    }
                },
                'name': 'hvac_operation'
            }
        },
        'construction_sets': {
            'building_construction': {
                'base_construction_set': 'default',
                'base_building_type': 'Large_Office',  # System 07 for large buildings
                'building_age': 2004,
                'climate_zone': '5A',
                'building_standard': 'ASHRAE 90.1-2004',
                'wall_type': '',
                'roof_type': '',
                'south_win_type': 'Reference',
                'east_win_type': 'Reference',
                'north_win_type': 'Reference',
                'west_win_type': 'Reference'
            }
        },
        'space_types': {
            'main_space': {
                'base_space_type': 'LargeOffice',  # System 07 large office
                'base_building_type': 'Large_Office',
                'building_age': 2004,
                'climate_zone': '5A',
                'building_standard': 'ASHRAE 90.1-2004',
                'elec_plug_per_flr_area': 10.76,    # Large office typical
                'int_lighting_per_flr_area': 10.76,
                'flr_area_per_person': 18.6,        # Large office density
                'inf_flow_per_ext_surface_area': 0.0003,
                'oa_flow_per_person': 0.0125,
                'oa_flow_per_area': 0,
                'cooling_setpoint': 24.0,
                'heating_setpoint': 21.0,
                'has_setback': False,
                'has_weekend_occupancy': False,
                'weekday_start_time': '06:00',
                'weekday_end_time': '18:00'
            }
        },
        'run_info': {
            'uuid': '{ASHRAE-SYSTEM-07-WORKING-TEST}',
            'building_type': 'Large_Office',
            'output_location': os.path.abspath(output_dir),
            'temp_sim_location': os.path.abspath(os.path.join(output_dir, 'temp')),
            'building_age': 2004,
            'climate_zone': '5A',
            'building_standard': 'ASHRAE 90.1-2004',
            'simulation_year': 2014,
            'timestep': 6
        },
        'building_info': {
            'has_drop_ceilings': False,
            'floor_height': 3.96,                # System 07 typical office height
            'use_multiplier': True,              # System 07 uses multiplier
            'number_of_floors': 10,              # System 07 high-rise
            'orientation': 0,
            'geometry_configuration': 'Rectangle',
            'zone_layout': 'Five_Zone',          # System 07 multi-zone
            'roof_style': 'flat',
            'ext_lighting_intensity': 15000,    # System 07 large building
            'length1': 50.0,                    # System 07 large footprint
            'length2': 0,
            'width1': 33.0,
            'width2': 0,
            'end1': 0,
            'end2': 0,
            'offset1': 0,
            'offset2': 0,
            'offset3': 0,
            'core_offset': 4.57,                # System 07 has core zone
            'drop_ceiling_height': 1.22,        # System 07 drop ceiling
            'number_of_zones': 5,               # System 07 five zones
            'south_wwr': 0.33,                  # System 07 typical WWR
            'east_wwr': 0.33,
            'north_wwr': 0.33,
            'west_wwr': 0.33,
            'space_type': 'main_space',
            'construction_set': 'building_construction',
            'hvac_system': 'hvac_system'
        }
    }