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
import { Building2 } from "lucide-react";

// ✅ Validation schema
const supplierSchema = z.object({
  supplierName: z.string().min(2, "Supplier name must be at least 2 characters"),
  contactPerson: z.string().min(2, "Contact person must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  distributionCompany: z
    .string()
    .min(2, "Distribution company must be at least 2 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

interface Supplier {
  id: string;
  supplier_name: string;
  contact_person: string;
  email: string;
  phone: string;
  distribution_company: string;
  address: string;
}

export default function SupplierForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      supplierName: "",
      contactPerson: "",
      email: "",
      phone: "",
      distributionCompany: "",
      address: "",
    },
  });

  // ✅ Fetch suppliers from Supabase
  const fetchSuppliers = async () => {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .order("supplier_name", { ascending: true });

    if (error) {
      console.error("Error fetching suppliers:", error.message);
      toast.error("Failed to load suppliers");
    } else {
      setSuppliers(data || []);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // ✅ Submit handler
  const onSubmit = async (data: SupplierFormValues) => {
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("suppliers").insert([
        {
          supplier_name: data.supplierName,
          contact_person: data.contactPerson,
          email: data.email,
          phone: data.phone,
          distribution_company: data.distributionCompany,
          address: data.address,
        },
      ]);

      if (error) throw error;

      toast.success(" Supplier added successfully!");
      form.reset();
      fetchSuppliers(); // refresh supplier list
    } catch (error: any) {
      console.error("Insert failed:", error.message);
      toast.error("❌ Failed to add supplier. Check permissions or table fields.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-lg border-border">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Supplier Information</CardTitle>
            <CardDescription>
              Add new supplier and distribution company details
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* ✅ Supplier Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: "supplierName", label: "Supplier Name", placeholder: "Enter supplier name" },
                { name: "distributionCompany", label: "Distribution Company", placeholder: "Enter distribution company" },
                { name: "contactPerson", label: "Contact Person", placeholder: "Enter contact person" },
                { name: "email", label: "Email Address", placeholder: "supplier@example.com", type: "email" },
                { name: "phone", label: "Phone Number", placeholder: "+254..." },
                { name: "address", label: "Address", placeholder: "Enter address" },
              ].map((field) => (
                <FormField
                  key={field.name}
                  control={form.control}
                  name={field.name as keyof SupplierFormValues}
                  render={({ field: f }) => (
                    <FormItem>
                      <FormLabel>{field.label}</FormLabel>
                      <FormControl>
                        <Input
                          type={field.type || "text"}
                          placeholder={field.placeholder}
                          {...f}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[150px]"
              >
                {isSubmitting ? "Adding..." : "Add Supplier"}
              </Button>
            </div>
          </form>
        </Form>

        {/* ✅ Supplier List Table */}
        <div className="mt-10">
          <h3 className="text-xl font-semibold mb-4">Suppliers List</h3>
          {suppliers.length === 0 ? (
            <p className="text-muted-foreground">No suppliers added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-border rounded-lg">
                <thead className="bg-accent/10">
                  <tr>
                    <th className="p-3 text-left">Supplier Name</th>
                    <th className="p-3 text-left">Distribution Company</th>
                    <th className="p-3 text-left">Contact Person</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Phone</th>
                    <th className="p-3 text-left">Address</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.id} className="border-t hover:bg-accent/5">
                      <td className="p-3">{s.supplier_name}</td>
                      <td className="p-3">{s.distribution_company}</td>
                      <td className="p-3">{s.contact_person}</td>
                      <td className="p-3">{s.email}</td>
                      <td className="p-3">{s.phone}</td>
                      <td className="p-3">{s.address}</td>
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
