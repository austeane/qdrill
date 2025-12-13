<script>
	import { apiFetch } from '$lib/utils/apiFetch.js';
	import { toLocalISO } from '$lib/utils/date.js';
	import { toast } from '@zerodevx/svelte-toast';
	import BottomSheet from '$lib/components/ui/BottomSheet.svelte';

	let { season = null, sections = [], date = null, teamId = '', onSave, onClose } = $props();

	let open = $state(true);
	let loading = $state(false);
	let startTime = $state('18:00'); // Default 6 PM
	let seedDefaults = $state(true);

	// Clamp a date string to season bounds, returning a valid yyyy-MM-dd date string
	function clampDateToSeason(dateStr) {
		if (!dateStr || !season?.start_date || !season?.end_date) {
			return toLocalISO(new Date(season?.start_date || dateStr || new Date()));
		}

		const d = new Date(dateStr);
		const seasonStart = new Date(season.start_date);
		const seasonEnd = new Date(season.end_date);

		if (d < seasonStart) return toLocalISO(seasonStart);
		if (d > seasonEnd) return toLocalISO(seasonEnd);
		return toLocalISO(d);
	}

	// Get default date (today if within season, otherwise season start)
	function getDefaultDate() {
		const today = toLocalISO(new Date());
		return clampDateToSeason(today);
	}

	let selectedDate = $state(date ? clampDateToSeason(date) : getDefaultDate());

	const overlappingSections = $derived(getOverlappingSections(selectedDate));

	function getOverlappingSections(dateStr) {
		if (!dateStr) return [];
		const checkDate = new Date(dateStr);

		return sections.filter((s) => {
			const sectionStart = new Date(s.start_date);
			const sectionEnd = new Date(s.end_date);
			return checkDate >= sectionStart && checkDate <= sectionEnd;
		});
	}

	async function handleCreate() {
		if (!selectedDate) {
			toast.push('Please select a date', {
				theme: {
					'--toastBackground': '#ef4444',
					'--toastColor': 'white'
				}
			});
			return;
		}

		loading = true;

		try {
			// Check if practice already exists on this date
			const response = await apiFetch(`/api/teams/${teamId}/practice-plans?date=${selectedDate}`);

			const existingPractices = response.items || [];

			if (existingPractices.length > 0) {
				if (!confirm(`A practice already exists on ${formatDate(selectedDate)}. Create another?`)) {
					loading = false;
					return;
				}
			}

			// Create practice via instantiate endpoint
			const practiceResponse = await apiFetch(`/api/seasons/${season.id}/instantiate`, {
				method: 'POST',
				body: JSON.stringify({
					scheduled_date: selectedDate,
					start_time: startTime,
					seed_default_sections: seedDefaults && overlappingSections.length > 0
				})
			});

			toast.push('Practice created successfully', {
				theme: {
					'--toastBackground': '#10b981',
					'--toastColor': 'white'
				}
			});

			onSave?.(practiceResponse);
			handleClose();
		} catch (error) {
			console.error('Failed to create practice:', error);
			toast.push(error.message || 'Failed to create practice', {
				theme: {
					'--toastBackground': '#ef4444',
					'--toastColor': 'white'
				}
			});
		} finally {
			loading = false;
		}
	}

	function handleClose() {
		open = false;
		setTimeout(() => onClose?.(), 200);
	}

	function formatDate(dateStr) {
		return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}

	// Get min/max dates from season
	const minDate = $derived(season?.start_date || toLocalISO(new Date()));
	const maxDate = $derived(season?.end_date || '');
</script>

