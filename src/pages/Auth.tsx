import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, TrendingUp, PiggyBank, BarChart3 } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;
        toast.success("Account created! You can now sign in.");
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        toast.success("Welcome back!");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-primary items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTJ2LTJoMnYyek0zNCAyOGgtMnYtMmgydjJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />
        <div className="relative z-10 text-center space-y-6">
          <div className="flex items-center justify-center gap-2 mb-8">
            <TrendingUp className="w-12 h-12 text-white" />
            <h1 className="text-5xl font-bold text-white">SpendSmart</h1>
          </div>
          <p className="text-2xl text-white/90 font-medium">
            Your money, beautifully tracked
          </p>
          <p className="text-lg text-white/70 max-w-md mx-auto">
            Upload your spending data and get instant insights with vibrant charts and smart analytics.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-8 max-w-lg mx-auto">
            <div className="text-center">
              <PiggyBank className="w-10 h-10 text-white/80 mx-auto mb-2" />
              <p className="text-white/70 text-sm">Track Spending</p>
            </div>
            <div className="text-center">
              <BarChart3 className="w-10 h-10 text-white/80 mx-auto mb-2" />
              <p className="text-white/70 text-sm">Visual Insights</p>
            </div>
            <div className="text-center">
              <TrendingUp className="w-10 h-10 text-white/80 mx-auto mb-2" />
              <p className="text-white/70 text-sm">Grow Wealth</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center gap-2 mb-2 lg:hidden">
              <TrendingUp className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">SpendSmart</h1>
            </div>
            <CardTitle className="text-2xl font-bold">
              {isSignUp ? "Create your account" : "Welcome back"}
            </CardTitle>
            <CardDescription>
              {isSignUp
                ? "Start tracking your finances today"
                : "Sign in to access your financial dashboard"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 font-semibold"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSignUp ? "Sign Up" : "Sign In"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary hover:underline font-medium"
                disabled={isLoading}
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
