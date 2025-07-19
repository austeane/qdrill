<script>
// Thin wrapper to render Excalidraw diagrams in readonly mode for admin/testing pages.
import ExcalidrawWrapper from '$lib/components/ExcalidrawWrapper.svelte';

export let sceneData;
</script>

<ExcalidrawWrapper data={sceneData} id="renderer-diagram" readonly={true} />
