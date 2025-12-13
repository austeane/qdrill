export class FeedbackStore {
	modalVisible = $state(false);

	open() {
		this.modalVisible = true;
	}

	close() {
		this.modalVisible = false;
	}
}

export const feedbackStore = new FeedbackStore();
