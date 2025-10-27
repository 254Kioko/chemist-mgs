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
        console.error("Error fetching suppliers:", error.message);
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

    if (error) {
      console.error("Error fetching products:", error.message);
      toast.error("Failed to load products");
    } else {
      setProducts(data || []);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ✅ Handle submit
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
      fetchProducts(); // refresh table immediately
    } catch (error: any) {
      console.error("Insert failed:", error.message);
      toast.error("❌ Failed to add product. Check table fields or RLS policies.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Auto-update total cost when quantity or cost changes
  const totalCost = form.watch("quantity") * form.watch("costPerUnit");

  return (
    <Card className="shadow-lg border-border">
      <CardHeader className="bg-gradient-to-r from-accent/5 to-primary/5 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <Package className="h-6 w-6 text-accent" />
          </div>
          <div>
            <CardTitle className="text-2xl">Product Inventory</CardTitle>
            <CardDescription>
              Add new product with supplier, cost, and expiry details
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Supplier Dropdown */}
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
                          <SelectValue
                            placeholder={
                              suppliers.length === 0
                                ? "No suppliers found"
                                : "Select supplier"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.supplier_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Product Name */}
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

              {/* Batch Number */}
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

              {/* Quantity */}
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
                        placeholder="Enter quantity"
                        {...field}
                        onChange={(e) => {
                          const val = parseInt(e.target.value || "0");
                          field.onChange(val);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cost per Unit */}
              <FormField
                control={form.control}
                name="costPerUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost per Unit (KSh)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Enter cost per unit"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Total Cost */}
              <FormItem>
                <FormLabel>Total Cost (KSh)</FormLabel>
                <FormControl>
                  <Input type="number" readOnly value={totalCost.toFixed(2)} />
                </FormControl>
              </FormItem>

              {/* Expiry Date */}
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

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[150px]"
              >
                {isSubmitting ? "Adding..." : "Add Product"}
              </Button>
            </div>
          </form>
        </Form>

        {/* ✅ Product List Table */}
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
                    <th className="p-3 text-left">Product Name</th>
                    <th className="p-3 text-left">Batch Number</th>
                    <th className="p-3 text-left">Quantity</th>
                    <th className="p-3 text-left">Cost/Unit (KSh)</th>
                    <th className="p-3 text-left">Total Cost (KSh)</th>
                    <th className="p-3 text-left">Expiry Date</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-t hover:bg-accent/5">
                      <td className="p-3">
                        {product.suppliers?.supplier_name || "Unknown"}
                      </td>
                      <td className="p-3">{product.product_name}</td>
                      <td className="p-3">{product.batch_number}</td>
                      <td className="p-3">{product.quantity}</td>
                      <td className="p-3">{product.cost_per_unit?.toFixed(2)}</td>
                      <td className="p-3">{product.total_cost?.toFixed(2)}</td>
                      <td className="p-3">
                        {new Date(product.expiry_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
