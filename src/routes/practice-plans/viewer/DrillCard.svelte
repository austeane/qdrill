<script>
  import { createEventDispatcher } from 'svelte';
  import { slide } from 'svelte/transition';
  import ExcalidrawWrapper from '$components/ExcalidrawWrapper.svelte';
  
  export let item;
  export let canEdit = false;
  export let isInParallelGroup = false;
  export let editable = false;

  const dispatch = createEventDispatcher();
  let isExpanded = false;

  $: {
    console.log('[DrillCard] Full item data:', item);
    console.log('[DrillCard] Drill data:', item?.drill);
  }

  $: normalizedItem = {
    ...item,
    name: item?.name || item?.drill?.name || 'Unnamed Item',
    duration: item?.selected_duration || item?.duration || item?.drill?.duration || 15,
    description: item?.brief_description || item?.drill?.brief_description || '',
    detailedDescription: item?.detailed_description || item?.drill?.detailed_description || '',
    skillLevel: item?.skill_level || item?.drill?.skill_level || [],
    skillsFocusedOn: item?.skills_focused_on || item?.drill?.skills_focused_on || [],
    positionsFocusedOn: item?.positions_focused_on || item?.drill?.positions_focused_on || [],
    complexity: item?.complexity || item?.drill?.complexity || '',
    suggestedLength: item?.suggested_length || item?.drill?.suggested_length || '',
    numberOfPeopleMin: item?.number_of_people_min || item?.drill?.number_of_people_min,
    numberOfPeopleMax: item?.number_of_people_max || item?.drill?.number_of_people_max,
    drillType: item?.drill_type || item?.drill?.drill_type || [],
    drill: item?.drill || item,
    hasDiagrams: item?.drill?.diagrams?.length > 0 || item?.diagrams?.length > 0,
    hasVideo: Boolean(item?.drill?.video_link || item?.video_link),
    isBreak: item?.type === 'break'
  };

  $: {
    console.log('[DrillCard] Normalized item:', normalizedItem);
  }

  function toggleExpand() {
    isExpanded = !isExpanded;
    console.log('[DrillCard] Toggled expansion:', isExpanded);
  }

  function handleEdit() {
    dispatch('edit', { item });
  }

  function handleDurationChange(newDuration) {
    dispatch('durationChange', { 
      itemId: item.id, 
      duration: parseInt(newDuration) 
    });
  }

  function handleDurationInput(event) {
    const newDuration = parseInt(event.target.value) || normalizedItem.duration;
    if (newDuration > 0) {
      handleDurationChange(newDuration);
    }
  }
</script>

<div 
  class="drill-card"
  class:break={normalizedItem.type === 'break'}
  class:parallel={isInParallelGroup}
  class:expanded={isExpanded}
