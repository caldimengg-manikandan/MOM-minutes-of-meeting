import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://127.0.0.1:8000/api/ws/transcribe?language=en&use_online=false"
    try:
        async with websockets.connect(uri) as websocket:
            print("Successfully connected to WebSocket")
            # Send some dummy audio data (silence) or just close
            # Just verifying connection is enough for now
            await websocket.close()
            print("Successfully closed WebSocket")
    except Exception as e:
        print(f"Failed to connect: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket())
