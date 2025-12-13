<script>
	import { Check } from 'lucide-svelte';

	let {
		id = '',
		label = '',
		checked = $bindable(false),
		disabled = false,
		error = '',
		description = '',
		...restProps
	} = $props();
</script>

<div class="checkbox-wrapper">
	<label class="checkbox-label" class:disabled>
		<input
			{id}
			type="checkbox"
			bind:checked
			{disabled}
			class="checkbox-input"
			class:error
			aria-invalid={!!error}
			aria-describedby={error ? `${id}-error` : description ? `${id}-description` : undefined}
			{...restProps}
		/>

		<span class="checkbox-box">
			{#if checked}
				<Check size={14} />
			{/if}
		</span>

		{#if label}
			<span class="checkbox-text">{label}</span>
		{/if}
	</label>

	{#if description && !error}
		<p id="{id}-description" class="description">{description}</p>
	{/if}

	{#if error}
		<p id="{id}-error" class="error-message" role="alert">
			{error}
		</p>
	{/if}
</div>

<style>
	.checkbox-wrapper {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.checkbox-label {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		cursor: pointer;
		user-select: none;
	}

	.checkbox-label.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.checkbox-input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.checkbox-box {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		background: var(--color-surface-1);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
		flex-shrink: 0;
	}

	.checkbox-label:hover .checkbox-box:not(.disabled) {
		border-color: var(--color-border-strong);
	}

	.checkbox-input:focus + .checkbox-box {
		outline: none;
		border-color: var(--color-accent-9);
		box-shadow: 0 0 0 3px var(--color-focus-ring);
	}

	.checkbox-input:checked + .checkbox-box {
		background: var(--color-accent-9);
		border-color: var(--color-accent-9);
		color: white;
	}

	.checkbox-input.error + .checkbox-box {
		border-color: var(--color-error);
	}

	.checkbox-text {
		font-size: var(--font-size-base);
		color: var(--color-text-primary);
	}

	.description {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
		margin-left: 26px;
	}

	.error-message {
		font-size: var(--font-size-sm);
		color: var(--color-error);
		margin-left: 26px;
	}
</style>
