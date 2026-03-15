from app.db.session import engine
from sqlalchemy import inspect

inspector = inspect(engine)
tables = inspector.get_table_names()

print("Tables in database:")
for table in tables:
    print(f"  - {table}")

if 'validation_sessions' in tables:
    print("\n✅ validation_sessions table EXISTS")
else:
    print("\n❌ validation_sessions table DOES NOT EXIST")
    print("\nRun: python create_validation_sessions.py")

