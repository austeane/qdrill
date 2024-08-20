<script>
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { page } from '$app/stores';

  let drill = writable({});
  let comments = writable([]);
  let newComment = writable('');
  let upvotes = writable(0);

  onMount(async () => {
    const response = await fetch(`/api/drills/${$page.params.id}`);
    const data = await response.json();
    drill.set(data);
    upvotes.set(data.upvotes);
    comments.set(data.comments);
  });

  async function addComment() {
    const response = await fetch(`/api/drills/${$page.params.id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ comment: $newComment })
    });
    const data = await response.json();
    comments.update(current => [...current, data]);
    newComment.set('');
  }

  async function upvote() {
    const response = await fetch(`/api/drills/${$page.params.id}/upvote`, {
      method: 'POST'
    });
    const data = await response.json();
    upvotes.set(data.upvotes);
  }
</script>

<svelte:head>
  <title>{$drill.name}</title>
  <meta name="description" content="Details of the selected drill" />
</svelte:head>

<section>
  <h1>{$drill.name}</h1>
  <p>{$drill.brief_description}</p>
  <p>{$drill.detailed_description}</p>
  <p>Skill Level: {$drill.skill_level}</p>
  <p>Complexity: {$drill.complexity}</p>
  <p>Suggested Length: {$drill.suggested_length}</p>
  <p>Number of People Required: {$drill.number_of_people}</p>
  <p>Skills Focused On: {$drill.skills_focused_on.join(', ')}</p>
  <p>Positions Focused On: {$drill.positions_focused_on.join(', ')}</p>
  {#if $drill.video_link}
    <p>Video: <a href={$drill.video_link} target="_blank">Watch Video</a></p>
  {/if}
  {#if $drill.images}
    <div>
      {#each $drill.images as image}
        <img src={image} alt="Drill Image" />
      {/each}
    </div>
  {/if}

  <button on:click={upvote}>Upvote ({$upvotes})</button>

  <div>
    <h2>Comments</h2>
    <ul>
      {#each $comments as comment}
        <li>{comment}</li>
      {/each}
    </ul>
    <input type="text" bind:value={$newComment} placeholder="Add a comment" />
    <button on:click={addComment}>Submit</button>
  </div>
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

  p {
    text-align: center;
  }

  img {
    max-width: 100%;
    height: auto;
    margin: 1rem 0;
  }

  button {
    margin: 1rem 0;
    padding: 0.5rem 1rem;
    font-size: 1rem;
    cursor: pointer;
  }

  div {
    width: 100%;
    max-width: 600px;
    margin: 1rem 0;
  }

  ul {
    list-style: none;
    padding: 0;
  }

  li {
    margin: 0.5rem 0;
  }

  input {
    width: 100%;
    padding: 0.5rem;
    font-size: 1rem;
    margin: 0.5rem 0;
  }
</style>
