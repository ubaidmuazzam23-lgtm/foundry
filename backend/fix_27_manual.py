from app.db.session import SessionLocal
from app.models.idea import StructuredIdea

db = SessionLocal()
idea = db.query(StructuredIdea).filter(StructuredIdea.id == 27).first()

# Since version is 6 (1 initial + 5 answers), set count to 5
idea.structured_data['_questions_count'] = 5
idea.structured_data['_asked_fields'] = ['q1', 'q2', 'q3', 'q4', 'q5']
idea.is_complete = 'yes'
idea.missing_fields = []
db.commit()

print("✅ Fixed idea #27!")
db.close()
