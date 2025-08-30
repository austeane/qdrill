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
  import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
  import CreateSectionDialog from '../desktop/CreateSectionDialog.svelte';
  import CreateMarkerDialog from '../desktop/CreateMarkerDialog.svelte';
  import { Plus, GripHorizontal, Calendar, Clock, ArrowUp, ArrowDown, Edit2, Trash2, Layers, Star } from 'lucide-svelte';
  
  export let season = null;
  export let sections = [];
  export let markers = [];
  export let teamSlug = '';
  
  const dispatch = createEventDispatcher();
  
  let showSectionDialog = false;
  let showMarkerDialog = false;
  let editingSection = null;
  let editingMarker = null;
  let reordering = false;
  let confirmDeleteSection = null;
  let confirmDeleteMarker = null;
  let deleteLoading = false;
  
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
  
  function handleSectionDeleteClick(section) {
    confirmDeleteSection = section;
  }
  
  async function handleSectionDelete() {
    const section = confirmDeleteSection;
    if (!section) return;
    
    deleteLoading = true;
    
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
    } finally {
      confirmDeleteSection = null;
      deleteLoading = false;
    }
  }
  
  function handleMarkerDeleteClick(marker) {
    confirmDeleteMarker = marker;
  }
  
  async function handleMarkerDelete() {
    const marker = confirmDeleteMarker;
    if (!marker) return;
    
    deleteLoading = true;
    
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
    } finally {
      confirmDeleteMarker = null;
      deleteLoading = false;
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
        <Plus size={16} class="mr-1" />
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
            <GripHorizontal size={16} opacity={0.5} />
          </div>
          
          <div class="item-color" style="background-color: {section.color}" />
          
          <div class="item-content">
            <div class="item-name">{section.name}</div>
            <div class="item-details">
              <span class="detail-item">
                <Calendar size={14} />
                {formatDateRange(section.start_date, section.end_date)}
              </span>
              <span class="detail-item">
                <Clock size={14} />
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
              <ArrowUp size={16} />
            </button>
            
            <button
              class="action-button"
              on:click={() => handleSectionMove(section, 1)}
              disabled={index === sections.length - 1}
              aria-label="Move down"
              title="Move down"
            >
              <ArrowDown size={16} />
            </button>
            
            <div class="action-divider" />
            
            <button
              class="action-button"
              on:click={() => handleEditSection(section)}
              aria-label="Edit"
              title="Edit section"
            >
              <Edit2 size={16} />
            </button>
            
            <button
              class="action-button delete"
              on:click={() => handleSectionDeleteClick(section)}
              aria-label="Delete"
              title="Delete section"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      {/each}
      
      {#if sections.length === 0}
        <div class="empty-state">
          <Layers size={48} opacity={0.3} />
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
        <Plus size={16} class="mr-1" />
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
                <Calendar size={14} />
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
              <Edit2 size={16} />
            </button>
            
            <button
              class="action-button delete"
              on:click={() => handleMarkerDeleteClick(marker)}
              aria-label="Delete"
              title="Delete event"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      {/each}
      
      {#if markers.length === 0}
        <div class="empty-state">
          <Star size={48} opacity={0.3} />
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
      teamSlug={teamSlug}
      on:save={handleSectionSaved}
      on:close={() => showSectionDialog = false}
    />
  {:else}
    <CreateSectionDialog
      bind:open={showSectionDialog}
      {season}
      section={editingSection}
      teamSlug={teamSlug}
      on:save={handleSectionSaved}
      on:delete={handleSectionSaved}
      on:close={() => showSectionDialog = false}
    />
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
    <CreateMarkerDialog
      bind:open={showMarkerDialog}
      {season}
      marker={editingMarker}
      on:save={handleMarkerSaved}
      on:delete={handleMarkerSaved}
      on:close={() => showMarkerDialog = false}
    />
  {/if}
{/if}

<!-- Confirm Delete Dialogs -->
<ConfirmDialog
  bind:open={confirmDeleteSection}
  title="Delete Section"
  message={`Are you sure you want to delete the section "${confirmDeleteSection?.name}"? This action cannot be undone.`}
  confirmText="Delete"
  cancelText="Cancel"
  confirmVariant="destructive"
  loading={deleteLoading}
  on:confirm={handleSectionDelete}
  on:cancel={() => confirmDeleteSection = null}
/>

<ConfirmDialog
  bind:open={confirmDeleteMarker}
  title="Delete Event"
  message={`Are you sure you want to delete the event "${confirmDeleteMarker?.name || confirmDeleteMarker?.title}"? This action cannot be undone.`}
  confirmText="Delete"
  cancelText="Cancel"
  confirmVariant="destructive"
  loading={deleteLoading}
  on:confirm={handleMarkerDelete}
  on:cancel={() => confirmDeleteMarker = null}
/>

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
