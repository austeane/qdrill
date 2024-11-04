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

  let fullscreenExcalidrawComponent;
  let fullscreenContainer;

  function openEditor() {
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
    if (!excalidrawAPI) return;

    isFullscreen = !isFullscreen;
    
    if (isFullscreen) {
      try {
        initialSceneData = {
          elements: excalidrawAPI.getSceneElements() || [],
          appState: excalidrawAPI.getAppState() || {},
          files: excalidrawAPI.getFiles() || {}
        };
        
        fullscreenExcalidrawComponent = {
          render: async (node) => {
            try {
              const React = await import('react');
              const ReactDOM = await import('react-dom/client');
              const { Excalidraw } = await import('@excalidraw/excalidraw');
              
              const root = ReactDOM.createRoot(node);
              
              root.render(
                React.createElement(Excalidraw, {
                  onReady: (api) => {
                    excalidrawAPI = api;
                    api.updateScene(initialSceneData);
                  },
                  initialData: initialSceneData,
                  viewModeEnabled: readonly,
                  onChange: handleChange,
                  gridModeEnabled: true,
                  theme: "light",
                  name: `${id}-fullscreen`,
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
            } catch (error) {
              console.error('Error in fullscreen render:', error);
              throw error;
            }
          }
        };
      } catch (error) {
        console.error('Error initializing fullscreen mode:', error);
        isFullscreen = false;
      }
    }
  }

  function handleSaveAndClose() {
    if (!excalidrawAPI) return;

    const elements = excalidrawAPI.getSceneElements();
    const appState = excalidrawAPI.getAppState();
    const files = excalidrawAPI.getFiles();
    
    // Save the current state
    dispatch('save', { elements, appState, files });
    
    // Update the initial scene data
    initialSceneData = { elements, appState, files };
    
    // Close fullscreen mode
    isFullscreen = false;

    // Wait for the next tick and update the main component
    tick().then(() => {
      if (excalidrawAPI) {
        excalidrawAPI.updateScene({
          elements,
          appState,
          files
        });
      }
    });
  }

  function handleCancel() {
    if (initialSceneData && excalidrawAPI) {
      excalidrawAPI.updateScene(initialSceneData);
    }
    isFullscreen = false;
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
    if (browser) {
      try {
        const React = await import('react');
        const ReactDOM = await import('react-dom/client');
        window.React = React.default;
        const { Excalidraw } = await import('@excalidraw/excalidraw');

        let initialData;
        if (!data) {
          initialData = await createInitialImageElements();
        }
        
        const excalidrawProps = {
          excalidrawAPI: (api) => {
            excalidrawAPI = api;
          },
          initialData: data || initialData || {
            elements: [],
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
        };
        
        ExcalidrawComponent = {
          render: (node) => {
            const root = ReactDOM.createRoot(node);
            
            const element = React.default.createElement(Excalidraw, excalidrawProps);
            
            root.render(element);

            return {
              destroy: () => {
                root.unmount();
              }
            };
          }
        };

        await tick();
      } catch (error) {
        console.error('Error mounting Excalidraw:', error);
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
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
</script>

<div class="excalidraw-wrapper">
  {#if browser && ExcalidrawComponent}
    <div class="excalidraw-container" style="height: 500px;">
      {#if import.meta.env.DEV}
        <div class="absolute top-0 left-0 bg-white/80 p-1 text-xs">
          API: {!!excalidrawAPI ? '✅' : '❌'}
        </div>
      {/if}
      <button
        type="button"
        class="absolute top-2 right-2 z-10 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md flex items-center gap-1"
        on:click={() => {
          toggleFullscreen();
        }}
        disabled={!excalidrawAPI}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
        </svg>
        <span class="text-sm">Fullscreen</span>
      </button>
      <div use:ExcalidrawComponent.render></div>
    </div>
  {/if}

  <!-- Fullscreen Modal -->
  {#if isFullscreen}
    {@const modalVisible = true}
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="text-xl font-bold">Edit Diagram</h2>
          <div class="flex gap-2">
            <button
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              on:click={handleSaveAndClose}
            >
              Save & Close
            </button>
            <button
              class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              on:click={handleCancel}
            >
              Cancel
            </button>
          </div>
        </div>
        <div class="editor-container" bind:this={fullscreenContainer}>
          {#if fullscreenExcalidrawComponent}
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
    width: 95vw;
    height: 95vh;
    background: white;
    display: flex;
    flex-direction: column;
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .editor-container {
    flex: 1;
    position: relative;
    overflow: hidden;
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

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: white;
    border-bottom: 1px solid #e5e7eb;
  }
</style>
