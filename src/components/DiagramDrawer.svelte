<script>
  import { onMount, createEventDispatcher, onDestroy, tick } from 'svelte';
  import { browser } from '$app/environment';
  import * as fabric from 'fabric';

  // Define relative URLs for images
  const quaffleUrl = '/images/quaffle.webp';
  const bludgerUrl = '/images/bludger.webp';

  export let data = null;
  export let id = '';
  export let showSaveButton = false;
  export let index;
  export let readonly = false;

  const dispatch = createEventDispatcher();
  let canvas;
  let fabricCanvas;
  let lastAddedPosition = { x: 100, y: 100 };

  let ballSize = 20;
  let ballStartX = 60;
  let ballY = 130;

  const contentWidth = 500;
  const contentHeight = 600;
  let canvasWrapper;
  let scalingFactor = 1;

  let renderAttempts = 0;
  const maxRenderAttempts = 5;

  function updateLastAddedPosition() {
    lastAddedPosition.x += 50;
    if (lastAddedPosition.x > fabricCanvas.width - 50) {
      lastAddedPosition.x = 50;
      lastAddedPosition.y += 50;
    }
    if (lastAddedPosition.y > fabricCanvas.height - 50) {
      lastAddedPosition.y = 50;
    }
  }

  function resizeCanvas() {
    if (!fabricCanvas || !canvasWrapper) return;
    const wrapperWidth = canvasWrapper.clientWidth;
    scalingFactor = wrapperWidth / contentWidth;

    fabricCanvas.setWidth(contentWidth * scalingFactor);
    fabricCanvas.setHeight(contentHeight * scalingFactor);
    fabricCanvas.setZoom(scalingFactor);

    fabricCanvas.renderAll();
  }

  onMount(async () => {
    if (!browser) return;

    await tick(); // Ensure DOM is ready

    console.log('onMount: Starting to initialize canvas');

    fabricCanvas = new fabric.Canvas(canvas, {
      width: contentWidth,
      height: contentHeight,
      backgroundColor: '#f0f0f0',
      selection: !readonly
    });

    console.log('onMount: Canvas initialized');

    if (data && Object.keys(data).length > 0) {
      console.log('onMount: Data exists, preparing to load');
      console.log('Original data:', JSON.stringify(data));

      const plainData = typeof data === 'function' ? data() : data;

      fabricCanvas.loadFromJSON(plainData, () => {
        console.log('Canvas loaded from JSON');
        attemptRender();
      }, (o, object) => {
        console.log('Loading object:', object);
        if (object.type === 'image') {
          console.log('Image object src:', object.src);
        }
      });
    } else {
      console.log('onMount: No existing data, adding standard elements');
      addStandardShapes();
      addPlayers();
      await addInitialBalls(); // Wait for images to load
      attemptRender();
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', resizeCanvas);
    }
  });

  function attemptRender() {
    console.log(`Attempt ${renderAttempts + 1} to render canvas`);
    setTimeout(() => {
      fabricCanvas.renderAll();
      console.log(`Canvas rendered on attempt ${renderAttempts + 1}`);
      
      // Check if all objects are visible
      const allObjectsVisible = fabricCanvas.getObjects().every(obj => obj.visible !== false);
      console.log(`All objects visible: ${allObjectsVisible}`);

      if (!allObjectsVisible && renderAttempts < maxRenderAttempts) {
        renderAttempts++;
        attemptRender();
      } else {
        finalizeInitialization();
      }
    }, 100 * (renderAttempts + 1)); // Increasing delay with each attempt
  }

  function finalizeInitialization() {
    console.log('Finalizing initialization');
    if (readonly) {
      fabricCanvas.getObjects().forEach(obj => {
        obj.selectable = false;
        obj.evented = false;
      });
    }
    fabricCanvas.renderAll();
    resizeCanvas();
    console.log('Initialization complete');
  }

  onDestroy(() => {
    if (browser && typeof window !== 'undefined') {
      window.removeEventListener('resize', resizeCanvas);
    }
  });

  function deleteSelectedObjects() {
    fabricCanvas.getActiveObjects().forEach((obj) => {
      fabricCanvas.remove(obj);
    });
    fabricCanvas.discardActiveObject().renderAll();
  }

  function addNewPlayer(teamColor, headColor) {
    const player = createStickFigure(teamColor, headColor);
    player.set({
      left: lastAddedPosition.x * scalingFactor,
      top: lastAddedPosition.y * scalingFactor
    });
    fabricCanvas.add(player);
    updateLastAddedPosition();
    fabricCanvas.renderAll();
  }

  function addArrow() {
    const arrowLength = 100;
    const arrow = new fabric.Line([0, 0, arrowLength, 0], {
      stroke: 'black',
      strokeWidth: 2,
      selectable: true,
      hasControls: true
    });
    const arrowHead = new fabric.Triangle({
      width: 10,
      height: 10,
      fill: 'black',
      left: arrowLength,
      top: -5,
      angle: 90
    });
    const group = new fabric.Group([arrow, arrowHead], {
      left: lastAddedPosition.x * scalingFactor,
      top: lastAddedPosition.y * scalingFactor,
      selectable: true,
      hasControls: true
    });
    fabricCanvas.add(group);
    updateLastAddedPosition();
    fabricCanvas.renderAll();
  }

  function addHoopGroup() {
    const hoopGroup = addStandardShapes();
    hoopGroup.set({
      left: lastAddedPosition.x * scalingFactor,
      top: lastAddedPosition.y * scalingFactor
    });
    updateLastAddedPosition();
    fabricCanvas.renderAll();
  }

  function addTextBox() {
    const text = new fabric.Textbox('Edit me', {
      left: lastAddedPosition.x * scalingFactor,
      top: lastAddedPosition.y * scalingFactor,
      width: 150,
      fontSize: 20,
      fill: 'black'
    });
    fabricCanvas.add(text);
    updateLastAddedPosition();
    fabricCanvas.renderAll();
  }

  function addQuaffle() {
    console.log('Adding quaffle, URL:', quaffleUrl);
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Set crossOrigin
    img.onload = function() {
      console.log('Quaffle image loaded successfully');
      const fabricImage = new fabric.Image(img, {
        left: ballStartX * scalingFactor,
        top: ballY * scalingFactor,
        selectable: true,
        hasControls: true,
        originX: 'center',
        originY: 'center',
        src: quaffleUrl // Use relative URL directly
      });
      fabricImage.scale(ballSize / Math.max(img.width, img.height));
      fabricCanvas.add(fabricImage);
      fabricCanvas.renderAll();
      ballStartX += ballSize + 3;
    };
    img.onerror = function(e) {
      console.error('Failed to load quaffle image:', e, 'URL:', img.src);
    };
    img.src = quaffleUrl;
  }

  function addBludger() {
    console.log('Adding bludger, URL:', bludgerUrl);
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Set crossOrigin
    img.onload = function() {
      console.log('Bludger image loaded successfully');
      const bludgerSize = ballSize * 2;
      const fabricImage = new fabric.Image(img, {
        left: ballStartX * scalingFactor,
        top: ballY * scalingFactor,
        selectable: true,
        hasControls: true,
        originX: 'center',
        originY: 'center',
        src: bludgerUrl // Use relative URL directly
      });
      fabricImage.scale(bludgerSize / Math.max(img.width, img.height));
      fabricCanvas.add(fabricImage);
      fabricCanvas.renderAll();
      ballStartX += bludgerSize + 3;
    };
    img.onerror = function(e) {
      console.error('Failed to load bludger image:', e, 'URL:', img.src);
    };
    img.src = bludgerUrl;
  }

  function addInitialBalls() {
    for (let i = 0; i < 3; i++) {
      addBludger();
    }
    ballStartX += 10;
    addQuaffle();
  }

  function createStickFigure(bodyColor, headColor) {
    const head = new fabric.Circle({
      radius: 5,
      fill: headColor,
      stroke: ['white', 'green', 'yellow'].includes(headColor) ? 'black' : headColor,
      strokeWidth: 1,
      left: -5,
      top: -10.5
    });

    const body = new fabric.Line([0, 0, 0, 20], {
      stroke: bodyColor,
      strokeWidth: 2
    });

    const arms = new fabric.Line([-10, 10, 10, 10], {
      stroke: bodyColor,
      strokeWidth: 2
    });

    const leftLeg = new fabric.Line([0, 20, -10, 35], {
      stroke: bodyColor,
      strokeWidth: 2
    });

    const rightLeg = new fabric.Line([0, 20, 10, 35], {
      stroke: bodyColor,
      strokeWidth: 2
    });

    return new fabric.Group([head, body, arms, leftLeg, rightLeg], {
      selectable: true,
      hasControls: true
    });
  }

  function addStandardShapes() {
    const hoopSizes = [
      { width: 40, height: 80 },
      { width: 40, height: 120 },
      { width: 40, height: 100 }
    ];
    const spacing = 20;
    const scaleFactor = 0.55;
    const canvasWidth = 500;
    const canvasHeight = 300;
    const startY = canvasHeight * 0.25;
    const maxHeight = Math.max(...hoopSizes.map(size => size.height));

    const totalWidth = hoopSizes.reduce((sum, size) => sum + size.width, 0) + spacing * (hoopSizes.length - 1);
    const startX = (canvasWidth - totalWidth * scaleFactor) / 2;

    let hoops = [];

    hoopSizes.forEach((size, i) => {
      const hoop = new fabric.Group([
        new fabric.Circle({
          radius: size.width / 2,
          fill: 'transparent',
          stroke: 'black',
          strokeWidth: 2,
          left: 0,
          top: 0
        }),
        new fabric.Line([size.width / 2, size.width, size.width / 2, size.height], {
          stroke: 'black',
          strokeWidth: 2
        })
      ], {
        left: startX + i * (size.width + spacing) * scaleFactor,
        top: startY + (maxHeight - size.height) * scaleFactor,
        scaleX: scaleFactor,
        scaleY: scaleFactor,
      });

      hoops.push(hoop);
    });

    const hoopGroup = new fabric.Group(hoops, {
      selectable: true,
      hasControls: true
    });

    fabricCanvas.add(hoopGroup);
    return hoopGroup;
  }

  function addPlayers() {
    const teamColors = ['red', 'blue'];
    const positionColors = ['green', 'black', 'white', 'yellow'];
    const playerCounts = [1, 2, 3, 1];

    teamColors.forEach((teamColor, teamIndex) => {
      let playerIndex = 0;
      positionColors.forEach((headColor, positionIndex) => {
        for (let i = 0; i < playerCounts[positionIndex]; i++) {
          const player = createStickFigure(teamColor, headColor);
          const x = 50 + playerIndex * 60;
          const y = 180 + teamIndex * 60;
          player.set({ left: x * scalingFactor, top: y * scalingFactor });
          fabricCanvas.add(player);
          playerIndex++;
        }
      });
    });
  }

  export function getDiagramAsImage() {
    const originalZoom = fabricCanvas.getZoom();
    fabricCanvas.setZoom(1);
    fabricCanvas.setWidth(contentWidth);
    fabricCanvas.setHeight(contentHeight);

    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      multiplier: 1
    });

    fabricCanvas.setZoom(scalingFactor);
    fabricCanvas.setWidth(contentWidth * scalingFactor);
    fabricCanvas.setHeight(contentHeight * scalingFactor);
    fabricCanvas.renderAll();

    return dataURL;
  }

  export function saveDiagram() {
    const diagramData = fabricCanvas.toJSON();
    console.log('DiagramDrawer: Dispatching save event with data:', diagramData);
    dispatch('save', diagramData);
  }

  export function moveUp() {
    saveDiagram();
    dispatch('moveUp');
  }

  export function moveDown() {
    saveDiagram();
    dispatch('moveDown');
  }

  function preventSubmit(event) {
    event.preventDefault();
  }
