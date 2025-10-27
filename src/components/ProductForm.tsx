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

// ✅ Validation schema for product form
const productSchema = z.object({
  supplierId: z.string().min(1, "Please select a supplier"),
  productName: z
    .string()
    .min(2, "Product name must be at least 2 characters")
    .max(100),
  batchNumber: z
    .string()
    .min(3, "Batch number must be at least 3 characters")
    .max(50),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  expiryDate: z
    .string()
    .refine((date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate > today;
    }, "Expiry date must be in the future"),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface Supplier {
  id: string;
  supplier_name: string;
}

export default function ProductForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      supplierId: "",
      productName: "",
      batchNumber: "",
      quantity: 0,
      expiryDate: "",
    },
  });

  // ✅ Fetch suppliers for dropdown
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const { data, error } = await supabase
          .from("suppliers")
          .select("id, supplier_name")
          .order("supplier_name", { ascending: true });

        if (error) throw error;
        setSuppliers(data || []);
      } catch (error: any) {
        console.error("Error fetching suppliers:", error.message);
        toast.error("Failed to load suppliers.");
      } finally {
        setLoadingSuppliers(false);
      }
    };

    fetchSuppliers();
  }, []);

  // ✅ Handle product form submission
  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("products").insert([
        {
          supplier_id: data.supplierId,
          product_name: data.productName,
          batch_number: data.batchNumber,
          quantity: data.quantity,
          expiry_date: data.expiryDate,
        },
      ]);

      if (error) throw error;

      toast.success(" Product added successfully!");
      form.reset();
    } catch (error: any) {
      console.error("Insert failed:", error.message);
      toast.error(
        "❌ Failed to add product. Check your table fields or RLS policies."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
              Add new product with supplier and expiry details
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ✅ Supplier Dropdown */}
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={loadingSuppliers}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              loadingSuppliers
                                ? "Loading suppliers..."
                                : suppliers.length === 0
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

              {/* ✅ Product Name */}
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

              {/* ✅ Batch Number */}
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

              {/* ✅ Quantity */}
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ✅ Expiry Date */}
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

            {/* ✅ Submit Button */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={isSubmitting || loadingSuppliers}
                className="min-w-[150px]"
              >
                {isSubmitting ? "Adding..." : "Add Product"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
