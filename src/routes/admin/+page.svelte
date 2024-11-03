<script>
    import { toast } from '@zerodevx/svelte-toast';
    
    let isMigrating = false;
    let migrationResult = null;

    async function migrateDiagrams() {
        if (!confirm('Are you sure you want to migrate all diagrams from Fabric.js to Excalidraw? This action cannot be undone.')) {
            return;
        }

        isMigrating = true;
        try {
            const response = await fetch('/api/drills/migrate-diagrams', { 
                method: 'POST'
            });
            const result = await response.json();
            
            if (result.success) {
                toast.push('Migration completed successfully!', {
                    theme: {
                        '--toastBackground': '#10B981',
                        '--toastColor': 'white'
                    }
                });
            } else {
                throw new Error(result.error || 'Migration failed');
            }
            
            migrationResult = result;
        } catch (error) {
            console.error('Migration error:', error);
            toast.push(`Migration failed: ${error.message}`, {
                theme: {
                    '--toastBackground': '#EF4444',
                    '--toastColor': 'white'
                }
            });
        } finally {
            isMigrating = false;
        }
    }

    async function testMigration() {
        try {
            const response = await fetch('/api/drills');
            const drills = await response.json();
            
            // Find first drill with diagrams
            const testDrill = drills.find(drill => drill.diagrams?.length > 0);
            
            if (!testDrill) {
                toast.push('No drills with diagrams found for testing', {
                    theme: {
                        '--toastBackground': '#EF4444',
                        '--toastColor': 'white'
                    }
                });
                return;
            }

            // Show the before/after comparison
            migrationResult = {
                testDrill: {
                    id: testDrill.id,
                    name: testDrill.name,
                    originalDiagram: testDrill.diagrams[0],
                    migratedDiagram: await convertSingleDiagram(testDrill.diagrams[0])
                }
            };
        } catch (error) {
            console.error('Test migration error:', error);
            toast.push(`Test failed: ${error.message}`, {
                theme: {
                    '--toastBackground': '#EF4444',
                    '--toastColor': 'white'
                }
            });
        }
    }

    async function convertSingleDiagram(diagram) {
        const response = await fetch('/api/drills/test-migration', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ diagram })
        });
        return response.json();
    }
</script>

<svelte:head>
    <title>Admin - Diagram Migration</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">Admin - Diagram Migration</h1>
    
    <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
        <div class="flex">
            <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
            </div>
            <div class="ml-3">
                <p class="text-sm text-yellow-700">
                    This page is only accessible in development mode. The migration will convert all Fabric.js diagrams to Excalidraw format.
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
        </div>

        <div class="bg-white shadow rounded-lg p-6">
            <h2 class="text-xl font-semibold mb-4">Run Full Migration</h2>
            <p class="mb-4 text-gray-600">
                This will migrate all diagrams in the database from Fabric.js to Excalidraw format.
                Make sure to backup your database before proceeding.
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
                {#if migrationResult.testDrill}
                    <div class="space-y-4">
                        <h3 class="text-lg font-medium">Test Results for: {migrationResult.testDrill.name}</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <h4 class="font-medium mb-2">Original (Fabric.js)</h4>
                                <pre class="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                                    {JSON.stringify(migrationResult.testDrill.originalDiagram, null, 2)}
                                </pre>
                            </div>
                            <div>
                                <h4 class="font-medium mb-2">Migrated (Excalidraw)</h4>
                                <pre class="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                                    {JSON.stringify(migrationResult.testDrill.migratedDiagram, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>
                {:else}
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