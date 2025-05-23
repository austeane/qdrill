<script>
	export let lines = 3;
	export let showAvatar = false;
	export let className = '';
</script>

<div class="animate-pulse {className}">
	{#if showAvatar}
		<div class="flex items-center space-x-4 mb-4">
			<div class="rounded-full bg-gray-300 h-10 w-10"></div>
			<div class="flex-1 space-y-2">
				<div class="h-4 bg-gray-300 rounded w-3/4"></div>
				<div class="h-4 bg-gray-300 rounded w-1/2"></div>
			</div>
		</div>
	{/if}
	
	{#each Array(lines) as _, i}
		<div class="h-4 bg-gray-300 rounded mb-2 {i === lines - 1 ? 'w-2/3' : 'w-full'}"></div>
	{/each}
</div> 