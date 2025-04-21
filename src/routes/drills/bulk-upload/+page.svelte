<script>
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { goto } from '$app/navigation';
  import { toast } from '@zerodevx/svelte-toast';
  import ExcalidrawWrapper from '$components/ExcalidrawWrapper.svelte';
  import { apiFetch } from '$lib/utils/apiFetch.js';
  import { z } from 'zod';
  import { bulkUploadDrillInputSchema } from '$lib/validation/drillSchema';

  let fileInput;
  let uploadedFile = writable(null);
  let isUploading = writable(false);
  let uploadSummary = writable(null);
  let parsedDrills = writable([]);
  let filterOption = writable('all');
  let visibility = writable('public');

  $: filteredDrills = $parsedDrills.filter(drill => {
    if ($filterOption === 'all') return true;
    if ($filterOption === 'errors') return drill.errors.length > 0;
    if ($filterOption === 'valid') return drill.errors.length === 0;
  });

  const skillLevelOptions = [
    'New to Sport',
    'Beginner',
    'Intermediate',
    'Advanced',
    'Expert'
  ];

  const complexityOptions = [
    'Low',
    'Medium',
    'High'
  ];

  const positionOptions = ['Chaser', 'Beater', 'Keeper', 'Seeker'];

  const drillTypeOptions = [
    'Competitive', 
    'Skill-focus', 
    'Tactic-focus', 
    'Warmup', 
    'Conditioning', 
    'Cooldown', 
    'Contact', 
    'Match-like situation'
  ];

  function handleFileChange(event) {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      uploadedFile.set(file);
    } else {
      toast.push('Please select a valid CSV file', { theme: { '--toastBackground': 'red' } });
      fileInput.value = '';
    }
  }

  async function uploadCSV() {
    if (!$uploadedFile) {
      toast.push('Please select a CSV file to upload', { theme: { '--toastBackground': 'red' } });
      return;
    }

    isUploading.set(true);
    uploadSummary.set(null);
    parsedDrills.set([]);
    const formData = new FormData();
    formData.append('file', $uploadedFile);
    formData.append('visibility', $visibility);

    try {
      const result = await apiFetch('/api/drills/bulk-upload', {
        method: 'POST',
        body: formData
      });

      uploadSummary.set(result.summary);
      parsedDrills.set(result.drills.map(drill => ({
        ...drill,
        isEditing: false,
        editableDiagramIndex: null
      })));
    } catch (error) {
      console.error('Error uploading CSV:', error);
      toast.push(`Failed to upload CSV file: ${error.message}`, { theme: { '--toastBackground': 'red' } });
    } finally {
      isUploading.set(false);
    }
  }

  function downloadTemplate() {
    const template = `Name,Brief Description,Detailed Description,Drill Type,Skill Level (1:New to Sport; 2:Beginner; 3:Intermediate; 4:Advanced; 5:Expert),Complexity (1:Low; 2:Medium; 3:High),Suggested Length Min,Suggested Length Max,Number of People Min,Number of People Max,Skills Focused On,Positions Focused On (Chaser; Beater; Keeper; Seeker),Video Link
Example Drill,A brief description,A more detailed description,"Competitive,Skill-focus,Tactic-focus,Warmup,Conditioning,Cooldown,Contact,Match-like situation","1,2,3",2,10,15,4,8,"Passing,Catching","Chaser,Beater",https://example.com/video`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'drill_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function editDrill(index) {
    parsedDrills.update((drills) => {
      const newDrills = [...drills];
      const drill = { ...newDrills[index], isEditing: true };
      newDrills[index] = drill;
      return newDrills;
    });
  }

  function saveDrill(index) {
    parsedDrills.update((drills) => {
      const newDrills = [...drills];
      let drill = { ...newDrills[index] };
      
      const validationResult = bulkUploadDrillInputSchema.safeParse(drill);
      
      if (validationResult.success) {
        drill.errors = [];
        drill.isEditing = false;
        drill = { ...validationResult.data, isEditing: false }; 
      } else {
        drill.errors = validationResult.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        toast.push('Please fix the validation errors before saving.', { theme: { '--toastBackground': 'orange' } });
      }
      
      newDrills[index] = drill;
      return newDrills;
    });
  }

  function cancelEdit(index) {
    parsedDrills.update((drills) => {
      drills[index].isEditing = false;
      return drills;
    });
  }

  function removeDrill(index) {
    parsedDrills.update(drills => drills.filter((_, i) => i !== index));
  }

  async function saveChanges() {
    toast.push('Changes saved successfully', { theme: { '--toastBackground': 'green' } });
  }

  async function importDrills() {
    const validDrills = $parsedDrills.filter((drill) => drill.errors.length === 0);
    if (validDrills.length === 0) {
      toast.push('No valid drills to import', { theme: { '--toastBackground': 'red' } });
      return;
    }

    try {
      const result = await apiFetch('/api/drills/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          drills: validDrills,
          fileName: $uploadedFile ? $uploadedFile.name : 'manual_upload',
          visibility: $visibility
        })
      });

      toast.push(`Successfully imported ${result.importedCount} drills`, {
        theme: { '--toastBackground': 'green' }
      });
      goto('/drills');
    } catch (error) {
      console.error('Error importing drills:', error);
      toast.push(`Failed to import drills: ${error.message}`, { theme: { '--toastBackground': 'red' } });
    }
  }

  function addDiagram(drillIndex) {
    parsedDrills.update((drills) => {
      if (!drills[drillIndex].diagrams) {
        drills[drillIndex].diagrams = [];
      }
      const newDiagramIndex = drills[drillIndex].diagrams.length;
      drills[drillIndex].diagrams.push({});
      drills[drillIndex].editableDiagramIndex = newDiagramIndex;
      return drills;
    });
  }

  function deleteDiagram(drillIndex, diagramIndex) {
    parsedDrills.update((drills) => {
      drills[drillIndex].diagrams.splice(diagramIndex, 1);
      return drills;
    });
  }

  function saveDiagram(drillIndex, diagramIndex, event) {
    const diagramData = event.detail;
    parsedDrills.update((drills) => {
      drills[drillIndex].diagrams[diagramIndex] = diagramData;
      drills[drillIndex].editableDiagramIndex = null;
      return drills;
    });
    toast.push('Diagram saved successfully', { theme: { '--toastBackground': 'green' } });
  }

  function editDiagram(drillIndex, diagramIndex) {
    parsedDrills.update((drills) => {
      drills[drillIndex] = { ...drills[drillIndex], editableDiagramIndex: diagramIndex };
      return drills;
    });
  }

  function cancelEditDiagram(drillIndex) {
    parsedDrills.update((drills) => {
      drills[drillIndex].editableDiagramIndex = null;
      return drills;
    });
  }

  $: validDrillsCount = $parsedDrills.filter(drill => drill.errors.length === 0).length;

  function toggleSelection(array, value) {
    if (array.includes(value)) {
      const index = array.indexOf(value);
      array.splice(index, 1);
    } else {
      array.push(value);
    }
  }

  function validateDrillLocal(index) {
    parsedDrills.update((drills) => {
      const newDrills = [...drills];
      const drill = { ...newDrills[index] };
      
      const validationResult = bulkUploadDrillInputSchema.safeParse(drill);
      
      if (validationResult.success) {
        drill.errors = [];
      } else {
        drill.errors = validationResult.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      }
      
      newDrills[index] = drill;
      return newDrills;
    });
  }

  let skillsInput = '';
  $: if (filteredDrills && filteredDrills.length > 0 && filteredDrills[0].isEditing) {
    const editingDrill = filteredDrills.find(d => d.isEditing);
    if (editingDrill) {
      skillsInput = editingDrill.skills_focused_on.join(', ');
    }
  }
