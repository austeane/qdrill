<script>
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { goto } from '$app/navigation';
  import DiagramDrawer from '../../components/DiagramDrawer.svelte';
  import { dndzone } from 'svelte-dnd-action';
  import { PREDEFINED_SKILLS } from '$lib/constants/skills';

  // Initialize stores
  export let drill = {
    id: null,
    name: '',
    brief_description: '',
    detailed_description: '',
    skill_level: [],
    complexity: '',
    suggested_length: '',
    number_of_people: { min: '', max: '' },
    skills_focused_on: [],
    positions_focused_on: [],
    video_link: '',
    images: [],
    diagrams: []
  };

  let name = writable(drill.name ?? '');
  let brief_description = writable(drill.brief_description ?? '');
  let detailed_description = writable(drill.detailed_description ?? '');
  let skill_level = writable(drill.skill_level ?? []);
  let complexity = writable(drill.complexity ?? '');
  let suggested_length = writable(drill.suggested_length ?? '');
  let number_of_people_min = writable(drill.number_of_people?.min ?? '');
  let number_of_people_max = writable(drill.number_of_people?.max ?? '');
  let skills_focused_on = writable(drill.skills_focused_on ?? []);
  let selectedSkills = writable(drill.skills_focused_on ?? []);
  let newSkill = writable('');
  let skillSuggestions = writable([]);
  let allSkills = writable([]);
  let skillSearchTerm = writable('');  // Add this line
  let positions_focused_on = writable(drill.positions_focused_on ?? []);
  let video_link = writable(drill.video_link ?? '');
  let images = writable(drill.images?.map((image, index) => ({
    id: `image-${index}`,
    file: image
  })) ?? []);
  let diagrams = writable(drill.diagrams?.length > 0 ? drill.diagrams : [null]);

  let errors = writable({});
  let numberWarnings = writable({});
  let mounted = false;
  let diagramKey = 0;
  let fileInput;
  let showSkillsModal = false;
  let modalSkillSearchTerm = writable('');
  let modalSkillSuggestions = writable([]);

  $: filteredSkills = $allSkills.filter(skill => 
    skill.toLowerCase().includes($skillSearchTerm.toLowerCase()) && 
    !$selectedSkills.includes(skill)
  );

  let diagramRefs = [];

  function addDiagram() {
    // Save the current diagram if it exists
    if (diagramRefs.length > 0) {
      const lastDiagramRef = diagramRefs[diagramRefs.length - 1];
      if (lastDiagramRef) {
        lastDiagramRef.saveDiagram();
      }
    }

    diagrams.update(d => [...d, {}]);
    diagramKey++;
  }

  function deleteDiagram(index) {
    if (confirm('Are you sure you want to delete this diagram?')) {
      diagrams.update(d => d.filter((_, i) => i !== index));
      diagramKey++;
    }
  }

  function moveDiagram(index, direction) {
    console.log(`Moving diagram at index ${index} ${direction > 0 ? 'down' : 'up'}`);
    diagrams.update(d => {
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= d.length) return d;
      const newDiagrams = [...d];
      [newDiagrams[index], newDiagrams[newIndex]] = [newDiagrams[newIndex], newDiagrams[index]];
      console.log('Updated diagrams:', newDiagrams);
      return newDiagrams;
    });
    diagramKey++;
  }

  function handleDiagramSave(event, index) {
    const updatedDiagram = event.detail;
    diagrams.update(d => {
      const newDiagrams = [...d];
      newDiagrams[index] = updatedDiagram;
      return newDiagrams;
    });
  }

  function handleMoveUp(index) {
    moveDiagram(index, -1);
  }

  function handleMoveDown(index) {
    moveDiagram(index, 1);
  }

  onMount(async () => {
    const response = await fetch('/api/skills');
    const data = await response.json();
    allSkills.set([...PREDEFINED_SKILLS, ...data.filter(skill => !PREDEFINED_SKILLS.includes(skill))]);
    mounted = true;
  });

  function handleSkillInput() {
    const input = $newSkill.toLowerCase();
    if (input.length > 0) {
      skillSuggestions.set($allSkills.filter(skill => 
        skill.toLowerCase().includes(input) && !$selectedSkills.includes(skill)
      ));
    } else {
      skillSuggestions.set([]);
    }
    skillSearchTerm.set(input);  // Update skillSearchTerm
  }

  function handleSkillKeydown(event) {
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      addSkill();
    }
  }

  function addSkill() {
    if ($newSkill && !$selectedSkills.includes($newSkill)) {
      selectedSkills.update(skills => [...skills, $newSkill]);
      if (!$allSkills.includes($newSkill)) {
        addNewSkill($newSkill);
      }
      newSkill.set('');
      skillSuggestions.set([]); // Ensure to use set here
    }
  }

  function removeSkill(skill) {
    selectedSkills.update(skills => skills.filter(s => s !== skill));
  }

  function selectSkill(skill) {
    if (!$selectedSkills.includes(skill)) {
      selectedSkills.update(skills => [...skills, skill]);
    }
    newSkill.set('');
    skillSuggestions.set([]); // Corrected: Clear suggestions after selection
  }

  function handleModalSkillInput() {
    const input = $modalSkillSearchTerm.toLowerCase();
    if (input.length > 0) {
      modalSkillSuggestions.set($allSkills.filter(skill => 
        skill.toLowerCase().includes(input) && !$selectedSkills.includes(skill)
      ));
    } else {
      modalSkillSuggestions.set($allSkills.filter(skill => !$selectedSkills.includes(skill)));
    }
  }

  $: handleModalSkillInput();

  function openSkillsModal() {
    showSkillsModal = true;
    modalSkillSearchTerm.set('');
    modalSkillSuggestions.set($allSkills.filter(skill => !$selectedSkills.includes(skill)));
  }

  function closeSkillsModal() {
    showSkillsModal = false;
    modalSkillSearchTerm.set('');
    modalSkillSuggestions.set([]);
  }

  function selectSkillFromModal(skill) {
    if (!$selectedSkills.includes(skill)) {
      selectedSkills.update(skills => [...skills, skill]);
    }
  }

  async function addNewSkill(skill) {
    const response = await fetch('/api/skills', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ skill })
    });
    if (response.ok) {
      allSkills.update(skills => [...skills, skill]);
      // No need to call selectSkill here again
    }
  }

  function validateNumber(value, field) {
    if (value === '') {
      numberWarnings[field] = '';
      return;
    }
    if (!Number.isInteger(Number(value))) {
      numberWarnings[field] = 'Please enter a whole number';
    } else {
      numberWarnings[field] = '';
    }
  }

  function validateForm() {
    let newErrors = {};
    if (!$name) newErrors.name = 'Name is required';
    if (!$brief_description) newErrors.brief_description = 'Brief description is required';
    if ($skill_level.length === 0) newErrors.skill_level = 'Skill level is required';
    if (!$suggested_length) newErrors.suggested_length = 'Suggested length of time is required';
    if ($selectedSkills.length === 0) newErrors.skills_focused_on = 'Skills focused on are required';
    if ($positions_focused_on.length === 0) newErrors.positions_focused_on = 'Positions focused on are required';
    
    // Add validation for number fields
    if ($number_of_people_min && !Number.isInteger(Number($number_of_people_min))) {
      newErrors.number_of_people_min = 'Min number of people must be a whole number';
    }
    if ($number_of_people_max && !Number.isInteger(Number($number_of_people_max))) {
      newErrors.number_of_people_max = 'Max number of people must be a whole number';
    }
    
    errors.set(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    // Automatically save all diagrams before submitting
    diagramRefs.forEach(ref => {
      if (ref && typeof ref.saveDiagram === 'function') {
        ref.saveDiagram();
      }
    });

    if (!validateForm()) return;
    console.log('Diagram data before sending:', $diagrams);

    const method = drill.id ? 'PUT' : 'POST';
    const url = drill.id ? `/api/drills/${drill.id}` : '/api/drills';

    console.log(`${method} request to ${url}`);

    const drillData = {
      ...drill,
      name: $name,
      brief_description: $brief_description,
      detailed_description: $detailed_description,
      skill_level: $skill_level,
      complexity: $complexity,
      suggested_length: $suggested_length,
      number_of_people: {
        min: $number_of_people_min,
        max: $number_of_people_max
      },
      skills_focused_on: $selectedSkills,
      positions_focused_on: $positions_focused_on,
      video_link: $video_link,
      images: $images.map(img => img.file),
      diagrams: $diagrams
    };

    console.log('Drill data being sent:', JSON.stringify(drillData));

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(drillData)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Response status:', response.status);
      console.log('Response body:', data);
      goto(`/drills/${data.id}`);
    } else {
      console.log('Response status:', response.status);
      const errorText = await response.text();
      console.log('Response body:', errorText);
    }
  }

  function toggleSelection(store, value) {
    store.update(selected => {
      if (selected.includes(value)) {
        return selected.filter(item => item !== value);
      } else {
        return [...selected, value];
      }
    });
  }

  function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    images.update(currentImages => [
      ...currentImages,
      ...files.map((file, index) => ({
        id: `new-image-${Date.now()}-${index}`,
        file: file
      }))
    ]);
  }

  function removeImage(id) {
    images.update(imgs => imgs.filter(img => img.id !== id));
  }

  function handleDndConsider(e) {
    images.set(e.detail.items);
  }

  function handleDndFinalize(e) {
    images.set(e.detail.items);
  }

  function triggerFileInput() {
    fileInput.click();
  }

  $: if (mounted) {
    if (typeof window !== 'undefined') {
      const skillLevelButtons = document.querySelectorAll('.skill-level-button');
      skillLevelButtons.forEach(button => {
        if ($skill_level.includes(button.textContent.toLowerCase())) {
          button.classList.add('selected');
        } else {
          button.classList.remove('selected');
        }
      });

      const positionButtons = document.querySelectorAll('.position-button');
      positionButtons.forEach(button => {
        if ($positions_focused_on.includes(button.textContent)) {
          button.classList.add('selected');
        } else {
          button.classList.remove('selected');
        }
      });
    }
  }

  function adjustTextareaHeight(event) {
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px`;
  }
</script>

<svelte:head>
  <title>{drill.id ? 'Edit Drill' : 'Create Drill'}</title>
  <meta name="description" content={drill.id ? 'Edit an existing drill' : 'Create a new drill'} />
</svelte:head>

<section class="container mx-auto p-4 h-screen overflow-y-auto">
  <div class="flex flex-col md:flex-row h-full gap-4 transition-all duration-300 ease-in-out">
    <!-- Left Column: Form -->
    <div class="flex-1 min-w-0 p-4 border rounded-md transition-all duration-300 ease-in-out md:overflow-y-auto">
      <div class="max-w-lg mx-auto">
        <h1 class="text-2xl font-bold text-center mb-6">{drill.id ? 'Edit Drill' : 'Create Drill'}</h1>
        <form on:submit|preventDefault={handleSubmit} class="space-y-6">
          <div class="flex flex-col">
            <label for="name" class="mb-1 text-sm font-medium text-gray-700">Drill Name:</label>
            <input id="name" bind:value={$name} class="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {#if $errors.name}
            <p class="text-red-500 text-sm mt-1">{$errors.name}</p>
          {/if}

          <div class="flex flex-col">
            <label for="brief_description" class="mb-1 text-sm font-medium text-gray-700">Brief Description:</label>
            <p class="text-xs text-gray-500 mb-1">For display on the drill listings page</p>
            <input id="brief_description" bind:value={$brief_description} class="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {#if $errors.brief_description}
            <p class="text-red-500 text-sm mt-1">{$errors.brief_description}</p>
          {/if}

          <div class="flex flex-col">
            <label for="detailed_description" class="mb-1 text-sm font-medium text-gray-700">Detailed Description:</label>
            <p class="text-xs text-gray-500 mb-1">As much detail as would be needed for a new coach to teach this drill, including setup and any focus areas.</p>
            <textarea 
              id="detailed_description" 
              bind:value={$detailed_description} 
              on:input={adjustTextareaHeight}
              class="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            ></textarea>
          </div>

          <div class="flex flex-col">
            <label for="skill_level" class="mb-1 text-sm font-medium text-gray-700">Appropriate for Skill Level:</label>
            <div class="flex flex-wrap gap-2">
              <button type="button" class="px-3 py-1 rounded-full border border-gray-300 skill-level-button" on:click={() => toggleSelection(skill_level, 'new to sport')}>New to Sport</button>
              <button type="button" class="px-3 py-1 rounded-full border border-gray-300 skill-level-button" on:click={() => toggleSelection(skill_level, 'beginner')}>Beginner</button>
              <button type="button" class="px-3 py-1 rounded-full border border-gray-300 skill-level-button" on:click={() => toggleSelection(skill_level, 'intermediate')}>Intermediate</button>
              <button type="button" class="px-3 py-1 rounded-full border border-gray-300 skill-level-button" on:click={() => toggleSelection(skill_level, 'advanced')}>Advanced</button>
              <button type="button" class="px-3 py-1 rounded-full border border-gray-300 skill-level-button" on:click={() => toggleSelection(skill_level, 'elite')}>Elite</button>
            </div>
          </div>
          {#if $errors.skill_level}
            <p class="text-red-500 text-sm mt-1">{$errors.skill_level}</p>
          {/if}

          <div class="flex flex-col">
            <label for="complexity" class="mb-1 text-sm font-medium text-gray-700">Complexity:</label>
            <select id="complexity" bind:value={$complexity} class="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select Complexity</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div class="flex flex-col">
            <label for="suggested_length" class="mb-1 text-sm font-medium text-gray-700">Suggested Length of Time:</label>
            <select id="suggested_length" bind:value={$suggested_length} class="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select Length of Time</option>
              <option value="0-5 minutes">0-5 minutes</option>
              <option value="5-15 minutes">5-15 minutes</option>
              <option value="15-30 minutes">15-30 minutes</option>
              <option value="30-60 minutes">30-60 minutes</option>
            </select>
          </div>
          {#if $errors.suggested_length}
            <p class="text-red-500 text-sm mt-1">{$errors.suggested_length}</p>
          {/if}

          <div class="flex flex-col">
            <label for="number_of_people_min" class="mb-1 text-sm font-medium text-gray-700">Min Number of People:</label>
            <input 
              id="number_of_people_min" 
              bind:value={$number_of_people_min} 
              on:input={() => validateNumber($number_of_people_min, 'number_of_people_min')}
              class="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          {#if numberWarnings.number_of_people_min}
            <p class="text-yellow-500 text-sm mt-1">{numberWarnings.number_of_people_min}</p>
          {/if}
          {#if $errors.number_of_people_min}
            <p class="text-red-500 text-sm mt-1">{$errors.number_of_people_min}</p>
          {/if}

          <div class="flex flex-col">
            <label for="number_of_people_max" class="mb-1 text-sm font-medium text-gray-700">Max Number of People:</label>
            <input 
              id="number_of_people_max" 
              bind:value={$number_of_people_max} 
              on:input={() => validateNumber($number_of_people_max, 'number_of_people_max')}
              class="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          {#if numberWarnings.number_of_people_max}
            <p class="text-yellow-500 text-sm mt-1">{numberWarnings.number_of_people_max}</p>
          {/if}
          {#if $errors.number_of_people_max}
            <p class="text-red-500 text-sm mt-1">{$errors.number_of_people_max}</p>
          {/if}

          <div class="flex flex-col">
            <label for="skills" class="mb-1 text-sm font-medium text-gray-700">Skills:</label>
            <div class="flex flex-wrap gap-2 mb-2">
              {#each $selectedSkills as skill}
                <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                  {skill}
                  <button on:click={() => removeSkill(skill)} class="ml-1 text-blue-600 hover:text-blue-800">×</button>
                </span>
              {/each}
            </div>
            <input
              id="skills"
              bind:value={$newSkill}
              on:input={handleSkillInput}
              placeholder="Add a skill"
              class="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              on:click={openSkillsModal}
              class="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Browse Skills
            </button>
            {#if $skillSuggestions.length > 0}
              <ul class="mt-1 bg-white border border-gray-300 rounded-md shadow-sm">
                {#each $skillSuggestions as suggestion}
                  <li>
                    <button
                      type="button"
                      on:click={() => selectSkill(suggestion)}
                      class="w-full text-left px-3 py-2 hover:bg-gray-100"
                    >
                      {suggestion}
                    </button>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
          {#if $errors.skills_focused_on}
            <p class="text-red-500 text-sm mt-1">{$errors.skills_focused_on}</p>
          {/if}

          <div class="flex flex-col">
            <label for="positions_focused_on" class="mb-1 text-sm font-medium text-gray-700">Positions Focused On:</label>
            <div class="flex flex-wrap gap-2">
              <button type="button" class="px-3 py-1 rounded-full border border-gray-300 position-button" on:click={() => toggleSelection(positions_focused_on, 'Beater')}>Beater</button>
              <button type="button" class="px-3 py-1 rounded-full border border-gray-300 position-button" on:click={() => toggleSelection(positions_focused_on, 'Chaser')}>Chaser</button>
              <button type="button" class="px-3 py-1 rounded-full border border-gray-300 position-button" on:click={() => toggleSelection(positions_focused_on, 'Keeper')}>Keeper</button>
              <button type="button" class="px-3 py-1 rounded-full border border-gray-300 position-button" on:click={() => toggleSelection(positions_focused_on, 'Seeker')}>Seeker</button>
            </div>
          </div>
          {#if $errors.positions_focused_on}
            <p class="text-red-500 text-sm mt-1">{$errors.positions_focused_on}</p>
          {/if}

          <div class="flex flex-col">
            <label for="video_link" class="mb-1 text-sm font-medium text-gray-700">Video Link:</label>
            <input id="video_link" bind:value={$video_link} class="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <button
            type="submit"
            class="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {drill.id ? 'Update Drill' : 'Create Drill'}
          </button>
        </form>
      </div>
    </div>

    <!-- Right Column: Diagrams and Images -->
    <div class="flex-1 min-w-0 p-4 border rounded-md transition-all duration-300 ease-in-out md:overflow-y-auto">
      <h2 class="text-xl font-semibold mb-4">Diagrams and Images</h2>
      {#each $diagrams as diagram, index (index + '-' + diagramKey)}
        <div class="mt-2 border p-4 rounded">
          <label for={`diagram-canvas-${index}`} class="text-lg font-semibold mb-2">Diagram {index + 1}</label>
          <DiagramDrawer 
            bind:this={diagramRefs[index]}
            on:save={(event) => handleDiagramSave(event, index)} 
            on:moveUp={() => handleMoveUp(index)}
            on:moveDown={() => handleMoveDown(index)}
            id={`diagram-canvas-${index}`} 
            data={diagram} 
            index={index}
            showSaveButton={true} 
          />
          <div class="mt-2 flex justify-between">
            <button type="button" on:click={() => deleteDiagram(index)} class="text-red-600 hover:text-red-800">Delete</button>
          </div>
        </div>
      {/each}
      <button type="button" on:click={addDiagram} class="mt-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
        Add New Diagram
      </button>

      <!-- Images Section -->
      <div class="mt-6">
        <h3 class="text-lg font-semibold mb-2">Images</h3>
        
        <!-- Drag and drop zone for images -->
        <div use:dndzone={{items: $images}} on:consider={handleDndConsider} on:finalize={handleDndFinalize}
             class="grid grid-cols-2 md:grid-cols-3 gap-4 min-h-[100px] p-4 border-2 border-dashed border-gray-300 rounded-md">
          {#each $images as image (image.id)}
            <div class="relative group bg-white border rounded-md overflow-hidden">
              <img src={URL.createObjectURL(image.file)} alt={`Image ${image.id}`} 
                   class="w-full h-32 object-cover" />
              <div class="absolute top-0 left-0 right-0 flex justify-between items-center p-2 bg-black bg-opacity-50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <span class="text-sm cursor-move">Drag to reorder</span>
                <button
                  type="button"
                  on:click={() => removeImage(image.id)}
                  class="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  ×
                </button>
              </div>
            </div>
          {:else}
            <p class="text-gray-600 col-span-full text-center">No images uploaded. Drag and drop images here or use the button below to add.</p>
          {/each}
        </div>

        <!-- Image upload button and hidden file input -->
        <div class="mt-4 flex items-center">
          <button
            type="button"
            on:click={triggerFileInput}
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Images
          </button>
          <input
            bind:this={fileInput}
            type="file"
            multiple
            accept="image/*"
            on:change={handleFileSelect}
            class="hidden"
          />
          <span class="ml-4 text-sm text-gray-600">or drag and drop images above</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Skills Modal -->
{#if showSkillsModal}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" on:click|self={closeSkillsModal}>
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <div class="mt-3 text-center">
        <h3 class="text-lg leading-6 font-medium text-gray-900">Select Skills</h3>
        <div class="mt-2">
          <input
            type="text"
            bind:value={$modalSkillSearchTerm}
            placeholder="Search skills..."
            class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div class="mt-2 max-h-60 overflow-y-auto">
            {#each $modalSkillSuggestions as skill}
              <button
                class="w-full text-left px-3 py-2 hover:bg-gray-100 cursor-pointer"
                on:click={() => selectSkillFromModal(skill)}
              >
                {skill}
              </button>
            {/each}
            {#if $modalSkillSuggestions.length === 0}
              <p class="text-gray-500">No skills found.</p>
            {/if}
          </div>
        </div>
        <div class="mt-4">
          <button
            on:click={closeSkillsModal}
            class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Optional: Customize scrollbar for better UX */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-thumb {
    background-color: rgba(100, 100, 100, 0.5);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background-color: rgba(100, 100, 100, 0.7);
  }

  /* Optional: Highlight selected buttons */
  .selected {
    background-color: #3b82f6; /* Tailwind's blue-500 */
    color: white;
  }

  /* Optional: Add some styling for drag and drop */
  :global(.dndzone.dropzone) {
    background-color: rgba(59, 130, 246, 0.1); /* Light blue background when dragging over */
  }

  textarea {
    min-height: 60px;
    resize: vertical;
    max-height: 300px;
    transition: height 0.1s ease-out;
  }
</style>