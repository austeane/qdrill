# Ticket 007: Practice Plan Wizard UX - ACTIONABLE

## Overview
Improve practice plan creation with clear stepper, validation, autosave, and better keyboard navigation.

## Prerequisites
- [x] Complete Tickets 001-003 (Design System, Components)
- [x] `sveltekit-superforms` and `zod` installed
- [x] Existing wizard at `src/routes/practice-plans/wizard/`

## File Structure
```
src/
├── lib/
│   ├── components/
│   │   └── practice-plans/
│   │       ├── WizardStepper.svelte (NEW)
│   │       ├── WizardFooter.svelte (NEW)
│   │       └── AutosaveIndicator.svelte (NEW)
│   └── schemas/
│       └── practicePlan.ts (NEW)
└── routes/
    └── practice-plans/
        └── wizard/
            ├── +layout.svelte (MODIFY)
            ├── +page.server.js (NEW/MODIFY)
            └── [step pages] (MODIFY)
```

## Implementation Steps

### Step 1: Create Validation Schema (`src/lib/schemas/practicePlan.ts`)

```typescript
import { z } from 'zod';

// Basic Info Schema
export const basicInfoSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  duration: z.number().min(5, 'Duration must be at least 5 minutes').max(480, 'Duration cannot exceed 8 hours'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  positions: z.array(z.string()).min(1, 'Select at least one position'),
  maxPlayers: z.number().min(1).max(100).optional(),
  tags: z.array(z.string()).optional()
});

// Section Schema
export const sectionSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Section name required'),
  description: z.string().optional(),
  duration: z.number().min(1),
  drills: z.array(z.object({
    id: z.string(),
    duration: z.number().min(1),
    order: z.number()
  }))
});

// Timeline Schema
export const timelineSchema = z.object({
  sections: z.array(sectionSchema).min(1, 'At least one section required'),
  parallelGroups: z.array(z.object({
    sectionId: z.string(),
    timelines: z.array(z.object({
      id: z.string(),
      name: z.string(),
      drills: z.array(z.string())
    }))
  })).optional()
});

// Complete Practice Plan Schema
export const practicePlanSchema = z.object({
  basicInfo: basicInfoSchema,
  sections: z.array(sectionSchema),
  timeline: timelineSchema,
  isDraft: z.boolean().default(true),
  autoSaveEnabled: z.boolean().default(true)
});

export type PracticePlan = z.infer<typeof practicePlanSchema>;
export type BasicInfo = z.infer<typeof basicInfoSchema>;
export type Section = z.infer<typeof sectionSchema>;
```

### Step 2: Create Wizard Stepper (`src/lib/components/practice-plans/WizardStepper.svelte`)

