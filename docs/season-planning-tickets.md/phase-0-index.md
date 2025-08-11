# Season Planning Feature - Implementation Guide

## Executive Summary
The Season Planning feature transforms QDrill from a simple drill bank into a comprehensive team practice management platform. It introduces team-based organization, season-long planning, automated practice generation, and collaborative tools for coaches and players.

## Architecture Overview

### Core Concepts
- **Teams**: Organizations with admin/member roles that own seasons and practice plans
- **Seasons**: Time-bounded periods with one active season per team, containing sections and markers
- **Season Sections**: Date ranges within a season that define focus areas and default content
- **Practice Plans**: Team-scoped plans that can be templates, drafts, or published
- **Union Algorithm**: Combines template + overlapping section defaults to auto-generate practice content
- **Propagation**: Template changes flow to unedited draft plans automatically

### Data Flow
```
Team → Season (active) → Season Sections → Practice Plans
         ↓                      ↓              ↓
    Template Plan      Default Sections   Draft/Published
         ↓                      ↓              ↓
         └──────── Union Algorithm ───────────┘
```

## Implementation Phases

### Phase 1: Teams and Permissions ✅
**Status**: Refined and ready for implementation
**Scope**: First-class Team entities with membership roles
**Key Deliverables**:
- Teams table extension with slug, timezone, default_start_time
- Team members table with admin/member roles
- Team-scoped permission system
- Team management UI

### Phase 2: Seasons and Active Constraint ✅
**Status**: Refined and ready for implementation  
**Dependencies**: Phase 1
**Scope**: Season management with one-active constraint
**Key Deliverables**:
- Seasons table with template reference and share tokens
- One active season per team enforcement
- Template practice plan support
- Season dashboard UI

### Phase 3: Sections, Markers, Timeline
**Status**: Needs refinement
**Dependencies**: Phase 2
**Scope**: Season structure and read-only timeline
**Key Deliverables**:
- Season sections with date ranges and visibility
- Default practice sections and linked drills
- Season markers (tournaments, breaks, etc.)
- Read-only timeline visualization

### Phase 4: Instantiation and Publishing
**Status**: Needs refinement
**Dependencies**: Phase 3
**Scope**: Practice plan generation via union algorithm
**Key Deliverables**:
- Click-to-create practice plans from timeline
- Union algorithm implementation
- Draft/published status workflow
- Team-scoped practice plan permissions

### Phase 5: Recurrence and Batch Generation
**Status**: Needs refinement
**Dependencies**: Phase 4
**Scope**: Automated practice generation
**Key Deliverables**:
- Recurrence rule configuration
- Batch draft generation
- Safe deletion with edit protection

### Phase 6: Propagation and Drag Re-evaluation
**Status**: Needs refinement
**Dependencies**: Phase 4, 5
**Scope**: Dynamic updates and timeline interactions
**Key Deliverables**:
- Template change propagation
- Section overlap re-evaluation
- Drag-and-drop rescheduling
- Visual edit indicators

### Phase 7: ICS and Share Links
**Status**: Needs refinement
**Dependencies**: Phase 4
**Scope**: External sharing and calendar integration
**Key Deliverables**:
- Tokenized ICS feeds
- Public read-only season view
- Calendar app integration

### Phase 8: AI Integration
**Status**: Needs refinement
**Dependencies**: Phase 4
**Scope**: Context-aware AI practice generation
**Key Deliverables**:
- Season-aware AI prompts
- Augment vs replace modes
- Context aggregation from sections

### Phase 9: Polish and Documentation
**Status**: Needs refinement
**Dependencies**: All phases
**Scope**: UX refinement and documentation
**Key Deliverables**:
- Timeline zoom and navigation
- Empty states and loading states
- User guides and API docs
- Analytics integration

## Database Schema Summary

### New Tables
- `team_members`: Links users to teams with roles
- `seasons`: Team seasons with constraints
- `season_sections`: Date-ranged focus areas
- `season_section_default_sections`: Default practice structure
- `season_section_drills`: Linked drills/formations
- `season_markers`: Events and milestones
- `seasons_recurrences`: Recurrence rules

### Modified Tables
- `teams`: Added slug, timezone, default_start_time, created_by
- `practice_plans`: Added team_id, season_id, scheduled_date, status, is_template, template_plan_id, is_edited, published_at

## Technical Stack
- **Backend**: SvelteKit server routes, node-pg-migrate
- **Services**: BaseEntityService pattern with team permissions
- **Validation**: Zod schemas for all entities
- **Frontend**: Svelte components with stores
- **Testing**: Vitest for unit, Playwright/Cypress for E2E

## Implementation Order Rationale

1. **Foundation First**: Teams and permissions create the organizational structure
2. **Container Before Content**: Seasons before sections, sections before practices
3. **Read Before Write**: Timeline visualization before drag interactions
4. **Core Before Enhancement**: Basic generation before AI, functionality before polish
5. **Internal Before External**: Team features before public sharing

## Risk Mitigation

### Technical Risks
- **Performance**: Batch operations may timeout → Use background jobs for large operations
- **Consistency**: Complex propagation logic → Comprehensive transaction handling
- **Permissions**: Team/season scoping complexity → Centralized permission service

### UX Risks
- **Complexity**: Feature-rich interface → Progressive disclosure, good defaults
- **Migration**: Existing users without teams → Auto-create personal teams
- **Learning Curve**: New concepts → In-app guides and tooltips

## Success Metrics
- Team creation and member addition rates
- Season activation percentage
- Practice plans generated vs manually created
- Template reuse frequency
- ICS subscription adoption
- User retention improvement

## Next Steps
1. Review and approve refined Phase 1 and 2 tickets
2. Set up development environment with test data
3. Implement Phase 1 (Teams and Permissions)
4. Test and deploy Phase 1
5. Continue with Phase 2 while refining Phase 3

## Notes
- Each phase builds on previous work - strict ordering required
- Database migrations must be reversible
- All changes must maintain backward compatibility
- Performance testing required before production deployment