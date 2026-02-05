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
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
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
        <Droplets size={12} /> Material
      </span>
      <span className="text-white font-mono">
        {currency}
        {formatAR(costs.totalFilamentCost, 2)}
      </span>
    </div>
    <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
      <span className="text-slate-500 flex items-center gap-2">
        <Wrench size={12} /> Accesorios
      </span>
      <span className="text-white font-mono">
        {currency}
        {formatAR(costs.totalAccessoryCost, 2)}
      </span>
    </div>
    <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
      <span className="text-slate-500 flex items-center gap-2">
        <Flame size={12} /> Energía
      </span>
      <span className="text-white font-mono">
        {currency}
        {formatAR(costs.energyCost, 2)}
      </span>
    </div>
    <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
      <span className="text-slate-500 flex items-center gap-2">
        <Hammer size={12} /> Mano de Obra
      </span>
      <span className="text-white font-mono">
        {currency}
        {formatAR(costs.laborCost, 2)}
      </span>
    </div>
    <div className="h-px bg-white/5 my-2" />
    <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest">
      <span className="text-nordic-bronze">Costo Total Producción</span>
      <span className="text-nordic-bronze font-mono">
        {currency}
        {formatAR(costs.subtotal, 2)}
      </span>
    </div>
    <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest">
      <span className="text-emerald-500">Beneficio Neto</span>
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
          Cargando Studio 3D...
        </p>
      </div>
    );
  if (!session) return <AuthScreen />;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-nordic-black text-slate-300">
      {/* Sidebar */}
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
            label="Panel de Control"
          />
          <NavButton
            active={activeTab === "catalog"}
            onClick={() => setActiveTab("catalog")}
            icon={ShoppingBag}
            label="Catálogo de Diseños"
          />
          <NavButton
            active={activeTab === "orders"}
            onClick={() => setActiveTab("orders")}
            icon={ClipboardList}
            label="Pedidos Activos"
          />
          <NavButton
            active={activeTab === "inventory"}
            onClick={() => setActiveTab("inventory")}
            icon={Database}
            label="Gestión de Insumos"
          />
          <NavButton
            active={activeTab === "purchases"}
            onClick={() => setActiveTab("purchases")}
            icon={Coins}
            label="Inversiones"
          />
          <NavButton
            active={activeTab === "clients"}
            onClick={() => setActiveTab("clients")}
            icon={Users}
            label="Cartera de Clientes"
          />
          <div className="h-px bg-white/5 my-6" />
          <NavButton
            active={activeTab === "calculator"}
            onClick={() => {
              setEditingProject(null);
              setActiveTab("calculator");
            }}
            icon={Calculator}
            label="Nueva Cotización"
          />
          <NavButton
            active={activeTab === "trash"}
            onClick={() => setActiveTab("trash")}
            icon={History}
            label="Historial de Papelera"
          />
          <NavButton
            active={activeTab === "config"}
            onClick={() => setActiveTab("config")}
            icon={Settings}
            label="Configuración"
          />
        </nav>
        <button
          onClick={() => supabase.auth.signOut()}
          className="mt-8 flex items-center gap-4 px-6 py-4 text-rose-500 hover:bg-rose-950/20 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all"
        >
          <LogOut size={16} /> Cerrar Sesión
        </button>
      </aside>

      {/* Main Content */}
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
                  "Eliminar Inversión",
                  "¿Borrar el registro de esta inversión?",
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
                  "Completar Pedido",
                  "¿Marcar esta pieza como entregada y cobrada?",
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
                  "¿Deseas borrar este pedido?",
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
                  "¿Borrar este cliente de la cartera?",
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
                showAlert(
                  "Configuración Guardada",
                  "Los parámetros del taller han sido actualizados.",
                );
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
                  showAlert(
                    "Restauración Exitosa",
                    "El elemento ha vuelto al taller.",
                  );
                } catch (e) {
                  showAlert("Error", "No se pudo restaurar el objeto.");
                }
              }}
            />
          )}
        </div>
      </main>

      {/* Modals */}
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
              showAlert("Error", "No se pudo guardar la inversión.");
            }
          }}
          onClose={() => setShowPurchaseModal(false)}
        />
      )}
      {sellingProject && (
        <SelectClientModal
          clients={clients}
          onClose={() => setSellingProject(null)}
          onConfirm={async (clientId) => {
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
  <div className="space-y-12 animate-in fade-in duration-700">
    <header className="flex flex-col gap-2">
      <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
        Panel de <span className="text-nordic-bronze italic">Gestión</span>
      </h2>
      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
        Resumen financiero y actividad del taller
      </p>
    </header>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <StatCard
        icon={TrendingUp}
        color="emerald"
        label="Ventas"
        value={stats.totalRevenue}
        sublabel="Ingresos Totales"
        currency={currency}
      />
      <StatCard
        icon={TrendingDown}
        color="rose"
        label="Inversión"
        value={stats.investment}
        sublabel="Gastos de Insumos"
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
            Balance de Caja
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
            Pedidos en Curso
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
      <p className="text-3xl font-black text-white tracking-tighter">
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
    <div className="space-y-16 animate-in slide-in-from-bottom-4">
      <section className="space-y-8">
        <div className="flex justify-between items-end border-b border-white/10 pb-6">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
            Control de <span className="text-nordic-bronze">Filamentos</span>
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
        </div>
      </section>
      {showAddF && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-nordic-gray rounded-[2.5rem] w-full max-w-xl p-12 border border-nordic-bronze/30 shadow-2xl">
            <h3 className="text-2xl font-black text-nordic-bronze mb-8 uppercase tracking-tighter">
              Registrar Material
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
                placeholder="Peso Inicial (g)"
                className="w-full bg-black/40 p-5 rounded-2xl outline-none text-white border border-white/10"
                value={newF.weightGrams}
                onChange={(e) =>
                  setNewF({ ...newF, weightGrams: Number(e.target.value) })
                }
              />
              <input
                type="number"
                placeholder="Costo ($)"
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
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="flex justify-between items-end border-b border-white/10 pb-6">
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
          Catálogo de <span className="text-nordic-bronze">Diseños</span>
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
                  {isExpanded ? "Ocultar Desglose" : "Ver Desglose de Costos"}
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
          Gestión de <span className="text-nordic-bronze">Pedidos</span>
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
                      {client?.name || "Cliente Particular"}
                    </p>
                    <h3 className="text-2xl font-black text-white leading-none">
                      {p.name}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-12">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">
                      Precio Final
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
                        <Check size={18} /> Marcar Entregado
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
                  {isExpanded
                    ? "Ocultar Análisis de Costos"
                    : "Ver Análisis de Rentabilidad"}
                </button>
                {isExpanded && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-2">
                    <CostBreakdown costs={costs} currency={currency} />
                    <div className="bg-black/20 p-8 rounded-2xl border border-white/5 space-y-4 shadow-inner">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
                        Resumen de Rentabilidad
                      </h4>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400">
                          Margen Aplicado:
                        </span>
                        <span className="text-white font-black">
                          {p.profitMargin}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400">
                          Horas Máquina:
                        </span>
                        <span className="text-white font-black">
                          {p.printingHours}h
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-white/5">
                        <span className="text-xs font-black text-nordic-bronze uppercase">
                          Ganancia Limpia:
                        </span>
                        <span className="text-emerald-400 font-black font-mono text-xl">
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

const ProjectForm = ({
  filamentsList,
  accessoriesList,
  defaultConfig,
  initialData,
  calculateCosts,
  onSave,
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

  const addAccessory = (aid: string) => {
    if (!aid) return;
    const exists = formData.accessories.find((a: any) => a.accessoryId === aid);
    if (exists) return;
    setFormData({
      ...formData,
      accessories: [...formData.accessories, { accessoryId: aid, quantity: 1 }],
    });
  };

  const updateAccessoryQty = (aid: string, qty: number) => {
    setFormData({
      ...formData,
      accessories: formData.accessories.map((a: any) =>
        a.accessoryId === aid ? { ...a, quantity: qty } : a,
      ),
    });
  };

  const removeAccessory = (aid: string) => {
    setFormData({
      ...formData,
      accessories: formData.accessories.filter(
        (a: any) => a.accessoryId !== aid,
      ),
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in slide-in-from-bottom-8 duration-700">
      <div className="space-y-8">
        <header>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
            {initialData ? "Editar" : "Nueva"}{" "}
            <span className="text-nordic-bronze italic">Cotización</span>
          </h2>
        </header>

        {/* Datos Básicos */}
        <div className="bg-nordic-gray p-8 rounded-[2.5rem] border border-white/5 space-y-6 shadow-xl">
          <input
            placeholder="Nombre de la pieza"
            className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl text-white font-bold outline-none focus:border-nordic-bronze transition-all"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <textarea
            placeholder="Notas adicionales del diseño..."
            className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl text-white font-bold h-24 outline-none focus:border-nordic-bronze transition-all resize-none"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </div>

        {/* Selección de Materiales */}
        <div className="bg-nordic-gray p-8 rounded-[2.5rem] border border-white/5 space-y-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-black text-nordic-bronze uppercase tracking-[0.3em] flex items-center gap-2">
              <Droplets size={16} /> Filamentos
            </h3>
            <select
              onChange={(e) => addFilament(e.target.value)}
              className="bg-black/40 border border-white/10 text-xs text-nordic-bronze font-black uppercase p-2 rounded-xl outline-none"
              value=""
            >
              <option value="">Añadir Material</option>
              {filamentsList.map((f: any) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.material})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            {formData.filaments.map((pf: any) => {
              const info = filamentsList.find(
                (f: any) => f.id === pf.filamentId,
              );
              return (
                <div
                  key={pf.filamentId}
                  className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl border border-white/5"
                >
                  <span className="flex-1 text-xs font-black uppercase text-white truncate">
                    {info?.name}
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
                      g
                    </span>
                  </div>
                  <button
                    onClick={() => removeFilament(pf.filamentId)}
                    className="text-rose-500/50 hover:text-rose-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Accesorios y Otros */}
        <div className="bg-nordic-gray p-8 rounded-[2.5rem] border border-white/5 space-y-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-black text-nordic-bronze uppercase tracking-[0.3em] flex items-center gap-2">
              <Wrench size={16} /> Accesorios
            </h3>
            <select
              onChange={(e) => addAccessory(e.target.value)}
              className="bg-black/40 border border-white/10 text-xs text-nordic-bronze font-black uppercase p-2 rounded-xl outline-none"
              value=""
            >
              <option value="">Añadir Accesorio</option>
              {accessoriesList.map((a: any) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            {formData.accessories.map((pa: any) => {
              const info = accessoriesList.find(
                (a: any) => a.id === pa.accessoryId,
              );
              return (
                <div
                  key={pa.accessoryId}
                  className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl border border-white/5"
                >
                  <span className="flex-1 text-xs font-black uppercase text-white truncate">
                    {info?.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      className="w-16 bg-black/40 p-2 rounded-xl text-nordic-bronze text-right font-mono font-bold border border-white/10"
                      value={pa.quantity}
                      onChange={(e) =>
                        updateAccessoryQty(
                          pa.accessoryId,
                          Number(e.target.value),
                        )
                      }
                    />
                    <span className="text-[9px] font-black uppercase text-slate-500">
                      u
                    </span>
                  </div>
                  <button
                    onClick={() => removeAccessory(pa.accessoryId)}
                    className="text-rose-500/50 hover:text-rose-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Taller y Manufactura */}
        <div className="bg-nordic-gray p-8 rounded-[2.5rem] border border-white/5 space-y-6 shadow-xl">
          <h3 className="text-[10px] font-black text-nordic-bronze uppercase tracking-[0.3em] flex items-center gap-2">
            <Hammer size={16} /> Manufactura
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-[9px] font-black uppercase text-slate-500 ml-4 mb-2 block">
                Horas Impresión
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
                Margen de Ganancia %
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
                Multiplicador Riesgo
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
              Precio de Venta Sugerido
            </p>
            <h2 className="text-7xl font-black text-nordic-bronze tracking-tighter font-mono">
              {defaultConfig.currency}
              {formatAR(costs.roundedPrice, 0)}
            </h2>
          </div>
          <div className="relative z-10">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
              Análisis del Diseño
            </h4>
            <CostBreakdown costs={costs} currency={defaultConfig.currency} />
          </div>
          <button
            onClick={() => onSave(formData)}
            className="relative z-10 w-full bg-nordic-bronze text-nordic-black py-6 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
          >
            Confirmar y Guardar Registro
          </button>
        </div>
      </div>
    </div>
  );
};

const ClientsView = ({ clients, currency, onDelete, onAdd }: any) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newC, setNewC] = useState({ name: "", contact: "" });
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end border-b border-white/10 pb-6">
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
          Cartera de <span className="text-nordic-bronze">Clientes</span>
        </h2>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-nordic-bronze text-nordic-black px-8 py-4 rounded-2xl font-black text-xs uppercase flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-nordic-bronze/20"
        >
          <Plus size={18} /> Nuevo Cliente
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {clients.map((c: any) => (
          <div
            key={c.id}
            className="bg-nordic-gray p-8 rounded-[2.5rem] border border-white/5 relative group hover:border-nordic-bronze/30 transition-all shadow-xl"
          >
            <button
              onClick={() => onDelete(c.id)}
              className="absolute top-6 right-6 text-rose-500/30 opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-all"
            >
              <Trash2 size={16} />
            </button>
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-nordic-black p-4 rounded-2xl text-nordic-bronze">
                <User size={24} />
              </div>
              <h3 className="text-xl font-black text-white truncate">
                {c.name}
              </h3>
            </div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] truncate">
              {c.contact}
            </p>
          </div>
        ))}
      </div>
      {showAdd && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200] flex items-center justify-center p-6">
          <div className="bg-nordic-gray rounded-[2.5rem] w-full max-w-md p-10 border border-nordic-bronze/30 shadow-2xl">
            <h3 className="text-2xl font-black text-nordic-bronze mb-8 uppercase tracking-tighter">
              Añadir Cliente
            </h3>
            <div className="space-y-6 mb-8">
              <input
                placeholder="Nombre Completo"
                className="w-full bg-black/40 p-5 rounded-2xl outline-none border border-white/10 text-white font-bold"
                value={newC.name}
                onChange={(e) => setNewC({ ...newC, name: e.target.value })}
              />
              <input
                placeholder="Contacto (Instagram / WhatsApp)"
                className="w-full bg-black/40 p-5 rounded-2xl outline-none border border-white/10 text-white font-bold"
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
                onClick={() => {
                  onAdd(newC);
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

const TrashView = ({ deletedRecords, currency, onRestore }: any) => (
  <div className="space-y-12">
    <header className="border-b border-white/10 pb-6">
      <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
        Historial de <span className="text-nordic-bronze">Papelera</span>
      </h2>
    </header>
    <div className="bg-nordic-gray rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
      <table className="w-full text-left">
        <thead className="bg-black/40 border-b border-white/10">
          <tr>
            <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Elemento Eliminado
            </th>
            <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Utilidad Perdida
            </th>
            <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {deletedRecords.map((r: DeletedRecord) => (
            <tr key={r.id} className="hover:bg-black/20 transition-colors">
              <td className="px-10 py-8 font-black text-white">
                {r.itemName}{" "}
                <span className="text-[9px] text-slate-600 uppercase ml-2 tracking-widest">
                  ({r.itemType})
                </span>
              </td>
              <td className="px-10 py-8 font-black text-nordic-bronze font-mono">
                {r.originalProfit
                  ? `${currency}${formatAR(r.originalProfit, 0)}`
                  : "-"}
              </td>
              <td className="px-10 py-8 text-right">
                <button
                  onClick={() => onRestore(r)}
                  className="p-3 text-nordic-bronze hover:bg-nordic-bronze/10 rounded-xl transition-all flex items-center gap-2 ml-auto group"
                >
                  <RotateCcw
                    size={16}
                    className="group-hover:rotate-[-45deg] transition-transform"
                  />{" "}
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Restaurar al Taller
                  </span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const ConfigView = ({ config, onSave }: any) => {
  const [local, setLocal] = useState(config);
  return (
    <div className="max-w-2xl mx-auto animate-in zoom-in-95 duration-500">
      <header className="mb-10 text-center">
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
          Parámetros del <span className="text-nordic-bronze">Taller</span>
        </h2>
      </header>
      <div className="bg-nordic-gray p-12 rounded-[3.5rem] border border-white/5 shadow-2xl bronze-glow space-y-8">
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">
            Costo Energía ($/KWh)
          </label>
          <input
            type="number"
            className="w-full bg-black/40 p-5 rounded-2xl outline-none text-white border border-white/10 focus:border-nordic-bronze"
            value={local.energyRateKwh}
            onChange={(e) =>
              setLocal({ ...local, energyRateKwh: Number(e.target.value) })
            }
          />
        </div>
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">
            Consumo Impresora (Watts)
          </label>
          <input
            type="number"
            className="w-full bg-black/40 p-5 rounded-2xl outline-none text-white border border-white/10 focus:border-nordic-bronze"
            value={local.printerPowerWatts}
            onChange={(e) =>
              setLocal({ ...local, printerPowerWatts: Number(e.target.value) })
            }
          />
        </div>
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">
            Símbolo Monetario
          </label>
          <input
            className="w-full bg-black/40 p-5 rounded-2xl outline-none text-white border border-white/10 focus:border-nordic-bronze"
            value={local.currency}
            onChange={(e) => setLocal({ ...local, currency: e.target.value })}
          />
        </div>
        <button
          onClick={() => onSave(local)}
          className="w-full bg-nordic-bronze text-nordic-black py-6 rounded-3xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all mt-4"
        >
          Guardar Configuración
        </button>
      </div>
    </div>
  );
};

const PurchaseModal = ({ editing, onSave, onClose }: any) => {
  const [name, setName] = useState(editing?.name || "");
  const [amount, setAmount] = useState(editing?.amount || 0);
  const [type, setType] = useState(editing?.type || "filament");
  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200] flex items-center justify-center p-6">
      <div className="bg-nordic-gray border border-white/10 p-12 rounded-[3rem] w-full max-w-md bronze-glow shadow-2xl">
        <h3 className="text-2xl font-black text-nordic-bronze mb-10 uppercase tracking-tighter">
          {editing ? "Editar Inversión" : "Nueva Inversión"}
        </h3>
        <div className="space-y-6">
          <input
            placeholder="Descripción del Gasto"
            className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl text-white font-bold"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            placeholder="Monto Total ($)"
            type="number"
            className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl text-white font-bold"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
          <select
            className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl text-white font-bold"
            value={type}
            onChange={(e) => setType(e.target.value as any)}
          >
            <option value="filament">Material / Filamento</option>
            <option value="accessory">Accesorios / Insumos</option>
          </select>
          <div className="flex gap-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-black/20 p-5 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-500"
            >
              Cancelar
            </button>
            <button
              onClick={() => onSave({ name, amount, type, quantity: 1 })}
              className="flex-1 bg-nordic-bronze text-nordic-black p-5 rounded-2xl font-black uppercase text-[10px] tracking-widest"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SelectClientModal = ({ clients, onClose, onConfirm }: any) => {
  const [selected, setSelected] = useState("");
  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in zoom-in-95 duration-500">
      <div className="bg-nordic-gray rounded-[3rem] w-full max-w-lg p-12 border border-nordic-bronze/30 shadow-2xl bronze-glow">
        <h3 className="text-3xl font-black text-nordic-bronze uppercase tracking-tighter mb-10">
          Asignar Pedido
        </h3>
        <div className="space-y-3 max-h-80 overflow-y-auto mb-10 pr-2 custom-scrollbar">
          {clients.map((c: any) => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={`w-full p-6 rounded-2xl border-2 transition-all flex items-center gap-6 group ${selected === c.id ? "border-nordic-bronze bg-nordic-bronze/10" : "border-white/5 bg-black/20 hover:border-white/10"}`}
            >
              <div
                className={`p-4 rounded-xl ${selected === c.id ? "bg-nordic-bronze text-nordic-black" : "bg-white/5 text-slate-500"}`}
              >
                <User size={24} />
              </div>
              <p
                className={`font-black tracking-tight text-xl ${selected === c.id ? "text-white" : "text-slate-400"}`}
              >
                {c.name}
              </p>
            </button>
          ))}
        </div>
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 bg-black/20 text-slate-500 py-6 rounded-2xl font-black uppercase text-[10px] tracking-widest"
          >
            Cancelar
          </button>
          <button
            disabled={!selected}
            onClick={() => onConfirm(selected)}
            className="flex-1 bg-nordic-bronze text-nordic-black py-6 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl disabled:opacity-20 transition-all"
          >
            Sellar Venta
          </button>
        </div>
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
  <div className="space-y-8 animate-in slide-in-from-bottom-4">
    <div className="flex justify-between items-end border-b border-white/10 pb-6">
      <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
        Historial de <span className="text-nordic-bronze">Inversiones</span>
      </h2>
      <button
        onClick={onAdd}
        className="bg-nordic-bronze text-nordic-black px-8 py-4 rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-lg shadow-nordic-bronze/20 hover:scale-105 transition-all"
      >
        <Plus size={18} /> Nueva Inversión
      </button>
    </div>
    <div className="bg-nordic-gray rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
      <table className="w-full text-left">
        <thead className="bg-black/40 border-b border-white/10">
          <tr>
            <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Insumo / Gasto
            </th>
            <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Monto
            </th>
            <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {purchases.map((p: any) => (
            <tr
              key={p.id}
              className="hover:bg-black/20 transition-colors group"
            >
              <td className="px-10 py-8">
                <p className="font-black text-white group-hover:text-nordic-bronze transition-colors">
                  {p.name}
                </p>
                <p className="text-[9px] uppercase text-nordic-bronze/60 font-black tracking-widest">
                  {p.type === "filament" ? "Materia Prima" : "Suministro"}
                </p>
              </td>
              <td className="px-10 py-8 font-black text-rose-500 font-mono">
                {currency}
                {formatAR(p.amount, 0)}
              </td>
              <td className="px-10 py-8 text-right">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => onEdit(p)}
                    className="p-2 text-slate-500 hover:text-nordic-bronze"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(p)}
                    className="p-2 text-rose-500/30 hover:text-rose-500 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

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
    <div className="min-h-screen bg-nordic-black flex items-center justify-center p-6 relative">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.03)_0%,_transparent_70%)] pointer-events-none"></div>
      <div className="w-full max-w-md bg-nordic-gray rounded-[3rem] p-12 border border-white/5 shadow-2xl relative overflow-hidden bronze-glow">
        <div className="text-center mb-12">
          <div className="bg-nordic-bronze w-20 h-20 rounded-[1.5rem] flex items-center justify-center text-nordic-black mx-auto mb-8 shadow-2xl shadow-nordic-bronze/30">
            <Box size={40} />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">
            STUDIO<span className="text-nordic-bronze">3D</span>
          </h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.4em] mt-4">
            Gestión de Manufactura 3D
          </p>
        </div>
        <form onSubmit={handleAuth} className="space-y-6">
          <input
            required
            type="email"
            placeholder="Correo de Negocio"
            className="w-full bg-black/40 border border-white/10 rounded-2xl px-8 py-5 font-bold outline-none text-white focus:border-nordic-bronze transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            required
            type="password"
            placeholder="Contraseña Maestra"
            className="w-full bg-black/40 border border-white/10 rounded-2xl px-8 py-5 font-bold outline-none text-white focus:border-nordic-bronze transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="w-full bg-nordic-bronze text-nordic-black py-6 rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl hover:bg-nordic-bronzeLight active:scale-95 transition-all"
          >
            {isLogin ? "Acceder al Studio" : "Crear Studio"}
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="w-full text-slate-500 font-bold uppercase text-[10px] tracking-widest hover:text-nordic-bronze transition-colors"
          >
            {isLogin
              ? "¿Abrir nuevo Studio? Regístrate"
              : "¿Ya tienes Studio? Entra"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;
