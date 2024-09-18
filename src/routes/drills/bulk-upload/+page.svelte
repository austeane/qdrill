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
        parsedDrills.set(result.drills);
      } catch (error) {
        console.error('Error uploading CSV:', error);
        toast.push('Failed to upload CSV file', { theme: { '--toastBackground': 'red' } });
      } finally {
        isUploading.set(false);
      }
    }
  
    function downloadTemplate() {
      const template = `Name,Brief Description,Detailed Description,Skill Level,Complexity,Suggested Length Min,Suggested Length Max,Number of People Min,Number of People Max,Skills Focused On,Positions Focused On,Video Link
  Example Drill,A brief description,A more detailed description,"1,2,3",2,10,15,4,8,"Passing,Catching","Chaser,Beater",https://example.com/video`;
  
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
        drills[index].isEditing = true;
        return drills;
      });
    }
  
    function saveDrill(index) {
      parsedDrills.update((drills) => {
        const drill = drills[index];
        validateDrill(drill);
        if (drill.errors.length === 0) {
          drill.isEditing = false;
        }
        return drills;
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
        const validSkillLevels = [1, 2, 3, 4, 5];
        const invalidLevels = drill.skill_level.filter(
          (level) => !validSkillLevels.includes(Number(level))
        );
        if (invalidLevels.length > 0) {
          drill.errors.push(`Invalid skill levels: ${invalidLevels.join(', ')}`);
        }
      }

      // 4. Complexity: Optional, must be 1, 2, or 3
      if (drill.complexity) {
        const complexityValue = Number(drill.complexity);
        if (![1, 2, 3].includes(complexityValue)) {
          drill.errors.push('Complexity must be 1 (Low), 2 (Medium), or 3 (High)');
        }
      }

      // 5. Suggested Length: Required, positive integers, max >= min
      const minLength = drill.suggested_length.min;
      const maxLength = drill.suggested_length.max;
      if (!Number.isInteger(minLength) || minLength <= 0) {
        drill.errors.push('Suggested length min must be a positive integer');
      }
      if (!Number.isInteger(maxLength) || maxLength <= 0) {
        drill.errors.push('Suggested length max must be a positive integer');
      }
      if (maxLength < minLength) {
        drill.errors.push('Suggested length max must be greater than or equal to min');
      }

      // 6. Number of People: Optional, positive integers, max >= min
      const minPeople = drill.number_of_people.min;
      const maxPeople = drill.number_of_people.max;
      if (minPeople != null || maxPeople != null) {
        if (!Number.isInteger(minPeople) || minPeople <= 0) {
          drill.errors.push('Number of people min must be a positive integer');
        }
        if (!Number.isInteger(maxPeople) || maxPeople <= 0) {
          drill.errors.push('Number of people max must be a positive integer');
        }
        if (maxPeople < minPeople) {
          drill.errors.push('Number of people max must be greater than or equal to min');
        }
      }

      // 7. Skills Focused On: Required, must be an array
      if (!Array.isArray(drill.skills_focused_on) || drill.skills_focused_on.length === 0) {
        drill.errors.push('Skills focused on is required and must be an array');
      }

      // 8. Positions Focused On: Required, valid positions
      const validPositions = ['Beater', 'Chaser', 'Keeper', 'Seeker'];
      if (
        !Array.isArray(drill.positions_focused_on) ||
        drill.positions_focused_on.length === 0
      ) {
        drill.errors.push('Positions focused on is required and must be an array');
      } else {
        const invalidPositions = drill.positions_focused_on.filter(
          (pos) => !validPositions.includes(pos)
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
      // Ensure that diagrams array exists and add a new empty diagram
      parsedDrills.update((drills) => {
        if (!drills[drillIndex].diagrams) {
          drills[drillIndex].diagrams = [];
        }
        drills[drillIndex].diagrams.push({}); // Add new empty diagram
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
        return drills;
      });
    }
  
    $: validDrillsCount = $parsedDrills.filter(drill => drill.errors.length === 0).length;
  </script>
  
  <svelte:head>
    <title>Bulk Drill Upload</title>
  </svelte:head>
  
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Bulk Drill Upload</h1>
  
    <div class="mb-4">
      <button on:click={downloadTemplate} class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Download CSV Template
      </button>
    </div>
  
    <div class="mb-4">
      <input
        type="file"
        accept=".csv"
        on:change={handleFileChange}
        bind:this={fileInput}
        class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
    </div>
  
    <button
      on:click={uploadCSV}
      disabled={$isUploading || !$uploadedFile}
      class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
    >
      {$isUploading ? 'Uploading...' : 'Upload'}
    </button>
  
    {#if $uploadSummary}
      <div class="mt-4">
        <h2 class="text-xl font-semibold mb-2">Upload Summary</h2>
        <p>Total drills: {$uploadSummary.total}</p>
        <p>Drills without errors: {$uploadSummary.valid}</p>
        <p>Drills with errors: {$uploadSummary.errors}</p>
      </div>
    {/if}
  
    <div class="mb-4">
      <label class="mr-2">Filter:</label>
      <select bind:value={$filterOption}>
        <option value="all">All Drills</option>
        <option value="errors">Drills with Errors</option>
        <option value="valid">Valid Drills</option>
      </select>
    </div>
  
    {#if $parsedDrills.length > 0}
      <div class="mt-4">
        <h2 class="text-xl font-semibold mb-2">Parsed Drills</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each filteredDrills as drill, index}
            <div class="border p-4 rounded {drill.errors.length > 0 ? 'bg-yellow-100' : 'bg-white'}">
              {#if drill.isEditing}
                <!-- Editable Fields -->
                <input
                  type="text"
                  bind:value={drill.name}
                  placeholder="Name"
                  class="{drill.errors.includes('Name is required') ? 'border-red-500' : ''}"
                  on:input={() => validateDrill(drill)}
                />
                {#if drill.errors.includes('Name is required')}
                  <p class="text-red-500 text-sm">Name is required</p>
                {/if}
                <input
                  type="text"
                  bind:value={drill.brief_description}
                  placeholder="Brief Description"
                  class="{drill.errors.includes('Brief description is required') ? 'border-red-500' : ''}"
                  on:input={() => validateDrill(drill)}
                />
                {#if drill.errors.includes('Brief description is required')}
                  <p class="text-red-500 text-sm">Brief description is required</p>
                {/if}
                <input
                  type="text"
                  bind:value={drill.skill_level}
                  placeholder="Skill Level"
                  class="{drill.errors.includes('Skill level is required and must be an array') ? 'border-red-500' : ''}"
                  on:input={() => validateDrill(drill)}
                />
                {#if drill.errors.includes('Skill level is required and must be an array')}
                  <p class="text-red-500 text-sm">Skill level is required and must be an array</p>
                {/if}
                <input
                  type="text"
                  bind:value={drill.complexity}
                  placeholder="Complexity"
                  class="{drill.errors.includes('Complexity must be 1 (Low), 2 (Medium), or 3 (High)') ? 'border-red-500' : ''}"
                  on:input={() => validateDrill(drill)}
                />
                {#if drill.errors.includes('Complexity must be 1 (Low), 2 (Medium), or 3 (High)')}
                  <p class="text-red-500 text-sm">Complexity must be 1 (Low), 2 (Medium), or 3 (High)</p>
                {/if}
                <input
                  type="text"
                  bind:value={drill.suggested_length.min}
                  placeholder="Suggested Length Min"
                  class="{drill.errors.includes('Suggested length min must be a positive integer') ? 'border-red-500' : ''}"
                  on:input={() => validateDrill(drill)}
                />
                {#if drill.errors.includes('Suggested length min must be a positive integer')}
                  <p class="text-red-500 text-sm">Suggested length min must be a positive integer</p>
                {/if}
                <input
                  type="text"
                  bind:value={drill.suggested_length.max}
                  placeholder="Suggested Length Max"
                  class="{drill.errors.includes('Suggested length max must be a positive integer') ? 'border-red-500' : ''}"
                  on:input={() => validateDrill(drill)}
                />
                {#if drill.errors.includes('Suggested length max must be a positive integer')}
                  <p class="text-red-500 text-sm">Suggested length max must be a positive integer</p>
                {/if}
                <input
                  type="text"
                  bind:value={drill.number_of_people.min}
                  placeholder="Number of People Min"
                  class="{drill.errors.includes('Number of people min must be a positive integer') ? 'border-red-500' : ''}"
                  on:input={() => validateDrill(drill)}
                />
                {#if drill.errors.includes('Number of people min must be a positive integer')}
                  <p class="text-red-500 text-sm">Number of people min must be a positive integer</p>
                {/if}
                <input
                  type="text"
                  bind:value={drill.number_of_people.max}
                  placeholder="Number of People Max"
                  class="{drill.errors.includes('Number of people max must be a positive integer') ? 'border-red-500' : ''}"
                  on:input={() => validateDrill(drill)}
                />
                {#if drill.errors.includes('Number of people max must be a positive integer')}
                  <p class="text-red-500 text-sm">Number of people max must be a positive integer</p>
                {/if}
                <input
                  type="text"
                  bind:value={drill.skills_focused_on}
                  placeholder="Skills Focused On"
                  class="{drill.errors.includes('Skills focused on is required and must be an array') ? 'border-red-500' : ''}"
                  on:input={() => validateDrill(drill)}
                />
                {#if drill.errors.includes('Skills focused on is required and must be an array')}
                  <p class="text-red-500 text-sm">Skills focused on is required and must be an array</p>
                {/if}
                <input
                  type="text"
                  bind:value={drill.positions_focused_on}
                  placeholder="Positions Focused On"
                  class="{drill.errors.includes('Positions focused on is required and must be an array') ? 'border-red-500' : ''}"
                  on:input={() => validateDrill(drill)}
                />
                {#if drill.errors.includes('Positions focused on is required and must be an array')}
                  <p class="text-red-500 text-sm">Positions focused on is required and must be an array</p>
                {/if}
                <input
                  type="text"
                  bind:value={drill.video_link}
                  placeholder="Video Link"
                  class="{drill.errors.includes('Video link must be a valid URL') ? 'border-red-500' : ''}"
                  on:input={() => validateDrill(drill)}
                />
                {#if drill.errors.includes('Video link must be a valid URL')}
                  <p class="text-red-500 text-sm">Video link must be a valid URL</p>
                {/if}

                <!-- Diagrams Section -->
                <div>
                  <h4>Diagrams:</h4>
                  {#each drill.diagrams as diagram, diagIndex}
                    <div class="diagram-container">
                      <DiagramDrawer
                        bind:data={drill.diagrams[diagIndex]}
                        showSaveButton
                        on:save={(event) => saveDiagram(index, diagIndex, event)}
                      />
                      <button on:click={() => deleteDiagram(index, diagIndex)}>Delete Diagram</button>
                    </div>
                  {/each}
                  <button on:click={() => addDiagram(index)}>Add New Diagram</button>
                </div>

                <button class="mt-2 text-green-500" on:click={() => saveDrill(index)}>Save</button>
                <button class="mt-2 ml-2 text-gray-500" on:click={() => cancelEdit(index)}>Cancel</button>
              {:else}
                <!-- Display Fields -->
                <h3 class="font-semibold">{drill.name}</h3>
                <p class="text-sm">{drill.brief_description}</p>
                {#if drill.errors.length > 0}
                  <div class="text-red-500 mt-2">
                    {#each drill.errors as error}
                      <p>{error}</p>
                    {/each}
                  </div>
                {/if}

                <!-- Diagrams Section -->
                {#if drill.diagrams && drill.diagrams.length > 0}
                  <div>
                    <h4>Diagrams:</h4>
                    {#each drill.diagrams as diagram, diagIndex}
                      <div class="diagram-thumbnail" on:click={() => editDiagram(index, diagIndex)}>
                        <!-- Thumbnail or placeholder for the diagram -->
                        <DiagramDrawer data={diagram} showSaveButton={false} />
                      </div>
                    {/each}
                  </div>
                {/if}

                <button class="mt-2 text-blue-500" on:click={() => editDrill(index)}>Edit</button>
                <button class="mt-2 ml-2 text-red-500" on:click={() => removeDrill(index)}>Remove</button>
                <button class="mt-2 text-purple-500" on:click={() => addDiagram(index)}>
                  Add Diagram
                </button>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  
    <div class="mt-4">
      <button on:click={saveChanges} class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2">
        Save Changes
      </button>
      <button on:click={importDrills} class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
        Import Valid Drills ({validDrillsCount})
      </button>
    </div>
  </div>

  <style>
    .border-red-500 {
      border-color: red;
      border-width: 2px;
    }

    .diagram-container {
      margin-bottom: 1em;
    }

    .diagram-thumbnail {
      cursor: pointer;
      display: inline-block;
      margin-right: 1em;
    }

    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .modal > * {
      background-color: white;
      padding: 1em;
      border-radius: 8px;
      max-width: 90%;
      max-height: 90%;
      overflow: auto;
    }
  </style>