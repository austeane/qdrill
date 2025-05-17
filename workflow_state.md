# Workflow State: Create East April TC Practice Plan

**Goal:** Create the "East April TC Practice" plan based on `East April TC Practice.docx.md` using the API wrapper scripts.

**Source Document:** `East April TC Practice.docx.md`

**Related Documentation:**

- `docs/guides/llm_creating_drills.md`
- `docs/guides/llm_creating_practice_plans.md`
- `tickets/llm-practice-plan-tools.md`

**Scripts Involved:**

- `create_drill_script.py`
- `create_practice_plan_script.py`

**Overall Workflow Steps:**

1.  Parse source document for plan details and drills.
2.  Search for existing drills via API (`/api/drills/search`).
3.  Prepare data for missing drills.
4.  Request user to create missing drills using `create_drill_script.py`.
5.  Prepare data for the practice plan, linking drill items using their IDs.
6.  **[DONE]** Request user to create the practice plan using `create_practice_plan_script.py` (ID: `49`).
7.  **[Current Step]** Create documentation (`docs/guides/llm_creating_practice_plans.md`).

**Drill Identification & Status:**

- **Found:**
  - "Five star" (API Name: "5 point star"): ID `62`
  - "Passing Around Hoops": ID `149`
  - "Boston beater drill": ID `143`
- **Created:**
  - "Long-short-long": ID `150`.
  - "Tackling 2v2": ID `151`.
  - "Beating Ball Carrier (Free Beater)": ID `152`.

**Practice Plan Data (Prepared for Step 6):**

```json
{
	"name": "East April TC Practice",
	"description": "Team Canada East practice plan for April 26, 2025, focusing on position-specific drills and strategic offense/defense.",
	"practice_goals": ["Warmup", "Chaser Skills", "Beater Skills", "Strategic Play", "Scrimmaging"],
	"phase_of_season": "Mid season",
	"visibility": "public",
	"is_editable_by_others": true,
	"estimated_number_of_participants": 20,
	"start_time": "08:30:00",
	"sections": [
		{
			"name": "(8:30) Outdoor Warm up",
			"order": 0,
			"items": [{ "type": "note", "name": "Standard outdoor warmup", "duration": 30 }]
		},
		{
			"name": "(9:00) Position Specific Warm ups",
			"order": 1,
			"notes": "Chasers and Beaters split. Volunteers set up pitch. Beater warmup happens concurrently.",
			"items": [
				{ "type": "drill", "name": "Five star", "duration": 7, "drill_id": 62 },
				{ "type": "drill", "name": "Long-short-long", "duration": 8, "drill_id": 150 },
				{ "type": "break", "name": "Beater Warmup Placeholder", "duration": 15 }
			]
		},
		{
			"name": "(9:15) Position Specific Drills",
			"order": 2,
			"notes": "Chaser/Beater drills run concurrently (total section time 30min). Seekers have separate drills.",
			"items": [
				{ "type": "note", "name": "Chasers: Tackling & Passing", "duration": 0 },
				{ "type": "drill", "name": "Tackling 2v2", "duration": 15, "drill_id": 151 },
				{ "type": "drill", "name": "Passing Around Hoops", "duration": 15, "drill_id": 149 },
				{ "type": "note", "name": "Beaters: Beating & Boston", "duration": 0 },
				{
					"type": "drill",
					"name": "Beating Ball Carrier (Free Beater)",
					"duration": 15,
					"drill_id": 152
				},
				{ "type": "drill", "name": "Boston beater drill", "duration": 15, "drill_id": 143 }
			]
		},
		{
			"name": "(9:45) TC Strategic One Runs",
			"order": 3,
			"items": [
				{ "type": "note", "name": "General Strategic Intro", "duration": 10 },
				{ "type": "note", "name": "Hoop Defense Intro & Run", "duration": 10 },
				{ "type": "note", "name": "Attacking VS Hoop Concepts", "duration": 30 },
				{ "type": "note", "name": "2-2 Defense Intro & Run", "duration": 10 },
				{ "type": "note", "name": "Attacking vs 2-2 Concepts", "duration": 30 }
			]
		},
		{
			"name": "(11:15) Buffer",
			"order": 4,
			"items": [{ "type": "break", "name": "Buffer Time / Water Break", "duration": 15 }]
		},
		{
			"name": "(11:30) Scrimmages",
			"order": 5,
			"items": [
				{ "type": "note", "name": "Scrimmage 1 (8 min)", "duration": 8 },
				{ "type": "note", "name": "Scrimmage 2 (8 min)", "duration": 8 },
				{ "type": "note", "name": "Scrimmage 3 (8 min, SOP)", "duration": 8 }
			]
		}
	]
}
```

