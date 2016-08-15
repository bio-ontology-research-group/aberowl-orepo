var root = null;
var ontology = null;
var versions = []
var properties = [];
var MAXCHILDSTOSHOW = 6; //Constant that represents the numbers of nodes to show (it has to be more than MAXBREADTHLEVEL).
var MAXCHARTOSHOW = 30; // Constant that represents the number of characters that will be shown per label.
var margin = 0;
var weight = 0;
var height = 0;
var svg = null;
var g = null;
var container = null;
var renderer = null;
var nodeCounter =0;
var labelStyle = "font-weight: 300; font-family: \"Helvetica Neue\", Helvetica, Arial, sans-serf; font-size: 14px;" ;
var rendering = false;

/**
 * Init ghe SVG panel
 */
function initSVG() {
	//we reset the counter of nodes.
	if(root) {
		nodeCounter = root._children.length+1;
	}else{
		nodeCounter= 0;
	}

	margin = {top: 150, right: 60, bottom: 20, left: 150},
		width = 960 - margin.right - margin.left,
		height = 600 - margin.top - margin.bottom;

	g = new dagreD3.graphlib.Graph({multigraph:true})
		.setGraph({});
	g.graph().rankdir = "LR";

	//We clean the graph
	if (svg) {
		svg = d3.select("svg > g");
		svg.selectAll("*").remove();
	}else{
		svg = d3.select("#infovis").append("svg")
			.attr("width", width + margin.right + margin.left)
			.attr("height", height + margin.top + margin.bottom)
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")")

		container = svg.append("g")
			.attr("id",ontology) // we give an id in order to avoid NS_ERROR_FAILURE

	}

	// Set up zoom support
	var zoom = d3.behavior.zoom().on("zoom", function() {
		container.attr("transform", "translate(" + d3.event.translate + ")" +
			"scale(" + d3.event.scale + ")");
	});

	// Create the renderer
	renderer = new dagreD3.render();
	svg.call(zoom);
}


/**
 * Given a id, the function tries to expand the node.
 * @param nodeId
 */
function updateGraph(currentNode){
	if(currentNode) {
		//check id
		var findFlag=false;
		var parent = null;
		rendering = false;
		if(!g){
			initGraph();
		}
		g.nodes().forEach(function(idChild){
			var child = g.node(idChild);
			if((child)&&(currentNode.id.indexOf(child.data['owlClass'])!=-1)){
				//we found the child
				findFlag = true;
				click(child.id);
				return;
			}
			if((child)&&(currentNode.parent.indexOf(child.data['owlClass'])!=-1)){
				//we found the parent.
				parent = child;
			}
		});
		//we did not found the child, which means that it has still not been expanded..
		if((!findFlag)&&(parent)){
			findFlag = false;
			parent._children.forEach(function(child){
				var fakeNodeb = null;
				if(child.label==="˅˅˅"){
					fakeNode = child;
				}
				if(currentNode.id.indexOf(child.data['owlClass'])!=-1){
					if(fakeNode) {
						click(fakeNode.id);//to locate the node.
					}
					click(child.id);//to expand the selected node.
					findFlag = true;
					return;
				}
			});
			if(!findFlag){//if we do not find the node, then we expand its parent.
				click(parent.id);
			}
		}
	}
}

/**
 * Get a new id if the given owlClass does not belongs to a node which has been included in the graph.
 */
function getUniqueID(owlClass){
	if((owlClass)&&(g)){
		var id = null;
		g.nodes().forEach(function(idChild){
			var child = g.node(idChild);
			if(child.data["owlClass"]===owlClass){
				id = child.id;
				return;
			}
		})
		if(id){
			return(id);
		}
	}
	return(nodeCounter++)
}

/**
 * This function builds a node using provided data.
 */
