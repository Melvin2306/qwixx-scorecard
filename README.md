# Qwixx Scorecard

A digital scorecard for the popular Qwixx dice game created with Next.js and shadcn/ui.

## About

This digital scorecard allows you to keep track of your Qwixx game scores without needing a paper scorecard. It's built with Next.js 15 and uses shadcn/ui components for a clean, modern user interface.

## Features

- Digital recreation of the official Qwixx scorecard
- Automatic score calculation
- Rule enforcement (proper number crossing order)
- Responsive design for both desktop and mobile
- Local-only functionality (no server required)

## Game Rules

Qwixx is a fast-playing dice game where players try to mark off as many numbers as possible in the four color rows. In each row, numbers must be crossed out from left to right, and if you skip a number, it can't be crossed out later.

Each row has a specific color (red, yellow, green, and blue) and a sequence of numbers:
- Red and Yellow rows go from 2 to 12 (ascending order)
- Green and Blue rows go from 12 to 2 (descending order)

Points are awarded based on how many numbers you cross out in each row:
- 1 mark: 1 point
- 2 marks: 3 points
- 3 marks: 6 points
- 4 marks: 10 points
- 5 marks: 15 points
- 6 marks: 21 points
- 7 marks: 28 points
- 8 marks: 36 points
- 9 marks: 45 points
- 10 marks: 55 points
- 11 marks: 66 points
- 12 marks: 78 points

Penalties (marked with X) count as -5 points each.

## Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to use the scorecard.

## Development

This project is built with:
- Next.js 15
- React 19
- shadcn/ui components
- Tailwind CSS

## Credits

Qwixx is designed by Steffen Benndorf and published by Nürnberger Spielkarten Verlag. This digital scorecard is an unofficial fan creation and not endorsed by the publisher.
