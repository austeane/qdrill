import { writable, derived, get } from 'svelte/store';
import { practicePlanBasicInfoSchema } from '$lib/validation/practicePlanSchema';

// Basic info store
export const basicInfo = writable({
    name: '',
    description: '',
    participants: '',
    phaseOfSeason: null, // Use null for optional select
    practiceGoals: [''],
    // totalTime: 120, // Removed as not part of basic info schema/final plan
    // skillLevel: '', // Removed as not part of basic info schema/final plan
    visibility: 'public',
    isEditableByOthers: false // Default to false for privacy
});

// Timeline store for section arrangement
export const timeline = writable({
    sections: [], // This timeline.sections array still needs to sync with sectionsStore in the component
    totalTime: 0
});

// // Removed sections writable store
// export const sections = writable([]);

// Current step tracking
export const currentStep = writable(1);
export const maxSteps = 5;

// Draft saving functionality
export const draftId = writable(null);
export const lastSaved = writable(null);

// Validation store - will hold Zod flattened field errors
export const validationErrors = writable({});

// Add a new store to track if form has been submitted/interacted with
export const formInteracted = writable(false);

// Helper function to validate the basic info step
export function validateBasicInfo() {
    const info = get(basicInfo);
    const result = practicePlanBasicInfoSchema.safeParse(info);

    if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        validationErrors.set(errors);
        console.warn('[Wizard Validation Warn] Basic info validation failed:', errors);
        return false;
    } else {
        validationErrors.set({});
        return true;
    }
}

// Helper functions
export function initializeWizard() {
    basicInfo.set({
        name: '',
        description: '',
        participants: '',
        phaseOfSeason: null,
        practiceGoals: [''],
        visibility: 'public',
        isEditableByOthers: false
    });
    // sections.set([]); // Removed initialization of wizard sections
    timeline.set({ sections: [], totalTime: 0 });
    currentStep.set(1);
    draftId.set(null);
    lastSaved.set(null);
    validationErrors.set({});
    formInteracted.set(false);
}

// Derived store for overall wizard state
export const wizardState = derived(
    // Removed sections from derived dependencies
    [basicInfo, timeline, currentStep, validationErrors],
    ([$basicInfo, $timeline, $currentStep, $validationErrors]) => ({
        basicInfo: $basicInfo,
        // sections: $sections, // Removed sections from derived state
        timeline: $timeline,
        currentStep: $currentStep,
        validationErrors: $validationErrors,
        isComplete: $currentStep === maxSteps
    })
);

// Auto-save functionality
let autoSaveTimeout;
export function scheduleAutoSave() {
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(async () => {
        // Get current state, excluding the removed sections store
        const state = {
            basicInfo: get(basicInfo),
            timeline: get(timeline),
            currentStep: get(currentStep),
            draftId: get(draftId)
            // validationErrors: get(validationErrors) // Avoid saving validation errors
        };
        try {
            // Create FormData and append the stringified state
            const formData = new FormData();
            formData.append('data', JSON.stringify(state));

            const response = await fetch('/practice-plans/wizard?/saveDraft', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const data = await response.json();
                draftId.set(data.id);
                lastSaved.set(new Date());
            }
        } catch (error) {
            console.error('Failed to auto-save wizard state:', error);
        }
    }, 5000);
}

// Navigation guards - Update to use validateBasicInfo
export function canProceedToNextStep($wizardState) {
    switch ($wizardState.currentStep) {
        case 1: // Basic Info
            // Trigger validation check before proceeding
            return validateBasicInfo();
        case 2: // Section Selection (Now 'Sections')
            // No longer validating sections length here, as it's managed by sectionsStore.
            return true; // Allow proceeding
        case 3: // Timeline Arrangement
             // Timeline syncs with sectionsStore, so basic check is sufficient.
             // Complex validation (e.g., duration) might happen in the component.
            return true; // Allow proceeding
        case 4: // Drill Selection (Now 'Drills')
            // Step for adding drills - relies on sectionsStore structure.
            return true; // Allow proceeding
        case 5: // Overview
            return true; // Allow proceeding to final review
        default:
            return true;
    }
} 