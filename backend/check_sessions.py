from app.db.session import SessionLocal
from app.models.validation import ValidationSession

db = SessionLocal()
sessions = db.query(ValidationSession).all()

print(f"Total validation sessions: {len(sessions)}")

for s in sessions:
    print(f"\nSession ID: {s.id}")
    print(f"  Structured Idea: {s.structured_idea_id}")
    print(f"  Status: {s.status}")
    print(f"  Results: {s.results}")

db.close()
