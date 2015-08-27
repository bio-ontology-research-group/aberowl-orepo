function doSearch() {
  $('#main_search').dataTable().fnDestroy();
  $('#manchester_search').dataTable().fnDestroy();
  $('#ontology_search').dataTable().fnDestroy();
  var query = $('#search').val();

  // Class search by text
  var table = $('#main_search').dataTable( {
    "processing": false,
    "serverSide": false,
    "paging": true,
    "scrollY": 800,
    "renderer": "bootstrap",
    "aaSorting": [[ 1, "asc" ]],
    "bAutoWidth": false,
    "iDisplayLength": 50,
    "bJQueryUI": false,
    "aoColumns" : [
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
          "url": "/service/api/queryNames.groovy?term=" + encodeURIComponent(query.trim()),
          "dataType": 'json',
          "dataSrc": function(result) {
            $('#ctabhead').text('Classes ('+result.length+')');

            var datatable = new Array();
            for( var i=0, ien=result.length ; i<ien ; i++ ) {
              datatable[i] = new Array() ;
              datatable[i][0] = "<a href='/ontology/"+result[i].ontology + "?c=" +result[i].iri +"'>"+result[i].iri+"</a>" ;
              datatable[i][1] = "<a href='/ontology/"+result[i].ontology+"'>"+result[i].ontology+"</a>" ;
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
  });

  var table = $('#ontology_search').dataTable( {
    "processing": false,
    "serverSide": false,
    "paging": true,
    "scrollY": 800,
    "renderer": "bootstrap",
    "aaSorting": [[ 1, "asc" ]],
    "bAutoWidth": false,
    "iDisplayLength": 50,
    "bJQueryUI": false,
    "aoColumns" : [
      { "sWidth": "15%"},
      { "sWidth": "30%"},
      { "sWidth": "55%"},
    ],
    "ajax": {
          "url": "/service/api/queryOntologies.groovy?term=" + encodeURIComponent(query.trim()),
          "dataType": 'json',
          "dataSrc": function(result) {
            $('#otabhead').text('Ontologies ('+result.length+')');

            var datatable = new Array();
            for( var i=0, ien=result.length ; i<ien ; i++ ) {
              datatable[i] = new Array() ;
              datatable[i][0] = "<a href='/ontology/"+result[i].uri+"'>"+result[i].uri+"</a>" ;
              datatable[i][1] = result[i].name;
              datatable[i][2] = result[i].description;
            }
            return datatable;
          }
      },
    "dom": 'T<"clear">lfrtip',
    "tableTools": {
            "sSwfPath": "js/TableTools-2.0.0/media/swf/copy_csv_xls_pdf.swf"
        }
  });

  var mtable = $('#manchester_search').dataTable( {
    "processing": false,
    "serverSide": false,
    "paging": true,
    "scrollY": 800,
    "renderer": "bootstrap",
    "aaSorting": [[ 1, "asc" ]],
    "bAutoWidth": false,
    "iDisplayLength": 50,
    "bJQueryUI": false,
    "aoColumns" : [
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
        "url": "/service/api/runQuery.groovy?type=subeq&labels=true&query="+encodeURIComponent(query.trim()),
        "dataType": 'json',
            "dataSrc": function ( json ) {
                var datatable = new Array();
                result = json.result;
                $('#mtabhead').text('Manchester Syntax ('+result.length+')');

                for ( var i=0, ien=result.length ; i<ien ; i++ ) {
                    datatable[i] = new Array() ;
                    datatable[i][0] = "<a href='/ontology/"+result[i].ontologyURI + "?c=" +result[i].classURI+"'>"+result[i].classURI+"</a>" ;
                    datatable[i][1] = "<a href='/ontology/"+result[i].ontologyURI+"'>"+result[i].ontologyURI+"</a>" ;
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
  });
};

$(function() {
  $('#main_search').dataTable( {
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
  });

  $('#ontology_search').dataTable( {
      "processing": false,
      "serverSide": false,
      "paging": true,
      "scrollY": 400,
      aoColumns : [
          { "sWidth": "15%"},
          { "sWidth": "30%"},
          { "sWidth": "55%"},
      ]
  });

  $('#manchester_search').dataTable( {
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
  });

  console.log('adding');
  $("#search").keydown(function(event){
    if(event.keyCode == 13){
      $("#sbutton").click();
    }
  });
  console.log('added');
});
