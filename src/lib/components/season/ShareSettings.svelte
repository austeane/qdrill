<script>
	import { apiFetch } from '$lib/utils/apiFetch.js';

	let { seasonId, isAdmin = false, onTokenGenerated } = $props();

	let shareData = $state(null);
	let loading = $state(false);
	let error = $state(null);
	let copiedField = $state(null);

	// Load current share settings
	async function loadShareSettings() {
		if (!isAdmin) return;

		loading = true;
		error = null;

		try {
			shareData = await apiFetch(`/api/seasons/${seasonId}/share`);
		} catch (err) {
			console.error('Error loading share settings:', err);
			error = 'Failed to load share settings';
		} finally {
			loading = false;
		}
	}

	// Generate new share tokens
	async function generateToken(type) {
		loading = true;
		error = null;

		try {
			shareData = await apiFetch(`/api/seasons/${seasonId}/share`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type })
			});
			onTokenGenerated?.({ type });
		} catch (err) {
			console.error('Error generating token:', err);
			error = (err && err.message) || 'Failed to generate share link';
		} finally {
			loading = false;
		}
	}

	// Copy to clipboard
	async function copyToClipboard(text, field) {
		try {
			await navigator.clipboard.writeText(text);
			copiedField = field;
			setTimeout(() => {
				copiedField = null;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}

	// Get full URL
	function getFullUrl(path) {
		const base = typeof window !== 'undefined' ? window.location.origin : 'https://www.qdrill.app';
		return `${base}${path}`;
	}

	// Load on mount
	$effect(() => {
		if (isAdmin && seasonId) {
			void loadShareSettings();
		}
	});
</script>

{#if isAdmin}
	<div class="bg-white rounded-lg shadow-lg p-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-semibold">Share Settings</h2>
			<button
				onclick={loadShareSettings}
				disabled={loading}
				class="text-blue-600 hover:text-blue-700 text-sm"
			>
				<svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
					/>
				</svg>
				Refresh
			</button>
		</div>

		{#if loading && !shareData}
			<div class="flex justify-center py-8">
				<svg class="animate-spin h-8 w-8 text-gray-400" viewBox="0 0 24 24">
					<circle
						class="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						stroke-width="4"
						fill="none"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
			</div>
		{:else if error}
			<div class="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
				{error}
			</div>
		{:else if shareData}
			<div class="space-y-6">
				<!-- Public View Link -->
				<div>
					<h3 class="font-medium mb-2 flex items-center gap-2">
						<svg
							class="w-5 h-5 text-gray-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
							/>
						</svg>
						Public View Link
					</h3>
					<p class="text-sm text-gray-600 mb-2">
						Share this link with anyone to view the season schedule (read-only)
					</p>

					{#if shareData.public_view_url}
						<div class="flex gap-2">
							<input
								type="text"
								value={getFullUrl(shareData.public_view_url)}
								readonly
								class="flex-1 px-3 py-2 border rounded bg-gray-50 text-sm"
							/>
							<button
								onclick={() => copyToClipboard(getFullUrl(shareData.public_view_url), 'public')}
								class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
							>
								{copiedField === 'public' ? 'Copied!' : 'Copy'}
							</button>
						</div>
					{:else}
						<button
							onclick={() => generateToken('public')}
							disabled={loading}
							class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
						>
							Generate Public Link
						</button>
					{/if}
				</div>

				<!-- Calendar Feed Link -->
				<div>
					<h3 class="font-medium mb-2 flex items-center gap-2">
						<svg
							class="w-5 h-5 text-gray-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
						Calendar Feed (ICS)
					</h3>
					<p class="text-sm text-gray-600 mb-2">
						Subscribe to this feed in your calendar app for automatic updates
					</p>

					{#if shareData.ics_url}
						<div class="flex gap-2">
							<input
								type="text"
								value={getFullUrl(shareData.ics_url)}
								readonly
								class="flex-1 px-3 py-2 border rounded bg-gray-50 text-sm"
							/>
							<button
								onclick={() => copyToClipboard(getFullUrl(shareData.ics_url), 'ics')}
								class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
							>
								{copiedField === 'ics' ? 'Copied!' : 'Copy'}
							</button>
						</div>

						<div class="mt-2 text-xs text-gray-500">
							<details>
								<summary class="cursor-pointer hover:text-gray-700">How to subscribe?</summary>
								<div class="mt-2 space-y-1 pl-4">
									<p><strong>Google Calendar:</strong> Settings → Add calendar → From URL</p>
									<p><strong>Apple Calendar:</strong> File → New Calendar Subscription</p>
									<p><strong>Outlook:</strong> Add calendar → Subscribe from web</p>
								</div>
							</details>
						</div>
					{:else}
						<button
							onclick={() => generateToken('ics')}
							disabled={loading}
							class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
						>
							Generate Calendar Feed
						</button>
					{/if}
				</div>

				<!-- Token Management -->
				{#if shareData.public_view_token || shareData.ics_token}
					<div class="pt-4 border-t">
						<h3 class="font-medium mb-2 text-sm text-gray-700">Token Management</h3>
						<div class="flex gap-2">
							{#if shareData.public_view_token}
								<button
									onclick={() => generateToken('public')}
									disabled={loading}
									class="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 disabled:opacity-50 transition-colors"
								>
									Regenerate Public Token
								</button>
							{/if}
							{#if shareData.ics_token}
								<button
									onclick={() => generateToken('ics')}
									disabled={loading}
									class="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 disabled:opacity-50 transition-colors"
								>
									Regenerate ICS Token
								</button>
							{/if}
						</div>
						<p class="text-xs text-gray-500 mt-2">
							Regenerating tokens will invalidate existing shared links
						</p>
					</div>
				{/if}
			</div>
		{:else}
			<div class="text-center py-8">
				<p class="text-gray-500 mb-4">No share links generated yet</p>
				<div class="flex justify-center gap-3">
					<button
						onclick={() => generateToken('public')}
						disabled={loading}
						class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
					>
						Generate Public Link
					</button>
					<button
						onclick={() => generateToken('ics')}
						disabled={loading}
						class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
					>
						Generate Calendar Feed
					</button>
				</div>
			</div>
		{/if}
	</div>
{/if}
