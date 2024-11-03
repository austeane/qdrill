<script>
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { goto } from '$app/navigation';
  import ExcalidrawWrapper from '../../components/ExcalidrawWrapper.svelte';
  import { dndzone } from 'svelte-dnd-action';
  import { PREDEFINED_SKILLS } from '$lib/constants/skills';
  import { allSkills, sortedSkills } from '$lib/stores/drillsStore';
  import { page } from '$app/stores';
  import { signIn } from '@auth/sveltekit/client';
  import { toast } from '@zerodevx/svelte-toast'
  // Initialize stores
  export let drill = {
    id: null,
    name: '',
    brief_description: '',
    detailed_description: '',
    skill_level: [],
    complexity: '',
    suggested_length: '',
    number_of_people_min: '',
    number_of_people_max: '',
    skills_focused_on: [],
    positions_focused_on: [],
    video_link: '',
    images: [],
    diagrams: [],
    drill_type: [],
    is_editable_by_others: false,
    visibility: 'public'
  };

  let name = writable(drill.name ?? '');
  let brief_description = writable(drill.brief_description ?? '');
  let detailed_description = writable(drill.detailed_description ?? '');
  let skill_level = writable(drill.skill_level ?? []);
  let complexity = writable(drill.complexity ?? '');
  let suggested_length = writable(drill.suggested_length ?? '');
  let number_of_people_min = writable(drill.number_of_people_min ?? '');
  let number_of_people_max = writable(drill.number_of_people_max ?? '');
  let skills_focused_on = writable(drill.skills_focused_on ?? []);
  let selectedSkills = writable(drill.skills_focused_on ?? []);
  let newSkill = writable('');
  let skillSuggestions = writable([]);
  let skillSearchTerm = writable('');  // Add this line
  let positions_focused_on = writable(drill.positions_focused_on ?? []);
  let video_link = writable(drill.video_link ?? '');
  let images = writable(drill.images?.map((image, index) => ({
    id: `image-${index}`,
    file: image
  })) ?? []);
  let diagrams = writable(drill.diagrams?.length > 0 ? drill.diagrams : [null]);
  let drill_type = writable(drill.drill_type ?? []);
  let is_editable_by_others = writable(drill.is_editable_by_others ?? false);
  let visibility = writable(drill.visibility ?? 'public');

  let errors = writable({});
  let numberWarnings = writable({});
  let mounted = false;
  let diagramKey = 0;
  let fileInput;
  let showSkillsModal = false;
  let modalSkillSearchTerm = writable('');
  let modalSkillSuggestions = writable([]);

  let isVariation = writable(false);
  let parentDrillId = writable(null);
  let parentDrills = writable([]);

  $: filteredSkills = $allSkills.filter(skill => 
    typeof skill.skill === 'string' && skill.skill.toLowerCase().includes($skillSearchTerm.toLowerCase()) && 
    !$selectedSkills.includes(skill.skill)
  );


  let diagramRefs = [];

  // List of available drill types
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
    console.log('Diagram added. New diagrams:', $diagrams); // Add this line for debugging
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
    const diagramData = event.detail;
    diagrams.update(d => {
      const newDiagrams = [...d];
      newDiagrams[index] = diagramData;
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

    // Fetch skills with usage count
    const skillsResponse = await fetch('/api/skills');
    if (skillsResponse.ok) {
      const skillsData = await skillsResponse.json();
      allSkills.set(skillsData);
    }

    // Fetch potential parent drills
    const drillsResponse = await fetch('/api/drills');
    if (drillsResponse.ok) {
      const drills = await drillsResponse.json();
      parentDrills.set(drills.filter(d => !d.parent_drill_id)); // Only show non-variation drills
    }
  });

  function handleSkillInput() {
    const input = $newSkill.toLowerCase();
    if (input.length > 0) {
      skillSuggestions.set($allSkills.filter(skill => 
        typeof skill.skill === 'string' && skill.skill.toLowerCase().includes(input) && 
        !$selectedSkills.includes(skill.skill)
      ));
    } else {
      skillSuggestions.set([]);
    }
    skillSearchTerm.set(input);
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
      if (!$allSkills.some(skill => skill.skill === $newSkill)) {
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
    if (!$selectedSkills.includes(skill.skill)) {
      selectedSkills.update(skills => [...skills, skill.skill]);
    }
    newSkill.set('');
    skillSuggestions.set([]);
  }

  function handleModalSkillInput() {
    const input = $modalSkillSearchTerm.toLowerCase();
    if (input.length > 0) {
      modalSkillSuggestions.set($allSkills.filter(skill => 
        typeof skill.skill === 'string' && skill.skill.toLowerCase().includes(input) && 
        !$selectedSkills.includes(skill.skill)
      ));
    } else {
      modalSkillSuggestions.set($allSkills.filter(skill => !$selectedSkills.includes(skill.skill)));
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
    if (!$selectedSkills.includes(skill.skill)) {
      selectedSkills.update(skills => [...skills, skill.skill]);
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
    if ($drill_type.length === 0) newErrors.drill_type = 'At least one drill type is required';
    
    // Add validation for number fields
    if ($number_of_people_min && !Number.isInteger(Number($number_of_people_min))) {
      newErrors.number_of_people_min = 'Min number of people must be a whole number';
    }
    if ($number_of_people_max && !Number.isInteger(Number($number_of_people_max))) {
      newErrors.number_of_people_max = 'Max number of people must be a whole number';
    }
    
    if ($isVariation && !$parentDrillId) {
      newErrors.parentDrillId = 'Parent drill is required for variations';
    }
    
    errors.set(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    // Save all diagrams before submitting
    const savedDiagrams = await Promise.all(
      diagramRefs.map(ref => {
        if (ref && typeof ref.saveDiagram === 'function') {
          return ref.saveDiagram();
        }
        return null;
      })
    );

    // Update diagrams store with latest data
    diagrams.set(savedDiagrams.filter(d => d !== null));

    if (!validateForm()) return;

    // If not logged in and trying to create private/unlisted drill
    if (!$page.data.session && $visibility !== 'public') {
      const confirmed = confirm(
        `Log in to create a ${$visibility} drill.\n\n` +
        'Click OK to log in with Google\n' +
        'Click Cancel to create as public instead'
      );
      
      if (confirmed) {
        // Store form data in sessionStorage
        const formData = {
          name: $name,
          brief_description: $brief_description,
          detailed_description: $detailed_description,
          skill_level: $skill_level,
          complexity: $complexity,
          suggested_length: $suggested_length,
          number_of_people_min: $number_of_people_min,
          number_of_people_max: $number_of_people_max,
          skills_focused_on: $selectedSkills,
          positions_focused_on: $positions_focused_on,
          video_link: $video_link,
          diagrams: $diagrams,
          drill_type: $drill_type,
          visibility: $visibility,
          is_editable_by_others: $is_editable_by_others,
          parent_drill_id: $isVariation ? $parentDrillId : null
        };
        sessionStorage.setItem('pendingDrillData', JSON.stringify(formData));
        await signIn('google');
        return;
      } else {
        $visibility = 'public';
      }
    }

    // If not logged in, force is_editable_by_others to true
    if (!$page.data.session) {
      $is_editable_by_others = true;
    }

    try {
      const method = drill.id ? 'PUT' : 'POST';
      const url = drill.id ? `/api/drills/${drill.id}` : '/api/drills';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: $name,
          brief_description: $brief_description,
          detailed_description: $detailed_description,
          skill_level: $skill_level,
          complexity: $complexity,
          suggested_length: $suggested_length,
          number_of_people_min: $number_of_people_min,
          number_of_people_max: $number_of_people_max,
          skills_focused_on: $selectedSkills,
          positions_focused_on: $positions_focused_on,
          video_link: $video_link,
          diagrams: $diagrams,
          drill_type: $drill_type,
          is_editable_by_others: $is_editable_by_others,
          visibility: $visibility
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();

      // After successful submission for non-logged in users
      if (!$page.data.session) {
        const confirmed = confirm(
          'Would you like to log in so that you can own this drill?\n\n' +
          'Click OK to log in with Google\n' +
          'Click Cancel to continue without logging in'
        );

        if (confirmed) {
          sessionStorage.setItem('drillToAssociate', result.id);
          await signIn('google');
          return;
        }
      }

      toast.push('Drill saved successfully!');
      goto(`/drills/${result.id}`);
    } catch (error) {
      console.error('Error submitting drill:', error);
      toast.push('Error saving drill. Please try again.', {
        theme: {
          '--toastBackground': '#F56565',
          '--toastColor': 'white',
        }
      });
    }
  }

  // Add this to restore form data after login
  onMount(() => {
    const pendingData = sessionStorage.getItem('pendingDrillData');
    if (pendingData) {
      const data = JSON.parse(pendingData);
      // Restore all the form values
      name.set(data.name);
      brief_description.set(data.brief_description);
      detailed_description.set(data.detailed_description);
      skill_level.set(data.skill_level);
      complexity.set(data.complexity);
      suggested_length.set(data.suggested_length);
      number_of_people_min.set(data.number_of_people_min);
      number_of_people_max.set(data.number_of_people_max);
      selectedSkills.set(data.skills_focused_on);
      positions_focused_on.set(data.positions_focused_on);
      video_link.set(data.video_link);
      images.set(data.images);
      diagrams.set(data.diagrams);
      drill_type.set(data.drill_type);
      is_editable_by_others.set(data.is_editable_by_others);
      visibility.set(data.visibility);

      // Clear the stored data
      sessionStorage.removeItem('pendingDrillData');
    }
  });

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

          <!-- Moved Drill Type Field -->
          <div class="flex flex-col">
            <label class="mb-1 text-sm font-medium text-gray-700">Drill Type:</label>
            <p class="text-xs text-gray-500 mb-1">Select one or more drill types.</p>
            <div class="flex flex-wrap gap-2">
              {#each drillTypeOptions as type}
                <button
                  type="button"
                  class="px-3 py-1 rounded-full border border-gray-300"
                  class:selected={$drill_type.includes(type)}
                  on:click={() => toggleSelection(drill_type, type)}
                >
                  {type}
                </button>
              {/each}
            </div>
            {#if $errors.drill_type}
              <p class="text-red-500 text-sm mt-1">{$errors.drill_type}</p>
            {/if}
          </div>

          <div class="flex flex-col">
            <label for="skill_level" class="mb-1 text-sm font-medium text-gray-700">Appropriate for Skill Level:</label>
            <p class="text-xs text-gray-500 mb-1">When done correctly, what levels of player would benefit from this drill.</p>

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
            <p class="text-xs text-gray-500 mb-1">How difficult is it to get a team to do this drill correctly for the first time.</p>
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
            <p class="text-xs text-gray-500 mb-1">Leave empty or enter 0 for "Any"</p>
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
            <label for="skills_focused_on" class="mb-1 text-sm font-medium text-gray-700">Skills Focused On:</label>
            <div class="relative">
              <input
                id="skills_focused_on"
                bind:value={$newSkill}
                on:input={handleSkillInput}
                class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type to search or add new skills"
              />
              {#if $skillSuggestions.length > 0}
                <ul class="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto">
                  {#each $skillSuggestions as suggestion}
                    <li>
                      <button
                        type="button"
                        on:click={() => selectSkill(suggestion)}
                        class="w-full text-left px-3 py-2 hover:bg-gray-100"
                      >
                        {suggestion.skill} {suggestion.isPredefined ? '(Predefined)' : ''}
                      </button>
                    </li>
                {/each}
                </ul>
              {/if}
            </div>
            <div class="flex flex-wrap gap-2 mb-2">
              {#each $selectedSkills as skill}
                <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                  {skill}
                  <button on:click={() => removeSkill(skill)} class="ml-1 text-blue-600 hover:text-blue-800">×</button>
                </span>
              {/each}
            </div>
            <button
              type="button"
              on:click={openSkillsModal}
              class="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Browse Skills
            </button>
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

          <!-- Visibility Field -->
          <div class="flex flex-col">
            <label class="mb-1 text-sm font-medium text-gray-700">Visibility:</label>
            <select 
              bind:value={$visibility} 
              class="p-2 border rounded-md" 
              disabled={!$page.data.session}
              title={!$page.data.session ? 'Log in to create private or unlisted drills' : ''}
            >
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
              <option value="private">Private</option>
            </select>
            {#if !$page.data.session}
              <p class="text-sm text-gray-500 mt-1">Log in to create private or unlisted drills</p>
            {/if}
          </div>

          <!-- Is Editable by Others Field -->
          <div class="flex items-center">
            <input
              id="editable_by_others"
              type="checkbox"
              bind:checked={$is_editable_by_others}
              disabled={!$page.data.session}
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              for="editable_by_others"
              class="ml-2 block text-sm text-gray-700"
            >
              Allow others to edit this drill
              {#if !$page.data.session}
                <span class="text-gray-500">(required for anonymous submissions)</span>
              {/if}
            </label>
          </div>

          <div class="mb-4">
            <label class="flex items-center">
              <input
                type="checkbox"
                bind:checked={$isVariation}
                class="form-checkbox h-4 w-4 text-blue-600"
              />
              <span class="ml-2">This is a variation of another drill</span>
            </label>
          </div>

          {#if $isVariation}
            <div class="mb-4">
              <label for="parentDrill" class="block text-sm font-medium text-gray-700">Parent Drill</label>
              <select
                id="parentDrill"
                bind:value={$parentDrillId}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="">Select a parent drill</option>
                {#each $parentDrills as drill}
                  <option value={drill.id}>{drill.name}</option>
                {/each}
              </select>
              {#if $errors.parentDrillId}
                <p class="text-red-500 text-sm mt-1">{$errors.parentDrillId}</p>
              {/if}
            </div>
          {/if}

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
      <div class="mt-6">
        <h3 class="text-lg font-semibold mb-2">Diagrams</h3>
        <div class="space-y-4">
          {#each $diagrams as diagram, index (index + '-' + diagramKey)}
            <div class="border p-4 rounded">
              <div class="flex items-center justify-between mb-2">
                <span class="text-lg font-semibold">Diagram {index + 1}</span>
                <div class="flex gap-2">
                  {#if index > 0}
                    <button type="button" class="text-blue-600 hover:text-blue-800" on:click={() => handleMoveUp(index)}>↑</button>
                  {/if}
                  {#if index < $diagrams.length - 1}
                    <button type="button" class="text-blue-600 hover:text-blue-800" on:click={() => handleMoveDown(index)}>↓</button>
                  {/if}
                  <button type="button" class="text-red-600 hover:text-red-800" on:click={() => deleteDiagram(index)}>Delete</button>
                </div>
              </div>
              <ExcalidrawWrapper 
                bind:this={diagramRefs[index]}
                on:save={(event) => handleDiagramSave(event, index)} 
                id={`diagram-canvas-${index}`} 
                data={diagram} 
                index={index} 
                showSaveButton={true} 
              />
            </div>
          {/each}
        </div>
        <button 
          type="button" 
          on:click={addDiagram} 
          class="mt-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Add New Diagram
        </button>
      </div>

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
                {skill.skill} {skill.isPredefined ? '(Predefined)' : ''}
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

<div class="toastContainer" />

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

  /* Add toast container styles */
  :global(.toastContainer) {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 9999;
  }
</style>