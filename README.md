# Liars-dice
Liar's dice is a game that requires the ability to deceive and to detect your opponent's deception.

## How do I get it?
Github actions are used to automatically publish the latest version of the game as a dockerimage here:
https://hub.docker.com/repository/docker/ryanroundhouse/liar-server

## How do I run the server?
``` powershell
docker run -d -p 3000:3000 ryanroundhouse/liar-server:v1.0
```
latest commit can be found at the top of this page next to where it lists the number of commits.

## How do I access it?
Open your browser and navigate to http://localhost:3000

## Purpose
This game is built as an exercise to deepen my understanding of the following technologies:
- Angular
- Node.js
- Bootstrap
- Docker
- Github Actions
- Typescript
- NPM
