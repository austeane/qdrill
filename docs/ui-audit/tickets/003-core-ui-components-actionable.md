# Ticket 003: Core UI Components - ACTIONABLE

## Overview
Create standardized, accessible UI components including buttons, inputs, tabs, dialogs, cards, skeletons, and toast notifications.

## Prerequisites
- [x] Complete Ticket 001 (Design Tokens)
- [x] Libraries installed: `bits-ui`, `lucide-svelte`, `@zerodevx/svelte-toast` (already installed)

## File Structure
```
src/lib/components/ui/
├── Button.svelte (NEW)
├── Input.svelte (NEW)
├── Select.svelte (NEW)
├── Textarea.svelte (NEW)
├── Tabs.svelte (NEW)
├── Dialog.svelte (NEW)
├── Card.svelte (NEW)
├── Skeleton.svelte (MODIFY existing)
├── ToastHost.svelte (NEW)
├── Badge.svelte (NEW)
├── Checkbox.svelte (NEW)
└── icons.ts (NEW)
```

## Implementation Steps

### Step 1: Create Button Component (`src/lib/components/ui/Button.svelte`)

```svelte
<script>
  import { Loader2 } from 'lucide-svelte';
  
  export let variant = 'primary'; // primary, secondary, ghost, destructive
  export let size = 'md'; // sm, md, lg
  export let loading = false;
  export let disabled = false;
  export let type = 'button';
  export let href = null;
  
  const Tag = href ? 'a' : 'button';
</script>

<svelte:element
  this={Tag}
  {href}
  {type}
  disabled={disabled || loading}
  aria-disabled={disabled || loading}
  class="btn btn-{variant} btn-{size}"
  class:loading
  on:click
  {...$$restProps}
>
  {#if loading}
    <Loader2 class="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
  {/if}
  <slot />
</svelte:element>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    font-weight: var(--font-weight-medium);
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
    cursor: pointer;
    white-space: nowrap;
    text-decoration: none;
    border: 1px solid transparent;
  }
  
  /* Sizes */
  .btn-sm {
    padding: var(--space-1) var(--space-3);
    font-size: var(--font-size-sm);
  }
  
  .btn-md {
    padding: var(--space-2) var(--space-4);
    font-size: var(--font-size-base);
  }
  
  .btn-lg {
    padding: var(--space-3) var(--space-6);
    font-size: var(--font-size-lg);
  }
  
  /* Variants */
  .btn-primary {
    background: var(--color-accent-9);
    color: white;
    border-color: var(--color-accent-9);
  }
  
  .btn-primary:hover:not(:disabled) {
    background: var(--color-accent-10);
    border-color: var(--color-accent-10);
  }
  
  .btn-secondary {
    background: var(--color-surface-3);
    color: var(--color-text-primary);
    border-color: var(--color-border-default);
  }
  
  .btn-secondary:hover:not(:disabled) {
    background: var(--color-bg-muted);
    border-color: var(--color-border-strong);
  }
  
  .btn-ghost {
    background: transparent;
    color: var(--color-text-primary);
  }
  
  .btn-ghost:hover:not(:disabled) {
    background: var(--color-bg-subtle);
  }
  
  .btn-destructive {
    background: var(--color-error);
    color: white;
    border-color: var(--color-error);
  }
  
  .btn-destructive:hover:not(:disabled) {
    opacity: 0.9;
  }
  
  /* States */
  .btn:disabled,
  .btn[aria-disabled="true"] {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn.loading {
    position: relative;
    color: transparent;
  }
  
  .btn.loading > :global(svg) {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    color: currentColor;
  }
  
  :global(.animate-spin) {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }
</style>
```

### Step 2: Create Input Component (`src/lib/components/ui/Input.svelte`)

