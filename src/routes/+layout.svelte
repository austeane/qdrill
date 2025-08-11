<script>
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { navigating } from '$app/stores';
	import { onDestroy } from 'svelte';
    import Header from './Header.svelte';
    import '../app.css';
	import { SvelteToast, toast } from '@zerodevx/svelte-toast';
	import FeedbackButton from '$lib/components/FeedbackButton.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import { apiFetch } from '$lib/utils/apiFetch.js';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
	import { inject } from '@vercel/analytics';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import { dev } from '$app/environment';
    import { onMount } from 'svelte';
	import { useSession } from '$lib/auth-client';
    import { theme } from '$lib/stores/themeStore';

	inject({ mode: dev ? 'development' : 'production' });
	injectSpeedInsights();

	// Get session using Better Auth
const session = useSession();

let isNavigating = false;
const unsubNavigating = navigating.subscribe((v) => (isNavigating = !!v));
onDestroy(unsubNavigating);

	/** @type {import('./$types').LayoutData} */
	export let data;

	// Function to check and associate entities from sessionStorage
	async function checkAndAssociateEntities(sessionData) {
		if (!browser || !sessionData) return;

		const itemsToAssociate = [
			{ key: 'formationToAssociate', endpoint: '/api/formations' },
			{ key: 'drillToAssociate', endpoint: '/api/drills' },
			{ key: 'practicePlanToAssociate', endpoint: '/api/practice-plans' }
		];

		for (const item of itemsToAssociate) {
			const entityId = sessionStorage.getItem(item.key);
			if (entityId) {
                                try {
                                        console.log(`Found ${item.key} with ID ${entityId}, attempting to associate...`);
                                        await apiFetch(`${item.endpoint}/${entityId}/associate`, { method: 'POST' });
                                        console.log(`${item.key} ${entityId} associated successfully.`);
                                        // Optional: Show success toast
                                        // toast.push(`Successfully claimed your ${item.key.replace('ToAssociate', '')}.`);
                                } catch (error) {
                                        console.error(`Error during association call for ${item.key} ${entityId}:`, error);
                                        // Optional: Show error toast
                                        // toast.push('An error occurred while claiming your item.', { theme: { '--toastBackground': '#F56565', '--toastColor': 'white' } });
                                } finally {
                                        // Remove the item from sessionStorage regardless of success/failure
                                        sessionStorage.removeItem(item.key);
                                        console.log(`Removed ${item.key} from sessionStorage.`);
                                }
			}
		}
	}

    // Initialize theme and check for any pending entity associations
    onMount(() => {
        theme.init();
        if ($session.data) {
            checkAndAssociateEntities($session.data);
        }
    });

	// Check whenever the session data changes (e.g., after login)
	$: {
		if (browser && $session.data) {
			// Use timeout to ensure session is fully established after redirect
			setTimeout(() => checkAndAssociateEntities($session.data), 100);
		}
	}
</script>

<div class="flex flex-col min-h-screen">
        <a href="#main-content" class="skip-to-content">Skip to main content</a>
        <Header />

	<!-- Global Navigation Loading Indicator -->
       {#if isNavigating}
               <div
                       class="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 animate-pulse"
               >
                       <div class="h-full bg-blue-400 animate-pulse opacity-75"></div>
               </div>
       {/if}

        <main id="main-content" tabindex="-1" class="flex-1">
		<div class="container mx-auto px-4 py-8">
			<ErrorBoundary>
				<slot />
			</ErrorBoundary>
		</div>
	</main>

	<FeedbackButton />

	<SvelteToast />

	{#if $page.url.pathname === '/'}
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
	.flex-1 {
		flex: 1;
	}
	main {
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
	}
</style>
