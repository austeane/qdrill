describe('Drill Creation', () => {
  it('should create a new drill and verify its existence', () => {
    cy.visit('/drills/create');

    cy.get('input#name').type('Test Drill');
    cy.get('input#brief_description').type('A brief description of the test drill');
    cy.get('textarea#detailed_description').type('A detailed description of the test drill');
    cy.get('select#skill_level').select('Beginner');
    cy.get('select#complexity').select('Low');
    cy.get('select#suggested_length').select('5-15');
    cy.get('input#number_of_people_min').type('3');
    cy.get('input#number_of_people_max').type('10');
    cy.get('select#skills_focused_on').select(['Passing', 'Shooting']);
    cy.get('select#positions_focused_on').select(['Forward', 'Midfield']);
    cy.get('input#video_link').type('http://example.com/video');

    cy.get('button[type="submit"]').click();

    cy.visit('/drills');
    cy.contains('Test Drill').should('exist');
  });
});
