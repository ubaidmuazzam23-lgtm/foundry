from app.db.session import SessionLocal
from app.models.idea import StructuredIdea

db = SessionLocal()
ideas = db.query(StructuredIdea).all()

for idea in ideas:
    print(f'ID: {idea.id}, Complete: {idea.is_complete}')

db.close()
