<script>
  import { undo, redo, canUndo, canRedo } from '$lib/stores/historyStore';
  import { totalPlanDuration } from '$lib/stores/sectionsStore';
  import { startTime } from '$lib/stores/practicePlanMetadataStore';
  import { formatTime } from '$lib/utils/timeUtils';
  import { Button } from '$lib/components/ui/button';
</script>

<div class="bg-blue-50 p-4 rounded-lg shadow-sm flex justify-between items-center">
  <div>
    <h2 class="font-semibold text-blue-800">Practice Duration</h2>
    <p class="text-blue-600">Start: {formatTime($startTime)} • Total: {$totalPlanDuration} minutes</p>
    <p class="text-xs text-blue-500 mt-1">Keyboard shortcuts: Ctrl+Z (Undo), Ctrl+Shift+Z (Redo)</p>
  </div>
  <div class="flex items-center gap-4">
    <Button variant="outline" size="icon" on:click={undo} disabled={!$canUndo} title="Undo">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
      </svg>
    </Button>
    <Button variant="outline" size="icon" on:click={redo} disabled={!$canRedo} title="Redo">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="m15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3" />
      </svg>
    </Button>
    <div class="text-3xl font-bold text-blue-700">{$totalPlanDuration}m</div>
  </div>
</div>
