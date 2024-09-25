<script>
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { webVitals } from '$lib/vitals';
  import Header from './Header.svelte';
  import './styles.css';
  import { SvelteToast } from '@zerodevx/svelte-toast';
  import FeedbackButton from '../components/FeedbackButton.svelte';

  /** @type {import('./$types').LayoutServerData} */
  export let data;

  $: if (browser && data?.analyticsId) {
    const analyticsId = data.analyticsId === 'VERCEL_ANALYTICS_ID'
      ? import.meta.env.VITE_VERCEL_ANALYTICS_ID
      : data.analyticsId;

    webVitals({
      path: $page.url.pathname,
      params: $page.params,
      analyticsId
    });
  }
</script>

<div class="flex flex-col min-h-screen">
  <Header />

  <main class="flex-1">
    <slot />
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
