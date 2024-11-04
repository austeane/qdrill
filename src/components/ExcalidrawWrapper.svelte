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
  let fullscreenExcalidrawAPI;
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
    console.log('Creating initial image elements');
    const elements = [createGuideRectangle()];
    const files = {};

    // Add hoops - positioned to the right of the guide box
    const hoopSizes = [
      { width: 40, height: 80 },
      { width: 40, height: 120 },
      { width: 40, height: 100 }
    ];
    const spacing = 20;
    const startX = CANVAS_WIDTH + 100; // Position hoops to the right of the red box
    const baseY = 200;

    // Create a group ID for all hoops
    const hoopGroupId = uuidv4();

    hoopSizes.forEach((size, i) => {
      // Calculate the Y position for the hoop circle by working backwards from the base
      const poleHeight = size.height - size.width;
      const hoopY = baseY - poleHeight - size.width; // Subtract pole height and hoop height from base

      const hoopCircle = {
        type: 'ellipse',
        x: startX + i * (size.width + spacing) - size.width/2,
        y: hoopY,
        width: size.width,
        height: size.width,
        strokeColor: '#000000',
        backgroundColor: 'transparent',
        fillStyle: 'solid',
        strokeWidth: 2,
        roughness: 0,
        opacity: 100,
        strokeStyle: 'solid',
        id: uuidv4(),
        angle: 0,
        groupIds: [hoopGroupId],
        seed: Math.floor(Math.random() * 1000000),
        version: 1,
        versionNonce: Math.floor(Math.random() * 1000000),
        isDeleted: false,
      };

      // Add vertical pole (starting from bottom of hoop)
      const pole = {
        type: 'line',
        x: startX + i * (size.width + spacing),
        y: hoopY + size.width, // Start from bottom of hoop
        points: [
          [0, 0],
          [0, poleHeight] // Height is total height minus hoop height
        ],
        strokeColor: '#000000',
        backgroundColor: 'transparent',
        fillStyle: 'solid',
        strokeWidth: 2,
        roughness: 0,
        opacity: 100,
        strokeStyle: 'solid',
        id: uuidv4(),
        width: 0,
        height: poleHeight,
        angle: 0,
        groupIds: [hoopGroupId],
        seed: Math.floor(Math.random() * 1000000),
        version: 1,
        versionNonce: Math.floor(Math.random() * 1000000),
        isDeleted: false,
      };

      elements.push(hoopCircle, pole);
    });

    // Add players
    const teamColors = ['#ff0000', '#0000ff'];
    const positionColors = ['#00ff00', '#000000', '#ffffff', '#ffff00'];
    const playerCounts = [1, 2, 3, 1];

    teamColors.forEach((teamColor, teamIndex) => {
      let playerX = CANVAS_WIDTH + 100; // Start players to the right of the red box
      positionColors.forEach((headColor, positionIndex) => {
        for (let i = 0; i < playerCounts[positionIndex]; i++) {
          // Add stick figure body
          elements.push({
            type: 'line',
            x: playerX,
            y: 300 + teamIndex * 60,
            points: [
              [0, 0],
              [0, 20]
            ],
            strokeColor: teamColor,
            strokeWidth: 2,
            roughness: 0,
            opacity: 100,
            strokeStyle: 'solid',
            id: uuidv4(),
            width: 0,
            height: 20,
            angle: 0,
            groupIds: [],
            seed: Math.floor(Math.random() * 1000000),
            version: 1,
            versionNonce: Math.floor(Math.random() * 1000000),
            isDeleted: false,
          });

          // Add head
          elements.push({
            type: 'ellipse',
            x: playerX - 5,
            y: 290 + teamIndex * 60,
            width: 10,
            height: 10,
            strokeColor: '#000000',
            backgroundColor: headColor,
            fillStyle: 'solid',
            strokeWidth: 1,
            roughness: 0,
            opacity: 100,
            strokeStyle: 'solid',
            id: uuidv4(),
            angle: 0,
            groupIds: [],
            seed: Math.floor(Math.random() * 1000000),
            version: 1,
            versionNonce: Math.floor(Math.random() * 1000000),
            isDeleted: false,
          });

          // Add arms
          elements.push({
            type: 'line',
            x: playerX - 10,
            y: 310 + teamIndex * 60,
            points: [
              [0, 0],
              [20, 0]
            ],
            strokeColor: teamColor,
            strokeWidth: 2,
            roughness: 0,
            opacity: 100,
            strokeStyle: 'solid',
            id: uuidv4(),
            width: 20,
            height: 0,
            angle: 0,
            groupIds: [],
            seed: Math.floor(Math.random() * 1000000),
            version: 1,
            versionNonce: Math.floor(Math.random() * 1000000),
            isDeleted: false,
          });

          // Add legs
          elements.push({
            type: 'line',
            x: playerX,
            y: 320 + teamIndex * 60,
            points: [
              [0, 0],
              [-10, 15]
            ],
            strokeColor: teamColor,
            strokeWidth: 2,
            roughness: 0,
            opacity: 100,
            strokeStyle: 'solid',
            id: uuidv4(),
            width: 10,
            height: 15,
            angle: 0,
            groupIds: [],
            seed: Math.floor(Math.random() * 1000000),
            version: 1,
            versionNonce: Math.floor(Math.random() * 1000000),
            isDeleted: false,
          });

          elements.push({
            type: 'line',
            x: playerX,
            y: 320 + teamIndex * 60,
            points: [
              [0, 0],
              [10, 15]
            ],
            strokeColor: teamColor,
            strokeWidth: 2,
            roughness: 0,
            opacity: 100,
            strokeStyle: 'solid',
            id: uuidv4(),
            width: 10,
            height: 15,
            angle: 0,
            groupIds: [],
            seed: Math.floor(Math.random() * 1000000),
            version: 1,
            versionNonce: Math.floor(Math.random() * 1000000),
            isDeleted: false,
          });

          playerX += 60;
        }
      });
    });

    // Add the ball images
    const images = [
      { url: quaffleUrl, x: CANVAS_WIDTH + 100, y: 100 },
      { url: bludgerUrl, x: CANVAS_WIDTH + 200, y: 100 },
      { url: coneUrl, x: CANVAS_WIDTH + 300, y: 100 }
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

  function zoomToIncludeAllElements(api) {
    if (!api) return;
    
    const elements = api.getSceneElements();
    if (!elements.length) return;

    // Find the bounds of all elements
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    elements.forEach(el => {
      // For lines, we need to consider their points
      if (el.type === 'line' && el.points) {
        el.points.forEach(point => {
          const absoluteX = el.x + point[0];
          const absoluteY = el.y + point[1];
          minX = Math.min(minX, absoluteX);
          minY = Math.min(minY, absoluteY);
          maxX = Math.max(maxX, absoluteX);
          maxY = Math.max(maxY, absoluteY);
        });
      } else {
        // For other elements
        const left = el.x;
        const top = el.y;
        const right = el.x + (el.width || 0);
        const bottom = el.y + (el.height || 0);

        minX = Math.min(minX, left);
        minY = Math.min(minY, top);
        maxX = Math.max(maxX, right);
        maxY = Math.max(maxY, bottom);
      }
    });

    // Add padding (40% for more space)
    const padding = 0.4;
    const width = maxX - minX;
    const height = maxY - minY;
    minX -= width * padding;
    minY -= height * padding;
    maxX += width * padding;
    maxY += height * padding;

    // Calculate center point
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Calculate zoom level
    const containerWidth = fullscreenContainer?.offsetWidth || window.innerWidth;
    const containerHeight = fullscreenContainer?.offsetHeight || window.innerHeight;
    
    const zoomX = containerWidth / (maxX - minX);
    const zoomY = containerHeight / (maxY - minY);
    const zoom = Math.min(zoomX, zoomY, 0.7); // Cap at 0.7 to ensure some padding

    // Update the view
    api.updateScene({
      appState: {
        ...api.getAppState(),
        scrollX: containerWidth / 2 - centerX * zoom,
        scrollY: containerHeight / 2 - centerY * zoom,
        zoom: {
          value: zoom
        }
      }
    });
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
        
        // Wait for next tick to ensure fullscreen component is ready
        tick().then(() => {
          if (fullscreenExcalidrawAPI) {
            fullscreenExcalidrawAPI.updateScene(initialSceneData);
            // Add slight delay to ensure scene is updated before zooming
            setTimeout(() => zoomToIncludeAllElements(fullscreenExcalidrawAPI), 100);
          }
        });
      } catch (error) {
        console.error('Error initializing fullscreen mode:', error);
        isFullscreen = false;
      }
    }
  }

  async function createFullscreenComponent() {
    try {
      const React = await import('react');
      const ReactDOM = await import('react-dom/client');
      const { Excalidraw } = await import('@excalidraw/excalidraw');
      
      const excalidrawProps = {
        onReady: (api) => {
          console.log('Fullscreen Excalidraw ready');
          fullscreenExcalidrawAPI = api;
          if (initialSceneData) {
            api.updateScene(initialSceneData);
          }
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
      };
      
      fullscreenExcalidrawComponent = {
        render: (node) => {
          const root = ReactDOM.createRoot(node);
          root.render(React.createElement(Excalidraw, excalidrawProps));
          return {
            destroy: () => root.unmount()
          };
        }
      };
    } catch (error) {
      console.error('Error creating fullscreen component:', error);
      isFullscreen = false;
    }
  }

  function handleSaveAndClose() {
    console.log('Save and close clicked, API available:', !!fullscreenExcalidrawAPI);
    
    if (!fullscreenExcalidrawAPI) {
      console.warn('No fullscreen API available');
      return;
    }

    try {
      const elements = fullscreenExcalidrawAPI.getSceneElements();
      const appState = fullscreenExcalidrawAPI.getAppState();
      const files = fullscreenExcalidrawAPI.getFiles();
      
      // Close fullscreen mode first
      isFullscreen = false;

      // Wait for the next tick to ensure the fullscreen modal is closed
      tick().then(() => {
        if (excalidrawAPI) {
          excalidrawAPI.updateScene({
            elements,
            appState: { ...appState, viewBackgroundColor: appState.viewBackgroundColor },
            files
          });
          dispatch('save', { elements, appState, files });
        }
      });
    } catch (error) {
      console.error('Error in handleSaveAndClose:', error);
      isFullscreen = false;
    }
  }

  function handleCancel() {
    isFullscreen = false;
    // Ensure the inline component returns to its previous state
    tick().then(() => {
      if (excalidrawAPI && initialSceneData) {
        excalidrawAPI.updateScene(initialSceneData);
      }
    });
  }

  function handleChange(elements, appState, files) {
    console.log('Handling change with:', { elements, appState, files });
    if (!readonly) {
      const sceneData = {
        elements,
        appState: {
          ...appState,
          collaborators: [] // Ensure collaborators exists
        },
        files
      };
      dispatch('save', sceneData);
    }
  }

  onMount(async () => {
    if (browser) {
      try {
        console.log('Mounting Excalidraw with data:', data);
        const React = await import('react');
        const ReactDOM = await import('react-dom/client');
        window.React = React.default;
        const { Excalidraw } = await import('@excalidraw/excalidraw');

        let initialData;
        if (!data) {
          initialData = await createInitialImageElements();
        } else {
          // Ensure data has the correct structure and collaborators is always an array
          console.log('Raw data from props:', data);
          initialData = {
            elements: data.elements || [],
            appState: {
              viewBackgroundColor: '#ffffff',
              gridSize: 20,
              collaborators: [], // Ensure collaborators exists and is an array
              ...(data.appState || {}),
              collaborators: Array.isArray(data.appState?.collaborators) ? data.appState.collaborators : []
            },
            files: data.files || {}
          };
        }
        
        console.log('Initializing Excalidraw with processed data:', initialData);

        // Create props for both components
        const createExcalidrawProps = (isFullscreenVersion = false) => {
          const props = {
            excalidrawAPI: (api) => {
              if (isFullscreenVersion) {
                fullscreenExcalidrawAPI = api;
              } else {
                excalidrawAPI = api;
                // Center and zoom when the API is ready
                if (!isFullscreen) {
                  setTimeout(() => centerAndZoomToGuideRectangle(api), 100);
                }
              }
            },
            initialData: initialData,
            viewModeEnabled: readonly,
            onChange: handleChange,
            gridModeEnabled: true,
            theme: "light",
            name: isFullscreenVersion ? `${id}-fullscreen` : id,
            UIOptions: {
              canvasActions: {
                export: false,
                loadScene: false,
                saveAsImage: false,
                theme: false,
              }
            }
          };
          console.log('Created Excalidraw props:', props);
          return props;
        };
        
        // Create main component
        ExcalidrawComponent = {
          render: (node) => {
            const root = ReactDOM.createRoot(node);
            root.render(React.createElement(Excalidraw, createExcalidrawProps(false)));
            return {
              destroy: () => root.unmount()
            };
          }
        };

        // Create fullscreen component
        fullscreenExcalidrawComponent = {
          render: (node) => {
            const root = ReactDOM.createRoot(node);
            root.render(React.createElement(Excalidraw, createExcalidrawProps(true)));
            return {
              destroy: () => root.unmount()
            };
          }
        };

        await tick();
      } catch (error) {
        console.error('Error mounting Excalidraw:', error);
      }
    }
  });

  // Add resize observer to handle container size changes
  onMount(() => {
    if (browser && excalidrawWrapper) {
      const resizeObserver = new ResizeObserver(() => {
        if (excalidrawAPI && !isFullscreen) {
          centerAndZoomToGuideRectangle(excalidrawAPI);
        }
      });
      
      resizeObserver.observe(excalidrawWrapper);
      
      return () => {
        resizeObserver.disconnect();
      };
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
    <div class="excalidraw-container" style="height: 600px;">
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
    min-height: 600px !important;  /* Update from 500px to 600px */
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
    z-index: 2 !important;
  }

  :global(.excalidraw .App-menu_bottom) {
    z-index: 2 !important;
  }

  :global(.excalidraw .layer-ui__wrapper) {
    z-index: 2 !important;
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
