@Grab(group='net.sourceforge.htmlunit', module='htmlunit', version='2.18')

import com.gargoylesoftware.htmlunit.*
import com.gargoylesoftware.htmlunit.html.*
import com.gargoylesoftware.htmlunit.javascript.background.*

def query = request.getParameter("site")
query = java.net.URLDecoder.decode(query, "UTF-8")

WebClient webClient = new WebClient(BrowserVersion.FIREFOX_38)
HtmlPage page = webClient.getPage(query)
JavaScriptJobManager manager = page.getEnclosingWindow().getJobManager();
while (manager.getJobCount() > 0) {
  Thread.sleep(1000);
}

print page.asXml()
