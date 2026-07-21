from PIL import Image
import os

folder = "../datasets/sentinel/EuroSAT_RGB/EuroSAT_RGB/AnnualCrop"

total_images = 0
corrupted_images = 0

for filename in os.listdir(folder):

    if filename.lower().endswith((".jpg", ".jpeg", ".png")):

        total_images += 1

        filepath = os.path.join(folder, filename)

        try:
            img = Image.open(filepath)
            img.verify()

        except Exception:
            print("Corrupted:", filename)
            corrupted_images += 1

print("\n========== RESULT ==========")
print("Total Images :", total_images)
print("Corrupted Images :", corrupted_images)
print("Valid Images :", total_images - corrupted_images)