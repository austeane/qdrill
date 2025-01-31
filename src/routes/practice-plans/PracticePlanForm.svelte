<script>
  import { writable } from 'svelte/store';
  import { cart } from '$lib/stores/cartStore';
  import { goto } from '$app/navigation';
  import { toast } from '@zerodevx/svelte-toast';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { handleDrillMove } from '$lib/stores/practicePlanStore';
  // Add Editor import
  let Editor;

  // Add proper prop definitions with defaults
  export let data = { drills: [] }; // Add default value
  export let practicePlan = null;
  console.log('[PracticePlanForm] Received practicePlan:', practicePlan);

  // Initialize stores more efficiently
  let planName = writable('');
  let planDescription = writable('');
  let phaseOfSeason = writable('');
  let estimatedNumberOfParticipants = writable('');
  let practiceGoals = writable(['']);
  let visibility = writable('public');
  let isEditableByOthers = writable(false);
  const selectedItems = writable([]);

  // Initialize drills from data
  $: availableDrills = data?.drills || [];

  // Add logging for debugging
  function logState(message, data) {
    try {
      let sanitizedData = data;
      if (typeof data === 'object' && data !== null) {
        // Deep clone while removing sensitive fields
        const removeFields = (obj) => {
          if (Array.isArray(obj)) {
            return obj.map(item => removeFields(item));
          }
          if (typeof obj === 'object' && obj !== null) {
            const newObj = {};
            for (const [key, value] of Object.entries(obj)) {
              // Skip these fields entirely
              if (key === 'dataURL' || key === 'diagrams') {
                continue;
              }
              newObj[key] = removeFields(value);
            }
            return newObj;
          }
          return obj;
        };

        sanitizedData = removeFields(data);
        
        // Convert to string for logging
        sanitizedData = JSON.parse(JSON.stringify(sanitizedData, (key, value) => {
          if (typeof value === 'object' && value !== null) {
            if (Object.prototype.toString.call(value) === '[object File]') {
              return '[File object]';
            }
            if (Object.prototype.toString.call(value) === '[object Blob]') {
              return '[Blob object]';
            }
          }
          return value;
        }));
      }
      
      console.log(`[PracticePlanForm] ${message}:`, 
        typeof sanitizedData === 'object' ? 
          JSON.stringify(sanitizedData, null, 2) : 
          sanitizedData
      );
    } catch (err) {
      console.log(`[PracticePlanForm] ${message}: [Unable to stringify data]`, 
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

  // Replace the existing reactive statement
  $: {
    if ($selectedItems?.length > 0) {
      sections.update(currentSections => {
        const newSections = [...currentSections];
        // Find Skill Building section
        const skillBuildingSection = newSections.find(s => s.name === 'Skill Building');
        if (skillBuildingSection) {
          // Map the items with proper structure and normalization
          skillBuildingSection.items = $selectedItems.map(item => ({
            id: item.id,
            type: item.type,
            name: item.drill?.name || item.name,
            duration: item.selected_duration || item.drill?.duration || 15,
            drill: item.drill,
            selected_duration: item.selected_duration || item.drill?.duration || 15,
            parallel_group_id: item.parallel_group_id,
            // Add these normalized fields
            skill_level: item.drill?.skill_level || [],
            skills_focused_on: item.drill?.skills_focused_on || [],
            brief_description: item.drill?.brief_description || '',
            video_link: item.drill?.video_link || null,
            diagrams: item.drill?.diagrams || []
          }));
        }
        return newSections;
      });
    }
  }

  // Update when practicePlan changes
  $: {
    if (practicePlan) {
      sections.set(practicePlan.sections.map(section => ({
        ...section,
        items: $selectedItems.filter(item => item.section_id === section.id) || []
      })));
    }
  }

  // Add this to your existing onMount
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
    }

    // Load TinyMCE Editor
    try {
      console.log('Loading TinyMCE editor...');
      const module = await import('@tinymce/tinymce-svelte');
      Editor = module.default;
      console.log('TinyMCE editor loaded successfully');
    } catch (error) {
      console.error('Error loading TinyMCE:', error);
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

  let dragStartX = 0;
  let dragStartY = 0;
  let currentDragItem = null;
  let dragThreshold = 50; // pixels to trigger horizontal drag
  let isDraggingForParallel = false;

  // Add these variables to track drag state
  let draggedItem = null;
  let dragOverItem = null;
  let dragOverPosition = null; // 'top', 'middle', or 'bottom'

  function closeModal() {
    showEmptyCartModal = false;
  }

  function goToDrills() {
    goto('/drills');
  }

  async function submitPlan() {
    try {
      console.log('[PracticePlanForm] Starting plan submission');
      
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
      
      console.log('[PracticePlanForm] Initial form values:', 
        JSON.stringify(formValues, null, 2)
      );

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
        sections: $sections.map(section => ({
          id: section.id,
          name: section.name,
          order: section.order,
          goals: section.goals || [],
          notes: section.notes || '',
          items: section.items.map(item => ({
            id: item.drill?.id || item.id,
            type: item.type || 'drill',
            duration: parseInt(item.selected_duration || item.duration),
            drill_id: item.type === 'drill' ? (item.drill?.id || item.id) : null,
            diagram_data: item.diagram_data || null,
            parallel_group_id: item.parallel_group_id || null
          }))
        }))
      };

      console.log('[PracticePlanForm] Plan data before stringify:', 
        JSON.stringify(planData, null, 2)
      );

      const url = practicePlan ? `/api/practice-plans/${practicePlan.id}` : '/api/practice-plans';
      const method = practicePlan ? 'PUT' : 'POST';

      console.log('[PracticePlanForm] Sending request to:', url, 'with method:', method);

      try {
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(planData)
        });

        console.log('[PracticePlanForm] Response status:', response.status);

        if (!response.ok) {
          let errorData;
          const errorText = await response.text();
          console.log('[PracticePlanForm] Error response text:', errorText);

          try {
            errorData = JSON.parse(errorText);
            console.log('[PracticePlanForm] Parsed error data:', 
              JSON.stringify(errorData, null, 2)
            );
          } catch (e) {
            console.log('[PracticePlanForm] Failed to parse error response:', String(e));
            errorData = { error: String(errorText) };
          }
          
          const errorMessage = errorData.errors 
            ? Object.values(errorData.errors).join(', ')
            : errorData.error || 'An error occurred while saving the practice plan';
          
          console.log('[PracticePlanForm] Final error message:', errorMessage);
          errors.set({ general: errorMessage });
          toast.push('Failed to save practice plan: ' + errorMessage, { 
            theme: { '--toastBackground': 'red' } 
          });
          return;
        }

        const data = await response.json();
        console.log('[PracticePlanForm] Success response:', data);

        if (!practicePlan) {
          cart.clear();
        }
        toast.push(`Practice plan ${practicePlan ? 'updated' : 'created'} successfully`);
        goto(`/practice-plans/${data.id}`);
      } catch (error) {
        console.error('[PracticePlanForm] Network or parsing error:', error);
        throw error; // Re-throw to be caught by outer try-catch
      }
    } catch (error) {
      console.error('[PracticePlanForm] Error:', String(error));
      console.error('[PracticePlanForm] Error stack:', String(error.stack || ''));
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
      
      // Remove the item from the section
      section.items.splice(itemIndex, 1);
      
      return newSections;
    });
  }

  function addBreak(index) {
    $selectedItems.update(items => {
      const newItems = [...items];
      newItems.splice(index + 1, 0, { 
        id: `break-${Date.now()}-${Math.random()}`, 
        name: 'Break', 
        duration: 5, 
        type: 'break' 
      });
      return newItems;
    });
  }

  function updateBreakDuration(index, duration) {
    $selectedItems.update(items => {
      const updatedItems = [...items];
      updatedItems[index].duration = duration;
      return updatedItems;
    });
  }

  function toggleExpand(index) {
    $selectedItems.update(items => {
      const updatedItems = [...items];
      updatedItems[index].expanded = !updatedItems[index].expanded;
      return updatedItems;
    });
  }

  // Function to handle duration changes for drills
  function handleDurationChange(item, newDuration) {
    $selectedItems.update(items => {
      return items.map(it => {
        if (it.id === item.id) {
          return { ...it, selected_duration: newDuration };
        }
        return it;
      });
    });
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

  // Add this function
  function updateDiagramData(index, newDiagramData) {
    $selectedItems.update(items => {
      const updatedItems = [...items];
      updatedItems[index].diagram_data = newDiagramData;
      return updatedItems;
    });
  }

  // Update these functions for better group management
  function getExistingGroups() {
    const groups = new Map();
    $selectedItems.forEach(item => {
      if (item.parallel_group_id) {
        if (!groups.has(item.parallel_group_id)) {
          groups.set(item.parallel_group_id, {
            id: item.parallel_group_id,
            name: `Group ${groups.size + 1}`,
            items: []
          });
        }
        groups.get(item.parallel_group_id).items.push(item);
      }
    });
    return Array.from(groups.values());
  }

  function createNewGroup() {
    const groupId = `group_${Date.now()}`;
    parallelGroups.update(groups => [...groups, { id: groupId, name: `Group ${groups.length + 1}`, items: [] }]);
  }

  function removeFromGroup(itemId) {
    $selectedItems.update(items => removeFromParallelGroup(itemId, items));
  }

  // Add this helper function
  function findClosestItemIndex(y) {
    const itemElements = document.querySelectorAll('.timeline-item');
    let closestIndex = -1;
    let closestDistance = Infinity;
    
    itemElements.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      const distance = Math.abs(rect.top + rect.height/2 - y);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    
    return closestIndex;
  }

  // Add this function to handle parallel group merging
  function mergeIntoParallelGroup(sourceIndex, targetIndex, items) {
    const sourceItem = items[sourceIndex];
    const targetItem = items[targetIndex];
    
    if (!sourceItem || !targetItem || sourceIndex === targetIndex) return items;
    
    // If items are already in the same group, do nothing
    if (sourceItem.parallel_group_id && sourceItem.parallel_group_id === targetItem.parallel_group_id) {
        return items;
    }
    
    const newItems = [...items];
    
    // If target is already in a group, add source to that group
    if (targetItem.parallel_group_id) {
        const groupId = targetItem.parallel_group_id;
        newItems[sourceIndex] = {
            ...sourceItem,
            parallel_group_id: groupId
        };
    } else {
        // Create new group for both items
        const groupId = `group_${Date.now()}`;
        newItems[sourceIndex] = {
            ...sourceItem,
            parallel_group_id: groupId
        };
        newItems[targetIndex] = {
            ...targetItem,
            parallel_group_id: groupId
        };
    }
    
    // Update durations for all items in the group
    const groupDuration = Math.max(
        sourceItem.selected_duration || sourceItem.duration,
        targetItem.selected_duration || targetItem.duration
    );
    
    return newItems.map(item => {
        if (item.parallel_group_id === newItems[sourceIndex].parallel_group_id) {
            return {
                ...item,
                selected_duration: groupDuration,
                duration: groupDuration
            };
        }
        return item;
    });
  }

  // Update these functions for drag handling
  function handleParallelDragStart(e, index) {
    e.preventDefault(); // Prevent default drag behavior
    isDraggingForParallel = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    currentDragItem = $selectedItems[index];
    
    const handleMouseMove = (e) => {
      if (!isDraggingForParallel) return;
      
      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;
      
      // If horizontal drag is more significant than vertical
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > dragThreshold) {
        const targetIndex = findClosestItemIndex(e.clientY);
        if (targetIndex !== -1 && targetIndex !== index) {
          $selectedItems.update(items => mergeIntoParallelGroup(index, targetIndex, items));
        }
      }
    };
    
    const handleMouseUp = () => {
      isDraggingForParallel = false;
      currentDragItem = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  function removeFromParallelGroup(itemId, items) {
    return items.map(item => {
      if (item.id === itemId) {
        const { parallel_group_id, ...rest } = item;
        return rest;
      }
      return item;
    });
  }

  // Replace the existing drag handling functions with these updated versions
  function handleDragStart(e, sectionIndex, itemIndex) {
    draggedItem = { sectionIndex, itemIndex };
    e.dataTransfer.effectAllowed = 'move';
    // Add some data to the drag event
    e.dataTransfer.setData('text/plain', JSON.stringify({ sectionIndex, itemIndex }));
  }

  function handleDragOver(e, sectionIndex, itemIndex) {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling to section
    
    if (!draggedItem) return;

    const targetElement = e.currentTarget;
    const rect = targetElement.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    // Clear previous drag indicators
    targetElement.classList.remove(
      'border-t-4', 'border-t-blue-500',
      'border-b-4', 'border-b-blue-500',
      'bg-blue-100', 'scale-95'
    );
    
    // If we're in the same section, allow grouping in the middle zone
    if (draggedItem.sectionIndex === sectionIndex) {
      if (y < rect.height / 3) {
        dragOverPosition = 'top';
        targetElement.classList.add('border-t-4', 'border-t-blue-500');
      } else if (y > (rect.height * 2) / 3) {
        dragOverPosition = 'bottom';
        targetElement.classList.add('border-b-4', 'border-b-blue-500');
      } else {
        dragOverPosition = 'middle';
        targetElement.classList.add('bg-blue-100', 'scale-95');
      }
    } else {
      // If different sections, only allow top/bottom positioning
      if (y < rect.height / 2) {
        dragOverPosition = 'top';
        targetElement.classList.add('border-t-4', 'border-t-blue-500');
      } else {
        dragOverPosition = 'bottom';
        targetElement.classList.add('border-b-4', 'border-b-blue-500');
      }
    }
    
    dragOverItem = { sectionIndex, itemIndex };
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

  function handleDrop(e, sectionIndex, itemIndex) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Item drop:', { 
      sectionIndex, 
      itemIndex, 
      draggedItem, 
      dragOverPosition,
      isSameSection: draggedItem?.sectionIndex === sectionIndex 
    });
    
    e.currentTarget.classList.remove(
      'bg-blue-100',
      'scale-95',
      'transform',
      'border-t-4',
      'border-t-blue-500',
      'border-b-4',
      'border-b-blue-500'
    );

    if (!draggedItem) return;

    sections.update(currentSections => {
      const newSections = [...currentSections];
      const sourceSection = newSections[draggedItem.sectionIndex];
      const targetSection = newSections[sectionIndex];
      
      if (!sourceSection || !targetSection) return currentSections;

      // Handle grouping (only within same section)
      if (dragOverPosition === 'middle' && draggedItem.sectionIndex === sectionIndex) {
        const sourceItem = sourceSection.items[draggedItem.itemIndex];
        const targetItem = targetSection.items[itemIndex];
        
        if (!sourceItem || !targetItem) return currentSections;
        
        // Don't group if already in same group
        if (sourceItem.parallel_group_id && sourceItem.parallel_group_id === targetItem.parallel_group_id) {
          return currentSections;
        }
        
        // Create or join group
        const groupId = targetItem.parallel_group_id || `group_${Date.now()}`;
        sourceItem.parallel_group_id = groupId;
        targetItem.parallel_group_id = groupId;
        
        // Update durations
        const groupDuration = Math.max(
          sourceItem.selected_duration || sourceItem.duration,
          targetItem.selected_duration || targetItem.duration
        );
        
        targetSection.items = targetSection.items.map(item => {
          if (item.parallel_group_id === groupId) {
            return {
              ...item,
              selected_duration: groupDuration,
              duration: groupDuration
            };
          }
          return item;
        });
      } else {
        // Handle moving items between or within sections
        const [originalMovedItem] = sourceSection.items.splice(draggedItem.itemIndex, 1);
        const insertIndex = dragOverPosition === 'bottom' ? itemIndex + 1 : itemIndex;

        // Check if the moved item was part of a group
        let finalMovedItem = originalMovedItem;
        if (originalMovedItem.parallel_group_id) {
          const oldGroupId = originalMovedItem.parallel_group_id;
          
          const remainingGroupItems = sourceSection.items.filter(
            item => item.parallel_group_id === oldGroupId
          );

          if (remainingGroupItems.length <= 1) {
            sourceSection.items = sourceSection.items.map(item => {
              if (item.parallel_group_id === oldGroupId) {
                const { parallel_group_id, ...rest } = item;
                return rest;
              }
              return item;
            });
            const { parallel_group_id, ...rest } = originalMovedItem;
            finalMovedItem = rest;
          }
        }

        targetSection.items.splice(insertIndex, 0, finalMovedItem);
      }
      
      return newSections;
    });

    draggedItem = null;
    dragOverItem = null;
    dragOverPosition = null;
  }

  // Add this new function to handle section drops
  function handleSectionDrop(e, sectionIndex) {
    e.preventDefault();
    if (!draggedItem) return;

    sections.update(currentSections => {
      const newSections = [...currentSections];
      const sourceSection = newSections[draggedItem.sectionIndex];
      const targetSection = newSections[sectionIndex];
      
      // Add the item to the end of the target section
      const [movedItem] = sourceSection.items.splice(draggedItem.itemIndex, 1);
      targetSection.items.push(movedItem);
      
      return newSections;
    });

    draggedItem = null;
    dragOverItem = null;
    dragOverPosition = null;
  }

  // Add this function before the existing removeFromGroup function
  function handleUngroup(itemId) {
    sections.update(currentSections => {
      return currentSections.map(section => {
        const groupId = section.items.find(item => item.id === itemId)?.parallel_group_id;
        if (!groupId) return section;

        const groupSize = section.items.filter(item => item.parallel_group_id === groupId).length;
        
        return {
          ...section,
          items: section.items.map(item => {
            if (groupSize <= 2 && item.parallel_group_id === groupId) {
              // Remove group from all items if only 2 items in group
              const { parallel_group_id, ...rest } = item;
              return rest;
            } else if (item.id === itemId) {
              // Just remove from the one item
              const { parallel_group_id, ...rest } = item;
              return rest;
            }
            return item;
          })
        };
      });
    });
  }

  // Add logging to your drill addition function
  function addDrillToPlan(drill) {
    console.log('[PracticePlanForm] Adding drill to plan:', drill);
    $selectedItems.update(items => {
      const newItems = [...items, {
        id: drill.id,
        type: 'drill',
        name: drill.name,
        drill: drill,
        expanded: false,
        selected_duration: 15, // default duration
        diagram_data: null,
        parallel_group_id: null
      }];
      console.log('[PracticePlanForm] Updated selectedItems:', newItems);
      return newItems;
    });
  }

  // Make sure the drills are being rendered in the template
  $: console.log('[PracticePlanForm] Current selectedItems in template:', $selectedItems);

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

  // When updating selectedItems, use selectedItems.set() instead of direct assignment
  function updateSelectedDrills(drills) {
    selectedItems.set(drills.map(drill => ({
      ...drill,
      type: 'drill',
      expanded: false
    })));
  }

  // In your reactive statement, use $selectedItems for reading
  $: {
    if ($selectedItems?.length > 0) {
      console.log('[PracticePlanForm] First selected item (full object):', 
        JSON.stringify($selectedItems[0], null, 2)
      );
      sections.update(currentSections => {
        const newSections = [...currentSections];
        const skillBuildingSection = newSections.find(s => s.name === 'Skill Building');
        if (skillBuildingSection) {
          skillBuildingSection.items = $selectedItems.map(item => {
            const mappedItem = {
              id: item.id,
              type: item.type,
              name: item.drill?.name || item.name,
              duration: item.selected_duration || item.drill?.duration || 15,
              drill: item.drill,
              selected_duration: item.selected_duration || item.drill?.duration || 15,
              parallel_group_id: item.parallel_group_id,
              skill_level: item.drill?.skill_level || [],
              skills_focused_on: item.drill?.skills_focused_on || [],
              brief_description: item.drill?.brief_description || '',
              video_link: item.drill?.video_link || null,
              diagrams: item.drill?.diagrams || []
            };
            console.log('[PracticePlanForm] Mapped item:', mappedItem);
            return mappedItem;
          });
          console.log('[PracticePlanForm] Updated Skill Building section items:', skillBuildingSection.items);
        }
        return newSections;
      });
    }
  }

  function handleUpdateItems(event) {
    const { type, sourceId, targetId, groupId, position, sourceSectionId, targetSectionId } = event.detail;

    sections.update(currentSections => {
      const newSections = [...currentSections];

      if (type === 'group') {
        // Handle grouping
        newSections.forEach(section => {
          section.items = section.items.map(item => {
            if (item.id === sourceId || item.id === targetId) {
              return {
                ...item,
                parallel_group_id: groupId
              };
            }
            return item;
          });
        });
      } else if (type === 'ungroup') {
        // Handle ungrouping
        newSections.forEach(section => {
          section.items = section.items.map(item => {
            if (item.parallel_group_id === groupId) {
              const { parallel_group_id, ...rest } = item;
              return rest;
            }
            return item;
          });
        });
      } else if (type === 'move') {
        // Handle moving/reordering
        const sourceSection = newSections.find(s => s.id === sourceSectionId);
        const targetSection = newSections.find(s => s.id === targetSectionId);
        
        if (sourceSection && targetSection) {
          const [movedItem] = sourceSection.items.splice(
            sourceSection.items.findIndex(item => item.id === sourceId),
            1
          );

          const targetIndex = targetSection.items.findIndex(item => item.id === targetId);
          const insertIndex = position === 'after' ? targetIndex + 1 : targetIndex;
          
          targetSection.items.splice(insertIndex, 0, movedItem);
        }
      }

      return newSections;
    });
  }

  // Update the reactive statement for practicePlan initialization
  $: if (practicePlan) {
    console.log('[PracticePlanForm] Initializing form with practice plan data', practicePlan);
    
    // Initialize form fields with practice plan data
    planName.set(practicePlan.name || '');
    planDescription.set(practicePlan.description || '');
    phaseOfSeason.set(practicePlan.phase_of_season || '');
    estimatedNumberOfParticipants.set(practicePlan.estimated_number_of_participants?.toString() || '');
    practiceGoals.set(practicePlan.practice_goals || ['']);
    visibility.set(practicePlan.visibility || 'public');
    isEditableByOthers.set(practicePlan.is_editable_by_others || false);

    // Initialize sections
    if (practicePlan.sections?.length) {
      sections.set(practicePlan.sections.map(section => ({
        id: section.id,
        name: section.name,
        order: section.order,
        goals: section.goals || [],
        notes: section.notes || '',
        items: section.items.map(item => ({
          id: item.id,
          type: item.type,
          name: item.type === 'drill' ? item.drill.name : 'Break',
          duration: item.duration,
          drill: item.drill,
          selected_duration: item.duration,
          parallel_group_id: item.parallel_group_id,
          diagram_data: item.diagram_data,
          // Add normalized fields for drills
          skill_level: item.drill?.skill_level || [],
          skills_focused_on: item.drill?.skills_focused_on || [],
          brief_description: item.drill?.brief_description || '',
          video_link: item.drill?.video_link || null,
          diagrams: item.drill?.diagrams || []
        }))
      })));

      // Initialize selectedItems from all sections
      const allItems = practicePlan.sections.flatMap(section => section.items);
      selectedItems.set(allItems);
    }
  }

  // Add this helper function near the top of your script
  function isInGroup(item, items, currentIndex) {
    if (!item.parallel_group_id) return false;
    
    // Check if this item's group has already been rendered
    return items.some((otherItem, idx) => 
      idx < currentIndex && 
      otherItem.parallel_group_id === item.parallel_group_id
    );
  }

  // Add this reactive statement near your other reactive statements
  $: {
    if (!$page.data.session) {
      visibility.set('public');
      isEditableByOthers.set(true);
    }
  }

  // Add handler for rich text changes
  function handleDescriptionChange(e) {
    planDescription.set(e.detail.content);
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
          value={$planDescription}
          on:change={handleDescriptionChange}
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
    {#each $sections as section, sectionIndex (section.id)}
      <div 
        class="section-container bg-white rounded-lg shadow-sm p-4 mb-4"
        on:dragover|preventDefault={(e) => {
          // Only show section drop indicator if we're not over an item
          if (!e.target.closest('.timeline-item')) {
            e.currentTarget.classList.add('section-drag-over');
          }
        }}
        on:dragleave|preventDefault={(e) => {
          e.currentTarget.classList.remove('section-drag-over');
        }}
        on:drop|preventDefault={(e) => {
          // Only handle section-level drop if we're not over an item
          if (!e.target.closest('.timeline-item')) {
            e.currentTarget.classList.remove('section-drag-over');
            handleSectionDrop(e, sectionIndex);
          }
        }}
      >
        <div class="section-header flex items-center gap-4 mb-4">
          <input
            type="text"
            bind:value={section.name}
            class="text-xl font-semibold bg-transparent border-b border-gray-200 focus:border-blue-500 focus:outline-none"
            placeholder="Section Name"
          />
          <button
            class="text-red-500 hover:text-red-700"
            on:click={() => removeSection(section.id)}
          >
            Remove Section
          </button>
          <span class="text-sm text-gray-500">({section.items?.length || 0} items)</span>
        </div>

        <ul 
          class="space-y-4"
          on:dragover|preventDefault
          on:drop|preventDefault
        >
          {#if section.items && section.items.length > 0}
            {#each section.items as item, itemIndex (item.id || `${section.id}-item-${itemIndex}`)}
              {#if item.parallel_group_id && !isInGroup(item, section.items, itemIndex)}
                <div class="parallel-group-container">
                  <div class="parallel-group-member">
                    <li 
                      class="timeline-item relative transition-all duration-200"
                      draggable="true"
                      on:dragstart={(e) => {
                        handleDragStart(e, sectionIndex, itemIndex);
                      }}
                      on:dragover={(e) => {
                        handleDragOver(e, sectionIndex, itemIndex);
                      }}
                      on:dragleave={handleDragLeave}
                      on:drop={(e) => {
                        handleDrop(e, sectionIndex, itemIndex);
                      }}
                    >
                      <div class="bg-white p-4 rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md">
                        <div class="flex justify-between items-center">
                          <div class="flex items-center">
                            <div class="mr-2 cursor-grab">⋮⋮</div>
                            <span>{item.name}</span>
                          </div>
                          <div class="flex items-center space-x-2">
                            <span>{item.selected_duration || item.duration} minutes</span>
                            <button 
                              class="text-red-500 hover:text-red-700 text-sm"
                              on:click={() => handleUngroup(item.id)}
                            >
                              Ungroup
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  </div>
                  
                  {#each section.items.filter(i => i.parallel_group_id === item.parallel_group_id && i.id !== item.id) as groupedItem}
                    <div class="parallel-group-member">
                      <li 
                        class="timeline-item relative transition-all duration-200"
                        draggable="true"
                        on:dragstart={(e) => {
                          handleDragStart(e, sectionIndex, section.items.indexOf(groupedItem));
                        }}
                        on:dragover={(e) => {
                          handleDragOver(e, sectionIndex, section.items.indexOf(groupedItem));
                        }}
                        on:dragleave={handleDragLeave}
                        on:drop={(e) => {
                          handleDrop(e, sectionIndex, section.items.indexOf(groupedItem));
                        }}
                      >
                        <div class="bg-white p-4 rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md">
                          <div class="flex justify-between items-center">
                            <div class="flex items-center">
                              <div class="mr-2 cursor-grab">⋮⋮</div>
                              <span>{groupedItem.name}</span>
                            </div>
                            <div class="flex items-center space-x-2">
                              <span>{groupedItem.selected_duration || groupedItem.duration} minutes</span>
                              <button 
                                class="text-red-500 hover:text-red-700 text-sm"
                                on:click={() => handleUngroup(groupedItem.id)}
                              >
                                Ungroup
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    </div>
                  {/each}
                </div>
              {:else if !isInGroup(item, section.items, itemIndex)}
                <li 
                  class="timeline-item relative transition-all duration-200"
                  draggable="true"
                  on:dragstart={(e) => {
                    handleDragStart(e, sectionIndex, itemIndex);
                  }}
                  on:dragover={(e) => {
                    handleDragOver(e, sectionIndex, itemIndex);
                  }}
                  on:dragleave={handleDragLeave}
                  on:drop={(e) => {
                    handleDrop(e, sectionIndex, itemIndex);
                  }}
                >
                  <div class="bg-white p-4 rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md">
                    <div class="flex justify-between items-center">
                      <div class="flex items-center">
                        <div class="mr-2 cursor-grab">⋮⋮</div>
                        <span>{item.name}</span>
                      </div>
                      <div class="flex items-center space-x-2">
                        <span>{item.selected_duration || item.duration} minutes</span>
                        <button 
                          class="text-red-500 hover:text-red-700 text-sm"
                          on:click={() => removeItem(sectionIndex, itemIndex)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              {/if}
            {/each}
          {:else}
            <li class="text-gray-500 italic p-4 border-2 border-dashed border-gray-300 rounded-lg">
              Drop items here
            </li>
          {/if}
        </ul>
      </div>
    {/each}

    <button
      class="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
      on:click={addSection}
    >
      + Add Section
    </button>
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
  .timeline-items {
    position: relative;
    padding-left: 1rem;
  }

  .timeline-item {
    position: relative;
    transition: all 0.2s ease;
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

  .timeline-item {
    position: relative;
    transition: all 0.2s ease;
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
</style>