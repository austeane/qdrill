/**
 * ICS Calendar Feed Service
 * Generates iCalendar format feeds for seasons and practice plans
 */

import { kyselyDb } from '$lib/server/db.js';
import { NotFoundError } from '$lib/server/errors.js';
import crypto from 'crypto';

class IcsService {
	/**
	 * Generate a share token for a season
	 */
	async generateShareToken(seasonId) {
		// Use seasons.ics_token (no expires column in schema)
		const token = crypto.randomBytes(32).toString('hex');
		await kyselyDb
			.updateTable('seasons')
			.set({ ics_token: token })
			.where('id', '=', seasonId)
			.execute();

		return token;
	}

	/**
	 * Validate a share token
	 */
	async validateShareToken(seasonId, token) {
		const row = await kyselyDb
			.selectFrom('seasons')
			.select('id')
			.where('id', '=', seasonId)
			.where('ics_token', '=', token)
			.executeTakeFirst();

		return !!row;
	}

	/**
	 * Revoke a share token
	 */
	async revokeShareToken(seasonId) {
		await kyselyDb
			.updateTable('seasons')
			.set({ ics_token: null })
			.where('id', '=', seasonId)
			.execute();
	}

	/**
	 * Get season data with practices and markers for ICS generation
	 */
	async getSeasonDataForIcs(seasonId, includeUnpublished = false) {
		// Get season details
		const season = await kyselyDb
			.selectFrom('seasons as s')
			.innerJoin('teams as t', 's.team_id', 't.id')
			.selectAll('s')
			.select(['t.name as team_name', 't.timezone', 't.default_start_time'])
			.where('s.id', '=', seasonId)
			.executeTakeFirst();

		if (!season) {
			throw new NotFoundError('Season not found');
		}

		// Get practices
		// If includeUnpublished is false (public token), return only published
		let practiceQb = kyselyDb
			.selectFrom('practice_plans')
			.selectAll()
			.where('season_id', '=', seasonId);
		if (!includeUnpublished) {
			practiceQb = practiceQb.where('is_published', '=', true);
		}
		const practicesResult = await practiceQb
			.orderBy('scheduled_date', 'asc')
			.orderBy('start_time', 'asc')
			.execute();

		// Get markers
		const markersResult = await kyselyDb
			.selectFrom('season_markers')
			.selectAll()
			.where('season_id', '=', seasonId)
			.orderBy('start_date', 'asc')
			.execute();

		return {
			season,
			practices: practicesResult,
			markers: markersResult
		};
	}

	/**
	 * Generate ICS calendar content
	 */
	generateIcs(data) {
		const { season, practices, markers } = data;
		const timezone = season.timezone || 'America/New_York';
		const defaultStartTime = season.default_start_time || '18:00:00';

		// ICS header
		let ics = [
			'BEGIN:VCALENDAR',
			'VERSION:2.0',
			'PRODID:-//QDrill//Season Calendar//EN',
			`X-WR-CALNAME:${this.escapeIcs(season.team_name)} - ${this.escapeIcs(season.name)}`,
			`X-WR-CALDESC:Practice schedule for ${this.escapeIcs(season.name)}`,
			`X-WR-TIMEZONE:${timezone}`,
			'CALSCALE:GREGORIAN',
			'METHOD:PUBLISH'
		];

		// Add timezone definition
		ics.push(...this.getTimezoneDefinition(timezone));

		// Add practices as events
		practices.forEach((practice) => {
			const uid = `practice-${practice.id}@qdrill.com`;
			const startTime = practice.start_time || defaultStartTime;
			const startDateTime = this.formatDateTime(practice.scheduled_date, startTime, timezone);
			const endDateTime = this.calculateEndTime(startDateTime, practice.duration || 120);

			ics.push(
				'BEGIN:VEVENT',
				`UID:${uid}`,
				`DTSTAMP:${this.formatDateTime(new Date())}`,
				`DTSTART;TZID=${timezone}:${startDateTime}`,
				`DTEND;TZID=${timezone}:${endDateTime}`,
				`SUMMARY:${this.escapeIcs(practice.name || 'Practice')}`,
				`DESCRIPTION:${this.escapeIcs(practice.description || '')}`,
				`LOCATION:${this.escapeIcs(practice.location || '')}`,
				'STATUS:CONFIRMED',
				'END:VEVENT'
			);
		});

		// Add markers as all-day events
		markers.forEach((marker) => {
			const uid = `marker-${marker.id}@qdrill.com`;
			const startDate = this.formatDate(marker.start_date);
			const endDate = marker.end_date
				? this.formatDate(this.addDays(new Date(marker.end_date), 1))
				: this.formatDate(this.addDays(new Date(marker.start_date), 1));

			const emoji =
				{
					tournament: '🏆',
					scrimmage: '⚔️',
					break: '🏖️',
					custom: '📌'
				}[marker.type] || '📌';

			ics.push(
				'BEGIN:VEVENT',
				`UID:${uid}`,
				`DTSTAMP:${this.formatDateTime(new Date())}`,
				`DTSTART;VALUE=DATE:${startDate}`,
				`DTEND;VALUE=DATE:${endDate}`,
				`SUMMARY:${emoji} ${this.escapeIcs(marker.title)}`,
				`DESCRIPTION:${this.escapeIcs(marker.description || marker.notes || '')}`,
				'END:VEVENT'
			);
		});

		// ICS footer
		ics.push('END:VCALENDAR');

		return ics.join('\r\n');
	}

