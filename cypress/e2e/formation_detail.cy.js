describe('Formation Detail Page', () => {
	// Use specific IDs provided by the user
	const publicFormationId = 8;
	// const privateFormationId = 'test-private-formation-id'; // Removed
	const invalidFormationId = 0;

	const logout = () => {
		cy.log('Logging out...');
		cy.clearCookie('session_id');
		cy.log('Placeholder logout complete.');
	};

	it('should load details for a public formation when logged out', () => {
		logout(); // Ensure logged out
		cy.visit(`/formations/${publicFormationId}`);
		cy.wait(500); // Allow load
		// Check for key elements of the formation detail page
		cy.get('[data-testid="formation-title"]').should('be.visible');
		cy.get('[data-testid="formation-description"]').should('be.visible');
		// According to performance.md, drills shouldn't be loaded initially
		cy.get('[data-testid="associated-drill-item"]').should('not.exist'); // Assuming a selector for listed drills
	});

	it('should show an error or redirect for an invalid formation ID', () => {
		logout();
		cy.visit(`/formations/${invalidFormationId}`, { failOnStatusCode: false }); // Allow potential 404
		// Check for expected error behavior:
		// Option 1: Error message on the page
		cy.contains(/Formation not found|Error loading formation/i).should('be.visible'); // Adjust text as needed
		// Option 2: Redirect to a 404 page or formations list
		// cy.url().should('match', /\/404|\/formations$/); // Adjust regex as needed
	});

	// Removed tests for private formations as requested
	// context('When Logged In', () => { ... });

	// Add tests for lazy-loading drills if that feature gets implemented
	// context('Lazy Loading Drills', () => {
	//    it('should load associated drills when requested', () => {
	//        cy.visit(`/formations/${publicFormationId}`);
	//        cy.get('[data-testid="load-drills-button"]').click(); // Assuming a trigger
	//        cy.wait(1000); // Wait for API call/rendering
	//        cy.get('[data-testid="associated-drill-item"]').should('have.length.greaterThan', 0);
	//    });
	// });
});
