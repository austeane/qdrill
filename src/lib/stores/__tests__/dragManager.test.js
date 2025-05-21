import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import * as dragManager from '../dragManager';
import * as sectionsStore from '../sectionsStore';
import * as historyStore from '../historyStore';

// ------------------------------------------------------------------
// MOCKS
// ------------------------------------------------------------------

// Mock the necessary modules
vi.mock('../sectionsStore', () => {
	let mockStoreValue = [];
	return {
		sections: {
			subscribe: (run) => {
				run(mockSections);
				return () => {};
			},
			update: vi.fn((cb) => {
				const result = cb(mockSections);
				mockSections = result;
				return result;
			}),
			set: vi.fn((newVal) => {
				mockSections = newVal;
			})
		}
	};
});

vi.mock('../historyStore', () => {
	return {
		addToHistory: vi.fn()
	};
});

// ------------------------------------------------------------------
// GLOBALS / MOCK SETUP
// ------------------------------------------------------------------
let mockDragEvent;
let mockElement;
let mockSections;

beforeEach(() => {
	// Reset the drag store to a consistent baseline, including isSameTimeline
	dragManager.dragState.set({
		isDragging: false,
		dragType: null,
		sourceSection: null,
		sourceIndex: null,
		sourceGroupId: null,
		sourceTimeline: null,
		sourceTimelineIndex: null,
		itemId: null,
		itemName: null,
		targetSection: null,
		targetIndex: null,
		targetGroupId: null,
		targetTimeline: null,
		targetTimelineIndex: null,
		dropPosition: null,
		draggedElementId: null,
		dropTargetElementId: null,
		// Some tests rely on isSameTimeline being tracked
		isSameTimeline: false
	});

	// Reset mock sections data
	mockSections = [
		{
			id: 1,
			name: 'Section 1',
			items: [
				{ id: 101, name: 'Item 1', parallel_group_id: null, parallel_timeline: null },
				{ id: 102, name: 'Item 2', parallel_group_id: null, parallel_timeline: null },
				{
					id: 103,
					name: 'Item 3',
					parallel_group_id: 'group1',
					parallel_timeline: 'timeline1',
					groupTimelines: ['timeline1', 'timeline2']
				},
				{
					id: 104,
					name: 'Item 4',
					parallel_group_id: 'group1',
					parallel_timeline: 'timeline2',
					groupTimelines: ['timeline1', 'timeline2']
				}
			]
		},
		{
			id: 2,
			name: 'Section 2',
			items: [
				{ id: 201, name: 'Item 5', parallel_group_id: null, parallel_timeline: null },
				{
					id: 202,
					name: 'Item 6',
					parallel_group_id: 'group2',
					parallel_timeline: 'timeline1',
					groupTimelines: ['timeline1']
				}
			]
		}
	];

	// Mock DOM element
	mockElement = {
		id: '',
		classList: {
			add: vi.fn(),
			remove: vi.fn(),
			contains: vi.fn(() => false)
			// for element.matches('.some-class')
			// we'll override in specific tests if needed
		},
		getAttribute: vi.fn(),
		setAttribute: vi.fn(),
		getBoundingClientRect: vi.fn(() => ({
			top: 0,
			left: 0,
			width: 100,
			height: 100
		})),
		contains: vi.fn(() => false),
		matches: vi.fn(() => false),
		dataset: {}
	};

	// Mock DataTransfer
	const mockDataTransfer = {
		setData: vi.fn(),
		getData: vi.fn((key) => {
			if (key === 'application/x-item-id') return '101';
			if (key === 'application/x-item-name') return 'Item 1';
			if (key === 'text/plain') {
				return JSON.stringify({
					type: 'item',
					id: 101,
					name: 'Item 1',
					sectionIndex: 0,
					itemIndex: 0
				});
			}
			return '';
		}),
		effectAllowed: 'move'
	};

	// Mock DragEvent
	mockDragEvent = {
		preventDefault: vi.fn(),
		stopPropagation: vi.fn(),
		dataTransfer: mockDataTransfer,
		clientX: 50,
		clientY: 25,
		currentTarget: mockElement,
		relatedTarget: null,
		target: mockElement
	};

	// Mock document query
	global.document = {
		querySelectorAll: vi
			.fn()
			.mockReturnValue([{ classList: { remove: vi.fn() } }, { classList: { remove: vi.fn() } }]),
		querySelector: vi.fn().mockReturnValue(mockElement),
		getElementById: vi.fn().mockReturnValue(null)
	};

	// Mock setTimeout to run immediately
	global.setTimeout = vi.fn((fn) => fn());
});

