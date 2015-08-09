$(function() {
  var visitialised = false;
  var ontology = $('#ontology_value').text();
  var versions = []
  var properties = [];
  var MAXLEVEL = 2; //Constant that represents the number of levels to show
  /*var margin = {top: 20, right: 120, bottom: 20, left: 120},
  width = 960 - margin.right - margin.left,
  height = 800 - margin.top - margin.bottom;*/
  
  var margin = {top: 20, right: 450, bottom: 20, left: 450},
  width = 960 - margin.right - margin.left,
  height = 600 - margin.top - margin.bottom;
  
  var i = 0,duration = 750, root;

  var tree = d3.layout.tree()
		.size([height, width]);
  var diagonal = d3.svg.diagonal()
		.projection(function(d) { return [d.y, d.x]; });

  var svg = d3.select("#infovis").append("svg")
		.attr("width", width + margin.right + margin.left)
		.attr("height", height + margin.top + margin.bottom)
	  .append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

 
  $( "#tabs" ).tabs();
  $( "#tabs" ).on( "tabsactivate", function( event, ui ) {
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
		initTree();
	 }//if
   });//tab
   
   /**
    * It updates the nodes in the visualization
    */
	function update(source) {
	  // Compute the new tree layout.
	  var nodes = tree.nodes(root).reverse(),
		  links = tree.links(nodes);

	  // Normalize for fixed-depth.
	  nodes.forEach(function(d) { d.y = d.depth * 180; });

	  // Update the nodes…
	  var node = svg.selectAll("g.node")
		  .data(nodes, function(d) { return d.id || (d.id = ++i); });

	  // Enter any new nodes at the parent's previous position.
	  var nodeEnter = node.enter().append("g")
		  .attr("class", "node")
		  .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
		  .on("click", click);

	  nodeEnter.append("circle")
		  .attr("r", 1e-6)
		  .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });
		  //.style("fill", function(d) { return d._children ? d.colour : "#fff"; });

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
		  .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });
		  //.style("fill", function(d) { return d._children ? d.colour : "#fff"; });

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
	  var link = svg.selectAll("path.link")
		  .data(links, function(d) { return d.target.id; });

	  // Enter any new links at the parent's previous position.
	  link.enter().insert("path", "g")
		  .attr("class", "link")
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
		d.children = d._children;
		d._children = null;
	  }
	  update(d);
	};
	
	/**
	 * This function checks the node level.
	 */ 
	function checkLevel(node){
	  if((node!=null)&&(typeof(node)!="undefined")){
		if((node.data["level"]!="undefined")&&(node.data["level"]<=MAXLEVEL)){
		  var newRoot = getRoot(node.data["owlClass"],node.name);
		  node.data["level"] = MAXLEVEL;
		  updateTree(node,MAXLEVEL-1); 
		}
	  }
	};

	/**
	 * This function update the tree
	 */
	 function updateTree(node,level){
		var def = $.Deferred();
		if(level==0){
		  var newRoot = getRoot(node.data["owlClass"],node.name);
		  getRecursiveClasses(newRoot,0,false).done(function(jsonTree){  
			if((jsonTree._children!=null)&&(jsonTree._children.length>0)){
			  node._children = [];
			  node._children = $.merge(node._children,jsonTree._children);
			  update(node);
			}
		  });
		  return(def.resolve(node));
		}
		if(node._children!=null){
		  node._children.forEach(function(child){
			child.data["level"] = MAXLEVEL;
			updateTree(child,level-1);
		  });
		}
		return(def.promise());
	 }
	 
	 /**
	 * This function gets the root of a tree. Basically it creates the root node using provided data. 
	 */
	function getRoot(owlClass,label){
		var root = null;
		if((owlClass!=null)&&(label!=null)){
			root = {};
			root["owlClass"] = owlClass;
			root["label"] = label;
		}
		return(root);
	};

	
   /**
	 * This function gets the root of a tree. 
	 */
	function getRoot(){
		var root = null
		var data ={};		
		data["label"] = "owl:Thing";
		data["owlClass"] = "<http://www.w3.org/2002/07/owl#Thing>";
		data["classURI"] = "http://www.w3.org/2002/07/owl#Thing";
		var root = buildNode(data,0,0);
		if((versions!==undefined)&&(versions.length>0)){
			root["versions"] = $.merge(root["versions"],versions.slice(1,versions.length-1));//Add all versions to the root class
		}		
		return(root);
	};   

	/**
	 * This function prints out recursevely the JSON structure.
	 */
	 function printJSON(node,level){
		console.log(node);
		if(typeof(node) === undefined){
			return;
		}
		var label = node.name;
		for(var i=0;i<level;i++){ label="\t"+label}
		console.log(label);
		$.each(node.children,function(index,child){
			printJSON(child,level+1);
		});
	 };
   
   /**
    * It provides the colour of each node.
    */
   function getColour(index){
	   	var numElements = $('.checkbox').length+1;//number of checkboxes and the actual version
		var grades = 360;
		var angle = Math.round(360/numElements)*index;
		return('hsl('+angle+',100%,50%)');
	};
	
	/**
	 * This function builds a node using provided data.
	 */
	function buildNode(data, level,index){
		var node = null
		if(data!=null){
			node = {};
			//node["id"] = data.classURI;
			node["name"] = data.label;
			node["data"] = {};
			node.data["owlClass"] = data.owlClass;
			node.data["level"] = MAXLEVEL - level;
			//collapse the nodes children = null and  _children = []
			node["children"] = null;
			node["_children"] = null;
			node["versions"] = []; //Array of versions that this node belongs
			node["properties"] = []; //Array of properties that this node has
			updateNodeInfo(node,index);
		}
		return(node);
	};
	
	function getAttribute(index){
		var attribute = null;
		var counter =0;		
		for(var i=0;i<versions.length;i++){
			if(versions[i]!=null){
				if(counter==index){
					attribute = {};
					attribute["index"] = i;
					attribute["attribute"] = versions[i];
					return(attribute);
				}
				counter++;								
			}
		}
		for(var j=0;j<properties.length;j++){
			if(properties[j]!=null){
				if(counter==index){
					attribute = {};
					attribute["index"] = j;
					attribute["attribute"] = properties[j];
					return(attribute);
				}
				counter++
			}
		}
		return(attribute);
	}
	
	function updateNodeInfo(node,index){
		if((index!=null)&&(index>=0)){
			var attribute = getAttribute(index);
			if(attribute!=null){
				if(isNaN(attribute["attribute"])){//it is a property
					node["properties"].push(attribute["attribute"]);
				}else{//it is a property					
					node["versions"].push(attribute["attribute"]);
				}
				node["colour"] = getColour(attribute["index"]);
			}
		}
		return(node);
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
		getRecursiveClasses(getRoot(),0,true).done(function(data){
			if(data!=null){
				console.log(data.children);
				root = data;
				root.x0 = height / 2;
				root.y0 = 0;
				if(root.children!=null){
					root.children.forEach(collapse);
				}
				update(root);
				d3.select(self.frameElement).style("height", "800px");
			}
		});
	}
	
   /**
    * It gets the subclases from a uriClass given.
    */
   function getSubClasses(owlClass,version,type,objectProperty){
	   if((type=='subeq')&&(objectProperty!=null)&&(label!=null)){
			console.log('/service/api/runQuery.groovy?type='+type+'&direct=true&query='+encodeURIComponent(objectProperty)+' SOME '+encodeURIComponent(owlClass)+'&ontology='+ontology+'&version='+version);
			return($.getJSON('/service/api/runQuery.groovy?type='+type+'&direct=true&query='+encodeURIComponent(objectProperty)+' SOME '+encodeURIComponent(owlClass)+'&ontology='+ontology+'&version='+version));
	   }else{
			console.log('/service/api/runQuery.groovy?type='+type+'&direct=true&query='+encodeURIComponent(owlClass)+'&ontology='+ontology+'&version='+version);
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
		if(level>=MAXLEVEL){			
			def.resolve(node);
			return(def.promise());
		}
		if(node!=null){
			var promises = [];
			var child;
			if((node["versions"]!=null)&&(node["versions"].length>0)){
				var version;
				var property;
				for(var i = 0; i<node["versions"].length;i++){//versions
					version = node["versions"][i];
					if(version!=null){
						var promise = getSubClasses(node.data["owlClass"],version,"subclass",null,null);
						promises.push(promise);
					}
				}
				for(var i = 0; i<node["versions"].length;i++){//versions
					version = node["versions"][i];
					if(version!=null){
						for(var j = 0; j<node["properties"].length;j++){//properties
							property = node["versions"][j];
							if(property!=null){
								var promise = getSubClasses(node.data["owlClass"],version,"subeq",property,node.id);
								promises.push(promise);
							}
						}
					}
				}
				$.when.apply($,promises).then(function(){
					if(arguments.length>0){
						$.each(arguments, function(index,queryResult){
								
							if((queryResult!=null)&&(queryResult.result!=null)){
							
								$.each(queryResult.result, function(childIndex,child){	
									if((child!=null)&&(typeof(child)!=="undefined")&&(!child.deprecated)){
										if((node.children!=null)&&(node.children.indexOf(child)>=0)){//Update the information in the node
											console.log("update information");
											var pos = node.children.indexOf(child); 								
											console.log("The node is going to be updated: "+node.label);
											node = updateNodeInfo(node.children[pos],index);
										}else{
											if(expand){								
												if(node.children == null){
												  node.children=[];
												}
												var newChild = buildNode(child,level,index);
												node.children.push(buildNode(child,level,index));
												node._children = null;
											}else{
												if(node._children == null){
												  node._children=[];
												}
												node._children.push(buildNode(child,level,index));
												node.children = null;
											}
										}								
									}
								});	
							}												
						});
					}
					//Once we have collected the children, after that we have to expand the next level
					console.log("node");
					console.log(node);
					$.each(node.children,function(index,child){						
						promises.push(getRecursiveClasses(child,level+1,expand));
					});
					$.when.apply($,promises).done(function(){
						def.resolve(node);	
					});
				});	
			}
		}
		return(def.promise());
	};
	//Get the object properties from the server.
	$.getJSON('/service/api/getObjectProperties.groovy?ontology='+ontology,function(jsonData,textStatus,jqXHR) {				
		if(jsonData!=null){
			$.each(jsonData,function(key,value){	
				$('#properties').append($("<option></option>")
			.attr("value",value)
			.text(key)); 			
			});
		}		
		versions = JSON.parse($('#num_versions').text())
				
		//Reset the selected options.
		$("select option").prop("selected", false)
		
		
		$('.multiselect').each(function(component){			
			$(this).multiselect();  
		});
		$('.checkbox').each(function(index){
			$(this).css('color',getColour(index+1));
		});
		$('#versions').change(function(){
			$('#versions option').each(function(index){
				if($(this).is(':checked')){
					//index = 0 is the actual version
					versions[index+1] = $(this).attr('value');
				}else{
					versions[index+1] = null;
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
});
