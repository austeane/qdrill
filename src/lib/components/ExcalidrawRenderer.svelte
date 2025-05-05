<script>
  // Thin wrapper to render Excalidraw diagrams in readonly mode for admin/testing pages.
  import ExcalidrawWrapper from '$lib/components/ExcalidrawWrapper.svelte';

  /** @type {import('$lib/components/ExcalidrawWrapper.svelte').default} */
  export let sceneData;
</script>

<ExcalidrawWrapper data={sceneData} readonly={true} showSaveButton={false} /> 