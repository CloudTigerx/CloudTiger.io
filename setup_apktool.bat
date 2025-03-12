@echo off
echo Setting up APKTool environment...

:: Create a batch file to run APKTool
echo @echo off > apktool.bat
echo java -jar "%~dp0apktool.jar" %%* >> apktool.bat

:: Create a batch file for easy decompilation
echo @echo off > decompile.bat
echo echo Decompiling %%1... >> decompile.bat
echo call apktool.bat d -f "%%1" -o "%%~n1_decompiled" >> decompile.bat

:: Create a batch file for easy recompilation
echo @echo off > recompile.bat
echo echo Recompiling %%1... >> recompile.bat
echo call apktool.bat b -f "%%1" -o "%%~n1_modded.apk" >> recompile.bat

echo APKTool environment set up successfully!
echo.
echo Usage:
echo - To decompile an APK: decompile.bat your_app.apk
echo - To recompile a folder: recompile.bat your_app_decompiled
echo.
echo Note: You'll need to sign the APK after recompiling to install it. 