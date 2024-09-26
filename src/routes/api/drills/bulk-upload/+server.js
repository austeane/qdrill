import { json } from '@sveltejs/kit';
import { parse } from 'csv-parse/sync';
import * as Yup from 'yup';
import { PREDEFINED_SKILLS } from '$lib/constants/skills';

// Constants mapping numbers to representations
const skillLevelMap = {
  '1': 'New to Sport',
  '2': 'Beginner',
  '3': 'Intermediate',
  '4': 'Advanced',
  '5': 'Expert'
};

const complexityMap = {
  '1': 'Low',
  '2': 'Medium',
  '3': 'High'
};

// Define your Yup schemas
const drillSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  brief_description: Yup.string().required('Brief description is required'),
  detailed_description: Yup.string().notRequired(),
  skill_level: Yup.array()
    .of(Yup.string().oneOf(Object.values(skillLevelMap), 'Invalid skill level'))
    .min(1, 'At least one skill level is required')
    .required('Skill level is required'),
  complexity: Yup.string()
    .oneOf(Object.values(complexityMap), 'Complexity must be Low, Medium, or High')
    .nullable(),
  suggested_length: Yup.object().shape({
    min: Yup.number()
      .positive('Suggested length min must be a positive integer')
      .integer('Suggested length min must be an integer')
      .required('Suggested length min is required'),
    max: Yup.number()
      .positive('Suggested length max must be a positive integer')
      .integer('Suggested length max must be an integer')
      .min(Yup.ref('min'), 'Suggested length max must be greater than or equal to min')
      .required('Suggested length max is required'),
  }),
  number_of_people: Yup.object().shape({
    min: Yup.number()
      .positive('Number of people min must be a positive integer')
      .integer('Number of people min must be an integer')
      .nullable(),
    max: Yup.number()
      .positive('Number of people max must be a positive integer')
      .integer('Number of people max must be an integer')
      .min(Yup.ref('min'), 'Number of people max must be greater than or equal to min')
      .nullable(),
  }),
  skills_focused_on: Yup.array()
    .of(Yup.string())
    .min(1, 'At least one skill is required')
    .required('Skills focused on is required'),
  positions_focused_on: Yup.array()
    .of(Yup.string().oneOf(['Chaser', 'Beater', 'Keeper', 'Seeker'], 'Invalid position'))
    .min(1, 'At least one position is required')
    .required('Positions focused on is required'),
  video_link: Yup.string()
    .url('Video link must be a valid URL')
    .nullable(),
  diagrams: Yup.array().of(Yup.string()).notRequired(),
});

export async function POST({ request }) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return json({ error: 'No file uploaded' }, { status: 400 });
    }

    const csvContent = await file.text();
    const records = parse(csvContent, { columns: true, skip_empty_lines: true });

    const parsedDrills = [];
    let validDrills = 0;
    let drillsWithErrors = 0;

    for (const [index, record] of records.entries()) {
      const drill = parseDrill(record);
      if (drill.errors.length === 0) {
        validDrills++;
      } else {
        drillsWithErrors++;
        drill.row = index + 2; // Assuming header is row 1
      }
      parsedDrills.push(drill);
    }

    return json({
      summary: {
        total: records.length,
        valid: validDrills,
        errors: drillsWithErrors
      },
      drills: parsedDrills
    });
  } catch (error) {
    console.error('Error processing bulk upload:', error);
    return json({ error: 'Failed to process bulk upload', details: error.toString() }, { status: 500 });
  }
}

function parseDrill(record) {
  const drill = {
    name: record['Name'],
    brief_description: record['Brief Description'],
    detailed_description: record['Detailed Description'],
    skill_level: parseArray(record['Skill Level (1:New to Sport; 2:Beginner; 3:Intermediate; 4:Advanced; 5:Expert)']).map(level => skillLevelMap[level] || level),
    complexity: record['Complexity (1:Low; 2:Medium; 3:High)'] ? complexityMap[record['Complexity (1:Low; 2:Medium; 3:High)']] : null,
    suggested_length: {
      min: parseInteger(record['Suggested Length Min']),
      max: parseInteger(record['Suggested Length Max'])
    },
    number_of_people: {
      min: parseInteger(record['Number of People Min']),
      max: parseInteger(record['Number of People Max'])
    },
    skills_focused_on: parseArray(record['Skills Focused On']).filter(skill => 
      PREDEFINED_SKILLS.includes(skill) || skill.trim() !== ''
    ),
    positions_focused_on: parseArray(record['Positions Focused On (Chaser; Beater; Keeper; Seeker)']),
    video_link: record['Video Link'],
    diagrams: parseDiagrams(record['Diagrams']),
    errors: []
  };

  validateDrill(drill);
  return drill;
}

function parseDiagrams(diagramsString) {
  if (!diagramsString) return [];
  try {
    const diagrams = JSON.parse(diagramsString);
    return Array.isArray(diagrams) ? diagrams : [diagrams];
  } catch (error) {
    console.error('Error parsing diagrams:', error);
    return [];
  }
}

function parseArray(value = '') {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(item => item !== '');
}

function parseInteger(value) {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}

async function validateDrill(drill) {
  try {
    await drillSchema.validate(drill, { abortEarly: false });
    drill.errors = [];
  } catch (err) {
    drill.errors = err.errors;
  }
}

// Map skill level descriptions back to numeric codes for editing
function mapSkillLevelsForEdit(skillLevels) {
  const inverseSkillLevelMap = Object.fromEntries(
    Object.entries(skillLevelMap).map(([key, value]) => [value, key])
  );
  return skillLevels.map(level => inverseSkillLevelMap[level] || level);
}