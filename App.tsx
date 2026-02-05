import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  Database,
  Calculator,
  Plus,
  Trash2,
  Box,
  Pencil,
  Droplets,
  Hammer,
  Wallet,
  X,
  Check,
  User,
  Users,
  ArrowRight,
  Truck,
  ClipboardList,
  Sparkles,
  Loader2,
  LogOut,
  RotateCcw,
  ShoppingBag,
  Settings,
  Package,
  History,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Coins,
  Flame,
  Wrench,
  Archive,
  ArrowRightCircle,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Info,
  PieChart,
  MinusCircle,
} from "lucide-react";
import {
  Filament,
  Project,
  MaterialType,
  CalculationResult,
  Accessory,
  GlobalConfig,
  Client,
  ProjectStatus,
  Purchase,
  DeletedRecord,
} from "./types";
import { dataService } from "./services/dataService";
import { supabase } from "./lib/supabase";

// --- HELPERS ---
const formatAR = (val: number, decimals: number = 2) => {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val || 0);
};

// --- CUSTOM UI COMPONENTS ---

const AppModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  type = "confirm",
}: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-fade">
      <div className="bg-nordic-gray border border-nordic-bronze/30 p-8 rounded-[2rem] w-full max-w-md shadow-2xl bronze-glow">
        <div className="flex items-center gap-4 mb-6">
          <div
            className={`p-3 rounded-xl ${type === "confirm" ? "bg-nordic-bronze/10 text-nordic-bronze" : "bg-rose-500/10 text-rose-500"}`}
          >
            {type === "confirm" ? (
              <Info size={24} />
            ) : (
              <AlertCircle size={24} />
            )}
          </div>
          <h3 className="text-xl font-black text-white uppercase tracking-tight">
            {title}
          </h3>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">{message}</p>
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest text-slate-500 bg-black/20 hover:bg-black/40 transition-all"
          >
            {type === "confirm" ? "Cancelar" : "Cerrar"}
          </button>
          {type === "confirm" && (
            <button
              onClick={onConfirm}
              className="flex-1 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest bg-nordic-bronze text-nordic-black hover:bg-nordic-bronzeLight transition-all shadow-lg shadow-nordic-bronze/20"
            >
              Confirmar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const CostBreakdown = ({
  costs,
  currency,
}: {
  costs: CalculationResult;
  currency: string;
}) => (
  <div className="space-y-3 bg-black/40 p-5 rounded-2xl border border-white/5 mt-4 shadow-inner">
    <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
      <span className="text-slate-500 flex items-center gap-2">
        <Droplets size={12} /> Material Plástico
      </span>
      <span className="text-white font-mono">
        {currency}
        {formatAR(costs.totalFilamentCost, 2)}
      </span>
    </div>
    <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
      <span className="text-slate-500 flex items-center gap-2">
        <Wrench size={12} /> Complementos
      </span>
      <span className="text-white font-mono">
        {currency}
        {formatAR(costs.totalAccessoryCost, 2)}
      </span>
    </div>
    <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
      <span className="text-slate-500 flex items-center gap-2">
        <Flame size={12} /> Consumo Eléctrico
      </span>
      <span className="text-white font-mono">
        {currency}
        {formatAR(costs.energyCost, 2)}
      </span>
    </div>
    <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
      <span className="text-slate-500 flex items-center gap-2">
        <Hammer size={12} /> Mano de Obra / Post
      </span>
      <span className="text-white font-mono">
        {currency}
        {formatAR(costs.laborCost, 2)}
      </span>
    </div>
    <div className="h-px bg-white/5 my-2" />
    <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest">
      <span className="text-nordic-bronze">Coste de Producción</span>
      <span className="text-nordic-bronze font-mono">
        {currency}
        {formatAR(costs.subtotal, 2)}
      </span>
    </div>
    <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest">
      <span className="text-emerald-500">Ganancia Neta</span>
      <span className="text-emerald-500 font-mono">
        {currency}
        {formatAR(costs.profitAmount, 2)}
      </span>
    </div>
  </div>
);

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Data State
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [deletedRecords, setDeletedRecords] = useState<DeletedRecord[]>([]);
  const [config, setConfig] = useState<GlobalConfig>({
    energyRateKwh: 150.0,
    printerPowerWatts: 200,
    defaultProfitMargin: 100,
    currency: "$",
  });

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [sellingProject, setSellingProject] = useState<Project | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // Modal State
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: "confirm" | "alert";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "confirm",
  });

  const showAlert = (title: string, message: string) =>
    setModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => setModal((m) => ({ ...m, isOpen: false })),
      type: "alert",
    });
  const showConfirm = (title: string, message: string, onConfirm: () => void) =>
    setModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setModal((m) => ({ ...m, isOpen: false }));
      },
      type: "confirm",
    });

  useEffect(() => {
    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
      } catch (e: any) {
        console.error("Auth error:", e);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadAllData = async () => {
    if (!session) return;
    try {
      const [f, a, c, p, conf, pur, del] = await Promise.all([
        dataService.getFilaments().catch(() => []),
        dataService.getAccessories().catch(() => []),
        dataService.getClients().catch(() => []),
        dataService.getProjects().catch(() => []),
        dataService.getConfig().catch(() => null),
        dataService.getPurchases().catch(() => []),
        dataService.getDeletedRecords().catch(() => []),
      ]);
      setFilaments(f);
      setAccessories(a);
      setClients(c);
      setProjects(p);
      if (conf) setConfig(conf);
      setPurchases(pur);
      setDeletedRecords(del);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (session) loadAllData();
  }, [session]);

  const calculateCosts = (project: Project): CalculationResult => {
    let totalFilamentCost = 0;
    (project.filaments || []).forEach((pf) => {
      const f = filaments.find((fill) => fill.id === pf.filamentId);
      if (f) totalFilamentCost += (pf.gramsUsed * f.price) / f.weightGrams;
    });
    let totalAccessoryCost = 0;
    (project.accessories || []).forEach((pa) => {
      const acc = accessories.find((a) => a.id === pa.accessoryId);
      if (acc) totalAccessoryCost += acc.cost * pa.quantity;
    });
    const energyCost =
      project.printingHours *
      (config.printerPowerWatts / 1000) *
      config.energyRateKwh;
    const labor = Number(project.postProcessingCost) || 0;
    const baseProduction =
      totalFilamentCost + totalAccessoryCost + energyCost + labor;
    const subtotalWithRisk =
      baseProduction * (project.complexityMultiplier || 1);
    const profitAmount =
      subtotalWithRisk *
      ((project.profitMargin || config.defaultProfitMargin) / 100);
    const totalPrice = subtotalWithRisk + profitAmount;
    const roundedPrice = Math.ceil(totalPrice / 100) * 100;
    return {
      totalFilamentCost,
      totalAccessoryCost,
      energyCost,
      laborCost: labor,
      subtotal: subtotalWithRisk,
      complexityBonus: 0,
      profitAmount,
      totalPrice,
      roundedPrice,
    };
  };

  const stats = useMemo(() => {
    const deliveredProjects = projects.filter((p) => p.status === "delivered");
    const totalRevenue = deliveredProjects.reduce(
      (acc, p) => acc + (p.manualPrice || calculateCosts(p).roundedPrice),
      0,
    );
    const totalInvestment = purchases.reduce((acc, p) => acc + p.amount, 0);
    return {
      totalRevenue,
      investment: totalInvestment,
      netBalance: totalRevenue - totalInvestment,
      activeOrders: projects.filter((p) => p.status === "pending" && p.clientId)
        .length,
    };
  }, [projects, purchases, config, filaments, accessories]);

  if (loading)
    return (
      <div className="min-h-screen bg-nordic-black flex flex-col items-center justify-center gap-6">
        <Loader2 size={64} className="text-nordic-bronze animate-spin" />
        <p className="font-black text-nordic-bronze uppercase tracking-[0.3em] text-xs">
          Iniciando Taller 3D...
        </p>
      </div>
    );
  if (!session) return <AuthScreen />;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-nordic-black text-slate-300">
      <aside className="w-full md:w-80 bg-nordic-gray border-r border-white/5 p-8 flex flex-col gap-2 shadow-2xl z-[100]">
        <div className="flex items-center gap-4 mb-10">
          <div className="bg-nordic-bronze p-3 rounded-2xl text-nordic-black shadow-lg shadow-nordic-bronze/10">
            <Box size={24} />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter">
            STUDIO<span className="text-nordic-bronze">3D</span>
          </h1>
        </div>
        <nav className="flex-1 space-y-1">
          <NavButton
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
            icon={LayoutDashboard}
            label="Resumen Taller"
          />
          <NavButton
            active={activeTab === "catalog"}
            onClick={() => setActiveTab("catalog")}
            icon={ShoppingBag}
            label="Catálogo / Stock"
          />
          <NavButton
            active={activeTab === "orders"}
            onClick={() => setActiveTab("orders")}
            icon={ClipboardList}
            label="Ventas en Curso"
          />
          <NavButton
            active={activeTab === "inventory"}
            onClick={() => setActiveTab("inventory")}
            icon={Database}
            label="Insumos / Material"
          />
          <NavButton
            active={activeTab === "purchases"}
            onClick={() => setActiveTab("purchases")}
            icon={Coins}
            label="Gastos"
          />
          <NavButton
            active={activeTab === "clients"}
            onClick={() => setActiveTab("clients")}
            icon={Users}
            label="Clientes"
          />
          <div className="h-px bg-white/5 my-6" />
          <NavButton
            active={activeTab === "calculator"}
            onClick={() => {
              setEditingProject(null);
              setActiveTab("calculator");
            }}
            icon={Calculator}
            label="Cotizar Pieza"
          />
          <NavButton
            active={activeTab === "trash"}
            onClick={() => setActiveTab("trash")}
            icon={History}
            label="Papelera"
          />
          <NavButton
            active={activeTab === "config"}
            onClick={() => setActiveTab("config")}
            icon={Settings}
            label="Ajustes"
          />
        </nav>
        <button
          onClick={() => supabase.auth.signOut()}
          className="mt-8 flex items-center gap-4 px-6 py-4 text-rose-500 hover:bg-rose-950/20 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all"
        >
          <LogOut size={16} /> Salir
        </button>
      </aside>

      <main className="flex-1 p-6 md:p-12 overflow-y-auto bg-nordic-black">
        <div className="max-w-6xl mx-auto">
          {activeTab === "dashboard" && (
            <DashboardView stats={stats} currency={config.currency} />
          )}

          {activeTab === "inventory" && (
            <InventoryView
              filaments={filaments}
              accessories={accessories}
              currency={config.currency}
              onRefresh={loadAllData}
              onDeleteFilament={(f: Filament) =>
                showConfirm(
                  "Eliminar Filamento",
                  `¿Estás seguro de que quieres borrar ${f.name}?`,
                  async () => {
                    await dataService.logDeletion({
                      itemType: "filamento",
                      itemName: f.name,
                      deletedAt: Date.now(),
                      wasSold: false,
                      originalData: JSON.stringify(f),
                    });
                    await dataService.deleteFilament(f.id);
                    loadAllData();
                  },
                )
              }
              onDeleteAccessory={(a: Accessory) =>
                showConfirm(
                  "Eliminar Accesorio",
                  `¿Borrar ${a.name}?`,
                  async () => {
                    await dataService.logDeletion({
                      itemType: "accesorio",
                      itemName: a.name,
                      deletedAt: Date.now(),
                      wasSold: false,
                      originalData: JSON.stringify(a),
                    });
                    await dataService.deleteAccessory(a.id);
                    loadAllData();
                  },
                )
              }
            />
          )}

          {activeTab === "purchases" && (
            <PurchasesView
              purchases={purchases}
              currency={config.currency}
              onEdit={(p: any) => {
                setEditingPurchase(p);
                setShowPurchaseModal(true);
              }}
              onDelete={(p: Purchase) =>
                showConfirm(
                  "Eliminar Gasto",
                  "¿Borrar el registro de este gasto?",
                  async () => {
                    await dataService.logDeletion({
                      itemType: "inversión",
                      itemName: p.name,
                      deletedAt: Date.now(),
                      wasSold: false,
                      originalData: JSON.stringify(p),
                    });
                    await dataService.deletePurchase(p.id);
                    loadAllData();
                  },
                )
              }
              onAdd={() => {
                setEditingPurchase(null);
                setShowPurchaseModal(true);
              }}
            />
          )}

          {activeTab === "calculator" && (
            <ProjectForm
              filamentsList={filaments}
              accessoriesList={accessories}
              defaultConfig={config}
              initialData={editingProject}
              calculateCosts={calculateCosts}
              onGoToInventory={() => setActiveTab("inventory")}
              onSave={async (p: any) => {
                if (editingProject)
                  await dataService.updateProject(editingProject.id, p);
                else
                  await dataService.createProject({
                    ...p,
                    createdAt: Date.now(),
                  });
                await loadAllData();
                setEditingProject(null);
                setActiveTab(p.clientId ? "orders" : "catalog");
              }}
            />
          )}

          {activeTab === "catalog" && (
            <CatalogView
              projects={projects.filter((p) => !p.clientId)}
              calculateCosts={calculateCosts}
              currency={config.currency}
              onEdit={(p: any) => {
                setEditingProject(p);
                setActiveTab("calculator");
              }}
              onDelete={(p: Project) =>
                showConfirm(
                  "Eliminar Diseño",
                  `¿Borrar ${p.name} del catálogo?`,
                  async () => {
                    await dataService.logDeletion({
                      itemType: "diseño",
                      itemName: p.name,
                      deletedAt: Date.now(),
                      originalPrice: calculateCosts(p).roundedPrice,
                      originalProfit: calculateCosts(p).profitAmount,
                      wasSold: false,
                      originalData: JSON.stringify(p),
                    });
                    await dataService.deleteProject(p.id);
                    loadAllData();
                  },
                )
              }
              onSell={(p: any) => setSellingProject(p)}
            />
          )}

          {activeTab === "orders" && (
            <OrdersView
              projects={projects.filter((p) => p.clientId)}
              clients={clients}
              calculateCosts={calculateCosts}
              currency={config.currency}
              onDeliver={(p: any) =>
                showConfirm(
                  "Finalizar Venta",
                  "¿Marcar esta pieza como entregada?",
                  async () => {
                    await dataService.updateProject(p.id, {
                      status: "delivered",
                    });
                    loadAllData();
                  },
                )
              }
              onDelete={(p: Project) =>
                showConfirm(
                  "Eliminar Pedido",
                  "¿Deseas borrar este registro?",
                  async () => {
                    await dataService.logDeletion({
                      itemType: "pedido",
                      itemName: p.name,
                      deletedAt: Date.now(),
                      originalPrice:
                        p.manualPrice || calculateCosts(p).roundedPrice,
                      originalProfit: calculateCosts(p).profitAmount,
                      wasSold: p.status === "delivered",
                      originalData: JSON.stringify(p),
                    });
                    await dataService.deleteProject(p.id);
                    loadAllData();
                  },
                )
              }
            />
          )}

          {activeTab === "clients" && (
            <ClientsView
              clients={clients}
              currency={config.currency}
              onDelete={(id: string) =>
                showConfirm(
                  "Eliminar Cliente",
                  "¿Borrar este cliente?",
                  async () => {
                    await dataService.deleteClient(id);
                    loadAllData();
                  },
                )
              }
              onAdd={async (c: any) => {
                await dataService.createClient(c);
                loadAllData();
              }}
            />
          )}
          {activeTab === "config" && (
            <ConfigView
              config={config}
              onSave={async (c: any) => {
                await dataService.updateConfig(c);
                setConfig(c);
                showAlert("Ajustes Guardados", "Parámetros actualizados.");
              }}
            />
          )}
          {activeTab === "trash" && (
            <TrashView
              deletedRecords={deletedRecords}
              currency={config.currency}
              onRestore={async (r: any) => {
                try {
                  const data = JSON.parse(r.originalData);
                  delete data.id;
                  if (r.itemType === "filamento")
                    await dataService.createFilament(data);
                  else if (r.itemType === "accesorio")
                    await dataService.createAccessory(data);
                  else if (r.itemType === "diseño" || r.itemType === "pedido")
                    await dataService.createProject(data);
                  await dataService.deleteDeletedRecord(r.id);
                  loadAllData();
                  showAlert("Restauración Exitosa", "Objeto recuperado.");
                } catch (e) {
                  showAlert("Error", "No se pudo restaurar.");
                }
              }}
            />
          )}
        </div>
      </main>

      <AppModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm}
        onCancel={() => setModal((m) => ({ ...m, isOpen: false }))}
      />
      {showPurchaseModal && (
        <PurchaseModal
          editing={editingPurchase}
          onSave={async (p: any) => {
            try {
              if (editingPurchase)
                await dataService.updatePurchase(editingPurchase.id, p);
              else await dataService.createPurchase({ ...p, date: Date.now() });
              await loadAllData();
              setShowPurchaseModal(false);
              setEditingPurchase(null);
            } catch (err: any) {
              showAlert("Error", "Error al guardar el gasto.");
            }
          }}
          onClose={() => setShowPurchaseModal(false)}
        />
      )}
      {sellingProject && (
        <SelectClientModal
          clients={clients}
          onClose={() => setSellingProject(null)}
          onConfirm={async (clientId: string) => {
            const { id, ...rest } = sellingProject;
            await dataService.createProject({
              ...rest,
              clientId,
              status: "pending",
              createdAt: Date.now(),
            });
            loadAllData();
            setSellingProject(null);
            setActiveTab("orders");
          }}
        />
      )}
    </div>
  );
};

