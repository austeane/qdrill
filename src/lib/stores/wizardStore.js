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

// Section store
export const sections = writable([]);

// Timeline store for section arrangement
export const timeline = writable({
    sections: [],
    totalTime: 0
});

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
    sections.set([]);
    timeline.set({ sections: [], totalTime: 0 });
    currentStep.set(1);
    draftId.set(null);
    lastSaved.set(null);
    validationErrors.set({});
    formInteracted.set(false);
}

// Derived store for overall wizard state
export const wizardState = derived(
    [basicInfo, sections, timeline, currentStep, validationErrors],
    ([$basicInfo, $sections, $timeline, $currentStep, $validationErrors]) => ({
        basicInfo: $basicInfo,
        sections: $sections,
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
        const state = get(wizardState);
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
        case 2: // Section Selection
            // TODO: Add validation for section selection if needed
            return $wizardState.sections.length > 0;
        case 3: // Timeline Arrangement
             // TODO: Add validation for timeline if needed
            return $wizardState.timeline.sections.length === $wizardState.sections.length;
        case 4: // Drill Selection
            // TODO: Add validation for drill selection if needed
            return $wizardState.timeline.sections.every(section => 
                section.items && section.items.length > 0); // Assuming items instead of drills now
        default:
            return true;
    }
} 