function buildNode(data,queryType){
	var node = null
	if(data!=null){
		node = {};
		node["id"] = getUniqueID(data.owlClass);	//unique id.
		node["label"] = data.label;
		if(node["label"].length>MAXCHARTOSHOW){
			node["label"] = node["label"].substr(0,MAXCHARTOSHOW)+"...";
			node["label"] = node["label"].substr(0,MAXCHARTOSHOW)+"...";
		}
		node["data"] = {};
		node.data["label"] = data.label;
		node.data["owlClass"] = data.owlClass;
		//collapse the nodes children = null and  _children = []
		node["children"] = null;
		node["_children"] = null;
		node["versions"] = []; //Array of versions that this node belongs
		node["properties"] = []; //Array of properties that this node has

		//label style
		node["labelStyle"] = labelStyle;
		updateNodeInfo(node,queryType);
	}
	return(node);
};

/**
 * Build a fake node.
 * @param name represents the name of the fack node.
 * @param min is the min value that will be assigned to the node.
 * @param max is the max value that will be assigned to the node.
 * @returns {*} the fake node created.
 */
function buildFakeNode(idParent,name,min,max){
	var node = null;
	if(name!=null){
		node = {};
		node["id"] = getUniqueID(null); // unique id
		node["label"] = name;
		node["idParent"] = idParent;
		node["data"] = {};
		node.data["min"] = min;
		node.data["max"] = max;
		node.data["label"] = name;
		node.data["owlClass"] = name;

		//style
		node["style"] = "fill: hsl(0,100%,100%)";
		node["labelStyle"] = labelStyle
		node["edge"] = "hsl(0,0%,0%);";//black as a default
	}
	return(node);
}



/**
 * This function updates the information (property/version) from given node.
 * @param node node to update the information
 * @param queryType helps to distinguish if is a property/version
 * @return node represents the updated node
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
			if(node["edge"]===undefined){
				node["edge"] = "hsl(0,0%,0%);";//black as a default
			}
		}
		if(node["style"]===undefined){
			node["style"] = "fill: "+getColour(versions.indexOf(indexVersion))+";";
		}
	}
	return(node);
}

/**
 * Use regular expresion to extract the colours from hslstring
 * @param hslColour colour in hsl format
 * @returns {*}
 */
function parseColour(hslColour){
	var regexp = /hsl\(\s*(\d+)\s*,\s*(\d+(?:\.\d+)?%)\s*,\s*(\d+(?:\.\d+)?%)\)/g;
	var exec = regexp.exec(hslColour);
	if(exec!=null) {
		return(exec.slice(1));
	}
	//default white
	var result = [];
	result[0]=360;
	result[1]=100;
	result[2]=100;
	return(result)
}

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
 * It gets the subclases from a uriClass given.
 */
function getSubClasses(label,version,objectProperty){
	if(!objectProperty){
		objectProperty = '<http://www.w3.org/2000/01/rdf-schema#subClassOf>';
	}
	return($.getJSON('/service/api/runSparqlQuery.groovy?ontology='+ontology+
															'&version='+version+
															"&query="+encodeURIComponent(label)+
															"&objectProperty="+ encodeURIComponent(objectProperty)));
};

/**
 * Update the nodes in the visualization
 * @source represent the node that is going to be updated.
 */
function update(source) {
	g.setNode(source.id, source);
	if ((source.children) && (source.children.length > 0)) {//expand
		source.children.forEach(function (child) {
			g.setNode(child.id, child);
			g.setEdge(source.id, child.id, {
				lineInterpolate: 'basis',
				style: "stroke: " + child['edge'] + "; fill: none; stroke-width: 2px;",
				arrowheadStyle: "fill: " + child['edge'] + "; stroke-width: 1.5px;",
			});
		});
	} else if ((source._children) && (source._children.length > 0)) {//collapse
		source._children.forEach(function (child) {
			g.removeNode(child.id);
		});
	}

	//clean the graph of nodes which do not have no in-edges
	g.sources().forEach(function (child) {
		if (child != 0) {//to avoid the root node is deleted.
			g.removeNode(child);
		}
	});

	if (rendering) {
		renderer(container, g);
	}

	var node = svg.selectAll("g.node")
		.attr("class", "node")
		.on("click", click);

}

/**
 * It renders the graph
 */
function renderGraph(){
	rendering = true;
	if(!g){
		initGraph();
	}else {
		renderer(container, g);
	}
}


