// cypress/e2e/sorting.cy.js

describe('Sorting Controls', () => {
	const drillsUrl = '/drills';
	const formationsUrl = '/formations';
	const apiDrills = '/api/drills*';
	const apiFormations = '/api/formations*';

	// Helper to get text from a list of elements for comparison
	const getItemsText = (selector) => {
		const texts = [];
		return cy
			.get(selector)
			.each(($el) => texts.push($el.text().trim().toLowerCase()))
			.then(() => texts);
	};

	const testSorting = (url, apiAlias, itemSelector, nameSelector, dateSelector) => {
		cy.intercept('GET', url === drillsUrl ? apiDrills : apiFormations).as(apiAlias);
		cy.visit(url);
		cy.wait(`@${apiAlias}`);
		cy.wait(300); // UI stabilization

		// --- Test Sort by Name ---
		cy.log('Testing Sort by Name');
		cy.get('[data-testid="sort-select"]').select('name');
		cy.wait(`@${apiAlias}`);
		cy.url().should('include', 'sort=name');
		cy.url().should('not.include', 'order=desc'); // Default is asc

		// Check Ascending Order
		getItemsText(nameSelector).then((namesAsc) => {
			expect(namesAsc).to.deep.equal([...namesAsc].sort());
		});

		// Toggle to Descending Order
		cy.get('[data-testid="sort-order-toggle"]').click();
		cy.wait(`@${apiAlias}`);
		cy.url().should('include', 'order=desc');

		// Check Descending Order
		getItemsText(nameSelector).then((namesDesc) => {
			expect(namesDesc).to.deep.equal([...namesDesc].sort().reverse());
		});

		// Toggle back to Ascending
		cy.get('[data-testid="sort-order-toggle"]').click();
		cy.wait(`@${apiAlias}`);
		cy.url().should('not.include', 'order=desc');

		// --- Test Sort by Date Created (if applicable) ---
		if (dateSelector) {
			cy.log('Testing Sort by Date Created');
			// Assuming 'date_created' or similar is the value in the select
			cy.get('[data-testid="sort-select"]').select('date_created');
			cy.wait(`@${apiAlias}`);
			cy.url().should('include', 'sort=date_created');
			cy.url().should('not.include', 'order=desc'); // Default asc (oldest first)

			// Check Ascending Order (Oldest first - harder to verify exactly without dates, check basic change)
			let firstItemDateAsc;
			cy.get(`${itemSelector}:first ${dateSelector}`).then(
				($el) => (firstItemDateAsc = $el.text())
			);

			// Toggle to Descending Order (Newest first)
			cy.get('[data-testid="sort-order-toggle"]').click();
			cy.wait(`@${apiAlias}`);
			cy.url().should('include', 'order=desc');

			// Check Descending Order (Newest first - first item should change)
			cy.get(`${itemSelector}:first ${dateSelector}`).should(($el) => {
				expect($el.text()).not.to.eq(firstItemDateAsc); // Basic check that order changed
			});
		}

		// Reset to default sort if necessary
		// cy.get('[data-testid="sort-select"]').select('default_sort_option'); // Select the default
		// cy.get('[data-testid="sort-order-toggle"]').click(); // Ensure asc if default isn't asc
		// cy.wait(`@${apiAlias}`);
	};

	it('should sort Drills correctly', () => {
		// Assuming data-testid for name and date within the card
		testSorting(
			drillsUrl,
			'getDrills',
			'[data-testid="drill-card"]',
			'[data-testid="drill-card-name"]',
			'[data-testid="drill-card-date"]'
		);
	});

	it('should sort Formations correctly', () => {
		// Assuming data-testid for name and date within the card
		testSorting(
			formationsUrl,
			'getFormations',
			'[data-testid="formation-card"]',
			'[data-testid="formation-card-name"]',
			'[data-testid="formation-card-date"]'
		);
	});
});
