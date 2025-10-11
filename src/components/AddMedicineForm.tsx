import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function AddMedicineForm({ onMedicineAdded }: { onMedicineAdded: () => void }) {
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('medicines')
        .insert([
          {
            name: name.trim(),
            cost: parseFloat(cost),
            quantity: parseInt(quantity),
          },
        ]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Medicine added successfully',
      });

      setName('');
      setCost('');
      setQuantity('');
      onMedicineAdded();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add medicine',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Medicine</CardTitle>
        <CardDescription>Add medicine to inventory</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Medicine Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter medicine name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cost">Cost per Unit (KES)</Label>
            <Input
              id="cost"
              type="number"
              min="0"
              step="0.01"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="Enter cost price"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              required
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Medicine'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
