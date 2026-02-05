
export const MaterialType = {
  PLA: 'PLA',
  PETG: 'PETG',
  ABS: 'ABS',
  TPU: 'TPU',
  RESIN: 'Resina',
  OTHER: 'Otro'
} as const;

export type MaterialType = typeof MaterialType[keyof typeof MaterialType];

export type ProjectStatus = 'pending' | 'delivered';

export interface Filament {
  id: string;
  name: string;
  brand: string;
  material: MaterialType;
  weightGrams: number;
  price: number;
  color: string;
  remainingWeight: number;
}

export interface Accessory {
  id: string;
  name: string;
  cost: number;
}

export interface Client {
  id: string;
  name: string;
  contact: string;
}

export interface Purchase {
  id: string;
  type: 'filament' | 'accessory';
  name: string;
  amount: number;
  quantity: number;
  date: number;
}

export interface DeletedRecord {
  id: string;
  itemType: string;
  itemName: string;
  deletedAt: number;
  originalPrice?: number;
  originalProfit?: number;
  wasSold: boolean;
  originalData?: string; // JSON string del objeto completo
}

export interface GlobalConfig {
  energyRateKwh: number;
  printerPowerWatts: number;
  defaultProfitMargin: number;
  currency: string;
}

export interface ProjectAccessory {
  accessoryId: string;
  quantity: number;
}

export interface ProjectFilament {
  filamentId: string;
  gramsUsed: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  clientId?: string;
  manualPrice?: number;
  status: ProjectStatus;
  filaments: ProjectFilament[];
  accessories: ProjectAccessory[];
  printingHours: number;
  postProcessingCost: number;
  complexityMultiplier: number;
  profitMargin: number;
  createdAt: number;
}

export interface CalculationResult {
  totalFilamentCost: number;
  totalAccessoryCost: number;
  energyCost: number;
  laborCost: number;
  subtotal: number;
  complexityBonus: number;
  profitAmount: number;
  totalPrice: number;
  roundedPrice: number;
}
