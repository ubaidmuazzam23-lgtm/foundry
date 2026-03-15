from app.db.session import SessionLocal
from app.models.idea import StructuredIdea

db = SessionLocal()
idea = db.query(StructuredIdea).order_by(StructuredIdea.id.desc()).first()

print(f"Latest Idea #{idea.id}:")
print(f"  Questions Count: {idea.structured_data.get('_questions_count', 'NOT SET')}")
print(f"  Asked Fields: {idea.structured_data.get('_asked_fields', [])}")
print(f"  Complete: {idea.is_complete}")

if idea.structured_data.get('_questions_count') == 5 and idea.is_complete == 'yes':
    print("\n✅ BUG FIXED! Tracking works perfectly!")
else:
    print("\n❌ Still broken")

db.close()
