import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Package } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ✅ Validation schema
const productSchema = z.object({
  supplierId: z.string().min(1, "Please select a supplier"),
  productName: z.string().min(2, "Product name must be at least 2 characters").max(100),
  batchNumber: z.string().min(3, "Batch number must be at least 3 characters").max(50),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  costPerUnit: z.coerce.number().min(0.01, "Cost per unit must be greater than 0"),
  expiryDate: z.string().refine((date) => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate > today;
  }, "Expiry date must be in the future"),
});

type ProductFormValues = z.infer<typeof productSchema> & {
  totalCost?: number;
};

interface Supplier {
  id: string;
  supplier_name: string;
}

interface Product {
  id: string;
  product_name: string;
  batch_number: string;
  quantity: number;
  cost_per_unit: number;
  total_cost: number;
  expiry_date: string;
  suppliers: {
    supplier_name: string;
  } | null;
}

export default function ProductForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [syncProduct, setSyncProduct] = useState<Product | null>(null);
  const [syncQuantity, setSyncQuantity] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      supplierId: "",
      productName: "",
      batchNumber: "",
      quantity: 0,
      costPerUnit: 0,
      expiryDate: "",
      totalCost: 0,
    },
  });

  // ✅ Fetch suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, supplier_name")
        .order("supplier_name", { ascending: true });

      if (error) {
        toast.error("Failed to load suppliers");
      } else {
        setSuppliers(data || []);
      }
    };

    fetchSuppliers();
  }, []);

  // ✅ Fetch products with supplier info
  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        product_name,
        batch_number,
        quantity,
        cost_per_unit,
        total_cost,
        expiry_date,
        suppliers (supplier_name)
      `)
      .order("id", { ascending: false });

    if (!error) setProducts(data || []);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ✅ Handle form submit
  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("products").insert([
        {
          supplier_id: data.supplierId,
          product_name: data.productName,
          batch_number: data.batchNumber,
          quantity: data.quantity,
          cost_per_unit: data.costPerUnit,
          expiry_date: data.expiryDate,
        },
      ]);

      if (error) throw error;

      toast.success("✅ Product added successfully!");
      form.reset();
      fetchProducts();
    } catch (error: any) {
      toast.error("❌ Failed to add product.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Sync handlers
  const handleSyncClick = (product: Product) => {
    setSyncProduct(product);
    setSyncQuantity(product.quantity);
  };

  const handleSyncConfirm = async () => {
    if (!syncProduct) return;
    if (syncQuantity < 1 || syncQuantity > syncProduct.quantity) {
      toast.error("Invalid quantity selected");
      return;
    }

    setIsSyncing(true);

    try {
      // Check if medicine already exists
      const { data: existingMedicine, error: fetchError } = await supabase
        .from("medicines")
        .select("id, quantity")
        .eq("name", syncProduct.product_name)
        .maybeSingle();

      if (fetchError) throw fetchError;

      // Update or insert medicine
      if (existingMedicine) {
        const { error: updateError } = await supabase
          .from("medicines")
          .update({ quantity: existingMedicine.quantity + syncQuantity })
          .eq("id", existingMedicine.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("medicines").insert([
          {
            name: syncProduct.product_name,
            cost: syncProduct.cost_per_unit,
            quantity: syncQuantity,
          },
        ]);
        if (insertError) throw insertError;
      }

      // ✅ Reduce product quantity
      const newQuantity = syncProduct.quantity - syncQuantity;
      const { error: reduceError } = await supabase
        .from("products")
        .update({ quantity: newQuantity })
        .eq("id", syncProduct.id);

      if (reduceError) throw reduceError;

      toast.success(
        `✅ Synced ${syncQuantity} units. Remaining: ${newQuantity}`
      );

      setSyncProduct(null);
      fetchProducts(); // refresh table
    } catch (error: any) {
      toast.error("❌ Failed to sync product.");
      console.error("Sync failed:", error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // ✅ Auto-update total cost
  const totalCost = form.watch("quantity") * form.watch("costPerUnit");

  return (
    <Card className="shadow-lg border-border">
      <CardHeader className="bg-accent/5 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <Package className="h-6 w-6 text-accent" />
          </div>
          <div>
            <CardTitle className="text-2xl font-semibold">Product Inventory</CardTitle>
            <CardDescription>
              Add and manage products supplied by vendors
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* FORM */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={suppliers.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.supplier_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="batchNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter batch number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value || "0"))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="costPerUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost per Unit (KSh)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Total Cost (KSh)</FormLabel>
                <FormControl>
                  <Input type="number" readOnly value={totalCost.toFixed(2)} />
                </FormControl>
              </FormItem>

              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
                {isSubmitting ? "Adding..." : "Add Product"}
              </Button>
            </div>
          </form>
        </Form>

        {/* TABLE */}
        <div className="mt-10">
          <h3 className="text-xl font-semibold mb-4">Products Supplied</h3>
          {products.length === 0 ? (
            <p className="text-muted-foreground">No products added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-border rounded-lg">
                <thead className="bg-accent/10">
                  <tr>
                    <th className="p-3 text-left">Supplier</th>
                    <th className="p-3 text-left">Product</th>
                    <th className="p-3 text-left">Batch</th>
                    <th className="p-3 text-left">Quantity</th>
                    <th className="p-3 text-left">Cost/Unit</th>
                    <th className="p-3 text-left">Expiry</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-t hover:bg-accent/5">
                      <td className="p-3">{p.suppliers?.supplier_name || "Unknown"}</td>
                      <td className="p-3">{p.product_name}</td>
                      <td className="p-3">{p.batch_number}</td>
                      <td className="p-3">{p.quantity}</td>
                      <td className="p-3">{p.cost_per_unit?.toFixed(2)}</td>
                      <td className="p-3">{new Date(p.expiry_date).toLocaleDateString()}</td>
                      <td className="p-3 text-right">
                        <Button variant="secondary" onClick={() => handleSyncClick(p)}>
                          Sync
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SYNC MODAL */}
        {syncProduct && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-96">
              <h3 className="text-lg font-semibold mb-2">
                Sync {syncProduct.product_name}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enter the quantity you want to sync to the Medicines table:
              </p>
              <Input
                type="number"
                min="1"
                max={syncProduct.quantity}
                value={syncQuantity}
                onChange={(e) => setSyncQuantity(parseInt(e.target.value || "0"))}
                className="mb-4"
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setSyncProduct(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSyncConfirm} disabled={isSyncing}>
                  {isSyncing ? "Syncing..." : "Confirm Sync"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
