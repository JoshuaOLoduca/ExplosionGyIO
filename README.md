# Explosion Guy IO

## Table Of Contents

- [Project Overview](#project-overview)
  - [Overview](#what-it-is)
  - [Technical Details](#technical-details)
  - [Features](#features)
  - [History](#history)
  <!-- - [Gifs/Pictures](#gifspictures) -->
- [Getting Started](#getting-started)
- [Dependencies](#dependencies)

## Project Overview

### What it is

A classicly inspired party game, designed with modern day interactions in mind!

This Game is designed to work both in the [Discord Activities](https://discord.com/developers/docs/activities/overview) (OAuth), and in the browser. The end goal is to create a .IO game that allows for large player size lobbies that support drop-in joining.

Breakdown of contributions:\
Josh - Code!\
[Matt Hackett of Lost Decade Games, Cem Kalyoncu, and /usr/share](https://opengameart.org/content/bomb-party-the-complete-set) - Placeholder art\
[game-icons.net](https://game-icons.net/) - Powerup Icons

### Technical details

- [/] Classic Arcade gameplay
  - [/] In house developed physics/collision system
    - [x] Box Collision Check
- [/] Multiplayer!
  - [x] Server Authoritative design
  - [/] Join By Browser
  - [] Join By Discord
- [ ] Lobbies
- [ ] Large player count support per lobby

## Features

- Designed with cheat prevention in mind
- Arcade gameplay
- Multiplayer!
- Power ups!
  - [x] Bomb Placement Increase
  - [x] Bomb Explosion size Increase
  - [x] Bomb Damage Increase
    - [x] Bombs can be used to detonate other bombs! scales with damage
  - [x] Player speed!
    - [x] Partly designed to be usable at extreme upgrade levels, but remaining faithful to the original arcade game, these become downgrades once you get too much.

### History

> ExplosionGyIO has been my "Why hasnt this been done yet" idea for the past year, but havent had the time to start work on it until recently. \
> The goal is to first create an MVP that is fun, and usable by discord activities.

> Although there are a lot of available tools for game dev, I tend to keep things minimal while learning. This means dealing with collisions manually/in-house. This could change after the MVP is finished.

<!-- ## Gifs/Pictures

---

### Example

> ![Example](/readme/webms/1-selecting_campaign.gif)

--- -->

## Getting Started

1. Clone the repository
2. Run `npm install`. (will auto install `/packaged/client` and `/packages/server` modules)
3. In the `/packages/server` create `.env` based on our `.env.example`
4. in the Root Directory, run `npm run dev` this will start both front-end and back-end.
5. The App is reachable!
   1. The Game can be reached on `localhost:3000`
   2. Backend/colyseus can be reached at `localhost:3001/colyseus`

## Core Dependencies

```sh
    "@discord/embedded-app-sdk": "^1.4.3",
    "colyseus.js": "^0.16.0",
    "phaser": "^3.87.0",
    "colyseus": "^0.16.0",
    "@colyseus/monitor": "^0.16.0",
    "@colyseus/schema": "^3.0.0",
    "@colyseus/uwebsockets-transport": "^0.16.0",
    "@colyseus/ws-transport": "^0.16.0",
    "express": "^4.17.1",
    "http-proxy-middleware": "^2.0.6",
    "uwebsockets-express": "^1.2.2"
```

## Dev Dependencies

```sh
    "ts-node": "^10.9.1",
    "typescript": "^5.2.2",
    "nodemon": "^3.0.3",
    "vite": "^5.0.8",
    "cloudflared": "^0.5.3"
```
