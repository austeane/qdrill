<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { toast } from '@zerodevx/svelte-toast';

  export let planId;
  export let createdBy = null;
  export let onDelete = () => {};

  $: canDelete = $page.data.session?.user?.id === createdBy || 
                 process.env.NODE_ENV === 'development';

  async function deletePlan() {
    console.log('[DeletePracticePlan] Starting deletion process:', {
      planId,
      createdBy,
      currentUserId: $page.data.session?.user?.id,
      canDelete
    });

    if (!confirm('Are you sure you want to delete this practice plan?')) {
      return;
    }

    try {
      if (!planId) {
        throw new Error('No plan ID provided');
      }

      const response = await fetch(`/api/practice-plans/${planId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[DeletePracticePlan] Response not OK:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        onDelete();
        goto('/practice-plans');
        toast.push('Practice plan deleted successfully', {
          theme: { '--toastBackground': '#48bb78', '--toastColor': '#fff' }
        });
      } else {
        throw new Error(data.error || 'Failed to delete practice plan');
      }
    } catch (error) {
      console.error('Error deleting practice plan:', error);
      toast.push('Failed to delete practice plan. Please try again.', {
        theme: { '--toastBackground': '#f56565', '--toastColor': '#fff' }
      });
    }
  }
</script>

{#if canDelete}
  <button
    on:click={deletePlan}
    class="btn btn-danger"
    data-plan-id={planId}
  >
    Delete Plan ({planId})
  </button>
{/if} 