export async function load({ fetch }) {
    try {
      const response = await fetch('/api/drills');
      const drills = await response.json();
  
      // Create Sets with normalized values
      const skillLevelSet = new Set();
      const complexitySet = new Set();
      const skillsFocusedSet = new Set();
      const positionsFocusedSet = new Set();
      let minNumberOfPeople = Infinity;
      let maxNumberOfPeople = -Infinity;
      let minSuggestedLength = Infinity;
      let maxSuggestedLength = -Infinity;
      const drillTypeSet = new Set();
  
      drills.forEach(drill => {
        // Normalize and add skill levels
        drill.skill_level?.forEach(level => {
          skillLevelSet.add(normalizeString(level));
        });
  
        // Normalize and add complexity
        if (drill.complexity) {
          complexitySet.add(normalizeString(drill.complexity));
        }
  
        // Normalize and add skills
        drill.skills_focused_on?.forEach(skill => {
          skillsFocusedSet.add(normalizeString(skill));
        });
  
        // Normalize and add positions
        drill.positions_focused_on?.forEach(pos => {
          positionsFocusedSet.add(normalizeString(pos));
        });
  
        // Number of People
        if (drill.number_of_people_min < minNumberOfPeople) {
          minNumberOfPeople = drill.number_of_people_min;
        }
        if (drill.number_of_people_max > maxNumberOfPeople) {
          maxNumberOfPeople = drill.number_of_people_max;
        }
  
        // Suggested Length
        const length = parseInt(drill.suggested_length, 10);
        if (!isNaN(length)) {
          if (length < minSuggestedLength) {
            minSuggestedLength = length;
          }
          if (length > maxSuggestedLength) {
            maxSuggestedLength = length;
          }
        }
  
        // Drill Types
        if (Array.isArray(drill.drill_type)) {
          drill.drill_type.forEach(type => drillTypeSet.add(type));
        }
      });
  
      return {
        drills,
        filterOptions: {
          skillLevels: Array.from(skillLevelSet).sort(),
          complexities: Array.from(complexitySet).sort(),
          skillsFocusedOn: Array.from(skillsFocusedSet).sort(),
          positionsFocusedOn: Array.from(positionsFocusedSet).sort(),
          numberOfPeopleOptions: {
            min: minNumberOfPeople !== Infinity ? minNumberOfPeople : null,
            max: maxNumberOfPeople !== -Infinity ? maxNumberOfPeople : null
          },
          suggestedLengths: {
            min: minSuggestedLength !== Infinity ? minSuggestedLength : null,
            max: maxSuggestedLength !== -Infinity ? maxSuggestedLength : null
          },
          drillTypes: Array.from(drillTypeSet),
        }
      };
    } catch (error) {
      console.error('Error fetching drills:', error);
      return {
        status: 500,
        error: 'Failed to fetch drills'
      };
    }
}

function normalizeString(str) {
  return str?.toLowerCase().trim() || '';
}