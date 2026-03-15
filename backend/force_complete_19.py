from app.db.session import SessionLocal
from app.models.idea import StructuredIdea

db = SessionLocal()
idea = db.query(StructuredIdea).filter(StructuredIdea.id == 19).first()

# Manually add asked_fields to simulate 5 questions
idea.structured_data['_asked_fields'] = ['field1', 'field2', 'field3', 'field4', 'field5']
idea.is_complete = 'yes'
idea.missing_fields = []
db.commit()

print("✅ Idea #19 marked as complete!")
db.close()
