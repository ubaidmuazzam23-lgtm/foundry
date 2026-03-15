from app.db.session import SessionLocal
from app.models.idea import StructuredIdea
from app.schemas.ideaschema import MandatoryIdeaSchema

db = SessionLocal()
idea = db.query(StructuredIdea).filter(StructuredIdea.id == 29).first()

print(f"Idea #29 Debug:")
print(f"Questions asked: {idea.structured_data.get('_questions_count')}")
print(f"Asked fields: {idea.structured_data.get('_asked_fields')}")

# Check what fields are missing
schema = MandatoryIdeaSchema(**idea.structured_data)
missing = schema.get_missing_fields()

print(f"\nMissing fields: {missing}")
print(f"Total missing: {len(missing)}")

print(f"\nAll field values:")
for field in ['problem_statement', 'target_audience', 'solution_description', 
              'market_size_estimate', 'competitors', 'unique_value_proposition',
              'business_model', 'key_features', 'stage']:
    value = idea.structured_data.get(field)
    status = "✅" if value and value != [] else "❌"
    print(f"  {status} {field}: {value}")

db.close()
