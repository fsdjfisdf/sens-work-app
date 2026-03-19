module.exports = {
  "equipmentGroups": [
    {
      "code": "SUPRA_N",
      "display_name": "SUPRA N",
      "sort_order": 1
    },
    {
      "code": "SUPRA_XP",
      "display_name": "SUPRA XP",
      "sort_order": 2
    },
    {
      "code": "INTEGER",
      "display_name": "INTEGER",
      "sort_order": 3
    },
    {
      "code": "PRECIA",
      "display_name": "PRECIA",
      "sort_order": 4
    },
    {
      "code": "ECOLITE_300",
      "display_name": "ECOLITE 300",
      "sort_order": 5
    },
    {
      "code": "GENEVA",
      "display_name": "GENEVA",
      "sort_order": 6
    },
    {
      "code": "HDW",
      "display_name": "HDW",
      "sort_order": 7
    }
  ],
  "defaultGroupAccess": {
    "PEE1": [
      "SUPRA_N",
      "SUPRA_XP"
    ],
    "PEE2": [
      "INTEGER",
      "PRECIA"
    ],
    "PSKH": [
      "ECOLITE_300",
      "GENEVA",
      "HDW"
    ]
  },
  "templates": [
    {
      "equipment_group_code": "SUPRA_N",
      "checklist_kind": "SETUP",
      "template_name": "SUPRA N Setup Checklist",
      "version_no": 1,
      "sections": [
        {
          "section_code": "INSTALLATION_PREPERATION",
          "section_name": "INSTALLATION PREPERATION",
          "sort_order": 1,
          "questions": [
            {
              "question_code": "DRAWING_TEMPLATE_SETUP",
              "question_text": "Drawing Template을 기준선에 맞춰 배치 알고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "DRAWING_TEMPLATE_MARKING",
              "question_text": "Drawing Template를 펼쳐 타공, H빔 및 Adjust 를 Marking 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "CUSTOMER_OHT_LINE_CHECK",
              "question_text": "고객사에서 그린 기준선과 OHT라인이 일치하는지 확인 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "UTILITY_SPEC_UNDERSTANDING",
              "question_text": "타공별 Utility Spec을 숙지하고 있는가?",
              "sort_order": 4
            }
          ]
        },
        {
          "section_code": "FAB_IN",
          "section_name": "FAB IN",
          "sort_order": 2,
          "questions": [
            {
              "question_code": "EQUIPMENT_IMPORT_CAUTION",
              "question_text": "설비반입 주의 사항에 대해 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "EQUIPMENT_IMPORT_ORDER",
              "question_text": "설비반입 순서를 숙지하고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "EQUIPMENT_SPACING_CHECK",
              "question_text": "설비간 유격거리가 충분한지 확인 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "PACKING_LIST_CHECK",
              "question_text": "Packing List 확인하여 반입 Part 확인이 가능 한가?",
              "sort_order": 4
            }
          ]
        },
        {
          "section_code": "DOCKING",
          "section_name": "DOCKING",
          "sort_order": 3,
          "questions": [
            {
              "question_code": "TOOL_SIZE_UNDERSTANDING",
              "question_text": "장비별 Tool size를 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "LASER_JIG_ALIGNMENT",
              "question_text": "Laser Jig 를 이용하여 OHT Line 과 설비를 정렬 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "LIFT_CASTER_REMOVAL",
              "question_text": "Lift를 활용하여 EFEM의 Caster 를 제거 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "MODULE_HEIGHT_DOCKING",
              "question_text": "각 Module의 지면에서 frame의 높이를 알고 Spec에 맞춰 Docking 알고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "MODULE_DOCKING",
              "question_text": "Module간 Docking 할 수 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "DOCKING_REALIGNMENT",
              "question_text": "Docking작업 중 설비와 OHT Line 정렬이 틀어졌을 경우 재정렬 알고 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "LEVELER_POSITION_UNDERSTANDING",
              "question_text": "각 Moudule의 Leveler 정위치를 숙지하고 있는가?",
              "sort_order": 7
            },
            {
              "question_code": "MODULE_LEVELING",
              "question_text": "각 Moudule의 Leveling Spec을 알고 Adjust를 이용, Leveling 알고 있는가?",
              "sort_order": 8
            },
            {
              "question_code": "HOOK_UP",
              "question_text": "내부 Hook Up 알고 있는가?",
              "sort_order": 9
            }
          ]
        },
        {
          "section_code": "CABLE_HOOK_UP",
          "section_name": "CABLE HOOK UP",
          "sort_order": 4,
          "questions": [
            {
              "question_code": "TRAY_CHECK",
              "question_text": "설비에서 Rack까지 Tray 확인 및 작업가능여부 판단알고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "CABLE_SORTING",
              "question_text": "Cable 각 Module별로 분류 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "GRATING_OPEN_CAUTION",
              "question_text": "Grating Open시 주의 사항을 숙지하고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "LADDER_SAFETY_RULES",
              "question_text": "사다리 작업시 환경안전수칙을 숙지하고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "CABLE_INSTALLATION",
              "question_text": "설비에서 Rack까지 포설 알고 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "CABLE_CONNECTION",
              "question_text": "Cable을 설비에 정확히 연결 알고 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "CABLE_TRAY_ARRANGEMENT",
              "question_text": "Cable을 Tray에 규격에 맞게 정리 알고 있는가?",
              "sort_order": 7
            },
            {
              "question_code": "CABLE_CUTTING",
              "question_text": "설비와 Rack간의 거리를 고려해 Cable 재단 알고 있는가?",
              "sort_order": 8
            },
            {
              "question_code": "PUMP_CABLE_TRAY",
              "question_text": "Pump Cable의 종류를 알고 알맞은 Tray로 내려줄 수 있는가?",
              "sort_order": 9
            },
            {
              "question_code": "PUMP_CABLE_ARRANGEMENT",
              "question_text": "Pump단에서 Cable 포설 및 정리 알고 있는가?",
              "sort_order": 10
            },
            {
              "question_code": "CABLE_PM_PUMP_CONNECTION",
              "question_text": "Cable을 구분하여 PM별로 Pump에 정확히 연결 알고 있는가?",
              "sort_order": 11
            }
          ]
        },
        {
          "section_code": "POWER_TURN_ON",
          "section_name": "POWER TURN ON",
          "sort_order": 5,
          "questions": [
            {
              "question_code": "GPS_UPS_SPS_UNDERSTANDING",
              "question_text": "GPS, UPS, SPS 의 역할과 원리에 대해 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "POWER_TURN_ON_SEQUENCE",
              "question_text": "Power turn on 순서를 숙지하고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "RACK_CB_UNDERSTANDING",
              "question_text": "Rack의 CB 종류와 기능을 숙지하고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "SYCON_NUMBER_UNDERSTANDING",
              "question_text": "Sycon number 별 의미하는 Part를 숙지하고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "MODULE_CB_TURN_ON",
              "question_text": "Module별 CB 위치를 알고 Turn on 알고 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "SAFETY_MODULE_UNDERSTANDING",
              "question_text": "Safety Module의 위치와 기능을 숙지하고 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "EMO_CHECK",
              "question_text": "EMO 동작 Check 알고 있는가?",
              "sort_order": 7
            },
            {
              "question_code": "POWER_TURN_ON_ALARM_TROUBLESHOOTING",
              "question_text": "Power turn on 후 발생하는 Alram Troble Shooting 알고 있는가?",
              "sort_order": 8
            }
          ]
        },
        {
          "section_code": "UTILITY_TURN_ON",
          "section_name": "UTILITY TURN ON",
          "sort_order": 6,
          "questions": [
            {
              "question_code": "UTILITY_TURN_ON_SEQUENCE",
              "question_text": "Utility turn on 의 순서를 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "VACUUM_TURN_ON",
              "question_text": "Vacuum Turn on 및 Spec에 맞게 조정 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "CDA_TURN_ON",
              "question_text": "CDA Turn on 및 Spec에 맞게 조정 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "PCW_TURN_ON",
              "question_text": "PCW Turn on 및 Spec에 맞게 조정 알고 있는가?",
              "sort_order": 4
            }
          ]
        },
        {
          "section_code": "GAS_TURN_ON",
          "section_name": "GAS TURN ON",
          "sort_order": 7,
          "questions": [
            {
              "question_code": "GAS_TURN_ON",
              "question_text": "GAS Turn On에 대해 알고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "GAS_TURN_ON_CHECK",
              "question_text": "GAS Turn On 전, 후 확인 사항에 대해 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "OX_NX_GAS_TURN_ON",
              "question_text": "OX, NX 가스 Turn on 및 가스 유입유무를 확인 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "MANOMETER_LIMIT_ADJUST",
              "question_text": "Manometer의 Low, High Limit 값 Spec에 맞게 조정 알고 있는가?",
              "sort_order": 4
            }
          ]
        },
        {
          "section_code": "TEACHING",
          "section_name": "TEACHING",
          "sort_order": 8,
          "questions": [
            {
              "question_code": "EFEM_ROBOT_PENDANT_CONTROL",
              "question_text": "EFEM Robot Pendant 조작 가능한가?",
              "sort_order": 1
            },
            {
              "question_code": "EFEM_ROBOT_LEVELING",
              "question_text": "EFEM Robot Leveling 알고 있는가?? (SANKYO)",
              "sort_order": 2
            },
            {
              "question_code": "EFEM_ROBOT_ARM_LEVELING",
              "question_text": "EFEM Robot Arm Leveling 알고 있는가?? (SANKYO)",
              "sort_order": 3
            },
            {
              "question_code": "EFEM_TEACHING_DATA_SAVE",
              "question_text": "EFEM Teaching Data 저장 가능한가? (SANKYO)",
              "sort_order": 4
            },
            {
              "question_code": "TM_ROBOT_PENDANT_CONTROL",
              "question_text": "TM Robot Pendant 조작 가능한가?",
              "sort_order": 5
            },
            {
              "question_code": "TM_ROBOT_PICK_ADJUST",
              "question_text": "TM Robot Pick 38Xmm Adjust (직교) 가능 한가? (SANKYO)",
              "sort_order": 6
            },
            {
              "question_code": "TM_ROBOT_BM_TEACHING",
              "question_text": "TM Robot BM Teaching 가능 한가? (SANKYO)",
              "sort_order": 7
            },
            {
              "question_code": "TM_ROBOT_PM_TEACHING",
              "question_text": "TM Robot PM Teeaching 가능 한가? (SANKYO)",
              "sort_order": 8
            },
            {
              "question_code": "TM_TEACHING_DATA_SAVE",
              "question_text": "TM Robot Teaching Data 저장 가능한가? (SANKYO)",
              "sort_order": 9
            },
            {
              "question_code": "WAFER_JIG_USE",
              "question_text": "Teachig Wafer Jig 사용 가능한가?",
              "sort_order": 10
            },
            {
              "question_code": "LASER_JIG_USE",
              "question_text": "Laser Teaching Jig 사용 가능한가?",
              "sort_order": 11
            },
            {
              "question_code": "FINE_TEACHING",
              "question_text": "미세 Teaching 가능한가?",
              "sort_order": 12
            },
            {
              "question_code": "MARGIN_CHECK",
              "question_text": "마진 Check 가능한가?",
              "sort_order": 13
            },
            {
              "question_code": "SEMI_AUTO_TRANSFER",
              "question_text": "Semi Auto Transfer 알고 있는가?",
              "sort_order": 14
            },
            {
              "question_code": "AGING_TEST",
              "question_text": "Aging Test 알고 있는가?",
              "sort_order": 15
            }
          ]
        },
        {
          "section_code": "PART_INSTALLATION",
          "section_name": "PART INSTALLATION",
          "sort_order": 9,
          "questions": [
            {
              "question_code": "BARATRON_PIRANI_GAUGE_INSTALLATION",
              "question_text": "Baratron, Pirani Gauge 장착이 가능한가?",
              "sort_order": 1
            },
            {
              "question_code": "EPD_INSTALLATION",
              "question_text": "EPD 장착이 가능한가?",
              "sort_order": 2
            },
            {
              "question_code": "PIO_SENSOR_CABLE_INSTALLATION",
              "question_text": "PIO Sensor, Cable 장착이 가능한가?",
              "sort_order": 3
            },
            {
              "question_code": "RACK_SIGNAL_TOWER_INSTALLATION",
              "question_text": "Rack Signal Tower 설치가 가능한가?",
              "sort_order": 4
            },
            {
              "question_code": "CTC_INSTALLATION",
              "question_text": "CTC 장착이 가능한가?",
              "sort_order": 5
            },
            {
              "question_code": "PORTABLE_RACK_INSTALLATION",
              "question_text": "Portable Rack 설치 가능 한가?",
              "sort_order": 6
            },
            {
              "question_code": "PM_SAFETY_COVER_INSTALLATION",
              "question_text": "PM Safety Cover 장착 가능 한가?",
              "sort_order": 7
            },
            {
              "question_code": "PROCESS_KIT_INSTALLATION",
              "question_text": "Process kit 장착 가능 한가?",
              "sort_order": 8
            }
          ]
        },
        {
          "section_code": "LEAK_CHECK",
          "section_name": "LEAK CHECK",
          "sort_order": 10,
          "questions": [
            {
              "question_code": "PUMP_TURN_ON",
              "question_text": "PUMP Turn On 알고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "PM_LEAK_CHECK",
              "question_text": "PM Leak Check에 대해 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "GAS_LINE_LEAK_CHECK",
              "question_text": "Gas Line Leak Check에 대해 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "HELIUM_DETECTOR_USE",
              "question_text": "Helium Detector 사용 방법에 대해 알고 있는가?",
              "sort_order": 4
            }
          ]
        },
        {
          "section_code": "TTTM",
          "section_name": "TTTM",
          "sort_order": 11,
          "questions": [
            {
              "question_code": "ECID_MATCHING",
              "question_text": "ECID Matching할 수 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "COOLING_STAGE_PIN_CONTROL",
              "question_text": "Cooling Stage Pin UP,Down Time 조절 가능한가?",
              "sort_order": 2
            },
            {
              "question_code": "PUMP_VENT_TIME_ADJUST",
              "question_text": "Puming / Venting Time 조절 가능한가?",
              "sort_order": 3
            },
            {
              "question_code": "EPD_PEAK_OFFSET_ADJUST",
              "question_text": "EPD Peak, Offset 조절 가능한가?",
              "sort_order": 4
            },
            {
              "question_code": "TEMP_AUTOTUNE",
              "question_text": "Temp autotune 가능 한가?",
              "sort_order": 5
            },
            {
              "question_code": "DOOR_VALVE_CONTROL",
              "question_text": "Door Valve Open,Close Time 조절 가능 한가?",
              "sort_order": 6
            },
            {
              "question_code": "APC_AUTOLEARN",
              "question_text": "APC Autolearn 가능 한가?",
              "sort_order": 7
            },
            {
              "question_code": "PIN_SPEED_HEIGHT_ADJUST",
              "question_text": "Pin speed, height Adjust 가능 한가?",
              "sort_order": 8
            },
            {
              "question_code": "GAS_SUPPLY_PRESSURE_CHECK",
              "question_text": "Gas Supply Pressure Check 가능 한가?",
              "sort_order": 9
            },
            {
              "question_code": "MFC_HUNTING_CHECK",
              "question_text": "MFC Normal 상태 Hunting 유/무 확인 가능 한가?",
              "sort_order": 10
            },
            {
              "question_code": "FCIP_CAL",
              "question_text": "FCIP Cal 가능한가? (R3, R5)",
              "sort_order": 11
            },
            {
              "question_code": "TTTM_SHEET_COMPLETION",
              "question_text": "TTTM Sheet 작성 가능한가?",
              "sort_order": 12
            }
          ]
        },
        {
          "section_code": "CUSTOMER_CERTIFICATION",
          "section_name": "CUSTOMER CERTIFICATION",
          "sort_order": 12,
          "questions": [
            {
              "question_code": "OHT_LAY_OUT_CERTIFICATION",
              "question_text": "OHT Lay Out 인증에 대해 알고 대응 할 수 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "OHT_CERTIFICATION",
              "question_text": "OHT 인증에 대해 알고 대응 할 수 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "TOOL_PREP_CERTIFICATION",
              "question_text": "중간인증준비(8계통)에 필요한 Tool에 대해 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "EFEM_CERTIFICATION_PREP",
              "question_text": "EFEM 중간인증준비(8계통) 할 수 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "TM_CERTIFICATION_PREP",
              "question_text": "TM 중간인증준비(8계통) 할 수 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "PM_CERTIFICATION_PREP",
              "question_text": "PM 중간인증준비(8계통) 할 수 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "SUB_UNIT_CERTIFICATION_PREP",
              "question_text": "SUB UNIT 중간인증준비(8계통) 할 수 있는가?",
              "sort_order": 7
            },
            {
              "question_code": "RACK_CERTIFICATION_PREP",
              "question_text": "RACK 중간인증준비(8계통) 할 수 있는가?",
              "sort_order": 8
            },
            {
              "question_code": "CERTIFICATION_RESPONSE",
              "question_text": "중간인증에 대해 알고 대응 할 수 있는가?",
              "sort_order": 9
            },
            {
              "question_code": "ENVIRONMENTAL_QUAL_RESPONSE",
              "question_text": "환경Qual에 대해 알고 대응 할 수 있는가?",
              "sort_order": 10
            }
          ]
        },
        {
          "section_code": "PROCESS_CONFIRM",
          "section_name": "PROCESS CONFIRM",
          "sort_order": 13,
          "questions": [
            {
              "question_code": "AGING_TEST_PROCESS_CONFIRM",
              "question_text": "Aging Test 알고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "EES_REPORT_PROCEDURE",
              "question_text": "EES Report 진행 방법 알고 있는가?",
              "sort_order": 2
            }
          ]
        }
      ]
    },
    {
      "equipment_group_code": "SUPRA_N",
      "checklist_kind": "MAINT",
      "template_name": "SUPRA N Maintenance Checklist",
      "version_no": 1,
      "sections": [
        {
          "section_code": "ESCORT",
          "section_name": "Escort",
          "sort_order": 1,
          "questions": [
            {
              "question_code": "LP_ESCORT",
              "question_text": "LP Escort",
              "sort_order": 1
            },
            {
              "question_code": "ROBOT_ESCORT",
              "question_text": "Robot Escort",
              "sort_order": 2
            }
          ]
        },
        {
          "section_code": "EFEM_ROBOT",
          "section_name": "EFEM Robot",
          "sort_order": 2,
          "questions": [
            {
              "question_code": "SR8241_TEACHING",
              "question_text": "SR8241 TEACHING",
              "sort_order": 1
            },
            {
              "question_code": "SR8240_TEACHING",
              "question_text": "SR8240 TEACHING",
              "sort_order": 2
            },
            {
              "question_code": "M124_TEACHING",
              "question_text": "M124 TEACHING",
              "sort_order": 3
            },
            {
              "question_code": "EFEM_FIXTURE",
              "question_text": "EFEM FIXTURE",
              "sort_order": 4
            },
            {
              "question_code": "EFEM_ROBOT_REP",
              "question_text": "EFEM Robot REP",
              "sort_order": 5
            },
            {
              "question_code": "EFEM_ROBOT_CONTROLLER_REP",
              "question_text": "EFEM Robot Controller REP",
              "sort_order": 6
            }
          ]
        },
        {
          "section_code": "TM_ROBOT",
          "section_name": "TM Robot",
          "sort_order": 3,
          "questions": [
            {
              "question_code": "SR8250_TEACHING",
              "question_text": "SR8250 TEACHING",
              "sort_order": 1
            },
            {
              "question_code": "SR8232_TEACHING",
              "question_text": "SR8232 TEACHING",
              "sort_order": 2
            },
            {
              "question_code": "TM_FIXTURE",
              "question_text": "TM FIXTURE",
              "sort_order": 3
            },
            {
              "question_code": "TM_ROBOT_REP",
              "question_text": "TM Robot REP",
              "sort_order": 4
            },
            {
              "question_code": "TM_ROBOT_CONTROLLER_REP",
              "question_text": "TM Robot Controller REP",
              "sort_order": 5
            },
            {
              "question_code": "PASSIVE_PAD_REP",
              "question_text": "Passive Pad REP",
              "sort_order": 6
            }
          ]
        },
        {
          "section_code": "BM_MODULE",
          "section_name": "BM Module",
          "sort_order": 4,
          "questions": [
            {
              "question_code": "PIN_CYLINDER",
              "question_text": "Pin Cylinder",
              "sort_order": 1
            },
            {
              "question_code": "PUSHER_CYLINDER",
              "question_text": "Pusher Cylinder",
              "sort_order": 2
            },
            {
              "question_code": "IB_FLOW",
              "question_text": "IB Flow",
              "sort_order": 3
            },
            {
              "question_code": "DRT",
              "question_text": "DRT",
              "sort_order": 4
            }
          ]
        },
        {
          "section_code": "FFU_EFEM_TM",
          "section_name": "FFU (EFEM, TM)",
          "sort_order": 5,
          "questions": [
            {
              "question_code": "FFU_CONTROLLER",
              "question_text": "FFU Controller",
              "sort_order": 1
            },
            {
              "question_code": "FAN",
              "question_text": "Fan",
              "sort_order": 2
            },
            {
              "question_code": "MOTOR_DRIVER",
              "question_text": "Motor Driver",
              "sort_order": 3
            }
          ]
        },
        {
          "section_code": "FCIP",
          "section_name": "FCIP",
          "sort_order": 6,
          "questions": [
            {
              "question_code": "R1",
              "question_text": "R1",
              "sort_order": 1
            },
            {
              "question_code": "R3",
              "question_text": "R3",
              "sort_order": 2
            },
            {
              "question_code": "R5",
              "question_text": "R5",
              "sort_order": 3
            },
            {
              "question_code": "R3_TO_R5",
              "question_text": "R3 To R5",
              "sort_order": 4
            },
            {
              "question_code": "PRISM",
              "question_text": "PRISM",
              "sort_order": 5
            }
          ]
        },
        {
          "section_code": "MICROWAVE",
          "section_name": "Microwave",
          "sort_order": 7,
          "questions": [
            {
              "question_code": "MICROWAVE",
              "question_text": "Microwave",
              "sort_order": 1
            },
            {
              "question_code": "APPLICATOR",
              "question_text": "Applicator",
              "sort_order": 2
            },
            {
              "question_code": "GENERATOR",
              "question_text": "Generator",
              "sort_order": 3
            }
          ]
        },
        {
          "section_code": "CHUCK",
          "section_name": "Chuck",
          "sort_order": 8,
          "questions": [
            {
              "question_code": "CHUCK",
              "question_text": "Chuck",
              "sort_order": 1
            }
          ]
        },
        {
          "section_code": "PROCESS_KIT",
          "section_name": "Process Kit",
          "sort_order": 9,
          "questions": [
            {
              "question_code": "PROCESS_KIT",
              "question_text": "Process Kit",
              "sort_order": 1
            }
          ]
        },
        {
          "section_code": "LEAK",
          "section_name": "Leak",
          "sort_order": 10,
          "questions": [
            {
              "question_code": "HELIUM_DETECTOR",
              "question_text": "Helium Detector",
              "sort_order": 1
            }
          ]
        },
        {
          "section_code": "PIN",
          "section_name": "Pin",
          "sort_order": 11,
          "questions": [
            {
              "question_code": "HOOK_LIFT_PIN",
              "question_text": "Hook Lift Pin",
              "sort_order": 1
            },
            {
              "question_code": "BELLOWS",
              "question_text": "Bellows",
              "sort_order": 2
            },
            {
              "question_code": "PIN_SENSOR",
              "question_text": "Pin Sensor",
              "sort_order": 3
            },
            {
              "question_code": "LM_GUIDE",
              "question_text": "LM Guide",
              "sort_order": 4
            },
            {
              "question_code": "PIN_MOTOR_CONTROLLER",
              "question_text": "Pin Motor Controller",
              "sort_order": 5
            }
          ]
        },
        {
          "section_code": "EPD",
          "section_name": "EPD",
          "sort_order": 12,
          "questions": [
            {
              "question_code": "SINGLE_EPD",
              "question_text": "Single EPD",
              "sort_order": 1
            },
            {
              "question_code": "DUAL_EPD",
              "question_text": "Dual EPD",
              "sort_order": 2
            }
          ]
        },
        {
          "section_code": "BOARD",
          "section_name": "Board",
          "sort_order": 13,
          "questions": [
            {
              "question_code": "GAS_BOX_BOARD",
              "question_text": "Gas Box Board",
              "sort_order": 1
            },
            {
              "question_code": "TEMP_CONTROLLER_BOARD",
              "question_text": "Temp Controller Board",
              "sort_order": 2
            },
            {
              "question_code": "POWER_DISTRIBUTION_BOARD",
              "question_text": "Power Distribution Board",
              "sort_order": 3
            },
            {
              "question_code": "DC_POWER_SUPPLY",
              "question_text": "DC Power Supply",
              "sort_order": 4
            },
            {
              "question_code": "BM_SENSOR",
              "question_text": "BM Sensor",
              "sort_order": 5
            },
            {
              "question_code": "PIO_SENSOR",
              "question_text": "PIO Sensor",
              "sort_order": 6
            },
            {
              "question_code": "SAFETY_MODULE",
              "question_text": "Safety Module",
              "sort_order": 7
            },
            {
              "question_code": "IO_BOX",
              "question_text": "IO BOX",
              "sort_order": 8
            },
            {
              "question_code": "FPS_BOARD",
              "question_text": "FPS BOARD",
              "sort_order": 9
            },
            {
              "question_code": "D_NET",
              "question_text": "D-NET",
              "sort_order": 10
            }
          ]
        },
        {
          "section_code": "IGS_BLOCK",
          "section_name": "IGS Block",
          "sort_order": 14,
          "questions": [
            {
              "question_code": "MFC",
              "question_text": "MFC",
              "sort_order": 1
            },
            {
              "question_code": "VALVE",
              "question_text": "Valve",
              "sort_order": 2
            }
          ]
        },
        {
          "section_code": "VALVE",
          "section_name": "Valve",
          "sort_order": 15,
          "questions": [
            {
              "question_code": "SOLENOID",
              "question_text": "Solenoid",
              "sort_order": 1
            },
            {
              "question_code": "FAST_VAC_VALVE",
              "question_text": "Fast Vac Valve",
              "sort_order": 2
            },
            {
              "question_code": "SLOW_VAC_VALVE",
              "question_text": "Slow Vac Valve",
              "sort_order": 3
            },
            {
              "question_code": "SLIT_DOOR",
              "question_text": "Slit Door",
              "sort_order": 4
            },
            {
              "question_code": "APC_VALVE",
              "question_text": "APC Valve",
              "sort_order": 5
            },
            {
              "question_code": "SHUTOFF_VALVE",
              "question_text": "Shutoff Valve",
              "sort_order": 6
            }
          ]
        },
        {
          "section_code": "ETC",
          "section_name": "ETC",
          "sort_order": 16,
          "questions": [
            {
              "question_code": "BARATRON_ASSY",
              "question_text": "Baratron Ass'y",
              "sort_order": 1
            },
            {
              "question_code": "PIRANI_ASSY",
              "question_text": "Pirani Ass'y",
              "sort_order": 2
            },
            {
              "question_code": "VIEW_PORT_QUARTZ",
              "question_text": "View Port Quartz",
              "sort_order": 3
            },
            {
              "question_code": "FLOW_SWITCH",
              "question_text": "Flow Switch",
              "sort_order": 4
            },
            {
              "question_code": "CERAMIC_PLATE",
              "question_text": "Ceramic Plate",
              "sort_order": 5
            },
            {
              "question_code": "MONITOR",
              "question_text": "Monitor",
              "sort_order": 6
            },
            {
              "question_code": "KEYBOARD",
              "question_text": "Keyboard",
              "sort_order": 7
            },
            {
              "question_code": "MOUSE",
              "question_text": "Mouse",
              "sort_order": 8
            },
            {
              "question_code": "HEATING_JACKET",
              "question_text": "Heating Jacket",
              "sort_order": 9
            },
            {
              "question_code": "WATER_LEAK_DETECTOR",
              "question_text": "Water Leak Detector",
              "sort_order": 10
            },
            {
              "question_code": "MANOMETER",
              "question_text": "Manometer",
              "sort_order": 11
            }
          ]
        },
        {
          "section_code": "CTR",
          "section_name": "CTR",
          "sort_order": 17,
          "questions": [
            {
              "question_code": "CTC",
              "question_text": "CTC",
              "sort_order": 1
            },
            {
              "question_code": "PMC",
              "question_text": "PMC",
              "sort_order": 2
            },
            {
              "question_code": "EDA",
              "question_text": "EDA",
              "sort_order": 3
            },
            {
              "question_code": "EFEM_CONTROLLER",
              "question_text": "EFEM",
              "sort_order": 4
            },
            {
              "question_code": "TEMP_LIMIT_CONTROLLER",
              "question_text": "Temp limit CTR",
              "sort_order": 5
            },
            {
              "question_code": "TEMP_CONTROLLER",
              "question_text": "Temp CTR",
              "sort_order": 6
            }
          ]
        },
        {
          "section_code": "S_W",
          "section_name": "S/W",
          "sort_order": 18,
          "questions": [
            {
              "question_code": "SW_PATCH",
              "question_text": "S/W Patch",
              "sort_order": 1
            }
          ]
        }
      ]
    },
    {
      "equipment_group_code": "SUPRA_XP",
      "checklist_kind": "SETUP",
      "template_name": "SUPRA XP Setup Checklist",
      "version_no": 1,
      "sections": [
        {
          "section_code": "INSTALLATION_PREPERATION",
          "section_name": "INSTALLATION PREPERATION",
          "sort_order": 1,
          "questions": [
            {
              "question_code": "INST_IMPORT_ORDER",
              "question_text": "설비반입 순서를 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "INST_PACKING_LIST",
              "question_text": "Packing List 확인하여 반입 Part 확인이 가능 한가?",
              "sort_order": 2
            },
            {
              "question_code": "INST_OHT_CHECK",
              "question_text": "고객사에서 그린 기준선과 OHT라인이 일치하는지 확인 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "INST_SPACING_CHECK",
              "question_text": "설비간 유격거리가 충분한지 확인 알고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "INST_DRAW_SETUP",
              "question_text": "Drawing Template을 기준선에 맞춰 배치 알고 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "INST_DRAW_MARKING",
              "question_text": "Drawing Template를 펼쳐 타공, H빔 및 Adjust 를 Marking 알고 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "INST_UTILITY_SPEC",
              "question_text": "타공별 Utility Spec을 숙지하고 있는가?",
              "sort_order": 7
            }
          ]
        },
        {
          "section_code": "FAB_IN",
          "section_name": "FAB IN",
          "sort_order": 2,
          "questions": [
            {
              "question_code": "FAB_UNPACK_WARN",
              "question_text": "Module Unpacking시 주의 사항에 대해 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "FAB_CLEAN_WARN",
              "question_text": "Module Clean시 주의 사항에 대해 숙지하고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "FAB_MOVE_WARN",
              "question_text": "Module 이동시 주의 사항에 대해 숙지하고 있는가?",
              "sort_order": 3
            }
          ]
        },
        {
          "section_code": "DOCKING",
          "section_name": "DOCKING",
          "sort_order": 3,
          "questions": [
            {
              "question_code": "DOCK_TOOL_SIZE",
              "question_text": "장비별 Tool size를 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "DOCK_LASER_JIG",
              "question_text": "Laser Jig 를 이용하여 OHT Line 과 설비를 정렬 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "DOCK_LIFT_CASTER",
              "question_text": "Lift를 활용하여 EFEM의 Caster 를 제거 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "DOCK_FRAME_HEIGHT",
              "question_text": "각 Module의 지면에서 frame의 높이를 알고 Spec에 맞춰 Docking 알고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "DOCK_MODULE",
              "question_text": "Module간 Docking 할 수 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "DOCK_REALIGN",
              "question_text": "Docking작업 중 설비와 OHT Line 정렬이 틀어졌을 경우 재정렬 알고 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "DOCK_LEVELER_POS",
              "question_text": "각 Moudule의 Leveler 정위치를 숙지하고 있는가?",
              "sort_order": 7
            },
            {
              "question_code": "DOCK_LEVEL_SPEC",
              "question_text": "각 Moudule의 Leveling Spec을 알고 Adjust를 이용, Leveling 알고 있는가?",
              "sort_order": 8
            },
            {
              "question_code": "DOCK_ACCESSORY",
              "question_text": "Accessory(Baratron, Pirani, EPD)를 정위치에 장착 알고 있는가?",
              "sort_order": 9
            },
            {
              "question_code": "DOCK_HOOK_UP",
              "question_text": "내부 Hook Up 알고 있는가?",
              "sort_order": 10
            }
          ]
        },
        {
          "section_code": "CABLE_HOOK_UP",
          "section_name": "CABLE HOOK UP",
          "sort_order": 4,
          "questions": [
            {
              "question_code": "CABLE_TRAY_CHECK",
              "question_text": "설비에서 Rack까지 Tray 확인 및 작업가능여부 판단알고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "CABLE_SORTING",
              "question_text": "Cable 각 Module별로 분류 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "CABLE_GRATING",
              "question_text": "Grating Open시 주의 사항을 숙지하고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "CABLE_LADDER_RULES",
              "question_text": "사다리 작업시 환경안전수칙을 숙지하고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "CABLE_INSTALL",
              "question_text": "설비에서 Rack까지 포설 알고 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "CABLE_CONNECTION",
              "question_text": "Cable을 설비에 정확히 연결 알고 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "CABLE_TRAY_ARRANGE",
              "question_text": "Cable을 Tray에 규격에 맞게 정리 알고 있는가?",
              "sort_order": 7
            },
            {
              "question_code": "CABLE_CUTTING",
              "question_text": "설비와 Rack간의 거리를 고려해 Cable 재단 알고 있는가?",
              "sort_order": 8
            },
            {
              "question_code": "CABLE_RACK_CONNECT",
              "question_text": "Cable을 Rack에 정확히 연결알고 있는가?",
              "sort_order": 9
            },
            {
              "question_code": "CABLE_PUMP_TRAY",
              "question_text": "Pump Cable의 종류를 알고 알맞은 Tray로 내려줄 수 있는가?",
              "sort_order": 10
            },
            {
              "question_code": "CABLE_PUMP_ARRANGE",
              "question_text": "Pump단에서 Cable 포설 및 정리 알고 있는가?",
              "sort_order": 11
            },
            {
              "question_code": "CABLE_MODULE_PUMP",
              "question_text": "Cable을 구분하여 모듈별로 Pump에 정확히 연결 알고 있는가?",
              "sort_order": 12
            }
          ]
        },
        {
          "section_code": "POWER_TURN_ON",
          "section_name": "POWER TURN ON",
          "sort_order": 5,
          "questions": [
            {
              "question_code": "POWER_GPS_UPS_SPS",
              "question_text": "GPS, UPS, SPS 의 역할과 원리에 대해 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "POWER_TURN_SEQ",
              "question_text": "Power turn on 순서를 숙지하고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "POWER_ALARM_TROUBLE",
              "question_text": "Power turn on 후 발생하는 Alram Troble Shooting 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "POWER_CB_UNDERSTAND",
              "question_text": "Rack의 CB 종류와 기능을 숙지하고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "POWER_SAFETY_MODULE",
              "question_text": "Safety Module의 위치와 기능을 숙지하고 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "POWER_EMO_CHECK",
              "question_text": "EMO 동작 Check 알고 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "POWER_SYCON_UNDERST",
              "question_text": "Sycon number 별 의미하는 Part를 숙지하고 있는가?",
              "sort_order": 7
            },
            {
              "question_code": "POWER_SYCON_TROUBLE",
              "question_text": "Sycon 실행시 통신되지않는 Part에 대해 Troble Shooting 알고 있는가?",
              "sort_order": 8
            }
          ]
        },
        {
          "section_code": "UTILITY_TURN_ON",
          "section_name": "UTILITY TURN ON",
          "sort_order": 6,
          "questions": [
            {
              "question_code": "UTIL_TURN_SEQ",
              "question_text": "Utility turn on 의 순서를 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "UTIL_VACUUM_TURN",
              "question_text": "Vacuum Turn on 및 Spec에 맞게 조정 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "UTIL_CDA_TURN",
              "question_text": "CDA Turn on 및 Spec에 맞게 조정 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "UTIL_PCW_TURN",
              "question_text": "PCW Turn on 및 Spec에 맞게 조정 알고 있는가?",
              "sort_order": 4
            }
          ]
        },
        {
          "section_code": "GAS_TURN_ON",
          "section_name": "GAS TURN ON",
          "sort_order": 7,
          "questions": [
            {
              "question_code": "GAS_TURN_SEQ",
              "question_text": "Gas turn on 의 순서를 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "GAS_O2_N2_CHECK",
              "question_text": "O2, N2 Gas Turn on 및 가스 유입유무를 확인 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "GAS_TOXIC_CHECK",
              "question_text": "Toxic Gas Turn on 및 가스 유입유무를 확인 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "GAS_MANOMETER_ADJUST",
              "question_text": "Manometer의 Low, High Limit 값 Spec에 맞게 조정 알고 있는가?",
              "sort_order": 4
            }
          ]
        },
        {
          "section_code": "TEACHING",
          "section_name": "TEACHING",
          "sort_order": 8,
          "questions": [
            {
              "question_code": "TEACH_ROBOT_CONTROL",
              "question_text": "EFEM Robot Pendant 조작 가능한가?",
              "sort_order": 1
            },
            {
              "question_code": "TEACH_ROBOT_LEVEL",
              "question_text": "EFEM Robot Leveling 알고 있는가?? (SANKYO)",
              "sort_order": 2
            },
            {
              "question_code": "TEACH_ARM_LEVEL",
              "question_text": "EFEM Robot Arm Leveling 알고 있는가?? (SANKYO)",
              "sort_order": 3
            },
            {
              "question_code": "TEACH_LOAD_PORT",
              "question_text": "EFEM Robot Load Port Teaching 가능한가? (SANKYO)",
              "sort_order": 4
            },
            {
              "question_code": "TEACH_LOADLOCK",
              "question_text": "EFEM Robot Loadlock Teaching 가능한가? (SANKYO)",
              "sort_order": 5
            },
            {
              "question_code": "TEACH_SIDE_STORAGE",
              "question_text": "EFEM Robot Side Storage Teaching 가능한가? (SANKYO)",
              "sort_order": 6
            },
            {
              "question_code": "TEACH_DATA_SAVE",
              "question_text": "EFEM Teaching Data 저장 가능한가 ?",
              "sort_order": 7
            },
            {
              "question_code": "TEACH_TM_CONTROL",
              "question_text": "TM Robot Pendant 조작 가능한가?",
              "sort_order": 8
            },
            {
              "question_code": "TEACH_TM_LOADLOCK",
              "question_text": "TM Robot Loadlock Teeaching 가능 한가 ? (PERSIMMON)",
              "sort_order": 9
            },
            {
              "question_code": "TEACH_TM_PM",
              "question_text": "TM Robot PM Teeaching 가능 한가 ? (PERSIMMON)",
              "sort_order": 10
            },
            {
              "question_code": "TEACH_TM_DATA_SAVE",
              "question_text": "TM Robot Teaching Data 저장 가능한가 ? (PERSIMMON)",
              "sort_order": 11
            },
            {
              "question_code": "TEACH_WAFER_JIG",
              "question_text": "Teachig Wafer Jig 사용 가능한가 ?",
              "sort_order": 12
            },
            {
              "question_code": "TEACH_FINE",
              "question_text": "미세 Teaching 가능한가 ?",
              "sort_order": 13
            },
            {
              "question_code": "TEACH_MARGIN",
              "question_text": "마진 Check 가능한가 ?",
              "sort_order": 14
            },
            {
              "question_code": "TEACH_SEMI_TRANSFER",
              "question_text": "Semi Auto Transfer 알고 있는가?",
              "sort_order": 15
            },
            {
              "question_code": "AGING_TEST",
              "question_text": "Aging Test 알고 있는가?",
              "sort_order": 16
            }
          ]
        },
        {
          "section_code": "PART_INSTALLATION",
          "section_name": "PART INSTALLATION",
          "sort_order": 9,
          "questions": [
            {
              "question_code": "PART_EXHAUST_PORT",
              "question_text": "Exhaust Port 설치 위치와 방법을 알고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "PART_EFF_SANKYO",
              "question_text": "EFEM Robot End-Effector 장착이 가능한가? (SANKYO)",
              "sort_order": 2
            },
            {
              "question_code": "PART_EFF_ADJUST",
              "question_text": "EFEM Robot End Effector Omm Adjust 가능 한가? (SANKYO)",
              "sort_order": 3
            },
            {
              "question_code": "PART_EFF_LEVEL",
              "question_text": "EFEM Robot End-Effector Level 조절이 가능한가?(SANKYO)",
              "sort_order": 4
            },
            {
              "question_code": "PART_TM_EFF",
              "question_text": "TM Robot End Effector 장착이 가능한가? (PERSIMMON)",
              "sort_order": 5
            },
            {
              "question_code": "PART_TM_ADJUST_380",
              "question_text": "TM Robot End Effector 좌우 380mm Adjust 가능 한가? (PERSIMMON)",
              "sort_order": 6
            },
            {
              "question_code": "PART_TM_ADJUST_16",
              "question_text": "TM Robot End Effector 상하 16mm Adjust 가능 한가? (PERSIMMON)",
              "sort_order": 7
            },
            {
              "question_code": "PART_TM_LEVEL",
              "question_text": "TM Robot End Effector Level 조절이 가능한가? (PERSIMMON)",
              "sort_order": 8
            },
            {
              "question_code": "PART_PROCESS_KIT",
              "question_text": "Process Kit 장착이 가능한가?",
              "sort_order": 9
            },
            {
              "question_code": "PART_PIO_CABLE",
              "question_text": "PIO Sensor, Cable 장착이 가능한가?",
              "sort_order": 10
            },
            {
              "question_code": "PART_RACK_SIGNAL",
              "question_text": "Rack Signal Tower 설치가 가능한가?",
              "sort_order": 11
            }
          ]
        },
        {
          "section_code": "LEAK_CHECK",
          "section_name": "LEAK CHECK",
          "sort_order": 10,
          "questions": [
            {
              "question_code": "LEAK_PUMP_TURN",
              "question_text": "PUMP Turn On 알고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "LEAK_PM_CHECK",
              "question_text": "PM Leak Check에 대해 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "LEAK_GAS_CHECK",
              "question_text": "Gas Line Leak Check에 대해 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "LEAK_TM_LL_CHECK",
              "question_text": "TM, LL Leak Check 에 대해 알고 있는가?",
              "sort_order": 4
            }
          ]
        },
        {
          "section_code": "TTTM",
          "section_name": "TTTM",
          "sort_order": 11,
          "questions": [
            {
              "question_code": "TTTM_ECID_MATCH",
              "question_text": "ECID Matching할 수 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "TTTM_PUMP_TIME",
              "question_text": "Load Lock Pumping/Purge Time 조절 가능한가?",
              "sort_order": 2
            },
            {
              "question_code": "TTTM_VENT_TIME",
              "question_text": "Puming / Venting Time 조절 가능한가?",
              "sort_order": 3
            },
            {
              "question_code": "TTTM_EPD_ADJUST",
              "question_text": "EPD Peak, Offset 조절 가능한가?",
              "sort_order": 4
            },
            {
              "question_code": "TTTM_TEMP_AUTOTUNE",
              "question_text": "Temp autotune 가능 한가?",
              "sort_order": 5
            },
            {
              "question_code": "TTTM_VALVE_CONTROL",
              "question_text": "Slot Valve Open,Close Time 조절 가능 한가?",
              "sort_order": 6
            },
            {
              "question_code": "TTTM_PENDULUM",
              "question_text": "Pendulum Autolearn 가능 한가?",
              "sort_order": 7
            },
            {
              "question_code": "TTTM_PIN_ADJUST",
              "question_text": "Pin speed, height Adjust 가능 한가?",
              "sort_order": 8
            },
            {
              "question_code": "TTTM_GAS_PRESSURE",
              "question_text": "Gas Supply Pressure Check 가능 한가?",
              "sort_order": 9
            },
            {
              "question_code": "TTTM_MFC_HUNT",
              "question_text": "MFC Normal 상태 Hunting 유/무 확인 가능 한가?",
              "sort_order": 10
            },
            {
              "question_code": "TTTM_GAS_LEAK",
              "question_text": "Gas Line Leak Check 가능 한가?",
              "sort_order": 11
            },
            {
              "question_code": "TTTM_DNET_CAL",
              "question_text": "Prism D-Net Cal 가능한가?",
              "sort_order": 12
            },
            {
              "question_code": "TTTM_SHEET",
              "question_text": "TTTM Sheet 작성 가능한가?",
              "sort_order": 13
            }
          ]
        },
        {
          "section_code": "CUSTOMER_CERTIFICATION",
          "section_name": "CUSTOMER CERTIFICATION",
          "sort_order": 12,
          "questions": [
            {
              "question_code": "CUST_OHT_CERT",
              "question_text": "OHT 인증에 대해 알고 대응 할 수 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "CUST_I_MARKING",
              "question_text": "중간인증 전 I-Marking 위치 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "CUST_GND_LABEL",
              "question_text": "GND 저항값, 각 gas 및 PCW 라인에 대해 라벨링 가능한가?",
              "sort_order": 3
            },
            {
              "question_code": "CUST_CSF_SEAL",
              "question_text": "CSF(Rack단) 실리콘 마감 가능한가?",
              "sort_order": 4
            },
            {
              "question_code": "CUST_CERT_RESPONSE",
              "question_text": "중간인증에 대해 알고 대응 할 수 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "CUST_ENV_QUAL",
              "question_text": "환경Qual에 대해 알고 대응 할 수 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "CUST_OHT_LAYOUT",
              "question_text": "OHT Lay Out 인증에 대해 알고 대응 할 수 있는가?",
              "sort_order": 7
            }
          ]
        },
        {
          "section_code": "PROCESS_CONFIRM",
          "section_name": "PROCESS CONFIRM",
          "sort_order": 13,
          "questions": [
            {
              "question_code": "PROCESS_AGING",
              "question_text": "Aging Test 알고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "PROCESS_AR_TEST",
              "question_text": "AR Test 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "PROCESS_SCRATCH",
              "question_text": "Scratch Test 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "PROCESS_PARTICLE",
              "question_text": "Paticle Check 알고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "PROCESS_EES_MATCH",
              "question_text": "EES Tool Matching 알고 있는가?",
              "sort_order": 5
            }
          ]
        }
      ]
    },
    {
      "equipment_group_code": "SUPRA_XP",
      "checklist_kind": "MAINT",
      "template_name": "SUPRA XP Maintenance Checklist",
      "version_no": 1,
      "sections": [
        {
          "section_code": "ESCORT",
          "section_name": "Escort",
          "sort_order": 1,
          "questions": [
            {
              "question_code": "LP_ESCORT",
              "question_text": "LP Escort",
              "sort_order": 1
            },
            {
              "question_code": "ROBOT_ESCORT",
              "question_text": "Robot Escort",
              "sort_order": 2
            }
          ]
        },
        {
          "section_code": "EFEM_ROBOT",
          "section_name": "EFEM Robot",
          "sort_order": 2,
          "questions": [
            {
              "question_code": "SR8241_TEACHING",
              "question_text": "SR8241 Teaching",
              "sort_order": 1
            },
            {
              "question_code": "ROBOT_REP",
              "question_text": "Robot REP",
              "sort_order": 2
            },
            {
              "question_code": "ROBOT_CONTROLLER_REP",
              "question_text": "Robot Controller REP",
              "sort_order": 3
            },
            {
              "question_code": "END_EFFECTOR_REP",
              "question_text": "End Effector REP",
              "sort_order": 4
            }
          ]
        },
        {
          "section_code": "TM_ROBOT",
          "section_name": "TM Robot",
          "sort_order": 3,
          "questions": [
            {
              "question_code": "PERSIMMON_TEACHING",
              "question_text": "PERSIMMON Teaching",
              "sort_order": 1
            },
            {
              "question_code": "END_EFFECTOR_PAD_REP",
              "question_text": "End Effector/Pad REP",
              "sort_order": 2
            }
          ]
        },
        {
          "section_code": "L_L",
          "section_name": "L/L",
          "sort_order": 4,
          "questions": [
            {
              "question_code": "L_L_PIN",
              "question_text": "L/L Pin",
              "sort_order": 1
            },
            {
              "question_code": "L_L_SENSOR",
              "question_text": "L/L Sensor",
              "sort_order": 2
            },
            {
              "question_code": "L_L_DSA",
              "question_text": "L/L DSA",
              "sort_order": 3
            },
            {
              "question_code": "GAS_LINE",
              "question_text": "Gas Line",
              "sort_order": 4
            },
            {
              "question_code": "L_L_ISOLATION_VV",
              "question_text": "L/L Isolation V/V",
              "sort_order": 5
            }
          ]
        },
        {
          "section_code": "EFEM_FFU",
          "section_name": "EFEM FFU",
          "sort_order": 5,
          "questions": [
            {
              "question_code": "FFU_CONTROLLER",
              "question_text": "FFU Controller",
              "sort_order": 1
            },
            {
              "question_code": "FAN",
              "question_text": "Fan",
              "sort_order": 2
            },
            {
              "question_code": "MOTOR_DRIVER",
              "question_text": "Motor Driver",
              "sort_order": 3
            }
          ]
        },
        {
          "section_code": "SOURCE",
          "section_name": "SOURCE",
          "sort_order": 6,
          "questions": [
            {
              "question_code": "MATCHER",
              "question_text": "Matcher",
              "sort_order": 1
            },
            {
              "question_code": "3000QC",
              "question_text": "3000QC",
              "sort_order": 2
            },
            {
              "question_code": "3100QC",
              "question_text": "3100QC",
              "sort_order": 3
            }
          ]
        },
        {
          "section_code": "CHUCK",
          "section_name": "Chuck",
          "sort_order": 7,
          "questions": [
            {
              "question_code": "CHUCK",
              "question_text": "Chuck",
              "sort_order": 1
            }
          ]
        },
        {
          "section_code": "PREVENTIVE_MAINTENANCE",
          "section_name": "Preventive Maintenance",
          "sort_order": 8,
          "questions": [
            {
              "question_code": "PROCESS_KIT",
              "question_text": "Process Kit",
              "sort_order": 1
            },
            {
              "question_code": "SLOT_VALVE_BLADE",
              "question_text": "Slot Valve Blade",
              "sort_order": 2
            },
            {
              "question_code": "TEFLON_ALIGN_PIN",
              "question_text": "Teflon Align Pin",
              "sort_order": 3
            },
            {
              "question_code": "O_RING",
              "question_text": "O-ring 류",
              "sort_order": 4
            }
          ]
        },
        {
          "section_code": "LEAK",
          "section_name": "Leak",
          "sort_order": 9,
          "questions": [
            {
              "question_code": "HELIUM_DETECTOR",
              "question_text": "Helium Detector",
              "sort_order": 1
            }
          ]
        },
        {
          "section_code": "PIN",
          "section_name": "Pin",
          "sort_order": 10,
          "questions": [
            {
              "question_code": "HOOK_LIFT_PIN",
              "question_text": "Hook Lift Pin",
              "sort_order": 1
            },
            {
              "question_code": "BELLOWS",
              "question_text": "Bellows",
              "sort_order": 2
            },
            {
              "question_code": "PIN_BOARD",
              "question_text": "Pin Board",
              "sort_order": 3
            },
            {
              "question_code": "LM_GUIDE",
              "question_text": "LM Guide",
              "sort_order": 4
            },
            {
              "question_code": "PIN_MOTOR_CONTROLLER",
              "question_text": "Pin Motor Controller",
              "sort_order": 5
            },
            {
              "question_code": "LASER_PIN_SENSOR",
              "question_text": "Laser Pin Sensor",
              "sort_order": 6
            }
          ]
        },
        {
          "section_code": "EPD",
          "section_name": "EPD",
          "sort_order": 11,
          "questions": [
            {
              "question_code": "DUAL",
              "question_text": "Dual",
              "sort_order": 1
            }
          ]
        },
        {
          "section_code": "BOARD",
          "section_name": "Board",
          "sort_order": 12,
          "questions": [
            {
              "question_code": "DC_POWER_SUPPLY",
              "question_text": "DC Power Supply",
              "sort_order": 1
            },
            {
              "question_code": "PIO_SENSOR",
              "question_text": "PIO Sensor",
              "sort_order": 2
            },
            {
              "question_code": "D_NET",
              "question_text": "D-NET",
              "sort_order": 3
            },
            {
              "question_code": "SIM_BOARD",
              "question_text": "SIM Board",
              "sort_order": 4
            }
          ]
        },
        {
          "section_code": "IGS_BLOCK",
          "section_name": "IGS Block",
          "sort_order": 13,
          "questions": [
            {
              "question_code": "MFC",
              "question_text": "MFC",
              "sort_order": 1
            },
            {
              "question_code": "VALVE",
              "question_text": "Valve",
              "sort_order": 2
            }
          ]
        },
        {
          "section_code": "VALVE",
          "section_name": "Valve",
          "sort_order": 14,
          "questions": [
            {
              "question_code": "SOLENOID",
              "question_text": "Solenoid",
              "sort_order": 1
            },
            {
              "question_code": "PENDULUM_VALVE",
              "question_text": "Pendulum Valve",
              "sort_order": 2
            },
            {
              "question_code": "SLOT_VALVE_DOOR_VALVE",
              "question_text": "Slot Valve / Door Valve",
              "sort_order": 3
            },
            {
              "question_code": "SHUTOFF_VALVE",
              "question_text": "Shutoff Valve",
              "sort_order": 4
            }
          ]
        },
        {
          "section_code": "RACK",
          "section_name": "Rack",
          "sort_order": 15,
          "questions": [
            {
              "question_code": "RF_GENERATOR",
              "question_text": "RF Generator",
              "sort_order": 1
            }
          ]
        },
        {
          "section_code": "ETC",
          "section_name": "ETC",
          "sort_order": 16,
          "questions": [
            {
              "question_code": "BARATRON_ASSY",
              "question_text": "Baratron Ass'y",
              "sort_order": 1
            },
            {
              "question_code": "PIRANI_ASSY",
              "question_text": "Pirani Ass'y",
              "sort_order": 2
            },
            {
              "question_code": "VIEW_PORT_QUARTZ",
              "question_text": "View Port Quartz",
              "sort_order": 3
            },
            {
              "question_code": "FLOW_SWITCH",
              "question_text": "Flow Switch",
              "sort_order": 4
            },
            {
              "question_code": "CERAMIC_PLATE",
              "question_text": "Ceramic Plate",
              "sort_order": 5
            },
            {
              "question_code": "MONITOR",
              "question_text": "Monitor",
              "sort_order": 6
            },
            {
              "question_code": "KEYBOARD",
              "question_text": "Keyboard",
              "sort_order": 7
            },
            {
              "question_code": "SIDE_STORAGE",
              "question_text": "Side Storage",
              "sort_order": 8
            },
            {
              "question_code": "MULTI_PORT_32",
              "question_text": "32 Multi Port",
              "sort_order": 9
            },
            {
              "question_code": "MINI8",
              "question_text": "MINI8",
              "sort_order": 10
            },
            {
              "question_code": "TM_EPC_MFC",
              "question_text": "TM EPC (MFC)",
              "sort_order": 11
            }
          ]
        },
        {
          "section_code": "CTR",
          "section_name": "CTR",
          "sort_order": 17,
          "questions": [
            {
              "question_code": "CTC",
              "question_text": "CTC",
              "sort_order": 1
            },
            {
              "question_code": "EFEM_CONTROLLER",
              "question_text": "EFEM CONTROLLER",
              "sort_order": 2
            }
          ]
        },
        {
          "section_code": "S_W",
          "section_name": "S/W",
          "sort_order": 18,
          "questions": [
            {
              "question_code": "SW_PATCH",
              "question_text": "S/W Patch",
              "sort_order": 1
            }
          ]
        }
      ]
    },
    {
      "equipment_group_code": "INTEGER",
      "checklist_kind": "SETUP",
      "template_name": "INTEGER Setup Checklist",
      "version_no": 1,
      "sections": [
        {
          "section_code": "INSTALLATION_PREPERATION",
          "section_name": "INSTALLATION PREPERATION",
          "sort_order": 1,
          "questions": [
            {
              "question_code": "CUSTOMER_OHT_LINE_CHECK",
              "question_text": "고객사에서 그린 기준선과 OHT라인이 일치하는지 확인 알고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "EQUIPMENT_CLEARANCE_CHECK",
              "question_text": "설비간 유격거리가 충분한지 확인 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "DRAWING_TEMPLATE_SETUP",
              "question_text": "Drawing Template을 기준선에 맞춰 배치 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "DRAWING_TEMPLATE_MARKING",
              "question_text": "Drawing Template를 펼쳐 타공, H빔 및 Adjust 를 Marking 알고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "UTILITY_SPEC_UNDERSTANDING",
              "question_text": "타공별 Utility Spec을 기입 해야 하는지 알고 있는가?",
              "sort_order": 5
            }
          ]
        },
        {
          "section_code": "FAB_IN",
          "section_name": "FAB IN",
          "sort_order": 2,
          "questions": [
            {
              "question_code": "EQUIPMENT_IMPORT_ORDER",
              "question_text": "설비반입 순서를 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "IMPORT_COMPANY_CAUTION",
              "question_text": "반입 업체에게 주의점을 설명할 수 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "IMPORT_INSPECTION_POINTS",
              "question_text": "설비반입 시 확인해야하는 부분을 숙지하고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "PROHIBITED_ITEMS_IMPORT",
              "question_text": "설비반입 금지 물품에 대해 알고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "GRATING_OPENING_CHECK",
              "question_text": "Grating 개구부 마감 처리 확인에 대해 알고 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "PACKING_LIST_VERIFICATION",
              "question_text": "Packing List 확인하여 반입 Part 확인이 가능 한가?",
              "sort_order": 6
            }
          ]
        },
        {
          "section_code": "DOCKING",
          "section_name": "DOCKING",
          "sort_order": 3,
          "questions": [
            {
              "question_code": "TOOL_SIZE_UNDERSTANDING",
              "question_text": "장비별 Tool size를 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "LASER_JIG_ALIGNMENT",
              "question_text": "Laser Jig 를 이용하여 OHT Line 과 설비를 정렬 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "LIFT_CASTER_REMOVAL",
              "question_text": "Lift를 활용하여 EFEM의 Caster 를 제거 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "MODULE_HEIGHT_DOCKING",
              "question_text": "각 Module의 지면에서 frame의 높이를 알고 Spec에 맞춰 Docking 알고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "MODULE_DOCKING",
              "question_text": "Module간 Docking 할 수 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "DOCKING_REALIGNMENT",
              "question_text": "Docking작업 중 설비와 OHT Line 정렬이 틀어졌을 경우 재정렬 알고 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "LEVELER_POSITION_UNDERSTANDING",
              "question_text": "각 Moudule의 Leveler 정위치를 숙지하고 있는가?",
              "sort_order": 7
            },
            {
              "question_code": "MODULE_LEVELING",
              "question_text": "각 Moudule의 Leveling Spec을 알고 Adjust를 이용, Leveling 알고 있는가?",
              "sort_order": 8
            },
            {
              "question_code": "DOCKING_PIN_POSITION",
              "question_text": "Docking Pin 정위치 판단할 수 있는가?",
              "sort_order": 9
            },
            {
              "question_code": "HOOK_UP",
              "question_text": "내부 Hook Up 알고 있는가?",
              "sort_order": 10
            }
          ]
        },
        {
          "section_code": "CABLE_HOOK_UP",
          "section_name": "CABLE HOOK UP",
          "sort_order": 4,
          "questions": [
            {
              "question_code": "TRAY_CHECK",
              "question_text": "설비에서 Rack까지 Tray 확인 및 작업가능여부 판단알고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "CABLE_SORTING",
              "question_text": "Cable 각 Module별로 분류 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "GRATING_OPEN_CAUTION",
              "question_text": "Grating Open시 주의 사항을 숙지하고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "LADDER_SAFETY_RULES",
              "question_text": "사다리 작업시 환경안전수칙을 숙지하고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "CABLE_INSTALLATION",
              "question_text": "설비에서 Rack까지 포설 알고 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "CABLE_CONNECTION",
              "question_text": "Cable을 설비에 정확히 연결 알고 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "CABLE_TRAY_ARRANGEMENT",
              "question_text": "Cable을 Tray에 규격에 맞게 정리 알고 있는가?",
              "sort_order": 7
            },
            {
              "question_code": "CABLE_CUTTING",
              "question_text": "설비와 Rack간의 거리를 고려해 Cable 재단 알고 있는가?",
              "sort_order": 8
            },
            {
              "question_code": "CABLE_RACK_CONNECTION",
              "question_text": "Cable을 Rack에 정확히 연결알고 있는가?",
              "sort_order": 9
            },
            {
              "question_code": "PUMP_CABLE_TRAY",
              "question_text": "Pump Cable의 종류를 알고 알맞은 Tray로 내려줄 수 있는가?",
              "sort_order": 10
            },
            {
              "question_code": "PUMP_CABLE_ARRANGEMENT",
              "question_text": "Pump단에서 Cable 포설 및 정리 알고 있는가?",
              "sort_order": 11
            },
            {
              "question_code": "CABLE_PM_PUMP_CONNECTION",
              "question_text": "Cable을 구분하여 PM별로 Pump에 정확히 연결 알고 있는가?",
              "sort_order": 12
            }
          ]
        },
        {
          "section_code": "POWER_TURN_ON",
          "section_name": "POWER TURN ON",
          "sort_order": 5,
          "questions": [
            {
              "question_code": "GPS_UPS_SPS_UNDERSTANDING",
              "question_text": "GPS, UPS, SPS 의 역할과 원리에 대해 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "POWER_TURN_ON_SEQUENCE",
              "question_text": "Power turn on 순서를 숙지하고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "RACK_ELCB_MCB_UNDERSTANDING",
              "question_text": "Rack의 ELCB, MCB 종류와 기능을 숙지하고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "SAFETY_MODULE_UNDERSTANDING",
              "question_text": "Safety Module의 위치와 기능을 숙지하고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "EMO_CHECK",
              "question_text": "EMO 동작 Check 알고 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "MODULE_MCB_TURN_ON",
              "question_text": "Module별 MCB 위치를 알고 Turn on 알고 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "SYCON_NUMBER_UNDERSTANDING",
              "question_text": "Sycon number 별 의미하는 Part를 숙지하고 있는가?",
              "sort_order": 7
            },
            {
              "question_code": "SYCON_TROUBLESHOOTING",
              "question_text": "Sycon 실행시 통신되지않는 Part에 대해 Troble Shooting 알고 있는가?",
              "sort_order": 8
            },
            {
              "question_code": "POWER_TURN_ON_ALARM_TROUBLESHOOTING",
              "question_text": "Power turn on 후 발생하는 Alram Troble Shooting 알고 있는가?",
              "sort_order": 9
            },
            {
              "question_code": "CHECKLIST_COMPLETION",
              "question_text": "구동 Checklist 작성 가능한가?",
              "sort_order": 10
            },
            {
              "question_code": "IP_ADDRESS_CHANGE",
              "question_text": "ip 주소 변경 방법에 대해 알고 있는가?",
              "sort_order": 11
            }
          ]
        },
        {
          "section_code": "UTILITY_TURN_ON",
          "section_name": "UTILITY TURN ON",
          "sort_order": 6,
          "questions": [
            {
              "question_code": "UTILITY_TURN_ON_PRECHECK",
              "question_text": "Utility Turn on 전 확인사항을 알고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "SETUP_INI_MODIFICATION",
              "question_text": "SetUp.ini 파일 수정 하는 방법에 대해 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "UTILITY_TURN_ON_SEQUENCE",
              "question_text": "Utility Turn on 의 순서를 숙지하고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "VACUUM_TURN_ON",
              "question_text": "Vacuum Turn on 및 Spec에 맞게 조정 알고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "CDA_TURN_ON",
              "question_text": "CDA Turn on 및 Spec에 맞게 조정 알고 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "PCW_TURN_ON",
              "question_text": "PCW Turn on 및 Spec에 맞게 조정 알고 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "SOLANOID_VALVE_LOCATION",
              "question_text": "Solanoid Valve 위치를 전부 숙지하고 있는가?",
              "sort_order": 7
            },
            {
              "question_code": "RELIEF_VALVE_LOCATION",
              "question_text": "Relief Valve 위치를 전부 숙지하고 있는가?",
              "sort_order": 8
            },
            {
              "question_code": "MANUAL_VALVE_LOCATION",
              "question_text": "Manual Valve 위치를 전부 숙지하고 있는가?",
              "sort_order": 9
            },
            {
              "question_code": "PUMP_TURN_ON",
              "question_text": "PUMP Turn On 알고 있는가?",
              "sort_order": 10
            },
            {
              "question_code": "PURGE_N2_TURN_ON",
              "question_text": "Purge N2, N2 Turn on 및 Spec에 맞게 조정 알고 있는가?",
              "sort_order": 11
            },
            {
              "question_code": "DILLUTION_SIGNAL_CHECK",
              "question_text": "Dillution Signal Check 방법을 알고 있는가?",
              "sort_order": 12
            },
            {
              "question_code": "CHILLER_HEAT_EXCHANGER_TURN_ON",
              "question_text": "Chiller 및 Heat Exchanger Turn On 알고 있는가?",
              "sort_order": 13
            },
            {
              "question_code": "CHILLER_HEAT_EXCHANGER_CHECK",
              "question_text": "Chiller 및 Heat Exchanger Turn on 이후 확인사항을 알고 있는가?",
              "sort_order": 14
            },
            {
              "question_code": "MANOMETER_LIMIT_ADJUST",
              "question_text": "Manometer의 Low, High Limit 값 Spec에 맞게 조정 알고 있는가?",
              "sort_order": 15
            }
          ]
        },
        {
          "section_code": "GAS_TURN_ON",
          "section_name": "GAS TURN ON",
          "sort_order": 7,
          "questions": [
            {
              "question_code": "GAS_TURN_ON_PRECHECK",
              "question_text": "Gas Turn on 전 확인사항 알고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "NF3_LINE_LEAK_CHECK",
              "question_text": "NF3 Line Leak Check 하는 방법 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "H2_LINE_LEAK_CHECK",
              "question_text": "H2 Line Leak Check 하는 방법 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "NF3_TURN_ON",
              "question_text": "NF3 Turn on 하는 방법 알고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "H2_TURN_ON",
              "question_text": "H2 Turn on 하는 방법 알고 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "GAS_TURN_ON_CHECK",
              "question_text": "Turn on 이후 확인사항에 대해 알고 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "GAS_TURN_ON_CAUTION",
              "question_text": "Gas Turn on 시 주의사항 알고 있는가?",
              "sort_order": 7
            },
            {
              "question_code": "PM_DILLUTION_TEST",
              "question_text": "PM Dillution Test 하는 방법 알고 있는가?",
              "sort_order": 8
            },
            {
              "question_code": "GAS_TURN_ON_CONFIRM",
              "question_text": "Gas Turn on 및 가스 유입유무를 확인 알고 있는가?",
              "sort_order": 9
            }
          ]
        },
        {
          "section_code": "TEACHING",
          "section_name": "TEACHING",
          "sort_order": 8,
          "questions": [
            {
              "question_code": "EFEM_ROBOT_PENDANT_CONTROL",
              "question_text": "EFEM Robot Pendant 조작 가능한가?",
              "sort_order": 1
            },
            {
              "question_code": "EFEM_ROBOT_XYZ_VALUES",
              "question_text": "EFEM X,Y,Z,TH 값을 알고 있는가? (SANKYO)",
              "sort_order": 2
            },
            {
              "question_code": "EFEM_ROBOT_PARAMETER_EDIT",
              "question_text": "EFEM Robot Parameter 수정 가능한가? (SANKYO)",
              "sort_order": 3
            },
            {
              "question_code": "EFEM_TEACHING_DATA_SAVE",
              "question_text": "EFEM Teaching Data 저장 가능한가? (SANKYO)",
              "sort_order": 4
            },
            {
              "question_code": "TM_ROBOT_PENDANT_CONTROL",
              "question_text": "TM Robot Pendant 조작 가능한가? (JEL)",
              "sort_order": 5
            },
            {
              "question_code": "TM_ROBOT_LEVELING",
              "question_text": "TM Robot Leveling 가능 한가? (JEL)",
              "sort_order": 6
            },
            {
              "question_code": "TM_ROBOT_XYZ_VALUES",
              "question_text": "TM Robot A,B arm X,Y,Z,TH 값을 알고 있는가? (JEL)",
              "sort_order": 7
            },
            {
              "question_code": "TM_ROBOT_PM_TEACHING",
              "question_text": "TM Robot PM Teaching 가능 한가? (JEL)",
              "sort_order": 8
            },
            {
              "question_code": "TM_ROBOT_AM_TEACHING",
              "question_text": "TM Robot AM Teaching 가능 한가? (JEL)",
              "sort_order": 9
            },
            {
              "question_code": "TM_TEACHING_DATA_SAVE",
              "question_text": "TM Robot Teaching Data 저장 가능한가? (JEL)",
              "sort_order": 10
            },
            {
              "question_code": "WAFER_JIG_USE",
              "question_text": "Teaching Wafer Jig 사용 가능한가?",
              "sort_order": 11
            },
            {
              "question_code": "LASER_JIG_USE",
              "question_text": "Laser Teaching Jig 사용 가능한가?",
              "sort_order": 12
            },
            {
              "question_code": "MARGIN_CHECK",
              "question_text": "마진 Check 가능한가?",
              "sort_order": 13
            },
            {
              "question_code": "SEMI_AUTO_TRANSFER",
              "question_text": "Semi Auto Transfer 알고 있는가?",
              "sort_order": 14
            },
            {
              "question_code": "AGING_TEST",
              "question_text": "Aging Test 알고 있는가?",
              "sort_order": 15
            }
          ]
        },
        {
          "section_code": "PART_INSTALLATION",
          "section_name": "PART INSTALLATION",
          "sort_order": 9,
          "questions": [
            {
              "question_code": "CERAMIC_PLATE_PIN_INSTALLATION",
              "question_text": "Ceramic Plate, Guide Ring, Pin 장착 방법 알고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "PIN_HEIGHT_ADJUST",
              "question_text": "Pin 장착 및 Pin 높이 조절에 대해 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "PIO_SENSOR_INSTALLATION",
              "question_text": "PIO Sensor 장착 방법 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "VIEW_PORT_COVER_INSTALLATION",
              "question_text": "View Port Cover 장착 방법 알고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "LOAD_LOCK_LEVELING",
              "question_text": "Load Lock Leveling 방법 알고 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "TM_ROBOT_PICK_INSTALLATION",
              "question_text": "TM Robot Pick 장착 방법 알고 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "TM_ROBOT_PICK_LEVELING",
              "question_text": "TM Robot Pick Leveling 방법 알고 있는가?",
              "sort_order": 7
            },
            {
              "question_code": "GAS_BOX_WINDOW_INSTALLATION",
              "question_text": "Gas Box Window 장착 가능한가?",
              "sort_order": 8
            },
            {
              "question_code": "GAS_BOX_DAMPER_INSTALLATION",
              "question_text": "Gas Box Damper 장착 가능한가?",
              "sort_order": 9
            }
          ]
        },
        {
          "section_code": "LEAK_CHECK",
          "section_name": "LEAK CHECK",
          "sort_order": 10,
          "questions": [
            {
              "question_code": "LINE_MANUAL_LEAK_CHECK",
              "question_text": "Line Manual Leak Check 방법 알고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "MANUAL_LEAK_CHECK_HISTORY",
              "question_text": "Manual Leak Check History를 확인 할 수 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "HE_DETECTOR_USE",
              "question_text": "He Detector 사용 방법 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "HE_BOTTLE_ORDER",
              "question_text": "He Bottle 쏘는 위치와 순서 알고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "HE_DETECTOR_HOUSING_LEAK_CHECK",
              "question_text": "He Detector 반응을 보고 Housing Leak와 구별할 수 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "SLOT_VALVE_HE_LEAK_CHECK",
              "question_text": "Slot Valve He Leak Check 방법 알고 있는가?",
              "sort_order": 6
            }
          ]
        },
        {
          "section_code": "TTTM",
          "section_name": "TTTM",
          "sort_order": 11,
          "questions": [
            {
              "question_code": "VAC_CDA_SPEC_ADJUST",
              "question_text": "Vac, CDA Spec에 맞게 조절 가능한가?",
              "sort_order": 1
            },
            {
              "question_code": "TEMP_PROFILE",
              "question_text": "Temp Profile 가능한가?",
              "sort_order": 2
            },
            {
              "question_code": "PUMP_VENT_TIME_ADJUST",
              "question_text": "Pumping / Venting Time 조절 가능한가?",
              "sort_order": 3
            },
            {
              "question_code": "EPD_PEAK_OFFSET_ADJUST",
              "question_text": "EPD Peak, Offset 조절 가능한가?",
              "sort_order": 4
            },
            {
              "question_code": "PM_BAFFLE_TEMP_AUTOTUNE",
              "question_text": "PM Baffle Temp autotune 가능 한가?",
              "sort_order": 5
            },
            {
              "question_code": "DOOR_VALVE_CONTROL",
              "question_text": "Door Valve Open,Close Time 조절 가능 한가?",
              "sort_order": 6
            },
            {
              "question_code": "APC_AUTOLEARN",
              "question_text": "APC Autolearn 가능 한가?",
              "sort_order": 7
            },
            {
              "question_code": "PIN_HEIGHT_ADJUST_B",
              "question_text": "Pin height Adjust 가능 한가?",
              "sort_order": 8
            },
            {
              "question_code": "GAS_SUPPLY_PRESSURE_CHECK",
              "question_text": "Gas Supply Pressure Check 가능 한가?",
              "sort_order": 9
            },
            {
              "question_code": "GAS_EXHAUST_MONAMETER_CONTROL",
              "question_text": "Gas Exhaust Monameter 조작 가능한가?",
              "sort_order": 10
            },
            {
              "question_code": "MFC_HUNTING_CHECK",
              "question_text": "MFC Normal 상태 Hunting 유/무 확인 가능 한가?",
              "sort_order": 11
            },
            {
              "question_code": "LP_FLOW_CONTROL",
              "question_text": "LP 유량 조절 가능한가?",
              "sort_order": 12
            },
            {
              "question_code": "AICP_POWER_CAL",
              "question_text": "AICP Power Cal 가능한가?",
              "sort_order": 13
            },
            {
              "question_code": "PRODUCT_REPORT_COMPLETION",
              "question_text": "Product Report 작성 가능한가?",
              "sort_order": 14
            },
            {
              "question_code": "TTTM_SHEET_COMPLETION",
              "question_text": "TTTM Sheet 작성 가능한가?",
              "sort_order": 15
            }
          ]
        },
        {
          "section_code": "CUSTOMER_CERTIFICATION",
          "section_name": "CUSTOMER CERTIFICATION",
          "sort_order": 12,
          "questions": [
            {
              "question_code": "LP_CERTIFICATION",
              "question_text": "LP 인증 가능한가?",
              "sort_order": 1
            },
            {
              "question_code": "FULL_PUMPING",
              "question_text": "Full Pumping을 걸 수 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "MID_OPERATION_CERTIFICATION_PREP",
              "question_text": "중간가동인증 준비 사항 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "LABEL_PLACEMENT",
              "question_text": "Lavel 붙여야 하는 곳이 어디인지 알고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "I_MARKING_PROCEDURE",
              "question_text": "I-Marking 방법에 대해 알고 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "I_MARKING_LOCATION",
              "question_text": "I-Marking 하는 곳이 어디인지 알고 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "GAS_BOX_BOARD_LEVELING",
              "question_text": "도면을 보고 Gas Box Board Leveling을 할 수 있는가?",
              "sort_order": 7
            },
            {
              "question_code": "ENVIRONMENTAL_QUAL_TEST",
              "question_text": "환경 Qual Test 가능한가?",
              "sort_order": 8
            },
            {
              "question_code": "OHT_AUTO_TRANSFER_CERTIFICATION",
              "question_text": "OHT 자동반송 인증 Test 가능한가?",
              "sort_order": 9
            }
          ]
        },
        {
          "section_code": "PROCESS_CONFIRM",
          "section_name": "PROCESS CONFIRM",
          "sort_order": 13,
          "questions": [
            {
              "question_code": "PARTICLE_TEST",
              "question_text": "Particle Test 가능한가?",
              "sort_order": 1
            },
            {
              "question_code": "EA_TEST",
              "question_text": "E/A Test 가능한가?",
              "sort_order": 2
            }
          ]
        }
      ]
    },
    {
      "equipment_group_code": "INTEGER",
      "checklist_kind": "MAINT",
      "template_name": "INTEGER Maintenance Checklist",
      "version_no": 1,
      "sections": [
        {
          "section_code": "SWAP_KIT",
          "section_name": "Swap Kit",
          "sort_order": 1,
          "questions": [
            {
              "question_code": "SWAP_KIT",
              "question_text": "SWAP KIT",
              "sort_order": 1
            },
            {
              "question_code": "GAS_LINE_&_GAS_FILTER",
              "question_text": "GAS LINE & GAS FILTER",
              "sort_order": 2
            },
            {
              "question_code": "TOP_FEED_THROUGH",
              "question_text": "TOP FEED THROUGH",
              "sort_order": 3
            },
            {
              "question_code": "GAS_FEED_THROUGH",
              "question_text": "GAS FEED THROUGH",
              "sort_order": 4
            },
            {
              "question_code": "CERAMIC_PARTS",
              "question_text": "CERAMIC PARTS",
              "sort_order": 5
            },
            {
              "question_code": "MATCHER",
              "question_text": "MATCHER",
              "sort_order": 6
            },
            {
              "question_code": "PM_BAFFLE",
              "question_text": "PM BAFFLE",
              "sort_order": 7
            },
            {
              "question_code": "AM_BAFFLE",
              "question_text": "AM BAFFLE",
              "sort_order": 8
            },
            {
              "question_code": "FLANGE_ADAPTOR",
              "question_text": "FLANGE ADAPTOR",
              "sort_order": 9
            }
          ]
        },
        {
          "section_code": "SLOT_VALVE",
          "section_name": "Slot Valve",
          "sort_order": 2,
          "questions": [
            {
              "question_code": "SLOT_VALVE_ASSY(HOUSING)",
              "question_text": "SLOT VALVE ASSY(HOUSING)",
              "sort_order": 1
            },
            {
              "question_code": "SLOT_VALVE",
              "question_text": "SLOT VALVE",
              "sort_order": 2
            },
            {
              "question_code": "DOOR_VALVE",
              "question_text": "DOOR VALVE",
              "sort_order": 3
            }
          ]
        },
        {
          "section_code": "PENDULUM_VALVE",
          "section_name": "Pendulum Valve",
          "sort_order": 3,
          "questions": [
            {
              "question_code": "PENDULUM_VALVE",
              "question_text": "PENDULUM VALVE",
              "sort_order": 1
            }
          ]
        },
        {
          "section_code": "PIN_MOTOR_AND_CTR",
          "section_name": "Pin Motor & CTR",
          "sort_order": 4,
          "questions": [
            {
              "question_code": "PIN_ASSY_MODIFY",
              "question_text": "PIN ASSY MODIFY",
              "sort_order": 1
            },
            {
              "question_code": "MOTOR_&_CONTROLLER",
              "question_text": "MOTOR & CONTROLLER",
              "sort_order": 2
            },
            {
              "question_code": "PIN_구동부_ASSY",
              "question_text": "PIN 구동부 ASSY",
              "sort_order": 3
            },
            {
              "question_code": "PIN_BELLOWS",
              "question_text": "PIN BELLOWS",
              "sort_order": 4
            },
            {
              "question_code": "SENSOR",
              "question_text": "SENSOR",
              "sort_order": 5
            }
          ]
        },
        {
          "section_code": "STEP_MOTOR_AND_CTR",
          "section_name": "Step Motor & CTR",
          "sort_order": 5,
          "questions": [
            {
              "question_code": "STEP_MOTOR_&_CONTROLLER",
              "question_text": "STEP MOTOR & CONTROLLER",
              "sort_order": 1
            },
            {
              "question_code": "CASSETTE_&_HOLDER_PAD",
              "question_text": "CASSETTE & HOLDER PAD",
              "sort_order": 2
            },
            {
              "question_code": "BALL_SCREW_ASSY",
              "question_text": "BALL SCREW ASSY",
              "sort_order": 3
            },
            {
              "question_code": "BUSH",
              "question_text": "BUSH",
              "sort_order": 4
            },
            {
              "question_code": "MAIN_SHAFT",
              "question_text": "MAIN SHAFT",
              "sort_order": 5
            },
            {
              "question_code": "BELLOWS",
              "question_text": "BELLOWS",
              "sort_order": 6
            }
          ]
        },
        {
          "section_code": "ROBOT",
          "section_name": "Robot",
          "sort_order": 6,
          "questions": [
            {
              "question_code": "EFEM_ROBOT_REP",
              "question_text": "EFEM ROBOT REP",
              "sort_order": 1
            },
            {
              "question_code": "TM_ROBOT_REP",
              "question_text": "TM ROBOT REP",
              "sort_order": 2
            },
            {
              "question_code": "EFEM_ROBOT_TEACHING",
              "question_text": "EFEM ROBOT TEACHING",
              "sort_order": 3
            },
            {
              "question_code": "TM_ROBOT_TEACHING",
              "question_text": "TM ROBOT TEACHING",
              "sort_order": 4
            },
            {
              "question_code": "TM_ROBOT_SERVO_PACK",
              "question_text": "TM ROBOT SERVO PACK",
              "sort_order": 5
            }
          ]
        },
        {
          "section_code": "VAC_LINE",
          "section_name": "Vac. Line",
          "sort_order": 7,
          "questions": [
            {
              "question_code": "UNDER_COVER",
              "question_text": "UNDER COVER",
              "sort_order": 1
            },
            {
              "question_code": "VAC._LINE",
              "question_text": "VAC. LINE",
              "sort_order": 2
            },
            {
              "question_code": "BARATRON_GAUGE",
              "question_text": "BARATRON GAUGE",
              "sort_order": 3
            },
            {
              "question_code": "PIRANI_GAUGE",
              "question_text": "PIRANI GAUGE",
              "sort_order": 4
            },
            {
              "question_code": "CONVACTRON_GAUGE",
              "question_text": "CONVACTRON GAUGE",
              "sort_order": 5
            },
            {
              "question_code": "MANUAL_VALVE",
              "question_text": "MANUAL VALVE",
              "sort_order": 6
            },
            {
              "question_code": "PNEUMATIC_VALVE",
              "question_text": "PNEUMATIC VALVE",
              "sort_order": 7
            },
            {
              "question_code": "ISOLATION_VALVE",
              "question_text": "ISOLATION VALVE",
              "sort_order": 8
            },
            {
              "question_code": "VACUUM_BLOCK",
              "question_text": "VACUUM BLOCK",
              "sort_order": 9
            },
            {
              "question_code": "CHECK_VALVE",
              "question_text": "CHECK VALVE",
              "sort_order": 10
            },
            {
              "question_code": "EPC",
              "question_text": "EPC",
              "sort_order": 11
            },
            {
              "question_code": "PURGE_LINE_REGULATOR",
              "question_text": "PURGE LINE REGULATOR",
              "sort_order": 12
            }
          ]
        },
        {
          "section_code": "CHUCK",
          "section_name": "Chuck",
          "sort_order": 8,
          "questions": [
            {
              "question_code": "COOLING_CHUCK",
              "question_text": "COOLING CHUCK",
              "sort_order": 1
            },
            {
              "question_code": "HEATER_CHUCK",
              "question_text": "HEATER CHUCK",
              "sort_order": 2
            }
          ]
        },
        {
          "section_code": "RACK",
          "section_name": "Rack",
          "sort_order": 9,
          "questions": [
            {
              "question_code": "GENERATOR",
              "question_text": "GENERATOR",
              "sort_order": 1
            }
          ]
        },
        {
          "section_code": "BOARD",
          "section_name": "Board",
          "sort_order": 10,
          "questions": [
            {
              "question_code": "D-NET_BOARD",
              "question_text": "D-NET BOARD",
              "sort_order": 1
            },
            {
              "question_code": "SOURCE_BOX_BOARD",
              "question_text": "SOURCE BOX BOARD",
              "sort_order": 2
            },
            {
              "question_code": "INTERFACE_BOARD",
              "question_text": "INTERFACE BOARD",
              "sort_order": 3
            },
            {
              "question_code": "SENSOR_BOARD",
              "question_text": "SENSOR BOARD",
              "sort_order": 4
            },
            {
              "question_code": "PIO_SENSOR_BOARD",
              "question_text": "PIO SENSOR BOARD",
              "sort_order": 5
            },
            {
              "question_code": "AIO_CALIBRATION[PSK_BOARD]",
              "question_text": "AIO CALIBRATION[PSK BOARD]",
              "sort_order": 6
            },
            {
              "question_code": "AIO_CALIBRATION[TOS_BOARD]",
              "question_text": "AIO CALIBRATION[TOS BOARD]",
              "sort_order": 7
            }
          ]
        },
        {
          "section_code": "SENSOR",
          "section_name": "Sensor",
          "sort_order": 11,
          "questions": [
            {
              "question_code": "CODED_SENSOR",
              "question_text": "CODED SENSOR",
              "sort_order": 1
            },
            {
              "question_code": "GAS_BOX_DOOR_SENSOR",
              "question_text": "GAS BOX DOOR SENSOR",
              "sort_order": 2
            },
            {
              "question_code": "LASER_SENSOR_AMP",
              "question_text": "LASER SENSOR AMP",
              "sort_order": 3
            }
          ]
        },
        {
          "section_code": "ETC",
          "section_name": "ETC",
          "sort_order": 12,
          "questions": [
            {
              "question_code": "HE_LEAK_CHECK",
              "question_text": "HE LEAK CHECK",
              "sort_order": 1
            },
            {
              "question_code": "DIFFUSER",
              "question_text": "DIFFUSER",
              "sort_order": 2
            },
            {
              "question_code": "LOT_조사",
              "question_text": "LOT 조사",
              "sort_order": 3
            },
            {
              "question_code": "GAS_SPRING",
              "question_text": "GAS SPRING",
              "sort_order": 4
            }
          ]
        }
      ]
    },
    {
      "equipment_group_code": "PRECIA",
      "checklist_kind": "SETUP",
      "template_name": "PRECIA Setup Checklist",
      "version_no": 1,
      "sections": [
        {
          "section_code": "INSTALLATION_PREPARATION",
          "section_name": "INSTALLATION PREPARATION",
          "sort_order": 1,
          "questions": [
            {
              "question_code": "INST_OHT_CHECK",
              "question_text": "고객사에서 그린 기준선과 OHT라인이 일치하는지 확인 알고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "INST_SPACING_CHECK",
              "question_text": "설비간 유격거리가 충분한지 확인 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "INST_DRAW_SETUP",
              "question_text": "Drawing Template을 기준선에 맞춰 배치 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "INST_DRAW_MARKING",
              "question_text": "Drawing Template를 펼쳐 타공, H빔 및 Adjust 를 Marking 알고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "INST_UTILITY_SPEC",
              "question_text": "타공별 Utility Spec을 숙지하고 있는가?",
              "sort_order": 5
            }
          ]
        },
        {
          "section_code": "FAB_IN",
          "section_name": "FAB IN",
          "sort_order": 2,
          "questions": [
            {
              "question_code": "FAB_IMPORT_ORDER",
              "question_text": "설비반입 순서를 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "FAB_WARN_ISSUE",
              "question_text": "반입 업체에게 주의점을 설명할 수 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "FAB_INSPECT",
              "question_text": "설비반입 시 확인해야하는 부분을 숙지하고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "FAB_FORBIDDEN",
              "question_text": "설비반입 금지 물품에 대해 알고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "FAB_GRATING",
              "question_text": "Grating 개구부 마감 처리 확인에 대해 알고 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "FAB_PACKING_LIST",
              "question_text": "Packing List 확인하여 반입 Part 확인이 가능 한가?",
              "sort_order": 6
            }
          ]
        },
        {
          "section_code": "DOCKING",
          "section_name": "DOCKING",
          "sort_order": 3,
          "questions": [
            {
              "question_code": "DOCK_TOOL_SIZE",
              "question_text": "장비별 Tool size를 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "DOCK_LASER_JIG",
              "question_text": "Laser Jig 를 이용하여 OHT Line 과 설비를 정렬 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "DOCK_CASTER",
              "question_text": "Lift를 활용하여 EFEM의 Caster 를 제거 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "DOCK_HEIGHT",
              "question_text": "각 Module의 지면에서 frame의 높이를 알고 Spec에 맞춰 Docking 알고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "DOCK_MODULE",
              "question_text": "Module간 Docking 할 수 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "DOCK_REALIGN",
              "question_text": "Docking작업 중 설비와 OHT Line 정렬이 틀어졌을 경우 재정렬 알고 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "DOCK_LEVEL_POS",
              "question_text": "각 Moudule의 Leveler 정위치를 숙지하고 있는가?",
              "sort_order": 7
            },
            {
              "question_code": "DOCK_LEVEL_SPEC",
              "question_text": "각 Moudule의 Leveling Spec을 알고 Adjust를 이용, Leveling 알고 있는가?",
              "sort_order": 8
            },
            {
              "question_code": "DOCK_ACCESSORY",
              "question_text": "Accessory를 정위치에 장착 알고 있는가?",
              "sort_order": 9
            },
            {
              "question_code": "DOCK_HOOK_UP",
              "question_text": "내부 Hook Up 알고 있는가?",
              "sort_order": 10
            }
          ]
        },
        {
          "section_code": "CABLE_HOOK_UP",
          "section_name": "CABLE HOOK UP",
          "sort_order": 4,
          "questions": [
            {
              "question_code": "CABLE_TRAY_CHECK",
              "question_text": "설비에서 Rack까지 Tray 확인 및 작업가능여부 판단알고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "CABLE_SORTING",
              "question_text": "Cable 각 Module별로 분류 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "CABLE_GRATING",
              "question_text": "Grating Open시 주의 사항을 숙지하고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "CABLE_LADDER_RULES",
              "question_text": "사다리 작업시 환경안전수칙을 숙지하고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "CABLE_INSTALL",
              "question_text": "설비에서 Rack까지 포설 알고 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "CABLE_CONNECTION",
              "question_text": "Cable을 설비에 정확히 연결 알고 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "CABLE_TRAY_ARRANGE",
              "question_text": "Cable을 Tray에 규격에 맞게 정리 알고 있는가?",
              "sort_order": 7
            },
            {
              "question_code": "CABLE_CUTTING",
              "question_text": "설비와 Rack간의 거리를 고려해 Cable 재단 알고 있는가?",
              "sort_order": 8
            },
            {
              "question_code": "CABLE_RACK_CONNECT",
              "question_text": "Cable을 Rack에 정확히 연결알고 있는가?",
              "sort_order": 9
            },
            {
              "question_code": "CABLE_PUMP_TRAY",
              "question_text": "Pump Cable의 종류를 알고 알맞은 Tray로 내려줄 수 있는가?",
              "sort_order": 10
            },
            {
              "question_code": "CABLE_PUMP_ARRANGE",
              "question_text": "Pump단에서 Cable 포설 및 정리 알고 있는가?",
              "sort_order": 11
            },
            {
              "question_code": "CABLE_MODULE_PUMP",
              "question_text": "Cable을 구분하여 Module 별로 Pump에 정확히 연결 알고 있는가?",
              "sort_order": 12
            }
          ]
        },
        {
          "section_code": "POWER_TURN_ON",
          "section_name": "POWER TURN ON",
          "sort_order": 5,
          "questions": [
            {
              "question_code": "POWER_GPS_UPS_SPS",
              "question_text": "GPS, UPS, SPS 의 역할과 원리에 대해 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "POWER_TURN_SEQ",
              "question_text": "Power turn on 순서를 숙지하고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "POWER_CB_UNDERSTAND",
              "question_text": "Rack의 ELCB, MCB 종류와 기능을 숙지하고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "POWER_SAFETY_MODULE",
              "question_text": "Safety Module의 위치와 기능을 숙지하고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "POWER_EMO_CHECK",
              "question_text": "EMO 동작 Check 알고 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "POWER_MODULE_MCB",
              "question_text": "Module별 MCB 위치를 알고 Turn on 알고 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "POWER_SYCON_UNDERST",
              "question_text": "Sycon number 별 의미하는 Part를 숙지하고 있는가?",
              "sort_order": 7
            },
            {
              "question_code": "POWER_SYCON_TROUBLE",
              "question_text": "Sycon 실행시 통신되지않는 Part에 대해 Troble Shooting 알고 있는가?",
              "sort_order": 8
            },
            {
              "question_code": "POWER_NAVIGATOR",
              "question_text": "LS-Navigator 실행 및 Setting에 대해 알고 있는가?",
              "sort_order": 9
            },
            {
              "question_code": "POWER_SERVO_CHECK",
              "question_text": "'Chuck Motor Servo On Check 및 실행할 수 있는가?",
              "sort_order": 10
            },
            {
              "question_code": "POWER_ALARM_TROUBLE",
              "question_text": "Power turn on 후 발생하는 Alram Troble Shooting 알고 있는가?",
              "sort_order": 11
            },
            {
              "question_code": "POWER_CHECKLIST",
              "question_text": "구동 Checklist 작성 가능한가?",
              "sort_order": 12
            },
            {
              "question_code": "POWER_VISION_CONNECT",
              "question_text": "Vision CTR 접속 및 Vision Program 실행에 대해 알고 있는가?",
              "sort_order": 13
            },
            {
              "question_code": "POWER_IP_CHANGE",
              "question_text": "ip 주소 변경 방법에 대해 알고 있는가?",
              "sort_order": 14
            }
          ]
        },
        {
          "section_code": "UTILITY_TURN_ON",
          "section_name": "UTILITY TURN ON",
          "sort_order": 6,
          "questions": [
            {
              "question_code": "UTIL_PRE_CHECK",
              "question_text": "Utility Turn on 전 확인사항을 알고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "UTIL_SETUP_MOD",
              "question_text": "SetUp.ini 파일 수정 하는 방법에 대해 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "UTIL_TURN_SEQ",
              "question_text": "Utility Turn on 의 순서를 숙지하고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "UTIL_VACUUM_TURN",
              "question_text": "Vacuum Turn on 및 Spec에 맞게 조정 알고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "UTIL_CDA_TURN",
              "question_text": "CDA Turn On 가능한가?",
              "sort_order": 5
            },
            {
              "question_code": "UTIL_SOLENOID",
              "question_text": "Solanoid Valve 위치를 전부 숙지하고 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "UTIL_RELIEF_VALVE",
              "question_text": "Relief Valve 위치를 전부 숙지하고 있는가?",
              "sort_order": 7
            },
            {
              "question_code": "UTIL_MANUAL_VALVE",
              "question_text": "Manual Valve 위치를 전부 숙지하고 있는가?",
              "sort_order": 8
            },
            {
              "question_code": "UTIL_PUMP_TURN",
              "question_text": "PUMP Turn On 알고 있는가?",
              "sort_order": 9
            },
            {
              "question_code": "UTIL_SIGNAL_CHECK",
              "question_text": "Dillution Signal Check 방법을 알고 있는가?",
              "sort_order": 10
            },
            {
              "question_code": "UTIL_CHILLER_TURN",
              "question_text": "Chiller Turn On 알고 있는가?",
              "sort_order": 11
            },
            {
              "question_code": "UTIL_CHILLER_CHECK",
              "question_text": "Chiller Turn on 이후 확인사항을 알고 있는가?",
              "sort_order": 12
            },
            {
              "question_code": "UTIL_MANOMETER_ADJUST",
              "question_text": "Manometer의 Low, High Limit 값 Spec에 맞게 조정 알고 있는가?",
              "sort_order": 13
            }
          ]
        },
        {
          "section_code": "GAS_TURN_ON",
          "section_name": "GAS TURN ON",
          "sort_order": 7,
          "questions": [
            {
              "question_code": "GAS_TURN_SEQ",
              "question_text": "Gas Turn on 전 확인사항 알고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "GAS_O2_LEAK",
              "question_text": "O2 Line Leak Check 하는 방법 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "GAS_N2_LEAK",
              "question_text": "N2 Line Leak Check 하는 방법 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "GAS_AR_TURN",
              "question_text": "Ar Turn on 하는 방법 알고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "GAS_CF4_TURN",
              "question_text": "CF4 Turn on 하는 방법 알고 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "GAS_SF6_TURN",
              "question_text": "SF6 Turn on 이후 확인사항에 대해 알고 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "GAS_TURN_WARN",
              "question_text": "Gas Turn on 시 주의사항 알고 있는가?",
              "sort_order": 7
            },
            {
              "question_code": "GAS_DILLUTION_TEST",
              "question_text": "PM Dillution Test 하는 방법 알고 있는가?",
              "sort_order": 8
            },
            {
              "question_code": "GAS_FLOW_CHECK",
              "question_text": "Gas Turn on 및 가스 유입유무를 확인 알고 있는가?",
              "sort_order": 9
            }
          ]
        },
        {
          "section_code": "TEACHING",
          "section_name": "TEACHING",
          "sort_order": 8,
          "questions": [
            {
              "question_code": "TEACH_ROBOT_CONTROL",
              "question_text": "EFEM Robot Pendant 조작 가능한가?",
              "sort_order": 1
            },
            {
              "question_code": "TEACH_ROBOT_XYZ",
              "question_text": "EFEM X,Y,Z,S1,S2 값을 알고 있는가?? (SANKYO)",
              "sort_order": 2
            },
            {
              "question_code": "TEACH_ROBOT_PARAM",
              "question_text": "EFEM Robot Parameter 수정 가능한가?? (SANKYO)",
              "sort_order": 3
            },
            {
              "question_code": "TEACH_DATA_SAVE",
              "question_text": "EFEM Teaching Data 저장 가능한가 ? (SANKYO)",
              "sort_order": 4
            },
            {
              "question_code": "TEACH_AWC_CAL",
              "question_text": "EFEM AWC Cal 진행 가능한가? (SANKYO)",
              "sort_order": 5
            },
            {
              "question_code": "TEACH_TM_CONTROL",
              "question_text": "TM Robot Pendant 조작 가능한가? (PERSIMMON)",
              "sort_order": 6
            },
            {
              "question_code": "TEACH_TM_LEVELING",
              "question_text": "TM Robot Leveling 가능 한가? (PERSIMMON)",
              "sort_order": 7
            },
            {
              "question_code": "TEACH_TM_VALUES",
              "question_text": "TM Robot A , B arm Ra,Rb,Z,T 값을 알고 있는가 ? (PERSIMMON)",
              "sort_order": 8
            },
            {
              "question_code": "TEACH_TM_PM",
              "question_text": "TM Robot PM Teaching 가능 한가 ? (PERSIMMON)",
              "sort_order": 9
            },
            {
              "question_code": "TEACH_TM_AWC",
              "question_text": "TM Robot PM Teaching 후 AWC Cal 가능한가? (PERSIMMON)",
              "sort_order": 10
            },
            {
              "question_code": "TEACH_TM_LL",
              "question_text": "TM Robot LL Teaching 가능 한가 ? (PERSIMMON)",
              "sort_order": 11
            },
            {
              "question_code": "TEACH_TM_LL_AWC",
              "question_text": "TM Robot LL Teaching 후 AWC Cal 가능한가? (PERSIMMON)",
              "sort_order": 12
            },
            {
              "question_code": "TEACH_TM_DATA_SAVE",
              "question_text": "TM Robot  Teaching Data 저장 가능한가 ? (PERSIMMON)",
              "sort_order": 13
            },
            {
              "question_code": "TEACH_TM_MACRO",
              "question_text": "TM Robot PM Macro Test 로 AWC 검증 가능한가?",
              "sort_order": 14
            },
            {
              "question_code": "TEACH_TM_AXIS",
              "question_text": "TM Robot Axis Align 가능한가?",
              "sort_order": 15
            },
            {
              "question_code": "TEACH_SEMI_TRANSFER",
              "question_text": "Semi Auto Transfer 알고 있는가?",
              "sort_order": 16
            },
            {
              "question_code": "TEACH_AGING",
              "question_text": "Aging Test 알고 있는가 ?",
              "sort_order": 17
            },
            {
              "question_code": "TEACH_PIN",
              "question_text": "Pin Teaching 가능한가?",
              "sort_order": 18
            },
            {
              "question_code": "TEACH_CHUCK",
              "question_text": "Chuck Teaching 가능한가?",
              "sort_order": 19
            },
            {
              "question_code": "TEACH_GAP",
              "question_text": "Gap Teachinig 가능한가?",
              "sort_order": 20
            },
            {
              "question_code": "TEACH_SENSOR",
              "question_text": "Gap Sensor Adjust 가능한가?",
              "sort_order": 21
            },
            {
              "question_code": "TEACH_CAL",
              "question_text": "2Point Calibration 가능한가?",
              "sort_order": 22
            },
            {
              "question_code": "TEACH_CENTERING",
              "question_text": "Wafer Centering 가능한가?",
              "sort_order": 23
            }
          ]
        },
        {
          "section_code": "PART_INSTALLATION",
          "section_name": "PART INSTALLATION",
          "sort_order": 9,
          "questions": [
            {
              "question_code": "PART_PROCESS_KIT",
              "question_text": "상부 및 하부 Process Kit 장착 방법 알고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "PART_PIN_HEIGHT",
              "question_text": "Pin 장착 및 Pin 높이 조절에 대해 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "PART_PIO_SENSOR",
              "question_text": "PIO Sensor 장착 방법 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "PART_EARTHQUAKE",
              "question_text": "지진방지 BKT 정위치 및 설비쪽 체결 가능한가?",
              "sort_order": 4
            },
            {
              "question_code": "PART_EFEM_PICK",
              "question_text": "EFEM Robot Pick 장착 방법 알고 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "PART_EFEM_PICK_LEVEL",
              "question_text": "EFEM Robot Pick Leveling 방법 알고 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "PART_EFEM_PICK_ADJUST",
              "question_text": "EFEM Robot Pick 간격 Adjust 할 수 있는가?",
              "sort_order": 7
            },
            {
              "question_code": "PART_TM_PICK",
              "question_text": "TM Robot Pick 장착 방법 알고 있는가?",
              "sort_order": 8
            },
            {
              "question_code": "PART_TM_PICK_LEVEL",
              "question_text": "TM Robot Pick Leveling 방법 알고 있는가?",
              "sort_order": 9
            },
            {
              "question_code": "PART_TM_PICK_ADJUST",
              "question_text": "TM Robot Pick 간격 Adjust 할 수 있는가? (상하, 좌우)",
              "sort_order": 10
            }
          ]
        },
        {
          "section_code": "LEAK_CHECK",
          "section_name": "LEAK CHECK",
          "sort_order": 10,
          "questions": [
            {
              "question_code": "LEAK_CHAMBER",
              "question_text": "Chamber Manual Leack Check 방법 알고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "LEAK_LINE",
              "question_text": "Line Manual Leack Check 방법 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "LEAK_HISTORY",
              "question_text": "Manual Leack Check History를 확인 할 수 있는가?",
              "sort_order": 3
            }
          ]
        },
        {
          "section_code": "TTTM",
          "section_name": "TTTM",
          "sort_order": 11,
          "questions": [
            {
              "question_code": "TTTM_MANOMETER_DNET",
              "question_text": "Manometer D-NET Cal 가능한가?",
              "sort_order": 1
            },
            {
              "question_code": "TTTM_PIRANI_DNET",
              "question_text": "TM, LL Pirani Gauge D-NET Cal 가능한가?",
              "sort_order": 2
            },
            {
              "question_code": "TTTM_VALVE_TIME",
              "question_text": "Door Valve, Slot Valve Open,Close Time 조절 가능 한가 ?",
              "sort_order": 3
            },
            {
              "question_code": "TTTM_APC_AUTOTUNE",
              "question_text": "APC Autolearn 가능 한가 ?",
              "sort_order": 4
            },
            {
              "question_code": "TTTM_PIN_HEIGHT",
              "question_text": "Pin height Adjust 가능 한가 ?",
              "sort_order": 5
            },
            {
              "question_code": "TTTM_GAS_PRESSURE",
              "question_text": "Gas Supply Pressure Check 가능 한가 ?",
              "sort_order": 6
            },
            {
              "question_code": "TTTM_MFC_CAL",
              "question_text": "MFC Zero Cal 가능한가?",
              "sort_order": 7
            },
            {
              "question_code": "TTTM_LP_FLOW",
              "question_text": "LP 유량 조절 가능한가?",
              "sort_order": 8
            },
            {
              "question_code": "TTTM_REPORT",
              "question_text": "Product Report 작성 가능한가?",
              "sort_order": 9
            },
            {
              "question_code": "TTTM_SHEET",
              "question_text": "TTTM Sheet 작성 가능한가?",
              "sort_order": 10
            }
          ]
        },
        {
          "section_code": "CUSTOMER_CERTIFICATION",
          "section_name": "CUSTOMER CERTIFICATION",
          "sort_order": 12,
          "questions": [
            {
              "question_code": "CUST_LP_CERT",
              "question_text": "LP 인증 가능한가?",
              "sort_order": 1
            },
            {
              "question_code": "CUST_RUN_CERT",
              "question_text": "중간가동인증 준비 사항 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "CUST_LABEL",
              "question_text": "Label 붙여야 하는 곳이 어디인지 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "CUST_I_MARK",
              "question_text": "I-Marking 방법에 대해 알고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "CUST_I_MARK_LOC",
              "question_text": "I-Marking 하는 곳이 어디인지 알고 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "CUST_ENV_QUAL",
              "question_text": "환경 Qual Test 가능한가?",
              "sort_order": 6
            },
            {
              "question_code": "CUST_OHT_CERT",
              "question_text": "OHT 자동반송 인증 Test 가능한가?",
              "sort_order": 7
            },
            {
              "question_code": "CUST_RUN_CERTIFY",
              "question_text": "중간가동인증 가능한가?",
              "sort_order": 8
            }
          ]
        },
        {
          "section_code": "PROCESS_CONFIRM",
          "section_name": "PROCESS CONFIRM",
          "sort_order": 13,
          "questions": [
            {
              "question_code": "PROC_PARTICLE",
              "question_text": "Paticle Test 가능한가?",
              "sort_order": 1
            },
            {
              "question_code": "PROC_EA_TEST",
              "question_text": "E/A Test 가능한가?",
              "sort_order": 2
            }
          ]
        }
      ]
    },
    {
      "equipment_group_code": "PRECIA",
      "checklist_kind": "MAINT",
      "template_name": "PRECIA Maintenance Checklist",
      "version_no": 1,
      "sections": [
        {
          "section_code": "PM",
          "section_name": "PM",
          "sort_order": 1,
          "questions": [
            {
              "question_code": "PM_CENTERING",
              "question_text": "PM CENTERING",
              "sort_order": 1
            },
            {
              "question_code": "PM_CLN",
              "question_text": "PM CLN",
              "sort_order": 2
            },
            {
              "question_code": "PM_SLOT_VALVE_REP",
              "question_text": "PM SLOT VALVE REP",
              "sort_order": 3
            },
            {
              "question_code": "PM_PEEK_PLATE_REP",
              "question_text": "PM PEEK PLATE REP",
              "sort_order": 4
            },
            {
              "question_code": "PM_RF_MATCHER_REP",
              "question_text": "PM RF MATCHER REP",
              "sort_order": 5
            },
            {
              "question_code": "PM_PIN_HOLDER_REP",
              "question_text": "PM PIN HOLDER REP",
              "sort_order": 6
            },
            {
              "question_code": "PM_GAP_SENSOR_ADJUST",
              "question_text": "PM GAP SENSOR ADJUST",
              "sort_order": 7
            },
            {
              "question_code": "PM_PROCESS_KIT_REP",
              "question_text": "PM PROCESS KIT REP",
              "sort_order": 8
            }
          ]
        },
        {
          "section_code": "TEACHING",
          "section_name": "TEACHING",
          "sort_order": 2,
          "questions": [
            {
              "question_code": "EFEM_ROBOT_TEACHING",
              "question_text": "EFEM ROBOT TEACHING",
              "sort_order": 1
            },
            {
              "question_code": "TM_ROBOT_TEACHING",
              "question_text": "TM ROBOT TEACHING",
              "sort_order": 2
            }
          ]
        },
        {
          "section_code": "ETC",
          "section_name": "ETC",
          "sort_order": 3,
          "questions": [
            {
              "question_code": "LOT_조사",
              "question_text": "LOT 조사",
              "sort_order": 1
            },
            {
              "question_code": "LP_ESCORT",
              "question_text": "LP ESCORT",
              "sort_order": 2
            }
          ]
        }
      ]
    },
    {
      "equipment_group_code": "ECOLITE_300",
      "checklist_kind": "SETUP",
      "template_name": "ECOLITE Setup Checklist",
      "version_no": 1,
      "sections": [
        {
          "section_code": "INSTALLATION_PREPERATION",
          "section_name": "INSTALLATION PREPERATION",
          "sort_order": 1,
          "questions": [
            {
              "question_code": "EQ_IMPORT_ORDER",
              "question_text": "설비반입 순서를 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "PACK_LIST_CHECK",
              "question_text": "Packing List 확인하여 반입 Part 확인이 가능 한가?",
              "sort_order": 2
            },
            {
              "question_code": "OHT_LINE_CHECK_300",
              "question_text": "고객사에서 그린 기준선과 OHT라인이 일치하는지 확인 알고 있는가? (300mm)",
              "sort_order": 3
            },
            {
              "question_code": "OHT_LINE_CHECK_400",
              "question_text": "고객사에서 그린 기준선과 OHT라인이 일치하는지 확인 알고 있는가? (400mm Mac Type, Casette Type)",
              "sort_order": 4
            },
            {
              "question_code": "EQ_SPACING_CHECK",
              "question_text": "설비간 유격거리가 충분한지 확인 알고 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "DRAWING_TEMPLATE_SETUP",
              "question_text": "Drawing Template을 기준선에 맞춰 배치 알고 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "DRAWING_TEMPLATE_MARKING",
              "question_text": "Drawing Template를 펼쳐 타공, H빔 및 Adjust 를 Marking 알고 있는가?",
              "sort_order": 7
            },
            {
              "question_code": "UTILITY_SPEC_UNDERSTANDING",
              "question_text": "타공별 Utility Spec을 숙지하고 있는가?",
              "sort_order": 8
            }
          ]
        },
        {
          "section_code": "FAB_IN",
          "section_name": "FAB IN",
          "sort_order": 2,
          "questions": [
            {
              "question_code": "MODULE_UNPACKING_CAUTION",
              "question_text": "Module Unpacking시 주의 사항에 대해 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "MODULE_CLEAN_CAUTION",
              "question_text": "Module Clean시 주의 사항에 대해 숙지하고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "MODULE_MOVEMENT_CAUTION",
              "question_text": "Module 이동시 주의 사항에 대해 숙지하고 있는가?",
              "sort_order": 3
            }
          ]
        },
        {
          "section_code": "DOCKING",
          "section_name": "DOCKING",
          "sort_order": 3,
          "questions": [
            {
              "question_code": "TOOL_SIZE_UNDERSTANDING",
              "question_text": "장비별 Tool size를 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "LASER_JIG_ALIGNMENT_300",
              "question_text": "Laser Jig 를 이용하여 OHT Line 과 설비를 정렬 알고 있는가? (300mm)",
              "sort_order": 2
            },
            {
              "question_code": "LASER_JIG_ALIGNMENT_400",
              "question_text": "Laser Jig 를 이용하여 OHT Line 과 설비를 정렬 알고 있는가? (400mm Mac Type, Casette Type)",
              "sort_order": 3
            },
            {
              "question_code": "JACK_USAGE_UNDERSTANDING",
              "question_text": "Jack 위치 및 사용방법을 알고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "MODULE_HEIGHT_DOCKING",
              "question_text": "각 Module의 지면에서 frame의 높이를 알고 Spec에 맞춰 Docking 알고 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "MODULE_DOCKING",
              "question_text": "Module간 Docking 할 수 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "DOCKING_REALIGNMENT",
              "question_text": "Docking작업 중 설비와 OHT Line 정렬이 틀어졌을 경우 재정렬 알고 있는가?",
              "sort_order": 7
            },
            {
              "question_code": "LEVELER_POSITION_UNDERSTANDING",
              "question_text": "각 Moudule의 Leveler 정위치를 숙지하고 있는가?",
              "sort_order": 8
            },
            {
              "question_code": "MODULE_LEVELING",
              "question_text": "각 Moudule의 Leveling Spec을 알고 Adjust를 이용, Leveling 알고 있는가?",
              "sort_order": 9
            },
            {
              "question_code": "ACCESSORY_INSTALLATION",
              "question_text": "Accessory(Baratron, Pirani, EPD)를 정위치에 장착 알고 있는가?",
              "sort_order": 10
            },
            {
              "question_code": "HOOK_UP_UNDERSTANDING",
              "question_text": "내부 Hook Up 알고 있는가?",
              "sort_order": 11
            }
          ]
        },
        {
          "section_code": "CABLE_HOOK_UP",
          "section_name": "CABLE HOOK UP",
          "sort_order": 4,
          "questions": [
            {
              "question_code": "TRAY_CHECK",
              "question_text": "설비에서 Rack까지 Tray 확인 및 작업가능여부 판단알고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "CABLE_SORTING",
              "question_text": "Cable 각 Module별로 분류 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "GRATING_OPEN_CAUTION",
              "question_text": "Grating Open시 주의 사항을 숙지하고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "LADDER_SAFETY_RULES",
              "question_text": "사다리 작업시 환경안전수칙을 숙지하고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "CABLE_INSTALLATION",
              "question_text": "설비에서 Rack까지 포설 알고 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "CABLE_CONNECTION",
              "question_text": "Cable을 설비에 정확히 연결 알고 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "CABLE_TRAY_ARRANGEMENT",
              "question_text": "Cable을 Tray에 규격에 맞게 정리 알고 있는가?",
              "sort_order": 7
            },
            {
              "question_code": "CABLE_CUTTING",
              "question_text": "설비와 Rack간의 거리를 고려해 Cable 재단 알고 있는가?",
              "sort_order": 8
            },
            {
              "question_code": "CABLE_RACK_CONNECTION",
              "question_text": "Cable을 Rack에 정확히 연결알고 있는가?",
              "sort_order": 9
            },
            {
              "question_code": "PUMP_CABLE_TRAY",
              "question_text": "Pump Cable의 종류를 알고 알맞은 Tray로 내려줄 수 있는가?",
              "sort_order": 10
            },
            {
              "question_code": "PUMP_CABLE_ARRANGEMENT",
              "question_text": "Pump단에서 Cable 포설 및 정리 알고 있는가?",
              "sort_order": 11
            },
            {
              "question_code": "CABLE_PM_PUMP_CONNECTION",
              "question_text": "Cable을 구분하여 모듈별로 Pump에 정확히 연결 알고 있는가?",
              "sort_order": 12
            }
          ]
        },
        {
          "section_code": "POWER_TURN_ON",
          "section_name": "POWER TURN ON",
          "sort_order": 5,
          "questions": [
            {
              "question_code": "GPS_UPS_SPS_UNDERSTANDING",
              "question_text": "GPS, UPS, SPS 의 역할과 원리에 대해 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "POWER_TURN_ON_SEQUENCE",
              "question_text": "Power turn on 순서를 숙지하고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "ALARM_TROUBLESHOOTING",
              "question_text": "Power turn on 후 발생하는 Alram Troble Shooting 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "RACK_CB_UNDERSTANDING",
              "question_text": "Rack의 CB 종류와 기능을 숙지하고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "SAFETY_MODULE_UNDERSTANDING",
              "question_text": "Safety Module의 위치와 기능을 숙지하고 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "EMO_CHECK",
              "question_text": "EMO 동작 Check 알고 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "SYCON_NUMBER_UNDERSTANDING",
              "question_text": "Sycon number 별 의미하는 Part를 숙지하고 있는가?",
              "sort_order": 7
            },
            {
              "question_code": "SYCON_INITIAL_SETUP",
              "question_text": "Sycon 접속 및 초기 Setting을 할 수 있는가?",
              "sort_order": 8
            },
            {
              "question_code": "SYCON_TROUBLESHOOTING",
              "question_text": "Sycon 실행시 통신되지않는 Part에 대해 Troble Shooting 알고 있는가?",
              "sort_order": 9
            }
          ]
        },
        {
          "section_code": "UTILITY_TURN_ON",
          "section_name": "UTILITY TURN ON",
          "sort_order": 6,
          "questions": [
            {
              "question_code": "UTILITY_TURN_ON_SEQUENCE",
              "question_text": "Utility turn on 의 순서를 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "VACUUM_TURN_ON",
              "question_text": "Vacuum Turn on 및 Spec에 맞게 조정 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "CDA_TURN_ON",
              "question_text": "CDA Turn on 및 Spec에 맞게 조정 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "PCW_TURN_ON",
              "question_text": "PCW Turn on 및 Spec에 맞게 조정 알고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "CHILLER_TEMP_ADJUST",
              "question_text": "Chiller Turn On 및 Spec에 맞게 TEMP 조정 알고 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "IONIZER_TURN_ON",
              "question_text": "IONIZER Turn On 및 Spec에 맞게 조정 알고 있는가?",
              "sort_order": 6
            }
          ]
        },
        {
          "section_code": "GAS_TURN_ON",
          "section_name": "GAS TURN ON",
          "sort_order": 7,
          "questions": [
            {
              "question_code": "GAS_TURN_ON_SEQUENCE",
              "question_text": "Gas turn on 의 순서를 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "O2_N2_GAS_TURN_ON",
              "question_text": "O2, N2 Gas Turn on 및 가스 유입유무를 확인 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "CF4_GAS_TURN_ON",
              "question_text": "CF4 Gas Turn on 및 가스 유입유무를 확인 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "CF4_H2N2_PRESSURE_TEST",
              "question_text": "CF4,H2N2 가압,감압 TEST를 할 수 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "MANOMETER_ADJUST",
              "question_text": "Manometer의 Low, High Limit 값 Spec에 맞게 조정 알고 있는가?",
              "sort_order": 5
            }
          ]
        },
        {
          "section_code": "TEACHING",
          "section_name": "TEACHING",
          "sort_order": 8,
          "questions": [
            {
              "question_code": "EFEM_LEVELING_SANKYO",
              "question_text": "EFEM Robot Leveling 알고 있는가? (SANKYO)",
              "sort_order": 1
            },
            {
              "question_code": "EFEM_ARM_LEVEL_SANKYO",
              "question_text": "EFEM Robot Arm Leveling 알고 있는가? (SANKYO)",
              "sort_order": 2
            },
            {
              "question_code": "EFEM_LOAD_PORT_SANKYO",
              "question_text": "EFEM Robot Load Port Teaching 가능한가? (SANKYO)",
              "sort_order": 3
            },
            {
              "question_code": "EFEM_LOADLOCK_SANKYO",
              "question_text": "EFEM Robot Loadlock Teaching 가능한가? (SANKYO)",
              "sort_order": 4
            },
            {
              "question_code": "EFEM_BM_MODULE_SANKYO",
              "question_text": "EFEM Robot BM Module Teaching 가능한가? (SANKYO)",
              "sort_order": 5
            },
            {
              "question_code": "EFEM_TEACH_SAVE_SANKYO",
              "question_text": "EFEM Teaching Data 저장 가능한가? (SANKYO)",
              "sort_order": 6
            },
            {
              "question_code": "EFEM_LEVELING_YASKAWA",
              "question_text": "EFEM Robot Leveling 알고 있는가? (YASKAWA)",
              "sort_order": 7
            },
            {
              "question_code": "EFEM_ARM_LEVEL_YASKAWA",
              "question_text": "EFEM Robot Arm Leveling 알고 있는가? (YASKAWA)",
              "sort_order": 8
            },
            {
              "question_code": "EFEM_LOAD_PORT_YASKAWA",
              "question_text": "EFEM Robot Load Port Teaching 가능한가? (YASKAWA)",
              "sort_order": 9
            },
            {
              "question_code": "EFEM_LOADLOCK_YASKAWA",
              "question_text": "EFEM Robot Loadlock Teaching 가능한가? (YASKAWA)",
              "sort_order": 10
            },
            {
              "question_code": "EFEM_BM_MODULE_YASKAWA",
              "question_text": "EFEM Robot BM Module Teaching 가능한가? (YASKAWA)",
              "sort_order": 11
            },
            {
              "question_code": "EFEM_TEACH_SAVE_YASKAWA",
              "question_text": "EFEM Teaching Data 저장 가능한가? (YASKAWA)",
              "sort_order": 12
            },
            {
              "question_code": "ABS_HOME_SETTING",
              "question_text": "EFEM, TM Robot ABS Home을 잡을 수 있는가?",
              "sort_order": 13
            },
            {
              "question_code": "TM_ROBOT_PENDANT_CONTROL",
              "question_text": "TM Robot Pendant 조작 가능한가?",
              "sort_order": 14
            },
            {
              "question_code": "TM_BM_TEACHING",
              "question_text": "TM Robot BM Module Teaching 가능 한가?",
              "sort_order": 15
            },
            {
              "question_code": "TM_PM_TEACHING",
              "question_text": "TM Robot PM Teeaching 가능 한가?",
              "sort_order": 16
            },
            {
              "question_code": "TM_TEACH_SAVE",
              "question_text": "TM Robot Teaching Data 저장 가능한가?",
              "sort_order": 17
            },
            {
              "question_code": "FINE_TEACHING",
              "question_text": "미세 Teaching 가능한가?",
              "sort_order": 18
            },
            {
              "question_code": "MARGIN_CHECK",
              "question_text": "마진 Check 가능한가?",
              "sort_order": 19
            },
            {
              "question_code": "SEMI_AUTO_TRANSFER",
              "question_text": "Semi Auto Transfer 알고 있는가?",
              "sort_order": 20
            }
          ]
        },
        {
          "section_code": "PART_INSTALLATION",
          "section_name": "PART INSTALLATION",
          "sort_order": 9,
          "questions": [
            {
              "question_code": "EXHAUST_PORT_INSTALLATION",
              "question_text": "Exhaust Port 설치 위치와 방법을 알고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "ENDEFFECTOR_INSTALL_SANKYO",
              "question_text": "EFEM Robot EndEffector 장착이 가능한가? (SANKYO)",
              "sort_order": 2
            },
            {
              "question_code": "ENDEFFECTOR_ADJUST_SANKYO",
              "question_text": "EFEM Robot End Effector Omm Adjust 가능 한가? (SANKYO)",
              "sort_order": 3
            },
            {
              "question_code": "ENDEFFECTOR_LEVEL_SANKYO",
              "question_text": "EFEM Robot EndEffector Level 조절이 가능한가? (SANKYO)",
              "sort_order": 4
            },
            {
              "question_code": "TM_ENDEFFECTOR_INSTALL",
              "question_text": "TM Robot End Effector 장착이 가능한가?",
              "sort_order": 5
            },
            {
              "question_code": "TM_ENDEFFECTOR_ADJUST_38X",
              "question_text": "TM Robot End Effector 좌우 38Xmm Adjust 가능 한가?",
              "sort_order": 6
            },
            {
              "question_code": "TM_ENDEFFECTOR_ADJUST_16",
              "question_text": "TM Robot End Effector 상하 16mm Adjust 가능 한가?",
              "sort_order": 7
            },
            {
              "question_code": "TM_ENDEFFECTOR_LEVEL",
              "question_text": "TM Robot End Effector Level 조절이 가능한가?",
              "sort_order": 8
            },
            {
              "question_code": "PROCESS_KIT_INSTALL",
              "question_text": "Process Kit 장착이 가능한가?",
              "sort_order": 9
            },
            {
              "question_code": "PIO_SENSOR_INSTALL",
              "question_text": "PIO Sensor, Cable 장착이 가능한가?",
              "sort_order": 10
            },
            {
              "question_code": "SIGNAL_TOWER_INSTALL",
              "question_text": "Rack Signal Tower 설치가 가능한가?",
              "sort_order": 11
            },
            {
              "question_code": "WALL_LINEAR_INSTALL",
              "question_text": "Wall Linear 좌,우 구분하여 장착이 가능한가?",
              "sort_order": 12
            }
          ]
        },
        {
          "section_code": "LEAK_CHECK",
          "section_name": "LEAK CHECK",
          "sort_order": 10,
          "questions": [
            {
              "question_code": "PUMP_TURN_ON",
              "question_text": "PUMP Turn On 알고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "PM_LEAK_CHECK",
              "question_text": "PM Leak Check에 대해 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "GAS_LINE_LEAK_CHECK",
              "question_text": "Gas Line Leak Check에 대해 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "TM_LEAK_CHECK",
              "question_text": "TM Leak Check 에 대해 알고 있는가?",
              "sort_order": 4
            }
          ]
        },
        {
          "section_code": "TTTM",
          "section_name": "TTTM",
          "sort_order": 11,
          "questions": [
            {
              "question_code": "ECID_MATCHING",
              "question_text": "ECID Matching할 수 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "PUMP_PURGE_TIME",
              "question_text": "Chamber Pumping/Purge Time 조절 가능한가?",
              "sort_order": 2
            },
            {
              "question_code": "VENTING_TIME_ADJUST",
              "question_text": "Puming / Venting Time 조절 가능한가?",
              "sort_order": 3
            },
            {
              "question_code": "EPD_PEAK_OFFSET_ADJUST",
              "question_text": "EPD Peak, Offset 조절 가능한가?",
              "sort_order": 4
            },
            {
              "question_code": "TEMP_AUTOTUNE",
              "question_text": "Temp autotune 가능 한가?",
              "sort_order": 5
            },
            {
              "question_code": "SLIT_DOOR_CONTROL",
              "question_text": "Slit Door Open, Close Time 조절 가능 한가?",
              "sort_order": 6
            },
            {
              "question_code": "APC_AUTOLEARN",
              "question_text": "APC V/V Autolearn 가능 한가? (Cal Program 포함)",
              "sort_order": 7
            },
            {
              "question_code": "PART_LIST_SHEET",
              "question_text": "고객사 필수 Part List Sheet 작성이 가능한가?",
              "sort_order": 8
            },
            {
              "question_code": "PIN_ADJUST",
              "question_text": "Pin speed, height Adjust 가능 한가?",
              "sort_order": 9
            },
            {
              "question_code": "GAS_PRESSURE_CHECK",
              "question_text": "Gas Supply Pressure Check 가능 한가?",
              "sort_order": 10
            },
            {
              "question_code": "MFC_HUNTING_CHECK",
              "question_text": "MFC Normal 상태 Hunting 유/무 확인 가능 한가?",
              "sort_order": 11
            },
            {
              "question_code": "GAS_LEAK_CHECK",
              "question_text": "Gas Line Leak Check 가능 한가?",
              "sort_order": 12
            },
            {
              "question_code": "DNET_CAL",
              "question_text": "DNet Cal 가능한가?",
              "sort_order": 13
            },
            {
              "question_code": "TTTM_SHEET",
              "question_text": "TTTM Sheet 작성 가능한가?",
              "sort_order": 14
            }
          ]
        },
        {
          "section_code": "CUSTOMER_CERTIFICATION",
          "section_name": "CUSTOMER CERTIFICATION",
          "sort_order": 12,
          "questions": [
            {
              "question_code": "OHT_CERTIFICATION",
              "question_text": "OHT 인증에 대해 알고 대응 할 수 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "IMARKING_POSITION",
              "question_text": "중간인증 전 IMarking 위치 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "GND_LABELING",
              "question_text": "GND 저항값, 각 Gas 및 PCW 라인에 대해 라벨링 가능한가?",
              "sort_order": 3
            },
            {
              "question_code": "CSF_SILICONE_FINISH",
              "question_text": "CSF(Rack단) 실리콘 마감 가능한가?",
              "sort_order": 4
            },
            {
              "question_code": "MID_CERT_RESPONSE",
              "question_text": "중간인증에 대해 알고 대응 할 수 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "ENV_QUAL_RESPONSE",
              "question_text": "환경Qual에 대해 알고 대응 할 수 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "MFC_CERT_RESPONSE",
              "question_text": "MFC 인증에 대해 알고 대응 할 수 있는가?",
              "sort_order": 7
            },
            {
              "question_code": "OHT_LAYOUT_CERTIFICATION",
              "question_text": "OHT Lay Out 인증에 대해 알고 대응 할 수 있는가?",
              "sort_order": 8
            }
          ]
        },
        {
          "section_code": "PROCESS_CONFIRM",
          "section_name": "PROCESS CONFIRM",
          "sort_order": 13,
          "questions": [
            {
              "question_code": "AGING_TEST",
              "question_text": "Aging Test 알고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "AR_TEST",
              "question_text": "AR Test 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "SCRATCH_TEST",
              "question_text": "Scratch Test 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "PARTICLE_CHECK",
              "question_text": "Particle Check 알고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "EC_TOOL_MATCH",
              "question_text": "EC Tool Matching 알고 있는가?",
              "sort_order": 5
            }
          ]
        }
      ]
    },
    {
      "equipment_group_code": "ECOLITE_300",
      "checklist_kind": "MAINT",
      "template_name": "ECOLITE Maintenance Checklist",
      "version_no": 1,
      "sections": [
        {
          "section_code": "ESCORT",
          "section_name": "Escort",
          "sort_order": 1,
          "questions": [
            {
              "question_code": "LP_Escort",
              "question_text": "LP Escort",
              "sort_order": 1
            },
            {
              "question_code": "Robot_Escort",
              "question_text": "Robot Escort",
              "sort_order": 2
            }
          ]
        },
        {
          "section_code": "EFEM_ROBOT",
          "section_name": "EFEM Robot",
          "sort_order": 2,
          "questions": [
            {
              "question_code": "SR8240_Teaching",
              "question_text": "SR8240 Teaching",
              "sort_order": 1
            },
            {
              "question_code": "M124V_Teaching",
              "question_text": "M124V Teaching",
              "sort_order": 2
            },
            {
              "question_code": "M124C_Teaching",
              "question_text": "M124C Teaching",
              "sort_order": 3
            },
            {
              "question_code": "EFEM_Robot_REP",
              "question_text": "Robot REP",
              "sort_order": 4
            },
            {
              "question_code": "EFEM_Robot_Controller_REP",
              "question_text": "Robot Controller REP",
              "sort_order": 5
            }
          ]
        },
        {
          "section_code": "TM_ROBOT",
          "section_name": "TM Robot",
          "sort_order": 3,
          "questions": [
            {
              "question_code": "SR8250_Teaching",
              "question_text": "SR8250 Teaching",
              "sort_order": 1
            },
            {
              "question_code": "SR8232_Teaching",
              "question_text": "SR8232 Teaching",
              "sort_order": 2
            },
            {
              "question_code": "TM_Robot_REP",
              "question_text": "Robot REP",
              "sort_order": 3
            },
            {
              "question_code": "TM_Robot_Controller_REP",
              "question_text": "Robot Controller REP",
              "sort_order": 4
            }
          ]
        },
        {
          "section_code": "BM_MODULE",
          "section_name": "BM Module",
          "sort_order": 4,
          "questions": [
            {
              "question_code": "Pin_Cylinder",
              "question_text": "Pin Cylinder",
              "sort_order": 1
            },
            {
              "question_code": "Pusher_Cylinder",
              "question_text": "Pusher Cylinder",
              "sort_order": 2
            },
            {
              "question_code": "DRT",
              "question_text": "DRT",
              "sort_order": 3
            }
          ]
        },
        {
          "section_code": "FFU_EFEM_TM",
          "section_name": "FFU (EFEM, TM)",
          "sort_order": 5,
          "questions": [
            {
              "question_code": "FFU_Controller",
              "question_text": "FFU Controller",
              "sort_order": 1
            },
            {
              "question_code": "FFU_Fan",
              "question_text": "Fan",
              "sort_order": 2
            },
            {
              "question_code": "FFU_Motor_Driver",
              "question_text": "Motor Driver",
              "sort_order": 3
            }
          ]
        },
        {
          "section_code": "MICROWAVE",
          "section_name": "Microwave",
          "sort_order": 6,
          "questions": [
            {
              "question_code": "Microwave",
              "question_text": "Microwave",
              "sort_order": 1
            },
            {
              "question_code": "Applicator",
              "question_text": "Applicator",
              "sort_order": 2
            },
            {
              "question_code": "Applicator_Tube",
              "question_text": "Applicator Tube",
              "sort_order": 3
            },
            {
              "question_code": "Microwave_Generator",
              "question_text": "Generator",
              "sort_order": 4
            }
          ]
        },
        {
          "section_code": "RF_BIAS",
          "section_name": "RF Bias",
          "sort_order": 7,
          "questions": [
            {
              "question_code": "RF_Matcher",
              "question_text": "Matcher",
              "sort_order": 1
            },
            {
              "question_code": "RF_Generator",
              "question_text": "Generator",
              "sort_order": 2
            }
          ]
        },
        {
          "section_code": "CHUCK",
          "section_name": "Chuck",
          "sort_order": 8,
          "questions": [
            {
              "question_code": "Chuck",
              "question_text": "Chuck",
              "sort_order": 1
            }
          ]
        },
        {
          "section_code": "PROCESS_KIT",
          "section_name": "Process Kit",
          "sort_order": 9,
          "questions": [
            {
              "question_code": "Toplid_Process_Kit",
              "question_text": "Toplid Process Kit",
              "sort_order": 1
            },
            {
              "question_code": "Chamber_Process_Kit",
              "question_text": "Chamber Process Kit",
              "sort_order": 2
            }
          ]
        },
        {
          "section_code": "LEAK",
          "section_name": "Leak",
          "sort_order": 10,
          "questions": [
            {
              "question_code": "Helium_Detector",
              "question_text": "Helium Detector",
              "sort_order": 1
            }
          ]
        },
        {
          "section_code": "PIN",
          "section_name": "Pin",
          "sort_order": 11,
          "questions": [
            {
              "question_code": "Hook_Lift_Pin",
              "question_text": "Hook Lift Pin",
              "sort_order": 1
            },
            {
              "question_code": "Pin_Bellows",
              "question_text": "Bellows",
              "sort_order": 2
            },
            {
              "question_code": "Pin_Sensor",
              "question_text": "Pin Sensor",
              "sort_order": 3
            },
            {
              "question_code": "LM_Guide",
              "question_text": "LM Guide",
              "sort_order": 4
            },
            {
              "question_code": "HOOK_LIFTER_SERVO_MOTOR",
              "question_text": "HOOK LIFTER SERVO MOTOR",
              "sort_order": 5
            },
            {
              "question_code": "Pin_Motor_Controller",
              "question_text": "Pin Motor Controller",
              "sort_order": 6
            }
          ]
        },
        {
          "section_code": "EPD",
          "section_name": "EPD",
          "sort_order": 12,
          "questions": [
            {
              "question_code": "EPD_Single",
              "question_text": "Single",
              "sort_order": 1
            }
          ]
        },
        {
          "section_code": "BOARD",
          "section_name": "Board",
          "sort_order": 13,
          "questions": [
            {
              "question_code": "Gas_Box_Board",
              "question_text": "Gas Box Board",
              "sort_order": 1
            },
            {
              "question_code": "Power_Distribution_Board",
              "question_text": "Power Distribution Board",
              "sort_order": 2
            },
            {
              "question_code": "DC_Power_Supply",
              "question_text": "DC Power Supply",
              "sort_order": 3
            },
            {
              "question_code": "BM_Sensor",
              "question_text": "BM Sensor",
              "sort_order": 4
            },
            {
              "question_code": "PIO_Sensor",
              "question_text": "PIO Sensor",
              "sort_order": 5
            },
            {
              "question_code": "Safety_Module",
              "question_text": "Safety Module",
              "sort_order": 6
            },
            {
              "question_code": "IO_BOX",
              "question_text": "IO BOX",
              "sort_order": 7
            },
            {
              "question_code": "Rack_Board",
              "question_text": "Rack Board",
              "sort_order": 8
            },
            {
              "question_code": "D_NET",
              "question_text": "D-NET",
              "sort_order": 9
            }
          ]
        },
        {
          "section_code": "IGS_BLOCK",
          "section_name": "IGS Block",
          "sort_order": 14,
          "questions": [
            {
              "question_code": "IGS_MFC",
              "question_text": "MFC",
              "sort_order": 1
            },
            {
              "question_code": "IGS_Valve",
              "question_text": "Valve",
              "sort_order": 2
            }
          ]
        },
        {
          "section_code": "VALVE",
          "section_name": "Valve",
          "sort_order": 15,
          "questions": [
            {
              "question_code": "Solenoid",
              "question_text": "Solenoid",
              "sort_order": 1
            },
            {
              "question_code": "Fast_Vac_Valve",
              "question_text": "Fast Vac Valve",
              "sort_order": 2
            },
            {
              "question_code": "Slow_Vac_Valve",
              "question_text": "Slow Vac Valve",
              "sort_order": 3
            },
            {
              "question_code": "Slit_Door",
              "question_text": "Slit Door",
              "sort_order": 4
            },
            {
              "question_code": "APC_Valve",
              "question_text": "APC Valve",
              "sort_order": 5
            },
            {
              "question_code": "Shutoff_Valve",
              "question_text": "Shutoff Valve",
              "sort_order": 6
            }
          ]
        },
        {
          "section_code": "ETC",
          "section_name": "ETC",
          "sort_order": 16,
          "questions": [
            {
              "question_code": "Baratron_ASSY",
              "question_text": "Baratron Ass'y",
              "sort_order": 1
            },
            {
              "question_code": "Pirani_ASSY",
              "question_text": "Pirani Ass'y",
              "sort_order": 2
            },
            {
              "question_code": "View_Port_Quartz",
              "question_text": "View Port Quartz",
              "sort_order": 3
            },
            {
              "question_code": "Flow_Switch",
              "question_text": "Flow Switch",
              "sort_order": 4
            },
            {
              "question_code": "Monitor",
              "question_text": "Monitor",
              "sort_order": 5
            },
            {
              "question_code": "Keyboard",
              "question_text": "Keyboard",
              "sort_order": 6
            },
            {
              "question_code": "Mouse",
              "question_text": "Mouse",
              "sort_order": 7
            },
            {
              "question_code": "Water_Leak_Detector",
              "question_text": "Water Leak Detector",
              "sort_order": 8
            },
            {
              "question_code": "Manometer",
              "question_text": "Manometer",
              "sort_order": 9
            },
            {
              "question_code": "LIGHT_CURTAIN",
              "question_text": "LIGHT CURTAIN",
              "sort_order": 10
            },
            {
              "question_code": "GAS_SPRING",
              "question_text": "GAS SPRING",
              "sort_order": 11
            }
          ]
        },
        {
          "section_code": "CTR",
          "section_name": "CTR",
          "sort_order": 17,
          "questions": [
            {
              "question_code": "CTC",
              "question_text": "CTC",
              "sort_order": 1
            },
            {
              "question_code": "PMC",
              "question_text": "PMC",
              "sort_order": 2
            },
            {
              "question_code": "EDA",
              "question_text": "EDA",
              "sort_order": 3
            },
            {
              "question_code": "EFEM_CONTROLLER",
              "question_text": "EFEM CONTROLLER",
              "sort_order": 4
            }
          ]
        },
        {
          "section_code": "S_W",
          "section_name": "S/W",
          "sort_order": 18,
          "questions": [
            {
              "question_code": "SW_Patch",
              "question_text": "S/W Patch",
              "sort_order": 1
            }
          ]
        }
      ]
    },
    {
      "equipment_group_code": "GENEVA",
      "checklist_kind": "SETUP",
      "template_name": "GENEVA Setup Checklist",
      "version_no": 1,
      "sections": [
        {
          "section_code": "INSTALLATION_PREPARATION",
          "section_name": "INSTALLATION PREPARATION",
          "sort_order": 1,
          "questions": [
            {
              "question_code": "INST_IMPORT_ORDER",
              "question_text": "설비반입 순서를 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "INST_PACKING_LIST",
              "question_text": "Packing List 확인하여 반입 Part 확인이 가능 한가?",
              "sort_order": 2
            },
            {
              "question_code": "INST_OHT_LINE_CHECK",
              "question_text": "고객사에서 그린 기준선과 OHT라인이 일치하는지 확인 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "INST_SPACING_CHECK",
              "question_text": "설비간 유격거리가 충분한지 확인 알고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "INST_DRAW_SETUP",
              "question_text": "Drawing Template을 기준선에 맞춰 배치 알고 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "INST_DRAW_MARKING",
              "question_text": "Drawing Template를 펼쳐 타공, H빔 및 Adjust를 Marking 알고 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "INST_UTILITY_SPEC",
              "question_text": "타공별 Utility Spec을 숙지하고 있는가?",
              "sort_order": 7
            }
          ]
        },
        {
          "section_code": "FAB_IN",
          "section_name": "FAB IN",
          "sort_order": 2,
          "questions": [
            {
              "question_code": "FAB_MODULE_UNPACK",
              "question_text": "Module Unpacking시 주의 사항에 대해 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "FAB_MODULE_CLEAN",
              "question_text": "Module Clean시 주의 사항에 대해 숙지하고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "FAB_MODULE_MOVE",
              "question_text": "Module 이동시 주의 사항에 대해 숙지하고 있는가?",
              "sort_order": 3
            }
          ]
        },
        {
          "section_code": "DOCKING",
          "section_name": "DOCKING",
          "sort_order": 3,
          "questions": [
            {
              "question_code": "DOCK_TOOL_SIZE",
              "question_text": "장비별 Tool size를 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "DOCK_LASER_JIG",
              "question_text": "Laser Jig를 이용하여 OHT Line과 설비를 정렬 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "DOCK_JACK_USE",
              "question_text": "Jack 위치 및 사용방법을 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "DOCK_HEIGHT_CHECK",
              "question_text": "각 Module의 지면에서 frame의 높이를 알고 Spec에 맞춰 Docking 알고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "DOCK_MODULE_CONNECT",
              "question_text": "Module간 Docking 할 수 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "DOCK_REALIGN",
              "question_text": "Docking작업 중 설비와 OHT Line 정렬이 틀어졌을 경우 재정렬 알고 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "DOCK_LEVEL_POS",
              "question_text": "각 Module의 Leveler 정위치를 숙지하고 있는가?",
              "sort_order": 7
            },
            {
              "question_code": "DOCK_LEVEL_SPEC",
              "question_text": "각 Module의 Leveling Spec을 알고 Adjust를 이용, Leveling 알고 있는가?",
              "sort_order": 8
            },
            {
              "question_code": "DOCK_HOOK_UP",
              "question_text": "내부 Hook Up 알고 있는가?",
              "sort_order": 9
            }
          ]
        },
        {
          "section_code": "CABLE_HOOK_UP",
          "section_name": "CABLE HOOK UP",
          "sort_order": 4,
          "questions": [
            {
              "question_code": "CABLE_SORTING",
              "question_text": "Cable 각 Module별로 분류 알고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "CABLE_GRATING",
              "question_text": "Grating Open시 주의 사항을 숙지하고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "CABLE_LADDER_RULES",
              "question_text": "사다리 작업시 환경안전수칙을 숙지하고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "CABLE_CONNECTION",
              "question_text": "Cable을 설비에 정확히 연결 알고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "CABLE_TRAY_ARRANGE",
              "question_text": "Cable을 Tray에 규격에 맞게 정리 알고 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "CABLE_REAR_MONITOR",
              "question_text": "Rear monitor를 장착할 수 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "CABLE_EFEM_PM_SIGNAL",
              "question_text": "EFEM to PM의 Signal Cable 연결을 할 수 있는가?",
              "sort_order": 7
            },
            {
              "question_code": "CABLE_BUBBLER_PM_CONNECT",
              "question_text": "Bubbler to PM cable 연결 할 수 있는가?",
              "sort_order": 8
            },
            {
              "question_code": "CABLE_FORMIC_PM_CONNECT",
              "question_text": "Formic supply unit to PM Signal cable 연결 할 수 있는가?",
              "sort_order": 9
            }
          ]
        },
        {
          "section_code": "POWER_TURN_ON",
          "section_name": "POWER TURN ON",
          "sort_order": 5,
          "questions": [
            {
              "question_code": "POWER_GPS_UPS_SPS",
              "question_text": "GPS, UPS, SPS 의 역할과 원리에 대해 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "POWER_TURN_SEQ",
              "question_text": "Power turn on 순서를 숙지하고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "POWER_ALARM_TROUBLE",
              "question_text": "Power turn on 후 발생하는 Alram Troble Shooting 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "POWER_CB_UNDERSTAND",
              "question_text": "CB 종류와 기능을 숙지하고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "POWER_SAFETY_MODULE",
              "question_text": "Safety Module의 위치와 기능을 숙지하고 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "POWER_EMO_CHECK",
              "question_text": "EMO 동작 Check 알고 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "POWER_SYCON_NUMBER",
              "question_text": "Sycon number 별 의미하는 Part를 숙지하고 있는가?",
              "sort_order": 7
            },
            {
              "question_code": "POWER_SYCON_SETUP",
              "question_text": "Sycon 접속 및 초기 Setting을 할 수 있는가?",
              "sort_order": 8
            },
            {
              "question_code": "POWER_SYCON_TROUBLE",
              "question_text": "Sycon 실행시 통신되지않는 Part에 대해 Troble Shooting 알고 있는가?",
              "sort_order": 9
            }
          ]
        },
        {
          "section_code": "UTILITY_TURN_ON",
          "section_name": "UTILITY TURN ON",
          "sort_order": 6,
          "questions": [
            {
              "question_code": "UTIL_TURN_SEQ",
              "question_text": "Utility turn on 의 순서를 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "UTIL_VACUUM_TURN",
              "question_text": "Vacuum Turn on 및 Spec에 맞게 조정 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "UTIL_CDA_TURN",
              "question_text": "CDA Turn on 및 Spec에 맞게 조정 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "UTIL_PCW_TURN",
              "question_text": "PCW Turn on 및 Spec에 맞게 조정 알고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "UTIL_EXHAUST_TURN",
              "question_text": "각 Exhaust 위치를 알고 Turn on 을 할 수 있는가?",
              "sort_order": 5
            }
          ]
        },
        {
          "section_code": "GAS_TURN_ON",
          "section_name": "GAS TURN ON",
          "sort_order": 7,
          "questions": [
            {
              "question_code": "GAS_TURN_SEQ",
              "question_text": "Gas turn on 의 순서를 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "GAS_N2_CHECK",
              "question_text": "N2 Gas Turn on 및 가스 유입유무를 확인 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "GAS_FORMIC_CHECK",
              "question_text": "Formic Gas Turn on 및 가스 유입유무를 확인 알고 있는가?",
              "sort_order": 3
            }
          ]
        },
        {
          "section_code": "TEACHING",
          "section_name": "TEACHING",
          "sort_order": 8,
          "questions": [
            {
              "question_code": "TEACH_ROBOT_CONTROL",
              "question_text": "EFEM Robot Pendant 조작 가능한가?",
              "sort_order": 1
            },
            {
              "question_code": "TEACH_ROBOT_LEVELING",
              "question_text": "EFEM Robot Leveling 알고 있는가? (SANKYO)",
              "sort_order": 2
            },
            {
              "question_code": "TEACH_ARM_LEVELING",
              "question_text": "EFEM Robot Arm Leveling 알고 있는가? (SANKYO)",
              "sort_order": 3
            },
            {
              "question_code": "TEACH_LOAD_PORT",
              "question_text": "EFEM Robot Load Port Teaching 가능한가? (SANKYO)",
              "sort_order": 4
            },
            {
              "question_code": "TEACH_ALIGNER",
              "question_text": "EFEM Robot Aligner Teaching 가능한가? (SANKYO)",
              "sort_order": 5
            },
            {
              "question_code": "TEACH_LOADLOCK",
              "question_text": "EFEM Robot Loadlock Teaching 가능한가? (SANKYO)",
              "sort_order": 6
            },
            {
              "question_code": "TEACH_DATA_SAVE",
              "question_text": "EFEM Teaching Data 저장 가능한가?",
              "sort_order": 7
            },
            {
              "question_code": "TEACH_MICRO_ADJUST",
              "question_text": "미세 Teaching 가능한가?",
              "sort_order": 8
            },
            {
              "question_code": "TEACH_MARGIN_CHECK",
              "question_text": "마진 Check 가능한가?",
              "sort_order": 9
            },
            {
              "question_code": "TEACH_SEMI_TRANSFER",
              "question_text": "Semi Auto Transfer 알고 있는가?",
              "sort_order": 10
            }
          ]
        },
        {
          "section_code": "PART_INSTALLATION",
          "section_name": "PART INSTALLATION",
          "sort_order": 9,
          "questions": [
            {
              "question_code": "PART_EXHAUST_PORT",
              "question_text": "Exhaust Port 설치 위치와 방법을 알고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "PART_END_EFFECTOR",
              "question_text": "EFEM Robot End-Effector 장착이 가능한가? (SANKYO)",
              "sort_order": 2
            },
            {
              "question_code": "PART_END_EFFECTOR_LEVEL",
              "question_text": "EFEM Robot End-Effector Level 조절이 가능한가? (SANKYO)",
              "sort_order": 3
            },
            {
              "question_code": "PART_APC_SETUP",
              "question_text": "APC 를 장착할 수 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "PART_PROCESS_KIT",
              "question_text": "Process Kit 장착이 가능한가?",
              "sort_order": 5
            },
            {
              "question_code": "PART_PIO_SENSOR",
              "question_text": "PIO Sensor, Cable 장착이 가능한가?",
              "sort_order": 6
            },
            {
              "question_code": "PART_CCTV_SETUP",
              "question_text": "CCTV 장착 위치와 장착 할 수 있는가?",
              "sort_order": 7
            }
          ]
        },
        {
          "section_code": "LEAK_CHECK",
          "section_name": "LEAK CHECK",
          "sort_order": 10,
          "questions": [
            {
              "question_code": "LEAK_PM",
              "question_text": "PM Leak Check에 대해 알고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "LEAK_GAS_LINE",
              "question_text": "Gas Line Leak Check에 대해 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "LEAK_LL",
              "question_text": "LL Leak Check 에 대해 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "LEAK_BUBBLER",
              "question_text": "Bubbler Leak Check에 대해 알고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "LEAK_SOLENOID",
              "question_text": "Solenoid Valve leak check 방법에 대해 알고 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "LEAK_FORMIC_ON",
              "question_text": "Formic turn on 후 leak check 방법에 대해 알고 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "LEAK_FORMIC_GAS",
              "question_text": "Formic gas leak check 방법을 알고 있는가?",
              "sort_order": 7
            }
          ]
        },
        {
          "section_code": "TTTM",
          "section_name": "TTTM",
          "sort_order": 11,
          "questions": [
            {
              "question_code": "TTTM_CHUCK_LEVEL",
              "question_text": "Chuck level과 pin alignment 조정을 할 수 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "TTTM_CHUCK_SPEED",
              "question_text": "Chuck up/down speed 를 조절 할 수 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "TTTM_TEMP_CALIBRATION",
              "question_text": "Temp calibration 을 수행 할 수 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "TTTM_TEMP_PROFILE",
              "question_text": "Temp profile 동작을 수행 할 수 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "TTTM_SEASONING_TEST",
              "question_text": "Seasoning Test 진행 시 Loop 설정과 Recipe 생성을 할 수 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "TTTM_APC_AUTO_LEARN",
              "question_text": "APC Auto Learn 방법을 알고 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "TTTM_REGULATOR",
              "question_text": "Regulator를 조작하여 원하는 Gas Pressure로 설정할 수 있는가?",
              "sort_order": 7
            },
            {
              "question_code": "TTTM_MFC_ZERO_CAL",
              "question_text": "MFC Zero Cal을 실시할 수 있는가?",
              "sort_order": 8
            },
            {
              "question_code": "TTTM_HW_SETUP",
              "question_text": "H/W setup 내용을 바탕으로 작성 할 수 있는가?",
              "sort_order": 9
            },
            {
              "question_code": "TTTM_MFC_HUNTING",
              "question_text": "MFC Normal 상태 Hunting 유/무 확인 가능 한가?",
              "sort_order": 10
            },
            {
              "question_code": "TTTM_GAS_LEAK_CHECK",
              "question_text": "Gas Line Leak Check 가능 한가?",
              "sort_order": 11
            },
            {
              "question_code": "TTTM_DNET_CAL",
              "question_text": "D-Net Cal 가능한가?",
              "sort_order": 12
            },
            {
              "question_code": "TTTM_SHEET_WRITE",
              "question_text": "TTTM Sheet 작성 가능한가?",
              "sort_order": 13
            }
          ]
        },
        {
          "section_code": "CUSTOMER_CERTIFICATION",
          "section_name": "CUSTOMER CERTIFICATION",
          "sort_order": 12,
          "questions": [
            {
              "question_code": "CUST_OHT_CERT",
              "question_text": "OHT 인증에 대해 알고 대응 할 수 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "CUST_IMARK_LOC",
              "question_text": "중간인증 전 I-Marking 위치 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "CUST_LABELING",
              "question_text": "GND 저항값, 각 Gas 및 PCW 라인에 대해 라벨링 가능한가?",
              "sort_order": 3
            },
            {
              "question_code": "CUST_MID_CERT",
              "question_text": "중간인증에 대해 알고 대응 할 수 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "CUST_ENV_QUAL",
              "question_text": "환경Qual에 대해 알고 대응 할 수 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "CUST_OHT_LAYOUT",
              "question_text": "OHT Lay Out 인증에 대해 알고 대응 할 수 있는가?",
              "sort_order": 6
            }
          ]
        },
        {
          "section_code": "PROCESS_CONFIRM",
          "section_name": "PROCESS CONFIRM",
          "sort_order": 13,
          "questions": [
            {
              "question_code": "PROC_AGING_TEST",
              "question_text": "Aging Test 알고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "PROC_AR_TEST",
              "question_text": "AR Test 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "PROC_SCRATCH_TEST",
              "question_text": "Scratch Test 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "PROC_PARTICLE_CHECK",
              "question_text": "Particle Check 알고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "PROC_EES_TOOL",
              "question_text": "EES Tool Matching 알고 있는가?",
              "sort_order": 5
            }
          ]
        }
      ]
    },
    {
      "equipment_group_code": "GENEVA",
      "checklist_kind": "MAINT",
      "template_name": "GENEVA Maintenance Checklist",
      "version_no": 1,
      "sections": [
        {
          "section_code": "ESCORT",
          "section_name": "Escort",
          "sort_order": 1,
          "questions": [
            {
              "question_code": "LP_Escort",
              "question_text": "LP Escort",
              "sort_order": 1
            },
            {
              "question_code": "Robot_Escort",
              "question_text": "Robot Escort",
              "sort_order": 2
            }
          ]
        },
        {
          "section_code": "EFEM_ROBOT",
          "section_name": "EFEM Robot",
          "sort_order": 2,
          "questions": [
            {
              "question_code": "SR8240_Teaching",
              "question_text": "SR8240 Teaching",
              "sort_order": 1
            },
            {
              "question_code": "GENMARK_Robot_Teaching",
              "question_text": "GENMARK Robot Teaching",
              "sort_order": 2
            },
            {
              "question_code": "SR8240_Robot_REP",
              "question_text": "SR8240 Robot REP",
              "sort_order": 3
            },
            {
              "question_code": "GENMARK_Robot_REP",
              "question_text": "GENMARK Robot REP",
              "sort_order": 4
            },
            {
              "question_code": "Robot_Controller_REP",
              "question_text": "Robot Controller REP",
              "sort_order": 5
            }
          ]
        },
        {
          "section_code": "FFU",
          "section_name": "FFU",
          "sort_order": 3,
          "questions": [
            {
              "question_code": "FFU_Controller",
              "question_text": "FFU Controller",
              "sort_order": 1
            },
            {
              "question_code": "Fan",
              "question_text": "Fan",
              "sort_order": 2
            },
            {
              "question_code": "Motor_Driver",
              "question_text": "Motor Driver",
              "sort_order": 3
            }
          ]
        },
        {
          "section_code": "HEATER",
          "section_name": "Heater",
          "sort_order": 4,
          "questions": [
            {
              "question_code": "Elbow_Heater",
              "question_text": "Elbow Heater",
              "sort_order": 1
            },
            {
              "question_code": "Insulation_Heater",
              "question_text": "Insulation Heater",
              "sort_order": 2
            },
            {
              "question_code": "Chuck_Heater",
              "question_text": "Chuck Heater",
              "sort_order": 3
            }
          ]
        },
        {
          "section_code": "CHUCK_AND_DRIVE",
          "section_name": "Chuck & Drive",
          "sort_order": 5,
          "questions": [
            {
              "question_code": "Harmonic_Driver",
              "question_text": "Harmonic Driver",
              "sort_order": 1
            },
            {
              "question_code": "Amplifier",
              "question_text": "Amplifier (Disc Controller)",
              "sort_order": 2
            },
            {
              "question_code": "Disc_Bearing",
              "question_text": "Disc Bearing",
              "sort_order": 3
            },
            {
              "question_code": "Chuck_Leveling",
              "question_text": "Chuck Leveling",
              "sort_order": 4
            },
            {
              "question_code": "Wafer_Support_Pin_Alignment",
              "question_text": "Wafer Support Pin Alignment",
              "sort_order": 5
            },
            {
              "question_code": "Chuck_Up_Down_Status",
              "question_text": "Chuck Up & Down Status",
              "sort_order": 6
            }
          ]
        },
        {
          "section_code": "LEAK_AND_O2",
          "section_name": "Leak & O2",
          "sort_order": 6,
          "questions": [
            {
              "question_code": "O2_Leak_Test",
              "question_text": "O2 Leak Test",
              "sort_order": 1
            },
            {
              "question_code": "O2_Analyzer",
              "question_text": "O2 Analyzer 교체",
              "sort_order": 2
            },
            {
              "question_code": "O2_Controller",
              "question_text": "O2 Controller 교체",
              "sort_order": 3
            },
            {
              "question_code": "O2_Pump",
              "question_text": "O2 Pump 교체",
              "sort_order": 4
            },
            {
              "question_code": "O2_Cell",
              "question_text": "O2 Cell 교체",
              "sort_order": 5
            },
            {
              "question_code": "O2_Sample_Valve",
              "question_text": "O2 Sample Valve",
              "sort_order": 6
            }
          ]
        },
        {
          "section_code": "SEAL_AND_RING",
          "section_name": "Seal & Ring",
          "sort_order": 7,
          "questions": [
            {
              "question_code": "Ring_Seal",
              "question_text": "Ring Seal",
              "sort_order": 1
            },
            {
              "question_code": "Door_Seal",
              "question_text": "Door Seal",
              "sort_order": 2
            },
            {
              "question_code": "Ring_seal_Oring",
              "question_text": "Ring Seal O-Ring",
              "sort_order": 3
            },
            {
              "question_code": "Door_seal_Oring",
              "question_text": "Door Seal O-Ring",
              "sort_order": 4
            }
          ]
        },
        {
          "section_code": "BOARD",
          "section_name": "Board",
          "sort_order": 8,
          "questions": [
            {
              "question_code": "Gas_Box_Board",
              "question_text": "Gas Box Board",
              "sort_order": 1
            },
            {
              "question_code": "Temp_Controller_Board",
              "question_text": "Temp Controller Board",
              "sort_order": 2
            },
            {
              "question_code": "Power_Distribution_Board",
              "question_text": "Power Distribution Board",
              "sort_order": 3
            },
            {
              "question_code": "DC_Power_Supply",
              "question_text": "DC Power Supply",
              "sort_order": 4
            },
            {
              "question_code": "Facility_Board",
              "question_text": "Facility Board",
              "sort_order": 5
            },
            {
              "question_code": "Station_Board",
              "question_text": "Station Board",
              "sort_order": 6
            },
            {
              "question_code": "Bubbler_Board",
              "question_text": "Bubbler Board",
              "sort_order": 7
            },
            {
              "question_code": "D_NET",
              "question_text": "D-NET",
              "sort_order": 8
            }
          ]
        },
        {
          "section_code": "VALVE_AND_MFC",
          "section_name": "Valve & MFC",
          "sort_order": 9,
          "questions": [
            {
              "question_code": "MFC",
              "question_text": "MFC",
              "sort_order": 1
            },
            {
              "question_code": "Valve",
              "question_text": "Valve",
              "sort_order": 2
            },
            {
              "question_code": "Feed_Delivery_Valve",
              "question_text": "Feed & Delivery Valve",
              "sort_order": 3
            },
            {
              "question_code": "Fill_Vent_Valve",
              "question_text": "Fill & Vent Valve",
              "sort_order": 4
            },
            {
              "question_code": "Drain_Valve",
              "question_text": "Drain Valve",
              "sort_order": 5
            },
            {
              "question_code": "APC_Valve",
              "question_text": "APC Valve",
              "sort_order": 6
            },
            {
              "question_code": "Bypass_Valve",
              "question_text": "Bypass Valve",
              "sort_order": 7
            },
            {
              "question_code": "Shutoff_Valve",
              "question_text": "Shutoff Valve",
              "sort_order": 8
            },
            {
              "question_code": "Vac_Sol_Valve",
              "question_text": "Vac Sol Valve",
              "sort_order": 9
            },
            {
              "question_code": "Vac_CDA_Valve",
              "question_text": "Vac CDA Valve",
              "sort_order": 10
            }
          ]
        },
        {
          "section_code": "BUBBLER",
          "section_name": "Bubbler",
          "sort_order": 10,
          "questions": [
            {
              "question_code": "Bubbler_Level_Sensor",
              "question_text": "Bubbler Level Sensor",
              "sort_order": 1
            },
            {
              "question_code": "Bubbler_Flexible_Hose",
              "question_text": "Bubbler Flexible Hose",
              "sort_order": 2
            }
          ]
        },
        {
          "section_code": "ETC",
          "section_name": "ETC",
          "sort_order": 11,
          "questions": [
            {
              "question_code": "Baratron_Assy",
              "question_text": "Baratron Ass'y",
              "sort_order": 1
            },
            {
              "question_code": "View_Port",
              "question_text": "View Port",
              "sort_order": 2
            },
            {
              "question_code": "Flow_Switch",
              "question_text": "Flow Switch",
              "sort_order": 3
            },
            {
              "question_code": "LL_Door_Cylinder",
              "question_text": "LL Door Cylinder",
              "sort_order": 4
            },
            {
              "question_code": "Chuck_Cylinder",
              "question_text": "Chuck Cylinder",
              "sort_order": 5
            },
            {
              "question_code": "Monitor",
              "question_text": "Monitor",
              "sort_order": 6
            },
            {
              "question_code": "Keyboard",
              "question_text": "Keyboard",
              "sort_order": 7
            },
            {
              "question_code": "Mouse",
              "question_text": "Mouse",
              "sort_order": 8
            },
            {
              "question_code": "Water_Leak_Detector",
              "question_text": "Water Leak Detector",
              "sort_order": 9
            },
            {
              "question_code": "Formic_Detector",
              "question_text": "Formic Detector",
              "sort_order": 10
            },
            {
              "question_code": "Exhaust_Gauge",
              "question_text": "Exhaust Gauge",
              "sort_order": 11
            }
          ]
        },
        {
          "section_code": "CTR",
          "section_name": "CTR",
          "sort_order": 12,
          "questions": [
            {
              "question_code": "CTC",
              "question_text": "CTC",
              "sort_order": 1
            },
            {
              "question_code": "EDA",
              "question_text": "EDA",
              "sort_order": 2
            },
            {
              "question_code": "Temp_Limit_Controller",
              "question_text": "Temp Limit Controller",
              "sort_order": 3
            },
            {
              "question_code": "Temp_Controller",
              "question_text": "Temp Controller",
              "sort_order": 4
            }
          ]
        },
        {
          "section_code": "S_W",
          "section_name": "S/W",
          "sort_order": 13,
          "questions": [
            {
              "question_code": "SW_Patch",
              "question_text": "S/W Patch",
              "sort_order": 1
            }
          ]
        }
      ]
    },
    {
      "equipment_group_code": "HDW",
      "checklist_kind": "SETUP",
      "template_name": "HDW Setup Checklist",
      "version_no": 1,
      "sections": [
        {
          "section_code": "INSTALLATION_PREPARATION",
          "section_name": "INSTALLATION PREPARATION",
          "sort_order": 1,
          "questions": [
            {
              "question_code": "EQ_IMPORT_ORDER",
              "question_text": "설비반입 순서를 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "PACK_LIST_CHECK",
              "question_text": "Packing List 확인하여 반입 Part 확인이 가능 한가?",
              "sort_order": 2
            },
            {
              "question_code": "OHT_LINE_CHECK_GENERAL",
              "question_text": "고객사에서 그린 기준선 일치하는지 확인 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "EQ_SPACING_CHECK",
              "question_text": "설비간 유격거리가 충분한지 확인 알고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "DRAWING_TEMPLATE_SETUP",
              "question_text": "Drawing Template을 기준선에 맞춰 배치 알고 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "DRAWING_TEMPLATE_MARKING",
              "question_text": "Drawing Template를 펼쳐 타공, H빔 및 Adjust를 Marking 알고 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "POKE_POSITION_UNDERSTANDING",
              "question_text": "Wood Packaging 에서 내릴 때 장비의 Poke 위치를 알고 있는가?",
              "sort_order": 7
            },
            {
              "question_code": "UTILITY_SPEC_UNDERSTANDING",
              "question_text": "타공별 Utility Spec을 숙지하고 있는가?",
              "sort_order": 8
            }
          ]
        },
        {
          "section_code": "FAB_IN",
          "section_name": "FAB IN",
          "sort_order": 2,
          "questions": [
            {
              "question_code": "MODULE_UNPACKING_CAUTION",
              "question_text": "Module Unpacking시 주의 사항에 대해 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "MODULE_CLEAN_CAUTION",
              "question_text": "Module Clean시 주의 사항에 대해 숙지하고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "MODULE_MOVEMENT_CAUTION",
              "question_text": "Module 이동시 주의 사항에 대해 숙지하고 있는가?",
              "sort_order": 3
            }
          ]
        },
        {
          "section_code": "DOCKING",
          "section_name": "DOCKING",
          "sort_order": 3,
          "questions": [
            {
              "question_code": "TOOL_REQUIREMENT_UNDERSTANDING",
              "question_text": "장비별 필요 Tool를 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "TOOL_SIZE_UNDERSTANDING",
              "question_text": "장비별 Tool size를 숙지하고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "MODULE_HEIGHT_DOCKING",
              "question_text": "각 Module의 지면에서 frame의 높이를 알고 Spec에 맞춰 Docking 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "CASTER_JIG_SEPARATION",
              "question_text": "Caster 랑 moving jig 분리가 하는 법을 알고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "MODULE_DOCKING",
              "question_text": "Module Docking 할 수 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "DOCKING_PIPE_REALIGNMENT",
              "question_text": "Docking작업 중 설비와 배관 정렬이 틀어졌을 경우 재정렬 알고 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "CUSTOM_PIPE_REALIGNMENT",
              "question_text": "Docking작업 후 설비와 (고객요청)배관 정렬이 틀어졌을 경우 재정렬 알고 있는가?",
              "sort_order": 7
            },
            {
              "question_code": "LEVEL_CONSIDERATION_POSITION",
              "question_text": "장비의 Level 고려해야하는 위치를 숙지하고 있는가?",
              "sort_order": 8
            }
          ]
        },
        {
          "section_code": "CABLE_HOOK_UP",
          "section_name": "CABLE HOOK UP",
          "sort_order": 4,
          "questions": [
            {
              "question_code": "GRATING_OPEN_CAUTION",
              "question_text": "Grating Open시 주의 사항을 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "CABLE_CONNECTION",
              "question_text": "Cable을 설비에 정확히 연결 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "CABLE_NO_INTERFERENCE",
              "question_text": "Cable 정리를 간섭 없게 할 수 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "CN1_POSITION_UNDERSTANDING",
              "question_text": "CN1 의 위치를 알고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "SIGNAL_CABLE_PINMAP",
              "question_text": "Signal Cable의 Pin map을 알고 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "SIGNAL_CABLE_FUNCTION_EXPLANATION",
              "question_text": "Signal Cable이 무슨 역할을 하는지 설명 할 수 있는가?",
              "sort_order": 6
            }
          ]
        },
        {
          "section_code": "POWER_TURN_ON",
          "section_name": "POWER TURN ON",
          "sort_order": 5,
          "questions": [
            {
              "question_code": "GPS_UPS_UNDERSTANDING",
              "question_text": "GPS, UPS 의 역할과 원리에 대해 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "POWER_TURN_ON_SEQUENCE",
              "question_text": "Power turn on 순서를 숙지하고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "ALARM_TROUBLESHOOTING",
              "question_text": "Power turn on 후 발생하는 Alram Troble Shooting 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "RACK_CB_UNDERSTANDING",
              "question_text": "CB 종류와 기능을 숙지하고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "EMO_CHECK",
              "question_text": "EMO 동작 Check 알고 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "UTILITY_TURN_ON_SEQUENCE",
              "question_text": "Utility turn on 의 순서를 숙지하고 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "CDA_TURN_ON",
              "question_text": "CDA Turn on 및 Spec에 맞게 조정 알고 있는가?",
              "sort_order": 7
            },
            {
              "question_code": "UPW_TURN_ON",
              "question_text": "UPW Turn on 및 Spec에 맞게 조정 알고 있는가?",
              "sort_order": 8
            },
            {
              "question_code": "INLET_VALVE_OPERATION",
              "question_text": "Inlet v/v를 상황에 맞게 동작 할 수 있는가?",
              "sort_order": 9
            },
            {
              "question_code": "OUTLET_VALVE_OPERATION",
              "question_text": "Outlet v/v를 상황에 맞게 동작 할 수 있는가?",
              "sort_order": 10
            },
            {
              "question_code": "BYPASS_VALVE_OPERATION",
              "question_text": "Bypass v/v를 상황에 맞게 동작 할 수 있는가?",
              "sort_order": 11
            },
            {
              "question_code": "DRAIN_VALVE_OPERATION",
              "question_text": "Drain v/v를 상황에 맞게 동작 할 수 있는가?",
              "sort_order": 12
            }
          ]
        },
        {
          "section_code": "GAS_TURN_ON",
          "section_name": "GAS TURN ON",
          "sort_order": 6,
          "questions": [
            {
              "question_code": "GAS_TURN_ON_SEQUENCE",
              "question_text": "Gas turn on 의 순서(경로)를 숙지하고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "CDA_GAS_CHECK",
              "question_text": "CDA Turn on 및 가스 유입유무를 확인 알고 있는가?",
              "sort_order": 2
            }
          ]
        },
        {
          "section_code": "PART_INSTALLATION",
          "section_name": "PART INSTALLATION",
          "sort_order": 7,
          "questions": [
            {
              "question_code": "VALVE_INSTALLATION",
              "question_text": "Valve 설치 위치와 방법을 알고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "LEAK_SENSOR_INSTALLATION",
              "question_text": "Leak Sensor 설치 위치와 방법을 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "SIGNAL_TOWER_INSTALLATION",
              "question_text": "Signal Tower 설치 위치와 방법을 알고 있는가?",
              "sort_order": 3
            }
          ]
        },
        {
          "section_code": "LEAK_CHECK",
          "section_name": "LEAK CHECK",
          "sort_order": 8,
          "questions": [
            {
              "question_code": "HDW_LEAK_CHECK",
              "question_text": "HDW Leak Check에 대해 알고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "GAS_LINE_LEAK_CHECK",
              "question_text": "Gas Line Leak Check에 대해 알고 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "PIPE_LEAK_CHECK",
              "question_text": "배관부 Leak Check 에 대해 알고 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "UPW_LEAK_CHECK_METHOD",
              "question_text": "UPW turn on 후 leak check 방법에 대해 알고 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "LEAK_RESPONSE_ACTION",
              "question_text": "Leak 발생 시 조치 방법에 대해 알고 있는가?",
              "sort_order": 5
            }
          ]
        },
        {
          "section_code": "TTTM",
          "section_name": "TTTM",
          "sort_order": 9,
          "questions": [
            {
              "question_code": "FLOW_OFF_ADJUST",
              "question_text": "Flow Off 유량을 조정 할 수 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "FLOW_ON_ADJUST",
              "question_text": "Flow On 유량을 조정 할 수 있는가?",
              "sort_order": 2
            },
            {
              "question_code": "TEMP_SETTING",
              "question_text": "Setting Temp를 설정 할 수 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "PARAMETER_SETTING",
              "question_text": "Parameter 설정을 할 수 있는가?",
              "sort_order": 4
            },
            {
              "question_code": "TC_ADJUST",
              "question_text": "TC 설정을 조정 할 수 있는가?",
              "sort_order": 5
            },
            {
              "question_code": "OD_ADJUST",
              "question_text": "OD 조정 할 수 있는가?",
              "sort_order": 6
            },
            {
              "question_code": "PIPE_DI_LEAK_CHECK",
              "question_text": "배관부 배관 DI Leak Check 가능 한가?",
              "sort_order": 7
            }
          ]
        },
        {
          "section_code": "CUSTOMER_CERTIFICATION",
          "section_name": "CUSTOMER CERTIFICATION",
          "sort_order": 10,
          "questions": [
            {
              "question_code": "IMARKING_POSITION",
              "question_text": "중간인증 전 I-Marking 위치 알고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "GND_LABELING",
              "question_text": "GND 저항값, CDA 및 UPW 라인에 대해 라벨링 가능한가?",
              "sort_order": 2
            },
            {
              "question_code": "MID_CERT_RESPONSE",
              "question_text": "중간인증에 대해 알고 대응 할 수 있는가?",
              "sort_order": 3
            },
            {
              "question_code": "AIR_CAP_REMOVAL",
              "question_text": "Air cap의 위치 및 제거를 할 수 있는가?",
              "sort_order": 4
            }
          ]
        },
        {
          "section_code": "PROCESS_CONFIRM",
          "section_name": "PROCESS CONFIRM",
          "sort_order": 11,
          "questions": [
            {
              "question_code": "HDW_REMOTE_TEST",
              "question_text": "HDW Remote Test 알고 있는가?",
              "sort_order": 1
            },
            {
              "question_code": "HDW_LOCAL_TEST",
              "question_text": "HDW Local mode Test 알고 있는가?",
              "sort_order": 2
            }
          ]
        }
      ]
    },
    {
      "equipment_group_code": "HDW",
      "checklist_kind": "MAINT",
      "template_name": "HDW Maintenance Checklist",
      "version_no": 1,
      "sections": [
        {
          "section_code": "SECTION_1",
          "section_name": "전장부",
          "sort_order": 1,
          "questions": [
            {
              "question_code": "OD_REP",
              "question_text": "OD REP",
              "sort_order": 1
            },
            {
              "question_code": "Relay_REP",
              "question_text": "Relay REP",
              "sort_order": 2
            },
            {
              "question_code": "Fan_REP",
              "question_text": "Fan REP",
              "sort_order": 3
            },
            {
              "question_code": "NTC_NTU_REP",
              "question_text": "NTC / NTU REP",
              "sort_order": 4
            },
            {
              "question_code": "SSR_REP",
              "question_text": "SSR REP",
              "sort_order": 5
            },
            {
              "question_code": "MC_REP",
              "question_text": "MC REP",
              "sort_order": 6
            },
            {
              "question_code": "Fuse_REP",
              "question_text": "Fuse REP",
              "sort_order": 7
            },
            {
              "question_code": "CT_REP",
              "question_text": "CT REP",
              "sort_order": 8
            },
            {
              "question_code": "HBD_REP",
              "question_text": "HBD REP",
              "sort_order": 9
            },
            {
              "question_code": "SMPS_REP",
              "question_text": "SMPS REP",
              "sort_order": 10
            },
            {
              "question_code": "PLC_REP",
              "question_text": "PLC (main unit 제외) REP",
              "sort_order": 11
            },
            {
              "question_code": "ELB_REP",
              "question_text": "ELB REP",
              "sort_order": 12
            }
          ]
        },
        {
          "section_code": "SECTION_2",
          "section_name": "배관부",
          "sort_order": 2,
          "questions": [
            {
              "question_code": "Heater_REP",
              "question_text": "Heater REP (Halogen lamp)",
              "sort_order": 1
            },
            {
              "question_code": "Qtz_tank_REP",
              "question_text": "Q'tz tank REP",
              "sort_order": 2
            },
            {
              "question_code": "Leak_troubleshooting",
              "question_text": "Leak troubleshooting",
              "sort_order": 3
            },
            {
              "question_code": "Flow_meter_REP",
              "question_text": "Flow meter REP",
              "sort_order": 4
            },
            {
              "question_code": "Air_valve_REP",
              "question_text": "Air valve REP",
              "sort_order": 5
            },
            {
              "question_code": "Shut_off_valve_REP",
              "question_text": "Shut off valve REP",
              "sort_order": 6
            },
            {
              "question_code": "Sol_valve_REP",
              "question_text": "Sol valve REP",
              "sort_order": 7
            },
            {
              "question_code": "Elbow_fitting_REP",
              "question_text": "Elbow fitting REP (Qtz)",
              "sort_order": 8
            },
            {
              "question_code": "Leak_tray",
              "question_text": "Leak tray",
              "sort_order": 9
            },
            {
              "question_code": "TC_Sensor",
              "question_text": "TC Sensor",
              "sort_order": 10
            }
          ]
        },
        {
          "section_code": "SW",
          "section_name": "SW",
          "sort_order": 3,
          "questions": [
            {
              "question_code": "Touch_panel_patch",
              "question_text": "Touch panel patch",
              "sort_order": 1
            },
            {
              "question_code": "PLC_patch",
              "question_text": "PLC patch",
              "sort_order": 2
            },
            {
              "question_code": "Touch_panel_REP",
              "question_text": "Touch panel REP",
              "sort_order": 3
            },
            {
              "question_code": "PLC_REP_SW",
              "question_text": "PLC REP",
              "sort_order": 4
            }
          ]
        }
      ]
    }
  ]
};
