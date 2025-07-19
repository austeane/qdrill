<script>
	import { onMount, createEventDispatcher, tick } from 'svelte';
	import { browser } from '$app/environment';
	import ExcalidrawModal from '$lib/components/ExcalidrawModal.svelte';
	import { createExcalidrawComponent } from '$lib/utils/createExcalidrawComponent.js';
	import {
		createInitialImageElements,
		CANVAS_WIDTH,
		CANVAS_HEIGHT
	} from '$lib/utils/excalidrawTemplates.js';

	export let data = null;
	export let id = '';
	export let readonly = false;
	export let template = 'blank';
	export let startFullscreen = false;

	const dispatch = createEventDispatcher();
	let excalidrawAPI;
	let ExcalidrawComponent;
	let isFullscreen = startFullscreen;
	let initialSceneData = null;
	let fullscreenData = null;
	let excalidrawWrapper;
	let hasInitialized = false;
	if (browser) {
		window.process = {
			env: {
				NODE_ENV: import.meta.env.MODE
			}
		};
	}

	function toggleFullscreen() {
		if (!excalidrawAPI) return;
		fullscreenData = {
			elements: excalidrawAPI.getSceneElements() || [],
			appState: excalidrawAPI.getAppState() || {},
			files: excalidrawAPI.getFiles() || {}
		};
		isFullscreen = true;
	}

	function handleModalSave(event) {
		initialSceneData = event.detail;
		isFullscreen = false;
		if (excalidrawAPI) {
			excalidrawAPI.updateScene(initialSceneData);
		}
		dispatch('save', initialSceneData);
	}

	function handleModalCancel() {
		isFullscreen = false;
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
		if (!api) return;

		const elements = api.getSceneElements();
		if (!elements.length) return;

		// Find the guide rectangle
		const guideRect = elements.find(
			(el) => el.type === 'rectangle' && el.strokeColor === '#ff0000' && el.strokeStyle === 'dashed'
		);

		if (!guideRect) return;

		// Calculate zoom level as before
		const container = excalidrawWrapper?.querySelector('.excalidraw-container');
		if (!container) return;

		const containerWidth = container.offsetWidth;
		const containerHeight = container.offsetHeight;

		const zoomX = containerWidth / CANVAS_WIDTH;
		const zoomY = containerHeight / CANVAS_HEIGHT;
		const zoom = Math.min(zoomX, zoomY, 1);

		// Set scroll position to align with guide rectangle
		// Note: We use 0 for both X and Y to align with top-left
		api.updateScene({
			appState: {
				...api.getAppState(),
				scrollX: 0,
				scrollY: 0,
				zoom: {
					value: zoom
				}
			}
		});
	}

	function fixGuideRectanglePosition(elements) {
		const guideRect = elements.find(
			(el) => el.type === 'rectangle' && el.strokeColor === '#ff0000' && el.strokeStyle === 'dashed'
		);

		if (guideRect && (guideRect.x !== 0 || guideRect.y !== 0)) {
			// Calculate the offset that needs to be applied to all elements
			const offsetX = -guideRect.x;
			const offsetY = -guideRect.y;

			// Move all elements by the offset
			elements.forEach((el) => {
				if (el.type === 'line') {
					el.x += offsetX;
					el.y += offsetY;
				} else if (el.type === 'image' || el.type === 'rectangle' || el.type === 'ellipse') {
					el.x += offsetX;
					el.y += offsetY;
				}
			});
		}

		return elements;
	}

	onMount(async () => {
		if (!browser) return;
		if (hasInitialized) return;

		hasInitialized = true;
		try {
			// If there's no data or empty data, create from scratch; else fix and load existing data
			if (!data || (data.elements && data.elements.length === 0)) {
				initialSceneData = await createInitialImageElements(template);
			} else {
				const fixedElements = fixGuideRectanglePosition([...data.elements]);
				initialSceneData = {
					elements: fixedElements,
					appState: {
						viewBackgroundColor: '#ffffff',
						gridSize: 20,
						...(data.appState || {}),
						// Ensure we have a collaborators array
						collaborators: Array.isArray(data.appState?.collaborators)
							? data.appState.collaborators
							: []
					},
					files: data.files || {}
				};
			}
			ExcalidrawComponent = await createExcalidrawComponent({
				excalidrawAPI: (api) => {
					excalidrawAPI = api;
					if (!isFullscreen) {
						setTimeout(() => centerAndZoomToGuideRectangle(api), 100);
					}
				},
				initialData: initialSceneData,
				viewModeEnabled: readonly,
				onChange: handleChange,
				gridModeEnabled: false,
				theme: 'light',
				name: id,
				UIOptions: {
					canvasActions: { export: false, loadScene: false, saveAsImage: false, theme: false }
				}
			});
			await tick();
		} catch (error) {
			console.error('Error mounting Excalidraw:', error);
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
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
						/>
					</svg>
					<span class="text-sm">Fullscreen</span>
				</button>
				<div use:ExcalidrawComponent.render></div>
			</div>
		</div>
	{/if}
	{#if isFullscreen}
		<ExcalidrawModal
			{readonly}
			initialData={fullscreenData}
			on:save={handleModalSave}
			on:cancel={handleModalCancel}
		/>
	{/if}
</div>

<style>
	/* Ensure Excalidraw fills the container */
	:global(.excalidraw) {
		width: 100% !important;
		height: 100% !important;
		min-height: 600px !important; /* Update from 500px to 600px */
	}

	:global(.excalidraw-wrapper) {
		width: 100% !important;
		height: 100% !important;
		position: relative !important;
	}

	:global(.excalidraw .layer-ui__wrapper) {
		position: absolute !important;
	}

	:global(.excalidraw-mount-point) {
		position: absolute !important;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
	}
</style>