```svelte
<script>
  import { CheckCircle, Circle, AlertCircle, ChevronRight } from 'lucide-svelte';
  import { page } from '$app/stores';
  
  export let steps = [
    { id: 'basic-info', label: 'Basic Info', path: '/practice-plans/wizard/basic-info' },
    { id: 'sections', label: 'Sections', path: '/practice-plans/wizard/sections' },
    { id: 'drills', label: 'Add Drills', path: '/practice-plans/wizard/drills' },
    { id: 'timeline', label: 'Timeline', path: '/practice-plans/wizard/timeline' },
    { id: 'overview', label: 'Review', path: '/practice-plans/wizard/overview' }
  ];
  
  export let currentStep = 0;
  export let completedSteps = [];
  export let stepErrors = {};
  
  $: currentPath = $page.url.pathname;
  $: currentStep = steps.findIndex(step => step.path === currentPath);
  
  function getStepStatus(index) {
    if (completedSteps.includes(index)) return 'completed';
    if (stepErrors[steps[index].id]) return 'error';
    if (index === currentStep) return 'current';
    if (index < currentStep) return 'visited';
    return 'pending';
  }
</script>

<nav class="wizard-stepper" aria-label="Progress">
  <ol class="stepper-list">
    {#each steps as step, index}
      {@const status = getStepStatus(index)}
      <li class="stepper-item">
        <a 
          href={step.path}
          class="step-link {status}"
          aria-current={index === currentStep ? 'step' : undefined}
          aria-disabled={index > currentStep && !completedSteps.includes(index - 1)}
        >
          <span class="step-indicator">
            {#if status === 'completed'}
              <CheckCircle size={20} />
            {:else if status === 'error'}
              <AlertCircle size={20} />
            {:else}
              <span class="step-number">{index + 1}</span>
            {/if}
          </span>
          
          <span class="step-content">
            <span class="step-label">{step.label}</span>
            {#if stepErrors[step.id]}
              <span class="step-error">{stepErrors[step.id]}</span>
            {/if}
          </span>
        </a>
        
        {#if index < steps.length - 1}
          <ChevronRight class="step-separator" size={16} />
        {/if}
      </li>
    {/each}
  </ol>
  
  <div class="stepper-progress">
    <div 
      class="progress-bar"
      style="width: {((currentStep + 1) / steps.length) * 100}%"
    />
  </div>
</nav>

<style>
  .wizard-stepper {
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    margin-bottom: var(--space-6);
  }
  
  .stepper-list {
    display: flex;
    align-items: center;
    justify-content: space-between;
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .stepper-item {
    display: flex;
    align-items: center;
    flex: 1;
  }
  
  .step-link {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2);
    border-radius: var(--radius-md);
    text-decoration: none;
    transition: all var(--transition-fast);
    flex: 1;
  }
  
  .step-link:hover:not([aria-disabled="true"]) {
    background: var(--color-bg-subtle);
  }
  
  .step-link[aria-disabled="true"] {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .step-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-full);
    background: var(--color-bg-muted);
    color: var(--color-text-muted);
    font-weight: var(--font-weight-semibold);
  }
  
  .step-link.current .step-indicator {
    background: var(--color-accent-9);
    color: white;
  }
  
  .step-link.completed .step-indicator {
    background: var(--color-success);
    color: white;
  }
  
  .step-link.error .step-indicator {
    background: var(--color-error);
    color: white;
  }
  
  .step-number {
    font-size: var(--font-size-sm);
  }
  
  .step-content {
    display: flex;
    flex-direction: column;
  }
  
  .step-label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }
  
  .step-link.current .step-label {
    color: var(--color-accent-9);
  }
  
  .step-error {
    font-size: var(--font-size-xs);
    color: var(--color-error);
  }
  
  :global(.step-separator) {
    color: var(--color-text-muted);
    margin: 0 var(--space-2);
  }
  
  .stepper-progress {
    height: 4px;
    background: var(--color-bg-muted);
    border-radius: var(--radius-full);
    margin-top: var(--space-4);
    overflow: hidden;
  }
  
  .progress-bar {
    height: 100%;
    background: var(--color-accent-9);
    border-radius: var(--radius-full);
    transition: width var(--transition-base);
  }
  
  @media (max-width: 768px) {
    .stepper-list {
      flex-direction: column;
      align-items: stretch;
    }
    
    .stepper-item {
      margin-bottom: var(--space-2);
    }
    
    :global(.step-separator) {
      display: none;
    }
  }
</style>
```

### Step 3: Create Wizard Footer (`src/lib/components/practice-plans/WizardFooter.svelte`)

