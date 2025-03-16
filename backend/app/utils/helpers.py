import os
import sys
import subprocess
import logging
import json
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime
import platform

logger = logging.getLogger(__name__)

def setup_logging():
    """Setup logging configuration"""
    log_dir = os.path.join(os.path.expanduser("~"), ".local-image-finder", "logs")
    os.makedirs(log_dir, exist_ok=True)
    
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    logging.basicConfig(
        level=logging.INFO,
        format=log_format,
        handlers=[
            logging.FileHandler(os.path.join(log_dir, f"app_{datetime.now().strftime('%Y%m%d')}.log")),
            logging.StreamHandler()
        ]
    )

def open_image_in_native_viewer(image_path: str) -> bool:
    """Open an image in the system's default image viewer"""
    if not os.path.exists(image_path):
        logger.error(f"Image file not found: {image_path}")
        return False
    
    try:
        if platform.system() == "Windows":
            os.startfile(image_path)
        elif platform.system() == "Darwin":  # macOS
            subprocess.call(["open", image_path])
        else:  # Linux and other Unix
            subprocess.call(["xdg-open", image_path])
        
        logger.info(f"Opened image: {image_path}")
        return True
    except Exception as e:
        logger.error(f"Failed to open image {image_path}: {str(e)}")
        return False

def generate_id() -> str:
    """Generate a unique ID"""
    return str(uuid.uuid4())

def extract_exif_data(exif_data: Dict[str, Any]) -> Dict[str, Any]:
    """Extract and format relevant EXIF data from image metadata"""
    if not exif_data:
        return {}
    
    # Common EXIF tags to extract
    exif_tags = {
        'Make': 'Camera Make',
        'Model': 'Camera Model',
        'DateTime': 'Date/Time',
        'ExposureTime': 'Exposure Time',
        'FNumber': 'F-Number',
        'ISOSpeedRatings': 'ISO',
        'FocalLength': 'Focal Length',
        'GPSInfo': 'GPS Info',
        'ImageDescription': 'Description',
        'Software': 'Software',
    }
    
    extracted = {}
    for tag, label in exif_tags.items():
        if tag in exif_data:
            extracted[label] = exif_data[tag]
    
    return extracted

def format_image_properties(metadata: Dict[str, Any]) -> Dict[str, Any]:
    """Format image properties for display in UI"""
    properties = {
        'Filename': metadata.get('filename', 'Unknown'),
        'Path': metadata.get('filepath', 'Unknown'),
        'Size': format_file_size(metadata.get('filesize', 0)),
        'Dimensions': f"{metadata.get('width', 0)} x {metadata.get('height', 0)} pixels",
        'Created': format_date(metadata.get('creation_date')),
        'Modified': format_date(metadata.get('modified_date')),
    }
    
    # Add EXIF data if available
    if 'exif' in metadata and metadata['exif']:
        exif_data = extract_exif_data(metadata['exif'])
        properties.update(exif_data)
    
    return properties

def format_file_size(size_bytes: int) -> str:
    """Format file size from bytes to human-readable format"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} TB"

def format_date(date_str: Optional[str]) -> str:
    """Format date string for display"""
    if not date_str:
        return "Unknown"
    
    try:
        dt = datetime.fromisoformat(date_str)
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    except:
        return date_str

def export_session_to_json(session_data: Dict[str, Any], filename: str) -> bool:
    """Export a session to a JSON file"""
    try:
        with open(filename, 'w') as f:
            json.dump(session_data, f, indent=2, default=str)
        return True
    except Exception as e:
        logger.error(f"Failed to export session: {str(e)}")
        return False
