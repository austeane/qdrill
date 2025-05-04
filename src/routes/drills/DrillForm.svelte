<script>
  import { onMount, tick, createEventDispatcher } from 'svelte';
  import { writable, derived } from 'svelte/store';
  import { goto } from '$app/navigation';
  import ExcalidrawWrapper from '../../components/ExcalidrawWrapper.svelte';
  import { dndzone } from 'svelte-dnd-action';
  import { PREDEFINED_SKILLS } from '$lib/constants/skills';
  import { page } from '$app/stores';
  import { authClient } from '$lib/auth-client';
  import { toast } from '@zerodevx/svelte-toast'
  import { apiFetch } from '$lib/utils/apiFetch.js';

  const dispatch = createEventDispatcher();

  // Component Props
  export let drill = {};
  export let allSkills = [];
  export let allDrillNames = [];

  // Initialize stores based on props
  let name = writable(drill.name ?? '');
  let brief_description = writable(drill.brief_description ?? '');
  let detailed_description = writable(drill.detailed_description ?? '');
  let skill_level = writable(drill.skill_level ?? []);
  let complexity = writable((drill.complexity ?? '').toLowerCase());
  let suggested_length = writable(drill.suggested_length ?? '');
  let number_of_people_min = writable(drill.number_of_people_min ?? '');
  let number_of_people_max = writable(drill.number_of_people_max ?? '');
  let selectedSkills = writable(drill.skills_focused_on ?? []);
  let newSkill = writable('');
  let skillSearchTerm = writable('');
  let positions_focused_on = writable(drill.positions_focused_on ?? []);
  let video_link = writable(drill.video_link ?? '');
  let images = writable(drill.images?.map((image, index) => ({
    id: `image-${index}`,
    file: image
  })) ?? []);
  let diagrams = writable(drill.diagrams?.length > 0 ? drill.diagrams : [{
    elements: [],
    appState: {
      viewBackgroundColor: '#ffffff',
      gridSize: 20,
      collaborators: []
    },
    files: {}
  }]);
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

  let isVariation = writable(!!drill.parent_drill_id);
  let parentDrillId = writable(drill.parent_drill_id ?? null);

  // Derived store for available skills - depends on selectedSkills store and allSkills prop
  const availableSkills = derived(selectedSkills, ($selectedSkills) => {
    return Array.isArray(allSkills) ? allSkills.filter(skill => 
      !$selectedSkills.includes(skill.skill)
    ) : [];
  });

  // Derived store for skill suggestions - depends on availableSkills derived store and skillSearchTerm store
  const skillSuggestionsDerived = derived(
    [availableSkills, skillSearchTerm],
    ([$availableSkills, $skillSearchTerm]) => {
      const $term = $skillSearchTerm.toLowerCase().trim();
      if (!$term) return [];
      return $availableSkills
        .filter(skill => skill.skill.toLowerCase().includes($term))
        .slice(0, 10);
    }
  );

  // Derived store for modal skill suggestions - depends on availableSkills derived store and modalSkillSearchTerm store
  const modalSkillSuggestionsDerived = derived(
    [availableSkills, modalSkillSearchTerm],
    ([$availableSkills, $modalSkillSearchTerm]) => {
      const $term = $modalSkillSearchTerm.toLowerCase().trim();
      if (!$term) return $availableSkills; // Return all available if no term
      return $availableSkills
        .filter(skill => skill.skill.toLowerCase().includes($term))
        .slice(0, 20);
    }
  );
  
  // Reactive statement for parent drill options - depends on prop allDrillNames and drill prop
  // Cannot be a derived store used with $ in template as it doesn't derive from stores.
  $: parentDrillOptions = Array.isArray(allDrillNames) ? allDrillNames.filter(d => d.id !== drill?.id) : [];

  let diagramRefs = [];

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

  let showAddDiagramModal = false;
  let selectedTemplate = 'blank';

  function addDiagram() {
    if (diagramRefs.length > 0) {
      const lastDiagramRef = diagramRefs[diagramRefs.length - 1];
      if (lastDiagramRef) {
        lastDiagramRef.saveDiagram();
      }
    }
    diagrams.update(d => [...d, {
      template: selectedTemplate,
      elements: [],
      appState: { viewBackgroundColor: '#ffffff', gridSize: 20, collaborators: [] },
      files: {}
    }]);
    diagramKey++;
    showAddDiagramModal = false;
  }

  function deleteDiagram(index) {
    if (confirm('Are you sure you want to delete this diagram?')) {
      diagrams.update(d => d.filter((_, i) => i !== index));
      diagramKey++;
    }
  }

  function moveDiagram(index, direction) {
    diagrams.update(d => {
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= d.length) return d;
      const newDiagrams = [...d];
      [newDiagrams[index], newDiagrams[newIndex]] = [newDiagrams[newIndex], newDiagrams[index]];
      return newDiagrams;
    });
    diagramKey++;
  }

  function handleDiagramSave(event, index) {
    const diagramData = event.detail;
    const processedData = {
      elements: diagramData.elements || [],
      appState: { ...(diagramData.appState || {}), collaborators: Array.isArray(diagramData.appState?.collaborators) ? diagramData.appState.collaborators : [] },
      files: diagramData.files || {}
    };
    diagrams.update(d => {
      const newDiagrams = [...d];
      newDiagrams[index] = processedData;
      return newDiagrams;
    });
  }

  function handleMoveUp(index) { moveDiagram(index, -1); }
  function handleMoveDown(index) { moveDiagram(index, 1); }

  onMount(async () => {
    mounted = true;

    const pendingData = sessionStorage.getItem('pendingDrillData');
    if (pendingData) {
      const data = JSON.parse(pendingData);
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
      diagrams.set(data.diagrams?.length > 0 ? data.diagrams : [{
        elements: [],
        appState: { viewBackgroundColor: '#ffffff', gridSize: 20, collaborators: [] },
        files: {}
      }]);
      drill_type.set(data.drill_type);
      is_editable_by_others.set(data.is_editable_by_others);
      visibility.set(data.visibility);
      isVariation.set(!!data.parent_drill_id);
      if (data.parent_drill_id) {
        parentDrillId.set(data.parent_drill_id);
      }
      sessionStorage.removeItem('pendingDrillData');
      await tick(); 
      diagramKey++;
    }
  });

  // Helper function to parse "min-max minutes" string
  function parseLengthRange(rangeString) {
    if (!rangeString) return null;
    const match = rangeString.match(/^(\d+)-(\d+)\s+minutes$/);
    if (match && match.length === 3) {
      return {
        min: parseInt(match[1], 10),
        max: parseInt(match[2], 10),
      };
    }
    // Handle potential other formats or return null/error if needed
    console.warn('Could not parse suggested length range:', rangeString);
    return null; 
  }

  function handleSkillInput() {
    skillSearchTerm.set($newSkill);
  }

  async function addSkill() {
    const rawSkill = $newSkill.trim();
    if (!rawSkill) return;

    const skillToAdd = rawSkill.toLowerCase().split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    if ($selectedSkills.some(s => s.toLowerCase() === skillToAdd.toLowerCase())) {
      toast.push('This skill is already added');
      return;
    }
    
    selectedSkills.update(skills => [...skills, skillToAdd]);
    newSkill.set('');
    skillSearchTerm.set('');

    try {
      const addedSkill = await apiFetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill: skillToAdd })
      });

      toast.push('Skill added successfully');

    } catch (error) {
      console.error('Error adding skill:', error);
      toast.push(`Failed to add skill: ${error.message}`, {
        theme: { '--toastBackground': '#F56565', '--toastColor': 'white' }
      });
      selectedSkills.update(skills => skills.filter(s => s !== skillToAdd));
    }
  }

  function handleSkillKeydown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      const skillToAdd = $newSkill.trim();
      const firstSuggestion = $skillSuggestionsDerived[0];

      if (firstSuggestion) {
        selectSkill(firstSuggestion);
      } else if (skillToAdd) {
        addSkill();
      }
    }
  }

  function selectSkill(skill) {
    const skillText = skill.skill || skill;
    if (!$selectedSkills.includes(skillText)) {
      selectedSkills.update(skills => [...skills, skillText]);
      newSkill.set('');
      skillSearchTerm.set('');
    }
  }

  function handleModalSkillInput() {
    modalSkillSearchTerm.set($modalSkillSearchTerm);
  }

  function openSkillsModal() {
    showSkillsModal = true;
    modalSkillSearchTerm.set('');
  }

  function closeSkillsModal() {
    showSkillsModal = false;
  }

  function selectSkillFromModal(skill) {
    selectSkill(skill);
  }

  function validateNumber(value, field) {
    if (value === '') {
      if (field === 'number_of_people_max') {
        numberWarnings[field] = '';
        return;
      }
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
    
    if ($number_of_people_min && !Number.isInteger(Number($number_of_people_min))) {
      newErrors.number_of_people_min = 'Min number of people must be a whole number';
    }
    if ($number_of_people_max !== '' && $number_of_people_max !== '0' && !Number.isInteger(Number($number_of_people_max))) {
      newErrors.number_of_people_max = 'Max number of people must be a whole number';
    }
    
    if ($isVariation && !$parentDrillId) {
      newErrors.parentDrillId = 'Parent drill is required for variations';
    }
    
    errors.set(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    diagramRefs.forEach(ref => {
      if (ref && typeof ref.saveDiagram === 'function') {
        ref.saveDiagram();
      }
    });

    await tick();

    if (!validateForm()) return;

    if (!$page.data.session && $visibility !== 'public') {
      const confirmed = confirm(
        `Log in to create a ${$visibility} drill.\n\n` +
        'Click OK to log in with Google\n' +
        'Click Cancel to create as public instead'
      );
      
      if (confirmed) {
        const formData = {
          name: $name,
          brief_description: $brief_description,
          detailed_description: $detailed_description,
          skill_level: $skill_level,
          complexity: $complexity ? ($complexity.charAt(0).toUpperCase() + $complexity.slice(1)) : null,
          suggested_length: parseLengthRange($suggested_length),
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
        console.log('Storing pending drill data:', formData);
        sessionStorage.setItem('pendingDrillData', JSON.stringify(formData));
        await authClient.signIn.social({ provider: 'google' });
        return;
      } else {
        visibility.set('public');
      }
    }

    if (!$page.data.session) {
      is_editable_by_others.set(true);
    }

    try {
      const method = drill.id ? 'PUT' : 'POST';
      const url = drill.id ? `/api/drills/${drill.id}` : '/api/drills';
      
      const maxParticipants = ($number_of_people_max === '' || $number_of_people_max === '0') ? null : Number($number_of_people_max);
      const minParticipants = ($number_of_people_min === '') ? null : Number($number_of_people_min);
      
      const requestBody = {
        id: drill.id,
        name: $name,
        brief_description: $brief_description,
        detailed_description: $detailed_description,
        skill_level: $skill_level,
        complexity: $complexity ? ($complexity.charAt(0).toUpperCase() + $complexity.slice(1)) : null,
        suggested_length: parseLengthRange($suggested_length),
        number_of_people_min: minParticipants,
        number_of_people_max: maxParticipants,
        skills_focused_on: $selectedSkills,
        positions_focused_on: $positions_focused_on,
        video_link: $video_link || null,
        diagrams: $diagrams,
        drill_type: $drill_type,
        is_editable_by_others: $is_editable_by_others,
        visibility: $visibility,
        parent_drill_id: $isVariation ? $parentDrillId : null
      };

      const { diagrams: _, ...loggableData } = requestBody;
      console.log('Submitting drill data:', loggableData);

      const result = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!$page.data.session) {
        const confirmed = confirm(
          'Would you like to log in so that you can own this drill?\n\n' +
          'Click OK to log in with Google\n' +
          'Click Cancel to continue without logging in'
        );

        if (confirmed) {
          console.log('Setting drillToAssociate:', result.id);
          sessionStorage.setItem('drillToAssociate', result.id);
          await authClient.signIn.social({ provider: 'google' });
          return;
        }
      }

      toast.push('Drill saved successfully!');
      goto(`/drills/${result.id}`);
    } catch (error) {
      console.error('Error submitting drill:', error);
      toast.push(`Error saving drill: ${error.message}. Please try again.`, {
        theme: {
          '--toastBackground': '#F56565',
          '--toastColor': 'white',
        }
      });
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

  function duplicateDiagram(index) {
    if (diagramRefs[index]) {
      diagramRefs[index].saveDiagram();
    }

    diagrams.update(d => {
      const diagramToDuplicate = d[index];
      const duplicatedDiagram = {
        elements: diagramToDuplicate.elements?.map(element => ({
          ...element,
          id: crypto.randomUUID(),
          groupIds: element.groupIds?.map(() => crypto.randomUUID())
        })) || [],
        appState: { ...diagramToDuplicate.appState },
        files: { ...diagramToDuplicate.files }
      };
      
      const newDiagrams = [...d];
      newDiagrams.splice(index + 1, 0, duplicatedDiagram);
      return newDiagrams;
    });
    
    diagramKey++;
  }

  function handleDescriptionChange(e) {
    detailed_description.set(e.detail.content);
  }

  function removeSkill(skillToRemove) {
    selectedSkills.update(skills => skills.filter(skill => skill !== skillToRemove));
  }

  let Editor;
  onMount(async () => {
    try {
      const module = await import('@tinymce/tinymce-svelte');
      Editor = module.default;
    } catch (error) {
      console.error('Error loading TinyMCE:', error);
    }
  });
</script>

<svelte:head>
  <title>{drill?.id ? 'Edit Drill' : 'Create Drill'}</title>
  <meta name="description" content={drill?.id ? 'Edit an existing drill' : 'Create a new drill'} />
</svelte:head>

<section class="container mx-auto md:p-4 h-screen overflow-y-auto">
  <div class="flex flex-col h-full">
    <div class="flex flex-col md:flex-row flex-grow gap-4 transition-all duration-300 ease-in-out">
      <div class="flex-1 min-w-0 md:p-4 border rounded-md transition-all duration-300 ease-in-out">
        <div class="max-w-lg mx-auto md:mx-auto p-4 md:p-0">
          <h1 class="text-2xl font-bold text-center mb-6">{drill?.id ? 'Edit Drill' : 'Create Drill'}</h1>
          <form on:submit|preventDefault={handleSubmit} class="space-y-6" method="POST">
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
              <p class="text-xs text-gray-500 mb-1">As much detail as would be needed for a new coach to teach this drill. May include, setup, focus areas, adaptations, or credit for the creator of the drill.</p>
              
              {#if Editor}
                <div class="min-h-[300px]">
                  <svelte:component 
                    this={Editor}
                    apiKey={import.meta.env.VITE_TINY_API_KEY}
                    bind:value={$detailed_description}
                    init={{
                      height: 300,
                      menubar: false,
                      plugins: [
                        'advlist', 'autolink', 'lists', 'link', 'charmap',
                        'anchor', 'searchreplace', 'visualblocks', 'code',
                        'insertdatetime', 'table', 'code', 'help', 'wordcount'
                      ],
                      toolbar: 'undo redo | blocks | ' +
                              'bold italic | alignleft aligncenter ' +
                              'alignright alignjustify | bullist numlist outdent indent | ' +
                              'removeformat | help',
                      content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px; }',
                      branding: false
                    }}
                  />
                </div>
              {:else}
                <textarea
                  id="detailed_description"
                  bind:value={$detailed_description}
                  class="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="8"
                ></textarea>
              {/if}
            </div>

            <div class="flex flex-col">
              <label id="drill-type-label" class="mb-1 text-sm font-medium text-gray-700">Drill Type:</label>
              <p class="text-xs text-gray-500 mb-1">Select one or more drill types.</p>
              <div role="group" aria-labelledby="drill-type-label" class="flex flex-wrap gap-2">
                {#each drillTypeOptions as option (option)}
                  <div class="flex items-center">
                    <button
                      type="button"
                      class="px-3 py-1 rounded-full border border-gray-300"
                      class:selected={$drill_type.includes(option)}
                      on:click={() => toggleSelection(drill_type, option)}
                    >
                      {option}
                    </button>
                  </div>
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
                <button type="button" class="px-3 py-1 rounded-full border border-gray-300 skill-level-button" class:selected={$skill_level.includes('New to Sport')} on:click={() => toggleSelection(skill_level, 'New to Sport')}>New to Sport</button>
                <button type="button" class="px-3 py-1 rounded-full border border-gray-300 skill-level-button" class:selected={$skill_level.includes('Beginner')} on:click={() => toggleSelection(skill_level, 'Beginner')}>Beginner</button>
                <button type="button" class="px-3 py-1 rounded-full border border-gray-300 skill-level-button" class:selected={$skill_level.includes('Intermediate')} on:click={() => toggleSelection(skill_level, 'Intermediate')}>Intermediate</button>
                <button type="button" class="px-3 py-1 rounded-full border border-gray-300 skill-level-button" class:selected={$skill_level.includes('Advanced')} on:click={() => toggleSelection(skill_level, 'Advanced')}>Advanced</button>
                <button type="button" class="px-3 py-1 rounded-full border border-gray-300 skill-level-button" class:selected={$skill_level.includes('Elite')} on:click={() => toggleSelection(skill_level, 'Elite')}>Elite</button>
              </div>
            </div>
            {#if $errors.skill_level}
              <p class="text-red-500 text-sm mt-1">{$errors.skill_level}</p>
            {/if}

            <div class="flex flex-col">
              <label for="complexity" class="mb-1 text-sm font-medium text-gray-700">Complexity:</label>
              <p class="text-xs text-gray-500 mb-1">How difficult is it to get a team to do this drill correctly for the first time.</p>
              <select 
                id="complexity" 
                bind:value={$complexity} 
                class="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Complexity</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
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
              <div class="flex flex-wrap gap-2 mb-2">
                {#each $selectedSkills as skill (skill)}
                  <span class="flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    {skill}
                    <button type="button" on:click={() => removeSkill(skill)} class="ml-1 text-blue-600 hover:text-blue-800">&times;</button>
                  </span>
                {/each}
              </div>
              <div class="flex items-center space-x-2 relative">
                <input 
                  type="text" 
                  bind:value={$newSkill}
                  on:input={handleSkillInput}
                  on:keydown={handleSkillKeydown}
                  placeholder="Type to add or find skill..."
                  class="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  type="button" 
                  on:click={addSkill} 
                  disabled={!$newSkill.trim()}
                  class="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                >Add</button>
                <button 
                  type="button" 
                  on:click={openSkillsModal} 
                  class="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >Browse</button>
                
                {#if $skillSuggestionsDerived.length > 0}
                  <div class="absolute top-full left-0 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                    {#each $skillSuggestionsDerived as suggestion (suggestion.skill)}
                      <button 
                        type="button"
                        class="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                        on:click={() => selectSkill(suggestion)}
                      >
                        {suggestion.skill}
                      </button>
                    {/each}
                  </div>
                {/if}
              </div>
               {#if $errors.skills_focused_on}
                <p class="text-red-500 text-sm mt-1">{$errors.skills_focused_on}</p>
              {/if}
            </div>

            <div class="flex flex-col">
              <label for="positions_focused_on" class="mb-1 text-sm font-medium text-gray-700">Positions Focused On:</label>
              <div class="flex flex-wrap gap-2">
                <button type="button" class="px-3 py-1 rounded-full border border-gray-300 position-button" class:selected={$positions_focused_on.includes('Beater')} on:click={() => toggleSelection(positions_focused_on, 'Beater')}>Beater</button>
                <button type="button" class="px-3 py-1 rounded-full border border-gray-300 position-button" class:selected={$positions_focused_on.includes('Chaser')} on:click={() => toggleSelection(positions_focused_on, 'Chaser')}>Chaser</button>
                <button type="button" class="px-3 py-1 rounded-full border border-gray-300 position-button" class:selected={$positions_focused_on.includes('Keeper')} on:click={() => toggleSelection(positions_focused_on, 'Keeper')}>Keeper</button>
                <button type="button" class="px-3 py-1 rounded-full border border-gray-300 position-button" class:selected={$positions_focused_on.includes('Seeker')} on:click={() => toggleSelection(positions_focused_on, 'Seeker')}>Seeker</button>
              </div>
            </div>
            {#if $errors.positions_focused_on}
              <p class="text-red-500 text-sm mt-1">{$errors.positions_focused_on}</p>
            {/if}

            <div class="flex flex-col">
              <label for="video_link" class="mb-1 text-sm font-medium text-gray-700">Video Link:</label>
              <input id="video_link" bind:value={$video_link} class="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div class="flex flex-col">
              <label for="visibility-select" class="mb-1 text-sm font-medium text-gray-700">Visibility:</label>
              <select 
                id="visibility-select"
                bind:value={$visibility}
                class="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  {#each parentDrillOptions as parent (parent.id)}
                    <option value={parent.id}>{parent.name}</option>
                  {/each}
                </select>
                {#if $errors.parentDrillId}
                  <p class="text-red-500 text-sm mt-1">{$errors.parentDrillId}</p>
                {/if}
              </div>
            {/if}
          </form>
        </div>
      </div>

      <div class="w-full md:w-64 flex-shrink-0 md:p-4">
        <div class="sticky top-4 bg-white p-4 border rounded-md shadow-sm">
          <h2 class="text-lg font-semibold mb-4">Actions</h2>
          <button 
            type="submit" 
            on:click={handleSubmit} 
            class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mb-3"
          >
            {drill?.id ? 'Save Changes' : 'Create Drill'}
          </button>
          <button 
            type="button" 
            on:click={() => goto(drill?.id ? `/drills/${drill.id}` : '/drills')}
            class="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>

  {#if showSkillsModal}
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div class="p-4 border-b flex justify-between items-center">
          <h3 class="text-lg font-medium">Browse Skills</h3>
          <button on:click={closeSkillsModal} class="text-gray-500 hover:text-gray-700">&times;</button>
        </div>
        <div class="p-4">
          <input 
            type="text" 
            placeholder="Search skills..."
            bind:value={$modalSkillSearchTerm}
            on:input={handleModalSkillInput}
            class="w-full p-2 border border-gray-300 rounded-md mb-4"
          />
        </div>
        <div class="overflow-y-auto flex-grow p-4 pt-0">
          <div class="flex flex-wrap gap-2">
            {#each $modalSkillSuggestionsDerived as skill (skill.skill)}
              <button 
                on:click={() => selectSkillFromModal(skill)}
                class="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full hover:bg-blue-200"
              >
                {skill.skill} ({skill.usage_count})
              </button>
            {/each}
             {#if $modalSkillSuggestionsDerived.length === 0}
                <p class="text-gray-500 text-sm w-full text-center">No matching skills found.</p>
             {/if}
          </div>
        </div>
        <div class="p-4 border-t text-right">
          <button on:click={closeSkillsModal} class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">Close</button>
        </div>
      </div>
    </div>
  {/if}
  
  {#if showAddDiagramModal}
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
       <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
         <h3 class="text-lg font-medium mb-4">Add Diagram</h3>
         <div class="mb-4">
           <label for="template-select" class="block text-sm font-medium text-gray-700 mb-1">Choose a template:</label>
           <select id="template-select" bind:value={selectedTemplate} class="w-full p-2 border border-gray-300 rounded-md">
             <option value="blank">Blank Canvas</option>
             <option value="fullCourt">Full Court</option>
             <option value="halfCourt">Half Court</option>
           </select>
         </div>
         <div class="flex justify-end space-x-3">
           <button on:click={() => showAddDiagramModal = false} class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">Cancel</button>
           <button on:click={addDiagram} class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">Add</button>
         </div>
       </div>
    </div>
  {/if}
</section>

<style>
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

  .selected {
    background-color: #3b82f6;
    color: white;
  }

  :global(.dndzone.dropzone) {
    background-color: rgba(59, 130, 246, 0.1);
  }

  textarea {
    min-height: 60px;
    resize: vertical;
    max-height: 300px;
    transition: height 0.1s ease-out;
  }

  :global(.toastContainer) {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 9999;
  }
</style>