---
name: threads
description: Manages Genui threads, messages, suggestions, voice input, and image attachments. Use when working with conversations, sending messages, implementing AI suggestions, adding voice input, managing multi-thread UIs, or handling image attachments with useGenui, useGenuiThreadInput, useGenuiSuggestions, or useGenuiVoice.
---

# Threads and Input

Manages conversations, suggestions, voice input, and image attachments.

## Quick Start

```tsx
import { useGenui, useGenuiThreadInput } from "@workspace/react";

const { thread, messages, isIdle } = useGenui();
const { value, setValue, submit } = useGenuiThreadInput();

await submit(); // sends current input value
```

## Thread Management

Access and manage the current thread using `useGenui()` and `useGenuiThreadInput()`:

```tsx
import {
  useGenui,
  useGenuiThreadInput,
  ComponentRenderer,
} from "@workspace/react";

function Chat() {
  const {
    thread, // Current thread state
    messages, // Messages with computed properties
    isIdle, // True when not generating
    isStreaming, // True when streaming response
    isWaiting, // True when waiting for server
    currentThreadId, // Active thread ID
    switchThread, // Switch to different thread
    startNewThread, // Create new thread, returns ID
    cancelRun, // Cancel active generation
  } = useGenui();

  const {
    value, // Current input value
    setValue, // Update input
    submit, // Send message
    isPending, // Submission in progress
    images, // Staged image files
    addImage, // Add single image
    removeImage, // Remove image by ID
  } = useGenuiThreadInput();

  const handleSend = async () => {
    await submit();
  };

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>
          {msg.content.map((block) => {
            switch (block.type) {
              case "text":
                return <p key={`${msg.id}:text`}>{block.text}</p>;
              case "component":
                return (
                  <ComponentRenderer
                    key={block.id}
                    content={block}
                    threadId={currentThreadId}
                    messageId={msg.id}
                  />
                );
              case "tool_use":
                return (
                  <div key={block.id}>
                    {block.statusMessage ?? `Running ${block.name}...`}
                  </div>
                );
              default:
                return null;
            }
          })}
        </div>
      ))}
      <input value={value} onChange={(e) => setValue(e.target.value)} />
      <button onClick={handleSend} disabled={!isIdle || isPending}>
        Send
      </button>
    </div>
  );
}
```

### Streaming State

| Property      | Type      | Description                 |
| ------------- | --------- | --------------------------- |
| `isIdle`      | `boolean` | Not generating              |
| `isWaiting`   | `boolean` | Waiting for server response |
| `isStreaming` | `boolean` | Actively streaming response |

The `streamingState` object provides additional detail:

```tsx
const { streamingState } = useGenui();
// streamingState.status: "idle" | "waiting" | "streaming"
// streamingState.runId: current run ID
// streamingState.error: { message, code } if error occurred
```

### Content Block Types

Messages contain an array of content blocks. Handle each type:

| Type          | Description            | Key Fields             |
| ------------- | ---------------------- | ---------------------- |
| `text`        | Plain text             | `text`                 |
| `component`   | AI-generated component | `id`, `name`, `props`  |
| `tool_use`    | Tool invocation        | `id`, `name`, `input`  |
| `tool_result` | Tool response          | `toolUseId`, `content` |
| `resource`    | MCP resource           | `uri`, `name`, `text`  |

### Submit Options

```tsx
const { submit } = useGenuiThreadInput();

await submit({
  toolChoice: "auto", // "auto" | "required" | "none" | { name: "toolName" }
  debug: true, // Enable debug logging for the stream
});
```

## Fetching a Thread by ID

To fetch a specific thread (e.g., for a detail view), use `useGenuiThread(threadId)`:

```tsx
import { useGenuiThread } from "@workspace/react";

function ThreadView({ threadId }: { threadId: string }) {
  const { data: thread, isLoading, isError } = useGenuiThread(threadId);

  if (isLoading) return <Skeleton />;
  if (isError) return <div>Failed to load thread</div>;

  return <div>{thread.name}</div>;
}
```

This is a React Query hook - use it for read-only thread fetching, not for the active conversation.

## Thread List

Manage multiple conversations:

