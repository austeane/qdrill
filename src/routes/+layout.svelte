<script>
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import Header from './Header.svelte';
  import './styles.css';
  import { SvelteToast, toast } from '@zerodevx/svelte-toast';
  import FeedbackButton from '../components/FeedbackButton.svelte';
  import { inject } from '@vercel/analytics';
  import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
  import { dev } from '$app/environment';
  import { onMount } from 'svelte';

  inject({ mode: dev ? 'development' : 'production' });
  injectSpeedInsights();

  /** @type {import('./$types').LayoutData} */
  export let data;

  // Function to check and associate entities from sessionStorage
  async function checkAndAssociateEntities(session) {
    if (!browser || !session) return;

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
          const response = await fetch(`${item.endpoint}/${entityId}/associate`, {
            method: 'POST'
          });
          if (response.ok) {
            console.log(`${item.key} ${entityId} associated successfully.`);
            // Optional: Show success toast
            // toast.push(`Successfully claimed your ${item.key.replace('ToAssociate', '')}.`);
          } else {
            const errorData = await response.json();
            console.error(`Failed to associate ${item.key} ${entityId}:`, response.status, errorData);
            // Optional: Show error toast
            // toast.push(`Could not claim ${item.key.replace('ToAssociate', '')}. It might already be owned.`, { theme: { '--toastBackground': '#F56565', '--toastColor': 'white' } });
          }
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

  // Check on initial load (in case user was already logged in but association failed before)
  onMount(() => {
    checkAndAssociateEntities($page.data.session);
  });

  // Check whenever the session data changes (e.g., after login)
  $: {
    if (browser && $page.data.session) {
      // Use timeout to ensure session is fully established after redirect
      setTimeout(() => checkAndAssociateEntities($page.data.session), 100);
    }
  }

</script>

<div class="flex flex-col min-h-screen">
  <Header />

  <main class="flex-1">
    <div class="container mx-auto px-4 py-8">
      <slot />
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
