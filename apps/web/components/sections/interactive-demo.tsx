"use client";

import { demoComponents } from "@/components/ui/genui/demo-config";
import { GenuiEmailButton } from "@/components/ui/genui/genui-email-button";
import { env } from "@/lib/env";
import { MessageThreadFull } from "@workspace/ui-registry/components/message-thread-full";
import { GenuiProvider } from "@workspace/react";
import { useEffect } from "react";

export function InteractiveDemo() {
  useEffect(() => {
    const isContextKeySet = localStorage.getItem("genui-context-key");
    if (!isContextKeySet) {
      const contextKey = new Date().toISOString();
      localStorage.setItem("genui-context-key", contextKey);
    }
  }, []);

  return (
    <GenuiProvider
      apiKey={env.NEXT_PUBLIC_GENUI_API_KEY!}
      genuiUrl={env.NEXT_PUBLIC_GENUI_API_URL}
      components={demoComponents}
    >
      <div className="genui-theme w-full h-full">
        <div className="relative h-full">
          <MessageThreadFull className="shadow-xl max-h-full rounded-lg" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto">
              <GenuiEmailButton />
            </div>
          </div>
        </div>
      </div>
    </GenuiProvider>
  );
}
