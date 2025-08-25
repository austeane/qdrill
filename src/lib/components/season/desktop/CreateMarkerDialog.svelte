<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { dev } from '$app/environment';
  import { apiFetch } from '$lib/utils/apiFetch.js';
  import { toast } from '@zerodevx/svelte-toast';
  import { Button } from '$lib/components/ui/button';
  import Input from '$lib/components/ui/Input.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import Textarea from '$lib/components/ui/Textarea.svelte';
  import Checkbox from '$lib/components/ui/Checkbox.svelte';
  import Dialog from '$lib/components/ui/Dialog.svelte';
  
  export let open = false;
  export let season = null;
  export let marker = null;
  export let defaultDate = null;
  
  const dispatch = createEventDispatcher();
  
  let loading = false;
  let isEditing = !!marker;
  
  let formData = {
    name: marker?.name || '',
    description: marker?.description || '',
    date: marker?.date || marker?.start_date || defaultDate || new Date().toISOString().split('T')[0],
    end_date: marker?.end_date || '',
    color: marker?.color || '#3b82f6',
    type: marker?.type || 'event',
    is_range: !!marker?.end_date
  };
  
  const markerTypes = [
    { value: 'event', label: 'Event' },
    { value: 'milestone', label: 'Milestone' },
    { value: 'tournament', label: 'Tournament' },
    { value: 'break', label: 'Break' },
    { value: 'deadline', label: 'Deadline' }
  ];
  
  const colorOptions = [
    { value: '#3b82f6', label: 'Blue' },
    { value: '#10b981', label: 'Green' },
    { value: '#f59e0b', label: 'Amber' },
    { value: '#ef4444', label: 'Red' },
    { value: '#8b5cf6', label: 'Purple' },
    { value: '#ec4899', label: 'Pink' },
    { value: '#6b7280', label: 'Gray' }
  ];
  
  async function handleSave() {
    if (!formData.name.trim()) {
      toast.push('Event name is required', {
        theme: {
          '--toastBackground': '#ef4444',
          '--toastColor': 'white'
        }
      });
      return;
    }
    
    if (!formData.date) {
      toast.push('Event date is required', {
        theme: {
          '--toastBackground': '#ef4444',
          '--toastColor': 'white'
        }
      });
      return;
    }
    
    if (formData.is_range && !formData.end_date) {
      toast.push('End date is required for date ranges', {
        theme: {
          '--toastBackground': '#ef4444',
          '--toastColor': 'white'
        }
      });
      return;
    }
    
    loading = true;
    
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        date: formData.date,
        color: formData.color,
        type: formData.type,
        season_id: season.id
      };
      
      if (formData.is_range && formData.end_date) {
        payload.start_date = formData.date;
        payload.end_date = formData.end_date;
        delete payload.date;
      }
      
      let response;
      if (isEditing) {
        response = await apiFetch(`/api/seasons/${season.id}/markers/${marker.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        
        toast.push('Event updated successfully', {
          theme: {
            '--toastBackground': '#10b981',
            '--toastColor': 'white'
          }
        });
      } else {
        response = await apiFetch(`/api/seasons/${season.id}/markers`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        
        toast.push('Event created successfully', {
          theme: {
            '--toastBackground': '#10b981',
            '--toastColor': 'white'
          }
        });
      }
      
      dispatch('save', response);
      handleClose();
    } catch (error) {
      console.error('Failed to save marker:', error);
      toast.push(error.message || `Failed to ${isEditing ? 'update' : 'create'} event`, {
        theme: {
          '--toastBackground': '#ef4444',
          '--toastColor': 'white'
        }
      });
    } finally {
      loading = false;
    }
  }
  
  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    loading = true;
    
    try {
      await apiFetch(`/api/seasons/${season.id}/markers/${marker.id}`, {
        method: 'DELETE'
      });
      
      toast.push('Event deleted successfully', {
        theme: {
          '--toastBackground': '#10b981',
          '--toastColor': 'white'
        }
      });
      
      dispatch('delete', marker.id);
      handleClose();
    } catch (error) {
      console.error('Failed to delete marker:', error);
      toast.push(error.message || 'Failed to delete event', {
        theme: {
          '--toastBackground': '#ef4444',
          '--toastColor': 'white'
        }
      });
    } finally {
      loading = false;
    }
  }
  
  function handleClose() {
    dispatch('close');
    resetForm();
  }
  
  function resetForm() {
    formData = {
      name: '',
      description: '',
      date: defaultDate || new Date().toISOString().split('T')[0],
      end_date: '',
      color: '#3b82f6',
      type: 'event',
      is_range: false
    };
  }
  
  function handleColorSelect(color) {
    formData.color = color;
  }

  onMount(() => {
    if (dev) {
      console.log('[CreateMarkerDialog] mounted', { open, isEditing, defaultDate });
    }
  });
</script>

<Dialog 
  bind:open 
  title={isEditing ? 'Edit Event' : 'Create Event'} 
  description={isEditing ? 'Update event details' : 'Add a new event or milestone to your season'}
  on:close={handleClose}
>
  <div class="grid gap-4">
    <Input
      label="Event Name"
      placeholder="e.g., Regional Tournament"
      bind:value={formData.name}
      required
      disabled={loading}
    />
    
    <Select
      label="Event Type"
      bind:value={formData.type}
      options={markerTypes}
      disabled={loading}
    />
    
    <Textarea
      label="Description"
      placeholder="Optional description or notes"
      bind:value={formData.description}
      rows={3}
      disabled={loading}
    />
    
    <div class="grid gap-2">
      <Checkbox
        label="Date range (multi-day event)"
        bind:checked={formData.is_range}
        disabled={loading}
      />
      
      <div class="grid gap-2 {formData.is_range ? 'sm:grid-cols-2' : ''}">
        <Input
          label={formData.is_range ? 'Start Date' : 'Date'}
          type="date"
          bind:value={formData.date}
          required
          disabled={loading}
        />
        
        {#if formData.is_range}
          <Input
            label="End Date"
            type="date"
            bind:value={formData.end_date}
            min={formData.date}
            required
            disabled={loading}
          />
        {/if}
      </div>
    </div>
    
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Event Color
      </label>
      <div class="flex gap-2 flex-wrap">
        {#each colorOptions as option}
          <button
            type="button"
            class="w-10 h-10 rounded-lg border-2 transition-all {formData.color === option.value ? 'border-gray-900 dark:border-white scale-110' : 'border-gray-300 dark:border-gray-600'}"
            style="background-color: {option.value}"
            on:click={() => handleColorSelect(option.value)}
            disabled={loading}
            aria-label="Select {option.label} color"
          />
        {/each}
      </div>
    </div>
  </div>
  
  <div slot="footer" class="flex justify-between">
    <div>
      {#if isEditing}
        <Button 
          variant="destructive" 
          on:click={handleDelete} 
          disabled={loading}
        >
          Delete Event
        </Button>
      {/if}
    </div>
    
    <div class="flex gap-2">
      <Button variant="ghost" on:click={handleClose} disabled={loading}>
        Cancel
      </Button>
      <Button 
        variant="primary" 
        on:click={handleSave} 
        disabled={!formData.name.trim() || !formData.date || loading}
      >
        {#if loading}
          {isEditing ? 'Updating...' : 'Creating...'}
        {:else}
          {isEditing ? 'Update Event' : 'Create Event'}
        {/if}
      </Button>
    </div>
  </div>
</Dialog>
