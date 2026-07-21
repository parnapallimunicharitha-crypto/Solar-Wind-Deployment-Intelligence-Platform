import pandas as pd

df = pd.read_csv("../datasets/global_wind_atlas/GLOBAL WIND ATLAS/windFrequencyRose.csv")

print("\n===== WIND FREQUENCY ROSE DATASET =====")
print(df.head())

print("\n===== DATA INFO =====")
print(df.info())

print("\n===== MISSING VALUES =====")
print(df.isnull().sum())

print("\n===== DUPLICATE ROWS =====")
print(df.duplicated().sum())

print("\n===== DATA DESCRIPTION =====")
print(df.describe())