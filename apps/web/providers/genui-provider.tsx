"use client";

import { env } from "@/lib/env";
import { genuiRegisteredComponents } from "@/lib/genui/config";
import { GenuiProvider, currentPageContextHelper } from "@workspace/react";

type GenuiProviderWrapperProps = Readonly<{
  children: React.ReactNode;
  userToken?: string;
}>;

export function GenuiProviderWrapper({
  children,
  userToken,
}: GenuiProviderWrapperProps) {
  return (
    <GenuiProvider
      apiKey={env.NEXT_PUBLIC_GENUI_DASH_KEY!}
      genuiUrl={env.NEXT_PUBLIC_GENUI_API_URL}
      components={genuiRegisteredComponents}
      userToken={userToken}
      contextHelpers={{
        userPage: currentPageContextHelper,
      }}
    >
      {children}
    </GenuiProvider>
  );
}
