@Grapes([
          @Grab(group='javax.servlet', module='javax.servlet-api', version='3.1.0'),
          @Grab(group='org.eclipse.jetty', module='jetty-server', version='9.3.0.M2'),
          @Grab(group='org.eclipse.jetty', module='jetty-servlet', version='9.3.0.M2'),
	  @Grab(group='javax.el', module='javax.el-api', version='3.0.0'),
	  @GrabConfig(systemClassLoader=true)
	])

 
import org.eclipse.jetty.server.Server
import org.eclipse.jetty.servlet.*
import groovy.servlet.*
 
def startJetty() {
  def server = new Server(30001)
  def context = new ServletContextHandler(server, "/", ServletContextHandler.SESSIONS);

  context.resourceBase = '.'  
  context.addServlet(GroovyServlet, '/GenStaticPage.groovy')  
  context.setAttribute('version', '1.0')  
  server.start()
}
 
startJetty()

