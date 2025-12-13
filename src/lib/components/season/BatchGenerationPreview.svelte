<script>
	let { preview = null, loading = false, onGenerate, onCancel } = $props();

	function formatDate(dateStr) {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function handleGenerate() {
		onGenerate?.();
	}

	function handleCancel() {
		onCancel?.();
	}

	function groupByMonth(dates) {
		const groups = {};
		dates.forEach((dateInfo) => {
			const date = new Date(dateInfo.date);
			const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
			const monthLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

			if (!groups[monthKey]) {
				groups[monthKey] = {
					label: monthLabel,
					dates: []
				};
			}
			groups[monthKey].dates.push(dateInfo);
		});
		return groups;
	}

	const groupedPreview = $derived(preview ? groupByMonth(preview.preview) : {});
</script>

{#if preview}
	<div class="space-y-4">
		<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
			<h3 class="font-semibold text-blue-900 mb-2">Generation Summary</h3>
			<div class="grid grid-cols-3 gap-4 text-sm">
				<div>
					<span class="text-blue-700">Total Dates:</span>
					<span class="font-semibold ml-1">{preview.totalDates}</span>
				</div>
				<div>
					<span class="text-green-700">Will Create:</span>
					<span class="font-semibold ml-1">{preview.willCreate}</span>
				</div>
				<div>
					<span class="text-amber-700">Will Skip:</span>
					<span class="font-semibold ml-1">{preview.willSkip}</span>
				</div>
			</div>
		</div>

		<div class="max-h-96 overflow-y-auto border rounded-lg">
			{#each Object.entries(groupedPreview) as [_monthKey, monthData] (_monthKey)}
				<div class="border-b last:border-b-0">
					<div class="bg-gray-50 px-4 py-2 font-medium text-gray-700 sticky top-0">
						{monthData.label}
					</div>
					<div class="divide-y">
						{#each monthData.dates as dateInfo (new Date(dateInfo.date).toISOString())}
							<div
								class="px-4 py-2 flex items-center justify-between
                         {dateInfo.willCreate ? 'bg-white' : 'bg-gray-50'}"
							>
								<div class="flex items-center space-x-3">
									<span class="text-sm font-medium">
										{formatDate(dateInfo.date)}
									</span>
									{#if dateInfo.willCreate}
										<span
											class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
										>
											Will Create
										</span>
									{:else}
										<span
											class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800"
										>
											Skip
										</span>
									{/if}
								</div>
								{#if dateInfo.skipReason}
									<span class="text-sm text-gray-500">
										{dateInfo.skipReason}
									</span>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<div class="flex justify-end space-x-2 pt-4 border-t">
			<button
				type="button"
				onclick={handleCancel}
				disabled={loading}
				class="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
			>
				Cancel
			</button>
			<button
				type="button"
				onclick={handleGenerate}
				disabled={loading || preview.willCreate === 0}
				class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
			>
				{#if loading}
					<svg
						class="animate-spin h-4 w-4"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					<span>Generating...</span>
				{:else}
					<span>Generate {preview.willCreate} Practice{preview.willCreate !== 1 ? 's' : ''}</span>
				{/if}
			</button>
		</div>
	</div>
{:else}
	<div class="text-center py-8 text-gray-500">
		No preview available. Configure recurrence pattern and date range first.
	</div>
{/if}
