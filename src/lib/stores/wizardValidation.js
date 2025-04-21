import { writable } from 'svelte/store';
import { basicInfo, sections, timeline } from './wizardStore';

export const validationErrors = writable({});

// Validation functions for each step - REMOVE ALL THESE
/*
export function validateBasicInfo($basicInfo) {
    const errors = {};
    
    if (!$basicInfo.name?.trim()) {
        errors.name = 'Practice plan name is required';
    }
    
    if (!$basicInfo.description?.trim()) {
        errors.description = 'Practice plan description is required';
    }
    
    if (!$basicInfo.participants) {
        errors.participants = 'Number of participants is required';
    } else if (isNaN($basicInfo.participants) || $basicInfo.participants <= 0) {
        errors.participants = 'Number of participants must be a positive number';
    }
    
    if (!$basicInfo.totalTime || $basicInfo.totalTime <= 0) {
        errors.totalTime = 'Total practice time must be greater than 0 minutes';
    }
    
    if (!$basicInfo.skillLevel) {
        errors.skillLevel = 'Skill level is required';
    }
    
    return errors;
}

export function validateSections($sections) {
    const errors = {};
    
    if (!$sections.length) {
        errors.sections = 'At least one section is required';
    }
    
    $sections.forEach((section, index) => {
        if (!section.name?.trim()) {
            errors[`section_${index}`] = 'Section name is required';
        }
    });
    
    return errors;
}

export function validateTimeline($timeline, $sections) {
    const errors = {};
    
    if ($timeline.totalTime <= 0) {
        errors.totalTime = 'Total timeline duration must be greater than 0';
    }
    
    if ($timeline.sections.length !== $sections.length) {
        errors.sections = 'All sections must be arranged in the timeline';
    }
    
    let totalSectionTime = 0;
    $timeline.sections.forEach((section, index) => {
        if (!section.duration || section.duration <= 0) {
            errors[`section_${index}`] = 'Section duration must be greater than 0';
        }
        totalSectionTime += section.duration || 0;
    });
    
    if (totalSectionTime > $timeline.totalTime) {
        errors.totalTime = 'Total section time exceeds practice duration';
    }
    
    return errors;
}

export function validateDrills($timeline) {
    const errors = {};
    
    $timeline.sections.forEach((section, index) => {
        if (!section.drills?.length) {
            errors[`section_${index}`] = 'At least one drill is required per section';
        }
        
        let sectionTime = 0;
        section.drills?.forEach((drill, drillIndex) => {
            if (!drill.duration || drill.duration <= 0) {
                errors[`drill_${index}_${drillIndex}`] = 'Drill duration must be greater than 0';
            }
            sectionTime += drill.duration || 0;
        });
        
        if (sectionTime > section.duration) {
            errors[`section_${index}_time`] = 'Total drill time exceeds section duration';
        }
    });
    
    return errors;
}
*/

// Helper function to check if a step has validation errors - REMOVE OR MODIFY
// This will need to be adapted if using Zod Schemas later
/*
function hasStepErrors(step, errors) {
    switch (step) {
        case 1:
            return Object.keys(errors.basicInfo || {}).length > 0;
        case 2:
            return Object.keys(errors.sections || {}).length > 0;
        case 3:
            return Object.keys(errors.timeline || {}).length > 0;
        case 4:
            return Object.keys(errors.drills || {}).length > 0;
        default:
            return false;
    }
}
*/

// Check if we can navigate to a specific step - REMOVE OR MODIFY
// This depends on hasStepErrors
/*
export function canNavigateToStep(targetStep, wizardState) {
    // Can always go back
    if (targetStep <= wizardState.currentStep) {
        return true;
    }

    // Can only proceed one step at a time
    if (targetStep > wizardState.currentStep + 1) {
        return false;
    }

    // Check if current step is valid before allowing navigation
    return !hasStepErrors(wizardState.currentStep, wizardState.validationErrors);
}
*/

// Check if we can proceed to the next step - REMOVE OR MODIFY
// This depends on hasStepErrors
/*
export function canProceedToNextStep(wizardState) {
    return !hasStepErrors(wizardState.currentStep, wizardState.validationErrors);
}
*/

// Subscribe to store changes and validate - REMOVE SUBSCRIPTIONS
/*
let unsubscribeBasicInfo = basicInfo.subscribe($basicInfo => {
    // const errors = validateBasicInfo($basicInfo);
    // validationErrors.update(current => ({ ...current, basicInfo: errors }));
    validationErrors.update(current => ({ ...current, basicInfo: {} })); // Clear errors for now
});

let unsubscribeSections = sections.subscribe($sections => {
    // const errors = validateSections($sections);
    // validationErrors.update(current => ({ ...current, sections: errors }));
    validationErrors.update(current => ({ ...current, sections: {} })); // Clear errors for now
});

// Track the latest values from both stores
let latestTimeline;
let latestSections;

// Single subscription to timeline
let unsubscribeTimeline = timeline.subscribe($timeline => {
    latestTimeline = $timeline;
    if (latestSections) {
        // const timelineErrors = validateTimeline(latestTimeline, latestSections);
        // const drillErrors = validateDrills(latestTimeline);
        validationErrors.update(current => ({ 
            ...current, 
            timeline: {}, // Clear errors for now
            drills: {} // Clear errors for now
        }));
    }
});

// Additional subscription to sections for timeline validation
let unsubscribeTimelineSections = sections.subscribe($sections => {
    latestSections = $sections;
    if (latestTimeline) {
        // const errors = validateTimeline(latestTimeline, latestSections);
        // validationErrors.update(current => ({ ...current, timeline: errors }));
        validationErrors.update(current => ({ ...current, timeline: {} })); // Clear errors for now
    }
});
*/

// Cleanup function - REMOVE SUBSCRIPTION CLEANUP
/*
export function cleanup() {
    // unsubscribeBasicInfo();
    // unsubscribeSections();
    // unsubscribeTimeline();
    // unsubscribeTimelineSections();
}
*/

// Add this new function to check if a field has been touched and has an error - REMOVE OR MODIFY
/*
export function getFieldError(fieldName, touched, validationErrors) {
    // This needs updating for Zod errors structure
    return null; // Placeholder
} 
*/ 