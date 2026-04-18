# Whiteboardio

En kollaborativ whiteboard där flera användare kan rita på samma canvas i realtid.
Rita, välj färg, sudda etc. allt synkas direkt till alla som är anslutna!

## Teknik

- **Node.js** — server-runtime
- **Express** — hanterar HTTP och serverar frontend-filerna
- **ws** — WebSocket-bibliotek som driver realtidskommunikationen
- **nodemon** — startar om servern automatiskt vid filändringar (dev)
- **Supabase** — lagrar alla streck persistent så att canvasen finns kvar mellan sessioner

## Kom igång

Projektet ligger deployat på [whiteboardio.gross.nu](https://whiteboardio.gross.nu/), du kan öppna länken i två flikar och börja rita direkt!

Om du vill köra projektet lokalt, klona repot och installera beroenden:

```bash
npm install
```

Starta servern:

```bash
npm start
```

Öppna [http://localhost:3000](http://localhost:3000) i webbläsaren.
Vill du testa kollaborationen, öppna samma adress i två flikar

Under utveckling kan man använda `npm run dev`, då startar servern om automatiskt varje gång man sparar en fil

## Funktioner

- Välkomstmodal som kräver ett användarnamn innan man kan börja rita och chatta
- Rita fritt på en oändlig canvas med scroll-zoom och pan (space+drag eller mittenklick)
- Välj färg från paletten
- Justera penselstorlek med slidern
- Suddgummi (skalar med slidern)
- Realtidssynk — alla stroke-event skickas via WebSockets och ritas ut hos övriga användare direkt
- Se andras cursors i realtid med namn och färg
- Persistent canvas: ritningarna sparas i Supabase och finns kvar när man återvänder
- Darkmode (client side) med automatisk färganpassning
- Live-räknare som visar antal anslutna användare
- Notis i hörnet när någon ansluter eller lämnar
- Inbyggd chatt: fäll in via fliken på höger sida, användarnamnet från inloggningen används när fdu skickar meddelanden

## Hur WebSockets används

När en användare ritar skickas ett stroke-event till servern med koordinater, färg och penselstorlek. Servern vidarebefordrar det till alla andra anslutna klienter som ritar ut strecket på sin canvas. Det gör att alla ser samma sak utan att behöva ladda om sidan.

Chatten fungerar på samma sätt: meddelanden skickas till servern som broadcastar dem till alla anslutna, inklusive avsändaren själv. Även clear-knappen och join/leave-notiser hanteras via WebSockets, så allt håller sig synkat i realtid

## Rapport om WebSockets

Jag har bifogat rapporten direkt här i repot, men du kan också läsa den direkt i [google docs](https://docs.google.com/document/d/1gz2lMZkChd6TKtUAyf2olH-KoJ7gH2lKvhtp0MKryYg/edit?usp=sharing) om det är bekvämare :)