#!/usr/bin/env python3
"""
Quick diagnostic script to identify the transcription API issue
Run this in your backend directory: python diagnose.py
"""

import os
import sys

def check_env_vars():
    """Check critical environment variables"""
    print("=" * 60)
    print("1. ENVIRONMENT VARIABLES")
    print("=" * 60)
    
    critical_vars = {
        "OPENAI_API_KEY": "OpenAI API Key",
        "DATABASE_URL": "Database Connection",
        "CLERK_SECRET_KEY": "Clerk Authentication"
    }
    
    all_ok = True
    for var, description in critical_vars.items():
        value = os.getenv(var)
        if value:
            masked = f"{value[:7]}...{value[-4:]}" if len(value) > 11 else "***"
            print(f"✓ {var}: {masked}")
        else:
            print(f"✗ {var}: NOT SET")
            if var == "OPENAI_API_KEY":
                all_ok = False
                print(f"  ERROR: {description} is required for transcription!")
    
    print()
    return all_ok

def check_imports():
    """Check if all required packages are importable"""
    print("=" * 60)
    print("2. PACKAGE IMPORTS")
    print("=" * 60)
    
    packages = [
        ("fastapi", "FastAPI"),
        ("openai", "OpenAI"),
        ("multipart", "python-multipart"),
        ("pydantic", "Pydantic"),
    ]
    
    all_ok = True
    for module, name in packages:
        try:
            __import__(module)
            print(f"✓ {name}")
        except ImportError as e:
            print(f"✗ {name}: {e}")
            all_ok = False
    
    print()
    return all_ok

def check_openai_version():
    """Check OpenAI SDK version"""
    print("=" * 60)
    print("3. OPENAI SDK VERSION")
    print("=" * 60)
    
    try:
        import openai
        version = openai.__version__
        print(f"✓ OpenAI SDK version: {version}")
        
        # Check if it's >= 1.0.0
        major_version = int(version.split('.')[0])
        if major_version >= 1:
            print(f"✓ Version is compatible (>= 1.0.0)")
            return True
        else:
            print(f"✗ Version too old. Need >= 1.0.0, got {version}")
            print(f"  Run: pip install --upgrade openai")
            return False
    except Exception as e:
        print(f"✗ Error checking OpenAI version: {e}")
        return False

def test_openai_connection():
    """Test actual connection to OpenAI API"""
    print("=" * 60)
    print("4. OPENAI API CONNECTION TEST")
    print("=" * 60)
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("⚠️  Skipping (no API key set)")
        print()
        return False
    
    try:
        import openai
        client = openai.OpenAI(api_key=api_key)
        
        # Try to list models (lightweight test)
        models = client.models.list()
        print("✓ Successfully connected to OpenAI API")
        print(f"✓ API key is valid")
        return True
        
    except openai.AuthenticationError:
        print("✗ Authentication failed")
        print("  Your API key is invalid or expired")
        print("  Get a new one from: https://platform.openai.com/api-keys")
        return False
        
    except openai.APIConnectionError as e:
        print(f"✗ Connection failed: {e}")
        print("  Check your internet connection")
        return False
        
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        return False
    finally:
        print()

def check_temp_access():
    """Check if we can write to temp directory"""
    print("=" * 60)
    print("5. TEMP DIRECTORY ACCESS")
    print("=" * 60)
    
    import tempfile
    try:
        with tempfile.NamedTemporaryFile(delete=True, suffix='.webm') as tmp:
            tmp.write(b"test data")
            tmp.flush()
            path = tmp.name
            print(f"✓ Can write to temp directory")
            print(f"  Location: {tempfile.gettempdir()}")
            return True
    except Exception as e:
        print(f"✗ Cannot write to temp directory: {e}")
        return False
    finally:
        print()

def test_whisper_transcription():
    """Test actual Whisper transcription with a sample"""
    print("=" * 60)
    print("6. WHISPER API TEST (Optional)")
    print("=" * 60)
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("⚠️  Skipping (no API key set)")
        print()
        return None
    
    print("This test will use ~1 second of your OpenAI credits.")
    response = input("Run Whisper API test? (y/n): ")
    
    if response.lower() != 'y':
        print("Skipped.")
        print()
        return None
    
    try:
        import openai
        import tempfile
        import wave
        import struct
        
        # Create a tiny test audio file (1 second of silence)
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp:
            # Create a minimal WAV file
            sample_rate = 16000
            duration = 1  # 1 second
            
            wav = wave.open(tmp.name, 'wb')
            wav.setnchannels(1)  # mono
            wav.setsampwidth(2)  # 16-bit
            wav.setframerate(sample_rate)
            
            # Write silence
            for _ in range(sample_rate * duration):
                wav.writeframes(struct.pack('h', 0))
            
            wav.close()
            temp_path = tmp.name
        
        print(f"Created test audio file: {temp_path}")
        
        # Test transcription
        client = openai.OpenAI(api_key=api_key)
        
        with open(temp_path, 'rb') as audio_file:
            print("Calling Whisper API...")
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )
        
        print(f"✓ Whisper API works!")
        print(f"  Response: '{transcript}'")
        
        # Clean up
        os.remove(temp_path)
        return True
        
    except Exception as e:
        print(f"✗ Whisper test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        print()

def main():
    print("\n")
    print("╔" + "═" * 58 + "╗")
    print("║" + " " * 10 + "BACKEND TRANSCRIPTION DIAGNOSTICS" + " " * 15 + "║")
    print("╚" + "═" * 58 + "╝")
    print()
    
    results = []
    
    # Run all checks
    results.append(("Environment Variables", check_env_vars()))
    results.append(("Package Imports", check_imports()))
    results.append(("OpenAI Version", check_openai_version()))
    results.append(("OpenAI Connection", test_openai_connection()))
    results.append(("Temp Directory", check_temp_access()))
    
    # Optional Whisper test
    whisper_result = test_whisper_transcription()
    if whisper_result is not None:
        results.append(("Whisper API Test", whisper_result))
    
    # Summary
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for check, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {check}")
    
    print()
    print(f"Results: {passed}/{total} checks passed")
    print()
    
    if passed == total:
        print("🎉 All checks passed! Your backend should work.")
        print()
        print("If you're still getting errors:")
        print("1. Check your backend logs when you submit audio")
        print("2. Make sure FastAPI server is running: uvicorn app.main:app --reload")
        print("3. Verify the endpoint is: POST /api/v1/audio/transcribe")
    else:
        print("⚠️  Some checks failed. Fix the issues above.")
        print()
        print("Common fixes:")
        print("- Set OPENAI_API_KEY: export OPENAI_API_KEY='sk-...'")
        print("- Install packages: pip install -r requirements.txt")
        print("- Check OpenAI API key at: https://platform.openai.com/api-keys")
    
    print()

if __name__ == "__main__":
    main()