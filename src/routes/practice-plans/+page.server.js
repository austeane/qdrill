import { createClient } from '@vercel/postgres';

export async function load() {
  const client = createClient();
  await client.connect();

  try {
    const practicePlansResult = await client.query('SELECT * FROM practice_plans');
    const practicePlans = practicePlansResult.rows;

    // Extract unique filter options
    const phaseOfSeasonSet = new Set();
    let minEstimatedParticipants = Infinity;
    let maxEstimatedParticipants = -Infinity;
    const practiceGoalsSet = new Set();

    practicePlans.forEach(plan => {
      if (plan.phase_of_season) {
        phaseOfSeasonSet.add(plan.phase_of_season);
      }

      if (plan.estimated_number_of_participants) {
        minEstimatedParticipants = Math.min(minEstimatedParticipants, plan.estimated_number_of_participants);
        maxEstimatedParticipants = Math.max(maxEstimatedParticipants, plan.estimated_number_of_participants);
      }

      if (plan.practice_goals) {
        if (Array.isArray(plan.practice_goals)) {
          plan.practice_goals.forEach(goal => practiceGoalsSet.add(goal));
        } else if (typeof plan.practice_goals === 'string') {
          plan.practice_goals.split(',').forEach(goal => practiceGoalsSet.add(goal.trim()));
        }
      }
    });

    return {
      practicePlans,
      filterOptions: {
        phaseOfSeason: Array.from(phaseOfSeasonSet),
        estimatedParticipants: {
          min: minEstimatedParticipants !== Infinity ? minEstimatedParticipants : null,
          max: maxEstimatedParticipants !== -Infinity ? maxEstimatedParticipants : null
        },
        practiceGoals: Array.from(practiceGoalsSet)
      }
    };
  } catch (error) {
    console.error('Error fetching practice plans:', error);
    return { error: 'Failed to fetch practice plans' };
  } finally {
    await client.end();
  }
}