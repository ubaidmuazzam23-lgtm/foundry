from sqlalchemy import text
from app.db.session import engine

with engine.connect() as conn:
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS validation_sessions (
            id SERIAL PRIMARY KEY,
            structured_idea_id INTEGER NOT NULL REFERENCES structured_ideas(id),
            execution_plan JSONB,
            plan_priority VARCHAR(20),
            plan_reasoning TEXT,
            estimated_time VARCHAR(50),
            status VARCHAR(20) DEFAULT 'pending',
            results JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            started_at TIMESTAMP WITH TIME ZONE,
            completed_at TIMESTAMP WITH TIME ZONE
        );
        
        CREATE INDEX IF NOT EXISTS idx_validation_sessions_structured_idea 
        ON validation_sessions(structured_idea_id);
    """))
    conn.commit()
    print("✅ validation_sessions table created!")

