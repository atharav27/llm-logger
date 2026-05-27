import React from "react";
import { LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  id: string;
  icon?: LucideIcon;
  error?: string;
  registration: any;
}

export function FormInput({
  label,
  id,
  type = "text",
  icon: Icon,
  error,
  registration,
  placeholder,
  autoComplete,
  className,
  ...props
}: FormInputProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-zinc-300 font-sans" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
        )}
        <Input
          {...registration}
          {...props}
          id={id}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={cn(
            "bg-zinc-950/60 border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 h-10 text-white",
            Icon && "pl-9",
            error && "border-red-500/50 focus:border-red-500 focus:ring-red-500/10",
            className
          )}
        />
      </div>
      {error && (
        <p className="text-xs text-red-400 font-sans mt-1 pl-1 flex items-center gap-1 animate-in fade-in duration-200">
          <span>•</span> {error}
        </p>
      )}
    </div>
  );
}

export default FormInput;
