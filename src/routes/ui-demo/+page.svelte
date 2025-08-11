<script>
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import Textarea from '$lib/components/ui/Textarea.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import Checkbox from '$lib/components/ui/Checkbox.svelte';
  import Dialog from '$lib/components/ui/Dialog.svelte';
  import Tabs from '$lib/components/ui/Tabs.svelte';
  import Skeleton from '$lib/components/ui/Skeleton.svelte';
  import { theme } from '$lib/stores/themeStore';
  import { Sun, Moon } from 'lucide-svelte';
  import { onMount } from 'svelte';
  
  let dialogOpen = false;
  let inputValue = '';
  let selectValue = '';
  let textareaValue = '';
  let checkboxValue = false;
  let loadingButton = false;
  let selectedTab = 'tab1';
  
  const selectOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' }
  ];
  
  const tabs = [
    { value: 'tab1', label: 'Tab 1' },
    { value: 'tab2', label: 'Tab 2' },
    { value: 'tab3', label: 'Tab 3' }
  ];
  
  function handleButtonClick() {
    loadingButton = true;
    setTimeout(() => {
      loadingButton = false;
    }, 2000);
  }
  
  onMount(() => {
    theme.init();
  });
</script>

<div class="container">
  <div class="header">
    <h1>UI Component Library Demo</h1>
    <Button variant="ghost" size="sm" on:click={theme.toggle}>
      {#if $theme === 'light'}
        <Moon size={20} />
      {:else}
        <Sun size={20} />
      {/if}
    </Button>
  </div>
  
  <div class="section">
    <h2>Buttons</h2>
    <div class="grid">
      <Button variant="primary">Primary Button</Button>
      <Button variant="secondary">Secondary Button</Button>
      <Button variant="ghost">Ghost Button</Button>
      <Button variant="destructive">Destructive Button</Button>
    </div>
    
    <h3>Button Sizes</h3>
    <div class="grid">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
    
    <h3>Button States</h3>
    <div class="grid">
      <Button disabled>Disabled</Button>
      <Button loading={loadingButton} on:click={handleButtonClick}>
        Click for Loading
      </Button>
      <Button href="/ui-demo">Link Button</Button>
    </div>
  </div>
  
  <div class="section">
    <h2>Form Inputs</h2>
    <div class="form-grid">
      <Input
        label="Text Input"
        placeholder="Enter text..."
        bind:value={inputValue}
        description="This is a helpful description"
      />
      
      <Input
        label="Email Input"
        type="email"
        placeholder="email@example.com"
        required
        error={inputValue && !inputValue.includes('@') ? 'Please enter a valid email' : ''}
      />
      
      <Select
        label="Select Input"
        bind:value={selectValue}
        options={selectOptions}
        placeholder="Choose an option"
      />
      
      <Textarea
        label="Textarea"
        placeholder="Enter multiple lines..."
        bind:value={textareaValue}
        rows={4}
      />
      
      <Checkbox
        label="Checkbox Option"
        bind:checked={checkboxValue}
        description="This is a checkbox description"
      />
    </div>
  </div>
  
  <div class="section">
    <h2>Cards</h2>
    <div class="card-grid">
      <Card variant="default">
        <h3 slot="header">Default Card</h3>
        <p>This is a default card with header and content.</p>
        <div slot="footer">
          <Button size="sm">Action</Button>
        </div>
      </Card>
      
      <Card variant="bordered">
        <h3 slot="header">Bordered Card</h3>
        <p>This card has a border around it.</p>
      </Card>
      
      <Card variant="elevated">
        <h3 slot="header">Elevated Card</h3>
        <p>This card has a shadow for elevation.</p>
      </Card>
    </div>
  </div>
  
  <div class="section">
    <h2>Badges</h2>
    <div class="badge-grid">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="info">Info</Badge>
    </div>
    
    <h3>Badge Sizes</h3>
    <div class="badge-grid">
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  </div>
  
  <div class="section">
    <h2>Tabs</h2>
    <Tabs bind:value={selectedTab} {tabs}>
      <div class="tab-content">
        {#if selectedTab === 'tab1'}
          <p>Content for Tab 1</p>
          <p>This is the first tab's content area.</p>
        {:else if selectedTab === 'tab2'}
          <p>Content for Tab 2</p>
          <p>This is the second tab's content area.</p>
        {:else if selectedTab === 'tab3'}
          <p>Content for Tab 3</p>
          <p>This is the third tab's content area.</p>
        {/if}
      </div>
    </Tabs>
  </div>
  
  <div class="section">
    <h2>Dialog</h2>
    <Button on:click={() => dialogOpen = true}>
      Open Dialog
    </Button>
    
    <Dialog bind:open={dialogOpen} title="Example Dialog" description="This is a dialog description">
      <p>This is the dialog content. You can put any content here.</p>
      
      <div slot="footer">
        <Button variant="ghost" on:click={() => dialogOpen = false}>Cancel</Button>
        <Button variant="primary" on:click={() => dialogOpen = false}>Confirm</Button>
      </div>
    </Dialog>
  </div>
  
  <div class="section">
    <h2>Skeleton Loaders</h2>
    <div class="skeleton-grid">
      <div>
        <h3>Rectangle</h3>
        <Skeleton variant="rect" height="100px" />
      </div>
      <div>
        <h3>Lines</h3>
        <Skeleton variant="line" />
        <br />
        <Skeleton variant="line" width="80%" />
        <br />
        <Skeleton variant="line" width="60%" />
      </div>
      <div>
        <h3>Circle</h3>
        <Skeleton variant="circle" width="60px" height="60px" />
      </div>
    </div>
  </div>
</div>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--space-8);
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-8);
  }
  
  .section {
    margin-bottom: var(--space-12);
  }
  
  h2 {
    margin-bottom: var(--space-4);
    color: var(--color-text-primary);
  }
  
  h3 {
    margin-top: var(--space-6);
    margin-bottom: var(--space-3);
    color: var(--color-text-secondary);
  }
  
  .grid {
    display: flex;
    gap: var(--space-3);
    flex-wrap: wrap;
    align-items: center;
  }
  
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--space-4);
  }
  
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--space-4);
  }
  
  .badge-grid {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
    align-items: center;
  }
  
  .skeleton-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space-4);
  }
  
  .tab-content {
    padding: var(--space-4) 0;
  }
</style>