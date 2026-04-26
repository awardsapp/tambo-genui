"use client";

import { currentPageContextHelper, GenuiProvider } from "@workspace/react";
import { components } from "@/lib/genui";

export function GenuiRootProvider({ children }: { children: React.ReactNode }) {
  return (
    <GenuiProvider
      apiKey={process.env.NEXT_PUBLIC_GENUI_API_KEY!}
      genuiUrl={process.env.NEXT_PUBLIC_GENUI_URL}
      userKey="genui-docs"
      contextHelpers={{ userPage: currentPageContextHelper }}
      components={components}
    >
      {children}
    </GenuiProvider>
  );
}
