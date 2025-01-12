![Unbenannt](https://github.com/user-attachments/assets/f59e96da-b63d-4024-85ea-218ced2890b0)

# Goal of the game

The goal of this online multiplayer game is to play a partcle in a particle system.
You will be able to combine your particle with other free floating ones to unlock new abilities.

## Features

It uses a physics simulaiton of gravity and a collision system.
![image](https://github.com/user-attachments/assets/ee597f88-439e-4fef-a4ae-11f02557da14)

## Architecture

+ This is a game written purely in javascirpt using Node.js and three.js as its only dependancies.
  + It uses it's own System for lazy loading and ui rendering. (No Frameworks such as Rect or Angular were used)
+ It uses websockets as it's main way of comunicaiton.
  +  Spacial Hashgrids are used in an attemt to reduce the traffic over the websockets.

