import { practicePlanService } from './practicePlanService.js';
import { seasonService } from './seasonService.js';
import { seasonSectionService } from './seasonSectionService.js';
import { ValidationError } from '$lib/server/errors.js';

/**
 * Service for handling the union algorithm that combines:
 * 1. Season template practice plan
 * 2. Overlapping season sections' default sections
 * 3. Overlapping season sections' linked drills/formations
 */
class SeasonUnionService {
  /**
   * Create a draft practice plan for a specific date using the union algorithm
   * @param {string} seasonId - Season ID
   * @param {string} scheduledDate - Date for the practice (YYYY-MM-DD)
   * @param {string} userId - User creating the plan
   * @param {string} teamId - Team ID
   * @param {Object} options - Additional options for practice creation
   * @returns {Object} Created practice plan with sections and drills
   */
  async instantiatePracticePlan(seasonId, scheduledDate, userId, teamId, options = {}) {
    // Validate date is within season
    const season = await seasonService.getById(seasonId);
    const practiceDate = new Date(scheduledDate);
    
    console.log('Date validation:', {
      scheduledDate,
      practiceDate: practiceDate.toISOString(),
      seasonStart: season.start_date,
      seasonEnd: season.end_date,
      startCheck: practiceDate < new Date(season.start_date),
      endCheck: practiceDate > new Date(season.end_date)
    });
    
    if (practiceDate < new Date(season.start_date) || 
        practiceDate > new Date(season.end_date)) {
      throw new ValidationError('Practice date must be within season dates');
    }
    
    // Check if practice already exists for this date
    const existing = await practicePlanService.getByTeamAndDate(teamId, scheduledDate);
    if (existing) {
      throw new ValidationError('A practice plan already exists for this date');
    }
    
    // Get overlapping season sections
    const overlappingSections = await this.getOverlappingSections(seasonId, scheduledDate);
    
    // Build the union structure
    const unionData = await this.buildUnionStructure(
      season,
      overlappingSections,
      scheduledDate,
      teamId,
      options
    );
    
    // Create the practice plan with all content
    console.log('Creating practice plan with unionData:', JSON.stringify(unionData).substring(0, 500));
    const practicePlan = await practicePlanService.createWithContent(unionData, userId);
    console.log('Practice plan created in seasonUnionService:', practicePlan ? `ID: ${practicePlan.id}` : 'NULL');
    
    return practicePlan;
  }
  
  /**
   * Get all season sections that overlap with the given date
   */
  async getOverlappingSections(seasonId, date) {
    const sections = await seasonSectionService.getSeasonSections(seasonId);
    
    return sections.filter(section => {
      const practiceDate = new Date(date);
      const sectionStart = new Date(section.start_date);
      const sectionEnd = new Date(section.end_date);
      
      return practiceDate >= sectionStart && practiceDate <= sectionEnd;
    });
  }
  
