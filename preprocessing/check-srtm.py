import rasterio
import numpy as np

file_path = "../datasets/srtm/GeoTIFF 1 Arc-second.tif"

with rasterio.open(file_path) as src:

    print("\n========== SRTM DATASET ==========")

    print("Width :", src.width)
    print("Height :", src.height)
    print("Bands :", src.count)
    print("CRS :", src.crs)
    print("Data Type :", src.dtypes)
    print("Bounds :", src.bounds)

    elevation = src.read(1)

    print("\n===== Elevation Statistics =====")

    print("Minimum Elevation :", np.min(elevation))
    print("Maximum Elevation :", np.max(elevation))
    print("Mean Elevation :", np.mean(elevation))

    nodata = src.nodata

    print("\nNoData Value :", nodata)

    if nodata is not None:
        print("NoData Pixels :", np.sum(elevation == nodata))