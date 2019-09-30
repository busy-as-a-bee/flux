# Flux #

### Try it out on https://busy-as-a-bee.github.io/flux/

## Javascript library to visualize XML documents.
- Parses XML document and renders a graphic representation of nodes using D3.
- Allows to change an element's parent via drag and drop.
- Gives a way to explore a node's value and attributes.
- Can compile the modified structure and elements back into a new XML document.

### Usage
The source XML must be provided from a TextArea and the edited XML result is rendered in another TextArea.
The graphic representation og the XML document is done in a Div. A second Div is needed to show the details of a selceted node.

### The Flux function
Loading the Flux Library introduces the function flux on the global window scope.
The flux function takes one optional parameter in the form of a JSON Object, and accept the following keys;

- xmlHead: Header of XML document. Default value = '<?xml version="1.0" encoding="UTF-8"?>'
- sourceContainerId: ID of element containing XML source code. Default value = 'xmlinput'
- treeContainerId: ID of element to contain the SVG XML tree. Default value = 'treeContainer'
- detailContainerId: ID of element to hold node details when node is selected. Default value = 'nodeDetails'
- outputContainerId: ID of element to contain the printed XML document. Default value = 'xmloutput'
- fluxButtonId: ID of element to function as flux button, i.e. button to flux your XML source code. Default value = 'fluxbutton'
- toXMLButtonId: ID of element to function as to XML button. Default value = 'toxml'

#### Example with default settings
```
			<div>
	  			<textarea rows="6" cols="140" id="xmlinput"></textarea> 
	  			<button id="fluxbutton">Flux</button>
		  	</div>
			<div>
		  		<div id="treeContainer"></div>
				<div id="nodeDetails"></div>
			</div>
		  	<div>
		  		<input type="button" id="toxml" value="Print"/><br/>
		  		<textarea rows="6" cols="140" id="xmloutput"></textarea> 
		  	</div>
		  	<script>
		  	flux();
		  	</script>
```
#### Example with custom settings
```
			<div>
	  			<textarea rows="6" cols="140" id="xmlsource"></textarea> 
	  			<button id="fluxbutton">Flux</button>
		  	</div>
			<div>
		  		<div id="treeContainer"></div>
				<div id="nodeDetails"></div>
			</div>
		  	<div>
		  		<input type="button" id="toxml" value="Print"/><br/>
		  		<textarea rows="6" cols="140" id="xmloutput"></textarea> 
		  	</div>
		  	<script>
		  	flux({
		  	    sourceContainerId: 'xmlsource'
		  	});
		  	</script>
```
Optionally the CodeMirror library can be used to improve the visibility of the markup in the TextArea.
### Requirements
The D3js library version 3 or higher.
