import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trash2, ShoppingCart, Plus } from 'lucide-react';

interface Medicine {
  id: string;
  name: string;
  cost: number;
  quantity: number;
}

interface CartItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export const POSSystem = ({ role }: { role: 'admin' | 'cashier' }) => {
  const { toast } = useToast();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    const { data, error } = await supabase
      .from('medicines')
      .select('*')
      .gt('quantity', 0)
      .order('name');

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load medicines',
        variant: 'destructive',
      });
      return;
    }
    setMedicines(data || []);
  };

  const handleMedicineSelect = (medicineId: string) => {
    setSelectedMedicine(medicineId);
    const medicine = medicines.find((m) => m.id === medicineId);
    if (medicine) {
      setUnitPrice(medicine.cost.toString());
    }
  };

  const addToCart = () => {
    const qty = parseInt(quantity);
    const price = parseFloat(unitPrice);

    if (!selectedMedicine || !quantity || qty <= 0 || !unitPrice || price <= 0) {
      toast({
        title: 'Invalid Input',
        description: 'Please select a medicine and enter valid quantity and price',
        variant: 'destructive',
      });
      return;
    }

    const medicine = medicines.find((m) => m.id === selectedMedicine);
    if (!medicine) return;

    if (qty > medicine.quantity) {
      toast({
        title: 'Insufficient Stock',
        description: `Only ${medicine.quantity} units available`,
        variant: 'destructive',
      });
      return;
    }

    const existingItem = cart.find((item) => item.medicineId === selectedMedicine);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.medicineId === selectedMedicine
            ? {
                ...item,
                quantity: item.quantity + qty,
                totalPrice: (item.quantity + qty) * price,
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          medicineId: selectedMedicine,
          medicineName: medicine.name,
          quantity: qty,
          unitPrice: price,
          totalPrice: qty * price,
        },
      ]);
    }

    setSelectedMedicine('');
    setQuantity('');
    setUnitPrice('');
  };

  const removeFromCart = (medicineId: string) => {
    setCart(cart.filter((item) => item.medicineId !== medicineId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const completeSale = async () => {
    if (cart.length === 0) {
      toast({
        title: 'Empty Cart',
        description: 'Please add items to the cart',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Create sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([
          {
            cashier_id: user.id,
            total_amount: calculateTotal(),
            payment_method: paymentMethod,
            customer_name: customerName || null,
            customer_phone: customerPhone || null,
            sale_number: '',
          },
        ])
        .select()
        .single();

      if (saleError) throw saleError;

      // 2. Insert sale items (this triggers the DB function to reduce stock)
      const saleItems = cart.map((item) => ({
        sale_id: sale.id,
        medicine_id: item.medicineId,
        medicine_name: item.medicineName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
      }));

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
      if (itemsError) throw itemsError;

      // 3. ⚡ No manual stock update if role = cashier, DB trigger handles it
      if (role === 'admin') {
        for (const item of cart) {
          const medicine = medicines.find((m) => m.id === item.medicineId);
          if (medicine) {
            await supabase
              .from('medicines')
              .update({ quantity: medicine.quantity - item.quantity })
              .eq('id', item.medicineId);
          }
        }
      }

      toast({
        title: 'Sale Completed',
        description: `Sale ${sale.sale_number} completed successfully`,
      });

      // Reset form
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setPaymentMethod('cash');
      fetchMedicines();
    } catch (error) {
      console.error('Error completing sale:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete sale',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* LEFT: Add items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Add Items
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Customer Name (Optional)</Label>
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div>
            <Label>Customer Phone (Optional)</Label>
            <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
          </div>
          <div>
            <Label>Product</Label>
            <Select value={selectedMedicine} onValueChange={handleMedicineSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select medicine" />
              </SelectTrigger>
              <SelectContent>
                {medicines.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} (Stock: {m.quantity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Quantity</Label>
              <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div>
              <Label>Unit Price (KES)</Label>
              <Input type="number" min="0" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
            </div>
          </div>
          {quantity && unitPrice && parseFloat(unitPrice) > 0 && parseInt(quantity) > 0 && (
            <div className="p-4 bg-muted rounded-lg flex justify-between">
              <span>Subtotal:</span>
              <span className="font-bold">
                KES {(parseFloat(unitPrice) * parseInt(quantity)).toFixed(2)}
              </span>
            </div>
          )}
          <Button onClick={addToCart} className="w-full">
            <Plus className="w-4 h-4 mr-2" /> Add to Cart
          </Button>
          <div>
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
                <SelectItem value="card">Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* RIGHT: Cart */}
      <Card>
        <CardHeader>
          <CardTitle>Cart</CardTitle>
        </CardHeader>
        <CardContent>
          {cart.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Cart is empty</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item.medicineId}>
                        <TableCell>{item.medicineName}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>KES {item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell>KES {item.totalPrice.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.medicineId)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center text-lg font-bold mb-4">
                  <span>Total:</span>
                  <span>KES {calculateTotal().toFixed(2)}</span>
                </div>
                <Button onClick={completeSale} disabled={loading} className="w-full" size="lg">
                  {loading ? 'Processing...' : 'Complete Sale'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