/**
 * Toggle children on click.
 */
function click(idNode) {
	var node = g.node(idNode);
	if(node) {
		if ((node.label === "˅˅˅")) {//go down
			var parent = g.node(node.idParent);
			parent.children.forEach(function (child) {
				g.removeNode(child.id);
			});
			parent.children = parent._children.slice(node["data"].min, node["data"].max + 1);
			update(parent);
		} else if (node.label === '˄˄˄') { // go up
			var parent = g.node(node.idParent);
			parent.children.forEach(function (child) {
				g.removeNode(child.id);
			});
			parent.children = parent._children.slice(node["data"].min, node["data"].max + 1);
			update(parent);
		} else if (node.children) {//collapse
			node.children = null;
			update(node);
		} else if (node._children) {//expand
			node.children = node._children.slice(0, MAXCHILDSTOSHOW + 1);
			update(node);
		} else { //there is no children, we update the graph..
			$.when(getRecursiveClasses(node)).done(function (jsonTree) {
				if (node._children) {
					node.children = node._children.slice(0, MAXCHILDSTOSHOW + 1);
					update(node);
				}
			});
		}
	}
}


/**
 * This function implements a kind of Breadth-first search (BFS) to build the tree.
 *
 * listNodes: contains the expanded nodes.
 * index: refers the index.
 * node: the tree that is being built.
 */
function getRecursiveClasses(node){
	var def = $.Deferred();
	if(node!=null){
		var promises = [];
		var child;
		if((node["versions"]!=null)&&(node["versions"].length>0)){
			var version;
			var property;
			var execQuery=[];
			for(var i = 0; i<node["versions"].length;i++){//versions
				version = node["versions"][i];
				if(version!=null) {
					var promise = getSubClasses(node.data["label"], version, null);
					promises.push(promise);
					execQuery.push(version);
				}
				for(var j = 0; j<properties.length;j++){//properties
					property = properties[j];
					if(property!=null){
						var promise = getSubClasses(node.data["label"], version, property);
						promises.push(promise);
						execQuery.push([version, j]);
					}
				}

			}
			$.when.apply($,promises).then(function(){
				if((arguments!=null)&&(arguments.length>0)){
					var executedIndexQuery =0;
					var minIndex = 0;
					var maxIndex = MAXCHILDSTOSHOW
					$.each(arguments, function(index,queryResult){
						if (Array.isArray(queryResult)) {
							queryResult = queryResult[0];
						}
						if ((queryResult != null) && (queryResult.result != null)) {
							var i = 0;
							var child;
							var size = queryResult.result.length;
							for (i = 0; (i < size); i++) {
								child = queryResult.result[i];
								if ((child != null) && (typeof(child) !== undefined) && (!child.deprecated)) {
									if (node._children == null) {
										node._children = [];
									}
									if((i>0)&&(i<size)&&(i%(MAXCHILDSTOSHOW)==0)){
										///we add 1 fake nodes
										if((i>0)&&(i<size)&&(i%(MAXCHILDSTOSHOW)==0)){
											node._children.push(buildFakeNode(node.id,"˅˅˅",maxIndex+1,maxIndex+MAXCHILDSTOSHOW+2));
											node._children.push(buildFakeNode(node.id,"˄˄˄",minIndex,maxIndex)); //go back
											minIndex = maxIndex+1;
											maxIndex = minIndex+1+MAXCHILDSTOSHOW
										}
									}
									node._children.push(buildNode(child, execQuery[index]));
									//node.children = null;
								}
							}

						}

					});
				}
				def.resolve(node);
			});
		}
	}
	return(def.promise());
};


/**
 * This function gets the root of a tree.
 */
function buildRoot(){
	var node = null;
	var data ={};
	data["label"] = "owl:Thing";
	data["owlClass"] = "<http://www.w3.org/2002/07/owl#Thing>"; 
	data["classURI"] = "http://www.w3.org/2002/07/owl#Thing";
	node = buildNode(data,versions[0]); //provide the first version
	if((versions!==undefined)&&(versions.length>0)){
		for(var i=1;i<versions.length;i++){//We add others versions
			if(versions[i]!=null){
				node["versions"].push(versions[i]);
			}
		}
	}
	getRecursiveClasses(node).done(function(data){
		if(data!=null){
			root = data;
			root.x0 = height / 2;
			root.y0 = 0;
		}
	});
};

