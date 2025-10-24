import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Loader2, BarChart3 } from 'lucide-react';
import { AddMedicineForm } from '@/components/AddMedicineForm';
import { MedicineList } from '@/components/MedicineList';
import { SupplierForm } from '@/components/SupplierForm';


const Index = () => {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Chemist Management System</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Role: <span className="font-semibold capitalize">{role}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/manager')} variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" />
              Manager Dashboard
            </Button>
            <Button onClick={signOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
        
        <div className="grid gap-6">
          {role === 'admin' && (
            <AddMedicineForm onMedicineAdded={() => setRefreshTrigger(prev => prev + 1)} />
          )}
          
          <MedicineList role={role} refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
};

export default Index;
