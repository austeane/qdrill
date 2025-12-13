<script>
	let {
		id = '',
		label = '',
		value = $bindable(''),
		placeholder = '',
		error = '',
		description = '',
		required = false,
		disabled = false,
		readonly = false,
		rows = 4,
		...restProps
	} = $props();

	const baseId = $props.id();
	const uid = $derived(id || `textarea-${baseId}`);
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
		{placeholder}
		{required}
		{disabled}
		{readonly}
		{rows}
		class="textarea"
		class:error
		aria-invalid={!!error}
		aria-describedby={error ? `${uid}-error` : description ? `${uid}-description` : undefined}
		bind:value
		{...restProps}
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
