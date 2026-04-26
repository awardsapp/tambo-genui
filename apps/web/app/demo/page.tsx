"use client";

import { demoComponents } from "@/components/ui/genui/demo-config";
import { MessageThreadFull } from "@workspace/ui-registry/components/message-thread-full";
import { GenuiEmailButton } from "@/components/ui/genui/genui-email-button";
import { env } from "@/lib/env";
import { GenuiProvider } from "@workspace/react";
export default function DemoPage() {
  return (
    <div className="w-full flex justify-center items-center h-screen">
      <div className="w-full flex justify-center items-center bg-white">
        <GenuiProvider
          apiKey={env.NEXT_PUBLIC_GENUI_API_KEY!}
          genuiUrl={env.NEXT_PUBLIC_GENUI_API_URL}
          components={demoComponents}
        >
          <MessageThreadFull />
          <GenuiEmailButton />
        </GenuiProvider>
      </div>
    </div>
  );
}
