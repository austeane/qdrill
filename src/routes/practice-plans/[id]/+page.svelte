<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import Comments from '$lib/components/Comments.svelte';
	import UpvoteDownvote from '$lib/components/UpvoteDownvote.svelte';
	import Timeline from '../viewer/Timeline.svelte';
	import Section from '../viewer/Section.svelte';
	import DeletePracticePlan from '$lib/components/DeletePracticePlan.svelte';
	import GroupFilter from '$lib/components/practice-plan/GroupFilter.svelte';
	import { filterSectionsByGroup } from '$lib/utils/groupFilter.js';
	import { goto } from '$app/navigation';
	import { toast } from '@zerodevx/svelte-toast';
	import { apiFetch } from '$lib/utils/apiFetch.js';
	import { sanitizeHtml } from '$lib/utils/sanitize.js';

	export let data;
	const { practicePlan } = data;

	// Store for tracking the current section
	const currentSectionId = writable(null);

	// Group filter state
	let selectedGroupFilter = 'All Groups';

	// Calculate total duration considering parallel activities
	$: totalDuration = practicePlan.sections.reduce((sum, section) => sum + section.duration, 0);

	// Check edit permissions
	$: isAdmin = $page.data.session?.user?.role === 'admin';
	$: userCanEdit =
		isAdmin ||
		$page.data.session?.user?.id === practicePlan.created_by ||
		($page.data.session?.user?.id && practicePlan.is_editable_by_others);

	// Add this near the other state variables
	const isDescriptionExpanded = writable(true);

	// Intersection Observer setup for section tracking
	onMount(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const sectionId = entry.target.getAttribute('data-section-id');
						currentSectionId.set(sectionId);
					}
				});
			},
			{
				rootMargin: '-50px 0px -50px 0px',
				threshold: 0.1
			}
		);

		// Observe all sections
		document.querySelectorAll('[data-section-id]').forEach((section) => {
			observer.observe(section);
		});

		return () => observer.disconnect();
	});

	// Handle section selection from timeline
	function handleSectionSelect(event) {
		const { sectionId } = event.detail;
		const section = document.querySelector(`[data-section-id="${sectionId}"]`);
		if (section) {
			section.scrollIntoView({ behavior: 'smooth' });
		}
	}

	// Format time for display
	function formatTime(timeStr) {
		if (!timeStr) return '';
		const [hours, minutes] = timeStr.split(':');
		const hour = parseInt(hours);
		const ampm = hour >= 12 ? 'PM' : 'AM';
		const hour12 = hour % 12 || 12;
		return `${hour12}:${minutes} ${ampm}`;
	}

	// Add minutes to a time string
	function addMinutes(timeStr, minutes) {
		const [hours, mins] = timeStr.split(':').map(Number);
		const date = new Date();
		date.setHours(hours, mins + minutes);
		return (
			date.getHours().toString().padStart(2, '0') +
			':' +
			date.getMinutes().toString().padStart(2, '0')
		);
	}

	// Handle group filter change
	function handleGroupFilterChange(event) {
		selectedGroupFilter = event.detail.filter;
	}

	// Filter sections based on selected group
	$: filteredSections = filterSectionsByGroup(practicePlan.sections, selectedGroupFilter);

	// Calculate section start times
	function calculateSectionStartTime(sections, sectionIndex) {
		let currentTime = practicePlan.start_time?.slice(0, 5) || '09:00';
		for (let i = 0; i < sectionIndex; i++) {
			const section = sections[i];
			const sectionDuration = section.items.reduce(
				(total, item) => total + (item.duration || 0),
				0
			);
			currentTime = addMinutes(currentTime, sectionDuration);
		}
		return currentTime;
	}

	// Function to handle plan duplication
	async function handleDuplicate() {
		try {
			const result = await apiFetch(`/api/practice-plans/${practicePlan.id}/duplicate`, {
				method: 'POST'
			});

			toast.push('Practice plan duplicated successfully', {
				theme: {
					'--toastBackground': '#48BB78',
					'--toastBarBackground': '#2F855A'
				}
			});
			goto(`/practice-plans/${result.id}/edit`);
		} catch (error) {
			console.error('Error duplicating practice plan:', error);
			toast.push(error.message, {
				theme: {
					'--toastBackground': '#F56565',
					'--toastBarBackground': '#C53030'
				}
			});
		}
	}
</script>

<Breadcrumb
	customSegments={[{ name: 'Practice Plans', url: '/practice-plans' }, { name: practicePlan.name }]}
/>

