from app.db.session import SessionLocal
from app.models.idea import StructuredIdea
import json

db = SessionLocal()
idea = db.query(StructuredIdea).filter(StructuredIdea.id == 27).first()

print(f"Idea #27 Complete Data:")
print(f"Version: {idea.version}")
print(f"Complete: {idea.is_complete}")
print(f"\nFull structured_data:")
print(json.dumps(idea.structured_data, indent=2))

db.close()
