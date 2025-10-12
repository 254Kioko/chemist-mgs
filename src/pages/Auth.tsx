import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Pill } from 'lucide-react';

// Predefined credentials mapping
const CREDENTIALS = {
  admin: { email: 'kiokoeddie254@gmail.com', password: '2025!Chemist' },
  cashier: { email: 'chrismusembi0018@gmail.com', password: '5025!Chemist' },
};

export default function Auth() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const lowercaseUsername = username.toLowerCase().trim();
      
      // Check if username exists in predefined credentials
      if (!CREDENTIALS[lowercaseUsername as keyof typeof CREDENTIALS]) {
        throw new Error('Invalid username or password');
      }

      const credentials = CREDENTIALS[lowercaseUsername as keyof typeof CREDENTIALS];
      
      // Verify password matches
      if (password !== credentials.password) {
        throw new Error('Invalid username or password');
      }

      // Sign in with mapped email
      const { error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Logged in successfully',
      });
      
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <Pill className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Chemist Management System</CardTitle>
          <CardDescription>Sign in to manage your records</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin or cashier"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <div className="text-xs text-center text-muted-foreground mt-4">
              <p> <strong>contact developer incase</strong> <strong>of any inquiry</strong></p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
