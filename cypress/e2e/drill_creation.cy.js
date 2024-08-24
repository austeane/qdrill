describe('Drill Creation', () => {
  it('should create a new drill and verify its existence', () => {
    cy.visit('/drills/create');

    cy.get('input#name').type('Test Drill');
    cy.get('input#brief_description').type('A brief description of the test drill');
    cy.get('textarea#detailed_description').type('A detailed description of the test drill');
    cy.get('select#skill_level').select(['Beginner', 'Intermediate']);
    cy.get('select#complexity').select('Low');
    cy.get('select#suggested_length').select('5-15 minutes');
    cy.get('input#number_of_people_min').type('3');
    cy.get('input#number_of_people_max').type('10');
    cy.get('select#skills_focused_on').select(['Passing', 'Shooting']);
    cy.get('select#positions_focused_on').select(['Forward', 'Midfield']);
    cy.get('input#video_link').type('http://example.com/video');

    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/drills/');
    cy.contains('Test Drill').should('exist');
  });

  it('should verify single and multi-choice dropdowns are visually distinct', () => {
    cy.visit('/drills/create');

    cy.get('select#skill_level').should('have.css', 'border', '2px solid blue');
    cy.get('select#complexity').should('have.css', 'border', '2px solid green');
    cy.get('select#suggested_length').should('have.css', 'border', '2px solid green');
    cy.get('select#skills_focused_on').should('have.css', 'border', '2px solid blue');
    cy.get('select#positions_focused_on').should('have.css', 'border', '2px solid blue');
  });

  it('should change the color of multi-select buttons when selected', () => {
    cy.visit('/drills/create');

    cy.get('.skill-level-button').contains('Beginner').click();
    cy.get('.skill-level-button').contains('Beginner').should('have.class', 'selected');

    cy.get('.position-button').contains('Forward').click();
    cy.get('.position-button').contains('Forward').should('have.class', 'selected');
  });
});