```svelte
<script>
  import { ArrowLeft, ArrowRight, Save, Check } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { createEventDispatcher } from 'svelte';
  
  export let canGoBack = false;
  export let canGoNext = true;
  export let isLastStep = false;
  export let loading = false;
  export let isDraft = true;
  
  const dispatch = createEventDispatcher();
  
  function handleKeydown(e) {
    // Alt+Left for back
    if (e.altKey && e.key === 'ArrowLeft' && canGoBack) {
      dispatch('back');
    }
    // Alt+Right for next
    if (e.altKey && e.key === 'ArrowRight' && canGoNext) {
      dispatch('next');
    }
    // Ctrl+S for save draft
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      dispatch('saveDraft');
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<footer class="wizard-footer">
  <div class="footer-left">
    {#if canGoBack}
      <Button 
        variant="ghost" 
        on:click={() => dispatch('back')}
        disabled={loading}
      >
        <ArrowLeft size={16} />
        Back
      </Button>
    {/if}
  </div>
  
  <div class="footer-center">
    <Button 
      variant="secondary"
      on:click={() => dispatch('saveDraft')}
      disabled={loading}
    >
      <Save size={16} />
      Save Draft
    </Button>
    
    <span class="keyboard-hint">
      <kbd>Ctrl</kbd>+<kbd>S</kbd> to save
    </span>
  </div>
  
  <div class="footer-right">
    {#if isLastStep}
      <Button 
        variant="primary"
        size="lg"
        on:click={() => dispatch('complete')}
        disabled={!canGoNext || loading}
        {loading}
      >
        <Check size={16} />
        Complete Plan
      </Button>
    {:else}
      <Button 
        variant="primary"
        on:click={() => dispatch('next')}
        disabled={!canGoNext || loading}
        {loading}
      >
        Next
        <ArrowRight size={16} />
      </Button>
    {/if}
  </div>
</footer>

<style>
  .wizard-footer {
    position: sticky;
    bottom: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-4);
    background: var(--color-surface-1);
    border-top: 1px solid var(--color-border-default);
    margin-top: var(--space-6);
    gap: var(--space-4);
    z-index: 10;
  }
  
  .footer-left,
  .footer-right {
    flex: 1;
    display: flex;
    gap: var(--space-2);
  }
  
  .footer-left {
    justify-content: flex-start;
  }
  
  .footer-right {
    justify-content: flex-end;
  }
  
  .footer-center {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }
  
  .keyboard-hint {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
  
  kbd {
    padding: 0.125rem 0.375rem;
    background: var(--color-surface-3);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    font-family: monospace;
  }
  
  @media (max-width: 768px) {
    .wizard-footer {
      flex-direction: column;
      gap: var(--space-3);
    }
    
    .footer-left,
    .footer-center,
    .footer-right {
      width: 100%;
      justify-content: center;
    }
    
    .keyboard-hint {
      display: none;
    }
  }
</style>
```

### Step 4: Create Autosave Indicator (`src/lib/components/practice-plans/AutosaveIndicator.svelte`)

```svelte
<script>
  import { Cloud, CloudOff, Loader2 } from 'lucide-svelte';
  
  export let status = 'idle'; // idle, saving, saved, error
  export let lastSaved = null;
  
  $: formattedTime = lastSaved ? formatTime(lastSaved) : '';
  
  function formatTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    
    return date.toLocaleDateString();
  }
</script>

<div class="autosave-indicator status-{status}">
  {#if status === 'saving'}
    <Loader2 size={16} class="animate-spin" />
    <span>Saving...</span>
  {:else if status === 'saved'}
    <Cloud size={16} />
    <span>Saved {formattedTime}</span>
  {:else if status === 'error'}
    <CloudOff size={16} />
    <span>Save failed</span>
  {/if}
</div>

<style>
  .autosave-indicator {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-full);
    font-size: var(--font-size-sm);
    transition: all var(--transition-fast);
  }
  
  .status-saving {
    background: var(--color-accent-2);
    color: var(--color-accent-11);
  }
  
  .status-saved {
    background: var(--color-success);
    background: rgba(34, 197, 94, 0.1);
    color: var(--color-success);
  }
  
  .status-error {
    background: rgba(239, 68, 68, 0.1);
    color: var(--color-error);
  }
  
  :global(.animate-spin) {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
```

### Step 5: Update Wizard Layout (`src/routes/practice-plans/wizard/+layout.svelte`)

