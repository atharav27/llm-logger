"use client";

import React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Bot, Mail, Lock, User, AlertCircle, ArrowRight, Loader2 } from "lucide-react";

import { getErrorMessage } from "@/lib/api/response";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/shared/FormInput";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { UI_ROUTES } from "@/config/routes";

// 1. Validation Schema
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: runRegister, isRegistering, registerError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    runRegister(data);
  };

  const serverError = registerError ? getErrorMessage(registerError) : null;

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-zinc-950 px-4 overflow-hidden">
      {/* Decorative Radial Glowing Backdrops */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[6000ms]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[4000ms]" />

      <div className="relative w-full max-w-md z-10">
        {/* Logo and Title */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20 mb-3 hover:scale-105 transition-all duration-300">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            LLM Logger
          </h1>
          <p className="text-sm text-zinc-400 mt-1 font-sans">
            Log, debug, and monitor your AI pipeline
          </p>
        </div>

        {/* Form Card */}
        <Card className="bg-zinc-900/60 backdrop-blur-md border-zinc-800/80 shadow-2xl relative overflow-hidden">
          {/* subtle glow border element */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
          
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-white font-sans font-semibold">
              Create an account
            </CardTitle>
            <CardDescription className="text-zinc-400 font-sans text-xs">
              Enter your details to create your diagnostic console console credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              
              {/* Server-Side Error Alert */}
              {serverError && (
                <div className="flex gap-2.5 items-start bg-red-950/30 border border-red-500/20 text-red-200 rounded-lg p-3 text-xs leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <div className="flex-1">
                    <span className="font-semibold block mb-0.5">Registration Failed</span>
                    {serverError.includes("Conflict") || serverError.includes("already exists") || (registerError as any).status === 409
                      ? "An account with this email address already exists. Please sign in instead." 
                      : serverError}
                  </div>
                </div>
              )}

              {/* Name Field */}
              <FormInput
                label="Full Name"
                id="name"
                type="text"
                icon={User}
                placeholder="John Doe"
                autoComplete="name"
                registration={register("name")}
                error={errors.name?.message}
              />

              {/* Email Field */}
              <FormInput
                label="Email Address"
                id="email"
                type="email"
                icon={Mail}
                placeholder="name@company.com"
                autoComplete="email"
                registration={register("email")}
                error={errors.email?.message}
              />

              {/* Password Field */}
              <FormInput
                label="Password"
                id="password"
                type="password"
                icon={Lock}
                placeholder="••••••••"
                autoComplete="new-password"
                registration={register("password")}
                error={errors.password?.message}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isRegistering}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-600/15 h-10 flex items-center justify-center font-sans font-semibold rounded-lg group transition-all duration-300 active:scale-[0.98] disabled:opacity-50"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Sign Up
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-zinc-400 font-sans">
                Already have an account?{" "}
                <Link
                  href={UI_ROUTES.LOGIN}
                  className="text-violet-400 hover:text-violet-300 font-semibold transition-colors duration-200 ml-0.5"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
