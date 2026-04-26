# Genui React Naming Conventions

### Naming Prefixes

- Components: `Genui`
- Hooks: `useGenui`
- Types: `Genui`
- Props Interface: `GenuiNameProps`
- Context: `GenuiNameContext`
- Boolean props:
  - `is` → Current state/condition (isLoading, isActive)
  - `can` → Permissions/abilities (canEdit, canSubmit)
  - `has` → Existence/past state (hasError, hasData)
  - `should` → Configuration/future (shouldRefresh)

## Core Principles

- Use `Readonly<T>` for props

```typescript
export const GenuiMessage: React.FC<Readonly<GenuiMessageProps>> = () => {
  /* ... */
};
```

## Hooks

- Prefix: `useGenui` + Feature
- Specific action last
- Keep single responsibility

```typescript
useGenuiMessage(); // ✓ Core hook
useGenuiMessageState(); // ✓ State management
useMessageGenui(); // ✗ Wrong prefix order
```

## Props & Types

```typescript
// Props - Always Readonly
interface GenuiMessageProps extends Readonly<{
  id: string; // Required props first
  onUpdate: (message: GenuiMessage) => void; // Callbacks use 'on' prefix
  isLoading?: boolean; // Optional props last
}> {}

// Types - Clear hierarchy
type GenuiMessage = {
  /* ... */
}; // Core type
type GenuiMessageState = {
  /* ... */
}; // State type
type GenuiMessageConfig = {
  /* ... */
}; // Config type
```

## Event Handlers

```typescript
// Props (external)
onMessageSend: (msg: string) => void;           // ✓ 'on' prefix

// Implementation (internal)
const handleSend = useCallback(() => {          // ✓ 'handle' prefix
  // Implementation
}, [deps]);
```
