# QDrill PR Review and Merge Plan

## Executive Summary
- **Total PRs**: 29 open PRs
- **Critical Conflicts**: PRs #133 and #136 (core state management overlap)
- **Highest Risk**: State refactoring PRs affecting practice plan functionality
- **Estimated Timeline**: 4 weeks for complete review and merge

## Critical Issues to Resolve

### 1. Major Conflict: PRs #133 vs #136
**Issue**: Both PRs heavily modify dragManager.js and sectionsStore.js with incompatible approaches
**Resolution Required**: 
- Review both implementations
- Choose one approach as base
- Rebase the other or merge concepts
**Subagent Task**: Analyze both implementations and recommend best approach

### 2. Component Deletion Conflict
**Issue**: PR #125 marks SkeletonLoader.svelte for deletion, but PR #112 enhances it
**Resolution**: Check with PR #112 first, then update PR #125

### 3. Missing Test Coverage
**Issue**: Complex refactors lack comprehensive test coverage
**Resolution**: Add tests before merging high-risk PRs

## Phase-by-Phase Execution Plan

### Phase 1: Low-Risk Foundation (Days 1-3)
Start with these independent, low-risk PRs:

#### PR #127 - SQL Duplication Cleanup
```bash
# Review and merge process
gh pr checkout 127
pnpm install
vercel dev

# Run tests
pnpm run test:unit --run src/lib/server/services/__tests__

# Manual testing
# 1. Navigate to /drills
# 2. Test search functionality
# 3. Test skill filtering
# 4. Verify no SQL errors in console

# If all tests pass
gh pr review 127 --approve
gh pr merge 127
```

#### PR #135 - API Error Handling
```bash
gh pr checkout 135
pnpm install
vercel dev

# Test error scenarios
# 1. Disconnect network and try loading drills
# 2. Verify error messages appear
# 3. Test retry functionality
# 4. Check all API endpoints handle errors

# Subagent needed: Test all API endpoints for error handling
```

#### PR #119 - Vercel Rewrites Config
```bash
gh pr checkout 119
# Deploy to preview
vercel --prod=false

# Test all routes work correctly
# Verify no broken redirects
```

#### PR #120 - Theme Consistency
```bash
gh pr checkout 120
vercel dev

# Visual regression testing needed
# Subagent task: Screenshot all major pages before/after
```

### Phase 2: Dead Code Cleanup (Days 4-5)

#### Order is important to avoid conflicts:

1. **PR #112 - Loading States Implementation** (Do this FIRST)
```bash
gh pr checkout 112
vercel dev

# Test loading states appear/disappear correctly
# Verify SkeletonLoader is enhanced, not removed
```

2. **PR #125 - Dead Code Components** (After confirming SkeletonLoader status)
```bash
gh pr checkout 125
# Update PR to NOT delete SkeletonLoader.svelte
git checkout src/lib/components/SkeletonLoader.svelte
git commit -m "Keep SkeletonLoader.svelte as it's used by loading states"
git push

# Verify remaining deletions are safe
# Subagent task: Search codebase for any imports of deleted components
```

3. **PR #124 - Dead Code Stores**
```bash
gh pr checkout 124
# Subagent task: Verify no components import deleted stores
```

4. **PR #123 - Admin Migration Page**
```bash
gh pr checkout 123
# Simple deletion, low risk
```

5. **PR #122 - Dead Code API Routes**
```bash
gh pr checkout 122
# Verify no frontend code calls deleted endpoints
```

### Phase 3: Core State Refactoring (Days 6-10)

#### CRITICAL: Resolve conflict between #133 and #136 first

**Conflict Resolution Process**:
```bash
# 1. Analyze both approaches
gh pr checkout 136
# Document sectionsStore approach

gh pr checkout 133  
# Document dragManager approach

# 2. Create comparison document
# Subagent task: Create detailed comparison of both refactoring approaches

# 3. Make decision on base approach
# 4. Create merge strategy
```

**Option A: If choosing PR #136 as base**:
```bash
gh pr checkout 136
pnpm install
vercel dev

# Extensive testing protocol
# 1. Create new practice plan
# 2. Add multiple sections
# 3. Test all drag operations
# 4. Save and reload
# 5. Test undo/redo

# Run all practice plan tests
pnpm run test tests/practice-plans/

# If passes, merge
gh pr merge 136

# Then rebase PR #133
gh pr checkout 133
git rebase main
# Resolve conflicts favoring new sectionsStore structure
```

**Option B: If choosing PR #133 as base**:
```bash
gh pr checkout 133
# Similar testing protocol
# Focus on drag operations
```

#### PR #139 - Component Coupling (After state refactor)
```bash
gh pr checkout 139
git rebase main  # Get latest state changes
vercel dev

# Test all decoupled components still work
# Verify props are passed correctly
```

### Phase 4: Component Refactoring (Days 11-13)

#### PR #131 - PracticePlanForm Refactor
```bash
gh pr checkout 131
git rebase main  # May have conflicts with #139
vercel dev

# Test form validation
# Test auth flow
# Test save functionality
# Subagent task: Test all form edge cases
```

#### PR #130 - FilterPanel Refactor
```bash
gh pr checkout 130
vercel dev

# Test all filter combinations
# Verify performance with large datasets
```

