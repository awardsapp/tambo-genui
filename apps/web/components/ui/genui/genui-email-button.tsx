import { Button } from "@/components/ui/button";
import { useGenui, useGenuiThreadInput } from "@workspace/react";
import { useCallback, useEffect, useState } from "react";

export const GenuiEmailButton = () => {
  const { setValue } = useGenuiThreadInput();
  const { messages } = useGenui();
  const [hasPressedButton, setHasPressedButton] = useState(false);

  const handleInteraction = useCallback(() => {
    setValue("Help me send an email to the founders.");
    setHasPressedButton(true);
  }, [setValue]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Command+E (Mac) or Ctrl+E (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "e") {
        e.preventDefault();
        handleInteraction();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleInteraction]);

  // Hide button if:
  // 1. Button has been pressed
  // 2. Thread has messages
  if (hasPressedButton || messages.length > 0) {
    return null;
  }

  return (
    <div className="z-10" data-genui-email-button>
      <div className="pointer-events-auto">
        <Button
          size="lg"
          variant="outline"
          onClick={handleInteraction}
          className="px-8 py-6 text-sm animate-pulse hover:animate-none hover:from-primary/90 hover:to-primary/70 transition-all duration-600 shadow-lg hover:shadow-xl"
        >
          Try Sending Us an Email
          <span className="ml-2 text-xs opacity-75">(⌘+E)</span>
        </Button>
      </div>
    </div>
  );
};
