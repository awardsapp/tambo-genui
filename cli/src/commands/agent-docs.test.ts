import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { fs as memfsFs, vol } from "memfs";

jest.unstable_mockModule("fs", () => ({
  ...memfsFs,
  default: memfsFs,
}));

jest.unstable_mockModule("inquirer", () => ({
  default: {
    prompt: jest.fn(async () => ({ proceed: true })),
  },
}));

jest.unstable_mockModule("ora", () => ({
  default: () => ({
    start: () => ({
      succeed: jest.fn(),
      fail: jest.fn(),
    }),
  }),
}));

const { handleAgentDocsUpdate } =
  await import("../../src/commands/shared/agent-docs.js");

describe("Agent Docs", () => {
  let originalCwd: () => string;

  beforeEach(() => {
    vol.reset();
    originalCwd = process.cwd;
    process.cwd = () => "/mock-project";
  });

  afterEach(() => {
    vol.reset();
    process.cwd = originalCwd;
  });

  it("creates AGENTS.md when neither exists", async () => {
    vol.fromJSON({
      "/mock-project/package.json": "{}",
    });

    await handleAgentDocsUpdate({ skipPrompt: true });

    const agentsContent = memfsFs.readFileSync(
      "/mock-project/AGENTS.md",
      "utf-8",
    ) as string;

    expect(agentsContent).toContain("Genui AI Framework");
    expect(agentsContent).toContain("<!-- genui-docs-v1.0 -->");
    expect(
      memfsFs.existsSync("/mock-project/src/components/genui/AGENTS.md"),
    ).toBe(true);
  });

  it("appends to AGENTS.md when both exist", async () => {
    vol.fromJSON({
      "/mock-project/AGENTS.md": "# Existing agent rules",
      "/mock-project/CLAUDE.md": "# Claude content",
    });

    await handleAgentDocsUpdate({ skipPrompt: true });

    const agentsContent = memfsFs.readFileSync(
      "/mock-project/AGENTS.md",
      "utf-8",
    ) as string;
    const claudeContent = memfsFs.readFileSync(
      "/mock-project/CLAUDE.md",
      "utf-8",
    ) as string;

    expect(agentsContent).toContain("# Existing agent rules");
    expect(agentsContent).toContain("Genui AI Framework");
    expect(claudeContent).toContain("# Claude content");
  });

  it("appends to CLAUDE.md when only CLAUDE.md exists", async () => {
    vol.fromJSON({
      "/mock-project/CLAUDE.md": "# Claude content",
    });

    await handleAgentDocsUpdate({ skipPrompt: true });

    const claudeContent = memfsFs.readFileSync(
      "/mock-project/CLAUDE.md",
      "utf-8",
    ) as string;

    expect(claudeContent).toContain("# Claude content");
    expect(claudeContent).toContain("Genui AI Framework");
    expect(memfsFs.existsSync("/mock-project/AGENTS.md")).toBe(false);
  });

  it("appends to AGENTS.md when only AGENTS.md exists", async () => {
    vol.fromJSON({
      "/mock-project/AGENTS.md": "# Agent guidance",
    });

    await handleAgentDocsUpdate({ skipPrompt: true });

    const agentsContent = memfsFs.readFileSync(
      "/mock-project/AGENTS.md",
      "utf-8",
    ) as string;

    expect(agentsContent).toContain("# Agent guidance");
    expect(agentsContent).toContain("Genui AI Framework");
    expect(memfsFs.existsSync("/mock-project/CLAUDE.md")).toBe(false);
  });

  it("doesn't duplicate if already present", async () => {
    const initial = `# Agents

<!-- genui-docs-v1.0 -->
## Genui AI Framework
`;
    vol.fromJSON({
      "/mock-project/AGENTS.md": initial,
    });

    await handleAgentDocsUpdate({ skipPrompt: true });

    const agentsContent = memfsFs.readFileSync(
      "/mock-project/AGENTS.md",
      "utf-8",
    ) as string;
    expect(agentsContent.match(/genui-docs-v1\.0/g)?.length).toBe(1);
  });

  it("skips with --skip-agent-docs", async () => {
    vol.fromJSON({});

    await handleAgentDocsUpdate({ skipPrompt: true, skipAgentDocs: true });

    expect(memfsFs.existsSync("/mock-project/AGENTS.md")).toBe(false);
    expect(
      memfsFs.existsSync("/mock-project/src/components/genui/AGENTS.md"),
    ).toBe(false);
  });

  it("always creates component AGENTS.md", async () => {
    vol.fromJSON({
      "/mock-project/package.json": "{}",
    });

    await handleAgentDocsUpdate({
      skipPrompt: true,
      prefix: "custom/components",
    });

    const componentAgentsPath =
      "/mock-project/custom/components/genui/AGENTS.md";
    expect(memfsFs.existsSync(componentAgentsPath)).toBe(true);
    const componentContent = memfsFs.readFileSync(
      componentAgentsPath,
      "utf-8",
    ) as string;
    expect(componentContent).toContain("Genui Components Guidelines");
  });

  it("does not overwrite component AGENTS.md if already at current version", async () => {
    const componentPath = "/mock-project/src/components/genui/AGENTS.md";
    vol.fromJSON({
      [componentPath]: `# Genui Components Guidelines

Components in this directory are registered with Genui for AI-driven generative UI.

Read the full documentation at https://docs.genui.co/llms.txt for component creation patterns and best practices.
`,
    });

    await handleAgentDocsUpdate({ skipPrompt: true });

    const content = memfsFs.readFileSync(componentPath, "utf-8") as string;
    // Should not have changed since it's already up to date
    expect(content).toContain("Genui Components Guidelines");
  });
});
