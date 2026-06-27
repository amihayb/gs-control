import pngquant

pngquant.config_lossy_compression(
    "velox-day.png", 
    min_quality=65, 
    max_quality=80, 
    speed=1
)