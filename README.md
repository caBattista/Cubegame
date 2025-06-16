# Cubegame - Survive and thrive as a particle within a system

Watch a DEMO here:

[![Unbenannt](https://github.com/user-attachments/assets/f59e96da-b63d-4024-85ea-218ced2890b0)](https://www.youtube.com/watch?v=XrRKkv0ZK84)

*Sometimes you have to go outside of the box to get a clear picture of it*

# Ideas behind the game

The goal of this online 3rd person multiplayer game is to play a partcle in a particle system.
You will be able to combine your particle with other free floating ones to unlock new abilities.
It should combine the concepts of successfull browser games like agar.io and r/place. 
Having emergent structures based on the individual actions of the players would be interesting as well.

#### Possible Abilities
+ Different types of shooting (Single, Multi Shot, Diefferent patterns)
+ Manipulation of gravity fields (Traktor field for gathering particles, Repelling field for defending against other attacks)
+ Manipulation of time relative to the other user

## Features

It uses a physics simulaiton of gravity and a collision system.

![image](https://github.com/user-attachments/assets/ee597f88-439e-4fef-a4ae-11f02557da14)

## Architecture

+ This is a game written purely in javascirpt using Node.js and three.js as its only dependancies.
  + It uses it's own System for lazy loading and ui rendering. (No Frameworks such as Rect or Angular were used)
+ It uses websockets as it's main way of comunicaiton.
  + Spacial Hashgrids are used in an attemt to reduce the traffic over the websockets.
    + Cost reduction needs to be achieved here
+ Containers hosted on heroku with a shared Postgress database have been tested

## Future plans

+ Possibly try to use AI tools to reduce the traffic even further by using generated approximaitons of positions.

## State of the game

+ As of now it's development is suspended until I have more time again to work on it hopefully soon.
