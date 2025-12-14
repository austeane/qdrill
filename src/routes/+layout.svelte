<script>
	import { browser } from '$app/environment';
	import { navigating, page } from '$app/state';
	import '../app.css';
	import AppShell from '$lib/components/AppShell.svelte';
	import { SvelteToast } from '@zerodevx/svelte-toast';
	import FeedbackButton from '$lib/components/FeedbackButton.svelte';
	import { apiFetch } from '$lib/utils/apiFetch.js';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
	import { useSession } from '$lib/auth-client';
	import { theme } from '$lib/stores/themeStore';

	let { children } = $props();

	// Get session using Better Auth
	const session = useSession();

	const isNavigating = $derived(navigating.type !== null);

	theme.init?.();

	// Function to check and associate entities from sessionStorage
	async function checkAndAssociateEntities(sessionData) {
		if (!browser || !sessionData) return;

		const itemsToAssociate = [
			{ key: 'formationToAssociate', endpoint: '/api/formations' },
			{ key: 'drillToAssociate', endpoint: '/api/drills' },
			{ key: 'practicePlanToAssociate', endpoint: '/api/practice-plans' }
		];

		for (const item of itemsToAssociate) {
			const rawValue = sessionStorage.getItem(item.key);
			if (rawValue) {
				let entityId = rawValue;
				let claimToken = null;
				try {
					const parsed = JSON.parse(rawValue);
					if (parsed && typeof parsed === 'object') {
						entityId = parsed.id ?? rawValue;
						claimToken = parsed.claimToken ?? null;
					}
				} catch {
					// Legacy plain-id storage
				}
				try {
					await apiFetch(`${item.endpoint}/${entityId}/associate`, {
						method: 'POST',
						body: JSON.stringify({ claimToken })
					});
					// Optional: Show success toast
					// toast.push(`Successfully claimed your ${item.key.replace('ToAssociate', '')}.`);
				} catch (error) {
					console.error(`Error during association call for ${item.key} ${entityId}:`, error);
					// Optional: Show error toast
					// toast.push('An error occurred while claiming your item.', { theme: { '--toastBackground': '#F56565', '--toastColor': 'white' } });
				} finally {
					// Remove the item from sessionStorage regardless of success/failure
					sessionStorage.removeItem(item.key);
				}
			}
		}
	}

	let didRunSessionAssociationOnce = false;
	$effect(() => {
		if (!browser) return;

		const sessionData = $session.data;
		if (!sessionData) return;

		const delayMs = didRunSessionAssociationOnce ? 100 : 0;
		didRunSessionAssociationOnce = true;

		const timeout = setTimeout(() => checkAndAssociateEntities(sessionData), delayMs);
		return () => clearTimeout(timeout);
	});
</script>

<div class="flex flex-col min-h-screen">
	<a href="#main-content" class="skip-to-content">Skip to main content</a>

	{#if isNavigating}
		<div
			class="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 animate-pulse"
		>
			<div class="h-full bg-blue-400 animate-pulse opacity-75"></div>
		</div>
	{/if}

	<AppShell>
		<ErrorBoundary>
			{@render children()}
		</ErrorBoundary>
	</AppShell>

	<FeedbackButton />
	<SvelteToast />

	{#if page.url.pathname === '/'}
		<footer class="py-4 bg-gray-100">
			<div class="container mx-auto text-center">
				<a href="/privacy-policy" class="text-blue-500 hover:text-blue-700 mr-4">Privacy Policy</a>
				<a href="/terms-of-service" class="text-blue-500 hover:text-blue-700">Terms of Service</a>
			</div>
		</footer>
	{/if}
</div>

<style>
	.flex {
		display: flex;
	}
	.flex-col {
		flex-direction: column;
	}
	.min-h-screen {
		min-height: 100vh;
	}
</style>