/**
 * Init the graph.
 */
function initGraph(){
	if(root) {
		initSVG();
		update(root);
		if(!root.children) {
			click(root.id);
		}
		//d3.select(self.frameElement).style("height", "800px");
	}
}


/**
 * We initialize some variables.
 */
$(function(){

	ontology = 	$('#ontology_value').text();

	//We control if the list of the versions and the list of the properites have been changed for improving the performance.
	var changedList = false;

	$('#exportViz').click(toGraphViz);
	$('#exportSVG').click(toSVG);

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
	}).always(function(){

		//Reset the selected options.
		$("select option").prop("selected", false)
		$('#versions option:first').prop("selected",true);
		$('#versions option:first').prop("disabled","disabled");

		$('.multiselect').each(function(){
			$(this).multiselect({
				buttonWidth: '200px',
				onDropdownHide:function(event){
					//Thus, the tree will only be updated when some of the lists will be updated.
					if(changedList){
						initGraph();
						changedList = false;
					}
				}
			});
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
			changedList = true;
		});


		$('#properties').change(function(){
			$('#properties option').each(function(index){
				if($(this).is(':checked')){
					properties[index] = $(this).attr('value');
				}else{
					properties[index] = null;
				}
			});
			changedList = true;
		});

		$('#numclass').keypress(function(e) {
			/* This will be fired when the return key is pressed. */
			if(e.which == 13) {
				var value = $(this).val();
				if (!isNaN(value)) {
					value = new Number(value);
					if(value!= MAXCHILDSTOSHOW) {
						MAXCHILDSTOSHOW = value;
						initGraph();
					}
				}
			}
		});

		$('#numclass').val(8);
		MAXCHILDSTOSHOW = new Number(8);

		buildRoot(); // we build the root node

	});
});


///////////////////////////// GRAPHS TRANSFORMATION

function toSVG(){


	var svgGraph = d3.select("#infovis").select("svg")
		.attr("title", ontology)
		.attr("version", 1.1)
		.attr("xmlns", "http://www.w3.org/2000/svg").node()

	var serializer = new XMLSerializer();

	var xmlString = serializer.serializeToString(svgGraph);

	xmlString = xmlString.replace(/˄˄˄/g, '...');
	xmlString = xmlString.replace(/˅˅˅/g, '...');


	var imgsrc = 'data:image/svg+xml;base64,' + btoa(xmlString);

	var d = new Date();

	var a = document.createElement("a");
	a.href = imgsrc
	a.download = ontology + d.getTime() + ".svg";
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

function toGraphViz(){
	if((g!=null)&&(g!=undefined)) {
		var stGraph = "digraph { \n";
		g.nodes().forEach(function (idNode){
			var node = g.node(idNode);
			var name = node.label;
			if((name=="˄˄˄")||(name=="˅˅˅")) {
				name = "...";
			}
			var regColor = parseColour(node["style"]);
			stGraph = stGraph.concat(' ' + idNode + ' [label=<' + name + '>, shape="box" style="filled" fillcolor="'+regColor[0]+' '+regColor[1].replace('%','')+' '+regColor[2].replace('%','')+'" ] \n');
		});

		g.edges().forEach(function (edge){
			var dest = g.node(edge["w"]);
			var regColor = parseColour(dest['edge']);
			stGraph = stGraph.concat(' ' + edge["v"] + ' -> ' + edge["w"] + ' [ color="'+regColor[0]+' '+regColor[1].replace('%','')+' '+regColor[2].replace('%','')+'"  ] \n');
		});
		stGraph += "\n } ";

		var imgsrc = 'data:image/svg+xml;base64,'+ btoa(stGraph);
		var d = new Date();

		var a = document.createElement("a");
		a.href = imgsrc
		a.download = ontology+ d.getTime()+".dot";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}
}
