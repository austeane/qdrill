import pytest
from app import create_app, db
from app.models import Drill, PracticePlan

@pytest.fixture
def app():
    app = create_app()
    app.config.update({
        "TESTING": True,
    })

    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def test_create_drill(client):
    response = client.post('/api/drills', json={
        'name': 'Drill 1',
        'brief_description': 'Brief description',
        'skill_level': 'Beginner',
        'complexity': 'Low',
        'suggested_length': '5-15',
        'number_of_people': {'min': 3, 'max': 10},
        'skills_focused_on': ['driving', 'catching'],
        'positions_focused_on': ['Beater', 'Chaser']
    })
    assert response.status_code == 201
    assert response.json['name'] == 'Drill 1'

def test_get_drills(client):
    client.post('/api/drills', json={
        'name': 'Drill 1',
        'brief_description': 'Brief description',
        'skill_level': 'Beginner',
        'complexity': 'Low',
        'suggested_length': '5-15',
        'number_of_people': {'min': 3, 'max': 10},
        'skills_focused_on': ['driving', 'catching'],
        'positions_focused_on': ['Beater', 'Chaser']
    })
    response = client.get('/api/drills')
    assert response.status_code == 200
    assert len(response.json) == 1

def test_get_drill_by_id(client):
    response = client.post('/api/drills', json={
        'name': 'Drill 1',
        'brief_description': 'Brief description',
        'skill_level': 'Beginner',
        'complexity': 'Low',
        'suggested_length': '5-15',
        'number_of_people': {'min': 3, 'max': 10},
        'skills_focused_on': ['driving', 'catching'],
        'positions_focused_on': ['Beater', 'Chaser']
    })
    drill_id = response.json['id']
    response = client.get(f'/api/drills/{drill_id}')
    assert response.status_code == 200
    assert response.json['name'] == 'Drill 1'

def test_create_practice_plan(client):
    response = client.post('/api/practice-plans', json={
        'name': 'Practice Plan 1',
        'practice_goals': 'Goals',
        'phase_of_season': 'Pre-season',
        'number_of_participants': 10
    })
    assert response.status_code == 201
    assert response.json['name'] == 'Practice Plan 1'

def test_get_practice_plans(client):
    client.post('/api/practice-plans', json={
        'name': 'Practice Plan 1',
        'practice_goals': 'Goals',
        'phase_of_season': 'Pre-season',
        'number_of_participants': 10
    })
    response = client.get('/api/practice-plans')
    assert response.status_code == 200
    assert len(response.json) == 1

def test_get_practice_plan_by_id(client):
    response = client.post('/api/practice-plans', json={
        'name': 'Practice Plan 1',
        'practice_goals': 'Goals',
        'phase_of_season': 'Pre-season',
        'number_of_participants': 10
    })
    practice_plan_id = response.json['id']
    response = client.get(f'/api/practice-plans/{practice_plan_id}')
    assert response.status_code == 200
    assert response.json['name'] == 'Practice Plan 1'

def test_create_drill_with_string_fields(client):
    response = client.post('/api/drills', json={
        'name': 'Drill 2',
        'brief_description': 'Another brief description',
        'skill_level': 'Intermediate',
        'complexity': 'Medium',
        'suggested_length': '15-30',
        'number_of_people': {'min': 5, 'max': 15},
        'skills_focused_on': ['decision making', 'throwing'],
        'positions_focused_on': ['Keeper', 'Seeker']
    })
    assert response.status_code == 201
    assert response.json['name'] == 'Drill 2'
    assert response.json['skills_focused_on'] == ['decision making', 'throwing']
    assert response.json['positions_focused_on'] == ['Keeper', 'Seeker']
