<script>
  export let text = '';
  export let position = 'top'; // top, bottom, left, right

  let showTooltip = false;
  let timeout;

  function handleMouseEnter() {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      showTooltip = true;
    }, 500); // 500ms delay
  }

  function handleMouseLeave() {
    clearTimeout(timeout);
    showTooltip = false;
  }
</script>

<div
  class="relative inline-block"
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  role="tooltip"
>
  <slot />

  {#if showTooltip}
    <div
      class="absolute z-10 px-3 py-2 text-sm text-white bg-gray-900 rounded-md shadow-lg pointer-events-none whitespace-nowrap"
      class:bottom-full={position === 'top'}
      class:top-full={position === 'bottom'}
      class:right-full={position === 'left'}
      class:left-full={position === 'right'}
      class:mb-2={position === 'top'}
      class:mt-2={position === 'bottom'}
      class:mr-2={position === 'left'}
      class:ml-2={position === 'right'}
      class:left-[50%]={position === 'top' || position === 'bottom'}
      class:top-[50%]={position === 'left' || position === 'right'}
      class:-translate-x-[50%]={position === 'top' || position === 'bottom'}
      class:-translate-y-[50%]={position === 'left' || position === 'right'}
    >
      {text}

      <!-- Arrow -->
      <div
        class="absolute w-2 h-2 bg-gray-900 rotate-45"
        class:top-full={position === 'top'}
        class:bottom-full={position === 'bottom'}
        class:right-full={position === 'left'}
        class:left-full={position === 'right'}
        class:left-[50%]={position === 'top' || position === 'bottom'}
        class:top-[50%]={position === 'left' || position === 'right'}
        class:-translate-x-[50%]={position === 'top' || position === 'bottom'}
        class:-translate-y-[50%]={position === 'left' || position === 'right'}
        class:-mt-1={position === 'top'}
        class:-mb-1={position === 'bottom'}
        class:-mr-1={position === 'left'}
        class:-ml-1={position === 'right'}
      ></div>
    </div>
  {/if}
</div>
