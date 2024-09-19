<script>
  import { onMount, afterUpdate, createEventDispatcher } from 'svelte';
  import * as fabric from 'fabric';
  const quaffleUrl = '/images/quaffle.webp';
  const bludgerUrl = '/images/bludger.webp';

  export let data = null;
  export let id = '';
  export let showSaveButton = false;
  export let index;

  const dispatch = createEventDispatcher();
  let canvas;
  let fabricCanvas;
  let lastAddedPosition = { x: 100, y: 100 };

  let ballSize = 20;
  let ballStartX = 60;
  let ballY = 130;

  function updateLastAddedPosition() {
    // Update the position for the next added player
    lastAddedPosition.x += 50;
    if (lastAddedPosition.x > fabricCanvas.width - 50) {
      lastAddedPosition.x = 50;
      lastAddedPosition.y += 50;
    }
    if (lastAddedPosition.y > fabricCanvas.height - 50) {
      lastAddedPosition.y = 50;
    }
  }

  onMount(() => {
    fabricCanvas = new fabric.Canvas(canvas, {
      width: 500,
      height: 300,
      backgroundColor: '#f0f0f0'
    });

    if (data && Object.keys(data).length > 0) {
      // Load existing diagram data
      fabricCanvas.loadFromJSON(data, () => {
        fabricCanvas.renderAll();
      });
    } else {
      // Create a new diagram with default shapes
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
    player.set({ left: lastAddedPosition.x, top: lastAddedPosition.y });
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
      left: lastAddedPosition.x,
      top: lastAddedPosition.y,
      selectable: true,
      hasControls: true
    });
    fabricCanvas.add(group);
    updateLastAddedPosition();
    fabricCanvas.renderAll();
  }

  function addHoopGroup() {
    const hoopGroup = addStandardShapes();
    hoopGroup.set({ left: lastAddedPosition.x, top: lastAddedPosition.y });
    updateLastAddedPosition();
    fabricCanvas.renderAll();
  }

  function addTextBox() {
    const text = new fabric.Textbox('Edit me', {
      left: lastAddedPosition.x,
      top: lastAddedPosition.y,
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
        left: ballStartX,
        top: ballY,
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
        left: ballStartX,
        top: ballY,
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
          player.set({ left: x, top: y });
          fabricCanvas.add(player);
          playerIndex++;
        }
      });
    });
  }

  export function getDiagramAsImage() {
    return fabricCanvas.toDataURL();
  }

  export function saveDiagram() {
    const diagramData = fabricCanvas.toJSON();
    console.log('DiagramDrawer: Dispatching save event with data:', diagramData);
    dispatch('save', diagramData);
  }

  function preventSubmit(event) {
    event.preventDefault();
  }
</script>

<div>
  <canvas bind:this={canvas} {id}></canvas>
</div>
<div>
  <button on:click|preventDefault={() => addNewPlayer('red', 'green')}>Add Red Player</button>
  <button on:click|preventDefault={() => addNewPlayer('blue', 'green')}>Add Blue Player</button>
  <button on:click|preventDefault={addArrow}>Add Arrow</button>
  <button on:click|preventDefault={addHoopGroup}>Add Hoop Group</button>
  <button on:click|preventDefault={addTextBox}>Add Text Box</button>
  <button on:click|preventDefault={addBludger}>Add Bludger</button>
  <button on:click|preventDefault={addQuaffle}>Add Quaffle</button>
  <button on:click|preventDefault={deleteSelectedObjects}>Delete Selected</button>
  {#if showSaveButton}
    <button on:click|preventDefault={saveDiagram}>Save Diagram</button>
  {/if}
</div>

<style>
  canvas {
    border: 1px solid #ccc;
  }
  button {
    margin: 5px;
  }
</style>