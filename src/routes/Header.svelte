<!-- Header Component -->

<script>
import { page } from '$app/stores';
import { cart } from '$lib/stores/cartStore';
import { onMount } from 'svelte';
import { useSession, signIn, signOut } from '$lib/auth-client';

	// Get session using Better Auth
	const session = useSession();

       let isMobileMenuOpen = false;
       let isCartOpen = false;
       let activeDropdown = null;
       let isProfileDropdownOpen = false;
       let navigationRef;

       $: currentPath = $page.url.pathname;

       function isActiveSection(path) {
               return currentPath.startsWith(path);
       }

       // Optional: Close mobile menu and dropdown on route change
       $: if ($page.url.pathname !== '/') {
               isMobileMenuOpen = false;
               activeDropdown = null;
       }

       function toggleCart() {
               isCartOpen = !isCartOpen;
       }

       function toggleMobileMenu() {
               isMobileMenuOpen = !isMobileMenuOpen;
       }

       function toggleDropdown(dropdownName, event) {
               event?.preventDefault();
               event?.stopPropagation();
               activeDropdown = activeDropdown === dropdownName ? null : dropdownName;
       }


       function handleKeydown(event) {
               if (event.key === 'Escape') {
                       activeDropdown = null;
               } else if (event.key === 'ArrowDown' && activeDropdown) {
                       const dropdown = document.querySelector(`[data-dropdown="${activeDropdown}"]`);
                       const firstItem = dropdown?.querySelector('[role="menuitem"]');
                       firstItem?.focus();
               }
       }

       // Close dropdowns when clicking outside
       onMount(() => {
               const handleClickOutside = (event) => {
                       if (navigationRef && !navigationRef.contains(event.target)) {
                               activeDropdown = null;
                       }
                       if (!event.target.closest('.cart-dropdown') && !event.target.closest('.cart-button')) {
                               isCartOpen = false;
                       }
               };

               document.addEventListener('click', handleClickOutside);
               document.addEventListener('keydown', handleKeydown);

               return () => {
                       document.removeEventListener('click', handleClickOutside);
                       document.removeEventListener('keydown', handleKeydown);
               };
       });

	// User info from Better Auth
	$: user = $session.data?.user;
</script>

