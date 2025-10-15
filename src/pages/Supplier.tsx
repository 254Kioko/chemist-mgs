import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

export function Supplier({ role }: { role: string }) {
  const { toast } = useToast();

  // Supplier form state
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [company, setCompany] = useState('');

  // Product supplied form state
  const [productName, setProductName] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [buyingPrice, setBuyingPrice] = useState('');
  const [unit, setUnit] = useState('');
  const [quantity, setQuantity] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // List of supplied products
  const [suppliedProducts, setSuppliedProducts] = useState<any[]>([]);

  const fetchSuppliedProducts = async () => {
    const { data, error } = await supabase
      .from('supplied_products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      setSuppliedProducts(data || []);
    }
  };

  useEffect(() => {
    fetchSuppliedProducts();
  }, []);

  // Save supplier
  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role !== 'admin') {
      toast({ variant: 'destructive', title: 'Access Denied', description: 'Admins only!' });
      return;
    }

    const { error } = await supabase.from('suppliers').insert([
      {
        name: supplierName,
        phone: supplierPhone,
        company: company,
      },
    ]);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Success', description: 'Supplier added successfully' });
      setSupplierName('');
      setSupplierPhone('');
      setCompany('');
    }
  };

  // Save supplied product
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role !== 'admin') {
      toast({ variant: 'destructive', title: 'Access Denied', description: 'Admins only!' });
      return;
    }

    const { error } = await supabase.from('supplied_products').insert([
      {
        product_name: productName,
        batch_number: batchNumber,
        buying_price: parseFloat(buyingPrice),
        unit: unit,
        quantity: parseInt(quantity),
        total_cost: parseFloat(totalCost),
        expiry_date: expiryDate,
      },
    ]);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Success', description: 'Supplied product added successfully' });
      setProductName('');
      setBatchNumber('');
      setBuyingPrice('');
      setUnit('');
      setQuantity('');
      setTotalCost('');
      setExpiryDate('');
      fetchSuppliedProducts();
    }
  };

  // Sync supplied product to medicines table
  const handleSyncToInventory = async (product: any) => {
    if (role !== 'admin') {
      toast({ variant: 'destructive', title: 'Access Denied', description: 'Admins only!' });
      return;
    }

    try {
      // Check if medicine exists
      const { data: existing, error: fetchError } = await supabase
        .from('medicines')
        .select('*')
        .eq('name', product.product_name)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        // Update quantity if medicine already exists
        const { error: updateError } = await supabase
          .from('medicines')
          .update({ quantity: existing.quantity + product.quantity })
          .eq('id', existing.id);

        if (updateError) throw updateError;

        toast({ title: 'Synced', description: `${product.product_name} stock updated.` });
      } else {
        // Insert new medicine if it doesn’t exist
        const { error: insertError } = await supabase.from('medicines').insert([
          {
            name: product.product_name,
            cost: product.buying_price,
            quantity: product.quantity,
          },
        ]);

        if (insertError) throw insertError;

        toast({ title: 'Synced', description: `${product.product_name} added to inventory.` });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error syncing', description: error.message });
    }
  };

  if (role !== 'admin') {
    return <p className="text-red-500">You do not have permission to access this page.</p>;
  }

  return (
    <div className="space-y-6">
      {/* Supplier Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Supplier</CardTitle>
          <CardDescription>Record supplier details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSupplierSubmit} className="space-y-4">
            <Input placeholder="Supplier Name" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} required />
            <Input placeholder="Phone Number" value={supplierPhone} onChange={(e) => setSupplierPhone(e.target.value)} required />
            <Input placeholder="Distribution Company" value={company} onChange={(e) => setCompany(e.target.value)} required />
            <Button type="submit" className="w-full">Save Supplier</Button>
          </form>
        </CardContent>
      </Card>

      {/* Supplied Product Form */}
      <Card>
        <CardHeader>
          <CardTitle>Supplied Product</CardTitle>
          <CardDescription>Record product supply details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProductSubmit} className="space-y-4">
            <Input placeholder="Product Name" value={productName} onChange={(e) => setProductName(e.target.value)} required />
            <Input placeholder="Batch Number" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} required />
            <Input placeholder="Buying Price" type="number" value={buyingPrice} onChange={(e) => setBuyingPrice(e.target.value)} required />
            <Input placeholder="Unit (e.g. per tablet, per bottle)" value={unit} onChange={(e) => setUnit(e.target.value)} required />
            <Input placeholder="Quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
            <Input placeholder="Total Cost" type="number" value={totalCost} onChange={(e) => setTotalCost(e.target.value)} required />
            <Input placeholder="Expiry Date" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} required />
            <Button type="submit" className="w-full">Save Product Supply</Button>
          </form>
        </CardContent>
      </Card>

      {/* Supplied Products List */}
      <Card>
        <CardHeader>
          <CardTitle>Supplied Products</CardTitle>
          <CardDescription>Sync supplied products to inventory manually</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.product_name}</TableCell>
                  <TableCell>{product.batch_number}</TableCell>
                  <TableCell>{product.quantity}</TableCell>
                  <TableCell>{product.expiry_date}</TableCell>
                  <TableCell>
                    <Button size="sm" onClick={() => handleSyncToInventory(product)}>
                      Sync to Inventory
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
