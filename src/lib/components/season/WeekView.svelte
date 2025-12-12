<script>
	import { goto } from '$app/navigation';

	export let season;
	export let practices = [];
	export let markers = [];
	export let currentWeek = new Date();
	export let isAdmin = false;
	export let teamSlug;
	export let teamTimezone = 'UTC';

	let weekStart;
	let weekEnd;
	let weekDays = [];
	let groupedPractices = {};
	let publishingId = null;

	$: {
		// Calculate week boundaries
		const startOfWeek = new Date(currentWeek);
		startOfWeek.setDate(currentWeek.getDate() - currentWeek.getDay());
		startOfWeek.setHours(0, 0, 0, 0);
		weekStart = startOfWeek;

		const endOfWeek = new Date(startOfWeek);
		endOfWeek.setDate(startOfWeek.getDate() + 6);
		endOfWeek.setHours(23, 59, 59, 999);
		weekEnd = endOfWeek;

		// Generate week days
		weekDays = [];
		for (let i = 0; i < 7; i++) {
			const day = new Date(startOfWeek);
			day.setDate(startOfWeek.getDate() + i);
			weekDays.push(day);
		}

		// Group practices by date
		groupedPractices = {};
		practices.forEach((practice) => {
			const dateKey = practice.scheduled_date;
			if (!groupedPractices[dateKey]) {
				groupedPractices[dateKey] = [];
			}
			groupedPractices[dateKey].push(practice);
		});
	}

	import { toLocalISO } from '$lib/utils/date.js';
	function navigateToWeek(date) {
		const dateStr = toLocalISO(date);
		// Navigate to same route with updated week param to trigger SSR reload
		goto(`/teams/${teamSlug}/season/week?week=${dateStr}`, { keepfocus: true, noScroll: true });
	}

	function navigateWeek(direction) {
		const newWeek = new Date(currentWeek);
		newWeek.setDate(currentWeek.getDate() + direction * 7);
		navigateToWeek(newWeek);
	}

	function goToToday() {
		navigateToWeek(new Date());
	}

	function _formatDate(date) {
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			timeZone: teamTimezone
		});
	}

	function formatWeekRange() {
		const start = weekStart.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			timeZone: teamTimezone
		});
		const end = weekEnd.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			timeZone: teamTimezone
		});
		return `${start} - ${end}`;
	}

	function getPracticesForDate(date) {
		const dateStr = toLocalISO(date);
		return groupedPractices[dateStr] || [];
	}

	function formatPracticeTime(practice) {
		const t = (practice.start_time || season.default_start_time || '00:00:00').slice(0, 5); // HH:MM
		const [hh, mm] = t.split(':').map(Number);
		const h12 = ((hh + 11) % 12) + 1;
		const ampm = hh >= 12 ? 'PM' : 'AM';
		return `${h12}:${String(mm).padStart(2, '0')} ${ampm}`;
	}

	function getMarkersForDate(date) {
		const dateStr = toLocalISO(date);
		return markers.filter((m) => {
			const start = new Date(m.start_date);
			const end = m.end_date ? new Date(m.end_date) : start;
			const startStr = toLocalISO(start);
			const endStr = toLocalISO(end);
			return dateStr >= startStr && dateStr <= endStr;
		});
	}

	async function quickCreatePractice(date) {
		const dateStr = toLocalISO(date);
		try {
			const response = await fetch(`/api/seasons/${season.id}/instantiate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ scheduled_date: dateStr })
			});

			if (response.ok) {
				const plan = await response.json();
				goto(`/practice-plans/${plan.id}/edit`);
			} else {
				const error = await response.json();
				alert(`Failed to create practice: ${error.error}`);
			}
		} catch (error) {
			console.error('Error creating practice:', error);
			alert('Failed to create practice');
		}
	}

	async function publishPractice(practiceId) {
		if (!confirm('Publish this practice? It will become visible to all team members.')) {
			return;
		}

		publishingId = practiceId;

		try {
			const response = await fetch(`/api/practice-plans/${practiceId}/publish`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});

			if (response.ok) {
				// Update local state
				practices = practices.map((p) => (p.id === practiceId ? { ...p, status: 'published' } : p));
			} else {
				const error = await response.json();
				alert(`Failed to publish: ${error.error}`);
			}
		} catch (error) {
			console.error('Error publishing practice:', error);
			alert('Failed to publish practice');
		} finally {
			publishingId = null;
		}
	}

	const markerEmoji = {
		tournament: '🏆',
		scrimmage: '⚔️',
		break: '🏖️',
		custom: '📌'
	};

	const markerColors = {
		tournament: 'bg-red-100 text-red-800 border-red-300',
		scrimmage: 'bg-blue-100 text-blue-800 border-blue-300',
		break: 'bg-gray-100 text-gray-800 border-gray-300',
		custom: 'bg-purple-100 text-purple-800 border-purple-300'
	};
</script>

<div class="bg-white rounded-lg shadow-lg overflow-hidden" data-testid="week-view">
	<!-- Week navigation header -->
	<div class="bg-gray-50 border-b px-4 py-3 flex items-center justify-between">
		<div class="flex items-center space-x-2">
			<button
				on:click={() => navigateWeek(-1)}
				class="p-2 hover:bg-gray-200 rounded transition-colors"
				title="Previous week"
				aria-label="Previous week"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
			</button>
			<button
				on:click={() => navigateWeek(1)}
				class="p-2 hover:bg-gray-200 rounded transition-colors"
				title="Next week"
				aria-label="Next week"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
			<button
				on:click={goToToday}
				class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
			>
				Today
			</button>
		</div>

		<h2 class="text-lg font-semibold">
			{formatWeekRange()}
		</h2>

		<div class="text-sm text-gray-600">
			{season.name}
		</div>
	</div>

	<!-- Week grid -->
	<div class="grid grid-cols-7 divide-x">
		{#each weekDays as day (day.toISOString())}
			{@const dayPractices = getPracticesForDate(day)}
			{@const dayMarkers = getMarkersForDate(day)}
			{@const isToday = day.toDateString() === new Date().toDateString()}
			{@const isPast = day < new Date() && !isToday}
			{@const isWeekend = day.getDay() === 0 || day.getDay() === 6}

			<div
				class="min-h-[200px] {isToday ? 'bg-blue-50' : isWeekend ? 'bg-gray-50' : 'bg-white'} 
               {isPast ? 'opacity-75' : ''}"
			>
				<!-- Day header -->
				<div class="px-2 py-1 border-b {isToday ? 'bg-blue-100 font-semibold' : 'bg-gray-100'}">
					<div class="text-xs text-gray-600">
						{day.toLocaleDateString('en-US', { weekday: 'short' })}
					</div>
					<div class="text-lg {isToday ? 'text-blue-700' : ''}">
						{day.getDate()}
					</div>
				</div>

				<!-- Markers -->
				{#if dayMarkers.length > 0}
					<div class="px-2 pt-2">
						{#each dayMarkers as marker (marker.id)}
							<div
								class="text-xs px-2 py-1 rounded border mb-1 {markerColors[marker.type] ||
									markerColors.custom}"
							>
								<span class="mr-1">{markerEmoji[marker.type] || '📌'}</span>
								<span class="font-medium">{marker.title}</span>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Practices -->
				<div class="p-2">
					{#if dayPractices.length > 0}
						{#each dayPractices as practice (practice.id)}
							<div
								class="border rounded p-2 mb-2
                         {practice.is_published
									? 'bg-green-50 border-green-300'
									: 'bg-yellow-50 border-yellow-300'}"
							>
								<div class="text-xs text-gray-600">
									{formatPracticeTime(practice)}
								</div>
								<div class="font-medium text-sm mt-1">
									{practice.name || 'Practice'}
								</div>
								{#if !practice.is_published}
									<div class="text-xs bg-yellow-100 text-yellow-800 px-1 rounded inline-block mt-1">
										Draft
									</div>
								{/if}

								{#if isAdmin}
									<div class="flex gap-1 mt-2">
										<a
											href="/practice-plans/{practice.id}/edit"
											class="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
										>
											Edit
										</a>
										{#if !practice.is_published}
											<button
												on:click={() => publishPractice(practice.id)}
												disabled={publishingId === practice.id}
												class="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600
                               disabled:opacity-50 disabled:cursor-not-allowed"
											>
												{publishingId === practice.id ? '...' : 'Publish'}
											</button>
										{/if}
									</div>
								{:else if practice.is_published}
									<a
										href="/practice-plans/{practice.id}"
										class="text-xs text-blue-600 hover:underline mt-2 inline-block"
									>
										View →
									</a>
								{/if}
							</div>
						{/each}
					{:else if isAdmin && !isPast}
						<button
							on:click={() => quickCreatePractice(day)}
							class="w-full text-center py-2 px-3 border-2 border-dashed border-gray-300
                     rounded text-gray-500 hover:border-blue-400 hover:text-blue-600
                     transition-colors text-sm"
						>
							+ Add Practice
						</button>
					{:else}
						<div class="text-center text-gray-400 text-sm py-4">No practice</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<!-- Week summary footer -->
	<div class="bg-gray-50 border-t px-4 py-3 flex justify-around text-center">
		<div>
			<div class="text-2xl font-semibold text-gray-700">
				{practices.length}
			</div>
			<div class="text-xs text-gray-500 uppercase">Total Practices</div>
		</div>
		<div>
			<div class="text-2xl font-semibold text-green-600">
				{practices.filter((p) => p.is_published).length}
			</div>
			<div class="text-xs text-gray-500 uppercase">Published</div>
		</div>
		<div>
			<div class="text-2xl font-semibold text-yellow-600">
				{practices.filter((p) => !p.is_published).length}
			</div>
			<div class="text-xs text-gray-500 uppercase">Drafts</div>
		</div>
		{#if markers.length > 0}
			<div>
				<div class="text-2xl font-semibold text-blue-600">
					{markers.length}
				</div>
				<div class="text-xs text-gray-500 uppercase">Events</div>
			</div>
		{/if}
	</div>
</div>

<style>
	@media (max-width: 768px) {
		.grid-cols-7 {
			grid-template-columns: 1fr;
		}
	}
</style>
