<script>
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import SeasonTimelineViewer from '$lib/components/season/SeasonTimelineViewer.svelte';
	import { Button } from '$lib/components/ui/button';
	import { apiFetch } from '$lib/utils/apiFetch.js';

	let { data } = $props();

	const teamSlug = $derived(page.params.slug);
	const season = $derived(data.season ?? null);

	let sections = $state([]);
	let markers = $state([]);
	let practices = $state([]);
	let loading = $state(true);

	$effect(() => {
		if (!season) {
			sections = [];
			markers = [];
			practices = [];
			loading = false;
			return;
		}

		loading = true;
		let cancelled = false;

		(async () => {
			try {
				// Load sections
				const sectionsRes = await apiFetch(`/api/seasons/${season.id}/sections`);
				if (!cancelled) sections = sectionsRes || [];
			} catch (error) {
				console.error('Failed to load sections:', error);
			}

			try {
				// Load markers
				const markersRes = await apiFetch(`/api/seasons/${season.id}/markers`);
				if (!cancelled) markers = markersRes || [];
			} catch (error) {
				console.error('Failed to load markers:', error);
			}

			try {
				// Load practices
				const practicesRes = await apiFetch(`/api/teams/${teamSlug}/practice-plans`);
				const list = practicesRes?.items || [];
				if (!cancelled) practices = list.filter((p) => p.season_id === season.id);
			} catch (error) {
				console.error('Failed to load practices:', error);
			}

			if (!cancelled) loading = false;
		})();

		return () => {
			cancelled = true;
		};
	});

	function goBack() {
		goto(`/teams/${teamSlug}/season`);
	}
</script>

<div class="timeline-page">
	<div class="header">
		<div class="header-left">
			<Button variant="ghost" onclick={goBack}>← Back to Season</Button>
			<h1 class="page-title">{season?.name || 'Season'} Timeline</h1>
		</div>

		<div class="header-right">
			<p class="season-dates">
				{#if season}
					{new Date(season.start_date).toLocaleDateString('en-US', {
						month: 'short',
						day: 'numeric',
						year: 'numeric'
					})}
					–
					{new Date(season.end_date).toLocaleDateString('en-US', {
						month: 'short',
						day: 'numeric',
						year: 'numeric'
					})}
				{/if}
			</p>
		</div>
	</div>

	{#if loading}
		<div class="loading">
			<p>Loading timeline data...</p>
		</div>
	{:else if season}
		<SeasonTimelineViewer {season} {sections} {markers} {practices} />
	{:else}
		<div class="no-season">
			<p>No active season found.</p>
			<Button variant="primary" href={`/teams/${teamSlug}/season`}>
				Go to Season Management
			</Button>
		</div>
	{/if}
</div>

<style>
	.timeline-page {
		padding: 16px;
		max-width: 1400px;
		margin: 0 auto;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
		flex-wrap: wrap;
		gap: 16px;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.page-title {
		font-size: 24px;
		font-weight: 700;
		margin: 0;
		color: #111827;
	}

	.season-dates {
		font-size: 14px;
		color: #6b7280;
		margin: 0;
	}

	.loading,
	.no-season {
		text-align: center;
		padding: 48px;
		color: #6b7280;
	}

	.no-season {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
	}

	/* Mobile adjustments */
	@media (max-width: 768px) {
		.timeline-page {
			padding: 12px;
		}

		.header {
			flex-direction: column;
			align-items: flex-start;
		}

		.page-title {
			font-size: 20px;
		}
	}

	/* Dark mode */
	:global(.dark) .page-title {
		color: #f3f4f6;
	}

	:global(.dark) .season-dates {
		color: #9ca3af;
	}

	:global(.dark) .loading,
	:global(.dark) .no-season {
		color: #9ca3af;
	}
</style>