// --- SUB-VIEWS ---

const NavButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all w-full text-left group ${active ? "bg-nordic-bronze text-nordic-black font-black shadow-lg shadow-nordic-bronze/10" : "text-slate-500 hover:bg-white/5 hover:text-nordic-bronze"}`}
  >
    <Icon
      size={18}
      className={`${active ? "text-nordic-black" : "group-hover:text-nordic-bronze"}`}
    />{" "}
    <span className="text-[11px] font-black uppercase tracking-widest">
      {label}
    </span>
  </button>
);

const DashboardView = ({ stats, currency }: any) => (
  <div className="space-y-12 animate-fade">
    <header className="flex flex-col gap-2">
      <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
        Panel <span className="text-nordic-bronze italic">Maestro</span>
      </h2>
      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
        Resumen económico de tu emprendimiento 3D
      </p>
    </header>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <StatCard
        icon={TrendingUp}
        color="emerald"
        label="Ventas"
        value={stats.totalRevenue}
        sublabel="Ingresos"
        currency={currency}
      />
      <StatCard
        icon={TrendingDown}
        color="rose"
        label="Inversión"
        value={stats.investment}
        sublabel="Compras"
        currency={currency}
      />
      <div
        className={`p-8 rounded-[2.5rem] border flex flex-col gap-4 shadow-2xl transition-all ${stats.netBalance >= 0 ? "bg-emerald-950/20 border-emerald-500/30" : "bg-rose-950/20 border-rose-500/30"}`}
      >
        <div className="flex justify-between items-start">
          <div
            className={`p-3 rounded-2xl ${stats.netBalance >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}
          >
            <BarChart3 size={24} />
          </div>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">
            Utilidad Real
          </p>
          <p
            className={`text-3xl font-black tracking-tighter ${stats.netBalance >= 0 ? "text-emerald-400" : "text-rose-400"}`}
          >
            {stats.netBalance < 0 ? "-" : ""}
            {currency}
            {formatAR(Math.abs(stats.netBalance), 0)}
          </p>
        </div>
      </div>
      <div className="bg-nordic-gray p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-4 shadow-xl">
        <div className="flex justify-between items-start">
          <div className="bg-nordic-bronze/10 p-3 rounded-2xl text-nordic-bronze">
            <Package size={24} />
          </div>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">
            Pendientes
          </p>
          <p className="text-3xl font-black text-white tracking-tighter">
            {stats.activeOrders}
          </p>
        </div>
      </div>
    </div>
  </div>
);

