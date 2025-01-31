import { json } from '@sveltejs/kit';
import { createClient } from '@vercel/postgres';
import { PREDEFINED_SKILLS } from '$lib/constants/skills';

const client = createClient();
await client.connect();

function standardizeSkill(skill) {
  // Convert to proper case (capitalize first letter of each word)
  return skill.toLowerCase().split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

export async function GET() {
  try {
    // Fetch user-added skills with their usage counts
    const userSkillsResult = await client.query('SELECT skill, usage_count FROM skills ORDER BY usage_count DESC');
    const userSkills = userSkillsResult.rows;
    
    // Combine with predefined skills (assuming predefined skills are not stored in the DB)
    const combinedSkills = PREDEFINED_SKILLS.map(skill => ({
      skill,
      usage_count: userSkills.find(us => us.skill === skill)?.usage_count || 0,
      isPredefined: true
    })).concat(
      userSkills
        .filter(us => !PREDEFINED_SKILLS.includes(us.skill))
        .map(us => ({ skill: us.skill, usage_count: us.usage_count, isPredefined: false }))
    );
    
    return json(combinedSkills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    return json({ error: 'Failed to retrieve skills' }, { status: 500 });
  }
}

export async function POST({ request }) {
  const { skill: rawSkill, drillId } = await request.json();
  const skill = standardizeSkill(rawSkill);
  
  try {
    const isPredefined = PREDEFINED_SKILLS.includes(skill);
    
    if (isPredefined) {
      await client.query(
        `UPDATE skills SET 
         usage_count = usage_count + 1
         WHERE skill = $1`,
        [skill]
      );
    } else {
      await client.query(
        `INSERT INTO skills (skill, drills_used_in, usage_count) 
         VALUES ($1, 1, 1) 
         ON CONFLICT (skill) DO UPDATE SET 
         drills_used_in = skills.drills_used_in + 1,
         usage_count = skills.usage_count + 1`,
        [skill]
      );
    }
    
    return json({ success: true });
  } catch (error) {
    console.error('Error adding skill:', error);
    return json({ error: 'Failed to add skill' }, { status: 500 });
  }
}
