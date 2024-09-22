import { query } from './db.js';

export async function saveFeedback({ feedback, deviceInfo, page, name = null, email = null }) {
    const text = `
        INSERT INTO feedback (feedback, device_info, page_url, name, email)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;
    const values = [feedback, deviceInfo, page, name, email];
    const res = await query(text, values);
    return res.rows[0];
}

export async function getAllFeedback() {
    const text = `
        SELECT * FROM feedback
        ORDER BY timestamp DESC
    `;
    const res = await query(text);
    return res.rows;
}