
"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

interface SubmitButtonProps extends ButtonProps {
  loadingText?: string;
  loading?: boolean; // Prop for manual control
}

export function SubmitButton({ children, loadingText = "Submitting...", loading, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const isPending = loading || pending; // Use manual loading prop OR form status

  return (
    <Button {...props} type="submit" disabled={isPending || props.disabled}>
      {isPending ? (
        <>
          <div className="mr-2 w-4 h-4 border-2 border-transparent rounded-full animate-spin-gradient" />
          <span className="animate-pulse">{loadingText}</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
}
