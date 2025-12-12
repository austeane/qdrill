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
></div>

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
