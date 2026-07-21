import pandas as pd

df = pd.read_csv("../datasets/nasa_power/nasa_power_2015to2025_hourly_data_ENGLAND.csv")

print(df.head())
print(df.info())
print(df.isnull().sum())
print(df.duplicated().sum())