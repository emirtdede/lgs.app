import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/extracted_playlist_videos.json', 'r', encoding='utf-8') as f:
    all_videos = json.load(f)

for v in all_videos['math-main'][50:100]:
    print(f"#{v['position']}: [{v['videoId']}] {v['title']}")
