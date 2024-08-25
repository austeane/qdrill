<script>
  import { onMount, afterUpdate, createEventDispatcher } from 'svelte';
  import * as fabric from 'fabric';
  const quaffleUrl = '/images/quaffle.webp';
  const bludgerUrl = '/images/bludger.webp';

  export let data = null;
  export let id = ''; // Add this line to accept an id prop

  const dispatch = createEventDispatcher();
  let canvas;
  let fabricCanvas;
  let lastAddedPosition = { x: 100, y: 100 };

  let ballSize = 20; // Adjust this value to change the size of the balls
  let ballStartX = 60; // Starting X position for the balls
  let ballY = 130; // Y position for all balls

  onMount(() => {
    fabricCanvas = new fabric.Canvas(canvas, {
      width: 500,
      height: 300,
      backgroundColor: '#f0f0f0'
    });

    if (data) {
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
      ballStartX += ballSize + 3; // Move the next ball position
    };
    img.onerror = function() {
      console.error('Failed to load quaffle image');
    };
    img.src = quaffleUrl;
  }

  function addBludger() {
    const img = new Image();
    img.onload = function() {
      const bludgerSize = ballSize * 2; // Make bludgers twice as big
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
      ballStartX += bludgerSize + 3; // Adjust spacing based on new size
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
    ballStartX += 10; // Add a little extra space before the quaffle
    addQuaffle();
  }

  function createStickFigure(bodyColor, headColor) {
    const head = new fabric.Circle({
      radius: 5,
      fill: headColor,
      stroke: ['white', 'green', 'yellow'].includes(headColor) ? 'black' : headColor,
      strokeWidth: 1,
      left: -5,
      top: -10.5  // Adjusted to touch the body
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
      { width: 40, height: 80 },  // Smallest
      { width: 40, height: 120 }, // Tallest
      { width: 40, height: 100 }  // Medium
    ];
    const spacing = 20; // Reduced spacing between hoops
    const scaleFactor = 0.55; // 75% shrinkage
    const canvasWidth = 500;
    const canvasHeight = 300;
    const startY = canvasHeight * 0.25; // 25% down the diagram
    const maxHeight = Math.max(...hoopSizes.map(size => size.height));

    // Calculate total width of all hoops
    const totalWidth = hoopSizes.reduce((sum, size) => sum + size.width, 0) + spacing * (hoopSizes.length - 1);
    const startX = (canvasWidth - totalWidth * scaleFactor) / 2; // Center horizontally

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
          const x = 50 + playerIndex * 60;  // Spread players horizontally
          const y = 180 + teamIndex * 60;   // Red team on top, blue team below
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
</div>

<style>
  canvas {
    border: 1px solid #ccc;
  }
  button {
    margin: 5px;
  }
</style>
