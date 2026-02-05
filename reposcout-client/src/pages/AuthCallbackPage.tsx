import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const verifySession = useAppStore((state) => state.verifySession);

    useEffect(() => {
        const processLogin = async () => {
            const token = searchParams.get("token");

            if (token) {
                
                localStorage.setItem("token", token);

                
                await verifySession();

              
                navigate("/dashboard");
            } else {
                navigate("/auth");
            }
        };

        processLogin();
    }, [searchParams, navigate, verifySession]);

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-950">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-gray-400">Verifying GitHub profile...</p>
            </div>
        </div>
    );
}