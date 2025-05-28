<script>
	export let formations = [];
</script>

{#if formations.length > 0}
	<div class="formation-reference-bar">
		<span class="reference-label">Formations:</span>
		<div class="formation-links">
			{#each formations as formation}
				<a 
					href="/formations/{formation.formation_id || formation.id}" 
					target="_blank"
					rel="noopener noreferrer"
					class="formation-link"
					title="View {formation.name} formation"
				>
					{formation.name}
				</a>
			{/each}
		</div>
	</div>
{/if}

<style>
	.formation-reference-bar {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 1rem;
		background: theme('colors.gray.50');
		border: 1px solid theme('colors.gray.200');
		border-radius: 0.375rem;
		margin-bottom: 0.75rem;
		font-size: 0.875rem;
	}
	
	.reference-label {
		font-weight: 500;
		color: theme('colors.gray.600');
		white-space: nowrap;
	}
	
	.formation-links {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		align-items: center;
	}
	
	.formation-link {
		color: theme('colors.blue.600');
		text-decoration: none;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		transition: all 0.2s;
		white-space: nowrap;
	}
	
	.formation-link:hover {
		background: theme('colors.blue.50');
		color: theme('colors.blue.700');
		text-decoration: underline;
	}
	
	.formation-link::after {
		content: '↗';
		margin-left: 0.25rem;
		font-size: 0.75rem;
		opacity: 0.7;
	}
</style>