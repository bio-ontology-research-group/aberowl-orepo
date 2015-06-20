$(function() {
  var visitialised = false;
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
      var st = new $jit.ST({  
          'injectInto': 'infovis',  
          //add styles/shapes/colors  
          //to nodes and edges  
          levelsToShow: 5,
            
          //set overridable=true if you want  
          //to set styles for nodes individually   
          Node: {  
            overridable: true,  
            width: 200,  
            height: 25,  
            color: '#ccc'  
          },  
          //change the animation/transition effect  
          transition: $jit.Trans.Quart.easeOut,  
            
          onBeforeCompute: function(node){  
              console.log("loading " + node.name);  
          },  
            
          onAfterCompute: function(node){  
              console.log("done");  
          },  
        
          //This method is triggered on label  
          //creation. This means that for each node  
          //this method is triggered only once.  
          //This method is useful for adding event  
          //handlers to each node label.  
          onCreateLabel: function(label, node){  
              //add some styles to the node label  
              $('#wat').text(node.name);

              var style = label.style;  
              label.id = node.id;  
              style.color = '#333';  
              style.fontSize = '6';  
              style.textAlign = 'center';  
              style.height = "20px";  
              label.innerHTML = node.name;  
              //Delete the specified subtree   
              //when clicking on a label.  
              //Only apply this method for nodes  
              //in the first level of the tree.  
              if(node._depth > 0) {  
                  style.cursor = 'pointer';  
                  label.onclick = function() {  
                              st.onClick(node.id);  
                     
                };
              }
          },  
          //This method is triggered right before plotting a node.  
          //This method is useful for adding style   
          //to a node before it's being rendered.  
          onBeforePlotNode: function(node) {  
              if (node._depth > 0) {  
                  node.data.$color = '#f77';  
              }  
          },  

          request: function(nodeId, level, onComplete) {  
            var ontology = $('#ontology_value').text();
            reqId = nodeId.replace(/^vis#/, '');
            $.getJSON('/service/api/runQuery.groovy?type=subclass&direct=true&query=<'+encodeURIComponent(reqId)+'>&ontology='+ontology, function(data ) {
              data = data.result;
              var level = {
                'id': 'vis#' + nodeId,
                'children': []
              };

              $.each(data, function(i, c) {
                var node = {
                  'id': 'vis#' + c.classURI,
                  'name': c.label
                };
                if(!node.name) node.name = c.remainder;
                if(!node.name) node.name = c.classURI;
                if(!c.deprecated) {
                  level.children.push(node);
                }
              });

              onComplete.onComplete(nodeId, level);    
          }); 
        }
      });  

      // Get the head 
      var ontology = $('#ontology_value').text();
      $.getJSON('/service/api/runQuery.groovy?type=subclass&direct=true&query=<http://www.w3.org/2002/07/owl%23Thing>&ontology='+ontology, function(data ) {
        data = data.result;
        var root = {
          'id': 'vis#root',
          'name': 'Owl:Thing',
          'data': {},
          'children': []
        };
        $.each(data, function(i, c) {
          var node = {
            'id': 'vis#' + c.classURI,
            'name': c.label
          };
          if(!node.name) node.name = c.remainder;
          if(!node.name) node.name = c.classURI;
          if(!c.deprecated) {
            root.children.push(node);
          }
        });

        //load json data  
        st.loadJSON(root);  

        //compute node positions and layout  
        st.compute();  
        //optional: make a translation of the tree  
        //Emulate a click on the root node.  
        st.onClick(st.root);  
      });
    } 
  });
});