const StatCard = ({
  icon: Icon,
  color,
  label,
  value,
  sublabel,
  currency,
}: any) => (
  <div className="bg-nordic-gray p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-4 shadow-xl">
    <div className="flex justify-between items-start">
      <div className={`bg-${color}-500/10 p-3 rounded-2xl text-${color}-500`}>
        <Icon size={24} />
      </div>
      <span
        className={`text-[9px] font-black uppercase text-${color}-500 tracking-[0.2em] bg-${color}-500/10 px-3 py-1 rounded-full`}
      >
        {label}
      </span>
    </div>
    <div>
      <p className="text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">
        {sublabel}
      </p>
      <p className="text-3xl font-black text-white tracking-tighter font-mono">
        {currency}
        {formatAR(value, 0)}
      </p>
    </div>
  </div>
);

const InventoryView = ({
  filaments,
  accessories,
  currency,
  onRefresh,
  onDeleteFilament,
  onDeleteAccessory,
}: any) => {
  const [showAddF, setShowAddF] = useState(false);
  const [newF, setNewF] = useState({
    name: "",
    brand: "",
    material: MaterialType.PLA,
    weightGrams: 1000,
    price: 0,
  });

  return (
    <div className="space-y-16 animate-fade">
      <section className="space-y-8">
        <div className="flex justify-between items-end border-b border-white/10 pb-6">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
            Stock de <span className="text-nordic-bronze">Filamentos</span>
          </h2>
          <button
            onClick={() => setShowAddF(true)}
            className="bg-nordic-bronze text-nordic-black px-8 py-4 rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-lg shadow-nordic-bronze/20 hover:scale-105 transition-all"
          >
            <Plus size={18} /> Nueva Bobina
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filaments.map((f: Filament) => (
            <div
              key={f.id}
              className="bg-nordic-gray p-8 rounded-[2.5rem] border border-white/5 relative group hover:border-nordic-bronze/40 transition-all shadow-xl overflow-hidden"
            >
              <button
                onClick={() => onDeleteFilament(f)}
                className="absolute top-6 right-6 text-rose-500/50 hover:text-rose-500 transition-all"
              >
                <Trash2 size={16} />
              </button>
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-nordic-black p-4 rounded-2xl text-nordic-bronze">
                  <Droplets size={24} />
                </div>
                <div>
                  <h4 className="font-black text-white">{f.name}</h4>
                  <p className="text-[10px] text-slate-500 uppercase font-black">
                    {f.brand} • {f.material}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase">
                  <span>Stock Restante</span>
                  <span>{Math.round(f.remainingWeight)}g</span>
                </div>
                <div className="h-1.5 bg-black rounded-full overflow-hidden">
                  <div
                    className="h-full bg-nordic-bronze"
                    style={{
                      width: `${(f.remainingWeight / f.weightGrams) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-2xl font-black text-nordic-bronze text-right font-mono">
                  {currency}
                  {formatAR(f.price, 0)}
                </p>
              </div>
            </div>
          ))}
          {filaments.length === 0 && (
            <div className="col-span-full py-20 bg-nordic-gray/50 rounded-[2.5rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-4 opacity-50">
              <Box size={48} className="text-nordic-bronze" />
              <p className="font-black uppercase tracking-widest text-xs">
                Sin filamentos registrados
              </p>
            </div>
          )}
        </div>
      </section>
      {showAddF && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-nordic-gray rounded-[2.5rem] w-full max-w-xl p-12 border border-nordic-bronze/30 shadow-2xl animate-fade">
            <h3 className="text-2xl font-black text-nordic-bronze mb-8 uppercase tracking-tighter">
              Añadir Filamento
            </h3>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <input
                placeholder="Nombre / Color"
                className="w-full bg-black/40 p-5 rounded-2xl outline-none text-white border border-white/10"
                value={newF.name}
                onChange={(e) => setNewF({ ...newF, name: e.target.value })}
              />
              <input
                placeholder="Marca"
                className="w-full bg-black/40 p-5 rounded-2xl outline-none text-white border border-white/10"
                value={newF.brand}
                onChange={(e) => setNewF({ ...newF, brand: e.target.value })}
              />
              <input
                type="number"
                placeholder="Peso Bobina (g)"
                className="w-full bg-black/40 p-5 rounded-2xl outline-none text-white border border-white/10"
                value={newF.weightGrams}
                onChange={(e) =>
                  setNewF({ ...newF, weightGrams: Number(e.target.value) })
                }
              />
              <input
                type="number"
                placeholder="Costo Bobina ($)"
                className="w-full bg-black/40 p-5 rounded-2xl outline-none text-white border border-white/10"
                value={newF.price}
                onChange={(e) =>
                  setNewF({ ...newF, price: Number(e.target.value) })
                }
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowAddF(false)}
                className="flex-1 bg-black/40 text-slate-500 py-5 rounded-2xl font-black uppercase text-xs"
              >
                Cerrar
              </button>
              <button
                onClick={async () => {
                  await dataService.createFilament({
                    ...newF,
                    remainingWeight: newF.weightGrams,
                    color: "#d4af37",
                  });
                  setShowAddF(false);
                  onRefresh();
                }}
                className="flex-1 bg-nordic-bronze text-nordic-black py-5 rounded-2xl font-black uppercase text-xs"
              >
                Guardar Bobina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProjectForm = ({
  filamentsList,
  accessoriesList,
  defaultConfig,
  initialData,
  calculateCosts,
  onSave,
  onGoToInventory,
}: any) => {
  const [formData, setFormData] = useState<any>(
    initialData || {
      name: "",
      description: "",
      filaments: [],
      accessories: [],
      printingHours: 0,
      postProcessingCost: 0,
      complexityMultiplier: 1,
      profitMargin: defaultConfig.defaultProfitMargin,
      status: "pending",
    },
  );

  const costs = calculateCosts(formData);

  const addFilament = (fid: string) => {
    if (!fid) return;
    const exists = formData.filaments.find((f: any) => f.filamentId === fid);
    if (exists) return;
    setFormData({
      ...formData,
      filaments: [...formData.filaments, { filamentId: fid, gramsUsed: 0 }],
    });
  };

  const updateFilamentGrams = (fid: string, grams: number) => {
    setFormData({
      ...formData,
      filaments: formData.filaments.map((f: any) =>
        f.filamentId === fid ? { ...f, gramsUsed: grams } : f,
      ),
    });
  };

  const removeFilament = (fid: string) => {
    setFormData({
      ...formData,
      filaments: formData.filaments.filter((f: any) => f.filamentId !== fid),
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-fade">
      <div className="space-y-8">
        <header>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
            {initialData ? "Modificar" : "Nueva"}{" "}
            <span className="text-nordic-bronze italic">Cotización</span>
          </h2>
        </header>

        <div className="bg-nordic-gray p-8 rounded-[2.5rem] border border-white/5 space-y-6 shadow-xl">
          <input
            placeholder="Nombre de la pieza"
            className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl text-white font-bold outline-none focus:border-nordic-bronze transition-all"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <textarea
            placeholder="Descripción o requerimientos técnicos..."
            className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl text-white font-bold h-24 outline-none focus:border-nordic-bronze transition-all resize-none"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </div>

        <div className="bg-nordic-gray p-8 rounded-[2.5rem] border border-white/5 space-y-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-black text-nordic-bronze uppercase tracking-[0.3em] flex items-center gap-2">
              <Droplets size={16} /> Filamentos Utilizados
            </h3>

            {filamentsList.length > 0 ? (
              <select
                onChange={(e) => addFilament(e.target.value)}
                className="bg-black/40 border-2 border-nordic-bronze/50 text-xs text-nordic-bronze font-black uppercase p-3 rounded-xl outline-none focus:border-nordic-bronze"
                value=""
              >
                <option value="">+ Agregar Filamento</option>
                {filamentsList.map((f: any) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.material})
                  </option>
                ))}
              </select>
            ) : (
              <button
                onClick={onGoToInventory}
                className="text-[9px] font-black uppercase tracking-widest bg-nordic-bronze/10 text-nordic-bronze px-4 py-2 rounded-lg border border-nordic-bronze/20 flex items-center gap-2"
              >
                <Plus size={14} /> Cargar Insumos Primero
              </button>
            )}
          </div>

          <div className="space-y-3">
            {formData.filaments.map((pf: any) => {
              const info = filamentsList.find(
                (f: any) => f.id === pf.filamentId,
              );
              return (
                <div
                  key={pf.filamentId}
                  className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl border border-white/5 group"
                >
                  <div className="w-3 h-3 rounded-full bg-nordic-bronze shadow-[0_0_8px_rgba(212,175,55,0.5)]"></div>
                  <span className="flex-1 text-xs font-black uppercase text-white truncate">
                    {info?.name || "Material"}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      className="w-20 bg-black/40 p-2 rounded-xl text-nordic-bronze text-right font-mono font-bold border border-white/10"
                      value={pf.gramsUsed}
                      onChange={(e) =>
                        updateFilamentGrams(
                          pf.filamentId,
                          Number(e.target.value),
                        )
                      }
                    />
                    <span className="text-[9px] font-black uppercase text-slate-500">
                      grs
                    </span>
                  </div>
                  <button
                    onClick={() => removeFilament(pf.filamentId)}
                    className="text-rose-500/30 hover:text-rose-500 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
            {formData.filaments.length === 0 && (
              <div className="text-center py-6 border border-dashed border-white/5 rounded-2xl opacity-30">
                <p className="text-[10px] font-black uppercase tracking-widest">
                  Sin materiales asignados
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-nordic-gray p-8 rounded-[2.5rem] border border-white/5 space-y-6 shadow-xl">
          <h3 className="text-[10px] font-black text-nordic-bronze uppercase tracking-[0.3em] flex items-center gap-2">
            <Hammer size={16} /> Parámetros de Impresión
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-[9px] font-black uppercase text-slate-500 ml-4 mb-2 block">
                Horas de Impresión
              </label>
              <input
                type="number"
                className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl text-white font-bold outline-none focus:border-nordic-bronze"
                value={formData.printingHours}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    printingHours: Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-slate-500 ml-4 mb-2 block">
                Mano de Obra ($)
              </label>
              <input
                type="number"
                className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl text-white font-bold outline-none focus:border-nordic-bronze"
                value={formData.postProcessingCost}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    postProcessingCost: Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-slate-500 ml-4 mb-2 block">
                Margen Ganancia %
              </label>
              <input
                type="number"
                className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl text-white font-bold outline-none focus:border-nordic-bronze"
                value={formData.profitMargin}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    profitMargin: Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-slate-500 ml-4 mb-2 block">
                Riesgo / Complejidad
              </label>
              <input
                type="number"
                step="0.1"
                className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl text-white font-bold outline-none focus:border-nordic-bronze"
                value={formData.complexityMultiplier}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    complexityMultiplier: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div className="lg:sticky lg:top-8 h-fit">
        <div className="bg-nordic-gray p-10 rounded-[3.5rem] border-2 border-nordic-bronze/40 shadow-2xl bronze-glow space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 text-nordic-bronze/5 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
            <Box size={240} />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">
              Presupuesto Sugerido
            </p>
            <h2 className="text-7xl font-black text-nordic-bronze tracking-tighter font-mono">
              {defaultConfig.currency}
              {formatAR(costs.roundedPrice, 0)}
            </h2>
          </div>
          <div className="relative z-10">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
              Detalle de Rentabilidad
            </h4>
            <CostBreakdown costs={costs} currency={defaultConfig.currency} />
          </div>
          <button
            onClick={() => onSave(formData)}
            className="relative z-10 w-full bg-nordic-bronze text-nordic-black py-6 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
          >
            Sellar y Guardar Registro
          </button>
        </div>
      </div>
    </div>
  );
};

// ... Resto de componentes (PurchasesView, ClientsView, etc.) se mantienen igual para asegurar estabilidad ...

const CatalogView = ({
  projects,
  calculateCosts,
  currency,
  onEdit,
  onDelete,
  onSell,
}: any) => {
  const [showDetails, setShowDetails] = useState<string | null>(null);
  return (
    <div className="space-y-12 animate-fade">
      <header className="flex justify-between items-end border-b border-white/10 pb-6">
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
          Diseños en <span className="text-nordic-bronze">Stock</span>
        </h2>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((p: any) => {
          const costs = calculateCosts(p);
          const isExpanded = showDetails === p.id;
          return (
            <div
              key={p.id}
              className="bg-nordic-gray rounded-[2.5rem] p-8 border border-white/5 bronze-glow relative group hover:border-nordic-bronze/40 transition-all flex flex-col h-full shadow-2xl"
            >
              <div className="flex justify-between mb-4">
                <h3 className="text-xl font-black text-white tracking-tight leading-tight">
                  {p.name}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(p)}
                    className="p-2 text-slate-500 hover:text-nordic-bronze"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(p)}
                    className="p-2 text-rose-500/50 hover:text-rose-500"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <p className="text-3xl font-black text-nordic-bronze mb-6 tracking-tighter font-mono">
                {currency}
                {formatAR(costs.roundedPrice, 0)}
              </p>

              <div className="flex-1">
                <button
                  onClick={() => setShowDetails(isExpanded ? null : p.id)}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-nordic-bronze mb-4 transition-colors"
                >
                  <PieChart size={14} />{" "}
                  {isExpanded ? "Ocultar Costos" : "Ver Análisis"}
                </button>
                {isExpanded && (
                  <CostBreakdown costs={costs} currency={currency} />
                )}
              </div>

              <div className="flex flex-col gap-3 mt-8">
                <button
                  onClick={() => onSell(p)}
                  className="w-full bg-white/5 text-slate-200 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-nordic-bronze/10 hover:bg-nordic-bronze hover:text-nordic-black transition-all"
                >
                  Registrar Venta
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const OrdersView = ({
  projects,
  clients,
  calculateCosts,
  currency,
  onDeliver,
  onDelete,
}: any) => {
  const [showDetails, setShowDetails] = useState<string | null>(null);
  return (
    <div className="space-y-12">
      <header className="border-b border-white/10 pb-6">
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
          Ventas <span className="text-nordic-bronze">Realizadas</span>
        </h2>
      </header>
      <div className="space-y-6">
        {projects.map((p: any) => {
          const client = clients.find((c: any) => c.id === p.clientId);
          const costs = calculateCosts(p);
          const isExpanded = showDetails === p.id;
          return (
            <div
              key={p.id}
              className={`bg-nordic-gray p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-6 shadow-xl transition-all ${p.status === "delivered" ? "opacity-40" : "bronze-glow hover:border-nordic-bronze/30"}`}
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="p-5 rounded-2xl bg-nordic-black text-nordic-bronze">
                    <Package size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                      {client?.name || "Cliente"}
                    </p>
                    <h3 className="text-2xl font-black text-white leading-none">
                      {p.name}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-12">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">
                      Cobrado
                    </p>
                    <p className="text-3xl font-black text-nordic-bronze font-mono">
                      {currency}
                      {formatAR(p.manualPrice || costs.roundedPrice, 0)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {p.status === "pending" ? (
                      <button
                        onClick={() => onDeliver(p)}
                        className="bg-nordic-bronze text-nordic-black px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-nordic-bronzeLight transition-all flex items-center gap-2"
                      >
                        <Check size={18} /> Marcar Cobrado
                      </button>
                    ) : (
                      <div className="text-emerald-500 px-10 py-4 rounded-2xl font-black text-[11px] border border-emerald-500/20 uppercase tracking-widest bg-emerald-500/5">
                        Venta Finalizada
                      </div>
                    )}
                    <button
                      onClick={() => onDelete(p)}
                      className="text-rose-500/30 p-2 hover:text-rose-500 transition-all"
                    >
                      <Trash2 size={24} />
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <button
                  onClick={() => setShowDetails(isExpanded ? null : p.id)}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                >
                  {isExpanded ? "Ocultar Desglose" : "Análisis de Rentabilidad"}
                </button>
                {isExpanded && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <CostBreakdown costs={costs} currency={currency} />
                    <div className="bg-black/20 p-8 rounded-2xl border border-white/5 space-y-4 shadow-inner">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                        Balance de Venta
                      </h4>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400">
                          Margen Profit:
                        </span>
                        <span className="text-white font-black">
                          {p.profitMargin}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400">
                          Tiempo Máquina:
                        </span>
                        <span className="text-white font-black">
                          {p.printingHours} horas
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-white/5">
                        <span className="text-xs font-black text-nordic-bronze uppercase">
                          Ganancia Limpia:
                        </span>
                        <span className="text-emerald-400 font-black font-mono text-2xl">
                          {currency}
                          {formatAR(costs.profitAmount, 2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PurchasesView = ({
  purchases,
  currency,
  onEdit,
  onDelete,
  onAdd,
}: any) => (
  <div className="space-y-12 animate-fade">
    <header className="flex justify-between items-end border-b border-white/10 pb-6">
      <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
        Inversiones en <span className="text-nordic-bronze">Insumos</span>
      </h2>
      <button
        onClick={onAdd}
        className="bg-nordic-bronze text-nordic-black px-8 py-4 rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-lg shadow-nordic-bronze/20 hover:scale-105 transition-all"
      >
        <Plus size={18} /> Registrar Gasto
      </button>
    </header>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {purchases.map((p: any) => (
        <div
          key={p.id}
          className="bg-nordic-gray p-8 rounded-[2.5rem] border border-white/5 relative group hover:border-nordic-bronze/40 transition-all shadow-xl"
        >
          <div className="flex justify-between mb-4">
            <div
              className={`p-3 rounded-xl ${p.type === "filament" ? "bg-nordic-bronze/10 text-nordic-bronze" : "bg-emerald-500/10 text-emerald-500"}`}
            >
              {p.type === "filament" ? (
                <Droplets size={20} />
              ) : (
                <Wrench size={20} />
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(p)}
                className="text-slate-500 hover:text-nordic-bronze transition-colors"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => onDelete(p)}
                className="text-rose-500/50 hover:text-rose-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <h4 className="font-black text-white text-lg mb-1">{p.name}</h4>
          <p className="text-[10px] text-slate-500 uppercase font-black mb-4">
            {new Date(p.date).toLocaleDateString()}
          </p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-black">
                Cantidad
              </p>
              <p className="text-white font-black">{p.quantity}</p>
            </div>
            <p className="text-2xl font-black text-nordic-bronze font-mono">
              {currency}
              {formatAR(p.amount, 0)}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ClientsView = ({ clients, currency, onDelete, onAdd }: any) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newC, setNewC] = useState({ name: "", contact: "" });
  return (
    <div className="space-y-12 animate-fade">
      <header className="flex justify-between items-end border-b border-white/10 pb-6">
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
          Cartera de <span className="text-nordic-bronze">Clientes</span>
        </h2>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-nordic-bronze text-nordic-black px-8 py-4 rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-lg shadow-nordic-bronze/20 hover:scale-105 transition-all"
        >
          <Plus size={18} /> Nuevo Cliente
        </button>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((c: any) => (
          <div
            key={c.id}
            className="bg-nordic-gray p-8 rounded-[2.5rem] border border-white/5 relative group hover:border-nordic-bronze/40 transition-all shadow-xl"
          >
            <button
              onClick={() => onDelete(c.id)}
              className="absolute top-6 right-6 text-rose-500/50 hover:text-rose-500 transition-all"
            >
              <Trash2 size={16} />
            </button>
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-nordic-black p-4 rounded-2xl text-nordic-bronze">
                <User size={24} />
              </div>
              <div>
                <h4 className="font-black text-white text-lg">{c.name}</h4>
                <p className="text-[10px] text-slate-500 uppercase font-black">
                  {c.contact}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {showAdd && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-nordic-gray rounded-[2.5rem] w-full max-w-md p-10 border border-nordic-bronze/30 shadow-2xl animate-fade">
            <h3 className="text-2xl font-black text-nordic-bronze mb-8 uppercase tracking-tighter">
              Añadir Cliente
            </h3>
            <div className="space-y-6 mb-8">
              <input
                placeholder="Nombre Completo"
                className="w-full bg-black/40 p-5 rounded-2xl outline-none text-white border border-white/10"
                value={newC.name}
                onChange={(e) => setNewC({ ...newC, name: e.target.value })}
              />
              <input
                placeholder="Contacto (WhatsApp o Redes)"
                className="w-full bg-black/40 p-5 rounded-2xl outline-none text-white border border-white/10"
                value={newC.contact}
                onChange={(e) => setNewC({ ...newC, contact: e.target.value })}
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 bg-black/40 text-slate-500 py-5 rounded-2xl font-black uppercase text-xs"
              >
                Cerrar
              </button>
              <button
                onClick={async () => {
                  await onAdd(newC);
                  setShowAdd(false);
                  setNewC({ name: "", contact: "" });
                }}
                className="flex-1 bg-nordic-bronze text-nordic-black py-5 rounded-2xl font-black uppercase text-xs"
              >
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ConfigView = ({ config, onSave }: any) => {
  const [formData, setFormData] = useState(config);
  return (
    <div className="max-w-2xl mx-auto space-y-12 animate-fade">
      <header className="border-b border-white/10 pb-6 text-center">
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
          Parámetros del <span className="text-nordic-bronze">Taller</span>
        </h2>
      </header>
      <div className="bg-nordic-gray p-10 rounded-[3rem] border border-white/5 space-y-8 shadow-2xl">
        <div className="grid grid-cols-1 gap-8">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 ml-4 mb-2 block">
              Costo Energía ($/KWh)
            </label>
            <input
              type="number"
              className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl text-white font-bold outline-none focus:border-nordic-bronze"
              value={formData.energyRateKwh}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  energyRateKwh: Number(e.target.value),
                })
              }
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 ml-4 mb-2 block">
              Potencia Impresora (Watts)
            </label>
            <input
              type="number"
              className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl text-white font-bold outline-none focus:border-nordic-bronze"
              value={formData.printerPowerWatts}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  printerPowerWatts: Number(e.target.value),
                })
              }
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 ml-4 mb-2 block">
              Ganancia Base (%)
            </label>
            <input
              type="number"
              className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl text-white font-bold outline-none focus:border-nordic-bronze"
              value={formData.defaultProfitMargin}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  defaultProfitMargin: Number(e.target.value),
                })
              }
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 ml-4 mb-2 block">
              Moneda
            </label>
            <input
              className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl text-white font-bold outline-none focus:border-nordic-bronze"
              value={formData.currency}
              onChange={(e) =>
                setFormData({ ...formData, currency: e.target.value })
              }
            />
          </div>
        </div>
        <button
          onClick={() => onSave(formData)}
          className="w-full bg-nordic-bronze text-nordic-black py-6 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-[1.02] transition-all"
        >
          Sincronizar Taller
        </button>
      </div>
    </div>
  );
};

const TrashView = ({ deletedRecords, currency, onRestore }: any) => (
  <div className="space-y-12 animate-fade">
    <header className="border-b border-white/10 pb-6">
      <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
        Papelera de <span className="text-nordic-bronze">Residuos</span>
      </h2>
      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">
        Los elementos restaurados vuelven a sus listas originales
      </p>
    </header>
    <div className="space-y-4">
      {deletedRecords.map((r: any) => (
        <div
          key={r.id}
          className="bg-nordic-gray p-6 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-nordic-bronze/20 transition-all"
        >
          <div className="flex items-center gap-6">
            <div className="p-4 rounded-2xl bg-nordic-black text-slate-500">
              <Archive size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black text-nordic-bronze uppercase tracking-widest mb-1">
                {r.itemType}
              </p>
              <h4 className="font-black text-white">{r.itemName}</h4>
              <p className="text-[10px] text-slate-600 font-bold uppercase">
                {new Date(r.deletedAt).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={() => onRestore(r)}
            className="bg-white/5 text-slate-300 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-nordic-bronze hover:text-nordic-black transition-all flex items-center gap-2"
          >
            <RotateCcw size={14} /> Recuperar
          </button>
        </div>
      ))}
      {deletedRecords.length === 0 && (
        <div className="text-center py-20 opacity-20">
          <Archive size={64} className="mx-auto mb-4" />
          <p className="font-black uppercase tracking-[0.3em] text-xs">
            La papelera está vacía
          </p>
        </div>
      )}
    </div>
  </div>
);

const PurchaseModal = ({ editing, onSave, onClose }: any) => {
  const [formData, setFormData] = useState(
    editing || { name: "", type: "filament", quantity: 1, amount: 0 },
  );
  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-fade">
      <div className="bg-nordic-gray rounded-[2.5rem] w-full max-w-md p-10 border border-nordic-bronze/30 shadow-2xl">
        <h3 className="text-2xl font-black text-nordic-bronze mb-8 uppercase tracking-tighter">
          {editing ? "Editar Gasto" : "Nuevo Gasto"}
        </h3>
        <div className="space-y-6 mb-8">
          <input
            placeholder="Concepto (Ej: Bobina PLA Roja)"
            className="w-full bg-black/40 p-5 rounded-2xl outline-none text-white border border-white/10"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <div className="flex gap-4">
            <button
              onClick={() => setFormData({ ...formData, type: "filament" })}
              className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all ${formData.type === "filament" ? "bg-nordic-bronze text-nordic-black border-nordic-bronze" : "bg-black/20 text-slate-500 border-white/5"}`}
            >
              Material
            </button>
            <button
              onClick={() => setFormData({ ...formData, type: "accessory" })}
              className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all ${formData.type === "accessory" ? "bg-emerald-500 text-nordic-black border-emerald-500" : "bg-black/20 text-slate-500 border-white/5"}`}
            >
              Insumos / Otros
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-black uppercase text-slate-500 ml-4 mb-2 block">
                Cantidad
              </label>
              <input
                type="number"
                className="w-full bg-black/40 p-5 rounded-2xl outline-none text-white border border-white/10"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-slate-500 ml-4 mb-2 block">
                Costo Total
              </label>
              <input
                type="number"
                className="w-full bg-black/40 p-5 rounded-2xl outline-none text-white border border-white/10"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: Number(e.target.value) })
                }
              />
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 bg-black/40 text-slate-500 py-5 rounded-2xl font-black uppercase text-xs"
          >
            Cerrar
          </button>
          <button
            onClick={() => onSave(formData)}
            className="flex-1 bg-nordic-bronze text-nordic-black py-5 rounded-2xl font-black uppercase text-xs"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

const SelectClientModal = ({ clients, onClose, onConfirm }: any) => {
  const [selected, setSelected] = useState("");
  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-fade">
      <div className="bg-nordic-gray rounded-[2.5rem] w-full max-w-md p-10 border border-nordic-bronze/30 shadow-2xl">
        <h3 className="text-2xl font-black text-nordic-bronze mb-8 uppercase tracking-tighter text-center">
          Finalizar Venta
        </h3>
        <p className="text-[10px] text-slate-500 uppercase font-black text-center mb-8 tracking-widest">
          Elige el cliente para cerrar el pedido
        </p>
        <div className="space-y-3 mb-8 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {clients.map((c: any) => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={`w-full p-6 rounded-2xl border flex items-center justify-between transition-all ${selected === c.id ? "bg-nordic-bronze border-nordic-bronze text-nordic-black" : "bg-black/20 border-white/5 text-white hover:border-white/20"}`}
            >
              <span className="font-black uppercase text-xs tracking-widest">
                {c.name}
              </span>
              {selected === c.id && <Check size={18} />}
            </button>
          ))}
          {clients.length === 0 && (
            <p className="text-center text-rose-500 font-bold uppercase text-[10px] py-4">
              No hay clientes registrados en la cartera
            </p>
          )}
        </div>
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 bg-black/40 text-slate-500 py-5 rounded-2xl font-black uppercase text-xs"
          >
            Cancelar
          </button>
          <button
            disabled={!selected}
            onClick={() => onConfirm(selected)}
            className="flex-1 bg-nordic-bronze text-nordic-black py-5 rounded-2xl font-black uppercase text-xs disabled:opacity-20"
          >
            Confirmar Venta
          </button>
        </div>
      </div>
    </div>
  );
};

const AuthScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const handleAuth = async (e: any) => {
    e.preventDefault();
    if (isLogin) {
      await supabase.auth.signInWithPassword({ email, password });
    } else {
      await supabase.auth.signUp({ email, password });
    }
  };
  return (
    <div className="min-h-screen bg-nordic-black flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.03)_0%,_transparent_70%)] pointer-events-none"></div>
      <div className="w-full max-w-md bg-nordic-gray rounded-[3rem] p-12 border border-white/5 shadow-2xl relative overflow-hidden bronze-glow animate-fade">
        <div className="text-center mb-12">
          <div className="bg-nordic-bronze w-20 h-20 rounded-[1.5rem] flex items-center justify-center text-nordic-black mx-auto mb-8 shadow-2xl shadow-nordic-bronze/30">
            <Box size={40} />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">
            STUDIO<span className="text-nordic-bronze">3D</span>
          </h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.4em] mt-4">
            Emprendimiento de Impresión
          </p>
        </div>
        <form onSubmit={handleAuth} className="space-y-6">
          <input
            required
            type="email"
            placeholder="Email de Usuario"
            className="w-full bg-black/40 border border-white/10 rounded-2xl px-8 py-5 font-bold outline-none text-white focus:border-nordic-bronze transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            required
            type="password"
            placeholder="Clave Maestra"
            className="w-full bg-black/40 border border-white/10 rounded-2xl px-8 py-5 font-bold outline-none text-white focus:border-nordic-bronze transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="w-full bg-nordic-bronze text-nordic-black py-6 rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl hover:bg-nordic-bronzeLight active:scale-95 transition-all"
          >
            {isLogin ? "Entrar al Taller" : "Crear Taller"}
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="w-full text-slate-500 font-bold uppercase text-[10px] tracking-widest hover:text-nordic-bronze transition-colors"
          >
            {isLogin
              ? "¿Abrir nuevo taller? Regístrate"
              : "¿Ya tienes taller? Accede"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;
