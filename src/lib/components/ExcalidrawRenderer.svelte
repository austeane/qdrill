<script>
	// Thin wrapper to render Excalidraw diagrams in readonly mode for admin/testing pages.
	import ExcalidrawWrapper from '$lib/components/ExcalidrawWrapper.svelte';

	let { sceneData = null } = $props();
</script>

<ExcalidrawWrapper data={sceneData} readonly={true} showSaveButton={false} />
