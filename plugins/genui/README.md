# Genui Plugin for Claude Code

Build agents that speak your UI.

## Installation

```bash
# Add the marketplace and install (one time)
/plugin marketplace add https://github.com/genui-ai/genui
/plugin install genui
```

## Available Skills

| Skill                              | Description                                    | Triggers                                                       |
| ---------------------------------- | ---------------------------------------------- | -------------------------------------------------------------- |
| `genui:components`                 | Create generative and interactable components  | "GenuiComponent", "withInteractable", "propsSchema"            |
| `genui:component-rendering`        | Handle streaming props and persistent state    | "useGenuiStreamStatus", "useGenuiComponentState", "propStatus" |
| `genui:threads`                    | Manage threads, suggestions, voice, and images | "useGenuiThread", "useGenuiSuggestions", "useGenuiVoice"       |
| `genui:tools-and-context`          | Register tools, MCP servers, and context       | "defineTool", "MCP", "contextHelpers", "resources"             |
| `genui:cli`                        | Project setup and component management         | "genui init", "genui add", "non-interactive"                   |
| `genui:generative-ui`              | Build generative UI apps from scratch          | "new project", "generative UI", "create app"                   |
| `genui:add-to-existing-project`    | Integrate Genui into existing React apps       | "add Genui", "existing project", "integrate"                   |
| `genui:add-components-to-registry` | Register existing components with Genui        | "register component", "add to registry"                        |

## Usage

Skills are automatically selected based on your question, or invoke directly:

```
/genui:components                 # Generative and interactable components
/genui:component-rendering        # Streaming and state management
/genui:threads                    # Thread management, suggestions, voice
/genui:tools-and-context          # Tools, MCP, context helpers
/genui:cli                        # CLI commands
/genui:generative-ui              # Build new generative UI apps
/genui:add-to-existing-project    # Add Genui to existing projects
/genui:add-components-to-registry # Register components with Genui
```

## Managing the Plugin

```bash
/plugin enable genui        # Enable if disabled
/plugin disable genui       # Temporarily disable
/plugin uninstall genui     # Remove completely
```

## Links

- [Documentation](https://docs.genui.co)
- [Component Showcase](https://ui.genui.co)
- [GitHub](https://github.com/genui-ai/genui)
