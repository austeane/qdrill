<script>
    import DiagramDrawer from '$components/DiagramDrawer.svelte';
  
    // Receive the practice plan data from the server-side load function
    export let data;
    const { practicePlan } = data;
  
    // Manage the expanded state of each item
    let expandedItems = {};
  
    // Calculate total duration
    const totalDuration = practicePlan.items.reduce((sum, item) => sum + item.duration, 0);
  </script>
  
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">{practicePlan.name}</h1>
    {#if practicePlan.description}
      <p class="mb-4">{practicePlan.description}</p>
    {/if}
    <p class="mb-4"><strong>Total Duration:</strong> {totalDuration} minutes</p>
  
    <!-- Display the timeline -->
    <div class="timeline">
      {#each practicePlan.items as item, index}
        <div
          class="timeline-item bg-gray-100 rounded p-4 mb-4"
          style="flex-grow: {item.duration};"
        >
          <div class="item-header flex justify-between items-center">
            {#if item.type === 'drill'}
              <h2 class="text-xl font-semibold">{item.drill.name}</h2>
            {:else if item.type === 'break'}
              <h2 class="text-xl font-semibold">Break</h2>
            {/if}
            <div>
              <span class="text-gray-600">{item.duration} minutes</span>
              {#if item.type === 'drill'}
                <button
                  class="ml-4 text-blue-600 hover:underline"
                  on:click={() => (expandedItems[index] = !expandedItems[index])}
                >
                  {expandedItems[index] ? 'Hide Details' : 'Show Details'}
                </button>
              {/if}
            </div>
          </div>
  
          {#if item.type === 'drill' && expandedItems[index]}
            <div class="drill-details mt-2 p-2 bg-white rounded shadow">
              {#if item.drill.brief_description}
                <p><strong>Brief Description:</strong> {item.drill.brief_description}</p>
              {/if}
              {#if item.drill.detailed_description}
                <p><strong>Detailed Description:</strong> {item.drill.detailed_description}</p>
              {/if}
              {#if item.drill.skill_level}
                <p>
                  <strong>Skill Level:</strong>
                  {Array.isArray(item.drill.skill_level)
                    ? item.drill.skill_level.join(', ')
                    : item.drill.skill_level}
                </p>
              {/if}
              {#if item.drill.complexity}
                <p><strong>Complexity:</strong> {item.drill.complexity}</p>
              {/if}
              {#if item.drill.number_of_people_min && item.drill.number_of_people_max}
                <p>
                  <strong>Number of People:</strong> {item.drill.number_of_people_min} - {item.drill.number_of_people_max}
                </p>
              {/if}
              {#if item.drill.skills_focused_on}
                <p>
                  <strong>Skills Focused On:</strong>
                  {Array.isArray(item.drill.skills_focused_on)
                    ? item.drill.skills_focused_on.join(', ')
                    : item.drill.skills_focused_on}
                </p>
              {/if}
              {#if item.drill.positions_focused_on}
                <p>
                  <strong>Positions Focused On:</strong>
                  {Array.isArray(item.drill.positions_focused_on)
                    ? item.drill.positions_focused_on.join(', ')
                    : item.drill.positions_focused_on}
                </p>
              {/if}
              {#if item.drill.video_link}
                <p>
                  <strong>Video Link:</strong>
                  <a href={item.drill.video_link} target="_blank" rel="noopener noreferrer">Watch Video</a>
                </p>
              {/if}
              {#if item.drill.diagram_data}
                <DiagramDrawer 
                  data={item.drill.diagram_data} 
                  readonly={true} 
                  showSaveButton={false}
                />
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
  
  <style>
    .timeline {
      display: flex;
      flex-direction: column;
    }
    .timeline-item {
      display: flex;
      flex-direction: column;
    }
  </style>