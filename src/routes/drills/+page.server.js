export async function load({ fetch }) {
    try {
      const response = await fetch('/api/drills');
      if (!response.ok) {
        throw new Error('Failed to fetch drills');
      }
      const drills = await response.json();
  
      // Extract unique filter options
      const skillLevelSet = new Set();
      const complexitySet = new Set();
      const skillsFocusedSet = new Set();
      const positionsFocusedSet = new Set();
      let minNumberOfPeople = Infinity;
      let maxNumberOfPeople = -Infinity;
      let minSuggestedLength = Infinity;
      let maxSuggestedLength = -Infinity;
  
      drills.forEach(drill => {
        // Skill Levels
        drill.skill_level.forEach(level => skillLevelSet.add(level));
  
        // Complexities
        if (drill.complexity) complexitySet.add(drill.complexity);
  
        // Skills Focused On
        if (Array.isArray(drill.skills_focused_on)) {
          drill.skills_focused_on.forEach(skill => skillsFocusedSet.add(skill));
        }
  
        // Positions Focused On
        if (Array.isArray(drill.positions_focused_on)) {
          drill.positions_focused_on.forEach(pos => positionsFocusedSet.add(pos));
        }
  
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
      });
  
      return {
        drills,
        filterOptions: {
          skillLevels: Array.from(skillLevelSet),
          complexities: Array.from(complexitySet),
          skillsFocusedOn: Array.from(skillsFocusedSet),
          positionsFocusedOn: Array.from(positionsFocusedSet),
          numberOfPeopleOptions: {
            min: minNumberOfPeople !== Infinity ? minNumberOfPeople : null,
            max: maxNumberOfPeople !== -Infinity ? maxNumberOfPeople : null
          },
          suggestedLengths: {
            min: minSuggestedLength !== Infinity ? minSuggestedLength : null,
            max: maxSuggestedLength !== -Infinity ? maxSuggestedLength : null
          }
        }
      };
    } catch (error) {
      console.error('Error fetching drills:', error);
      return {
        status: 500,
        error: new Error('Internal Server Error')
      };
    }
  }