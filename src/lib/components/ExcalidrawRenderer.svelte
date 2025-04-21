<script>
  // Thin wrapper to render Excalidraw diagrams in readonly mode for admin/testing pages.
  import ExcalidrawWrapper from '../../components/ExcalidrawWrapper.svelte';

  /** @type {import('../../components/ExcalidrawWrapper.svelte').default} */
  export let sceneData;
</script>

<ExcalidrawWrapper data={sceneData} readonly={true} showSaveButton={false} /> 