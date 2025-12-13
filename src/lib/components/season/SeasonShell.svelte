<script>
	import { device } from '$lib/stores/deviceStore';
	import { Layers, Calendar, Settings, Share2 } from 'lucide-svelte';

	let {
		activeTab = $bindable('overview'),
		season = null,
		sections = [],
		markers = [],
		practices = [],
		isAdmin = false,
		teamId = '',
		onTabChange,
		children
	} = $props();

	// Tab configuration
	const tabs = [
		{
			id: 'overview',
			label: 'Overview',
			icon: Layers,
			adminOnly: false
		},
		{
			id: 'schedule',
			label: 'Schedule',
			icon: Calendar,
			adminOnly: false
		},
		{
			id: 'manage',
			label: 'Manage',
			icon: Settings,
			adminOnly: true
		},
		{
			id: 'share',
			label: 'Share',
			icon: Share2,
			adminOnly: true
		}
	];

	const visibleTabs = $derived(tabs.filter((tab) => !tab.adminOnly || isAdmin));

	function handleTabChange(tab) {
		activeTab = tab;
		onTabChange?.({ tab });
	}
</script>

<div class="season-shell" class:mobile={device.isMobile}>
	{#if device.isMobile}
		<!-- Mobile Layout -->
		<header class="mobile-header">
			<div class="header-content">
				<h1 class="season-name">{season?.name || 'Season'}</h1>
				<div class="header-info">
					<span class="date-badge">
						{#if season}
							{new Date(season.start_date).toLocaleDateString('en-US', {
								month: 'short',
								day: 'numeric'
							})}
							–
							{new Date(season.end_date).toLocaleDateString('en-US', {
								month: 'short',
								day: 'numeric',
								year: 'numeric'
							})}
						{/if}
					</span>
				</div>
			</div>
		</header>

		<main class="mobile-content">
			{@render children?.()}
		</main>

		<nav class="mobile-nav">
			{#each visibleTabs as tab (tab.id)}
				<button
					class="nav-tab"
					class:active={activeTab === tab.id}
					onclick={() => handleTabChange(tab.id)}
					aria-current={activeTab === tab.id ? 'page' : undefined}
				>
					<div class="nav-icon">
						<tab.icon size={24} />
					</div>
					<span class="nav-label">{tab.label}</span>
				</button>
			{/each}
		</nav>
	{:else}
		<!-- Desktop Layout -->
		<div class="desktop-container">
			<header class="desktop-header">
				<div class="header-left">
					<h1 class="season-name">{season?.name || 'Season'}</h1>
					{#if season}
						<span class="date-range">
							{new Date(season.start_date).toLocaleDateString('en-US', {
								month: 'short',
								day: 'numeric',
								year: 'numeric'
							})}
							–
							{new Date(season.end_date).toLocaleDateString('en-US', {
								month: 'short',
								day: 'numeric',
								year: 'numeric'
							})}
						</span>
					{/if}
				</div>

				<nav class="desktop-nav">
					{#each visibleTabs as tab (tab.id)}
						<button
							class="desktop-tab"
							class:active={activeTab === tab.id}
							onclick={() => handleTabChange(tab.id)}
							aria-current={activeTab === tab.id ? 'page' : undefined}
						>
							<tab.icon size={20} />
							<span>{tab.label}</span>
						</button>
					{/each}
				</nav>
			</header>

			<main class="desktop-content">
				{@render children?.()}
			</main>
		</div>
	{/if}
</div>

<style>
	.season-shell {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: var(--bg-primary, #f9fafb);
	}

	/* Mobile Styles */
	.mobile-header {
		background: white;
		border-bottom: 1px solid #e5e7eb;
		padding: 12px 16px;
		flex-shrink: 0;
	}

	.header-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.season-name {
		font-size: 20px;
		font-weight: 600;
		margin: 0;
		color: #111827;
	}

	.date-badge {
		font-size: 12px;
		color: #6b7280;
		background: #f3f4f6;
		padding: 4px 8px;
		border-radius: 4px;
	}

	.mobile-content {
		flex: 1;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
	}

	.mobile-nav {
		background: white;
		border-top: 1px solid #e5e7eb;
		display: flex;
		justify-content: space-around;
		flex-shrink: 0;
		padding-bottom: env(safe-area-inset-bottom);
		box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
	}

	.nav-tab {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 8px 4px;
		min-height: 56px;
		background: none;
		border: none;
		color: #6b7280;
		cursor: pointer;
		transition: color 0.2s;
		position: relative;
	}

	.nav-tab:active {
		background: #f3f4f6;
	}

	.nav-tab.active {
		color: #2563eb;
	}

	.nav-tab.active::before {
		content: '';
		position: absolute;
		top: 0;
		left: 20%;
		right: 20%;
		height: 2px;
		background: #2563eb;
	}

	.nav-icon {
		width: 24px;
		height: 24px;
		margin-bottom: 4px;
	}

	.nav-label {
		font-size: 11px;
		font-weight: 500;
	}

	/* Desktop Styles */
	.desktop-container {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.desktop-header {
		background: white;
		border-bottom: 1px solid #e5e7eb;
		padding: 16px 24px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-shrink: 0;
	}

	.header-left {
		display: flex;
		align-items: baseline;
		gap: 16px;
	}

	.desktop-header .season-name {
		font-size: 24px;
	}

	.date-range {
		font-size: 14px;
		color: #6b7280;
	}

	.desktop-nav {
		display: flex;
		gap: 4px;
	}

	.desktop-tab {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		background: none;
		border: none;
		border-radius: 8px;
		color: #6b7280;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.desktop-tab:hover {
		background: #f3f4f6;
		color: #111827;
	}

	.desktop-tab.active {
		background: #eff6ff;
		color: #2563eb;
	}

	.desktop-content {
		flex: 1;
		overflow-y: auto;
		padding: 24px;
	}

	/* Dark mode support */
	:global(.dark) .season-shell {
		background: #111827;
	}

	:global(.dark) .mobile-header,
	:global(.dark) .desktop-header {
		background: #1f2937;
		border-bottom-color: #374151;
	}

	:global(.dark) .season-name {
		color: #f3f4f6;
	}

	:global(.dark) .date-badge,
	:global(.dark) .date-range {
		color: #9ca3af;
	}

	:global(.dark) .date-badge {
		background: #374151;
	}

	:global(.dark) .mobile-nav {
		background: #1f2937;
		border-top-color: #374151;
	}

	:global(.dark) .nav-tab,
	:global(.dark) .desktop-tab {
		color: #9ca3af;
	}

	:global(.dark) .nav-tab:active,
	:global(.dark) .desktop-tab:hover {
		background: #374151;
	}

	:global(.dark) .nav-tab.active,
	:global(.dark) .desktop-tab.active {
		color: #3b82f6;
	}

	:global(.dark) .desktop-tab.active {
		background: #1e3a8a;
	}

	/* Responsive adjustments */
	@media (min-width: 768px) and (max-width: 1024px) {
		.desktop-header {
			padding: 12px 16px;
		}

		.desktop-header .season-name {
			font-size: 20px;
		}

		.desktop-tab {
			padding: 6px 12px;
			font-size: 13px;
		}
	}
</style>
