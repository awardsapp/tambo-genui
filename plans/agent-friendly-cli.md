# Agent-Friendly CLI Plan

## Executive Summary

### Motivation

The Genui CLI is built for humans: interactive prompts, spinners, colored output. This blocks CI/CD environments and AI coding assistants that can't respond to prompts.

### Goal

Make the Genui CLI gracefully handle non-interactive environments (CI, piped output, AI agents) - commands return helpful guidance instead of hanging when they can't prompt for input. Interactive mode remains the default for humans in terminals.

### Key Design Decisions

| Decision        | Choice               | Why                                    |
| --------------- | -------------------- | -------------------------------------- |
| Framework       | Keep meow            | Lowest risk, team knows it             |
| Non-interactive | Return guidance text | Don't hang - tell agents/CI what to do |
| Exit codes      | 0/1/2 contract       | Scripts need predictable behavior      |
| Claude Code     | Plugin marketplace   | Standard distribution via Skills       |

### Framework Evaluation

We evaluated three CLI frameworks before deciding to keep meow:

| Framework | Pros                                           | Cons                                 |
| --------- | ---------------------------------------------- | ------------------------------------ |
| **meow**  | minimal, proven in cli-v1                      | No built-in help formatting          |
| **citty** | Modern, TypeScript-first, good DX              | Less mature, would require rewrite   |
| **oclif** | Enterprise-grade, plugins, auto-generated help | Heavy, over-engineered for our needs |

**Decision: Keep meow** - the agent-friendly features (guidance system, TTY detection) are framework-agnostic utilities that work with any CLI framework.

---

## Part 1: Non-Interactive Mode

### 1.1 Design Principle

Commands should never hang waiting for input that won't come. In CI/non-TTY environments:

1. **Detect** that we can't prompt interactively
2. **Return guidance** telling the user/agent what to do instead
3. **Exit with code 2** (user action required)

### 1.2 TTY Detection

**The problem we're solving:**

```bash
# In CI - this hangs forever waiting for user input that will never come
genui init

# What we want instead - return guidance, don't prompt
CI=true genui init
# Output: "Error: Project name required. Run: genui init --project-name=myapp"
# Exit code: 2
```

**Implementation:**

```typescript
// cli/src/utils/tty.ts

export function isTTY(options: { stream?: NodeJS.WriteStream } = {}): boolean {
  const stream = options.stream ?? process.stdout;

  // 1. Check if stream supports TTY features
  if (!stream?.isTTY) {
    return false;
  }

  // 2. TERM=dumb means basic terminal (no colors, no cursor control)
  if (process.env.TERM === "dumb") {
    return false;
  }

  // 3. Testing override - force interactive mode for tests
  if (process.env.FORCE_INTERACTIVE === "1") {
    return true;
  }

  // 4. CI environments - never interactive
  const ciEnv = process.env.CI;
  if (typeof ciEnv === "string" && ciEnv.trim() !== "" && ciEnv !== "0") {
    return false;
  }

  // 5. GitHub Actions specifically
  if (process.env.GITHUB_ACTIONS === "true") {
    return false;
  }

  // 6. Default - assume interactive terminal
  return true;
}
```

**Detection precedence (first match wins, order matters):**

| #   | Check                    | Result          | Why                                         |
| --- | ------------------------ | --------------- | ------------------------------------------- |
| 1   | `stream.isTTY === false` | Non-interactive | Output is piped or redirected               |
| 2   | `TERM=dumb`              | Non-interactive | Terminal doesn't support features           |
| 3   | `FORCE_INTERACTIVE=1`    | **Interactive** | Testing override (takes precedence over CI) |
| 4   | `CI` env var set         | Non-interactive | Running in CI pipeline                      |
| 5   | `GITHUB_ACTIONS=true`    | Non-interactive | Running in GitHub Actions                   |
| 6   | Default                  | Interactive     | Real terminal with a human                  |

**Note:** `FORCE_INTERACTIVE=1` is checked before `CI` so tests can force interactive mode even in CI environments.

### 1.3 Command Pattern

Commands check if they can prompt, and throw a `GuidanceError` if not. The CLI entry point catches these and handles exit codes, keeping handlers testable:

```typescript
import { isTTY } from "./utils/tty.js";

// Error type for non-interactive guidance (testable - no process.exit in handlers)
class GuidanceError extends Error {
  constructor(
    message: string,
    public guidance: string[],
  ) {
    super(message);
    this.name = "GuidanceError";
  }
}

async function handleInit(options: InitOptions) {
  // Check if we can prompt the user
  if (!options.projectName && !isTTY()) {
    // Can't prompt - throw guidance error (CLI entry point handles exit code)
    throw new GuidanceError("Project name required", [
      "genui init --project-name=myapp    # Create new project",
      "genui init --project-id=abc123     # Use existing project",
    ]);
  }

  // Safe to prompt - we're in a real terminal
  const projectName =
    options.projectName ??
    (await inquirer.prompt([
      { type: "input", name: "projectName", message: "Project name?" },
    ]));

  // ... rest of init ...
}

// CLI entry point (cli.ts) - handles errors and exit codes
try {
  await runCommand(args);
  process.exit(0);
} catch (err) {
  if (err instanceof GuidanceError) {
    console.error(`Error: ${err.message}`);
    console.error("\nRun one of:");
    err.guidance.forEach((g) => console.error(`  ${g}`));
    process.exit(2); // User action required
  }
  console.error(err.message);
  process.exit(1); // General error
}
```

### 1.4 Exit Codes

| Code | Meaning              | When                                        |
| ---- | -------------------- | ------------------------------------------- |
| `0`  | Success              | Command completed successfully              |
| `1`  | Error                | Invalid args, network error, command failed |
| `2`  | User action required | Non-interactive mode needs input            |

---

## Part 2: Command Updates

### 2.1 Priority Order

| #   | Command       | Change Needed                                |
| --- | ------------- | -------------------------------------------- |
| 1   | `list`        | None - no prompts                            |
| 2   | `auth status` | None - no prompts                            |
| 3   | `auth login`  | **Keep interactive only** (requires browser) |
| 4   | `init`        | Return guidance when args missing            |
| 5   | `add`         | Accept `--yes` to skip confirmation          |
| 6   | `create-app`  | Return guidance if template not specified    |
| 7   | `update`      | Accept `--yes` to skip confirmation          |
| 8   | `migrate`     | Already has `--dry-run`                      |

### 2.2 Flags

| Command      | Flag                    | Purpose                       |
| ------------ | ----------------------- | ----------------------------- |
| `auth login` | `--no-browser`          | Output URL instead of opening |
| `init`       | `--api-key <key>`       | Direct API key input          |
| `init`       | `--project-id <id>`     | Use existing project          |
| `init`       | `--project-name <name>` | Create new project with name  |
| `init`       | `--yes`                 | Accept defaults               |
| `add`        | `--yes`                 | Skip confirmation             |
| `add`        | `--dry-run`             | Show what would be installed  |

### 2.3 Example: `genui init` Non-Interactive

**Interactive (default - unchanged):**

```
$ genui init
? Project name: my-app
? Create new project or use existing? Create new
✔ Project created
✔ SDK installed
✔ Configuration written to .env.local
```

**Non-interactive (CI/piped):**

```
$ CI=true genui init
Error: Project name required.

Run one of:
  genui init --project-name=myapp    # Create new project
  genui init --project-id=abc123     # Use existing project
  genui init --yes --project-name=myapp  # Skip all prompts

$ echo $?
2
```

**Non-interactive with flags:**

```
$ CI=true genui init --yes --project-name=myapp
✔ Project created: myapp
✔ SDK installed
✔ Configuration written to .env.local

$ echo $?
0
```

---

## Part 3: Claude Code Plugin

### 3.1 Plugin Structure

The plugin lives inside the monorepo at `claude-plugin/`:

```
genui/                                # Monorepo
├── cli/
├── react-sdk/
├── ...
└── claude-plugin/                    # Marketplace directory
    ├── .claude-plugin/
    │   └── marketplace.json          # Lists available plugins
    └── plugins/
        └── genui/                    # The Genui plugin
            ├── .claude-plugin/
            │   └── plugin.json       # Required: Plugin manifest
            ├── skills/               # Auto-discovered skills
            │   ├── generative-components/
            │   │   └── SKILL.md
            │   ├── mcp-integration/
            │   │   └── SKILL.md
            │   ├── streaming-patterns/
            │   │   └── SKILL.md
            │   ├── component-state/
            │   │   └── SKILL.md
            │   ├── interactables/
            │   │   └── SKILL.md
            │   ├── tools/
            │   │   └── SKILL.md
            │   └── cli/
            │       └── SKILL.md
            └── README.md
```

