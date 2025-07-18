# EmptyState Component

This document describes the reusable `EmptyState` component used throughout QDrill to provide helpful messaging when no data is available.

## Overview

`EmptyState.svelte` centralizes the appearance and behaviour of empty states. It accepts a title, optional description, an icon type and a list of call-to-action buttons. Pages can also display search suggestions when filters yield no results.

## Props

- `title` _(string)_ – heading text
- `description` _(string)_ – optional detail shown below the title
- `icon` _("search" | "drills" | "plans" | "formations")_ – determines which icon to display
- `actions` _(Array)_ – objects with `{ label, href?, onClick?, primary? }`
- `showSearchSuggestion` _(boolean)_ – toggles a helpful hint box

## Usage

```svelte
<script>
	import EmptyState from '$lib/components/EmptyState.svelte';
	const actions = [{ label: 'Create Drill', href: '/drills/create', primary: true }];
</script>

<EmptyState
	title="No drills available"
	description="Get started by creating your first drill."
	icon="drills"
	{actions}
/>
```

The component ensures a consistent design and reduces repetitive markup on each page.