	/**
	 * Helper: Escape special characters for ICS format
	 */
	escapeIcs(str) {
		if (!str) return '';
		return str
			.replace(/\\/g, '\\\\')
			.replace(/;/g, '\\;')
			.replace(/,/g, '\\,')
			.replace(/\n/g, '\\n')
			.replace(/\r/g, '');
	}

	/**
	 * Helper: Format date for ICS (YYYYMMDD)
	 */
	formatDate(date) {
		const d = new Date(date);
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${year}${month}${day}`;
	}

	/**
	 * Helper: Format datetime for ICS (YYYYMMDDTHHMMSS)
	 */
	formatDateTime(date, time = null, timezone = null) {
		const d = new Date(date);

		if (time && typeof time === 'string') {
			const [hours, minutes, seconds] = time.split(':').map(Number);
			d.setHours(hours, minutes, seconds || 0);
		}

		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		const hours = String(d.getHours()).padStart(2, '0');
		const minutes = String(d.getMinutes()).padStart(2, '0');
		const seconds = String(d.getSeconds()).padStart(2, '0');

		if (timezone) {
			return `${year}${month}${day}T${hours}${minutes}${seconds}`;
		} else {
			return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
		}
	}

	/**
	 * Helper: Calculate end time based on duration
	 */
	calculateEndTime(startDateTime, durationMinutes) {
		// Parse the datetime string
		const year = parseInt(startDateTime.substr(0, 4));
		const month = parseInt(startDateTime.substr(4, 2)) - 1;
		const day = parseInt(startDateTime.substr(6, 2));
		const hours = parseInt(startDateTime.substr(9, 2));
		const minutes = parseInt(startDateTime.substr(11, 2));

		const start = new Date(year, month, day, hours, minutes);
		const end = new Date(start.getTime() + durationMinutes * 60000);

		return this.formatDateTime(end);
	}

	/**
	 * Helper: Add days to a date
	 */
	addDays(date, days) {
		const result = new Date(date);
		result.setDate(result.getDate() + days);
		return result;
	}

	/**
	 * Helper: Get timezone definition for common US timezones
	 */
	getTimezoneDefinition(timezone) {
		const definitions = {
			'America/New_York': [
				'BEGIN:VTIMEZONE',
				'TZID:America/New_York',
				'BEGIN:DAYLIGHT',
				'TZOFFSETFROM:-0500',
				'TZOFFSETTO:-0400',
				'TZNAME:EDT',
				'DTSTART:19700308T020000',
				'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
				'END:DAYLIGHT',
				'BEGIN:STANDARD',
				'TZOFFSETFROM:-0400',
				'TZOFFSETTO:-0500',
				'TZNAME:EST',
				'DTSTART:19701101T020000',
				'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
				'END:STANDARD',
				'END:VTIMEZONE'
			],
			'America/Chicago': [
				'BEGIN:VTIMEZONE',
				'TZID:America/Chicago',
				'BEGIN:DAYLIGHT',
				'TZOFFSETFROM:-0600',
				'TZOFFSETTO:-0500',
				'TZNAME:CDT',
				'DTSTART:19700308T020000',
				'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
				'END:DAYLIGHT',
				'BEGIN:STANDARD',
				'TZOFFSETFROM:-0500',
				'TZOFFSETTO:-0600',
				'TZNAME:CST',
				'DTSTART:19701101T020000',
				'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
				'END:STANDARD',
				'END:VTIMEZONE'
			],
			'America/Los_Angeles': [
				'BEGIN:VTIMEZONE',
				'TZID:America/Los_Angeles',
				'BEGIN:DAYLIGHT',
				'TZOFFSETFROM:-0800',
				'TZOFFSETTO:-0700',
				'TZNAME:PDT',
				'DTSTART:19700308T020000',
				'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU',
				'END:DAYLIGHT',
				'BEGIN:STANDARD',
				'TZOFFSETFROM:-0700',
				'TZOFFSETTO:-0800',
				'TZNAME:PST',
				'DTSTART:19701101T020000',
				'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU',
				'END:STANDARD',
				'END:VTIMEZONE'
			]
		};

		return definitions[timezone] || [];
	}
}

export const icsService = new IcsService();
export default icsService;
