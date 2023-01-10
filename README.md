# Salad-bot

The salad discord bot

# Compiling

* Open a terminal and navigate to the bots folder
* Run `npm i` to install dependencies
* Run `npm build:bot` to compile the bot
* The bot will be compiled into ./dist/src

# Installation

* In `.env.example` fill in the config values
* Remove `.example` from `.env.example`
* Open a terminal and navigate to the bots folder
* Execute `npm i --production` and wait till it's done
* Execute `prisma migrate deploy` and wait till it's done
* Execute `prisma generate` and wait till it's done
* You're ready to start the bot!

# Starting

* Open a terminal and navigate to the bots folder
* Run `npm run start` and the bot should log in
* The bot is now ready for use

# Npm commands
* `lint` Lint the entire project
* `fix` Fix the project according to the linter
* `build` Build both the bot and scripts
* `build:bot` Build only the bot
* `build:scripts` Build only the scripts
* `start` Start the compiled bot
* `dev` Start the bot and watch for changes
* `new:interaction` Create a new interaction file
* `new:event` Create a new event handler file
* `new:task` Create a new task file
