<script>
  import { createEventDispatcher } from 'svelte';
  import { flip } from 'svelte/animate';
  import { apiFetch } from '$lib/utils/apiFetch.js';
  import { toast } from '@zerodevx/svelte-toast';
  import { device } from '$lib/stores/deviceStore';
  import Card from '$lib/components/ui/Card.svelte';
  import { Button } from '$lib/components/ui/button';
  import Badge from '$lib/components/ui/Badge.svelte';
  import EditSectionSheet from '../mobile/EditSectionSheet.svelte';
  import EditMarkerSheet from '../mobile/EditMarkerSheet.svelte';
  import Dialog from '$lib/components/ui/Dialog.svelte';
  
  export let season = null;
  export let sections = [];
  export let markers = [];
  export let teamId = '';
  
  const dispatch = createEventDispatcher();
  
  let showSectionDialog = false;
  let showMarkerDialog = false;
  let editingSection = null;
  let editingMarker = null;
  let reordering = false;
  
  async function handleSectionMove(section, direction) {
    const currentIndex = sections.findIndex(s => s.id === section.id);
    const newIndex = currentIndex + direction;
    
    if (newIndex < 0 || newIndex >= sections.length) return;
    
    // Optimistically update UI
    const newSections = [...sections];
    [newSections[currentIndex], newSections[newIndex]] = [newSections[newIndex], newSections[currentIndex]];
    
    // Update order values
    newSections.forEach((s, i) => {
      s.order = i;
    });
    
    sections = newSections;
    
    try {
      // Send reorder request to server
      await apiFetch(`/api/seasons/${season.id}/sections/reorder`, {
        method: 'PUT',
        body: JSON.stringify({
          sections: newSections.map(s => ({ id: s.id, order: s.order }))
        })
      });
      
      dispatch('change');
    } catch (error) {
      // Revert on error
      sections = sections.sort((a, b) => a.order - b.order);
      toast.push('Failed to reorder sections', {
        theme: {
          '--toastBackground': '#ef4444',
          '--toastColor': 'white'
        }
      });
    }
  }
  
  async function handleSectionDelete(section) {
    if (!confirm(`Delete section "${section.name}"? This cannot be undone.`)) {
      return;
    }
    
    try {
      await apiFetch(`/api/seasons/${season.id}/sections/${section.id}`, {
        method: 'DELETE'
      });
      
      sections = sections.filter(s => s.id !== section.id);
      
      toast.push('Section deleted', {
        theme: {
          '--toastBackground': '#10b981',
          '--toastColor': 'white'
        }
      });
      
      dispatch('change');
    } catch (error) {
      toast.push('Failed to delete section', {
        theme: {
          '--toastBackground': '#ef4444',
          '--toastColor': 'white'
        }
      });
    }
  }
  
  async function handleMarkerDelete(marker) {
    if (!confirm(`Delete event "${marker.name || marker.title}"? This cannot be undone.`)) {
      return;
    }
    
    try {
      await apiFetch(`/api/seasons/${season.id}/markers/${marker.id}`, {
        method: 'DELETE'
      });
      
      markers = markers.filter(m => m.id !== marker.id);
      
      toast.push('Event deleted', {
        theme: {
          '--toastBackground': '#10b981',
          '--toastColor': 'white'
        }
      });
      
      dispatch('change');
    } catch (error) {
      toast.push('Failed to delete event', {
        theme: {
          '--toastBackground': '#ef4444',
          '--toastColor': 'white'
        }
      });
    }
  }
  
  function handleAddSection() {
    editingSection = null;
    showSectionDialog = true;
  }
  
  function handleEditSection(section) {
    editingSection = section;
    showSectionDialog = true;
  }
  
  function handleAddMarker() {
    editingMarker = null;
    showMarkerDialog = true;
  }
  
  function handleEditMarker(marker) {
    editingMarker = marker;
    showMarkerDialog = true;
  }
  
  function handleSectionSaved(event) {
    showSectionDialog = false;
    dispatch('sectionChange', event.detail);
  }
  
  function handleMarkerSaved(event) {
    showMarkerDialog = false;
    dispatch('markerChange', event.detail);
  }
  
  function formatDateRange(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (start === end) {
      return startDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    }
    
    const sameYear = startDate.getFullYear() === endDate.getFullYear();
    
    return `${startDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: !sameYear ? 'numeric' : undefined
    })} – ${endDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })}`;
  }
  
  // Calculate section duration
  function getSectionDuration(section) {
    const start = new Date(section.start_date);
    const end = new Date(section.end_date);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const weeks = Math.round(days / 7);
    
    if (days < 7) {
      return `${days} day${days === 1 ? '' : 's'}`;
    } else {
      return `${weeks} week${weeks === 1 ? '' : 's'}`;
    }
  }
</script>

