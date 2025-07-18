# PR Conflict Analysis

## Confirmed Conflicts

### 1. SkeletonLoader.svelte Conflict
**Branches in Conflict:**
- `codex/implement-loading-states-for-ux-improvements` - MODIFIES the file
- `codex/remove-unused-components` - DELETES the file

**Resolution Strategy:**
1. Merge `codex/implement-loading-states-for-ux-improvements` FIRST
2. Update `codex/remove-unused-components` to exclude SkeletonLoader.svelte from deletion
3. Review other components being deleted to ensure they're not needed by the loading states

**Files Deleted by remove-unused-components that may be needed:**
- `src/lib/components/SkeletonLoader.svelte` - CONFLICT: Modified by loading states
- `src/lib/components/ui/button/LoadingButton.svelte` - May be used by loading states
- `src/lib/utils/loadingStates.js` - Likely needed for loading states implementation

### 2. Documentation Conflicts
The `codex/remove-unused-components` branch deletes several important files:
- `PR_REVIEW_PLAN.md` - The merge plan itself!
- `docs/guides/loading-states-best-practices.md` - Related to loading states feature
- Various ticket files that may still be needed for tracking

**Resolution:** These deletions seem overly aggressive and should be reviewed.

## Branch Dependency Analysis

### Loading States Dependencies
The loading states implementation likely depends on:
1. SkeletonLoader.svelte (confirmed - being modified)
2. LoadingButton.svelte (possibly)
3. loadingStates.js utility (possibly)

### Component Usage Check Required
Before merging `codex/remove-unused-components`, verify these components are truly unused:
- Cart.svelte
- LoginButton.svelte
- TitleWithTooltip.svelte
- FormationReference.svelte
- ParallelActivityCreator.svelte
- ParallelTimelineView.svelte
- PositionFilter.svelte
- FormationItem.svelte
- EnhancedAddItemModal.svelte
- SimpleButton.svelte

## Merge Order Recommendation

### Phase 1: Non-Conflicting Merges
1. `codex/conduct-accessibility-review` - No conflicts expected
2. `codex/reduce-linter-errors-safely` - No conflicts expected

### Phase 2: Loading States First
3. `codex/implement-loading-states-for-ux-improvements` - Merge this BEFORE any deletions

### Phase 3: Review and Update Deletions
4. Update `codex/remove-unused-components`:
   - Remove SkeletonLoader.svelte from deletion list
   - Remove LoadingButton.svelte from deletion list
   - Remove loadingStates.js from deletion list
   - Keep PR_REVIEW_PLAN.md
   - Review all other deletions

### Phase 4: Safe Deletions
5. `codex/remove-unused-stores` - After verifying no components use these stores

### Phase 5: UX Improvements
6. `codex/implement-ux-improvements-for-search-experience`
7. `codex/add-ux-improvements-for-unauthenticated-plan`

## Conflict Detection Script

```bash
#!/bin/bash
# detect-conflicts.sh

echo "Checking for conflicts between branches..."

BRANCHES=(
    "origin/codex/remove-unused-components"
    "origin/codex/implement-loading-states-for-ux-improvements"
    "origin/codex/conduct-accessibility-review"
    "origin/codex/add-ux-improvements-for-unauthenticated-plan"
    "origin/codex/implement-ux-improvements-for-search-experience"
    "origin/codex/reduce-linter-errors-safely"
    "origin/codex/remove-unused-stores"
)

for i in "${!BRANCHES[@]}"; do
    for j in "${!BRANCHES[@]}"; do
        if [ $i -lt $j ]; then
            BRANCH1="${BRANCHES[$i]}"
            BRANCH2="${BRANCHES[$j]}"
            
            echo "Checking $BRANCH1 vs $BRANCH2..."
            
            # Get files modified by both branches
            FILES1=$(git diff main..$BRANCH1 --name-only)
            FILES2=$(git diff main..$BRANCH2 --name-only)
            
            # Find common files
            COMMON=$(comm -12 <(echo "$FILES1" | sort) <(echo "$FILES2" | sort))
            
            if [ ! -z "$COMMON" ]; then
                echo "⚠️  Potential conflict in:"
                echo "$COMMON"
                echo ""
            fi
        fi
    done
done
```

## Missing PR Number Mapping

The original plan references PRs by number, but we only have branch names. Here's what we can determine:

### Mentioned in Plan but Not Found:
- PR #133 - Supposed to modify dragManager.js and sectionsStore.js
- PR #136 - Also supposed to modify dragManager.js and sectionsStore.js
- PR #125 - Dead code components (likely `codex/remove-unused-components`)
- PR #112 - Loading states (likely `codex/implement-loading-states-for-ux-improvements`)

### Recommendation:
Either update the plan to use branch names or create a proper mapping between PR numbers and branches.

## Action Items

1. **Immediate**: Do not merge `codex/remove-unused-components` until loading states is merged
2. **Before Any Merges**: Run the conflict detection script
3. **Update remove-unused-components**: Create a list of files to exclude from deletion
4. **Verify Component Usage**: Run a thorough analysis of component imports before deleting
5. **Update Documentation**: Don't delete active documentation or tracking files