from app.db.session import SessionLocal
from app.models.idea import StructuredIdea

db = SessionLocal()

# Get the latest structured idea for user_input #14
idea = db.query(StructuredIdea).filter(
    StructuredIdea.user_input_id == 14
).order_by(StructuredIdea.id.desc()).first()

print(f"Latest structured_idea for user_input #14:")
print(f"Structured ID: {idea.id}")
print(f"Complete: {idea.is_complete}")
print(f"Version: {idea.version}")

db.close()