  /**
   * Build the union structure combining template and section data
   */
  async buildUnionStructure(season, overlappingSections, scheduledDate, teamId, options = {}) {
    // Get team default start time
    const { teamService } = await import('./teamService.js');
    const team = await teamService.getById(teamId);
    
    const practiceTypeName = options.practiceType === 'scrimmage' ? 'Scrimmage' :
                             options.practiceType === 'tournament' ? 'Tournament' :
                             options.practiceType === 'training' ? 'Training' : 'Practice';
    
    const unionData = {
      team_id: teamId,
      season_id: season.id,
      scheduled_date: scheduledDate,
      status: 'draft',
      is_template: false,
      template_plan_id: season.template_practice_plan_id,
      is_edited: false,
      name: `${practiceTypeName} - ${new Date(scheduledDate).toLocaleDateString()}`,
      description: `Generated ${practiceTypeName.toLowerCase()} plan for ${new Date(scheduledDate).toLocaleDateString()}`,
      start_time: options.startTime || team?.default_start_time || '18:00:00',
      visibility: 'private', // Team practices are private by default
      practice_type: options.practiceType || 'regular',
      sections: [],
      drills: []
    };
    
    // Step 1: Start with template plan if exists
    if (season.template_practice_plan_id) {
      const template = await practicePlanService.getByIdWithContent(
        season.template_practice_plan_id
      );
      
      if (template) {
        unionData.sections = this.cloneSections(template.sections);
        unionData.drills = this.cloneDrills(template.drills);
        unionData.name = template.name + ` - ${new Date(scheduledDate).toLocaleDateString()}`;
        unionData.description = template.description;
        unionData.practice_goals = template.practice_goals;
        unionData.phase_of_season = template.phase_of_season;
        unionData.estimated_number_of_participants = template.estimated_number_of_participants;
      }
    }
    
    // Step 2: Add/merge default sections from overlapping season sections
    // Only if seedDefaultSections is true (or undefined for backward compatibility)
    // Keep track of default sections for drill assignment
    const defaultSectionsBySection = new Map();
    
    const shouldSeedDefaults = options.seedDefaultSections !== false;
    
    if (shouldSeedDefaults) {
      for (const section of overlappingSections) {
      const defaultSections = await seasonSectionService.getDefaultSections(section.id);
      defaultSectionsBySection.set(section.id, defaultSections);
      
      for (const defaultSection of defaultSections) {
        // Check if section already exists (by name)
        const existingIndex = unionData.sections.findIndex(
          s => s.name.toLowerCase() === defaultSection.section_name.toLowerCase()
        );
        
        if (existingIndex === -1) {
          // Add new section
          unionData.sections.push({
            name: defaultSection.section_name,
            order: defaultSection.order ?? unionData.sections.length,
            goals: defaultSection.goals || [],
            notes: defaultSection.notes || `From season section: ${section.name}`
          });
        } else {
          // Merge goals and notes
          const existing = unionData.sections[existingIndex];
          existing.goals = [...new Set([
            ...(existing.goals || []),
            ...(defaultSection.goals || [])
          ])];
          
          if (defaultSection.notes) {
            existing.notes = existing.notes 
              ? `${existing.notes}\n${defaultSection.notes}`
              : defaultSection.notes;
          }
        }
      }
    }
  }
    
    // Step 3: Add linked drills/formations from overlapping season sections
    const drillsToAdd = [];
    
    for (const section of overlappingSections) {
      const linkedDrills = await seasonSectionService.getLinkedDrills(section.id);
      const defaultSections = defaultSectionsBySection.get(section.id) || [];
      
      for (const linkedDrill of linkedDrills) {
        const drillData = {
          type: linkedDrill.type,
          drill_id: linkedDrill.drill_id,
          formation_id: linkedDrill.formation_id,
          name: linkedDrill.name || linkedDrill.drill_name || linkedDrill.formation_name,
          duration: linkedDrill.default_duration_minutes || 30,
          order_in_plan: drillsToAdd.length + unionData.drills.length,
          section_id: null // Will be assigned based on default_section_id
        };
        
        // If linked to a default section, find the matching section
        if (linkedDrill.default_section_id) {
          const defaultSection = defaultSections.find(
            ds => ds.id === linkedDrill.default_section_id
          );
          
          if (defaultSection) {
            const targetSection = unionData.sections.find(
              s => s.name.toLowerCase() === defaultSection.section_name.toLowerCase()
            );
            
            if (targetSection) {
              drillData.section_name = targetSection.name;
            }
          }
        }
        
        drillsToAdd.push(drillData);
      }
    }
    
    // Merge drills, avoiding exact duplicates
    for (const drill of drillsToAdd) {
      const isDuplicate = unionData.drills.some(existing => 
        existing.type === drill.type &&
        existing.drill_id === drill.drill_id &&
        existing.formation_id === drill.formation_id
      );
      
      if (!isDuplicate) {
        unionData.drills.push(drill);
      }
    }
    
    // Step 4: Sort sections and drills by order
    unionData.sections.sort((a, b) => (a.order || 0) - (b.order || 0));
    unionData.drills.sort((a, b) => (a.order_in_plan || 0) - (b.order_in_plan || 0));
    
    return unionData;
  }
  
  /**
   * Clone sections for union (deep copy)
   */
  cloneSections(sections) {
    return sections.map(section => ({
      name: section.name,
      order: section.order,
      goals: [...(section.goals || [])],
      notes: section.notes
    }));
  }
  
  /**
   * Clone drills for union (deep copy)
   */
  cloneDrills(drills) {
    return drills.map(drill => ({
      type: drill.type,
      drill_id: drill.drill_id,
      formation_id: drill.formation_id,
      name: drill.name,
      duration: drill.duration || drill.selected_duration || 30,
      order_in_plan: drill.order_in_plan,
      section_id: drill.section_id,
      parallel_group_id: drill.parallel_group_id,
      parallel_timeline: drill.parallel_timeline,
      group_timelines: drill.group_timelines ? [...drill.group_timelines] : null
    }));
  }
  
  /**
   * Batch generate practice plans for a date range
   */
  async batchGeneratePractices(seasonId, startDate, endDate, userId, teamId) {
    const results = {
      created: [],
      skipped: [],
      errors: []
    };
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      
      try {
        // Check if already exists
        const existing = await practicePlanService.getByTeamAndDate(teamId, dateStr);
        if (existing) {
          results.skipped.push({
            date: dateStr,
            reason: 'Already exists',
            planId: existing.id
          });
          continue;
        }
        
        // Check if any sections overlap this date
        const overlapping = await this.getOverlappingSections(seasonId, dateStr);
        if (overlapping.length === 0) {
          results.skipped.push({
            date: dateStr,
            reason: 'No overlapping sections'
          });
          continue;
        }
        
        // Generate the practice
        const plan = await this.instantiatePracticePlan(
          seasonId,
          dateStr,
          userId,
          teamId
        );
        
        results.created.push({
          date: dateStr,
          planId: plan.id,
          name: plan.name
        });
      } catch (error) {
        results.errors.push({
          date: dateStr,
          error: error.message
        });
      }
    }
    
    return results;
  }
}

export const seasonUnionService = new SeasonUnionService();