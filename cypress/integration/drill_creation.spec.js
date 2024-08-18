describe('Drill Creation', () => {
  it('should create a new drill and verify its existence', () => {
    cy.visit('/drills/create');

    cy.get('input#name').type('Test Drill');
    cy.get('input#briefDescription').type('A brief description of the test drill');
    cy.get('textarea#detailedDescription').type('A detailed description of the test drill');
    cy.get('input#skillLevel').type('Beginner');
    cy.get('input#complexity').type('Low');
    cy.get('input#suggestedLength').type('10 minutes');
    cy.get('input#numberOfPeople').type('5');
    cy.get('input#skillsFocusedOn').type('Passing, Shooting');
    cy.get('input#positionsFocusedOn').type('Forward, Midfield');
    cy.get('input#videoLink').type('http://example.com/video');
    cy.get('input#images').attachFile('path/to/image1.jpg');
    cy.get('input#images').attachFile('path/to/image2.jpg');

    cy.get('button[type="submit"]').click();

    cy.visit('/drills');
    cy.contains('Test Drill').should('exist');
  });
});
