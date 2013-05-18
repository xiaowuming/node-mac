Ext.data.JsonP.nodeMacService({"guide":"<h1 id='nodeMacService-section-mac-services'>Mac Services</h1>\n<div class='toc'>\n<p><strong>Contents</strong></p>\n<ol>\n<li><a href='#!/guide/nodeMacService-section-environment-variables'>Environment Variables</a></li>\n<li><a href='#!/guide/nodeMacService-section-cleaning-up-uninstall-a-service'>Cleaning Up: Uninstall a Service</a></li>\n<li><a href='#!/guide/nodeMacService-section-what-makes-node-mac-services-unique-'>What Makes node-mac Services Unique?</a></li>\n<li><a href='#!/guide/nodeMacService-section-how-services-are-made'>How Services Are Made</a></li>\n</ol>\n</div>\n\n<p>To start, install node-mac via:</p>\n\n<pre><code>npm install node-mac\n</code></pre>\n\n<p>node-mac has a utility to run Node.js scripts as Mac daemons. Please note that like all\nMac daemons, creating one requires sudo/root privileges. To create a service with\nnode-mac, prepare a script like:</p>\n\n<pre><code>var Service = require('node-mac').Service;\n\n// Create a new service object\nvar svc = new Service({\n  name:'Hello World',\n  description: 'The nodejs.org example web server.',\n  script: 'C:\\\\path\\\\to\\\\helloworld.js')\n});\n\n// Listen for the \"install\" event, which indicates the\n// process is available as a service.\nsvc.on('install',function(){\n  svc.start();\n});\n\nsvc.install();\n</code></pre>\n\n<p>The code above creates a new <code>Service</code> object, providing a pretty name and description.\nThe <code>script</code> attribute identifies the Node.js script that should run as a service. Upon running\nthis, the script will be visible from the Windows Services utility.</p>\n\n<p><img src=\"https://raw.github.com/coreybutler/node-mac/master/docs/helloworlddaemon.png\" alt=\"Windows Mac\" /></p>\n\n<p>The <code>Service</code> object emits the following events:</p>\n\n<ul>\n<li><em>install</em> - Fired when the script is installed as a service.</li>\n<li><em>alreadyinstalled</em> - Fired if the script is already known to be a service.</li>\n<li><em>invalidinstallation</em> - Fired if an installation is detected but missing required files.</li>\n<li><em>uninstall</em> - Fired when an uninstallation is complete.</li>\n<li><em>start</em> - Fired when the new service is started.</li>\n<li><em>stop</em> - Fired when the service is stopped.</li>\n<li><em>error</em> - Fired in some instances when an error occurs.</li>\n</ul>\n\n\n<p>In the example above, the script listens for the <code>install</code> event. Since this event\nis fired when a service installation is complete, it is safe to start the service.</p>\n\n<p>Services created by node-mac are similar to most other services running on OSX.\nThey can be stopped from the Activity Monitor and make logs available in the Console app.</p>\n\n<h2 id='nodeMacService-section-environment-variables'>Environment Variables</h2>\n\n<p>Sometimes you may want to provide a service with static data, passed in on creation of the service. You can do this by setting environment variables in the service config, as shown below:</p>\n\n<pre><code>var svc = new Service({\n  name:'Hello World',\n  description: 'The nodejs.org example web server.',\n  script: 'C:\\\\path\\\\to\\\\helloworld.js',\n  env: {\n    name: \"HOME\",\n    value: process.env[\"USERPROFILE\"] // service is now able to access the user who created its' home directory\n  }\n});\n</code></pre>\n\n<p>You can also supply an array to set multiple environment variables:</p>\n\n<pre><code>var svc = new Service({\n  name:'Hello World',\n  description: 'The nodejs.org example web server.',\n  script: 'C:\\\\path\\\\to\\\\helloworld.js',\n  env: [{\n    name: \"HOME\",\n    value: process.env[\"USERPROFILE\"] // service is now able to access the user who created its' home directory\n  },\n  {\n    name: \"TEMP\",\n    value: path.join(process.env[\"USERPROFILE\"],\"/temp\") // use a temp directory in user's home directory\n  }]\n});\n</code></pre>\n\n<h2 id='nodeMacService-section-cleaning-up-uninstall-a-service'>Cleaning Up: Uninstall a Service</h2>\n\n<p>Uninstalling a previously created service is syntactically similar to installation.</p>\n\n<pre><code>var Service = require('node-mac').Service;\n\n// Create a new service object\nvar svc = new Service({\n  name:'Hello World',\n  script: require('path').join(__dirname,'helloworld.js')\n});\n\n// Listen for the \"uninstall\" event so we know when it's done.\nsvc.on('uninstall',function(){\n  console.log('Uninstall complete.');\n  console.log('The service exists: ',svc.exists);\n});\n\n// Uninstall the service.\nsvc.uninstall();\n</code></pre>\n\n<p>The uninstall process only removes process-specific files. <strong>It does NOT delete your Node.js script, but it will remove the logs!</strong>\nThis process also removes the plist file for the service.</p>\n\n<h2 id='nodeMacService-section-what-makes-node-mac-services-unique-'>What Makes node-mac Services Unique?</h2>\n\n<p>Lots of things!</p>\n\n<p><strong>Long Running Processes &amp; Monitoring:</strong></p>\n\n<p>The built-in service recovery for OSX services is fairly limited and cannot easily be configured\nfrom code. Therefore, node-mac creates a wrapper around the Node.js script. This wrapper\nis responsible for restarting a failed service in an intelligent and configurable manner. For example,\nif your script crashes due to an unknown error, node-mac will attempt to restart it. By default,\nthis occurs every second. However; if the script has a fatal flaw that makes it crash repeatedly,\nit adds unnecessary overhead to the system. node-mac handles this by increasing the time interval\nbetween restarts and capping the maximum number of restarts.</p>\n\n<p><strong>Smarter Restarts That Won't Pummel Your Server:</strong></p>\n\n<p>Using the default settings, node-mac adds 25% to the wait interval each time it needs to restart\nthe script. With the default setting (1 second), the first restart attempt occurs after one second.\nThe second occurs after 1.25 seconds. The third after 1.56 seconds (1.25 increased by 25%) and so on.\nBoth the initial wait time and the growth rate are configuration options that can be passed to a new\n<code>Service</code>. For example:</p>\n\n<pre><code>var svc = new Service({\n  name:'Hello World',\n  description: 'The nodejs.org example web server.',\n  script: 'C:\\\\path\\\\to\\\\helloworld.js'),\n  wait: 2,\n  grow: .5\n});\n</code></pre>\n\n<p>In this example, the wait period will start at 2 seconds and increase by 50%. So, the second attempt\nwould be 3 seconds later while the fourth would be 4.5 seconds later.</p>\n\n<p><strong>Don't DOS Yourself!</strong></p>\n\n<p>Repetitive recycling could potentially go on forever with a bad script. To handle these situations, node-mac\nsupports two kinds of caps. Using <code>maxRetries</code> will cap the maximum number of restart attempts. By\ndefault, this is unlimited. Setting it to 3 would tell the process to no longer restart a process\nafter it has failed 3 times. Another option is <code>maxRestarts</code>, which caps the number of restarts attempted\nwithin 60 seconds. For example, if this is set to 3 (the default) and the process crashes/restarts repeatedly,\nnode-mac will cease restart attempts after the 3rd cycle in a 60 second window. Both of these\nconfiguration options can be set, just like <code>wait</code> or <code>grow</code>.</p>\n\n<p>Finally, an attribute called <code>abortOnError</code> can be set to <code>true</code> if you want your script to <strong>not</strong> restart\nat all when it exits with an error.</p>\n\n<h2 id='nodeMacService-section-how-services-are-made'>How Services Are Made</h2>\n\n<p>node-mac uses the <code>launchd</code> utility to create a unique process\nfor each Node.js script deployed as a service. A plist file is created in <code>/Library/LaunchDaemons</code>\nby default. Additionally, two log files are generated in <code>/Library/Logs/&lt;name&gt;</code> for general output\nand error logging.</p>\n\n<p><em>Event Logging</em></p>\n\n<p><img src=\"https://raw.github.com/coreybutler/node-mac/master/docs/helloworldlog.png\" alt=\"Mac log\" /></p>\n\n<p>Services created with node-mac have two event logs that can be viewed through the Console app.\nA log source named <code>myappname.log</code> provides basic logging for the service. It can be used to see\nwhen the entire service starts/stops. A second log, named <code>myappname_error.log</code> stores error output.</p>\n\n<p>By default, any <code>console.log</code>, <code>console.warn</code>, <code>console.error</code> or other output will be made available\nin one of these two files.</p>\n\n<h1 id='nodeMacService-section-license-mit-'>License (MIT)</h1>\n\n<p>Copyright (c) 2013 Corey Butler</p>\n\n<p>Permission is hereby granted, free of charge, to any person obtaining\na copy of this software and associated documentation files (the\n'Software'), to deal in the Software without restriction, including\nwithout limitation the rights to use, copy, modify, merge, publish,\ndistribute, sublicense, and/or sell copies of the Software, and to\npermit persons to whom the Software is furnished to do so, subject to\nthe following conditions:</p>\n\n<p>The above copyright notice and this permission notice shall be\nincluded in all copies or substantial portions of the Software.</p>\n\n<p>THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,\nEXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF\nMERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.\nIN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY\nCLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,\nTORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE\nSOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.</p>\n","title":"Services"});