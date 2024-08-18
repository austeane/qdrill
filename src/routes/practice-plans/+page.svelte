<script>
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';

  let practicePlans = writable([]);

  onMount(async () => {
    const response = await fetch('/api/practice-plans');
    const data = await response.json();
    practicePlans.set(data);
  });
</script>

<svelte:head>
  <title>Practice Plans</title>
  <meta name="description" content="List of all practice plans" />
</svelte:head>

<section>
  <h1>Practice Plans</h1>

  <ul>
    {#each $practicePlans as plan}
      <li>
        <h2>{plan.name}</h2>
        <p>{plan.description}</p>
      </li>
    {/each}
  </ul>
</section>

<style>
  section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 0.6;
  }

  h1 {
    width: 100%;
    text-align: center;
  }

  ul {
    list-style: none;
    padding: 0;
  }

  li {
    margin: 1rem 0;
  }

  h2 {
    font-size: 1.5rem;
    margin: 0;
  }

  p {
    margin: 0.5rem 0 0;
  }
</style>
