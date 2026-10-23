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
| `src/components/` | Reusable pieces: mood buttons, the map, the tab bar, and more. |
| `src/screens/` | The three tabs: Check in, Map, Journal. |
| `src/lib/campus.ts` | Where the map is centered (Penn State). Change this to move the app. |
| `src/lib/sampleData.ts` | **Made-up check-ins for testing. Delete before launch.** |
| `src/lib/journal.ts` | The private journal, saved only on the person's phone. |

## Progress

- [x] 1. Project setup and design tokens
- [x] 2. Mood check-in, Calm Corner, streak on check-in
- [x] 3. Campus map with sample data, bottom tabs, Journal, map unlocks after today's check-in
- [ ] 4. Supabase: real check-ins and anonymous sessions
- [ ] 5. Privacy rules enforced in the database
- [ ] 6. Push notifications ("East Halls is buzzing right now")
- [ ] 7. Weekly recap and shareable cards
- [ ] 8. Remaining extras: forecast, send a good vibe, daily prompt, leaderboard, daily reminder
- [ ] 9. Polish, accessibility and launch

Parked for now: Friends (the app stays fully anonymous), Strava/Fitbit/Oura connections.
