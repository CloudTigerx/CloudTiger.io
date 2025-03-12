#!/usr/bin/env python3
# Helper script for decrypting JSC files from Nobodies Adventure Chop Chop
# Based on JSC-PyDecrypt-Tool by bartlomiejduda

import os
import sys
import argparse
import subprocess
import shutil

def check_requirements():
    """Check if required tools are installed"""
    try:
        import pip
        return True
    except ImportError:
        print("Error: pip is not installed. Please install Python with pip.")
        return False

def install_dependencies():
    """Install required dependencies"""
    print("Installing required dependencies...")
    dependencies = [
        "colorama",
        "frida-tools"
    ]
    
    for dependency in dependencies:
        subprocess.run([sys.executable, "-m", "pip", "install", dependency])
    
    print("Dependencies installed successfully.")

def clone_decrypt_tool():
    """Clone the JSC-PyDecrypt-Tool repository"""
    if os.path.exists("JSC-PyDecrypt-Tool"):
        print("JSC-PyDecrypt-Tool already exists, using existing copy.")
        return
    
    print("Cloning JSC-PyDecrypt-Tool...")
    subprocess.run(["git", "clone", "https://github.com/bartlomiejduda/JSC-PyDecrypt-Tool.git"])
    
    # Install its requirements
    subprocess.run([sys.executable, "-m", "pip", "install", "-r", "JSC-PyDecrypt-Tool/requirements.txt"])
    print("JSC-PyDecrypt-Tool cloned and requirements installed.")

def decrypt_jsc(jsc_path, encryption_key, output_path):
    """Decrypt the JSC file using the provided encryption key"""
    print(f"Decrypting {jsc_path} with key: {encryption_key}")
    
    # Build command
    cmd = [
        sys.executable,
        "JSC-PyDecrypt-Tool/jsc_pydecrypt_tool.py", 
        "-d", 
        jsc_path, 
        encryption_key, 
        output_path
    ]
    
    # Run the command
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode == 0:
        print(f"Decryption successful! Output saved to: {output_path}")
        print("You can now search for resource management code and modify it.")
    else:
        print("Error during decryption:")
        print(result.stderr)

def main():
    parser = argparse.ArgumentParser(description="Helper script for decrypting JSC files from Nobodies Adventure Chop Chop")
    parser.add_argument("jsc_path", help="Path to the JSC file to decrypt")
    parser.add_argument("encryption_key", help="Encryption key extracted using Frida")
    parser.add_argument("--output", "-o", default="game_decrypted.js", help="Output path for the decrypted JavaScript")
    
    args = parser.parse_args()
    
    # Check requirements
    if not check_requirements():
        return
    
    # Install dependencies
    install_dependencies()
    
    # Clone decrypt tool if needed
    clone_decrypt_tool()
    
    # Decrypt the JSC file
    decrypt_jsc(args.jsc_path, args.encryption_key, args.output)

if __name__ == "__main__":
    main() 