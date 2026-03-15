from app.db.session import SessionLocal
from app.models.idea import StructuredIdea

db = SessionLocal()

# Get the latest structured idea
idea = db.query(StructuredIdea).order_by(StructuredIdea.id.desc()).first()

print(f"Latest Idea:")
print(f"  ID: {idea.id}")
print(f"  Complete: {idea.is_complete}")
print(f"  Version: {idea.version}")
print(f"  Questions Asked: {len(idea.structured_data.get('_asked_fields', []))}")

if idea.is_complete == 'yes':
    print("\n✅ IDEA IS COMPLETE!")
else:
    print("\n❌ Idea is NOT complete")

db.close()
