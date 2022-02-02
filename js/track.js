(function(window) {
    'use strict';

	var overrideEntranceCloseFlag = false;
	var connectStart = false;
	var connectFinish = false;
	var connectorid = 0;
	window.connectorIndex = [];
	window.connectorOne = [];
	window.connectorTwo = [];
	
    window.prizes = [];
    window.enemizer = [];
    window.medallions = [0, 0];
	window.lastItem = null;
	window.trashItems = [];
	window.mapsAreTrash = false;
	window.compassesAreTrash = false;
	window.dungeonContents = [];
	window.rightClickedLocation = -1;
	window.rightClickedType = null;

	window.entranceNameToIndex = {};
	window.entranceIndexToName = {};
	window.entranceNameToFriendlyName = {};
	window.entranceNameToGroup = {};
	window.dungeonNames = ["EP", "DP", "ToH", "PoD", "SP", "SW", "TT", "IP", "MM", "TR", "GT"];
	window.constantFunctions = {};
	window.dungeonEntranceCounts = [1, 4, 1, 1, 1, 8, 1, 1, 1, 4, 1, 5, 1];

	window.doorWindow = null;
	window.dungeonData = null;

    // Event of clicking on the item tracker
    window.toggle = function(label) {
		if(rightClickedLocation != -1)
		{
			var name = getNiceName(label);
			if(rightClickedType === "chest")
			{
				if(name.charAt(0) < 'a' || name.charAt(0) > 'z')
				{
					if(!chests[rightClickedLocation].content)
						chests[rightClickedLocation].content = name;
					else
						chests[rightClickedLocation].content += ", "+name;
					document.getElementById('caption').innerHTML = caption_to_html(name+' placed at '+chests[rightClickedLocation].caption);
				}
				document.getElementById('locationMap'+rightClickedLocation).classList.remove('rightclick');
			}
			if(rightClickedType === "dungeon")
			{
				if(name.charAt(0) < 'a' || name.charAt(0) > 'z')
				{
					if(!dungeons[rightClickedLocation].content)
						dungeons[rightClickedLocation].content = name;
					else
						dungeons[rightClickedLocation].content += ", "+name;
					document.getElementById('caption').innerHTML = caption_to_html(name+' placed in '+dungeons[rightClickedLocation].caption);
				}
				document.getElementById('dungeon'+rightClickedLocation).classList.remove('rightclick');
			}
			rightClickedLocation = -1;
			return;
		}

		if(label === 'mirror' && flags.doorshuffle != 'N')
		{
			document.getElementById('mirrorscroll').style.display = items.mirror ?'block' :'none';
		}

		if (label.substring(0,5) === 'chest') {
            var value = items.dec(label);
			if (value === 0) {
				if (!flags.wildkeys && !flags.wildbigkeys && flags.gametype != 'R' && flags.doorshuffle != 'C' && label.length === 6) {
					document.getElementById(label).className = 'chest-' + value + ' large';
				} else {
					document.getElementById(label).className = 'chest-' + value;
				}
				
				document.getElementById(label).innerHTML = '';
			} else {
				if (!flags.wildkeys && !flags.wildbigkeys && flags.gametype != 'R' && flags.doorshuffle != 'C' && label.length === 6) {
					document.getElementById(label).className = 'chest large';
				} else {
					document.getElementById(label).className = 'chest';
				}
				
				document.getElementById(label).innerHTML = flags.doorshuffle === 'C' && !items['chestknown'+label.substring(5)] ? (value - 1) + '+' : value;
			}
			
            if (flags.mapmode != 'N') {
				if (flags.entrancemode === 'N') {
					var x = label.substring(5);
					document.getElementById('dungeon'+x).className = 'dungeon ' +
						(value ? dungeons[x].can_get_chest() : 'opened');
				}
            }
			updateMapTracker();
            return;
        }
		
		var skipkey = false, is_boss = false;
		
		if (label.substring(0,6) === 'bigkey') {
			items[label] = !items[label];
			
			if (items[label]) {
				document.getElementById(label).className = label.substring(0,10) == 'bigkeyhalf' ? 'bigkeyhalf collected' : 'bigkey collected';
			} else {
				document.getElementById(label).className = label.substring(0,10) == 'bigkeyhalf' ? 'bigkeyhalf' : 'bigkey';
			}			
			
			skipkey = true;
		}
		
		if (label.substring(0,12) === 'smallkeyhalf') {
			if (flags.gametype != 'R') {
				var value = items.inc(label);
				document.getElementById(label).innerHTML = value;
				skipkey = true;
			} else {
				var value = items.dec(label);
				document.getElementById(label).innerHTML = value;
				skipkey = true;
			}
        }		
		if (label.substring(0,8) === 'smallkey' && label.substring(0,12) != 'smallkeyhalf') {
			if (flags.gametype != 'R') {
				var value = items.inc(label);
				document.getElementById(label).innerHTML = value;
				skipkey = true;
			} else {
				var value = items.dec(label);
				document.getElementById(label).innerHTML = value;
				skipkey = true;
			}
        }
		
		if (!skipkey) {
			var nodes = Array.from(document.getElementsByClassName(label));
			is_boss = nodes[0].classList.contains('boss');
			if ((typeof items[label]) === 'boolean') {
				items[label] = !items[label];
				
				if (items[label] == true)
					lastItem = label;
				else
					lastItem = null;
				nodes.forEach(node=>node.classList[items[label] ? 'add' : 'remove'](is_boss ? 'defeated' : 'active'));
			} else {
				if (label === 'sword' && flags.swordmode === 'S') {
				} else {
					var value = items.inc(label);
					nodes.forEach(node=>{node.className = node.className.replace(/ ?active-\w+/, '')});
					if (value)
						nodes.forEach(node=>node.classList.add('active-' + value));
					
					if (value)
						lastItem = label + " active-" + value;
					else				
						lastItem = null;
				}
			}
			// Initiate bunny graphics!
			if (label === 'moonpearl' || label === 'tunic') {
			   document.getElementsByClassName('tunic')[0].classList[!items.moonpearl ? 'add' : 'remove']('bunny');
			}
		}
        if (flags.mapmode != 'N') {
			updateLocationAvailability();
			
            // Clicking a boss on the tracker will check it off on the map!
            if (is_boss) {
                toggle_boss(label.substring(4));
			}
			if (label === 'agahnim') {
                toggle_boss('12');
			}
        }
		
		//Update the backgrounds of the chests in entrance
		for (var k = 0; k < dungeons.length; k++) {
			document.getElementById('chest'+k).style.backgroundColor = 'white';
		}

		if(doorWindow && !doorWindow.closed)
			doorWindow.postMessage(cloneItems(),"*");
    };

	window.updateLocationAvailability = function()
	{
		if(flags.mapmode != 'N') {
            for (var k = 0; k < chests.length; k++) {
                if (!chests[k].is_opened)
                    document.getElementById('locationMap'+k).className = 'location ' + chests[k].is_available();
            }
			if (flags.entrancemode != 'N') {					
				for (var k = 0; k < entrances.length; k++) {
					if (!entrances[k].is_opened) {
						var entrancetype = '';
						if (entrances[k].is_available()) {
							if (entrances[k].known_location != '') {
								entrancetype = isDungeon(entrances[k].known_location) ? 'dungeon' : 'keylocation';
							} else if (entrances[k].is_connector) {
								entrancetype = 'connector';
							}
						}
						document.getElementById('entranceMap'+k).className = 'entrance ' + entrances[k].is_available() + entrancetype;
					}
				}
			} else {
				for (var k = 0; k < dungeons.length; k++) {
					document.getElementById('bossMap'+k).className = 'bossprize-' + prizes[k] + ' boss ' + (dungeons[k].is_beaten ? 'opened' : dungeons[k].is_beatable());
					if (items['chest'+k])
						document.getElementById('dungeon'+k).className = 'dungeon ' + dungeons[k].can_get_chest();
				}
			}
			toggle_agahnim();
		}
	};

	window.receiveMessage = function(event)
	{
		if(window.origin === event.origin)
		{
			if(event.data.logic && flags.overworldshuffle != 'N')
			{
				if(event.data.helpDesert && doorCheck(1,false,false,false,[(!flags.wildkeys && flags.gametype != 'R') || !flags.wildbigkeys ? 'boots' : '','firesource','killbomb'],'connector') === "available")
					event.data.items[48] = event.data.items[48] === "darkpossible" ?"darkavailable" :"available";
				if(event.data.helpMimic && doorCheck(9,false,true,false,['somaria','firerod',(!flags.wildkeys && flags.gametype != 'R') || !flags.wildbigkeys ? 'laserbridge' : '','bomb'],'connector') === "available")
					event.data.items[4] = event.data.items[4] === "darkpossible" ?"darkavailable" :"available";
				for(var k = 0; k < chests.length; k++)
					chests[k].is_available = constantFunctions[event.data[flags.entrancemode === 'N' ?"items" :"entranceitems"][k]];
				for(var k = 0; k < dungeons.length; k++)
				{
					var dungeonEntrances = new Array(dungeonEntranceCounts[k]),dungeonEntrancesBunny = new Array(dungeonEntranceCounts[k]);
					for(var l = 0; l < dungeonEntrances.length; l++)
					{
						dungeonEntrances[l] = event.data.dungeons[k*8+l];
						dungeonEntrancesBunny[l] = event.data.dungeonsBunny[k*8+l];
					}
					dungeons[k].is_beatable = constantFunctions[dungeonBoss(k,dungeonEntrances,dungeonEntrancesBunny)];
					dungeons[k].can_get_chest = constantFunctions[dungeonChests(k,dungeonEntrances,dungeonEntrancesBunny)];
				}
				agahnim.is_available = dungeons[12].is_beatable;
				if(flags.entrancemode != 'N')
					for(var k = 0; k < entrances.length; k++)
						entrances[k].is_available = constantFunctions[event.data.entrances[k]];
				updateLocationAvailability();
			}
			else
				if(event.data == "PING" && doorWindow && !doorWindow.closed)
					doorWindow.postMessage("PONG","*");
				else
					if(event.data == "UPDATE" && doorWindow && !doorWindow.closed)
						doorWindow.postMessage(dungeonData,"*");
					else
						if(event.data == "ITEMS" && doorWindow && !doorWindow.closed)
							doorWindow.postMessage(cloneItems(),"*");
						else
							if(event.data == "RESETLOGIC" && flags.overworldshuffle != 'N' && doorWindow && !doorWindow.closed)
							{
								resetChestsKeepTrackedData();
								updateMapTracker();
							}
							else
								if((""+event.data).startsWith("TOGGLE "))
								{
									var item = (""+event.data).substring(7);
									if(items.hasOwnProperty(item))
									{
										click_map();
										toggle(item);
									}
								}
								else
									if(event.data.dungeonPaths && event.data.dungeonPaths.length === 13)
										dungeonData = event.data;
									else
										if(event.data == "OPENSETTINGS")
										{
											if(document.getElementById("flagsModal").style.display === "none")
											{
												changeFlags();
											}
										}
		}
	};

	window.showDoorWindow = function()
	{
		if(doorWindow && !doorWindow.closed)
			doorWindow.focus();
		else
		{
			var url = 'dungeontracker.html?door_shuffle='+flags.doorshuffle+'&overworld_shuffle='+flags.overworldshuffle;
			url += '&wild_keys='+flags.wildkeys+'&wild_big_keys='+flags.wildbigkeys+'&world_state='+flags.gametype;
			url += '&entrance_shuffle='+flags.entrancemode+(dungeonData ?'&request_update=true' :(flags.overworldshuffle === 'N' ?'' :'&init_sync=true'));
			doorWindow = window.open(url,'','width=444,height=700,titlebar=0,menubar=0,toolbar=0,scrollbars=1,resizable=1');
		}
	};

	window.cloneItems = function()
	{
		var newItems = Object.assign({},items);
		newItems.inc = newItems.dec = null;
		newItems.flags = flags;
		newItems.prizes = prizes;
		newItems.medallions = medallions;
		newItems.connectorOne = connectorOne;
		newItems.connectorTwo = connectorTwo;
		return newItems;
	};

	window.resetChestsKeepTrackedData = function()
	{
		var olddungeons = dungeons;
		var oldagahnim = agahnim;
		var oldchests = chests;
		var oldentrances = flags.entrancemode === 'N' ?null :entrances;
		flags.entrancemode === 'N' ? loadChestFlagsItem() : loadChestFlagsEntrance();
		for(var k = 0; k < dungeons.length; k++)
		{
			olddungeons[k].is_beatable = dungeons[k].is_beatable;
			olddungeons[k].can_get_chest = dungeons[k].can_get_chest;
		}
		oldagahnim.is_available = agahnim.is_available;
		for(var k = 0; k < chests.length; k++)
			oldchests[k].is_available = chests[k].is_available;
		dungeons = olddungeons;
		agahnim = oldagahnim;
		chests = oldchests;
		if(flags.entrancemode != 'N')
		{
			for(var k = 0; k < entrances.length; k++)
				oldentrances[k].is_available = entrances[k].is_available;
			entrances = oldentrances;
		}
	};

	window.getDungeonBackground = function(x) {
		switch (x) {
			case 'available':
				return 'lime';
				break;
			case 'unavailable':
				return '#900';
				break;
			case 'possible':
				return 'yellow';
				break;
			case 'information':
				return 'orange';
				break;
			case 'darkavailable':
				return 'blue';
				break;
			case 'darkpossible':
				return 'purple';
				break;
		}
	};
	
    // event of clicking on a boss's pendant/crystal subsquare
    window.toggle_dungeon = function(n) {
		var maxdungeon = (flags.wildmaps ? 6 : 5);
        prizes[n] += 1;
        if (prizes[n] === maxdungeon) prizes[n] = 0;

        document.getElementById('dungeonPrize'+n).className = 'prize-' + prizes[n];

		updateMapTracker();
    };
	
    window.rightClickPrize = function(n) {
		var mindungeon = (flags.wildmaps ? 5 : 4);
        prizes[n] -= 1;
        if (prizes[n] === -1) prizes[n] = mindungeon;

        document.getElementById('dungeonPrize'+n).className = 'prize-' + prizes[n];

		updateMapTracker();
    };	
	
	
    // event of right clicking on a boss's enemizer portrait
    window.rightClickEnemy = function(n) {
        enemizer[n] -= 1;
        if (enemizer[n] === -1) enemizer[n] = flags.wildcompasses ? 11 : 10;
        document.getElementById('dungeonEnemy'+n).className = 'enemizer-' + enemizer[n];
		dungeons[n].is_beatable();
		if (!dungeons[n].is_beaten)
			if (document.getElementById('bossMap'+n) != null) {
				document.getElementById('bossMap'+n).className = 'bossprize-' + prizes[n] + ' boss ' + dungeons[n].is_beatable();
			}
    };

    // event of clicking on a boss's enemizer portrait
    window.toggle_enemy = function(n) {
        enemizer[n] += 1;
        if (enemizer[n] === (flags.wildcompasses ? 12 : 11)) enemizer[n] = 0;
        document.getElementById('dungeonEnemy'+n).className = 'enemizer-' + enemizer[n];
		dungeons[n].is_beatable();
		if (!dungeons[n].is_beaten)
			if (document.getElementById('bossMap'+n) != null) {
				document.getElementById('bossMap'+n).className = 'bossprize-' + prizes[n] + ' boss ' + dungeons[n].is_beatable();
			}
    };
	
	window.rightClickChest = function(label) {
		var value = items.inc(label);
		if (value === 0) {
			if (!flags.wildkeys && !flags.wildbigkeys && flags.gametype != 'R' && flags.doorshuffle != 'C' && label.length === 6) {
				document.getElementById(label).className = 'chest-' + value + ' large';
			} else {
				document.getElementById(label).className = 'chest-' + value;
			}
			
			document.getElementById(label).innerHTML = '';
		} else {
			if (!flags.wildkeys && !flags.wildbigkeys && flags.gametype != 'R' && flags.doorshuffle != 'C' && label.length === 6) {
				document.getElementById(label).className = 'chest large';
			} else {
				document.getElementById(label).className = 'chest';
			}
			
			document.getElementById(label).innerHTML = flags.doorshuffle === 'C' && !items['chestknown'+label.substring(5)] ? (value - 1) + '+' : value;
		}
		
		if (flags.mapmode != 'N') {
			var x = label.substring(5);
			if (document.getElementById('dungeon'+x) != null) 
				document.getElementById('dungeon'+x).className = 'dungeon ' + (value ? dungeons[x].can_get_chest() : 'opened');
		}
		updateMapTracker();
	};
	
	window.rightClickKey = function(label) {
		if (label.substring(0,12) === 'smallkeyhalf') {
			if (flags.gametype != 'R') {
				var value = items.dec(label);
				document.getElementById(label).innerHTML = value;
			} else {
				var value = items.inc(label);
				document.getElementById(label).innerHTML = value;
			}
        }		
		if (label.substring(0,8) === 'smallkey' && label.substring(0,12) != 'smallkeyhalf') {
			if (flags.gametype != 'R') {
				var value = items.dec(label);
				document.getElementById(label).innerHTML = value;
			} else {
				var value = items.inc(label);
				document.getElementById(label).innerHTML = value;
			}
        }
		
		updateMapTracker();
	};
	
	window.clickCompass = function(dungeonid) {
		items['chestknown'+dungeonid] = !items['chestknown'+dungeonid];
		document.getElementById('chest'+dungeonid).innerHTML = items['chest'+dungeonid] == 0 ? '' : (flags.doorshuffle === 'C' && !items['chestknown'+dungeonid] ? (items['chest'+dungeonid] - 1) + '+' : items['chest'+dungeonid]);
		updateMapTracker();
	};

    window.toggle_bomb_floor = function() {
		if(rightClickedLocation != -1)
		{
			var name = "TT Bomb Floor";
			if(rightClickedType === "chest")
			{
				if(!chests[rightClickedLocation].content)
					chests[rightClickedLocation].content = name;
				else
					chests[rightClickedLocation].content += ", "+name;
					document.getElementById('caption').innerHTML = caption_to_html(name+' placed at '+chests[rightClickedLocation].caption);
				document.getElementById('locationMap'+rightClickedLocation).classList.remove('rightclick');
			}
			if(rightClickedType === "dungeon")
			{
				if(!dungeons[rightClickedLocation].content)
					dungeons[rightClickedLocation].content = name;
				else
					dungeons[rightClickedLocation].content += ", "+name;
					document.getElementById('caption').innerHTML = caption_to_html(name+' placed in '+dungeons[rightClickedLocation].caption);
				document.getElementById('dungeon'+rightClickedLocation).classList.remove('rightclick');
			}
			rightClickedLocation = -1;
			return;
		}
		
        items.bombfloor = !items.bombfloor;

        document.getElementById('bombfloor').className = 'bombfloor-' + (items.bombfloor ? 1 : 0);

		updateMapTracker();
    };

	window.click_map = function() {
		if(rightClickedLocation != -1)
		{
			if(rightClickedType === "chest")
				document.getElementById('locationMap'+rightClickedLocation).classList.remove('rightclick');
			if(rightClickedType === "dungeon")
				document.getElementById('dungeon'+rightClickedLocation).classList.remove('rightclick');
			rightClickedLocation = -1;
		}
	};

	window.rightClickLocation = function(n) {
		if(rightClickedLocation === -1)
		{
			rightClickedLocation = n;
			rightClickedType = "chest";
            document.getElementById('locationMap'+n).classList.add('rightclick');
			document.getElementById('caption').innerHTML = caption_to_html('Select an item to place at '+chests[rightClickedLocation].caption);
		}
		else
			if(rightClickedType === "chest" && rightClickedLocation === n)
			{
				chests[n].content = "";
				document.getElementById('caption').innerHTML = caption_to_html('Content of '+chests[rightClickedLocation].caption+' cleared');
				document.getElementById('locationMap'+n).classList.remove('rightclick');
				rightClickedLocation = -1;
			}
			else
			{
				if(rightClickedType === "chest")
					document.getElementById('locationMap'+rightClickedLocation).classList.remove('rightclick');
				if(rightClickedType === "dungeon")
					document.getElementById('dungeon'+rightClickedLocation).classList.remove('rightclick');
				document.getElementById('locationMap'+n).classList.add('rightclick');
				rightClickedLocation = n;
				rightClickedType = "chest";
				document.getElementById('caption').innerHTML = caption_to_html('Select an item to place at '+chests[rightClickedLocation].caption);
			}
	};

	window.rightClickDungeon = function(n) {
		if(rightClickedLocation === -1)
		{
			rightClickedLocation = n;
			rightClickedType = "dungeon";
            document.getElementById('dungeon'+n).classList.add('rightclick');
			document.getElementById('caption').innerHTML = caption_to_html('Select an item to place in '+dungeons[rightClickedLocation].caption);
		}
		else
			if(rightClickedType === "dungeon" && rightClickedLocation === n)
			{
				dungeons[n].content = "";
				document.getElementById('caption').innerHTML = caption_to_html('Content of '+dungeons[rightClickedLocation].caption+' cleared');
				document.getElementById('dungeon'+n).classList.remove('rightclick');
				rightClickedLocation = -1;
			}
			else
			{
				if(rightClickedType === "chest")
					document.getElementById('locationMap'+rightClickedLocation).classList.remove('rightclick');
				if(rightClickedType === "dungeon")
					document.getElementById('dungeon'+rightClickedLocation).classList.remove('rightclick');
				document.getElementById('dungeon'+n).classList.add('rightclick');
				rightClickedLocation = n;
				rightClickedType = "dungeon";
				document.getElementById('caption').innerHTML = caption_to_html('Select an item to place in '+dungeons[rightClickedLocation].caption);
			}
	};
	
	window.rightClickEntrance = function(n) {
		$('#entranceModal').show();
		document.getElementById('entranceID').value = n;
		document.getElementById('entranceModalTitle').innerHTML = entrances[n].caption.replace(/\s?\{[^}]+\}/g, '');
		document.getElementById('entranceModalNote').value = entrances[n].note;
		document.getElementById('ConnectorListSpan').innerHTML = '';
		var entrancecount = 0;
		if (entrances[n].is_connector) {
			for (var i = 0; i < connectorIndex.length; i++) {
				if ((connectorOne[i] === n || connectorTwo[i] === n) && entrancecount < 3) {
					var spantemplate = document.getElementById('connectTemplateSpan');
					var spanclone = spantemplate.cloneNode(true);
					spanclone.id = "disconnectEntrance" + connectorIndex[i];
					spanclone.setAttribute('onClick','entranceDisconnect(' + connectorIndex[i] + ',' + n + ');');
					spanclone.style.visibility = 'visible';
					if (connectorOne[i] === n) {
						spanclone.innerHTML = entrances[connectorTwo[i]].caption + '&nbsp;&nbsp;&nbsp;<img style="height: 15px;"src="./images/interface/cancel.png" />&nbsp;&nbsp;&nbsp;';
					} else {
						spanclone.innerHTML = entrances[connectorOne[i]].caption + '&nbsp;&nbsp;&nbsp;<img style="height: 15px;"src="./images/interface/cancel.png" />&nbsp;&nbsp;&nbsp;';
					}
					
					var spanlist = document.getElementById('ConnectorListSpan');
					spanlist.appendChild(spanclone);
					entrancecount++;
				}
			}
		}
		
		if (entrancecount > 2) {
			document.getElementById('addConnectorSpan').style.visibility = 'collapse';
		} else {
			document.getElementById('addConnectorSpan').style.visibility = 'visible';
		}
		
		document.getElementById('entranceModalNote').focus();
		
		document.getElementById('hc_m').style.backgroundColor = '#000';
		document.getElementById('hc_w').style.backgroundColor = '#000';
		document.getElementById('hc_e').style.backgroundColor = '#000';
		document.getElementById('ct').style.backgroundColor = '#000';
		document.getElementById('ep').style.backgroundColor = '#000';
		document.getElementById('dp_m').style.backgroundColor = '#000';
		document.getElementById('dp_w').style.backgroundColor = '#000';
		document.getElementById('dp_e').style.backgroundColor = '#000';
		document.getElementById('dp_n').style.backgroundColor = '#000';
		document.getElementById('toh').style.backgroundColor = '#000';
		document.getElementById('pod').style.backgroundColor = '#000';
		document.getElementById('sp').style.backgroundColor = '#000';
		document.getElementById('sw').style.backgroundColor = '#000';
		document.getElementById('tt').style.backgroundColor = '#000';
		document.getElementById('ip').style.backgroundColor = '#000';
		document.getElementById('mm').style.backgroundColor = '#000';
		document.getElementById('tr_m').style.backgroundColor = '#000';
		document.getElementById('tr_w').style.backgroundColor = '#000';
		document.getElementById('tr_e').style.backgroundColor = '#000';
		document.getElementById('tr_b').style.backgroundColor = '#000';
		document.getElementById('link').style.backgroundColor = '#000';
		document.getElementById('sanc').style.backgroundColor = '#000';
		document.getElementById('mount').style.backgroundColor = '#000';
		document.getElementById('chest').style.backgroundColor = '#000';
		document.getElementById('gt').style.backgroundColor = '#000';
		document.getElementById('ganon').style.backgroundColor = '#000';
		document.getElementById('magic').style.backgroundColor = '#000';
		document.getElementById('kid').style.backgroundColor = '#000';
		document.getElementById('smith').style.backgroundColor = '#000';
		document.getElementById('bat').style.backgroundColor = '#000';
		document.getElementById('library').style.backgroundColor = '#000';
		document.getElementById('sahas').style.backgroundColor = '#000';
		document.getElementById('mimic').style.backgroundColor = '#000';
		document.getElementById('rupee').style.backgroundColor = '#000';
		document.getElementById('shop').style.backgroundColor = '#000';
		document.getElementById('dark').style.backgroundColor = '#000';
		document.getElementById('connector').style.backgroundColor = '#000';
		document.getElementById('bomb').style.backgroundColor = '#000';
		document.getElementById('bumper').style.backgroundColor = '#000';
		document.getElementById('spike').style.backgroundColor = '#000';
		document.getElementById('hook').style.backgroundColor = '#000';
		document.getElementById('dam').style.backgroundColor = '#000';
		
		if (entrances[n].known_location != '') {
			document.getElementById(entrances[n].known_location).style.backgroundColor = '#00F';
		}
	}
	
	window.checkReturn = function(n) {
		if (n.keyCode == 13) {
			hideEntranceModal();
		}
	}
	
	window.hideEntranceModal = function() {
		if (overrideEntranceCloseFlag === false) {
			if (document.getElementById('entranceModal').style.display != 'none') {
				entrances[document.getElementById('entranceID').value].note = document.getElementById('entranceModalNote').value;
				if (document.getElementById('entranceModalNote').value != '') {
					//Add the note icon
					var divtoadd = document.createElement('div');
					divtoadd.id = 'notediv' + document.getElementById('entranceID').value;
					var loc = document.getElementById('entranceMap' + document.getElementById('entranceID').value);
					
					divtoadd.style.top = loc.offsetTop - 10;
					divtoadd.style.left = loc.offsetLeft + 10;
					divtoadd.className = 'notediv';

					divtoadd.style.width = 10;
					divtoadd.style.height = 10;
					divtoadd.style.position = 'absolute';
					
					divtoadd.innerHTML = '!';
					
					document.getElementById('informationDiv').appendChild(divtoadd);				
					
				} else {
					//Remove the note icon if it exists
					var divtoremove = document.getElementById('notediv' + document.getElementById('entranceID').value);
					if (divtoremove != null) {
						divtoremove.remove();
					}
				}
				$('#entranceModal').hide();
			}
		} else {
			overrideEntranceCloseFlag = false;
		}
		
		updateMapTracker();
	}
	
	window.overrideEntranceClose = function() {
		overrideEntranceCloseFlag = true;
	}
	
	window.entranceConnect = function(n) {
		prepareToConnect = true;
		$('#entranceModal').hide();
	}
	
	window.entranceDisconnect = function(n, l) {
		for (var i = 0; i < connectorIndex.length; i++) {
			var c1 = connectorOne[i];
			var c2 = connectorTwo[i];
			var c1count = 0;
			var c2count = 0;
			if (connectorIndex[i] === n) {
				connectorIndex.splice(i,1);
				connectorOne.splice(i,1);
				connectorTwo.splice(i,1);
				for (var j = 0; j < connectorOne.length; j++) {
					if (connectorOne[j] === c1 || connectorTwo[j] === c1) {
						c1count++;
					}
					if (connectorOne[j] === c2 || connectorTwo[j] === c2) {
						c2count++;
					}
					
					if (c1count > 0 && c2count > 0) {
						j = 999;
					}
				}
				
				if (c1count === 0) {
					entrances[c1].is_connector = false;
				}
				if (c2count === 0) {
					entrances[c2].is_connector = false;
				}

				i = 999;
			}
		}
		
		var divtoremove = document.getElementById('connectordiv' + n);
		divtoremove.remove();
		updateMapTracker();
		
		hideEntranceModal();
	}
	
	window.StopAConnector = function() {
		document.getElementById('connectorStop').style.visibility = 'hidden';
		connectStart = false;
		connectFinish = false;
	}

	window.StartAConnectorModal = function() {
		document.getElementById('connectorStop').style.visibility = 'visible';
		connectStart = true;
		connectFinish = true;
		$('#entranceModal').hide();
	}
	
	window.HideConnectors = function() {
		if (document.getElementById('connectorLineDiv').style.visibility === 'collapse') {
			document.getElementById('connectorLineDiv').style.visibility = 'visible';
			document.getElementById('hideConnectorLinesImg').src = './images/interface/hide.png';
		} else {
			document.getElementById('connectorLineDiv').style.visibility = 'collapse';
			document.getElementById('hideConnectorLinesImg').src = './images/interface/show.png';
		}
	}
	
	window.LoadEntranceSummary = function(index = -1) {
		$('#summaryModal').show();

		for (var i = 0; i < 2; i++) {
			if (index < 0 || i === index) {
				var includeCleared = document.getElementById('summaryCleared'+i).checked;

				switch (document.getElementById('summaryFilter'+i).value) {
					case 'knownconnectors':
						var entrancesummary = '';
						
						for (var j = 0; j < connectorIndex.length; j++) {
							if (includeCleared || !entrances[connectorOne[j]].is_opened || !entrances[connectorTwo[j]].is_opened) {
								entrancesummary += '<div>' + entrances[connectorOne[j]].caption + ' <--> ' + entrances[connectorTwo[j]].caption + '</div>';
							}
						}
						
						document.getElementById('summaryDiv'+i).innerHTML = entrancesummary.replace(/\s?\{[^}]+\}/g, '');
						break;
					default:
						var locations = [];
						var locationsummary = '';
						var lastGroup = '';
						
						for (var j = 0; j < entrances.length; j++) {
							if ((entrances[j].known_location != '' || entrances[j].note != '') && (includeCleared || !entrances[j].is_opened)) {
								switch (document.getElementById('summaryFilter'+i).value) {
									case 'all':
										pushLocationObject(locations, entrances[j]);
										break;
									case 'dungeons':
										if (isDungeon(entrances[j].known_location)) {
											pushLocationObject(locations, entrances[j]);
										}
										break;
									case 'starts':
										if (entranceNameToGroup[entrances[j].known_location] === 'start') {
											pushLocationObject(locations, entrances[j]);
										}
										break;
									case 'keylocations':
										if (entranceNameToGroup[entrances[j].known_location].endsWith('key')) {
											pushLocationObject(locations, entrances[j]);
										}
										break;
									case 'shopschests':
										if (entrances[j].known_location === 'magic' || entrances[j].known_location === 'bomb' || entrances[j].known_location === 'shop' || entrances[j].known_location === 'chest') {
											pushLocationObject(locations, entrances[j]);
										}
										break;
									case 'unknownconnectors':
										if (entrances[j].known_location === 'dark' || entrances[j].known_location === 'connector') {
											pushLocationObject(locations, entrances[j]);
										}
										break;
									case 'notes':
										if (entrances[j].note != '') {
											pushLocationObject(locations, entrances[j]);
										}
								}
							}
						}
			
						locations.sort((a, b) => a.index - b.index);
						
						for (var j = 0; j < locations.length; j++) {
							locationsummary += (lastGroup != '' && lastGroup != locations[j].group ? '<div class="separatortop">' : '<div>') + locations[j].friendly + ': ' + locations[j].location + (locations[j].note == '' ? '' : ' ['+locations[j].note+']') + '</div>';
							lastGroup = locations[j].group;
						}
						
						document.getElementById('summaryDiv'+i).innerHTML = locationsummary.replace(/\s?\{[^}]+\}/g, '');
						document.getElementById('summaryDiv'+i).scrollTop = 0;
				}
			}
		}
	}
	
	window.pushLocationObject = function(locations, entrance) {
		locations.push({'index': entranceNameToIndex[entrance.known_location], 'friendly': getFriendlyName(entrance.known_location), 'group': entranceNameToGroup[entrance.known_location], 'location': entrance.caption, 'note': entrance.note});
	}
	
	window.hideSummaryModal = function() {
		$('#summaryModal').hide();
	}
	
	window.tagEntrance = function(n, t) {
		document.getElementById('hc_m').style.backgroundColor = '#000';
		document.getElementById('hc_w').style.backgroundColor = '#000';
		document.getElementById('hc_e').style.backgroundColor = '#000';
		document.getElementById('ct').style.backgroundColor = '#000';
		document.getElementById('ep').style.backgroundColor = '#000';
		document.getElementById('dp_m').style.backgroundColor = '#000';
		document.getElementById('dp_w').style.backgroundColor = '#000';
		document.getElementById('dp_e').style.backgroundColor = '#000';
		document.getElementById('dp_n').style.backgroundColor = '#000';
		document.getElementById('toh').style.backgroundColor = '#000';
		document.getElementById('pod').style.backgroundColor = '#000';
		document.getElementById('sp').style.backgroundColor = '#000';
		document.getElementById('sw').style.backgroundColor = '#000';
		document.getElementById('tt').style.backgroundColor = '#000';
		document.getElementById('ip').style.backgroundColor = '#000';
		document.getElementById('mm').style.backgroundColor = '#000';
		document.getElementById('tr_m').style.backgroundColor = '#000';
		document.getElementById('tr_w').style.backgroundColor = '#000';
		document.getElementById('tr_e').style.backgroundColor = '#000';
		document.getElementById('tr_b').style.backgroundColor = '#000';
		document.getElementById('link').style.backgroundColor = '#000';
		document.getElementById('sanc').style.backgroundColor = '#000';
		document.getElementById('mount').style.backgroundColor = '#000';
		document.getElementById('chest').style.backgroundColor = '#000';
		document.getElementById('gt').style.backgroundColor = '#000';
		document.getElementById('ganon').style.backgroundColor = '#000';
		document.getElementById('magic').style.backgroundColor = '#000';
		document.getElementById('kid').style.backgroundColor = '#000';
		document.getElementById('smith').style.backgroundColor = '#000';
		document.getElementById('bat').style.backgroundColor = '#000';
		document.getElementById('library').style.backgroundColor = '#000';
		document.getElementById('sahas').style.backgroundColor = '#000';
		document.getElementById('mimic').style.backgroundColor = '#000';
		document.getElementById('rupee').style.backgroundColor = '#000';
		document.getElementById('shop').style.backgroundColor = '#000';
		document.getElementById('dark').style.backgroundColor = '#000';
		document.getElementById('connector').style.backgroundColor = '#000';
		document.getElementById('bomb').style.backgroundColor = '#000';
		document.getElementById('bumper').style.backgroundColor = '#000';
		document.getElementById('spike').style.backgroundColor = '#000';
		document.getElementById('hook').style.backgroundColor = '#000';
		document.getElementById('dam').style.backgroundColor = '#000';
		
		if (entrances[document.getElementById('entranceID').value].known_location === n) {
			entrances[document.getElementById('entranceID').value].known_location = '';
			entrances[document.getElementById('entranceID').value].type = 0;
			var information = document.getElementById('informationdiv'+document.getElementById('entranceID').value);
			if (information != null) {
				information.remove();
			}
		} else {
			entrances[document.getElementById('entranceID').value].known_location = n;
			entrances[document.getElementById('entranceID').value].type = (t === true ? 2 : 3);
			document.getElementById(n).style.backgroundColor = '#00F';
			
			if (document.getElementById('informationdiv'+document.getElementById('entranceID').value) != null) {
				document.getElementById('informationdiv'+document.getElementById('entranceID').value).innerHTML = n.replace('_','-').toUpperCase();
			} else {
				var divtoadd = document.createElement('div');
				divtoadd.id = 'informationdiv' + document.getElementById('entranceID').value;
				var loc = document.getElementById('entranceMap' + document.getElementById('entranceID').value);
				
				if (loc.offsetTop < 20) {
					divtoadd.style.top = loc.offsetTop + 15;
				} else {
					divtoadd.style.top = loc.offsetTop - 15;
				}
				
				
				divtoadd.style.left = loc.offsetLeft - 14;
				divtoadd.className = 'informationdiv';

				divtoadd.style.width = 40;
				divtoadd.style.height = 12;
				divtoadd.style.position = 'absolute';
				
				divtoadd.innerHTML = n.replace('_','-').toUpperCase();
				
				document.getElementById('informationDiv').appendChild(divtoadd);
			}		
		}
		hideEntranceModal();
	}

    // event of clicking on Mire/TRock's medallion subsquare
    window.toggle_medallion = function(n) {
        medallions[n] += 1;
        if (medallions[n] === 4) medallions[n] = 0;

        document.getElementById('medallion'+n).className = 'medallion-' + medallions[n];

        if (flags.mapmode != "N") {
            // Change the mouseover text on the map
            dungeons[8+n].caption = dungeons[8+n].caption.replace(/\{medallion\d+\}/, '{medallion'+medallions[n]+'}');
			updateMapTracker();
        }
    };

    // event of right clicking on a boss's enemizer portrait
    window.rightClickMedallion = function(n) {
        medallions[n] -= 1;
        if (medallions[n] === -1) medallions[n] = 3;
		
        document.getElementById('medallion'+n).className = 'medallion-' + medallions[n];

        if (flags.mapmode != "N") {
            // Change the mouseover text on the map
            dungeons[8+n].caption = dungeons[8+n].caption.replace(/\{medallion\d+\}/, '{medallion'+medallions[n]+'}');
			updateMapTracker();
        }
    };

    // event of clicking on each dungeon's bigkey
    window.toggle_bigkey = function(n) {
		items['bigkey'+n] = !items['bigkey'+n];
		
		if (items['bigkey'+n]) {
			document.getElementById('bigkey'+n).className = 'bigkey collected';
		} else {
			document.getElementById('bigkey'+n).className = 'bigkey';
		}
		
        if (flags.mapmode != "N") {
            // Update availability of dungeon boss AND chests
            dungeons[8+n].is_beaten = !dungeons[8+n].is_beaten;
            toggle_boss(8+n);
            if (items['chest'+(8+n)] > 0)
                document.getElementById('dungeon'+(8+n)).className = 'dungeon ' + dungeons[8+n].can_get_chest();
            // TRock medallion affects Mimic Cave
            if (n === 1) {
                chests[4].is_opened = !chests[4].is_opened;
                toggle_chest(4);
            }
            // Change the mouseover text on the map
            dungeons[8+n].caption = dungeons[8+n].caption.replace(/\{medallion\d+\}/, '{medallion'+medallions[n]+'}');
        }
    };

