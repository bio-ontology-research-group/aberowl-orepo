$(function() {
  var visitialised = false;
  $( "#tabs" ).tabs();
  $( "#tabs" ).on( "tabsactivate", function( event, ui ) {
    if(ui.newPanel.selector == '#visualise' && !visitialised) {
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
            height: 20,  
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
              var style = label.style;  
              label.id = node.id;  
              style.color = '#333';  
              style.fontSize = '0.8em';  
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
            console.log(nodeId);
            $.getJSON('/api/runQuery.groovy?type=subclass&direct=true&query=<'+encodeURIComponent(nodeId)+'>&ontology='+ontology, function(data ) {
              data = data.result;
              console.log(data);
              var level = {
                'id': nodeId,
                'children': []
              };

              $.each(data, function(i, c) {
                var node = {
                  'id': c.classURI,
                  'name': c.label
                };
                if(!node.name) node.name = c.remainder;
                level.children.push(node);
              });
              onComplete.onComplete(nodeId, level);    
          }); 
        }
      });  

      // Get the head 
      var ontology = $('#ontology_value').text();
      $.getJSON('/api/runQuery.groovy?type=subclass&direct=true&query=<http://www.w3.org/2002/07/owl%23Thing>&ontology='+ontology, function(data ) {
        data = data.result;
        console.log(data);
        var root = {
          'id': 'root',
          'name': 'Owl:Thing',
          'data': {},
          'children': []
        };
        $.each(data, function(i, c) {
          var node = {
            'id': c.classURI,
            'name': c.label
          };
          if(!node.name) node.name = c.remainder;
          root.children.push(node);
        });
        console.log(root);

        //load json data  
        st.loadJSON(root);  

        //compute node positions and layout  
        st.compute();  
        //optional: make a translation of the tree  
        st.geom.translate(new $jit.Complex(-200, 0), "current");  
        //Emulate a click on the root node.  
        st.onClick(st.root);  
      });
    } 
  });
});
