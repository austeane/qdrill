<script>
	import { undo, redo, getCanUndo, getCanRedo } from '$lib/stores/historyStore';
	import { getTotalPlanDuration } from '$lib/stores/sectionsStore';
	import { practicePlanMetadataStore } from '$lib/stores/practicePlanMetadataStore';
	import { formatTime } from '$lib/utils/timeUtils';
	import { Button } from '$lib/components/ui/button';
	import { Undo2, Redo2 } from 'lucide-svelte';

	const totalPlanDuration = $derived(getTotalPlanDuration());
	const canUndo = $derived(getCanUndo());
	const canRedo = $derived(getCanRedo());
</script>

<div class="bg-blue-50 p-4 rounded-lg shadow-sm flex justify-between items-center">
	<div>
		<h2 class="font-semibold text-blue-800">Practice Duration</h2>
		<p class="text-blue-600">
			Start: {formatTime(practicePlanMetadataStore.startTime)} • Total: {totalPlanDuration} minutes
		</p>
		<p class="text-xs text-blue-500 mt-1">Keyboard shortcuts: Ctrl+Z (Undo), Ctrl+Shift+Z (Redo)</p>
	</div>
	<div class="flex items-center gap-4">
		<Button variant="outline" size="icon" onclick={undo} disabled={!canUndo} title="Undo">
			<Undo2 size={20} />
		</Button>
		<Button variant="outline" size="icon" onclick={redo} disabled={!canRedo} title="Redo">
			<Redo2 size={20} />
		</Button>
		<div class="text-3xl font-bold text-blue-700">{totalPlanDuration}m</div>
	</div>
</div>
