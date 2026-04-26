export const newProjectSteps = [
  {
    number: "01",
    title: "Create a new project",
    description: "Create a new project using our template.",
    code: "npm create genui-app my-app",
    path: "~/",
    isCode: false,
    language: "bash",
  },
  {
    number: "02",
    title: "Navigate to project directory",
    description: "Change into your project directory.",
    code: "cd my-app",
    path: "~/",
    isCode: false,
    language: "bash",
  },
  {
    number: "03",
    title: "Initialize genui",
    description: "Initialize genui in your project.",
    code: "npx genui init",
    path: "~/my-app",
    isCode: false,
    language: "bash",
  },
  {
    number: "04",
    title: "Start development server",
    description: "Start your development server.",
    code: "npm run dev",
    path: "~/my-app",
    isCode: false,
    language: "bash",
  },
  {
    number: "05",
    title: "Add components (optional)",
    description: "Add additional components as needed.",
    code: "npx genui add form",
    path: "~/my-app",
    isCode: false,
    language: "bash",
  },
];

export const existingProjectSteps = [
  {
    number: "01",
    title: "Install genui-ai",
    description:
      "Run the full-send command to setup your project. This command will setup your project, get an API key, and install components.",
    code: "npx genui full-send",
    path: "~/your-project",
    isCode: false,
  },
  {
    number: "02",
    title: "Add GenuiProvider",
    description:
      "Update your layout.tsx file. Wrap your app with GenuiProvider to enable genui features.",
    path: "~/your-project/src/app/layout.tsx",
    code: `"use client";
  
  import { GenuiProvider } from "@workspace/react";
  
  export default function RootLayout({ children }) {
    return (
      <GenuiProvider apiKey={process.env.NEXT_PUBLIC_GENUI_API_KEY ?? ""}>
        {children}
      </GenuiProvider>
    );
  }`,
    isCode: true,
    language: "tsx",
  },
  {
    number: "03",
    title: "Add MessageThreadFull",
    description:
      "Import and use the chat component. Add a complete chat interface to your application.",
    path: "~/your-project/src/app/page.tsx",
    code: `import { MessageThreadFull } from "@/components/genui/message-thread-full";
  
  export default function Home() {
    return (
      <main>
        <MessageThreadFull />
      </main>
    );
  }`,
    isCode: true,
    language: "tsx",
  },
  {
    number: "04",
    title: "Register Components",
    description:
      "Register your components with Genui. Register your components with Genui to make them available for AI-driven rendering.",
    path: "~/your-project/src/app/layout.tsx",
    code: `"use client";
  
  import { GenuiProvider } from "@workspace/react";
  import { z } from "zod/v3";
  import { MyComponent } from "@/components/MyComponent";
  
  // Define component props schema
  const MyComponentProps = z.object({
    title: z.string(),
    data: z.array(z.number())
  });
  
  const components = [
    {
      name: "MyComponent",
      description: "Displays data in my component",
      component: MyComponent,
      propsSchema: MyComponentProps,
    }
  ];
  
  export default function RootLayout({ children }) {
    return (
      <GenuiProvider 
        apiKey={process.env.NEXT_PUBLIC_GENUI_API_KEY ?? ""}
        components={components}
      >
        {children}
      </GenuiProvider>
    );
  }`,
    isCode: true,
    language: "tsx",
  },
];

// For backward compatibility
export const steps = existingProjectSteps;
