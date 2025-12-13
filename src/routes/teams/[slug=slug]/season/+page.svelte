<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { apiFetch } from '$lib/utils/apiFetch.js';
	// Lazy-load season components to prevent SSR crashes
	import { Button } from '$lib/components/ui/button';
	import Input from '$lib/components/ui/Input.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import Card from '$lib/components/ui/Card.svelte';

	let { data } = $props();

	const teamSlug = $derived(page.params.slug);
	const isAdmin = $derived(data.userRole === 'admin');
	const teamTimezone = $derived(data.team?.timezone || 'UTC');

	let SeasonShell = $state(null);
	let Overview = $state(null);
	let Schedule = $state(null);
	let Manage = $state(null);
	let ShareSettings = $state(null);
	let componentsLoading = $state(true);
	let componentLoadError = $state(null);

	// Page title is set below in <svelte:head>

	let seasons = $state([]);
	$effect(() => {
		seasons = data.seasons || [];
	});

	const activeSeason = $derived(seasons.find((s) => s.is_active) ?? null);

	let sections = $state([]);
	let markers = $state([]);
	let practices = $state([]);
	let showCreateModal = $state(false);
	let isCreating = $state(false);
	let createError = $state('');
	let activeTab = $state('overview'); // For tab navigation

	let newSeason = $state({
		name: '',
		start_date: '',
		end_date: '',
		is_active: false
	});

	onMount(async () => {
		// Dynamically import all season components after mount (client-side only)
		try {
			const [shellModule, overviewModule, scheduleModule, manageModule, shareModule] =
				await Promise.all([
					import('$lib/components/season/SeasonShell.svelte'),
					import('$lib/components/season/views/Overview.svelte'),
					import('$lib/components/season/views/Schedule.svelte'),
					import('$lib/components/season/views/Manage.svelte'),
					import('$lib/components/season/ShareSettings.svelte')
				]);

			SeasonShell = shellModule.default;
			Overview = overviewModule.default;
			Schedule = scheduleModule.default;
			Manage = manageModule.default;
			ShareSettings = shareModule.default;
		} catch (err) {
			console.error('Failed to load season components:', err);
			componentLoadError = err;
		} finally {
			componentsLoading = false;
		}
	});

	async function refreshTimelineData() {
		const season = activeSeason;
		if (!season) return;

		try {
			const sectionsRes = await apiFetch(`/api/seasons/${season.id}/sections`);
			sections = sectionsRes || [];
		} catch (err) {
			console.warn('Failed to load season sections:', err);
		}

		try {
			const markersRes = await apiFetch(`/api/seasons/${season.id}/markers`);
			markers = markersRes || [];
		} catch (err) {
			console.warn('Failed to load season markers:', err);
		}

		try {
			const practicesRes = await apiFetch(`/api/teams/${teamSlug}/practice-plans`);
			const list = practicesRes?.items || [];
			practices = list.filter((p) => p.season_id === season.id);
		} catch (err) {
			console.warn('Failed to load season practices:', err);
		}
	}

	$effect(() => {
		if (!activeSeason) {
			sections = [];
			markers = [];
			practices = [];
			return;
		}

		let cancelled = false;

		(async () => {
			try {
				const [sectionsRes, markersRes, practicesRes] = await Promise.all([
					apiFetch(`/api/seasons/${activeSeason.id}/sections`),
					apiFetch(`/api/seasons/${activeSeason.id}/markers`),
					apiFetch(`/api/teams/${teamSlug}/practice-plans`)
				]);

				if (cancelled) return;

				sections = sectionsRes || [];
				markers = markersRes || [];

				const list = practicesRes?.items || [];
				practices = list.filter((p) => p.season_id === activeSeason.id);
			} catch (err) {
				if (cancelled) return;
				console.warn('Failed to load season timeline data:', err);
			}
		})();

		return () => {
			cancelled = true;
		};
	});

	async function createSeason() {
		if (!newSeason.name || !newSeason.start_date || !newSeason.end_date) return;
		isCreating = true;
		createError = '';
		try {
			const season = await apiFetch(`/api/teams/${teamSlug}/seasons`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newSeason)
			});

			seasons = [...seasons, season];
			if (season.is_active) {
				seasons = seasons.map((s) => ({ ...s, is_active: s.id === season.id }));
			}
			showCreateModal = false;
			resetForm();
		} catch (err) {
			createError = err?.message || 'Failed to create season';
		} finally {
			isCreating = false;
		}
	}

	async function setActive(seasonId) {
		try {
			await apiFetch(`/api/seasons/${seasonId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ is_active: true })
			});

			seasons = seasons.map((s) => ({ ...s, is_active: s.id === seasonId }));
		} catch (err) {
			console.warn('Failed to set active season:', err);
		}
	}

	function resetForm() {
		newSeason = {
			name: '',
			start_date: '',
			end_date: '',
			is_active: false
		};
		createError = '';
	}

	function handleSectionChange() {
		refreshTimelineData();
	}

	function handleMarkerChange() {
		refreshTimelineData();
	}

	function handlePracticeCreated(detail) {
		// Schedule view returns the created plan directly
		if (detail) {
			practices = [...practices, detail];
		}
		refreshTimelineData();
	}

	function handleCreatePractice(detail) {
		const { date, sectionId } = detail ?? {};
		// This could open a modal or navigate to practice creation page
		console.log('Create practice for date:', date, 'section:', sectionId);
	}
</script>

<svelte:head>
	<title>Season - {teamSlug}</title>
</svelte:head>

{#snippet createSeasonFooter()}
	<Button
		variant="ghost"
		onclick={() => {
			showCreateModal = false;
			resetForm();
		}}
		disabled={isCreating}
	>
		Cancel
	</Button>
	<Button
		variant="primary"
		onclick={createSeason}
		disabled={!newSeason.name || !newSeason.start_date || !newSeason.end_date || isCreating}
	>
		{isCreating ? 'Creating...' : 'Create'}
	</Button>
{/snippet}

{#if activeSeason}
	{#if componentsLoading}
		<div class="p-4">
			<Card>
				<div class="p-6">
					<div class="text-sm text-gray-500">Loading season view...</div>
				</div>
			</Card>
		</div>
	{:else if componentLoadError}
		<div class="p-4">
			<Card>
				<div class="p-6">
					<h2 class="text-lg font-semibold text-red-600 mb-2">Failed to Load Season View</h2>
					<p class="text-sm text-gray-600">
						There was an error loading the season components. Please try refreshing the page.
					</p>
					<Button href="/teams" variant="ghost" size="sm" class="mt-4">← Back to Teams</Button>
				</div>
			</Card>
		</div>
	{:else if SeasonShell}
		<SeasonShell season={activeSeason} {sections} {markers} {practices} teamId={teamSlug} {isAdmin} bind:activeTab>
			{#if activeTab === 'overview' && Overview}
				<Overview
					season={activeSeason}
					{sections}
					{markers}
					{practices}
					{isAdmin}
					{teamSlug}
					teamTimezone={teamTimezone}
					onSectionChange={handleSectionChange}
					onMarkerChange={handleMarkerChange}
					onCreatePractice={handleCreatePractice}
				/>
			{:else if activeTab === 'schedule' && Schedule}
				<Schedule
					season={activeSeason}
					{sections}
					{markers}
					{practices}
					{isAdmin}
					{teamSlug}
					teamTimezone={teamTimezone}
					onPracticeCreated={handlePracticeCreated}
					onMarkerChange={handleMarkerChange}
				/>
			{:else if activeTab === 'manage' && Manage}
				<Manage
					season={activeSeason}
					bind:sections
					bind:markers
					{teamSlug}
					onChange={refreshTimelineData}
					onSectionChange={handleSectionChange}
					onMarkerChange={handleMarkerChange}
				/>
			{:else if activeTab === 'share' && ShareSettings}
				<ShareSettings seasonId={activeSeason.id} {isAdmin} />
			{/if}
		</SeasonShell>
	{/if}
{:else}
	<!-- No Active Season -->
	<div class="no-season-container">
		<Card>
			<div class="no-season-content">
				<Button href="/teams" variant="ghost" size="sm" class="mb-4">← Back to Teams</Button>

				<h1 class="text-2xl font-bold mb-6">Season Management</h1>

				<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
					<p class="text-yellow-800">
						No active season. Create or activate a season to get started.
					</p>
				</div>

				{#if isAdmin}
					<Button
						variant="primary"
						onclick={() => (showCreateModal = true)}
						class="w-full sm:w-auto"
					>
						Create Season
					</Button>
				{/if}

				{#if seasons.length > 0}
					<h2 class="text-lg font-semibold mt-8 mb-4">All Seasons</h2>
					<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{#each seasons as season (season.id)}
								<Card>
									{#snippet header()}
										<h3 class="font-semibold">{season.name}</h3>
									{/snippet}
									<p class="text-sm text-gray-600 mt-1">
										{new Date(season.start_date).toLocaleDateString()} - {new Date(
											season.end_date
										).toLocaleDateString()}
									</p>
									{#snippet footer()}
										{#if isAdmin}
											<Button variant="ghost" size="sm" onclick={() => setActive(season.id)}>
												Set Active
											</Button>
										{/if}
									{/snippet}
								</Card>
							{/each}
						</div>
					{/if}
			</div>
		</Card>
	</div>
{/if}

<!-- Create Season Modal for both mobile and desktop -->
<Dialog
	bind:open={showCreateModal}
	title="Create Season"
	description="Define the dates and optionally set it active."
	footer={createSeasonFooter}
	onClose={resetForm}
>
	<div class="grid gap-4">
		<Input
			label="Season Name"
			placeholder="Season Name (e.g., Spring 2024)"
			bind:value={newSeason.name}
			required
		/>
		<Input label="Start Date" type="date" bind:value={newSeason.start_date} required />
		<Input label="End Date" type="date" bind:value={newSeason.end_date} required />
		<Checkbox label="Set as active season" bind:checked={newSeason.is_active} />
		{#if createError}
			<p class="text-sm text-red-600">{createError}</p>
		{/if}
	</div>
</Dialog>

<style>
	.no-season-container {
		padding: 16px;
		max-width: 1200px;
		margin: 0 auto;
	}

	.no-season-content {
		padding: 24px;
	}

	@media (min-width: 640px) {
		.no-season-container {
			padding: 24px;
		}

		.no-season-content {
			padding: 32px;
		}
	}
</style>
