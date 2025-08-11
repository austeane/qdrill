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