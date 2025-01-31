<script>
  export let size = 'md';
  export let color = 'blue';
  export let overlay = false;
  export let fullScreen = false;

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const colorClasses = {
    blue: 'border-blue-500',
    white: 'border-white',
    gray: 'border-gray-500'
  };

  $: spinnerClasses = `${sizeClasses[size]} ${colorClasses[color]}`;
</script>

{#if fullScreen}
  <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div class="animate-spin rounded-full border-4 border-t-transparent {spinnerClasses}"></div>
  </div>
{:else if overlay}
  <div class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
    <div class="animate-spin rounded-full border-4 border-t-transparent {spinnerClasses}"></div>
  </div>
{:else}
  <div class="animate-spin rounded-full border-4 border-t-transparent {spinnerClasses}"></div>
{/if} 