from app.db.session import SessionLocal
from app.models.idea import StructuredIdea

db = SessionLocal()
idea = db.query(StructuredIdea).filter(StructuredIdea.id == 21).first()

if idea:
    print(f"Idea #21:")
    print(f"  Questions Count: {idea.structured_data.get('_questions_count', 0)}")
    print(f"  Complete: {idea.is_complete}")
    print(f"  Version: {idea.version}")
    print(f"  Asked Fields: {idea.structured_data.get('_asked_fields', [])}")
else:
    print("Idea #21 not found")

db.close()