```svelte
<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import WizardStepper from '$lib/components/practice-plans/WizardStepper.svelte';
  import WizardFooter from '$lib/components/practice-plans/WizardFooter.svelte';
  import AutosaveIndicator from '$lib/components/practice-plans/AutosaveIndicator.svelte';
  import { toast } from '@zerodevx/svelte-toast';
  import { superForm } from 'sveltekit-superforms/client';
  import { practicePlanSchema } from '$lib/schemas/practicePlan';
  
  export let data;
  
  // Initialize form with superforms
  const { form, errors, validate, enhance } = superForm(data.form, {
    validators: practicePlanSchema,
    dataType: 'json',
    taintedMessage: 'You have unsaved changes. Are you sure you want to leave?'
  });
  
  const steps = [
    { id: 'basic-info', label: 'Basic Info', path: '/practice-plans/wizard/basic-info' },
    { id: 'sections', label: 'Sections', path: '/practice-plans/wizard/sections' },
    { id: 'drills', label: 'Add Drills', path: '/practice-plans/wizard/drills' },
    { id: 'timeline', label: 'Timeline', path: '/practice-plans/wizard/timeline' },
    { id: 'overview', label: 'Review', path: '/practice-plans/wizard/overview' }
  ];
  
  let currentStep = 0;
  let completedSteps = [];
  let stepErrors = {};
  let autosaveStatus = 'idle';
  let lastSaved = null;
  let autosaveTimer;
  
  $: currentPath = $page.url.pathname;
  $: currentStep = steps.findIndex(step => step.path === currentPath);
  $: isLastStep = currentStep === steps.length - 1;
  $: canGoBack = currentStep > 0;
  $: canGoNext = !Object.keys($errors).length;
  
  // Autosave functionality
  function setupAutosave() {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(async () => {
      await saveDraft();
    }, 5000); // Save after 5 seconds of inactivity
  }
  
  // Watch for form changes
  $: if ($form && data.autoSaveEnabled) {
    setupAutosave();
  }
  
  async function saveDraft() {
    autosaveStatus = 'saving';
    try {
      const response = await fetch('/api/practice-plans/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify($form)
      });
      
      if (response.ok) {
        autosaveStatus = 'saved';
        lastSaved = new Date();
        toast.push('Draft saved', {
          theme: { '--toastBackground': 'var(--color-success)' }
        });
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      autosaveStatus = 'error';
      toast.push('Failed to save draft', {
        theme: { '--toastBackground': 'var(--color-error)' }
      });
    }
  }
  
  async function handleNext() {
    const isValid = await validate();
    if (isValid && currentStep < steps.length - 1) {
      completedSteps = [...completedSteps, currentStep];
      goto(steps[currentStep + 1].path);
    }
  }
  
  function handleBack() {
    if (currentStep > 0) {
      goto(steps[currentStep - 1].path);
    }
  }
  
  async function handleComplete() {
    const isValid = await validate();
    if (isValid) {
      // Submit the complete form
      const response = await fetch('/api/practice-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...$form, isDraft: false })
      });
      
      if (response.ok) {
        const { id } = await response.json();
        toast.push('Practice plan created successfully!');
        goto(`/practice-plans/${id}`);
      }
    }
  }
  
  onMount(() => {
    // Load saved draft if exists
    const savedDraft = localStorage.getItem('practice-plan-draft');
    if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      $form = { ...$form, ...draft };
    }
    
    return () => {
      clearTimeout(autosaveTimer);
    };
  });
</script>

<div class="wizard-layout">
  <div class="wizard-header">
    <h1>Create Practice Plan</h1>
    <AutosaveIndicator status={autosaveStatus} {lastSaved} />
  </div>
  
  <WizardStepper 
    {steps}
    {currentStep}
    {completedSteps}
    {stepErrors}
  />
  
  <div class="wizard-content">
    <form use:enhance>
      <slot />
    </form>
  </div>
  
  <WizardFooter
    {canGoBack}
    {canGoNext}
    {isLastStep}
    on:back={handleBack}
    on:next={handleNext}
    on:saveDraft={saveDraft}
    on:complete={handleComplete}
  />
</div>

<style>
  .wizard-layout {
    max-width: 1024px;
    margin: 0 auto;
    padding: var(--space-4);
  }
  
  .wizard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-6);
  }
  
  .wizard-header h1 {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
  }
  
  .wizard-content {
    background: var(--color-surface-1);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    min-height: 400px;
  }
  
  @media (max-width: 768px) {
    .wizard-content {
      padding: var(--space-4);
    }
  }
</style>
```

