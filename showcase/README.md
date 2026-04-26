# genui ui

A component library for genui ai.

[![Next.js](https://img.shields.io/badge/Next.js-15.1.7-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.17-38B2AC)](https://tailwindcss.com/)

A react component library for [genui ai](https://genui.co).

## Components

### Core Components

#### Message Components

- **Full UI**
  - `MessageThreadCollapsible`: A collapsible message thread component
  - `MessageThreadFull`: Full version of the message thread
  - `MessageThreadPanel`: Panel version of the message thread
  - `ControlBar`: Control bar component

- **Message Thread Components**
  - `ThreadContent`: Content container for message threads
  - `ThreadList`: List of message threads
  - `ThreadHistory`: Historical view of message threads

- **Message Elements**
  - `Message`: Individual message component
  - `MessageInput`: Input component for sending messages
  - `MessageSuggestions`: Component for displaying message suggestions

### AI Components

#### Form Components

- `Form`: Comprehensive form component with various input types
- `InputFields`: Reusable input field components

#### Data Visualization

- `Graph`: Data visualization component

More components `coming soon`!

## Token Usage

- Default to neutral tokens (`text-foreground`, `text-muted-foreground`) for content and supporting text.
- Reserve `text-primary` for elements sitting on `bg-primary` surfaces only.
- Replace legacy `text-secondary` with `text-muted-foreground`; keep placeholders neutral with `placeholder:text-muted-foreground`.
- See `TOKENS.md` in the repo root for the full “Neutral by Default, Brand by Exception” rules.

## Installation

### Getting Started in an Existing App

```bash
# Install the full package
npx genui full-send
```

### Installing Main Components

Install the core components one by one:

```bash
# Message Thread Components
npx genui add MessageThread@latest
npx genui add MessageThreadCollapsible@latest
npx genui add MessageThreadPanel@latest
```

### Installing Sub-Components

For more granular control, install individual sub-components:

```bash
# Thread Components
npx genui add ThreadContent@latest
npx genui add ThreadList@latest
npx genui add ThreadHistory@latest

# Form Components
npx genui add Form@latest
npx genui add InputFields@latest
```

For more detailed information about the CLI and its available commands, see the [genui CLI documentation](https://github.com/genui-ai/genui/tree/main/cli).

See demos of the components in action:

--> [here](https://ui.genui.co) <--

## License

MIT License - see the [LICENSE](https://github.com/genui-ai/genui/blob/main/LICENSE) file for details.

## Join the Community

We're building tools for the future of user interfaces. Your contributions matter.

**[Star this repo](https://github.com/genui-ai/genui)** to support our work.

**[Join our Discord](https://discord.gg/dJNvPEHth6)** to connect with other developers.

---

<p align="center">
  <i>Built by developers, for developers.</i><br>
  <i>Because we believe the future of UI is generative and hyper-personalized.</i>
</p>
