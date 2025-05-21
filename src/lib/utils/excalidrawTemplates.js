import { v4 as uuidv4 } from 'uuid';
import { fetchImageAsDataURL } from './imageUtils';

export const CANVAS_WIDTH = 500;
export const CANVAS_HEIGHT = 600;

export function createGuideRectangle() {
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
		locked: true
	};
}

function createHoopSet(x, y) {
	const hoopGroupId = uuidv4();
	const hoopSizes = [
		{ width: 40, height: 80 },
		{ width: 40, height: 120 },
		{ width: 40, height: 100 }
	];
	const spacing = 20;
	const elements = [];
	for (let i = 0; i < hoopSizes.length; i++) {
		const size = hoopSizes[i];
		const poleHeight = size.height - size.width;
		const hoopY = y - poleHeight - size.width;
		elements.push({
			type: 'ellipse',
			x: x + i * (size.width + spacing) - size.width / 2,
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
			isDeleted: false
		});
		elements.push({
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
			isDeleted: false
		});
	}
	return elements;
}

async function addPlayersToField(elements, files, positions) {
	for (const pos of positions) {
		const imageId = uuidv4();
		const teamColor = pos.team || 'blue';
		const imagePath = `/images/icons/${teamColor}-player-${pos.type}.png`;
		const dataURL = await fetchImageAsDataURL(imagePath);
		if (!dataURL) {
			console.warn(`Failed to load image: ${imagePath}`);
			continue;
		}
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
			status: 'idle'
		});
		files[imageId] = {
			id: imageId,
			dataURL,
			staticPath: imagePath,
			mimeType: 'image/png',
			created: Date.now(),
			lastRetrieved: Date.now()
		};
	}
}

export async function addHalfCourtElements(elements, files) {
	const hoopSet = createHoopSet(CANVAS_WIDTH / 2 - 40, 180);
	elements.push(...hoopSet);
	const playerPositions = [
		{ x: CANVAS_WIDTH / 2, y: 200, type: 'k' },
		{ x: CANVAS_WIDTH / 2 - 60, y: 260, type: 'b1' },
		{ x: CANVAS_WIDTH / 2 + 60, y: 260, type: 'b2' },
		{ x: CANVAS_WIDTH / 2 - 100, y: 360, type: 'c1' },
		{ x: CANVAS_WIDTH / 2, y: 360, type: 'c2' },
		{ x: CANVAS_WIDTH / 2 + 100, y: 360, type: 'c3' }
	];
	await addPlayersToField(elements, files, playerPositions);
}

export async function addFullCourtElements(elements, files) {
	const topHoops = createHoopSet(CANVAS_WIDTH / 2 - 40, 120);
	const bottomHoops = createHoopSet(CANVAS_WIDTH / 2 - 40, CANVAS_HEIGHT - 120);
	elements.push(...topHoops, ...bottomHoops);
	const playerPositions = [
		{ x: CANVAS_WIDTH / 2, y: 140, type: 'k', team: 'blue' },
		{ x: CANVAS_WIDTH / 2 - 50, y: 180, type: 'b1', team: 'blue' },
		{ x: CANVAS_WIDTH / 2 + 50, y: 180, type: 'b2', team: 'blue' },
		{ x: CANVAS_WIDTH / 2 - 80, y: 240, type: 'c1', team: 'blue' },
		{ x: CANVAS_WIDTH / 2, y: 240, type: 'c2', team: 'blue' },
		{ x: CANVAS_WIDTH / 2 + 80, y: 240, type: 'c3', team: 'blue' },
		{ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 140, type: 'k', team: 'red' },
		{ x: CANVAS_WIDTH / 2 - 50, y: CANVAS_HEIGHT - 180, type: 'b1', team: 'red' },
		{ x: CANVAS_WIDTH / 2 + 50, y: CANVAS_HEIGHT - 180, type: 'b2', team: 'red' },
		{ x: CANVAS_WIDTH / 2 - 80, y: CANVAS_HEIGHT - 240, type: 'c1', team: 'red' },
		{ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 240, type: 'c2', team: 'red' },
		{ x: CANVAS_WIDTH / 2 + 80, y: CANVAS_HEIGHT - 240, type: 'c3', team: 'red' }
	];
	await addPlayersToField(elements, files, playerPositions);
}

export async function addSidebarElements(elements, files) {
	const hoopSizes = [
		{ width: 40, height: 80 },
		{ width: 40, height: 120 },
		{ width: 40, height: 100 }
	];
	const spacing = 20;
	const startX = CANVAS_WIDTH + 100;
	const baseY = 100;
	const hoopGroupId = uuidv4();
	hoopSizes.forEach((size, i) => {
		const poleHeight = size.height - size.width;
		const hoopY = baseY - poleHeight - size.width;
		elements.push({
			type: 'ellipse',
			x: startX + i * (size.width + spacing) - size.width / 2,
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
			isDeleted: false
		});
		elements.push({
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
			isDeleted: false
		});
	});

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
	const startY = 140;
	const iconSize = 40;
	const rowSpacing = 50;
	const baseX = CANVAS_WIDTH + 90;
	for (let setIndex = 0; setIndex < iconSets.length; setIndex++) {
		const currentY = startY + setIndex * rowSpacing;
		for (const position of positions) {
			const imageId = uuidv4();
			const imagePath = `/images/icons/${iconSets[setIndex]}-${position.type}.png`;
			const dataURL = await fetchImageAsDataURL(imagePath);
			if (!dataURL) {
				console.warn(`Failed to load sidebar icon: ${imagePath}`);
				continue;
			}
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
				status: 'idle'
			});
			files[imageId] = {
				id: imageId,
				dataURL,
				staticPath: imagePath,
				mimeType: 'image/png',
				created: Date.now(),
				lastRetrieved: Date.now()
			};
		}
	}

	const balls = [
		{
			url: '/images/icons/quaffle.png',
			x: CANVAS_WIDTH + 100,
			y: 115,
			size: { width: 16, height: 20 }
		},
		{
			url: '/images/icons/bludger.png',
			x: CANVAS_WIDTH + 160,
			y: 115,
			size: { width: 16, height: 20 }
		},
		{
			url: '/images/icons/bludger.png',
			x: CANVAS_WIDTH + 220,
			y: 115,
			size: { width: 16, height: 20 }
		},
		{
			url: '/images/icons/bludger.png',
			x: CANVAS_WIDTH + 280,
			y: 115,
			size: { width: 16, height: 20 }
		},
		{
			url: '/images/cone.webp',
			x: CANVAS_WIDTH + 340,
			y: 115,
			size: { width: 20, height: 20 },
			scale: [0.25, 0.25]
		}
	];
	for (const ball of balls) {
		const imageId = uuidv4();
		const dataURL = await fetchImageAsDataURL(ball.url);
		if (!dataURL) {
			console.warn(`Failed to load ball/cone: ${ball.url}`);
			continue;
		}
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
			status: 'idle'
		});
		files[imageId] = {
			id: imageId,
			dataURL,
			staticPath: ball.url,
			mimeType: ball.url.endsWith('.webp') ? 'image/webp' : 'image/png',
			created: Date.now(),
			lastRetrieved: Date.now()
		};
	}
}

export async function createInitialImageElements(template) {
	const elements = [createGuideRectangle()];
	const files = {};
	if (template === 'halfCourt') {
		await addHalfCourtElements(elements, files);
	} else if (template === 'fullCourt') {
		await addFullCourtElements(elements, files);
	}
	await addSidebarElements(elements, files);
	return { elements, files };
}
