<script>
	export let data;

	// Early check to prevent loading components if no data
	if (!data || !data.seasons) {
		console.warn('Season page: No data or seasons available');
	}

	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	// Lazy-load season components to prevent SSR crashes
	let SeasonShell;
	let Overview;
	let Schedule;
	let Manage;
	let ShareSettings;
	let componentsLoading = true;
	let componentLoadError = null;
	import { Button } from '$lib/components/ui/button';
	import Input from '$lib/components/ui/Input.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import { apiFetch } from '$lib/utils/apiFetch.js';

	// Page title is set below in <svelte:head>

	let seasons = data.seasons || [];
	let activeSeason = seasons.find((s) => s.is_active);
	let sections = [];
	let markers = [];
	let practices = [];
	let showCreateModal = false;
	let isCreating = false;
	let createError = '';
	let activeTab = 'overview'; // For tab navigation

	let newSeason = {
		name: '',
		start_date: '',
		end_date: '',
		is_active: false
	};

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
			componentsLoading = false;
		} catch (err) {
			console.error('Failed to load season components:', err);
			componentLoadError = err;
			componentsLoading = false;
		}

		if (activeSeason) {
			await loadTimelineData();
		}
	});

	async function loadTimelineData() {
		if (!activeSeason) return;

			try {
				const sectionsRes = await apiFetch(`/api/seasons/${activeSeason.id}/sections`);
				sections = sectionsRes;
			} catch (err) {
				console.warn('Failed to load season sections:', err);
			}

			try {
				const markersRes = await apiFetch(`/api/seasons/${activeSeason.id}/markers`);
				markers = markersRes;
			} catch (err) {
				console.warn('Failed to load season markers:', err);
			}

			try {
				const practicesRes = await apiFetch(`/api/teams/${$page.params.slug}/practice-plans`);
				const list = practicesRes?.items || [];
				practices = list.filter((p) => p.season_id === activeSeason.id);
			} catch (err) {
				console.warn('Failed to load season practices:', err);
			}
		}

	async function createSeason() {
		if (!newSeason.name || !newSeason.start_date || !newSeason.end_date) return;
		isCreating = true;
		createError = '';
		try {
			const season = await apiFetch(`/api/teams/${$page.params.slug}/seasons`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newSeason)
			});
			seasons = [...seasons, season];
			if (season.is_active) {
				activeSeason = season;
				seasons = seasons.map((s) => ({ ...s, is_active: s.id === season.id }));
				await loadTimelineData();
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
				activeSeason = seasons.find((s) => s.id === seasonId);
				await loadTimelineData();
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

	// Event handlers
	function handleTabChange(event) {
		activeTab = event.detail;
	}

	function handleSectionChange() {
		loadTimelineData();
	}

	function handleMarkerChange() {
		loadTimelineData();
	}

	function handlePracticeCreated(event) {
		practices = [...practices, event.detail.plan || event.detail];
		loadTimelineData();
	}

	function handleCreatePractice(event) {
		// Navigate to practice creation with prefilled data
		const { date, sectionId } = event.detail;
		// This could open a modal or navigate to practice creation page
		console.log('Create practice for date:', date, 'section:', sectionId);
	}
</script>

<svelte:head>
	<title>Season - {$page.params.slug}</title>
</svelte:head>

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
		<svelte:component
			this={SeasonShell}
			season={activeSeason}
			{sections}
			{markers}
			{practices}
			isAdmin={data.userRole === 'admin'}
			teamSlug={$page.params.slug}
			bind:activeTab
			on:tabChange={handleTabChange}
		>
			{#if activeTab === 'overview' && Overview}
				<svelte:component
					this={Overview}
					season={activeSeason}
					bind:sections
					bind:markers
					bind:practices
					isAdmin={data.userRole === 'admin'}
					teamSlug={$page.params.slug}
					teamTimezone={data.team?.timezone || 'UTC'}
					on:sectionChange={handleSectionChange}
					on:markerChange={handleMarkerChange}
					on:createPractice={handleCreatePractice}
				/>
			{:else if activeTab === 'schedule' && Schedule}
				<svelte:component
					this={Schedule}
					season={activeSeason}
					bind:sections
					bind:markers
					bind:practices
					isAdmin={data.userRole === 'admin'}
					teamSlug={$page.params.slug}
					teamTimezone={data.team?.timezone || 'UTC'}
					on:practiceCreated={handlePracticeCreated}
					on:markerChange={handleMarkerChange}
				/>
			{:else if activeTab === 'manage' && Manage}
				<svelte:component
					this={Manage}
					season={activeSeason}
					bind:sections
					bind:markers
					teamSlug={$page.params.slug}
					on:change={loadTimelineData}
					on:sectionChange={handleSectionChange}
					on:markerChange={handleMarkerChange}
				/>
			{:else if activeTab === 'share' && ShareSettings}
				<svelte:component
					this={ShareSettings}
					seasonId={activeSeason.id}
					isAdmin={data.userRole === 'admin'}
				/>
			{/if}
		</svelte:component>
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

				{#if data.userRole === 'admin'}
					<Button
						variant="primary"
						on:click={() => (showCreateModal = true)}
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
								<h3 slot="header" class="font-semibold">{season.name}</h3>
								<p class="text-sm text-gray-600 mt-1">
									{new Date(season.start_date).toLocaleDateString()} - {new Date(
										season.end_date
									).toLocaleDateString()}
								</p>
								<div slot="footer">
									{#if data.userRole === 'admin'}
										<Button variant="ghost" size="sm" on:click={() => setActive(season.id)}>
											Set Active
										</Button>
									{/if}
								</div>
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

	<div slot="footer" class="flex justify-end gap-2">
		<Button
			variant="ghost"
			on:click={() => {
				showCreateModal = false;
				resetForm();
			}}
			disabled={isCreating}>Cancel</Button
		>
		<Button
			variant="primary"
			on:click={createSeason}
			disabled={!newSeason.name || !newSeason.start_date || !newSeason.end_date || isCreating}
		>
			{isCreating ? 'Creating...' : 'Create'}
		</Button>
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
