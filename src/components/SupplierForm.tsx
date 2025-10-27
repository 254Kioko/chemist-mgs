// src/components/SupplierForm.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client"; // ✅ use the same working client

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

export default function SupplierForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      </CardContent>
    </Card>
  );
}
