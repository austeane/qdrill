import { BaseEntityService } from './baseEntityService.js';

/**
 * Service for managing formations
 * Extends the BaseEntityService with formation-specific functionality
 */
export class FormationService extends BaseEntityService {
  /**
   * Creates a new FormationService
   */
  constructor() {
    // Define allowed columns for the formations table
    const allowedFormationColumns = [
      'name',
      'brief_description',
      'detailed_description',
      'diagrams',
      'tags',
      'is_editable_by_others',
      'visibility',
      'formation_type',
      'created_by',
      'created_at',
      'updated_at'
    ];
    
    super('formations', 'id', ['*'], allowedFormationColumns, { 
      diagrams: 'json', 
      tags: 'array' 
    });
  }

  /**
   * Get formations with optional filtering/pagination
   * Overrides base getAll to include additional formation-specific logic
   */
  async getAll(options = {}) {
    const result = await super.getAll(options);
    return result;
  }
  
  /**
   * Create a new formation
   * @param {Object} formationData - Formation data
   * @param {number|null} userId - User ID creating the formation (null if anonymous)
   * @returns {Promise<Object>} - The created formation
   */
  async createFormation(formationData, userId = null) {
    // Make a copy of the data and remove the id field if it exists
    const { id, ...dataWithoutId } = formationData;
    
    // Normalize formation data
    const normalizedData = this.normalizeFormationData({
      ...dataWithoutId,
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    return await this.create(normalizedData);
  }
  
  /**
   * Update an existing formation
   * @param {number} id - Formation ID
   * @param {Object} formationData - Updated formation data
   * @returns {Promise<Object>} - The updated formation
   */
  async updateFormation(id, formationData) {
    // Normalize formation data
    const normalizedData = this.normalizeFormationData({
      ...formationData,
      updated_at: new Date()
    });
    
    return await this.update(id, normalizedData);
  }
  
  /**
   * Search formations by name or description
   * @param {string} searchTerm - Search term
   * @param {Object} options - Optional search options (pagination, etc.)
   * @returns {Promise<Object>} - Search results with pagination
   */
  async searchFormations(searchTerm, options = {}) {
    const searchColumns = ['name', 'brief_description', 'detailed_description'];
    return await this.search(searchTerm, searchColumns, options);
  }
  
  /**
   * Get formations by created user
   * @param {number} userId - User ID
   * @param {Object} options - Optional search options (pagination, etc.)
   * @returns {Promise<Object>} - Formations created by this user
   */
  async getFormationsByUser(userId, options = {}) {
    const filters = { ...options.filters, created_by: userId };
    return await this.getAll({ ...options, filters });
  }
  
  /**
   * Normalize formation data for consistent database storage
   * @param {Object} data - Raw formation data
   * @returns {Object} - Normalized data
   */
  normalizeFormationData(data) {
    const normalizedData = { ...data };
    
    // Remove id field if it's null or undefined
    if (normalizedData.id === null || normalizedData.id === undefined) {
      delete normalizedData.id;
    }
    
    // Ensure diagrams is an array
    if (!Array.isArray(normalizedData.diagrams)) {
      normalizedData.diagrams = normalizedData.diagrams ? [normalizedData.diagrams] : [];
    }
    
    // No need to stringify diagrams as they will be stored as JSONB[]
    // The database column type already handles JSON objects
    
    // Ensure tags is an array
    if (!Array.isArray(normalizedData.tags)) {
      normalizedData.tags = normalizedData.tags ? [normalizedData.tags] : [];
    }
    
    return normalizedData;
  }

  /**
   * Associate an anonymously created formation with a user
   * @param {number} id - Formation ID
   * @param {number} userId - User ID to associate with
   * @returns {Promise<Object>} - The updated formation
   * @throws {Error} - If formation not found or already owned
   */
  async associateFormation(id, userId) {
    const formation = await this.getById(id);

    if (!formation) {
      throw new Error('Formation not found');
    }

    if (formation.created_by !== null) {
      // Formation already has an owner, do nothing or throw error?
      // Let's return the existing formation for now.
      // console.warn(`Formation ${id} already associated with user ${formation.created_by}. Cannot associate with ${userId}.`);
      // throw new Error('Formation already has an owner');
      return formation; 
    }

    // Update the created_by field
    return await this.update(id, { created_by: userId });
  }
}

// Export a singleton instance of the service
export const formationService = new FormationService();