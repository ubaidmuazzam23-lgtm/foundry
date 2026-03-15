# File: backend/test_imports.py
# Test script to verify all imports work correctly

print("Testing imports...")

try:
    print("1. Testing config...")
    from app.config import settings
    print("✓ Config imported successfully")
    
    print("\n2. Testing database session...")
    from app.db.session import Base, get_db, init_db
    print("✓ Database session imported successfully")
    
    print("\n3. Testing models...")
    from app.models.user import User
    print("✓ User model imported")
    from app.models.idea import UserInput, StructuredIdea
    print("✓ Idea models imported")
    from app.models.audit_log import AuditLog
    print("✓ AuditLog model imported")
    
    print("\n4. Testing schemas...")
    from app.schemas.idea import TextInputRequest, TextInputResponse
    print("✓ Schemas imported successfully")
    
    print("\n5. Testing endpoints...")
    from app.api.v1.endpoints import ideas
    print("✓ Endpoints imported successfully")
    
    print("\n6. Testing main app...")
    from app.main import app
    print("✓ Main app imported successfully")
    
    print("\n✅ All imports successful!")
    
except ImportError as e:
    print(f"\n❌ Import error: {e}")
    import traceback
    traceback.print_exc()