<script>
	import { page } from '$app/stores';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import { goto } from '$app/navigation';
	import { formatDate } from '$lib/utils/dateUtils.js';

	export let data;
	const { team, practicePlans, userRole } = data;

	$: canCreatePractice = userRole === 'admin' || userRole === 'coach';

	function formatDuration(minutes) {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		if (hours > 0) {
			return `${hours}h ${mins}m`;
		}
		return `${mins}m`;
	}

	function formatPracticeDate(dateStr) {
		if (!dateStr) return 'Not scheduled';
		return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
			weekday: 'short',
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function formatTime(timeStr) {
		if (!timeStr) return '';
		const [hours, minutes] = timeStr.split(':');
		const hour = parseInt(hours);
		const ampm = hour >= 12 ? 'PM' : 'AM';
		const hour12 = hour % 12 || 12;
		return `${hour12}:${minutes} ${ampm}`;
	}
</script>

<main class="page-container">
	<!-- Breadcrumb -->
	<div class="mb-4">
		<Breadcrumb
			items={[
				{ label: 'Teams', href: '/teams' },
				{ label: team.name, href: `/teams/${team.id}/season` },
				{ label: 'Practice Plans' }
			]}
		/>
	</div>

	<!-- Header -->
	<div class="page-header">
		<div>
			<h1 class="page-title">Practice Plans</h1>
			<p class="page-subtitle">
				{practicePlans.length} practice {practicePlans.length === 1 ? 'plan' : 'plans'} for {team.name}
			</p>
		</div>
		<div class="header-actions">
			{#if canCreatePractice}
				<a href="/teams/{team.id}/season" class="btn btn-primary">
					Create Practice
				</a>
			{/if}
			<a href="/teams/{team.id}/season" class="btn btn-secondary">
				Back to Season
			</a>
		</div>
	</div>

	<!-- Practice Plans List -->
	{#if practicePlans.length > 0}
		<div class="practice-plans-grid">
			{#each practicePlans as plan}
				<a href="/teams/{team.id}/plans/{plan.id}" class="practice-plan-card">
					<div class="card-header">
						<h3 class="plan-name">{plan.name || 'Untitled Practice'}</h3>
						{#if plan.practice_type}
							<span class="practice-type-badge">
								{plan.practice_type}
							</span>
						{/if}
					</div>
					
					<div class="card-meta">
						{#if plan.scheduled_date}
							<div class="meta-item">
								<svg class="meta-icon" viewBox="0 0 20 20" fill="currentColor">
									<path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
								</svg>
								<span>{formatPracticeDate(plan.scheduled_date)}</span>
							</div>
						{/if}
						
						{#if plan.start_time}
							<div class="meta-item">
								<svg class="meta-icon" viewBox="0 0 20 20" fill="currentColor">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
								</svg>
								<span>{formatTime(plan.start_time)}</span>
							</div>
						{/if}
						
						{#if plan.duration}
							<div class="meta-item">
								<svg class="meta-icon" viewBox="0 0 20 20" fill="currentColor">
									<path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
									<path fill-rule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 00-2 2v6h1v4a1 1 0 001 1h8a1 1 0 001-1v-4h1V7a2 2 0 00-2-2h.01a1 1 0 100-2H6a2 2 0 00-2 2zm3 4h6v2H7V9z" clip-rule="evenodd" />
								</svg>
								<span>{formatDuration(plan.duration)}</span>
							</div>
						{/if}
					</div>

					{#if plan.description}
						<p class="plan-description">
							{plan.description}
						</p>
					{/if}

					<div class="card-footer">
						<div class="sections-count">
							{plan.sections_count || 0} sections
						</div>
						{#if plan.created_at}
							<div class="created-date">
								Created {new Date(plan.created_at).toLocaleDateString()}
							</div>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<div class="empty-state">
			<svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
			</svg>
			<h2>No practice plans yet</h2>
			<p>Create your first practice plan to get started</p>
			{#if canCreatePractice}
				<a href="/teams/{team.id}/season" class="btn btn-primary">
					Go to Season View
				</a>
			{/if}
		</div>
	{/if}
</main>

<style>
	.page-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--color-border);
	}

	.page-title {
		font-size: 2rem;
		font-weight: 700;
		margin: 0 0 0.5rem 0;
	}

	.page-subtitle {
		color: var(--color-text-secondary);
		margin: 0;
	}

	.header-actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn {
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-weight: 500;
		text-decoration: none;
		transition: all 0.2s;
		cursor: pointer;
		border: none;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.btn-primary {
		background-color: var(--color-primary);
		color: white;
	}

	.btn-primary:hover {
		background-color: var(--color-primary-dark);
	}

	.btn-secondary {
		background-color: var(--color-bg-secondary);
		color: var(--color-text);
	}

	.btn-secondary:hover {
		background-color: var(--color-bg-hover);
	}

	.practice-plans-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 1.5rem;
	}

	.practice-plan-card {
		display: flex;
		flex-direction: column;
		padding: 1.5rem;
		background-color: var(--color-bg-secondary);
		border-radius: 0.5rem;
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
		border: 1px solid transparent;
	}

	.practice-plan-card:hover {
		border-color: var(--color-primary);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		transform: translateY(-2px);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
	}

	.plan-name {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
		flex: 1;
	}

	.practice-type-badge {
		padding: 0.25rem 0.75rem;
		background-color: var(--color-primary-light);
		color: var(--color-primary);
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
		white-space: nowrap;
	}

	.card-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1rem;
		color: var(--color-text-secondary);
		font-size: 0.875rem;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.meta-icon {
		width: 1rem;
		height: 1rem;
	}

	.plan-description {
		flex: 1;
		margin: 0 0 1rem 0;
		color: var(--color-text-secondary);
		line-height: 1.5;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.card-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	.sections-count {
		font-weight: 500;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
	}

	.empty-icon {
		width: 4rem;
		height: 4rem;
		margin: 0 auto 1rem;
		color: var(--color-text-secondary);
	}

	.empty-state h2 {
		font-size: 1.5rem;
		margin: 0 0 0.5rem 0;
	}

	.empty-state p {
		color: var(--color-text-secondary);
		margin: 0 0 2rem 0;
	}

	@media (max-width: 768px) {
		.page-header {
			flex-direction: column;
			gap: 1rem;
		}

		.header-actions {
			width: 100%;
		}

		.btn {
			flex: 1;
			justify-content: center;
		}

		.practice-plans-grid {
			grid-template-columns: 1fr;
		}
	}
</style>