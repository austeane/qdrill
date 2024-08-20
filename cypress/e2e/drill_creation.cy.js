describe('Drill Creation', () => {
  it('should create a new drill and verify its existence', () => {
    cy.visit('/drills/create');

    cy.get('input#name').type('Test Drill');
    cy.get('input#brief_description').type('A brief description of the test drill');
    cy.get('textarea#detailed_description').type('A detailed description of the test drill');
    cy.get('input#skill_level').type('Beginner');
    cy.get('input#complexity').type('Low');
    cy.get('input#suggested_length').type('10 minutes');
    cy.get('input#number_of_people').type('5');
    cy.get('input#skills_focused_on').type('Passing, Shooting');
    cy.get('input#positions_focused_on').type('Forward, Midfield');
    cy.get('input#video_link').type('http://example.com/video');

    cy.get('button[type="submit"]').click();

    cy.visit('/drills');
    cy.contains('Test Drill').should('exist');
  });
});
