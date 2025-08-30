<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import Comments from '$lib/components/Comments.svelte';
	import UpvoteDownvote from '$lib/components/UpvoteDownvote.svelte';
	import Timeline from '../../../../practice-plans/viewer/Timeline.svelte';
	import Section from '../../../../practice-plans/viewer/Section.svelte';
	import DeletePracticePlan from '$lib/components/DeletePracticePlan.svelte';
	import GroupFilter from '$lib/components/practice-plan/GroupFilter.svelte';
	import { filterSectionsByGroup } from '$lib/utils/groupFilter.js';
	import { goto } from '$app/navigation';
	import { toast } from '@zerodevx/svelte-toast';
	import { apiFetch } from '$lib/utils/apiFetch.js';

	export let data;
	const { practicePlan, team, userRole, isTeamContext } = data;

	// Store for tracking the current section
	const currentSectionId = writable(null);
	
	// Group filter state
	let selectedGroupFilter = 'All Groups';

	// Calculate total duration considering parallel activities
	$: totalDuration = practicePlan.sections.reduce((sum, section) => sum + section.duration, 0);

	// Check edit permissions - in team context, use team role
	$: isAdmin = userRole === 'admin';
	$: userCanEdit = isAdmin || userRole === 'coach';
	
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
	
	// Extract unique groups from sections
	$: uniqueGroups = [...new Set(practicePlan.sections.flatMap(s => 
		s.parallel_groups ? s.parallel_groups.map(g => g.group_name) : []
	))].filter(Boolean);
</script>

<main class="page-container">
	<!-- Team context breadcrumb -->
	<div class="mb-4">
		<Breadcrumb
			items={[
				{ label: 'Teams', href: '/teams' },
				{ label: team.name, href: `/teams/${team.slug}/season` },
				{ label: 'Practice Plans', href: `/teams/${team.slug}/plans` },
				{ label: practicePlan.name || 'Practice Plan' }
			]}
		/>
	</div>

	<!-- Practice Plan Header -->
	<div class="practice-plan-header">
		<div class="header-content">
			<h1 class="practice-plan-title">{practicePlan.name || 'Untitled Practice Plan'}</h1>
			<div class="practice-plan-meta">
				{#if practicePlan.scheduled_date}
					<span class="meta-item">
						<svg class="meta-icon" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
						</svg>
						{new Date(practicePlan.scheduled_date + 'T00:00:00').toLocaleDateString('en-US', {
							weekday: 'long',
							year: 'numeric',
							month: 'long',
							day: 'numeric'
						})}
					</span>
				{/if}
				{#if practicePlan.start_time}
					<span class="meta-item">
						<svg class="meta-icon" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
						</svg>
						{formatTime(practicePlan.start_time)} - {formatTime(addMinutes(practicePlan.start_time, totalDuration))}
					</span>
				{/if}
				<span class="meta-item">
					<svg class="meta-icon" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
					</svg>
					{totalDuration} minutes
				</span>
				{#if practicePlan.practice_type}
					<span class="meta-item type-badge">
						{practicePlan.practice_type}
					</span>
				{/if}
			</div>
		</div>
		<div class="header-actions">
			{#if userCanEdit}
				<a
					href="/teams/{team.slug}/plans/{practicePlan.id}/edit"
					class="btn btn-secondary"
				>
					Edit
				</a>
			{/if}
			<a
				href="/teams/{team.slug}/season"
				class="btn btn-secondary"
			>
				Back to Season
			</a>
		</div>
	</div>

	<!-- Description -->
	{#if practicePlan.description}
		<div class="practice-plan-description">
			<button
				class="description-header"
				on:click={() => isDescriptionExpanded.update(n => !n)}
			>
				<h2>Description</h2>
				<svg
					class="chevron"
					class:rotated={!$isDescriptionExpanded}
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
				</svg>
			</button>
			{#if $isDescriptionExpanded}
				<p class="description-text">{practicePlan.description}</p>
			{/if}
		</div>
	{/if}

	<!-- Group Filter (if there are groups) -->
	{#if uniqueGroups.length > 0}
		<div class="mb-6">
			<GroupFilter 
				groups={uniqueGroups} 
				on:filterChange={handleGroupFilterChange}
			/>
		</div>
	{/if}

	<!-- Timeline -->
	<div class="timeline-container">
		<Timeline 
			sections={filteredSections} 
			currentSectionId={$currentSectionId}
			on:sectionSelect={handleSectionSelect}
		/>
	</div>

	<!-- Sections -->
	<div class="sections-container">
		{#each filteredSections as section, index}
			<div data-section-id={section.id}>
				<Section {section} {index} />
			</div>
		{/each}
	</div>

	<!-- Actions -->
	{#if userCanEdit}
		<div class="practice-plan-actions">
			<DeletePracticePlan 
				planId={practicePlan.id}
				teamId={team.id}
				isTeamContext={true}
			/>
		</div>
	{/if}
</main>

<style>
	.page-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem;
	}

	.practice-plan-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--color-border);
	}

	.header-content {
		flex: 1;
	}

	.practice-plan-title {
		font-size: 2rem;
		font-weight: 700;
		margin: 0 0 0.5rem 0;
	}

	.practice-plan-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		color: var(--color-text-secondary);
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

	.type-badge {
		padding: 0.25rem 0.75rem;
		background-color: var(--color-primary-light);
		color: var(--color-primary);
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
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
	}

	.btn-secondary {
		background-color: var(--color-bg-secondary);
		color: var(--color-text);
	}

	.btn-secondary:hover {
		background-color: var(--color-bg-hover);
	}

	.practice-plan-description {
		margin-bottom: 2rem;
		background-color: var(--color-bg-secondary);
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.description-header {
		width: 100%;
		padding: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
	}

	.description-header h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.chevron {
		width: 1.25rem;
		height: 1.25rem;
		transition: transform 0.2s;
	}

	.chevron.rotated {
		transform: rotate(-90deg);
	}

	.description-text {
		padding: 0 1rem 1rem;
		margin: 0;
		line-height: 1.6;
	}

	.timeline-container {
		margin-bottom: 2rem;
		position: sticky;
		top: 0;
		background-color: var(--color-bg);
		z-index: 10;
		padding: 1rem 0;
		border-bottom: 1px solid var(--color-border);
	}

	.sections-container {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.practice-plan-actions {
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 1px solid var(--color-border);
	}

	@media (max-width: 768px) {
		.practice-plan-header {
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

		.timeline-container {
			position: relative;
		}
	}
</style>
