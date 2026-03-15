from app.db.session import SessionLocal
from app.models.idea import StructuredIdea
import json

db = SessionLocal()
idea = db.query(StructuredIdea).filter(StructuredIdea.id == 14).first()

if idea:
    print('✅ Idea #14 EXISTS in database!')
    print('\nStructured Data:')
    print(json.dumps(idea.structured_data, indent=2))
    print(f'\nVersion: {idea.version}')
    print(f'Complete: {idea.is_complete}')
    print(f'Missing Fields: {idea.missing_fields}')
else:
    print('❌ Idea #14 NOT FOUND in database')

db.close()
