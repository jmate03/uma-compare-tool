# Umamusume Compare Tool

This tool allows a user to easily compare umas from Umamusume to help determine which ones are worth keeping.  
Search through your list of umas using filters and compare them in either the parent view or the ace view (WIP).  
Eventually I'd like to be able to do the uma input with ocr but until then umas are manually imported through getting an [umadump](https://werseter.github.io/umadump/).  
Built with React + Vite, written in Typescript
<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/06d7c994-ad0b-4e4c-b682-473ef2c17d0e" />



## How to use the tool  
- First get a dump from the game using [umadump](https://werseter.github.io/umadump/).
- Import the file called `trained_chara_data.json`
- A list of all of your trained umas will be loaded, and can be used differently depending on the view.

### Parent View
- Each uma displays a summary of their spark values either including their parents or without.
- They can be filtered by the different spark types: blues, pinks, greens, whites. more filtering/sorting options to come.
- You can also add more in depth notes to the umas compared to the limited notes in game.
- (TODO) Affinities, comparing two umas, display and sort by favorited umas in game

### Ace View (WIP)
- Each uma will display a summary of their stats, aptitudes, and skills
- They will be able to be filtered by the skills they have, and stat thresholds, potentially more
- Same in depth notes as before, separate from the parent version since an ace may also be a good parent
- As mentioned this view is not yet on the site

## Acknowledgements
Majority of skill/spark/uma data comes from [hachimi-tl-en](https://github.com/UmaTL/hachimi-tl-en)  
The code for [ocr](src/ocr/ocr.ts) and the [trained data](public/vendor/tesseract/traineddata/eng.traineddata.gz) were adapted from [uma-tools](https://github.com/alpha123/uma-tools), and [skill data](data) taken from [uma-skill-tools](https://github.com/alpha123/uma-skill-tools), both by [alpha123](https://github.com/alpha123)
