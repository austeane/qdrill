<script>
	let {
		id = '',
		label = '',
		value = $bindable(''),
		options = [], // [{value, label}]
		placeholder = 'Select an option',
		error = '',
		required = false,
		disabled = false,
		...restProps
	} = $props();

	const baseId = $props.id();
	const uid = $derived(id || `select-${baseId}`);
</script>

<div class="select-wrapper">
	{#if label}
		<label for={uid} class="label">
			{label}
			{#if required}
				<span class="required">*</span>
			{/if}
		</label>
	{/if}

	<select
		id={uid}
		bind:value
		{required}
		{disabled}
		class="select"
		class:error
		aria-invalid={!!error}
		aria-describedby={error ? `${uid}-error` : undefined}
		{...restProps}
	>
		<option value="" disabled>
			{placeholder}
		</option>
		{#each options as option (option.value)}
			<option value={option.value}>
				{option.label}
			</option>
		{/each}
	</select>

	{#if error}
		<p id="{uid}-error" class="error-message" role="alert">
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
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 20 20'%3E%3Cpath fill='%23999' d='M5.5 7.5L10 12l4.5-4.5'/%3E%3C/svg%3E");
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
