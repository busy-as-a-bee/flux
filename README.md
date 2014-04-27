# Flux #

## Javascript library to visualize XML documents.
- Parses XML document and renders a graphic representation of nodes using D3.
- Allows to change an element's parent via drag and drop.
- Gives a way to explore a node's value and attributes.
- Can compile the modified structure and elements back into a new XML document.

### Usage
The source XML must be provided from a TextArea and the edited XML result is rendered in another TextArea.
The graphic representation og the XML document is done in a Div. A second Div is needed to show the details of a selceted node.

#### Example
```
			<div>
	  			<textarea rows="6" cols="140" id="xmlinput"></textarea> 
	  			<button onclick="doFlux('xmlinput', 'treeContainer', 'nodeDetails')">Flux</button>
		  	</div>
			<div>
		  		<div id="treeContainer"></div>
				<div id="nodeDetails"></div>
			</div>
		  	<div>
		  		<input type="button" onclick="print('xmloutput')" value="Print"/><br/>
		  		<textarea rows="6" cols="140" id="xmloutput"></textarea> 
		  	</div>
```
Optionally the CodeMirror library can be used to improve the visibility of the markup in the TextArea.
### Requirements
The D3js library version 3 or higher.
