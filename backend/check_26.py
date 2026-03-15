from app.db.session import SessionLocal
from app.models.idea import StructuredIdea

db = SessionLocal()
idea = db.query(StructuredIdea).filter(StructuredIdea.id == 26).first()

if idea:
    print(f"Idea #26:")
    print(f"  Version: {idea.version}")
    print(f"  Complete: {idea.is_complete}")
    print(f"  _questions_count: {idea.structured_data.get('_questions_count', 'MISSING')}")
    print(f"  _asked_fields: {idea.structured_data.get('_asked_fields', 'MISSING')}")
    
    if '_questions_count' in idea.structured_data:
        print("\n✅ NEW CODE IS RUNNING!")
    else:
        print("\n❌ OLD CODE STILL RUNNING!")
else:
    print("Idea #26 not found")

db.close()
