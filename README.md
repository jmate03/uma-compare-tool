# Umamusume Compare Tool

This tool allows a user to easily compare umas from Umamusume to help determine which ones are worth keeping.
- Search through your list of umas using filters in the parent or ace modes.
- Compare up to 4 uma's in depth, with several options like hiding common sparks so you can see how they actually differ.
- Export an uma's data for use in other tools such as the umalator.   

Eventually I'd like to be able to do the uma input with ocr but until then umas are manually imported through getting an [umadump](https://werseter.github.io/umadump/).   
If you want to just try the tool out, demo data is available in the app, which can be accessed if there is no other data loaded.  
You can also download the [demo data here](public\demo\trained_chara_data_demo.json), and import it into the app manually, but make sure to clear it before importing your own.  
 
Built with React + Vite, written in Typescript




## How to use the tool 
Note: A full more in-depth guide is available on the site by clicking the '?' icon in the top right.
- First get a dump from the game using [umadump](https://werseter.github.io/umadump/).
- Import the file called `trained_chara_data.json`
- A list of all of your trained umas will be loaded, and can be used differently depending on the view.

### Parent View
- Each uma displays a summary of their spark values either including their parents or without.
- They can be filtered by the different spark types: blues, pinks, greens, whites. more filtering/sorting options to come.
- You can also add more in depth notes to the umas compared to the limited notes in game.
- (TODO) Affinities, comparing two umas, display and sort by favorited umas in game

### Ace View
- Each uma displays a summary of their stats, aptitudes, and skills
- They will be able to be filtered by the skills they have, and stat thresholds, potentially more
- Same in depth notes as before


## Acknowledgements
Majority of skill/spark/uma data comes from [hachimi-tl-en](https://github.com/UmaTL/hachimi-tl-en)  
The code for [ocr](src/ocr/ocr.ts) and the [trained data](public/vendor/tesseract/traineddata/eng.traineddata.gz) were adapted from [uma-tools](https://github.com/alpha123/uma-tools), and [skill data](data) taken from [uma-skill-tools](https://github.com/alpha123/uma-skill-tools), both by [alpha123](https://github.com/alpha123)  
Character icons are from [gametora](https://gametora.com/umamusume/characters)  

Umamusume: Pretty Derby and all related materials are © Cygames, Inc. This is an unofficial fan tool and is not affiliated with or endorsed by Cygames.
