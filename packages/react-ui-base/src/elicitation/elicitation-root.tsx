"use client";

import type {
  GenuiElicitationRequest,
  GenuiElicitationResponse,
} from "@workspace/react/mcp";
import * as React from "react";
import { ElicitationProvider } from "./elicitation-context";
import { isSingleEntryMode } from "./utils/is-single-entry-mode";

export interface ElicitationRootProps extends React.HTMLAttributes<HTMLDivElement> {
  request: GenuiElicitationRequest;
  onResponse: (response: GenuiElicitationResponse) => void;
  children?: React.ReactNode;
}

export const ElicitationRoot = React.forwardRef<
  HTMLDivElement,
  ElicitationRootProps
>(({ request, onResponse, children, ...props }, ref) => {
  const isSingleEntry = isSingleEntryMode(request);

  return (
    <ElicitationProvider request={request} onResponse={onResponse}>
      <div
        ref={ref}
        data-slot="elicitation-root"
        data-mode={isSingleEntry ? "single" : "multiple"}
        {...props}
      >
        {children}
      </div>
    </ElicitationProvider>
  );
});
ElicitationRoot.displayName = "Elicitation.Root";