**Next Action Required (User):**

(No user action required for this step)

**Next Action (Assistant):**

- Proceed to **Step 7**: Create documentation (`docs/guides/llm_creating_practice_plans.md`).

---

## Database Verification Log (Plan ID: 49)

This section details the `psql` commands run to verify the created practice plan against the database and the results obtained.

**DATABASE_URL:** open .env.local

**1. Fetch Practice Plan Metadata (ID: 49)**

- **Query:**
  ```sql
  SELECT id, name, description, visibility, phase_of_season, start_time, estimated_number_of_participants FROM practice_plans WHERE id = 49;
  ```
- **Result:**
  ```
   id |          name          |                                                      description                                                       | visibility | phase_of_season | start_time | estimated_number_of_participants
  ----+------------------------+--------------------------------------------------------------------------------------------------------------------------+------------+-----------------+------------+------------------------------------
   49 | East April TC Practice | Team Canada East practice plan for April 26, 2025, focusing on position-specific drills and strategic offense/defense. | public     | Mid season      | 08:30:00   |                                 20
  (1 row)
  ```
- **Analysis:** Matches intended values.

**2. Fetch Practice Plan Sections (Plan ID: 49)**

- **Query:**
  ```sql
  SELECT id, name, "order", notes FROM practice_plan_sections WHERE practice_plan_id = 49 ORDER BY "order";
  ```
- **Result:**
  ```
   id |               name                | order |                                              notes
  ----+-----------------------------------+-------+------------------------------------------------------------------------------------------------------
   66 | (8:30) Outdoor Warm up            |     0 |
   67 | (9:00) Position Specific Warm ups |     1 | Chasers and Beaters split. Volunteers set up pitch. Beater warmup happens concurrently.
   68 | (9:15) Position Specific Drills   |     2 | Chaser/Beater drills run concurrently (total section time 30min). Seekers have separate drills.
   69 | (9:45) TC Strategic One Runs      |     3 |
   70 | (11:15) Buffer                    |     4 |
   71 | (11:30) Scrimmages                |     5 |
  (6 rows)
  ```
- **Analysis:** Section names and order match the source document.

**3. Fetch Practice Plan Items (Plan ID: 49)**

- **Query:**
  ```sql
  SELECT id, section_id, type, name, duration, drill_id, order_in_plan FROM practice_plan_drills WHERE section_id IN (SELECT id FROM practice_plan_sections WHERE practice_plan_id = 49) ORDER BY section_id, order_in_plan;
  ```
