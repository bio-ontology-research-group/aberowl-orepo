$(function() {
  var visitialised = false;
  var ontology = $('#ontology_value').text();
  var versions = []
  var properties = [];
  var st;
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
		root = buildTree(null,null);
		d3.select(self.frameElement).style("height", "800px");
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
		  $.when(getRecursiveSubClasses(newRoot,0,false)).done(function(jsonTree){  
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
    * It gets the subclases from a uriClass given.
    */
   function getSubClasses(uriClass,ontology,version,type,objectProperty,label){
	   if((type=='subeq')&&(objectProperty!=null)&&(label!=null)){
			console.log('/service/api/runQuery.groovy?type='+type+'&direct=true&query='+uriClass+' SOME '+label+'&ontology='+ontology+'&version='+version);
			return($.getJSON('/service/api/runQuery.groovy?type='+type+'&direct=true&query='+uriClass+' SOME '+label+'&ontology='+ontology+'&version='+version));
	   }else{
			console.log('/service/api/runQuery.groovy?type='+type+'&direct=true&query='+uriClass+'&ontology='+ontology+'&version='+version);
			return($.getJSON('/service/api/runQuery.groovy?type='+type+'&direct=true&query='+uriClass+'&ontology='+ontology+'&version='+version));
		}
   };
   /**
    * It provides the colour of each node.
    */
   function getColor(index){
	   	var numElements = $('.checkbox').length+1;//number of checkboxes and the actual version
		var grades = 360;
		var angle = Math.round(360/numElements)*index;
		return('hsl('+angle+',100%,50%)');
	};
	
	/**
	 * This function builds a node using provided data.
	 */
	function buildNode(data, level){
		var node = null
		if(data!=null){
			node = {};
			node["name"] = data.label;
			node["data"] = {};
			node.data["owlClass"] = data.owlClass;
			node.data["level"] = MAXLEVEL - level;
			//collapse the nodes children = null and  _children = []
			node["children"] = null;
			node["_children"] = null;
			node["versions"] = []; //Array of versions that this node belongs
			node["properties"] = []; //Array of properties that this node has
		}
		return(node);
	};
	
	/**
	 * Create the tree.
	 */
	function buildTree(node,colorIndex){
		var reset = false;
		var def = $.Deferred();
		if(node==null){
			reset = true;
			var owlClass = "<http://www.w3.org/2002/07/owl#Thing>";
			var label = "owlThing";
			var root = getRoot(owlClass,label);
		}
		//At least, we will have one version (the actual version) but the vector is checked. 	
		if((versions!=null)&&(versions.length>0)){
			var index = versions.length;
			//node['children'] = []; 
			$.when(getSubClasses(node.data['$owlClass'],ontology,versions.length-1,'subclass',null,null)).then(function(jsonData,textStatus,jqXHR ) {		
				if(jsonData.result!=null){
					//We include all children
					$.each(jsonData.result,function(index,child){
						//the version is the colorIndex,
						if(!child.deprecated){
							node.children.push(buildNode(child,node.data['$version']));		
						}				
					});					 
					var promises = [];
					//Versions
					for(var index = versions.length-2; index>=0; index--){
						if(versions[index]!=null){
							var promise = getSubClasses(node.data['$owlClass'],ontology,versions[index],'subclass',null,null);
							promises.push(promise);								
						}
					}
					//Properties
					if(node.id!='root'){
						for (var i = 0;i<properties.length;i++){						
							if(properties[i]!=null){
								for(var j = versions.length-1; j>=0; j--){
									if(versions[j]!=null){
										var promise = getSubClasses(node.data['$owlClass'],ontology,versions[j],'subeq',properties[i],node.name);
										promises.push(promise);	
									}
								}
							}					
						}
					}
					
					$.when.apply($,promises).then(function(){
						if(arguments.length>0){
							$.each(arguments,function(promiseIndex,subtree){
								var colorIndex = -1;
								var counter = 0;
								//Searching in the versions vector.
								//We do not search at the last position because it is the actual
								if(promiseIndex<(versions.length-2)){
									for(var i=0,counter=0; i<versions.length-2;i++){
										if(versions[i]!=null){
											counter++;
											if(counter==promiseIndex){
												colorIndex= counter;
												break;
											}
										}

									}
								}
								//Searching in the properties vector.
								if(colorIndex>=0){
									for(var i=0; i < properties.length-1; j++){
										if(properties[i]!=null){
											counter++
											if(counter==promiseIndex){
												colorIndex = counter;
												break;
											}
										}									
									}
								}
								
								$.each(subtree.result,function(index,child){
									console.log('child is already included'+jQuery.inArray(child,jsonData.result));
									if(jQuery.inArray(child,jsonData.result)<0){//The child is not contained
										if(!child.deprecated){
											node.children.push(buildNode(child,colorIndex,level));
										}
									}
									
								});
							});
						}
					});
				}			
			}).done(function(){
				if(reset){
					console.log(node)
					root = node;
					root.x0 = height / 2;
					root.y0 = 0;		  
					function collapse(d) {
						if (d.children) {
							d._children = d.children;
							d._children.forEach(collapse);
							d.children = null;
						}
					}	  
					root.children.forEach(collapse);
					update(root);
				}else{

				}
				def.resolve(node);								
			});				
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
			//Save the color for the actual version
			if(index>=versions.length){
				index++;
			}
			var color = getColor(index);
			$(this).css('color',color);
			//reset the properties choosen	
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
			//buildTree(null);
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
			//buildTree(null);
		});	
  });
});
