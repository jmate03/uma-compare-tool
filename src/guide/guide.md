# Welcome to the uma-compare-tool!
This tool allows you to compare umas across all of their attributes, to help you decide which are worth keeping whether it be as parents or aces. If you've ever had trouble figuring out which umas are worth keeping, this is the tool for you.

The following is a guide on how to use the tool. If you need to revisit this guide it is available by clicking on the question mark icon in the top right of the screen.
## Table of Contents
1. [Getting Started](#getting-started)
2. [The Umas](#the-umas)
3. [Parent Mode](#parent-mode)
   - [Spark Filters](#spark-filters)
4. [Ace Mode](#ace-mode)
   - [Skill Filters](#skill-filters)
5. [Compare View](#compare-view)

## Getting Started  
- First get a dump from the game using [umadump](https://werseter.github.io/umadump/).
- Import the file called `trained_chara_data.json`
- A list of all of your trained umas will be loaded, and can be used differently depending on the mode.  
<small>**Note:** Each time you train new umas, you'll need to get a new dump and reimport that data for them to appear in the tool. Reimporting keeps your notes, and removes umas you no longer have in game (you'll be asked first). Notes only live in your browser, so use Data → Back up data to keep a copy.</small>
- These modes can be switched using the Parent | Ace toggle at the top of the screen.

The rest of the guide assumes you have imported data into the tool.

## The Umas
Before getting into the different modes, lets talk about what each entry displayed looks like.
Each uma will display relevant attributes depending on the mode you are in.  
This can be stats, aptitudes, sparks, parents, etc.  
At the bottom of each uma you'll notice a few options:
- For each uma you can enter custom notes, with a character limit of 100 (potentially subject to change).
- The compare button, for the [Compare View](#compare-view)
- A button to export an uma's data, right now it can only export for use with the umalator. If any other tools can utilize an uma's data in such a way and I am made aware of it, I'll probably add it.
  - Note: when imported to the umalator, the only options that may need to be changed are the aptitudes. currently it simply takes the best grades the uma has. otherwise all the stats, skill levels, etc should be correct.
## Parent Mode
In this mode, each uma displays attributes such as:
- Blue sparks (Speed, Power, Wit, etc)
- Pink sparks (Turf/Dirt, Sprint/Mile/etc, Front Runner/Pace Chaser/etc)
- Green sparks (Own uma unique and any parent uniques)
- White sparks (Race, skill, and scenario sparks)
- The uma's parents

By default, the app will show an uma's sparks including the ones from the parents. If the uma is the owner of the spark or part of a spark, it is marked with a ● and the number of stars the uma has of it out of the total.   
For example:  
<span class="spark spark--blue"><span class="spark__stars">7 ★</span> Power<span class="spark__own-count"><span class="spark__own">●</span>3 ★</span></span>  
This means there are 7 stars of power total and the current uma owns 3 stars of it.

You can search for umas that fit certain criteria using the spark filters.
### Spark Filters
At the top of the screen you will see a bar called "Spark Filters."  
This filter bar has a section for each spark type: blue, pink, 
green and white. Add a filter for every spark you're looking 
for. Each filter can have a minimum star count, and you can 
combine filters within a section using AND or OR.  

Above these 4 sections are a few options:
- A toggle that displays parent sparks, or only their own. By default this option is on.
- A toggle that hides race and scenario sparks.
- Clear filters button, if any are present.

Also at the top of the screen is a dropdown which by default is set to "Recently Obtained."
Some of the other options include sorting by:
- Rating
- Number of white sparks
- Has a favorite icon (in game, will update to show which icon soon)
- Has notes written (both in game or in the tool)  

These sorting options can be sorted by ascending or descending using the arrow next to the dropdown.
## Ace Mode
In this mode, each uma displays attributes such as:
- The five main stats (Speed, Stamina, Power, Guts, Wit)
- All aptitude grades (Turf/Dirt, Sprint/Mile/etc, Front Runner/Pace Chaser/etc)
- All skills in the following order:  
  - Umas own unique (Purple)
  - Bought uniques, if any. (Pink)
  - Gold Skills e.g. Professor of Curvature, Swining Maestro
  - White skills e.g. Corner Adept, Savvy skills, etc (May differentiate them in the future)

### Skill Filters
WIP

## Compare View
This is where you can compare the umas in depth, in either mode.  

To compare umas, select 2 or more (up to 4 total) by clicking on the compare button at the bottom left of an uma's card.
You'll notice at the bottom of the screen two options: compare and clear selections. Click compare to open the compare view.

You will be presented with a side by side view of all umas you have selected, showing the same attributes as before depending on the mode. You have a few options at the top to help compare the umas:
- Group what's in common
  - This toggle will remove any sparks that all selected umas have in common so that you can compare how they actually differ.
  - Of the ones in common, if an uma has the highest star count of a specific spark, it will be highlighted in green. Otherwise the spark will show the difference between it and the highest one in red.
- Hide race & scenario sparks
  - This toggle can hide the race and scenario sparks. Sometimes you may just want to compare the actual skill sparks, and this makes it easier to see.
  - If a race or scenario spark is common between the selected umas they will appear in the "in common" section, not with the other race/scenario sparks.
- Parent / Ace toggle
  - Toggle the comparison between the parent and ace modes

Any sparks you have set the filter to will be highlighted in the compare mode as well.

## Data Management
This section covers the several ways you can import or export your uma's data.

At the top right of the screen there are two buttons:
- Import dump
  - This is where you import the trained_chara_data.json that you can get from umadump. Note: You cannot import the data backup explained in the next point, here. It will only accept a json from umadump.
- Data, with the following options:
  - Backup data: Exports a json file of the data the app currently has in a format it can read. This is used for saving custom notes on your umas that you wrote in the tool, and any other customizations that might be made using the tool.
  - Restore backup: This is where you would reimport any data backup made using the previous option, as the regular import will not accept it.
  - Delete all data: As the name suggests it will delete all data related to the dump including any custom notes you have made. If you want to keep any customizations made through the tool you need to make a data backup.

## Example section

Images go in `public/guide/` and are referenced like `![Alt text](guide/example.png)`.