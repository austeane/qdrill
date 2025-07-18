<script>
	import { createEventDispatcher } from 'svelte';
	import { toast } from '@zerodevx/svelte-toast';
import { apiFetch } from '$lib/utils/apiFetch.js';
import { focusTrap } from '$lib/actions/focusTrap.js';
	
	export let show = false;
	export let selectedSectionId = null;
	
	const dispatch = createEventDispatcher();
	
	// Tab states
	let activeTab = 'drill'; // 'drill', 'formation', 'parallel', 'break'
	
	// Drill search state
	let drillSearchQuery = '';
	let drillSearchResults = [];
	
	// Formation search state
	let formationSearchQuery = '';
	let formationSearchResults = [];
	let formationType = 'all'; // 'all', 'offensive', 'defensive'
	
	// Parallel activities state
	let parallelActivities = {
		BEATERS: null,
		CHASERS: null,
		SEEKERS: null
	};
	let selectedPositions = new Set(['BEATERS', 'CHASERS']);
	
	// One-off activity state
	let oneOffName = 'Quick Activity';
	
	function close() {
		show = false;
		// Reset all states
		activeTab = 'drill';
		drillSearchQuery = '';
		drillSearchResults = [];
		formationSearchQuery = '';
		formationSearchResults = [];
		parallelActivities = { BEATERS: null, CHASERS: null, SEEKERS: null };
		selectedPositions = new Set(['BEATERS', 'CHASERS']);
		oneOffName = 'Quick Activity';
		dispatch('close');
	}
	
	// Drill search
	async function searchDrills(query) {
		if (!query || query.trim() === '') {
			drillSearchResults = [];
			return;
		}
		
		try {
			drillSearchResults = await apiFetch(`/api/drills/search?query=${encodeURIComponent(query)}`);
		} catch (error) {
			console.error('Error searching drills:', error);
			drillSearchResults = [];
			toast.push(`Search failed: ${error.message}`, { theme: { '--toastBackground': 'red' } });
		}
	}
	
	// Formation search
	async function searchFormations(query) {
		if (!query || query.trim() === '') {
			formationSearchResults = [];
			return;
		}
		
		try {
			let url = `/api/formations/search?query=${encodeURIComponent(query)}`;
			if (formationType !== 'all') {
				url += `&type=${formationType}`;
			}
			formationSearchResults = await apiFetch(url);
		} catch (error) {
			console.error('Error searching formations:', error);
			formationSearchResults = [];
			toast.push(`Search failed: ${error.message}`, { theme: { '--toastBackground': 'red' } });
		}
	}
	
	// Parallel activity drill search
	async function searchParallelDrill(position, query) {
		if (!query || query.trim() === '') {
			return;
		}
		
		try {
			const results = await apiFetch(`/api/drills/search?query=${encodeURIComponent(query)}&position=${position.toLowerCase()}`);
			if (results.length > 0) {
				parallelActivities[position] = results[0];
			}
		} catch (error) {
			console.error('Error searching drills:', error);
			toast.push(`Search failed: ${error.message}`, { theme: { '--toastBackground': 'red' } });
		}
	}
	
	// Handlers
	function handleAddDrill(drill) {
		if (!selectedSectionId) {
			toast.push('No section selected', { theme: { '--toastBackground': 'red' } });
			return;
		}
		
		dispatch('addDrill', { drill, sectionId: selectedSectionId });
		close();
	}
	
	function handleAddFormation(formation) {
		if (!selectedSectionId) {
			toast.push('No section selected', { theme: { '--toastBackground': 'red' } });
			return;
		}
		
		dispatch('addFormation', { formation, sectionId: selectedSectionId });
		close();
	}
	
	function handleAddParallelActivities() {
		if (!selectedSectionId) {
			toast.push('No section selected', { theme: { '--toastBackground': 'red' } });
			return;
		}
		
		// Filter to only selected positions with drills
		const activities = {};
		selectedPositions.forEach(pos => {
			if (parallelActivities[pos]) {
				activities[pos] = parallelActivities[pos];
			}
		});
		
		if (Object.keys(activities).length < 2) {
			toast.push('Select drills for at least 2 positions', { theme: { '--toastBackground': 'red' } });
			return;
		}
		
		dispatch('addParallelActivities', { activities, sectionId: selectedSectionId });
		close();
	}
	
	function handleAddBreak() {
		if (!selectedSectionId) {
			toast.push('No section selected', { theme: { '--toastBackground': 'red' } });
			return;
		}
		
		dispatch('addBreak', { sectionId: selectedSectionId });
		close();
	}
	
	function handleAddOneOff() {
		if (!selectedSectionId || !oneOffName.trim()) {
			toast.push('Enter activity name', { theme: { '--toastBackground': 'red' } });
			return;
		}
		
		dispatch('addOneOff', { name: oneOffName.trim(), sectionId: selectedSectionId });
		close();
	}
	
	function togglePosition(position) {
		if (selectedPositions.has(position)) {
			selectedPositions.delete(position);
		} else {
			selectedPositions.add(position);
		}
		selectedPositions = new Set(selectedPositions); // Trigger reactivity
	}
	
	function clearParallelDrill(position) {
		parallelActivities[position] = null;
		parallelActivities = { ...parallelActivities }; // Trigger reactivity
	}
