import asyncio
import websockets
import json
import sys

async def test_websocket(language):
    uri = f"ws://127.0.0.1:8000/api/ws/transcribe?language={language}&use_online=false"
    print(f"Testing connection for language: {language}")
    try:
        async with websockets.connect(uri) as websocket:
            print(f"SUCCESS: Connected to WebSocket for {language}")
            
            # Receive initial message if any, or just wait a bit
            # The server might send an error immediately if model loading fails
            
            # Send a small empty binary frame to simulate audio start
            # await websocket.send(b'')
            
            # Wait for a potential error message
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                print(f"Received message: {response}")
            except asyncio.TimeoutError:
                print("No immediate error received (Good sign)")
            except websockets.exceptions.ConnectionClosed as e:
                print(f"Connection closed by server: {e}")

            await websocket.close()
            print(f"Closed connection for {language}")
            return True
    except Exception as e:
        print(f"FAILURE: Failed to connect for {language}: {e}")
        return False

async def main():
    langs = ["en", "hi", "ta"]
    results = {}
    for lang in langs:
        results[lang] = await test_websocket(lang)
        print("-" * 20)
    
    print("Results:", results)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except ImportError:
        print("websockets module not installed. Installing...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "websockets"])
        print("Please rerun the script.")
