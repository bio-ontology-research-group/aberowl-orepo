@Grab(group='org.codehaus.groovy.modules.http-builder', module='http-builder', version='0.5.2' )
@Grab(group='org.apache.httpcomponents', module='httpclient', version='4.2.5' )


import groovy.json.*

def jsonslurper = new JsonSlurper()

if (!application) {
  application = request.getApplication(true);
}

def query = request.getParameter("query")
query = java.net.URLEncoder.encode(query)

try {

  //  def resp = client.get( path : '?q='+query )
  def resp = new URL("http://aber-owl.net:17000/QueryBio2RDF.groovy?query=$query").getText()
  def json = jsonslurper.parseText(resp)
  def results = []
  json.each { entry ->
    Expando exp = new Expando()
    exp.id = entry.id
    exp.title = entry.title
    exp.dataset = entry.dataset
    exp.description = entry.description
    exp.type = entry.type
    results << exp
  }
  /*  json."@graph".each { entry ->
    Expando exp = new Expando()
    exp.id = entry."@id"
    exp.title = entry."http://purl.org/dc/terms/title"[0]."@value"
    exp.endpoint = entry."http://rdfs.org/ns/void#sparqlEndpoint"[0]
    exp.dataset = entry."http://rdfs.org/ns/void#inDataset"[0]
    exp.description = entry."http://purl.org/dc/terms/description"?.getAt(0)?."@value"
    exp.type = entry."@type"
    results << exp
  }
  */
  //  results = results.sort { it.dataset }
  println JsonOutput.toJson(results)
} catch (Exception E) {
  E.printStackTrace()
}

