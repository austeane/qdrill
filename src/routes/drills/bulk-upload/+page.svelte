<script>
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { goto } from '$app/navigation';
  import { toast } from '@zerodevx/svelte-toast';
  import DiagramDrawer from '$components/DiagramDrawer.svelte';

  let fileInput;
  let uploadedFile = writable(null);
  let isUploading = writable(false);
  let uploadSummary = writable(null);
  let parsedDrills = writable([]);
  let filterOption = writable('all');

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

  // Add drillTypeOptions
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
    const formData = new FormData();
    formData.append('file', $uploadedFile);

    try {
      const response = await fetch('/api/drills/bulk-upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      uploadSummary.set(result.summary);
      parsedDrills.set(result.drills.map(drill => ({
        ...drill,
        isEditing: false,
        editableDiagramIndex: null
      })));
    } catch (error) {
      console.error('Error uploading CSV:', error);
      toast.push('Failed to upload CSV file', { theme: { '--toastBackground': 'red' } });
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
      const drill = { ...newDrills[index] };
      validateDrill(drill);
      if (drill.errors.length === 0) {
        drill.isEditing = false;
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

  function validateDrill(drill) {
    drill.errors = [];

    // 1. Name: Required
    if (!drill.name || drill.name.trim() === '') {
      drill.errors.push('Name is required');
    }

    // 2. Brief Description: Required
    if (!drill.brief_description || drill.brief_description.trim() === '') {
      drill.errors.push('Brief description is required');
    }

    // 3. Skill Level: Required, array of numbers [1-5]
    if (!Array.isArray(drill.skill_level) || drill.skill_level.length === 0) {
      drill.errors.push('Skill level is required and must be an array');
    } else {
      const invalidLevels = drill.skill_level.filter(
        (level) => !skillLevelOptions.includes(level)
      );
      if (invalidLevels.length > 0) {
        drill.errors.push(`Invalid skill levels: ${invalidLevels.join(', ')}`);
      }
    }

    // 4. Complexity: Optional, must be 1, 2, or 3
    if (drill.complexity && !complexityOptions.includes(drill.complexity)) {
      drill.errors.push('Complexity must be Low, Medium, or High');
    }

    // 5. Suggested Length: Required, positive integers, max >= min
    const minLength = drill.suggested_length.min;
    const maxLength = drill.suggested_length.max;
    if (!Number.isInteger(Number(minLength)) || Number(minLength) <= 0) {
      drill.errors.push('Suggested length min must be a positive integer');
    }
    if (!Number.isInteger(Number(maxLength)) || Number(maxLength) <= 0) {
      drill.errors.push('Suggested length max must be a positive integer');
    }
    if (Number(maxLength) < Number(minLength)) {
      drill.errors.push('Suggested length max must be greater than or equal to min');
    }

    // 6. Number of People: Optional, positive integers, max >= min or empty (for "any")
    const minPeople = drill.number_of_people.min;
    const maxPeople = drill.number_of_people.max;
    if (minPeople != null || maxPeople != null) {
      if (minPeople !== null && (!Number.isInteger(Number(minPeople)) || Number(minPeople) <= 0)) {
        drill.errors.push('Number of people min must be a positive integer');
      }
      if (maxPeople !== null && maxPeople !== '' && (!Number.isInteger(Number(maxPeople)) || Number(maxPeople) <= 0)) {
        drill.errors.push('Number of people max must be a positive integer or empty for "any"');
      }
      if (maxPeople !== null && maxPeople !== '' && Number(maxPeople) < Number(minPeople)) {
        drill.errors.push('Number of people max must be greater than or equal to min');
      }
    }

    // 7. Skills Focused On: Required, must be an array
    if (!Array.isArray(drill.skills_focused_on) || drill.skills_focused_on.length === 0) {
      drill.errors.push('Skills focused on is required and must be an array');
    }

    // 8. Positions Focused On: Required, valid positions
    if (
      !Array.isArray(drill.positions_focused_on) ||
      drill.positions_focused_on.length === 0
    ) {
      drill.errors.push('Positions focused on is required and must be an array');
    } else {
      const invalidPositions = drill.positions_focused_on.filter(
        (pos) => !positionOptions.includes(pos)
      );
      if (invalidPositions.length > 0) {
        drill.errors.push(`Invalid positions: ${invalidPositions.join(', ')}`);
      }
    }

    // 9. Video Link: Optional, must be a valid URL if provided
    if (drill.video_link) {
      try {
        new URL(drill.video_link);
      } catch {
        drill.errors.push('Video link must be a valid URL');
      }
    }

    // Initialize diagrams as an empty array if not present
    if (!Array.isArray(drill.diagrams)) {
      drill.diagrams = [];
    }

    // Drill Type validation
    if (!Array.isArray(drill.drill_type) || drill.drill_type.length === 0) {
      drill.errors.push('At least one drill type is required');
    } else {
      const invalidTypes = drill.drill_type.filter(
        (type) => !drillTypeOptions.includes(type)
      );
      if (invalidTypes.length > 0) {
        drill.errors.push(`Invalid drill types: ${invalidTypes.join(', ')}`);
      }
    }
  }

  function removeDrill(index) {
    parsedDrills.update(drills => drills.filter((_, i) => i !== index));
  }

  async function saveChanges() {
    // Since changes are already saved in the local state, this might be empty
    toast.push('Changes saved successfully', { theme: { '--toastBackground': 'green' } });
  }

  async function importDrills() {
    const validDrills = $parsedDrills.filter((drill) => drill.errors.length === 0);
    if (validDrills.length === 0) {
      toast.push('No valid drills to import', { theme: { '--toastBackground': 'red' } });
      return;
    }

    try {
      const response = await fetch('/api/drills/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drills: validDrills })
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const result = await response.json();
      toast.push(`Successfully imported ${result.importedCount} drills`, {
        theme: { '--toastBackground': 'green' }
      });
      // Redirect to drill listing page
      goto('/drills');
    } catch (error) {
      console.error('Error importing drills:', error);
      toast.push('Failed to import drills', { theme: { '--toastBackground': 'red' } });
    }
  }

  function addDiagram(drillIndex) {
    parsedDrills.update((drills) => {
      if (!drills[drillIndex].diagrams) {
        drills[drillIndex].diagrams = [];
      }
      const newDiagramIndex = drills[drillIndex].diagrams.length;
      drills[drillIndex].diagrams.push({}); // Add new empty diagram
      drills[drillIndex].editableDiagramIndex = newDiagramIndex; // Set the new diagram as editable
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
</script>

<svelte:head>
<title>Bulk Drill Upload</title>
</svelte:head>

<div class="container mx-auto p-6">
<h1 class="text-3xl font-bold mb-6">Bulk Drill Upload</h1>

<!-- Add this new section for instructions -->
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

<div class="mb-6">
  <button
    on:click={uploadCSV}
    disabled={$isUploading || !$uploadedFile}
    class="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
  >
    {$isUploading ? 'Uploading...' : 'Upload'}
  </button>
</div>

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
      {#each filteredDrills as drill, index (drill.id)}
        <div class="border rounded-lg p-6 bg-white shadow-md {drill.errors.length > 0 ? 'border-yellow-500' : 'border-green-500'}">
          {#if drill.isEditing}
            <!-- Editable Fields -->
            <div class="mb-4">
              <label class="block text-gray-700 font-medium mb-1" for="name">Name</label>
              <input
                type="text"
                bind:value={drill.name}
                placeholder="Name"
                class={`w-full px-3 py-2 border ${drill.errors.includes('Name is required') ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring`}
                on:input={() => validateDrill(drill)}
              />
              {#if drill.errors.includes('Name is required')}
                <p class="text-red-500 text-sm mt-1">Name is required</p>
              {/if}
            </div>

            <div class="mb-4">
              <label class="block text-gray-700 font-medium mb-1" for="brief_description">Brief Description</label>
              <input
                type="text"
                bind:value={drill.brief_description}
                placeholder="Brief Description"
                class={`w-full px-3 py-2 border ${drill.errors.includes('Brief description is required') ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring`}
                on:input={() => validateDrill(drill)}
              />
              {#if drill.errors.includes('Brief description is required')}
                <p class="text-red-500 text-sm mt-1">Brief description is required</p>
              {/if}
            </div>

            <!-- Drill Type Field (moved to the top) -->
            <div class="mb-4">
              <label class="block text-gray-700 font-medium mb-1">Drill Type</label>
              <div class="flex flex-wrap gap-2">
                {#each drillTypeOptions as type}
                  <button
                    type="button"
                    class="px-3 py-1 rounded-full border border-gray-300"
                    class:selected={drill.drill_type.includes(type)}
                    on:click={() => toggleSelection(drill.drill_type, type)}
                  >
                    {type}
                  </button>
                {/each}
              </div>
              {#if drill.errors.includes('At least one drill type is required')}
                <p class="text-red-500 text-sm mt-1">At least one drill type is required</p>
              {/if}
            </div>

            <div class="mb-4">
              <label class="block text-gray-700 font-medium mb-1" for="skill_level">Skill Level(s)</label>
              <select
                id="skill_level"
                name="skill_level"
                multiple
                bind:value={drill.skill_level}
                class={`w-full px-3 py-2 border ${drill.errors.includes('Skill level is required and must be an array') || drill.errors.some(err => err.startsWith('Invalid skill levels')) ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring`}
                on:change={() => validateDrill(drill)}
              >
                {#each skillLevelOptions as option}
                  <option value={option}>{option}</option>
                {/each}
              </select>
              {#if drill.errors.includes('Skill level is required and must be an array')}
                <p class="text-red-500 text-sm mt-1">Skill level is required and must be an array</p>
              {/if}
              {#each drill.errors as error}
                {#if error.startsWith('Invalid skill levels')}
                  <p class="text-red-500 text-sm mt-1">{error}</p>
                {/if}
              {/each}
            </div>

            <div class="mb-4">
              <label class="block text-gray-700 font-medium mb-1" for="complexity">Complexity</label>
              <select
                id="complexity"
                name="complexity"
                bind:value={drill.complexity}
                class={`w-full px-3 py-2 border ${drill.errors.includes('Complexity must be Low, Medium, or High') ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring`}
                on:change={() => validateDrill(drill)}
              >
                <option value="">Select Complexity</option>
                {#each complexityOptions as option}
                  <option value={option}>{option}</option>
                {/each}
              </select>
              {#if drill.errors.includes('Complexity must be Low, Medium, or High')}
                <p class="text-red-500 text-sm mt-1">Complexity must be Low, Medium, or High</p>
              {/if}
            </div>

            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-gray-700 font-medium mb-1" for="suggested_length_min">Suggested Length Min</label>
                <input
                  type="number"
                  bind:value={drill.suggested_length.min}
                  placeholder="Min"
                  class={`w-full px-3 py-2 border ${drill.errors.includes('Suggested length min must be a positive integer') ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring`}
                  on:input={() => validateDrill(drill)}
                />
                {#if drill.errors.includes('Suggested length min must be a positive integer')}
                  <p class="text-red-500 text-sm mt-1">Must be a positive integer</p>
                {/if}
              </div>

              <div>
                <label class="block text-gray-700 font-medium mb-1" for="suggested_length_max">Suggested Length Max</label>
                <input
                  type="number"
                  bind:value={drill.suggested_length.max}
                  placeholder="Max"
                  class={`w-full px-3 py-2 border ${drill.errors.includes('Suggested length max must be a positive integer') ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring`}
                  on:input={() => validateDrill(drill)}
                />
                {#if drill.errors.includes('Suggested length max must be a positive integer')}
                  <p class="text-red-500 text-sm mt-1">Must be a positive integer</p>
                {/if}
              </div>
            </div>

            {#if drill.errors.some(err => err.includes('Suggested length max must be greater than or equal to min'))}
              <p class="text-red-500 text-sm mb-4">Suggested length max must be greater than or equal to min</p>
            {/if}

            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-gray-700 font-medium mb-1" for="number_of_people_min">Number of People Min</label>
                <input
                  type="number"
                  bind:value={drill.number_of_people.min}
                  placeholder="Min"
                  class={`w-full px-3 py-2 border ${drill.errors.includes('Number of people min must be a positive integer') ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring`}
                  on:input={() => validateDrill(drill)}
                  min="1"
                />
                {#if drill.errors.includes('Number of people min must be a positive integer')}
                  <p class="text-red-500 text-sm mt-1">Must be a positive integer</p>
                {/if}
              </div>

              <div>
                <label class="block text-gray-700 font-medium mb-1" for="number_of_people_max">Number of People Max</label>
                <input
                  type="number"
                  bind:value={drill.number_of_people.max}
                  placeholder="Max (or leave empty for 'any')"
                  class={`w-full px-3 py-2 border ${drill.errors.includes('Number of people max must be a positive integer or empty for "any"') ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring`}
                  on:input={() => validateDrill(drill)}
                  min="1"
                />
                {#if drill.errors.includes('Number of people max must be a positive integer or empty for "any"')}
                  <p class="text-red-500 text-sm mt-1">Must be a positive integer or empty for "any"</p>
                {/if}
              </div>
            </div>

            {#if drill.errors.some(err => err.includes('Number of people max must be greater than or equal to min'))}
              <p class="text-red-500 text-sm mb-4">Number of people max must be greater than or equal to min</p>
            {/if}

            <div class="mb-4">
              <label class="block text-gray-700 font-medium mb-1" for="skills_focused_on">Skills Focused On</label>
              <input
                type="text"
                bind:value={drill.skills_focused_on}
                placeholder="Comma-separated skills"
                class={`w-full px-3 py-2 border ${drill.errors.includes('Skills focused on is required and must be an array') ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring`}
                on:input={() => validateDrill(drill)}
              />
              {#if drill.errors.includes('Skills focused on is required and must be an array')}
                <p class="text-red-500 text-sm mt-1">At least one skill is required</p>
              {/if}
            </div>

            <div class="mb-4">
              <label class="block text-gray-700 font-medium mb-1" for="positions_focused_on">Positions Focused On</label>
              <select
                id="positions_focused_on"
                name="positions_focused_on"
                multiple
                bind:value={drill.positions_focused_on}
                class={`w-full px-3 py-2 border ${drill.errors.includes('Positions focused on is required and must be an array') || drill.errors.some(err => err.startsWith('Invalid positions')) ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring`}
                on:change={() => validateDrill(drill)}
              >
                {#each positionOptions as position}
                  <option value={position}>{position}</option>
                {/each}
              </select>
              {#if drill.errors.includes('Positions focused on is required and must be an array')}
                <p class="text-red-500 text-sm mt-1">At least one position is required</p>
              {/if}
              {#each drill.errors as error}
                {#if error.startsWith('Invalid positions')}
                  <p class="text-red-500 text-sm mt-1">{error}</p>
                {/if}
              {/each}
            </div>

            <div class="mb-4">
              <label class="block text-gray-700 font-medium mb-1" for="video_link">Video Link</label>
              <input
                type="url"
                bind:value={drill.video_link}
                placeholder="https://example.com/video"
                class={`w-full px-3 py-2 border ${drill.errors.includes('Video link must be a valid URL') ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring`}
                on:input={() => validateDrill(drill)}
              />
              {#if drill.errors.includes('Video link must be a valid URL')}
                <p class="text-red-500 text-sm mt-1">Must be a valid URL</p>
              {/if}
            </div>

            <!-- Diagrams Section -->
            <div class="mb-4">
              <h4 class="text-lg font-semibold mb-2">Diagrams:</h4>
              {#each drill.diagrams as diagram, diagIndex (diagIndex)}
                <DiagramDrawer
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

            <!-- Action Buttons -->
            <div class="flex space-x-4 mt-4">
              <button on:click={() => saveDrill(index)} class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded">
                Save
              </button>
              <button on:click={() => cancelEdit(index)} class="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded">
                Cancel
              </button>
            </div>
          {:else}
            <!-- Display Fields (Always Visible) -->
            <h3 class="text-xl font-semibold mb-2">{drill.name}</h3>
            <p class="text-gray-700 mb-2">{drill.brief_description}</p>
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

            <!-- Diagrams Section -->
            <div class="mb-4">
              <h4 class="text-lg font-semibold mb-2">Diagrams:</h4>
              {#each drill.diagrams as diagram, diagIndex (diagIndex)}
                <DiagramDrawer
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

            <!-- Action Buttons -->
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