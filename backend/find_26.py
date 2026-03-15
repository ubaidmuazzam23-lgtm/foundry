from app.db.session import SessionLocal
from app.models.idea import StructuredIdea

db = SessionLocal()

# Find all ideas from latest user inputs
latest = db.query(StructuredIdea).order_by(StructuredIdea.id.desc()).limit(3).all()

print("Latest 3 Structured Ideas:")
for idea in latest:
    print(f"\nID: {idea.id}, User Input: {idea.user_input_id}")
    print(f"  Version: {idea.version}, Complete: {idea.is_complete}")
    print(f"  Questions: {idea.structured_data.get('_questions_count', 0)}")

db.close()
