# Pet Hepi

A tiny patience game built with Next.js. Pet Hepi gently, watch his suspicion
level, and see how many pets you can earn before he catches you.

## How to play

- Stroke across Hepi with a mouse or pointer. One continuous pass counts as one
  pet.
- Tap or swipe on touch screens.
- Wait when the suspicion meter rises. It cools down over time.
- Difficulty increases at 10, 25, and 45 pets: Hepi notices faster brushing
  more easily and takes longer to calm down.
- A fast pet at maximum suspicion ends the game.
- Select Hepi and press Enter or Space for keyboard play.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Checks

```bash
npm run lint
npm run build
```

The game art and cursor assets, including the generated grooming-brush cursor,
live in `public/`.
