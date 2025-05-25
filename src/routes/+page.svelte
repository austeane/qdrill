<!-- Home Page -->

<script>
       import { goto } from '$app/navigation';
       import { page } from '$app/stores';
       import { signIn } from '$lib/auth-client';
       import Spinner from '$lib/components/Spinner.svelte';
       import LoadingButton from '$lib/components/ui/button/LoadingButton.svelte';

       let isNavigating = false;
       let isSigningIn = false;

       $: isAuthenticated = !!$page.data.session?.user;

       async function navigateToWizard() {
               isNavigating = true;
               try {
                       await goto('/practice-plans');
               } finally {
                       isNavigating = false;
               }
       }

       async function handleSignIn() {
               isSigningIn = true;
               try {
                       await signIn.social({ provider: 'google' });
               } finally {
                       isSigningIn = false;
               }
       }
</script>

<svelte:head>
	<title>QDrill - Practice Planning Made Easy</title>
	<meta name="description" content="Create and manage quadball drills and practice plans." />
</svelte:head>

<section class="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
	<!-- Main Title Section -->
	<div class="flex flex-col lg:flex-row items-center">
		<!-- Left Side: Title and Blurb -->
		<div class="lg:w-1/2 text-center lg:text-left mb-8 lg:mb-0">
			<img
				src="/images/qdrill-pill.png"
				alt="QDrill Logo"
				class="mb-4 max-w-[150px] lg:max-w-[300px]"
				loading="eager"
				decoding="async"
			/>
			<p class="text-lg mb-6">
				Easily find, create, and share drills and practice plans. Focus on coaching, QDrill makes
				planning easy.
			</p>
                       {#if isAuthenticated}
                               <div class="space-y-4">
                                       <button
                                               on:click={navigateToWizard}
                                               disabled={isNavigating}
                                               class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg w-full sm:w-auto text-center relative text-lg"
                                       >
                                               {#if isNavigating}
                                                       <div class="absolute inset-0 flex items-center justify-center">
                                                               <Spinner size="sm" color="white" />
                                                       </div>
                                                       <span class="opacity-0">Create Practice Plan</span>
                                               {:else}
                                                       Create Practice Plan
                                               {/if}
                                       </button>

                                       <a
                                               href="/drills"
                                               class="inline-block bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg w-full sm:w-auto text-center ml-0 sm:ml-4"
                                       >
                                               Browse Drills
                                       </a>
                               </div>
                       {:else}
                               <div class="space-y-4">
                                       <LoadingButton
                                               loading={isSigningIn}
                                               loadingText="Signing in..."
                                               on:click={handleSignIn}
                                               size="lg"
                                               className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg w-full sm:w-auto text-lg shadow-lg"
                                       >
                                               Sign In with Google
                                       </LoadingButton>
                                       
                                       <a
                                               href="/drills"
                                               class="inline-flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white font-bold h-11 px-8 rounded-lg w-full sm:w-auto text-center ml-0 sm:ml-4 text-lg"
                                       >
                                               Browse Drills
                                       </a>
                               </div>

                               <div class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                       <h3 class="font-semibold text-blue-900 mb-2">Sign in and get:</h3>
                                       <ul class="text-sm text-blue-800 space-y-1">
                                               <li>✓ Unlimited drills and practice plans</li>
                                               <li>✓ AI-powered practice plan generation</li>
                                               <li>✓ Team sharing capabilities</li>
                                               <li>✓ Community drills library</li>
                                               <li>✓ Everything 100% free</li>
                                       </ul>
                               </div>
                       {/if}
		</div>
		<!-- Right Side: Image -->
		<div class="lg:w-1/2 flex justify-center">
			<img
				src="/images/homepage-hero.jpg"
				width="1200"
				height="900"
				loading="eager"
				decoding="async"
				alt="Emma Sherwood asking a question at a Team Canada practice."
				class="w-full max-w-md h-auto object-contain"
			/>
		</div>
	</div>

	<!-- Features Section -->
	<div class="mt-16">
		<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
			<!-- Wizard Feature (now AI Feature) -->
			<div
				class="bg-white shadow-lg rounded-lg p-6 text-center flex flex-col h-full border-t-4 border-blue-500"
			>
				<div class="flex-grow">
					<div
						class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4"
					>
						<svg
							class="w-6 h-6 text-blue-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<!-- Consider a more AI-themed icon later if desired -->
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
							/>
						</svg>
					</div>
					<h3 class="text-xl font-semibold mb-2">AI Plan Generator</h3>
					<p class="text-gray-600 mb-4">Have AI generate you a personalized practice plan.</p>
				</div>
				<div class="mt-auto">
					<a
						href="/practice-plans"
						class="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
					>
						Generate with AI
					</a>
				</div>
			</div>

			<!-- Drills Library -->
			<div
				class="bg-white shadow-lg rounded-lg p-6 text-center flex flex-col h-full border-t-4 border-green-500"
			>
				<div class="flex-grow">
					<div
						class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4"
					>
						<svg
							class="w-6 h-6 text-green-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
							/>
						</svg>
					</div>
					<h3 class="text-xl font-semibold mb-2">Drills Library</h3>
					<p class="text-gray-600 mb-4">
						Browse and search our growing collection of quadball drills.
					</p>
				</div>
				<div class="mt-auto">
					<a
						href="/drills"
						class="inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
					>
						Browse Drills
					</a>
				</div>
			</div>

			<!-- Community -->
			<div
				class="bg-white shadow-lg rounded-lg p-6 text-center flex flex-col h-full border-t-4 border-purple-500"
			>
				<div class="flex-grow">
					<div
						class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4"
					>
						<svg
							class="w-6 h-6 text-purple-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
							/>
						</svg>
					</div>
					<h3 class="text-xl font-semibold mb-2">Community</h3>
					<p class="text-gray-600 mb-4">
						Share drills and practice plans with the quadball community.
					</p>
				</div>
				<div class="mt-auto">
					<a
						href="https://discord.gg/yuXBkACYE3"
						target="_blank"
						rel="noopener noreferrer"
						class="inline-block bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg"
					>
						Join Discord
					</a>
				</div>
			</div>
		</div>
	</div>
</section>
