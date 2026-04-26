"use client";

import { env } from "@/lib/env";
import { GenuiProvider } from "@workspace/react";
import { GenuiSubscribeIntegration } from "./genui-subscribe-integration";

export default function SubscribePage() {
  return (
    <GenuiProvider
      apiKey={env.NEXT_PUBLIC_GENUI_API_KEY!}
      genuiUrl={env.NEXT_PUBLIC_GENUI_API_URL}
    >
      <div className="container mx-auto py-2">
        <GenuiSubscribeIntegration />
      </div>
    </GenuiProvider>
  );
}
