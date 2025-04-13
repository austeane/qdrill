<script>
  import { onMount, tick } from 'svelte';
  import { writable } from 'svelte/store';
  import { goto } from '$app/navigation';
  import ExcalidrawWrapper from '../../components/ExcalidrawWrapper.svelte';
  import { page } from '$app/stores';
  import { signIn } from '@auth/sveltekit/client';
  import { toast } from '@zerodevx/svelte-toast'

  // Initialize stores
  export let formation = {
    id: null,
    name: '',
    brief_description: '',
    detailed_description: '',
    diagrams: [],
    tags: [],
    is_editable_by_others: false,
    visibility: 'public',
    formation_type: 'offense'
  };

  let name = writable(formation.name ?? '');
  let brief_description = writable(formation.brief_description ?? '');
  let detailed_description = writable(formation.detailed_description ?? '');
  let tags = writable(formation.tags ?? []);
  let newTag = writable('');
  let is_editable_by_others = writable(formation.is_editable_by_others ?? false);
  let visibility = writable(formation.visibility ?? 'public');
  let formation_type = writable(formation.formation_type ?? 'offense');
  // Parse diagrams if they come as JSON strings
  const parseDiagrams = (diagramsData) => {
    if (!diagramsData || diagramsData.length === 0) {
      return [{
        elements: [],
        appState: {
          viewBackgroundColor: '#ffffff',
          gridSize: 20,
          collaborators: []
        },
        files: {}
      }];
    }
    
    return diagramsData.map(diagram => {
      if (typeof diagram === 'string') {
        try {
          return JSON.parse(diagram);
        } catch (e) {
          console.error('Error parsing diagram JSON:', e);
          return diagram;
        }
      }
      return diagram;
    });
  };
  
  let diagrams = writable(parseDiagrams(formation.diagrams));

  let errors = writable({});
  let mounted = false;
  let diagramKey = 0;
  let diagramRefs = [];
  
  let showAddDiagramModal = false;
  let selectedTemplate = 'blank';

  // Add a diagram function
  function addDiagram() {
    // Save the current diagram if it exists
    if (diagramRefs.length > 0) {
      const lastDiagramRef = diagramRefs[diagramRefs.length - 1];
      if (lastDiagramRef) {
        lastDiagramRef.saveDiagram();
      }
    }

    diagrams.update(d => [...d, {
      template: selectedTemplate,
      elements: [],
      appState: {
        viewBackgroundColor: '#ffffff',
        gridSize: 20,
        collaborators: []
      },
      files: {}
    }]);
    
    diagramKey++;
    showAddDiagramModal = false;
  }

  // Delete a diagram
  function deleteDiagram(index) {
    if (confirm('Are you sure you want to delete this diagram?')) {
      diagrams.update(d => d.filter((_, i) => i !== index));
      diagramKey++;
    }
  }

  // Move diagram up or down in the list
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

  // Handle diagram save event
  function handleDiagramSave(event, index) {
    const diagramData = event.detail;
    
    // Ensure proper structure when saving
    const processedData = {
      elements: diagramData.elements || [],
      appState: {
        ...(diagramData.appState || {}),
        collaborators: Array.isArray(diagramData.appState?.collaborators) ? diagramData.appState.collaborators : []
      },
      files: diagramData.files || {}
    };
    
    diagrams.update(d => {
      const newDiagrams = [...d];
      newDiagrams[index] = processedData;
      return newDiagrams;
    });
  }

  function handleMoveUp(index) {
    moveDiagram(index, -1);
  }

  function handleMoveDown(index) {
    moveDiagram(index, 1);
  }

  // Add a tag to the formation
  function addTag() {
    const tag = $newTag.trim().toLowerCase();
    
    if (!tag) return;
    
    if (!$tags.includes(tag)) {
      tags.update(t => [...t, tag]);
      newTag.set('');
    }
  }

  // Remove a tag from the formation
  function removeTag(tagToRemove) {
    tags.update(t => t.filter(tag => tag !== tagToRemove));
  }

  // Handle tag input keypress
  function handleTagKeydown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      addTag();
    }
  }

  // Duplicate a diagram
  function duplicateDiagram(index) {
    if (diagramRefs[index]) {
      // Save the current state of the diagram being duplicated
      diagramRefs[index].saveDiagram();
    }

    diagrams.update(d => {
      const diagramToDuplicate = d[index];
      
      // Create a mapping of old groupIds to new groupIds to maintain group relationships
      const groupIdMap = new Map();
      
      // Create a deep copy of the diagram, ensuring new IDs for elements
      const duplicatedDiagram = {
        elements: diagramToDuplicate.elements?.map(element => {
          // Create new groupIds mapping if they exist
          let newGroupIds = undefined;
          if (element.groupIds && element.groupIds.length > 0) {
            newGroupIds = element.groupIds.map(groupId => {
              // If we haven't created a new ID for this group yet, create one
              if (!groupIdMap.has(groupId)) {
                groupIdMap.set(groupId, crypto.randomUUID());
              }
              // Use the consistent new ID for this group
              return groupIdMap.get(groupId);
            });
          }
          
          return {
            ...element,
            id: crypto.randomUUID(), // Generate new IDs for each element
            groupIds: newGroupIds // Use the mapped group IDs to maintain relationships
          };
        }) || [],
        appState: { ...diagramToDuplicate.appState },
        files: { ...diagramToDuplicate.files }
      };
      
      // Insert the duplicate after the original
      const newDiagrams = [...d];
      newDiagrams.splice(index + 1, 0, duplicatedDiagram);
      return newDiagrams;
    });
    
    diagramKey++; // Force re-render of diagrams
  }

  // Editor component
  let Editor;
  onMount(async () => {
    try {
      console.log('Attempting to load TinyMCE module...');
      const module = await import('@tinymce/tinymce-svelte');
      console.log('Module loaded:', module);
      Editor = module.default;
      console.log('Editor component assigned:', Editor);
    } catch (error) {
      console.error('Error loading TinyMCE:', error);
    }
  });

  // Form validation
  function validateForm() {
    let newErrors = {};
    if (!$name) newErrors.name = 'Name is required';
    if (!$brief_description) newErrors.brief_description = 'Brief description is required';
    
    errors.set(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // Handle form submission
  async function handleSubmit() {
    // Trigger saveDiagram on each component to dispatch 'save' events
    diagramRefs.forEach(ref => {
      if (ref && typeof ref.saveDiagram === 'function') {
        ref.saveDiagram(); // This dispatches the event handled by handleDiagramSave
      }
    });

    // Wait for Svelte store updates triggered by handleDiagramSave to complete
    await tick();

    if (!validateForm()) return;

    // If not logged in and trying to create private/unlisted formation
    if (!$page.data.session && $visibility !== 'public') {
      const confirmed = confirm(
        `Log in to create a ${$visibility} formation.\n\n` +
        'Click OK to log in with Google\n' +
        'Click Cancel to create as public instead'
      );
      
      if (confirmed) {
        // Store form data in sessionStorage
        const formData = {
          name: $name,
          brief_description: $brief_description,
          detailed_description: $detailed_description,
          diagrams: $diagrams,
          tags: $tags,
          visibility: $visibility,
          is_editable_by_others: $is_editable_by_others,
          formation_type: $formation_type
        };
        sessionStorage.setItem('pendingFormationData', JSON.stringify(formData));
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
      const method = formation.id ? 'PUT' : 'POST';
      const url = formation.id ? `/api/formations/${formation.id}` : '/api/formations';
      
      const requestBody = {
        id: formation.id,
        name: $name,
        brief_description: $brief_description,
        detailed_description: $detailed_description,
        diagrams: $diagrams,
        tags: $tags,
        is_editable_by_others: $is_editable_by_others,
        visibility: $visibility,
        formation_type: $formation_type
      };

      // Log the data being sent, excluding the potentially large diagrams array
      const { diagrams: _, ...loggableData } = requestBody;
      console.log('Submitting formation data:', loggableData);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();

      // After successful submission for non-logged in users
      if (!$page.data.session) {
        const confirmed = confirm(
          'Would you like to log in so that you can own this formation?\n\n' +
          'Click OK to log in with Google\n' +
          'Click Cancel to continue without logging in'
        );

        if (confirmed) {
          sessionStorage.setItem('formationToAssociate', result.id);
          await signIn('google');
          return;
        }
      }

      toast.push('Formation saved successfully!');
      goto(`/formations/${result.id}`);
    } catch (error) {
      console.error('Error submitting formation:', error);
      toast.push('Error saving formation. Please try again.', {
        theme: {
          '--toastBackground': '#F56565',
          '--toastColor': 'white',
        }
      });
    }
  }

  // Update form when formation prop changes
  $: {
    if (formation?.id) {
      name.set(formation.name ?? '');
      brief_description.set(formation.brief_description ?? '');
      detailed_description.set(formation.detailed_description ?? '');
      tags.set(formation.tags ?? []);
      diagrams.set(parseDiagrams(formation.diagrams));
      is_editable_by_others.set(formation.is_editable_by_others ?? false);
      visibility.set(formation.visibility ?? 'public');
      formation_type.set(formation.formation_type ?? 'offense');
    }
  }

  // Restore form data after login
  onMount(() => {
    const pendingData = sessionStorage.getItem('pendingFormationData');
    if (pendingData) {
      const data = JSON.parse(pendingData);
      // Restore all the form values
      name.set(data.name);
      brief_description.set(data.brief_description);
      detailed_description.set(data.detailed_description);
      diagrams.set(parseDiagrams(data.diagrams));
      tags.set(data.tags);
      is_editable_by_others.set(data.is_editable_by_others);
      visibility.set(data.visibility);
      formation_type.set(data.formation_type || 'offense');

      // Clear the stored data
      sessionStorage.removeItem('pendingFormationData');
    }
  });
</script>

<svelte:head>
  <title>{formation.id ? 'Edit Formation' : 'Create Formation'}</title>
  <meta name="description" content={formation.id ? 'Edit an existing formation' : 'Create a new formation'} />
</svelte:head>

<section class="container mx-auto md:p-4 h-screen overflow-y-auto">
  <div class="flex flex-col h-full">
    <div class="flex flex-col md:flex-row flex-grow gap-4 transition-all duration-300 ease-in-out">
      <!-- Left Column: Form -->
      <div class="flex-1 min-w-0 md:p-4 border rounded-md transition-all duration-300 ease-in-out">
        <div class="max-w-lg mx-auto md:mx-auto p-4 md:p-0">
          <h1 class="text-2xl font-bold text-center mb-6">{formation.id ? 'Edit Formation' : 'Create Formation'}</h1>
          <form on:submit|preventDefault={handleSubmit} class="space-y-6">
            <div class="flex flex-col">
              <label for="name" class="mb-1 text-sm font-medium text-gray-700">Formation Name:</label>
              <input id="name" bind:value={$name} class="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {#if $errors.name}
              <p class="text-red-500 text-sm mt-1">{$errors.name}</p>
            {/if}

            <div class="flex flex-col">
              <label for="brief_description" class="mb-1 text-sm font-medium text-gray-700">Brief Description:</label>
              <p class="text-xs text-gray-500 mb-1">For display on the formation listings page</p>
              <input id="brief_description" bind:value={$brief_description} class="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {#if $errors.brief_description}
              <p class="text-red-500 text-sm mt-1">{$errors.brief_description}</p>
            {/if}

            <div class="flex flex-col">
              <label for="detailed_description" class="mb-1 text-sm font-medium text-gray-700">Detailed Description:</label>
              <p class="text-xs text-gray-500 mb-1">Explain the formation in detail</p>
              
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

            <!-- Tags Input -->
            <div class="flex flex-col">
              <label for="tags" class="mb-1 text-sm font-medium text-gray-700">Tags:</label>
              <p class="text-xs text-gray-500 mb-1">Add tags to categorize this formation (press Enter to add)</p>
              <div class="relative">
                <input
                  id="tags"
                  bind:value={$newTag}
                  on:keydown={handleTagKeydown}
                  placeholder="Add tags to categorize this formation"
                  class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <!-- Selected tags display -->
              <div class="flex flex-wrap gap-2 mt-2">
                {#each $tags as tag}
                  <span class="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full flex items-center">
                    {tag}
                    <button
                      type="button"
                      class="ml-1 text-blue-600 hover:text-blue-800"
                      on:click={() => removeTag(tag)}
                    >
                      ×
                    </button>
                  </span>
                {/each}
              </div>
            </div>

            <!-- Formation Type Setting -->
            <div class="flex flex-col">
              <label class="mb-1 text-sm font-medium text-gray-700">Formation Type:</label>
              <div class="flex items-center space-x-4">
                <label class="inline-flex items-center">
                  <input type="radio" bind:group={$formation_type} value="offense" class="form-radio text-blue-600" />
                  <span class="ml-2">Offense</span>
                </label>
                <label class="inline-flex items-center">
                  <input type="radio" bind:group={$formation_type} value="defense" class="form-radio text-blue-600" />
                  <span class="ml-2">Defense</span>
                </label>
              </div>
            </div>

            <!-- Visibility Setting -->
            <div class="flex flex-col">
              <label class="mb-1 text-sm font-medium text-gray-700">Visibility:</label>
              <div class="flex items-center space-x-4">
                <label class="inline-flex items-center">
                  <input type="radio" bind:group={$visibility} value="public" class="form-radio text-blue-600" />
                  <span class="ml-2">Public</span>
                </label>
                <label class="inline-flex items-center">
                  <input type="radio" bind:group={$visibility} value="unlisted" class="form-radio text-blue-600" />
                  <span class="ml-2">Unlisted</span>
                </label>
                <label class="inline-flex items-center">
                  <input type="radio" bind:group={$visibility} value="private" class="form-radio text-blue-600" />
                  <span class="ml-2">Private</span>
                </label>
              </div>
            </div>
            
            <!-- Editable by Others option -->
            <div class="flex items-center">
              <input 
                type="checkbox" 
                id="is_editable_by_others"
                bind:checked={$is_editable_by_others}
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label for="is_editable_by_others" class="ml-2 text-sm font-medium text-gray-700">
                Allow others to edit this formation
              </label>
            </div>

            <!-- Diagrams Section -->
            <div class="border rounded-md p-4 space-y-4">
              <h2 class="text-lg font-semibold">Diagrams</h2>
              <p class="text-sm text-gray-600">Add diagrams to visualize the formation</p>
              
              {#each $diagrams as diagram, i (i + '-' + diagramKey)}
                <div class="border rounded-md p-4 mt-4">
                  <div class="flex justify-between items-center mb-2">
                    <h3 class="text-md font-medium">Diagram {i + 1}</h3>
                    <div class="flex space-x-2">
                      <button 
                        type="button" 
                        class="px-2 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
                        on:click={() => duplicateDiagram(i)}
                      >
                        Duplicate
                      </button>
                      <button 
                        type="button" 
                        class="px-2 py-1 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
                        on:click={() => handleMoveUp(i)}
                        disabled={i === 0}
                      >
                        ↑
                      </button>
                      <button 
                        type="button" 
                        class="px-2 py-1 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
                        on:click={() => handleMoveDown(i)}
                        disabled={i === $diagrams.length - 1}
                      >
                        ↓
                      </button>
                      <button 
                        type="button" 
                        class="px-2 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                        on:click={() => deleteDiagram(i)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <ExcalidrawWrapper
                    data={diagram}
                    id={`diagram-${i}`}
                    index={i}
                    bind:this={diagramRefs[i]}
                    on:save={(event) => handleDiagramSave(event, i)}
                  />
                </div>
              {/each}
              
              <button
                type="button"
                class="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                on:click={() => {
                  showAddDiagramModal = true;
                }}
              >
                Add Diagram
              </button>
            </div>

            <div class="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md"
                on:click={() => goto('/formations')}
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                {formation.id ? 'Update Formation' : 'Create Formation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Add Diagram Modal -->
{#if showAddDiagramModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white p-6 rounded-lg w-96 max-w-md">
      <h2 class="text-xl font-bold mb-4">Add New Diagram</h2>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Template:</label>
        <div class="space-y-2">
          <label class="inline-flex items-center">
            <input type="radio" bind:group={selectedTemplate} value="blank" class="form-radio text-blue-600" />
            <span class="ml-2">Blank</span>
          </label>
          <label class="inline-flex items-center block">
            <input type="radio" bind:group={selectedTemplate} value="halfCourt" class="form-radio text-blue-600" />
            <span class="ml-2">Half Court</span>
          </label>
          <label class="inline-flex items-center block">
            <input type="radio" bind:group={selectedTemplate} value="fullCourt" class="form-radio text-blue-600" />
            <span class="ml-2">Full Court</span>
          </label>
        </div>
      </div>
      
      <div class="flex justify-end space-x-4">
        <button
          type="button"
          class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md"
          on:click={() => {
            showAddDiagramModal = false;
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          on:click={addDiagram}
        >
          Add
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .selected {
    @apply bg-blue-500 text-white border-blue-500;
  }
</style>