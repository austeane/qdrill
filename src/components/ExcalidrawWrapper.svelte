<script>
  import { onMount, createEventDispatcher, tick } from 'svelte';
  import { browser } from '$app/environment';
  import { v4 as uuidv4 } from 'uuid';

  export let data = null;
  export let id = '';
  export let showSaveButton = false;
  export let index;
  export let readonly = false;

  const dispatch = createEventDispatcher();
  let excalidrawAPI;
  let ExcalidrawComponent;
  let isFullscreen = false;
  let initialSceneData = null;
  let excalidrawWrapper;

  const quaffleUrl = '/images/quaffle.webp';
  const bludgerUrl = '/images/bludger.webp';
  const coneUrl = '/images/cone.webp';

  const CANVAS_WIDTH = 500;
  const CANVAS_HEIGHT = 600;

  let showModal = false;

  let readOnlyExcalidrawAPI;

  console.log('Component initialization - data:', data);

  function openEditor() {
    console.log('Opening editor modal');
    showModal = true;
  }

  function closeEditor() {
    showModal = false;
  }

  if (browser) {
    window.process = {
      env: {
        NODE_ENV: import.meta.env.MODE
      }
    };
  }

  async function loadImageAsDataUrl(url) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error(`Error loading image from ${url}:`, error);
      return null;
    }
  }

  function createGuideRectangle() {
    return {
      id: uuidv4(),
      type: 'rectangle',
      x: 0,
      y: 0,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      angle: 0,
      strokeColor: '#ff0000',
      backgroundColor: 'transparent',
      fillStyle: 'solid',
      strokeWidth: 2,
      strokeStyle: 'dashed',
      roughness: 0,
      opacity: 30,
      groupIds: [],
      strokeSharpness: 'sharp',
      seed: Math.floor(Math.random() * 1000000),
      version: 1,
      versionNonce: Math.floor(Math.random() * 1000000),
      isDeleted: false,
      locked: true,
    };
  }

  async function createInitialImageElements() {
    const elements = [createGuideRectangle()];
    const files = {};

    const images = [
      { url: quaffleUrl, x: 100, y: 100 },
      { url: bludgerUrl, x: 250, y: 100 },
      { url: coneUrl, x: 400, y: 100 }
    ];

    for (const image of images) {
      const imageId = uuidv4();
      const dataUrl = await loadImageAsDataUrl(image.url);
      
      if (dataUrl) {
        elements.push({
          id: imageId,
          type: 'image',
          x: image.x,
          y: image.y,
          width: 50,
          height: 50,
          angle: 0,
          strokeColor: 'transparent',
          backgroundColor: 'transparent',
          fillStyle: 'hachure',
          strokeWidth: 1,
          strokeStyle: 'solid',
          roughness: 0,
          opacity: 100,
          groupIds: [],
          strokeSharpness: 'sharp',
          seed: Math.floor(Math.random() * 1000000),
          version: 1,
          versionNonce: Math.floor(Math.random() * 1000000),
          isDeleted: false,
          scale: [1, 1],
          fileId: imageId,
          status: 'idle',
        });

        files[imageId] = {
          id: imageId,
          dataURL: dataUrl,
          mimeType: 'image/webp',
          created: Date.now(),
          lastRetrieved: Date.now(),
        };
      }
    }

    return { elements, files };
  }

  function toggleFullscreen() {
    if (!isFullscreen) {
      initialSceneData = {
        elements: excalidrawAPI.getSceneElements(),
        appState: excalidrawAPI.getAppState(),
        files: excalidrawAPI.getFiles(),
      };
    }
    isFullscreen = !isFullscreen;
  }

  function handleSaveAndClose() {
    const elements = excalidrawAPI.getSceneElements();
    const appState = excalidrawAPI.getAppState();
    const files = excalidrawAPI.getFiles();
    dispatch('save', { elements, appState, files });
    closeEditor();
  }

  function handleCancel() {
    if (initialSceneData) {
      excalidrawAPI.updateScene(initialSceneData);
    }
    toggleFullscreen();
  }

  function handleChange(elements, appState, files) {
    if (!readonly) {
      const sceneData = {
        elements,
        appState,
        files
      };
      dispatch('save', sceneData);
    }
  }

  onMount(async () => {
    console.log('onMount started');
    if (browser) {
      console.log('Browser environment confirmed');
      const React = await import('react');
      const ReactDOM = await import('react-dom/client');
      window.React = React;

      const { Excalidraw } = await import('@excalidraw/excalidraw');
      
      ExcalidrawComponent = {
        render: (node) => {
          const root = ReactDOM.createRoot(node);
          
          root.render(
            React.createElement(Excalidraw, {
              onReady: (api) => {
                excalidrawAPI = api;
                if (data) {
                  api.updateScene({
                    elements: data.elements || [],
                    appState: data.appState || {
                      viewBackgroundColor: '#ffffff',
                      gridSize: 20
                    }
                  });
                }
              },
              initialData: {
                elements: data?.elements || [],
                appState: {
                  viewBackgroundColor: '#ffffff',
                  gridSize: 20
                }
              },
              viewModeEnabled: readonly,
              onChange: handleChange,
              gridModeEnabled: true,
              theme: "light",
              name: id,
              UIOptions: {
                canvasActions: {
                  export: false,
                  loadScene: false,
                  saveAsImage: false,
                  theme: false,
                }
              }
            })
          );

          return {
            destroy: () => {
              root.unmount();
            }
          };
        }
      };

      await tick();
    }
  });

  export function saveDiagram() {
    if (excalidrawAPI) {
      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();
      const files = excalidrawAPI.getFiles();
      const diagramData = { elements, appState, files };
      dispatch('save', diagramData);
      return diagramData;
    }
    return null;
  }

  let componentMounted = false;

  onMount(() => {
    componentMounted = true;
    console.log('Component mounted status:', componentMounted);
  });
