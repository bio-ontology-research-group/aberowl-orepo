function redrawPubmedTable() {
    //var query = $('#autocomplete').value();
    var query = $.map($('#pubmed_autocomplete_tagsinput .tag span'),function(e,i){return '<'+uriMap[$(e).text().trim()]+'>';}).join(' ');

    window.location.hash = "#" + query ;
    $('#pubmed_results').dataTable().fnDestroy();
    var qType = $('input[name="type"]:checked').val();
    var ontology = $("#ontology").text();

    var table = $('#pubmed_results').dataTable( {
        "processing": false,
        "serverSide": false,
	"paging": true,
	"scrollY": 400,
	"renderer": "bootstrap",
	"aaSorting": [[ 0, "asc" ]],
	"bAutoWidth": false,
	"iDisplayLength": 100,
	"bJQueryUI": true,
	aoColumns : [
	    { "sWidth": "20%"},
	    { "sWidth": "60%"}
	],
	"fnInitComplete": function( oSettings ) {
	    /*$('#pubmed').attr('href', "pubmed/?type="+qType+"&owlquery="+encodeURIComponent(query)+"&ontology="+ontology);
	    $('#pubmed').show();                                                                                                         
	    $('#sparql').attr('href', "sparql/?type="+qType+"&query="+encodeURIComponent(query)+"&ontology="+ontology);
	    $('#sparql').show();*/
        },
        "ajax": {
            "url": "/aber-owl/pubmed/?type="+qType+"&ontology="+ontology+"&owlquery="+encodeURIComponent(query)+"&output=json",
	    "dataType": 'json',
            "dataSrc": function ( json ) {
                var datatable = new Array();
		var result = json;

                for (var i=0 ; i<result.length ; i++ ) {
                    datatable[i] = new Array() ;
                    if(result[i].pmcid) {
                      datatable[i][0] = '<a href="http://www.ncbi.nlm.nih.gov/pmc/articles/PMC'+result[i].pmcid+'">'+result[i].pmcid+' (full text)</a>';
                    } else if(result[i].pmid) {
                      datatable[i][0] = '<a href="http://www.ncbi.nlm.nih.gov/pubmed/'+result[i].pmid+'">'+result[i].pmid+'</a>';
                    }
                    datatable[i][0] = result[i].title;
                    if(result[i].pmcid) {
                      datatable[i][0] += '[<a href="http://www.ncbi.nlm.nih.gov/pmc/articles/PMC'+result[i].pmcid+'">PMC:'+result[i].pmcid+']</a> ';
                    }
		    if(result[i].pmid) {
                      datatable[i][0] += '[<a href="http://www.ncbi.nlm.nih.gov/pubmed/'+result[i].pmid+'">PMID:'+result[i].pmid+']</a>';
                    }
		    
                    datatable[i][1] = result[i].fragment;
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
  $('#pubmed_results').dataTable( {
      "processing": false,
      "serverSide": false,
      "paging": true,
      "scrollY": 400,
      aoColumns : [
          { "sWidth": "20%"},
          { "sWidth": "60%"}
      ]
  })
    
  $('#pubmed_autocomplete').tagsInput({
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
