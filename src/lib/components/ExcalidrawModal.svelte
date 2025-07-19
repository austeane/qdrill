<script>
import { createEventDispatcher, onMount, tick } from 'svelte';
import { createExcalidrawComponent } from '$lib/utils/createExcalidrawComponent.js';

export let initialData;
export let readonly = false;

const dispatch = createEventDispatcher();
let excalidrawAPI;
let ExcalidrawComponent;
let container;

function handleSave() {
if (!excalidrawAPI) return;
const elements = excalidrawAPI.getSceneElements();
const appState = excalidrawAPI.getAppState();
const files = excalidrawAPI.getFiles();
dispatch('save', { elements, appState, files });
}

function handleCancel() {
dispatch('cancel');
}

onMount(async () => {
ExcalidrawComponent = await createExcalidrawComponent({
excalidrawAPI: (api) => (excalidrawAPI = api),
initialData,
viewModeEnabled: readonly,
onChange: () => {},
gridModeEnabled: false,
theme: 'light',
name: 'fullscreen',
UIOptions: {
canvasActions: { export: false, loadScene: false, saveAsImage: false, theme: false }
}
});
await tick();
});
</script>

<div class="modal-overlay">
<div class="modal-content">
<div class="modal-header">
<h2 class="text-xl font-bold">Edit Diagram</h2>
<div class="flex gap-2">
<button
class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
on:click={handleSave}
>
Save &amp; Close
</button>
<button
class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
on:click={handleCancel}
>
Cancel
</button>
</div>
</div>
<div class="editor-container" bind:this={container}>
{#if ExcalidrawComponent}
<div class="excalidraw-fullscreen-wrapper" use:ExcalidrawComponent.render></div>
{/if}
</div>
</div>
</div>

<style>
.modal-overlay {
position: fixed;
top: 0;
left: 0;
right: 0;
bottom: 0;
background: rgba(0, 0, 0, 0.75);
display: flex;
align-items: center;
justify-content: center;
z-index: 9999;
}

.modal-content {
width: 95vw;
height: 95vh;
background: white;
display: flex;
flex-direction: column;
border-radius: 0.5rem;
overflow: hidden;
}

.modal-header {
padding: 1rem;
background-color: white;
border-bottom: 1px solid #e5e7eb;
z-index: 1;
}

.editor-container {
flex: 1;
position: relative;
overflow: hidden;
}

.excalidraw-fullscreen-wrapper {
position: absolute;
top: 0;
left: 0;
right: 0;
bottom: 0;
overflow: hidden;
}

:global(.excalidraw-fullscreen-wrapper .excalidraw) {
width: 100% !important;
height: 100% !important;
}

:global(.excalidraw-fullscreen-wrapper .excalidraw-container) {
width: 100% !important;
height: 100% !important;
}
</style>
