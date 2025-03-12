// Frida script to extract XXTEA encryption key from Cocos2d-JS games
// Based on various Frida scripts for XXTEA decryption

console.log("[*] Starting XXTEA key extraction...");

// Wait for Java to load
Java.perform(function() {
    console.log("[+] Java runtime loaded");
    
    // First try to hook the native implementation
    try {
        // Find the XXTEA decrypt function
        var xxteaDecrypt = Module.findExportByName(null, "xxteaDecrypt");
        if (xxteaDecrypt) {
            console.log("[+] Found xxteaDecrypt function at " + xxteaDecrypt);
            
            // Hook the decrypt function to get the key
            Interceptor.attach(xxteaDecrypt, {
                onEnter: function(args) {
                    this.data = args[0];
                    this.key = args[2];
                    this.keyLen = args[3].toInt32();
                    
                    var keyStr = Memory.readUtf8String(this.key, this.keyLen);
                    console.log("[+] XXTEA KEY FOUND: " + keyStr);
                    console.log("[+] Key length: " + this.keyLen);
                    
                    // If you need to see the data being decrypted:
                    // var dataLen = args[1].toInt32();
                    // var data = Memory.readByteArray(this.data, dataLen < 100 ? dataLen : 100);
                    // console.log("[*] Data (first 100 bytes): " + hexdump(data));
                }
            });
            
            console.log("[*] Hooking placed on xxteaDecrypt. Run the game...");
        } else {
            console.log("[-] xxteaDecrypt function not found, trying alternative methods...");
        }
    } catch (e) {
        console.log("[-] Error in native hooking: " + e);
    }
    
    // Alternative method: Look for Java implementations
    try {
        // Many Cocos2d games use XXTEA in a helper class
        var cryptoClasses = [
            "com.cocos.lib.CocosHelper",
            "org.cocos2dx.lib.Cocos2dxHelper",
            "com.cocos2dx.javascript.XXTEA", 
            "org.cocos2dx.javascript.XXTEA",
            "org.cocos2dx.lib.XXTEA"
        ];
        
        cryptoClasses.forEach(function(className) {
            try {
                var CryptoClass = Java.use(className);
                console.log("[+] Found class: " + className);
                
                // Try to hook decrypt methods
                if ("decrypt" in CryptoClass) {
                    console.log("[+] Found decrypt method in " + className);
                    CryptoClass.decrypt.overload('[B', '[B').implementation = function(data, key) {
                        console.log("[+] XXTEA KEY FOUND: " + new Uint8Array(key));
                        console.log("[+] Key as string: " + Java.use("java.lang.String").$new(key));
                        return this.decrypt(data, key);
                    };
                }
                
                // Check for other common method names
                ["xxteaDecrypt", "aesDecode", "decryptWithXXTEA"].forEach(function(methodName) {
                    if (methodName in CryptoClass) {
                        console.log("[+] Found method " + methodName + " in " + className);
                        // You'd need to implement specific overloads based on the class
                    }
                });
            } catch (e) {
                // Class not found, continue to next
            }
        });
    } catch (e) {
        console.log("[-] Error in Java hooking: " + e);
    }
    
    console.log("[*] All hooks in place. Run the game and interact with it to trigger decryption...");
}); 