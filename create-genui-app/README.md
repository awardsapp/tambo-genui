# create-genui-app

A command-line tool to create new Genui applications with zero configuration.

## Overview

`create-genui-app` is the official way to create new [genui](https://genui.co) applications. It provides a streamlined experience for setting up new genui projects with all the necessary configurations and dependencies.

## Requirements

- Node.js >= 20
- npm >= 10

## Quick Start

You can create a new Genui application using any of these methods:

```bash
# Using npm
npm create genui-app@latest my-app

# Using yarn
yarn create genui-app my-app

# Using pnpm
pnpm create genui-app my-app

# Using npx directly
npx create-genui-app my-app
```

## Command Line Options

All arguments passed to `create-genui-app` will be forwarded to the Genui CLI's `create-app` command. For example:

```bash
npm create genui-app@latest my-app
```

## What Happens

When you run `create-genui-app`, it will:

1. Clone the selected template
2. Install dependencies
3. Initialize a git repository with an initial commit
4. Run `genui init` to set up your API key (interactive)

## What's Next?

After creating your application:

1. Navigate to your project directory: `cd my-app`
2. Start the development server: `npm run dev`
3. Open your browser to see your new Genui application

## Skip Automatic Setup

If you want to skip the automatic setup steps, use these flags:

```bash
npm create genui-app@latest my-app --skip-git-init     # Skip git initialization
npm create genui-app@latest my-app --skip-genui-init   # Skip genui init
```

## License

This project is part of the Genui ecosystem. See the Genui repository for license details.

## Links

- [Genui Documentation](https://docs.genui.co)
- [GitHub Repository](https://github.com/genui-ai/genui)
