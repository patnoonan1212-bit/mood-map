# Mood Map

Anonymous, live "emotional weather" for a neighborhood or campus. Tap how you feel, and everyone's taps blend into soft clouds of color on a map.

Pilot location: Penn State, University Park.

## Run it on your computer

You need [Node.js](https://nodejs.org) (the "LTS" version) installed once.

```bash
npm install     # downloads the building blocks (first time only)
npm run dev     # starts the app; open the link it prints, usually http://localhost:5173
```

## Where things live

| Path | What it is |
|---|---|
| `src/styles/tokens.css` | Every color, corner radius and shadow, for light and dark mode. Change the look here. |
| `src/lib/moods.ts` | The six moods and their labels. |
| `src/App.tsx` | The main screen. |
| `src/components/` | Reusable pieces such as the light/dark toggle. |

## Progress

- [x] 1. Project setup and design tokens
- [x] 2. Mood check-in
- [ ] 3. Map with sample data
- [ ] 4. Supabase and real check-ins
- [ ] 5. Privacy rules in the database
- [ ] 6. Extra features
- [ ] 7. Polish, accessibility and launch
