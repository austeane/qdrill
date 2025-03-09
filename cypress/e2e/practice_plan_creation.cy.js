describe('Practice Plan Creation', () => {
  it('should create a practice plan with drills from cart', () => {
    // First visit the drills page
    cy.visit('/drills');
    
    // Add 5 drills to the cart
    cy.get('.border.border-gray-200.bg-white.rounded-lg').first().within(() => {
      cy.get('button').contains('Add to Practice Plan').click();
    });
    
    cy.get('.border.border-gray-200.bg-white.rounded-lg').eq(1).within(() => {
      cy.get('button').contains('Add to Practice Plan').click();
    });
    
    cy.get('.border.border-gray-200.bg-white.rounded-lg').eq(2).within(() => {
      cy.get('button').contains('Add to Practice Plan').click();
    });
    
    cy.get('.border.border-gray-200.bg-white.rounded-lg').eq(3).within(() => {
      cy.get('button').contains('Add to Practice Plan').click();
    });
    
    cy.get('.border.border-gray-200.bg-white.rounded-lg').eq(4).within(() => {
      cy.get('button').contains('Add to Practice Plan').click();
    });
    
    // Directly navigate to the create practice plan page
    cy.visit('/practice-plans/create');
    
    // Verify that the practice plan sections are visible
    cy.get('.practice-plan-sections').should('be.visible');
    
    // There should be drill items in the practice plan
    cy.get('[data-testid="drill-item"]').should('have.length.at.least', 1);
  });
});