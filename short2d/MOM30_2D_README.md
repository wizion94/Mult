# MOM30 2D — «What if MOM let you play Roblox ONLY while the microwave runs?!»
Стиль первого мультика (`short2d`): 2D canvas, блочные Roblox-герои, фиолетовая палитра, динамические титры.
- `mw.js` / `mw.html` — вся анимация (герои, комната, кухня, микроволновка, Obby, брат, титры, HUD)
- `dialogue.json` — реплики и тайминги (общие с озвучкой)
- `mwrender.js` — рендер: `node mwrender.js frames OUT K 4 30 47.5` (K=0..3)
- звук: `../toon3d/mom30_audio.py` (эффекты+музыка), настоящая озвучка: `../toon3d/mom30_voice.py` (ключ из `ELEVENLABS_API_KEY`)
- сборка: `ffmpeg -framerate 30 -i OUT/%05d.jpg -i sfx.wav -c:v libx264 -pix_fmt yuv420p -crf 18 -c:a aac -shortest out.mp4`
