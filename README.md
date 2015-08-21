
# Bilgewater Mercenary Composition Analysis

The Bilgewater mode introduced minion upgrades. A player could hire one of four kinds of Mercenary to replace a 
normal lane minion. Once a player purchased a Mercenary that choice was locked in. The hired mercenary would appear
in every lane, along side what ever mercenaries had been purchased by the other team mates. This analysis attempts
to shed light on some basic questions - which compositions were popular? Were some compositions part of winning teams
more often than not? Did player preferences change over time? Were some compositions better in long games? Were some
compositions good at countering other compositions (that is, could players have used "reactive" builds effectively)?

As mercenaries were purchased with an alternative currency, there was no reason not to purchase a mercenary other than 
forgetting or being AFK for the whole game. Therefore most of the games in the data set are from full complements of 
mercenaries. 

###The mercenary Types
* <img src="http://ddragon.leagueoflegends.com/cdn/5.15.1/img/item/3611.png"/>  Razorfin  - a melee harass mercenary that was much more aggressive in pursuing enemy champions in lane. 
* <img src="http://ddragon.leagueoflegends.com/cdn/5.15.1/img/item/3612.png"/>  Ironback - a tank mercenary that built shields and defensive stats. 
* <img src="http://ddragon.leagueoflegends.com/cdn/5.15.1/img/item/3613.png"/>  Plundercrap - a ranged harass mercenary that was stronger than the normal ranged minion.
* <img src="http://ddragon.leagueoflegends.com/cdn/5.15.1/img/item/3614.png"/>  Ocklepod - a support mercenary that shielded champions and contributed to vision. 

###Compositions
When we talk about 5 people choosing something from 4 possibilities and one person's choice doesn't preclude 
another person's choice (in other words, we can't run out of Ironbacks, and everyone could pick that merc if they
wanted) this is called Combination with Repetition (https://en.wikipedia.org/wiki/Combination). 

In the notation described in that page, this is ((4 5)) which evaluates to (8 5) or 56 possible compositions.  
There is an assumption here - we assume that the order in which mercenaries were purchased does not matter (in terms
of game outcome) and likewise the timing at which a purchase occurs (which is probably a proxy for how well the game
is going) is not considered. 

###This work 
This project explores the various popularity of compositions using just Javascript and the browser. 
Referenced libraries include D3 (https://github.com/mbostock/d3), 
Crossfilter (https://github.com/square/crossfilter/wiki) and DC.js (https://github.com/dc-js/dc.js). Other
aspects of the project also leverage jQuery, but to be honest I throw that into everything and it could probably
be eliminated.

D3 is a visualization library that allows for easy manipulation of SVG elements in the browser. 
Crossfilter is a library that allows the creation of interactive data filters on a flat data set.
DC.js is a library that depends on the above two, and simplifies some of the chart creation. 

The Popularity page allows users to explore the data set and view the top represented compositions (in our dataset) 
as a function of team side, winning, game duration, or game start date. 

The Matchups page allows users to explore the win rate of specific compositions versus other compositions. 

###Unanswered questions
Of course, there is always more to do. How did mercenary upgrades factor in? Was it more effective to 
race to defense stats? Or to balance upgrades across the board? Were there differences according to player MMR?
Should we only look at close games where there wasn't some obvious advantage driving the match? 

### Understanding / Using the project
With the project downloaded from GitHub, edit the file "apikey.json.todo" and record your API key and save as "apikey.json". (Optional - if you only want to look at the results, the data.json holds the compacted data that was queried earlier. This is needed for for the data querying code to function, though, obviously.)
Open either bw-matchups.html or bw-popularity.html in your browser. Explore the data! Jump to conclusions! 
The bw-datascoop.html page is included for completeness but isn't part of the final result. 
