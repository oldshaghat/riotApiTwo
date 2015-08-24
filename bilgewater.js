
//what realm to connect to - used in constructing the API URLs
var realm = 'na';

var bilge ={};

bilge.init = function() {
	bilge.loadAPIKey();
};

//added hoop so that I can keep my API key local / not checked in. 
//add a file locally called apikey.json that looks like this : 
//"XXXXXXXX-YOUR-KEY-HERE-XXXXXXXXX"
//Important - must be double quotes not single quotes.
bilge.loadAPIKey = function() {
	d3.json("apikey.json", function(error, data) {
		bilge.key = data;
	});
};


//Get one game and place the result in the gameData variable
bilge.getOneGameData = function(gameId) {
	var url = 'https://' + realm + '.api.pvp.net/api/lol/' + realm + '/v2.2/match/' + gameId + '?includeTimeline=true&api_key=' + bilge.key;
	$.getJSON(url)
	   .done(function(d, status, xhr) {
		   //only hold on to one game at a time - whole data set is 300 MB
			bilge.gameData = d; 
		})
	   .fail(function(jqxhr, textStatus, error) {
			console.log(error);
	   });
};

//load the results from the NA json file and store the 10,000 ids
//might be cool if time allows to try to grab and process data from a different region to see if there were differences?
bilge.loadMatchIds = function() {
	//works locally or if NA.json is served from the same host
	d3.json("NA.json", function(error, data) {
		bilge.matchIds = data;
	});
};


//starting at some index value, call the API and get the next game by index into the matchIds
bilge.processAll = function() {
	if (!bilge.matchIds)
		bilge.loadMatchIds();
	//used as a bookmark since I kept getting stopped by 503 outages
	bilge.index = 9979;
	//could be better as a promise or something; techincally loadMatchIds is async and 1 second may not be sufficient wait time 
	setTimeout(bilge.getProcessIncrement, 1000);
};


bilge.index = 0;
bilge.getProcessIncrement = function() {
	//the game id we want to process next
	var gameId = bilge.matchIds[bilge.index];
	//collect the match details WITH the timeline
	var url = 'https://' + realm + '.api.pvp.net/api/lol/' + realm + '/v2.2/match/' + gameId + '?includeTimeline=true&api_key=' + bilge.key;
	$.getJSON(url)
	   .done(function(d, status, xhr) {
			//only hold on to one game at a time - whole data set is 300 MB
			bilge.gameData = d; 
			//analyze that data (refactor - gameData as a parameter to analyzeTimeline; storing it locally in the dom was useful whilst exploring it but isn't needed long term)
			bilge.analyzeTimeline();
			//move to the next game?
			bilge.index++
			//if we have games to process, call the API in 2 seconds (to avoid throttling)
			if (bilge.index < bilge.matchIds.length)
				setTimeout(bilge.getProcessIncrement, 2000);
	    })
	   .fail(function(jqxhr, textStatus, error) {
			if (error == "429") //rate throttling, it probably isn't us so just requeue the request with a slowdown
				setTimeout(bilge.getProcessIncrement, 5000);
			else if (error.contains("503 Service Unavailable")) //service unavailable - seems to be happening more, maybe just restart slower?
				setTimeout(bilge.getProcessIncrement, 15000);
			else
				console.log(error);
				//don't requeue, something bad happened.
	   });

};

/*
The main analysis product we want to cross filter over - we stow the match id in case we want to look something up about the result later.
*/
function datapoint(gameData, teamId, winner) {
	//get the game id
	this.gameId = gameData.matchId;
	//things I think we might cross filter on:
	//game duration in .. seconds?
	this.gameDuration = gameData.matchDuration;
	//looks like UTC MS time? Would be cool to see how (if at all) compositions evolved? Were their fads?
	this.gameStart = gameData.matchCreation;
	//might be cool to have a team-skill score? there's no player object so the best we could do is estimates from ranked queue "highestAchieved"
	//though we can assume the matchmaking system at least made things balanced, it may not be the case that the same set of mercs is effective
	//at all skill levels of play
	//what team is this data point for?
	this.teamId = teamId;
	//did they win?
	this.winner = winner;
	//how many mercs did they get?
	this.razorfin = 0;
	this.ironback = 0;
	this.plundercrab = 0;
	this.ocklepod = 0;
};

//examine an item ID and increment the proper merc if found
datapoint.prototype.recordPurchase = function(itemId) {
	if (itemId == 3611)
		this.addRazorfin();
	if (itemId == 3612)
		this.addIronback();
	if (itemId == 3613)
		this.addPlundercrab();
	if (itemId == 3614)
		this.addOcklepod();
};
	
