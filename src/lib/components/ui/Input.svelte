<script>
	let {
		id = '',
		label = '',
		type = 'text',
		value = $bindable(''),
		placeholder = '',
		error = '',
		description = '',
		required = false,
		disabled = false,
		readonly = false,
		...restProps
	} = $props();

	const baseId = $props.id();
	const uid = $derived(id || `input-${baseId}`);
</script>

<div class="input-wrapper">
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

	<input
		id={uid}
		{type}
		{placeholder}
		{required}
		{disabled}
		{readonly}
		class="input"
		class:error
		aria-invalid={!!error}
		aria-describedby={error ? `${uid}-error` : description ? `${uid}-description` : undefined}
		bind:value
		{...restProps}
	/>

	{#if error}
		<p id="{uid}-error" class="error-message" role="alert">
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