</script>

<div bind:this={canvasWrapper} class="diagram-wrapper">
  <canvas bind:this={canvas} {id} class="border border-gray-300" tabindex="0"></canvas>
</div>

<style>
  .diagram-wrapper {
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
  }

  canvas {
    width: 100% !important;
    height: auto !important;
  }
</style>

{#if !readonly}
  <div>
    {#if showSaveButton}
      <button on:click|preventDefault={saveDiagram} class="m-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
        Save Diagram
      </button>
    {/if}
    <button on:click|preventDefault={() => addNewPlayer('red', 'white')} class="m-1">Add Red Chaser</button>
    <button on:click|preventDefault={() => addNewPlayer('red', 'green')} class="m-1">Add Red Keeper</button>
    <button on:click|preventDefault={() => addNewPlayer('red', 'black')} class="m-1">Add Red Beater</button>
    <button on:click|preventDefault={() => addNewPlayer('red', 'yellow')} class="m-1">Add Red Seeker</button>
    
    <button on:click|preventDefault={() => addNewPlayer('blue', 'white')} class="m-1">Add Blue Chaser</button>
    <button on:click|preventDefault={() => addNewPlayer('blue', 'green')} class="m-1">Add Blue Keeper</button>
    <button on:click|preventDefault={() => addNewPlayer('blue', 'black')} class="m-1">Add Blue Beater</button>
    <button on:click|preventDefault={() => addNewPlayer('blue', 'yellow')} class="m-1">Add Blue Seeker</button>
    
    <button on:click|preventDefault={addArrow} class="m-1">Add Arrow</button>
    <button on:click|preventDefault={addHoopGroup} class="m-1">Add Hoop Group</button>
    <button on:click|preventDefault={addTextBox} class="m-1">Add Text Box</button>
    <button on:click|preventDefault={addBludger} class="m-1">Add Bludger</button>
    <button on:click|preventDefault={addQuaffle} class="m-1">Add Quaffle</button>
    <button on:click|preventDefault={deleteSelectedObjects} class="m-1">Delete Selected</button>
    <button on:click|preventDefault={moveUp} class="m-1">Move Up</button>
    <button on:click|preventDefault={moveDown} class="m-1">Move Down</button>
  </div>
{/if}