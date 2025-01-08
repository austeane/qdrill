<!-- Header Component -->

<script>
  import { page } from '$app/stores';
  import { cart } from '$lib/stores/cartStore';
  import { onMount } from 'svelte';
  import { signIn, signOut } from '@auth/sveltekit/client';
  
  let isMobileMenuOpen = false;
  let isCartOpen = false;
  let isDrillsDropdownOpen = false;
  let isProfileDropdownOpen = false;
  let isPracticePlansDesktopDropdownOpen = false;
  let isPracticePlansMobileDropdownOpen = false;

  // Optional: Close mobile menu and dropdown on route change
  $: if ($page.url.pathname !== '/') {
    isMobileMenuOpen = false;
    isDrillsDropdownOpen = false;
    isPracticePlansDesktopDropdownOpen = false;
    isPracticePlansMobileDropdownOpen = false;
  }

  function toggleCart() {
    isCartOpen = !isCartOpen;
  }

  function toggleMobileMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
  }

  // Close drills dropdown when clicking outside
  onMount(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.drills-dropdown')) {
        isDrillsDropdownOpen = false;
      }
      if (!event.target.closest('.cart-dropdown') && !event.target.closest('.cart-button')) {
        isCartOpen = false;
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });

  $: user = $page.data.session?.user;
</script>