<header class="w-full bg-white shadow-md z-50">
	<div class="container mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between h-16">
			<!-- Left side: Home Icon -->
			<div class="flex-shrink-0">
				<a href="/">
					<!-- Home Icon SVG -->
					<svg
						class="h-8 w-8 text-blue-500"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 9l9-7 9 7v11a1 1 0 01-1 1h-6a1 1 0 01-1-1V13H10v7a1 1 0 01-1 1H3a1 1 0 01-1-1z"
						/>
					</svg>
				</a>
			</div>

			<!-- Right side: Navigation Links -->
			<div class="hidden md:flex items-center space-x-6">
				<!-- Drills Dropdown -->
                               <div class="relative" bind:this={navigationRef}>
                                       <button
                                               class="flex items-center text-gray-700 hover:text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
                                               class:text-blue-600={isActiveSection('/drills')}
                                               class:bg-blue-50={isActiveSection('/drills')}
                                               on:click={(e) => toggleDropdown('drills', e)}
                                               aria-expanded={activeDropdown === 'drills'}
                                               aria-haspopup="true"
                                               aria-controls="drills-menu"
                                       >
                                               <span>Drills</span>
                                               <svg
                                                       class="ml-1 h-4 w-4 transition-transform duration-200"
                                                       class:rotate-180={activeDropdown === 'drills'}
                                                       xmlns="http://www.w3.org/2000/svg"
                                                       fill="none"
                                                       viewBox="0 0 24 24"
                                                       stroke="currentColor"
                                                       aria-hidden="true"
                                               >
                                                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                               </svg>
                                       </button>

                                       {#if activeDropdown === 'drills'}
                                               <div
                                                       id="drills-menu"
                                                       class="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50"
                                                       role="menu"
                                                       aria-label="Drills options"
                                                       data-dropdown="drills"
                                                       on:keydown={(e) => {
                                                               if (e.key === 'Escape') activeDropdown = null;
                                                               else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                                                       e.preventDefault();
                                                                       const items = [...e.currentTarget.querySelectorAll('[role="menuitem"]')];
                                                                       const currentIndex = items.indexOf(e.target);
                                                                       let nextIndex;
                                                                       if (e.key === 'ArrowDown') {
                                                                               nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
                                                                       } else {
                                                                               nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
                                                                       }
                                                                       items[nextIndex]?.focus();
                                                               }
                                                       }}
                                               >
                                                       <a
                                                               href="/drills"
                                                               class="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none rounded-sm"
                                                               role="menuitem"
                                                               tabindex="0"
                                                               on:click={() => activeDropdown = null}
                                                       >
                                                               View Drills
                                                       </a>
                                                       <a
                                                               href="/drills/create"
                                                               class="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none rounded-sm"
                                                               role="menuitem"
                                                               tabindex="0"
                                                               on:click={() => activeDropdown = null}
                                                       >
                                                               Create Drill
                                                       </a>
                                                       <a
                                                               href="/drills/bulk-upload"
                                                               class="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none rounded-sm"
                                                               role="menuitem"
                                                               tabindex="0"
                                                               on:click={() => activeDropdown = null}
                                                       >
                                                               Bulk Upload
                                                       </a>
                                               </div>
                                       {/if}
                               </div>

                               <div class="relative">
                                       <button
                                               class="flex items-center text-gray-700 hover:text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
                                               class:text-blue-600={isActiveSection('/practice-plans')}
                                               class:bg-blue-50={isActiveSection('/practice-plans')}
                                               on:click={(e) => toggleDropdown('practice-plans', e)}
                                               aria-expanded={activeDropdown === 'practice-plans'}
                                               aria-haspopup="true"
                                       >
                                               <span>Practice Plans</span>
                                               <svg class="ml-1 h-4 w-4 transition-transform duration-200" class:rotate-180={activeDropdown === 'practice-plans'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                               </svg>
                                       </button>

                                       {#if activeDropdown === 'practice-plans'}
                                               <div class="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50" role="menu">
                                                       <a href="/practice-plans" class="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none rounded-sm" role="menuitem" on:click={() => activeDropdown = null}>
                                                               View Plans
                                                       </a>
                                                       <a href="/practice-plans/create" class="block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none rounded-sm" role="menuitem" on:click={() => activeDropdown = null}>
                                                               Create Plan
                                                       </a>
                                               </div>
                                       {/if}
                               </div>

				<!-- Formations Link -->
				<a
					href="/formations"
					class="text-gray-700 hover:text-gray-900 font-semibold flex items-center focus:outline-none"
				>
					Formations
				</a>

				<!-- Whiteboard Link -->
				<a
					href="/whiteboard"
					class="text-gray-700 hover:text-gray-900 font-semibold flex items-center focus:outline-none"
				>
					Whiteboard
				</a>

				<!-- Shopping Cart Icon -->
				<div class="relative cart-dropdown">
					<button
						on:click={toggleCart}
						class="text-gray-700 hover:text-gray-900 focus:outline-none cart-button"
						aria-label="Shopping Cart"
					>
						<!-- Cart Icon SVG -->
						<svg
							class="h-6 w-6"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.34-5M7 13l1.36 6m10-6l1.34 6m-11.7 0h11.72"
							/>
						</svg>
						<!-- Cart Item Count Badge -->
						{#if $cart.length > 0}
							<span
								class="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full"
							>
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
									Create Plan with {$cart.length} Drill{$cart.length !== 1 ? 's' : ''}
								</a>
							{/if}
						</div>
					{/if}
				</div>
				{#if user}
					<div
						role="button"
						tabindex="0"
						class="relative group drills-dropdown"
						on:mouseenter={() => (isProfileDropdownOpen = true)}
						on:mouseleave={() => (isProfileDropdownOpen = false)}
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
							<svg
								class="ml-1 h-4 w-4"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 9l-7 7-7-7"
								/>
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
							<a
								href="/profile"
								class="block px-4 py-2 text-gray-700 hover:bg-gray-100"
								role="menuitem">Profile</a
							>
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
					<button
						on:click={() => signIn.social({ provider: 'google' })}
						class="text-gray-700 hover:text-gray-900 font-semibold"
					>
						Sign in with Google
					</button>
				{/if}
				<a
					href="https://discord.gg/yuXBkACYE3"
					target="_blank"
					rel="noopener noreferrer"
					class="text-gray-700 hover:text-gray-900 font-semibold flex items-center"
					aria-label="Join our Discord"
				>
					<svg class="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"
						/>
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
						<svg
							class="h-6 w-6"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.34-5M7 13l1.36 6m10-6l1.34 6m-11.7 0h11.72"
							/>
						</svg>
						{#if $cart.length > 0}
							<span
								class="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full"
							>
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
									Create Plan with {$cart.length} Drill{$cart.length !== 1 ? 's' : ''}
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
						<path
							class:hidden={isMobileMenuOpen}
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h16"
						/>
						<!-- Menu open: "block", Menu closed: "hidden" -->
						<path
							class:hidden={!isMobileMenuOpen}
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
		</div>
	</div>

       <!-- Mobile menu -->
       {#if isMobileMenuOpen}
               <div class="md:hidden bg-white border-t border-gray-200" id="mobile-menu" role="navigation" aria-label="Mobile navigation">
                       <div class="px-2 pt-2 pb-3 space-y-1">
                               <a
                                       href="/drills"
                                       class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                       class:bg-blue-50={isActiveSection('/drills')}
                                       class:text-blue-600={isActiveSection('/drills')}
                                       on:click={() => isMobileMenuOpen = false}
                               >
                                       Drills
                               </a>

                               <a
                                       href="/practice-plans"
                                       class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                       class:bg-blue-50={isActiveSection('/practice-plans')}
                                       class:text-blue-600={isActiveSection('/practice-plans')}
                                       on:click={() => isMobileMenuOpen = false}
                               >
                                       Practice Plans
                               </a>

                               <a
                                       href="/formations"
                                       class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                       class:bg-blue-50={isActiveSection('/formations')}
                                       class:text-blue-600={isActiveSection('/formations')}
                                       on:click={() => isMobileMenuOpen = false}
                               >
                                       Formations
                               </a>

                               <a
                                       href="/whiteboard"
                                       class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                       class:bg-blue-50={isActiveSection('/whiteboard')}
                                       class:text-blue-600={isActiveSection('/whiteboard')}
                                       on:click={() => isMobileMenuOpen = false}
                               >
                                       Whiteboard
                               </a>

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
						on:click={() => signIn.social({ provider: 'google' })}
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
					aria-label="Join our Discord"
				>
					<svg class="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"
						/>
					</svg>
				</a>
			</div>
		</div>
	{/if}
</header>

<style>
	/* Custom styles if needed */
	/* Ensure dropdown menus appear above other content */
	.drills-dropdown > div {
		transition:
			opacity 0.2s ease,
			visibility 0.2s ease;
	}

	.practice-plans-dropdown > div {
		transition:
			opacity 0.2s ease,
			visibility 0.2s ease;
	}
</style>
