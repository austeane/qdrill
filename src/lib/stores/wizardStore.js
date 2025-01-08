import { writable, derived, get } from 'svelte/store';

// Basic info store
export const basicInfo = writable({
    name: '',
    description: '',
    participants: '',
    phaseOfSeason: '',
    practiceGoals: [''],
    totalTime: 120, // Default 2 hours in minutes
    skillLevel: '',
    visibility: 'public',
    isEditableByOthers: true
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

// Validation store
export const validationErrors = writable({});

// Add a new store to track if form has been submitted/interacted with
export const formInteracted = writable(false);

// Helper functions
export function initializeWizard() {
    basicInfo.set({
        name: '',
        participants: '',
        phaseOfSeason: '',
        practiceGoals: [''],
        totalTime: 120,
        skillLevel: ''
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

// Navigation guards
export function canProceedToNextStep($wizardState) {
    switch ($wizardState.currentStep) {
        case 1: // Basic Info
            return $wizardState.basicInfo.name && 
                   $wizardState.basicInfo.participants && 
                   $wizardState.basicInfo.totalTime > 0;
        case 2: // Section Selection
            return $wizardState.sections.length > 0;
        case 3: // Timeline Arrangement
            return $wizardState.timeline.sections.length === $wizardState.sections.length;
        case 4: // Drill Selection
            return $wizardState.timeline.sections.every(section => 
                section.drills && section.drills.length > 0);
        default:
            return true;
    }
} 