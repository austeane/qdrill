<script>
  import { onMount, createEventDispatcher, tick } from 'svelte';
  import { browser } from '$app/environment';
  import { v4 as uuidv4 } from 'uuid';

  export let data = null;
  export let id = '';
  export let showSaveButton = false;
  export let index;
  export let readonly = false;
  export let template = 'blank';

  const dispatch = createEventDispatcher();
  let excalidrawAPI;
  let fullscreenExcalidrawAPI;
  let ExcalidrawComponent;
  let isFullscreen = false;
  let initialSceneData = null;
  let excalidrawWrapper;

  const coneUrl = '/images/cone.webp';

  const CANVAS_WIDTH = 500;
  const CANVAS_HEIGHT = 600;

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

    // Add template-specific elements inside the guide rectangle
    if (template === 'halfCourt') {
      await addHalfCourtElements(elements, files);
    } else if (template === 'fullCourt') {
      await addFullCourtElements(elements, files);
    }

    // Always add the sidebar elements
    await addSidebarElements(elements, files);

    return { elements, files };
  }

  function createHoopSet(x, y) {
    // Create a group ID for all hoops in this set
    const hoopGroupId = uuidv4();
    const hoopSizes = [
      { width: 40, height: 80 },
      { width: 40, height: 120 },
      { width: 40, height: 100 }
    ];
    const spacing = 20;
    const elements = [];

    hoopSizes.forEach((size, i) => {
      // Calculate the Y position for the hoop circle by working backwards from the base
      const poleHeight = size.height - size.width;
      const hoopY = y - poleHeight - size.width;

      const hoopCircle = {
        type: 'ellipse',
        x: x + i * (size.width + spacing) - size.width/2,
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

      const pole = {
        type: 'line',
        x: x + i * (size.width + spacing),
        y: hoopY + size.width,
        points: [
          [0, 0],
          [0, poleHeight]
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

    return elements;
  }

  async function addHalfCourtElements(elements, files) {
    // Move hoops down further
    const hoopSet = createHoopSet(CANVAS_WIDTH/2 - 40, 180);  // Moved from 120 to 180
    elements.push(...hoopSet);

    // Adjust player positions relative to new hoop position
    const playerPositions = [
      { x: CANVAS_WIDTH/2, y: 200, type: 'k' },          // Keeper (right at hoops)
      { x: CANVAS_WIDTH/2 - 60, y: 260, type: 'b1' },    // Left Beater - moved closer
      { x: CANVAS_WIDTH/2 + 60, y: 260, type: 'b2' },    // Right Beater - moved closer
      { x: CANVAS_WIDTH/2 - 100, y: 360, type: 'c1' },   // Left Chaser
      { x: CANVAS_WIDTH/2, y: 360, type: 'c2' },         // Center Chaser
      { x: CANVAS_WIDTH/2 + 100, y: 360, type: 'c3' }    // Right Chaser
    ];

    await addPlayersToField(elements, files, playerPositions);
  }

  async function addFullCourtElements(elements, files) {
    // Add hoops at top and bottom, ensuring equal distance from boundaries
    const topHoops = createHoopSet(CANVAS_WIDTH/2 - 40, 120);    // Moved up from 150
    const bottomHoops = createHoopSet(CANVAS_WIDTH/2 - 40, CANVAS_HEIGHT - 120);  // Moved up from 150

    elements.push(...topHoops, ...bottomHoops);

    const playerPositions = [
      // Team 1 (Blue team - top half)
      { x: CANVAS_WIDTH/2, y: 140, type: 'k', team: 'blue' },          // Keeper closer to hoops
      { x: CANVAS_WIDTH/2 - 50, y: 180, type: 'b1', team: 'blue' },    // Beaters closer together
      { x: CANVAS_WIDTH/2 + 50, y: 180, type: 'b2', team: 'blue' },    
      { x: CANVAS_WIDTH/2 - 80, y: 240, type: 'c1', team: 'blue' },    // Chasers in formation
      { x: CANVAS_WIDTH/2, y: 240, type: 'c2', team: 'blue' },         
      { x: CANVAS_WIDTH/2 + 80, y: 240, type: 'c3', team: 'blue' },   
      
      // Team 2 (Red team - bottom half)
      { x: CANVAS_WIDTH/2, y: CANVAS_HEIGHT - 140, type: 'k', team: 'red' },          // Keeper closer to hoops
      { x: CANVAS_WIDTH/2 - 50, y: CANVAS_HEIGHT - 180, type: 'b1', team: 'red' },    // Beaters closer together
      { x: CANVAS_WIDTH/2 + 50, y: CANVAS_HEIGHT - 180, type: 'b2', team: 'red' },    
      { x: CANVAS_WIDTH/2 - 80, y: CANVAS_HEIGHT - 240, type: 'c1', team: 'red' },    // Chasers in formation
      { x: CANVAS_WIDTH/2, y: CANVAS_HEIGHT - 240, type: 'c2', team: 'red' },         
      { x: CANVAS_WIDTH/2 + 80, y: CANVAS_HEIGHT - 240, type: 'c3', team: 'red' }     
    ];

    await addPlayersToField(elements, files, playerPositions);
  }

  async function addPlayersToField(elements, files, positions) {
    for (const pos of positions) {
      const imageId = uuidv4();
      // Use the team property to determine the image path
      const teamColor = pos.team || 'blue';  // Default to blue if team not specified
      const imagePath = `/images/icons/${teamColor}-player-${pos.type}.png`;
      const dataUrl = await loadImageAsDataUrl(imagePath);
      
      if (dataUrl) {
        elements.push({
          id: imageId,
          type: 'image',
          x: pos.x,
          y: pos.y,
          width: 40,
          height: 40,
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
          mimeType: 'image/png',
          created: Date.now(),
          lastRetrieved: Date.now(),
        };
      }
    }
  }

  async function addSidebarElements(elements, files) {
    // This is where your existing createInitialImageElements code would go
    // Add hoops - positioned to the right of the guide box
    const hoopSizes = [
      { width: 40, height: 80 },
      { width: 40, height: 120 },
      { width: 40, height: 100 }
    ];
    const spacing = 20;
    const startX = CANVAS_WIDTH + 100;
    const baseY = 100;

    // Create a group ID for all hoops
    const hoopGroupId = uuidv4();

    hoopSizes.forEach((size, i) => {
      // Calculate the Y position for the hoop circle by working backwards from the base
      const poleHeight = size.height - size.width;
      const hoopY = baseY - poleHeight - size.width;

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

      const pole = {
        type: 'line',
        x: startX + i * (size.width + spacing),
        y: hoopY + size.width,
        points: [
          [0, 0],
          [0, poleHeight]
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

    // Add your existing player icons grid code here
    // Define the icon sets and their positions
    const iconSets = [
      'b-and-w-player',
      'blue-player',
      'canada-player',
      'red-black-player',
      'red-player',
      'ubc-player',
      'y-and-b-player',
      'yellow-arrow-player'
    ];

    const positions = [
      { type: 'k', x: 0 },
      { type: 'c1', x: 60 },
      { type: 'c2', x: 120 },
      { type: 'c3', x: 180 },
      { type: 'b1', x: 240 },
      { type: 'b2', x: 300 },
      { type: 's', x: 360 }
    ];

    let startY = 140;
    const iconSize = 40;
    const rowSpacing = 50;
    const baseX = CANVAS_WIDTH + 90;

    // Add all the player icons
    for (let setIndex = 0; setIndex < iconSets.length; setIndex++) {
      const currentY = startY + (setIndex * rowSpacing);
      
      for (const position of positions) {
        const imageId = uuidv4();
        const imagePath = `/images/icons/${iconSets[setIndex]}-${position.type}.png`;
        const dataUrl = await loadImageAsDataUrl(imagePath);
        
        if (dataUrl) {
          elements.push({
            id: imageId,
            type: 'image',
            x: baseX + position.x,
            y: currentY,
            width: iconSize,
            height: iconSize,
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
            mimeType: 'image/png',
            created: Date.now(),
            lastRetrieved: Date.now(),
          };
        }
      }
    }

    // Add the balls and cone
    const balls = [
      { url: '/images/icons/quaffle.png', x: CANVAS_WIDTH + 70 + 30, y: 115, size: { width: 16, height: 20 } },
      { url: '/images/icons/bludger.png', x: CANVAS_WIDTH + 70 + 90, y: 115, size: { width: 16, height: 20 } },
      { url: '/images/icons/bludger.png', x: CANVAS_WIDTH + 70 + 150, y: 115, size: { width: 16, height: 20 } },
      { url: '/images/icons/bludger.png', x: CANVAS_WIDTH + 70 + 210, y: 115, size: { width: 16, height: 20 } },
      { url: '/images/cone.webp', x: CANVAS_WIDTH + 70 + 270, y: 115, size: { width: 20, height: 20 }, scale: [0.25, 0.25] }
    ];

    for (const ball of balls) {
      const imageId = uuidv4();
      const dataUrl = await loadImageAsDataUrl(ball.url);
      
      if (dataUrl) {
        elements.push({
          id: imageId,
          type: 'image',
          x: ball.x,
          y: ball.y,
          width: ball.size.width,
          height: ball.size.height,
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
          scale: ball.scale || [1, 1],
          fileId: imageId,
          status: 'idle',
        });

        files[imageId] = {
          id: imageId,
          dataURL: dataUrl,
          mimeType: 'image/png',
          created: Date.now(),
          lastRetrieved: Date.now(),
        };
      }
    }
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
        gridModeEnabled: false,
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
          root.render(React.createElement(Excalidraw, { ...excalidrawProps, portalContainer: node }));
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
    if (!fullscreenExcalidrawAPI) return;

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

  function centerAndZoomToGuideRectangle(api) {
    if (!api) {
      console.log('No API available');
      return;
    }
    
    const elements = api.getSceneElements();
    if (!elements.length) {
      console.log('No elements found');
      return;
    }

    // Find the guide rectangle
    const guideRect = elements.find(el => 
      el.type === 'rectangle' && 
      el.strokeColor === '#ff0000' && 
      el.strokeStyle === 'dashed'
    );

    if (!guideRect) {
      console.log('No guide rectangle found');
      return;
    }

    // Get the container dimensions
    const container = excalidrawWrapper?.querySelector('.excalidraw-container');
    if (!container) {
      console.log('No container found');
      return;
    }
    
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    console.log('Container dimensions:', { containerWidth, containerHeight });
    console.log('Guide rectangle:', {
      x: guideRect.x,
      y: guideRect.y,
      width: guideRect.width,
      height: guideRect.height
    });

    // Calculate the zoom level needed to fit the guide rectangle
    const zoomX = containerWidth / CANVAS_WIDTH;
    const zoomY = containerHeight / CANVAS_HEIGHT;
    const zoom = Math.min(zoomX, zoomY, 1); // Cap at 1 to prevent over-zooming

    console.log('Zoom calculations:', { zoomX, zoomY, finalZoom: zoom });

    // Calculate the scroll position to center the guide rectangle
    // For a guide rectangle at (-250, -300), we need to scroll 250 right and 300 down
    const scrollX = 250;
    const scrollY = 300;

    console.log('Scroll positions:', { scrollX, scrollY });

    // Update the view
    api.updateScene({
      appState: {
        ...api.getAppState(),
        scrollX,
        scrollY,
        zoom: {
          value: zoom
        }
      }
    });
  }

  onMount(async () => {
    if (browser) {
      try {
        const React = await import('react');
        const ReactDOM = await import('react-dom/client');
        window.React = React.default;
        const { Excalidraw } = await import('@excalidraw/excalidraw');

        let initialData;
        if (!data || (data.elements && data.elements.length === 0)) {
          initialData = await createInitialImageElements();
        } else {
          initialData = {
            elements: data.elements || [],
            appState: {
              viewBackgroundColor: '#ffffff',
              gridSize: 20,
              collaborators: [],
              ...(data.appState || {}),
              collaborators: Array.isArray(data.appState?.collaborators) ? data.appState.collaborators : []
            },
            files: data.files || {}
          };
        }

        // Create props for both components
        const createExcalidrawProps = (isFullscreenVersion = false) => ({
          excalidrawAPI: (api) => {
            if (isFullscreenVersion) {
              fullscreenExcalidrawAPI = api;
            } else {
              excalidrawAPI = api;
              if (!isFullscreen) {
                setTimeout(() => centerAndZoomToGuideRectangle(api), 100);
              }
            }
          },
          initialData,
          viewModeEnabled: readonly,
          onChange: handleChange,
          gridModeEnabled: false,
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
        });
        
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

<div class="excalidraw-wrapper" bind:this={excalidrawWrapper}>
  {#if browser && ExcalidrawComponent}
    <div class="excalidraw-container" style="height: 600px;">
      <div class="excalidraw-mount-point relative w-full h-full">
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
    </div>
  {/if}

  <!-- Fullscreen Modal -->
  {#if isFullscreen}
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
            <div class="excalidraw-fullscreen-wrapper" use:fullscreenExcalidrawComponent.render></div>
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

  :global(.excalidraw .layer-ui__wrapper) {
    position: absolute !important;
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

  /* Update Excalidraw specific styles */
  :global(.excalidraw-fullscreen-wrapper .excalidraw) {
    width: 100% !important;
    height: 100% !important;
  }

  :global(.excalidraw-fullscreen-wrapper .excalidraw-container) {
    width: 100% !important;
    height: 100% !important;
  }

  /* Add specific mount point styling */
  :global(.excalidraw-mount-point) {
    position: absolute !important;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
</style>