<div class="manage-container" class:desktop={!$device.isMobile}>
  <!-- Sections Management -->
  <Card class="manage-card">
    <div class="card-header">
      <h2 class="card-title">Season Sections</h2>
      <Button size="sm" on:click={handleAddSection}>
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" class="mr-1">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Section
      </Button>
    </div>
    
    <div class="items-list">
      {#each sections as section, index (section.id)}
        <div 
          class="list-item"
          animate:flip={{ duration: 200 }}
        >
          <div class="item-grip">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" opacity="0.5">
              <line x1="4" y1="6" x2="12" y2="6" />
              <line x1="4" y1="10" x2="12" y2="10" />
              <line x1="4" y1="14" x2="12" y2="14" />
            </svg>
          </div>
          
          <div class="item-color" style="background-color: {section.color}" />
          
          <div class="item-content">
            <div class="item-name">{section.name}</div>
            <div class="item-details">
              <span class="detail-item">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="3" width="10" height="10" rx="1" />
                  <line x1="2" y1="7" x2="12" y2="7" />
                  <line x1="5" y1="1" x2="5" y2="3" />
                  <line x1="9" y1="1" x2="9" y2="3" />
                </svg>
                {formatDateRange(section.start_date, section.end_date)}
              </span>
              <span class="detail-item">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="7" cy="7" r="5" />
                  <path d="M7 4v3h3" />
                </svg>
                {getSectionDuration(section)}
              </span>
            </div>
          </div>
          
          <div class="item-actions">
            <button
              class="action-button"
              on:click={() => handleSectionMove(section, -1)}
              disabled={index === 0}
              aria-label="Move up"
              title="Move up"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 15l-4-4-4 4M8 11V3" />
              </svg>
            </button>
            
            <button
              class="action-button"
              on:click={() => handleSectionMove(section, 1)}
              disabled={index === sections.length - 1}
              aria-label="Move down"
              title="Move down"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 9l-4 4-4-4M8 13V5" />
              </svg>
            </button>
            
            <div class="action-divider" />
            
            <button
              class="action-button"
              on:click={() => handleEditSection(section)}
              aria-label="Edit"
              title="Edit section"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-7M14.5 2.5a2.121 2.121 0 013 3L10 13l-4 1 1-4 7.5-7.5z" />
              </svg>
            </button>
            
            <button
              class="action-button delete"
              on:click={() => handleSectionDelete(section)}
              aria-label="Delete"
              title="Delete section"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h12M8 6V4a1 1 0 011-1h2a1 1 0 011 1v2m2 0v9a2 2 0 01-2 2H6a2 2 0 01-2-2V6" />
              </svg>
            </button>
          </div>
        </div>
      {/each}
      
      {#if sections.length === 0}
        <div class="empty-state">
          <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3">
            <rect x="8" y="8" width="32" height="10" rx="2" />
            <rect x="8" y="22" width="32" height="10" rx="2" />
            <rect x="8" y="36" width="32" height="4" rx="2" />
          </svg>
          <p>No sections yet</p>
          <Button size="sm" variant="outline" on:click={handleAddSection}>
            Add your first section
          </Button>
        </div>
      {/if}
    </div>
  </Card>
  
  <!-- Events & Milestones Management -->
  <Card class="manage-card">
    <div class="card-header">
      <h2 class="card-title">Events & Milestones</h2>
      <Button size="sm" on:click={handleAddMarker}>
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" class="mr-1">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Event
      </Button>
    </div>
    
    <div class="items-list">
      {#each markers as marker (marker.id)}
        <div 
          class="list-item"
          animate:flip={{ duration: 200 }}
        >
          <div class="item-color" style="background-color: {marker.color}" />
          
          <div class="item-content">
            <div class="item-name">{marker.name || marker.title}</div>
            <div class="item-details">
              <Badge variant="secondary" size="xs">
                {marker.type}
              </Badge>
              <span class="detail-item">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="3" width="10" height="10" rx="1" />
                  <line x1="2" y1="7" x2="12" y2="7" />
                  <line x1="5" y1="1" x2="5" y2="3" />
                  <line x1="9" y1="1" x2="9" y2="3" />
                </svg>
                {formatDateRange(marker.date || marker.start_date, marker.end_date || marker.date || marker.start_date)}
              </span>
            </div>
          </div>
          
          <div class="item-actions">
            <button
              class="action-button"
              on:click={() => handleEditMarker(marker)}
              aria-label="Edit"
              title="Edit event"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-7M14.5 2.5a2.121 2.121 0 013 3L10 13l-4 1 1-4 7.5-7.5z" />
              </svg>
            </button>
            
            <button
              class="action-button delete"
              on:click={() => handleMarkerDelete(marker)}
              aria-label="Delete"
              title="Delete event"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h12M8 6V4a1 1 0 011-1h2a1 1 0 011 1v2m2 0v9a2 2 0 01-2 2H6a2 2 0 01-2-2V6" />
              </svg>
            </button>
          </div>
        </div>
      {/each}
      
      {#if markers.length === 0}
        <div class="empty-state">
          <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3">
            <path d="M12 6v6m0 0v6m0-6h6m-6 0H6m3-9l2.286 6.857L18 15l-5.714 2.143L9 24l-2.286-6.857L0 15l5.714-2.143L9 6z" />
          </svg>
          <p>No events yet</p>
          <Button size="sm" variant="outline" on:click={handleAddMarker}>
            Add your first event
          </Button>
        </div>
      {/if}
    </div>
  </Card>
</div>

<!-- Section Dialog/Sheet -->
{#if showSectionDialog}
  {#if $device.isMobile}
    <EditSectionSheet
      {season}
      section={editingSection}
      {teamId}
      on:save={handleSectionSaved}
      on:close={() => showSectionDialog = false}
    />
  {:else}
    <Dialog
      open={showSectionDialog}
      title={editingSection ? 'Edit Section' : 'Create Section'}
      on:close={() => showSectionDialog = false}
    >
      <!-- Desktop form content would go here -->
      <p>Desktop section form coming soon...</p>
    </Dialog>
  {/if}
{/if}

<!-- Marker Dialog/Sheet -->
{#if showMarkerDialog}
  {#if $device.isMobile}
    <EditMarkerSheet
      {season}
      marker={editingMarker}
      on:save={handleMarkerSaved}
      on:close={() => showMarkerDialog = false}
    />
  {:else}
    <Dialog
      open={showMarkerDialog}
      title={editingMarker ? 'Edit Event' : 'Create Event'}
      on:close={() => showMarkerDialog = false}
    >
      <!-- Desktop form content would go here -->
      <p>Desktop event form coming soon...</p>
    </Dialog>
  {/if}
{/if}

<style>
  .manage-container {
    padding: 16px;
    padding-bottom: 80px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
  .manage-container.desktop {
    padding: 0;
    padding-bottom: 0;
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  
  :global(.manage-card) {
    height: fit-content;
  }
  
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .desktop .card-header {
    padding: 20px;
  }
  
  .card-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    color: #111827;
  }
  
  .desktop .card-title {
    font-size: 20px;
  }
  
  .items-list {
    padding: 8px;
  }
  
  .desktop .items-list {
    padding: 12px;
  }
  
  .list-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 8px;
    transition: all 0.2s;
  }
  
  .desktop .list-item {
    padding: 16px;
  }
  
  .list-item:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
  }
  
  .list-item:last-child {
    margin-bottom: 0;
  }
  
  .item-grip {
    cursor: grab;
    opacity: 0.5;
    transition: opacity 0.2s;
  }
  
  .list-item:hover .item-grip {
    opacity: 1;
  }
  
  .item-color {
    width: 4px;
    height: 40px;
    border-radius: 2px;
    flex-shrink: 0;
  }
  
  .item-content {
    flex: 1;
    min-width: 0;
  }
  
  .item-name {
    font-size: 15px;
    font-weight: 500;
    color: #111827;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .desktop .item-name {
    font-size: 16px;
  }
  
  .item-details {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    color: #6b7280;
  }
  
  .detail-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .item-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
    align-items: center;
  }
  
  .desktop .item-actions {
    gap: 8px;
  }
  
  .action-divider {
    width: 1px;
    height: 20px;
    background: #e5e7eb;
    margin: 0 4px;
  }
  
  .action-button {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .desktop .action-button {
    width: 36px;
    height: 36px;
  }
  
  .action-button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  
  .action-button:not(:disabled):hover {
    background: #f3f4f6;
    border-color: #d1d5db;
    color: #4b5563;
  }
  
  .action-button.delete {
    color: #ef4444;
  }
  
  .action-button.delete:not(:disabled):hover {
    background: #fee2e2;
    border-color: #fca5a5;
  }
  
  .empty-state {
    padding: 48px 16px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  
  .empty-state svg {
    color: #d1d5db;
  }
  
  .empty-state p {
    margin: 0;
    color: #6b7280;
    font-size: 14px;
  }
  
  /* Dark mode support */
  :global(.dark) .manage-container {
    background: transparent;
  }
  
  :global(.dark) .card-header {
    border-bottom-color: #374151;
  }
  
  :global(.dark) .card-title {
    color: #f3f4f6;
  }
  
  :global(.dark) .list-item {
    background: #111827;
    border-color: #374151;
  }
  
  :global(.dark) .list-item:hover {
    background: #1f2937;
    border-color: #4b5563;
  }
  
  :global(.dark) .item-name {
    color: #f3f4f6;
  }
  
  :global(.dark) .item-details {
    color: #9ca3af;
  }
  
  :global(.dark) .action-divider {
    background: #374151;
  }
  
  :global(.dark) .action-button {
    background: #374151;
    border-color: #4b5563;
    color: #9ca3af;
  }
  
  :global(.dark) .action-button:not(:disabled):hover {
    background: #4b5563;
    border-color: #6b7280;
    color: #d1d5db;
  }
  
  :global(.dark) .action-button.delete {
    color: #f87171;
  }
  
  :global(.dark) .action-button.delete:not(:disabled):hover {
    background: #7f1d1d;
    border-color: #991b1b;
  }
  
  :global(.dark) .empty-state svg {
    color: #4b5563;
  }
  
  :global(.dark) .empty-state p {
    color: #9ca3af;
  }
</style>