</script>

<div class="excalidraw-wrapper">
  {#if browser && ExcalidrawComponent}
    <div class="excalidraw-container" style="height: 500px;">
      <div use:ExcalidrawComponent.render></div>
    </div>
  {/if}

  <!-- Fullscreen Modal -->
  {#if isFullscreen}
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="editor-container">
          {#if browser && fullscreenExcalidrawComponent}
            <div use:fullscreenExcalidrawComponent.render></div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Ensure Excalidraw fills the container */
  :global(.excalidraw) {
    width: 100% !important;
    height: 100% !important;
    min-height: 500px !important;  /* Add minimum height */
  }

  :global(.excalidraw-wrapper) {
    width: 100% !important;
    height: 100% !important;
    position: relative !important;
  }

  :global(.layer-ui__wrapper) {
    width: 100% !important;
    height: 100% !important;
  }

  /* Fix for fullscreen modal */
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
    z-index: 1000;
  }

  .modal-content {
    width: 100vw;
    height: 100vh;
    background: white;
    display: flex;
    flex-direction: column;
  }

  .editor-container {
    flex: 1;
    position: relative;
    min-height: 500px;
  }

  /* Ensure the Excalidraw UI is visible in fullscreen */
  :global(.editor-container .excalidraw) {
    width: 100% !important;
    height: 100% !important;
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
  }

  /* Fix for UI components */
  :global(.excalidraw .App-menu_top) {
    z-index: 10 !important;
  }

  :global(.excalidraw .App-menu_bottom) {
    z-index: 10 !important;
  }

  :global(.excalidraw .layer-ui__wrapper) {
    z-index: 10 !important;
  }

  /* Ensure proper sizing in the DrillForm context */
  :global(.border.p-4.rounded .excalidraw-wrapper) {
    min-height: 500px;
    position: relative;
  }
</style>

{#if componentMounted}
  <div class="debug-mount">Component Mounted Successfully</div>
{/if}