<div class="container mx-auto p-4 sm:p-6">
	<!-- Header Section -->
	<header class="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 sm:p-6 mb-6">
		<div class="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
			<!-- Title and Description -->
			<div class="w-full sm:w-auto order-last sm:order-first">
				<h1 class="text-2xl font-bold break-words">{practicePlan.name}</h1>
				{#if practicePlan.description}
					<div class="mt-2">
						{#if $isDescriptionExpanded}
							<div class="flex justify-end">
								<button
									class="text-blue-500 hover:text-blue-600 text-sm font-medium bg-blue-50 px-3 py-1 rounded-md mb-2"
									on:click={() => ($isDescriptionExpanded = false)}
								>
									Show less of description ↑
								</button>
							</div>
						{/if}
						<div
							class="text-gray-600 dark:text-gray-300 prose prose-sm sm:prose lg:prose-lg dark:prose-invert"
							class:truncate={!$isDescriptionExpanded}
						>
							{@html sanitizeHtml(practicePlan.description)}
						</div>
						<div class="flex justify-end mt-1">
							{#if $isDescriptionExpanded}
								<button
									class="text-blue-500 hover:text-blue-600 text-sm font-medium bg-blue-50 px-3 py-1 rounded-md"
									on:click={() => ($isDescriptionExpanded = false)}
								>
									Show less of description ↓
								</button>
							{:else}
								<button
									class="text-blue-500 hover:text-blue-600 text-sm font-medium bg-blue-50 px-3 py-1 rounded-md"
									on:click={() => ($isDescriptionExpanded = true)}
								>
									Show more of description ↓
								</button>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<!-- Action Buttons -->
			<div class="flex flex-wrap items-center justify-end gap-2 sm:gap-4 order-first sm:order-last">
				{#if userCanEdit}
					<a
						href="/practice-plans/{practicePlan.id}/edit"
						class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm sm:text-base whitespace-nowrap"
					>
						Edit Plan
					</a>
				{/if}
				{#if $page.data.session}
					<button
						on:click={handleDuplicate}
						class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors text-sm sm:text-base whitespace-nowrap"
					>
						Duplicate Plan
					</button>
				{/if}
				<DeletePracticePlan planId={practicePlan.id} createdBy={practicePlan.created_by} />
				<UpvoteDownvote practicePlanId={practicePlan.id} />
			</div>
		</div>

		<!-- Practice Info Cards -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
			<div class="stat-card">
				<div class="stat-icon">⏱️</div>
				<div class="stat-content">
					<span class="stat-label">Time & Duration</span>
					<span class="stat-value">
						{formatTime(practicePlan.start_time?.slice(0, 5) || '09:00')} • {totalDuration} min
					</span>
				</div>
			</div>

			{#if practicePlan.phase_of_season}
				<div class="stat-card">
					<div class="stat-icon">🎯</div>
					<div class="stat-content">
						<span class="stat-label">Phase of Season</span>
						<span class="stat-value">{practicePlan.phase_of_season}</span>
					</div>
				</div>
			{/if}

			{#if practicePlan.estimated_number_of_participants}
				<div class="stat-card">
					<div class="stat-icon">👥</div>
					<div class="stat-content">
						<span class="stat-label">Participants</span>
						<span class="stat-value">{practicePlan.estimated_number_of_participants}</span>
					</div>
				</div>
			{/if}

			{#if practicePlan.practice_goals?.length}
				<div class="stat-card">
					<div class="stat-icon">🎯</div>
					<div class="stat-content">
						<span class="stat-label">Goals</span>
						<span class="stat-value">{practicePlan.practice_goals.length} goals</span>
					</div>
				</div>
			{/if}
		</div>
	</header>

	<!-- Practice Goals Section -->
	{#if practicePlan.practice_goals?.length}
		<div class="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
			<h2 class="text-xl font-semibold mb-4">Practice Goals</h2>
			<ul class="space-y-2">
				{#each practicePlan.practice_goals as goal, i (i)}
					<li class="flex items-start">
						<span class="mr-2">•</span>
						<span class="goal-text">{goal}</span>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<!-- Group Filter -->
	<GroupFilter
		sections={practicePlan.sections}
		bind:selectedFilter={selectedGroupFilter}
		on:filterChange={handleGroupFilterChange}
	/>

	<!-- Main Content -->
	<div class="flex gap-6">
		<!-- Timeline (hidden on mobile) -->
		<Timeline
			sections={filteredSections}
			currentSectionId={$currentSectionId}
			{totalDuration}
			on:sectionSelect={handleSectionSelect}
		/>

		<!-- Practice Plan Content -->
		<div class="flex-1">
			{#each filteredSections as section, index (section.id)}
				<div data-section-id={section.id} class="mb-6">
					<Section
						{section}
						isActive={section.id === $currentSectionId}
						canEdit={false}
						sectionIndex={index}
						startTime={calculateSectionStartTime(filteredSections, index)}
					/>
				</div>
			{/each}
		</div>
	</div>
</div>

<!-- Comments Section -->
<div class="container mx-auto p-4 sm:p-6">
	<Comments practicePlanId={practicePlan.id} />
</div>

<style>
	.stat-card {
		background-color: rgb(249 250 251);
		padding: 1rem;
		border-radius: 0.5rem;
		box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	:global(.dark) .stat-card {
		background-color: rgb(55 65 81);
	}

	.stat-icon {
		font-size: 1.5rem;
		line-height: 2rem;
	}

	.stat-content {
		display: flex;
		flex-direction: column;
	}

	.stat-label {
		font-size: 0.875rem;
		line-height: 1.25rem;
		color: rgb(107, 114, 128);
	}

	:global(.dark) .stat-label {
		color: rgb(209, 213, 219);
	}

	.stat-value {
		font-weight: 600;
		color: rgb(17, 24, 39);
	}

	:global(.dark) .stat-value {
		color: rgb(243, 244, 246);
	}

	@media (max-width: 768px) {
		.container {
			padding-left: 0.5rem;
			padding-right: 0.5rem;
		}
	}

	.truncate {
		max-height: 3em;
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.goal-text {
		overflow: hidden;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}
</style>