- **Result:**
  ```
    id  | section_id | type  |                name                | duration | drill_id | order_in_plan
  ------+------------+-------+------------------------------------+----------+----------+---------------
   1108 |         66 | break | Standard outdoor warmup            |       30 |          |             0
   1109 |         67 | drill | Five star                          |        7 |       62 |             0
   1110 |         67 | drill | Long-short-long                    |        8 |      150 |             1
   1111 |         67 | break | Beater Warmup Placeholder          |       15 |          |             2
   1112 |         68 | break | Chasers: Tackling & Passing        |        1 |          |             0
   1113 |         68 | drill | Tackling 2v2                       |       15 |      151 |             1
   1114 |         68 | drill | Passing Around Hoops               |       15 |      149 |             2
   1115 |         68 | break | Beaters: Beating & Boston          |        1 |          |             3
   1116 |         68 | drill | Beating Ball Carrier (Free Beater) |       15 |      152 |             4
   1117 |         68 | drill | Boston beater drill                |       15 |      143 |             5
   1118 |         69 | break | General Strategic Intro            |       10 |          |             0
   1119 |         69 | break | Hoop Defense Intro & Run           |       10 |          |             1
   1120 |         69 | break | Attacking VS Hoop Concepts         |       30 |          |             2
   1121 |         69 | break | 2-2 Defense Intro & Run            |       10 |          |             3
   1122 |         69 | break | Attacking vs 2-2 Concepts          |       30 |          |             4
   1123 |         70 | break | Buffer Time / Water Break          |       15 |          |             0
   1124 |         71 | break | Scrimmage 1 (8 min)                |        8 |          |             0
   1125 |         71 | break | Scrimmage 2 (8 min)                |        8 |          |             1
   1126 |         71 | break | Scrimmage 3 (8 min, SOP)           |        8 |          |             2
  (19 rows)
  ```
- **Analysis:** Items align with the submitted data, including corrections for `type` ('note' -> 'break') and `duration` (0 -> 1). Drill IDs are correctly associated.

**4. Fetch Drill Details (IDs: 62, 149, 143, 150, 151, 152)**

- **Query:**
  ```sql
  SELECT id, name, brief_description FROM drills WHERE id IN (62, 149, 143, 150, 151, 152) ORDER BY id;
  ```
- **Result:**
  ```
   id  |                name                |                                         brief_description
  -----+------------------------------------+----------------------------------------------------------------------------------------------------
    62 | 5 point star                       | Passing warmup drill
   143 | Boston Beater Drill                | Beater partner work, decision-making, cardio
   149 | Passing Around Hoops               | Chaser drill focused on triangle positioning and hard, accurate throws.
   150 | Long-short-long                    | Chaser passing warmup drill.
   151 | Tackling 2v2                       | Game-like tackling scenarios for chasers (2v2).
   152 | Beating Ball Carrier (Free Beater) | Beater drill focusing on making beats on the ball carrier, working around a free defensive beater.
  (6 rows)
  ```
- **Analysis:** Drill names and IDs match the drills identified/created.

---

## Database Schema Dump

**1. Table List**

- **Query:** `psql "DATABASE_URL" -c "\dt" | cat`
- **Result:**
  ```
                   List of relations
   Schema |          Name          | Type  |  Owner
  --------+------------------------+-------+---------
   public | account                | table | default
   public | accounts               | table | default
   public | comments               | table | default
   public | drill_diagram_assets   | table | default
   public | drills                 | table | default
   public | feedback               | table | default
   public | formations             | table | default
   public | knex_migrations        | table | default
   public | knex_migrations_lock   | table | default
   public | pgmigrations           | table | default
   public | poll_options           | table | default
   public | practice_plan_drills   | table | default
   public | practice_plan_sections | table | default
   public | practice_plans         | table | default
   public | session                | table | default
   public | sessions               | table | default
   public | skills                 | table | default
   public | teams                  | table | default
   public | user                   | table | default
   public | users                  | table | default
   public | verification           | table | default
   public | verification_requests  | table | default
   public | verification_token     | table | default
   public | votes                  | table | default
  (24 rows)
  ```

**2. Detailed Schema Information (Columns)**

