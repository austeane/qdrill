<script>
	import { onMount, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authClient } from '$lib/auth-client';
	import { toast } from '@zerodevx/svelte-toast';
	import { apiFetch } from '$lib/utils/apiFetch.js';

	// Component Props
	let {
		drill = {},
		allSkills = [],
		allDrillNames = [],
		prefilledName = null,
		practicePlanId = null,
		practicePlanItemId = null,
		parentId = null
	} = $props();

	// Initialize stores based on props
	let name = $state('');
	let brief_description = $state('');
	let detailed_description = $state('');
	let skill_level = $state([]);
	let complexity = $state('');
	let suggested_length = $state('');
	let number_of_people_min = $state('');
	let number_of_people_max = $state('');
	let selectedSkills = $state([]);
	let newSkill = $state('');
	let skillSearchTerm = $state('');
	let positions_focused_on = $state([]);
	let video_link = $state('');
	let images = $state([]);
	let diagrams = $state([]);
	let drill_type = $state([]);
	let is_editable_by_others = $state(false);
	let visibility = $state('public');

	let errors = $state({});
	let numberWarnings = $state({});
	let _mounted = false;
	let _diagramKey = $state(0);
	let fileInput = $state(null);
	let showSkillsModal = $state(false);
	let modalSkillSearchTerm = $state('');
	let isSubmitting = $state(false);

	let isVariation = $state(false);
	let parentDrillId = $state(null);

	function getInitialDiagrams(sourceDrill) {
		if (Array.isArray(sourceDrill?.diagrams) && sourceDrill.diagrams.length > 0) {
			return sourceDrill.diagrams;
		}

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

	function getInitialImages(sourceDrill) {
		return (
			sourceDrill?.images?.map((image, index) => ({
				id: `image-${index}`,
				file: image
			})) ?? []
		);
	}

	let lastHydratedKey = null;
	$effect(() => {
		const drillId = drill?.id ?? null;
		const key = JSON.stringify({
			drillId,
			parentId: parentId ?? null,
			prefilledName: prefilledName ?? null
		});

		if (key === lastHydratedKey) return;
		lastHydratedKey = key;

		name = prefilledName || drill?.name || '';
		brief_description = drill?.brief_description ?? '';
		detailed_description = drill?.detailed_description ?? '';
		skill_level = drill?.skill_level ?? [];
		complexity = (drill?.complexity ?? '').toLowerCase();
		suggested_length = drill?.suggested_length ?? '';
		number_of_people_min = drill?.number_of_people_min ?? '';
		number_of_people_max = drill?.number_of_people_max ?? '';
		selectedSkills = drill?.skills_focused_on ?? [];
		positions_focused_on = drill?.positions_focused_on ?? [];
		video_link = drill?.video_link ?? '';
		images = getInitialImages(drill);
		diagrams = getInitialDiagrams(drill);
		drill_type = drill?.drill_type ?? [];
		is_editable_by_others = drill?.is_editable_by_others ?? false;
		visibility = drill?.visibility ?? 'public';

		isVariation = !!drill?.parent_drill_id || !!parentId;
		parentDrillId = drill?.parent_drill_id ?? (parentId ? parseInt(parentId, 10) : null);
	});

	// Clear validation errors reactively when field values change
	$effect(() => {
		const next = { ...errors };
		let changed = false;

		if (drill_type.length > 0 && next.drill_type) {
			delete next.drill_type;
			changed = true;
		}
		if (skill_level.length > 0 && next.skill_level) {
			delete next.skill_level;
			changed = true;
		}
		if (positions_focused_on.length > 0 && next.positions_focused_on) {
			delete next.positions_focused_on;
			changed = true;
		}
		if (selectedSkills.length > 0 && next.skills_focused_on) {
			delete next.skills_focused_on;
			changed = true;
		}

		if (changed) errors = next;
	});

	const availableSkills = $derived(
		Array.isArray(allSkills)
			? allSkills.filter((skill) => !selectedSkills.includes(skill.skill))
			: []
	);

	const skillSuggestionsDerived = $derived.by(() => {
		const term = skillSearchTerm.toLowerCase().trim();
		if (!term) return [];
		return availableSkills.filter((skill) => skill.skill.toLowerCase().includes(term)).slice(0, 10);
	});

	const modalSkillSuggestionsDerived = $derived.by(() => {
		const term = modalSkillSearchTerm.toLowerCase().trim();
		if (!term) return availableSkills;
		return availableSkills.filter((skill) => skill.skill.toLowerCase().includes(term)).slice(0, 20);
	});

	// Reactive statement for parent drill options - depends on prop allDrillNames and drill prop
	// Cannot be a derived store used with $ in template as it doesn't derive from stores.
	const parentDrillOptions = $derived(
		Array.isArray(allDrillNames) ? allDrillNames.filter((d) => d.id !== drill?.id) : []
	);

	let diagramRefs = [];

	const drillTypeOptions = [
		'Competitive',
		'Skill-focus',
		'Tactic-focus',
		'Warmup',
		'Conditioning',
		'Cooldown',
		'Contact',
		'Match-like situation'
	];

	let showAddDiagramModal = $state(false);
	let selectedTemplate = $state('blank');

	function addDiagram() {
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
				appState: { viewBackgroundColor: '#ffffff', gridSize: 20, collaborators: [] },
				files: {}
			}
		];
		_diagramKey++;
		showAddDiagramModal = false;
	}

	function _deleteDiagram(index) {
		if (confirm('Are you sure you want to delete this diagram?')) {
			diagrams = diagrams.filter((_, i) => i !== index);
			_diagramKey++;
		}
	}

	function moveDiagram(index, direction) {
		const newIndex = index + direction;
		if (newIndex < 0 || newIndex >= diagrams.length) return;

		const newDiagrams = [...diagrams];
		[newDiagrams[index], newDiagrams[newIndex]] = [newDiagrams[newIndex], newDiagrams[index]];
		diagrams = newDiagrams;
		_diagramKey++;
	}

	function _handleDiagramSave(event, index) {
		const diagramData = event.detail;
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

	function _handleMoveUp(index) {
		moveDiagram(index, -1);
	}
	function _handleMoveDown(index) {
		moveDiagram(index, 1);
	}

	onMount(async () => {
		_mounted = true;

		const pendingData = sessionStorage.getItem('pendingDrillData');
		if (pendingData) {
			const data = JSON.parse(pendingData);
			name = data.name;
			brief_description = data.brief_description;
			detailed_description = data.detailed_description;
			skill_level = data.skill_level;
			complexity = data.complexity;
			suggested_length = data.suggested_length;
			number_of_people_min = data.number_of_people_min;
			number_of_people_max = data.number_of_people_max;
			selectedSkills = data.skills_focused_on;
			positions_focused_on = data.positions_focused_on;
			video_link = data.video_link;
			images = data.images;
			diagrams =
				data.diagrams?.length > 0
					? data.diagrams
					: [
							{
								elements: [],
								appState: { viewBackgroundColor: '#ffffff', gridSize: 20, collaborators: [] },
								files: {}
							}
						];
			drill_type = data.drill_type;
			is_editable_by_others = data.is_editable_by_others;
			visibility = data.visibility;
			isVariation = !!data.parent_drill_id;
			if (data.parent_drill_id) {
				parentDrillId = data.parent_drill_id;
			}
			sessionStorage.removeItem('pendingDrillData');
			await tick();
			_diagramKey++;
		}
	});

	// Helper function to parse "min-max minutes" string
	function parseLengthRange(rangeString) {
		if (!rangeString) return null;
		const match = rangeString.match(/^(\d+)-(\d+)\s+minutes$/);
		if (match && match.length === 3) {
			return {
				min: parseInt(match[1], 10),
				max: parseInt(match[2], 10)
			};
		}
		// Handle potential other formats or return null/error if needed
		console.warn('Could not parse suggested length range:', rangeString);
		return null;
	}

	function handleSkillInput() {
		skillSearchTerm = newSkill;
	}

	async function addSkill() {
		const rawSkill = newSkill.trim();
		if (!rawSkill) return;

		const skillToAdd = rawSkill
			.toLowerCase()
			.split(' ')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');

		if (selectedSkills.some((s) => s.toLowerCase() === skillToAdd.toLowerCase())) {
			toast.push('This skill is already added');
			return;
		}

		selectedSkills = [...selectedSkills, skillToAdd];
		newSkill = '';
		skillSearchTerm = '';

		try {
			const _addedSkill = await apiFetch('/api/skills', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ skill: skillToAdd })
			});

			toast.push('Skill added successfully');
		} catch (error) {
			console.error('Error adding skill:', error);
			toast.push(`Failed to add skill: ${error.message}`, {
				theme: { '--toastBackground': '#F56565', '--toastColor': 'white' }
			});
			selectedSkills = selectedSkills.filter((s) => s !== skillToAdd);
		}
	}

	function handleSkillKeydown(event) {
		if (event.key === 'Enter') {
			event.preventDefault();
			const skillToAdd = newSkill.trim();
			const firstSuggestion = skillSuggestionsDerived[0];

			if (firstSuggestion) {
				selectSkill(firstSuggestion);
			} else if (skillToAdd) {
				addSkill();
			}
		}
	}

	function selectSkill(skill) {
		const skillText = skill.skill || skill;
		if (!selectedSkills.includes(skillText)) {
			selectedSkills = [...selectedSkills, skillText];
			newSkill = '';
			skillSearchTerm = '';
		}
	}

	function handleModalSkillInput() {
		// keep handler for compatibility with existing markup (bind:value already updates state)
		modalSkillSearchTerm = modalSkillSearchTerm;
	}

	function openSkillsModal() {
		showSkillsModal = true;
		modalSkillSearchTerm = '';
	}

	function closeSkillsModal() {
		showSkillsModal = false;
	}

	function selectSkillFromModal(skill) {
		selectSkill(skill);
	}

	function validateNumber(value, field) {
		if (value === '') {
			if (field === 'number_of_people_max') {
				numberWarnings[field] = '';
				return;
			}
			numberWarnings[field] = '';
			return;
		}
		if (!Number.isInteger(Number(value))) {
			numberWarnings[field] = 'Please enter a whole number';
		} else {
			numberWarnings[field] = '';
		}
	}

	function validateForm() {
		let newErrors = {};
		if (!name) newErrors.name = 'Name is required';
		if (!brief_description) newErrors.brief_description = 'Brief description is required';
		if (skill_level.length === 0) newErrors.skill_level = 'Skill level is required';
		if (!suggested_length) newErrors.suggested_length = 'Suggested length of time is required';
		if (selectedSkills.length === 0) newErrors.skills_focused_on = 'Skills focused on are required';
		if (positions_focused_on.length === 0)
			newErrors.positions_focused_on = 'Positions focused on are required';
		if (drill_type.length === 0) newErrors.drill_type = 'At least one drill type is required';

		if (number_of_people_min && !Number.isInteger(Number(number_of_people_min))) {
			newErrors.number_of_people_min = 'Min number of people must be a whole number';
		}
		if (
			number_of_people_max !== '' &&
			number_of_people_max !== '0' &&
			!Number.isInteger(Number(number_of_people_max))
		) {
			newErrors.number_of_people_max = 'Max number of people must be a whole number';
		}

		if (isVariation && !parentDrillId) {
			newErrors.parentDrillId = 'Parent drill is required for variations';
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	async function handleSubmit() {
		if (isSubmitting) return; // Prevent double submission

		diagramRefs.forEach((ref) => {
			if (ref && typeof ref.saveDiagram === 'function') {
				ref.saveDiagram();
			}
		});

		await tick();

		if (!validateForm()) return;

		isSubmitting = true;

		if (!page.data.session && visibility !== 'public') {
			const confirmed = confirm(
				`Log in to create a ${visibility} drill.\n\n` +
					'Click OK to log in with Google\n' +
					'Click Cancel to create as public instead'
			);

			if (confirmed) {
				const formData = {
					name: name,
					brief_description: brief_description,
					detailed_description: detailed_description,
					skill_level: skill_level,
					complexity: complexity ? complexity.charAt(0).toUpperCase() + complexity.slice(1) : null,
					suggested_length: parseLengthRange(suggested_length),
					number_of_people_min: number_of_people_min,
					number_of_people_max: number_of_people_max,
					skills_focused_on: selectedSkills,
					positions_focused_on: positions_focused_on,
					video_link: video_link,
					diagrams: diagrams,
					drill_type: drill_type,
					visibility: visibility,
					is_editable_by_others: is_editable_by_others,
					parent_drill_id: isVariation ? parentDrillId : null
				};
				console.log('Storing pending drill data:', formData);
				sessionStorage.setItem('pendingDrillData', JSON.stringify(formData));
				isSubmitting = false;
				await authClient.signIn.social({ provider: 'google' });
				return;
			} else {
				visibility = 'public';
			}
		}

		if (!page.data.session) {
			is_editable_by_others = true;
		}

		try {
			const method = drill.id ? 'PUT' : 'POST';
			const url = drill.id ? `/api/drills/${drill.id}` : '/api/drills';

			const maxParticipants =
				number_of_people_max === '' || number_of_people_max === '0'
					? null
					: Number(number_of_people_max);
			const minParticipants = number_of_people_min === '' ? null : Number(number_of_people_min);

			const requestBody = {
				id: drill.id,
				name: name,
				brief_description: brief_description,
				detailed_description: detailed_description,
				skill_level: skill_level,
				complexity: complexity ? complexity.charAt(0).toUpperCase() + complexity.slice(1) : null,
				suggested_length: parseLengthRange(suggested_length),
				number_of_people: {
					min: minParticipants,
					max: maxParticipants
				},
				skills_focused_on: selectedSkills,
				positions_focused_on: positions_focused_on,
				video_link: video_link || null,
				diagrams: diagrams,
				drill_type: drill_type,
				is_editable_by_others: is_editable_by_others,
				visibility: visibility,
				parent_drill_id: isVariation ? parentDrillId : null
			};

			const { diagrams: _, ...loggableData } = requestBody;
			console.log('Submitting drill data:', loggableData);

			const result = await apiFetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(requestBody)
			});

			// If this drill creation came from a practice plan item, link it
			if (practicePlanId && practicePlanItemId && result.id) {
				try {
					await apiFetch('/api/practice-plans/link-item-to-drill', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							practicePlanId: practicePlanId,
							practicePlanItemId: practicePlanItemId,
							newDrillId: result.id
						})
					});
					toast.push('Activity in practice plan updated successfully!');
					// Navigate back to the practice plan
					isSubmitting = false;
					goto(`/practice-plans/${practicePlanId}`);
					return; // Important to return here to skip default navigation
				} catch (linkError) {
					console.error('Error linking drill to practice plan item:', linkError);
					toast.push(
						`Drill created, but failed to update practice plan: ${linkError.message}. Please update manually.`,
						{
							theme: { '--toastBackground': '#F56565', '--toastColor': 'white' },
							duration: 5000
						}
					);
					// Fall through to navigate to the drill page if linking fails but drill was created
				}
			}

			if (!page.data.session) {
				const confirmed = confirm(
					'Would you like to log in so that you can own this drill?\n\n' +
						'Click OK to log in with Google\n' +
						'Click Cancel to continue without logging in'
				);

				if (confirmed) {
					console.log('Setting drillToAssociate:', result.id);
					sessionStorage.setItem(
						'drillToAssociate',
						JSON.stringify({ id: result.id, claimToken: result.claimToken })
					);
					isSubmitting = false;
					await authClient.signIn.social({ provider: 'google' });
					return;
				}
			}

			toast.push('Drill saved successfully!');
			isSubmitting = false;
			goto(`/drills/${result.id}`);
		} catch (error) {
			console.error('Error submitting drill:', error);
			isSubmitting = false;

			// Build detailed error message
			let errorMessage = 'Error saving drill: ';
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

	function toggleSelection(store, value) {
		const index = store.indexOf(value);
		if (index === -1) {
			store.push(value);
			return;
		}
		store.splice(index, 1);
	}

	function _handleFileSelect(e) {
		const files = Array.from(e.target.files);
		images = [
			...images,
			...files.map((file, index) => ({
				id: `new-image-${Date.now()}-${index}`,
				file: file
			}))
		];
	}

	function _removeImage(id) {
		images = images.filter((img) => img.id !== id);
	}

	function _handleDndConsider(e) {
		images = e.detail.items;
	}

	function _handleDndFinalize(e) {
		images = e.detail.items;
	}

	function _triggerFileInput() {
		fileInput.click();
	}

	function _duplicateDiagram(index) {
		if (diagramRefs[index]) {
			diagramRefs[index].saveDiagram();
		}

		const diagramToDuplicate = diagrams[index];
		const duplicatedDiagram = {
			elements:
				diagramToDuplicate.elements?.map((element) => ({
					...element,
					id: crypto.randomUUID(),
					groupIds: element.groupIds?.map(() => crypto.randomUUID())
				})) || [],
			appState: { ...diagramToDuplicate.appState },
			files: { ...diagramToDuplicate.files }
		};

		const newDiagrams = [...diagrams];
		newDiagrams.splice(index + 1, 0, duplicatedDiagram);
		diagrams = newDiagrams;

		_diagramKey++;
	}

	function _handleDescriptionChange(e) {
		detailed_description = e.detail.content;
	}

	function removeSkill(skillToRemove) {
		selectedSkills = selectedSkills.filter((skill) => skill !== skillToRemove);
	}

	let Editor = $state(null);
	onMount(async () => {
		try {
			const module = await import('@tinymce/tinymce-svelte');
			Editor = module.Editor ?? module.default;
		} catch (error) {
			console.error('Error loading TinyMCE:', error);
		}
	});
</script>

<svelte:head>
	<title>{drill?.id ? 'Edit Drill' : 'Create Drill'}</title>
	<meta name="description" content={drill?.id ? 'Edit an existing drill' : 'Create a new drill'} />
</svelte:head>

<section class="container mx-auto md:p-4 h-screen overflow-y-auto">
	<div class="flex flex-col h-full">
		<div class="flex flex-col md:flex-row flex-grow gap-4 transition-all duration-300 ease-in-out">
			<div class="flex-1 min-w-0 md:p-4 border rounded-md transition-all duration-300 ease-in-out">
				<div class="max-w-lg mx-auto md:mx-auto p-4 md:p-0">
					<h1 class="text-2xl font-bold text-center mb-6">
						{drill?.id ? 'Edit Drill' : 'Create Drill'}
					</h1>
					<form
						onsubmit={(e) => {
							e.preventDefault();
							handleSubmit();
						}}
						class="space-y-6"
						method="POST"
					>
						<div class="flex flex-col">
							<label for="name" class="mb-1 text-sm font-medium text-gray-700">Drill Name:</label>
							<input
								id="name"
								bind:value={name}
								class="p-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 {errors.name
									? 'border-red-500 focus:ring-red-500'
									: ''}"
								placeholder="Enter drill name"
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
							<p class="text-xs text-gray-500 mb-1">For display on the drill listings page</p>
							<input
								id="brief_description"
								bind:value={brief_description}
								class="p-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 {errors.brief_description
									? 'border-red-500 focus:ring-red-500'
									: ''}"
								placeholder="Brief summary of the drill"
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
							<p class="text-xs text-gray-500 mb-1">
								As much detail as would be needed for a new coach to teach this drill. May include,
								setup, focus areas, adaptations, or credit for the creator of the drill.
							</p>

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
									class="p-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="Provide detailed instructions..."
									rows="8"
								></textarea>
							{/if}
						</div>

						<div class="flex flex-col">
							<span id="drill-type-label" class="mb-1 text-sm font-medium text-gray-700"
								>Drill Type:</span
							>
							<p class="text-xs text-gray-500 mb-1">Select one or more drill types.</p>
							<div role="group" aria-labelledby="drill-type-label" class="flex flex-wrap gap-2">
								{#each drillTypeOptions as option (option)}
									<div class="flex items-center">
										<button
											type="button"
											class="px-3 py-1 rounded-full border border-gray-300"
											class:selected={drill_type.includes(option)}
											onclick={() => toggleSelection(drill_type, option)}
										>
											{option}
										</button>
									</div>
								{/each}
							</div>
							{#if errors.drill_type}
								<p class="text-red-500 text-sm mt-1 flex items-center gap-1">
									<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
										<path
											fill-rule="evenodd"
											d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
											clip-rule="evenodd"
										/>
									</svg>
									{errors.drill_type}
								</p>
							{/if}
						</div>

						<div class="flex flex-col">
							<label for="skill_level" class="mb-1 text-sm font-medium text-gray-700"
								>Appropriate for Skill Level:</label
							>
							<p class="text-xs text-gray-500 mb-1">
								When done correctly, what levels of player would benefit from this drill.
							</p>

							<div class="flex flex-wrap gap-2">
								<button
									type="button"
									class="px-3 py-1 rounded-full border border-gray-300 skill-level-button"
									class:selected={skill_level.includes('New to Sport')}
									onclick={() => toggleSelection(skill_level, 'New to Sport')}>New to Sport</button
								>
								<button
									type="button"
									class="px-3 py-1 rounded-full border border-gray-300 skill-level-button"
									class:selected={skill_level.includes('Beginner')}
									onclick={() => toggleSelection(skill_level, 'Beginner')}>Beginner</button
								>
								<button
									type="button"
									class="px-3 py-1 rounded-full border border-gray-300 skill-level-button"
									class:selected={skill_level.includes('Intermediate')}
									onclick={() => toggleSelection(skill_level, 'Intermediate')}>Intermediate</button
								>
								<button
									type="button"
									class="px-3 py-1 rounded-full border border-gray-300 skill-level-button"
									class:selected={skill_level.includes('Advanced')}
									onclick={() => toggleSelection(skill_level, 'Advanced')}>Advanced</button
								>
								<button
									type="button"
									class="px-3 py-1 rounded-full border border-gray-300 skill-level-button"
									class:selected={skill_level.includes('Expert')}
									onclick={() => toggleSelection(skill_level, 'Expert')}>Expert</button
								>
							</div>
						</div>
						{#if errors.skill_level}
							<p class="text-red-500 text-sm mt-1 flex items-center gap-1">
								<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
										clip-rule="evenodd"
									/>
								</svg>
								{errors.skill_level}
							</p>
						{/if}

						<div class="flex flex-col">
							<label for="complexity" class="mb-1 text-sm font-medium text-gray-700"
								>Complexity:</label
							>
							<p class="text-xs text-gray-500 mb-1">
								How difficult is it to get a team to do this drill correctly for the first time.
							</p>
							<select
								id="complexity"
								bind:value={complexity}
								class="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="">Select Complexity</option>
								<option value="low">Low</option>
								<option value="medium">Medium</option>
								<option value="high">High</option>
							</select>
						</div>

						<div class="flex flex-col">
							<label for="suggested_length" class="mb-1 text-sm font-medium text-gray-700"
								>Suggested Length of Time:</label
							>
							<select
								id="suggested_length"
								bind:value={suggested_length}
								class="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="">Select Length of Time</option>
								<option value="0-5 minutes">0-5 minutes</option>
								<option value="5-15 minutes">5-15 minutes</option>
								<option value="15-30 minutes">15-30 minutes</option>
								<option value="30-60 minutes">30-60 minutes</option>
							</select>
						</div>
						{#if errors.suggested_length}
							<p class="text-red-500 text-sm mt-1 flex items-center gap-1">
								<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
										clip-rule="evenodd"
									/>
								</svg>
								{errors.suggested_length}
							</p>
						{/if}

						<div class="flex flex-col">
							<label for="number_of_people_min" class="mb-1 text-sm font-medium text-gray-700"
								>Min Number of People:</label
							>
							<input
								id="number_of_people_min"
								type="number"
								bind:value={number_of_people_min}
								oninput={() => validateNumber(number_of_people_min, 'number_of_people_min')}
								class="p-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 {errors.number_of_people_min
									? 'border-red-500 focus:ring-red-500'
									: ''}"
								placeholder="e.g., 4"
								min="1"
							/>
						</div>
						{#if numberWarnings.number_of_people_min}
							<p class="text-yellow-500 text-sm mt-1">{numberWarnings.number_of_people_min}</p>
						{/if}
						{#if errors.number_of_people_min}
							<p class="text-red-500 text-sm mt-1">{errors.number_of_people_min}</p>
						{/if}

						<div class="flex flex-col">
							<label for="number_of_people_max" class="mb-1 text-sm font-medium text-gray-700"
								>Max Number of People:</label
							>
							<p class="text-xs text-gray-500 mb-1">Leave empty or enter 0 for "Any"</p>
							<input
								id="number_of_people_max"
								type="number"
								bind:value={number_of_people_max}
								oninput={() => validateNumber(number_of_people_max, 'number_of_people_max')}
								class="p-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 {errors.number_of_people_max
									? 'border-red-500 focus:ring-red-500'
									: ''}"
								placeholder="e.g., 20 (or leave empty)"
								min="0"
							/>
						</div>
						{#if numberWarnings.number_of_people_max}
							<p class="text-yellow-500 text-sm mt-1">{numberWarnings.number_of_people_max}</p>
						{/if}
						{#if errors.number_of_people_max}
							<p class="text-red-500 text-sm mt-1">{errors.number_of_people_max}</p>
						{/if}

						<div class="flex flex-col">
							<label for="skills_focused_on" class="mb-1 text-sm font-medium text-gray-700"
								>Skills Focused On:</label
							>
							<div class="flex flex-wrap gap-2 mb-2">
								{#each selectedSkills as skill (skill)}
									<span
										class="flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
									>
										{skill}
										<button
											type="button"
											onclick={() => removeSkill(skill)}
											class="ml-1 text-blue-600 hover:text-blue-800">&times;</button
										>
									</span>
								{/each}
							</div>
							<div class="flex items-center space-x-2 relative">
								<input
									type="text"
									bind:value={newSkill}
									oninput={handleSkillInput}
									onkeydown={handleSkillKeydown}
									placeholder="Type to add or find skill..."
									class="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
								<button
									type="button"
									onclick={addSkill}
									disabled={!newSkill.trim()}
									class="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
									>Add</button
								>
								<button
									type="button"
									onclick={openSkillsModal}
									class="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
									>Browse</button
								>

								{#if skillSuggestionsDerived.length > 0}
									<div
										class="absolute top-full left-0 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto"
									>
										{#each skillSuggestionsDerived as suggestion (suggestion.skill)}
											<button
												type="button"
												class="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
												onclick={() => selectSkill(suggestion)}
											>
												{suggestion.skill}
											</button>
										{/each}
									</div>
								{/if}
							</div>
							{#if errors.skills_focused_on}
								<p class="text-red-500 text-sm mt-1">{errors.skills_focused_on}</p>
							{/if}
						</div>

						<div class="flex flex-col">
							<label for="positions_focused_on" class="mb-1 text-sm font-medium text-gray-700"
								>Positions Focused On:</label
							>
							<div class="flex flex-wrap gap-2">
								<button
									type="button"
									class="px-3 py-1 rounded-full border border-gray-300 position-button"
									class:selected={positions_focused_on.includes('Beater')}
									onclick={() => toggleSelection(positions_focused_on, 'Beater')}>Beater</button
								>
								<button
									type="button"
									class="px-3 py-1 rounded-full border border-gray-300 position-button"
									class:selected={positions_focused_on.includes('Chaser')}
									onclick={() => toggleSelection(positions_focused_on, 'Chaser')}>Chaser</button
								>
								<button
									type="button"
									class="px-3 py-1 rounded-full border border-gray-300 position-button"
									class:selected={positions_focused_on.includes('Keeper')}
									onclick={() => toggleSelection(positions_focused_on, 'Keeper')}>Keeper</button
								>
								<button
									type="button"
									class="px-3 py-1 rounded-full border border-gray-300 position-button"
									class:selected={positions_focused_on.includes('Seeker')}
									onclick={() => toggleSelection(positions_focused_on, 'Seeker')}>Seeker</button
								>
							</div>
						</div>
						{#if errors.positions_focused_on}
							<p class="text-red-500 text-sm mt-1 flex items-center gap-1">
								<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
										clip-rule="evenodd"
									/>
								</svg>
								{errors.positions_focused_on}
							</p>
						{/if}

						<div class="flex flex-col">
							<label for="video_link" class="mb-1 text-sm font-medium text-gray-700"
								>Video Link:</label
							>
							<input
								id="video_link"
								type="url"
								bind:value={video_link}
								class="p-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
								placeholder="https://youtube.com/watch?v=..."
							/>
						</div>

						<div class="flex flex-col">
							<label for="visibility-select" class="mb-1 text-sm font-medium text-gray-700"
								>Visibility:</label
							>
							<select
								id="visibility-select"
								bind:value={visibility}
								class="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								disabled={!page.data.session}
								title={!page.data.session ? 'Log in to create private or unlisted drills' : ''}
							>
								<option value="public">Public</option>
								<option value="unlisted">Unlisted</option>
								<option value="private">Private</option>
							</select>
							{#if !page.data.session}
								<p class="text-sm text-gray-500 mt-1">
									Log in to create private or unlisted drills
								</p>
							{/if}
						</div>

						<div class="flex items-center">
							<input
								id="editable_by_others"
								type="checkbox"
								bind:checked={is_editable_by_others}
								disabled={!page.data.session}
								class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
							/>
							<label for="editable_by_others" class="ml-2 block text-sm text-gray-700">
								Allow others to edit this drill
								{#if !page.data.session}
									<span class="text-gray-500">(required for anonymous submissions)</span>
								{/if}
							</label>
						</div>

						<div class="mb-4">
							<label class="flex items-center">
								<input
									type="checkbox"
									bind:checked={isVariation}
									class="form-checkbox h-4 w-4 text-blue-600"
								/>
								<span class="ml-2">This is a variation of another drill</span>
							</label>
						</div>

						{#if isVariation}
							<div class="mb-4">
								<label for="parentDrill" class="block text-sm font-medium text-gray-700"
									>Parent Drill</label
								>
								<select
									id="parentDrill"
									bind:value={parentDrillId}
									class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
								>
									<option value="">Select a parent drill</option>
									{#each parentDrillOptions as parent (parent.id)}
										<option value={parent.id}>{parent.name}</option>
									{/each}
								</select>
								{#if errors.parentDrillId}
									<p class="text-red-500 text-sm mt-1">{errors.parentDrillId}</p>
								{/if}
							</div>
						{/if}
					</form>
				</div>
			</div>

			<div class="w-full md:w-64 flex-shrink-0 md:p-4">
				<div class="sticky top-4 bg-white p-4 border rounded-md shadow-sm">
					<h2 class="text-lg font-semibold mb-4">Actions</h2>
					<button
						type="submit"
						onclick={handleSubmit}
						disabled={isSubmitting}
						class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mb-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
					>
						{#if isSubmitting}
							<div
								class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
							></div>
							{drill?.id ? 'Saving...' : 'Creating...'}
						{:else}
							{drill?.id ? 'Save Changes' : 'Create Drill'}
						{/if}
					</button>
					<button
						type="button"
						onclick={() => goto(drill?.id ? `/drills/${drill.id}` : '/drills')}
						class="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	</div>

	{#if showSkillsModal}
		<div class="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
			<div class="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
				<div class="p-4 border-b flex justify-between items-center">
					<h3 class="text-lg font-medium">Browse Skills</h3>
					<button onclick={closeSkillsModal} class="text-gray-500 hover:text-gray-700"
						>&times;</button
					>
				</div>
				<div class="p-4">
					<input
						type="text"
						placeholder="Search skills..."
						bind:value={modalSkillSearchTerm}
						oninput={handleModalSkillInput}
						class="w-full p-2 border border-gray-300 rounded-md mb-4"
					/>
				</div>
				<div class="overflow-y-auto flex-grow p-4 pt-0">
					<div class="flex flex-wrap gap-2">
						{#each modalSkillSuggestionsDerived as skill (skill.skill)}
							<button
								onclick={() => selectSkillFromModal(skill)}
								class="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full hover:bg-blue-200"
							>
								{skill.skill} ({skill.usage_count})
							</button>
						{/each}
						{#if modalSkillSuggestionsDerived.length === 0}
							<p class="text-gray-500 text-sm w-full text-center">No matching skills found.</p>
						{/if}
					</div>
				</div>
				<div class="p-4 border-t text-right">
					<button
						onclick={closeSkillsModal}
						class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">Close</button
					>
				</div>
			</div>
		</div>
	{/if}

	{#if showAddDiagramModal}
		<div class="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
			<div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
				<h3 class="text-lg font-medium mb-4">Add Diagram</h3>
				<div class="mb-4">
					<label for="template-select" class="block text-sm font-medium text-gray-700 mb-1"
						>Choose a template:</label
					>
					<select
						id="template-select"
						bind:value={selectedTemplate}
						class="w-full p-2 border border-gray-300 rounded-md"
					>
						<option value="blank">Blank Canvas</option>
						<option value="fullCourt">Full Court</option>
						<option value="halfCourt">Half Court</option>
					</select>
				</div>
				<div class="flex justify-end space-x-3">
					<button
						onclick={() => (showAddDiagramModal = false)}
						class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">Cancel</button
					>
					<button
						onclick={addDiagram}
						class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">Add</button
					>
				</div>
			</div>
		</div>
	{/if}
</section>

<style>
	::-webkit-scrollbar {
		width: 8px;
	}

	::-webkit-scrollbar-thumb {
		background-color: rgba(100, 100, 100, 0.5);
		border-radius: 4px;
	}

	::-webkit-scrollbar-thumb:hover {
		background-color: rgba(100, 100, 100, 0.7);
	}

	.selected {
		background-color: #3b82f6;
		color: white;
	}

	:global(.dndzone.dropzone) {
		background-color: rgba(59, 130, 246, 0.1);
	}

	textarea {
		min-height: 60px;
		resize: vertical;
		max-height: 300px;
		transition: height 0.1s ease-out;
	}

	:global(.toastContainer) {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 9999;
	}
</style>
