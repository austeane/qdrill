<script>
    import { currentStep, maxSteps, wizardState } from '$lib/stores/wizardStore';
    import { validationErrors } from '$lib/stores/wizardValidation';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';

    // Step definitions
    const steps = [
        { id: 1, name: 'Basic Info', path: '/practice-plans/wizard/basic-info' },
        { id: 2, name: 'Section Selection', path: '/practice-plans/wizard/sections' },
        { id: 3, name: 'Timeline', path: '/practice-plans/wizard/timeline' },
        { id: 4, name: 'Drill Selection', path: '/practice-plans/wizard/drills' },
        { id: 5, name: 'Overview', path: '/practice-plans/wizard/overview' }
    ];

    // Navigation functions
    function goToStep(step) {
        // TODO: Re-implement navigation logic based on validation
        // if (canNavigateToStep(step, $wizardState)) { 
            currentStep.set(step);
            goto(steps[step - 1].path);
        // }
    }

    function nextStep() {
        // TODO: Re-implement navigation logic based on validation
        // if ($currentStep < maxSteps && canProceedToNextStep($wizardState)) {
        if ($currentStep < maxSteps) { // Temporary: Allow next without validation
            goToStep($currentStep + 1);
        }
    }

    function prevStep() {
        if ($currentStep > 1) {
            goToStep($currentStep - 1);
        }
    }
</script>

<div class="wizard-container min-h-screen bg-gray-50">
    <!-- Progress Bar -->
    <div class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="py-4">
                <nav class="flex items-center justify-between">
                    <ol class="flex items-center w-full">
                        {#each steps as step}
                            <li class="relative flex-1 {step.id === $currentStep ? 'text-blue-600' : 'text-gray-500'}">
                                <div class="flex items-center">
                                    <span class="flex-shrink-0">
                                        <span class="w-8 h-8 flex items-center justify-center rounded-full
                                            {step.id < $currentStep ? 'bg-blue-600 text-white' : 
                                             step.id === $currentStep ? 'border-2 border-blue-600 text-blue-600' : 
                                             'border-2 border-gray-300 text-gray-500'}">
                                            {step.id}
                                        </span>
                                    </span>
                                    <span class="ml-4 text-sm font-medium">{step.name}</span>
                                </div>
                                {#if step.id !== steps.length}
                                    <div class="hidden sm:block absolute top-0 right-0 h-full w-5">
                                        <div class="h-0.5 relative top-4 bg-gray-300"></div>
                                    </div>
                                {/if}
                            </li>
                        {/each}
                    </ol>
                </nav>
            </div>
        </div>
    </div>

    <!-- Content Area -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="bg-white shadow sm:rounded-lg">
            <div class="px-4 py-5 sm:p-6">
                <slot></slot>
            </div>
        </div>
    </main>

    <!-- Navigation Buttons -->
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div class="flex justify-between">
                <button
                    class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50
                           {$currentStep === 1 ? 'opacity-50 cursor-not-allowed' : ''}"
                    on:click={prevStep}
                    disabled={$currentStep === 1}
                >
                    Previous
                </button>
                
                <button
                    class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    on:click={nextStep}
                    disabled={/* TODO: Add back validation check */ $currentStep === maxSteps}
                >
                    Next
                </button>
            </div>
        </div>
    </div>
</div>

<style>
    .wizard-container {
        padding-bottom: 5rem; /* Space for fixed navigation */
    }

    :global(.feedback-button) {
        bottom: 5rem !important; /* Move feedback button above the wizard navigation */
    }
</style> 