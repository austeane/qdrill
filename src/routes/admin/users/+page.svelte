<script>
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	export let data;
	export let form;

	$: users = data.users || [];
</script>

<div class="container mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold mb-8">User Management</h1>

	{#if form?.error}
		<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
			{form.error}
		</div>
	{/if}

	{#if form?.success}
		<div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
			User role updated successfully
		</div>
	{/if}

	<div class="bg-white shadow overflow-hidden sm:rounded-md">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Name
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Email
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Role
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Joined
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Actions
					</th>
				</tr>
			</thead>
			<tbody class="bg-white divide-y divide-gray-200">
				{#each users as user}
					<tr>
						<td class="px-6 py-4 whitespace-nowrap">
							<div class="text-sm font-medium text-gray-900">
								{user.name || 'N/A'}
							</div>
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<div class="text-sm text-gray-500">
								{user.email || 'N/A'}
							</div>
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">
								{user.role}
							</span>
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
							{new Date(user.created_at).toLocaleDateString()}
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
							<form method="POST" action="?/updateRole" use:enhance={() => {
								return async ({ result }) => {
									if (result.type === 'success') {
										await invalidateAll();
									}
								};
							}}>
								<input type="hidden" name="userId" value={user.id} />
								<select name="role" class="mr-2 rounded border-gray-300">
									<option value="user" selected={user.role === 'user'}>User</option>
									<option value="admin" selected={user.role === 'admin'}>Admin</option>
								</select>
								<button type="submit" class="text-indigo-600 hover:text-indigo-900">
									Update
								</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>