</script>

<svelte:head>
<title>Bulk Drill Upload</title>
</svelte:head>

<div class="container mx-auto p-6">
<h1 class="text-3xl font-bold mb-6">Bulk Drill Upload</h1>

<div class="mb-6 p-4 bg-gray-100 rounded">
  <h2 class="text-2xl font-semibold mb-2">Instructions</h2>
  <p class="mb-2">Please note the following when preparing your CSV file:</p>
  <ul class="list-disc list-inside mb-4">
    <li>Skill Level: Use numbers 1-5 (1: New to Sport, 2: Beginner, 3: Intermediate, 4: Advanced, 5: Expert)</li>
    <li>Complexity: Use numbers 1-3 (1: Low, 2: Medium, 3: High)</li>
    <li>Drill Type: Use any combination of the following, separated by commas: Competitive, Skill-focus, Tactic-focus, Warmup, Conditioning, Cooldown, Contact, Match-like situation</li>
    <li>Positions: Use any combination of the following, separated by commas: Chaser, Beater, Keeper, Seeker</li>
    <li>Number of People: Leave the max empty to indicate that there is no upper limit.</li>
    <li>Skills Focused On: Provide as a comma-separated list</li>
    <li>Video Link: Provide a valid URL if available</li>
    <li>Diagrams and Images: These can be added after uploading the CSV, during the review process.</li>
  </ul>
  <p>After upload, you'll be able to review and edit each drill, add diagrams and images, before final import.</p>
