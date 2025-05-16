<script>
	import { page } from '$app/stores';

	export let customSegments = null;

	$: path = $page.url.pathname;
	$: pathSegments = customSegments || path.split('/').filter((segment) => segment !== '');

	function getUrl(index) {
		if (customSegments) {
			return customSegments[index].url || '#';
		}
		return '/' + pathSegments.slice(0, index + 1).join('/');
	}

	function formatSegment(segment) {
		if (typeof segment === 'object') {
			return segment.name;
		}
		return segment
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}
</script>

<nav aria-label="Breadcrumb" class="text-sm mb-4">
	<ol class="list-none p-0 inline-flex">
		<li class="flex items-center">
			<a href="/" class="text-blue-500 hover:text-blue-700">Home</a>
			{#if pathSegments.length > 0}
				<svg
					class="fill-current w-3 h-3 mx-3"
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 320 512"
				>
					<path
						d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"
					/>
				</svg>
			{/if}
		</li>
		{#each pathSegments as segment, index}
			<li class="flex items-center">
				{#if index === pathSegments.length - 1}
					<span class="text-gray-500">{formatSegment(segment)}</span>
				{:else}
					<a href={getUrl(index)} class="text-blue-500 hover:text-blue-700"
						>{formatSegment(segment)}</a
					>
					<svg
						class="fill-current w-3 h-3 mx-3"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 320 512"
					>
						<path
							d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"
						/>
					</svg>
				{/if}
			</li>
		{/each}
	</ol>
</nav>
