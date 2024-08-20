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
        'suggested_length': '10 minutes',
        'skills_focused_on': 'Skill 1',
        'positions_focused_on': 'Position 1'
    })
    assert response.status_code == 201
    assert response.json['name'] == 'Drill 1'

def test_get_drills(client):
    client.post('/api/drills', json={
        'name': 'Drill 1',
        'brief_description': 'Brief description',
        'skill_level': 'Beginner',
        'suggested_length': '10 minutes',
        'skills_focused_on': 'Skill 1',
        'positions_focused_on': 'Position 1'
    })
    response = client.get('/api/drills')
    assert response.status_code == 200
    assert len(response.json) == 1

def test_get_drill_by_id(client):
    response = client.post('/api/drills', json={
        'name': 'Drill 1',
        'brief_description': 'Brief description',
        'skill_level': 'Beginner',
        'suggested_length': '10 minutes',
        'skills_focused_on': 'Skill 1',
        'positions_focused_on': 'Position 1'
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
        'suggested_length': '15 minutes',
        'skills_focused_on': 'Skill 2',
        'positions_focused_on': 'Position 2'
    })
    assert response.status_code == 201
    assert response.json['name'] == 'Drill 2'
    assert response.json['skills_focused_on'] == ['Skill 2']
    assert response.json['positions_focused_on'] == ['Position 2']
