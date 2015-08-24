Bilgewater introduced the upgraded minion element to summoner's rift. 

Can we analyze the data to determine :
	Which minion compositions were most successful?
	What upgrade strategies were most successful? 
	Are you better off matching compositions or are there counter compositions? 


To do this, we need to pull down information about each game; the minions and their upgrades are represented
by item purchases. From the match timeline we can determine which minions were bought and when, 
when they were upgraded, and in what order. 

We can calculate some team score from net KDA, gold, and objectives to get a sense of who's "ahead" at some
point on the timeline. 

Then a data point would be, basically, some minion state (both teams) and a score differential. 


There are four minion types and five players on a side. 

Therefore there are 4^5 minion configurations. (1024)
If we include "haven't picked yet" then its 5^5. We could wait until everyone bought one - 
we don't want to include games where someone didn't understand it anyway.
But permutation doesn't matter (yet) - so IronBack IronBack IronBack Oct Oct is the same as Oct Oct Iron Iron Iron.


so it is 5 choose 4? it's a k multi-selection (https://en.wikipedia.org/wiki/Combination)
((5 4)) == (8 4) == 8!/4!4! == 8*7*6*5/4*3*2*1 == 1680/24 == 70

Reasonable!


