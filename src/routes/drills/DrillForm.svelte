<script>
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { goto } from '$app/navigation';
  import DiagramDrawer from '../../components/DiagramDrawer.svelte';

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
  let number_of_people_min = writable(drill.number_of_people_min ?? drill.number_of_people?.min ?? '');
  let number_of_people_max = writable(drill.number_of_people_max ?? drill.number_of_people?.max ?? '');
  let skills_focused_on = writable(drill.skills_focused_on ?? []);
  let selectedSkills = writable(drill.skills_focused_on ?? []);
  let newSkill = writable('');
  let skillSuggestions = writable([]);
  let positions_focused_on = writable(drill.positions_focused_on ?? []);
  let video_link = writable(drill.video_link ?? '');
  let images = writable(drill.images ?? []);

  let errors = writable({});
  let numberWarnings = {
    number_of_people_min: '',
    number_of_people_max: ''
  };

  let mounted = false;

  let diagrams = writable(drill.diagrams?.length > 0 ? drill.diagrams : [null]);
  let diagramKey = 0;

  function addDiagram() {
    diagrams.update(d => [...d, null]);
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

  onMount(async () => {
    const response = await fetch('/api/skills');
    const data = await response.json();
    skills_focused_on.set(data);
    mounted = true;
  });

  function handleSkillInput() {
    const input = $newSkill.toLowerCase();
    if (input.length > 0) {
      skillSuggestions.set($skills_focused_on.filter(skill => 
        skill.toLowerCase().includes(input) && !$selectedSkills.includes(skill)
      ));
    } else {
      skillSuggestions.set([]);
    }
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
      if (!$skills_focused_on.includes($newSkill)) {
        addNewSkill($newSkill);
      }
      newSkill.set('');
      skillSuggestions.set([]);
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
    skillSuggestions.set([]);
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
      skills_focused_on.update(skills => [...skills, skill]);
      selectSkill(skill);
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
      images: $images,
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
</script>

<svelte:head>
  <title>{drill.id ? 'Edit Drill' : 'Create Drill'}</title>
  <meta name="description" content={drill.id ? 'Edit an existing drill' : 'Create a new drill'} />
</svelte:head>

<section class="container mx-auto p-4">
  <h1 class="text-2xl font-bold text-center mb-4">{drill.id ? 'Edit Drill' : 'Create Drill'}</h1>

  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
    <div>
      <label for="name" class="block text-sm font-medium text-gray-700">Name:</label>
      <input id="name" bind:value={$name} class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md" />
      {#if $errors.name}
        <p class="error">{$errors.name}</p>
      {/if}
    </div>

    <div>
      <label for="brief_description" class="block text-sm font-medium text-gray-700">Brief Description:</label>
      <input id="brief_description" bind:value={$brief_description} class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md" />
      {#if $errors.brief_description}
        <p class="error">{$errors.brief_description}</p>
      {/if}
    </div>

    <div>
      <label for="detailed_description" class="block text-sm font-medium text-gray-700">Detailed Description:</label>
      <textarea id="detailed_description" bind:value={$detailed_description} class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"></textarea>
    </div>

    <div>
      <label for="skill_level" class="block text-sm font-medium text-gray-700">Appropriate for Skill Level:</label>
      <div class="flex flex-wrap gap-2 mt-1">
        <button type="button" class="px-3 py-1 rounded-full border border-gray-300 skill-level-button" on:click={() => toggleSelection(skill_level, 'new to sport')}>New to Sport</button>
        <button type="button" class="px-3 py-1 rounded-full border border-gray-300 skill-level-button" on:click={() => toggleSelection(skill_level, 'beginner')}>Beginner</button>
        <button type="button" class="px-3 py-1 rounded-full border border-gray-300 skill-level-button" on:click={() => toggleSelection(skill_level, 'intermediate')}>Intermediate</button>
        <button type="button" class="px-3 py-1 rounded-full border border-gray-300 skill-level-button" on:click={() => toggleSelection(skill_level, 'advanced')}>Advanced</button>
        <button type="button" class="px-3 py-1 rounded-full border border-gray-300 skill-level-button" on:click={() => toggleSelection(skill_level, 'elite')}>Elite</button>
      </div>
      {#if $errors.skill_level}
        <p class="error">{$errors.skill_level}</p>
      {/if}
    </div>

    <div>
      <label for="complexity" class="block text-sm font-medium text-gray-700">Complexity:</label>
      <select id="complexity" bind:value={$complexity} class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
        <option value="">Select Complexity</option>
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>
    </div>

    <div>
      <label for="suggested_length" class="block text-sm font-medium text-gray-700">Suggested Length of Time:</label>
      <select id="suggested_length" bind:value={$suggested_length} class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
        <option value="">Select Length of Time</option>
        <option value="0-5 minutes">0-5 minutes</option>
        <option value="5-15 minutes">5-15 minutes</option>
        <option value="15-30 minutes">15-30 minutes</option>
        <option value="30-60 minutes">30-60 minutes</option>
      </select>
      {#if $errors.suggested_length}
        <p class="error">{$errors.suggested_length}</p>
      {/if}
    </div>

    <div>
      <label for="number_of_people_min" class="block text-sm font-medium text-gray-700">Min Number of People:</label>
      <input 
        id="number_of_people_min" 
        bind:value={$number_of_people_min} 
        on:input={() => validateNumber($number_of_people_min, 'number_of_people_min')}
        class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md" 
      />
      {#if numberWarnings.number_of_people_min}
        <p class="warning">{numberWarnings.number_of_people_min}</p>
      {/if}
      {#if $errors.number_of_people_min}
        <p class="error">{$errors.number_of_people_min}</p>
      {/if}
    </div>

    <div>
      <label for="number_of_people_max" class="block text-sm font-medium text-gray-700">Max Number of People:</label>
      <input 
        id="number_of_people_max" 
        bind:value={$number_of_people_max} 
        on:input={() => validateNumber($number_of_people_max, 'number_of_people_max')}
        class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md" 
      />
      {#if numberWarnings.number_of_people_max}
        <p class="warning">{numberWarnings.number_of_people_max}</p>
      {/if}
      {#if $errors.number_of_people_max}
        <p class="error">{$errors.number_of_people_max}</p>
      {/if}
    </div>

    <div>
      <label for="skills_focused_on" class="block text-sm font-medium text-gray-700">Skills Focused On:</label>
      <div class="flex flex-wrap gap-2 mt-1">
        {#each $selectedSkills as skill}
          <button
            type="button"
            class="px-3 py-1 rounded-full border border-gray-300 skill-level-button selected"
            on:click={() => removeSkill(skill)}
          >
            {skill} ×
          </button>
        {/each}
      </div>
      <div class="flex mt-2">
        <input
          type="text"
          id="skill_input"
          bind:value={$newSkill}
          on:input={handleSkillInput}
          on:keydown={handleSkillKeydown}
          placeholder="Type a skill and press Enter"
          class="flex-grow pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-l-md"
        />
        <button
          type="button"
          on:click={addSkill}
          class="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add Skill
        </button>
      </div>
      {#if $skillSuggestions.length > 0}
        <ul class="mt-1 bg-white border border-gray-300 rounded-md shadow-sm">
          {#each $skillSuggestions as suggestion}
            <li>
              <button
                class="w-full text-left px-3 py-2 hover:bg-gray-100 cursor-pointer"
                on:click={() => selectSkill(suggestion)}
              >
                {suggestion}
              </button>
            </li>
          {/each}
        </ul>
      {/if}
      {#if $errors.skills_focused_on}
        <p class="error">{$errors.skills_focused_on}</p>
      {/if}
    </div>

    <div>
      <label for="positions_focused_on" class="block text-sm font-medium text-gray-700">Positions Focused On:</label>
      <div class="flex flex-wrap gap-2 mt-1">
        <button type="button" class="px-3 py-1 rounded-full border border-gray-300 position-button" on:click={() => toggleSelection(positions_focused_on, 'Beater')}>Beater</button>
        <button type="button" class="px-3 py-1 rounded-full border border-gray-300 position-button" on:click={() => toggleSelection(positions_focused_on, 'Chaser')}>Chaser</button>
        <button type="button" class="px-3 py-1 rounded-full border border-gray-300 position-button" on:click={() => toggleSelection(positions_focused_on, 'Keeper')}>Keeper</button>
        <button type="button" class="px-3 py-1 rounded-full border border-gray-300 position-button" on:click={() => toggleSelection(positions_focused_on, 'Seeker')}>Seeker</button>
      </div>
      {#if $errors.positions_focused_on}
        <p class="error">{$errors.positions_focused_on}</p>
      {/if}
    </div>

    <div>
      <label for="video_link" class="block text-sm font-medium text-gray-700">Video Link:</label>
      <input id="video_link" bind:value={$video_link} class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md" />
    </div>

    <div>
      <label for="images" class="block text-sm font-medium text-gray-700">Images:</label>
      <input id="images" type="file" multiple on:change={e => images.set(Array.from(e.target.files))} class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md" />
    </div>

    <div>
      <h3 class="block text-sm font-medium text-gray-700">Diagrams:</h3>
      {#each $diagrams as diagram, index (index + '-' + diagramKey)}
        <div class="mt-2 border p-4 rounded">
          <label for={`diagram-canvas-${index}`} class="text-lg font-semibold mb-2">Diagram {index + 1}</label>
          <DiagramDrawer 
            on:save={(event) => handleDiagramSave(event, index)} 
            id={`diagram-canvas-${index}`} 
            data={diagram} 
            {index}
            showSaveButton={true} 
          />
          <div class="mt-2 flex justify-between">
            <button type="button" on:click={() => deleteDiagram(index)} class="text-red-600 hover:text-red-800">Delete</button>
            <div>
              <button type="button" on:click={() => moveDiagram(index, -1)} disabled={index === 0} class="text-blue-600 hover:text-blue-800 mr-2">Move Up</button>
              <button type="button" on:click={() => moveDiagram(index, 1)} disabled={index === $diagrams.length - 1} class="text-blue-600 hover:text-blue-800">Move Down</button>
            </div>
          </div>
        </div>
      {/each}
      <button type="button" on:click={addDiagram} class="mt-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
        Add New Diagram
      </button>
    </div>
    
    <button type="submit" class="mt-4 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
      {drill.id ? 'Update Drill' : 'Create Drill'}
    </button>
  </form>
</section>

<style>
  .error {
    color: red;
    font-size: 0.8rem;
  }
  .warning {
    color: orange;
    font-size: 0.8rem;
  }
</style>
