import { query } from './db.js';

export async function saveFeedback({
	feedback,
	deviceInfo,
	page,
	name = null,
	email = null,
	feedbackType
}) {
	const text = `
        INSERT INTO feedback (feedback, device_info, page_url, name, email, feedback_type, upvotes)
        VALUES ($1, $2, $3, $4, $5, $6, 0)
        RETURNING *
    `;
	const values = [feedback, deviceInfo, page, name, email, feedbackType];
	const res = await query(text, values);
	return res.rows[0];
}

export async function getAllFeedback() {
	const text = `
        SELECT id, feedback, feedback_type, timestamp, upvotes FROM feedback
        ORDER BY timestamp DESC
    `;
	const res = await query(text);
	return res.rows;
}

export async function upvoteFeedback(id) {
	const text = `
        UPDATE feedback
        SET upvotes = upvotes + 1
        WHERE id = $1
        RETURNING id, upvotes
    `;
	const res = await query(text, [id]);
	return res.rows[0];
}

export async function deleteFeedback(id) {
	const text = `
        DELETE FROM feedback
        WHERE id = $1
        RETURNING id
    `;
	const res = await query(text, [id]);
	return res.rows[0];
}
