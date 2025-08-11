<script>
  import { createEventDispatcher } from 'svelte';
  
  export let recurrence = null;
  export let season = null;
  export let templates = [];
  
  const dispatch = createEventDispatcher();
  
  let formData = {
    name: '',
    pattern: 'weekly',
    day_of_week: [],
    day_of_month: [],
    time_of_day: '18:00',
    duration_minutes: 90,
    template_plan_id: null,
    skip_markers: false,
    is_active: true
  };
  
  if (recurrence) {
    formData = { ...recurrence };
  }
  
  const weekDays = [
    { value: 0, label: 'Sunday', short: 'Sun' },
    { value: 1, label: 'Monday', short: 'Mon' },
    { value: 2, label: 'Tuesday', short: 'Tue' },
    { value: 3, label: 'Wednesday', short: 'Wed' },
    { value: 4, label: 'Thursday', short: 'Thu' },
    { value: 5, label: 'Friday', short: 'Fri' },
    { value: 6, label: 'Saturday', short: 'Sat' }
  ];
  
  function toggleWeekDay(day) {
    if (formData.day_of_week.includes(day)) {
      formData.day_of_week = formData.day_of_week.filter(d => d !== day);
    } else {
      formData.day_of_week = [...formData.day_of_week, day];
    }
  }
  
  function toggleMonthDay(day) {
    if (formData.day_of_month.includes(day)) {
      formData.day_of_month = formData.day_of_month.filter(d => d !== day);
    } else {
      formData.day_of_month = [...formData.day_of_month, day];
    }
  }
  
  async function handleSubmit() {
    const data = { ...formData };
    
    // Clean up data based on pattern
    if (data.pattern !== 'monthly') {
      data.day_of_month = [];
    }
    if (data.pattern === 'monthly') {
      data.day_of_week = [];
    }
    
    dispatch('save', data);
  }
  
  function handleCancel() {
    dispatch('cancel');
  }
</script>

<div class="space-y-4">
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">
      Recurrence Name
    </label>
    <input
      type="text"
      bind:value={formData.name}
      class="w-full border rounded px-3 py-2"
      placeholder="e.g., Regular Practice Schedule"
      required
    />
  </div>
  
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">
      Pattern
    </label>
    <select
      bind:value={formData.pattern}
      class="w-full border rounded px-3 py-2"
    >
      <option value="weekly">Weekly</option>
      <option value="biweekly">Biweekly</option>
      <option value="monthly">Monthly</option>
    </select>
  </div>
  
  {#if formData.pattern === 'weekly' || formData.pattern === 'biweekly'}
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Days of Week
      </label>
      <div class="flex flex-wrap gap-2">
        {#each weekDays as day}
          <button
            type="button"
            class="px-3 py-2 rounded border transition-colors
                   {formData.day_of_week.includes(day.value) 
                     ? 'bg-blue-500 text-white border-blue-500' 
                     : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
            on:click={() => toggleWeekDay(day.value)}
          >
            {day.short}
          </button>
        {/each}
      </div>
    </div>
  {/if}
  
  {#if formData.pattern === 'monthly'}
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Days of Month
      </label>
      <div class="grid grid-cols-7 gap-1">
        {#each Array(31) as _, i}
          {@const day = i + 1}
          <button
            type="button"
            class="p-2 text-sm rounded border transition-colors
                   {formData.day_of_month.includes(day) 
                     ? 'bg-blue-500 text-white border-blue-500' 
                     : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}"
            on:click={() => toggleMonthDay(day)}
          >
            {day}
          </button>
        {/each}
      </div>
    </div>
  {/if}
  
  <div class="grid grid-cols-2 gap-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Time of Day
      </label>
      <input
        type="time"
        bind:value={formData.time_of_day}
        class="w-full border rounded px-3 py-2"
      />
    </div>
    
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Duration (minutes)
      </label>
      <input
        type="number"
        bind:value={formData.duration_minutes}
        min="15"
        max="480"
        step="15"
        class="w-full border rounded px-3 py-2"
      />
    </div>
  </div>
  
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">
      Template Practice Plan (Optional)
    </label>
    <select
      bind:value={formData.template_plan_id}
      class="w-full border rounded px-3 py-2"
    >
      <option value={null}>Use season template</option>
      {#each templates as template}
        <option value={template.id}>{template.name}</option>
      {/each}
    </select>
  </div>
  
  <div class="space-y-2">
    <label class="flex items-center space-x-2">
      <input
        type="checkbox"
        bind:checked={formData.skip_markers}
        class="rounded"
      />
      <span class="text-sm">Skip dates with events/markers</span>
    </label>
    
    <label class="flex items-center space-x-2">
      <input
        type="checkbox"
        bind:checked={formData.is_active}
        class="rounded"
      />
      <span class="text-sm">Active</span>
    </label>
  </div>
  
  <div class="flex justify-end space-x-2 pt-4 border-t">
    <button
      type="button"
      on:click={handleCancel}
      class="px-4 py-2 border rounded hover:bg-gray-50"
    >
      Cancel
    </button>
    <button
      type="button"
      on:click={handleSubmit}
      disabled={!formData.name || (formData.pattern !== 'monthly' && formData.day_of_week.length === 0) || (formData.pattern === 'monthly' && formData.day_of_month.length === 0)}
      class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {recurrence ? 'Update' : 'Create'} Recurrence
    </button>
  </div>
</div>