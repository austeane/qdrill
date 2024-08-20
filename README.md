# QDrill: Detailed Specification
This is starting from a boilerplate svelte app on vercel, and will become the following

## Overview
QDrill is a web-based application designed to be a sports drill bank and practice planning tool for a niche sport. The application will allow users to create, manage, and share drills, as well as plan practices. The user experience (UX) is a high priority, with an emphasis on smooth, responsive interactions and a modern design. The application is expected to handle up to a few hundred concurrent users and will be built with a combination of SvelteKit (frontend) and Python (backend).

## Technology Stack
- **Frontend**: Svelte with SvelteKit
- **Backend**: Python (using Flask or Django)
- **Database**: SQLite (for lightweight, server-side data storage)
- **Deployment**: Hosted on Vercel with a custom domain (e.g., qdrill.app)
- **Testing**: 
  - **Frontend**: Jest for unit testing, with potential use of Cypress for end-to-end testing.
  - **Backend**: Pytest for unit testing.

## Core Features

### 1. Drill Creation and Management
- **Form-Based Drill Creation**: Users can create new drills via a form interface. Each drill will have the following attributes:
  - Name (required)
  - Brief description (required)
  - How to teach it/detailed description
  - Skill level required (required)
  - Complexity to explain
  - Suggested length of time (required)
  - Number of people required
  - Skills focused on (required)
  - Positions focused on (required)
  - Video link to drill
  - Images of drill
- **Dynamic URL Generation**: Each drill will automatically be assigned a unique URL upon creation, allowing users to share and access drills directly.
- **Public vs. Private Drills**: Users can choose to make drills public or private. Public drills are accessible by all, while private drills require a specific link. Users can also create public versions of private drills with a different description.

### 2. Drill Filtering and Viewing
- **Client-Side Filtering**: All drills will be sent to the client side, where filtering will occur. This approach ensures fast, responsive filtering without the need for server-side requests, especially given that the total number of drills is unlikely to exceed a couple of thousand.
- **Drill Listing View**: The main view will display a list of drills, showing their name, attributes, brief description, and indications of any media (pictures/videos).
- **Drill Detail Page**: Each drill will have a dedicated page showing all of its details. Users can comment on drills, upvote them, or create variations. Variations will maintain the same attributes but allow for a different description.

### 3. Practice Plan Creation and Management
- **Form-Based Practice Planning**: Users can create practice plans by selecting drills based on the number of players, skill levels, practice duration, and skills to focus on.
- **Plan Customization**: After selecting drills, users can define additional practice details, including:
  - Practice name
  - Practice goals
  - Phase of the season
  - Number of participants suited for
  - Level of experience suited for
  - Skills focused on
  - Brief overview of practice flow
  - Time dedicated to each drill
  - Breaks between drills
  - Total practice time
- **Public vs. Private Plans**: Similar to drills, practice plans can be published either privately (accessible via link) or publicly. Users can write different overviews for public/private versions if desired.

### 4. User Interaction and Profiles
- **User Accounts**: Users can create accounts via OAuth (e.g., Google). Logged-in users can create, comment on, and upvote drills or practice plans, and create variations.
- **Anonymous Interaction**: Users who are not logged in can still view and vote on drills, and create practice plans, though publishing or saving them for future editing requires logging in.
- **User Profiles**: Profiles can include optional information such as name, team played for, country, and social media links.
- **User Access**: All users will have the same level of access. Each user will have their own private drills and practice plans, and they can save public drills and plans. Users can see the drills and plans they have saved.

### 5. Backend and Data Management
- **SQLite Database**: Used for storing all application data, including drills, practice plans, user accounts, and comments.
- **API Integration**: The SvelteKit frontend will communicate with the Python backend via RESTful APIs to manage drill creation, filtering, user management, and more.
- **Media Management**: Images will be hosted directly on the application, while videos will be linked from external sources (e.g., YouTube, cloud storage).

### 6. Deployment and Hosting
- **Frontend**: Hosted on Vercel with the custom domain (e.g., qdrill.app).
- **Backend**: Hosted on Vercel’s serverless functions or as a separate service if needed, handling API requests and database interactions.

### 7. Testing and Quality Assurance
- **Jest**: Used for unit testing the frontend components.
- **Pytest**: Used for testing backend functionality.
- **Cypress**: Potentially used for end-to-end testing to ensure the entire user flow, from drill creation to practice plan publishing, works smoothly.

### 8. UX and Design
- **Figma Prototyping**: The user interface will be prototyped using Figma to ensure a well-thought-out design that prioritizes user experience. The final implementation will aim for a clean, modern, and responsive design.
- **Design Aesthetic**: The design will follow a style similar to Figma, with a clean, minimalist look. The color scheme and fonts will be inspired by Figma, but with an emphasis on ensuring faster loading times and responsive filtering without noticeable delays.

## Running Locally

### Backend Setup

1. **Create a virtual environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set environment variables**:
   ```bash
   export FLASK_APP=app
   export FLASK_ENV=development
   export DATABASE_URL=sqlite:///app.db
   ```

4. **Run the Flask server**:
   ```bash
   flask run --port 5000
   ```

### Frontend Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Build the application**:
   ```bash
   npm run build
   ```

### Running Database Migrations

1. **Initialize the migration environment**:
   ```bash
   flask db init
   ```

2. **Create a new migration script**:
   ```bash
   flask db migrate -m "Initial migration"
   ```

3. **Apply the migration to the database**:
   ```bash
   flask db upgrade
   ```

### Deployment on Vercel

To deploy both the frontend and backend on Vercel, follow these steps:

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy the application**:
   ```bash
   vercel --prod
   ```

This will deploy both the SvelteKit frontend and the Flask backend to Vercel, making your application accessible on your custom domain.
