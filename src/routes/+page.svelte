<!-- Home Page -->

<script>
	// No additional script needed for the Home page
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
		<p class="text-lg mb-6">Easily find, create, and share drills and practice plans. Focus on coaching, QDrill makes planning easy.</p>
		<div class="space-y-4">
		  <a href="/practice-plans/wizard" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg w-full sm:w-auto text-center">
			Create Practice Plan
		  </a>
		  <a href="/drills" class="inline-block bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg w-full sm:w-auto text-center">
			Browse Drills
		  </a>
		</div>
	  </div>
	  <!-- Right Side: Image -->
	  <div class="lg:w-1/2 flex justify-center">
		<img 
		  src="/images/drill.png" 
		  alt="Head Coach Chris Radojewski explaining a drill. Photo credit Quadball Canada." 
		  class="w-full max-w-md h-auto object-contain"
		/>
	  </div>
	</div>
  
	<!-- Features Section -->
	<div class="mt-16">
	  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
		<!-- Wizard Feature -->
		<div class="bg-white shadow-lg rounded-lg p-6 text-center flex flex-col h-full border-t-4 border-blue-500">
		  <div class="flex-grow">
			<div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
			  <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
			  </svg>
			</div>
			<h3 class="text-xl font-semibold mb-2">Practice Plan Creator</h3>
			<p class="text-gray-600 mb-4">Create complete practice plans from scratch, guided step by step.</p>
		  </div>
		  <div class="mt-auto">
			<a href="/practice-plans/wizard" class="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">
			  Plan a Practice
			</a>
		  </div>
		</div>

		<!-- Drills Library -->
		<div class="bg-white shadow-lg rounded-lg p-6 text-center flex flex-col h-full border-t-4 border-green-500">
		  <div class="flex-grow">
			<div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
			  <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
			  </svg>
			</div>
			<h3 class="text-xl font-semibold mb-2">Drills Library</h3>
			<p class="text-gray-600 mb-4">Browse and search our growing collection of quadball drills.</p>
		  </div>
		  <div class="mt-auto">
			<a href="/drills" class="inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">
			  Browse Drills
			</a>
		  </div>
		</div>

		<!-- Community -->
		<div class="bg-white shadow-lg rounded-lg p-6 text-center flex flex-col h-full border-t-4 border-purple-500">
		  <div class="flex-grow">
			<div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
			  <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
			  </svg>
			</div>
			<h3 class="text-xl font-semibold mb-2">Community</h3>
			<p class="text-gray-600 mb-4">Share drills and practice plans with the quadball community.</p>
		  </div>
		  <div class="mt-auto">
			<a href="https://discord.gg/yuXBkACYE3" target="_blank" rel="noopener noreferrer" class="inline-block bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg">
			  Join Discord
			</a>
		  </div>
		</div>
	  </div>
	</div>
  </section>