describe('Pagination Controls', () => {
  const drillsUrl = '/drills';
  const formationsUrl = '/formations';
  const apiDrills = '/api/drills*';
  const apiFormations = '/api/formations*';

  const testPagination = (url, apiAlias, itemSelector) => {
    cy.intercept('GET', url === drillsUrl ? apiDrills : apiFormations).as(apiAlias);
    cy.visit(url);
    cy.wait(`@${apiAlias}`);
    cy.wait(300); // UI stabilization

    // Assuming enough items exist to have multiple pages
    cy.get('[data-testid="pagination-controls"]').should('be.visible');

    // Store the first item's text/ID on page 1
    let firstItemPage1;
    cy.get(`${itemSelector}:first`).then(($el) => {
      firstItemPage1 = $el.text();
    });

    // Go to next page
    cy.get('[data-testid="pagination-next-button"]').click();
    cy.wait(`@${apiAlias}`);
    cy.url().should('include', 'page=2');
    cy.get('[data-testid="pagination-current-page"]').should('contain.text', '2');

    // Verify content changed
    cy.get(`${itemSelector}:first`).should(($el) => {
        expect($el.text()).not.to.eq(firstItemPage1);
    });


    // Go back to previous page
    cy.get('[data-testid="pagination-prev-button"]').click();
    cy.wait(`@${apiAlias}`);
    cy.url().should('satisfy', url => !url.includes('page=2')); // Page 1 might remove param or set page=1
    cy.url().should('include', 'page=1');
    cy.get('[data-testid="pagination-current-page"]').should('contain.text', '1');

    // Verify content is back to page 1's first item
     cy.get(`${itemSelector}:first`).should(($el) => {
       expect($el.text()).to.eq(firstItemPage1);
     });

    // Check button states on page 1
    cy.get('[data-testid="pagination-prev-button"]').should('be.disabled');
    cy.get('[data-testid="pagination-next-button"]').should('not.be.disabled'); // Assuming more than 1 page

    // Consider adding tests for first/last page buttons if they exist
    // cy.get('[data-testid="pagination-last-button"]').click();
    // cy.wait(`@${apiAlias}`);
    // check URL and button states (next disabled)
    // cy.get('[data-testid="pagination-first-button"]').click();
    // cy.wait(`@${apiAlias}`);
    // check URL and button states (prev disabled)
  };

  it('should work correctly on Drills page', () => {
    testPagination(drillsUrl, 'getDrills', '[data-testid="drill-card"]');
  });

  it('should work correctly on Formations page', () => {
    testPagination(formationsUrl, 'getFormations', '[data-testid="formation-card"]');
  });
}); 