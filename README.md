# Whiteboardio

En kollaborativ whiteboard där flera användare kan rita på samma canvas i realtid.
Rita, välj färg, sudda etc. allt synkas direkt till alla som är anslutna!

## Teknik

- **Node.js** — server-runtime
- **Express** — hanterar HTTP och serverar frontend-filerna
- **ws** — WebSocket-bibliotek som driver realtidskommunikationen
- **nodemon** — startar om servern automatiskt vid filändringar (dev)

## Kom igång

Klona repot och installera beroenden:

```bash
npm install
```

Starta servern:

```bash
npm start
```

Öppna [http://localhost:3000](http://localhost:3000) i webbläsaren.
Vill du testa kollaborationen, öppna samma adress i två flikar eller på två olika enheter i samma nätverk.

Under utveckling kan man använda `npm run dev`, då startar servern om automatiskt varje gång man sparar en fil

## Funktioner

- Rita fritt på en fullscreen canvas
- Välj färg från paletten
- Justera penselstorlek med slidern
- Suddgummi (skalar med slidern)
- Clear-knapp som rensar canvasen för alla anslutna användare
- Realtidssynk — alla stroke-event skickas via WebSockets och ritas ut hos övriga användare direkt

## Hur WebSockets används

När en användare ritar skickas ett meddelande till servern med koordinater, färg och penselstorlek.
Servern vidarebefordrar det till alla andra anslutna klienter som ritar ut strecket på sin canvas.
Det gör att alla ser samma sak utan att behöva ladda om sidan.

Clear-knappen fungerar på samma sätt, fast det meddelandet skickas till alla — inklusive den som tryckte på knappen.
