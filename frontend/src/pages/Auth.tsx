import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Code2, Zap, Brain } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import logoImg from '@/assets/logo.png';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const switchMode = (loginMode: boolean) => {
    setIsLogin(loginMode);
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success('Welcome back!');
        navigate('/dashboard');
      } else {
        await signUp(email, password, username);
        toast.success('Account created! Check your email to verify.');
      }
    } catch (err: any) {
      const message = err?.message || 'Something went wrong';
      if (!isLogin && /already exists|already in use|duplicate/i.test(message)) {
        setErrorMessage(`${message}. If you already have an account, switch to Sign in.`);
      } else if (isLogin && /invalid email or password|invalid credentials/i.test(message)) {
        setErrorMessage(`${message}. If you do not have an account yet, switch to Create Account.`);
      } else {
        setErrorMessage(message);
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" />
        <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-primary/10 blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-accent/10 blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/5 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 animate-fade-in">
          <img src={logoImg} alt="DSA Easy" className="h-20 w-20 mb-6 drop-shadow-lg" />
          <h1 className="text-4xl font-extrabold text-foreground mb-3">
            <span className="text-gradient-hero">DSA Easy</span>
          </h1>
          <p className="text-muted-foreground text-center text-lg mb-10 max-w-sm">
            Master Data Structures & Algorithms with AI-powered guidance
          </p>

          {/* Feature pills */}
          <div className="space-y-3 w-full max-w-xs">
            {[
              { icon: Code2, text: "850+ curated problems", delay: "0.4s" },
              { icon: Brain, text: "AI tutor for every problem", delay: "0.6s" },
              { icon: Zap, text: "Instant code execution", delay: "0.8s" },
            ].map(({ icon: Icon, text, delay }) => (
              <div
                key={text}
                className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm px-4 py-3 animate-fade-in"
                style={{ animationDelay: delay }}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Auth form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-border bg-card animate-scale-in shadow-lg">
          <CardHeader className="text-center">
            <div className="lg:hidden mb-4">
              <img src={logoImg} alt="DSA Easy" className="mx-auto h-14 w-14" />
            </div>
            <CardTitle className="text-2xl text-foreground">
              {isLogin ? 'Welcome back' : 'Create account'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {isLogin
                ? 'Sign in to continue your DSA journey.'
                : 'Create a new account only if you do not already have one.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorMessage && (
              <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </div>
            )}
            <div className="mb-4 rounded-md border border-border/70 bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
              {isLogin
                ? 'You are in Sign in mode. Use this to log into an existing account.'
                : 'You are in Create Account mode. If you already have an account, click Sign in below.'}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2 animate-fade-in">
                  <Label htmlFor="username" className="text-foreground">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="coder42"
                    required={!isLogin}
                    className="border-border bg-secondary text-foreground placeholder:text-muted-foreground transition-all focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="border-border bg-secondary text-foreground placeholder:text-muted-foreground transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="border-border bg-secondary text-foreground placeholder:text-muted-foreground transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {isLogin && (
                <div className="text-right">
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline transition-colors">
                    Forgot password?
                  </Link>
                </div>
              )}
              <Button type="submit" className="w-full gradient-hero text-primary-foreground font-semibold shadow-glow hover:opacity-90 transition-all" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>
            <div className="relative my-6">
              <Separator className="bg-border" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                or
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full border-border text-foreground hover:bg-secondary/80 transition-all"
              onClick={async () => {
                const { error } = await lovable.auth.signInWithOAuth("google", {
                  redirect_uri: window.location.origin,
                });
                if (error) toast.error(error.message || 'Google sign-in failed');
              }}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                onClick={() => switchMode(!isLogin)}
                className="font-medium text-primary hover:underline transition-colors"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
