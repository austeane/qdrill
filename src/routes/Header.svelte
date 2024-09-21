<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import logo from '$lib/images/svelte-logo.svg';
	import github from '$lib/images/github.svg';
  
	let isMobileMenuOpen = false;
  
	// Optional: Close mobile menu on route change
	$: if ($page.url.pathname !== '/') {
	  isMobileMenuOpen = false;
	}
  </script>
  
  <header class="w-full bg-white shadow-md z-50">
	<div class="container mx-auto px-4 sm:px-6 lg:px-8">
	  <div class="flex items-center justify-between h-16">
		<div class="flex items-center">
		  <a href="/" class="flex-shrink-0">
			<img class="h-8 w-8" src={logo} alt="SvelteKit Logo" />
		  </a>
		  <div class="hidden md:block ml-10">
			<div class="flex items-baseline space-x-4">
			  <a href="/" class="text-gray-700 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md text-base font-semibold">Home</a>
			  <a href="/drills" class="text-gray-700 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md text-base font-semibold">Drill Listing</a>
			  <a href="/drills/create" class="text-gray-700 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md text-base font-semibold">Drill Creation</a>
			  <a href="/drills/bulk-upload" class="text-gray-700 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md text-base font-semibold">Bulk Drill Upload</a>
			  <a href="/practice-plans" class="text-gray-700 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md text-base font-semibold">Practice Plans</a>
			</div>
		  </div>
		</div>
		<div class="md:hidden">
		  <button
			on:click={() => (isMobileMenuOpen = !isMobileMenuOpen)}
			class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-500"
			aria-label="Toggle Navigation Menu"
		  >
			<svg class="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
			  <path class:hidden={isMobileMenuOpen} stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
			  <path class:hidden={!isMobileMenuOpen} stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		  </button>
		</div>
	  </div>
	</div>
  
	{#if isMobileMenuOpen}
	  <div class="md:hidden">
		<div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
		  <a href="/" class="text-gray-700 hover:bg-gray-100 hover:text-gray-900 block px-3 py-2 rounded-md text-lg font-semibold">Home</a>
		  <a href="/drills" class="text-gray-700 hover:bg-gray-100 hover:text-gray-900 block px-3 py-2 rounded-md text-lg font-semibold">Drill Listing</a>
		  <a href="/drills/create" class="text-gray-700 hover:bg-gray-100 hover:text-gray-900 block px-3 py-2 rounded-md text-lg font-semibold">Drill Creation</a>
		  <a href="/drills/bulk-upload" class="text-gray-700 hover:bg-gray-100 hover:text-gray-900 block px-3 py-2 rounded-md text-lg font-semibold">Bulk Drill Upload</a>
		  <a href="/practice-plans" class="text-gray-700 hover:bg-gray-100 hover:text-gray-900 block px-3 py-2 rounded-md text-lg font-semibold">Practice Plans</a>
		</div>
	  </div>
	{/if}
  </header>