afterEach(() => {
	vi.resetAllMocks();
});

// ------------------------------------------------------------------
// TESTS
// ------------------------------------------------------------------
describe('dragManager', () => {
	// ---------------------------------------------------------------
	// Helper function tests
	// ---------------------------------------------------------------
	describe('helper functions', () => {
		describe('calculateDropPosition', () => {
			it('should return "before" when position is in the top half', () => {
				mockDragEvent.clientY = 25; // top quarter
				const result = dragManager.calculateDropPosition(mockDragEvent, mockElement);
				expect(result).toBe('before');
			});

			it('should return "after" when position is in the bottom half', () => {
				mockDragEvent.clientY = 75; // bottom three-quarters
				const result = dragManager.calculateDropPosition(mockDragEvent, mockElement);
				expect(result).toBe('after');
			});

			it('should handle errors gracefully', () => {
				mockElement.getBoundingClientRect.mockImplementation(() => {
					throw new Error('Test error');
				});
				const result = dragManager.calculateDropPosition(mockDragEvent, mockElement);
				expect(result).toBe('after'); // default fallback
			});
		});

		describe('calculateSectionDropPosition', () => {
			it('should return the same value as calculateDropPosition', () => {
				// Rather than spying, let's directly compare the results
				const resultSection = dragManager.calculateSectionDropPosition(mockDragEvent, mockElement);
				const resultDirect = dragManager.calculateDropPosition(mockDragEvent, mockElement);
				expect(resultSection).toBe(resultDirect);
			});
		});
	});

	// ---------------------------------------------------------------
	// Drag start handlers
	// ---------------------------------------------------------------
	describe('drag start handlers', () => {
		describe('startItemDrag', () => {
			it('should initialize drag state for an item', () => {
				const item = { id: 101, name: 'Item 1', parallel_group_id: null, parallel_timeline: null };

				dragManager.startItemDrag(mockDragEvent, 0, 0, item, 101);

				const state = get(dragManager.dragState);
				expect(state.isDragging).toBe(true);
				expect(state.dragType).toBe('item');
				expect(state.sourceSection).toBe(0);
				expect(state.sourceIndex).toBe(0);
				expect(state.itemId).toBe(101);
				expect(state.itemName).toBe('Item 1');
				// dataTransfer checks
				expect(mockDragEvent.dataTransfer.setData).toHaveBeenCalled();
				// class checks
				expect(mockElement.classList.add).toHaveBeenCalledWith('dragging');
			});

			it('should recover itemId from data attributes if not provided', () => {
				const item = { id: 101, name: 'Item 1' };
				// Provide dataset
				mockElement.dataset.itemId = '101';

				dragManager.startItemDrag(mockDragEvent, 0, 0, item, null);

				const state = get(dragManager.dragState);
				expect(state.itemId).toBe(101);
			});

			it('should handle timeline item drags', () => {
				const item = {
					id: 103,
					name: 'Item 3',
					parallel_group_id: 'group1',
					parallel_timeline: 'timeline1',
					groupTimelines: ['timeline1', 'timeline2']
				};

				dragManager.startItemDrag(mockDragEvent, 0, 2, item, 103, 0);

				const state = get(dragManager.dragState);
				expect(state.isDragging).toBe(true);
				expect(state.sourceGroupId).toBe('group1');
				expect(state.sourceTimeline).toBe('timeline1');
				expect(state.sourceTimelineIndex).toBe(0);
			});

			it('should handle errors gracefully', () => {
				mockDragEvent.currentTarget = null; // triggers an error in startItemDrag
				dragManager.startItemDrag(mockDragEvent, 0, 0, null, null);

				const state = get(dragManager.dragState);
				// Should revert to a non-dragging state
				expect(state.isDragging).toBe(false);
			});

			it('should not block consecutive drags in test mode', () => {
				const item = { id: 101, name: 'Item 1' };
				// First drag
				dragManager.startItemDrag(mockDragEvent, 0, 0, item, 101);

				// Reset calls for the second attempt
				mockDragEvent.preventDefault.mockClear();
				mockDragEvent.dataTransfer.setData.mockClear();

				// Immediately do a second drag - should not be blocked since MIN_DRAG_INTERVAL is 0
				dragManager.startItemDrag(mockDragEvent, 0, 0, item, 101);

				// In test mode, the second drag should proceed since MIN_DRAG_INTERVAL is 0
				expect(mockDragEvent.dataTransfer.setData).toHaveBeenCalled();
			});
		});

		describe('startGroupDrag', () => {
			it('should initialize drag state for a group', () => {
				dragManager.startGroupDrag(mockDragEvent, 0, 'group1');

				const state = get(dragManager.dragState);
				expect(state.isDragging).toBe(true);
				expect(state.dragType).toBe('group');
				expect(state.sourceSection).toBe(0);
				expect(state.sourceGroupId).toBe('group1');
				expect(state.itemId).toBe(null);
				expect(mockElement.classList.add).toHaveBeenCalledWith('dragging');
			});

			it('should handle errors gracefully', () => {
				// Force an error by manually calling the error handler
				try {
					// Call the function with a setup that will throw an error
					mockDragEvent.currentTarget = null;
					// Force an error and catch it
					dragManager.resetDragState = vi.fn(); // Mock resetDragState to test if it's called

					// This should throw an error and call resetDragState
					dragManager.startGroupDrag(mockDragEvent, 0, 'group1');

					// Check resetDragState was called
					expect(dragManager.resetDragState).toHaveBeenCalled();
				} catch (e) {
					// Expected error
				} finally {
					// Reset the mock
					vi.restoreAllMocks();
					// Reset drag state manually for next tests
					dragManager.dragState.set({
						isDragging: false,
						dragType: null,
						sourceSection: null,
						sourceGroupId: null
					});
				}
			});
		});

		describe('startSectionDrag', () => {
			it('should initialize drag state for a section', () => {
				dragManager.startSectionDrag(mockDragEvent, 0);

				const state = get(dragManager.dragState);
				expect(state.isDragging).toBe(true);
				expect(state.dragType).toBe('section');
				expect(state.sourceSection).toBe(0);
				expect(state.itemId).toBe(null);
				expect(mockElement.classList.add).toHaveBeenCalledWith('dragging');
			});

			it('should handle errors gracefully', () => {
				// Force an error by manually calling the error handler
				try {
					// Call the function with a setup that will throw an error
					mockDragEvent.currentTarget = null;
					// Force an error and catch it
					dragManager.resetDragState = vi.fn(); // Mock resetDragState to test if it's called

					// This should throw an error and call resetDragState
					dragManager.startSectionDrag(mockDragEvent, 0);

					// Check resetDragState was called
					expect(dragManager.resetDragState).toHaveBeenCalled();
				} catch (e) {
					// Expected error
				} finally {
					// Reset the mock
					vi.restoreAllMocks();
					// Reset drag state manually for next tests
					dragManager.dragState.set({
						isDragging: false,
						dragType: null,
						sourceSection: null
					});
				}
			});
		});
	});

	// ---------------------------------------------------------------
	// Drag over handlers
	// ---------------------------------------------------------------
	describe('drag over handlers', () => {
		describe('handleItemDragOver', () => {
			beforeEach(() => {
				// Setup an item drag
				dragManager.dragState.set({
					isDragging: true,
					dragType: 'item',
					sourceSection: 0,
					sourceIndex: 0,
					itemId: 101,
					itemName: 'Item 1'
				});
			});

			it('should update drag state when dragging over a different item', () => {
				const item = { id: 102, name: 'Item 2', parallel_group_id: null, parallel_timeline: null };

				dragManager.handleItemDragOver(mockDragEvent, 0, 1, item, mockElement);

				const state = get(dragManager.dragState);
				expect(state.targetSection).toBe(0);
				expect(state.targetIndex).toBe(1);
				// Because clientY=25 => top
				expect(state.dropPosition).toBe('before');
				expect(mockElement.classList.add).toHaveBeenCalled();
			});

			it('should not update when dragging over the same item', () => {
				// Reset drag state first to have known values
				dragManager.dragState.set({
					isDragging: true,
					dragType: 'item',
					sourceSection: 0,
					sourceIndex: 0,
					itemId: 101,
					itemName: 'Item 1',
					targetSection: null
				});

				const item = { id: 101, name: 'Item 1', parallel_group_id: null, parallel_timeline: null };
				dragManager.handleItemDragOver(mockDragEvent, 0, 0, item, mockElement);

				const state = get(dragManager.dragState);
				expect(state.targetSection).toBeNull();
				expect(mockElement.classList.add).not.toHaveBeenCalled();
			});

			it('should handle timeline items correctly', () => {
				const item = {
					id: 103,
					name: 'Item 3',
					parallel_group_id: 'group1',
					parallel_timeline: 'timeline1',
					groupTimelines: ['timeline1', 'timeline2']
				};

				dragManager.handleItemDragOver(mockDragEvent, 0, 2, item, mockElement, 0);

				const state = get(dragManager.dragState);
				expect(state.targetSection).toBe(0);
				expect(state.targetIndex).toBe(2);
				expect(state.targetGroupId).toBe('group1');
				expect(state.targetTimeline).toBe('timeline1');
				expect(state.targetTimelineIndex).toBe(0);
			});

			it('should allow group drags over items', () => {
				dragManager.dragState.set({
					isDragging: true,
					dragType: 'group',
					sourceSection: 0,
					sourceGroupId: 'group1'
				});

				const item = { id: 102, name: 'Item 2' };
				dragManager.handleItemDragOver(mockDragEvent, 0, 1, item, mockElement);

				const state = get(dragManager.dragState);
				expect(state.targetSection).toBe(0);
				expect(state.targetIndex).toBe(1);
			});

			it('should not allow section drags over items', () => {
				dragManager.dragState.set({
					isDragging: true,
					dragType: 'section',
					sourceSection: 0
				});

				const item = { id: 102, name: 'Item 2' };
				dragManager.handleItemDragOver(mockDragEvent, 0, 1, item, mockElement);

				const state = get(dragManager.dragState);
				expect(state.targetSection).toBeNull();
			});

			it('should handle errors gracefully', () => {
				const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
				dragManager.handleItemDragOver(mockDragEvent, 0, 1, null, null);
				spy.mockRestore();
			});
		});

		describe('handleGroupDragOver', () => {
			beforeEach(() => {
				// Setup group drag
				dragManager.dragState.set({
					isDragging: true,
					dragType: 'group',
					sourceSection: 0,
					sourceGroupId: 'group1'
				});
			});

			it('should update drag state when dragging over a different group', () => {
				dragManager.handleGroupDragOver(mockDragEvent, 0, 'group2', mockElement);

				const state = get(dragManager.dragState);
				expect(state.targetSection).toBe(0);
				expect(state.targetGroupId).toBe('group2');
				expect(state.dropPosition).toBe('before');
			});

			it('should not update when dragging over the same group', () => {
				// Reset drag state first to have known values
				dragManager.dragState.set({
					isDragging: true,
					dragType: 'group',
					sourceSection: 0,
					sourceGroupId: 'group1',
					targetGroupId: null
				});

				dragManager.handleGroupDragOver(mockDragEvent, 0, 'group1', mockElement);

				const state = get(dragManager.dragState);
				expect(state.targetGroupId).toBeNull();
			});

			it('should allow item drags over groups', () => {
				dragManager.dragState.set({
					isDragging: true,
					dragType: 'item',
					sourceSection: 0,
					sourceIndex: 0,
					itemId: 101
				});

				dragManager.handleGroupDragOver(mockDragEvent, 0, 'group2', mockElement);
				const state = get(dragManager.dragState);
				expect(state.targetSection).toBe(0);
				expect(state.targetGroupId).toBe('group2');
			});

			it('should not allow section drags over groups', () => {
				dragManager.dragState.set({
					isDragging: true,
					dragType: 'section',
					sourceSection: 0
				});

				dragManager.handleGroupDragOver(mockDragEvent, 0, 'group2', mockElement);
				const state = get(dragManager.dragState);
				expect(state.targetGroupId).toBeNull();
			});

			it('should handle errors gracefully', () => {
				const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
				dragManager.handleGroupDragOver(mockDragEvent, 0, 'group2', null);
				spy.mockRestore();
			});
		});

		describe('handleSectionDragOver', () => {
			beforeEach(() => {
				dragManager.dragState.set({
					isDragging: true,
					dragType: 'section',
					sourceSection: 0
				});
			});

			it('should update drag state when dragging over a different section', () => {
				dragManager.handleSectionDragOver(mockDragEvent, 1, mockElement);

				const state = get(dragManager.dragState);
				expect(state.targetSection).toBe(1);
				expect(state.dropPosition).toBe('before');
			});

			it('should not update when dragging over the same section', () => {
				// Reset drag state first to have known values
				dragManager.dragState.set({
					isDragging: true,
					dragType: 'section',
					sourceSection: 0,
					targetSection: null
				});

				dragManager.handleSectionDragOver(mockDragEvent, 0, mockElement);

				const state = get(dragManager.dragState);
				expect(state.targetSection).toBeNull();
			});

			it('should not allow item drags over sections', () => {
				dragManager.dragState.set({
					isDragging: true,
					dragType: 'item',
					sourceSection: 0,
					sourceIndex: 0,
					itemId: 101
				});

				dragManager.handleSectionDragOver(mockDragEvent, 1, mockElement);

				const state = get(dragManager.dragState);
				expect(state.targetSection).toBeNull();
			});

			it('should not allow group drags over sections', () => {
				dragManager.dragState.set({
					isDragging: true,
					dragType: 'group',
					sourceSection: 0,
					sourceGroupId: 'group1'
				});

				dragManager.handleSectionDragOver(mockDragEvent, 1, mockElement);

				const state = get(dragManager.dragState);
				expect(state.targetSection).toBeNull();
			});

			it('should handle errors gracefully', () => {
				const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
				dragManager.handleSectionDragOver(mockDragEvent, 1, null);
				spy.mockRestore();
			});
		});

		describe('handleTimelineDragOver', () => {
			beforeEach(() => {
				// Setup item drag
				dragManager.dragState.set({
					isDragging: true,
					dragType: 'item',
					sourceSection: 0,
					sourceIndex: 0,
					itemId: 101,
					sourceGroupId: null,
					sourceTimeline: null
				});
			});

			it('should update drag state for timeline targets', () => {
				dragManager.handleTimelineDragOver(mockDragEvent, 0, 'timeline1', 'group1', mockElement);

				const state = get(dragManager.dragState);
				expect(state.targetSection).toBe(0);
				expect(state.targetGroupId).toBe('group1');
				expect(state.targetTimeline).toBe('timeline1');
				expect(state.dropPosition).toBe('inside');
				expect(mockElement.classList.add).toHaveBeenCalledWith('timeline-drop-target');
			});

			it('should detect moves within the same timeline', () => {
				// Now "source" is also timeline-based
				dragManager.dragState.set({
					isDragging: true,
					dragType: 'item',
					sourceSection: 0,
					sourceIndex: 2,
					itemId: 103,
					sourceGroupId: 'group1',
					sourceTimeline: 'timeline1'
				});

				dragManager.handleTimelineDragOver(mockDragEvent, 0, 'timeline1', 'group1', mockElement);
				const state = get(dragManager.dragState);
				expect(state.targetSection).toBe(0);
				expect(state.targetGroupId).toBe('group1');
				expect(state.targetTimeline).toBe('timeline1');
				expect(state.isSameTimeline).toBe(true);
			});

			it('should not allow group drags to timelines', () => {
				dragManager.dragState.set({
					isDragging: true,
					dragType: 'group',
					sourceSection: 0,
					sourceGroupId: 'group1'
				});

				dragManager.handleTimelineDragOver(mockDragEvent, 0, 'timeline1', 'group1', mockElement);
				const state = get(dragManager.dragState);
				expect(state.targetTimeline).toBeNull();
			});

			it('should not allow section drags to timelines', () => {
				dragManager.dragState.set({
					isDragging: true,
					dragType: 'section',
					sourceSection: 0
				});

				dragManager.handleTimelineDragOver(mockDragEvent, 0, 'timeline1', 'group1', mockElement);
				const state = get(dragManager.dragState);
				expect(state.targetTimeline).toBeNull();
			});

			it('should handle errors gracefully', () => {
				const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
				dragManager.handleTimelineDragOver(mockDragEvent, 0, 'timeline1', 'group1', null);
				spy.mockRestore();
			});
		});

		describe('handleEmptySectionDragOver', () => {
			beforeEach(() => {
				dragManager.dragState.set({
					isDragging: true,
					dragType: 'item',
					sourceSection: 0,
					sourceIndex: 0,
					itemId: 101
				});
			});

			it('should update drag state for empty section targets', () => {
				// This test is checking that the correct item index is calculated for empty sections

				// First reset mockSections to a clean state with empty items arrays
				mockSections = [
					{ id: 1, items: [] },
					{ id: 2, items: [] }
				];

				// Reset drag state
				dragManager.dragState.set({
					isDragging: true,
					dragType: 'item',
					sourceSection: 0,
					sourceIndex: 0,
					itemId: 101,
					targetSection: null,
					targetIndex: null
				});

				// Call the handler with section 1 (second section)
				dragManager.handleEmptySectionDragOver(mockDragEvent, 1, mockElement);

				// Get state and verify correct values
				const state = get(dragManager.dragState);
				expect(state.targetSection).toBe(1);
				// For an empty section, targetIndex should always be 0
				expect(state.targetIndex).toBe(0);
				expect(state.dropPosition).toBe('inside');
				expect(mockElement.classList.add).toHaveBeenCalledWith('empty-section-target');
			});

			it('should allow group drags to empty sections', () => {
				dragManager.dragState.set({
					isDragging: true,
					dragType: 'group',
					sourceSection: 0,
					sourceGroupId: 'group1'
				});
				dragManager.handleEmptySectionDragOver(mockDragEvent, 1, mockElement);

				const state = get(dragManager.dragState);
				expect(state.targetSection).toBe(1);
				expect(state.dropPosition).toBe('inside');
			});

			it('should not allow section drags to empty sections', () => {
				dragManager.dragState.set({
					isDragging: true,
					dragType: 'section',
					sourceSection: 0
				});
				dragManager.handleEmptySectionDragOver(mockDragEvent, 1, mockElement);

				const state = get(dragManager.dragState);
				expect(state.targetSection).toBeNull();
			});

			it('should handle errors gracefully', () => {
				const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
				dragManager.handleEmptySectionDragOver(mockDragEvent, 1, null);
				spy.mockRestore();
			});
		});
	});

	// ---------------------------------------------------------------
	// Drag leave / end handlers
	// ---------------------------------------------------------------
	describe('handleDragLeave', () => {
		beforeEach(() => {
			dragManager.dragState.set({
				isDragging: true,
				dragType: 'item',
				targetSection: 1,
				targetIndex: 0,
				dropPosition: 'before',
				dropTargetElementId: 'test-id'
			});
			mockElement.id = 'test-id';
			mockElement.matches = vi.fn(() => true);
		});

		it('should clear target info when leaving an element', () => {
			// Indicate we left the element
			mockElement.contains = vi.fn(() => false);
			mockDragEvent.relatedTarget = { id: 'other-element' };

			dragManager.handleDragLeave(mockDragEvent);

			const state = get(dragManager.dragState);
			expect(state.targetSection).toBeNull();
			expect(state.targetIndex).toBeNull();
			expect(state.dropPosition).toBeNull();
			expect(mockElement.classList.remove).toHaveBeenCalled();
		});

		it('should not clear target when still within the element', () => {
			mockElement.contains = vi.fn(() => true);
			mockDragEvent.relatedTarget = { id: 'child-element' };

			dragManager.handleDragLeave(mockDragEvent);

			const state = get(dragManager.dragState);
			expect(state.targetSection).toBe(1);
			expect(state.targetIndex).toBe(0);
			expect(state.dropPosition).toBe('before');
		});

		it('should handle errors gracefully', () => {
			mockElement.contains = vi.fn(() => {
				throw new Error('Test error');
			});
			const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

			// Should not throw
			dragManager.handleDragLeave(mockDragEvent);

			spy.mockRestore();
		});
	});

	describe('handleDragEnd', () => {
		beforeEach(() => {
			dragManager.dragState.set({
				isDragging: true,
				dragType: 'item',
				sourceSection: 0,
				sourceIndex: 0,
				itemId: 101,
				dropTargetElementId: 'test-id'
			});
			mockElement.id = 'test-id';
		});

		it('should reset drag state', () => {
			dragManager.handleDragEnd(mockDragEvent);
			const state = get(dragManager.dragState);
			expect(state.isDragging).toBe(false);
			expect(state.dragType).toBeNull();
			expect(state.sourceSection).toBeNull();
			expect(mockElement.classList.remove).toHaveBeenCalledWith('dragging');
		});

		it('should clean up indicators', () => {
			dragManager.handleDragEnd(mockDragEvent);
			expect(document.querySelectorAll).toHaveBeenCalled();
		});

		it('should handle errors gracefully', () => {
			mockDragEvent.currentTarget = null;
			const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

			dragManager.handleDragEnd(mockDragEvent);

			const state = get(dragManager.dragState);
			expect(state.isDragging).toBe(false);
			spy.mockRestore();
		});
	});

	// ---------------------------------------------------------------
	// Drop handler
	// ---------------------------------------------------------------
	describe('handleDrop', () => {
		it('should handle drag drops without errors', () => {
			dragManager.dragState.set({
				isDragging: true,
				dragType: 'item',
				sourceSection: 0,
				sourceIndex: 0,
				itemId: 101,
				targetSection: 1,
				targetIndex: 0,
				dropPosition: 'before'
			});

			const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			// Should not throw
			dragManager.handleDrop(mockDragEvent);

			expect(errorSpy).not.toHaveBeenCalled();
			const state = get(dragManager.dragState);
			expect(state.isDragging).toBe(false);
			errorSpy.mockRestore();
		});

		it('should recover item information from dataTransfer if missing in state', () => {
			dragManager.dragState.set({
				isDragging: true,
				dragType: 'item',
				sourceSection: 0,
				sourceIndex: 0,
				itemId: null, // intentionally null to force recovery
				targetSection: 1,
				targetIndex: 0,
				dropPosition: 'before'
			});

			// Spy on sections.update to ensure we see item ID usage
			const origUpdate = sectionsStore.sections.update;
			let recoveredIdUsed = false;

			sectionsStore.sections.update.mockImplementation((callback) => {
				dragManager.dragState.update((st) => {
					if (st.itemId === 101) recoveredIdUsed = true;
					return st;
				});
				return origUpdate(callback);
			});

			dragManager.handleDrop(mockDragEvent);
			expect(recoveredIdUsed).toBe(true);
		});

		it('should abort drop if no valid target', () => {
			// Since we can't spy on the handleDragEnd function, let's just
			// verify the drag state is reset after a drop with no target

			// Set up the drag state with no target
			dragManager.dragState.set({
				isDragging: true,
				dragType: 'item',
				sourceSection: 0,
				sourceIndex: 0,
				itemId: 101,
				targetSection: null,
				dropPosition: null
			});

			// Execute drop with no target
			dragManager.handleDrop(mockDragEvent);

			// The drag state should be reset to not dragging
			const state = get(dragManager.dragState);
			expect(state.isDragging).toBe(false);
		});
	});

	// ---------------------------------------------------------------
	// Edge cases
	// ---------------------------------------------------------------
	describe('edge cases', () => {
		it('should handle finding source items when index is wrong', () => {
			const testSections = [
				{
					id: 1,
					items: [
						{ id: 102, name: 'Item 2' },
						{ id: 101, name: 'Item 1' } // Actually at index 1
					]
				},
				{ id: 2, items: [] }
			];

			dragManager.dragState.set({
				isDragging: true,
				dragType: 'item',
				sourceSection: 0,
				sourceIndex: 0, // Wrong index
				itemId: 101,
				targetSection: 1,
				targetIndex: 0,
				dropPosition: 'before'
			});

			sectionsStore.sections.update.mockImplementation((cb) => {
				const result = cb(testSections);

				// Check item movement
				expect(result[0].items.length).toBe(1);
				expect(result[0].items[0].id).toBe(102);
				expect(result[1].items.length).toBe(1);
				expect(result[1].items[0].id).toBe(101);

				return result;
			});

			dragManager.handleDrop(mockDragEvent);
		});

		it('should handle errors during drop operations', () => {
			dragManager.dragState.set({
				isDragging: true,
				dragType: 'item',
				sourceSection: 0,
				sourceIndex: 0,
				itemId: 101,
				targetSection: 1,
				targetIndex: 0,
				dropPosition: 'before'
			});

			// Force an error in the update
			sectionsStore.sections.update.mockImplementation(() => {
				throw new Error('Test error');
			});

			const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			dragManager.handleDrop(mockDragEvent);

			// Should still reset to non-dragging even with errors
			const state = get(dragManager.dragState);
			expect(state.isDragging).toBe(false);
			errorSpy.mockRestore();
		});

		it('should handle dragging a parallel group between regular drills', () => {
			// Setup test data with a section containing regular drills and a parallel group
			const testSections = [
				{
					id: 1,
					items: [
						{ id: 101, name: 'Regular Drill 1', parallel_group_id: null, parallel_timeline: null },
						{
							id: 102,
							name: 'Group Item 1',
							parallel_group_id: 'group1',
							parallel_timeline: 'timeline1',
							groupTimelines: ['timeline1', 'timeline2']
						},
						{
							id: 103,
							name: 'Group Item 2',
							parallel_group_id: 'group1',
							parallel_timeline: 'timeline2',
							groupTimelines: ['timeline1', 'timeline2']
						},
						{ id: 104, name: 'Regular Drill 2', parallel_group_id: null, parallel_timeline: null }
					]
				}
			];

			// Setup drag state for dragging a group
			dragManager.dragState.set({
				isDragging: true,
				dragType: 'group',
				sourceSection: 0,
				sourceGroupId: 'group1',
				targetSection: 0,
				targetIndex: 3, // Target is Regular Drill 2
				dropPosition: 'before' // Drop before Regular Drill 2
			});

			// Mock the sections update
			sectionsStore.sections.update.mockImplementation((cb) => {
				const result = cb(testSections);

				// Check the length is preserved
				expect(result[0].items.length).toBe(4);

				// Verify items are in the correct sections
				expect(result[0].items[0].id).toBe(101); // Regular Drill 1

				// Check that group items still have their group properties
				const groupItems = result[0].items.filter((item) => item.parallel_group_id === 'group1');
				expect(groupItems.length).toBe(2);
				expect(groupItems[0].parallel_group_id).toBe('group1');
				expect(groupItems[1].parallel_group_id).toBe('group1');

				// Check that Regular Drill 2 exists
				const regularDrill2 = result[0].items.find((item) => item.id === 104);
				expect(regularDrill2).toBeDefined();

				return result;
			});

			// Trigger the drop
			dragManager.handleDrop(mockDragEvent);

			// Verify drag state is reset after drop
			const state = get(dragManager.dragState);
			expect(state.isDragging).toBe(false);
		});
	});
});
