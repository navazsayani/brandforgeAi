
"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface SubmitButtonProps extends ButtonProps {
  loadingText?: string;
  loading?: boolean; // Prop for manual control
}

export function SubmitButton({ children, loadingText = "Submitting...", loading, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const isPending = loading || pending; // Use manual loading prop OR form status

  return (
    <Button {...props} type="submit" disabled={isPending || props.disabled}>
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isPending ? loadingText : children}
    </Button>
  );
}