//    if (flags.mapmode != 'N') {
        // Event of clicking a chest on the map
        window.toggle_chest = function(x) {
            chests[x].is_opened = !chests[x].is_opened;
            var highlight = document.getElementById('locationMap'+x).classList.contains('highlight');
            document.getElementById('locationMap'+x).className = 'location ' +
                (chests[x].is_opened ? 'opened' : chests[x].is_available()) +
                (highlight ? ' highlight' : '');
        };
		// Event of clicking on an entrance on the map
        window.toggle_location = function(x) {
			if (connectStart === false) {
				entrances[x].is_opened = !entrances[x].is_opened;
				var highlight = document.getElementById('entranceMap'+x).classList.contains('highlight');
				document.getElementById('entranceMap'+x).className = 'entrance ' +
					(entrances[x].is_opened ? 'opened' : entrances[x].is_available()) +
					(highlight ? ' highlight' : '');
				var information = document.getElementById('informationdiv'+x);
				if (information != null) {
					information.style.visibility = (entrances[x].is_opened ? 'collapse' : 'visible');
				}
			} else if (connectFinish === true) {
				if (x != parseInt(document.getElementById('entranceID').value)) {
					entrances[x].is_connector = true;
					entrances[document.getElementById('entranceID').value].is_connector = true;
					
					connectorIndex.push(connectorid);
					connectorOne.push(parseInt(document.getElementById('entranceID').value));
					connectorTwo.push(x);
					
					var divtoadd = document.createElement('div');
					divtoadd.id = 'connectordiv' + connectorid;
					var connector1 = document.getElementById('entranceMap' + x);
					var connector2 = document.getElementById('entranceMap' + document.getElementById('entranceID').value);
					
					if (connector1.offsetTop > connector2.offsetTop) {
						divtoadd.style.top = connector2.offsetTop + 6;
					} else {
						divtoadd.style.top = connector1.offsetTop + 6;
					}
					if (connector1.offsetLeft > connector2.offsetLeft) {
						divtoadd.style.left = connector2.offsetLeft + 6;
					} else {
						divtoadd.style.left = connector1.offsetLeft + 6;
					}
					
					if (connector1.offsetLeft > connector2.offsetLeft) {
						if (connector1.offsetTop > connector2.offsetTop) {
							divtoadd.className = 'crossedright';
						} else {
							divtoadd.className = 'crossedleft';
						}
					} else {
						if (connector1.offsetTop > connector2.offsetTop) {
							divtoadd.className = 'crossedleft';
						} else {
							divtoadd.className = 'crossedright';
						}
					}

					divtoadd.style.width = Math.abs(connector1.offsetLeft - connector2.offsetLeft);
					divtoadd.style.height = Math.abs(connector1.offsetTop - connector2.offsetTop);
					divtoadd.style.position = 'absolute';
					
					document.getElementById('connectorLineDiv').appendChild(divtoadd);
					connectorid++;
				}
				
				document.getElementById('connectorStop').style.visibility = 'hidden';
				connectStart = false;
				connectFinish = false;
				
			} else {
				document.getElementById('entranceID').value = x;
				connectFinish = true;
			}
			
			updateMapTracker();
        };
		
        // Event of clicking a dungeon location (not really)
        window.toggle_boss = function(x) {
            dungeons[x].is_beaten = !dungeons[x].is_beaten;
			if (document.getElementById('bossMap'+x) != null) {
				document.getElementById('bossMap'+x).className = 'bossprize-' + prizes[x] + ' boss ' + (dungeons[x].is_beaten ? 'opened' : dungeons[x].is_beatable());
				updateMapTracker();
			}
        };
        window.toggle_agahnim = function() {
			if (flags.entrancemode === 'N') {
				document.getElementById('castle').className = 'castle ' +
					(items.agahnim ? 'opened' : agahnim.is_available());
			}
        };
        // Highlights a chest location and shows the caption
        window.highlight = function(x) {
            document.getElementById('locationMap'+x).classList.add('highlight');
            document.getElementById('caption').innerHTML = caption_to_html(chests[x].content ?(chests[x].content+" | "+chests[x].caption) :chests[x].caption);
			document.getElementById('autotrackingstatus').style.display = 'none';
        };
        window.unhighlight = function(x) {
            document.getElementById('locationMap'+x).classList.remove('highlight');
            document.getElementById('caption').innerHTML = '&nbsp;';
			document.getElementById('autotrackingstatus').style.display = '';
        };
        // Highlights a entrance location and shows the caption
        window.highlight_entrance = function(x) {
            document.getElementById('entranceMap'+x).classList.add('highlight');
			var displayCaption = entrances[x].caption;
			if (entrances[x].known_location != '') {
				displayCaption = displayCaption + ' -- ' + getFriendlyName(entrances[x].known_location);
			}
			if (entrances[x].is_connector) {
				for (var i = 0; i < connectorIndex.length; i++) {
					if (connectorOne[i] === x) {
						displayCaption = displayCaption + ' ==> ' + (entrances[connectorTwo[i]].caption);
					}
					if (connectorTwo[i] === x) {
						displayCaption = displayCaption + ' ==> ' + (entrances[connectorOne[i]].caption);
					}
				}
			}
			if (entrances[x].note != '') {
				displayCaption = displayCaption + ' ['+entrances[x].note+']';
			}
			document.getElementById('caption').innerHTML = caption_to_html(displayCaption);
			document.getElementById('autotrackingstatus').style.display = 'none';
        };
        window.unhighlight_entrance = function(x) {
            document.getElementById('entranceMap'+x).classList.remove('highlight');
            document.getElementById('caption').innerHTML = '&nbsp;';
			document.getElementById('autotrackingstatus').style.display = '';
        };
        // Highlights a chest location and shows the caption (but for dungeons)
        window.highlight_dungeon = function(x) {
            document.getElementById('dungeon'+x).classList.add('highlight');
            document.getElementById('caption').innerHTML = caption_to_html((dungeons[x].content ? (dungeons[x].content+" | ") : "")+(dungeons[x].trashContent ? (dungeons[x].trashContent+" | ") : "")+dungeons[x].caption);
			document.getElementById('autotrackingstatus').style.display = 'none';
        };
        window.unhighlight_dungeon = function(x) {
            document.getElementById('dungeon'+x).classList.remove('highlight');
            document.getElementById('caption').innerHTML = '&nbsp;';
			document.getElementById('autotrackingstatus').style.display = '';
        };
        window.highlight_agahnim = function() {
            document.getElementById('castle').classList.add('highlight');
            document.getElementById('caption').innerHTML = caption_to_html(agahnim.caption);
			document.getElementById('autotrackingstatus').style.display = 'none';
        };
        window.unhighlight_agahnim = function() {
            document.getElementById('castle').classList.remove('highlight');
            document.getElementById('caption').innerHTML = '&nbsp;';
			document.getElementById('autotrackingstatus').style.display = '';
        };
    //}

	window.getFriendlyName = function(x) {
		return entranceNameToFriendlyName[x];
	}

	window.defineEntranceTypes = function() {
		defineEntranceType(0, 'lwdungeon', 'hc_m', 'Hyrule Castle (Main)');
		defineEntranceType(1, 'lwdungeon', 'hc_w', 'Hyrule Castle (West)');
		defineEntranceType(2, 'lwdungeon', 'hc_e', 'Hyrule Castle (East)');
		defineEntranceType(3, 'lwdungeon', 'ct', 'Castle Tower');
		defineEntranceType(4, 'lwdungeon', 'ep', 'Eastern Palace');
		defineEntranceType(5, 'lwdungeon', 'dp_m', 'Desert Palace (Main)');
		defineEntranceType(6, 'lwdungeon', 'dp_w', 'Desert Palace (West)');
		defineEntranceType(7, 'lwdungeon', 'dp_e', 'Desert Palace (East)');
		defineEntranceType(8, 'lwdungeon', 'dp_n', 'Desert Palace (North)');
		defineEntranceType(9, 'lwdungeon', 'toh', 'Tower of Hera');
		defineEntranceType(10, 'dwdungeon', 'pod', 'Palace of Darkness');
		defineEntranceType(11, 'dwdungeon', 'sp', 'Swamp Palace');
		defineEntranceType(12, 'dwdungeon', 'sw', 'Skull Woods (Back)');
		defineEntranceType(13, 'dwdungeon', 'tt', 'Thieve\'s Town');
		defineEntranceType(14, 'dwdungeon', 'ip', 'Ice Palace');
		defineEntranceType(15, 'dwdungeon', 'mm', 'Misery Mire');
		defineEntranceType(16, 'dwdungeon', 'tr_m', 'Turtle Rock (Main)');
		defineEntranceType(17, 'dwdungeon', 'tr_w', 'Turtle Rock (West)');
		defineEntranceType(18, 'dwdungeon', 'tr_e', 'Turtle Rock (East)');
		defineEntranceType(19, 'dwdungeon', 'tr_b', 'Turtle Rock (Back)');
		defineEntranceType(20, 'dwdungeon', 'gt', 'Ganon\'s Tower');
		defineEntranceType(21, 'dwdungeon', 'ganon', 'Ganon');
		defineEntranceType(22, 'start', 'link', 'Link\'s House');
		defineEntranceType(23, 'start', 'sanc', 'Sanctuary');
		defineEntranceType(24, 'start', 'mount', 'Death Mountain (Start)');
		defineEntranceType(25, 'lwkey', 'magic', 'Magic Shop');
		defineEntranceType(26, 'lwkey', 'kid', 'Lazy Kid');
		defineEntranceType(27, 'lwkey', 'smith', 'Swordsmiths');
		defineEntranceType(28, 'lwkey', 'bat', 'Magic Bat');
		defineEntranceType(29, 'lwkey', 'library', 'Library');
		defineEntranceType(30, 'lwkey', 'sahas', 'Sahasrahla\'s Hut');
		defineEntranceType(31, 'lwkey', 'mimic', 'Mimic Cave');
		defineEntranceType(32, 'lwkey', 'dam', 'Dam');
		defineEntranceType(33, 'dwkey', 'bomb', 'Bomb Shop');
		defineEntranceType(34, 'dwkey', 'bumper', 'Bumper Cave');
		defineEntranceType(35, 'dwkey', 'spike', 'Spike Cave');
		defineEntranceType(36, 'dwkey', 'hook', 'Hookshot Cave');
		defineEntranceType(37, 'generalkey', 'rupee', 'Rupee Cave');
		defineEntranceType(38, 'generalkey', 'shop', 'Shop');
		defineEntranceType(39, 'generalkey', 'dark', 'Dark Cave');
		defineEntranceType(40, 'generalkey', 'connector', 'Unknown Connector');
		defineEntranceType(41, 'generalkey', 'chest', 'Room/Cave w/ Chest');
		defineEntranceType(1000, 'null', '', '???');
	}

	window.defineEntranceType = function(index, group, name, friendlyName) {
		entranceNameToIndex[name] = index;
		entranceIndexToName[index] = name;
		entranceNameToFriendlyName[name] = friendlyName;
		entranceNameToGroup[name] = group;
	}

	window.isDungeon = function(x) {
		return entranceNameToGroup[x].endsWith('dungeon');
	}
	
	window.findItems = function(items) {
		if(/*spoilerLoaded && */flags.mapmode != "N")
		{
			var results = "";
			for(var i = 0; i < chests.length; i++)
			{
				if(chests[i].content)
				{
					var hasItem = false,itemsInLocation = chests[i].content.split(", ");
					for(var j = 0; j < items.length; j++)
						if(itemsInLocation.includes(items[j]))
						{
							hasItem = true;
							break;
						}
					if(hasItem)
					{
						if(flags.mapmode != 'N')
							document.getElementById('locationMap'+i).classList.add('highlight');
						var locationName = chests[i].caption;
						results = results === "" ?locationName :results+", "+locationName;
					}
				}
			}
			for(var i = 0; i < dungeons.length; i++)
			{
				if(dungeons[i].content)
				{
					var hasItem = false,itemsInLocation = dungeons[i].content.split(", ");
					for(var j = 0; j < items.length; j++)
						if(itemsInLocation.includes(items[j]))
						{
							hasItem = true;
							break;
						}
					if(hasItem)
					{
						if(flags.mapmode != 'N')
							document.getElementById('dungeon'+i).classList.add('highlight');
						var locationName = dungeons[i].caption;
						results = results === "" ?locationName :results+", "+locationName;
					}
				}
			}
			for(var i = 0; i < dungeonContents.length; i++)
			{
				var dungeonHasItem = false,itemMap = dungeonContents[i];
				for(var locationName in itemMap)
				{
					var hasItem = false,itemName = itemMap[locationName];
					for(var j = 0; j < items.length; j++)
						if(itemName === items[j])
						{
							dungeonHasItem = hasItem = true;
							break;
						}
					if(hasItem)
					{
						results = results === "" ?dungeonNames[i]+" "+locationName :results+", "+dungeonNames[i]+" "+locationName;
					}
				}
				if(dungeonHasItem)
				{
					if(flags.mapmode != 'N')
						document.getElementById('dungeon'+i).classList.add('highlight');
				}
			}
			if(results !== "")
				document.getElementById('caption').innerHTML = caption_to_html(results);
		}
	};

	window.unhighlightAll = function() {
		if(flags.mapmode != 'N')
		{
			for(var i = 0; i < chests.length; i++)
				document.getElementById('locationMap'+i).classList.remove('highlight');
			if (flags.entrancemode != 'N') {
				for(var i = 0; i < entrances.length; i++)
					document.getElementById('entranceMap'+i).classList.remove('highlight');
			}
			else
				for(var i = 0; i < dungeons.length; i++)
					document.getElementById('dungeon'+i).classList.remove('highlight');
		}
		document.getElementById('caption').innerHTML = '&nbsp;';
	};
	
	window.showNiceItems = function(x) {
		if (flags.mapmode != "N") {
			if(spoilerLoaded) {
				document.getElementById('caption').innerHTML = caption_to_html(dungeons[x].niceContent);
			}
		}
	};

	window.clearCaption = function() {
		document.getElementById('caption').innerHTML = '&nbsp;';
	};

	window.setSphereItem = function(label) {
		if (lastItem === null) {
			document.getElementById(label).className = "sphere noitem";
		} else {
			if (lastItem.substring(0, 5) === "sword" || lastItem.substring(0, 5) === "shiel" || lastItem.substring(0, 5) === "moonp") {
				document.getElementById(label).className = "sphere sphere" + lastItem;
			}
			else
				document.getElementById(label).className = "sphere " + lastItem;
			
		}
		lastItem = null;
	}

    function caption_to_html(caption) {
        return caption.replace(/\{(\w+?)(\d+)?\}/g, function(__, name, n) {
            var dash = /medallion|pendant/.test(name)
            return '<div class="icon ' +
                (dash ? name + '-' + n :
                n ? name + ' active-' + n :
                name) + '"></div>';
        });
    }
	
	window.crystalGoal = function() {
		if (flags.opentower === 'R') {
			document.getElementById('crystalsselectdiv').style.visibility = 'inherit';
		}
	}

	window.ganonGoal = function() {
		if (flags.ganonvuln === 'R' && (flags.goals === 'G' || flags.goals === 'F')) {
			document.getElementById('ganonselectdiv').style.visibility = 'inherit';
		}
	}
	
	window.setCrystalGoal = function(x) {
		document.getElementById('crystalsdiv').classList.remove('crystals');
		document.getElementById('crystalsdiv').classList.remove('crystals0');
		document.getElementById('crystalsdiv').classList.remove('crystals1');
		document.getElementById('crystalsdiv').classList.remove('crystals2');
		document.getElementById('crystalsdiv').classList.remove('crystals3');
		document.getElementById('crystalsdiv').classList.remove('crystals4');
		document.getElementById('crystalsdiv').classList.remove('crystals5');
		document.getElementById('crystalsdiv').classList.remove('crystals6');
		document.getElementById('crystalsdiv').classList.remove('crystals7');
		document.getElementById('crystalsdiv').classList.add('crystals' + x);
		document.getElementById('crystalsselectdiv').style.visibility = 'collapse';
		flags.opentowercount = (x === '' ? 8 : x);
		updateMapTracker();	
	}

	window.setGanonGoal = function(x) {
		document.getElementById('ganondiv').classList.remove('ganon');
		document.getElementById('ganondiv').classList.remove('ganon0');
		document.getElementById('ganondiv').classList.remove('ganon1');
		document.getElementById('ganondiv').classList.remove('ganon2');
		document.getElementById('ganondiv').classList.remove('ganon3');
		document.getElementById('ganondiv').classList.remove('ganon4');
		document.getElementById('ganondiv').classList.remove('ganon5');
		document.getElementById('ganondiv').classList.remove('ganon6');
		document.getElementById('ganondiv').classList.remove('ganon7');
		document.getElementById('ganondiv').classList.add('ganon' + x);
		document.getElementById('ganonselectdiv').style.visibility = 'collapse';
		flags.ganonvulncount = (x === '' ? 8 : x);
		updateMapTracker();
	}
	
	window.updateMapTracker = function() {
		click_map();
		items.moonpearl = !items.moonpearl;
		toggle('moonpearl');
	}

	window.changeFlags = function() {
		//Set flags
		document.getElementById("stateselect").value = flags.gametype;
		document.getElementById("entranceselect").value = flags.entrancemode;
		document.getElementById("bossselect").value = flags.bossshuffle;
		document.getElementById("enemyselect").value = flags.enemyshuffle;
		document.getElementById("shuffledmaps").checked = (flags.wildmaps ? true : false);
		document.getElementById("shuffledcompasses").checked = (flags.wildcompasses ? true : false);
		document.getElementById("shuffledkeys").checked = (flags.wildkeys ? true : false);
		document.getElementById("shuffledbigkeys").checked = (flags.wildbigkeys ? true : false);
		document.getElementById("goalselect").value = flags.goals;
		document.getElementById("swordselect").value = flags.swordmode;
		document.getElementById("invertedactivatedflute").checked = (flags.invertedactivatedflute ? true : false);
		document.getElementById("doorselect").value = flags.doorshuffle;
		document.getElementById("overworldbox").checked = flags.overworldshuffle != 'N';
		document.getElementById("shopsanitybox").checked = flags.shopsanity != 'N';
		
		openMainSettings();
		$('#flagsModal').show();
	}
	
	window.openMainSettings = function() {
		document.getElementById("flagsmaintab").classList.add("active");
		document.getElementById("flagsextratab").classList.remove("active");
		document.getElementById("flagsmain").style.display = "";
		document.getElementById("flagsextra").style.display = "none";
	}
	
	window.openExtraSettings = function() {
		document.getElementById("flagsmaintab").classList.remove("active");
		document.getElementById("flagsextratab").classList.add("active");
		document.getElementById("flagsmain").style.display = "none";
		document.getElementById("flagsextra").style.display = "";
	}
	
	window.closeFlagsModal = function() {
		$('#flagsModal').hide();
	}

	window.adjustFlags = function() {
		//Clean up states and variables before we start
		click_map();
		overrideEntranceCloseFlag = false;
		if (flags.entrancemode != 'N')
		{
			hideEntranceModal();
			hideSummaryModal();
			StopAConnector();
		}

		var adjustForRetro = false;
		var resetChestFlags = false;
		var resetLogic = false;
		
		//World State
		if (document.getElementById('stateselect').value != flags.gametype)
		{
			if (document.getElementById('stateselect').value === "R" || flags.gametype === "R") {
				adjustForRetro = true;
			}

			if (document.getElementById('stateselect').value === "I" || flags.gametype === "I") {
				resetChestFlags = true;
			}
			
			flags.gametype = document.getElementById('stateselect').value;	
		}
		
		//Boss Shuffle
		if (document.getElementById('bossselect').value != flags.bossshuffle)
		{
			flags.bossshuffle = document.getElementById('bossselect').value;
			if (flags.bossshuffle === 'N') {
				document.getElementById('dungeonEnemy0').style.visibility = 'hidden';
				document.getElementById('dungeonEnemy1').style.visibility = 'hidden';
				document.getElementById('dungeonEnemy2').style.visibility = 'hidden';
				document.getElementById('dungeonEnemy3').style.visibility = 'hidden';
				document.getElementById('dungeonEnemy4').style.visibility = 'hidden';
				document.getElementById('dungeonEnemy5').style.visibility = 'hidden';
				document.getElementById('dungeonEnemy6').style.visibility = 'hidden';
				document.getElementById('dungeonEnemy7').style.visibility = 'hidden';
				document.getElementById('dungeonEnemy8').style.visibility = 'hidden';
				document.getElementById('dungeonEnemy9').style.visibility = 'hidden';
				for (var k = 0; k < dungeons.length; k++) {
					enemizer[k] = k + 1;
					if (k < 10) {
						document.getElementById('dungeonEnemy' + k).className = 'enemizer-' + (k + 1);
					}
				}
			} else {
				document.getElementById('dungeonEnemy0').style.visibility = 'inherit';
				document.getElementById('dungeonEnemy1').style.visibility = 'inherit';
				document.getElementById('dungeonEnemy2').style.visibility = 'inherit';
				document.getElementById('dungeonEnemy3').style.visibility = 'inherit';
				document.getElementById('dungeonEnemy4').style.visibility = 'inherit';
				document.getElementById('dungeonEnemy5').style.visibility = 'inherit';
				document.getElementById('dungeonEnemy6').style.visibility = 'inherit';
				document.getElementById('dungeonEnemy7').style.visibility = 'inherit';
				document.getElementById('dungeonEnemy8').style.visibility = 'inherit';
				document.getElementById('dungeonEnemy9').style.visibility = 'inherit';
				for (var k = 0; k < dungeons.length; k++) {
					enemizer[k] = 0;
					if (k < 10) {
						document.getElementById('dungeonEnemy' + k).className = 'enemizer-0';
					}
				}
			}
		}
		
		//Enemy Shuffle
		if (document.getElementById('enemyselect').value != flags.enemyshuffle) {
			flags.enemyshuffle = document.getElementById('enemyselect').value;
		}
		
		//Dungeon Items and Doors
		if (document.getElementById('shuffledmaps').checked != flags.wildmaps || document.getElementById('shuffledcompasses').checked != flags.wildcompasses || document.getElementById('shuffledkeys').checked != flags.wildkeys || document.getElementById('shuffledbigkeys').checked != flags.wildbigkeys || document.getElementById('doorselect').value != flags.doorshuffle || adjustForRetro) {
			
			var adjustForCrossed = (document.getElementById('doorselect').value === 'C') != (flags.doorshuffle === 'C');

			var chestschecked0 = adjustForCrossed ? 0 : items.maxchest0 - items.chest0;
			var chestschecked1 = adjustForCrossed ? 0 : items.maxchest1 - items.chest1;
			var chestschecked2 = adjustForCrossed ? 0 : items.maxchest2 - items.chest2;
			var chestschecked3 = adjustForCrossed ? 0 : items.maxchest3 - items.chest3;
			var chestschecked4 = adjustForCrossed ? 0 : items.maxchest4 - items.chest4;
			var chestschecked5 = adjustForCrossed ? 0 : items.maxchest5 - items.chest5;
			var chestschecked6 = adjustForCrossed ? 0 : items.maxchest6 - items.chest6;
			var chestschecked7 = adjustForCrossed ? 0 : items.maxchest7 - items.chest7;
			var chestschecked8 = adjustForCrossed ? 0 : items.maxchest8 - items.chest8;
			var chestschecked9 = adjustForCrossed ? 0 : items.maxchest9 - items.chest9;
			var chestschecked10 = adjustForCrossed ? 0 : items.maxchest10 - items.chest10;
			var chestschecked11 = adjustForCrossed ? 0 : items.maxchest11 - items.chest11;
			var chestschecked12 = adjustForCrossed ? 0 : items.maxchest12 - items.chest12;
			
			var chestmod = 0;
			
			if (document.getElementById('shuffledmaps').checked) {
				chestmod++;
			}
			
			if (document.getElementById('shuffledcompasses').checked) {
				chestmod++;
			}
	
			var chestmodcrossed = chestmod;
			
			if (document.getElementById('shuffledbigkeys').checked) {
				chestmod++;
				if ((document.getElementById('shuffledkeys').checked || flags.gametype === 'R')) {
					chestmodcrossed++;
				}		
			}
			
			var chests0 = document.getElementById('doorselect').value === 'C' ? 3 + chestmodcrossed : 3 + chestmod;
			var chests1 = document.getElementById('doorselect').value === 'C' ? 3 + chestmodcrossed : 2 + chestmod + ((document.getElementById('shuffledkeys').checked || flags.gametype === 'R') ? 1 : 0);
			var chests2 = document.getElementById('doorselect').value === 'C' ? 3 + chestmodcrossed : 2 + chestmod + ((document.getElementById('shuffledkeys').checked || flags.gametype === 'R') ? 1 : 0);
			var chests3 = document.getElementById('doorselect').value === 'C' ? 3 + chestmodcrossed : 5 + chestmod + ((document.getElementById('shuffledkeys').checked || flags.gametype === 'R') ? 6 : 0);
			var chests4 = document.getElementById('doorselect').value === 'C' ? 3 + chestmodcrossed : 6 + chestmod + ((document.getElementById('shuffledkeys').checked || flags.gametype === 'R') ? 1 : 0);
			var chests5 = document.getElementById('doorselect').value === 'C' ? 3 + chestmodcrossed : 2 + chestmod + ((document.getElementById('shuffledkeys').checked || flags.gametype === 'R') ? 3 : 0);
			var chests6 = document.getElementById('doorselect').value === 'C' ? 3 + chestmodcrossed : 4 + chestmod + ((document.getElementById('shuffledkeys').checked || flags.gametype === 'R') ? 1 : 0);
			var chests7 = document.getElementById('doorselect').value === 'C' ? 3 + chestmodcrossed : 3 + chestmod + ((document.getElementById('shuffledkeys').checked || flags.gametype === 'R') ? 2 : 0);
			var chests8 = document.getElementById('doorselect').value === 'C' ? 3 + chestmodcrossed : 2 + chestmod + ((document.getElementById('shuffledkeys').checked || flags.gametype === 'R') ? 3 : 0);
			var chests9 = document.getElementById('doorselect').value === 'C' ? 3 + chestmodcrossed : 5 + chestmod + ((document.getElementById('shuffledkeys').checked || flags.gametype === 'R') ? 4 : 0);
			var chests10 = document.getElementById('doorselect').value === 'C' ? 3 + chestmodcrossed : 20 + chestmod + ((document.getElementById('shuffledkeys').checked || flags.gametype === 'R') ? 4 : 0);
			var chests11 = document.getElementById('doorselect').value === 'C' ? 3 + chestmodcrossed : 6 + (document.getElementById('shuffledmaps').checked ? 1 : 0) + ((document.getElementById('shuffledkeys').checked || flags.gametype === 'R') ? 1 : 0);
			var chests12 = document.getElementById('doorselect').value === 'C' ? 3 + chestmodcrossed : ((document.getElementById('shuffledkeys').checked || flags.gametype === 'R') ? 2 : 0);
		
			var maxchests0 = document.getElementById('doorselect').value === 'C' ? 32 : chests0;
			var maxchests1 = document.getElementById('doorselect').value === 'C' ? 32 : chests1;
			var maxchests2 = document.getElementById('doorselect').value === 'C' ? 32 : chests2;
			var maxchests3 = document.getElementById('doorselect').value === 'C' ? 32 : chests3;
			var maxchests4 = document.getElementById('doorselect').value === 'C' ? 32 : chests4;
			var maxchests5 = document.getElementById('doorselect').value === 'C' ? 32 : chests5;
			var maxchests6 = document.getElementById('doorselect').value === 'C' ? 32 : chests6;
			var maxchests7 = document.getElementById('doorselect').value === 'C' ? 32 : chests7;
			var maxchests8 = document.getElementById('doorselect').value === 'C' ? 32 : chests8;
			var maxchests9 = document.getElementById('doorselect').value === 'C' ? 32 : chests9;
			var maxchests10 = document.getElementById('doorselect').value === 'C' ? 32 : chests10;
			var maxchests11 = document.getElementById('doorselect').value === 'C' ? 32 : chests11;
			var maxchests12 = document.getElementById('doorselect').value === 'C' ? 32 : chests12;
			
			if(adjustForCrossed || flags.doorshuffle != 'C') {
				items.chest0 = chests0 - chestschecked0;
				items.chest1 = chests1 - chestschecked1;
				items.chest2 = chests2 - chestschecked2;
				items.chest3 = chests3 - chestschecked3;
				items.chest4 = chests4 - chestschecked4;
				items.chest5 = chests5 - chestschecked5;
				items.chest6 = chests6 - chestschecked6;
				items.chest7 = chests7 - chestschecked7;
				items.chest8 = chests8 - chestschecked8;
				items.chest9 = chests9 - chestschecked9;
				items.chest10 = chests10 - chestschecked10;
				items.chest11 = chests11 - chestschecked11;
				items.chest12 = chests12 - chestschecked12;

				items.chest0 = (items.chest0 < 0 ? 0 : items.chest0);
				items.chest1 = (items.chest1 < 0 ? 0 : items.chest1);
				items.chest2 = (items.chest2 < 0 ? 0 : items.chest2);
				items.chest3 = (items.chest3 < 0 ? 0 : items.chest3);
				items.chest4 = (items.chest4 < 0 ? 0 : items.chest4);
				items.chest5 = (items.chest5 < 0 ? 0 : items.chest5);
				items.chest6 = (items.chest6 < 0 ? 0 : items.chest6);
				items.chest7 = (items.chest7 < 0 ? 0 : items.chest7);
				items.chest8 = (items.chest8 < 0 ? 0 : items.chest8);
				items.chest9 = (items.chest9 < 0 ? 0 : items.chest9);
				items.chest10 = (items.chest10 < 0 ? 0 : items.chest10);
				items.chest11 = (items.chest11 < 0 ? 0 : items.chest11);
				items.chest12 = (items.chest12 < 0 ? 0 : items.chest12);
			}

			items.maxchest0 = maxchests0;
			items.maxchest1 = maxchests1;
			items.maxchest2 = maxchests2;
			items.maxchest3 = maxchests3;
			items.maxchest4 = maxchests4;
			items.maxchest5 = maxchests5;
			items.maxchest6 = maxchests6;
			items.maxchest7 = maxchests7;
			items.maxchest8 = maxchests8;
			items.maxchest9 = maxchests9;
			items.maxchest10 = maxchests10;
			items.maxchest11 = maxchests11;
			items.maxchest12 = maxchests12;

			if (adjustForCrossed) {
				for (var k = 0; k < 13; k++) {
					items['chestknown' + k] = false;
				}
			}
			
			items.inc = limit(1, {
				tunic: { min: 1, max: 3 },
				sword: { max: 4 },
				shield: { max: 3 },
				bottle: { max: 4 },
				bow: { max: 2 },
				boomerang: { max: 3 },
				glove: { max: 2 },
				smallkey0: { min: 0, max: document.getElementById('doorselect').value === 'C' ? 29 : 0 },
				smallkey1: { min: 0, max: document.getElementById('doorselect').value === 'C' ? 29 : 1 },
				smallkey2: { min: 0, max: document.getElementById('doorselect').value === 'C' ? 29 : 1 },
				smallkey3: { min: 0, max: document.getElementById('doorselect').value === 'C' ? 29 : 6 },
				smallkey4: { min: 0, max: document.getElementById('doorselect').value === 'C' ? 29 : 1 },
				smallkey5: { min: 0, max: document.getElementById('doorselect').value === 'C' ? 29 : 3 },
				smallkey6: { min: 0, max: document.getElementById('doorselect').value === 'C' ? 29 : 1 },
				smallkey7: { min: 0, max: document.getElementById('doorselect').value === 'C' ? 29 : 2 },
				smallkey8: { min: 0, max: document.getElementById('doorselect').value === 'C' ? 29 : 3 },
				smallkey9: { min: 0, max: document.getElementById('doorselect').value === 'C' ? 29 : 4 },
				smallkey10: { min: 0, max: document.getElementById('doorselect').value === 'C' ? 29 : 4 },
				smallkeyhalf0: { min: 0, max: document.getElementById('doorselect').value === 'C' ? 29 : 1 },
				smallkeyhalf1: { min: 0, max: document.getElementById('doorselect').value === 'C' ? 29 : 2 },
				chest0: { min: 0, max: maxchests0 },
				chest1: { min: 0, max: maxchests1 },
				chest2: { min: 0, max: maxchests2 },
				chest3: { min: 0, max: maxchests3 },
				chest4: { min: 0, max: maxchests4 },
				chest5: { min: 0, max: maxchests5 },
				chest6: { min: 0, max: maxchests6 },
				chest7: { min: 0, max: maxchests7 },
				chest8: { min: 0, max: maxchests8 },
				chest9: { min: 0, max: maxchests9 },
				chest10: { min: 0, max: maxchests10 },
				chest11: { min: 0, max: maxchests11 },
				chest12: { min: 0, max: maxchests12 }
			}); 
			
			items.dec = limit(-1, {
				chest0: { max: maxchests0 },
				chest1: { max: maxchests1 },
				chest2: { max: maxchests2 },
				chest3: { max: maxchests3 },
				chest4: { max: maxchests4 },
				chest5: { max: maxchests5 },
				chest6: { max: maxchests6 },
				chest7: { max: maxchests7 },
				chest8: { max: maxchests8 },
				chest9: { max: maxchests9 },
				chest10: { max: maxchests10 },
				chest11: { max: maxchests11 },
				chest12: { max: maxchests12 },
				smallkey0: { max: document.getElementById('doorselect').value === 'C' ? 29 : 0 },
				smallkey1: { max: document.getElementById('doorselect').value === 'C' ? 29 : 1 },
				smallkey2: { max: document.getElementById('doorselect').value === 'C' ? 29 : 1 },
				smallkey3: { max: document.getElementById('doorselect').value === 'C' ? 29 : 6 },
				smallkey4: { max: document.getElementById('doorselect').value === 'C' ? 29 : 1 },
				smallkey5: { max: document.getElementById('doorselect').value === 'C' ? 29 : 3 },
				smallkey6: { max: document.getElementById('doorselect').value === 'C' ? 29 : 1 },
				smallkey7: { max: document.getElementById('doorselect').value === 'C' ? 29 : 2 },
				smallkey8: { max: document.getElementById('doorselect').value === 'C' ? 29 : 3 },
				smallkey9: { max: document.getElementById('doorselect').value === 'C' ? 29 : 4 },
				smallkey10: { max: document.getElementById('doorselect').value === 'C' ? 29 : 4 },
				smallkeyhalf0: { max: document.getElementById('doorselect').value === 'C' ? 29 : 1 },
				smallkeyhalf1: { max: document.getElementById('doorselect').value === 'C' ? 29 : 2 }
			});

			flags.doorshuffle = document.getElementById('doorselect').value;

			rightClickChest('chest0');
			toggle('chest0');
			rightClickChest('chest1');
			toggle('chest1');
			rightClickChest('chest2');
			toggle('chest2');
			rightClickChest('chest3');
			toggle('chest3');
			rightClickChest('chest4');
			toggle('chest4');
			rightClickChest('chest5');
			toggle('chest5');
			rightClickChest('chest6');
			toggle('chest6');
			rightClickChest('chest7');
			toggle('chest7');
			rightClickChest('chest8');
			toggle('chest8');
			rightClickChest('chest9');
			toggle('chest9');
			rightClickChest('chest10');
			toggle('chest10');
			rightClickChest('chest11');
			toggle('chest11');
			rightClickChest('chest12');
			toggle('chest12');
			
			if (!document.getElementById('shuffledmaps').checked) {
				for (var k = 0; k < 10; k++) {
					if (prizes[k] == 5) {
						prizes[k] = 0;
						document.getElementById('dungeonPrize'+k).className = 'prize-0';
					}
				}
			}
			
			if (!document.getElementById('shuffledcompasses').checked) {
				for (var k = 0; k < 10; k++) {
					if (enemizer[k] == 11) {
						enemizer[k] = 0;
						document.getElementById('dungeonEnemy'+k).className = 'enemizer-0';
					}
				}
			}
			
			if (!document.getElementById('shuffledbigkeys').checked) {
				if (!items.bigkey0) toggle('bigkey0');
				if (!items.bigkey1) toggle('bigkey1');
				if (!items.bigkey2) toggle('bigkey2');
				if (!items.bigkey3) toggle('bigkey3');
				if (!items.bigkey4) toggle('bigkey4');
				if (!items.bigkey5) toggle('bigkey5');
				if (!items.bigkey6) toggle('bigkey6');
				if (!items.bigkey7) toggle('bigkey7');
				if (!items.bigkey8) toggle('bigkey8');
				if (!items.bigkey9) toggle('bigkey9');
				if (!items.bigkey10) toggle('bigkey10');
				if (!items.bigkeyhalf0) toggle('bigkeyhalf0');
				if (!items.bigkeyhalf1) toggle('bigkeyhalf1');		
				document.getElementById('bigkey0').style.visibility = 'hidden';
				document.getElementById('bigkey1').style.visibility = 'hidden';
				document.getElementById('bigkey2').style.visibility = 'hidden';
				document.getElementById('bigkey3').style.visibility = 'hidden';
				document.getElementById('bigkey4').style.visibility = 'hidden';
				document.getElementById('bigkey5').style.visibility = 'hidden';
				document.getElementById('bigkey6').style.visibility = 'hidden';
				document.getElementById('bigkey7').style.visibility = 'hidden';
				document.getElementById('bigkey8').style.visibility = 'hidden';
				document.getElementById('bigkey9').style.visibility = 'hidden';
				document.getElementById('bigkey10').style.visibility = 'hidden';
				document.getElementById('bigkeyhalf0').style.visibility = 'hidden';
				document.getElementById('bigkeyhalf1').style.visibility = 'hidden';
			} else if (document.getElementById('shuffledbigkeys').checked != flags.wildbigkeys) {
				if (items.bigkey0) toggle('bigkey0');
				if (items.bigkey1) toggle('bigkey1');
				if (items.bigkey2) toggle('bigkey2');
				if (items.bigkey3) toggle('bigkey3');
				if (items.bigkey4) toggle('bigkey4');
				if (items.bigkey5) toggle('bigkey5');
				if (items.bigkey6) toggle('bigkey6');
				if (items.bigkey7) toggle('bigkey7');
				if (items.bigkey8) toggle('bigkey8');
				if (items.bigkey9) toggle('bigkey9');
				if (items.bigkey10) toggle('bigkey10');
				if (items.bigkeyhalf0) toggle('bigkeyhalf0');
				if (items.bigkeyhalf1) toggle('bigkeyhalf1');
				document.getElementById('bigkey0').style.visibility = 'visible';
				document.getElementById('bigkey1').style.visibility = 'visible';
				document.getElementById('bigkey2').style.visibility = 'visible';
				document.getElementById('bigkey3').style.visibility = 'visible';
				document.getElementById('bigkey4').style.visibility = 'visible';
				document.getElementById('bigkey5').style.visibility = 'visible';
				document.getElementById('bigkey6').style.visibility = 'visible';
				document.getElementById('bigkey7').style.visibility = 'visible';
				document.getElementById('bigkey8').style.visibility = 'visible';
				document.getElementById('bigkey9').style.visibility = 'visible';
				document.getElementById('bigkey10').style.visibility = 'visible';
				document.getElementById('bigkeyhalf0').style.visibility = document.getElementById('doorselect').value === 'C' ? 'visible' : 'hidden';
				document.getElementById('bigkeyhalf1').style.visibility = document.getElementById('doorselect').value === 'C' ? 'visible' : 'hidden';
			}
			
			if (document.getElementById('shuffledkeys').checked && flags.gametype != 'R') {
				if (!flags.wildkeys) {
					items.smallkey0 = 0;
					items.smallkey1 = 0;
					items.smallkey2 = 0;
					items.smallkey3 = 0;
					items.smallkey4 = 0;
					items.smallkey5 = 0;
					items.smallkey6 = 0;
					items.smallkey7 = 0;
					items.smallkey8 = 0;
					items.smallkey9 = 0;
					items.smallkey10 = 0;
					items.smallkeyhalf0 = 0;
					items.smallkeyhalf1 = 0;
				}
			} else {
				items.smallkey0 = document.getElementById('doorselect').value === 'C' ? 29 : 0;
				items.smallkey1 = document.getElementById('doorselect').value === 'C' ? 29 : 1;
				items.smallkey2 = document.getElementById('doorselect').value === 'C' ? 29 : 1;
				items.smallkey3 = document.getElementById('doorselect').value === 'C' ? 29 : 6;
				items.smallkey4 = document.getElementById('doorselect').value === 'C' ? 29 : 1;
				items.smallkey5 = document.getElementById('doorselect').value === 'C' ? 29 : 3;
				items.smallkey6 = document.getElementById('doorselect').value === 'C' ? 29 : 1;
				items.smallkey7 = document.getElementById('doorselect').value === 'C' ? 29 : 2;
				items.smallkey8 = document.getElementById('doorselect').value === 'C' ? 29 : 3;
				items.smallkey9 = document.getElementById('doorselect').value === 'C' ? 29 : 4;
				items.smallkey10 = document.getElementById('doorselect').value === 'C' ? 29 : 4;
				items.smallkeyhalf0 = document.getElementById('doorselect').value === 'C' ? 29 : 1;
				items.smallkeyhalf1 = document.getElementById('doorselect').value === 'C' ? 29 : 2;
			}
			
			if (adjustForCrossed && document.getElementById('doorselect').value != 'C') {
				items.smallkey0 = Math.min(items.smallkey0,0);
				items.smallkey1 = Math.min(items.smallkey1,1);
				items.smallkey2 = Math.min(items.smallkey2,1);
				items.smallkey3 = Math.min(items.smallkey3,6);
				items.smallkey4 = Math.min(items.smallkey4,1);
				items.smallkey5 = Math.min(items.smallkey5,3);
				items.smallkey6 = Math.min(items.smallkey6,1);
				items.smallkey7 = Math.min(items.smallkey7,2);
				items.smallkey8 = Math.min(items.smallkey8,3);
				items.smallkey9 = Math.min(items.smallkey9,4);
				items.smallkey10 = Math.min(items.smallkey10,4);
				items.smallkeyhalf0 = Math.min(items.smallkeyhalf0,1);
				items.smallkeyhalf1 = Math.min(items.smallkeyhalf1,2);
			}
			
			document.getElementById('smallkey0').innerHTML = items.smallkey0;
			document.getElementById('smallkey1').innerHTML = items.smallkey1;
			document.getElementById('smallkey2').innerHTML = items.smallkey2;
			document.getElementById('smallkey3').innerHTML = items.smallkey3;
			document.getElementById('smallkey4').innerHTML = items.smallkey4;
			document.getElementById('smallkey5').innerHTML = items.smallkey5;
			document.getElementById('smallkey6').innerHTML = items.smallkey6;
			document.getElementById('smallkey7').innerHTML = items.smallkey7;
			document.getElementById('smallkey8').innerHTML = items.smallkey8;
			document.getElementById('smallkey9').innerHTML = items.smallkey9;
			document.getElementById('smallkey10').innerHTML = items.smallkey10;
			document.getElementById('smallkeyhalf0').innerHTML = items.smallkeyhalf0;
			document.getElementById('smallkeyhalf1').innerHTML = items.smallkeyhalf1;
			
			//If small keys are not shuffled, hide the icons
			if (!document.getElementById('shuffledkeys').checked && flags.gametype != 'R') {
				document.getElementById('smallkey0').style.visibility = 'hidden';
				document.getElementById('smallkey1').style.visibility = 'hidden';
				document.getElementById('smallkey2').style.visibility = 'hidden';
				document.getElementById('smallkey3').style.visibility = 'hidden';
				document.getElementById('smallkey4').style.visibility = 'hidden';
				document.getElementById('smallkey5').style.visibility = 'hidden';
				document.getElementById('smallkey6').style.visibility = 'hidden';
				document.getElementById('smallkey7').style.visibility = 'hidden';
				document.getElementById('smallkey8').style.visibility = 'hidden';
				document.getElementById('smallkey9').style.visibility = 'hidden';
				document.getElementById('smallkey10').style.visibility = 'hidden';
				document.getElementById('smallhalfheader0').style.visibility = 'hidden';
				document.getElementById('smallkeyhalf0').style.visibility = 'hidden';
				document.getElementById('smallhalfheader1').style.visibility = 'hidden';
				document.getElementById('smallkeyhalf1').style.visibility = 'hidden';
			} else {
				document.getElementById('smallkey0').style.visibility = 'visible';
				document.getElementById('smallkey1').style.visibility = 'visible';
				document.getElementById('smallkey2').style.visibility = 'visible';
				document.getElementById('smallkey3').style.visibility = 'visible';
				document.getElementById('smallkey4').style.visibility = 'visible';
				document.getElementById('smallkey5').style.visibility = 'visible';
				document.getElementById('smallkey6').style.visibility = 'visible';
				document.getElementById('smallkey7').style.visibility = 'visible';
				document.getElementById('smallkey8').style.visibility = 'visible';
				document.getElementById('smallkey9').style.visibility = 'visible';
				document.getElementById('smallkey10').style.visibility = 'visible';
				document.getElementById('smallhalfheader0').style.visibility = 'visible';
				document.getElementById('smallkeyhalf0').style.visibility = 'visible';
				document.getElementById('smallhalfheader1').style.visibility = 'visible';
				document.getElementById('smallkeyhalf1').style.visibility = 'visible';
			}
			
			if (!document.getElementById('shuffledkeys').checked && !document.getElementById('shuffledbigkeys').checked && flags.gametype != 'R' && document.getElementById('doorselect').value != 'C') {
				document.getElementById('chest0').classList.add('large');
				document.getElementById("c0bkdiv").classList.add('hidden');
				document.getElementById("c0skdiv").classList.add('hidden');
				document.getElementById('chest1').classList.add('large');
				document.getElementById("c1bkdiv").classList.add('hidden');
				document.getElementById("c1skdiv").classList.add('hidden');
				document.getElementById('chest2').classList.add('large');
				document.getElementById("c2bkdiv").classList.add('hidden');
				document.getElementById("c2skdiv").classList.add('hidden');
				document.getElementById('chest3').classList.add('large');
				document.getElementById("c3bkdiv").classList.add('hidden');
				document.getElementById("c3skdiv").classList.add('hidden');
				document.getElementById('chest4').classList.add('large');
				document.getElementById("c4bkdiv").classList.add('hidden');
				document.getElementById("c4skdiv").classList.add('hidden');
				document.getElementById('chest5').classList.add('large');
				document.getElementById("c5bkdiv").classList.add('hidden');
				document.getElementById("c5skdiv").classList.add('hidden');
				document.getElementById('chest6').classList.add('large');
				document.getElementById("c6bkdiv").classList.add('hidden');
				document.getElementById("c6skdiv").classList.add('hidden');
				document.getElementById('chest7').classList.add('large');
				document.getElementById("c7bkdiv").classList.add('hidden');
				document.getElementById("c7skdiv").classList.add('hidden');
				document.getElementById('chest8').classList.add('large');
				document.getElementById("c8bkdiv").classList.add('hidden');
				document.getElementById("c8skdiv").classList.add('hidden');
				document.getElementById('chest9').classList.add('large');
				document.getElementById("c9bkdiv").classList.add('hidden');
				document.getElementById("c9skdiv").classList.add('hidden');
			} else {
				document.getElementById('chest0').classList.remove('large');
				document.getElementById("c0bkdiv").classList.remove('hidden');
				document.getElementById("c0skdiv").classList.remove('hidden');
				document.getElementById('chest1').classList.remove('large');
				document.getElementById("c1bkdiv").classList.remove('hidden');
				document.getElementById("c1skdiv").classList.remove('hidden');
				document.getElementById('chest2').classList.remove('large');
				document.getElementById("c2bkdiv").classList.remove('hidden');
				document.getElementById("c2skdiv").classList.remove('hidden');
				document.getElementById('chest3').classList.remove('large');
				document.getElementById("c3bkdiv").classList.remove('hidden');
				document.getElementById("c3skdiv").classList.remove('hidden');
				document.getElementById('chest4').classList.remove('large');
				document.getElementById("c4bkdiv").classList.remove('hidden');
				document.getElementById("c4skdiv").classList.remove('hidden');
				document.getElementById('chest5').classList.remove('large');
				document.getElementById("c5bkdiv").classList.remove('hidden');
				document.getElementById("c5skdiv").classList.remove('hidden');
				document.getElementById('chest6').classList.remove('large');
				document.getElementById("c6bkdiv").classList.remove('hidden');
				document.getElementById("c6skdiv").classList.remove('hidden');
				document.getElementById('chest7').classList.remove('large');
				document.getElementById("c7bkdiv").classList.remove('hidden');
				document.getElementById("c7skdiv").classList.remove('hidden');
				document.getElementById('chest8').classList.remove('large');
				document.getElementById("c8bkdiv").classList.remove('hidden');
				document.getElementById("c8skdiv").classList.remove('hidden');
				document.getElementById('chest9').classList.remove('large');
				document.getElementById("c9bkdiv").classList.remove('hidden');
				document.getElementById("c9skdiv").classList.remove('hidden');
			}
			
			flags.wildmaps = document.getElementById('shuffledmaps').checked;
			flags.wildcompasses = document.getElementById('shuffledcompasses').checked;
			flags.wildkeys = document.getElementById('shuffledkeys').checked;
			flags.wildbigkeys = document.getElementById('shuffledbigkeys').checked;
		}
		
		//Goal
		if (document.getElementById('goalselect').value != flags.goals) {
			document.getElementById('ganondiv').classList.remove('ganon');
			document.getElementById('ganondiv').classList.remove('pendants');
			document.getElementById('ganondiv').classList.remove('other');
			document.getElementById('ganondiv').classList.remove('alldungeons');
			
			switch (document.getElementById('goalselect').value) {
				case 'G':
				case 'F':
					if (flags.ganonvulncount === 8 || flags.goals === 'A') {
						document.getElementById('ganondiv').classList.add('ganon');
					} else {
						document.getElementById('ganondiv').classList.add('ganon' + flags.ganonvulncount);
					}
					break;
				case 'A':
					document.getElementById('ganondiv').classList.add('alldungeons');
					flags.ganonvulncount = 7;
					break;
				case 'P':
					document.getElementById('ganondiv').classList.add('pendants');
					flags.ganonvulncount = 8;
					break;
				case 'O':
					document.getElementById('ganondiv').classList.add('other');
					break;
			}
			
			flags.goals = document.getElementById('goalselect').value;
		}
		
		//Swords
		if (document.getElementById('swordselect').value != flags.swordmode) {
			if (document.getElementById('swordselect').value === "S") {
				while (items.sword != 0) {
					toggle('sword');
				}
			}
			flags.swordmode = document.getElementById('swordselect').value;
		}
		
		//Inverted Activated Flute
		if (document.getElementById('invertedactivatedflute').checked != flags.invertedactivatedflute) {
			flags.invertedactivatedflute = document.getElementById('invertedactivatedflute').checked;
		}

		//Overworld
		if (document.getElementById('overworldbox').checked != (flags.overworldshuffle != 'N')) {
			flags.overworldshuffle = document.getElementById('overworldbox').checked ? 'Y' : 'N';
			resetLogic = flags.overworldshuffle === 'N';
		}

		//Shopsanity
		if (document.getElementById('shopsanitybox').checked != (flags.shopsanity != 'N')) {
			flags.shopsanity = document.getElementById('shopsanitybox').checked ? 'Y' : 'N';
		}

		//Entrance
		if (document.getElementById('entranceselect').value != flags.entrancemode) {
			connectorIndex = [];
			connectorOne = [];
			connectorTwo = [];
			document.getElementById('connectorLineDiv').innerHTML = '';
			document.getElementById('informationDiv').innerHTML = '';
			flags.entrancemode = document.getElementById('entranceselect').value;
			loadStyleAndChests();
			resetChestFlags = resetLogic = false;
		}

		if (resetChestFlags) {
			connectorIndex = [];
			connectorOne = [];
			connectorTwo = [];
			document.getElementById('connectorLineDiv').innerHTML = '';
			document.getElementById('informationDiv').innerHTML = '';
			flags.entrancemode === 'N' ? loadChestFlagsItem() : loadChestFlagsEntrance();
			resetLogic = false;
		}

		if (resetLogic) {
			resetChestsKeepTrackedData();
		}

		updateLayout();
		updateMapTracker();
		
		if (flags.gametype === "S" && flags.entrancemode === 'N') {
			document.getElementById('locationMap2').classList.remove('unavailable');
			document.getElementById('locationMap56').classList.remove('unavailable');
			document.getElementById('locationMap58').classList.remove('unavailable');
			document.getElementById('locationMap2').classList.add('opened');
			document.getElementById('locationMap56').classList.add('opened');
			document.getElementById('locationMap58').classList.add('opened');
			chests[2].is_opened = true;
			chests[56].is_opened = true;
			chests[58].is_opened = true;
			if (flags.doorshuffle === 'N') {
				document.getElementById('locationMap57').classList.remove('unavailable');
				document.getElementById('locationMap63').classList.remove('unavailable');
				document.getElementById('locationMap57').classList.add('opened');
				document.getElementById('locationMap63').classList.add('opened');
				chests[57].is_opened = true;
				chests[63].is_opened = true;
			}
		}
		
		$('#flagsModal').hide();
	}
	
	function limit(delta, limits) {
        return function(item) {
            var value = items[item],
                max = limits[item].max,
                min = limits[item].min || 0;
            value += delta;
            if (value > max) value = min;
            if (value < min) value = max;
            return items[item] = value;
        };
    }

    window.updateLayout = function() {
		//Map layers
		document.getElementById("mapItemDiv").style.display = flags.entrancemode === 'N' ? "block" : "none";
		document.getElementById("mapEntranceDiv").style.display = flags.entrancemode === 'N' ? "none" : "block";
		
		//Hide HC and CT big keys if not needed
		document.getElementById('bigkeyhalf0').style.visibility = !flags.wildbigkeys || flags.doorshuffle != 'C' ? 'hidden' : 'visible';
		document.getElementById('bigkeyhalf1').style.visibility = !flags.wildbigkeys || flags.doorshuffle != 'C' ? 'hidden' : 'visible';
		
		//Hide HC and CT chests if neither Entrance nor Door Shuffle is on
		document.getElementById('agamagicsplitdiv').style.display = flags.entrancemode === 'N' && flags.doorshuffle === 'N' ? 'none' : 'block';
		document.getElementById('hcctchests').style.display = flags.entrancemode === 'N' && flags.doorshuffle === 'N' ? 'none' : 'block';
		document.getElementById('bighalfmagic').style.display = flags.entrancemode === 'N' && flags.doorshuffle === 'N' ? 'block' : 'none';
		document.getElementById('agasplitdiv').style.display = flags.entrancemode === 'N' && flags.doorshuffle === 'N' ? 'block' : 'none';
		if (!(flags.entrancemode === 'N' && flags.doorshuffle === 'N') && items.maxchest12 === 0) {
			rightClickChest('chest12');
			toggle('chest12');
		}
		
		//Show compasses for Crossed Door Shuffle
		if (flags.doorshuffle === 'C') {
			for(var k = 0; k < 10; k++)
				document.getElementById('c'+k+'skdiv').classList.add('withcompass');
			document.getElementById('gtdiv').classList.add('withcompass');
			document.getElementById('hcctchests').classList.add('withcompass');
		} else {
			for(var k = 0; k < 10; k++)
				document.getElementById('c'+k+'skdiv').classList.remove('withcompass');
			document.getElementById('gtdiv').classList.remove('withcompass');
			document.getElementById('hcctchests').classList.remove('withcompass');
		}

		//Moved locations in Inverted
		if (flags.entrancemode === 'N') {
			window.document.getElementById('locationMap1').style.visibility = 'inherit';
			if (flags.gametype === 'I') {
				document.getElementById('locationMap2').style.left = "77.4%";
				document.getElementById('locationMap65').style.left = "74.5%";
				document.getElementById('locationMap65').style.top = "5%";
				
				document.getElementById('locationMap66').style.left = "81.6%";
				document.getElementById('locationMap66').style.top = "5%";
				
				document.getElementById('bossMapAgahnim').style.left = "78%";
				document.getElementById('bossMapAgahnim').style.top = flags.mapmode === 'C' ? "5.5%" : "4.5%";
				document.getElementById('castle').style.left = "78%";
				document.getElementById('castle').style.top = flags.mapmode === 'C' ? "5.5%" : "4.5%";
				
				document.getElementById('bossMap10').style.left = "25%";
				document.getElementById('bossMap10').style.top = "52.5%";
				document.getElementById('dungeon10').style.left = "25%";
				document.getElementById('dungeon10').style.top = "52.5%";
				
				document.getElementById('bossMap12').style.left = "79.0%";
				document.getElementById('bossMap12').style.top = flags.mapmode === 'C' ? "7.2%" : "5.5%";
				document.getElementById('dungeon12').style.left = "79.0%";
				document.getElementById('dungeon12').style.top = flags.mapmode === 'C' ? "7.2%" : "5.5%";
			} else {
				document.getElementById('locationMap2').style.left = "27.4%";
				document.getElementById('locationMap65').style.left = "21.0%";
				document.getElementById('locationMap65').style.top = "52.6%";
				
				document.getElementById('locationMap66').style.left = "29.0%";
				document.getElementById('locationMap66').style.top = "52.6%";
				
				document.getElementById('bossMapAgahnim').style.left = "25.0%";
				document.getElementById('bossMapAgahnim').style.top = "52.6%";
				document.getElementById('castle').style.left = "25.0%";
				document.getElementById('castle').style.top = "52.6%";
				
				document.getElementById('bossMap10').style.left = "79.0%";
				document.getElementById('bossMap10').style.top = flags.mapmode === 'C' ? "7.2%" : "5.5%";
				document.getElementById('dungeon10').style.left = "79.0%";
				document.getElementById('dungeon10').style.top = flags.mapmode === 'C' ? "7.2%" : "5.5%";
				
				document.getElementById('bossMap12').style.left = "25%";
				document.getElementById('bossMap12').style.top = "52.5%";
				document.getElementById('dungeon12').style.left = "25%";
				document.getElementById('dungeon12').style.top = "52.5%";
			}
		}
		else
		{
			document.getElementById('locationMap2').style.left = "5%";
			if (flags.gametype === 'I') {
				window.document.getElementById('locationMap1').style.visibility = 'hidden';
				window.document.getElementById('entranceMap10').style.top = "40.0%";
				window.document.getElementById('entranceMap93').style.left = "25.7%";
				window.document.getElementById('entranceMap93').style.top = "43.0%";
				window.document.getElementById('entranceMap95').style.left = "23.2%";
				window.document.getElementById('entranceMap95').style.top = "44.0%";
			} else {
				window.document.getElementById('locationMap1').style.visibility = 'inherit';
				window.document.getElementById('entranceMap10').style.top = "42%";
				window.document.getElementById('entranceMap93').style.left = "75.7%";
				window.document.getElementById('entranceMap93').style.top = "42%";
				window.document.getElementById('entranceMap95').style.left = "72.4%";
				window.document.getElementById('entranceMap95').style.top = "50%";
			}
		}
		
		//Replace HC and CT overworld locations by dungeons if Door Shuffle is on
		document.getElementById('locationMap55').style.visibility = flags.doorshuffle != 'N' ? 'hidden' : 'visible';
		document.getElementById('locationMap57').style.visibility = flags.doorshuffle != 'N' ? 'hidden' : 'visible';
		document.getElementById('locationMap58').style.visibility = flags.doorshuffle != 'N' ? 'hidden' : 'visible';
		document.getElementById('locationMap63').style.visibility = flags.doorshuffle != 'N' ? 'hidden' : 'visible';
		document.getElementById('locationMap65').style.visibility = flags.doorshuffle != 'N' || (!flags.wildkeys && flags.gametype != 'R') ? 'hidden' : 'visible';
		document.getElementById('locationMap66').style.visibility = flags.doorshuffle != 'N' || (!flags.wildkeys && flags.gametype != 'R') ? 'hidden' : 'visible';
		document.getElementById('bossMapAgahnim').style.visibility = flags.doorshuffle != 'N' ? 'hidden' : 'visible';
		document.getElementById('castle').style.visibility = flags.doorshuffle != 'N' ? 'hidden' : 'visible';
		document.getElementById('bossMap11').style.visibility = flags.doorshuffle != 'N' ? 'visible' : 'hidden';
		document.getElementById('dungeon11').style.visibility = flags.doorshuffle != 'N' ? 'visible' : 'hidden';
		document.getElementById('bossMap12').style.visibility = flags.doorshuffle != 'N' ? 'visible' : 'hidden';
		document.getElementById('dungeon12').style.visibility = flags.doorshuffle != 'N' ? 'visible' : 'hidden';

		//Hide shops outside of Shopsanity
		for (var k = 67; k < 79; k++) {
			document.getElementById('locationMap'+k).style.visibility = flags.shopsanity === 'N' ? 'hidden' : 'visible';
		}
		document.getElementById('locationMap78').style.visibility = 'hidden';//Bomb Shop items not randomized yet
		
		document.getElementById('bombfloor').style.visibility = flags.doorshuffle != 'C' ? 'hidden' : 'visible';
		
		document.getElementById('mirrorscroll').style.visibility = flags.doorshuffle === 'N' ? 'hidden' : 'visible';
		
		document.getElementById('showpathsdiv').style.visibility = flags.doorshuffle === 'N' && flags.overworldshuffle === 'N' ? 'hidden' : 'visible';
	};

    window.loadStyleAndChests = function() {
		//Load stylesheet and logic depending on Entrance mode
		document.getElementById("mainstyle").href = "css/"+(flags.entrancemode === 'N' ? "" : "entrance")+"style.css?v="+buildString;
		if (flags.mapmode === 'C') {
			document.getElementById("maincompactstyle").href = "css/"+(flags.entrancemode === 'N' ? "" : "entrance")+"smallmap.css?v="+buildString;
		}
		flags.entrancemode === 'N' ? loadChestFlagsItem() : loadChestFlagsEntrance();
	};

    window.start = function() {
		loadStyleAndChests();

		//If spoiler mode, first show the modal to load the spoiler log
		if (flags.spoilermode === 'Y') {
			$('#spoilerModal').show();
		}
		
		defineEntranceTypes();
		document.getElementById('summaryFilter0').value = 'all';
		document.getElementById('summaryFilter1').value = 'knownconnectors';
		document.getElementById('summaryCleared0').checked = false;
		document.getElementById('summaryCleared1').checked = false;
		
		for (const a of ["unavailable","available","possible","information","darkavailable","darkpossible","partialavailable","opened"]) {
			constantFunctions[a] = ()=>a;
		}
		
		if (flags.opentower === 'R') {
			document.getElementById('crystalsdiv').classList.add('crystals');
			flags.opentowercount = 8;
		} else {
			document.getElementById('crystalsdiv').classList.add('crystals' + flags.opentowercount);
		}		
		
		switch (flags.goals) {
			case 'G':
			case 'F':
				if (flags.ganonvuln === 'R') {
					document.getElementById('ganondiv').classList.add('ganon');
					flags.ganonvulncount = 8;
				} else {
					document.getElementById('ganondiv').classList.add('ganon' + flags.ganonvulncount);
				}
				break;
			case 'A':
				document.getElementById('ganondiv').classList.add('alldungeons');
				break;
			case 'P':
				document.getElementById('ganondiv').classList.add('pendants');
				break;
			case 'O':
				document.getElementById('ganondiv').classList.add('other');
				break;
		}
		
		//Default the dungeon prizes and enemizer defaults
        for (var k = 0; k < dungeons.length; k++) {
            prizes[k] = 0;
			if (flags.bossshuffle === 'N') {
				enemizer[k] = k + 1;
			} else {
				enemizer[k] = 0;
			}
        }
		
		//Set the starting number of treasures
		document.getElementById('chest0').innerHTML = flags.doorshuffle === 'C' ? (items.chest0-1)+'+' : items.chest0;
		document.getElementById('chest1').innerHTML = flags.doorshuffle === 'C' ? (items.chest1-1)+'+' : items.chest1;
		document.getElementById('chest2').innerHTML = flags.doorshuffle === 'C' ? (items.chest2-1)+'+' : items.chest2;
		document.getElementById('chest3').innerHTML = flags.doorshuffle === 'C' ? (items.chest3-1)+'+' : items.chest3;
		document.getElementById('chest4').innerHTML = flags.doorshuffle === 'C' ? (items.chest4-1)+'+' : items.chest4;
		document.getElementById('chest5').innerHTML = flags.doorshuffle === 'C' ? (items.chest5-1)+'+' : items.chest5;
		document.getElementById('chest6').innerHTML = flags.doorshuffle === 'C' ? (items.chest6-1)+'+' : items.chest6;
		document.getElementById('chest7').innerHTML = flags.doorshuffle === 'C' ? (items.chest7-1)+'+' : items.chest7;
		document.getElementById('chest8').innerHTML = flags.doorshuffle === 'C' ? (items.chest8-1)+'+' : items.chest8;
		document.getElementById('chest9').innerHTML = flags.doorshuffle === 'C' ? (items.chest9-1)+'+' : items.chest9;
		document.getElementById('chest10').innerHTML = flags.doorshuffle === 'C' ? (items.chest10-1)+'+' : items.chest10;
		document.getElementById('chest11').innerHTML = flags.doorshuffle === 'C' ? (items.chest11-1)+'+' : items.chest11;
		document.getElementById('chest12').innerHTML = flags.doorshuffle === 'C' ? (items.chest12-1)+'+' : items.chest12;

		//If not enemizer, hide the enemizer switches
		if (flags.bossshuffle === 'N') {
			document.getElementById('dungeonEnemy0').style.visibility = 'hidden';
			document.getElementById('dungeonEnemy1').style.visibility = 'hidden';
			document.getElementById('dungeonEnemy2').style.visibility = 'hidden';
			document.getElementById('dungeonEnemy3').style.visibility = 'hidden';
			document.getElementById('dungeonEnemy4').style.visibility = 'hidden';
			document.getElementById('dungeonEnemy5').style.visibility = 'hidden';
			document.getElementById('dungeonEnemy6').style.visibility = 'hidden';
			document.getElementById('dungeonEnemy7').style.visibility = 'hidden';
			document.getElementById('dungeonEnemy8').style.visibility = 'hidden';
			document.getElementById('dungeonEnemy9').style.visibility = 'hidden';
		}

		//Hide map if not using
        if (flags.mapmode != 'N') {
            for (var k = 0; k < 79; k++) {
                document.getElementById('locationMap'+k).className = 'location ' + (k >= chests.length || chests[k].is_opened ? 'opened' : chests[k].is_available());
            }
			
			if (flags.mapmode === 'C') {				
				var modal = document.getElementById("entranceModal"),modalMain = document.getElementById("entranceModalMain");
				modal.style.width = "448px";
				modal.style.left = "0px";
				modalMain.style.width = "408px";
				modalMain.style.height = "600px";
				modalMain.style.left = "20px";
				modalMain.style.top = "36px";
			}
        } else {
            document.getElementById('app').classList.add('mapless');
            document.getElementById('map').style.display = 'none';
        }

		//If big keys are not shuffled, hide the icons
		if (!flags.wildbigkeys) {
			document.getElementById('bigkey0').style.visibility = 'hidden';
			document.getElementById('bigkey1').style.visibility = 'hidden';
			document.getElementById('bigkey2').style.visibility = 'hidden';
			document.getElementById('bigkey3').style.visibility = 'hidden';
			document.getElementById('bigkey4').style.visibility = 'hidden';
			document.getElementById('bigkey5').style.visibility = 'hidden';
			document.getElementById('bigkey6').style.visibility = 'hidden';
			document.getElementById('bigkey7').style.visibility = 'hidden';
			document.getElementById('bigkey8').style.visibility = 'hidden';
			document.getElementById('bigkey9').style.visibility = 'hidden';
			document.getElementById('bigkey10').style.visibility = 'hidden';
		}
		
		//If small keys are not shuffled, hide the icons
		if (!flags.wildkeys && flags.gametype != 'R') {
			document.getElementById('smallkey0').style.visibility = 'hidden';
			document.getElementById('smallkey1').style.visibility = 'hidden';
			document.getElementById('smallkey2').style.visibility = 'hidden';
			document.getElementById('smallkey3').style.visibility = 'hidden';
			document.getElementById('smallkey4').style.visibility = 'hidden';
			document.getElementById('smallkey5').style.visibility = 'hidden';
			document.getElementById('smallkey6').style.visibility = 'hidden';
			document.getElementById('smallkey7').style.visibility = 'hidden';
			document.getElementById('smallkey8').style.visibility = 'hidden';
			document.getElementById('smallkey9').style.visibility = 'hidden';
			document.getElementById('smallkey10').style.visibility = 'hidden';
			document.getElementById('smallhalfheader0').style.visibility = 'hidden';
			document.getElementById('smallkeyhalf0').style.visibility = 'hidden';
			document.getElementById('smallhalfheader1').style.visibility = 'hidden';
			document.getElementById('smallkeyhalf1').style.visibility = 'hidden';
		}
		
		//If all keys are not shuffled, change the chest styles
		if (!flags.wildkeys && !flags.wildbigkeys && flags.gametype != 'R' && flags.doorshuffle != 'C') {
			document.getElementById('chest0').classList.add('large');
			document.getElementById("c0bkdiv").classList.add('hidden');
			document.getElementById("c0skdiv").classList.add('hidden');
			document.getElementById('chest1').classList.add('large');
			document.getElementById("c1bkdiv").classList.add('hidden');
			document.getElementById("c1skdiv").classList.add('hidden');
			document.getElementById('chest2').classList.add('large');
			document.getElementById("c2bkdiv").classList.add('hidden');
			document.getElementById("c2skdiv").classList.add('hidden');
			document.getElementById('chest3').classList.add('large');
			document.getElementById("c3bkdiv").classList.add('hidden');
			document.getElementById("c3skdiv").classList.add('hidden');
			document.getElementById('chest4').classList.add('large');
			document.getElementById("c4bkdiv").classList.add('hidden');
			document.getElementById("c4skdiv").classList.add('hidden');
			document.getElementById('chest5').classList.add('large');
			document.getElementById("c5bkdiv").classList.add('hidden');
			document.getElementById("c5skdiv").classList.add('hidden');
			document.getElementById('chest6').classList.add('large');
			document.getElementById("c6bkdiv").classList.add('hidden');
			document.getElementById("c6skdiv").classList.add('hidden');
			document.getElementById('chest7').classList.add('large');
			document.getElementById("c7bkdiv").classList.add('hidden');
			document.getElementById("c7skdiv").classList.add('hidden');
			document.getElementById('chest8').classList.add('large');
			document.getElementById("c8bkdiv").classList.add('hidden');
			document.getElementById("c8skdiv").classList.add('hidden');
			document.getElementById('chest9').classList.add('large');
			document.getElementById("c9bkdiv").classList.add('hidden');
			document.getElementById("c9skdiv").classList.add('hidden');			
		}		
		
		//If game type is Retro, default the keys to max and decrement
		if (flags.gametype === 'R') {
			items.smallkey0 = flags.doorshuffle === 'C' ? 29 : 0;
			items.smallkey1 = flags.doorshuffle === 'C' ? 29 : 1;
			items.smallkey2 = flags.doorshuffle === 'C' ? 29 : 1;
			items.smallkey3 = flags.doorshuffle === 'C' ? 29 : 6;
			items.smallkey4 = flags.doorshuffle === 'C' ? 29 : 1;
			items.smallkey5 = flags.doorshuffle === 'C' ? 29 : 3;
			items.smallkey6 = flags.doorshuffle === 'C' ? 29 : 1;
			items.smallkey7 = flags.doorshuffle === 'C' ? 29 : 2;
			items.smallkey8 = flags.doorshuffle === 'C' ? 29 : 3;
			items.smallkey9 = flags.doorshuffle === 'C' ? 29 : 4;
			items.smallkey10 = flags.doorshuffle === 'C' ? 29 : 4;
			items.smallkeyhalf0 = flags.doorshuffle === 'C' ? 29 : 1;
			items.smallkeyhalf1 = flags.doorshuffle === 'C' ? 29 : 2;
			document.getElementById('smallkey0').innerHTML = items.smallkey0;
			document.getElementById('smallkey1').innerHTML = items.smallkey1;
			document.getElementById('smallkey2').innerHTML = items.smallkey2;
			document.getElementById('smallkey3').innerHTML = items.smallkey3;
			document.getElementById('smallkey4').innerHTML = items.smallkey4;
			document.getElementById('smallkey5').innerHTML = items.smallkey5;
			document.getElementById('smallkey6').innerHTML = items.smallkey6;
			document.getElementById('smallkey7').innerHTML = items.smallkey7;
			document.getElementById('smallkey8').innerHTML = items.smallkey8;
			document.getElementById('smallkey9').innerHTML = items.smallkey9;
			document.getElementById('smallkey10').innerHTML = items.smallkey10;
			document.getElementById('smallkeyhalf0').innerHTML = items.smallkeyhalf0;
			document.getElementById('smallkeyhalf1').innerHTML = items.smallkeyhalf1;
		}
		
		if (flags.spheresmode == 'N') {
			document.getElementById('spheres').style.visibility = 'hidden';
			document.getElementById('spheres').style.display = 'none';
			document.getElementById('app').classList.add('sphereless');
		} else {
			document.getElementById('spheres').style.visibility = 'visible';
		}
		
		if (flags.swordmode === 'A') {
			toggle('sword');
		}
		
		document.getElementsByClassName('tunic')[0].classList.add(flags.sprite);
		
		if (flags.mystery === 'N') {
			document.getElementById('changeflagsdiv').style.visibility = 'hidden';
		}

		window.addEventListener("message", receiveMessage, false);
		
		//if (flags.gametype != 'S') {
			toggle('bomb');
		//}
		
		for (var i = 0; i < 10; i++) {
			document.getElementById('bossMap' + i).classList.add('bossprize-0');
		}
		
		//If starting boots
		if (window.startingitems.charAt(0) === 'Y') {
			toggle('boots');
		}
		
		if (window.startingitems.charAt(1) === 'Y') {
			toggle('flute');
		}
		
		if (window.startingitems.charAt(2) === 'Y') {
			toggle('hookshot');
		}
		
		if (window.startingitems.charAt(3) === 'Y') {
			toggle('icerod');
		}
		
		if (flags.autotracking === 'Y') {
            autotrackConnect();
		}
		
		updateLayout();
		updateMapTracker();
		
    };
	
}(window));

(function (global) {

    if(typeof (global) === "undefined") {
        throw new Error("window is undefined");
    }

    var _hash = "!";
    var noBackPlease = function () {
        global.location.href += "#";

        // Making sure we have the fruit available for juice (^__^)
        global.setTimeout(function () {
            global.location.href += "!";
        }, 50);
    };

    global.onhashchange = function () {
        if (global.location.hash !== _hash) {
            global.location.hash = _hash;
        }
    };

    global.onload = function () {
        noBackPlease();

        // Disables backspace on page except on input fields and textarea..
        document.body.onkeydown = function (e) {
            var elm = e.target.nodeName.toLowerCase();
            if (e.which === 8 && (elm !== 'input' && elm  !== 'textarea')) {
                e.preventDefault();
            }
            // Stopping the event bubbling up the DOM tree...
            e.stopPropagation();
        };
    }
})(window);