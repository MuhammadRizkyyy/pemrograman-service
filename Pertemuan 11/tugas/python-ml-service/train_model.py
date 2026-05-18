import numpy as np
import pandas as pd
import joblib
import os
from sklearn.datasets import load_iris
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, accuracy_score

def train_and_save_model():
    print("=" * 50)
    print("Training Iris Classification Model")
    print("=" * 50)

    iris = load_iris()
    X = iris.data
    y = iris.target
    feature_names = iris.feature_names
    target_names = iris.target_names

    print(f"\nDataset Info:")
    print(f"  - Jumlah sampel  : {X.shape[0]}")
    print(f"  - Jumlah fitur   : {X.shape[1]}")
    print(f"  - Fitur          : {list(feature_names)}")
    print(f"  - Kelas          : {list(target_names)}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled  = scaler.transform(X_test)

    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=5,
        random_state=42
    )
    model.fit(X_train_scaled, y_train)

    y_pred = model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, y_pred)

    print(f"\nHasil Evaluasi:")
    print(f"  - Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=target_names))

    os.makedirs("model", exist_ok=True)
    joblib.dump(model,  "model/iris_model.joblib")
    joblib.dump(scaler, "model/scaler.joblib")

    metadata = {
        "model_type"    : "RandomForestClassifier",
        "dataset"       : "Iris Flower Dataset (UCI)",
        "features"      : list(feature_names),
        "target_names"  : list(target_names),
        "accuracy"      : float(accuracy),
        "n_estimators"  : 100,
        "max_depth"     : 5,
        "train_samples" : int(X_train.shape[0]),
        "test_samples"  : int(X_test.shape[0]),
    }
    joblib.dump(metadata, "model/metadata.joblib")

    print("\nModel berhasil disimpan:")
    print("  - model/iris_model.joblib")
    print("  - model/scaler.joblib")
    print("  - model/metadata.joblib")
    print("=" * 50)

if __name__ == "__main__":
    train_and_save_model()
