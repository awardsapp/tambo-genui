---
name: tools-and-context
description: Provides Genui with data and capabilities via custom tools, MCP servers, context helpers, and resources. Use when registering tools Genui can call, connecting MCP servers, adding context to messages, implementing @mentions, or providing additional data sources with defineTool, mcpServers, contextHelpers, or useGenuiContextAttachment.
---

# Tools and Context

Gives Genui access to data and capabilities through tools, MCP servers, and context.

## Quick Start

```tsx
// Custom tool Genui can call
const fetchUserTool = defineTool({
  name: "fetchUser",
  description: "Fetch user by ID",
  inputSchema: z.object({ userId: z.string() }),
  tool: async ({ userId }) => fetchUser(userId),
});

<GenuiProvider tools={[fetchUserTool]}>
  <App />
</GenuiProvider>;
```

## Custom Tools

Register JavaScript functions Genui can call:

```tsx
import { defineTool, GenuiProvider } from "@workspace/react";
import { z } from "zod";

const fetchUserTool = defineTool({
  name: "fetchUser",
  description: "Fetch a user by ID",
  inputSchema: z.object({
    userId: z.string().describe("The user ID to fetch"),
  }),
  outputSchema: z.object({
    name: z.string(),
    email: z.string(),
  }),
  tool: async ({ userId }) => {
    const user = await fetchUser(userId);
    return user;
  },
});

<GenuiProvider tools={[fetchUserTool]} components={components}>
  <App />
</GenuiProvider>;
```

### Tool Key Points

- **inputSchema**: Zod object for parameters, use `.describe()` on fields
- **outputSchema**: Zod schema for return value (optional)
- **tool**: Function receives single object with input params
- **transformToContent**: Enable rich content responses (images, formatted text)

## MCP Servers

Connect to external MCP servers for tools, resources, prompts:

| Feature       | Server-side      | Client-side              |
| ------------- | ---------------- | ------------------------ |
| Performance   | Fast (direct)    | Slower (browser proxies) |
| Auth          | OAuth + API keys | Browser session only     |
| Local servers | No               | Yes (localhost)          |
| Config        | Genui dashboard  | React code               |

### Server-Side Setup

1. Go to [project dashboard](https://console.genui.co)
2. Click "Add MCP Server"
3. Enter URL and server type (StreamableHTTP or SSE)
4. Complete OAuth if required

### Client-Side Setup

```bash
npm install @modelcontextprotocol/sdk@^1.24.0 zod@^4.0.0 zod-to-json-schema@^3.25.0
```

```tsx
import { GenuiProvider } from "@workspace/react";
import { MCPTransport } from "@workspace/react/mcp";

<GenuiProvider
  mcpServers={[
    {
      url: "http://localhost:8123/",
      serverKey: "local",
      transport: MCPTransport.HTTP,
    },
  ]}
>
  <App />
</GenuiProvider>;
```

## Context Helpers

Provide dynamic context on every message:

```tsx
<GenuiProvider
  contextHelpers={{
    currentPage: () => ({ url: window.location.href }),
    currentTime: () => ({ time: new Date().toISOString() }),
    selectedItems: () => selectedItems.map((i) => i.name),
  }}
>
  <App />
</GenuiProvider>
```

### Dynamic Context Helpers

Add/remove helpers at runtime:

```tsx
const { addContextHelper, removeContextHelper } = useGenuiContextHelpers();

useEffect(() => {
  addContextHelper("project", () => ({ projectId, projectName }));
  return () => removeContextHelper("project");
}, [projectId, projectName, addContextHelper, removeContextHelper]);
```

## Context Attachments

One-time context for the next message (cleared after sending):

```tsx
const { addContextAttachment, attachments, removeContextAttachment } =
  useGenuiContextAttachment();

function handleSelectFile(file) {
  addContextAttachment({
    context: file.content,
    displayName: file.name,
    type: "file",
  });
}
```

## Local Resources

Register @ mentionable resources users can reference in messages:

### Static Resources

```tsx
import { GenuiProvider, ListResourceItem } from "@workspace/react";

const resources: ListResourceItem[] = [
  { uri: "docs://api", name: "API Reference", mimeType: "text/plain" },
  { uri: "docs://faq", name: "FAQ", mimeType: "text/plain" },
];

const getResource = async (uri: string) => {
  const content = await fetchDoc(uri);
  return { contents: [{ uri, mimeType: "text/plain", text: content }] };
};

<GenuiProvider resources={resources} getResource={getResource}>
  <App />
</GenuiProvider>;
```

### Dynamic Resources

```tsx
const listResources = async (search?: string) => {
  const docs = await fetchDocs();
  return docs
    .filter((d) => !search || d.name.includes(search))
    .map((d) => ({
      uri: `docs://${d.id}`,
      name: d.title,
      mimeType: "text/plain",
    }));
};

const getResource = async (uri: string) => {
  const doc = await fetchDocument(uri);
  return { contents: [{ uri, mimeType: "text/plain", text: doc.content }] };
};

// Both listResources and getResource must be provided together
<GenuiProvider listResources={listResources} getResource={getResource}>
  <App />
</GenuiProvider>;
```

### Programmatic Registration

```tsx
const { registerResource, registerResources } = useGenuiRegistry();

// Single resource
registerResource({
  uri: "user://file.txt",
  name: "File",
  mimeType: "text/plain",
});

// Batch registration
registerResources(
  docs.map((d) => ({
    uri: `docs://${d.id}`,
    name: d.title,
    mimeType: "text/plain",
  })),
);
```

### Context Types Summary

| Type                | When Called       | Use Case                           |
| ------------------- | ----------------- | ---------------------------------- |
| Context Helpers     | Every message     | Ambient state (current page, time) |
| Context Attachments | Next message only | User-selected files, selections    |
| Resources           | When @ mentioned  | Documentation, searchable data     |
