import DrillItem from '../../src/components/practice-plan/items/DrillItem.svelte';

describe('<DrillItem />', () => {
	beforeEach(() => {
		// Intercept the API call that causes the DB connection issue
		cy.intercept('GET', '/api/feedback', { statusCode: 200, body: [] }).as('getFeedback');
	});

	it('renders the drill name, duration input, and remove button', () => {
		const mockItem = {
			id: 'drill-123',
			name: 'Test Drill Item',
			duration: 15,
			selected_duration: null // or provide a value if needed
			// Add other properties if the component strictly requires them for rendering
		};
		const mockOnRemove = cy.spy().as('removeHandler'); // Create a Cypress spy

		cy.mount(DrillItem, {
			props: {
				item: mockItem,
				itemIndex: 0,
				sectionIndex: 0,
				onRemove: mockOnRemove
			}
		});

		// Assertions
		cy.contains(mockItem.name).should('be.visible');
		cy.get('input[type="number"]').should('have.value', mockItem.duration.toString());
		cy.contains('button', 'Remove').should('be.visible');
		cy.get('[data-testid="drill-item"]').should('have.attr', 'data-item-id', mockItem.id);
		cy.get('[data-testid="drill-item"]').should('have.attr', 'data-item-name', mockItem.name);

		// Optional: Test clicking the remove button
		cy.contains('button', 'Remove').click();
		cy.get('@removeHandler').should('have.been.calledOnce');
	});

	// Add more tests here for different props, states, or interactions
});
