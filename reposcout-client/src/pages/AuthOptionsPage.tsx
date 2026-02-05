import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CinematicWrapper } from "@/components/CinematicWrapper";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Mail } from "lucide-react";

const AuthOptionsPage = () => {
    const navigate = useNavigate();

    const handleEmailLogin = () => {
        navigate("/auth/email");
    };

    return (
        <CinematicWrapper className="flex items-center justify-center pt-20 p-4">
            <Card className="w-full max-w-md border-slate-700/50 bg-slate-900/50 backdrop-blur-md shadow-2xl">
                <CardHeader className="text-center space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight text-white">
                        Welcome back
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Login or Register to access your dashboard
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">

                    {/* PRIMARY ACTION: Email - Now the main button */}
                    <Button
                        size="lg"
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-[0_0_15px_rgba(6,182,212,0.4)] border-none transition-all"
                        onClick={handleEmailLogin}
                    >
                        <Mail className="mr-2 h-5 w-5" />
                        Sign in with Email
                    </Button>

                </CardContent>
            </Card>
        </CinematicWrapper>
    );
};

export default AuthOptionsPage;