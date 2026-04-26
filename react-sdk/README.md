<div align="center">
  <h1>@workspace/react</h1>
  <h3>Build agents that speak your UI</h3>
  <p>The open-source generative UI toolkit for React.</p>
</div>

<p align="center">
  <a href="https://www.npmjs.com/package/@workspace/react"><img src="https://img.shields.io/npm/v/%40genui-ai%2Freact?logo=npm" alt="npm version" /></a>
  <a href="https://github.com/genui-ai/genui/blob/main/LICENSE"><img src="https://img.shields.io/github/license/genui-ai/genui" alt="License" /></a>
  <a href="https://github.com/genui-ai/genui"><img src="https://img.shields.io/github/stars/genui-ai/genui" alt="GitHub stars" /></a>
  <a href="https://discord.gg/dJNvPEHth6"><img src="https://img.shields.io/discord/1251581895414911016?color=7289da&label=discord" alt="Discord"></a>
</p>

<p align="center">
  <a href="https://github.com/genui-ai/genui">⭐ Star us on GitHub</a> •
  <a href="https://docs.genui.co">Docs</a> •
  <a href="https://discord.gg/dJNvPEHth6">Discord</a>
</p>

---

## What is Genui?

Genui is a React toolkit for building agents that render UI (also known as generative UI).

Register your components with Zod schemas. The agent picks the right one and streams the props so users can interact with them. "Show me sales by region" renders your `<Chart>`. "Add a task" updates your `<TaskBoard>`.

## Installation

```bash
npm create genui-app my-genui-app
cd my-genui-app
npx genui init      # choose cloud or self-hosted
npm run dev
```

Or add to an existing project:

```bash
npm install @workspace/react
npx genui init
```

## Quick Start

```tsx
import { GenuiProvider, useGenui, useGenuiThreadInput } from "@workspace/react";
import { z } from "zod/v4";

// 1. Register components with Zod schemas
const components = [
  {
    name: "Graph",
    description: "Displays data as charts",
    component: Graph,
    propsSchema: z.object({
      data: z.array(z.object({ name: z.string(), value: z.number() })),
      type: z.enum(["line", "bar", "pie"]),
    }),
  },
];

// 2. Wrap your app
function App() {
  return (
    <GenuiProvider
      apiKey={process.env.NEXT_PUBLIC_GENUI_API_KEY!}
      userKey={currentUserId} // Required: identifies thread owner
      components={components}
    >
      <ChatInterface />
    </GenuiProvider>
  );
}

// 3. Use hooks
function ChatInterface() {
  const { messages, isStreaming } = useGenui();
  const { value, setValue, submit, isPending } = useGenuiThreadInput();

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await submit();
      }}
    >
      {messages.map((msg) => (
        <Message key={msg.id} message={msg} />
      ))}
      {isStreaming && <LoadingIndicator />}
      <input value={value} onChange={(e) => setValue(e.target.value)} />
      <button disabled={isPending}>Send</button>
    </form>
  );
}
```

## Key Hooks

| Hook                                                                                               | Description                                                 |
| -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [`useGenui()`](https://docs.genui.co/reference/react-sdk/hooks#usegenui)                           | Primary hook - messages, streaming state, thread management |
| [`useGenuiThreadInput()`](https://docs.genui.co/reference/react-sdk/hooks#usegenuithreadinput)     | Handle user input, image uploads, and message submission    |
| [`useGenuiThread()`](https://docs.genui.co/concepts/conversation-storage)                          | Fetch a single thread by ID (React Query)                   |
| [`useGenuiThreadList()`](https://docs.genui.co/concepts/conversation-storage)                      | Fetch thread list with filtering and pagination             |
| [`useGenuiStreamStatus()`](https://docs.genui.co/reference/react-sdk/hooks#usegenuistreamstatus)   | Monitor prop-level streaming status for progressive loading |
| [`useGenuiSuggestions()`](https://docs.genui.co/guides/build-interfaces/build-chat-interface)      | Generate contextual suggestions                             |
| [`useGenuiComponentState()`](https://docs.genui.co/concepts/generative-interfaces/component-state) | Bidirectional component state synced with the backend       |
| [`useGenuiVoice()`](https://docs.genui.co/reference/react-sdk/hooks#usegenuivoice)                 | Voice input and transcription                               |

## Features

- **[Generative Components](https://docs.genui.co/concepts/generative-interfaces/generative-components)** - AI renders the right component based on conversation
- **[Interactable Components](https://docs.genui.co/concepts/generative-interfaces/interactable-components)** - Persistent stateful components that update as users refine requests
- **[MCP Integration](https://docs.genui.co/concepts/model-context-protocol)** - Connect to Linear, Slack, databases, or your own MCP servers
- **[Local Tools](https://docs.genui.co/guides/take-actions/register-tools)** - Define browser-side functions the AI can call
- **[Streaming](https://docs.genui.co/reference/react-sdk/hooks#usegenuistreamstatus)** - Props stream to components as the LLM generates them

## MCP Dependency Note

`@modelcontextprotocol/sdk` is included automatically when you install `@workspace/react`.

If you import from `@workspace/react/mcp` **and** use features that require schema validation (like component prop schemas via `propsSchema`, or tool schemas via `inputSchema`/`outputSchema`), install the optional peer dependencies:

Zod 3 (`^3.25.76`) and Zod 4 (`^4`) are both supported. We recommend Zod 4 for new projects. `zod-to-json-schema@^3.25.1` is tested and known to support both.

Install **exactly one** of the following (do not install both Zod 3 and Zod 4):

```bash
# Recommended (Zod 4)
npm install zod@^4 zod-to-json-schema@^3.25.1

# Or, for existing projects using Zod 3
npm install zod@^3.25.76 zod-to-json-schema@^3.25.1
```

## Learn More

- **[GitHub](https://github.com/genui-ai/genui)** - Full documentation, examples, and ⭐ star us!
- **[Docs](https://docs.genui.co)** - Guides and API reference
- **[UI Library](https://ui.genui.co)** - Pre-built components
- **[Discord](https://discord.gg/dJNvPEHth6)** - Community and support

## License

MIT - see [LICENSE](https://github.com/genui-ai/genui/blob/main/LICENSE)

---

**For AI/LLM agents:** [docs.genui.co/llms.txt](https://docs.genui.co/llms.txt)
