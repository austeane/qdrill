<script>
  import { writable } from 'svelte/store';
  import { cart } from '$lib/stores/cartStore';
  import { goto } from '$app/navigation';
  import { toast } from '@zerodevx/svelte-toast';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  // Add Editor import
  let Editor;
  import ParallelGroup from '$components/practice-plans/ParallelGroup.svelte';

  // Add proper prop definitions with defaults
  export let practicePlan = null;
  logState('Received practicePlan', practicePlan);

  // Add timeline selection state
  let showTimelineSelector = false;
  let selectedSectionId = null;
  let selectedTimelines = new Set(['BEATERS', 'CHASERS']); // Default timelines

  // Add timeline constants
  const PARALLEL_TIMELINES = {
    BEATERS: { name: 'Beaters', color: 'bg-gray-500' },
    CHASERS: { name: 'Chasers', color: 'bg-green-500' },
    SEEKERS: { name: 'Seekers', color: 'bg-yellow-500' }
  };

  // Initialize stores more efficiently
  let planName = writable('');
  let planDescription = writable('');
  let phaseOfSeason = writable('');
  let estimatedNumberOfParticipants = writable('');
  let practiceGoals = writable(['']);
  let visibility = writable('public');
  let isEditableByOthers = writable(false);
  const selectedItems = writable([]);

  // Add startTime store initialization with other store initializations
  let startTime = writable('09:00'); // Default to 9 AM


  // Add logging for debugging
  function simplifyForLogging(obj) {
    if (Array.isArray(obj)) {
      return obj.map(simplifyForLogging);
    }
    if (obj && typeof obj === 'object') {
      // If this is a drill item, return only essential fields
      if (obj.type === 'drill') {
        return {
          id: obj.id || obj.drill?.id,
          type: obj.type,
          name: obj.name || obj.drill?.name,
          duration: obj.duration || obj.selected_duration
        };
      }
      // For section objects (and similar) that include drill items
      if (Array.isArray(obj.items)) {
        return {
          id: obj.id,
          name: obj.name,
          order: obj.order,
          goals: obj.goals,
          notes: obj.notes,
          items: simplifyForLogging(obj.items)
        };
      }
      // For any other object, only keep a few allowed keys
      const allowedKeys = ['id', 'name', 'order', 'goals', 'notes', 'type', 'duration', 'selected_duration'];
      const simplified = {};
      for (const key in obj) {
        if (allowedKeys.includes(key)) {
          simplified[key] = simplifyForLogging(obj[key]);
        }
      }
      return simplified;
    }
    return obj;
  }

  function logState(message, data) {
    try {
      let sanitizedData = data;
      if (typeof data === 'object' && data !== null) {
        sanitizedData = simplifyForLogging(data);
        // Convert to string for logging
        sanitizedData = JSON.parse(JSON.stringify(sanitizedData));
      }
      console.log(
        `[PracticePlanForm] ${message}:`,
        typeof sanitizedData === 'object'
          ? JSON.stringify(sanitizedData, null, 2)
          : sanitizedData
      );
    } catch (err) {
      console.log(
        `[PracticePlanForm] ${message}: [Unable to stringify data]`,
        typeof data === 'object' ? '[Complex object]' : data
      );
    }
  }

  // Add this at the top of your script
  let sectionCounter = 0;

  const DEFAULT_SECTIONS = [
    {
      id: `section-${++sectionCounter}`,
      name: 'Warmup',
      order: 0,
      goals: [],
      notes: '',
      items: []
    },
    {
      id: `section-${++sectionCounter}`,
      name: 'Skill Building',
      order: 1,
      goals: [],
      notes: '',
      items: []
    },
    {
      id: `section-${++sectionCounter}`,
      name: 'Half Court',
      order: 2,
      goals: [],
      notes: '',
      items: []
    }
  ];

  let sections = writable(DEFAULT_SECTIONS);

  // ====================
  // NEW INITIALIZATION GUARDS
  // ====================
  let formInitialized = false;
  let initialLoadComplete = false;

  // ====================
  // Guarded initialization using practicePlan (runs only once)
  // ====================
  $: if (practicePlan && !formInitialized) {
    console.log('[DEBUG] Initializing form with practice plan data', practicePlan);
    
    // Add detailed logging of raw data
    rawLog('Raw practicePlan sections', practicePlan.sections);
    
    // Log items that should have parallel groups
    if (practicePlan.sections) {
      practicePlan.sections.forEach(section => {
        const parallelItems = section.items.filter(item => item.parallel_group_id);
        if (parallelItems.length > 0) {
          console.log(`[DEBUG] Section ${section.id} parallel items:`, 
            parallelItems.map(item => ({
              id: item.id,
              parallel_group_id: item.parallel_group_id,
              parallel_timeline: item.parallel_timeline,
              groupTimelines: item.groupTimelines,
              group_timelines: item.group_timelines
            }))
          );
        }
      });
    }

    // Initialize form fields from practicePlan only once
    planName.set(practicePlan.name || '');
    planDescription.set(practicePlan.description || '');
    phaseOfSeason.set(practicePlan.phase_of_season || '');
    estimatedNumberOfParticipants.set(practicePlan.estimated_number_of_participants?.toString() || '');
    practiceGoals.set(practicePlan.practice_goals || ['']);
    visibility.set(practicePlan.visibility || 'public');
    isEditableByOthers.set(practicePlan.is_editable_by_others || false);
    startTime.set(practicePlan.start_time?.slice(0, 5) || '09:00');

    // Normalize returned groupTimelines to ensure we use the camelCase value
    if (practicePlan && practicePlan.sections) {
      practicePlan.sections.forEach(section => {
        section.items.forEach(item => {
          item.groupTimelines = item.groupTimelines || item.group_timelines;
        });
      });
    }

    if (practicePlan.sections?.length) {
      // First, collect all parallel groups and their timelines
      const parallelGroups = new Map();
      practicePlan.sections.forEach(section => {
        section.items.forEach(item => {
          if (item.parallel_group_id) {
            if (!parallelGroups.has(item.parallel_group_id)) {
              parallelGroups.set(item.parallel_group_id, new Set());
            }

            if (Array.isArray(item.groupTimelines) && item.groupTimelines.length > 0) {
              item.groupTimelines.forEach(t => parallelGroups.get(item.parallel_group_id).add(t));
            } else if (item.parallel_timeline) {
              parallelGroups.get(item.parallel_group_id).add(item.parallel_timeline);
            }
          }
        });
      });

      // Now set the sections with transformed items
      sections.set(practicePlan.sections.map(section => ({
        id: section.id,
        name: section.name,
        order: section.order,
        goals: section.goals || [],
        notes: section.notes || '',
        items: transformToGroupStructure(section.items.map(item => ({
          ...item,
          // Ensure each grouped item has the complete set of timelines
          ...(item.parallel_group_id && {
            groupTimelines: Array.from(parallelGroups.get(item.parallel_group_id) || [])
          })
        })))
      })));

      logState('DEBUG] Initialized sections with groups', $sections);
    }

    formInitialized = true;
  }

  // ====================
  // Updated reactive statement for $selectedItems refresh
  // ====================
  $: {
    if ($selectedItems?.length > 0) {
      logState('DEBUG] selectedItems reactive running, length:', $selectedItems.length);

      if (!initialLoadComplete) {
        logState('DEBUG] Doing initial load from selectedItems');
        sections.update(currentSections => {
          const newSections = currentSections.map(section => ({
            ...section,
            // Filter items by section_id instead of assigning all to Skill Building.
            items: $selectedItems
              .filter(item => item.section_id === section.id)
              .map(item => ({
                id: item.drill?.id || item.id,
                type: item.type,
                name: item.drill?.name || item.name,
                duration: item.selected_duration || item.drill?.duration || 15,
                drill: item.drill,
                selected_duration: item.selected_duration || item.drill?.duration || 15,
                parallel_group_id: item.parallel_group_id,
                parallel_timeline: item.parallel_timeline,
                groupTimelines: item.groupTimelines,
                skill_level: item.drill?.skill_level || [],
                skills_focused_on: item.drill?.skills_focused_on || [],
                brief_description: item.drill?.brief_description || '',
                video_link: item.drill?.video_link || null,
                diagrams: item.drill?.diagrams || []
              }))
          }));
          logState('DEBUG] After initial load from selectedItems', newSections);
          return newSections;
        });
        initialLoadComplete = true;
      } else {
        // For subsequent updates: create an update to individual drill data.
        logState('DEBUG] Checking for drill data updates from $selectedItems');
        sections.update(currentSections => {
          return currentSections.map(section => ({
            ...section,
            items: section.items.map(item => {
              const selectedItem = $selectedItems.find(
                si => si.id === item.id || si.drill?.id === item.id
              );
              if (
                selectedItem &&
                selectedItem.drill &&
                (item.name !== selectedItem.drill.name ||
                  item.brief_description !== selectedItem.drill.brief_description)
              ) {
                logState('DEBUG] Updating drill data for:', item.id);
                return {
                  ...item,
                  name: selectedItem.drill.name,
                  brief_description: selectedItem.drill.brief_description,
                  drill: selectedItem.drill
                };
              }
              return item;
            })
          }));
        });
      }
    }
  }

  // ====================
  // Updated drop handler logging
  // ====================
  function handleDrop(e, sectionIndex, itemIndex) {
    e.preventDefault();
    
    if (!draggedItem) return;

    sections.update(currentSections => {
      const newSections = [...currentSections];
      const sourceSection = newSections[draggedItem.sectionIndex];
      const targetSection = newSections[sectionIndex];
      
      // Move the item (whether it's a group or single drill)
      const [movedItem] = sourceSection.items.splice(draggedItem.itemIndex, 1);
      const insertIndex = dragOverPosition === 'bottom' ? itemIndex + 1 : itemIndex;
      targetSection.items.splice(insertIndex, 0, movedItem);
      
      return newSections;
    });

    draggedItem = null;
    dragOverPosition = null;
  }


  // Add this new function before the reactive statement
  function formatDrillItem(item, sectionId) {
    logState('DEBUG] formatDrillItem - input item:', {
      id: item.id,
      parallel_group_id: item.parallel_group_id,
      parallel_timeline: item.parallel_timeline,
      groupTimelines: item.groupTimelines || item.group_timelines
    });

    const base = {
      id: item.drill?.id || item.id,
      type: item.type,
      name: item.drill?.name || item.name,
      duration: item.duration,
      drill: item.drill,
      selected_duration: item.duration,
      parallel_group_id: item.parallel_group_id,
      parallel_timeline: item.parallel_timeline,
      diagram_data: item.diagram_data,
      skill_level: item.drill?.skill_level || [],
      skills_focused_on: item.drill?.skills_focused_on || [],
      brief_description: item.drill?.brief_description || '',
      video_link: item.drill?.video_link || null,
      diagrams: item.drill?.diagrams || [],
      section_id: sectionId
    };

    if (item.parallel_group_id) {
      // First check for groupTimelines (either camelCase or snake_case)
      if (Array.isArray(item.groupTimelines) && item.groupTimelines.length > 0) {
        base.groupTimelines = item.groupTimelines;
      } else if (Array.isArray(item.group_timelines) && item.group_timelines.length > 0) {
        base.groupTimelines = item.group_timelines;
      } else {
        // If no groupTimelines, create an array with at least the parallel_timeline
        const timelines = new Set();
        if (item.parallel_timeline) {
          timelines.add(item.parallel_timeline);
        }
        // Convert back to array
        base.groupTimelines = Array.from(timelines);
      }
    } else {
      base.groupTimelines = null;
    }

    logState('DEBUG] formatDrillItem - output base:', {
      id: base.id,
      parallel_group_id: base.parallel_group_id,
      parallel_timeline: base.parallel_timeline,
      groupTimelines: base.groupTimelines
    });

    return base;
  }

  // Add this new function before the reactive statement
  function initializeTimelinesFromPlan(plan) {
    if (!plan?.sections) return;
    
    const allTimelines = new Set();
    plan.sections.forEach(section => {
      section.items.forEach(item => {
        // Add parallel_timeline if it exists
        if (item.parallel_timeline) {
          allTimelines.add(item.parallel_timeline);
        }
        // Add all timelines from groupTimelines if they exist
        if (Array.isArray(item.groupTimelines)) {
          item.groupTimelines.forEach(timeline => allTimelines.add(timeline));
        }
        // Also check snake_case version
        if (Array.isArray(item.group_timelines)) {
          item.group_timelines.forEach(timeline => allTimelines.add(timeline));
        }
      });
    });
    
    if (allTimelines.size > 0) {
      selectedTimelines = allTimelines;
      rawLog('Initialized selectedTimelines from plan', Array.from(selectedTimelines));
    }
  }

  // Add this to onMount
  onMount(async () => {
    if ($cart.length === 0) {
        showEmptyCartModal = true;
    }
    if (!practicePlan) {
        const cartItems = $cart.map(drill => ({
            id: drill.id,
            type: 'drill',
            name: drill.name,
            drill: drill,
            expanded: false,
            selected_duration: 15,
            diagram_data: null,
            parallel_group_id: null
        }));
        selectedItems.set(cartItems);
    } else {
        // Initialize timelines once when component loads
        initializeTimelinesFromPlan(practicePlan);
    }

    // Load TinyMCE Editor
    try {
        logState('Loading TinyMCE editor...');
        const module = await import('@tinymce/tinymce-svelte');
        Editor = module.default;
        logState('TinyMCE editor loaded successfully');
    } catch (error) {
        logState('Error loading TinyMCE', error);
    }
  });

  let isSubmitting = writable(false);
  let errors = writable({});

  // New Fields
  let phaseOfSeasonOptions = [
    'Offseason',
    'Early season, new players',
    'Mid season, skill building',
    'Tournament tuneup',
    'End of season, peaking'
  ];

  let showEmptyCartModal = false;

  // Add these variables to track drag state
  let draggedItem = null; // For single drills
  let draggedGroup = null; // For parallel groups
  let dragOverPosition = null;

  let draggedSection = null;
  let dragOverSection = null;
  let sectionDragPosition = null; // 'top' or 'bottom'

  let showDrillSearch = false;
  let searchQuery = '';
  let searchResults = [];
  let selectedSectionForDrill = null;

  function closeModal() {
    showEmptyCartModal = false;
  }

  function goToDrills() {
    goto('/drills');
  }

  async function submitPlan() {
    try {
      logState('Starting plan submission');
      
      const formValues = {
        planName: String($planName || ''),
        planDescription: String($planDescription || ''),
        phaseOfSeason: String($phaseOfSeason || ''),
        estimatedParticipants: String($estimatedNumberOfParticipants || ''),
        practiceGoals: $practiceGoals.map(goal => String(goal || '')),
        visibility: String($visibility || 'public'),
        isEditableByOthers: Boolean($isEditableByOthers),
        sectionsCount: Number($sections.length)
      };
      
      logState('Initial form values', formValues);

      errors.set({});
      if (!$planName) {
        errors.update(e => ({ ...e, planName: 'Plan name is required' }));
        return;
      }

      const totalItems = $sections.reduce((total, section) => 
        total + (section.items?.length || 0), 0);
      if (totalItems === 0) {
        errors.update(e => ({ ...e, selectedItems: 'At least one drill or break is required' }));
        return;
      }

      if ($phaseOfSeason && !phaseOfSeasonOptions.includes($phaseOfSeason)) {
        errors.update(e => ({ ...e, phaseOfSeason: 'Invalid phase of season selected' }));
        return;
      }

      if ($estimatedNumberOfParticipants !== '') {
        const numParticipants = parseInt($estimatedNumberOfParticipants, 10);
        if (isNaN(numParticipants) || numParticipants <= 0 || !Number.isInteger(parseFloat($estimatedNumberOfParticipants))) {
          errors.update(e => ({ ...e, estimatedNumberOfParticipants: 'Estimated number of participants must be a positive integer' }));
          return;
        }
      }

      isSubmitting.set(true);

      const planData = {
        name: $planName,
        description: $planDescription,
        phase_of_season: $phaseOfSeason || null,
        estimated_number_of_participants: $estimatedNumberOfParticipants ? parseInt($estimatedNumberOfParticipants) : null,
        practice_goals: $practiceGoals.filter(goal => goal.trim() !== ''),
        visibility: $visibility,
        is_editable_by_others: $isEditableByOthers,
        start_time: $startTime + ':00',
        sections: $sections.map(section => ({
          id: section.id,
          name: section.name,
          order: section.order,
          goals: section.goals || [],
          notes: section.notes || '',
          items: normalizeItems(section.items)
        }))
      };

      logState('Plan data before stringify', planData);

      const url = practicePlan ? `/api/practice-plans/${practicePlan.id}` : '/api/practice-plans';
      const method = practicePlan ? 'PUT' : 'POST';

      logState('Sending request', { url, method });

      try {
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(planData)
        });

        logState('Response status', response.status);

        if (!response.ok) {
          let errorData;
          const errorText = await response.text();
          logState('Error response text', errorText);

          try {
            errorData = JSON.parse(errorText);
            logState('Parsed error data', errorData);
          } catch (e) {
            logState('Failed to parse error response', String(e));
            errorData = { error: String(errorText) };
          }
          
          const errorMessage = errorData.errors 
            ? Object.values(errorData.errors).join(', ')
            : errorData.error || 'An error occurred while saving the practice plan';
          
          logState('Final error message', errorMessage);
          errors.set({ general: errorMessage });
          toast.push('Failed to save practice plan: ' + errorMessage, { 
            theme: { '--toastBackground': 'red' } 
          });
          return;
        }

        const data = await response.json();
        logState('Success response', data);

        if (!practicePlan) {
          cart.clear();
        }
        toast.push(`Practice plan ${practicePlan ? 'updated' : 'created'} successfully`);
        goto(`/practice-plans/${data.id}`);
      } catch (error) {
        logState('Network or parsing error', error);
        throw error; // Re-throw to be caught by outer try-catch
      }
    } catch (error) {
      logState('Error', String(error));
      logState('Error stack', String(error.stack || ''));
      errors.set({ general: 'An unexpected error occurred' });
      toast.push('An unexpected error occurred', { theme: { '--toastBackground': 'red' } });
    } finally {
      isSubmitting.set(false);
    }
  }

  function removeItem(sectionIndex, itemIndex) {
    sections.update(currentSections => {
      const newSections = [...currentSections];
      const section = newSections[sectionIndex];
      const itemToRemove = section.items[itemIndex];
      
      // Remove the item from the section
      section.items.splice(itemIndex, 1);
      
      // If the removed item was part of a group, check remaining group size
      if (itemToRemove.parallel_group_id) {
        const remainingGroupItems = section.items.filter(
          item => item.parallel_group_id === itemToRemove.parallel_group_id
        );
        
        // If only one item remains in the group, remove the group
        if (remainingGroupItems.length === 1) {
          section.items = section.items.map(item => {
            if (item.parallel_group_id === itemToRemove.parallel_group_id) {
              const { parallel_group_id, ...rest } = item;
              return {
                ...rest,
                id: item.drill?.id || item.id,
                drill: item.drill || { id: item.id, name: item.name }
              };
            }
            return item;
          });
        }
      }
      
      return newSections;
    });
  }

  function addBreak(sectionId) {
    sections.update(currentSections => {
      const newSections = [...currentSections];
      const sectionIndex = newSections.findIndex(s => s.id === sectionId);
      if (sectionIndex === -1) return currentSections;
      
      const section = newSections[sectionIndex];
      
      // Create new break item
      const breakItem = {
        id: `break-${Date.now()}`,
        type: 'break',
        name: 'Break',
        duration: 10,
        selected_duration: 10
      };
      
      // Add break to end of section
      section.items.push(breakItem);
      
      return newSections;
    });
  }

  function handleDurationChange(sectionIndex, itemIndex, newDuration) {
    logState('Updating duration', { sectionIndex, itemIndex, newDuration });
    
    // Validate the duration - allow empty string during editing
    if (newDuration === '' || (newDuration >= 1 && newDuration <= 120)) {
      sections.update(currentSections => {
        const newSections = [...currentSections];
        const section = newSections[sectionIndex];
        const item = section.items[itemIndex];

        if (item.type === 'break') {
          // For breaks, update the duration directly
          section.items[itemIndex] = {
            ...item,
            duration: newDuration || item.duration,
            selected_duration: newDuration || item.duration
          };
        } else if (item.parallel_group_id) {
          // For a drill in a parallel group, update only the current drill
          section.items[itemIndex] = {
            ...item,
            selected_duration: newDuration || item.duration,
            duration: newDuration || item.duration
          };
        } else {
          // For single drills, update normally
          section.items[itemIndex] = {
            ...item,
            selected_duration: newDuration || item.duration,
            duration: newDuration || item.duration
          };
        }

        return newSections;
      });
    }
  }

  // Functions to manage Practice Goals
  function addPracticeGoal() {
    practiceGoals.update(goals => [...goals, '']);
  }

  function removePracticeGoal(index) {
    practiceGoals.update(goals => goals.filter((_, i) => i !== index));
  }

  function updatePracticeGoal(index, value) {
    practiceGoals.update(goals => goals.map((goal, i) => (i === index ? value : goal)));
  }


  // Replace the existing drag handling functions with these updated versions
  function handleDragStart(e, sectionIndex, itemIndex) {
    draggedItem = { sectionIndex, itemIndex };
    e.dataTransfer.effectAllowed = 'move';
  }

  // Update handleDragOver to be more forgiving
  function handleDragOver(e, sectionIndex, itemIndex) {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    dragOverPosition = y < rect.height / 2 ? 'top' : 'bottom';
  }

  function handleDragLeave(e) {
    e.currentTarget.classList.remove(
      'bg-blue-100',
      'scale-95',
      'transform',
      'border-t-4',
      'border-t-blue-500',
      'border-b-4',
      'border-b-blue-500'
    );
    dragOverPosition = null;
  }


  // Make sure the drills are being rendered in the template
  $: logState('Current selectedItems in template', $selectedItems);

  // Add section management functions
  function addSection() {
    sections.update(currentSections => [
      ...currentSections,
      {
        id: `section-${++sectionCounter}`,
        name: 'New Section',
        order: currentSections.length,
        goals: [],
        notes: '',
        items: []
      }
    ]);
  }

  function removeSection(sectionId) {
    sections.update(currentSections => {
      const filteredSections = currentSections.filter(s => s.id !== sectionId);
      // Reassign orders
      return filteredSections.map((s, i) => ({ ...s, order: i }));
    });
  }


  // Add this reactive statement near your other reactive statements
  $: {
    if (!$page.data.session) {
      visibility.set('public');
      isEditableByOthers.set(true);
    }
  }

  // Add this function to handle section reordering
  function handleSectionDragStart(e, sectionIndex) {
    draggedSection = sectionIndex;
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleSectionDragOver(e, sectionIndex) {
    e.preventDefault();
    if (draggedSection === null || draggedSection === sectionIndex) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    // Determine if we're in the top or bottom half
    sectionDragPosition = y < rect.height / 2 ? 'top' : 'bottom';
    dragOverSection = sectionIndex;

    // Remove existing indicators
    e.currentTarget.classList.remove('border-t-4', 'border-b-4');
    
    // Add visual indicator
    if (sectionDragPosition === 'top') {
      e.currentTarget.classList.add('border-t-4');
    } else {
      e.currentTarget.classList.add('border-b-4');
    }
  }

  function handleSectionDragLeave(e) {
    e.currentTarget.classList.remove('border-t-4', 'border-b-4');
    dragOverSection = null;
    sectionDragPosition = null;
  }

  function handleSectionDrop(e, sectionIndex) {
    e.preventDefault();
    e.currentTarget.classList.remove('border-t-4', 'border-b-4');

    if (draggedSection === null || draggedSection === sectionIndex) return;

    sections.update(currentSections => {
      const newSections = [...currentSections];
      const [movedSection] = newSections.splice(draggedSection, 1);
      
      // Calculate insert position
      let insertIndex = sectionIndex;
      if (sectionDragPosition === 'bottom') {
        insertIndex++;
      }
      // Adjust index if we're moving to a later position
      if (draggedSection < sectionIndex) {
        insertIndex--;
      }
      
      newSections.splice(insertIndex, 0, movedSection);
      
      // Update order property for all sections
      return newSections.map((section, index) => ({
        ...section,
        order: index
      }));
    });

    draggedSection = null;
    dragOverSection = null;
    sectionDragPosition = null;
  }

  // Add the new normalizeItems helper function
  function normalizeItems(sectionItems) {
    const normalized = [];
    
    for (const item of sectionItems) {
      if (item.type === 'group') {
        // Flatten group data into multiple items with parallel_group_id
        const groupId = item.groupData.id;
        item.groupData.timelines.forEach(timeline => {
          timeline.drills.forEach(drill => {
            normalized.push({
              id: drill.id,
              type: 'drill',
              name: drill.name,
              duration: parseInt(drill.selected_duration || drill.duration, 10),
              drill_id: drill.drill?.id || drill.id,
              diagram_data: drill.diagram_data || null,
              parallel_group_id: groupId,
              parallel_timeline: timeline.id,
              groupTimelines: item.groupData.groupTimelines
            });
          });
        });
      } else {
        // Handle single items (drills or breaks)
        normalized.push({
          id: item.drill?.id || item.id,
          type: item.type,
          name: item.drill?.name || item.name,
          duration: parseInt(item.selected_duration || item.duration, 10),
          drill_id: item.type === 'drill' ? (item.drill?.id || item.id) : null,
          diagram_data: item.diagram_data || null,
          parallel_group_id: null,
          parallel_timeline: null
        });
      }
    }
    return normalized;
  }

  // Add a helper function to calculate block duration
  function getParallelBlockDuration(items, groupId) {
    if (!groupId) return 0;
    
    const groupItems = items.filter(item => item.parallel_group_id === groupId);
    if (!groupItems.length) return 0;

    // Get all unique timelines in this group
    const timelines = new Set(groupItems.map(item => item.parallel_timeline));
    
    // Calculate total duration for each timeline
    const timelineDurations = Array.from(timelines).map(timeline => {
      const timelineItems = groupItems.filter(item => item.parallel_timeline === timeline);
      return timelineItems.reduce((total, item) => 
        total + (parseInt(item.selected_duration || item.duration, 10) || 0), 0
      );
    });

    // Return the maximum duration across all timelines
    return Math.max(...timelineDurations);
  }

  // Add drill search functionality
  async function searchDrills(query) {
    const response = await fetch(`/api/drills/search?query=${encodeURIComponent(query)}`);
    if (response.ok) {
      searchResults = await response.json();
    } else {
      console.error('Failed to search drills');
      searchResults = [];
    }
  }

  // Replace old addDrillToPlan with new handleAddDrill
  function handleAddDrill(drill, sectionId) {
    sections.update(currentSections => {
      const newSections = [...currentSections];
      const targetSection = newSections.find(s => s.id === sectionId);
      
      if (targetSection) {
        const newDrill = {
          id: drill.id,
          type: 'drill',
          name: drill.name,
          drill: drill,
          duration: 15,
          selected_duration: 15
        };
        
        targetSection.items = [...targetSection.items, newDrill];
        
        // Add success toast notification
        toast.push(`Added "${drill.name}" to ${targetSection.name}`, {
          theme: {
            '--toastBackground': '#4CAF50',
            '--toastColor': 'white'
          }
        });
      }
      
      return newSections;
    });
    
    showDrillSearch = false;
    searchQuery = '';
    searchResults = [];
    selectedSectionForDrill = null;
  }

  // Add new function to handle empty section drops
  function handleEmptySectionDrop(e, sectionIndex) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedItem) return;
    
    sections.update(currentSections => {
      const newSections = [...currentSections];
      const sourceSection = newSections[draggedItem.sectionIndex];
      const targetSection = newSections[sectionIndex];
      
      if (!sourceSection || !targetSection) return currentSections;
      
      // Remove item from source section
      const [movedItem] = sourceSection.items.splice(draggedItem.itemIndex, 1);
      
      // Add to target section
      targetSection.items.push(movedItem);
      
      return newSections;
    });
    
    draggedItem = null;
    dragOverItem = null;
    dragOverPosition = null;
  }

  // Add this function to create a parallel block
  function createParallelBlock() {
    if (!selectedSectionId) return;
    
    if (selectedTimelines.size < 2) {
      toast.push('Please select at least two timelines');
      return;
    }

    sections.update(currentSections => {
      const section = currentSections.find(s => s.id === selectedSectionId);
      if (!section) return currentSections;

      const groupId = `group_${Date.now()}`;
      const groupTimelines = Array.from(selectedTimelines);

      // Create empty group with placeholders
      const groupItem = {
        id: groupId,
        type: 'group',
        groupData: {
          id: groupId,
          timelines: groupTimelines.map(timelineId => ({
            id: timelineId,
            drills: []
          })),
          groupTimelines
        }
      };
      
      section.items.push(groupItem);
      return currentSections;
    });

    toast.push('Created parallel block. Drag drills into each timeline.');
  }

  // Add this new function to update a block's timelines
  function updateParallelBlockTimelines(sectionId, parallelGroupId, newTimelines) {
    sections.update(currentSections => {
      return currentSections.map(section => {
        if (section.id !== sectionId) return section;

        // Get all items in this group
        const groupItems = section.items.filter(item => 
          item.parallel_group_id === parallelGroupId
        );

        // Get timelines that are being removed
        const removedTimelines = groupItems
          .map(item => item.parallel_timeline)
          .filter(timeline => !newTimelines.includes(timeline));

        // Update items
        const updatedItems = section.items.filter(item => {
          // Remove items from timelines that are being removed
          if (item.parallel_group_id === parallelGroupId && 
              removedTimelines.includes(item.parallel_timeline)) {
            return false;
          }
          return true;
        }).map(item => {
          // Update groupTimelines for all items in the group
          if (item.parallel_group_id === parallelGroupId) {
            return {
              ...item,
              groupTimelines: newTimelines
            };
          }
          return item;
        });

        // Add placeholder drills for new timelines
        const existingTimelines = groupItems.map(item => item.parallel_timeline);
        const newTimelinesToAdd = newTimelines.filter(t => !existingTimelines.includes(t));

        const newPlaceholders = newTimelinesToAdd.map(timeline => ({
          id: `placeholder_${timeline}_${Date.now()}`,
          type: 'break',
          name: `${PARALLEL_TIMELINES[timeline].name} Drill`,
          duration: 15,
          selected_duration: 15,
          parallel_group_id: parallelGroupId,
          parallel_timeline: timeline,
          groupTimelines: newTimelines
        }));

        return {
          ...section,
          items: [...updatedItems, ...newPlaceholders]
        };
      });
    });
  }

  // Update the timeline selector to use the new function
  function handleTimelineSelect(sectionId, parallelGroupId) {
    showTimelineSelector = true;
    selectedSectionId = sectionId;
    
    // Initialize selectedTimelines with the block's current timelines
    const section = $sections.find(s => s.id === sectionId);
    const blockItem = section?.items.find(i => i.parallel_group_id === parallelGroupId);
    if (blockItem?.groupTimelines) {
      selectedTimelines = new Set(blockItem.groupTimelines);
    }
  }

  // Update the timeline selector's save button
  function handleTimelineSave() {
    if (selectedTimelines.size < 2) {
      toast.push('Please select at least two timelines');
      return;
    }

    if (selectedSectionId) {
      const section = $sections.find(s => s.id === selectedSectionId);
      const parallelGroupId = section?.items.find(i => i.parallel_group_id)?.parallel_group_id;
      
      if (parallelGroupId) {
        // Updating existing block
        updateParallelBlockTimelines(selectedSectionId, parallelGroupId, Array.from(selectedTimelines));
      } else {
        // Creating new block
        createParallelBlock();
      }
    }

    showTimelineSelector = false;
    selectedSectionId = null;
  }

  // Update timeline duration calculation function
  function calculateTimelineDurations(items, groupId) {
    if (!groupId) return {};
    
    // Get all items in this specific parallel group
    const groupItems = items.filter(item => item.parallel_group_id === groupId);
    if (groupItems.length === 0) return {};
    
    // Get the timelines that are actually used in this group
    const firstItem = groupItems[0];
    const groupTimelines = firstItem?.groupTimelines || [];
    
    // Calculate duration for each timeline in this group
    const durations = {};
    groupTimelines.forEach(timeline => {
      const timelineItems = groupItems.filter(item => item.parallel_timeline === timeline);
      durations[timeline] = timelineItems.reduce((total, item) => 
        total + (parseInt(item.selected_duration) || parseInt(item.duration) || 0), 0
      );
    });

    // Find the maximum duration among the timelines in this group
    const maxDuration = Math.max(...Object.values(durations));
    
    // Check for mismatches only within this group's timelines
    const mismatches = [];
    Object.entries(durations).forEach(([timeline, duration]) => {
      if (duration < maxDuration) {
        mismatches.push({
          timeline,
          difference: maxDuration - duration
        });
      }
    });

    // If there are mismatches, send a single consolidated warning for this group
    if (mismatches.length > 0) {
      const warningMessage = mismatches
        .map(({ timeline, difference }) => 
          `${PARALLEL_TIMELINES[timeline].name} (${difference}min shorter)`
        )
        .join(', ');

      toast.push(`Timeline duration mismatch in group: ${warningMessage}`, {
        theme: {
          '--toastBackground': '#FFA500',
          '--toastColor': 'black'
        }
      });
    }

    return durations;
  }

  // Update the reactive statement to check durations per group
  $: {
    sections.subscribe(currentSections => {
      currentSections.forEach(section => {
        // Get unique parallel group IDs in this section
        const parallelGroups = new Set(
          section.items
            .filter(item => item.parallel_group_id)
            .map(item => item.parallel_group_id)
        );

        // Calculate durations for each parallel group separately
        parallelGroups.forEach(groupId => {
          calculateTimelineDurations(section.items, groupId);
        });
      });
    });
  }

  // AFTER: Instead of reading from $selectedItems, update only the section's own items.
  $: {
    sections.update(currentSections =>
      currentSections.map(section => {
        if (section.name === 'Skill Building') {
          return {
            ...section,
            items: section.items.map(item => ({
              ...item,
              id: item.drill?.id || item.id // ensure we have the proper id
            }))
          };
        }
        return section;
      })
    );
  }

  // (Optional) You can also add a helper function to log the rendering of timeline columns:
  function logTimelineRender(timeline, groupTimelines) {
    console.log('[DEBUG] Rendering timeline column:', timeline, 'with block-specific groupTimelines:', groupTimelines);
    return timeline;
  }

  // Add new function to add timeline to existing parallel group
  function addTimelineToGroup(sectionId, parallelGroupId) {
    sections.update(currentSections => {
      const section = currentSections.find(s => s.id === sectionId);
      if (!section) return currentSections;

      // Find an existing item in the group to get current timelines
      const groupItem = section.items.find(item => item.parallel_group_id === parallelGroupId);
      if (!groupItem?.groupTimelines) return currentSections;

      // Show timeline selector modal with current group's configuration
      selectedTimelines = new Set(groupItem.groupTimelines);
      selectedSectionId = sectionId;
      showTimelineSelector = true;

      return currentSections;
    });
  }

  // Add new function to remove timeline from group
  function removeTimelineFromGroup(sectionId, parallelGroupId, timeline) {
    sections.update(currentSections => {
      const section = currentSections.find(s => s.id === sectionId);
      if (!section) return currentSections;

      // Find items in this timeline
      const timelineItems = section.items.filter(item => 
        item.parallel_group_id === parallelGroupId && 
        item.parallel_timeline === timeline
      );

      // If this is the last or second-to-last timeline, ungroup everything
      const groupItems = section.items.filter(item => item.parallel_group_id === parallelGroupId);
      if (groupItems.length <= 2) {
        return currentSections.map(s => ({
          ...s,
          items: s.items.map(item => {
            if (item.parallel_group_id === parallelGroupId) {
              const { parallel_group_id, parallel_timeline, groupTimelines, ...rest } = item;
              return rest;
            }
            return item;
          })
        }));
      }

      // Remove items from this timeline
      return currentSections.map(s => ({
        ...s,
        items: s.items.filter(item => 
          !(item.parallel_group_id === parallelGroupId && item.parallel_timeline === timeline)
        ).map(item => {
          // Update groupTimelines for remaining items in the group
          if (item.parallel_group_id === parallelGroupId) {
            return {
              ...item,
              groupTimelines: item.groupTimelines.filter(t => t !== timeline)
            };
          }
          return item;
        })
      }));
    });

    toast.push(`Removed ${PARALLEL_TIMELINES[timeline].name} timeline`);
  }

  // Update the template to add timeline management buttons


  // Add these new group drag handler functions
  function handleGroupDragStart(e, sectionIndex, groupId) {
    logState('DEBUG] Group drag start:', { sectionIndex, groupId });
    draggedGroup = { sectionIndex, groupId };
    draggedItem = null; // Clear any item drag state
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ sectionIndex, groupId }));
  }

  function handleGroupDragOver(e, sectionIndex, groupId) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedGroup) return;
    
    const targetElement = e.currentTarget;
    const rect = targetElement.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    // Clear previous indicators
    targetElement.classList.remove(
      'border-t-4', 'border-t-blue-500',
      'border-b-4', 'border-b-blue-500'
    );
    
    // Show drop position indicator
    if (y < rect.height / 2) {
      dragOverPosition = 'top';
      targetElement.classList.add('border-t-4', 'border-t-blue-500');
    } else {
      dragOverPosition = 'bottom';
      targetElement.classList.add('border-b-4', 'border-b-blue-500');
    }
  }

  function handleGroupDrop(e, sectionIndex) {
    e.preventDefault();
    e.stopPropagation();
    
    logState('DEBUG] Group drop:', { sectionIndex, draggedGroup, dragOverPosition });
    
    if (!draggedGroup) return;
    
    sections.update(currentSections => {
      const newSections = [...currentSections];
      const sourceSection = newSections[draggedGroup.sectionIndex];
      const targetSection = newSections[sectionIndex];
      
      if (!sourceSection || !targetSection) {
        logState('DEBUG] Missing source or target section');
        return currentSections;
      }
      
      // Find all items in the dragged group
      const groupItems = sourceSection.items.filter(
        item => item.parallel_group_id === draggedGroup.groupId
      );
      
      // Remove items from source section
      sourceSection.items = sourceSection.items.filter(
        item => item.parallel_group_id !== draggedGroup.groupId
      );
      
      // Find insert position in target section
      let insertIndex = 0;
      if (dragOverPosition === 'bottom') {
        // Find the last item of the target group
        const lastGroupItemIndex = targetSection.items.findLastIndex(
          item => item.parallel_group_id === draggedGroup.groupId
        );
        insertIndex = lastGroupItemIndex !== -1 ? lastGroupItemIndex + 1 : targetSection.items.length;
      }
      
      // Insert group items at the determined position
      targetSection.items.splice(insertIndex, 0, ...groupItems);
      
      logState('DEBUG] Updated sections after group drop');
      return newSections;
    });
    
    draggedGroup = null;
    dragOverPosition = null;
  }

  // Add this helper function to handle drops at the top of sections
  function handleDropOnTop(e, sectionIndex) {
    e.preventDefault();
    e.stopPropagation();
    
    logState('DEBUG] Drop on top:', { sectionIndex, draggedItem, draggedGroup });
    
    if (!draggedItem && !draggedGroup) return;
    
    sections.update(currentSections => {
      const newSections = [...currentSections];
      const targetSection = newSections[sectionIndex];
      
      if (draggedGroup) {
        // Handle group movement
        const sourceSection = newSections[draggedGroup.sectionIndex];
        const [movedGroup] = sourceSection.items.splice(draggedGroup.itemIndex, 1);
        const insertIndex = dragOverPosition === 'bottom' ? itemIndex + 1 : itemIndex;
        targetSection.items.splice(insertIndex, 0, movedGroup);
        draggedGroup = null;
      } else {
        // Handle single drill movement
        const sourceSection = newSections[draggedItem.sectionIndex];
        const [movedItem] = sourceSection.items.splice(draggedItem.itemIndex, 1);
        const insertIndex = dragOverPosition === 'bottom' ? itemIndex + 1 : itemIndex;
        targetSection.items.splice(insertIndex, 0, movedItem);
        draggedItem = null;
      }
      
      return newSections;
    });
    
    dragOverPosition = null;
  }

  // New handler for internal group reordering
  function handleGroupInternalReorder(sectionIndex, itemIndex, detail) {
    logState('DEBUG] Group internal reorder:', { sectionIndex, itemIndex, detail });
    sections.update(currentSections => {
      const section = currentSections[sectionIndex];
      const groupItem = section.items[itemIndex];
      
      // Find source and target timelines
      const sourceTimeline = groupItem.groupData.timelines.find(t => t.id === detail.sourceTimeline);
      const targetTimeline = groupItem.groupData.timelines.find(t => t.id === detail.targetTimeline);
      
      if (sourceTimeline && targetTimeline) {
        // Remove from source
        const [movedDrill] = sourceTimeline.drills.splice(detail.sourceDrillIndex, 1);
        // Add to target
        const insertIndex = detail.position === 'bottom' ? 
          detail.targetDrillIndex + 1 : detail.targetDrillIndex;
        targetTimeline.drills.splice(insertIndex, 0, movedDrill);
      }
      
      return currentSections;
    });
  }

  function formatGroupData(items, groupId) {
    const groupItems = items.filter(item => item.parallel_group_id === groupId);
    const timelines = [...new Set(groupItems.map(item => item.parallel_timeline))];
    
    return {
      id: groupId,
      timelines: timelines.map(timelineId => ({
        id: timelineId,
        drills: groupItems.filter(item => item.parallel_timeline === timelineId)
      }))
    };
  }

  function handleGroupDurationChange(sectionIndex, itemIndex, detail) {
    logState('DEBUG] Group duration change:', { sectionIndex, itemIndex, detail });
    sections.update(currentSections => {
      const section = currentSections[sectionIndex];
      const groupItem = section.items[itemIndex];
      const timeline = groupItem.groupData.timelines.find(t => t.id === detail.timelineId);
      
      if (timeline && timeline.drills[detail.drillIndex]) {
        timeline.drills[detail.drillIndex].selected_duration = detail.newDuration;
      }
      
      return currentSections;
    });
  }

  function handleGroupRemoveDrill(sectionIndex, itemIndex, detail) {
    logState('DEBUG] Group remove drill:', { sectionIndex, itemIndex, detail });
    sections.update(currentSections => {
      const section = currentSections[sectionIndex];
      const groupItem = section.items[itemIndex];
      const timeline = groupItem.groupData.timelines.find(t => t.id === detail.timelineId);
      
      if (timeline) {
        timeline.drills.splice(detail.drillIndex, 1);
        
        // If this was the last drill in the group, remove the group
        const totalDrills = groupItem.groupData.timelines.reduce(
          (sum, t) => sum + t.drills.length, 0
        );
        
        if (totalDrills === 0) {
          section.items.splice(itemIndex, 1);
        }
      }
      
      return currentSections;
    });
  }

  // 1. Update transformToGroupStructure to properly create group items
  function transformToGroupStructure(items) {
    const groups = new Map();
    const nonGroupItems = [];

    // First pass: collect all items with parallel_group_id
    items.forEach(item => {
      if (item.parallel_group_id) {
        if (!groups.has(item.parallel_group_id)) {
          groups.set(item.parallel_group_id, {
            timelines: new Map(),
            groupTimelines: item.groupTimelines || []
          });
        }
        
        const group = groups.get(item.parallel_group_id);
        const timelineId = item.parallel_timeline;
        
        if (!group.timelines.has(timelineId)) {
          group.timelines.set(timelineId, []);
        }
        
        // Format drill for the timeline
        const formattedDrill = {
          id: item.id,
          type: 'drill',
          name: item.name,
          duration: item.duration,
          selected_duration: item.selected_duration || item.duration,
          drill: item.drill,
          skill_level: item.skill_level || [],
          skills_focused_on: item.skills_focused_on || [],
          brief_description: item.brief_description || ''
        };
        
        group.timelines.get(timelineId).push(formattedDrill);
      } else {
        nonGroupItems.push(item);
      }
    });

    // Second pass: convert groups to proper format
    const transformedItems = [...nonGroupItems];
    
    groups.forEach((groupData, groupId) => {
      // Create the timeline array in the expected format
      const timelines = Array.from(groupData.timelines.entries()).map(([timelineId, drills]) => ({
        id: timelineId,
        drills
      }));

      // Create the group item with proper groupData structure
      const groupItem = {
        id: groupId,
        type: 'group',
        groupData: {
          id: groupId,
          timelines,
          groupTimelines: groupData.groupTimelines
        }
      };

      transformedItems.push(groupItem);
    });

    return transformedItems;
  }

  // 2. Update the sections initialization to properly use transformToGroupStructure
  $: if (practicePlan && !formInitialized) {
    // ... existing initialization code ...

    if (practicePlan.sections?.length) {
      // First, collect all parallel groups and their timelines
      const parallelGroups = new Map();
      practicePlan.sections.forEach(section => {
        section.items.forEach(item => {
          if (item.parallel_group_id) {
            if (!parallelGroups.has(item.parallel_group_id)) {
              parallelGroups.set(item.parallel_group_id, new Set());
            }

            if (Array.isArray(item.groupTimelines) && item.groupTimelines.length > 0) {
              item.groupTimelines.forEach(t => parallelGroups.get(item.parallel_group_id).add(t));
            } else if (item.parallel_timeline) {
              parallelGroups.get(item.parallel_group_id).add(item.parallel_timeline);
            }
          }
        });
      });

      // Now set the sections with properly transformed items
      sections.set(practicePlan.sections.map(section => ({
        id: section.id,
        name: section.name,
        order: section.order,
        goals: section.goals || [],
        notes: section.notes || '',
        items: transformToGroupStructure(section.items.map(item => ({
          ...item,
          // Ensure each grouped item has the complete set of timelines
          ...(item.parallel_group_id && {
            groupTimelines: Array.from(parallelGroups.get(item.parallel_group_id) || [])
          })
        })))
      })));

      logState('[DEBUG] Initialized sections with groups', $sections);
    }

    formInitialized = true;
  }

  // 3. Update the template section to properly handle group items
  {#each section.items as item, itemIndex}
    <li class="timeline-item">
      {#if item.type === 'group'}
        <ParallelGroup
          groupData={item.groupData}
          sectionId={section.id}
          on:internalReorder={(e) => handleGroupInternalReorder(sectionIndex, itemIndex, e.detail)}
          on:durationChange={(e) => handleGroupDurationChange(sectionIndex, itemIndex, e.detail)}
          on:removeDrill={(e) => handleGroupRemoveDrill(sectionIndex, itemIndex, e.detail)}
          on:ungroup={() => handleUngroup(sectionIndex, item.id)}
        />
      {:else}
        <div class="bg-white p-4 rounded-lg shadow-sm border">
          <div class="flex justify-between items-center">
            <span>{item.name}</span>
            <div class="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max="120"
                class="w-16 px-2 py-1 border rounded"
                value={item.selected_duration || item.duration}
                on:blur={(e) => handleDurationChange(sectionIndex, itemIndex, parseInt(e.target.value))}
              />
              <button 
                class="text-red-500 hover:text-red-700"
                on:click={() => removeItem(sectionIndex, itemIndex)}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      {/if}
    </li>
  {/each}

  // 4. Add helper to check for empty groups
  function isGroupEmpty(groupData) {
    return groupData.timelines.every(timeline => timeline.drills.length === 0);
  }


  // Update handleUngroup
  function handleUngroup(sectionIndex, groupId) {
    sections.update(currentSections => {
      const section = currentSections[sectionIndex];
      const groupIndex = section.items.findIndex(item => 
        item.type === 'group' && item.id === groupId
      );
      
      if (groupIndex === -1) return currentSections;

      const groupItem = section.items[groupIndex];
      const ungroupedItems = groupItem.groupData.timelines.flatMap(timeline =>
        timeline.drills.map(drill => ({
          ...drill,
          type: 'drill',
          parallel_group_id: undefined,
          parallel_timeline: undefined
        }))
      );

      section.items.splice(groupIndex, 1, ...ungroupedItems);
      return currentSections;
    });

    toast.push('Ungrouped parallel drills');
  }

  // 3. Add new handler for external drops onto groups
  function handleExternalDropOnGroup(event, sectionIndex, groupIndex) {
    const { timelineId, position, drillIndex } = event.detail;
    
    if (!draggedItem) return;

    sections.update(currentSections => {
      const section = currentSections[sectionIndex];
      const groupItem = section.items[groupIndex];
      
      if (groupItem.type !== 'group') return currentSections;

      const sourceSection = currentSections[draggedItem.sectionIndex];
      const [movedItem] = sourceSection.items.splice(draggedItem.itemIndex, 1);

      const groupDrill = {
        id: movedItem.id,
        type: 'drill',
        name: movedItem.name,
        duration: movedItem.duration,
        selected_duration: movedItem.selected_duration,
        drill: movedItem.drill
      };

      const timeline = groupItem.groupData.timelines.find(t => t.id === timelineId);
      if (timeline) {
        const insertIndex = position === 'after' ? drillIndex + 1 : drillIndex;
        timeline.drills.splice(insertIndex, 0, groupDrill);
      }

      return currentSections;
    });

    draggedItem = null;
    dragOverPosition = null;
  }

  // Add new basic logging mechanism
  function rawLog(message, data) {
    try {
      // Deep clone and filter out diagrams
      const filterDiagrams = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        
        if (Array.isArray(obj)) {
          return obj.map(filterDiagrams);
        }
        
        const filtered = {};
        for (const [key, value] of Object.entries(obj)) {
          if (key !== 'diagrams') {
            filtered[key] = filterDiagrams(value);
          }
        }
        return filtered;
      };

      const filteredData = filterDiagrams(data);
      console.log(`[RAW] ${message}:`, 
        typeof filteredData === 'object' ? 
          JSON.stringify(filteredData, null, 2) : 
          filteredData
      );
    } catch (err) {
      console.log(`[RAW] ${message}: [Unable to stringify data]`);
    }
  }
</script>

<!-- Only show empty cart modal for new plans -->
{#if !practicePlan && showEmptyCartModal}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" id="my-modal">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <div class="mt-3 text-center">
        <h3 class="text-lg leading-6 font-medium text-gray-900">No Drills in Cart</h3>
        <div class="mt-2 px-7 py-3">
          <p class="text-sm text-gray-500">
            You need to select some drills before creating a practice plan. Would you like to browse available drills?
          </p>
        </div>
        <div class="items-center px-4 py-3">
          <button
            id="ok-btn"
            class="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            on:click={goToDrills}
          >
            Go to Drills
          </button>
          <button
            id="cancel-btn"
            class="mt-3 px-4 py-2 bg-gray-100 text-gray-800 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
            on:click={closeModal}
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Update the drill search modal -->
{#if showDrillSearch}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-[32rem] shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Add to Practice Plan</h3>
        
        <!-- Add Break option at the top -->
        <div class="mb-6 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
             on:click={() => {
               addBreak(selectedSectionForDrill);
               showDrillSearch = false;
               searchQuery = '';
               searchResults = [];
             }}>
          <div class="flex justify-between items-center">
            <div>
              <h4 class="font-medium">Add Break</h4>
              <p class="text-sm text-gray-500">Add a timed break or transition period</p>
            </div>
            <span class="text-blue-500">+</span>
          </div>
        </div>

        <div class="border-t my-4"></div>
        
        <!-- Search input -->
        <div class="mb-4">
          <input
            type="text"
            bind:value={searchQuery}
            on:input={() => searchDrills(searchQuery)}
            placeholder="Search drills..."
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <!-- Search results -->
        <div class="max-h-[400px] overflow-y-auto">
          {#if searchResults.length === 0}
            <p class="text-gray-500 text-center py-4">
              {searchQuery ? 'No drills found' : 'Start typing to search drills'}
            </p>
          {:else}
            <ul class="divide-y divide-gray-200">
              {#each searchResults as drill}
                <li class="py-3 hover:bg-gray-50 cursor-pointer px-2 rounded"
                    on:click={() => handleAddDrill(drill, selectedSectionForDrill)}>
                  <div class="flex justify-between items-center">
                    <span>{drill.name}</span>
                    <button class="text-blue-500 hover:text-blue-700">
                      Add
                    </button>
                  </div>
                </li>
              {/each}
            </ul>
          {/if}
        </div>

        <!-- Close button -->
        <div class="mt-4 flex justify-end">
          <button
            class="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
            on:click={() => {
              showDrillSearch = false;
              searchQuery = '';
              searchResults = [];
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Timeline Selector Modal -->
{#if showTimelineSelector}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-[32rem] shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Select Timelines</h3>
        
        <div class="space-y-4">
          {#each Object.entries(PARALLEL_TIMELINES) as [key, { name, color }]}
            <label class="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={selectedTimelines.has(key)}
                on:change={(e) => {
                  console.log('[DEBUG] Timeline checkbox toggled:', key, 'is now', e.target.checked);
                  if (e.target.checked) {
                    selectedTimelines.add(key);
                  } else {
                    selectedTimelines.delete(key);
                  }
                  // Trigger reactivity by reassigning
                  selectedTimelines = selectedTimelines;
                  console.log('[DEBUG] Global selectedTimelines updated:', Array.from(selectedTimelines));
                }}
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span class="text-gray-700">{name}</span>
              <div class={`w-4 h-4 rounded ${color}`}></div>
            </label>
          {/each}
        </div>

        <div class="mt-6 flex justify-end space-x-3">
          <button
            class="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
            on:click={() => {
              console.log('[DEBUG] Timeline selector cancelled.');
              showTimelineSelector = false;
              selectedSectionId = null;
            }}
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            on:click={handleTimelineSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<div class="container mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">{practicePlan ? 'Edit Practice Plan' : 'Create Practice Plan'}</h1>

  <div class="mb-4">
    <label for="planName" class="block text-sm font-medium text-gray-700">Plan Name:</label>
    <input id="planName" bind:value={$planName} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
    {#if $errors.planName}
      <p class="text-red-500 text-sm mt-1">{$errors.planName}</p>
    {/if}
  </div>

  <div class="mb-4">
    <label for="planDescription" class="block text-sm font-medium text-gray-700">Plan Description:</label>
    {#if Editor}
      <div class="min-h-[300px]">
        <svelte:component 
          this={Editor}
          apiKey={import.meta.env.VITE_TINY_API_KEY}
          bind:value={$planDescription}
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
            content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "San Francisco", Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px; }',
            branding: false
          }}
        />
      </div>
    {:else}
      <textarea 
        id="planDescription" 
        bind:value={$planDescription} 
        class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
        rows="3"
      ></textarea>
    {/if}
  </div>

  <div class="mb-4">
    <label for="phaseOfSeason" class="block text-sm font-medium text-gray-700">Phase of Season:</label>
    <select id="phaseOfSeason" bind:value={$phaseOfSeason} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
      <option value="">Select Phase</option>
      {#each phaseOfSeasonOptions as option}
        <option value={option}>{option}</option>
      {/each}
    </select>
    {#if $errors.phaseOfSeason}
      <p class="text-red-500 text-sm mt-1">{$errors.phaseOfSeason}</p>
    {/if}
  </div>

  <div class="mb-4">
    <label for="estimatedNumberOfParticipants" class="block text-sm font-medium text-gray-700">Estimated Number of Participants:</label>
    <input id="estimatedNumberOfParticipants" type="number" min="1" bind:value={$estimatedNumberOfParticipants} class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
    {#if $errors.estimatedNumberOfParticipants}
      <p class="text-red-500 text-sm mt-1">{$errors.estimatedNumberOfParticipants}</p>
    {/if}
  </div>

  <div class="mb-4">
    <label for="startTime" class="block text-sm font-medium text-gray-700">Practice Start Time:</label>
    <input 
      id="startTime" 
      type="time" 
      bind:value={$startTime}
      class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" 
    />
  </div>

  <div class="mb-4">
    <label class="block text-sm font-medium text-gray-700">Practice Goals:</label>
    {#each $practiceGoals as goal, index}
      <div class="flex items-center mt-2">
        <input
          type="text"
          bind:value={$practiceGoals[index]}
          on:input={(e) => updatePracticeGoal(index, e.target.value)}
          placeholder="Enter practice goal"
          class="flex-1 mr-2 border-gray-300 rounded-md shadow-sm"
        />
        {#if $practiceGoals.length > 1}
          <button type="button" on:click={() => removePracticeGoal(index)} class="text-red-600 hover:text-red-800">Remove</button>
        {/if}
      </div>
    {/each}
    <button type="button" on:click={addPracticeGoal} class="mt-2 text-blue-600 hover:text-blue-800">Add Practice Goal</button>
    {#if $errors.practice_goals}
      <p class="text-red-500 text-sm mt-1">{$errors.practice_goals}</p>
    {/if}
  </div>

  <!-- Selected Drills and Breaks with drag-and-drop -->
  <div class="practice-plan-sections mb-6">
    {#each $sections as section, sectionIndex}
      <div 
        class="section-container bg-white rounded-lg shadow-sm p-4 mb-4"
        draggable="true"
        on:dragstart={(e) => handleSectionDragStart(e, sectionIndex)}
        on:dragover={(e) => handleSectionDragOver(e, sectionIndex)}
        on:dragleave={handleSectionDragLeave}
        on:drop={(e) => handleSectionDrop(e, sectionIndex)}
      >
        <div class="section-header flex items-center gap-4 mb-4">
          <input
            type="text"
            bind:value={section.name}
            class="text-xl font-semibold bg-transparent border-b border-gray-200 focus:border-blue-500 focus:outline-none"
            placeholder="Section Name"
          />
          <button
            class="text-blue-500 hover:text-blue-700 text-sm"
            on:click={() => {
              selectedSectionForDrill = section.id;
              showDrillSearch = true;
            }}
          >
            Add Drill
          </button>
          <button
            class="text-blue-500 hover:text-blue-700 text-sm"
            on:click={() => {
              handleTimelineSelect(section.id, section.items.find(i => i.parallel_group_id)?.parallel_group_id);
            }}
          >
            Create Parallel Block
          </button>
          <button
            class="text-red-500 hover:text-red-700"
            on:click={() => removeSection(section.id)}
          >
            Remove Section
          </button>
          <span class="text-sm text-gray-500">({section.items?.length || 0} items)</span>
        </div>

        <ul 
          class="space-y-4 min-h-[50px]"
          on:dragover|preventDefault
          on:drop={(e) => section.items.length === 0 ? handleEmptySectionDrop(e, sectionIndex) : null}
        >
          {#each section.items as item, itemIndex}
            <li class="timeline-item">
              {#if item.type === 'group'}
                <ParallelGroup
                  groupData={item.groupData}
                  sectionId={section.id}
                  on:internalReorder={(e) => handleGroupInternalReorder(sectionIndex, itemIndex, e.detail)}
                  on:durationChange={(e) => handleGroupDurationChange(sectionIndex, itemIndex, e.detail)}
                  on:removeDrill={(e) => handleGroupRemoveDrill(sectionIndex, itemIndex, e.detail)}
                  on:ungroup={() => handleUngroup(sectionIndex, item.id)}
                />
              {:else}
                <div class="bg-white p-4 rounded-lg shadow-sm border">
                  <div class="flex justify-between items-center">
                    <span>{item.name}</span>
                    <div class="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        max="120"
                        class="w-16 px-2 py-1 border rounded"
                        value={item.selected_duration || item.duration}
                        on:blur={(e) => handleDurationChange(sectionIndex, itemIndex, parseInt(e.target.value))}
                      />
                      <button 
                        class="text-red-500 hover:text-red-700"
                        on:click={() => removeItem(sectionIndex, itemIndex)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    {/each}

    <div class="flex gap-2">
      <button
        class="flex-1 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
        on:click={addSection}
      >
        + Add Section
      </button>
      <button
        class="flex-1 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
        on:click={() => {
          if ($sections.length === 0) {
            toast.push('Please add a section first');
            return;
          }
          selectedSectionForDrill = $sections[0].id;
          showDrillSearch = true;
        }}
      >
        + Add Drill
      </button>
    </div>
  </div>

  {#if $errors.selectedItems}
    <p class="text-red-500 text-sm mb-2">{$errors.selectedItems}</p>
  {/if}

  {#if $errors.general}
    <p class="text-red-500 text-sm mb-2">{$errors.general}</p>
  {/if}

  <!-- Add this before the submit button -->
  <div class="mb-6">
    <label class="block text-gray-700 font-medium mb-1">Visibility</label>
    <select
      bind:value={$visibility}
      class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring"
      disabled={!$page.data.session}
      title={!$page.data.session ? 'Log in to create private or unlisted practice plans' : ''}
    >
      <option value="public">Public - Visible to everyone</option>
      {#if $page.data.session}
        <option value="unlisted">Unlisted - Only accessible via direct link</option>
        <option value="private">Private - Only visible to you</option>
      {/if}
    </select>
    {#if !$page.data.session}
      <p class="text-sm text-gray-500 mt-1">Anonymous submissions are always public</p>
    {/if}
  </div>

  <div class="mb-6">
    <label class="flex items-center">
      <input
        type="checkbox"
        bind:checked={$isEditableByOthers}
        disabled={!$page.data.session}
        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />
      <span class="ml-2 text-gray-700">
        Allow others to edit this practice plan
        {#if !$page.data.session}
          <span class="text-gray-500">(required for anonymous submissions)</span>
        {/if}
      </span>
    </label>
  </div>

  <button 
    on:click={submitPlan} 
    class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
    disabled={$isSubmitting}
  >
    {$isSubmitting ? (practicePlan ? 'Updating Plan...' : 'Creating Plan...') : (practicePlan ? 'Update Plan' : 'Create Plan')}
  </button>
</div>


<style>
  /* Add these new styles for parallel timelines */
  .parallel-group-container {
    display: grid;
    gap: 1rem;
    padding: 1rem;
    background-color: rgba(59, 130, 246, 0.05);
    border-radius: 0.5rem;
    position: relative;
  }

  /* Desktop layout */
  @media (min-width: 768px) {
    .parallel-group-container {
      grid-template-columns: repeat(var(--timeline-count, 2), 1fr);
    }
  }

  /* Mobile layout */
  @media (max-width: 767px) {
    .parallel-group-container {
      grid-template-rows: repeat(var(--timeline-count, 2), auto);
    }
  }

  .timeline-column {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-height: 100px;
    padding: 0.5rem;
    border: 2px dashed transparent;
    transition: border-color 0.2s ease;
  }

  .timeline-column[data-timeline="BEATERS"] {
    border-left-color: theme('colors.gray.500');
  }

  .timeline-column[data-timeline="CHASERS"] {
    border-left-color: theme('colors.green.500');
  }

  .timeline-column[data-timeline="SEEKERS"] {
    border-left-color: theme('colors.yellow.500');
  }

  .timeline-column-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    font-weight: 500;
  }

  .timeline-column-header .timeline-color {
    width: 1rem;
    height: 1rem;
    border-radius: 9999px;
  }

  .timeline-drop-target {
    position: relative;
  }

  .timeline-drop-target::before {
    content: '';
    position: absolute;
    top: 0;
    left: var(--timeline-highlight, 0);
    width: calc(100% / var(--timeline-count, 2));
    height: 100%;
    background-color: rgba(59, 130, 246, 0.1);
    pointer-events: none;
    transition: left 0.2s ease;
  }

  /* Update existing styles */
  .timeline-item {
    position: relative;
    transition: all 0.2s ease;
    padding: 0.5rem;
  }

  .timeline-item.drag-over {
    transform: translateX(1rem);
  }

  /* Visual feedback for parallel groups */
  .parallel-group {
    position: relative;
    margin-left: 1rem;
    padding-left: 1rem;
  }

  .parallel-group::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background-color: theme('colors.blue.500');
  }

  /* Visual feedback styles */
  .timeline-item .border-t-4 {
    border-top-style: dashed;
  }

  .timeline-item .border-b-4 {
    border-bottom-style: dashed;
  }

  .timeline-item.bg-blue-100 {
    background-color: rgba(59, 130, 246, 0.1);
  }

  .timeline-item.scale-95 {
    transform: scale(0.95);
  }

  .timeline-item .border-l-4 {
    border-left-width: 4px;
    transition: border-left-width 0.2s ease;
  }

  .parallel-group-indicator {
    position: absolute;
    left: -1rem;
    top: 0;
    bottom: 0;
    width: 2px;
    background-color: theme('colors.blue.500');
    transition: all 0.2s ease;
  }

  .timeline-item:hover .parallel-group-indicator {
    width: 4px;
  }

  /* Add these new styles */
  .parallel-group-container {
    display: flex;
    gap: 1rem;
    padding: 0.5rem;
    background-color: rgba(59, 130, 246, 0.05);
    border-radius: 0.5rem;
    border-left: 4px solid theme('colors.blue.500');
  }

  .parallel-group-member {
    flex: 1;
    min-width: 0;
  }

  /* Update existing styles */
  .timeline-item {
    position: relative;
    transition: all 0.2s ease;
  }

  .timeline-item.drag-over {
    transform: translateX(1rem);
  }

  .timeline-item.drag-group-target {
    outline: 2px dashed theme('colors.blue.500');
    outline-offset: 4px;
    background-color: rgba(59, 130, 246, 0.1);
  }

  .timeline-item.drag-group-target::after {
    content: "Group drills";
    position: absolute;
    top: -1.5rem;
    left: 50%;
    transform: translateX(-50%);
    background-color: theme('colors.blue.500');
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
  }

  .timeline-item.horizontal-drag {
    border: 2px dashed theme('colors.blue.500');
    position: relative;
  }

  .timeline-item.horizontal-drag::after {
    content: "Release to group";
    position: absolute;
    top: -2rem;
    left: 50%;
    transform: translateX(-50%);
    background-color: theme('colors.blue.500');
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    white-space: nowrap;
  }

  /* Add these styles */
  .section-drag-over {
    outline: 2px dashed theme('colors.blue.500');
    outline-offset: -2px;
    background-color: rgba(59, 130, 246, 0.05);
  }

  .timeline-item {
    cursor: grab;
  }

  .timeline-item:active {
    cursor: grabbing;
  }

  /* Add these styles */
  .section-container {
    transition: border-color 0.2s ease;
    border: 2px solid transparent;
  }

  .section-container.border-t-4 {
    border-top: 4px solid theme('colors.blue.500');
  }

  .section-container.border-b-4 {
    border-bottom: 4px solid theme('colors.blue.500');
  }

  /* Add a grab cursor to indicate draggability */
  .section-container {
    cursor: grab;
  }

  .section-container:active {
    cursor: grabbing;
  }

  /* Add these new styles at the end of the style block */
  .break-insert-button {
    text-align: center;
    margin: -0.25rem 0;
    height: 1.5rem;
    position: relative;
    z-index: 10;
  }

  .break-insert-button button {
    transform: translateY(-50%);
    background-color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    border: 1px solid transparent;
  }

  .break-insert-button button:hover {
    border-color: theme('colors.blue.500');
  }

  /* Update timeline-item for breaks */
  .timeline-item[data-type="break"] {
    opacity: 0.8;
  }

  .timeline-item[data-type="break"]:hover {
    opacity: 1;
  }

  /* Add styles for empty section placeholder */
  .empty-section-placeholder {
    transition: all 0.2s ease;
  }

  .empty-section-placeholder:hover {
    border-color: theme('colors.blue.500');
    color: theme('colors.blue.500');
  }

  /* Update timeline-item styles to be more forgiving */
  .timeline-item {
    position: relative;
    transition: all 0.2s ease;
    padding: 0.5rem 0; /* Add padding to increase drop target area */
  }

  .timeline-item::before {
    content: '';
    position: absolute;
    top: -0.5rem;
    left: 0;
    right: 0;
    height: 1rem;
    background: transparent;
  }

  .timeline-item::after {
    content: '';
    position: absolute;
    bottom: -0.5rem;
    left: 0;
    right: 0;
    height: 1rem;
    background: transparent;
  }

  /* Add timeline-specific colors */
  .parallel-group-container.bg-gray-500 {
    border-color: theme('colors.gray.500');
  }
  
  .parallel-group-container.bg-green-500 {
    border-color: theme('colors.green.500');
  }
  
  .parallel-group-container.bg-yellow-500 {
    border-color: theme('colors.yellow.500');
  }

  /* Add styles for timeline duration indicators */
  .timeline-duration {
    position: absolute;
    right: 1rem;
    top: 0.5rem;
    font-size: 0.875rem;
    color: theme('colors.gray.500');
  }

  /* Add styles for timeline labels */
  .timeline-label {
    position: absolute;
    left: -1.5rem;
    top: 50%;
    transform: translateY(-50%) rotate(-90deg);
    transform-origin: right center;
    font-size: 0.875rem;
    color: theme('colors.gray.500');
    white-space: nowrap;
  }

  @media (max-width: 767px) {
    .timeline-label {
      left: 0.5rem;
      top: -1.5rem;
      transform: none;
    }
  }

  /* Add these new styles */
  .group-drag-handle {
    opacity: 0.5;
    transition: opacity 0.2s ease;
  }

  .parallel-group-container:hover .group-drag-handle {
    opacity: 1;
  }

  .parallel-group-container {
    position: relative;
    transition: transform 0.2s ease, outline 0.2s ease;
  }

  .parallel-group-container.border-t-4 {
    border-top: 4px solid theme('colors.blue.500');
    margin-top: -4px;
  }

  .parallel-group-container.border-b-4 {
    border-bottom: 4px solid theme('colors.blue.500');
    margin-bottom: -4px;
  }

  /* Style for the top drop zone */
  .parallel-group-container > .h-2 {
    transition: height 0.2s ease;
  }

  .parallel-group-container > .h-2:hover,
  .parallel-group-container > .h-2.drag-over {
    height: 1rem;
    background-color: rgba(59, 130, 246, 0.1);
  }
</style>