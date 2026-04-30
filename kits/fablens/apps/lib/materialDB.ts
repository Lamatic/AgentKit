export type MaterialData = {
  biodegradable: boolean;
  waterUsage: 'low' | 'medium' | 'high';
  chemicalUse: 'low' | 'medium' | 'high';
  breathability: 'low' | 'medium' | 'high';
  irritationRisk: 'low' | 'medium' | 'high';
};

export const materialDB: Record<string, MaterialData> = {
  cotton: {
    biodegradable: true,
    waterUsage: 'high',
    chemicalUse: 'medium',
    breathability: 'high',
    irritationRisk: 'low',
  },

  polyester: {
    biodegradable: false,
    waterUsage: 'low',
    chemicalUse: 'high',
    breathability: 'low',
    irritationRisk: 'medium',
  },

  viscose: {
    biodegradable: true,
    waterUsage: 'medium',
    chemicalUse: 'high',
    breathability: 'medium',
    irritationRisk: 'medium',
  },

  linen: {
    biodegradable: true,
    waterUsage: 'low',
    chemicalUse: 'low',
    breathability: 'high',
    irritationRisk: 'low',
  },

  wool: {
    biodegradable: true,
    waterUsage: 'medium',
    chemicalUse: 'low',
    breathability: 'medium',
    irritationRisk: 'medium',
  },

  silk: {
    biodegradable: true,
    waterUsage: 'medium',
    chemicalUse: 'low',
    breathability: 'medium',
    irritationRisk: 'low',
  },

  nylon: {
    biodegradable: false,
    waterUsage: 'low',
    chemicalUse: 'high',
    breathability: 'low',
    irritationRisk: 'medium',
  },

  elastane: {
    biodegradable: false,
    waterUsage: 'low',
    chemicalUse: 'high',
    breathability: 'low',
    irritationRisk: 'medium',
  },

  acrylic: {
    biodegradable: false,
    waterUsage: 'low',
    chemicalUse: 'high',
    breathability: 'low',
    irritationRisk: 'high',
  },

  rayon: {
  biodegradable: true,
  waterUsage: 'medium',
  chemicalUse: 'high',
  breathability: 'medium',
  irritationRisk: 'medium',
}

};