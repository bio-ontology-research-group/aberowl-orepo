$(function() {
	var visitialised = false;
	var ontology = $('#ontology_value').text();
	var versions = []
	var properties = [];
	var MAXDEPTHLEVEL = 2; //Constant that represents the number of depth levels to show
	var MAXBREADTHLEVEL = 2; //Constant that represent the numbers of breadth levels to show
	var MAXCHILDSTOSHOW = 6; //Constant that represents the numbers of nodes to show (it has to be more than MAXBREADTHLEVEL).
	var MAXINQUIRIES = 2; //Constant that represents the maximum numbers of querying that will be done per each level.

	var margin = {top: 20, right: 150, bottom: 20, left: 150},
		width = 960 - margin.right - margin.left,
		height = 600 - margin.top - margin.bottom;

	var i = 0,duration = 350, root;

	var tree = d3.layout.tree()
		.size([height, width]);
	var diagonal = d3.svg.diagonal()
		.projection(function(d) { return [d.y, d.x]; });

	function zoom() {
		svgGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
	}

	// define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
	var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3]).on("zoom", zoom);

	//define the tip where the node's information will be shown.
	var tip = d3.tip()
		.attr('class', 'd3-tip')
		.offset([-10, 0])
		.html(function(d) {
			return getNodeDescription(d);
		})


	var svg = d3.select("#infovis").append("svg")
		.attr("width", width + margin.right + margin.left)
		.attr("height", height + margin.top + margin.bottom)
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		.call(zoomListener)
		.call(tip);

	var svgGroup = svg.append("g");

	$( "#tabs" ).tabs();
	$( "#tabs" ).on( "tabsactivate", function( event, ui ) {
        $('#manchester_search').DataTable().draw();
        $('#ontology_search').DataTable().draw();
        $('#main_search').DataTable().draw();
		if(ui.newPanel.selector == '#pubmed') {
			var tree = $.jstree.reference('#left_tree');
			var selectedNodes = tree.get_selected(true);
			if(selectedNodes.length > 0) {
				$.each($('#pubmed_autocomplete_tagsinput .tag span'),function(e,i){ $('#pubmed_autocomplete').removeTag($(i).text().trim())});
				var name = selectedNodes[0].text;
				if(name.indexOf(' ') != -1) {
					name = '\'' + name + '\'';
				}
				$('#pubmed_autocomplete').addTag(name);
				uriMap[name] = selectedNodes[0].data;
			}
			$("#pubmed_button").click();
		} else if(ui.newPanel.selector == '#data') {
			var tree = $.jstree.reference('#left_tree');
			var selectedNodes = tree.get_selected(true);
			if(selectedNodes.length > 0) {
				$.each($('#data_autocomplete_tagsinput .tag span'),function(e,i){ $('#data_autocomplete').removeTag($(i).text().trim())});
				var name = selectedNodes[0].text;
				if(name.indexOf(' ') != -1) {
					name = '\'' + name + '\'';
				}
				$('#data_autocomplete').addTag(name);
				uriMap[name] = selectedNodes[0].data;
			}
			$("#data_button").click();
		} else if(ui.newPanel.selector == '#query') {
			var tree = $.jstree.reference('#left_tree');
			var selectedNodes = tree.get_selected(true);
			if(selectedNodes.length > 0) {
				$.each($('#autocomplete_tagsinput .tag span'),function(e,i){ $('#autocomplete').removeTag($(i).text().trim())});
				var name = selectedNodes[0].text;
				if(name.indexOf(' ') != -1) {
					name = '\'' + name + '\'';
				}
				$('#autocomplete').addTag(name);
				uriMap[name] = selectedNodes[0].data;
			}
		} else if(ui.newPanel.selector == '#sparql') {
			var tree = $.jstree.reference('#left_tree');
			var selectedNodes = tree.get_selected(true);
			if(selectedNodes.length > 0) {
				var name = selectedNodes[0].text;
				if(name.indexOf(' ') != -1) {
					name = '\'' + name + '\'';
				}
				$('#squery').val($('#squery').val().replace(/INSERT OWL HERE/, name));
			}
		} else if(ui.newPanel.selector == '#visualise' && !visitialised) {
			//Create a new ST instance
			visitialised = true;
			//Init the visualization
            if($('#loadstatus').text() == 'Classified') {
              initTree();
            }
		}//if
	});//tab

	/**
	 * It updates the nodes in the visualization
	 */
	function update(source) {

		// Compute the new tree layout.
		var nodes = tree.nodes(root).reverse(),
			links = tree.links(nodes);


		nodes.forEach(function(d){
			if(d.name==root.name){
				d.y = 0;
			}else if(d.parent){
				if(d.depth==1){
					d.y = 100 +	 (parseInt(d.parent["data"].maxLabelLength));
				}else {
					d.y = d.parent.y + 200 + (parseInt(d.parent["data"].maxLabelLength));
				}
			}else{//default configuration
				d.y = d.depth * 180;
			}
		});



		// Update the nodes…
		var node = svgGroup.selectAll("g.node")
			.data(nodes, function(d) { return d.id || (d.id = ++i); });

		// Enter any new nodes at the parent's previous position.
		var nodeEnter = node.enter().append("g")
			.attr("class", "node")
			.attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
			.on("click", click)
			.on('mouseover', tip.show)
			.on('mouseout', tip.hide);

		nodeEnter.append("circle")
			.attr("r", 1e-6)
			//.style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });
			.style("fill", function(d) { return d._children ? d.colour : d.leaf; })

		nodeEnter.append("text")
			.attr("x", function(d) { return d.children || d._children ? -10 : 10; })
			.attr("dy", ".35em")
			.attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
			.text(function(d) { return d.name; })
			.style("fill-opacity", 1e-6);

		// Transition nodes to their new position.
		var nodeUpdate = node.transition()
			.duration(duration)
			.attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

		nodeUpdate.select("circle")
			.attr("r", 4.5)
			//.style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });
			.style("stroke", function(d) { return "black"; })
			.style("fill", function(d) { return d._children ? d.colour : d.leaf; })

		nodeUpdate.select("text")
			.style("fill-opacity", 1);

		// Transition exiting nodes to the parent's new position.
		var nodeExit = node.exit().transition()
			.duration(duration)
			.attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
			.remove();

		nodeExit.select("circle")
			.attr("r", 1e-6);

		nodeExit.select("text")
			.style("fill-opacity", 1e-6);

		// Update the links…
		var link = svgGroup.selectAll("path.link")
			.data(links, function(d) { return d.target.id; });

		// Enter any new links at the parent's previous position.
		link.enter().insert("path", "g")
			.attr("class", "link")
			.style("stroke", function(link) { return link.target['edge'] ? link.target['edge'] : "lightgrey"; })
			.attr("d", function(d) {
				var o = {x: source.x0, y: source.y0};
				return diagonal({source: o, target: o});
			});

		// Transition links to their new position.
		link.transition()
			.duration(duration)
			.attr("d", diagonal);

		// Transition exiting nodes to the parent's new position.
		link.exit().transition()
			.duration(duration)
			.attr("d", function(d) {
				var o = {x: source.x, y: source.y};
				return diagonal({source: o, target: o});
			})
			.remove();

		// Stash the old positions for transition.
		nodes.forEach(function(d) {
			d.x0 = d.x;
			d.y0 = d.y;
		});
	}

	/**
	 * This function prints out recursevely the JSON structure.
	 */
	function printJSON(node,level){
		if(typeof(node) === undefined){
			return;
		}
		var label = node.name;
		for(var i=0;i<level;i++){ label="\t"+label}
		console.log(label);
		if(node.children!=null){
			$.each(node.children,function(index,child){
				printJSON(child,level+1);
			});
		}else{
			$.each(node._children,function(index,child){
				printJSON(child,level+1);
			});
		}
	}

	function buildFakeNode(name,min,max){
		var node = null;
		if(name!=null){
			node = {};
			node["name"] = name;
			node["data"] = {};
			node.data["min"] = min;
			node.data["max"] = max;
			node.data["level"] = MAXDEPTHLEVEL;
		}
		return(node);
	}

	function getNodeDescription(d) {
		var toolTipText = "";
		if(((d["versions"]!=undefined)&&(d["versions"]!=null))||((d["properties"]!==undefined)&&(d["properties"]!==null))){
			if(d["versions"].length>0){
				//We have to take into account the versions start by 0, so we have to add 1 to all versions
				toolTipText = "<strong> Versions: <strong/>";
				for(var i=0;i<d["versions"].length;i++){
					toolTipText = toolTipText+(parseInt(d["versions"][i])+1);
					if((d["versions"].length>1)&&(i<d["versions"].length-1)){
						toolTipText= toolTipText+', ';
					}
				}
				toolTipText += "<br />";
			}

			if(d["properties"].length>0){
				toolTipText = toolTipText+"  <strong>Properties: <strong/><br>&emsp;"+d["properties"].toString()+"<br />";
			}
			if(d.name) {
				toolTipText = toolTipText + "  <strong>Label: <strong/>"+ d.name +"<br />";
			}
			if((d.data)&&(d.data["owlClass"])) {
				toolTipText = toolTipText + "  <strong>Class IRI: <strong/><br/>&emsp; "+ encodeURI(d.data["owlClass"])+"<br />";
			}
			if(d.view){
				if(d.view["oboid"]){
					toolTipText = toolTipText + "  <strong>Obo Id: </strong><br/>&emsp;"+ encodeURI(d.view["oboid"])+"<br />";
				}
				if(d.view["definition"]){
					toolTipText = toolTipText + "  <strong>Definition: </strong><br/>&emsp;"+d.view["definition"]+"<br />";
				}
				if(d.view["synonym"]){
					toolTipText = toolTipText + "  <strong>Synonyms: <strong/><br/>";
					for(var i=0;i< d.view["synonym"].length;i++){
						toolTipText = toolTipText+"&emsp;"+d.view["synonym"][i]+"<br />";
					}
				}
			}
		}
		return(toolTipText);
	}

	function updateUpperNodes(parent,d){

		var index = d["data"].min - MAXCHILDSTOSHOW;

		if (index > 0) {
			$.merge(parent.children,parent._children.splice(index, (parent._children.length)));
			parent._children = $.merge([], $.merge(parent._children.splice(0,index),parent.children));
		} else {//index == 0 we insert at the begining
			parent._children = $.merge([], $.merge(parent.children, parent._children));
		}

		parent.children = []; //clean the visualizated children array


		var fakeNode = buildFakeNode("˅˅˅", d["data"].min - MAXCHILDSTOSHOW, d["data"].min); //We insert at the end of the list

		if (d["data"].max + MAXCHILDSTOSHOW < parent._children.length) {
			$.merge(parent.children, parent._children.splice(d["data"].min, MAXCHILDSTOSHOW));
			parent.children.unshift(buildFakeNode("˄˄˄", d["data"].max + 1, (d["data"].max + MAXCHILDSTOSHOW + 1)));
		} else {
			$.merge(parent.children, parent._children.splice(d["data"].min, parent._children.length - d["data"].max));
		}

		parent.children.push(fakeNode);

		update(parent);

	}


	/**
	 * Toggle children on click.
	 */
	function click(d) {
		checkLevel(d);
		if (d.children) {
			//collapse
			d._children = d.children;
			d.children = null;
		} else {
			//expand
			if((d._children!=null)&&(d._children.length>MAXCHILDSTOSHOW)){
				d.children = d._children.splice(0,MAXCHILDSTOSHOW);
				d.children.unshift(buildFakeNode("˄˄˄",MAXCHILDSTOSHOW,MAXCHILDSTOSHOW+MAXCHILDSTOSHOW));

			}else if((d.name==="˄˄˄")||(d.name==="˅˅˅")){

				if((d.parent!=null)&&(d.parent!==undefined)){
					var parent = d.parent;

					//Clean the fakes nodes
					for(var i=0;i<parent.children.length;i++){
						if((parent.children[i]!=null)&&((parent.children[i].name=="˄˄˄")||(parent.children[i].name=="˅˅˅"))){
							parent.children.splice(i,1);
							i--;
						}
					}

					if(d.name==="˄˄˄") {//max
						if ((parent._children.length - d["data"].max) < MAXCHILDSTOSHOW * MAXBREADTHLEVEL) {
							//We have to wait for the updating process ends.
							$.when(getRecursiveClasses(parent, 0, false)).done(function(jsonTree){
								updateUpperNodes(parent, d);
								return;
							});
						}else {
							updateUpperNodes(parent, d);
							return;
						}
					}else if(d.name==="˅˅˅"){//min

						var index = d["data"].max;

						if(index > parent._children.length){// we insert at the end
							$.merge(parent._children,parent.children);
						}else{//On the other case we have to mix them
							$.merge(parent.children,parent._children.splice(index, (parent._children.length)));
							parent._children = $.merge([], $.merge(parent._children.splice(0,index),parent.children));
						}

						parent.children = []; //clean the visualizated children array

						parent.children.push(buildFakeNode("˄˄˄",d["data"].max,d["data"].max+MAXCHILDSTOSHOW));

						if(d["data"].min-MAXCHILDSTOSHOW>0){
							$.merge(parent.children,parent._children.splice(d["data"].min,MAXCHILDSTOSHOW));
							parent.children.push(buildFakeNode("˅˅˅",d["data"].min-MAXCHILDSTOSHOW-1,d["data"].min-1));//We insert at the begining of the list

						}else{
							$.merge(parent.children,parent._children.splice(0,MAXCHILDSTOSHOW));
						}

						update(parent);
						return;
					}
				}
			}else{
				d.children = d._children;
				d._children = null;
			}
		}
		update(d);
	};

	/**
	 * This function checks the node level.
	 */
	function checkLevel(node){
		if((node!=null)&&(typeof(node)!="undefined")) {
			if ((node.data["level"] != "undefined") && (node.data["level"] <= MAXDEPTHLEVEL)) {
				var newRoot = getRoot(node.data["owlClass"], node.name);
				node.data["level"] = MAXDEPTHLEVEL;
				updateTree(node, MAXDEPTHLEVEL - 1);
			}
		}
	};

	/**
	 * This function update the tree
	 */
	function updateTree(node,level){
		var def = $.Deferred();
		if(level==0){
			getRecursiveClasses(node,0,false).then(function(jsonTree){
				update(node);
				def.resolve(node);
			});
			return(def.promise());
		}
		if(node._children!=null){
			node._children.forEach(function(child){
				child.data["level"] = MAXDEPTHLEVEL;
				updateTree(child,level-1);
			});
		}
		if(node.children!=null){
			node.children.forEach(function(child){
				child.data["level"] = MAXDEPTHLEVEL;
				updateTree(child,level-1);
			});
		}
		return(def.promise());
	}


	/**
	 * This function gets the root of a tree.
	 */
	function getRoot(){
		var root = null
		var data ={};
		data["id"] = "owlThing";
		data["label"] = "owl:Thing";
		data["owlClass"] = "<http://www.w3.org/2002/07/owl#Thing>";
		data["classURI"] = "http://www.w3.org/2002/07/owl#Thing";
		var root = buildNode(data,0,0);
		if((versions!==undefined)&&(versions.length>0)){
			for(var i=1;i<versions.length;i++){//We add others versions
				if(versions[i]!=null){
					root["versions"].push(versions[i]);
				}
			}
		}
		return(root);
	};

	/**
	 * It provides the colour of each node.
	 */
	function getColour(index){
		var numElements = $('.checkbox').length;
		var grades = 360;
		var angle = Math.round(360/numElements)*index;
		return('hsl('+angle+',100%,50%)');
	};

	/**
	 * This function builds a node using provided data.
	 */
	function buildNode(data, level,queryType){
		var node = null
		if(data!=null){
			node = {};
			node["name"] = data.label;
			node["data"] = {};
			node.data["owlClass"] = data.owlClass;
			node.data["level"] = MAXDEPTHLEVEL - level;
			node.data["indexChild"] = 0;
			node.data["indexQuery"] = 0;
			node.data["maxLabelLength"] = 0;
			node.data["moreChildren"] = true;
			//collapse the nodes children = null and  _children = []
			node["children"] = null;
			node["_children"] = null;
			node["versions"] = []; //Array of versions that this node belongs
			node["properties"] = []; //Array of properties that this node has
			//Info to visualize.
			node["view"]={};
			node.view["definition"] = null;
			node.view["oboid"] = null;
			node.view["synonym"] = null;
			if(data.definition) {
				node.view["definition"] = data.definition;
			}
			if(data.oboid) {
				if(Array.isArray(data.oboid)){
					node.view["oboid"] = data.oboid[0];
				}else {
					node.view["oboid"] = data.oboid;
				}
			}
			if(data.synonym) {
				node.view["synonym"] = data.synonym;
			}

			updateNodeInfo(node,queryType);
		}
		return(node);
	};


	/**
	 * This function updates the information (property/version) from given node.
	 */
	function updateNodeInfo(node,queryType){
		var indexVersion =-1;
		if((queryType!=null)&&(queryType!==undefined)){
			if(Array.isArray(queryType)&&(queryType.length==2)){//if queryType is an array that means that it is object property, othercase will be version
				indexVersion = queryType[0];
				var indexProperty = queryType[1];
				if(node["properties"].indexOf(properties[indexProperty])===-1){
					node["properties"].push(properties[indexProperty]);
				}
				if(node["edge"]===undefined){
					node["edge"] = getColour((versions.length+indexProperty));//to avoid the 0 position for the property vector
				}
			}else{
				indexVersion = queryType;
				if(node["versions"].indexOf(indexVersion)===-1){
					node["versions"].push(indexVersion);
				}
			}
			if(node["colour"]===undefined){
				node["colour"] = getColour(indexVersion);
				result = parseColour(node["colour"]);
				if(Array.isArray(result)&&(result.length==3)) {
					result[2] = parseFloat(result[2]) + 30;
					node["leaf"] = "hsl(" + result[0] + "," + result[1] + "," + result[2] + "%)";
				}
			}
		}
		return(node);
	}

	function parseColour(hslColour){
		regexp = /hsl\(\s*(\d+)\s*,\s*(\d+(?:\.\d+)?%)\s*,\s*(\d+(?:\.\d+)?%)\)/g;
		exec = regexp.exec(hslColour);
		if(exec!=null) {
			return(exec.slice(1));
		}
		//default white
		result = [];
		result[0]=360;
		result[1]=100;
		result[2]=100;
		return(result)
	}

	/**
	 *  This function collapses the subnodes of given
	 */
	var collapse =   function collapse(d) {
		if (d.children) {
			d._children = d.children;
			d._children.forEach(collapse);
			d.children = null;
		}
	}


	function initTree(){
		getRecursiveClasses(getRoot(),0,false).done(function(data){
			if(data!=null){
				root = data;
				root.x0 = height / 2;
				root.y0 = 0;
				update(root);
				click(root);
				d3.select(self.frameElement).style("height", "800px");
			}
		});
	}

	function isChildIncluded(node,child,index){
		if((node!=null)&&(child!=null)){
			if(node._children!=null){
				var subChild;
				for(var i=0;i<node._children.length;i++){
					subChild = node._children[i];
					if(subChild["data"].owlClass == child.owlClass){
						updateNodeInfo(subChild,index);
						return(true);
					}
				}
			}
			if(node.children!=null){
				var subChild;
				for(var i=0;i<node.children.length;i++){
					subChild = node.children[i];
					if(subChild["data"].owlClass == child.owlClass){
						updateNodeInfo(subChild,index);
						return(true);
					}
				}
			}
		}
		return(false)
	}

	/**
	 * It counts the number of children from a node given.
	 */
	function countChildren(node){
		var counter =0;
		if((node!=null)&&(node!=undefined)){
			if(node.children!=undefined){
				counter = counter + node.children.length;
			}
			if(node._children!=undefined){
				counter = counter + node._children.length;
			}
		}
		return(counter);
	}

	/**
	 * It gets the subclases from a uriClass given.
	 */
	function getSubClasses(owlClass,version,type,objectProperty){
		if((type=='subeq')&&(objectProperty!=null)){
			//console.log('/service/api/runQuery.groovy?type='+type+'&direct=true&query='+objectProperty+' SOME '+owlClass+'&ontology='+ontology+'&version='+version);
			return($.getJSON('/service/api/runQuery.groovy?type='+type+'&direct=true&query='+encodeURIComponent(objectProperty)+' SOME '+encodeURIComponent(owlClass)+'&ontology='+ontology+'&version='+version));
		}else{
			//console.log('/service/api/runQuery.groovy?type='+type+'&direct=true&query='+encodeURIComponent(owlClass)+'&ontology='+ontology+'&version='+version);
			return($.getJSON('/service/api/runQuery.groovy?type='+type+'&direct=true&query='+encodeURIComponent(owlClass)+'&ontology='+ontology+'&version='+version));
		}
	};

	/**
	 * This function implements a kind of Breadth-first search (BFS) to build the tree.
	 *
	 * listNodes: contains the expanded nodes.
	 * index: refers the index.
	 * node: the tree that is being built.
	 */
	function getRecursiveClasses(node,level,expand){
		var def = $.Deferred();
		if((level>=MAXDEPTHLEVEL)||(!node["data"].moreChildren)){
			def.resolve(node);
			return(def.promise());
		}
		if(node!=null){
			var promises = [];
			var child;
			if((node["versions"]!=null)&&(node["versions"].length>0)){
				var version;
				var property;
				var execQuery=[];
				var minQueryCounter = node["data"].indexQuery;
				var maxQueryCounter = node["data"].indexQuery+MAXINQUIRIES;
				var queryCounter =0;
				for(var i = 0; (i<node["versions"].length)&&(queryCounter<maxQueryCounter);i++){//versions
					version = node["versions"][i];
					if(version!=null){
						var promise = getSubClasses(node.data["owlClass"],version,"subclass",null);
						promises.push(promise);
						execQuery.push(version);
						queryCounter++;
						for(var j = 0; (j<properties.length)&&(queryCounter<maxQueryCounter);j++){//properties
							property = properties[j];
							if(property!=null){
								var promise = getSubClasses(node.data["owlClass"],version,"subeq",property);
								promises.push(promise);
								execQuery.push([version,j]);
								queryCounter++;
							}
						}
					}
				}
				$.when.apply($,promises).then(function(){
					if((arguments!=null)&&(arguments.length>0)){
						var executedIndexQuery =0;
						var counter = 0;
						var minIndex = node["data"].indexChild;
						var maxIndex = node["data"].indexChild+(MAXCHILDSTOSHOW*MAXBREADTHLEVEL);
						$.each(arguments, function(index,queryResult){
							if(Array.isArray(queryResult)){
								queryResult = queryResult[0];
							}
							if((queryResult!=null)&&(queryResult.result!=null)){
								var i = 0;
								if(countChildren(node) < maxIndex) {
									var child;
									for(i=0;((i<queryResult.result.length)&&(countChildren(node)<maxIndex));i++){
										child = queryResult.result[i];
										if(counter>=minIndex){
											if((child!=null)&&(typeof(child)!==undefined)&&(!child.deprecated)){
												if(!isChildIncluded(node,child,index)){
													if(expand){
														if(node.children == null){
															node.children=[];
														}
														node.children.push(buildNode(child,level,execQuery[index]));
														//node._children = null;
													}else{
														if(node._children == null){
															node._children=[];
														}
														node._children.push(buildNode(child,level,execQuery[index]));
														//node.children = null;
													}
													node["data"].maxLabelLength = Math.max(node["data"].maxLabelLength,child.label.length);
												}
											}
										}
										counter++;
									}
									if(queryResult.result.length==i){//This promise has done completely
										executedIndexQuery++;
									}
								}
							}
						});
						//Clean the array
						execQuery=[];
						//At the end we have to update the index
						if(countChildren(node)>node["data"].indexChild) {
							node["data"].indexChild = counter;
							//If the nodes is less than MAXCHILDSTOSHOW*MAXBREADTHLEVEL means that this iteration of the algorithm is not able to complete the level. There fore we could recursively force
							//the algorithm to execute new iterations in order to insert more nodes.
							if(executedIndexQuery===promises.length){
								node["data"].indexQuery = queryCounter;
							}else if((countChildren(node)%MAXCHILDSTOSHOW)!=0){//If this expression produce a number distinct from 0 means that the level is not completed.
								getRecursiveClasses(node, level, expand);
							}
						}else{//If the counter is more than indexChild does mean that this node has new children but if not means that all of children has been expanded  so we set the flag a false.
							node["data"].moreChildren = false;
						}

						//Once we have collected the children, after that we have to expand the next level
						var childrenPromises=[];
						if(node.children!=null){
							$.each(node.children, function (index, child) {
								if (child != null) {
									var promise = getRecursiveClasses(child, level + 1, expand);
									childrenPromises.push(promise);
								}
							});
						}
						if(node._children!=null){
							$.each(node._children,function(index,child){
								if(child!=null) {
									var promise = getRecursiveClasses(child, level + 1, expand);
									childrenPromises.push(promise);
								}
							});
						}
						if(childrenPromises.length>0){
							$.when.apply($,childrenPromises).done(function(){
								if((arguments!=null)&&(arguments.length>0)){
									$.each(arguments, function(index,queryResult) {
										if(Array.isArray(queryResult)){
											queryResult = queryResult[0];
										}
										if((queryResult!=null)&&(queryResult.result!=null)) {
											if(expand) {
												$.merge(node.children[index],queryResult.children);
												//node.children.push(queryResult);
											}else{
												$.merge(node._children[index],queryResult._children);
												//node._children.push(queryResult);
											}
										}
									});
								}
							});

						}
						def.resolve(node);
					}
				});
			}
		}
		return(def.promise());
	};

	//Get the object properties from the server.
	$.getJSON('/service/api/getObjectProperties.groovy?ontology='+ontology,function(jsonData,textStatus,jqXHR) {
		if((jsonData!=null)&&(jsonData!=undefined)){
			$.each(jsonData,function(key,value){
				$('#properties').append($("<option></option>")
					.attr("value",value)
					.text(key));
			});
		}
		versions = JSON.parse($('#num_versions').text());
		console.log(versions);

		//Reset the selected options.
		$("select option").prop("selected", false)
		$('#versions option:first').prop("selected",true);
		$('#versions option:first').prop("disabled","disabled");
		//$('#spinner').val(MAXCHILDSTOSHOW);
		$('#spinner').val(255);

		$('.multiselect').each(function(component){
			$(this).multiselect();
		});
		$('.checkbox').each(function(index){
			$(this).css('color',getColour(index));
		});
		$('#versions').change(function(){
			$('#versions option').each(function(index){
				if(index > 0){
					if($(this).is(':checked')){
						versions[index] = $(this).attr('value');
					}else{
						versions[index] = null;
					}
				}
			});
			console.log(versions.toSource());
			initTree();
		});
		$('#properties').change(function(){
			$('#properties option').each(function(index){
				if($(this).is(':checked')){
					properties[index] = $(this).attr('value');
				}else{
					properties[index] = null;
				}
			});
			console.log(properties.toSource());
			initTree();
		});
	});

	$('#spinner').change(function(){
		var value= $(this).val();
		if(!isNaN(value)){
			console.log(value);
			MAXCHILDSTOSHOW = new Number(value);
			initTree();
		}
	});

	$('#exportSVG').click(function(){

		//getBBox()
		//getBoundingClientRect()
		//First we have to relocate the tree,
		d3.select("#infovis").select("svg").select("g")
			.attr("transform", "translate(-10,0)").node();

		var width = d3.select("#infovis").select("svg").node().getBBox().width;

		var svgGraph = d3.select("#infovis").select("svg")
			.attr("width",width+300)
			.attr("version", 1.1)
			.attr("xmlns", "http://www.w3.org/2000/svg")
			.node();

		var serializer = new XMLSerializer();

		var xmlString = serializer.serializeToString(svgGraph);

		xmlString = xmlString.replace(/˄˄˄/g, '...');
		xmlString = xmlString.replace(/˅˅˅/g, '...');

		//Set the last width;
		d3.select("#infovis").select("svg")
			.attr("width",width);


		var imgsrc = 'data:image/svg+xml;base64,' + btoa(xmlString);

		var d = new Date();

		var a = document.createElement("a");
		a.href = imgsrc
		a.download = ontology + d.getTime() + ".svg";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);


	});
	$('#exportViz').click(function(){

		var root;
		//Search the root
		d3.selectAll(".node").filter(function(d){
			if(d.name=="owl:Thing"){
				root = d;
			}
		});

		if((root!=null)&&(root!=undefined)) {
			var svg = Viz("digraph { "+exportToGrapvhViz(root,'')+" }", "svg");

			var imgsrc = 'data:image/svg+xml;base64,'+ btoa(svg);
			var d = new Date();

			var a = document.createElement("a");
			a.href = imgsrc
			a.download = ontology+ d.getTime()+".xdot";
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		}

	});

	function exportToGrapvhViz(node,stGraph){
		if(node.children==null){
			return (stGraph);
		}
		stGraph= stGraph.concat(createGraphicVizDescription(node.name,node["colour"],node["leaf"]));
		$.each(node.children,function(index,child){
			var name = child.name;
			if((name=="˄˄˄")||(name=="˅˅˅")) {
				name = "...";
			}
			stGraph = stGraph.concat(createGraphicVizDescription(name,child["colour"],child["leaf"]));
			if(child["edge"]!=null){
				result = parseColour(child["edge"]);
				stGraph = stGraph.concat(' <' + node.name + '> -> <' + name + '> [color="' + result[0] + " " + parseFloat(result[1]) + " " + parseFloat(result[2]) + '"];');
			}else {
				stGraph = stGraph.concat(" <" + node.name + "> -> <" + name + ">; ");
			}

			if(name!="...") {
				stGraph = exportToGrapvhViz(child, stGraph);
			}

		});
		return(stGraph);
	};

	function createGraphicVizDescription(name,colour,leaf){
		var description ='';
		if((name!=null)&&((colour!=null)||(leaf!=null))){
			if(leaf!=null){
				result = parseColour(leaf);
			}else{
				result = parseColour(colour);
			}
			if(Array.isArray(result)&&(result.length==3)) {
				description = ' <' + name + '> [label=<"' + name + '">, shape="circle" style="filled" color="' + result[0] + " " + parseFloat(result[1]) + " " + parseFloat(result[2]) + '"];';
			}
		}
		return description;
	};
});

