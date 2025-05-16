// cypress/e2e/formations_list.cy.js

describe('Formations List Page', () => {
	const formationsListUrl = '/formations';
	const apiFormations = '/api/formations*'; // Use wildcard for query params

	beforeEach(() => {
		// Setup intercept for API calls triggered by filters/sort/pagination
		// We don't wait for it here, as initial load might be server-side
		cy.intercept('GET', apiFormations).as('getFormations');

		// Visit the formations page before each test
		cy.visit(formationsListUrl);

		// Wait for the main heading to be visible, indicating basic page load
		cy.contains('h1', 'Formations').should('be.visible');

		// Add a small static wait for UI stabilization if needed after server-side render
		cy.wait(300);
	});

	it('should load the formations page correctly', () => {
		// Heading check moved to beforeEach
		// Check if the initial list of formations renders (assuming a data-testid)
		cy.get('[data-testid="formation-card"]').should('have.length.greaterThan', 0);
		cy.get('[data-testid="pagination-controls"]').should('be.visible');
	});

	it('should filter by formation type and update URL', () => {
		// Assuming filter structure similar to drills
		cy.get('[data-testid="filter-category-formationType"]').click({ force: true });
		cy.wait(300); // Wait for dropdown/panel to open
		cy.get('[data-testid="checkbox-control-offense"]').click(); // Example type

		// Now wait for the API call triggered by the filter change
		cy.wait('@getFormations');

		cy.url().should('include', 'formation_type=offense');
		// Check if results are filtered (might need specific data-testid on card)
		cy.get('[data-testid="formation-card-type"]').each(($el) => {
			cy.wrap($el).should('contain.text', 'Offense'); // Case might vary
		});
	});

	it('should filter by tags and update URL', () => {
		// Assuming filter structure
		cy.get('[data-testid="filter-category-tags"]').click({ force: true });
		cy.wait(300);
		// Update test: Click the specific tag button instead of typing into the div
		cy.get('[data-testid="tag-zone"]').click(); // Example tag click

		// Wait for the API call
		cy.wait('@getFormations');

		cy.url().should('include', 'tags=zone'); // Encoding might vary
		// Add assertions to check if results have the 'zone' tag if possible
		// e.g., cy.get('[data-testid="formation-card"]:first [data-testid="tag-zone"]').should('exist');
	});

	it('should search for formations and update URL', () => {
		const searchTerm = 'Specific Formation Name'; // Use a name known to exist
		cy.get('[data-testid="search-input"]').type(searchTerm);
		// Wait for debounce before API call is made
		cy.wait(400);
		cy.wait('@getFormations');

		cy.url().should('include', `q=${encodeURIComponent(searchTerm)}`);
		// Check if results contain the search term
		cy.get('[data-testid="formation-card-name"]').should('contain.text', searchTerm);
	});

	it('should sort formations by name and update URL', () => {
		cy.get('[data-testid="sort-select"]').select('name'); // Assuming a select dropdown for sorting
		cy.wait('@getFormations');

		cy.url().should('include', 'sort=name');
		// Add assertion to check the order if possible (e.g., check first item)

		// Toggle order
		cy.get('[data-testid="sort-order-toggle"]').click();
		cy.wait('@getFormations');
		cy.url().should('include', 'order=desc');
		// Add assertion to check descending order
	});

	it('should navigate pages using pagination', () => {
		// Assuming pagination controls have standard data-testids
		cy.get('[data-testid="pagination-next-button"]').click();
		cy.wait('@getFormations');

		cy.url().should('include', 'page=2');
		// Check if the page content has changed (e.g., first item is different)

		cy.get('[data-testid="pagination-prev-button"]').click();
		cy.wait('@getFormations');
		cy.url().should('not.include', 'page=2'); // Should likely go back to page 1 or remove param
		cy.url().should('include', 'page=1');
	});

	it('should reflect combined filters, sort, and page in URL', () => {
		// 1. Filter by type
		cy.get('[data-testid="filter-category-formationType"]').click({ force: true });
		cy.wait(300);
		cy.get('[data-testid="checkbox-control-offense"]').click();
		cy.wait('@getFormations');

		// 2. Sort by name descending
		cy.get('[data-testid="sort-select"]').select('name');
		cy.wait('@getFormations'); // Wait for sort change
		cy.get('[data-testid="sort-order-toggle"]').click();
		cy.wait('@getFormations'); // Wait for order change

		// 3. Go to page 2
		cy.get('[data-testid="pagination-next-button"]').click();
		cy.wait('@getFormations');

		// Check URL for all parameters
		cy.url()
			.should('include', 'formation_type=offense')
			.and('include', 'sort=name')
			.and('include', 'order=desc')
			.and('include', 'page=2');
	});
});
