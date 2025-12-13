import { page } from '$app/state';
import { signIn } from '$lib/auth-client';

/**
 * Svelte action to intercept practice plan form submission when the
 * user is not authenticated. It saves the plan data via the pending
 * plans API and then triggers the sign-in flow.
 */
export function practicePlanAuthHandler(form) {
	async function handleSubmit(event) {
		const session = page.data?.session;
		if (!session) {
			event.preventDefault();
			const formData = new FormData(form);
			const obj = {};
			for (const [key, value] of formData.entries()) {
				if (obj[key]) {
					if (!Array.isArray(obj[key])) obj[key] = [obj[key]];
					obj[key].push(value);
				} else {
					obj[key] = value;
				}
			}
			try {
				await fetch('/api/pending-plans', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(obj)
				});
			} catch (err) {
				console.error('Failed to save pending plan', err);
			}
			signIn.social({ provider: 'google' });
		}
	}
	form.addEventListener('submit', handleSubmit);
	return {
		destroy() {
			form.removeEventListener('submit', handleSubmit);
		}
	};
}