```svelte
<script>
  import { createEventDispatcher } from 'svelte';
  
  export let id = '';
  export let label = '';
  export let type = 'text';
  export let value = '';
  export let placeholder = '';
  export let error = '';
  export let description = '';
  export let required = false;
  export let disabled = false;
  export let readonly = false;
  
  const dispatch = createEventDispatcher();
  
  function handleInput(e) {
    value = e.target.value;
    dispatch('input', e);
  }
</script>

<div class="input-wrapper">
  {#if label}
    <label for={id} class="label">
      {label}
      {#if required}
        <span class="required">*</span>
      {/if}
    </label>
  {/if}
  
  {#if description}
    <p class="description">{description}</p>
  {/if}
  
  <input
    {id}
    {type}
    {value}
    {placeholder}
    {required}
    {disabled}
    {readonly}
    class="input"
    class:error={error}
    aria-invalid={!!error}
    aria-describedby={error ? `${id}-error` : description ? `${id}-description` : undefined}
    on:input={handleInput}
    on:change
    on:blur
    on:focus
    {...$$restProps}
  />
  
  {#if error}
    <p id="{id}-error" class="error-message" role="alert">
      {error}
    </p>
  {/if}
</div>

<style>
  .input-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }
  
  .label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }
  
  .required {
    color: var(--color-error);
  }
  
  .description {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  
  .input {
    width: 100%;
    padding: var(--space-2) var(--space-3);
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    font-size: var(--font-size-base);
    color: var(--color-text-primary);
    transition: all var(--transition-fast);
  }
  
  .input:hover:not(:disabled) {
    border-color: var(--color-border-strong);
  }
  
  .input:focus {
    outline: none;
    border-color: var(--color-accent-9);
    box-shadow: 0 0 0 3px var(--color-focus-ring);
  }
  
  .input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--color-bg-muted);
  }
  
  .input.error {
    border-color: var(--color-error);
  }
  
  .input.error:focus {
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
  }
  
  .error-message {
    font-size: var(--font-size-sm);
    color: var(--color-error);
  }
</style>
```

### Step 3: Create Select Component (`src/lib/components/ui/Select.svelte`)

```svelte
<script>
  export let id = '';
  export let label = '';
  export let value = '';
  export let options = []; // [{value, label}]
  export let placeholder = 'Select an option';
  export let error = '';
  export let required = false;
  export let disabled = false;
</script>

<div class="select-wrapper">
  {#if label}
    <label for={id} class="label">
      {label}
      {#if required}
        <span class="required">*</span>
      {/if}
    </label>
  {/if}
  
  <select
    {id}
    bind:value
    {required}
    {disabled}
    class="select"
    class:error={error}
    aria-invalid={!!error}
    on:change
    on:blur
    {...$$restProps}
  >
    <option value="" disabled selected={!value}>
      {placeholder}
    </option>
    {#each options as option}
      <option value={option.value}>
        {option.label}
      </option>
    {/each}
  </select>
  
  {#if error}
    <p class="error-message" role="alert">
      {error}
    </p>
  {/if}
</div>

<style>
  .select-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }
  
  .label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }
  
  .required {
    color: var(--color-error);
  }
  
  .select {
    width: 100%;
    padding: var(--space-2) var(--space-3);
    padding-right: var(--space-8);
    background: var(--color-surface-1);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right var(--space-3) center;
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    font-size: var(--font-size-base);
    color: var(--color-text-primary);
    cursor: pointer;
    appearance: none;
    transition: all var(--transition-fast);
  }
  
  .select:hover:not(:disabled) {
    border-color: var(--color-border-strong);
  }
  
  .select:focus {
    outline: none;
    border-color: var(--color-accent-9);
    box-shadow: 0 0 0 3px var(--color-focus-ring);
  }
  
  .select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: var(--color-bg-muted);
  }
  
  .select.error {
    border-color: var(--color-error);
  }
  
  .error-message {
    font-size: var(--font-size-sm);
    color: var(--color-error);
  }
</style>
```

### Step 4: Create Dialog Component (`src/lib/components/ui/Dialog.svelte`)

