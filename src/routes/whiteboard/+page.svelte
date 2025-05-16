<script>
	import ExcalidrawWrapper from '$lib/components/ExcalidrawWrapper.svelte';
	import { browser } from '$app/environment';

	let excalidrawId = 'whiteboard-main';
</script>

<svelte:head>
	<title>Whiteboard - QDrill</title>
	<meta name="description" content="A blank canvas for your quadball ideas." />
</svelte:head>

<div class="whiteboard-container w-full h-screen-minus-header">
	{#if browser}
		<ExcalidrawWrapper
			id={excalidrawId}
			data={null}
			readonly={false}
			template="blank"
			startFullscreen={true}
		/>
	{:else}
		<p>Loading whiteboard...</p>
		<!-- Placeholder for SSR, Excalidraw only runs in browser -->
	{/if}
</div>

<style>
	.h-screen-minus-header {
		height: calc(100vh - 4rem); /* Assuming header height is 4rem (h-16 in Tailwind) */
	}

	/* Ensure excalidraw wrapper takes full space within this container */
	:global(.whiteboard-container .excalidraw-wrapper) {
		width: 100% !important;
		height: 100% !important;
	}
	:global(.whiteboard-container .excalidraw) {
		min-height: 0 !important; /* Override min-height from global excalidraw styles if needed */
	}
</style>
