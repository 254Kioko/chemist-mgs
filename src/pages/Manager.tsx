import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  BarChart3,
  Camera,
  ShoppingBag,
  Package,
  Truck,
} from "lucide-react";
import { SalesReports } from "@/components/SalesReports";
import { CCTVMonitor } from "@/components/CCTVMonitor";
import { POSSystem } from "@/components/POSSystem";
import SupplierForm from "@/components/SupplierForm";
import ProductForm from "@/components/ProductForm";
import { toast } from "sonner";

const Manager = () => {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("sales");

  // === Redirect unauthenticated users ===
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  // === Restricted Tabs for Cashiers ===
  const restrictedTabs = ["cctv", "supplier", "products"];

  const handleTabChange = (tab: string) => {
    if (role === "cashier" && restrictedTabs.includes(tab)) {
      toast.error("🚫 Access denied: Only managers or admins can access this section.", {
        style: {
          background: "#DC2626", // red background
          color: "white",
          fontWeight: "600",
        },
      });
      return; // Prevent switching
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ===== HEADER ===== */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Manager Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Role: <span className="font-semibold capitalize">{role}</span>
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                Back to Inventory
              </Button>
              <Button
                onClick={signOut}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT WITH TABS ===== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-3xl">
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Sales
            </TabsTrigger>
            <TabsTrigger value="pos" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              POS
            </TabsTrigger>
            <TabsTrigger value="cctv" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              CCTV
            </TabsTrigger>
            <TabsTrigger value="supplier" className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Suppliers
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Products
            </TabsTrigger>
          </TabsList>

          {/* === SALES TAB === */}
          <TabsContent value="sales">
            <SalesReports role={role} />
          </TabsContent>

          {/* === POS TAB === */}
          <TabsContent value="pos">
            <POSSystem />
          </TabsContent>

          {/* === CCTV TAB === */}
          <TabsContent value="cctv">
            {role === "cashier" ? (
              <div className="text-red-500 font-semibold text-center mt-10">
                🚫 Access Denied — Managers or Admins Only
              </div>
            ) : (
              <CCTVMonitor />
            )}
          </TabsContent>

          {/* === SUPPLIERS TAB === */}
          <TabsContent value="supplier">
            {role === "cashier" ? (
              <div className="text-red-500 font-semibold text-center mt-10">
                🚫 Access Denied — Managers or Admins Only
              </div>
            ) : (
              <div className="bg-card p-6 rounded-xl shadow-sm">
                <h2 className="text-2xl font-semibold mb-4">Supplier Information</h2>
                <SupplierForm />
              </div>
            )}
          </TabsContent>

          {/* === PRODUCTS TAB === */}
          <TabsContent value="products">
            {role === "cashier" ? (
              <div className="text-red-500 font-semibold text-center mt-10">
                🚫 Access Denied — Managers or Admins Only
              </div>
            ) : (
              <div className="bg-card p-6 rounded-xl shadow-sm">
                <h2 className="text-2xl font-semibold mb-4">Products Supplied</h2>
                <ProductForm />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Manager;