{#snippet footer()}
	<div class="footer-buttons">
		<button class="button button-secondary" onclick={handleClose} disabled={loading}>
			Cancel
		</button>
		<button class="button button-primary" onclick={handleCreate} disabled={loading}>
			{loading ? 'Creating...' : 'Create Practice'}
		</button>
	</div>
{/snippet}

<BottomSheet bind:open title="Create Practice" onClose={handleClose} {footer}>
	<div class="form-content">
		<!-- Date Selection -->
		<div class="form-group">
			<label for="practice-date" class="form-label"> Practice Date </label>
			<input
				id="practice-date"
				type="date"
				bind:value={selectedDate}
				min={minDate}
				max={maxDate}
				class="form-input"
				disabled={loading}
			/>
			<p class="form-helper">
				{formatDate(selectedDate)}
			</p>
		</div>

		<!-- Time Selection -->
		<div class="form-group">
			<label for="practice-time" class="form-label"> Start Time </label>
			<input
				id="practice-time"
				type="time"
				bind:value={startTime}
				class="form-input"
				disabled={loading}
			/>
		</div>

		<!-- Overlapping Sections Preview -->
		{#if overlappingSections.length > 0}
			<div class="sections-preview">
				<h3 class="preview-title">Overlapping Sections</h3>
				<p class="preview-description">This practice will be prefilled with content from:</p>
					<div class="section-list">
						{#each overlappingSections as section (section.id)}
							<div class="section-item">
								<div class="section-color" style="background-color: {section.color}"></div>
								<span class="section-name">{section.name}</span>
							</div>
						{/each}
					</div>

				<label class="checkbox-label">
					<input type="checkbox" bind:checked={seedDefaults} disabled={loading} />
					<span>Include default practice sections</span>
				</label>
			</div>
		{:else}
			<div class="no-sections">
				<p>No sections overlap with this date.</p>
				<p class="hint">The practice will be created empty.</p>
			</div>
		{/if}
	</div>
</BottomSheet>

<style>
	.form-content {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.form-label {
		font-size: 14px;
		font-weight: 500;
		color: #374151;
	}

	.form-input {
		padding: 10px 12px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 16px;
		color: #111827;
		background: white;
	}

	.form-input:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
	}

	.form-input:disabled {
		background: #f3f4f6;
		color: #6b7280;
	}

	.form-helper {
		font-size: 13px;
		color: #6b7280;
		margin: 0;
	}

	.sections-preview {
		background: #f9fafb;
		border-radius: 8px;
		padding: 16px;
	}

	.preview-title {
		font-size: 14px;
		font-weight: 600;
		color: #111827;
		margin: 0 0 8px 0;
	}

	.preview-description {
		font-size: 13px;
		color: #6b7280;
		margin: 0 0 12px 0;
	}

	.section-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 16px;
	}

	.section-item {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.section-color {
		width: 16px;
		height: 16px;
		border-radius: 4px;
	}

	.section-name {
		font-size: 14px;
		color: #374151;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		color: #374151;
		cursor: pointer;
	}

	.checkbox-label input[type='checkbox'] {
		width: 18px;
		height: 18px;
		cursor: pointer;
	}

	.no-sections {
		background: #fef3c7;
		border: 1px solid #fbbf24;
		border-radius: 8px;
		padding: 16px;
	}

	.no-sections p {
		margin: 0;
		font-size: 14px;
		color: #78350f;
	}

	.no-sections .hint {
		margin-top: 4px;
		font-size: 13px;
		color: #92400e;
	}

	.footer-buttons {
		display: flex;
		gap: 12px;
		width: 100%;
	}

	.button {
		flex: 1;
		padding: 12px 20px;
		border-radius: 8px;
		font-size: 15px;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
		border: none;
	}

	.button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.button-secondary {
		background: #f3f4f6;
		color: #374151;
	}

	.button-secondary:not(:disabled):active {
		background: #e5e7eb;
	}

	.button-primary {
		background: #2563eb;
		color: white;
	}

	.button-primary:not(:disabled):active {
		background: #1d4ed8;
	}

	/* Dark mode */
	:global(.dark) .form-label {
		color: #d1d5db;
	}

	:global(.dark) .form-input {
		background: #374151;
		border-color: #4b5563;
		color: #f3f4f6;
	}

	:global(.dark) .form-input:focus {
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	:global(.dark) .form-input:disabled {
		background: #1f2937;
		color: #9ca3af;
	}

	:global(.dark) .form-helper {
		color: #9ca3af;
	}

	:global(.dark) .sections-preview {
		background: #1f2937;
	}

	:global(.dark) .preview-title {
		color: #f3f4f6;
	}

	:global(.dark) .preview-description {
		color: #9ca3af;
	}

	:global(.dark) .section-name,
	:global(.dark) .checkbox-label {
		color: #d1d5db;
	}

	:global(.dark) .no-sections {
		background: #78350f;
		border-color: #92400e;
	}

	:global(.dark) .no-sections p {
		color: #fef3c7;
	}

	:global(.dark) .no-sections .hint {
		color: #fde68a;
	}

	:global(.dark) .button-secondary {
		background: #374151;
		color: #d1d5db;
	}

	:global(.dark) .button-secondary:not(:disabled):active {
		background: #4b5563;
	}

	:global(.dark) .button-primary {
		background: #3b82f6;
	}

	:global(.dark) .button-primary:not(:disabled):active {
		background: #2563eb;
	}
</style>