#### PR #132 - ExcalidrawWrapper
```bash
gh pr checkout 132
vercel dev

# Test diagram creation/editing
# Verify save functionality
```

### Phase 5: UX Improvements (Days 14-18)
Can be done in parallel with subagents:

```bash
# Subagent 1: Handle navigation and accessibility
gh pr checkout 111  # Navigation accessibility
gh pr checkout 126  # Accessibility review

# Subagent 2: Handle loading and error states  
gh pr checkout 112  # Loading states (if not already done)
gh pr checkout 114  # Error handling UX

# Subagent 3: Handle filter and search improvements
gh pr checkout 116  # Clear/reset filters
gh pr checkout 129  # Search experience

# Subagent 4: Handle remaining UX
gh pr checkout 113  # Landing page CTA
gh pr checkout 115  # Empty states
gh pr checkout 117  # Add to plan unauthenticated
gh pr checkout 121  # Practice plan position filter
```

### Phase 6: Final Items (Days 19-20)

#### PR #128 - UserService Permissions
```bash
gh pr checkout 128
vercel dev

# Critical security testing
# 1. Test as regular user - verify no admin access
# 2. Test as admin - verify admin features work
# 3. Test permission edge cases
# Subagent task: Security audit of all permission checks
```

#### PR #134 - Validation Framework
```bash
gh pr checkout 134
# Test all validation rules
# Verify error messages are helpful
```

#### PR #118 - LLM Practice Plan Tools
```bash
gh pr checkout 118
# Test wrapper scripts work correctly
```

## Automated Testing Script

Create this script for each PR:
```bash
#!/bin/bash
# test-pr.sh

PR_NUMBER=$1
echo "Testing PR #$PR_NUMBER"

# Checkout and setup
gh pr checkout $PR_NUMBER
pnpm install

# Run linting
echo "Running lint checks..."
pnpm run lint
if [ $? -ne 0 ]; then
    echo "Lint failed!"
    exit 1
fi

# Run type checking
echo "Running type checks..."
pnpm run check
if [ $? -ne 0 ]; then
    echo "Type check failed!"
    exit 1
fi

# Run unit tests
echo "Running unit tests..."
pnpm run test:unit:run
if [ $? -ne 0 ]; then
    echo "Unit tests failed!"
    exit 1
fi

# Start dev server in background
vercel dev &
DEV_PID=$!
sleep 10

# Run Playwright tests
echo "Running Playwright tests..."
pnpm run test
TEST_RESULT=$?

# Cleanup
kill $DEV_PID

if [ $TEST_RESULT -ne 0 ]; then
    echo "Playwright tests failed!"
    exit 1
fi

echo "All tests passed for PR #$PR_NUMBER"
```

## Subagent Task Assignments

### Subagent 1: Conflict Resolution Analyst
**Task**: Analyze PRs #133 and #136 to recommend best approach
```
1. Compare both refactoring approaches
2. List pros/cons of each
3. Identify which requires less rework of other components
4. Recommend merge strategy
```

### Subagent 2: Dead Code Verifier
**Task**: Ensure safe deletion of components/stores/routes
```
1. For each file marked for deletion, search entire codebase for imports
2. Verify no dynamic imports or string references
3. Check for any route references in navigation
4. Create safety report
```

### Subagent 3: Test Suite Builder
**Task**: Create comprehensive Playwright tests for high-risk PRs
```
1. Write detailed test scenarios for practice plan creation/editing
2. Create drag-and-drop test suite
3. Build permission testing scenarios
4. Generate visual regression tests
```

### Subagent 4: UX Testing Coordinator
**Task**: Batch test all UX improvement PRs
```
1. Test each UX PR for functionality
2. Verify no regressions in user flows
3. Check mobile responsiveness
4. Document any issues found
```

### Subagent 5: Security Auditor
**Task**: Review permission and auth-related changes
```
1. Audit PR #128 for security vulnerabilities
2. Verify all endpoints check permissions
3. Test edge cases in auth flow
4. Review session handling
```

## Risk Mitigation Strategies

1. **Before each merge**:
   - Run full test suite
   - Deploy to preview environment
   - Get manual QA approval
   - Have rollback plan ready

2. **For high-risk PRs**:
   - Pair review with another developer
   - Extra testing in staging
   - Monitor error rates after deploy
   - Be ready to revert

3. **Conflict resolution**:
   - Always rebase on latest main
   - Test thoroughly after rebasing
   - Document any changes made during rebase

## Success Metrics

- [ ] All 29 PRs reviewed and merged/closed
- [ ] No production incidents from merges
- [ ] Test coverage increased
- [ ] Performance metrics maintained or improved
- [ ] No accessibility regressions

## Daily Checklist

1. Pull latest main: `git checkout main && git pull`
2. Check PR status: `gh pr list`
3. Run test suite on main: `./test-pr.sh main`
4. Review and merge 2-3 PRs following plan
5. Update this document with progress
6. Communicate blockers immediately

## Emergency Procedures

If a merge causes issues:
1. Revert immediately: `gh pr revert <PR_NUMBER>`
2. Notify team
3. Create hotfix if needed
4. Update test suite to catch issue
5. Re-attempt with fixes

## Communication Plan

- Daily: Update PR status in team channel
- On conflicts: Tag PR authors for clarification  
- On completion: Summary of changes and impacts
- Weekly: Progress report on overall plan