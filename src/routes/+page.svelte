<!-- Home Page -->

<script>
	// No additional script needed for the Home page
  </script>
  
  <svelte:head>
	<title>Home</title>
	<meta name="description" content="Welcome to the QDrill app" />
  </svelte:head>
  
  <section class="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
	<!-- Main Title Section -->
	<div class="flex flex-col lg:flex-row items-center">
	  <!-- Left Side: Title and Blurb -->
	  <div class="lg:w-1/2 text-center lg:text-left mb-8 lg:mb-0">
		<h1 class="text-5xl font-bold mb-4">QDrill</h1>
		<p class="text-lg mb-6">Easily find, create, and share drills and practice plans. Focus on coaching, QDrill makes planning easy.</p>
		<a href="/drills" class="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded">
		  Browse List of Drills
		</a>
	  </div>
	  <!-- Right Side: Placeholder Graphic -->
	  <div class="lg:w-1/2 flex justify-center">
		<div class="w-full h-64 bg-gray-200 flex flex-col items-center justify-center">
		  <!-- Placeholder shapes -->
		  <div class="flex space-x-4 mb-4">
			<div class="w-16 h-16 bg-gray-400"></div>
			<div class="w-16 h-16 bg-gray-400 rounded-full"></div>
			<div class="w-16 h-16 bg-gray-400 transform rotate-45"></div>
		  </div>
		  <!-- Added text -->
		  <p class="text-sm text-gray-600 text-center px-4">
			This is a placeholder! Please send Austin fun pictures of people doing quadball drills so he can replace me
		  </p>
		</div>
	  </div>
	</div>
  
	<!-- Action Cards Section -->
	<div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
	  <!-- Practice Plans Card -->
	  <div class="bg-white shadow-md rounded-lg p-6 text-center flex flex-col h-full">
		<div class="flex-grow">
		  <h2 class="text-2xl font-semibold mb-4">Practice Plans</h2>
		  <p class="mb-6">Plan your practice sessions efficiently.</p>
		</div>
		<div class="mt-auto">
		  <a href="/practice-plans" class="inline-block bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
			View Plans
		  </a>
		</div>
	  </div>
	  <!-- Create New Drill Card -->
	  <div class="bg-white shadow-md rounded-lg p-6 text-center flex flex-col h-full">
		<div class="flex-grow">
		  <h2 class="text-2xl font-semibold mb-4">Create New Drill</h2>
		  <p class="mb-6">Design and share your own drills.</p>
		</div>
		<div class="mt-auto">
		  <a href="/drills/create" class="inline-block bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
			Create Drill
		  </a>
		</div>
	  </div>
	  <!-- About Us Card -->
	  <div class="bg-white shadow-md rounded-lg p-6 text-center flex flex-col h-full">
		<div class="flex-grow">
		  <h2 class="text-2xl font-semibold mb-4">About Us</h2>
		  <p class="mb-6">Learn more about our mission and team.</p>
		</div>
		<div class="mt-auto">
		  <a href="/about" class="inline-block bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
			Go to Page
		  </a>
		</div>
	  </div>
	</div>
  </section>