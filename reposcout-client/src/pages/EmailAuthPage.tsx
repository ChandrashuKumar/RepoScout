import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CinematicWrapper } from "@/components/CinematicWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/store/useAppStore";
import { Github, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";

const EmailAuthPage = () => {
  const navigate = useNavigate();
  const login = useAppStore((state) => state.login);
  const register = useAppStore((state) => state.register);
  const isLoading = useAppStore((state) => state.isLoading);
  const storeError = useAppStore((state) => state.error);
  const currentUser = useAppStore((state) => state.currentUser);


  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      navigate("/dashboard");
    }
  }, [currentUser, navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    await login(email, password);
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }
    await register(email, password, name);
  };

  const handleGitHubLogin = () => {
    alert('Github login later');
  };

  const displayError = localError || storeError;

  return (
    <CinematicWrapper className="flex items-center justify-center pt-20 p-4">
      <Card className="w-full max-w-md border-slate-700/50 bg-slate-900/50 backdrop-blur-md shadow-2xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold tracking-tight text-white">
              Account Access
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white hover:bg-slate-800"
              onClick={() => navigate("/auth")}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
          <CardDescription className="text-slate-400">
            Enter your details below to continue
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="login" className="w-full" onValueChange={() => setLocalError(null)}>
            <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 text-slate-400">
              <TabsTrigger value="login" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">Login</TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">Register</TabsTrigger>
            </TabsList>

            {displayError && (
              <div className="mt-4 p-3 bg-red-900/20 border border-red-500/50 rounded-md flex items-center text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                {displayError}
              </div>
            )}

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="m@example.com" className="bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-cyan-500" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300">Password</Label>
                  <Input id="password" name="password" type="password" className="bg-slate-950/50 border-slate-700 text-white focus-visible:ring-cyan-500" required />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                  {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-300">Full Name</Label>
                  <Input id="name" name="name" type="text" placeholder="John Doe" className="bg-slate-950/50 border-slate-700 text-white focus-visible:ring-cyan-500" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-slate-300">Email</Label>
                  <Input id="register-email" name="email" type="email" placeholder="m@example.com" className="bg-slate-950/50 border-slate-700 text-white focus-visible:ring-cyan-500" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-slate-300">Password</Label>
                  <Input id="register-password" name="password" type="password" className="bg-slate-950/50 border-slate-700 text-white focus-visible:ring-cyan-500" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-slate-300">Confirm Password</Label>
                  <Input id="confirm-password" name="confirmPassword" type="password" className="bg-slate-950/50 border-slate-700 text-white focus-visible:ring-cyan-500" required />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                  {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0f172a] px-2 text-slate-500">
                Or
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-white bg-transparent"
            onClick={handleGitHubLogin}
          >
            <Github className="mr-2 h-4 w-4" />
            Sign in with GitHub
          </Button>

        </CardContent>
      </Card>
    </CinematicWrapper>
  );
};

export default EmailAuthPage;