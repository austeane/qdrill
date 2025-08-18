<script>
  import { createEventDispatcher } from 'svelte';
  import { apiFetch } from '$lib/utils/apiFetch.js';
  import { toast } from '@zerodevx/svelte-toast';
  import BottomSheet from '$lib/components/ui/BottomSheet.svelte';
  
  export let season = null;
  export let section = null;
  export let teamId = '';
  
  const dispatch = createEventDispatcher();
  
  let loading = false;
  let name = section?.name || '';
  let color = section?.color || '#2563eb';
  let startDate = section?.start_date || season?.start_date || '';
  let endDate = section?.end_date || season?.end_date || '';
  let seedDefaults = false;
  
  $: open = true;
  $: isEdit = !!section;
  
  // Predefined colors
  const colors = [
    '#2563eb', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#f97316', // Orange
  ];
  
  // Quick date range options
  function setDateRange(option) {
    const today = new Date();
    const start = new Date(today);
    
    switch (option) {
      case 'this-week':
        // Start from Sunday of this week
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - dayOfWeek);
        startDate = start.toISOString().split('T')[0];
        
        const endOfWeek = new Date(start);
        endOfWeek.setDate(start.getDate() + 6);
        endDate = endOfWeek.toISOString().split('T')[0];
        break;
        
      case 'next-4-weeks':
        startDate = today.toISOString().split('T')[0];
        const fourWeeksLater = new Date(today);
        fourWeeksLater.setDate(today.getDate() + 28);
        endDate = fourWeeksLater.toISOString().split('T')[0];
        break;
        
      case 'to-season-end':
        startDate = today.toISOString().split('T')[0];
        endDate = season?.end_date || '';
        break;
    }
  }
  
  // Nudge dates by a week
  function nudgeDates(weeks) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    start.setDate(start.getDate() + (weeks * 7));
    end.setDate(end.getDate() + (weeks * 7));
    
    // Ensure within season bounds
    const seasonStart = new Date(season.start_date);
    const seasonEnd = new Date(season.end_date);
    
    if (start >= seasonStart && end <= seasonEnd) {
      startDate = start.toISOString().split('T')[0];
      endDate = end.toISOString().split('T')[0];
    }
  }
  
  async function handleSave() {
    if (!name.trim()) {
      toast.push('Please enter a section name', {
        theme: {
          '--toastBackground': '#ef4444',
          '--toastColor': 'white'
        }
      });
      return;
    }
    
    if (!startDate || !endDate) {
      toast.push('Please select date range', {
        theme: {
          '--toastBackground': '#ef4444',
          '--toastColor': 'white'
        }
      });
      return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      toast.push('End date must be after start date', {
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
        name: name.trim(),
        color,
        start_date: startDate,
        end_date: endDate
      };
      
      if (!isEdit && seedDefaults) {
        payload.seed_default_sections = true;
      }
      
      const response = await apiFetch(
        isEdit 
          ? `/api/seasons/${season.id}/sections/${section.id}`
          : `/api/seasons/${season.id}/sections`,
        {
          method: isEdit ? 'PUT' : 'POST',
          body: JSON.stringify(payload)
        }
      );
      
      toast.push(
        isEdit ? 'Section updated successfully' : 'Section created successfully',
        {
          theme: {
            '--toastBackground': '#10b981',
            '--toastColor': 'white'
          }
        }
      );
      
      dispatch('save', response);
      handleClose();
    } catch (error) {
      console.error('Failed to save section:', error);
      toast.push(error.message || 'Failed to save section', {
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
    open = false;
    setTimeout(() => dispatch('close'), 200);
  }
</script>

<BottomSheet
  bind:open
  title={isEdit ? 'Edit Section' : 'Create Section'}
  height="auto"
  on:close={handleClose}
>
  <div class="form-content">
    <!-- Name -->
    <div class="form-group">
      <label for="section-name" class="form-label">
        Section Name
      </label>
      <input
        id="section-name"
        type="text"
        bind:value={name}
        placeholder="e.g., Pre-season, Regular Season"
        class="form-input"
        disabled={loading}
      />
    </div>
    
    <!-- Color Selection -->
    <div class="form-group">
      <label class="form-label">Color</label>
      <div class="color-grid">
        {#each colors as c}
          <button
            class="color-option"
            class:selected={color === c}
            style="background-color: {c}"
            on:click={() => color = c}
            aria-label="Select color {c}"
            disabled={loading}
          />
        {/each}
      </div>
    </div>
    
    <!-- Date Range -->
    <div class="form-group">
      <label class="form-label">Date Range</label>
      
      {#if !isEdit}
        <div class="quick-options">
          <button
            class="quick-button"
            on:click={() => setDateRange('this-week')}
            disabled={loading}
          >
            This week
          </button>
          <button
            class="quick-button"
            on:click={() => setDateRange('next-4-weeks')}
            disabled={loading}
          >
            Next 4 weeks
          </button>
          <button
            class="quick-button"
            on:click={() => setDateRange('to-season-end')}
            disabled={loading}
          >
            To season end
          </button>
        </div>
      {/if}
      
      <div class="date-inputs">
        <div class="date-field">
          <label for="start-date" class="date-label">Start</label>
          <input
            id="start-date"
            type="date"
            bind:value={startDate}
            min={season?.start_date}
            max={season?.end_date}
            class="form-input"
            disabled={loading}
          />
        </div>
        
        <div class="date-field">
          <label for="end-date" class="date-label">End</label>
          <input
            id="end-date"
            type="date"
            bind:value={endDate}
            min={startDate}
            max={season?.end_date}
            class="form-input"
            disabled={loading}
          />
        </div>
      </div>
      
      {#if isEdit}
        <div class="nudge-buttons">
          <button
            class="nudge-button"
            on:click={() => nudgeDates(-1)}
            disabled={loading}
          >
            ← 1 week earlier
          </button>
          <button
            class="nudge-button"
            on:click={() => nudgeDates(1)}
            disabled={loading}
          >
            1 week later →
          </button>
        </div>
      {/if}
    </div>
    
    <!-- Seed Defaults Option (only for new sections) -->
    {#if !isEdit}
      <div class="form-group">
        <label class="checkbox-label">
          <input
            type="checkbox"
            bind:checked={seedDefaults}
            disabled={loading}
          />
          <div>
            <span>Seed default practice sections</span>
            <p class="checkbox-helper">
              Automatically add Introduction, Fundamentals, Formations, Plays, and Tactics sections to practices in this date range
            </p>
          </div>
        </label>
      </div>
    {/if}
  </div>
  
  <div slot="footer" class="footer-buttons">
    <button
      class="button button-secondary"
      on:click={handleClose}
      disabled={loading}
    >
      Cancel
    </button>
    <button
      class="button button-primary"
      on:click={handleSave}
      disabled={loading}
    >
      {loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Section')}
    </button>
  </div>
</BottomSheet>

<style>
  .form-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .form-label {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
  }
  
  .form-input {
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 16px;
    color: #111827;
    background: white;
  }
  
  .form-input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
  
  .form-input:disabled {
    background: #f3f4f6;
    color: #6b7280;
  }
  
  .color-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }
  
  .color-option {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 8px;
    border: 2px solid transparent;
    cursor: pointer;
    transition: transform 0.2s;
  }
  
  .color-option:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .color-option:not(:disabled):active {
    transform: scale(0.95);
  }
  
  .color-option.selected {
    border-color: #111827;
    box-shadow: 0 0 0 2px white, 0 0 0 4px #111827;
  }
  
  .quick-options {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .quick-button {
    padding: 8px 12px;
    background: #eff6ff;
    border: none;
    border-radius: 6px;
    color: #2563eb;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
  }
  
  .quick-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .quick-button:not(:disabled):active {
    background: #dbeafe;
  }
  
  .date-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  
  .date-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .date-label {
    font-size: 12px;
    color: #6b7280;
  }
  
  .nudge-buttons {
    display: flex;
    gap: 8px;
  }
  
  .nudge-button {
    flex: 1;
    padding: 8px 12px;
    background: #f3f4f6;
    border: none;
    border-radius: 6px;
    color: #374151;
    font-size: 13px;
    cursor: pointer;
  }
  
  .nudge-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .nudge-button:not(:disabled):active {
    background: #e5e7eb;
  }
  
  .checkbox-label {
    display: flex;
    gap: 12px;
    cursor: pointer;
  }
  
  .checkbox-label input[type="checkbox"] {
    width: 20px;
    height: 20px;
    margin-top: 2px;
    cursor: pointer;
    flex-shrink: 0;
  }
  
  .checkbox-label span {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
  }
  
  .checkbox-helper {
    font-size: 13px;
    color: #6b7280;
    margin: 4px 0 0 0;
  }
  
  .footer-buttons {
    display: flex;
    gap: 12px;
    width: 100%;
  }
  
  .button {
    flex: 1;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    border: none;
  }
  
  .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .button-secondary {
    background: #f3f4f6;
    color: #374151;
  }
  
  .button-secondary:not(:disabled):active {
    background: #e5e7eb;
  }
  
  .button-primary {
    background: #2563eb;
    color: white;
  }
  
  .button-primary:not(:disabled):active {
    background: #1d4ed8;
  }
  
  /* Dark mode */
  :global(.dark) .form-label,
  :global(.dark) .checkbox-label span {
    color: #d1d5db;
  }
  
  :global(.dark) .form-input {
    background: #374151;
    border-color: #4b5563;
    color: #f3f4f6;
  }
  
  :global(.dark) .form-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  :global(.dark) .form-input:disabled {
    background: #1f2937;
    color: #9ca3af;
  }
  
  :global(.dark) .color-option.selected {
    box-shadow: 0 0 0 2px #1f2937, 0 0 0 4px #f3f4f6;
  }
  
  :global(.dark) .quick-button {
    background: #1e3a8a;
    color: #93bbfe;
  }
  
  :global(.dark) .quick-button:not(:disabled):active {
    background: #1e40af;
  }
  
  :global(.dark) .date-label,
  :global(.dark) .checkbox-helper {
    color: #9ca3af;
  }
  
  :global(.dark) .nudge-button {
    background: #374151;
    color: #d1d5db;
  }
  
  :global(.dark) .nudge-button:not(:disabled):active {
    background: #4b5563;
  }
  
  :global(.dark) .button-secondary {
    background: #374151;
    color: #d1d5db;
  }
  
  :global(.dark) .button-secondary:not(:disabled):active {
    background: #4b5563;
  }
  
  :global(.dark) .button-primary {
    background: #3b82f6;
  }
  
  :global(.dark) .button-primary:not(:disabled):active {
    background: #2563eb;
  }
</style>