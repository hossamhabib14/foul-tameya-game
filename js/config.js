'use strict';
/* Updated by Foul & Tameya Game Control Studio V5 */
const CFG = {
  "DEBUG": false,
  "WORLD": {
    "w": 2400,
    "h": 1792
  },
  "ZOOM": 0.5,
  "YFACTOR": 0.85,
  "CHAR_H": 175,
  "CUST_H": 165,
  "HELPER_H": 150,
  "WORK_SCALE": {
    "cashier": 0.62,
    "cook": 0.62
  },
  "ITEM_W": 52,
  "COUNTER_ITEM_W": 46,
  "poly": [
    [
      460,
      1000
    ],
    [
      900,
      830
    ],
    [
      1200,
      650
    ],
    [
      1750,
      570
    ],
    [
      2300,
      650
    ],
    [
      2400,
      720
    ],
    [
      2400,
      960
    ],
    [
      1900,
      1210
    ],
    [
      1500,
      1480
    ],
    [
      1100,
      1700
    ],
    [
      700,
      1700
    ],
    [
      440,
      1500
    ],
    [
      440,
      1100
    ]
  ],
  "start": {
    "x": 1420,
    "y": 1060
  },
  "spawn": {
    "x": 430,
    "y": 1520
  },
  "gate": {
    "x": 1020,
    "y": 1590
  },
  "leavePath": [
    [
      1260,
      1345
    ],
    [
      1000,
      1350
    ],
    [
      620,
      1440
    ]
  ],
  "corridorY": 1045,
  "player": {
    "speed": 300,
    "speedPerLvl": 28,
    "cap": 4
  },
  "counter": {
    "x": 1420,
    "y": 1300,
    "w": 210,
    "cap": 6,
    "capPerLvl": 2,
    "drop": {
      "x": 1430,
      "y": 1010,
      "r": 72
    }
  },
  "queue": {
    "x": 1420,
    "y": 1400,
    "dx": -60,
    "dy": 35,
    "max": 6
  },
  "desk": {
    "x": 1690,
    "y": 1290,
    "w": 230,
    "pileX": 1690,
    "pileY": 1105,
    "zone": {
      "x": 1690,
      "y": 1035,
      "r": 85
    },
    "cap": 400
  },
  "stations": {
    "foul": {
      "x": 854,
      "y": 1019,
      "w": 330,
      "cycle": 3,
      "cap": 8,
      "pickup": {
        "x": 950,
        "y": 1075,
        "r": 72
      },
      "block": [
        230,
        60
      ]
    },
    "bread": {
      "x": 1130,
      "y": 900,
      "w": 130,
      "cycle": 2.5,
      "cap": 10,
      "pickup": {
        "x": 1130,
        "y": 985,
        "r": 60
      },
      "block": [
        110,
        40
      ]
    },
    "wrap": {
      "x": 1290,
      "y": 935,
      "w": 200,
      "cycle": 1.6,
      "cap": 12,
      "input": {
        "x": 1225,
        "y": 1020,
        "r": 55
      },
      "pickup": {
        "x": 1335,
        "y": 1020,
        "r": 55
      },
      "block": [
        150,
        45
      ],
      "inCap": 6
    },
    "tameya": {
      "x": 1520,
      "y": 930,
      "w": 140,
      "cycle": 2,
      "cap": 10,
      "pickup": {
        "x": 1520,
        "y": 1015,
        "r": 60
      },
      "block": [
        120,
        40
      ]
    },
    "fries": {
      "x": 1700,
      "y": 950,
      "w": 150,
      "cycle": 2.2,
      "cap": 10,
      "pickup": {
        "x": 1700,
        "y": 1030,
        "r": 60
      },
      "block": [
        130,
        40
      ]
    },
    "eggplant": {
      "x": 1860,
      "y": 1040,
      "w": 150,
      "cycle": 2.5,
      "cap": 10,
      "pickup": {
        "x": 1860,
        "y": 1115,
        "r": 60
      },
      "block": [
        130,
        40
      ]
    }
  },
  "tables": [
    {
      "sprite": "table_blue",
      "x": 1953,
      "y": 909,
      "w": 150,
      "seats": [
        [
          -62,
          42
        ],
        [
          62,
          42
        ]
      ],
      "decor": [
        [
          "stool",
          -70,
          -28,
          52
        ],
        [
          "stool",
          70,
          -28,
          52
        ]
      ]
    },
    {
      "sprite": "table_metal",
      "x": 1985,
      "y": 756,
      "w": 190,
      "seats": [
        [
          -75,
          44
        ],
        [
          75,
          44
        ]
      ],
      "decor": [
        [
          "chair_red",
          -85,
          -34,
          68
        ],
        [
          "chair_green",
          85,
          -34,
          68
        ]
      ]
    },
    {
      "sprite": "table_round",
      "x": 1856,
      "y": 640,
      "w": 170,
      "seats": [
        [
          -78,
          30
        ],
        [
          78,
          30
        ],
        [
          -42,
          64
        ],
        [
          42,
          64
        ]
      ],
      "decor": [
        [
          "chair_blue",
          -70,
          -40,
          66
        ]
      ]
    },
    {
      "sprite": "table_round",
      "x": 1642,
      "y": 681,
      "w": 170,
      "seats": [
        [
          -78,
          30
        ],
        [
          78,
          30
        ],
        [
          -42,
          64
        ],
        [
          42,
          64
        ]
      ],
      "decor": [
        [
          "chair_red",
          70,
          -40,
          66
        ]
      ]
    },
    {
      "sprite": "table_round",
      "x": 2189,
      "y": 935,
      "w": 170,
      "seats": [
        [
          -78,
          30
        ],
        [
          78,
          30
        ],
        [
          -42,
          64
        ],
        [
          42,
          64
        ]
      ],
      "decor": [
        [
          "chair_green",
          -70,
          -40,
          66
        ]
      ]
    },
    {
      "sprite": "table_metal",
      "x": 2117,
      "y": 825,
      "w": 190,
      "seats": [
        [
          -75,
          44
        ],
        [
          75,
          44
        ],
        [
          0,
          70
        ]
      ],
      "decor": [
        [
          "chair_blue",
          -85,
          -34,
          68
        ]
      ]
    }
  ],
  "trash": {
    "x": 1336,
    "y": 660,
    "w": 220,
    "zone": {
      "x": 1489,
      "y": 563,
      "r": 80
    },
    "full": 5
  },
  "padSpots": {
    "A": [
      1150,
      1160
    ],
    "B": [
      1040,
      1235
    ]
  },
  "pads": [
    {
      "id": "bread_wrap",
      "name": "العيش والتجهيز",
      "price": 120,
      "icon": [
        "equipment",
        "wrap_table"
      ],
      "spot": "A"
    },
    {
      "id": "tameya",
      "name": "وقدة الطعمية",
      "price": 400,
      "icon": [
        "equipment",
        "gas_stove"
      ],
      "spot": "B"
    },
    {
      "id": "table",
      "name": "ترابيزة ١",
      "price": 500,
      "icon": [
        "furniture",
        "table_blue"
      ],
      "spot": "A"
    },
    {
      "id": "table",
      "name": "ترابيزة ٢",
      "price": 700,
      "icon": [
        "furniture",
        "table_metal"
      ],
      "spot": "B"
    },
    {
      "id": "carrier",
      "name": "صبي التوصيل",
      "price": 900,
      "icon": [
        "anim",
        "delivery"
      ],
      "spot": "A"
    },
    {
      "id": "trash",
      "name": "الزبالة وعامل نظافة",
      "price": 1000,
      "icon": [
        "anim",
        "helper"
      ],
      "spot": [
        610,
        1290
      ]
    },
    {
      "id": "cook",
      "name": "أسطى التجهيز",
      "price": 1600,
      "icon": [
        "anim",
        "cook"
      ],
      "spot": "B"
    },
    {
      "id": "rack",
      "name": "رف عرض إضافي",
      "price": 1800,
      "icon": [
        "equipment",
        "display_case"
      ],
      "spot": "A"
    },
    {
      "id": "fries",
      "name": "محطة البطاطس",
      "price": 2200,
      "icon": [
        "equipment",
        "topping_tray"
      ],
      "spot": "B"
    },
    {
      "id": "table",
      "name": "ترابيزة ٣",
      "price": 2500,
      "icon": [
        "furniture",
        "table_round"
      ],
      "spot": "A"
    },
    {
      "id": "table",
      "name": "ترابيزة ٤",
      "price": 3000,
      "icon": [
        "furniture",
        "table_round"
      ],
      "spot": "B"
    },
    {
      "id": "table",
      "name": "ترابيزة ٥",
      "price": 3500,
      "icon": [
        "furniture",
        "table_round"
      ],
      "spot": "A"
    },
    {
      "id": "table",
      "name": "ترابيزة ٦",
      "price": 4000,
      "icon": [
        "furniture",
        "table_metal"
      ],
      "spot": "B"
    },
    {
      "id": "cashier",
      "name": "كاشير",
      "price": 3500,
      "icon": [
        "anim",
        "cashier"
      ],
      "spot": "A"
    },
    {
      "id": "eggplant",
      "name": "محطة الباذنجان",
      "price": 5000,
      "icon": [
        "equipment",
        "topping_tray"
      ],
      "spot": "B"
    },
    {
      "id": "decor",
      "name": "زينة الشارع",
      "price": 6000,
      "icon": [
        "props",
        "bunting"
      ],
      "spot": "A"
    },
    {
      "id": "window",
      "name": "شباك التوك توك",
      "price": 8000,
      "icon": [
        "vehicles",
        "tuktuk"
      ],
      "spot": "B"
    },
    {
      "id": "branch",
      "name": "الفرع الثاني",
      "price": 15000,
      "icon": [
        "props",
        "arch_door"
      ],
      "spot": "A"
    }
  ],
  "padRx": 100,
  "padRy": 56,
  "products": {
    "sandwich_foul": 10,
    "sandwich_tameya": 12,
    "sandwich_fries": 14,
    "sandwich_eggplant": 16
  },
  "fillToSandwich": {
    "bowl_foul": "sandwich_foul",
    "tameya_balls": "sandwich_tameya",
    "fries": "sandwich_fries",
    "eggplant_plate": "sandwich_eggplant"
  },
  "customers": {
    "spawnBase": 3.4,
    "spawnMin": 1.5,
    "spawnPerLevel": 0.18,
    "patience": 25,
    "types": [
      {
        "id": "student",
        "sheet": "cust_man",
        "w": 30,
        "pat": 1,
        "tip": 0.9,
        "maxOrder": 2
      },
      {
        "id": "employee",
        "sheet": "cust_man",
        "w": 25,
        "pat": 0.6,
        "tip": 1.6,
        "maxOrder": 1
      },
      {
        "id": "house",
        "sheet": "cust_woman",
        "w": 25,
        "pat": 1,
        "tip": 1,
        "maxOrder": 3
      },
      {
        "id": "hajj",
        "sheet": "cust_elder",
        "w": 15,
        "pat": 1.8,
        "tip": 1,
        "maxOrder": 1
      },
      {
        "id": "vip",
        "sheet": "cust_man",
        "w": 5,
        "pat": 1,
        "tip": 2.5,
        "maxOrder": 2
      }
    ],
    "speed": [
      150,
      190
    ],
    "toTableChance": 0.65,
    "eatTime": [
      5,
      8
    ]
  },
  "speech": [
    "بسرعة يا أسطى!",
    "على مهلك يا ابني",
    "ربنا يفتحها عليك",
    "تسلم إيدك!",
    "ريحة الفول تجنن",
    "واحد فول وواحد طعمية"
  ],
  "workers": {
    "speed": 230,
    "cap": 3,
    "speedPerLvl": 0.1
  },
  "upgrades": [
    {
      "k": "speed",
      "name": "سرعة الأسطى",
      "base": 80,
      "max": 8
    },
    {
      "k": "cap",
      "name": "سعة الحمل",
      "base": 100,
      "max": 12
    },
    {
      "k": "prep",
      "name": "سرعة التحضير",
      "base": 120,
      "max": 10
    },
    {
      "k": "price",
      "name": "سعر البيع",
      "base": 150,
      "max": 10
    },
    {
      "k": "pat",
      "name": "صبر الزبائن",
      "base": 90,
      "max": 8
    },
    {
      "k": "ccap",
      "name": "سعة الكاونتر",
      "base": 110,
      "max": 7
    },
    {
      "k": "work",
      "name": "سرعة العمال",
      "base": 130,
      "max": 8
    }
  ],
  "upgGrowth": 1.45,
  "fameLevelDiv": 8,
  "bonus": {
    "dur": 60,
    "cd": 120,
    "mult": 2
  },
  "offline": {
    "maxSec": 7200,
    "rate": 0.25,
    "minSec": 60
  },
  "events": {
    "first": 120,
    "min": 60,
    "max": 90
  },
  "traffic": {
    "lanes": [
      {
        "x0": 2500,
        "y0": 1115,
        "x1": 1150,
        "y1": 1860
      },
      {
        "x0": 2500,
        "y0": 1280,
        "x1": 1500,
        "y1": 1840
      }
    ],
    "speed": [
      110,
      190
    ],
    "gap": 260,
    "spawn": [
      2.2,
      5
    ],
    "widths": {
      "tuktuk": 255,
      "microbus": 290,
      "pickup_truck": 290,
      "motorbike": 210,
      "scooter_delivery": 190
    },
    "stop": {
      "x": 2000,
      "lane": 0
    },
    "window": {
      "x": 1810,
      "y": 1180,
      "r": 80
    }
  },
  "decor": [
    [
      "props",
      "plant_pots",
      2425,
      813,
      150,
      ""
    ],
    [
      "props",
      "crates_wood",
      33,
      1270,
      130,
      ""
    ],
    [
      "props",
      "boxes_cardboard",
      2390,
      697,
      120,
      ""
    ],
    [
      "props",
      "bonsai_tree",
      2297,
      740,
      170,
      ""
    ],
    [
      "props",
      "palm",
      2401,
      935,
      190,
      ""
    ],
    [
      "props",
      "lantern_a",
      1330,
      880,
      46,
      "decor"
    ],
    [
      "props",
      "lantern_b",
      1480,
      880,
      40,
      "decor"
    ],
    [
      "props",
      "bunting",
      1188,
      708,
      420,
      "decor"
    ],
    [
      "props",
      "carpet",
      1191,
      710,
      260,
      "decor"
    ],
    [
      "props",
      "plant_pots",
      1700,
      1380,
      120,
      "decor"
    ]
  ],
  "sceneImg": "assets/scene/street.jpg",
  "WORKER_POSITIONS": {
    "carrier": {
      "sheet": "delivery",
      "x": 1130,
      "y": 1120
    },
    "cleaner": {
      "sheet": "helper",
      "x": 1508,
      "y": 652
    },
    "cook": {
      "sheet": "cook",
      "x": 1255,
      "y": 1000
    },
    "cashier": {
      "sheet": "cashier",
      "x": 1625,
      "y": 1040
    }
  },
  "WORKER_SIZES": {
    "cleaner": 175
  }
};
