<script>
  import { onMount, afterUpdate, createEventDispatcher, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import * as fabric from 'fabric';
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

  onMount(() => {
    if (!browser) return;

    fabricCanvas = new fabric.Canvas(canvas, {
      width: contentWidth,
      height: contentHeight,
      backgroundColor: '#f0f0f0',
      selection: !readonly
    });

    if (data && Object.keys(data).length > 0) {
      fabricCanvas.loadFromJSON(data, () => {
        fabricCanvas.renderAll();
      });
    } else {
      addStandardShapes();
      addPlayers();
      addInitialBalls();
    }

    fabricCanvas.on('keydown', function(e) {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelectedObjects();
      }
    });

    fabricCanvas.renderAll();

    setTimeout(() => {
      fabricCanvas.renderAll();
    }, 100);

    if (readonly) {
      fabricCanvas.getObjects().forEach(obj => {
        obj.selectable = false;
        obj.evented = false;
      });
      fabricCanvas.renderAll();
    }

    resizeCanvas();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', resizeCanvas);
    }
  });

  onDestroy(() => {
    if (browser && typeof window !== 'undefined') {
      window.removeEventListener('resize', resizeCanvas);
    }
  });

  afterUpdate(() => {
    if (fabricCanvas) {
      fabricCanvas.renderAll();
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
    const img = new Image();
    img.onload = function() {
      const fabricImage = new fabric.Image(img, {
        left: ballStartX * scalingFactor,
        top: ballY * scalingFactor,
        selectable: true,
        hasControls: true,
        originX: 'center',
        originY: 'center'
      });
      fabricImage.scale(ballSize / Math.max(img.width, img.height));
      fabricCanvas.add(fabricImage);
      fabricCanvas.renderAll();
      ballStartX += ballSize + 3;
    };
    img.onerror = function() {
      console.error('Failed to load quaffle image');
    };
    img.src = quaffleUrl;
  }

  function addBludger() {
    const img = new Image();
    img.onload = function() {
      const bludgerSize = ballSize * 2;
      const fabricImage = new fabric.Image(img, {
        left: ballStartX * scalingFactor,
        top: ballY * scalingFactor,
        selectable: true,
        hasControls: true,
        originX: 'center',
        originY: 'center'
      });
      fabricImage.scale(bludgerSize / Math.max(img.width, img.height));
      fabricCanvas.add(fabricImage);
      fabricCanvas.renderAll();
      ballStartX += bludgerSize + 3;
    };
    img.onerror = function() {
      console.error('Failed to load bludger image');
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
  <canvas bind:this={canvas} {id} class="border border-gray-300"></canvas>
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
    <button on:click|preventDefault={() => addNewPlayer('red', 'green')} class="m-1">Add Red Player</button>
    <button on:click|preventDefault={() => addNewPlayer('blue', 'green')} class="m-1">Add Blue Player</button>
    <button on:click|preventDefault={addArrow} class="m-1">Add Arrow</button>
    <button on:click|preventDefault={addHoopGroup} class="m-1">Add Hoop Group</button>
    <button on:click|preventDefault={addTextBox} class="m-1">Add Text Box</button>
    <button on:click|preventDefault={addBludger} class="m-1">Add Bludger</button>
    <button on:click|preventDefault={addQuaffle} class="m-1">Add Quaffle</button>
    <button on:click|preventDefault={deleteSelectedObjects} class="m-1">Delete Selected</button>
    {#if showSaveButton}
      <button on:click|preventDefault={saveDiagram} class="m-1">Save Diagram</button>
    {/if}
    <button on:click|preventDefault={moveUp} class="m-1">Move Up</button>
    <button on:click|preventDefault={moveDown} class="m-1">Move Down</button>
  </div>
{/if}
