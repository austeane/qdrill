export function fabricToExcalidraw(fabricData) {
	try {
		// Parse the Fabric.js JSON if it's a string
		const fabricObjects = typeof fabricData === 'string' ? JSON.parse(fabricData) : fabricData;

		// Initialize Excalidraw elements array
		const elements = [];

		// Convert each Fabric object to Excalidraw element
		fabricObjects.objects?.forEach((obj) => {
			switch (obj.type) {
				case 'line':
					elements.push({
						type: 'line',
						x: obj.left,
						y: obj.top,
						width: obj.width,
						height: obj.height,
						angle: obj.angle || 0,
						strokeColor: obj.stroke || '#000000',
						strokeWidth: obj.strokeWidth || 1,
						roughness: 1,
						opacity: obj.opacity || 100,
						version: 1,
						id: crypto.randomUUID()
					});
					break;

				case 'circle':
					elements.push({
						type: 'ellipse',
						x: obj.left,
						y: obj.top,
						width: obj.radius * 2,
						height: obj.radius * 2,
						angle: obj.angle || 0,
						strokeColor: obj.stroke || '#000000',
						backgroundColor: obj.fill || 'transparent',
						fillStyle: obj.fill ? 'solid' : 'hachure',
						strokeWidth: obj.strokeWidth || 1,
						roughness: 1,
						opacity: obj.opacity || 100,
						version: 1,
						id: crypto.randomUUID()
					});
					break;

				case 'textbox':
					elements.push({
						type: 'text',
						x: obj.left,
						y: obj.top,
						width: obj.width,
						height: obj.height,
						text: obj.text,
						fontSize: obj.fontSize,
						fontFamily: 1,
						textAlign: 'left',
						verticalAlign: 'top',
						angle: obj.angle || 0,
						strokeColor: obj.fill || '#000000',
						backgroundColor: 'transparent',
						fillStyle: 'solid',
						strokeWidth: 1,
						roughness: 1,
						opacity: obj.opacity || 100,
						version: 1,
						id: crypto.randomUUID()
					});
					break;

				// Add more cases for other object types as needed
			}
		});

		return {
			type: 'excalidraw',
			version: 2,
			source: 'https://excalidraw.com',
			elements,
			appState: {
				viewBackgroundColor: '#ffffff',
				gridSize: null
			}
		};
	} catch (error) {
		console.error('Error converting Fabric to Excalidraw:', error);
		return null;
	}
}
