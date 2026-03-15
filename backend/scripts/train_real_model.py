# File: backend/scripts/train_real_model.py
# TRAIN ML MODEL ON REAL DATA
# Uses data from download_real_data.py

"""
Trains Random Forest model on REAL startup data.
Sources: Kaggle + CB Insights combined dataset

Run: python scripts/train_real_model.py
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
import pickle
import os
import json
from datetime import datetime

print("=" * 70)
print("🎓 TRAINING MODEL ON REAL DATA")
print("=" * 70)

# Load processed data
print("\n📊 Loading data...")
df = pd.read_csv('data/processed/training_features.csv')

print(f"   Total companies: {len(df)}")
print(f"   Failed: {df['failed'].sum()}")
print(f"   Successful: {len(df) - df['failed'].sum()}")

# Prepare features and target
feature_cols = [
    'funding_millions',
    'competitors_count',
    'market_validation_score',
    'team_quality_score',
    'ltv_cac_ratio',
    'monthly_burn_millions'
]

X = df[feature_cols].values
y = df['failed'].values

print(f"\n📈 Features: {feature_cols}")

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, random_state=42, stratify=y
)

print(f"\n📊 Data split:")
print(f"   Training: {len(X_train)} samples ({y_train.sum()} failed)")
print(f"   Testing: {len(X_test)} samples ({y_test.sum()} failed)")

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train Random Forest
print(f"\n🌲 Training Random Forest...")

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=15,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    class_weight='balanced',
    n_jobs=-1
)

model.fit(X_train_scaled, y_train)

# Evaluate
train_acc = model.score(X_train_scaled, y_train)
test_acc = model.score(X_test_scaled, y_test)

print(f"   Training accuracy: {train_acc * 100:.2f}%")
print(f"   Test accuracy: {test_acc * 100:.2f}%")

# Cross-validation
cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5, scoring='accuracy')
print(f"   5-fold CV: {cv_scores.mean() * 100:.2f}% ± {cv_scores.std() * 100:.2f}%")

# Predictions on test set
y_pred = model.predict(X_test_scaled)
y_proba = model.predict_proba(X_test_scaled)[:, 1]

# ROC-AUC
try:
    roc_auc = roc_auc_score(y_test, y_proba)
    print(f"   ROC-AUC: {roc_auc:.3f}")
except:
    roc_auc = 0.0

# Feature importance
print(f"\n📊 Feature Importance:")
importances = model.feature_importances_
for feature, importance in zip(feature_cols, importances):
    print(f"   {feature:30s}: {importance:.4f}")

# Classification report
print(f"\n📋 Classification Report (Test Set):")
print(classification_report(y_test, y_pred, target_names=['Success', 'Failure']))

# Confusion matrix
print(f"\n📊 Confusion Matrix:")
cm = confusion_matrix(y_test, y_pred)
print(f"   True Negatives:  {cm[0][0]:4d} (Correctly predicted success)")
print(f"   False Positives: {cm[0][1]:4d} (Predicted failure, actually success)")
print(f"   False Negatives: {cm[1][0]:4d} (Predicted success, actually failure)")
print(f"   True Positives:  {cm[1][1]:4d} (Correctly predicted failure)")

# Save model
os.makedirs('models', exist_ok=True)

model_data = {
    'model': model,
    'scaler': scaler,
    'feature_names': feature_cols,
    'training_date': datetime.now().isoformat(),
    'dataset_size': len(df),
    'train_size': len(X_train),
    'test_size': len(X_test),
    'test_accuracy': test_acc,
    'cv_mean': cv_scores.mean(),
    'cv_std': cv_scores.std(),
    'roc_auc': roc_auc,
    'feature_importance': dict(zip(feature_cols, importances.tolist())),
    'data_sources': ['Kaggle Startup Success Dataset', 'CB Insights Unicorns']
}

model_path = 'models/startup_death_model.pkl'
with open(model_path, 'wb') as f:
    pickle.dump(model_data, f)

print(f"\n✅ Model saved: {model_path}")
print(f"   File size: {os.path.getsize(model_path) / 1024:.1f} KB")

# Save model metadata
metadata = {
    'model_type': 'RandomForestClassifier',
    'n_estimators': 200,
    'features': feature_cols,
    'training_samples': len(X_train),
    'test_accuracy': float(test_acc),
    'cv_accuracy_mean': float(cv_scores.mean()),
    'cv_accuracy_std': float(cv_scores.std()),
    'roc_auc': float(roc_auc),
    'trained_on': datetime.now().isoformat(),
    'data_sources': ['Kaggle', 'CB Insights']
}

with open('models/model_metadata.json', 'w') as f:
    json.dump(metadata, f, indent=2)

print(f"✅ Metadata saved: models/model_metadata.json")

# Save training dataset for reference
df.to_csv('models/training_dataset.csv', index=False)
print(f"✅ Training data saved: models/training_dataset.csv")

print("\n" + "=" * 70)
print("🎉 MODEL TRAINING COMPLETE!")
print("=" * 70)

print(f"\n📊 Summary:")
print(f"   Dataset: {len(df)} real startups")
print(f"   Test Accuracy: {test_acc * 100:.2f}%")
print(f"   CV Accuracy: {cv_scores.mean() * 100:.2f}% ± {cv_scores.std() * 100:.2f}%")
print(f"   ROC-AUC: {roc_auc:.3f}")
print(f"   Model: {model_path}")

print(f"\n🚀 Next Step:")
print(f"   Copy model to backend: cp models/startup_death_model.pkl /path/to/backend/models/")
print(f"   Restart backend to load new model")

print("=" * 70)