- **Query:** `psql "DATABASE_URL" -c "SELECT table_name, column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position;" | cat`
- **Result:**
  ```
         table_name       |           column_name            |          data_type          | is_nullable |                       column_default
  ------------------------+----------------------------------+-----------------------------+-------------+----------------------------------------------------------------------
   account                | id                               | text                        | NO          |
   account                | accountId                        | text                        | NO          |
   account                | providerId                       | text                        | NO          |
   account                | userId                           | text                        | NO          |
   account                | accessToken                      | text                        | YES         |
   account                | refreshToken                     | text                        | YES         |
   account                | idToken                          | text                        | YES         |
   account                | accessTokenExpiresAt             | timestamp without time zone | YES         |
   account                | refreshTokenExpiresAt            | timestamp without time zone | YES         |
   account                | scope                            | text                        | YES         |
   account                | password                         | text                        | YES         |
   account                | createdAt                        | timestamp without time zone | NO          |
   account                | updatedAt                        | timestamp without time zone | NO          |
   accounts               | id                               | integer                     | NO          | nextval('accounts_id_seq'::regclass)
   accounts               | userId                           | integer                     | NO          |
   accounts               | type                             | character varying           | NO          |
   accounts               | provider                         | character varying           | NO          |
   accounts               | providerAccountId                | character varying           | NO          |
   accounts               | refresh_token                    | text                        | YES         |
   accounts               | access_token                     | text                        | YES         |
   accounts               | expires_at                       | bigint                      | YES         |
   accounts               | id_token                         | text                        | YES         |
   accounts               | scope                            | text                        | YES         |
   accounts               | session_state                    | text                        | YES         |
   accounts               | token_type                       | text                        | YES         |
   comments               | id                               | integer                     | NO          | nextval('comments_id_seq'::regclass)
   comments               | user_id                          | text                        | NO          |
   comments               | drill_id                         | integer                     | YES         |
   comments               | practice_plan_id                 | integer                     | YES         |
   comments               | content                          | text                        | NO          |
   comments               | created_at                       | timestamp with time zone    | YES         | CURRENT_TIMESTAMP
   comments               | updated_at                       | timestamp with time zone    | YES         | CURRENT_TIMESTAMP
   drill_diagram_assets   | id                               | uuid                        | NO          | gen_random_uuid()
   drill_diagram_assets   | hash                             | text                        | NO          |
   drill_diagram_assets   | data                             | text                        | NO          |
   drill_diagram_assets   | mime_type                        | text                        | NO          |
   drill_diagram_assets   | created_at                       | timestamp with time zone    | YES         | now()
   drill_diagram_assets   | last_used_at                     | timestamp with time zone    | YES         | now()
   drills                 | id                               | integer                     | NO          | nextval('drills_id_seq'::regclass)
   drills                 | name                             | character varying           | NO          |
   drills                 | brief_description                | text                        | NO          |
   drills                 | detailed_description             | text                        | YES         |
   drills                 | skill_level                      | ARRAY                       | NO          |
   drills                 | complexity                       | character varying           | YES         |
   drills                 | suggested_length                 | character varying           | NO          |
   drills                 | number_of_people_min             | integer                     | YES         | 0
   drills                 | number_of_people_max             | integer                     | YES         | 99
   drills                 | skills_focused_on                | ARRAY                       | YES         |
   drills                 | positions_focused_on             | ARRAY                       | YES         |
   drills                 | video_link                       | character varying           | YES         |
   drills                 | images                           | ARRAY                       | YES         |
   drills                 | diagrams                         | ARRAY                       | YES         |
   drills                 | drill_type                       | ARRAY                       | YES         |
   drills                 | upload_source                    | character varying           | NO          | 'single'::character varying
   drills                 | created_by                       | text                        | YES         |
   drills                 | is_editable_by_others            | boolean                     | YES         | false
   drills                 | visibility                       | character varying           | YES         | 'public'::character varying
   drills                 | upvotes                          | integer                     | YES         | 0
   drills                 | date_created                     | timestamp with time zone    | NO          | CURRENT_TIMESTAMP
   drills                 | parent_drill_id                  | integer                     | YES         |
   drills                 | search_vector                    | tsvector                    | YES         |
   feedback               | id                               | integer                     | NO          | nextval('feedback_id_seq'::regclass)
   feedback               | feedback                         | text                        | NO          |
   feedback               | device_info                      | text                        | YES         |
   feedback               | page_url                         | text                        | YES         |
   feedback               | name                             | text                        | YES         |
   feedback               | email                            | text                        | YES         |
   feedback               | feedback_type                    | character varying           | NO          |
   feedback               | upvotes                          | integer                     | YES         | 0
   feedback               | timestamp                        | timestamp with time zone    | YES         | CURRENT_TIMESTAMP
   formations             | id                               | integer                     | NO          | nextval('formations_id_seq'::regclass)
   formations             | name                             | character varying           | NO          |
   formations             | brief_description                | text                        | YES         |
   formations             | detailed_description             | text                        | YES         |
   formations             | diagrams                         | ARRAY                       | YES         |
   formations             | created_by                       | text                        | YES         |
   formations             | is_editable_by_others            | boolean                     | YES         | false
   formations             | visibility                       | character varying           | YES         | 'public'::character varying
   formations             | created_at                       | timestamp without time zone | YES         | CURRENT_TIMESTAMP
   formations             | updated_at                       | timestamp without time zone | YES         | CURRENT_TIMESTAMP
   formations             | tags                             | ARRAY                       | YES         |
   formations             | formation_type                   | character varying           | YES         |
   formations             | search_vector                    | tsvector                    | YES         |
   knex_migrations        | id                               | integer                     | NO          | nextval('knex_migrations_id_seq'::regclass)
   knex_migrations        | name                             | character varying           | YES         |
   knex_migrations        | batch                            | integer                     | YES         |
   knex_migrations        | migration_time                   | timestamp with time zone    | YES         |
   knex_migrations_lock   | index                            | integer                     | NO          | nextval('knex_migrations_lock_index_seq'::regclass)
   knex_migrations_lock   | is_locked                        | integer                     | YES         |
   pgmigrations           | id                               | integer                     | NO          | nextval('pgmigrations_id_seq'::regclass)
   pgmigrations           | name                             | character varying           | NO          |
   pgmigrations           | run_on                           | timestamp without time zone | NO          |
   poll_options           | id                               | integer                     | NO          | nextval('poll_options_id_seq'::regclass)
   poll_options           | description                      | text                        | NO          |
   poll_options           | votes                            | integer                     | YES         | 0
   poll_options           | drill_link                       | text                        | YES         |
   poll_options           | created_at                       | timestamp with time zone    | YES         | CURRENT_TIMESTAMP
   practice_plan_drills   | id                               | integer                     | NO          | nextval('practice_plan_drills_id_seq'::regclass)
   practice_plan_drills   | practice_plan_id                 | integer                     | YES         |
   practice_plan_drills   | drill_id                         | integer                     | YES         |
   practice_plan_drills   | order_in_plan                    | integer                     | NO          |
   practice_plan_drills   | duration                         | integer                     | NO          |
   practice_plan_drills   | type                             | character varying           | NO          |
   practice_plan_drills   | created_at                       | timestamp without time zone | YES         | now()
   practice_plan_drills   | diagram_data                     | jsonb                       | YES         |
   practice_plan_drills   | parallel_group_id                | text                        | YES         |
   practice_plan_drills   | section_id                       | integer                     | YES         |
   practice_plan_drills   | parallel_timeline                | character varying           | YES         |
   practice_plan_drills   | group_timelines                  | ARRAY                       | YES         |
   practice_plan_drills   | name                             | character varying           | YES         |
   practice_plan_sections | id                               | integer                     | NO          | nextval('practice_plan_sections_id_seq'::regclass)
   practice_plan_sections | practice_plan_id                 | integer                     | NO          |
   practice_plan_sections | name                             | character varying           | NO          |
   practice_plan_sections | order                            | integer                     | NO          |
   practice_plan_sections | goals                            | jsonb                       | YES         | '[]'::jsonb
   practice_plan_sections | notes                            | text                        | YES         |
   practice_plan_sections | created_at                       | timestamp without time zone | YES         | CURRENT_TIMESTAMP
   practice_plan_sections | updated_at                       | timestamp without time zone | YES         | CURRENT_TIMESTAMP
   practice_plans         | id                               | integer                     | NO          | nextval('practice_plans_id_seq'::regclass)
   practice_plans         | name                             | character varying           | NO          |
   practice_plans         | description                      | text                        | YES         |
   practice_plans         | practice_goals                   | ARRAY                       | YES         |
   practice_plans         | phase_of_season                  | character varying           | YES         |
   practice_plans         | estimated_number_of_participants | integer                     | YES         |
   practice_plans         | created_at                       | timestamp without time zone | YES         | now()
   practice_plans         | created_by                       | text                        | YES         |
   practice_plans         | is_editable_by_others            | boolean                     | YES         | false
   practice_plans         | visibility                       | character varying           | YES         | 'public'::character varying
   practice_plans         | skill_level                      | text                        | YES         |
   practice_plans         | start_time                       | time without time zone      | YES         | '09:00:00'::time without time zone
   practice_plans         | updated_at                       | timestamp without time zone | YES         | now()
   session                | id                               | text                        | NO          |
   session                | expiresAt                        | timestamp without time zone | NO          |
   session                | token                            | text                        | NO          |
   session                | createdAt                        | timestamp without time zone | NO          |
   session                | updatedAt                        | timestamp without time zone | NO          |
   session                | ipAddress                        | text                        | YES         |
   session                | userAgent                        | text                        | YES         |
   session                | userId                           | text                        | NO          |
   sessions               | id                               | integer                     | NO          | nextval('sessions_id_seq'::regclass)
   sessions               | userId                           | integer                     | NO          |
   sessions               | expires                          | timestamp with time zone    | NO          |
   sessions               | sessionToken                     | character varying           | NO          |
   skills                 | skill                            | text                        | NO          |
   skills                 | drills_used_in                   | integer                     | YES         | 0
   skills                 | usage_count                      | integer                     | YES         | 0
   teams                  | id                               | uuid                        | NO          | gen_random_uuid()
   teams                  | name                             | character varying           | NO          |
   teams                  | description                      | text                        | YES         |
   teams                  | created_at                       | timestamp without time zone | YES         | now()
   teams                  | updated_at                       | timestamp without time zone | YES         | now()
   user                   | id                               | text                        | NO          |
   user                   | name                             | text                        | NO          |
   user                   | email                            | text                        | NO          |
   user                   | emailVerified                    | boolean                     | NO          |
   user                   | image                            | text                        | YES         |
   user                   | createdAt                        | timestamp without time zone | NO          |
   user                   | updatedAt                        | timestamp without time zone | NO          |
   users                  | id                               | text                        | NO          |
   users                  | name                             | character varying           | YES         |
   users                  | email                            | character varying           | YES         |
   users                  | email_verified                   | timestamp with time zone    | YES         |
   users                  | image                            | text                        | YES         |
   verification           | id                               | text                        | NO          |
   verification           | identifier                       | text                        | NO          |
   verification           | value                            | text                        | NO          |
   verification           | expiresAt                        | timestamp without time zone | NO          |
   verification           | createdAt                        | timestamp without time zone | YES         |
   verification           | updatedAt                        | timestamp without time zone | YES         |
   verification_requests  | id                               | integer                     | NO          | nextval('verification_requests_id_seq'::regclass)
   verification_requests  | identifier                       | character varying           | NO          |
   verification_requests  | token                            | character varying           | NO          |
   verification_requests  | expires                          | timestamp with time zone    | NO          |
   verification_requests  | created_at                       | timestamp with time zone    | NO          | CURRENT_TIMESTAMP
   verification_requests  | updated_at                       | timestamp with time zone    | NO          | CURRENT_TIMESTAMP
   verification_token     | identifier                       | text                        | NO          |
   verification_token     | expires                          | timestamp with time zone    | NO          |
   verification_token     | token                            | text                        | NO          |
   votes                  | id                               | integer                     | NO          | nextval('votes_id_seq'::regclass)
   votes                  | user_id                          | text                        | NO          |
   votes                  | drill_id                         | integer                     | YES         |
   votes                  | practice_plan_id                 | integer                     | YES         |
   votes                  | vote                             | integer                     | NO          |
   votes                  | created_at                       | timestamp with time zone    | YES         | CURRENT_TIMESTAMP
   votes                  | updated_at                       | timestamp with time zone    | YES         | CURRENT_TIMESTAMP
   votes                  | item_name                        | character varying           | YES         |
  (186 rows)
  ```

---
