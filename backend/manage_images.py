#!/usr/bin/env python3
"""
Utility script to manage face recognition images stored in the backend.
"""

import os
import json
from datetime import datetime
from pathlib import Path

FACE_IMAGES_DIR = 'face_images'

def list_all_images():
    """List all stored face images with details."""
    if not os.path.exists(FACE_IMAGES_DIR):
        print(f"Directory {FACE_IMAGES_DIR} does not exist.")
        return
    
    images = []
    for filename in os.listdir(FACE_IMAGES_DIR):
        if filename.endswith('.png'):
            filepath = os.path.join(FACE_IMAGES_DIR, filename)
            file_stat = os.stat(filepath)
            
            # Parse filename: student_id_view_type_timestamp.png
            parts = filename.replace('.png', '').split('_')
            if len(parts) >= 3:
                student_id = parts[0]
                view_type = parts[1]
                timestamp_str = '_'.join(parts[2:])
                
                images.append({
                    'filename': filename,
                    'student_id': student_id,
                    'view_type': view_type,
                    'timestamp': timestamp_str,
                    'file_size': file_stat.st_size,
                    'created': datetime.fromtimestamp(file_stat.st_mtime).strftime('%Y-%m-%d %H:%M:%S')
                })
    
    if not images:
        print("No images found.")
        return
    
    print(f"\nFound {len(images)} images in {FACE_IMAGES_DIR}/")
    print("=" * 80)
    
    for img in sorted(images, key=lambda x: x['created'], reverse=True):
        print(f"Student: {img['student_id']}")
        print(f"View: {img['view_type']}")
        print(f"File: {img['filename']}")
        print(f"Size: {img['file_size']} bytes")
        print(f"Created: {img['created']}")
        print("-" * 40)

def list_student_images(student_id):
    """List images for a specific student."""
    if not os.path.exists(FACE_IMAGES_DIR):
        print(f"Directory {FACE_IMAGES_DIR} does not exist.")
        return
    
    student_images = []
    for filename in os.listdir(FACE_IMAGES_DIR):
        if filename.startswith(f"{student_id}_") and filename.endswith('.png'):
            filepath = os.path.join(FACE_IMAGES_DIR, filename)
            file_stat = os.stat(filepath)
            
            parts = filename.replace('.png', '').split('_')
            view_type = parts[1] if len(parts) > 1 else 'unknown'
            
            student_images.append({
                'filename': filename,
                'view_type': view_type,
                'file_size': file_stat.st_size,
                'created': datetime.fromtimestamp(file_stat.st_mtime).strftime('%Y-%m-%d %H:%M:%S')
            })
    
    if not student_images:
        print(f"No images found for student {student_id}")
        return
    
    print(f"\nImages for student {student_id}:")
    print("=" * 50)
    
    for img in sorted(student_images, key=lambda x: x['created'], reverse=True):
        print(f"View: {img['view_type']}")
        print(f"File: {img['filename']}")
        print(f"Size: {img['file_size']} bytes")
        print(f"Created: {img['created']}")
        print("-" * 30)

def get_directory_info():
    """Get information about the images directory."""
    if not os.path.exists(FACE_IMAGES_DIR):
        print(f"Directory {FACE_IMAGES_DIR} does not exist.")
        return
    
    total_files = len([f for f in os.listdir(FACE_IMAGES_DIR) if f.endswith('.png')])
    total_size = sum(
        os.path.getsize(os.path.join(FACE_IMAGES_DIR, f))
        for f in os.listdir(FACE_IMAGES_DIR)
        if f.endswith('.png')
    )
    
    print(f"\nDirectory: {FACE_IMAGES_DIR}/")
    print(f"Total images: {total_files}")
    print(f"Total size: {total_size} bytes ({total_size / 1024:.2f} KB)")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "list":
            list_all_images()
        elif command == "student" and len(sys.argv) > 2:
            list_student_images(sys.argv[2])
        elif command == "info":
            get_directory_info()
        else:
            print("Usage:")
            print("  python manage_images.py list                    # List all images")
            print("  python manage_images.py student <student_id>    # List images for specific student")
            print("  python manage_images.py info                    # Show directory info")
    else:
        print("Face Recognition Images Manager")
        print("=" * 30)
        get_directory_info()
        list_all_images() 