<script>
  import { createEventDispatcher, onMount } from 'svelte';
  
  export let id = '';
  export let label = '';
  export let value = '';
  export let placeholder = '';
  export let error = '';
  export let description = '';
  export let required = false;
  export let disabled = false;
  export let readonly = false;
  export let rows = 4;
  
  let uid = id;
  
  onMount(() => {
    if (!uid && typeof crypto !== 'undefined') {
      uid = 'textarea-' + crypto.randomUUID();
    }
  });
  
  const dispatch = createEventDispatcher();
  
  function handleInput(e) {
    value = e.target.value;
    dispatch('input', e);
  }
</script>

<div class="textarea-wrapper">
  {#if label}
    <label for={uid} class="label">
      {label}
      {#if required}
        <span class="required">*</span>
      {/if}
    </label>
  {/if}
  
  {#if description}
    <p class="description">{description}</p>
  {/if}
  
  <textarea
    id={uid}
    {value}
    {placeholder}
    {required}
    {disabled}
    {readonly}
    {rows}
    class="textarea"
    class:error={error}
    aria-invalid={!!error}
    aria-describedby={error ? `${uid}-error` : description ? `${uid}-description` : undefined}
    on:input={handleInput}
    on:change
    on:blur
    on:focus
    {...$$restProps}
  ></textarea>
  
  {#if error}
    <p id="{uid}-error" class="error-message" role="alert">
      {error}
    </p>
  {/if}
</div>

<style>
  .textarea-wrapper {
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
  
  .textarea {
    width: 100%;
    padding: var(--space-2) var(--space-3);
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    font-size: var(--font-size-base);
    font-family: inherit;
    color: var(--color-text-primary);
    resize: vertical;
    transition: all var(--transition-fast);
  }
  
  .textarea:hover:not(:disabled) {
    border-color: var(--color-border-strong);
  }
  
  .textarea:focus {
    outline: none;
    border-color: var(--color-accent-9);
    box-shadow: 0 0 0 3px var(--color-focus-ring);
  }
  
  .textarea:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--color-bg-muted);
    resize: none;
  }
  
  .textarea.error {
    border-color: var(--color-error);
  }
  
  .textarea.error:focus {
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
  }
  
  .error-message {
    font-size: var(--font-size-sm);
    color: var(--color-error);
  }
</style>