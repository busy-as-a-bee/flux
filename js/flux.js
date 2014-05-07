/*
    Flux, XML visualization and editing Javascript library.
    Copyright (C) 2014 Benjamin Merot (ben@busyasabee.org)
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
(function (doc, w) {
    "use strict";
    // Default flux settings.
    var defaults = {
            xmlHead : '<?xml version="1.0" encoding="UTF-8"?>',
            sourceContainerId : 'xmlinput',
            treeContainerId : 'treeContainer',
            detailContainerId : 'nodeDetails',
            outputContainerId : 'xmloutput',
            fluxButtonId : 'fluxbutton',
            toXMLButtonId : 'toxml'
        },
        version = '1.0.1',
        // Flux error handler.
        FluxError = function (e) {
            this.toString = function () {
                return 'Flux has encountered the error: ' + e;
            };
        },
        // Extends a default object.
        extend = function (defSettings, newSettings) {
            var elem,
                modifiedSettings = {};
            if (newSettings) {
                for (elem in defSettings) {
                    if (defSettings.hasOwnProperty(elem)) {
                        if (newSettings[elem]) {
                            modifiedSettings[elem] = newSettings[elem];
                        } else {
                            modifiedSettings[elem] = defSettings[elem];
                        }
                    }
                }
            } else {
                modifiedSettings = defSettings;
            }
            return modifiedSettings;
        };
	/**
	 * @constructor
	 */
    function Flux(settings) {
        // Flux require the d3 library, so if missing we throw a FluxError.
        if (!w.d3) {
            throw new FluxError('d3 library missing');
        }
        // Extends the default settings if any provided.
        this.settings = extend(defaults, settings);
        // Preserve default settings.
        this._defaults = defaults;

        this.detailBox = doc.getElementById(this.settings.detailContainerId);
        this.treeContainer = doc.getElementById(this.settings.treeContainerId);
        this.detailContainer = doc.getElementById(this.settings.detailContainerId);
        this.outputContainer = doc.getElementById(this.settings.outputContainerId);
        this.sourceContainer = doc.getElementById(this.settings.sourceContainerId);
        this.fluxButton = doc.getElementById(this.settings.fluxButtonId);
        this.toXMLButton = doc.getElementById(this.settings.toXMLButtonId);
        this.latestData = undefined;
        this.selectedNode = undefined;

        this.init();
    }

    function flux(settings) {
        return new Flux(settings);
    }
	    
    Flux.prototype = {
        init : function () {
            var self = this;
            // If we have flux button attach click handler,
            // else throw FluxError.
            try {
                this.fluxButton.addEventListener('click', function () {
                    self.doFlux();
                }, false);
            } catch (parseError) {
                throw new FluxError('No flux button found with id: ' + this.settings.fluxButtonId);
            }
            // If we have an to XML button attach click handler,
            // else throw FluxError.
            try {
                this.toXMLButton.addEventListener('click', function () {
                    self.print();
                }, false);
            } catch (printError) {
                throw new FluxError('No to XML button found with id: ' + this.settings.toXMLButtonId);
            }
        },
        doFlux : function () {
            var xml,
                computedData = {};
            
            this.treeContainer.innerHTML = '';
			this.detailContainer.innerHTML = '';
            xml = this.parseXML(this.sourceContainer.value.trim());

            computedData.name = xml.firstChild.tagName;
            computedData.children = this.iterXMLChild(xml.firstChild.childNodes);
            this.buildTree(computedData, this.settings.treeContainerId);
        },
        print : function () {
            this.outputContainer.value = this.settings.xmlHead + this.buildXML(this.latestData);
        },
        buildXML : function (data) {
            var root = doc.createElement(data.name),
                children = data.children,
                i;
            for (i = 0; i < children.length; i++) {
                root.appendChild(this.iterJSONChild(children[i]));
            }
            return root.outerHTML;
        },
        iterJSONChild : function (object) {
            var node = doc.createElement(object.name),
                objAtt = object.attributes,
                objChildren = object.children,
                objChildrenLen,
                key,
                j;
                
            try {
                if (objAtt !== undefined) {
                    for (key in objAtt) {
                        if (objAtt.hasOwnProperty(key)) {
                            node.setAttribute(key, objAtt[key]);
                        }
                    }
                }
                if (objChildren && object.children.length) {
                    objChildrenLen = object.children.length;
                    for (j = 0; j < objChildrenLen; j++) {
                        node.appendChild(this.iterJSONChild(objChildren[j]));
                    }
                } else {
                    node.innerHTML = object.textContent || '';
                }
            } catch (error) {
                throw new FluxError('Error running iterJSONChild: ' + error);
            }
            return node;
        },
        parseXML : function (text) {
            var out,
                dXML;
            try {
                dXML = new DOMParser();
                dXML.async = false;
            } catch (e) {
                throw new FluxError('XML Parser could not be instantiated');
            }
            try {
                out = dXML.parseFromString(text, 'text/xml');
            } catch (e) {
                throw new FluxError('Error parsing XML string');
            }
            return out;
        },
        iterXMLChild : function (nodes) {
            var children = [],
                nodeLen = nodes.length,
                node,
                child,
                nodeAttributes,
                subChildren,
                i,
                j;
            for (i = 0; i < nodeLen; i++) {
                node = nodes[i];
                nodeAttributes = node.attributes;
                if (node.tagName) {
                    child = {
                        "name" : node.tagName
                    };
                    if (node.textContent) {
                        //Move to only save text content when no more children are under node
                        child.textContent = node.textContent;
                    }
                    if (nodeAttributes) {
                        child.attributes = {};
                        for (j = 0; j < nodeAttributes.length; j++) {
                            child.attributes[nodeAttributes[j].nodeName] = nodeAttributes[j].nodeValue;
                        }
                    }
                    if (node.childNodes && node.childNodes.length) {
                        subChildren = this.iterXMLChild(node.childNodes);
                        if (subChildren.length) {
                            child.children = subChildren;
                        }
                    }
                    children.push(child);
                }
            }
            return children;
        },
        showNodeDetails : function (d) {
            var self = this,
                pNtxt,
                pVtxt,
                pAtxt,
                pN,
                pV,
                pA,
                ul,
                dAttributes,
                btn,
                count = 0,
                li,
                key;
            this.selectedNode = d;
            if (this.detailBox) {
                this.detailBox.innerHTML = '';
                pN = doc.createElement('p');
                pN.innerHTML = 'Node name: ';
                pNtxt = doc.createElement('input');
                pNtxt.setAttribute('type', 'text');
                pNtxt.setAttribute('value', (d.name || ''));
                pN.appendChild(pNtxt);
                this.detailBox.appendChild(pN);
                // If we have no children or attributes.
                if (d.children === undefined || d.attributes.length === 0) {
                    pV = doc.createElement('p');
                    pV.innerHTML = 'Node value: ';
                    pVtxt = doc.createElement('input');
                    pVtxt.setAttribute('type', 'text');
                    pVtxt.setAttribute('value', (d.textContent || ''));
                    pV.appendChild(pVtxt);
                    this.detailBox.appendChild(pV);
                }
                // If we have attributes.
                if (d.attributes) {
                    pA = doc.createElement('p');
                    pA.innerHTML = 'Attributes:';
                    ul = doc.createElement('ul');
                    dAttributes = d.attributes;
                    for (key in dAttributes) {
                        if (dAttributes.hasOwnProperty(key)) {
                            //Only append attribute header if some items are added
                            if (count === 0) {
                                this.detailBox.appendChild(pA);
                            }
                            li = doc.createElement('li');
                            li.innerHTML = (key || '') + ':';
                            pAtxt = doc.createElement('input');
                            pAtxt.setAttribute('type', 'text');
                            pAtxt.setAttribute('value', (dAttributes[key] || ''));
                            li.appendChild(pAtxt);
                            ul.appendChild(li);
                        }
                    }
                    this.detailBox.appendChild(ul);
                }
                btn = doc.createElement('input');
                btn.setAttribute('type', 'button');
                btn.setAttribute('value', 'Apply');
                btn.addEventListener('click', function () {
                    self.applyNodeChange();
                });
                this.detailBox.appendChild(btn);
            }
        },
        applyNodeChange: function() {
            var originalNodeName = this.selectedNode.name,
                listedAttributes,
                i,
                attributeName,
                attributeValue;
            this.selectedNode.name = this.detailBox.querySelectorAll('p')[0].querySelectorAll('input')[0].value;
            if (this.selectedNode.children === undefined || this.selectedNode.children.length === 0) {
                this.selectedNode.textContent = this.detailBox.querySelectorAll('p')[1].querySelectorAll('input')[0].value;
            }
            listedAttributes = this.detailBox.querySelectorAll('ul')[0].querySelectorAll('li');
            for (i = 0; i < listedAttributes.length; i++) {
                attributeName = listedAttributes[i].innerHTML.split(':')[0];
                attributeValue = listedAttributes[i].querySelectorAll('input')[0].value;
                this.selectedNode.attributes[attributeName] = attributeValue;
            }
            if (originalNodeName !== this.selectedNode.name) {
                this.buildTree(this.latestData);
            }
        },
        buildTree : function (data) {
			this.treeContainer.innerHTML = "";
            var that = this,
                totalNodes = 0,
                nodes,
                domNode,
                maxLabelLength = 0,
                draggingNode,
                dragStarted = false,
                panSpeed = 200,
                panBoundary = 20,
                i,
                duration = 750,
                root,
				containerSelector = "#" + this.settings.treeContainerId,
                viewerWidth = this.treeContainer.offsetWidth,
                viewerHeight = this.treeContainer.offsetHeight,
                tree = d3.layout.tree().size([viewerHeight, viewerWidth]),
                panTimer,
                diagonal = d3.svg.diagonal().projection(function (d) {
                    return [d.y, d.x];
                }),
                zoom = function () {
                    svgGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
                },
                zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3]).on("zoom", zoom),
                visit = function (parent, visitFn, childrenFn) {
                    var children,
                        count;
                    if (!parent) {
                        return;
                    }
                    visitFn(parent);
                    children = childrenFn(parent);
                    if (children) {
                        count = children.length;
                        for (i = 0; i < count; i++) {
                            visit(children[i], visitFn, childrenFn);
                        }
                    }
                },
                sortTree = function () {
                    tree.sort(function (a, b) {
                        return b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1;
                    });
                },
                pan = function (domNode, direction) {
                    var speed = panSpeed,
                        translateCoords,
                        translateX,
                        translateY,
                        scale;
                    if (panTimer) {
                        clearTimeout(panTimer);
                        translateCoords = d3.transform(svgGroup.attr('transform'));
                        if (direction === 'left' || direction === 'right') {
                            translateX = direction === 'left' ? translateCoords.translate[0] + speed : translateCoords.translate[0] - speed;
                            translateY = translateCoords.translate[1];
                        } else if (direction === 'up' || direction === 'down') {
                            translateX = translateCoords.translate[0];
                            translateY = direction === 'up' ? translateCoords.translate[1] + speed : translateCoords.translate[1] - speed;
                        }
                        scale = zoomListener.scale();
                        svgGroup.transition().attr("transform", "translate(" + translateX + "," + translateY + ")scale(" + scale + ")");
                        d3.select(domNode).select('g.node').attr("transform", "translate(" + translateX + "," + translateY + ")");
                        zoomListener.scale(zoomListener.scale());
                        zoomListener.translate([translateX, translateY]);
                        panTimer = setTimeout(function () {
                            pan(domNode, speed, direction);
                        }, 50);
                    }
                },
                initiateDrag = function(d, domNode) {
                	draggingNode = d;
                	d3.select(domNode).select('.ghostCircle').attr('pointer-events', 'none');
                	d3.selectAll('.ghostCircle').attr('class', 'ghostCircle show');
                	d3.select(domNode).attr('class', 'node activeDrag');

                	svgGroup.selectAll("g.node").sort(function(a) {
                		return a.id !== draggingNode.id ? 1 : -1;
                	});
                	svgGroup.selectAll('path.link').filter(function(d) {
                		if (d.target.id === draggingNode.id) {
                			return true;
                		}
                		return false;
                	}).remove();

                	dragStarted = false;
                },
                baseSvg = d3.select(containerSelector).append("svg").attr("width", viewerWidth).attr("height", viewerHeight).attr("class", "overlay").call(zoomListener),
                updateTempConnector = function () {
	                var dataArr = [],
	                    link;
		            if (draggingNode && that.selectedNode) {
			            dataArr = [{
				            source: {
					            x: that.selectedNode.y0,
					            y: that.selectedNode.x0
				            },
				            target: {
					            x: draggingNode.y0,
					            y: draggingNode.x0
				            }
			            }];
		            }
		            link = svgGroup.selectAll(".templink").data(dataArr);

		            link.enter().append("path")
			            .attr("class", "templink")
			            .attr("d", d3.svg.diagonal())
			            .attr('pointer-events', 'none');

		            link.attr("d", d3.svg.diagonal());

		            link.exit().remove();
	            },
	            toggleSelectedNode = (function () {
		            var currentRadius = 4.5;
	                return function () {
			            d3.selectAll("circle[r='7.5']").attr("r", 4.5);
			            // + operator to convert String to Number in order to do strict comparison
			            currentRadius = +d3.select(this).attr("r") === 4.5 ? 7.5 : 4.5;
			            d3.select(this).attr("r", currentRadius);
	                };
	            }()),
	            expand = function (d) {
	                if (d._children) {
			            d.children = d._children;
			            d.children.forEach(expand);
			            d._children = null;
		            }
	            },
	            endDrag = function () {
	                that.selectedNode = null;
		            d3.selectAll('.ghostCircle').attr('class', 'ghostCircle');
		            d3.select(domNode).attr('class', 'node');
		            d3.select(domNode).select('.ghostCircle').attr('pointer-events', '');
		            updateTempConnector();
		            if (draggingNode) {
			            update(root);
			            centerNode(draggingNode);
			            draggingNode = null;
		            }
	            },
				dragListener = d3.behavior.drag()
					.on("dragstart", function(d) {
						if (d === root) {
							return;
						}
						dragStarted = true;
						nodes = tree.nodes(d);
						d3.event.sourceEvent.stopPropagation();
					})
	            .on("drag", function (d) {
	                var relCoords,
	                    node;
		            if (d === root) {
			            return;
		            }
		            if (dragStarted) {
			            domNode = this;
			            initiateDrag(d, domNode);
		            }
		            relCoords = d3.mouse(that.treeContainer.querySelectorAll('svg')[0]);
		            if (relCoords[0] < panBoundary) {
			            panTimer = true;
			            pan(this, 'left');
		            } else if (relCoords[0] > (that.treeContainer.querySelectorAll('svg').offsetWidth - panBoundary)) {

			            panTimer = true;
			            pan(this, 'right');
		            } else if (relCoords[1] < panBoundary) {
			            panTimer = true;
			            pan(this, 'up');
		            } else if (relCoords[1] > (that.treeContainer.querySelectorAll('svg').offsetHeight - panBoundary)) {
			            panTimer = true;
			            pan(this, 'down');
		            } else {
			            try {
				            clearTimeout(panTimer);
			            } catch (ignore) {

			            }
		            }

		            d.x0 += d3.event.dy;
		            d.y0 += d3.event.dx;
		            node = d3.select(this);
		            node.attr("transform", "translate(" + d.y0 + "," + d.x0 + ")");
		            updateTempConnector();
	            }).on("dragend", function (d) {
		            if (d === root) {
			            return;
		            }
		            domNode = this;
		            if (that.selectedNode && draggingNode) {
			            var index = draggingNode.parent.children.indexOf(draggingNode);
			            if (index > -1) {
				            draggingNode.parent.children.splice(index, 1);
			            }
			            if (that.selectedNode.children || that.selectedNode._children) {
				            if (that.selectedNode.children) {
					            that.selectedNode.children.push(draggingNode);
				            } else {
					            that.selectedNode._children.push(draggingNode);
				            }
			            } else {
				            that.selectedNode.children = [];
				            that.selectedNode.children.push(draggingNode);
			            }
			            expand(that.selectedNode);
			            sortTree();
			            endDrag();
		            } else {
			            endDrag();
		            }
	            }),
	            collapse = function (d) {
	                if (d.children) {
			            d._children = d.children;
			            d._children.forEach(collapse);
			            d.children = null;
		            }
	            },
	            overCircle = function (d) {
	                that.selectedNode = d;
            		updateTempConnector();
	            },
	            outCircle = function () {
	                that.selectedNode = null;
            		updateTempConnector();
	            },
	            centerNode = function (source) {
	                var scale = zoomListener.scale(),
		                x = -source.y0,
		                y = -source.x0;
		                x = x * scale + viewerWidth / 2;
		                y = y * scale + viewerHeight / 2;
		            d3.select('g').transition()
			            .duration(duration)
			            .attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");
		            zoomListener.scale(scale);
		            zoomListener.translate([x, y]);
	            },
	            toggleChildren = function (d) {
	                if (d.children) {
			            d._children = d.children;
			            d.children = null;
		            } else if (d._children) {
			            d.children = d._children;
			            d._children = null;
		            }
		            return d;
	            },
	            click = function (d) {
	                if (d3.event.defaultPrevented) {
	                    return;
	                }
		            centerNode(d);
		            that.showNodeDetails(d);
	            },
	            dblclick = function (d) {
	                if (d3.event.defaultPrevented) {
	                    return;
	                }
		            d = toggleChildren(d);
		            update(d);
		            centerNode(d);
	            },
	            update = function (source) {
	                var levelWidth = [1],
	                    node,
	                    updateNodes,
	                    childCount = function (level, n) {
			                if (n.children && n.children.length > 0) {
				                if (levelWidth.length <= level + 1) {
				                    levelWidth.push(0);
				                }
				                levelWidth[level + 1] += n.children.length;
				                n.children.forEach(function (d) {
					                childCount(level + 1, d);
				                });
			                }
		                },
		                newHeight,
		                links,
		                nodeEnter,
		                nodeUpdate,
		                nodeExit,
		                link;
		                
		            childCount(0, root);
		            newHeight = d3.max(levelWidth) * 25; // 25 pixels per line
		            tree = tree.size([newHeight, viewerWidth]);
		            updateNodes = tree.nodes(root).reverse();
			        links = tree.links(updateNodes);
		            updateNodes.forEach(function (d) {
			            d.y = (d.depth * (maxLabelLength * 10));
		            });
		            node = svgGroup.selectAll("g.node")
			            .data(updateNodes, function (d) {
				            return d.id || (d.id = ++i);
			            });
		            nodeEnter = node.enter().append("g")
			            .call(dragListener)
			            .attr("class", "node")
			            .attr("transform", function () {
				            return "translate(" + source.y0 + "," + source.x0 + ")";
			            })
			            .on('click', click)
			            .on('dblclick', dblclick);
		            nodeEnter.append("circle")
			            .attr('class', 'nodeCircle')
			            .attr("r", 0)
						.on("click", toggleSelectedNode)
			            .style("fill", function (d) {
				            return d._children ? "lightsteelblue" : "#fff";
			            });
		            nodeEnter.append("text")
			            .attr("x", function (d) {
				            return d.children || d._children ? -10 : 10;
			            })
			            .attr("dy", ".35em")
			            .attr('class', 'nodeText')
			            .attr("text-anchor", function (d) {
				            return d.children || d._children ? "end" : "start";
			            })
			            .text(function (d) {
				            return d.name;
			            })
			            .style("fill-opacity", 0);
		            nodeEnter.append("circle")
			            .attr('class', 'ghostCircle')
			            .attr("r", 30)
			            .attr("opacity", 0.2) // change this to zero to hide the target area
		            .style("fill", "red")
			            .attr('pointer-events', 'mouseover')
			            .on("mouseover", function (node) {
				            overCircle(node);
			            })
			            .on("mouseout", function (node) {
				            outCircle(node);
			            });
		            node.select('text')
			            .attr("x", function (d) {
				            return d.children || d._children ? -10 : 10;
			            })
			            .attr("text-anchor", function (d) {
				            return d.children || d._children ? "end" : "start";
			            })
			            .text(function (d) {
				            return d.name;
			            });
		            node.select("circle.nodeCircle")
			            .attr("r", 4.5)
			            .style("fill", function (d) {
				            return d._children ? "lightsteelblue" : "#fff";
			            });
		            nodeUpdate = node.transition()
			            .duration(duration)
			            .attr("transform", function (d) {
				            return "translate(" + d.y + "," + d.x + ")";
			            });
		            nodeUpdate.select("text")
			            .style("fill-opacity", 1);
		            nodeExit = node.exit().transition()
			            .duration(duration)
			            .attr("transform", function () {
				            return "translate(" + source.y + "," + source.x + ")";
			            })
			            .remove();
		            nodeExit.select("circle")
			            .attr("r", 0);
		            nodeExit.select("text")
			            .style("fill-opacity", 0);
		            link = svgGroup.selectAll("path.link")
			            .data(links, function (d) {
				            return d.target.id;
			            });
		            link.enter().insert("path", "g")
			            .attr("class", "link")
			            .attr("d", function () {
				            var o = {
					            x: source.x0,
					            y: source.y0
				            };
				            return diagonal({
					            source: o,
					            target: o
				            });
			            });
		            link.transition()
			            .duration(duration)
			            .attr("d", diagonal);
		            link.exit().transition()
			            .duration(duration)
			            .attr("d", function () {
				            var o = {
					            x: source.x,
					            y: source.y
				            };
				            return diagonal({
					            source: o,
					            target: o
				            });
			            })
			            .remove();
		            updateNodes.forEach(function (d) {
			            d.x0 = d.x;
			            d.y0 = d.y;
		            });
	            },
	            svgGroup = baseSvg.append("g");
            that.selectedNode = null;
            visit(data, function (d) {
                totalNodes++;
                maxLabelLength = Math.max(d.name.length, maxLabelLength);
            }, function (d) {
                return d.children && d.children.length ? d.children : null;
            });
            
            sortTree();
            
            root = data;
	        root.x0 = (viewerHeight / 2);
	        root.y0 = 0;
	        update(root);
	        centerNode(root);
	        this.latestData = root;
        }
    };

    w.flux = flux;
}(document, window));
