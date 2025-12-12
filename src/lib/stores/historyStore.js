import { writable, get } from 'svelte/store';
import { toast } from '@zerodevx/svelte-toast';

let snapshotGetter = null;
let snapshotApplier = null;

// Allow the sections store to inject a snapshot getter to avoid circular deps
export function setSnapshotGetter(getter) {
	snapshotGetter = getter;
}

// Allow the sections store to inject how to apply snapshots (undo/redo)
export function setSnapshotApplier(applier) {
	snapshotApplier = applier;
}

// Create history stores
export const commandHistory = writable([]);
export const redoStack = writable([]);
export const canUndo = writable(false);
export const canRedo = writable(false);

// Maximum number of history steps to keep
const MAX_HISTORY = 50;

// Initialize history store
export function initializeHistory() {
	// Clear history when creating a new plan
	commandHistory.set([]);
	redoStack.set([]);
	updateCanUndoRedo();
}

// Update the canUndo and canRedo stores
function updateCanUndoRedo() {
	canUndo.set(get(commandHistory).length > 0);
	canRedo.set(get(redoStack).length > 0);
}

// Snapshot the current state
function createSnapshot() {
	if (typeof snapshotGetter !== 'function') return null;
	try {
		return snapshotGetter();
	} catch (err) {
		console.warn('[historyStore] Failed to create snapshot:', err);
		return null;
	}
}

// Add a command to history
export function addToHistory(type, payload, description) {
	const snapshot = createSnapshot();

	// Add to history
	commandHistory.update((history) => {
		// Limit history size
		if (history.length >= MAX_HISTORY) {
			history.shift();
		}

		return [...history, { type, payload, snapshot, description }];
	});

	// Clear redo stack when a new action is performed
	redoStack.set([]);

	// Update undo/redo availability
	updateCanUndoRedo();
}

// Perform an undo operation
export function undo() {
	const history = get(commandHistory);
	if (history.length === 0) return;

	// Get the last command
	const lastCommand = history[history.length - 1];

	// Take a snapshot of current state before undoing
	const currentSnapshot = createSnapshot();

	// Apply the previous state
	if (typeof snapshotApplier === 'function' && lastCommand.snapshot) {
		snapshotApplier(lastCommand.snapshot);
	} else {
		console.warn('[historyStore] Cannot apply snapshot (missing applier or snapshot).');
		return;
	}

	// Move the command to the redo stack
	redoStack.update((stack) => [
		...stack,
		{
			type: lastCommand.type,
			payload: lastCommand.payload,
			snapshot: currentSnapshot,
			description: lastCommand.description
		}
	]);

	// Remove the command from history
	commandHistory.update((h) => h.slice(0, -1));

	// Update undo/redo availability
	updateCanUndoRedo();

	// Show toast notification
	toast.push(`Undid: ${lastCommand.description}`);
}

// Perform a redo operation
export function redo() {
	const stack = get(redoStack);
	if (stack.length === 0) return;

	// Get the last command from redo stack
	const lastCommand = stack[stack.length - 1];

	// Take a snapshot of current state before redoing
	const currentSnapshot = createSnapshot();

	// Apply the redone state
	if (typeof snapshotApplier === 'function' && lastCommand.snapshot) {
		snapshotApplier(lastCommand.snapshot);
	} else {
		console.warn('[historyStore] Cannot apply snapshot (missing applier or snapshot).');
		return;
	}

	// Move the command back to history
	commandHistory.update((history) => [
		...history,
		{
			type: lastCommand.type,
			payload: lastCommand.payload,
			snapshot: currentSnapshot,
			description: lastCommand.description
		}
	]);

	// Remove the command from redo stack
	redoStack.update((s) => s.slice(0, -1));

	// Update undo/redo availability
	updateCanUndoRedo();

	// Show toast notification
	toast.push(`Redid: ${lastCommand.description}`);
}

// Helper to wrap actions with history
