# Nobodies Adventure Chop Chop Modding Guide

This repository contains tools and instructions for modding "Nobody's Adventure Chop-Chop" to get unlimited resources. Two methods are provided:

1. **Memory Modification** (Easiest): Using Game Guardian to edit memory values
2. **Advanced Decompilation** (Complex but powerful): Extracting, modifying, and recompiling the game code

## Quick Start

### Method 1: Memory Modification
See `memory_mod_instructions.txt` for a complete guide on using Game Guardian to modify the game's memory and get unlimited resources.

### Method 2: Advanced Decompilation
See `advanced_decompile_guide.md` for detailed instructions on decompiling and modifying the game's JavaScript code.

## Files in this Repository

- `memory_mod_instructions.txt` - Simple guide for memory modification
- `advanced_decompile_guide.md` - Detailed guide for decompiling and modifying the game code
- `setup_apktool.bat` - Batch file to set up APKTool for APK manipulation
- `decrypt_jsc.py` - Helper script for decrypting JSC files
- `cocos2d_xxtea_script.js` - Frida script to extract encryption keys

## Prerequisites

For the basic method:
- LD Player
- Game Guardian
- The game installed in LD Player

For the advanced method:
- Python 3.11.6
- Frida tools
- Git
- Java JDK
- Node.js
- Android SDK or standalone APK signer

## Step-by-Step Process

### Method 1: Memory Modification (Easy)
1. Install Game Guardian in LD Player
2. Open the game and note your current resource amounts
3. Use Game Guardian to search for and modify these values
4. Follow specific instructions in `memory_mod_instructions.txt`

### Method 2: Advanced Decompilation (Complex)
1. Extract the encryption key using Frida:
   ```
   frida -U -l cocos2d_xxtea_script.js -f com.global.xddqsea
   ```

2. Decrypt the JSC file:
   ```
   python decrypt_jsc.py cocos2d-jsb.jsc "YOUR_ENCRYPTION_KEY"
   ```

3. Modify the decrypted JavaScript to add unlimited resources

4. Recompile and package the modified game

5. Install the modified APK on your device

## Warning

- Modding games may violate the terms of service
- Only use these modifications in single-player mode
- Online features may detect modifications and ban your account

## Legal Disclaimer

This project is for educational purposes only. The tools and instructions provided are meant for personal use on legally obtained copies of the game. The authors do not encourage piracy or unauthorized distribution of modified games. 