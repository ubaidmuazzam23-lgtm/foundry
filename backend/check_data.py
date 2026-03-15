from app.db.session import SessionLocal
from app.models.idea import StructuredIdea
import json

db = SessionLocal()
idea = db.query(StructuredIdea).filter(StructuredIdea.id == 14).first()

print('Structured Data in Database:')
print(json.dumps(idea.structured_data, indent=2))
print(f'\nVersion: {idea.version}')
print(f'Complete: {idea.is_complete}')

db.close()