```tsx
import { useGenui, useGenuiThreadList } from "@workspace/react";

function ThreadSidebar() {
  const { data, isLoading } = useGenuiThreadList();
  const { currentThreadId, switchThread, startNewThread } = useGenui();

  if (isLoading) return <Skeleton />;

  return (
    <div>
      <button onClick={() => startNewThread()}>New Thread</button>
      <ul>
        {data?.threads.map((t) => (
          <li key={t.id}>
            <button
              onClick={() => switchThread(t.id)}
              className={currentThreadId === t.id ? "active" : ""}
            >
              {t.name || "Untitled"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Thread List Options

```tsx
const { data } = useGenuiThreadList({
  userKey: "user_123", // Filter by user (defaults to provider's userKey)
  limit: 20, // Max results
  cursor: nextCursor, // Pagination cursor
});

// data.threads: GenuiThread[]
// data.hasMore: boolean
// data.nextCursor: string
```

## Suggestions

AI-generated follow-up suggestions after each assistant message:

```tsx
import { useGenuiSuggestions } from "@workspace/react";

function Suggestions() {
  const { suggestions, isLoading, accept, isAccepting } = useGenuiSuggestions({
    maxSuggestions: 3, // 1-10, default 3
    autoGenerate: true, // Auto-generate after assistant message
  });

  if (isLoading) return <Skeleton />;

  return (
    <div className="suggestions">
      {suggestions.map((s) => (
        <button
          key={s.id}
          onClick={() => accept({ suggestion: s })}
          disabled={isAccepting}
        >
          {s.title}
        </button>
      ))}
    </div>
  );
}
```

### Auto-Submit Suggestion

```tsx
// Accept and immediately submit as a message
accept({ suggestion: s, shouldSubmit: true });
```

### Manual Generation

```tsx
const { generate, isGenerating } = useGenuiSuggestions({
  autoGenerate: false, // Disable auto-generation
});

<button onClick={() => generate()} disabled={isGenerating}>
  Get suggestions
</button>;
```

## Voice Input

Speech-to-text transcription:

```tsx
import { useGenuiVoice } from "@workspace/react";

function VoiceButton() {
  const {
    startRecording,
    stopRecording,
    isRecording,
    isTranscribing,
    transcript,
    transcriptionError,
    mediaAccessError,
  } = useGenuiVoice();

  return (
    <div>
      <button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? "Stop" : "Record"}
      </button>
      {isTranscribing && <span>Transcribing...</span>}
      {transcript && <p>{transcript}</p>}
      {transcriptionError && <p className="error">{transcriptionError}</p>}
    </div>
  );
}
```

### Voice Hook Returns

| Property             | Type             | Description                       |
| -------------------- | ---------------- | --------------------------------- |
| `startRecording`     | `() => void`     | Start recording, reset transcript |
| `stopRecording`      | `() => void`     | Stop and start transcription      |
| `isRecording`        | `boolean`        | Currently recording               |
| `isTranscribing`     | `boolean`        | Processing audio                  |
| `transcript`         | `string \| null` | Transcribed text                  |
| `transcriptionError` | `string \| null` | Transcription error               |
| `mediaAccessError`   | `string \| null` | Mic access error                  |

## Image Attachments

Images are managed via `useGenuiThreadInput()`:

```tsx
import { useGenuiThreadInput } from "@workspace/react";

function ImageInput() {
  const { images, addImage, addImages, removeImage, clearImages } =
    useGenuiThreadInput();

  const handleFiles = async (files: FileList) => {
    await addImages(Array.from(files));
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFiles(e.target.files!)}
      />
      {images.map((img) => (
        <div key={img.id}>
          <img src={img.dataUrl} alt={img.name} />
          <button onClick={() => removeImage(img.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
}
```

### StagedImage Properties

| Property  | Type     | Description          |
| --------- | -------- | -------------------- |
| `id`      | `string` | Unique image ID      |
| `name`    | `string` | File name            |
| `dataUrl` | `string` | Base64 data URL      |
| `file`    | `File`   | Original File object |
| `size`    | `number` | File size in bytes   |
| `type`    | `string` | MIME type            |

## User Authentication

Enable per-user thread isolation:

```tsx
import { GenuiProvider } from "@workspace/react";

function App() {
  return (
    <GenuiProvider
      apiKey={apiKey}
      userKey="user_123" // Simple user identifier
    >
      <Chat />
    </GenuiProvider>
  );
}
```

For OAuth-based auth, use `userToken` instead:

```tsx
function App() {
  const userToken = useUserToken(); // From your auth provider

  return (
    <GenuiProvider apiKey={apiKey} userToken={userToken}>
      <Chat />
    </GenuiProvider>
  );
}
```

Use `userKey` for simple user identification or `userToken` for OAuth JWT tokens. Don't use both.
