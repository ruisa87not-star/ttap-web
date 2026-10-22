# [Timetable Arranging Program - Web (TTAP)](https://github.com/wongjiahau/ttap-web)

## New web and Windows planner

The redesigned application is in [`app/`](app/README.md). It shares a React/TypeScript
interface and solver between the browser and Windows Electron, imports UTAR HTML,
and exchanges portable `.ttap.json` files.

On Windows, double-click **[Start-TTAP.cmd](Start-TTAP.cmd)** to open the packaged
desktop app. If it has not been built, the launcher shows the build commands.
The entire `app/release/win-unpacked/` folder must remain in place.

For development, run these commands from the repository root:

```sh
npm --prefix app ci
npm --prefix app run dev:web
# or: npm --prefix app run dev:desktop
```

See [`app/README.md`](app/README.md) for builds, tests, outputs and compatibility
limits. The original source and its instructions below remain available.

## Special thanks to

- My parents (for raising me)
- Keli (for accompanying me)
- Dr. Madhavan (for helping me)
- Dr. Victor (for helping me)
- Mr. James (for helping me)
- Sean Ho (for challenging me)
- Heng (for lending me his username and password)
- Dheeno (for pushing me)
- Sheng Hong (for aiding me)
- Cheng Feng (for suggesting the show alternative slots feature)
- Sharon Lua (testing)
- All those who tested TTAP

![Build](https://github.com/wongjiahau/ttap-web/workflows/Build/badge.svg)
[![Greenkeeper badge](https://badges.greenkeeper.io/wongjiahau/ttap-web.svg)](https://greenkeeper.io/)
[![BCH compliance](https://bettercodehub.com/edge/badge/wongjiahau/ttap-web?branch=master)](https://bettercodehub.com/)
[![codecov](https://codecov.io/gh/wongjiahau/ttap-web/branch/code-cov/graph/badge.svg)](https://codecov.io/gh/wongjiahau/ttap-web/branch/code-cov)
[![Maintainability](https://api.codeclimate.com/v1/badges/5ce98f451482c90bfce6/maintainability)](https://codeclimate.com/github/wongjiahau/ttap-web/maintainability)

## Objectives

This software is used to helps student's of UTAR to arrange their timetable without frustration.

## Technologies used :

- [Facebook's React](https://reactjs.org/)
- [Microsoft's Visual Studio Code](https://code.visualstudio.com/)
- [Microsoft's TypeScript](https://www.typescriptlang.org/)
- [Node.js](https://nodejs.org/en/)
- [Redux](http://redux.js.org/)
- [GitHub](https://github.com/)
- [Surge](https://surge.sh/)
- [Create-React-App](https://github.com/facebookincubator/create-react-app)
- [Material-UI](https://material-ui-next.com/)

## How to build this app?

### Prerequisites

1. Make sure you have installed [Git](https://git-scm.com/downloads) and
   [Node.js](https://nodejs.org/en/).

2. It is highly recommended to use [Visual Studio Code](https://code.visualstudio.com/) for this project.
   Also, please install the following extensions:

- Git Lens
- TS Lint

### Steps

#### 1. Clone the project

```
git clone https://github.com/wongjiahau/ttap-web.git
```

#### 2. Install all the required Node packages

```
cd ttap-web
npm install
```

#### 3. Run the server

You need to run this in another terminal.

```
npm run start
```

#### 4. Enjoy!

## Extra

### How to run test?

```
npm run test
```

### How to visualize bundle size and dependencies in this app?

```
npm run analyze
```

It is also hosted at https://ttap-source-analysis.surge.sh

### How many visits are there to ttap.surge.sh?

To view the analytical data, go to https://goo.gl/#analytics/goo.gl/nHNNCF/all_time
Or https://app.bitly.com/Bi451JE8j4x/bitlinks/2JmBftW

### How to view the feedback report?

Go to https://wongjiahau.github.io/ttap-feedback-report/

## How to open on Mac OS?

You might face one of the following issues when opening TTAP in Mac OS.

### (1) "TTAP" is damaged and can't be opened

<img width="500" alt="image" src="https://github.com/user-attachments/assets/176dfe46-573e-47c9-851d-18042e2f99c4" />

**Solution**:
1. Open the Terminal app by pressing `cmd+space`, then type in "terminal":

<img width="500" alt="image" src="https://github.com/user-attachments/assets/09d7880b-b623-44b9-898a-79510033958b" />

2. In the Terminal app, type in `xattr -cr /Applications/TTAP.app/`, then press Enter:

<img width="500" alt="image" src="https://github.com/user-attachments/assets/979f2001-3b88-4b05-b8f9-230c7ccd45ec" />

3. If you see a wall of error message like the one below, repeat Step 2:

<img width="500" alt="image" src="https://github.com/user-attachments/assets/905433ae-8a8c-4337-ba26-aa0f680741f4" />


4. Open TTAP app again, and it should work.


### (2) "TTAP" cannot be opened because the developer cannot be not verified


![image](https://user-images.githubusercontent.com/23183656/204980269-fd85f693-07fd-4b58-bfb8-643f51199f1c.png)

**Solution**: open _System Preferences_, go to _Security & Privacy_, click on _Open Anyway_:

![image](https://user-images.githubusercontent.com/23183656/204980538-2529b152-2319-4e9d-8a77-8154b86b92a7.png)
