export const defaultVoiceList = [
    {
        "voice_id": "21m00Tcm4TlvDq8ikWAM",
        "name": "Rachel",
        "preview_url": "https://storage.googleapis.com/eleven-public-prod/premade/voices/21m00Tcm4TlvDq8ikWAM/6edb9076-c3e4-420c-b6ab-11d43fe341c8.mp3",
    },
    {
        "voice_id": "AZnzlk1XvdvUeBnXmlld",
        "name": "Domi",
        "preview_url": "https://storage.googleapis.com/eleven-public-prod/premade/voices/AZnzlk1XvdvUeBnXmlld/69c5373f-0dc2-4efd-9232-a0140182c0a9.mp3",
    },
    {
        "voice_id": "EXAVITQu4vr4xnSDxMaL",
        "name": "Bella",
        "preview_url": "https://storage.googleapis.com/eleven-public-prod/premade/voices/EXAVITQu4vr4xnSDxMaL/04365bce-98cc-4e99-9f10-56b60680cda9.mp3",
    },
    {
        "voice_id": "ErXwobaYiN019PkySvjV",
        "name": "Antoni",
        "preview_url": "https://storage.googleapis.com/eleven-public-prod/premade/voices/ErXwobaYiN019PkySvjV/38d8f8f0-1122-4333-b323-0b87478d506a.mp3",
    },
    {
        "voice_id": "MF3mGyEYCl7XYWbV9V6O",
        "name": "Elli",
        "preview_url": "https://storage.googleapis.com/eleven-public-prod/premade/voices/MF3mGyEYCl7XYWbV9V6O/f9fd64c3-5d62-45cd-b0dc-ad722ee3284e.mp3",
    },
    {
        "voice_id": "TxGEqnHWrfWFTfGW9XjX",
        "name": "Josh",
        "preview_url": "https://storage.googleapis.com/eleven-public-prod/premade/voices/TxGEqnHWrfWFTfGW9XjX/c6c80dcd-5fe5-4a4c-a74c-b3fec4c62c67.mp3",
    },
    {
        "voice_id": "VR6AewLTigWG4xSOukaG",
        "name": "Arnold",
        "preview_url": "https://storage.googleapis.com/eleven-public-prod/premade/voices/VR6AewLTigWG4xSOukaG/66e83dc2-6543-4897-9283-e028ac5ae4aa.mp3",
    },
    {
        "voice_id": "pNInz6obpgDQGcFmaJgB",
        "name": "Adam",
        "preview_url": "https://storage.googleapis.com/eleven-public-prod/premade/voices/pNInz6obpgDQGcFmaJgB/e0b45450-78db-49b9-aaa4-d5358a6871bd.mp3",
    },
    {
        "voice_id": "yoZ06aMxZJJ28mfd3POQ",
        "name": "Sam",
        "preview_url": "https://storage.googleapis.com/eleven-public-prod/premade/voices/yoZ06aMxZJJ28mfd3POQ/1c4d417c-ba80-4de8-874a-a1c57987ea63.mp3",
    }
];

export const defaultElevenLabsVoiceID = defaultVoiceList.find(voice => voice.name === "Bella")!.voice_id;