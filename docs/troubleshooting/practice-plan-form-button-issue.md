# Troubleshooting: "+ Add Section" Button Inoperative in PracticePlanForm.svelte

## 1. Problem Description

The "+ Add Section" button in `src/routes/practice-plans/PracticePlanForm.svelte` became inoperative. Clicking the button produced no action, no console logs, and did not trigger the intended `addSection` function from the `sectionsStore.js`.

This button was an instance of the custom UI component `<Button>` from `src/lib/components/ui/button/button.svelte`.

## 2. Initial Investigation (Summary of User's Findings)

The user had already performed extensive testing:

- **Initial wiring correction**: Changed `on:click={sections.addSection}` (incorrect) to `on:click={addSection}` (correct, but didn't solve).
- **Wrapper function for debugging**: A wrapper function `addSectionAction` in `PracticePlanForm.svelte` with a `console.log` did not log to the console when the custom button was clicked.
- **Logging in store functions**: `console.log` statements in `sectionsStore.js` (`addSection`) and `historyStore.js` (`addToHistory`) were not reached.
- **Native HTML `<button>` test**: Replacing the custom `<Button>` with a native `<button type="button" on:click={() => console.log('Native clicked')}></button>` _did_ work and logged to the console. This was a key finding.
- **Custom `<Button>` component inspection**: The `button.svelte` code seemed correct, forwarding `on:click` and using `type="button"`.
- **Custom `<Button>` with inline `console.log`**: `<Button on:click={() => console.log('Custom Button inline log')}>` _did not_ log.
- **Second identical custom `<Button>`**: Adding another identical custom button next to the problematic one also failed to log, suggesting a localized issue with these custom button instances.
- **Working functionality**: Other custom `<Button>` instances on the same form (e.g., "Update plan", Undo/Redo buttons) and other functionalities like Ctrl+Z worked, indicating stores were likely functional.

**Initial Hypotheses Focused On:**

- Localized issue in `PracticePlanForm.svelte` around the button.
- Event propagation/interception (e.g., invisible overlay, CSS `pointer-events`).

## 3. Debugging Steps with AI Assistant

Based on the user's findings, the following steps were taken:

1.  **Code Review**:

    - Reviewed `src/lib/components/ui/button/button.svelte`: Confirmed it uses `ButtonPrimitive.Root` from `bits-ui` and forwards `on:click`.
    - Reviewed `src/routes/practice-plans/PracticePlanForm.svelte`: Examined the button's placement and the `addSectionAction` function.

2.  **DOM Simplification / Button Relocation**:

    - The problematic "+ Add Section" button was moved to a different location in `PracticePlanForm.svelte` (outside its parent divs, just before the submit button).
    - **Result**: The button still did not work, suggesting the immediate parent containers were not the sole cause.

3.  **Prop Modification Test**:

    - The `size="icon"` prop was added to the non-functional button, to match other working (Undo/Redo) outline buttons.
    - **Result**: The button still did not work.

4.  **Replacement with a `SimpleButton` Component**:
    - A new, minimal button component (`src/routes/practice-plans/components/SimpleButton.svelte`) was created. This component directly renders a native `<button>` element and forwards `on:click` and `$$restProps`, without using `bits-ui` or `tailwind-variants`.
    - `PracticePlanForm.svelte` was modified to use this `SimpleButton` for the "+ Add Section" functionality, passing the `addSectionAction` to its `on:click`.
    - **Result**: The `SimpleButton` _worked correctly_. The `addSectionAction` was called, and a new section was added to the form.

## 4. Root Cause Hypothesis

The fact that a native HTML `<button>` and the `SimpleButton.svelte` (which wraps a native button with basic Svelte event forwarding) both worked, while the original `<Button>` component (from `src/lib/components/ui/button/button.svelte`, which uses `bits-ui`) did not, strongly indicates that the issue lies within:

- The `src/lib/components/ui/button/button.svelte` component itself, or
- The underlying `ButtonPrimitive.Root` from the `bits-ui` library, or
- An interaction between these and the specific Svelte rendering context or reactivity in that part of `PracticePlanForm.svelte`.

The problem is highly specific, as other instances of the same custom `Button` component work elsewhere on the page.

## 5. Workaround Implemented

To restore functionality, the following workaround was put in place:

1.  **`SimpleButton.svelte` Created**:

    - The file `src/routes/practice-plans/components/SimpleButton.svelte` was (re)created.
    - It's a basic Svelte component that renders a native `<button type="button">`.
    - It accepts a `className` prop and applies Tailwind CSS classes to mimic the 'outline' style of the original button, including base styles, outline variant styles, and default size styles derived from `src/lib/components/ui/button/index.ts`.

    ```svelte
    <!-- src/routes/practice-plans/components/SimpleButton.svelte -->
    <script lang="ts">
    	export let className: string | undefined = undefined;

    	// Base classes from the original buttonVariants
    	const baseClasses =
    		'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

    	// Outline variant + default size classes
    	const styleClasses =
    		'border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2';

    	let combinedClasses: string;
    	$: combinedClasses = `${baseClasses} ${styleClasses} ${className || ''}`.trim();
    </script>

    <button type="button" class={combinedClasses} on:click {...$$restProps}>
    	<slot />
    </button>
    ```

2.  **`PracticePlanForm.svelte` Updated**:

    - The form now imports and uses `SimpleButton` for the "+ Add Section" button.
    - The button text was reverted to "+ Add Section".
    - The `class="flex-1"` (previously on a wrapper) was applied to the `SimpleButton` instance to allow similar layout behavior.

    ```svelte
    // In PracticePlanForm.svelte script section: import {Button} from '$lib/components/ui/button'; //
    Original button for other uses import SimpleButton from './components/SimpleButton.svelte'; // Workaround
    button // ... // In PracticePlanForm.svelte template:
    <div class="my-4">
    	<SimpleButton on:click={addSectionAction} class="flex-1">+ Add Section</SimpleButton>
    </div>
    ```

## 6. Future Considerations

While the workaround restores functionality, the underlying issue in the `src/lib/components/ui/button/button.svelte` component (or `bits-ui`) should be investigated further when time permits. This might involve:

- Checking for known issues in the `bits-ui` library.
- Further simplifying the original custom `Button` component to pinpoint the exact cause.
- Testing `bits-ui`'s `ButtonPrimitive.Root` directly in the problematic area of `PracticePlanForm.svelte`.

This will help prevent similar issues from occurring elsewhere or with future updates to the UI library.
