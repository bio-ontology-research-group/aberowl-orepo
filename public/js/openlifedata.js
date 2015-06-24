function redrawDataTable() {
    var term = $("#data_autocomplete_tagsinput .tag span").text().trim();
    if (term.startsWith("'")) {
	term = term.substring(1,term.length-1);
    }

    var query = $.map($('#data_autocomplete_tagsinput .tag span'),function(e,i){return '<'+uriMap[$(e).text().trim()]+'>';}).join(' ');
    window.location.hash = "#" + query ;

    $('#data_results').dataTable().fnDestroy();
    var qType = $('input[name="type"]:checked').val();
    var ontology = $("#ontology").text();

    var table = $('#data_results').dataTable( {
        "processing": false,
        "serverSide": false,
	"paging": true,
	"scrollY": 400,
	"renderer": "bootstrap",
//	"aaSorting": [[ 0, "asc" ]],
	"bAutoWidth": false,
	"iDisplayLength": 100,
	"bSort": false,
	"bJQueryUI": true,
	aoColumns : [
	    { "sWidth": "15%"},
	    { "sWidth": "35%"},
	    { "sWidth": "15%"},
	    { "sWidth": "15%"}
	],
	"fnInitComplete": function( oSettings ) {
        },
        "ajax": {
            "url": "/openlifedata/QueryData.groovy?query="+encodeURIComponent(term),
	    "dataType": 'json',
            "dataSrc": function ( json ) {
                var datatable = new Array();
		var result = json;
                for (var i=0 ; i<result.length ; i++ ) {
                    datatable[i] = new Array() ;
		    datatable[i][0] = "<a href=\""+result[i]['id']+"\">"+result[i]['title']+"</a>";
		    datatable[i][3] = "";
		    datatable[i][3] += "<a href=\""+result[i]['type']+"\">"+result[i]['type']+"</a>";
		    datatable[i][2] = "<a href=\""+result[i]['dataset']+"\">"+result[i]['dataset']+"</a>";
		    if (result[i]['description']!=null) {
			datatable[i][1] = result[i]['description'];
		    } else {
			datatable[i][1] = "";
		    }
                }
                return datatable;
            }
        },
	"dom": 'T<"clear">lfrtip',
	"tableTools": {
            "sSwfPath": "js/TableTools-2.0.0/media/swf/copy_csv_xls_pdf.swf"
        }
    } );
}

$(function() {
  $('#data_results').dataTable( {
      "processing": false,
      "serverSide": false,
      "paging": true,
      "scrollY": 400,
      "bSort": false,
      aoColumns : [
	  { "sWidth": "15%"},
	  { "sWidth": "15%"},
	  { "sWidth": "15%"},
	  { "sWidth": "35%"}
      ]
  })
    
  $('#data_autocomplete').tagsInput({
    'height': '40px',
    'width': '100%',
    'defaultText': '',
    'delimiter': '|',
    'autocomplete_url': '',
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
      }
    }, 
    'autocomplete_renderitem': function(ul, item) {
      return $( "<li>" )
             .append( "<p>" + item.label +"</p> <p> <span style=\"float:left;font-size:9px\">" + item.iri + "</span>"+
              "<span style=\"font-size:9px;margin-left:20px;float:right;\"><b>"+item.ontology+"</b></span></p><br />"+
              "<span onclick=\"window.location.href='/ontology/"+item.ontology+"/?c="+encodeURIComponent(item.iri)+"';\">[View in Ontology Browser]</a>")
             .appendTo(ul);
     },
     'onRemoveTag': function(value) {
        delete uriMap[value];
     },
     'onAddTag': function() {
       $('div.tagsinput span.tag').filter(function(){ console.log($(this).text()); return $(this).text().match(/^AND\s/) || $(this).text().match(/^SOME\s/); }).each(function(){ $(this).css('backgroundColor', '#123'); });
     }
  });
});

function split( val ) {
  return val.split( /\s/ );
}
function extractLast( term ) {
  return term.split('\'').pop();
}
