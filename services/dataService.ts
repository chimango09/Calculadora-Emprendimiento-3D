
import { supabase } from '../lib/supabase';
import { Filament, Accessory, Client, Project, GlobalConfig, Purchase, DeletedRecord } from '../types';

const checkClient = () => {
  if (!supabase) throw new Error("Supabase no está inicializado.");
  return supabase;
};

const handleTableError = (error: any, defaultValue: any) => {
  if (error && error.code === 'PGRST205') {
    console.warn(`Aviso: La tabla solicitada no existe en Supabase.`, error.message);
    return defaultValue;
  }
  if (error) throw error;
  return null;
};

// --- LOCAL STORAGE HELPERS PARA RESTAURACIÓN ---
const saveRestoreData = (id: string, data: string) => {
  try {
    localStorage.setItem(`restore_data_${id}`, data);
  } catch (e) {
    console.warn("No hay espacio en el navegador para más respaldos.");
  }
};

const getRestoreData = (id: string) => {
  return localStorage.getItem(`restore_data_${id}`);
};

const clearRestoreData = (id: string) => {
  localStorage.removeItem(`restore_data_${id}`);
};

export const dataService = {
  // --- COMPRAS ---
  async getPurchases(): Promise<Purchase[]> {
    const client = checkClient();
    const { data, error } = await client.from('purchases').select('*').order('date', { ascending: false });
    const result = handleTableError(error, []);
    if (result !== null) return result;
    return (data || []).map(d => ({ ...d, date: Number(d.date) }));
  },

  async createPurchase(purchase: Omit<Purchase, 'id'>) {
    const client = checkClient();
    const { data, error } = await client.from('purchases').insert([purchase]).select();
    if (error) throw error;
    return data[0];
  },

  async updatePurchase(id: string, updates: Partial<Purchase>) {
    const client = checkClient();
    const { error } = await client.from('purchases').update(updates).eq('id', id);
    if (error) throw error;
  },

  async deletePurchase(id: string) {
    const client = checkClient();
    const { error } = await client.from('purchases').delete().eq('id', id);
    if (error) throw error;
  },

  // --- ELIMINADOS ---
  async getDeletedRecords(): Promise<DeletedRecord[]> {
    const client = checkClient();
    // No pedimos original_data para evitar el error de columna inexistente
    const { data, error } = await client.from('deleted_records').select('id, item_type, item_name, deleted_at, original_price, original_profit, was_sold').order('deleted_at', { ascending: false });
    const result = handleTableError(error, []);
    if (result !== null) return result;
    
    return (data || []).map(d => {
      // Intentamos recuperar los datos de restauración del almacenamiento local
      const localData = getRestoreData(d.id) || null;
      return { 
        id: d.id,
        itemType: d.item_type, 
        itemName: d.item_name,
        deletedAt: Number(d.deleted_at), 
        originalPrice: d.original_price,
        originalProfit: d.original_profit,
        wasSold: d.was_sold,
        originalData: localData as string
      };
    });
  },

  async logDeletion(record: Omit<DeletedRecord, 'id'>) {
    const client = checkClient();
    const dbData = {
      item_type: record.itemType,
      item_name: record.itemName,
      deleted_at: record.deletedAt,
      original_price: record.originalPrice,
      original_profit: record.originalProfit,
      was_sold: record.wasSold
      // original_data se omite aquí para no causar error 400
    };
    
    const { data, error } = await client.from('deleted_records').insert([dbData]).select();
    
    if (error) {
      console.error("Error guardando en papelera (Supabase):", error.message);
    } else if (data && data[0] && record.originalData) {
      // Si Supabase guardó el registro, guardamos los datos pesados en LocalStorage usando el ID de la fila
      saveRestoreData(data[0].id, record.originalData);
    }
  },

  async deleteDeletedRecord(id: string) {
    const client = checkClient();
    const { error } = await client.from('deleted_records').delete().eq('id', id);
    if (error) throw error;
    clearRestoreData(id);
  },

  // --- FILAMENTOS ---
  async getFilaments(): Promise<Filament[]> {
    const client = checkClient();
    const { data, error } = await client.from('filaments').select('*').order('name');
    const result = handleTableError(error, []);
    if (result !== null) return result;
    return (data || []).map(f => ({
      id: f.id,
      name: f.name,
      brand: f.brand,
      material: f.material,
      weightGrams: f.weight_grams,
      price: f.price,
      color: f.color,
      remainingWeight: f.remaining_weight
    }));
  },

  async createFilament(filament: Omit<Filament, 'id'>) {
    const client = checkClient();
    const dbData = {
      name: filament.name,
      brand: filament.brand,
      material: filament.material,
      weight_grams: filament.weightGrams,
      price: filament.price,
      color: filament.color,
      remaining_weight: filament.remainingWeight
    };
    const { data, error } = await client.from('filaments').insert([dbData]).select();
    if (error) throw error;
    return { ...data[0], weightGrams: data[0].weight_grams, remainingWeight: data[0].remaining_weight };
  },

  async updateFilament(id: string, updates: Partial<Filament>) {
    const client = checkClient();
    const dbUpdates: any = { ...updates };
    if (updates.weightGrams !== undefined) dbUpdates.weight_grams = updates.weightGrams;
    if (updates.remainingWeight !== undefined) dbUpdates.remaining_weight = updates.remainingWeight;
    delete dbUpdates.weightGrams;
    delete dbUpdates.remainingWeight;
    const { error } = await client.from('filaments').update(dbUpdates).eq('id', id);
    if (error) throw error;
  },

  async deleteFilament(id: string) {
    const client = checkClient();
    const { error } = await client.from('filaments').delete().eq('id', id);
    if (error) throw error;
  },

  // --- ACCESORIOS ---
  async getAccessories(): Promise<Accessory[]> {
    const client = checkClient();
    const { data, error } = await client.from('accessories').select('*').order('name');
    const result = handleTableError(error, []);
    if (result !== null) return result;
    return data || [];
  },

  async createAccessory(accessory: Omit<Accessory, 'id'>) {
    const client = checkClient();
    const { data, error } = await client.from('accessories').insert([accessory]).select();
    if (error) throw error;
    return data[0];
  },

  async updateAccessory(id: string, updates: Partial<Accessory>) {
    const client = checkClient();
    const { error } = await client.from('accessories').update(updates).eq('id', id);
    if (error) throw error;
  },

  async deleteAccessory(id: string) {
    const client = checkClient();
    const { error } = await client.from('accessories').delete().eq('id', id);
    if (error) throw error;
  },

  // --- CLIENTES ---
  async getClients(): Promise<Client[]> {
    const client = checkClient();
    const { data, error } = await client.from('clients').select('*').order('name');
    const result = handleTableError(error, []);
    if (result !== null) return result;
    return data || [];
  },

  async createClient(clientData: Omit<Client, 'id'>) {
    const client = checkClient();
    const { data, error } = await client.from('clients').insert([clientData]).select();
    if (error) throw error;
    return data[0];
  },

  async deleteClient(id: string) {
    const client = checkClient();
    const { error } = await client.from('clients').delete().eq('id', id);
    if (error) throw error;
  },

  // --- PROYECTOS ---
  async getProjects(): Promise<Project[]> {
    const client = checkClient();
    const { data, error } = await client.from('projects').select('*').order('created_at', { ascending: false });
    const result = handleTableError(error, []);
    if (result !== null) return result;
    return (data || []).map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      clientId: p.client_id,
      manualPrice: p.manual_price,
      status: p.status,
      filaments: p.filaments || [],
      accessories: p.accessories || [],
      printingHours: p.printing_hours,
      postProcessingCost: p.post_processing_cost,
      complexityMultiplier: p.complexity_multiplier,
      profitMargin: p.profit_margin,
      createdAt: Number(p.created_at)
    }));
  },

  async createProject(project: Omit<Project, 'id'>) {
    const client = checkClient();
    const dbData = {
      name: project.name,
      description: project.description,
      client_id: project.clientId,
      manual_price: project.manualPrice,
      status: project.status,
      filaments: project.filaments,
      accessories: project.accessories,
      printing_hours: project.printingHours,
      post_processing_cost: project.postProcessingCost,
      complexity_multiplier: project.complexityMultiplier,
      profit_margin: project.profitMargin,
      created_at: project.createdAt
    };
    const { data, error } = await client.from('projects').insert([dbData]).select();
    if (error) throw error;
    return { ...data[0], clientId: data[0].client_id, manualPrice: data[0].manual_price, createdAt: Number(data[0].created_at) };
  },

  async updateProject(id: string, updates: Partial<Project>) {
    const client = checkClient();
    const dbUpdates: any = { ...updates };
    if (updates.clientId !== undefined) dbUpdates.client_id = updates.clientId;
    if (updates.manualPrice !== undefined) dbUpdates.manual_price = updates.manualPrice;
    const { error } = await client.from('projects').update(dbUpdates).eq('id', id);
    if (error) throw error;
  },

  async deleteProject(id: string) {
    const client = checkClient();
    const { error } = await client.from('projects').delete().eq('id', id);
    if (error) throw error;
  },

  // --- CONFIG ---
  async getConfig(): Promise<GlobalConfig | null> {
    const client = checkClient();
    const { data, error } = await client.from('config').select('*').limit(1).maybeSingle();
    const result = handleTableError(error, null);
    if (result !== null) return result;
    return data ? {
      energyRateKwh: data.energy_rate_kwh,
      printerPowerWatts: data.printer_power_watts,
      defaultProfitMargin: data.default_profit_margin,
      currency: data.currency
    } : null;
  },

  async updateConfig(config: GlobalConfig) {
    const client = checkClient();
    const { error } = await client.from('config').upsert({
      id: 1, 
      energy_rate_kwh: config.energyRateKwh,
      printer_power_watts: config.printerPowerWatts,
      default_profit_margin: config.defaultProfitMargin,
      currency: config.currency
    });
    if (error) throw error;
  }
};
