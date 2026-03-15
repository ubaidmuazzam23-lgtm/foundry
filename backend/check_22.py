from app.db.session import SessionLocal
from app.models.idea import StructuredIdea

db = SessionLocal()
idea = db.query(StructuredIdea).filter(StructuredIdea.id == 22).first()

if idea:
    print(f"Idea #22:")
    print(f"  Questions Count: {idea.structured_data.get('_questions_count', 'NOT SET')}")
    print(f"  Complete: {idea.is_complete}")
    print(f"  Version: {idea.version}")
    print(f"  Asked Fields: {idea.structured_data.get('_asked_fields', 'NOT SET')}")
    
    # Check if tracking fields exist
    if '_questions_count' not in idea.structured_data:
        print("\n❌ PROBLEM: _questions_count field missing!")
        print("This means the NEW code is NOT running!")
else:
    print("❌ Idea #22 not found")

db.close()
