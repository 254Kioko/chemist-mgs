import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Pencil, Save, X, Trash2 } from 'lucide-react';

interface Medicine {
  id: string;
  name: string;
  cost: number;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export function MedicineList({ role, refreshTrigger }: { role: string; refreshTrigger: number }) {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const { toast } = useToast();

  const fetchMedicines = async () => {
    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .order('name');

      if (error) throw error;
      setMedicines(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to fetch medicines',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();

    // 🔄 Real-time subscription with direct state patching
    const channel = supabase
      .channel('medicines-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'medicines' },
        (payload) => {
          setMedicines((prev) => {
            let updated = [...prev];

            if (payload.eventType === 'INSERT') {
              updated.push(payload.new as Medicine);
            } else if (payload.eventType === 'UPDATE') {
              updated = updated.map((med) =>
                med.id === payload.new.id ? (payload.new as Medicine) : med
              );
            } else if (payload.eventType === 'DELETE') {
              updated = updated.filter((med) => med.id !== payload.old.id);
            }

            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshTrigger]);

  const handleEdit = (medicine: Medicine) => {
    setEditingId(medicine.id);
    setEditQuantity(medicine.quantity.toString());
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditQuantity('');
  };

  const handleSave = async (id: string) => {
    try {
      const { error } = await supabase
        .from('medicines')
        .update({ quantity: parseInt(editQuantity) })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Quantity updated successfully',
      });

      setEditingId(null);
      setEditQuantity('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update quantity',
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const { error } = await supabase
        .from('medicines')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Medicine deleted successfully',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete medicine',
      });
    }
  };

  if (loading) {
    return <div>Loading medicines...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Inventory</CardTitle>
        <CardDescription>
          {role === 'admin'
            ? 'Manage medicine inventory'
            : 'View-only access to medicine inventory'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {medicines.length === 0 ? (
          <p className="text-muted-foreground">No medicines in inventory</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medicines.map((medicine) => (
                  <TableRow key={medicine.id}>
                    <TableCell className="font-medium">{medicine.name}</TableCell>
                    <TableCell>KES {medicine.cost.toFixed(2)}</TableCell>
                    <TableCell>
                      {editingId === medicine.id ? (
                        <Input
                          type="number"
                          min="0"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(e.target.value)}
                          className="w-24"
                        />
                      ) : (
                        medicine.quantity
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {role === 'admin' ? (
                          editingId === medicine.id ? (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleSave(medicine.id)}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleCancel}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEdit(medicine)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDelete(medicine.id, medicine.name)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )
                        ) : (
                          <span className="text-muted-foreground text-sm">View only</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
