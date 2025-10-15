import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Supplier() {
  const { toast } = useToast();

  const [supplier, setSupplier] = useState({
    name: "",
    phone: "",
    company: "",
  });

  const [product, setProduct] = useState({
    product_name: "",
    batch_number: "",
    buying_price: "",
    unit: "",
    quantity: "",
    total_cost: "",
    expiry_date: "",
  });

  const handleSupplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSupplier({ ...supplier, [e.target.name]: e.target.value });
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const saveSupplier = async () => {
    try {
      const { error } = await supabase.from("suppliers").insert([supplier]);
      if (error) throw error;

      toast({
        title: "Supplier saved",
        description: `${supplier.name} added successfully`,
      });

      setSupplier({ name: "", phone: "", company: "" });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error saving supplier",
        description: err.message,
      });
    }
  };

  const saveProduct = async () => {
    try {
      const { error } = await supabase.from("supplied_products").insert([product]);
      if (error) throw error;

      toast({
        title: "Product saved",
        description: `${product.product_name} added successfully`,
      });

      setProduct({
        product_name: "",
        batch_number: "",
        buying_price: "",
        unit: "",
        quantity: "",
        total_cost: "",
        expiry_date: "",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error saving product",
        description: err.message,
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Supplier Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Supplier</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              name="name"
              value={supplier.name}
              onChange={handleSupplierChange}
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              name="phone"
              value={supplier.phone}
              onChange={handleSupplierChange}
            />
          </div>
          <div>
            <Label>Company</Label>
            <Input
              name="company"
              value={supplier.company}
              onChange={handleSupplierChange}
            />
          </div>
          <Button onClick={saveSupplier}>Save Supplier</Button>
        </CardContent>
      </Card>

      {/* Product Supplied Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Supplied Product</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Product Name</Label>
            <Input
              name="product_name"
              value={product.product_name}
              onChange={handleProductChange}
            />
          </div>
          <div>
            <Label>Batch Number</Label>
            <Input
              name="batch_number"
              value={product.batch_number}
              onChange={handleProductChange}
            />
          </div>
          <div>
            <Label>Buying Price</Label>
            <Input
              type="number"
              name="buying_price"
              value={product.buying_price}
              onChange={handleProductChange}
            />
          </div>
          <div>
            <Label>Unit (e.g. per tablet, per bottle)</Label>
            <Input
              name="unit"
              value={product.unit}
              onChange={handleProductChange}
            />
          </div>
          <div>
            <Label>Quantity</Label>
            <Input
              type="number"
              name="quantity"
              value={product.quantity}
              onChange={handleProductChange}
            />
          </div>
          <div>
            <Label>Total Cost</Label>
            <Input
              type="number"
              name="total_cost"
              value={product.total_cost}
              onChange={handleProductChange}
            />
          </div>
          <div>
            <Label>Expiry Date</Label>
            <Input
              type="date"
              name="expiry_date"
              value={product.expiry_date}
              onChange={handleProductChange}
            />
          </div>
          <Button onClick={saveProduct}>Save Product</Button>
        </CardContent>
      </Card>
    </div>
  );
}
