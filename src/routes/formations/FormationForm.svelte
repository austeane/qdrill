<script>
	import { onMount, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import ExcalidrawWrapper from '$lib/components/ExcalidrawWrapper.svelte';
	import { toast } from '@zerodevx/svelte-toast';
	import { authClient } from '$lib/auth-client';
	import { apiFetch } from '$lib/utils/apiFetch.js';
	import { createForm } from 'svelte-forms-lib';

	function createEmptyFormation() {
		return {
			id: null,
			name: '',
			brief_description: '',
			detailed_description: '',
			diagrams: [],
			tags: [],
			is_editable_by_others: false,
			visibility: 'public',
			formation_type: 'offense'
		};
	}

	let { formation = createEmptyFormation() } = $props();

	let name = $state('');
	let brief_description = $state('');
	let detailed_description = $state('');
	let tags = $state([]);
	let newTag = $state('');
	let is_editable_by_others = $state(false);
	let visibility = $state('public');
	let formation_type = $state('offense');
	// Parse diagrams if they come as JSON strings
	const parseDiagrams = (diagramsData) => {
		if (!diagramsData || diagramsData.length === 0) {
			return [
				{
					elements: [],
					appState: {
						viewBackgroundColor: '#ffffff',
						gridSize: 20,
						collaborators: []
					},
					files: {}
				}
			];
		}

		return diagramsData.map((diagram) => {
			if (typeof diagram === 'string') {
				try {
					return JSON.parse(diagram);
				} catch (e) {
					console.error('Error parsing diagram JSON:', e);
					return diagram;
				}
			}
			return diagram;
		});
	};

	let diagrams = $state(parseDiagrams([]));
	let lastHydratedKey = null;
	$effect(() => {
		const key = JSON.stringify({
			id: formation?.id ?? null,
			name: formation?.name ?? ''
		});

		if (key === lastHydratedKey) return;
		lastHydratedKey = key;

		name = formation?.name ?? '';
		brief_description = formation?.brief_description ?? '';
		detailed_description = formation?.detailed_description ?? '';
		tags = formation?.tags ?? [];
		is_editable_by_others = formation?.is_editable_by_others ?? false;
		visibility = formation?.visibility ?? 'public';
		formation_type = formation?.formation_type ?? 'offense';
		diagrams = parseDiagrams(formation?.diagrams);
	});

	let errors = $state({});
	let _mounted = false;
	let diagramKey = $state(0);
	let diagramRefs = [];

	let showAddDiagramModal = $state(false);
	let selectedTemplate = $state('blank');

	// Add a diagram function
	function addDiagram() {
		// Save the current diagram if it exists
		if (diagramRefs.length > 0) {
			const lastDiagramRef = diagramRefs[diagramRefs.length - 1];
			if (lastDiagramRef) {
				lastDiagramRef.saveDiagram();
			}
		}

		diagrams = [
			...diagrams,
			{
				template: selectedTemplate,
				elements: [],
				appState: {
					viewBackgroundColor: '#ffffff',
					gridSize: 20,
					collaborators: []
				},
				files: {}
			}
		];

		diagramKey++;
		showAddDiagramModal = false;
	}

	// Delete a diagram
	function deleteDiagram(index) {
		if (confirm('Are you sure you want to delete this diagram?')) {
			diagrams = diagrams.filter((_, i) => i !== index);
			diagramKey++;
		}
	}

	// Move diagram up or down in the list
	function moveDiagram(index, direction) {
		const newIndex = index + direction;
		if (newIndex < 0 || newIndex >= diagrams.length) return;

		const newDiagrams = [...diagrams];
		[newDiagrams[index], newDiagrams[newIndex]] = [newDiagrams[newIndex], newDiagrams[index]];
		diagrams = newDiagrams;
		diagramKey++;
	}

	// Handle diagram save event
	function handleDiagramSave(diagramData, index) {
		// Ensure proper structure when saving
		const processedData = {
			elements: diagramData.elements || [],
			appState: {
				...(diagramData.appState || {}),
				collaborators: Array.isArray(diagramData.appState?.collaborators)
					? diagramData.appState.collaborators
					: []
			},
			files: diagramData.files || {}
		};

		const newDiagrams = [...diagrams];
		newDiagrams[index] = processedData;
		diagrams = newDiagrams;
	}

	function handleMoveUp(index) {
		moveDiagram(index, -1);
	}

	function handleMoveDown(index) {
		moveDiagram(index, 1);
	}

	// Add a tag to the formation
	function addTag() {
		const tag = newTag.trim().toLowerCase();

		if (!tag) return;

		if (!tags.includes(tag)) {
			tags = [...tags, tag];
			newTag = '';
		}
	}

	// Remove a tag from the formation
	function removeTag(tagToRemove) {
		tags = tags.filter((tag) => tag !== tagToRemove);
	}

	// Handle tag input keypress
	function handleTagKeydown(event) {
		if (event.key === 'Enter') {
			event.preventDefault();
			addTag();
		}
	}

	// Duplicate a diagram
	function duplicateDiagram(index) {
		if (diagramRefs[index]) {
			// Save the current state of the diagram being duplicated
			diagramRefs[index].saveDiagram();
		}

		const diagramToDuplicate = diagrams[index];

		// Create a mapping of old groupIds to new groupIds to maintain group relationships
		const groupIdMap = new Map();

		// Create a deep copy of the diagram, ensuring new IDs for elements
		const duplicatedDiagram = {
			elements:
				diagramToDuplicate.elements?.map((element) => {
					// Create new groupIds mapping if they exist
					let newGroupIds = undefined;
					if (element.groupIds && element.groupIds.length > 0) {
						newGroupIds = element.groupIds.map((groupId) => {
							// If we haven't created a new ID for this group yet, create one
							if (!groupIdMap.has(groupId)) {
								groupIdMap.set(groupId, crypto.randomUUID());
							}
							// Use the consistent new ID for this group
							return groupIdMap.get(groupId);
						});
					}

					return {
						...element,
						id: crypto.randomUUID(), // Generate new IDs for each element
						groupIds: newGroupIds // Use the mapped group IDs to maintain relationships
					};
				}) || [],
			appState: { ...diagramToDuplicate.appState },
			files: { ...diagramToDuplicate.files }
		};

		// Insert the duplicate after the original
		const newDiagrams = [...diagrams];
		newDiagrams.splice(index + 1, 0, duplicatedDiagram);
		diagrams = newDiagrams;

		diagramKey++; // Force re-render of diagrams
	}

	// Editor component (loaded dynamically)
	let Editor = $state(null);

	// Form validation
	function validateForm() {
		let newErrors = {};
		if (!name) newErrors.name = 'Name is required';
		if (!brief_description) newErrors.brief_description = 'Brief description is required';

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	// Use Better Auth session store
	const session = authClient.useSession();
	const isLoggedIn = $derived(!!$session.data?.user);

	const { handleSubmit, updateField } = createForm({
		initialValues: {
			name: '',
			brief_description: '',
			detailed_description: '',
			diagrams: parseDiagrams([]),
			tags: [],
			is_editable_by_others: false,
			visibility: 'public',
			formation_type: 'offense'
		},
		onSubmit: async (_values) => {
			// Trigger saveDiagram on each component to dispatch 'save' events
			diagramRefs.forEach((ref) => {
				if (ref && typeof ref.saveDiagram === 'function') {
					ref.saveDiagram(); // This dispatches the event handled by handleDiagramSave
				}
			});

			// Wait for Svelte store updates triggered by handleDiagramSave to complete
			await tick();

			if (!validateForm()) return;

			// Check login status using reactive variable from Better Auth
			if (!isLoggedIn && visibility !== 'public') {
				const confirmed = confirm(
					`Log in to create a ${visibility} formation.\n\n` +
						'Click OK to log in with Google\n' +
						'Click Cancel to create as public instead'
				);

				if (confirmed) {
					// Store form data in sessionStorage
					const formData = {
						name,
						brief_description,
						detailed_description,
						diagrams,
						tags,
						visibility,
						is_editable_by_others,
						formation_type
					};
					sessionStorage.setItem('pendingFormationData', JSON.stringify(formData));
					try {
						// Use Better Auth sign in
						await authClient.signIn.social({ provider: 'google' });
						// If sign-in is successful, the page will likely reload,
						// and the onMount logic should pick up the pending data.
					} catch (error) {
						console.error('Sign in error:', error);
						toast.push('Sign in failed. Please try again.', {
							theme: { '--toastBackground': '#F56565' }
						});
					}
					return; // Stop submission if redirecting to login
				} else {
					updateField('visibility', 'public');
					visibility = 'public'; // Update local values for this submission
				}
			}

			// If not logged in (after the check), force public/editable
			if (!isLoggedIn) {
				updateField('is_editable_by_others', true);
				is_editable_by_others = true;
			}

			try {
				const method = formation.id ? 'PUT' : 'POST';
				// Always use the /api/formations endpoint for both POST and PUT
				const url = '/api/formations';

				const requestBody = {
					id: formation.id, // The ID is included in the body for PUT requests
					name,
					brief_description,
					detailed_description,
					diagrams,
					tags,
					is_editable_by_others,
					visibility,
					formation_type
				};

				// Log the data being sent, excluding the potentially large diagrams array
				const { diagrams: _, ...loggableData } = requestBody;
				console.log('Submitting formation data:', loggableData);

				const result = await apiFetch(url, {
					method,
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(requestBody)
				});

				// After successful submission for non-logged in users
				if (!isLoggedIn) {
					// Use the reactive boolean here too
					const confirmedAssociate = confirm(
						'Would you like to log in so that you can own this formation?\n\n' +
							'Click OK to log in with Google\n' +
							'Click Cancel to continue without logging in'
					);

					if (confirmedAssociate) {
						sessionStorage.setItem(
							'formationToAssociate',
							JSON.stringify({ id: result.id, claimToken: result.claimToken })
						);
						try {
							// Use Better Auth sign in again
							await authClient.signIn.social({ provider: 'google' });
						} catch (error) {
							console.error('Sign in error during association:', error);
							toast.push(
								'Sign in failed. You can associate this formation later from your profile.',
								{ theme: { '--toastBackground': '#F56565' } }
							);
							// Navigate even if association sign-in fails, to avoid losing the creation
							goto(`/formations/${result.id}`);
						}
						return; // Stop if redirecting to login
					}
				}

				toast.push('Formation saved successfully!');
				goto(`/formations/${result.id}`);
			} catch (error) {
				console.error('Error submitting formation:', error);

				// Build detailed error message
				let errorMessage = 'Error saving formation: ';
				if (error.details) {
					// If we have validation details, format them nicely
					const fieldErrors = [];
					for (const [field, errors] of Object.entries(error.details)) {
						if (Array.isArray(errors)) {
							fieldErrors.push(`${field}: ${errors.join(', ')}`);
						}
					}
					if (fieldErrors.length > 0) {
						errorMessage += fieldErrors.join('; ');
					} else {
						errorMessage += error.message || 'Unknown error occurred';
					}
				} else {
					// Fallback to the basic error message
					errorMessage += error.message || 'Unknown error occurred';
				}

				toast.push(errorMessage, {
					theme: {
						'--toastBackground': '#F56565',
						'--toastColor': 'white'
					}
				});
			}
		}
	});

	// Update visibility and editable status based on login state changes
	$effect(() => {
		if (isLoggedIn) return;

		updateField('visibility', 'public');
		updateField('is_editable_by_others', true);
		visibility = 'public';
		is_editable_by_others = true;
	});

	onMount(() => {
		// Restore form data after login
		const pendingData = sessionStorage.getItem('pendingFormationData');
		if (pendingData) {
			try {
				const data = JSON.parse(pendingData);
				// Restore all the form values
				name = data.name;
				brief_description = data.brief_description;
				detailed_description = data.detailed_description;
				diagrams = parseDiagrams(data.diagrams);
				tags = data.tags;
				is_editable_by_others = data.is_editable_by_others;
				visibility = data.visibility;
				formation_type = data.formation_type || 'offense';
				toast.push('Resuming formation creation...');
			} catch (e) {
				console.error('Error parsing pending formation data:', e);
				toast.push('Could not restore previous form data.', {
					theme: { '--toastBackground': '#F56565' }
				});
			}
			sessionStorage.removeItem('pendingFormationData');
		}

		// Formation association after login is handled centrally in +layout.svelte

		// Load TinyMCE editor component dynamically
		import('@tinymce/tinymce-svelte')
			.then((module) => {
				Editor = module.Editor ?? module.default;
			})
			.catch((error) => {
				console.error('Failed to load TinyMCE Editor:', error);
				toast.push('Error loading text editor.', { theme: { '--toastBackground': '#F56565' } });
			});
	});

	// Update form when formation prop changes
	$effect(() => {
		if (!formation?.id) return;

		name = formation.name ?? '';
		brief_description = formation.brief_description ?? '';
		detailed_description = formation.detailed_description ?? '';
		tags = formation.tags ?? [];
		diagrams = parseDiagrams(formation.diagrams);
		is_editable_by_others = formation.is_editable_by_others ?? false;
		visibility = formation.visibility ?? 'public';
		formation_type = formation.formation_type ?? 'offense';
	});
</script>

<svelte:head>
	<title>{formation.id ? 'Edit Formation' : 'Create Formation'}</title>
	<meta
		name="description"
		content={formation.id ? 'Edit an existing formation' : 'Create a new formation'}
	/>
</svelte:head>

<section class="container mx-auto md:p-4 h-screen overflow-y-auto">
	<div class="flex flex-col h-full">
		<div class="flex flex-col md:flex-row flex-grow gap-4 transition-all duration-300 ease-in-out">
			<!-- Left Column: Form -->
			<div class="flex-1 min-w-0 md:p-4 border rounded-md transition-all duration-300 ease-in-out">
				<div class="max-w-lg mx-auto md:mx-auto p-4 md:p-0">
					<h1 class="text-2xl font-bold text-center mb-6">
						{formation.id ? 'Edit Formation' : 'Create Formation'}
					</h1>
					<form
						onsubmit={(event) => {
							event.preventDefault();
							handleSubmit(event);
						}}
						class="space-y-6"
					>
						<div class="flex flex-col">
							<label for="name" class="mb-1 text-sm font-medium text-gray-700"
								>Formation Name:</label
							>
							<input
								id="name"
								bind:value={name}
								class="p-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 {errors.name
									? 'border-red-500 focus:ring-red-500'
									: ''}"
								placeholder="Enter formation name"
							/>
						</div>
						{#if errors.name}
							<p class="text-red-500 text-sm mt-1 flex items-center gap-1">
								<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
										clip-rule="evenodd"
									/>
								</svg>
								{errors.name}
							</p>
						{/if}

						<div class="flex flex-col">
							<label for="brief_description" class="mb-1 text-sm font-medium text-gray-700"
								>Brief Description:</label
							>
							<p class="text-xs text-gray-500 mb-1">For display on the formation listings page</p>
							<input
								id="brief_description"
								bind:value={brief_description}
								class="p-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 {errors.brief_description
									? 'border-red-500 focus:ring-red-500'
									: ''}"
								placeholder="Brief summary of the formation"
							/>
						</div>
						{#if errors.brief_description}
							<p class="text-red-500 text-sm mt-1 flex items-center gap-1">
								<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
										clip-rule="evenodd"
									/>
								</svg>
								{errors.brief_description}
							</p>
						{/if}

						<div class="flex flex-col">
							<label for="detailed_description" class="mb-1 text-sm font-medium text-gray-700"
								>Detailed Description:</label
							>
							<p class="text-xs text-gray-500 mb-1">Explain the formation in detail</p>

							{#if Editor}
								<div class="min-h-[300px]">
									<Editor
										apiKey={import.meta.env.VITE_TINY_API_KEY}
										bind:value={detailed_description}
										init={{
											height: 300,
											menubar: false,
											plugins: [
												'advlist',
												'autolink',
												'lists',
												'link',
												'charmap',
												'anchor',
												'searchreplace',
												'visualblocks',
												'code',
												'insertdatetime',
												'table',
												'code',
												'help',
												'wordcount'
											],
											toolbar:
												'undo redo | blocks | ' +
												'bold italic | alignleft aligncenter ' +
												'alignright alignjustify | bullist numlist outdent indent | ' +
												'removeformat | help',
											content_style:
												'body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px; }',
											branding: false
										}}
									/>
								</div>
							{:else}
								<textarea
									id="detailed_description"
									bind:value={detailed_description}
									class="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									rows="8"
								></textarea>
							{/if}
						</div>

						<!-- Tags Input -->
						<div class="flex flex-col">
							<label for="tags" class="mb-1 text-sm font-medium text-gray-700">Tags:</label>
							<p class="text-xs text-gray-500 mb-1">
								Add tags to categorize this formation (press Enter to add)
							</p>
							<div class="relative">
								<input
									id="tags"
									bind:value={newTag}
									onkeydown={handleTagKeydown}
									placeholder="Add tags to categorize this formation"
									class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
							</div>

							<!-- Selected tags display -->
							<div class="flex flex-wrap gap-2 mt-2">
								{#each tags as tag (tag)}
									<span
										class="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full flex items-center"
									>
										{tag}
										<button
											type="button"
											class="ml-1 text-blue-600 hover:text-blue-800"
											onclick={() => removeTag(tag)}
										>
											×
										</button>
									</span>
								{/each}
							</div>
						</div>

						<!-- Formation Type Setting -->
						<div class="flex flex-col">
							<span id="formation-type-label" class="mb-1 text-sm font-medium text-gray-700"
								>Formation Type:</span
							>
							<div
								role="radiogroup"
								aria-labelledby="formation-type-label"
								class="flex items-center space-x-4"
							>
								<label class="inline-flex items-center">
									<input
										type="radio"
										bind:group={formation_type}
										value="offense"
										class="form-radio text-blue-600"
									/>
									<span class="ml-2">Offense</span>
								</label>
								<label class="inline-flex items-center">
									<input
										type="radio"
										bind:group={formation_type}
										value="defense"
										class="form-radio text-blue-600"
									/>
									<span class="ml-2">Defense</span>
								</label>
							</div>
						</div>

						<!-- Visibility Setting -->
						<div class="flex flex-col">
							<span id="visibility-label" class="mb-1 text-sm font-medium text-gray-700"
								>Visibility:</span
							>
							<div
								role="radiogroup"
								aria-labelledby="visibility-label"
								class="flex items-center space-x-4"
							>
								<label class="inline-flex items-center">
									<input
										type="radio"
										bind:group={visibility}
										value="public"
										class="form-radio text-blue-600"
									/>
									<span class="ml-2">Public</span>
								</label>
								<label class="inline-flex items-center">
									<input
										type="radio"
										bind:group={visibility}
										value="unlisted"
										class="form-radio text-blue-600"
									/>
									<span class="ml-2">Unlisted</span>
								</label>
								<label class="inline-flex items-center">
									<input
										type="radio"
										bind:group={visibility}
										value="private"
										class="form-radio text-blue-600"
									/>
									<span class="ml-2">Private</span>
								</label>
							</div>
						</div>

						<!-- Editable by Others option -->
						<div class="flex items-center">
							<input
								type="checkbox"
								id="is_editable_by_others"
								bind:checked={is_editable_by_others}
								class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
							/>
							<label for="is_editable_by_others" class="ml-2 text-sm font-medium text-gray-700">
								Allow others to edit this formation
							</label>
						</div>

						<!-- Diagrams Section -->
						<div class="border rounded-md p-4 space-y-4">
							<h2 class="text-lg font-semibold">Diagrams</h2>
							<p class="text-sm text-gray-600">Add diagrams to visualize the formation</p>

							{#each diagrams as diagram, i (i + '-' + diagramKey)}
								<div class="border rounded-md p-4 mt-4">
									<div class="flex justify-between items-center mb-2">
										<h3 class="text-md font-medium">Diagram {i + 1}</h3>
										<div class="flex space-x-2">
											<button
												type="button"
												class="px-2 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
												onclick={() => duplicateDiagram(i)}
											>
												Duplicate
											</button>
											<button
												type="button"
												class="px-2 py-1 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
												onclick={() => handleMoveUp(i)}
												disabled={i === 0}
											>
												↑
											</button>
											<button
												type="button"
												class="px-2 py-1 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
												onclick={() => handleMoveDown(i)}
												disabled={i === diagrams.length - 1}
											>
												↓
											</button>
											<button
												type="button"
												class="px-2 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
												onclick={() => deleteDiagram(i)}
											>
												Delete
											</button>
										</div>
									</div>
									<ExcalidrawWrapper
										data={diagram}
										id={`diagram-${i}`}
										index={i}
										bind:this={diagramRefs[i]}
										onSave={(diagramData) => handleDiagramSave(diagramData, i)}
									/>
								</div>
							{/each}

							<button
								type="button"
								class="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
								onclick={() => {
									showAddDiagramModal = true;
								}}
							>
								Add Diagram
							</button>
						</div>

						<div class="flex justify-end space-x-4 pt-6">
							<button
								type="button"
								class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md"
								onclick={() => goto('/formations')}
							>
								Cancel
							</button>
							<button
								type="submit"
								class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
							>
								{formation.id ? 'Update Formation' : 'Create Formation'}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Add Diagram Modal -->
{#if showAddDiagramModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white p-6 rounded-lg w-96 max-w-md">
			<h2 class="text-xl font-bold mb-4">Add New Diagram</h2>

			<div class="mb-4">
				<span id="template-label" class="block text-sm font-medium text-gray-700 mb-2"
					>Template:</span
				>
				<div role="radiogroup" aria-labelledby="template-label" class="space-y-2">
					<label class="inline-flex items-center">
						<input
							type="radio"
							bind:group={selectedTemplate}
							value="blank"
							class="form-radio text-blue-600"
						/>
						<span class="ml-2">Blank</span>
					</label>
					<label class="inline-flex items-center block">
						<input
							type="radio"
							bind:group={selectedTemplate}
							value="halfCourt"
							class="form-radio text-blue-600"
						/>
						<span class="ml-2">Half Court</span>
					</label>
					<label class="inline-flex items-center block">
						<input
							type="radio"
							bind:group={selectedTemplate}
							value="fullCourt"
							class="form-radio text-blue-600"
						/>
						<span class="ml-2">Full Court</span>
					</label>
				</div>
			</div>

			<div class="flex justify-end space-x-4">
				<button
					type="button"
					class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md"
					onclick={() => {
						showAddDiagramModal = false;
					}}
				>
					Cancel
				</button>
				<button
					type="button"
					class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
					onclick={addDiagram}
				>
					Add
				</button>
			</div>
		</div>
	</div>
{/if}
