<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Menu, Search, Sun, Moon } from 'lucide-svelte';
	import { useSession } from '$lib/auth-client';
	import { theme } from '$lib/stores/themeStore';

	const dispatch = createEventDispatcher();
	const session = useSession();

	export let sidebarOpen = false;

	// Subscribe to the rendered theme to get the actual light/dark state
	let renderedTheme = 'light';
	theme.rendered.subscribe((value) => {
		renderedTheme = value;
	});

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
		dispatch('toggleSidebar', { open: sidebarOpen });
	}

	function openCommandPalette() {
		dispatch('openCommandPalette');
	}
</script>

<header class="topbar" role="banner">
	<div class="topbar__inner">
		<button class="icon-btn mobile-only" on:click={toggleSidebar} aria-label="Toggle menu">
			<Menu size={20} />
		</button>

		<a href="/" class="brand">
			<img src="/favicon.png" alt="QDrill" width="24" height="24" />
			<span class="brand__text">QDrill</span>
		</a>

		<div class="search desktop-only">
			<button class="search__trigger" on:click={openCommandPalette} aria-label="Open search (⌘K)">
				<Search size={16} />
				<span>Search…</span>
				<kbd>⌘K</kbd>
			</button>
		</div>

		<button class="icon-btn mobile-only" on:click={openCommandPalette} aria-label="Open search">
			<Search size={18} />
		</button>

		<div class="spacer" />

		<a
			href="https://discord.gg/yuXBkACYE3"
			target="_blank"
			rel="noopener noreferrer"
			class="icon-btn discord-link"
			aria-label="Join our Discord"
		>
			<img
				src={renderedTheme === 'light'
					? '/images/icons/discord-black.svg'
					: '/images/icons/discord-white.svg'}
				alt="Discord"
				width="20"
				height="20"
			/>
		</a>

		<button class="icon-btn" on:click={() => theme.toggle()} aria-label="Toggle theme">
			{#if renderedTheme === 'light'}
				<Sun size={18} />
			{:else}
				<Moon size={18} />
			{/if}
		</button>

		{#if $session.data}
			<a href="/profile" class="pill">{$session.data.user?.name ?? 'Profile'}</a>
		{:else}
			<a href="/login" class="pill">Sign in</a>
		{/if}
	</div>
	<slot name="extra" />
</header>

<style>
	.topbar {
		position: sticky;
		top: 0;
		z-index: var(--z-sticky);
		height: 3.5rem;
		background: var(--color-surface-1);
		border-bottom: 1px solid var(--color-border-default);
		-webkit-backdrop-filter: saturate(180%) blur(8px);
		backdrop-filter: saturate(180%) blur(8px);
	}
	.topbar__inner {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		height: 100%;
		padding: 0 var(--space-4);
	}
	.brand {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--color-text-primary);
		font-weight: var(--font-weight-semibold);
	}
	.brand__text {
		display: none;
	}
	@media (min-width: 640px) {
		.brand__text {
			display: inline;
		}
	}
	.search {
		flex: 1;
		max-width: 640px;
		margin: 0 auto;
	}
	.desktop-only {
		display: none;
	}
	@media (min-width: 640px) {
		.desktop-only {
			display: flex;
		}
	}
	.search__trigger {
		width: 100%;
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background: var(--color-bg-subtle);
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-lg);
		color: var(--color-text-muted);
		transition:
			background var(--transition-fast),
			border-color var(--transition-fast);
	}
	.search__trigger:hover {
		background: var(--color-bg-muted);
		border-color: var(--color-border-strong);
	}
	.search__trigger span {
		flex: 1;
		text-align: left;
	}
	kbd {
		padding: 0.125rem 0.375rem;
		background: var(--color-surface-3);
		border-radius: var(--radius-sm);
		font-size: var(--font-size-xs);
		font-family:
			ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
			monospace;
	}
	.spacer {
		flex: 1 1 auto;
	}
	.icon-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-2);
		border: none;
		background: transparent;
		color: var(--color-text-secondary);
		border-radius: var(--radius-md);
		transition:
			background var(--transition-fast),
			color var(--transition-fast);
		cursor: pointer;
	}
	.icon-btn:hover {
		background: var(--color-bg-subtle);
		color: var(--color-text-primary);
	}
	.mobile-only {
		display: flex;
	}
	@media (min-width: 768px) {
		.mobile-only {
			display: none;
		}
	}
	/* Hide Discord link on very small screens to prevent overflow */
	.discord-link {
		display: none;
	}
	@media (min-width: 360px) {
		.discord-link {
			display: inline-flex;
		}
	}
	.pill {
		padding: 0.375rem 0.625rem;
		border: 1px solid var(--color-border-default);
		border-radius: var(--radius-full);
		color: var(--color-text-primary);
		background: var(--color-surface-1);
		transition:
			background var(--transition-fast),
			border-color var(--transition-fast);
		white-space: nowrap;
		flex-shrink: 0;
		max-width: 40vw;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.pill:hover {
		background: var(--color-bg-subtle);
		border-color: var(--color-border-strong);
	}
</style>