<header class="w-full bg-white shadow-md z-50">
  <div class="container mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <!-- Left side: Home Icon -->
      <div class="flex-shrink-0">
        <a href="/">
          <!-- Home Icon SVG -->
          <svg class="h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 9l9-7 9 7v11a1 1 0 01-1 1h-6a1 1 0 01-1-1V13H10v7a1 1 0 01-1 1H3a1 1 0 01-1-1z" />
          </svg>
        </a>
      </div>

      <!-- Right side: Navigation Links -->
      <div class="hidden md:flex items-center space-x-6">
        <!-- Drills Dropdown -->
        <div
          class="relative drills-dropdown"
          on:mouseenter={() => isDrillsDropdownOpen = true}
          on:mouseleave={() => isDrillsDropdownOpen = false}
        >
          <a
            href="/drills"
            class="text-gray-700 hover:text-gray-900 font-semibold flex items-center focus:outline-none"
            aria-haspopup="true"
            aria-expanded={isDrillsDropdownOpen}
          >
            Drills
            <!-- Dropdown Arrow Icon -->
            <svg class="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </a>

          <!-- Dropdown Menu -->
          <div
            class="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 transition-all duration-300 ease-in-out"
            class:opacity-0={!isDrillsDropdownOpen}
            class:invisible={!isDrillsDropdownOpen}
            class:opacity-100={isDrillsDropdownOpen}
            class:visible={isDrillsDropdownOpen}
            role="menu"
            aria-label="Drills options"
          >
            <a href="/drills" class="block px-4 py-2 text-gray-700 hover:bg-gray-100" role="menuitem">View Drills</a>
            <a href="/drills/create" class="block px-4 py-2 text-gray-700 hover:bg-gray-100" role="menuitem">Create Drill</a>
            <a href="/drills/bulk-upload" class="block px-4 py-2 text-gray-700 hover:bg-gray-100" role="menuitem">Bulk Upload</a>
            <a href="/poll" class="block px-4 py-2 text-gray-700 hover:bg-gray-100" role="menuitem">Suggest Drills</a>
          </div>
        </div>

        <div
          class="relative practice-plans-dropdown"
          on:mouseenter={() => isPracticePlansDesktopDropdownOpen = true}
          on:mouseleave={() => isPracticePlansDesktopDropdownOpen = false}
        >
          <a
            href="/practice-plans"
            class="text-gray-700 hover:text-gray-900 font-semibold flex items-center focus:outline-none"
            aria-haspopup="true"
            aria-expanded={isPracticePlansDesktopDropdownOpen}
          >
            Practice Plans
            <!-- Dropdown Arrow Icon -->
            <svg class="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </a>

          <!-- Practice Plans Dropdown Menu -->
          <div
            class="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50 transition-all duration-300 ease-in-out"
            class:opacity-0={!isPracticePlansDesktopDropdownOpen}
            class:invisible={!isPracticePlansDesktopDropdownOpen}
            class:opacity-100={isPracticePlansDesktopDropdownOpen}
            class:visible={isPracticePlansDesktopDropdownOpen}
            role="menu"
            aria-label="Practice Plans options"
          >
            <div class="py-1">
              <a href="/practice-plans" class="block px-4 py-2 text-gray-700 hover:bg-gray-100" role="menuitem">View Plans</a>
              <a href="/practice-plans/wizard" class="block px-4 py-2 text-gray-700 hover:bg-gray-100" role="menuitem">
                <div class="flex items-center">
                  <span>Create with Wizard</span>
                  <span class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">New</span>
                </div>
              </a>
              <a href="/practice-plans/create" class="block px-4 py-2 text-gray-700 hover:bg-gray-100" role="menuitem">Create from Cart</a>
            </div>
          </div>
        </div>

        <!-- Shopping Cart Icon -->
        <div class="relative cart-dropdown">
          <button
            on:click={toggleCart}
            class="text-gray-700 hover:text-gray-900 focus:outline-none cart-button"
            aria-label="Shopping Cart"
          >
            <!-- Cart Icon SVG -->
            <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.34-5M7 13l1.36 6m10-6l1.34 6m-11.7 0h11.72" />
            </svg>
            <!-- Cart Item Count Badge -->
            {#if $cart.length > 0}
              <span
                class="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                {$cart.length}
              </span>
            {/if}
          </button>

          <!-- Cart Dropdown -->
          {#if isCartOpen}
            <div class="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl p-4">
              <h3 class="text-lg font-semibold mb-2">Selected Drills</h3>
              {#if $cart.length === 0}
                <p>No drills selected</p>
              {:else}
                <ul>
                  {#each $cart as drill}
                    <li class="flex justify-between items-center mb-2">
                      <span>{drill.name}</span>
                      <button
                        on:click={() => cart.removeDrill(drill.id)}
                        class="text-red-500 hover:text-red-700"
                        aria-label={`Remove ${drill.name}`}
                      >
                        ✕
                      </button>
                    </li>
                  {/each}
                </ul>
                <a
                  href="/practice-plans/create"
                  class="block w-full text-center bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4"
                >
                  Create Plan with {$cart.length} Drill{ $cart.length !== 1 ? 's' : '' }
                </a>
              {/if}
            </div>
          {/if}
        </div>
        {#if user}
          <div 
            class="relative group drills-dropdown"
            on:mouseenter={() => isProfileDropdownOpen = true}
            on:mouseleave={() => isProfileDropdownOpen = false}
          >
            <a 
              href="/profile"
              class="flex items-center text-gray-700 hover:text-gray-900 font-semibold focus:outline-none"
              aria-haspopup="true"
              aria-expanded={isProfileDropdownOpen}
            >
              <img src={user.image} alt={user.name} class="w-8 h-8 rounded-full" />
              <span class="ml-2">{user.name}</span>
              <!-- Dropdown Arrow Icon -->
              <svg class="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </a>
            <div
              class="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 transition-all duration-300 ease-in-out"
              class:opacity-0={!isProfileDropdownOpen}
              class:invisible={!isProfileDropdownOpen}
              class:opacity-100={isProfileDropdownOpen}
              class:visible={isProfileDropdownOpen}
              role="menu"
              aria-label="Profile options"
            >
              <a href="/profile" class="block px-4 py-2 text-gray-700 hover:bg-gray-100" role="menuitem">Profile</a>
              <button 
                on:click={() => signOut()} 
                class="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                role="menuitem"
              >
                Sign out
              </button>
            </div>
          </div>
        {:else}
          <button on:click={() => signIn('google')} class="text-gray-700 hover:text-gray-900 font-semibold">
            Sign in with Google
          </button>
        {/if}
        <a 
        href="https://discord.gg/yuXBkACYE3" 
        target="_blank" 
        rel="noopener noreferrer" 
        class="text-gray-700 hover:text-gray-900 font-semibold flex items-center"
        >
          <svg class="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
        </a>
      </div>

      <!-- Mobile menu button -->
      <div class="md:hidden flex items-center space-x-2">
        <!-- Shopping Cart Icon for Mobile -->
        <div class="relative cart-dropdown">
          <button
            on:click={toggleCart}
            class="text-gray-700 hover:text-gray-900 relative focus:outline-none cart-button"
            aria-label="Shopping Cart"
          >
            <!-- Cart Icon SVG -->
            <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.34-5M7 13l1.36 6m10-6l1.34 6m-11.7 0h11.72" />
            </svg>
            {#if $cart.length > 0}
              <span
                class="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                {$cart.length}
              </span>
            {/if}
          </button>

          <!-- Cart Dropdown for Mobile -->
          {#if isCartOpen}
            <div class="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl p-4">
              <h3 class="text-lg font-semibold mb-2">Selected Drills</h3>
              {#if $cart.length === 0}
                <p>No drills selected</p>
              {:else}
                <ul>
                  {#each $cart as drill}
                    <li class="flex justify-between items-center mb-2">
                      <span>{drill.name}</span>
                      <button
                        on:click={() => cart.removeDrill(drill.id)}
                        class="text-red-500 hover:text-red-700"
                        aria-label={`Remove ${drill.name}`}
                      >
                        ✕
                      </button>
                    </li>
                  {/each}
                </ul>
                <a
                  href="/practice-plans/create"
                  class="block w-full text-center bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4"
                >
                  Create Plan with {$cart.length} Drill{ $cart.length !== 1 ? 's' : '' }
                </a>
              {/if}
            </div>
          {/if}
        </div>

        <button
          on:click={toggleMobileMenu}
          class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-500"
          aria-label="Toggle Navigation Menu"
        >
          <!-- Menu open: "hidden", Menu closed: "block" -->
          <svg class="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
            <path class:hidden={isMobileMenuOpen} stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16" />
            <!-- Menu open: "block", Menu closed: "hidden" -->
            <path class:hidden={!isMobileMenuOpen} stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </div>

  <!-- Mobile menu -->
  {#if isMobileMenuOpen}
    <div class="md:hidden">
      <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
        <!-- Drills Dropdown in Mobile Menu -->
        <div class="relative drills-dropdown">
          <a
            href="/drills"
            class="w-full text-left text-gray-700 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md text-lg font-semibold flex justify-between items-center focus:outline-none"
            on:click={() => isDrillsDropdownOpen = !isDrillsDropdownOpen}
            aria-haspopup="true"
            aria-expanded={isDrillsDropdownOpen}
          >
            Drills
            <!-- Dropdown Arrow Icon -->
            <svg class="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </a>
          {#if isDrillsDropdownOpen}
            <div class="mt-1 space-y-1 pl-4">
              <a href="/drills" class="block text-gray-700 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md" role="menuitem">View Drills</a>
              <a href="/drills/create" class="block text-gray-700 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md" role="menuitem">Create Drill</a>
              <a href="/drills/bulk-upload" class="block text-gray-700 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md" role="menuitem">Bulk Upload</a>
              <a href="/poll" class="block text-gray-700 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md" role="menuitem">Suggest Drills</a>
            </div>
          {/if}
        </div>

        <div
          class="relative practice-plans-dropdown"
          on:mouseenter={() => isPracticePlansMobileDropdownOpen = true}
          on:mouseleave={() => isPracticePlansMobileDropdownOpen = false}
        >
          <a
            href="/practice-plans"
            class="w-full text-left text-gray-700 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md text-lg font-semibold flex justify-between items-center focus:outline-none"
            on:click={() => isPracticePlansMobileDropdownOpen = !isPracticePlansMobileDropdownOpen}
            aria-haspopup="true"
            aria-expanded={isPracticePlansMobileDropdownOpen}
          >
            Practice Plans
            <!-- Dropdown Arrow Icon -->
            <svg class="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </a>
          {#if isPracticePlansMobileDropdownOpen}
            <div class="mt-1 space-y-1 pl-4">
              <a href="/practice-plans" class="block text-gray-700 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md" role="menuitem">View Plans</a>
              <a href="/practice-plans/wizard" class="block text-gray-700 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md" role="menuitem">
                <div class="flex items-center">
                  <span>Create with Wizard</span>
                  <span class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">New</span>
                </div>
              </a>
              <a href="/practice-plans/create" class="block text-gray-700 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md" role="menuitem">Create from Cart</a>
            </div>
          {/if}
        </div>

        {#if user}
          <div class="px-3 py-2">
            <div class="flex items-center">
              <img src={user.image} alt={user.name} class="w-8 h-8 rounded-full" />
              <span class="ml-2 text-gray-700 font-semibold">{user.name}</span>
            </div>
            <button 
              on:click={() => signOut()} 
              class="mt-2 w-full text-left text-gray-700 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md"
            >
              Sign out
            </button>
          </div>
        {:else}
          <button 
            on:click={() => signIn('google')} 
            class="w-full text-left text-gray-700 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md text-lg font-semibold"
          >
            Sign in with Google
          </button>
        {/if}
        <a 
        href="https://discord.gg/yuXBkACYE3" 
        target="_blank" 
        rel="noopener noreferrer" 
        class="w-full text-left text-gray-700 hover:bg-gray-100 hover:text-gray-900 px-3 py-2 rounded-md text-lg font-semibold flex items-center"
        >
          <svg class="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
        </a>
      </div>
    </div>
  {/if}
</header>

<style>
  /* Custom styles if needed */
  .drills-dropdown:hover .dropdown-menu {
    display: block;
  }

  /* Ensure dropdown menus appear above other content */
  .drills-dropdown > div {
    transition: opacity 0.2s ease, visibility 0.2s ease;
  }

  .practice-plans-dropdown:hover .dropdown-menu {
    display: block;
  }

  .practice-plans-dropdown > div {
    transition: opacity 0.2s ease, visibility 0.2s ease;
  }
</style>