CREATE TABLE drills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brief_description TEXT NOT NULL,
    detailed_description TEXT,
    skill_level TEXT[] NOT NULL,
    complexity VARCHAR(50),
    suggested_length VARCHAR(50) NOT NULL,
    number_of_people_min INT DEFAULT 0,
    number_of_people_max INT DEFAULT 99,
    skills_focused_on TEXT[],
    positions_focused_on TEXT[],
    video_link VARCHAR(255),
    images TEXT[]
);