```svelte
<script>
  import { Dialog as DialogPrimitive } from 'bits-ui';
  import { X } from 'lucide-svelte';
  
  export let open = false;
  export let title = '';
  export let description = '';
</script>

<DialogPrimitive.Root bind:open>
  <DialogPrimitive.Trigger asChild let:builder>
    <slot name="trigger" {builder} />
  </DialogPrimitive.Trigger>
  
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay class="dialog-overlay" />
    <DialogPrimitive.Content class="dialog-content">
      <div class="dialog-header">
        {#if title}
          <DialogPrimitive.Title class="dialog-title">
            {title}
          </DialogPrimitive.Title>
        {/if}
        <DialogPrimitive.Close class="dialog-close">
          <X size={20} />
          <span class="sr-only">Close</span>
        </DialogPrimitive.Close>
      </div>
      
      {#if description}
        <DialogPrimitive.Description class="dialog-description">
          {description}
        </DialogPrimitive.Description>
      {/if}
      
      <div class="dialog-body">
        <slot />
      </div>
      
      {#if $$slots.footer}
        <div class="dialog-footer">
          <slot name="footer" />
        </div>
      {/if}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
</DialogPrimitive.Root>

<style>
  :global(.dialog-overlay) {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    animation: fadeIn 150ms ease;
    z-index: 50;
  }
  
  :global(.dialog-content) {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 90vw;
    max-width: 500px;
    max-height: 85vh;
    background: var(--color-surface-1);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-xl);
    animation: contentShow 150ms ease;
    z-index: 51;
    overflow: auto;
  }
  
  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4);
    border-bottom: 1px solid var(--color-border-default);
  }
  
  :global(.dialog-title) {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }
  
  :global(.dialog-close) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  :global(.dialog-close:hover) {
    background: var(--color-bg-subtle);
    color: var(--color-text-primary);
  }
  
  :global(.dialog-description) {
    padding: 0 var(--space-4);
    margin-top: var(--space-2);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  
  .dialog-body {
    padding: var(--space-4);
  }
  
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-2);
    padding: var(--space-4);
    border-top: 1px solid var(--color-border-default);
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes contentShow {
    from {
      opacity: 0;
      transform: translate(-50%, -48%) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }
  
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
```

### Step 5: Create Card Component (`src/lib/components/ui/Card.svelte`)

```svelte
<script>
  export let variant = 'default'; // default, bordered, elevated
  export let padding = 'md'; // sm, md, lg
</script>

<div class="card card-{variant} padding-{padding}" {...$$restProps}>
  {#if $$slots.header}
    <div class="card-header">
      <slot name="header" />
    </div>
  {/if}
  
  <div class="card-content">
    <slot />
  </div>
  
  {#if $$slots.footer}
    <div class="card-footer">
      <slot name="footer" />
    </div>
  {/if}
</div>

<style>
  .card {
    background: var(--color-surface-1);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
  
  .card-default {
    /* No additional styling */
  }
  
  .card-bordered {
    border: 1px solid var(--color-border-default);
  }
  
  .card-elevated {
    box-shadow: var(--shadow-md);
  }
  
  .card-header {
    padding: var(--space-4);
    border-bottom: 1px solid var(--color-border-default);
    font-weight: var(--font-weight-semibold);
  }
  
  .card-content {
    padding: var(--space-4);
  }
  
  .padding-sm .card-content {
    padding: var(--space-2);
  }
  
  .padding-lg .card-content {
    padding: var(--space-6);
  }
  
  .card-footer {
    padding: var(--space-4);
    border-top: 1px solid var(--color-border-default);
    background: var(--color-bg-subtle);
  }
</style>
```

### Step 6: Update Skeleton Component (`src/lib/components/ui/Skeleton.svelte`)

```svelte
<script>
  export let variant = 'rect'; // rect, line, circle
  export let width = '100%';
  export let height = '20px';
  export let rounded = false;
</script>

<div 
  class="skeleton skeleton-{variant}"
  class:rounded
  style="width: {width}; height: {height};"
/>

<style>
  .skeleton {
    background: linear-gradient(
      90deg,
      var(--color-bg-muted) 25%,
      var(--color-surface-3) 50%,
      var(--color-bg-muted) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  
  .skeleton-rect {
    border-radius: var(--radius-md);
  }
  
  .skeleton-line {
    border-radius: var(--radius-sm);
    height: 12px;
  }
  
  .skeleton-circle {
    border-radius: 50%;
  }
  
  .rounded {
    border-radius: var(--radius-full);
  }
  
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
</style>
```

### Step 7: Create Tabs Component (`src/lib/components/ui/Tabs.svelte`)

