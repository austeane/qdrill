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