<script lang="ts">
	import Topbar from '$lib/components/nav/Topbar.svelte';
	import Sidebar from '$lib/components/nav/Sidebar.svelte';
	import CommandPalette from '$lib/components/CommandPalette.svelte';
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children?: Snippet } = $props();

	let sidebarOpen = $state(false); // mobile drawer
	let sidebarCollapsed = $state(false); // desktop collapsed
	let cmdOpen = $state(false);

	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			cmdOpen = true;
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		return () => {
			window.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<Topbar
	sidebarOpen={sidebarOpen}
	onToggleSidebar={({ open }) => (sidebarOpen = open)}
	onOpenCommandPalette={() => (cmdOpen = true)}
/>

<div class="appshell">
	<Sidebar bind:open={sidebarOpen} bind:collapsed={sidebarCollapsed} />

	<div class="appshell__content" id="main-content" tabindex="-1">
		{@render children?.()}
	</div>
</div>

<CommandPalette bind:open={cmdOpen} onClose={() => (cmdOpen = false)} />

<style>
	.appshell {
		display: grid;
		grid-template-columns: 1fr;
	}
	@media (min-width: 768px) {
		.appshell {
			grid-template-columns: 240px 1fr;
		}
	}
	@media (min-width: 768px) {
		:global(.appshell .sidebar.collapsed) ~ .appshell__content {
			margin-left: -176px;
		}
	}
	.appshell__content {
		padding: var(--space-6) var(--space-4);
		min-width: 0;
	}
	@media (max-width: 767px) {
		.appshell__content {
			padding: var(--space-4) var(--space-3);
			overflow-x: hidden;
		}
	}
</style>