>
  <div class="card-header">
    <!-- Main Info -->
    <div class="header-content">
      <button 
        type="button"
        class="expand-btn"
        on:click={toggleExpand}
        aria-label={isExpanded ? "Collapse drill details" : "Expand drill details"}
      >
        <svg
          class="w-4 h-4 transform transition-transform {isExpanded ? 'rotate-180' : ''}"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </button>

      <div class="title-section">
        <h3 class="drill-title">
          {normalizedItem.name}
        </h3>
        
        <!-- Indicators -->
        <div class="indicators">
          {#if normalizedItem.hasDiagrams}
            <span class="indicator diagram-indicator" title="Has diagrams">
              📊
            </span>
          {/if}
          {#if normalizedItem.hasVideo}
            <span class="indicator video-indicator" title="Has video">
              🎥
            </span>
          {/if}
        </div>
      </div>

      <!-- Duration Control -->
      <div class="duration-control">
        {#if editable}
          <input
            type="number"
            min="1"
            class="duration-input"
            value={normalizedItem.duration}
            on:input={handleDurationInput}
            on:blur={handleDurationInput}
          />
          <span class="duration-label">min</span>
        {:else}
          <span class="duration-display">{normalizedItem.duration}</span>
          <span class="duration-label">min</span>
        {/if}
      </div>
    </div>
  </div>

  {#if isExpanded}
    <div class="card-details" transition:slide>
      {#if !normalizedItem.isBreak}
        <!-- Brief Description -->
        <p class="brief-description">
          {normalizedItem.description}
        </p>

        <!-- Detailed Description -->
        {#if normalizedItem.detailedDescription}
          <div class="detailed-description">
            <h4 class="info-subtitle">Detailed Description</h4>
            <p class="description-text">
              {normalizedItem.detailedDescription}
            </p>
          </div>
        {/if}

        <!-- Key Information -->
        <div class="key-info">
          {#if normalizedItem.skillLevel}
            <div class="info-item">
              <span class="info-label">Skill Level:</span>
              <span class="info-value">{Array.isArray(normalizedItem.skillLevel) ? normalizedItem.skillLevel.join(', ') : normalizedItem.skillLevel}</span>
            </div>
          {/if}

          {#if normalizedItem.complexity}
            <div class="info-item">
              <span class="info-label">Complexity:</span>
              <span class="info-value">{normalizedItem.complexity}</span>
            </div>
          {/if}

          {#if normalizedItem.suggestedLength}
            <div class="info-item">
              <span class="info-label">Suggested Length:</span>
              <span class="info-value">{normalizedItem.suggestedLength} minutes</span>
            </div>
          {/if}

          {#if normalizedItem.numberOfPeopleMin}
            <div class="info-item">
              <span class="info-label">Players:</span>
              <span class="info-value">
                {normalizedItem.numberOfPeopleMin}-{normalizedItem.numberOfPeopleMax || 'Any'}
              </span>
            </div>
          {/if}

          {#if normalizedItem.drillType?.length}
            <div class="info-item">
              <span class="info-label">Drill Type:</span>
              <span class="info-value">
                {Array.isArray(normalizedItem.drillType) ? normalizedItem.drillType.join(', ') : normalizedItem.drillType}
              </span>
            </div>
          {/if}

          {#if normalizedItem.skillsFocusedOn?.length}
            <div class="info-item">
              <span class="info-label">Skills:</span>
              <div class="skill-tags">
                {#each Array.isArray(normalizedItem.skillsFocusedOn) ? normalizedItem.skillsFocusedOn : normalizedItem.skillsFocusedOn.split(',') as skill}
                  <span class="skill-tag">{skill.trim()}</span>
                {/each}
              </div>
            </div>
          {/if}

          {#if normalizedItem.positionsFocusedOn?.length}
            <div class="info-item">
              <span class="info-label">Positions:</span>
              <div class="skill-tags">
                {#each Array.isArray(normalizedItem.positionsFocusedOn) ? normalizedItem.positionsFocusedOn : normalizedItem.positionsFocusedOn.split(',') as position}
                  <span class="skill-tag">{position.trim()}</span>
                {/each}
              </div>
            </div>
          {/if}
        </div>

        <!-- Diagrams Preview -->
        {#if normalizedItem.hasDiagrams}
          <div class="diagrams-preview">
            {#if normalizedItem.drill?.diagrams?.[0]}
              <ExcalidrawWrapper 
                data={normalizedItem.drill.diagrams[0]}
                readonly={true}
                showSaveButton={false}
              />
            {:else if normalizedItem.diagrams?.[0]}
              <ExcalidrawWrapper 
                data={normalizedItem.diagrams[0]}
                readonly={true}
                showSaveButton={false}
              />
            {/if}
          </div>
        {/if}

        <!-- Video Link -->
        {#if normalizedItem.hasVideo}
          <a 
            href={normalizedItem.drill.video_link}
            target="_blank"
            rel="noopener noreferrer"
            class="video-link"
          >
            Watch Video Demo
          </a>
        {/if}
      {/if}
    </div>
  {/if}
</div>

<style>
  .drill-card {
    background: white;
    border-radius: 0.5rem;
    padding: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
  }

  .drill-card:hover {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }

  .drill-card.break {
    background: theme('colors.gray.50');
  }

  .drill-card.parallel {
    flex: 1;
    min-width: 0;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
  }

  .expand-btn {
    padding: 0.25rem;
    color: theme('colors.gray.500');
    transition: all 0.2s ease;
  }

  .expand-btn:hover {
    color: theme('colors.gray.700');
    background: theme('colors.gray.100');
    border-radius: 0.25rem;
  }

  .title-section {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .drill-title {
    font-weight: 600;
    color: theme('colors.gray.900');
  }

  .indicators {
    display: flex;
    gap: 0.25rem;
  }

  .indicator {
    font-size: 0.875rem;
    opacity: 0.7;
  }

  .duration-control {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .duration-input {
    width: 4rem;
    padding: 0.25rem;
    border: 1px solid theme('colors.gray.300');
    border-radius: 0.25rem;
    text-align: center;
  }

  .duration-display {
    font-weight: 500;
    color: theme('colors.gray.700');
  }

  .duration-label {
    color: theme('colors.gray.500');
    font-size: 0.875rem;
  }

  .card-details {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid theme('colors.gray.200');
  }

  .brief-description {
    color: theme('colors.gray.600');
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }

  .key-info {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .info-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .info-label {
    color: theme('colors.gray.500');
    font-size: 0.875rem;
  }

  .info-value {
    color: theme('colors.gray.700');
    font-size: 0.875rem;
    font-weight: 500;
  }

  .skill-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .skill-tag {
    background: theme('colors.blue.100');
    color: theme('colors.blue.700');
    padding: 0.125rem 0.375rem;
    border-radius: 1rem;
    font-size: 0.75rem;
  }

  .diagrams-preview {
    margin: 1rem 0;
    aspect-ratio: 5/6;
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
  }

  @media (max-width: 500px) {
    .diagrams-preview {
      width: 100%;
      max-width: none;
    }
  }

  .diagram-thumbnail {
    max-width: 200px;
    border-radius: 0.25rem;
    cursor: pointer;
  }

  .video-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    color: theme('colors.blue.600');
    font-size: 0.875rem;
    text-decoration: none;
  }

  .video-link:hover {
    text-decoration: underline;
  }

  .detailed-description {
    margin: 1rem 0;
    padding-top: 1rem;
    border-top: 1px solid theme('colors.gray.200');
  }

  .info-subtitle {
    font-weight: 600;
    color: theme('colors.gray.700');
    margin-bottom: 0.5rem;
  }

  .description-text {
    color: theme('colors.gray.600');
    font-size: 0.875rem;
    white-space: pre-wrap;
  }
</style> 