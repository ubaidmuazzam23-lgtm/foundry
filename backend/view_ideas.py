# File: backend/view_ideas.py
from app.db.session import SessionLocal
from app.models.idea import UserInput

def view_all_ideas():
    db = SessionLocal()
    ideas = db.query(UserInput).all()
    
    print('📋 All Ideas in Database:')
    print('='*60)
    
    if not ideas:
        print('\n❌ No ideas found in database')
    else:
        for idea in ideas:
            print(f'\n✅ Idea #{idea.id}')
            print(f'   User ID: {idea.clerk_user_id or "Anonymous"}')
            print(f'   Type: {idea.input_type}')
            print(f'   Confidence: {idea.confidence_score}')
            print(f'   Needs Clarification: {idea.needs_clarification}')
            print(f'   Created: {idea.created_at}')
            print(f'\n   Text:\n   {idea.raw_input}\n')
            print('-'*60)
        
        print(f'\n📊 Total ideas: {len(ideas)}')
    
    db.close()

if __name__ == '__main__':
    view_all_ideas()