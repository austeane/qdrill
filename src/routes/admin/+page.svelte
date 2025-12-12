<script>
	import { toast } from '@zerodevx/svelte-toast';
	import ExcalidrawRenderer from '$lib/components/ExcalidrawRenderer.svelte';
	import { apiFetch } from '$lib/utils/apiFetch.js';

	let isMigrating = false;
	let migrationResult = null;
	let testError = null;

	async function migrateDiagrams() {
		if (
			!confirm(
				'Are you sure you want to migrate all diagrams from Fabric.js to Excalidraw? This action cannot be undone.'
			)
		) {
			return;
		}

		isMigrating = true;
		migrationResult = null;
		try {
			const result = await apiFetch('/api/drills/migrate-diagrams', {
				method: 'POST'
			});

			if (result.success) {
				toast.push('Migration completed successfully!', {
					theme: {
						'--toastBackground': '#10B981',
						'--toastColor': 'white'
					}
				});
				migrationResult = result;
			} else {
				throw new Error(result.error || 'Migration indicated failure despite OK status.');
			}
		} catch (error) {
			console.error('Migration error:', error);
			toast.push(`Migration failed: ${error.message}`, {
				theme: {
					'--toastBackground': '#EF4444',
					'--toastColor': 'white'
				}
			});
			migrationResult = { error: error.message };
		} finally {
			isMigrating = false;
		}
	}

	async function testMigration() {
		migrationResult = null;
		testError = null;
		try {
			const drills = await apiFetch('/api/drills');

			const testDrill = drills.find(
				(drill) => drill.diagrams?.length > 0 && typeof drill.diagrams[0] === 'object'
			);

			if (!testDrill) {
				toast.push('No drills with Fabric.js diagrams found for testing', {
					theme: {
						'--toastBackground': '#F59E0B',
						'--toastColor': 'white'
					}
				});
				return;
			}

			const migratedDiagram = await convertSingleDiagram(testDrill.diagrams[0]);

			migrationResult = {
				testDrill: {
					id: testDrill.id,
					name: testDrill.name,
					originalDiagram: testDrill.diagrams[0],
					migratedDiagram: migratedDiagram
				}
			};
			toast.push('Test conversion successful. Check results below.', {
				theme: { '--toastBackground': '#3B82F6', '--toastColor': 'white' }
			});
		} catch (error) {
			console.error('Test migration error:', error);
			toast.push(`Test failed: ${error.message}`, {
				theme: {
					'--toastBackground': '#EF4444',
					'--toastColor': 'white'
				}
			});
			testError = error.message;
		}
	}

	async function convertSingleDiagram(diagram) {
		const result = await apiFetch('/api/drills/test-migration', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ diagram })
		});
		return result;
	}
</script>

<svelte:head>
	<title>Admin - Diagram Migration</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold mb-8">Admin Dashboard</h1>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
		<a href="/admin/users" class="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
			<h2 class="text-xl font-semibold mb-2">User Management</h2>
			<p class="text-gray-600">Manage user roles and permissions</p>
		</a>
		<div class="bg-white shadow rounded-lg p-6">
			<h2 class="text-xl font-semibold mb-2">Diagram Migration</h2>
			<p class="text-gray-600">Migrate diagrams from Fabric.js to Excalidraw</p>
		</div>
	</div>

	<h2 class="text-2xl font-bold mb-4">Diagram Migration</h2>

	<div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
		<div class="flex">
			<div class="flex-shrink-0">
				<svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
					<path
						fill-rule="evenodd"
						d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
			<div class="ml-3">
				<p class="text-sm text-yellow-700">
					This page is only accessible in development mode. The migration will convert all Fabric.js
					diagrams to Excalidraw format.
				</p>
			</div>
		</div>
	</div>

	<div class="space-y-6">
		<div class="bg-white shadow rounded-lg p-6">
			<h2 class="text-xl font-semibold mb-4">Test Migration</h2>
			<p class="mb-4 text-gray-600">
				Test the migration with a single diagram before running it on all diagrams.
			</p>
			<button
				on:click={testMigration}
				class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
			>
				Test Migration
			</button>
			{#if testError}
				<p class="mt-4 text-red-600">Error: {testError}</p>
			{/if}
		</div>

		<div class="bg-white shadow rounded-lg p-6">
			<h2 class="text-xl font-semibold mb-4">Run Full Migration</h2>
			<p class="mb-4 text-gray-600">
				This will migrate all diagrams in the database from Fabric.js to Excalidraw format. Make
				sure to backup your database before proceeding.
			</p>
			<button
				on:click={migrateDiagrams}
				disabled={isMigrating}
				class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
			>
				{isMigrating ? 'Migrating...' : 'Run Migration'}
			</button>
		</div>

		{#if migrationResult}
			<div class="bg-white shadow rounded-lg p-6">
				<h2 class="text-xl font-semibold mb-4">Migration Result</h2>
				{#if migrationResult.error}
					<p class="text-red-600">Migration failed: {migrationResult.error}</p>
				{:else if migrationResult.testDrill}
					<div class="space-y-4">
						<h3 class="text-lg font-medium">
							Test Results for Drill: {migrationResult.testDrill.name} (ID: {migrationResult
								.testDrill.id})
						</h3>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<h4 class="font-medium mb-2">Original (Fabric.js JSON)</h4>
								<pre class="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-xs">
                                    {JSON.stringify(
										migrationResult.testDrill.originalDiagram,
										null,
										2
									)}
                                </pre>
							</div>
							<div>
								<h4 class="font-medium mb-2">Migrated (Excalidraw)</h4>
								{#if migrationResult.testDrill.migratedDiagram?.elements}
									<div class="border rounded p-2 h-96">
										<ExcalidrawRenderer
											sceneData={{
												elements: migrationResult.testDrill.migratedDiagram.elements,
												appState: migrationResult.testDrill.migratedDiagram.appState
											}}
										/>
									</div>
									<details class="mt-2">
										<summary class="cursor-pointer text-sm text-gray-600"
											>Show Excalidraw JSON</summary
										>
										<pre class="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-xs mt-2">
                                            {JSON.stringify(
												migrationResult.testDrill.migratedDiagram,
												null,
												2
											)}
                                        </pre>
									</details>
								{:else}
									<p class="text-orange-600">No Excalidraw elements generated.</p>
									<pre class="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-xs mt-2">
                                        {JSON.stringify(
											migrationResult.testDrill.migratedDiagram,
											null,
											2
										)}
                                     </pre>
								{/if}
							</div>
						</div>
					</div>
				{:else if migrationResult.success !== undefined}
					<h3 class="text-lg font-medium">Full Migration Summary</h3>
					<pre class="bg-gray-100 p-4 rounded overflow-auto">
                        {JSON.stringify(migrationResult, null, 2)}
                     </pre>
					{#if migrationResult.errors && migrationResult.errors.length > 0}
						<h4 class="font-medium mt-4 text-red-600">Migration Errors:</h4>
						<ul class="list-disc list-inside text-red-600 text-sm">
							{#each migrationResult.errors as errorDetail (errorDetail.drillId)}
								<li>Drill ID {errorDetail.drillId}: {errorDetail.error}</li>
							{/each}
						</ul>
					{/if}
				{:else}
					<p class="text-gray-600">Unexpected migration result format.</p>
					<pre class="bg-gray-100 p-4 rounded overflow-auto">
                        {JSON.stringify(migrationResult, null, 2)}
                    </pre>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	pre {
		white-space: pre-wrap;
		word-wrap: break-word;
	}
</style>
