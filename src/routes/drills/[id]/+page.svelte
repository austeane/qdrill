<script>
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { page } from '$app/stores';
  import { cart } from '$lib/stores/cartStore';
  import DiagramDrawer from '../../../components/DiagramDrawer.svelte';
  import Breadcrumb from '../../../components/Breadcrumb.svelte';
  import { goto } from '$app/navigation';

  let drill = writable({});
  let comments = writable([]);
  let newComment = writable('');
  let upvotes = writable(0);
  let editableDiagram = writable(null);


  onMount(async () => {
    try {
      const response = await fetch(`/api/drills/${$page.params.id}`);
      if (!response.ok) {
        throw new Error(`Error fetching drill details: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.diagrams) {
        data.diagrams = data.diagrams.map(diagram => 
          typeof diagram === 'string' ? JSON.parse(diagram) : diagram
        );
      }
      drill.set(data);
      upvotes.set(data.upvotes);
      comments.set(Array.isArray(data.comments) ? data.comments : []);
    } catch (error) {
      console.error(error);
    }
  });

  function editDiagram(index) {
    editableDiagram.set($drill.diagrams[index]);
  }

  function handleDiagramSave(event, index) {
    const updatedDiagram = event.detail;
    drill.update(d => {
      d.diagrams[index] = updatedDiagram;
      return d;
    });
    editableDiagram.set(null); // Reset the editable diagram after saving
  }

  async function addComment() {
    try {
      const response = await fetch(`/api/drills/${$page.params.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comment: $newComment })
      });
      if (!response.ok) {
        throw new Error(`Error adding comment: ${response.statusText}`);
      }
      const data = await response.json();
      comments.update(current => [...current, data]);
      newComment.set('');
    } catch (error) {
      console.error(error);
    }
  }

  async function upvote() {
    try {
      const response = await fetch(`/api/drills/${$page.params.id}/upvote`, {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error(`Error upvoting: ${response.statusText}`);
      }
      const data = await response.json();
      upvotes.set(data.upvotes);
    } catch (error) {
      console.error(error);
    }
  }

  function addDrillToPlan() {
    cart.addDrill($drill);
    // Show notification
    alert('Drill added to plan');
  }
</script>

<svelte:head>
  <title>{$drill.name}</title>
  <meta name="description" content="Details of the selected drill" />
</svelte:head>

<Breadcrumb customSegments={[{ name: 'Drills', url: '/drills' }, { name: $drill.name }]} />

<section class="max-w-4xl mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold">{$drill.name}</h1>
    <div class="flex space-x-4">
      <a href="/drills/create" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-300">
        Create New Drill
      </a>
      <button
        on:click={addDrillToPlan}
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300"
      >
        Add Drill to Plan
      </button>
    </div>
  </div>
  
  <div class="bg-white shadow-md rounded-lg p-6 mb-8">
    <p class="text-xl mb-4">{$drill.brief_description}</p>
    
    <div class="flex justify-center space-x-4 mb-6">
      <a href="/drills/{$page.params.id}/edit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300">
        Edit Drill
      </a>
      <a
        href={`/practice-plans?drillId=${$drill.id}`}
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300"
      >
        Show Practice Plans that Include This Drill
      </a>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div>
        <h2 class="text-lg font-semibold mb-2">Drill Details</h2>
        <p><strong>Skill Levels:</strong> {$drill.skill_level}</p>
        <p><strong>Complexity:</strong> {$drill.complexity}</p>
        <p><strong>Suggested Length:</strong> {$drill.suggested_length} minutes</p>
        <p><strong>Number of People:</strong> {$drill.number_of_people_min} - {$drill.number_of_people_max}</p>
      </div>
      <div>
        <h2 class="text-lg font-semibold mb-2">Focus Areas</h2>
        <p><strong>Skills:</strong> {Array.isArray($drill.skills_focused_on) ? $drill.skills_focused_on.join(', ') : (typeof $drill.skills_focused_on === 'string' ? $drill.skills_focused_on.split(', ').join(', ') : '')}</p>
        <p><strong>Positions:</strong> {Array.isArray($drill.positions_focused_on) ? $drill.positions_focused_on.join(', ') : (typeof $drill.positions_focused_on === 'string' ? $drill.positions_focused_on.split(', ').join(', ') : '')}</p>
      </div>
    </div>

    <div class="mb-6">
      <h2 class="text-lg font-semibold mb-2">Detailed Description</h2>
      <p class="whitespace-pre-wrap">{$drill.detailed_description}</p>
    </div>

    {#if $drill.video_link}
      <div class="mb-6">
        <h2 class="text-lg font-semibold mb-2">Video</h2>
        <a href={$drill.video_link} target="_blank" class="text-blue-500 hover:text-blue-700 transition duration-300">Watch Video</a>
      </div>
    {/if}

    {#if $drill.images && $drill.images.length > 0}
      <div class="mb-6">
        <h2 class="text-lg font-semibold mb-2">Images</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {#each Array.isArray($drill.images) ? $drill.images : [] as image}
            <img src={image} alt="Drill Image" class="w-full h-48 object-cover rounded-lg" />
          {/each}
        </div>
      </div>
    {/if}

    <div class="mb-6">
      <button on:click={upvote} class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300">
        Upvote ({$upvotes})
      </button>
    </div>

    <div class="mb-6">
      <h2 class="text-lg font-semibold mb-2">Comments</h2>
      <ul class="space-y-2">
        {#each $comments as comment}
          <li class="bg-gray-100 p-2 rounded">{comment}</li>
        {/each}
      </ul>
      <div class="mt-4 flex space-x-2">
        <input type="text" bind:value={$newComment} placeholder="Add a comment" class="flex-grow border rounded p-2" />
        <button on:click={addComment} class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300">
          Submit
        </button>
      </div>
    </div>

    {#if $drill.diagrams && $drill.diagrams.length > 0}
      <div>
        <h2 class="text-lg font-semibold mb-2">Diagrams</h2>
        {#each $drill.diagrams as diagram, index}
          <div class="mb-4">
            <DiagramDrawer 
              data={diagram} 
              on:save={(event) => handleDiagramSave(event, index)} 
              showSaveButton={false} 
              {index}
            />
          </div>
        {/each}
      </div>
    {/if}
  </div>
</section>