<script>
	import { page } from '$app/state';
	import WeekView from '$lib/components/season/WeekView.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import { Button } from '$lib/components/ui/button';

	let { data } = $props();

	const teamSlug = $derived(page.params.slug);
	const teamTimezone = $derived(data.team?.timezone || 'UTC');
	const isAdmin = $derived(data.userRole === 'admin');
	const season = $derived(data.season ?? null);
	const currentWeek = $derived(data.currentWeek ? new Date(data.currentWeek) : new Date());
	const error = $derived(data.error ?? null);

	let practices = $state([]);
	let markers = $state([]);

	$effect(() => {
		practices = data.practices ?? [];
		markers = data.markers ?? [];
	});
</script>

<svelte:head>
	<title>Week View - {season?.name || 'Season'}</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-7xl">
	<div class="mb-6">
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-bold">Week View</h1>
			<div class="flex gap-2">
				<Button href={`/teams/${teamSlug}/season`} variant="ghost" size="sm">← Season Overview</Button>
				{#if isAdmin}
					<Button href={`/teams/${teamSlug}/season/recurrences`} size="sm">Manage Recurrences</Button>
				{/if}
			</div>
		</div>
		{#if season}
			<p class="text-gray-600 mt-2">
				{season.name} • {isAdmin ? 'Admin view (all practices)' : 'Member view (published only)'}
			</p>
		{/if}
	</div>

	{#if error}
		<Card>
			<div class="p-4 text-amber-700">
				<p class="font-medium">{error}</p>
				{#if error.includes('No active season')}
					<div class="mt-2">
						<Button href={`/teams/${teamSlug}/season`} variant="ghost" size="sm"
							>Go to season management →</Button
						>
					</div>
				{/if}
			</div>
		</Card>
	{:else if season}
		<WeekView
			{season}
			bind:practices
			{markers}
			{currentWeek}
			{isAdmin}
			{teamSlug}
			{teamTimezone}
		/>

		<div class="mt-6 text-sm text-gray-600">
			<p>💡 Tips:</p>
			<ul class="mt-1 ml-6 list-disc">
				{#if isAdmin}
					<li>Click "Add Practice" on any day to create a draft practice plan</li>
					<li>Draft practices are only visible to admins until published</li>
					<li>Use the Edit button to modify practice details</li>
				{:else}
					<li>Only published practices are shown in this view</li>
					<li>Contact your team admin to make changes to the schedule</li>
				{/if}
				<li>Events and markers are shown at the top of each day</li>
				<li>Use the arrow buttons or "Today" to navigate between weeks</li>
			</ul>
		</div>
	{:else}
		<Card>
			<div class="p-8 text-center text-gray-500">No season data available</div>
		</Card>
	{/if}
</div>
