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

    // Set up real-time subscription
    const channel = supabase
      .channel('medicines-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'medicines'
        },
        () => {
          fetchMedicines();
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
      fetchMedicines();
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

      fetchMedicines();
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
        <CardTitle>Medicine Inventory</CardTitle>
        <CardDescription>
          {role === 'admin' ? 'Manage medicine inventory' : 'Update medicine quantities after sales'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {medicines.length === 0 ? (
          <p className="text-muted-foreground">No medicines in inventory</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine Name</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medicines.map((medicine) => (
                <TableRow key={medicine.id}>
                  <TableCell className="font-medium">{medicine.name}</TableCell>
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
                      {editingId === medicine.id ? (
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
                          {role === 'admin' && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(medicine.id, medicine.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