</script>

{#if show}
       <div class="modal-backdrop" on:click={close}>
               <div class="modal-content" on:click|stopPropagation use:focusTrap tabindex="0">
			<div class="modal-header">
				<h2 class="modal-title">Add to Practice Plan</h2>
				<button class="close-button" on:click={close}>×</button>
			</div>
			
			<!-- Tabs -->
			<div class="tabs">
				<button 
					class="tab" 
					class:active={activeTab === 'drill'}
					on:click={() => activeTab = 'drill'}
				>
					Drill
				</button>
				<button 
					class="tab" 
					class:active={activeTab === 'formation'}
					on:click={() => activeTab = 'formation'}
				>
					Formation
				</button>
				<button 
					class="tab" 
					class:active={activeTab === 'parallel'}
					on:click={() => activeTab = 'parallel'}
				>
					Parallel Activities
				</button>
				<button 
					class="tab" 
					class:active={activeTab === 'break'}
					on:click={() => activeTab = 'break'}
				>
					Break/Activity
				</button>
			</div>
			
			<div class="modal-body">
				<!-- Drill Tab -->
				{#if activeTab === 'drill'}
                                       <div class="search-section">
                                               <label for="drill-search" class="sr-only">Search drills</label>
                                               <input
                                                       id="drill-search"
                                                       type="text"
                                                       placeholder="Search drills..."
                                                       bind:value={drillSearchQuery}
                                                       on:input={() => searchDrills(drillSearchQuery)}
                                                       class="search-input"
                                               />
						
						<div class="search-results">
							{#each drillSearchResults as drill}
								<div class="result-item" on:click={() => handleAddDrill(drill)}>
									<div class="result-name">{drill.name}</div>
									<div class="result-details">
										{drill.skill_level?.join(', ')} • {drill.suggested_length_min}-{drill.suggested_length_max} min
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
				
				<!-- Formation Tab -->
				{#if activeTab === 'formation'}
					<div class="search-section">
						<div class="formation-filters">
							<select bind:value={formationType} on:change={() => searchFormations(formationSearchQuery)} class="filter-select">
								<option value="all">All Formations</option>
								<option value="offensive">Offensive</option>
								<option value="defensive">Defensive</option>
							</select>
						</div>
						
                                               <label for="formation-search" class="sr-only">Search formations</label>
                                               <input
                                                       id="formation-search"
                                                       type="text"
                                                       placeholder="Search formations..."
                                                       bind:value={formationSearchQuery}
                                                       on:input={() => searchFormations(formationSearchQuery)}
                                                       class="search-input"
                                               />
						
						<div class="search-results">
							{#each formationSearchResults as formation}
								<div class="result-item" on:click={() => handleAddFormation(formation)}>
									<div class="result-name">{formation.name}</div>
									<div class="result-details">
										{formation.formation_type || 'Tactical'} Formation
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
				
				<!-- Parallel Activities Tab -->
				{#if activeTab === 'parallel'}
					<div class="parallel-section">
						<p class="help-text">Create parallel activities for different position groups</p>
						
						<div class="position-selector">
							{#each ['BEATERS', 'CHASERS', 'SEEKERS'] as position}
								<label class="position-checkbox">
									<input
										type="checkbox"
										checked={selectedPositions.has(position)}
										on:change={() => togglePosition(position)}
									/>
									{position}
								</label>
							{/each}
						</div>
						
						<div class="position-drills">
							{#each ['BEATERS', 'CHASERS', 'SEEKERS'] as position}
								{#if selectedPositions.has(position)}
									<div class="position-drill-row">
										<span class="position-label">{position}:</span>
										{#if parallelActivities[position]}
											<div class="selected-drill">
												{parallelActivities[position].name}
												<button class="clear-btn" on:click={() => clearParallelDrill(position)}>×</button>
											</div>
										{:else}
                                                                               <input
                                                                               type="text"
                                                                               aria-label={`Search drill for ${position}`}
                                                                               placeholder="Search drill..."
                                                                               on:blur={(e) => searchParallelDrill(position, e.target.value)}
                                                                               class="position-search"
                                                                               />
										{/if}
									</div>
								{/if}
							{/each}
						</div>
						
						<button 
							class="add-button"
							on:click={handleAddParallelActivities}
							disabled={Object.values(parallelActivities).filter(Boolean).length < 2}
						>
							Add Parallel Activities
						</button>
					</div>
				{/if}
				
				<!-- Break/Activity Tab -->
				{#if activeTab === 'break'}
					<div class="break-section">
						<button class="break-button" on:click={handleAddBreak}>
							Add 10 Minute Break
						</button>
						
						<div class="divider">OR</div>
						
						<div class="one-off-section">
							<label>Quick Activity Name:</label>
							<input
								type="text"
								bind:value={oneOffName}
								placeholder="Activity name..."
								class="one-off-input"
							/>
							<button class="add-button" on:click={handleAddOneOff}>
								Add Activity
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}
	
	.modal-content {
		background: white;
		border-radius: 0.5rem;
		width: 90%;
		max-width: 600px;
		max-height: 80vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
	
	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid #e5e7eb;
	}
	
	.modal-title {
		font-size: 1.25rem;
		font-weight: 600;
	}
	
	.close-button {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #6b7280;
	}
	
	.tabs {
		display: flex;
		border-bottom: 1px solid #e5e7eb;
		background: #f9fafb;
	}
	
	.tab {
		flex: 1;
		padding: 0.75rem;
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		cursor: pointer;
		font-weight: 500;
		color: #6b7280;
		transition: all 0.2s;
	}
	
	.tab:hover {
		color: #374151;
	}
	
	.tab.active {
		color: #3b82f6;
		border-bottom-color: #3b82f6;
	}
	
	.modal-body {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
	}
	
	.search-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.search-input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 1rem;
	}
	
	.search-results {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 300px;
		overflow-y: auto;
	}
	
	.result-item {
		padding: 0.75rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.result-item:hover {
		background: #f3f4f6;
		border-color: #3b82f6;
	}
	
	.result-name {
		font-weight: 500;
		margin-bottom: 0.25rem;
	}
	
	.result-details {
		font-size: 0.875rem;
		color: #6b7280;
	}
	
	.formation-filters {
		margin-bottom: 0.5rem;
	}
	
	.filter-select {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		background: white;
	}
	
	.parallel-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.help-text {
		color: #6b7280;
		font-size: 0.875rem;
	}
	
	.position-selector {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
	}
	
	.position-checkbox {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}
	
	.position-drills {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.position-drill-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.position-label {
		font-weight: 500;
		min-width: 100px;
	}
	
	.position-search {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
	}
	
	.selected-drill {
		flex: 1;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
		background: #f3f4f6;
		border-radius: 0.375rem;
	}
	
	.clear-btn {
		background: none;
		border: none;
		font-size: 1.25rem;
		cursor: pointer;
		color: #6b7280;
	}
	
	.break-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;
		padding: 2rem;
	}
	
	.break-button {
		padding: 1rem 2rem;
		background: #10b981;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.break-button:hover {
		background: #059669;
	}
	
	.divider {
		color: #6b7280;
		font-weight: 500;
		margin: 1rem 0;
	}
	
	.one-off-section {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.one-off-input {
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
	}
	
	.add-button {
		padding: 0.5rem 1rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.add-button:hover:not(:disabled) {
		background: #2563eb;
	}
	
	.add-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>