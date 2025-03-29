import cv2
import numpy as np
import os
import time
import json
import sys
import argparse
from ultralytics import YOLO
import torch
from PIL import Image

def process_file(input_path, output_path, model_type, confidence, display_mode="draw"):
    """Process image or video file and return output path"""
    
    # Determine model path based on model_type
    model_path = os.path.join('public', 'models', f'{model_type}.pt')
    
    # Initialize YOLO model
    model = YOLO(model_path)
    
    # Move model to GPU if available
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    model.to(device)
    
    # Check if input is video
    video_extensions = ('.mp4', '.avi', '.mov', '.mkv')
    is_video = input_path.lower().endswith(video_extensions)
    
    if is_video:
        # Process video
        cap = cv2.VideoCapture(input_path)
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            # Run inference
            results = model.predict(frame, conf=confidence, imgsz=1408, verbose=False)
            
            if results[0].masks is not None:
                mask = results[0].masks.data[0].cpu().numpy()
                mask = (mask * 255).astype(np.uint8)
                mask = cv2.resize(mask, (width, height))
                
                # Apply visualization based on display mode
                if display_mode == "draw" or display_mode == "highlight":
                    # Create blue overlay
                    overlay = frame.copy()
                    overlay[mask > 128] = [255, 0, 0]  # Blue fill
                    
                    # Blend overlay with original frame
                    alpha = 0.3 if display_mode == "highlight" else 0.1
                    frame = cv2.addWeighted(overlay, alpha, frame, 0.7, 0)
                
                if display_mode != "none" and display_mode != "highlight":
                    # Bold red boundary edges
                    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                    cv2.drawContours(frame, contours, -1, (0, 0, 255), 2)  # Red boundary
                    
            out.write(frame)
            
        cap.release()
        out.release()
    else:
        # Process image - supporting multiple formats
        try:
            # First try with PIL to handle various formats
            pil_image = Image.open(input_path)
            # Convert PIL image to OpenCV format (RGB to BGR)
            if pil_image.mode == 'RGBA':
                # Handle transparency
                pil_image = pil_image.convert('RGB')
            
            frame = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
            
        except Exception as e:
            # Fallback to OpenCV
            frame = cv2.imread(input_path)
            if frame is None:
                raise ValueError(f"Could not read image: {input_path}. Error: {str(e)}")
        
        height, width, _ = frame.shape
        
        # Run inference
        results = model.predict(frame, conf=confidence, imgsz=1408, verbose=False)
        
        if results[0].masks is not None and len(results[0].masks) > 0:
            mask = results[0].masks.data[0].cpu().numpy()
            mask = (mask * 255).astype(np.uint8)
            mask = cv2.resize(mask, (width, height))
            
            # Apply visualization based on display mode
            if display_mode == "draw" or display_mode == "highlight":
                # Create blue overlay
                overlay = frame.copy()
                overlay[mask > 128] = [255, 0, 0]  # Blue fill
                
                # Blend overlay with original frame
                alpha = 0.3 if display_mode == "highlight" else 0.1
                frame = cv2.addWeighted(overlay, alpha, frame, 0.7, 0)
            
            if display_mode != "none" and display_mode != "highlight":
                # Bold red boundary edges
                contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                cv2.drawContours(frame, contours, -1, (0, 0, 255), 2)  # Red boundary
        
        # Determine output format based on input
        output_ext = os.path.splitext(output_path)[1].lower()
        if output_ext not in ['.jpg', '.jpeg', '.png']:
            output_path = os.path.splitext(output_path)[0] + '.jpg'
            
        cv2.imwrite(output_path, frame)
    
    return output_path

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process images/videos with YOLO")
    parser.add_argument("--input", required=True, help="Input file path")
    parser.add_argument("--output", required=True, help="Output file path")
    parser.add_argument("--model", default="daytime", help="Model type (daytime/nighttime)")
    parser.add_argument("--confidence", type=float, default=0.35, help="Confidence threshold")
    parser.add_argument("--display-mode", default="draw", help="Display mode (draw/highlight/outline/none)")
    
    args = parser.parse_args()
    
    try:
        result = process_file(args.input, args.output, args.model, args.confidence, args.display_mode)
        print(json.dumps({"success": True, "output": result}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
