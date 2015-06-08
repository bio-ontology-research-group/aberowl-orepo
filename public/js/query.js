var uriMap = {};
var examples = [
  {
    'text': [ '\'venctricular septal defect\'' ],
    'uri': [ 'http://purl.obolibrary.org/obo/HP_0001629' ]
  },
  {
    'text': [ 'develops_from', 'SOME', '\'stem ctell\'' ],
    'uri': [ 'http://purl.obolibrary.org/obo/RO_0002202', 'SOME', 'http://purl.obolibrary.org/obo/CL_0000034' ]
  },
  { 
    'text': ['part of', 'SOME', 'apoptotic process', 'AND', 'regulates', 'SOME', 'apoptotic process' ],
    'uri': [ 'http://purl.obolibrary.org/obo/BFO_0000050', 'SOME', "http://purl.obolibrary.org/obo/GO_0006915", "AND", "http://purl.obolibrary.org/obo/RO_0002211", 'SOME', 'http://purl.obolibrary.org/obo/GO_0006915' ]
  },
  {
    'text': ['has_part', 'SOME', 'alcohol'],
    'uri': [ 'http://purl.obolibrary.org/obo/chebi#BFO_0000051', 'SOME', 'http://purl.obolibrary.org/obo/CHEBI_30879' ]
  }
];

function addExample(i) {
  clearTags();
  $.each(examples[i].text, function(a, y) {
    $('#autocomplete').addTag(y); 
    uriMap[y] = examples[i].uri[a];
  });
}

$(document).keypress(function(event){
  var keycode = (event.keyCode ? event.keyCode : event.which);
  if(keycode == '13'){
    $("#button").click();
  }
});

function redrawTable() {
    //var query = $('#autocomplete').value();
    var query = $.map($('#autocomplete_tagsinput .tag span'),function(e,i){var x = uriMap[$(e).text().trim()]; if(x != 'AND' && x != 'SOME'){ x='<'+x+'>'; } return x;}).join(' ');

    $('#example').dataTable().fnDestroy();
    var qType = $('input[name="type"]:checked').val();
    var ontology = $("#ontology").text();

    var table = $('#example').dataTable( {
        "processing": false,
        "serverSide": false,
	"paging": true,
	"scrollY": 400,
	"renderer": "bootstrap",
	"aaSorting": [[ 1, "asc" ]],
	"bAutoWidth": false,
	"iDisplayLength": 50,
	"bJQueryUI": true,
	aoColumns : [
	    { "sWidth": "15%"},
	    { "sWidth": "15%"},
	    { "sWidth": "30%"},
	    { "sWidth": "40%"},
	],
	"fnInitComplete": function( oSettings ) {
	    $('#pubmed').attr('href', "/aber-owl/pubmed/?type="+qType+"&owlquery="+encodeURIComponent(query)+"&ontology="+ontology);
	    $('#pubmed').show();                                                                                                         
	    $('#sparql').attr('href', "/aber-owl/sparql/?type="+qType+"&query="+encodeURIComponent(query)+"&ontology="+ontology);
	    $('#sparql').show();
        },
        "ajax": {
            "url": "/service/api/runQuery.groovy?type="+qType+"&query="+encodeURIComponent(query.trim())+"&ontology="+ontology,
	    "dataType": 'json',
            "dataSrc": function ( json ) {
                var datatable = new Array();
		$('#timer').text("Query took " + json.time + 'ms');
		result = json.result;

                for ( var i=0, ien=result.length ; i<ien ; i++ ) {
                    datatable[i] = new Array() ;
                    datatable[i][0] = "<a href='"+result[i].classURI+"'>"+result[i].classURI+"</a>" ;
                    datatable[i][1] = "<a href='"+result[i].ontologyURI+"'>"+result[i].ontologyURI+"</a>" ;
                    datatable[i][2] = result[i].label || " " ;
                    datatable[i][3] = result[i].definition || " " ;
                }
                return datatable;
            }
        },
	"dom": 'T<"clear">lfrtip',
	"tableTools": {
            "sSwfPath": "js/TableTools-2.0.0/media/swf/copy_csv_xls_pdf.swf"
        }
    } );
};

function clearTags() {
  $.each($('#autocomplete_tagsinput .tag span'),function(i,e){ $('#autocomplete').removeTag($(e).text().trim()); });
}

$(document).ready(function() {
  $('#example').dataTable( {
      "processing": false,
      "serverSide": false,
      "paging": true,
      "scrollY": 400,
      aoColumns : [
          { "sWidth": "15%"},
          { "sWidth": "15%"},
          { "sWidth": "30%"},
          { "sWidth": "40%"},
      ]
  })
    
  var q = window.location.hash.replace("#","");
  if (q!=null && q.length>0) {
          query = q ;
          redrawTable();
  }

  $( "#button" ).button();

  $('#autocomplete').tagsInput({
    'height': '40px',
    'width': '100%',
    'defaultText': '',
    'delimiter': '|',
    'autocomplete_url': '',
    'unique': false,
    'autocomplete': {
      'source': function(request, response) {
        var ontology = $("#ontology").text(),
            query = extractLast(request.term);

        $.getJSON("/service/api/queryNames.groovy", {
            term: query,
            ontology: ontology
        }, function(json) {
          if(query.match(/an/)) {
            json.unshift({
              'data': 'AND',
              'iri': 'AND',
              'ontology': '',
              'value': 'AND'
            }); 
          } else if(query.match(/so/)) {
            json.unshift({
              'data': 'SOME',
              'iri': 'SOME',
              'ontology': '',
              'value': 'SOME'
            });
          }
          response(json);
        });
      },
      'select': function(event, ui) {
        uriMap[ui.item.value] = ui.item.data;
        console.log(uriMap);
      }
    }, 
    'autocomplete_renderitem': function(ul, item) {
      var label = item.first_label || item.label || item.remainder || item.classURI;
      return $( "<li>" )
             .append( "<p>" + label +"</p> <p> <span style=\"float:left;font-size:9px\">" + item.iri + "</span>"+
              "<span style=\"font-size:9px;margin-left:20px;float:right;\"><b>"+item.ontology+"</b></span></p><br />"+
              "<span style='font-size:10px;color:#00B7FF;' onclick=\"window.location.href='/ontology/"+item.ontology+"/?c="+encodeURIComponent(item.iri)+"';\">[View in Ontology Browser]</a>")
             .appendTo(ul);
     },
     'onRemoveTag': function(value) {
        delete uriMap[value];
     },
     'onAddTag': function() {
       $('div.tagsinput span.tag').filter(function(){ return $(this).text().match(/^AND\s/) || $(this).text().match(/^SOME\s/); }).each(function(){ $(this).css('backgroundColor', '#123'); });
     }
  });
});

function split( val ) {
  return val.split( /\s/ );
}
function extractLast( term ) {
  return term.split('\'').pop();
}
