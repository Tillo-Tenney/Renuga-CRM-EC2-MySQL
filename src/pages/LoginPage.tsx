import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PasswordInput } from '@/components/ui/password-input';
import { Building2, Mail, AlertCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      toast.success('Login successful!');
      navigate('/');
    } else {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      {/* Premium Background Image with Subtle Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      
      {/* Background Image Overlay - Subtle Texture */}
      <svg className="absolute inset-0 w-full h-full opacity-10" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="diagonal-stripes" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="20" stroke="white" strokeWidth="2" />
          </pattern>
          <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 0.1 }} />
            <stop offset="50%" style={{ stopColor: '#A855F7', stopOpacity: 0.05 }} />
            <stop offset="100%" style={{ stopColor: '#0EA5E9', stopOpacity: 0.1 }} />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg-gradient)" />
        <rect width="100%" height="100%" fill="url(#diagonal-stripes)" />
      </svg>
      
      {/* Animated gradient blobs - Premium effect */}
      <div className="absolute top-0 -left-1/2 w-full h-full bg-gradient-to-r from-blue-600/15 to-transparent rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-l from-purple-600/15 to-transparent rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-gradient-to-b from-cyan-500/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Grid overlay for modern aesthetic */}
      <div className="absolute inset-0 bg-grid-white/5" />
      
      {/* Premium light rays effect */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-blue-500/20 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>
      
      {/* Content */}
      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Premium Logo Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center relative">
            {/* Animated border ring */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-2xl blur opacity-75 animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-2xl flex items-center justify-center border border-white/10">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-1">Renuga Roofings</h1>
            <p className="text-slate-400 text-sm font-medium tracking-wide">CRM System</p>
          </div>
          
          <p className="text-slate-500 text-xs flex items-center justify-center gap-2 pt-2">
            <Zap className="w-3 h-3 text-blue-400" />
            Enterprise Platform
            <Zap className="w-3 h-3 text-blue-400" />
          </p>
        </div>

        {/* Premium Login Card */}
        <Card className="border-white/10 bg-slate-800/80 backdrop-blur-xl shadow-2xl hover:shadow-blue-500/20 transition-all duration-300">
          <CardHeader className="space-y-1 pb-5 border-b border-white/5">
            <CardTitle className="text-2xl font-display text-white">Welcome back</CardTitle>
            <CardDescription className="text-slate-400">Enter your credentials to access the platform</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="py-3 bg-red-500/10 border-red-500/30">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-400">{error}</AlertDescription>
                </Alert>
              )}

              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200 text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/30 transition-all"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Input */}
              <PasswordInput
                id="password"
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/30 transition-all"
              />

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full mt-6 h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-blue-500/30 transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer Help Text */}
        <p className="text-center text-xs text-slate-500 space-y-1">
          <p>Contact your administrator to create new user accounts</p>
          <p className="text-slate-600 text-xs">© 2025 Renuga Roofings. All rights reserved.</p>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
