describe('Drills List Page', () => {
	beforeEach(() => {
		// Visit the drills page before each test
		cy.visit('/drills');
	});

	it('should load the drills page correctly', () => {
		// Check for a key element, like the main heading
		cy.contains('h1', 'Drills').should('be.visible');
		// Check if the initial list of drills renders
		cy.get('[data-testid="drill-card"]').should('have.length.greaterThan', 0);
	});

	it('should update the URL when a filter is applied', () => {
		// Add initial wait for page stabilization
		cy.wait(500);
		// Example: Click on a skill level filter

		// 1. Click the category button (using force and wait)
		cy.get('[data-testid="filter-category-skillLevels"]')
			.should('be.visible')
			.click({ force: true });

		// 1a. Add a wait for reactivity
		cy.wait(500);

		// 2. Click the inner control div of the checkbox using its data-testid
		cy.get('[data-testid="checkbox-control-beginner"]')
			.should('be.visible') // Ensure it's visible now
			.click();

		// 2a. Wait for the debounced filter update to trigger navigation
		cy.wait(400);

		// 3. Check if the URL now includes the expected filter parameter
		cy.url({ timeout: 10000 }).should('include', 'skillLevel%5B%5D=beginner'); // Expect lowercase 'beginner'
	});
});
