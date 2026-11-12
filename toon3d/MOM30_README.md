# MOM30 — «What if MOM let you play Roblox ONLY while the microwave runs?!»
Код мультика (всё, что нужно, чтобы пересобрать ролик):
- `dialogue.json` — реплики и тайминги (их читают и анимация, и озвучка)
- `mom30.js` / `mom30.html` — 3D-мультяшная сцена (Three.js): комната, кухня, Obby над лавой, брат, HUD, пузыри
- `mrender.js` — рендер кадров (Playwright): `node mrender.js frames OUT K 4 30 47.5` (K=0..3 параллельно)
- `mom30_audio.py` — синтез эффектов/музыки/«болтовни»: `python3 mom30_audio.py sfx.wav`
- `mom30_voice.py` — настоящая озвучка ElevenLabs (ключ только из `ELEVENLABS_API_KEY`)
- Сборка: `ffmpeg -framerate 30 -i OUT/%05d.jpg -i sfx.wav -c:v libx264 -pix_fmt yuv420p -crf 18 -c:a aac -shortest mom30_microwave_short.mp4`