**Key rules:**

- Plugin manifest MUST be at `.claude-plugin/plugin.json` (not in root)
- Skills auto-discover from `skills/*/SKILL.md`
- Only `name` field is required in plugin.json

### 3.2 plugin.json

```json
{
  "name": "genui",
  "version": "1.0.0",
  "description": "Build AI-powered React UIs with Genui generative components",
  "author": {
    "name": "Genui AI",
    "email": "hello@genui.co",
    "url": "https://genui.co"
  },
  "homepage": "https://docs.genui.co",
  "repository": "https://github.com/genui-ai/genui",
  "license": "MIT",
  "keywords": ["ai", "react", "generative-ui", "components", "streaming", "mcp"]
}
```

### 3.3 Skills

Each skill is a subdirectory under `skills/` with a `SKILL.md` file.

#### generative-components/SKILL.md

```markdown
---
name: Generative Components
description: Use this skill when creating Genui generative components - React components that are dynamically selected and rendered by AI with generated props. Triggers on "create component", "register component", "GenuiProvider", "propsSchema", "component registration".
version: 1.0.0
---

# Generative Components

Generative components are React components dynamically created by Genui in response to user messages.

## Key Concepts

- **Registration**: Components are registered with `GenuiProvider` via the `components` array
- **Props Schema**: Use Zod schemas with `.describe()` to guide AI generation
- **Selection**: AI selects components based on `name` and `description`

## Registration Pattern

\`\`\`tsx
import { GenuiProvider } from "@workspace/react";
import { z } from "zod";

const components = [
{
name: "WeatherCard",
component: WeatherCard,
description: "Displays weather information for a location",
propsSchema: z.object({
location: z.string().describe("City name or coordinates"),
unit: z.enum(["celsius", "fahrenheit"]).optional().describe("Temperature unit")
})
}
];

<GenuiProvider
apiKey={process.env.NEXT_PUBLIC_GENUI_API_KEY}
components={components}

> {children}
> </GenuiProvider>
> \`\`\`

## Streaming Best Practices

- All props should be optional or have defaults
- Render skeleton states when props are undefined
- Use `?.` optional chaining on all prop access
- Avoid throwing errors during streaming - gracefully handle missing data

## Common Issues

- **Component not selected**: Check description clarity and schema descriptions
- **Props undefined during render**: Add null checks and loading states
- **Type errors**: Ensure Zod schema matches component props interface
```

#### mcp-integration/SKILL.md

```markdown
---
name: MCP Integration
description: Use this skill when setting up Model Context Protocol (MCP) servers with Genui. Triggers on "MCP", "model context protocol", "mcp server", "external tools", "server-side tools".
version: 1.0.0
---

# MCP Integration

Genui supports MCP servers for external tools, resources, and prompts.

## Connection Architectures

### Server-Side (Recommended for Production)

- More secure - credentials stay on server
- Required for OAuth-based MCP servers
- Configured in Genui Cloud project settings

### Client-Side (Development)

- Quick setup for local development
- Browser has direct access to MCP server
- Configured via `.mcp.json`

## Client Configuration

\`\`\`json
{
"mcpServers": {
"filesystem": {
"command": "npx",
"args": ["-y", "@anthropics/mcp-server-filesystem", "/path/to/dir"]
}
}
}
\`\`\`

## Using MCP in Components

\`\`\`tsx
import { useGenuiThread } from "@workspace/react";

function MyComponent() {
const { sendMessage } = useGenuiThread();

// MCP tools are automatically available to the AI
// Reference resources with @ mentions
await sendMessage("Read @file.txt and summarize");
}
\`\`\`

## Key Features

- **Tools**: Functions the AI can call
- **Resources**: Data sources referenced via @ mentions
- **Prompts**: Pre-defined message templates via / commands
- **Elicitations**: Mid-execution user input requests
```

#### streaming-patterns/SKILL.md

