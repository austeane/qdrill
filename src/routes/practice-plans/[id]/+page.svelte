<script>
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import Breadcrumb from '$components/Breadcrumb.svelte';
  import Comments from '$components/Comments.svelte';
  import UpvoteDownvote from '$components/UpvoteDownvote.svelte';
  import Timeline from '../viewer/Timeline.svelte';
  import Section from '../viewer/Section.svelte';
  import DeletePracticePlan from '$components/DeletePracticePlan.svelte';
  
  export let data;
  const { practicePlan } = data;

  // Store for tracking the current section
  const currentSectionId = writable(null);
  
  // Calculate total duration considering parallel activities
  $: totalDuration = practicePlan.sections.reduce((sum, section) => 
    sum + section.duration, 0
  );

  // Check edit permissions
  $: canEdit = $page.data.session?.user?.id === practicePlan.created_by || 
               practicePlan.is_editable_by_others;

  // Intersection Observer setup for section tracking
  onMount(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
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
    document.querySelectorAll('[data-section-id]').forEach(section => {
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
</script>

<Breadcrumb 
  customSegments={[
    { name: 'Practice Plans', url: '/practice-plans' }, 
    { name: practicePlan.name }
  ]} 
/>

<div class="container mx-auto p-4 sm:p-6">
  <!-- Header Section -->
  <header class="bg-white shadow-md rounded-lg p-6 mb-6">
    <div class="flex justify-between items-start mb-4">
      <div>
        <h1 class="text-2xl font-bold">{practicePlan.name}</h1>
        {#if practicePlan.description}
          <div class="mt-2 text-gray-600 prose prose-sm sm:prose lg:prose-lg">
            {@html practicePlan.description}
          </div>
        {/if}
      </div>
      <div class="flex items-center gap-4">
        {#if canEdit}
          <a 
            href="/practice-plans/{practicePlan.id}/edit" 
            class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Edit Plan
          </a>
        {/if}
        <DeletePracticePlan 
          planId={practicePlan.id} 
          createdBy={practicePlan.created_by}
        />
        <UpvoteDownvote practicePlanId={practicePlan.id} />
      </div>
    </div>

    <!-- Practice Info Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      <div class="stat-card">
        <div class="stat-icon">⏱️</div>
        <div class="stat-content">
          <span class="stat-label">Total Duration</span>
          <span class="stat-value">{totalDuration} minutes</span>
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
    <div class="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Practice Goals</h2>
      <ul class="space-y-2">
        {#each practicePlan.practice_goals as goal}
          <li class="flex items-start">
            <span class="mr-2">•</span>
            <span>{goal}</span>
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  <!-- Main Content -->
  <div class="flex gap-6">
    <!-- Timeline (hidden on mobile) -->
    <Timeline 
      sections={practicePlan.sections}
      currentSectionId={$currentSectionId}
      {totalDuration}
      on:sectionSelect={handleSectionSelect}
    />

    <!-- Practice Plan Content -->
    <div class="flex-1">
      {#each practicePlan.sections as section, index (section.id)}
        <div 
          data-section-id={section.id}
          class="mb-6"
        >
          <Section 
            {section}
            isActive={section.id === $currentSectionId}
            {canEdit}
            sectionIndex={index}
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
    background-color: white;
    padding: 1rem;
    border-radius: 0.5rem;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    gap: 0.75rem;
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

  .stat-value {
    font-weight: 600;
    color: rgb(17, 24, 39);
  }

  @media (max-width: 768px) {
    .container {
      padding-left: 0.5rem;
      padding-right: 0.5rem;
    }
  }
</style>