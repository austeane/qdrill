import { BaseEntityService } from './baseEntityService.js';
import * as db from '$lib/server/db';
import { NotFoundError, DatabaseError, ConflictError, ValidationError } from '$lib/server/errors';

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
      'id', // Ensure primary key is always allowed
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
      'updated_at',
      'search_vector' // Allow search vector column
    ];

    // Standard permission configuration
    const permissionConfig = {
      userIdColumn: 'created_by',
      visibilityColumn: 'visibility',
      publicValue: 'public',
      unlistedValue: 'unlisted',
      privateValue: 'private',
      editableByOthersColumn: 'is_editable_by_others' // For canUserEdit check
    };
    
    super(
      'formations', 
      'id', 
      ['*'], 
      allowedFormationColumns, 
      { 
        diagrams: 'json', 
        tags: 'array' 
      },
      permissionConfig // Pass permission config
    );
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
   * @throws {DatabaseError} On database error
   * @throws {ValidationError} If search term is invalid
   */
  async searchFormations(searchTerm, options = {}) {
    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length === 0) {
      throw new ValidationError('Invalid search term provided.');
    }
    // Use base service's search which leverages tsvector ('search_vector' column)
    // Pass the original options which might include filters, pagination, userId etc.
    return await this.search(searchTerm, null, options, 'search_vector', 'english'); 
  }
  
  /**
   * Get formations by created user
   * @param {number} userId - User ID
   * @param {Object} options - Optional search options (pagination, etc.)
   * @returns {Promise<Object>} - Formations created by this user
   */
  async getFormationsByUser(userId, options = {}) {
    const filters = { ...options.filters, created_by__eq: userId }; // Use __eq operator
    // Directly use the base getAll method with the filter
    return await this.getAll({ ...options, filters });
  }
  
  /**
   * Normalize formation data for consistent database storage
   * @param {Object} data - Raw formation data
   * @returns {Object} - Normalized data
   */
  normalizeFormationData(data) {
    // Base service handles ID, array fields, and timestamps generally.
    // Keep this method for potential future formation-specific normalization.
    // For now, just return the data as is, assuming upstream handles basics.
    // const normalizedData = super.normalizeArrayFields(data, ['tags', 'diagrams']); // Example if we needed explicit normalization
    return data; 
  }

  /**
   * Associate an anonymously created formation with a user
   * @param {number|string} id - Formation ID
   * @param {number} userId - User ID to associate with
   * @returns {Promise<Object>} - The updated formation
   * @throws {NotFoundError} - If formation not found
   * @throws {ConflictError} - If formation already owned by another user
   * @throws {DatabaseError} - On database error
   */
  async associateFormation(id, userId) {
    // getById will throw NotFoundError if formation doesn't exist
    const formation = await this.getById(id);

    // Check if already owned by a *different* user
    if (formation.created_by !== null && formation.created_by !== userId) {
       // Use ConflictError
      throw new ConflictError('Formation is already associated with another user.');
    }

    // If already owned by the *same* user, return (idempotent)
    if (formation.created_by === userId) {
      return formation;
    }

    // Update the created_by field using base update method
    // This will also throw NotFoundError if the formation disappears
    try {
      return await this.update(id, { created_by: userId });
    } catch (error) {
      // Re-throw known errors (NotFoundError)
      if (error instanceof NotFoundError) {
        throw error;
      }
      // Wrap others as DatabaseError
      console.error(`Error associating formation ${id} with user ${userId}:`, error);
      throw new DatabaseError('Failed to associate formation', error);
    }
  }
}

// Export a singleton instance of the service
export const formationService = new FormationService();