```markdown
---
name: Streaming Patterns
description: Use this skill when implementing streaming UIs with Genui. Triggers on "streaming", "partial props", "generation stage", "loading states", "useGenuiThread".
version: 1.0.0
---

# Streaming Patterns

Genui streams component props as they're generated, requiring careful UI handling.

## Generation Stages

\`\`\`typescript
type GenerationStage =
| "IDLE" // No active generation
| "CHOOSING_COMPONENT" // AI selecting component
| "FETCHING_CONTEXT" // Loading context/resources
| "HYDRATING_COMPONENT"// Preparing component instance
| "STREAMING_RESPONSE" // Props streaming in
| "COMPLETE" // Generation finished
| "ERROR"; // Generation failed
\`\`\`

## Tracking State

\`\`\`tsx
import { useGenuiThread } from "@workspace/react";

function ChatUI() {
const { generationStage, isLoading } = useGenuiThread();

return (

<div>
{isLoading && <LoadingIndicator stage={generationStage} />}
{/_ ... _/}
</div>
);
}
\`\`\`

## Component Streaming Pattern

\`\`\`tsx
function StreamingComponent({ title, items }: Props) {
// Props may be undefined during streaming
if (!title) {
return <Skeleton className="h-8 w-48" />;
}

return (

<div>
<h2>{title}</h2>
<ul>
{items?.map((item, i) => (
<li key={i}>{item}</li>
)) ?? <Skeleton className="h-4 w-full" count={3} />}
</ul>
</div>
);
}
\`\`\`

## Best Practices

1. **Optional props**: Make all props optional in schema
2. **Graceful fallbacks**: Show skeletons, not errors
3. **Progressive enhancement**: Render what you have
4. **Disable interactions**: Disable inputs during streaming
```

#### component-state/SKILL.md

```markdown
---
name: Component State
description: Use this skill when managing Genui component state that persists across sessions. Triggers on "useGenuiComponentState", "component state", "state persistence", "rehydration", "editable component".
version: 1.0.0
---

# Component State

`useGenuiComponentState` gives Genui visibility into component state, enabling persistence and AI-driven updates.

## Basic Usage

\`\`\`tsx
import { useGenuiComponentState } from "@workspace/react";

function EditableNote({ initialContent }: Props) {
const [content, setContent, setFromProp] = useGenuiComponentState(
"content",
initialContent ?? ""
);

// Handle streaming prop initialization
useEffect(() => {
if (initialContent !== undefined) {
setFromProp(initialContent);
}
}, [initialContent, setFromProp]);

return (
<textarea
value={content}
onChange={(e) => setContent(e.target.value)}
/>
);
}
\`\`\`

## Key Concepts

- **State key**: First parameter identifies the state for persistence
- **setFromProp**: Third return value handles streaming prop initialization
- **Persistence**: State survives page reloads within a thread
- **AI visibility**: State changes are visible to the AI for context

## When to Use

- Form inputs that need persistence
- User-editable content
- State the AI should know about
- Components that need rehydration
```

#### interactables/SKILL.md

```markdown
---
name: Interactables
description: Use this skill when creating Genui interactable components - pre-placed UI that connects to Genui. Triggers on "withInteractable", "interactable", "bidirectional", "pre-placed component", "existing UI".
version: 1.0.0
---

# Interactable Components

Interactables are pre-placed components that maintain a bidirectional connection with Genui.

## Key Difference from Generative

| Generative                            | Interactable               |
| ------------------------------------- | -------------------------- |
| Created by AI in response to messages | Pre-placed in your UI      |
| One-time render per message           | Persistent across session  |
| Props generated once                  | Props can be updated by AI |

## Creating an Interactable

\`\`\`tsx
import { withInteractable } from "@workspace/react";
import { z } from "zod";

const propsSchema = z.object({
theme: z.enum(["light", "dark"]).describe("Color theme"),
fontSize: z.number().min(12).max(24).describe("Font size in pixels")
});

function SettingsPanel({ theme, fontSize, onThemeChange }: Props) {
return (

<div>
<select value={theme} onChange={e => onThemeChange(e.target.value)}>
<option value="light">Light</option>
<option value="dark">Dark</option>
</select>
<span>Font: {fontSize}px</span>
</div>
);
}

export const InteractableSettings = withInteractable(SettingsPanel, {
name: "settings",
description: "User preferences panel",
propsSchema
});
\`\`\`

## How It Works

1. Component state is sent to AI as context
2. AI can update props via auto-registered tool
3. Component re-renders with new props
4. Changes persist in thread state
```

#### tools/SKILL.md

