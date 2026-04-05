"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col gap-8">
        <h1 className="text-4xl font-bold">Hackathon Template</h1>
        <p className="text-xl text-center">
          Next.js + FastAPI + Supabase + Firebase Auth
        </p>
        
        <a href="/api/auth/login" className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors">
          <LogIn size={20} />
          Sign in with Google
        </a>
      </div>
    </main>
  );
}