</div>

<div class="mb-6">
  <p class="mb-2">Download a CSV template with an example drill in the proper format. If you have issues opening or using the CSV, contact Austin.</p>
  <button on:click={downloadTemplate} class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded">
    Download CSV Template
  </button>
</div>

<div class="mb-6">
  <input
    type="file"
    accept=".csv"
    on:change={handleFileChange}
    bind:this={fileInput}
    class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
  />
</div>

{#if $uploadedFile}
  <div class="mb-6">
    <label class="block text-gray-700 font-medium mb-1">Visibility</label>
    <select
      bind:value={$visibility}
      class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring"
    >
      <option value="public">Public - Visible to everyone</option>
      <option value="unlisted">Unlisted - Only accessible via direct link</option>
      <option value="private">Private - Only visible to you</option>
    </select>
  </div>

  <div class="mb-6">
    <button
      on:click={uploadCSV}
      disabled={$isUploading}
      class="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
    >
      {$isUploading ? 'Uploading...' : 'Upload'}
    </button>
  </div>
{/if}

{#if $uploadSummary}
  <div class="mb-6 p-4 bg-gray-100 rounded">
    <h2 class="text-2xl font-semibold mb-2">Upload Summary</h2>
    <p>Total drills: <span class="font-medium">{$uploadSummary.total}</span></p>
    <p>Drills without errors: <span class="font-medium">{$uploadSummary.valid}</span></p>
    <p>Drills with errors: <span class="font-medium">{$uploadSummary.errors}</span></p>
  </div>
{/if}

{#if $parsedDrills.length > 0}
  <div class="mb-6">
    <label class="mr-2 font-semibold">Filter:</label>
    <select bind:value={$filterOption} class="border border-gray-300 rounded px-2 py-1">
      <option value="all">All Drills</option>
      <option value="errors">Drills with Errors</option>
      <option value="valid">Valid Drills</option>
    </select>
  </div>

  <div class="mb-6">
    <h2 class="text-2xl font-semibold mb-4">Parsed Drills</h2>
    <div class="space-y-6">
      {#each filteredDrills as drill, index (index + '-' + drill.name)}
        <div class="border rounded-lg p-6 bg-white shadow-md {drill.errors.length > 0 ? 'border-yellow-500' : 'border-green-500'}">
          {#if drill.isEditing}
            <div class="mb-4">
              <label class="block text-gray-700 font-medium mb-1" for="name">Name</label>
              <input
                type="text"
                bind:value={drill.name}
                placeholder="Name"
                class={`w-full px-3 py-2 border ${drill.errors?.some(e => e.startsWith('name:')) ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring`}
                on:input={() => validateDrillLocal(index)}
              />
              {#if drill.errors?.find(e => e.startsWith('name:'))}
                <p class="text-red-500 text-sm mt-1">{drill.errors.find(e => e.startsWith('name:')).split(': ')[1]}</p>
              {/if}
            </div>

            <div class="mb-4">
              <label class="block text-gray-700 font-medium mb-1" for="brief_description">Brief Description</label>
              <input
                type="text"
                bind:value={drill.brief_description}
                placeholder="Brief Description"
                class={`w-full px-3 py-2 border ${drill.errors?.some(e => e.startsWith('brief_description:')) ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring`}
                on:input={() => validateDrillLocal(index)}
              />
              {#if drill.errors?.find(e => e.startsWith('brief_description:'))}
                <p class="text-red-500 text-sm mt-1">{drill.errors.find(e => e.startsWith('brief_description:')).split(': ')[1]}</p>
              {/if}
            </div>

            <div class="mb-4">
              <label class="block text-gray-700 font-medium mb-1" for="detailed_description">Detailed Description</label>
              <textarea
                id="detailed_description"
                bind:value={drill.detailed_description}
                placeholder="Detailed Description"
                class={`w-full px-3 py-2 border ${drill.errors?.some(e => e.startsWith('detailed_description:')) ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring`}
                on:input={() => validateDrillLocal(index)}
                rows="4"
              ></textarea>
              {#if drill.errors?.find(e => e.startsWith('detailed_description:'))}
                <p class="text-red-500 text-sm mt-1">{drill.errors.find(e => e.startsWith('detailed_description:')).split(': ')[1]}</p>
              {/if}
            </div>

            <div class="mb-4">
              <label class="block text-gray-700 font-medium mb-1">Drill Type</label>
              <div class="flex flex-wrap gap-2">
                {#each drillTypeOptions as type}
                  <button
                    type="button"
                    class="px-3 py-1 rounded-full border border-gray-300"
                    class:selected={drill.drill_type.includes(type)}
                    on:click={() => { toggleSelection(drill.drill_type, type); validateDrillLocal(index); }}
                  >
                    {type}
                  </button>
                {/each}
              </div>
              {#if drill.errors?.find(e => e.startsWith('drill_type:'))}
                <p class="text-red-500 text-sm mt-1">{drill.errors.find(e => e.startsWith('drill_type:')).split(': ')[1]}</p>
              {/if}
            </div>

            <div class="mb-4">
              <label class="block text-gray-700 font-medium mb-1" for="skill_level">Skill Level(s)</label>
              <div class="flex flex-wrap gap-2">
                 {#each skillLevelOptions as level}
                  <button
                    type="button"
                    class="px-3 py-1 rounded-full border border-gray-300"
                    class:selected={drill.skill_level.includes(level)}
                    on:click={() => { toggleSelection(drill.skill_level, level); validateDrillLocal(index); }}
                  >
                    {level}
                  </button>
                {/each}
              </div>
               {#if drill.errors?.find(e => e.startsWith('skill_level:'))}
                <p class="text-red-500 text-sm mt-1">{drill.errors.find(e => e.startsWith('skill_level:')).split(': ')[1]}</p>
              {/if}
            </div>

            <div class="mb-4">
              <label class="block text-gray-700 font-medium mb-1" for="complexity">Complexity</label>
              <select
                id="complexity"
                bind:value={drill.complexity}
                 class={`w-full px-3 py-2 border ${drill.errors?.some(e => e.startsWith('complexity:')) ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring`}
                 on:change={() => validateDrillLocal(index)}
              >
                <option value={null}>Select...</option>
                {#each complexityOptions as option}
                  <option value={option}>{option}</option>
                {/each}
              </select>
              {#if drill.errors?.find(e => e.startsWith('complexity:'))}
                <p class="text-red-500 text-sm mt-1">{drill.errors.find(e => e.startsWith('complexity:')).split(': ')[1]}</p>
              {/if}
            </div>

            <div class="mb-4 grid grid-cols-2 gap-4">
              <div>
                <label class="block text-gray-700 font-medium mb-1" for="suggested_length_min">Suggested Length Min</label>
                <input
                  type="number"
                  bind:value={drill.suggested_length.min}
                  placeholder="Min"
                  class={`w-full px-3 py-2 border ${drill.errors?.some(e => e.startsWith('suggested_length.min:')) ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring`}
                  on:input={() => validateDrillLocal(index)}
                />
                 {#if drill.errors?.find(e => e.startsWith('suggested_length.min:'))}
                  <p class="text-red-500 text-sm mt-1">{drill.errors.find(e => e.startsWith('suggested_length.min:')).split(': ')[1]}</p>
                {/if}
              </div>

              <div>
                <label class="block text-gray-700 font-medium mb-1" for="suggested_length_max">Suggested Length Max</label>
                <input
                  type="number"
                  bind:value={drill.suggested_length.max}
                  placeholder="Max"
                  class={`w-full px-3 py-2 border ${drill.errors?.some(e => e.startsWith('suggested_length.max:')) ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring`}
                  on:input={() => validateDrillLocal(index)}
                />
                {#if drill.errors?.find(e => e.startsWith('suggested_length.max:'))}
                  <p class="text-red-500 text-sm mt-1">{drill.errors.find(e => e.startsWith('suggested_length.max:')).split(': ')[1]}</p>
                {/if}
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-gray-700 font-medium mb-1" for="number_of_people_min">Number of People Min</label>
                <input
                  type="number"
                  bind:value={drill.number_of_people.min}
                  placeholder="Min"
                  class={`w-full px-3 py-2 border ${drill.errors?.some(e => e.startsWith('number_of_people.min:')) ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring`}
                  on:input={() => validateDrillLocal(index)}
                  min="1"
                />
                 {#if drill.errors?.find(e => e.startsWith('number_of_people.min:'))}
                  <p class="text-red-500 text-sm mt-1">{drill.errors.find(e => e.startsWith('number_of_people.min:')).split(': ')[1]}</p>
                {/if}
              </div>

              <div>
                <label class="block text-gray-700 font-medium mb-1" for="number_of_people_max">Number of People Max</label>
                <input
                  type="number"
                  bind:value={drill.number_of_people.max}
                  placeholder="Max (or leave empty for 'any')"
                  class={`w-full px-3 py-2 border ${drill.errors?.some(e => e.startsWith('number_of_people.max:')) ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring`}
                   on:input={() => validateDrillLocal(index)}
                />
                 {#if drill.errors?.find(e => e.startsWith('number_of_people.max:'))}
                  <p class="text-red-500 text-sm mt-1">{drill.errors.find(e => e.startsWith('number_of_people.max:')).split(': ')[1]}</p>
                {/if}
              </div>
            </div>

            <div class="mb-4">
              <label class="block text-gray-700 font-medium mb-1">Skills Focused On</label>
              <input
                type="text"
                bind:value={skillsInput}
                on:change={() => { drill.skills_focused_on = skillsInput.split(',').map(s => s.trim()).filter(s => s); validateDrillLocal(index); }}
                placeholder="Passing, Catching"
                class={`w-full px-3 py-2 border ${drill.errors?.some(e => e.startsWith('skills_focused_on:')) ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring`}
              />
               {#if drill.errors?.find(e => e.startsWith('skills_focused_on:'))}
                  <p class="text-red-500 text-sm mt-1">{drill.errors.find(e => e.startsWith('skills_focused_on:')).split(': ')[1]}</p>
                {/if}
            </div>

            <div class="mb-4">
              <label class="block text-gray-700 font-medium mb-1" for="positions_focused_on">Positions Focused On</label>
               <div class="flex flex-wrap gap-2">
                 {#each positionOptions as pos}
                  <button
                    type="button"
                    class="px-3 py-1 rounded-full border border-gray-300"
                    class:selected={drill.positions_focused_on.includes(pos)}
                    on:click={() => { toggleSelection(drill.positions_focused_on, pos); validateDrillLocal(index); }}
                  >
                    {pos}
                  </button>
                {/each}
              </div>
              {#if drill.errors?.find(e => e.startsWith('positions_focused_on:'))}
                  <p class="text-red-500 text-sm mt-1">{drill.errors.find(e => e.startsWith('positions_focused_on:')).split(': ')[1]}</p>
                {/if}
            </div>

            <div class="mb-4">
              <label class="block text-gray-700 font-medium mb-1" for="video_link">Video Link</label>
              <input
                type="url"
                bind:value={drill.video_link}
                placeholder="https://example.com"
                class={`w-full px-3 py-2 border ${drill.errors?.some(e => e.startsWith('video_link:')) ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring`}
                on:input={() => validateDrillLocal(index)}
              />
              {#if drill.errors?.find(e => e.startsWith('video_link:'))}
                  <p class="text-red-500 text-sm mt-1">{drill.errors.find(e => e.startsWith('video_link:')).split(': ')[1]}</p>
                {/if}
            </div>

            <div class="mb-4">
              <h4 class="text-lg font-semibold mb-2">Diagrams:</h4>
              {#each drill.diagrams as diagram, diagIndex (diagIndex)}
                <ExcalidrawWrapper
                  data={diagram}
                  index={index}
                  diagIndex={diagIndex}
                  showSaveButton={drill.editableDiagramIndex === diagIndex}
                  on:save={(event) => saveDiagram(index, diagIndex, event)}
                />
                {#if drill.editableDiagramIndex === diagIndex}
                  <button on:click={() => cancelEditDiagram(index)} class="text-gray-500 mt-2">Cancel</button>
                {:else}
                  <button on:click={() => editDiagram(index, diagIndex)} class="text-blue-500 mt-2">Edit Diagram</button>
                {/if}
              {/each}
              <button on:click={() => addDiagram(index)} class="mt-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-1 px-3 rounded">
                Add New Diagram
              </button>
            </div>

            <div class="flex justify-end space-x-2 mt-4">
              <button on:click={() => cancelEdit(index)} class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded">
                Cancel
              </button>
              <button on:click={() => saveDrill(index)} class="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded" disabled={drill.errors?.length > 0}>
                Save Changes
              </button>
            </div>
          {:else}
            <h3 class="text-xl font-semibold mb-2">{drill.name}</h3>
            <p class="text-gray-700 mb-2">{drill.brief_description}</p>
            {#if drill.detailed_description}
              <p class="text-gray-600 mb-2"><strong>Detailed Description:</strong> {drill.detailed_description}</p>
            {/if}
            <p class="text-gray-600 mb-1"><strong>Drill Type:</strong> {drill.drill_type.join(', ')}</p>
            <p class="text-gray-600 mb-1"><strong>Skill Level(s):</strong> {drill.skill_level.join(', ')}</p>
            {#if drill.complexity}
              <p class="text-gray-600 mb-1"><strong>Complexity:</strong> {drill.complexity}</p>
            {/if}
            <p class="text-gray-600 mb-1"><strong>Suggested Length:</strong> {drill.suggested_length.min} - {drill.suggested_length.max} minutes</p>
            <p class="text-gray-600 mb-1">
              <strong>Number of People:</strong> 
              {drill.number_of_people.min} - {drill.number_of_people.max ? drill.number_of_people.max : 'any'}
            </p>
            <p class="text-gray-600 mb-1"><strong>Skills Focused On:</strong> {drill.skills_focused_on.join(', ')}</p>
            <p class="text-gray-600 mb-1"><strong>Positions Focused On:</strong> {drill.positions_focused_on.join(', ')}</p>
            {#if drill.video_link}
              <p class="text-gray-600 mb-2"><strong>Video Link:</strong> <a href={drill.video_link} class="text-blue-500 underline" target="_blank">{drill.video_link}</a></p>
            {/if}

            {#if drill.errors.length > 0}
              <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-2" role="alert">
                <strong class="font-bold">Errors:</strong>
                <ul class="mt-1 list-disc list-inside text-sm">
                  {#each drill.errors as error}
                    <li>{error}</li>
                  {/each}
                </ul>
              </div>
            {/if}

            <div class="mb-4">
              <h4 class="text-lg font-semibold mb-2">Diagrams:</h4>
              {#each drill.diagrams as diagram, diagIndex (diagIndex)}
                <ExcalidrawWrapper
                  data={diagram}
                  index={index}
                  diagIndex={diagIndex}
                  showSaveButton={drill.editableDiagramIndex === diagIndex}
                  on:save={(event) => saveDiagram(index, diagIndex, event)}
                />
                {#if drill.editableDiagramIndex === diagIndex}
                  <button on:click={() => cancelEditDiagram(index)} class="text-gray-500 mt-2">Cancel</button>
                {:else}
                  <button on:click={() => editDiagram(index, diagIndex)} class="text-blue-500 mt-2">Edit Diagram</button>
                {/if}
              {/each}
              <button on:click={() => addDiagram(index)} class="mt-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-1 px-3 rounded">
                Add New Diagram
              </button>
            </div>

            <div class="flex space-x-4 mt-4">
              <button on:click={() => editDrill(index)} class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded">
                Edit
              </button>
              <button on:click={() => removeDrill(index)} class="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded">
                Remove
              </button>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}

<div class="flex space-x-4">
  <button on:click={saveChanges} class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded">
    Save Changes
  </button>
  <button on:click={importDrills} class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded">
    Import Valid Drills ({validDrillsCount})
  </button>
</div>
</div>

<style>
  .selected {
    background-color: #3b82f6;
    color: white;
  }
</style>