### Step 6: Example Step Page Update (`src/routes/practice-plans/wizard/basic-info/+page.svelte`)

```svelte
<script>
  import { superForm } from 'sveltekit-superforms/client';
  import Input from '$lib/components/ui/Input.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import { basicInfoSchema } from '$lib/schemas/practicePlan';
  
  export let data;
  
  const { form, errors, constraints } = superForm(data.form, {
    validators: basicInfoSchema
  });
  
  const positionOptions = [
    { value: 'all', label: 'All Positions' },
    { value: 'chaser', label: 'Chaser' },
    { value: 'beater', label: 'Beater' },
    { value: 'keeper', label: 'Keeper' },
    { value: 'seeker', label: 'Seeker' }
  ];
  
  const difficultyOptions = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];
</script>

<div class="step-content">
  <h2>Basic Information</h2>
  <p class="step-description">
    Let's start with the basic details of your practice plan.
  </p>
  
  <div class="form-grid">
    <Input
      label="Practice Plan Name"
      bind:value={$form.name}
      error={$errors.name}
      required
      placeholder="e.g., Monday Team Practice"
      {...$constraints.name}
    />
    
    <Input
      label="Description"
      type="textarea"
      bind:value={$form.description}
      error={$errors.description}
      placeholder="Describe the goals and focus of this practice"
      rows="3"
    />
    
    <div class="form-row">
      <Input
        label="Duration (minutes)"
        type="number"
        bind:value={$form.duration}
        error={$errors.duration}
        required
        min="5"
        max="480"
        {...$constraints.duration}
      />
      
      <Select
        label="Difficulty Level"
        bind:value={$form.difficulty}
        options={difficultyOptions}
        error={$errors.difficulty}
        required
      />
    </div>
    
    <div class="form-group">
      <label class="group-label">Target Positions</label>
      <div class="checkbox-group">
        {#each positionOptions as option}
          <label class="checkbox-label">
            <input
              type="checkbox"
              value={option.value}
              checked={$form.positions?.includes(option.value)}
              on:change={(e) => {
                if (e.target.checked) {
                  $form.positions = [...($form.positions || []), option.value];
                } else {
                  $form.positions = $form.positions.filter(p => p !== option.value);
                }
              }}
            />
            <span>{option.label}</span>
          </label>
        {/each}
      </div>
      {#if $errors.positions}
        <p class="error-message">{$errors.positions}</p>
      {/if}
    </div>
  </div>
</div>

<style>
  .step-content {
    max-width: 600px;
  }
  
  .step-content h2 {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--space-2);
  }
  
  .step-description {
    color: var(--color-text-secondary);
    margin-bottom: var(--space-6);
  }
  
  .form-grid {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  
  .group-label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
  }
  
  .checkbox-group {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }
  
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    cursor: pointer;
  }
  
  .error-message {
    color: var(--color-error);
    font-size: var(--font-size-sm);
  }
  
  @media (max-width: 640px) {
    .form-row {
      grid-template-columns: 1fr;
    }
  }
</style>
```

## Testing Checklist

- [ ] Stepper shows current step and progress
- [ ] Step validation prevents advancing with errors
- [ ] Completed steps show checkmark
- [ ] Error steps show alert icon
- [ ] Back/Next navigation works
- [ ] Keyboard shortcuts work (Alt+Arrow, Ctrl+S)
- [ ] Autosave triggers after inactivity
- [ ] Save indicator shows status
- [ ] Draft persists across sessions
- [ ] Form validation shows inline errors
- [ ] Tainted form warning on navigation
- [ ] Mobile responsive layout
- [ ] Final submission creates plan
- [ ] Progress bar updates correctly

## Integration Notes

- Uses Button, Input, Select components from Ticket 003
- Integrates with existing wizard pages
- Uses sveltekit-superforms for validation
- Maintains draft in localStorage and server

## Next Steps
After completing this ticket, proceed to Ticket 008 (Accessibility and Keyboard).