```svelte
<script>
  import { Tabs as TabsPrimitive } from 'bits-ui';
  
  export let value = '';
  export let tabs = []; // [{value, label, content}]
</script>

<TabsPrimitive.Root bind:value class="tabs">
  <TabsPrimitive.List class="tabs-list">
    {#each tabs as tab}
      <TabsPrimitive.Trigger value={tab.value} class="tabs-trigger">
        {tab.label}
      </TabsPrimitive.Trigger>
    {/each}
  </TabsPrimitive.List>
  
  {#each tabs as tab}
    <TabsPrimitive.Content value={tab.value} class="tabs-content">
      {#if tab.content}
        {@html tab.content}
      {:else}
        <slot name={tab.value} />
      {/if}
    </TabsPrimitive.Content>
  {/each}
</TabsPrimitive.Root>

<style>
  :global(.tabs) {
    width: 100%;
  }
  
  :global(.tabs-list) {
    display: flex;
    gap: var(--space-1);
    border-bottom: 1px solid var(--color-border-default);
    margin-bottom: var(--space-4);
  }
  
  :global(.tabs-trigger) {
    padding: var(--space-2) var(--space-4);
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--color-text-muted);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    transition: all var(--transition-fast);
    margin-bottom: -1px;
  }
  
  :global(.tabs-trigger:hover) {
    color: var(--color-text-primary);
  }
  
  :global(.tabs-trigger[data-state="active"]) {
    color: var(--color-accent-9);
    border-bottom-color: var(--color-accent-9);
  }
  
  :global(.tabs-content) {
    animation: fadeIn 150ms ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>
```

### Step 8: Create Icons Export (`src/lib/components/ui/icons.ts`)

```typescript
// Re-export commonly used icons for consistency
export {
  // Navigation
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  
  // Actions
  Plus,
  Minus,
  Edit,
  Trash,
  Save,
  Download,
  Upload,
  Copy,
  Share,
  
  // UI
  Search,
  Filter,
  Settings,
  Info,
  HelpCircle,
  AlertCircle,
  CheckCircle,
  XCircle,
  
  // User
  User,
  Users,
  LogIn,
  LogOut,
  
  // Media
  Image,
  Play,
  Pause,
  
  // Common
  Calendar,
  Clock,
  Target,
  Loader2,
  MoreVertical,
  MoreHorizontal
} from 'lucide-svelte';
```

## Testing Checklist

- [ ] All buttons show loading state with spinner
- [ ] Disabled states are visually distinct and not clickable
- [ ] Input validation shows error messages
- [ ] Select dropdowns work with keyboard navigation
- [ ] Dialogs trap focus and restore on close
- [ ] Cards render with proper spacing and borders
- [ ] Skeleton loaders animate smoothly
- [ ] Tabs switch content without page reload
- [ ] All components respect theme colors
- [ ] Focus states are visible on all interactive elements
- [ ] Components are screen reader accessible

## Usage Examples

```svelte
<!-- Button -->
<Button variant="primary" size="lg" loading={isLoading} on:click={handleClick}>
  Save Changes
</Button>

<!-- Input -->
<Input 
  label="Email" 
  type="email" 
  bind:value={email} 
  error={errors.email}
  required
/>

<!-- Dialog -->
<Dialog title="Confirm Action" bind:open={dialogOpen}>
  <p>Are you sure you want to proceed?</p>
  <div slot="footer">
    <Button variant="ghost" on:click={() => dialogOpen = false}>Cancel</Button>
    <Button variant="primary" on:click={handleConfirm}>Confirm</Button>
  </div>
</Dialog>

<!-- Card -->
<Card variant="bordered">
  <h3 slot="header">Card Title</h3>
  <p>Card content goes here</p>
  <div slot="footer">
    <Button size="sm">Action</Button>
  </div>
</Card>
```

## Integration Notes

- Replace existing button components with new Button.svelte
- Update forms to use new Input/Select components
- Replace existing modals with Dialog component
- Use consistent icon imports from icons.ts

## Next Steps
After completing this ticket, proceed to Ticket 004 (Drills Library Revamp) which will use these components to rebuild the drills page.