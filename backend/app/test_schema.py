from app.schemas.idea import StructuredIdea, IdeaStatus

# Test creating a structured idea
test_idea = StructuredIdea(
    idea_summary="AI-powered fitness coach",
    problem_statement="People don't stick to workout routines",
    solution_description="Personalized AI coach that adapts to your schedule",
    target_audience="Busy professionals aged 25-40",
    unique_value_proposition="Learns your preferences and adjusts workouts in real-time",
    user_id="test_user_123"
)

print("✅ Schema created successfully!")
print(f"Status: {test_idea.status}")
print(f"Created at: {test_idea.created_at}")
print(f"\nJSON output:")
print(test_idea.model_dump_json(indent=2))