# Advanced Decompilation Method for Nobodies Adventure Chop Chop

This guide explains how to decompile the JavaScript compiled (.jsc) files from the game, modify them to add unlimited resources, and then recompile them.

## Tools Required

1. **JSC-PyDecrypt-Tool** - for decrypting .jsc files
   - Download from: https://github.com/bartlomiejduda/JSC-PyDecrypt-Tool

2. **Python 3.11.6** - required to run the decryption tool
   - Download from: https://www.python.org/downloads/

3. **Frida** - to extract the encryption key from the game
   - Install with: `pip install frida-tools`

4. **Node.js** - to run and test the decompiled JavaScript
   - Download from: https://nodejs.org/

5. **BytecodeCompiler** - to recompile the modified JS
   - Part of the Cocos Creator toolchain

## Step 1: Extract the Encryption Key

Before we can decompile the .jsc file, we need to extract the encryption key:

1. Install Frida on your computer:
   ```
   pip install frida-tools
   ```

2. Download the XXTEA Frida script mentioned in the JSC-PyDecrypt-Tool README

3. Connect your phone or emulator with ADB

4. Run the Frida script while launching the game:
   ```
   frida -U -l cocos2d_xxtea_script.js -f com.global.xddqsea
   ```

5. Note down the encryption key that appears in the output

## Step 2: Decrypt the JSC File

Now we can decrypt the .jsc file using the key we obtained:

1. Download and install JSC-PyDecrypt-Tool as per its README
   - Create a Python virtual environment
   - Install required dependencies with `pip install -r requirements.txt`

2. Use the tool to decrypt the .jsc file:
   ```
   python jsc_pydecrypt_tool.py -d cocos2d-jsb.jsc "YOUR_ENCRYPTION_KEY" game_decrypted.js
   ```

3. The decrypted JavaScript will be saved to game_decrypted.js

## Step 3: Locate Resource Management Code

After decryption, search for keywords related to resources:
- "coin", "gold", "gem", "currency", "resource"
- "wallet", "inventory", "player.data"
- "save", "localStorage"

Look for functions that:
- Handle in-app purchases
- Update resource counts
- Check if player has enough resources

## Step 4: Modify the Code

Once you've found the resource management code, you can modify it:

**Option 1: Bypass Resource Checks**
```javascript
// Original code might look like:
if (this.coins >= cost) {
    this.coins -= cost;
    // Give item
}

// Modified to:
if (true) { // Always pass the check
    // this.coins -= cost; // Comment out or remove this line
    // Give item
}
```

**Option 2: Infinite Resources**
```javascript
// Look for where resources are initialized or loaded
// Add code like:
this.coins = 9999999;
this.gems = 9999999;
```

**Option 3: Override Getter Functions**
```javascript
// If the game uses getters for resources:
get coins() {
    return 9999999; // Always return a large number
}
```

## Step 5: Recompile the JavaScript

After modifying the code:
1. Use Cocos Creator's BytecodeCompiler to recompile the JS to .jsc
2. Replace the original .jsc file in the APK

## Step 6: Rebuild & Sign the APK

1. Use the previously set up APKTool to rebuild the APK:
   ```
   recompile.bat decompiled_game
   ```
2. Sign the APK (you'll need a signing key)
   ```
   jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore your_keystore.keystore your_modded.apk alias_name
   ```

## Advanced Debugging Tips

If you're having trouble understanding the decompiled code:
1. Add `console.log()` statements in key functions
2. Use Frida for dynamic analysis of the app at runtime
3. Look for obfuscated variable names (like a, b, c) and rename them for clarity

Remember that decompiled code is often obfuscated and hard to read. It may take time to understand how the game manages resources.

## Warning

This advanced method requires JavaScript knowledge and knowledge of Frida for extracting the encryption key. The process can be complex, but yields the most powerful modding capabilities. 