```markdown
---
name: Tool Registration
description: Use this skill when registering tools (functions) that Genui can call. Triggers on "register tool", "useGenuiRegistry", "tool schema", "function calling", "genui tools".
version: 1.0.0
---

# Tool Registration

Tools are JavaScript functions that Genui can call during conversations.

## Basic Registration

\`\`\`tsx
import { useGenuiRegistry } from "@workspace/react";
import { z } from "zod";

function MyComponent() {
const { registerTool } = useGenuiRegistry();

useEffect(() => {
registerTool({
name: "searchProducts",
description: "Search product catalog by query",
inputSchema: z.object({
query: z.string().describe("Search terms"),
limit: z.number().optional().describe("Max results")
}),
execute: async ({ query, limit = 10 }) => {
const results = await searchAPI(query, limit);
return { products: results };
}
});
}, [registerTool]);
}
\`\`\`

## Tool Annotations

\`\`\`typescript
registerTool({
name: "deleteUser",
description: "Delete a user account",
inputSchema: z.object({ userId: z.string() }),
annotations: {
title: "Delete User",
destructiveHint: true, // Warns AI this is destructive
idempotentHint: false, // Not safe to retry
readOnlyHint: false // Modifies state
},
execute: async ({ userId }) => { /_ ... _/ }
});
\`\`\`

## Best Practices

- Clear, action-oriented names (`searchProducts` not `products`)
- Descriptive schemas with `.describe()` on all fields
- Handle errors gracefully - return error objects, don't throw
- Use `destructiveHint` for state-modifying operations
```

#### cli/SKILL.md

```markdown
---
name: Genui CLI
description: Use this skill when working with the Genui CLI for project setup, component management, and authentication. Triggers on "genui init", "genui add", "genui list", "genui auth", "genui create-app".
version: 1.0.0
---

# Genui CLI

The Genui CLI helps with project setup, component management, and authentication.

## Quick Start

\`\`\`bash

# Initialize in existing project

genui init --yes --project-name=myapp

# Add components

genui add message thread --yes

# Check what's installed

genui list
\`\`\`

## Commands

### genui init

Initialize Genui in an existing project:

\`\`\`bash
genui init # Interactive mode
genui init --yes # Accept defaults
genui init --project-name=myapp # Create new project
genui init --project-id=abc123 # Use existing project
genui init --api-key=sk\_... # Provide API key directly
\`\`\`

### genui add

Install components from the registry:

\`\`\`bash
genui add message # Add single component
genui add message thread input # Add multiple
genui add message --yes # Skip confirmation
genui add message --dry-run # Preview changes
\`\`\`

### genui list

List installed and available components:

\`\`\`bash
genui list # Human-readable table
\`\`\`

### genui auth

Authentication commands:

\`\`\`bash
genui auth login # Browser-based auth
genui auth login --no-browser # Print URL instead
genui auth status # Check auth status
genui auth logout # Clear credentials
\`\`\`

### genui create-app

Create a new Genui application:

\`\`\`bash
genui create-app my-app # Interactive
genui create-app my-app --template=standard # Standard template
genui create-app my-app --template=analytics # Analytics template
genui create-app my-app --no-install-deps # Skip npm install
\`\`\`

## Non-Interactive Mode

In CI/non-TTY environments, commands return guidance instead of prompting:

\`\`\`bash
CI=true genui init

# Error: Project name required.

# Run: genui init --project-name=myapp

\`\`\`
```

### 3.4 Marketplace Distribution

The marketplace lives **inside the genui monorepo** at `claude-plugin/`:

**marketplace.json:**

```json
{
  "name": "genui-marketplace",
  "owner": {
    "name": "Genui AI",
    "email": "hello@genui.co"
  },
  "metadata": {
    "description": "Official Genui plugins for Claude Code",
    "homepage": "https://genui.co"
  },
  "plugins": [
    {
      "name": "genui",
      "source": "./plugins/genui",
      "description": "Build AI-powered React UIs with Genui generative components",
      "version": "1.0.0",
      "author": {
        "name": "Genui AI",
        "email": "hello@genui.co"
      },
      "category": "frameworks",
      "keywords": ["ai", "react", "generative-ui", "components", "streaming"]
    }
  ]
}
```

### 3.5 User Installation

