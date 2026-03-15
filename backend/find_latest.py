from app.db.session import SessionLocal
from app.models.idea import StructuredIdea
import json

db = SessionLocal()

# Get latest structured idea
idea = db.query(StructuredIdea).order_by(StructuredIdea.id.desc()).first()

if idea:
    print(f"Latest Structured Idea:")
    print(f"  ID: {idea.id}")
    print(f"  User Input ID: {idea.user_input_id}")
    print(f"  Version: {idea.version}")
    print(f"  Complete: {idea.is_complete}")
    print(f"  Questions Asked: {idea.structured_data.get('_questions_count', 0)}")
    print(f"  Created: {idea.created_at}")
    print(f"\nStructured Data:")
    print(json.dumps(idea.structured_data, indent=2))
else:
    print("No structured ideas found")

db.close()