datapoint.prototype.addRazorfin = function() {
	this.razorfin++;
}; 
datapoint.prototype.addIronback = function() {
	this.ironback++;
};
datapoint.prototype.addPlundercrab = function() {
	this.plundercrab++;
};
datapoint.prototype.addOcklepod = function() {
	this.ocklepod++;
};

//since we have 4 "places" and up to 5 (count) per place, we can
//represent the composition as a base-6 number.
bilge.calcComposition = function(d) {
	return d.razorfin + 6*d.ironback + 6*6*d.plundercrab + 6*6*6*d.ocklepod;
};

//an array of data points, possibly from analysis of game data, possibly loaded from the analysis backup file
bilge.analysis = [];

bilge.loadAnalysis = function(done) {
	d3.json("data.json", function(error, data) {
		if (error) {
			console.log(error);
		}
		bilge.analysis = data;
		//if we passed in a completion function execute it
		if (done) 
			done();
	});
};

//filter out games in the analysis data that don't have a 
//full team on either side
//assumes that analysis is paired up game id wise
//iterate backwards so we can simplify removal indexing
bilge.eliminatePartialTeams = function() {
	for (var i = bilge.analysis.length-2; i >= 0; i-=2) {
		var result1 = bilge.analysis[i];
		var result2 = bilge.analysis[i+1];
		var remove = 
			(result1.razorfin + result1.ironback + result1.plundercrab + result1.ocklepod != 5) ||
			(result2.razorfin + result2.ironback + result2.plundercrab + result2.ocklepod != 5);
		if (remove)
			bilge.analysis.splice(i, 2);
	}
}
//there are 2158 games (20%!) that don't meet this condition. 
//surprising!

bilge.joinAnalysisData = [];
function joinDatapoint(winner, loser) {
	this.gameId = winner.gameId;
	this.winComp = bilge.calcComposition(winner);
	this.loseComp = bilge.calcComposition(loser);
	this.duration = winner.gameDuration;
};
bilge.joinAnalysis = function(done) {
	//to look at a heat map where we have datapoints joined on game ID, 
	//Crossfilter would rather just have a single list of data points to work with
	
	//clear join array
	bilge.joinAnalysisData = [];
	//first build a map by game id
	var map = {};
	var keys = [];
	for (var i = 0; i < bilge.analysis.length; i++) {
		var datapoint = bilge.analysis[i];
		if (!map[datapoint.gameId]) {
			map[datapoint.gameId] = {};
			keys.push(datapoint.gameId);
		}
		if (datapoint.winner)
			map[datapoint.gameId].win = datapoint;
		else 
			map[datapoint.gameId].loser = datapoint;
	}
	
	//now fold that map into an array of joinDatapoints
	for (var j = 0; j < keys.length; j++) {
		var key = keys[j];
		//don't include ones where one of the sides didn't purchase all 5 minions
		var w = map[key].win;
		var l = map[key].loser;
		if (w.razorfin + w.ironback + w.plundercrab + w.ocklepod == 5)
			if (l.razorfin + l.ironback + l.plundercrab + l.ocklepod == 5)
				bilge.joinAnalysisData.push(new joinDatapoint(w, l));
	}
	
	if (done)
		done();
};

//produce and push two new data points from the currently loaded game
bilge.analyzeTimeline = function() {
	/* look in bilge.gameData for the data */
	if (bilge.gameData) {
		//init two datapoints, one for each team, with the correct win/loss flag
		var dataOne = new datapoint(bilge.gameData, bilge.gameData.teams[0].teamId, bilge.gameData.teams[0].winner);
		var dataTwo = new datapoint(bilge.gameData, bilge.gameData.teams[1].teamId, bilge.gameData.teams[1].winner);
		//step over the time line frame
		var frames = bilge.gameData.timeline.frames;
		for (var i = 0; i<frames.length; i++) {
			var f = frames[i];
			//if this frame has an event
			if (f.events) {
				//iterate over the events
				for (var j = 0; j < f.events.length; j++) {
					var e = f.events[j];
					//only look at item purchases
					if (e.eventType == "ITEM_PURCHASED") {					
						//who bought it?
						var p = f.events[j].participantId;
						//what team are they on?
						var teamId = bilge.gameData.participants[p-1].teamId;
						//record the purchase in the right data point
						if (teamId == dataOne.teamId) {
							dataOne.recordPurchase(e.itemId);
						} else {
							dataTwo.recordPurchase(e.itemId);
						}
					}
				}
			}
		}
		//push results
		bilge.analysis.push(dataOne);
		bilge.analysis.push(dataTwo);
		//log data to a div on the page so we can stitch together this data file amidst server 500 / 503 interruptions
		$("#datadump").append(JSON.stringify(dataOne));
		$("#datadump").append(JSON.stringify(dataTwo));
	}
};

