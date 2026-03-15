from app.db.session import SessionLocal
from app.models.idea import StructuredIdea

db = SessionLocal()
idea = db.query(StructuredIdea).filter(StructuredIdea.id == 13).first()

if idea:
    print(f"Before: is_complete = {idea.is_complete}")
    idea.is_complete = 'yes'
    idea.missing_fields = []
    db.commit()
    print(f"After: is_complete = {idea.is_complete}")
    print("✅ Idea 13 marked as complete!")
else:
    print("❌ Idea 13 not found")

db.close()
