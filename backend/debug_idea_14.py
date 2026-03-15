from app.db.session import SessionLocal
from app.models.idea import UserInput, StructuredIdea

db = SessionLocal()

# Get the user input for idea #14
user_input = db.query(UserInput).filter(UserInput.id == 14).first()
print("📝 USER INPUT #14:")
print(f"Text: {user_input.raw_input[:200]}...")

# Get structured idea that references user_input #14
structured = db.query(StructuredIdea).filter(
    StructuredIdea.user_input_id == 14
).first()

if structured:
    print(f"\n📊 STRUCTURED IDEA (references user_input #{structured.user_input_id}):")
    print(f"Structured ID: {structured.id}")
    print(f"Problem: {structured.structured_data.get('problem_statement', 'N/A')[:100]}...")
else:
    print("\n❌ No structured idea found for user_input #14")

db.close()