//convenience method to insert a legit svg image element 
//since jquery's append likes to convert the text version into a non functional <img> tag.
//this was a stack overflow solution. I should cite it. 
bilge.insertImage = function(root, imgHref, h, w, x, y) {
	var svgimg = document.createElementNS('http://www.w3.org/2000/svg','image');
	svgimg.setAttributeNS(null,'height','' + h);
	svgimg.setAttributeNS(null,'width','' + w);
	svgimg.setAttributeNS('http://www.w3.org/1999/xlink','href', imgHref);
	svgimg.setAttributeNS(null,'x','' + x);
	svgimg.setAttributeNS(null,'y','' + y);
	svgimg.setAttributeNS(null, 'visibility', 'visible');
	$(root).append(svgimg);
};

//produce text description of comp
bilge.describeComp = function(comp) {
	var numOck = Math.floor(comp/216);
	var numPlu = Math.floor((comp-216*numOck)/36);
	var numIro = Math.floor((comp - 216*numOck - 36*numPlu)/6);
	var numRaz = Math.floor((comp - 216*numOck - 36*numPlu - 6*numIro));
	var desc = '';
	if (numRaz > 0) 
		desc += numRaz + " Razorfins ";
	if (numIro > 0)
		desc += numIro + " Ironbacks ";
	if (numPlu > 0)
		desc += numPlu + " Plundercrabs ";
	if (numOck > 0) 
		desc += numOck + " Ocklepods ";
	return desc;
};


//we have all these merc compositions; it would be nice to have a consistent color mapping from 
//merc comp to color that also shows the blending of the composition. 
//since there are 4 merc types, and up to 5 (value) per type, I mapped CMYK space to RIPO space 
//in 0.2 increments then converted these to RGB values
//though in hindsight, maybe I should have mapped the razor fins to Magenta and the 
//Ironbacks to Cyan. 
bilge.colormap = {
	5:"#00FFFF", 10:"#33CCFF", 15:"#6699FF", 20:"#9966FF", 25:"#CC33FF", 30:"#FF00FF",
40:"#33FFCC", 45:"#66CCCC", 50:"#9999CC", 55:"#CC66CC", 60:"#FF33CC", 75:"#66FF99",
80:"#99CC99", 85:"#CC9999", 90:"#FF6699", 110:"#99FF66", 115:"#CCCC66", 120:"#FF9966",
145:"#CCFF33", 150:"#FFCC33", 180:"#FFFF00", 220:"#29CCCC", 225:"#52A3CC", 230:"#7A7ACC",
235:"#A352CC", 240:"#CC29CC", 255:"#52CCA3", 260:"#7AA3A3", 265:"#A37AA3", 270:"#CC52A3",
290:"#7ACC7A", 295:"#A3A37A", 300:"#CC7A7A", 325:"#A3CC52", 330:"#CCA352", 360:"#CCCC29",
435:"#3D9999", 440:"#5C7A99", 445:"#7A5C99", 450:"#993D99", 470:"#5C997A", 475:"#7A7A7A",
480:"#995C7A", 505:"#7A995C", 510:"#997A5C", 540:"#99993D", 650:"#3D6666", 655:"#525266",
660:"#663D66", 685:"#526652", 690:"#665252", 720:"#66663D", 865:"#293333", 870:"#332933",
900:"#333329", 1080:"#000000"
};

/*
item ids
3611 - Razorfin  http://ddragon.leagueoflegends.com/cdn/5.15.1/img/item/3611.png
3612 - Ironback http://ddragon.leagueoflegends.com/cdn/5.15.1/img/item/3612.png
3613 - Plundercrab http://ddragon.leagueoflegends.com/cdn/5.15.1/img/item/3613.png
3614 - Ocklepod http://ddragon.leagueoflegends.com/cdn/5.15.1/img/item/3614.png

//upgrades 

3621 - Offense Upgrade 1
3622 - Offense Upgrade 2
3623 - Offense Upgrade 3

3624 - Defense Upgrade 1
3625 - Defense Upgrade 2 
3626 - Defebse Upgrade 3

3615 - Merc Upgrade 1
3616 - Merc Upgrade 2
3617 - Merc Upgrade 3

*/