```bash
# Step 1: Add the marketplace (one time)
/plugin marketplace add genui-ai/genui/claude-plugin

# Step 2: Install the plugin
/plugin install genui

# Step 3: Use skills
/genui:generative-components    # Help with component creation
/genui:mcp-integration          # Help with MCP setup
/genui:streaming-patterns       # Help with streaming UIs
/genui:component-state          # Help with state management
/genui:interactables            # Help with interactable components
/genui:tools                    # Help with tool registration
/genui:cli                      # Help with CLI commands

# Managing plugins
/plugin enable genui            # Enable if disabled
/plugin disable genui           # Temporarily disable
/plugin uninstall genui         # Remove completely
```

---

## Part 4: Testing

### 4.1 Non-Interactive Safety Tests

```typescript
// cli/src/__tests__/non-interactive-safety.test.ts

describe("non-interactive mode", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.CI = "true";
    jest.spyOn(process.stdout, "isTTY", "get").mockReturnValue(false);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it("list completes without prompts", async () => {
    const mockPrompt = jest.spyOn(inquirer, "prompt");
    await runCommand(["list"]);
    expect(mockPrompt).not.toHaveBeenCalled();
  });

  it("init returns guidance when args missing", async () => {
    const mockPrompt = jest.spyOn(inquirer, "prompt");
    const result = await runCommand(["init"]);

    expect(mockPrompt).not.toHaveBeenCalled();
    expect(result.stderr).toContain("--project-name");
    expect(result.exitCode).toBe(2);
  });
});
```

### 4.2 CI Workflow

```yaml
# .github/workflows/cli-non-interactive.yml
name: CLI Non-Interactive Tests

on:
  push:
    paths:
      - "cli/**"
  pull_request:
    paths:
      - "cli/**"

jobs:
  cli-non-interactive:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
      - run: npm ci
      - run: npm run build -w cli

      - name: Test non-interactive mode
        shell: bash
        run: |
          set -euo pipefail

          # list should complete without hanging
          timeout 30 node ./cli/dist/cli.js list

          # auth status should complete
          timeout 30 node ./cli/dist/cli.js auth status

          # init without args should return guidance (exit 2)
          timeout 30 node ./cli/dist/cli.js init; code=$?; [ $code -eq 2 ]
```

---

## Part 5: Implementation Steps

### Phase 1: Core Infrastructure

| Task                          | Description                         |
| ----------------------------- | ----------------------------------- |
| Create `cli/src/utils/tty.ts` | TTY detection with precedence rules |
| Exit code handling            | Implement 0/1/2 contract            |

### Phase 2: Command Updates

| Task                      | Description                               |
| ------------------------- | ----------------------------------------- |
| Update `genui init`       | Return guidance when args missing         |
| Update `genui add`        | Ensure `--yes` skips confirmation         |
| Update `genui create-app` | Return guidance if template not specified |

### Phase 3: Plugin & Testing

| Task                     | Description                            |
| ------------------------ | -------------------------------------- |
| Create plugin directory  | `claude-plugin/` with proper structure |
| Write all SKILL.md files | 7 skills covering Genui concepts       |
| Set up marketplace       | Either own or submit to community      |
| Non-interactive tests    | Add test suite for all commands        |
| CI workflow              | Add GitHub Actions verification        |

---

## Part 6: Success Criteria

1. Commands don't hang in CI/non-TTY environments
2. Non-interactive mode returns guidance text (exit code 2) instead of hanging
3. `genui init --yes --project-name=myapp` works without prompts
4. TTY detection follows documented precedence
5. CI workflow verifies commands don't hang (timeout-based)
6. Plugin installable via `/plugin marketplace add` + `/plugin install genui`
7. All 7 skills cover key Genui concepts
8. Test coverage for non-interactive scenarios

---

## Part 7: Risks & Mitigations

| Risk                       | Mitigation                                               |
| -------------------------- | -------------------------------------------------------- |
| Breaking existing behavior | Keep interactive as default, non-interactive is fallback |
| Auth needs browser         | Add `--no-browser` flag, output URL to copy              |
| Plugin format changes      | Follow official Claude Code spec closely                 |
| Marketplace not approved   | Can host own marketplace or direct GitHub install        |

---

## Future Considerations

| Feature            | Notes                                   |
| ------------------ | --------------------------------------- |
| `--json` output    | Add machine-readable JSON output mode   |
| Structured schemas | Define consistent result object schemas |
