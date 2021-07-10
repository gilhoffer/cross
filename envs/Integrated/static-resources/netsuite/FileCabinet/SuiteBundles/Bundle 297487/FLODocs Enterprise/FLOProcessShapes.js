//These are the shape declarations for FLO Process Visualization
//The first set declare the ports that will be available for connections.
MyTopPortLocator = draw2d.layout.locator.PortLocator.extend({
	NAME: "MyTopPortLocator",
	init: function() {
		this._super();
	},
	relocate: function(index, figure) {
		this.applyConsiderRotation(figure, figure.getParent().getWidth() / 2, 0);
	}
});

MyRightPortLocator = draw2d.layout.locator.PortLocator.extend({
	NAME: "MyRightPortLocator",
	init: function() {
		this._super();
	},
	relocate: function(index, figure) {
		this.applyConsiderRotation(figure, figure.getParent().getWidth(), figure.getParent().getHeight() / 2);
	}
});

MyLeftPortLocator = draw2d.layout.locator.PortLocator.extend({
	NAME: "MyLeftPortLocator",
	init: function() {
		this._super();
	},
	relocate: function(index, figure) {
		this.applyConsiderRotation(figure, 0, figure.getParent().getHeight() / 2);
	}
});


MyBottomPortLocator = draw2d.layout.locator.PortLocator.extend({
	NAME: "MyBottomPortLocator",
	init: function() {
		this._super();
	},
	relocate: function(index, figure) {
		var p = figure.getParent();

		this.applyConsiderRotation(figure, p.getWidth() / 2, p.getHeight());
	}
});

var newpid;//this stores the id of any new step before it is passed as an id of the object

//The FLOStep, FLOProcess, FLOHLProcess, FLODecision, FLOStart and FLOEnd are the shapes used in FLO.

var FLOStep = draw2d.shape.basic.Rectangle.extend({
	NAME: "FLOStep",
	init: function (width, height, labeltext, showPorts, fontsize, strokesize, color, bgcolor,userdata,parentPro,id) {
    this._super(width, height);
	makeShape(this,width, height, labeltext, showPorts, fontsize, strokesize, color, bgcolor,userdata,parentPro,id,2);
      

	},

	onContextMenu: function(x, y) {
		shapeClick(this, x, y)

	},



	/**
	 * @method
	 * Return an objects with all important attributes for XML or JSON serialization
	 *
	 * @returns {Object}
	 */
	getPersistentAttributes: function() {
		var memento = this._super();memento.id=this.getId();
		memento.color = this.getColor();
		memento.bgcolor = this.getBackgroundColor();
		memento.stroke = this.getStroke();

		// add all decorations to the memento 
		//
		memento.labels = [];
		this.children.each(function(i, e) {
			memento.labels.push({
				id: e.figure.getId(),
				label: e.figure.getText(),
				locator: e.locator.NAME,

			});
		});

		return memento;
	},

	/**
	 * @method
	 * Read all attributes from the serialized properties and transfer them into the shape.
	 *
	 * @param {Object} memento
	 * @returns
	 */
	setPersistentAttributes: function(memento) {
		this._super(memento);/*this.alpha=1;*/this.setId(memento.id);
		//alert(JSON.stringify(memento.color))
		this.setColor(memento.color.hashString);
		this.setBackgroundColor(memento.bgcolor.hashString);
		this.setStroke(memento.stroke);
		// remove all decorations created in the constructor of this element
		//
		this.resetChildren();

		// and restore all children of the JSON document instead.
		//
		$.each(memento.labels, $.proxy(function(i, e) {
			//var label = new draw2d.shape.basic.Label(e.label);
			var label = new FLOShapeLabel(e.label);
			var locator = eval("new " + e.locator + "()");
			locator.setParent(this);
			this.addFigure(label, locator);
			label.installEditor(new FLOLabelInplaceEditor({
				// called after the value has been set to the LabelFigure
				onCommit: $.proxy(function(value) {
					//alert("new value set to:" + value);
					//update process data with the new description
										newnum="";
										if (!isNaN(value.split(" ")[0].split(".")[0])) {
											newnum = value.split(" ")[0];
											value = value.substring(value.indexOf(" ") + 1);
										}



					updateStepNameNum(label.getParent().getId(), value, newnum);
				})
			}));
		}, this));
	},

	/**
	 * @method
	 * Drill down to the next level if the user clicks on the element.
	 *
	 */
	onDoubleClick: function() {console.log("noactiondbl 1");},
});


var FLOLine = draw2d.shape.basic.Line.extend({

	NAME: "FLOLine",

	DEFAULT_COLOR: new draw2d.util.Color(0, 0, 0),

	/**
	 * @constructor
	 * Creates a new figure element which are not assigned to any canvas.
	 *
	 * @param {Number} start.x the x-coordinate of the start
	 * @param {Number} start.y the y-coordinate of the start
	 * @param {Number} end.x   the x-coordinate of the end
	 * @param {Number} end.y   the y-coordinate of the end
	 *
	 */
	init: function(startX, startY, endX, endY) {

		// for performance reasons if we made some bulk changes to the object
		// For this case we can block the repaint and enable it after the bulk
		// Update of the properties
		this.repaintBlocked = false;

		// click area for the line hit test
		this.corona = 10;
		this.isGlowing = false;
		this.lineColor = this.DEFAULT_COLOR;
		this.stroke = 1;

		this.dasharray = null; //can be one of: [��, �-�, �.�, �-.�, �-..�, �. �, �- �, �--�, �- .�, �--.�, �--..�] 
		if (typeof endY === "number") {
			this.start = new draw2d.geo.Point(startX, startY);
			this.end = new draw2d.geo.Point(endX, endY);
		} else {
			this.start = new draw2d.geo.Point(30, 30);
			this.end = new draw2d.geo.Point(100, 100);
		}

		this.basePoints = new draw2d.util.ArrayList();
		this.basePoints.add(this.start);
		this.basePoints.add(this.end);

		this._super();

		// create the selections handles/decorations
		this.installEditPolicy(new draw2d.policy.line.LineSelectionFeedbackPolicy());

		this.setSelectable(true);
		this.setDeleteable(true);

	},
        
        onContextMenu: function(x, y) {
		if (checkPermissions(pid) != true) {
		  if (confirm("You do not have permission to edit this process.  Click 'OK' to request permission from the process owner or 'Cancel' to return to the document.\n\nYou can print the process and its notes by clicking the print icon above.")){
			requestPermission(pid);
		}
		return
		}
		
				$.contextMenu({
					selector: 'body',
					events: {
						hide: function() {
							$.contextMenu('destroy');
						}
					},
					callback: $.proxy(function(key, options) {
						switch (key) {
						case "deleteswim":

							// delete line with undo/redo support
							try{
							if(confirm("Delete?")){var cmd = new draw2d.command.CommandDelete(this);
                                              		this.getCanvas().getCommandStack().execute(cmd);}
							}catch(e){}
                                                        // delete label with undo/redo support

							break;
						default:

							break;
						}

					}, this),
					x: x,
					y: y,
					items: {
						
						"deleteswim": {
							name: "Delete Swimlane",
							icon: "copy"
						},

					}

				});
			},

	/**
	 * @method
	 * Return an objects with all important attributes for XML or JSON serialization
	 *
	 * @returns {Object}
	 */
	getPersistentAttributes: function() {
		var memento = this._super();memento.id=this.getId();
		delete memento.x;
		delete memento.y;
		delete memento.width;
		delete memento.height;
		memento.start = this.getStartPoint();
		memento.end = this.getEndPoint();
		memento.stroke = this.stroke;
		memento.color = this.getColor().hash();
		memento.dasharray=this.dasharray;
		if (this.editPolicy.getSize() > 0) {
			memento.policy = this.editPolicy.getFirstElement().NAME;
		}

		return memento;
	},

	/**
	 * @method
	 * Read all attributes from the serialized properties and transfer them into the shape.
	 *
	 * @param {Object} memento
	 * @returns
	 */
	setPersistentAttributes: function(memento) {
		this._super(memento);/*this.alpha=1;*/this.setId(memento.id);
		this.setStartPoint(memento.start.x, memento.start.y);
		this.setDashArray(memento.dasharray)
		//alert(this.getStartPoint());
		this.setEndPoint(memento.end.x, memento.end.y);
		if (typeof memento.stroke !== "undefined") {
			this.setStroke(parseInt(memento.stroke));
		}
		if (typeof memento.color !== "undefined") {
			this.setColor(memento.color);
		}
		if (typeof memento.policy !== "undefined") {
			this.installEditPolicy(eval("new " + memento.policy + "()"));
		}
	}
});

var FLOLaneLine = draw2d.shape.basic.Line.extend({

	NAME: "FLOLaneLine",

	DEFAULT_COLOR: new draw2d.util.Color(0, 0, 0),

	/**
	 * @constructor
	 * Creates a new figure element which are not assigned to any canvas.
	 *
	 * @param {Number} start.x the x-coordinate of the start
	 * @param {Number} start.y the y-coordinate of the start
	 * @param {Number} end.x   the x-coordinate of the end
	 * @param {Number} end.y   the y-coordinate of the end
	 *
	 */
	init: function(startX, startY, endX, endY) {

		// for performance reasons if we made some bulk changes to the object
		// For this case we can block the repaint and enable it after the bulk
		// Update of the properties
		this.repaintBlocked = false;

		// click area for the line hit test
		this.corona = 10;
		this.isGlowing = false;
		this.lineColor = this.DEFAULT_COLOR;
		this.stroke = 1;

		this.dasharray = null; //can be one of: [��, �-�, �.�, �-.�, �-..�, �. �, �- �, �--�, �- .�, �--.�, �--..�] 
		if (typeof endY === "number") {
			this.start = new draw2d.geo.Point(startX, startY);
			this.end = new draw2d.geo.Point(endX, endY);
		} else {
			this.start = new draw2d.geo.Point(30, 30);
			this.end = new draw2d.geo.Point(100, 100);
		}

		this.basePoints = new draw2d.util.ArrayList();
		this.basePoints.add(this.start);
		this.basePoints.add(this.end);

		this._super();

		// create the selections handles/decorations
		this.installEditPolicy(new draw2d.policy.line.LineSelectionFeedbackPolicy());
		//this.installEditPolicy(new draw2d.policy.figure.HorizontalEditPolicy());
		this.setSelectable(true);
		this.setDeleteable(true);
	},
	    /**
		     * @method
		     * Called by the framework if the drag drop operation ends.
		     * 
		     * @param {draw2d.Canvas} canvas The host canvas
		     * @param {draw2d.Figure} figure The related figure
		     * @template
		     */
		    onUnselect: function(){
			    try{
				//loop through all shapes and update their roles
				allShapes=getStepArray();
				line=this;
				for(as=0;allShapes!=null && allShapes[as]!=null;as++)
				{
					figure=allShapes[as];
					roles=getRoles(figure.getAbsoluteY(),figure.getAbsoluteY()+figure.getHeight());
					//alert(figure.getId())
					//alert(roles+"--"+figure.userData.custrecord_flo_process_participants)
					revroles=roles.split(",");
					revroles=revroles.reverse().join();
	            	if(roles!=unescape(figure.userData.custrecord_flo_process_participants) && revroles!=unescape(figure.userData.custrecord_flo_process_participants) && roles!="" )
	            	{

							figure.userData.custrecord_flo_process_participants=escape(roles);
							
							debugger
					    	
					    	//setTimeout(function(){top.nlapiSubmitField("customrecord_flo_process",figure.getId(),"custrecord_flo_process_participants",roles)},100)
						
							var url_servlet = top.nlapiResolveURL('SUITELET', 'customscript_flo_record_update', 'customdeploy_flo_general_record_update');
									
							var url=url_servlet+'&id='+figure.getId()+'&recordtype=customrecord_flo_process&json=[{"field":"custrecord_flo_process_participants","multi":"F","values":"'+roles+'"}]'
			
					jQuery.ajax({
					  method: "POST",
					  url: url,
					})
					.done(function(msg){
					    console.log("roles updated onUnselect");
					})	


						diagChanged=true;//setTimeout(function(){saveProcess()},500);
		        //alert("ROLES:"+roles)
	            	}
				 }
		    	}catch(e){alert(e.message)}
		        //alert("submitted")
				line.shape.attr({cursor:"default"});
		        line.isMoving = false;
		    },
        
        onContextMenu: function(x, y) {
		if (checkPermissions(pid) != true) {
		  if (confirm("You do not have permission to edit this process.  Click 'OK' to request permission from the process owner or 'Cancel' to return to the document.\n\nYou can print the process and its notes by clicking the print icon above.")){
			requestPermission(pid);
		}
		return
		}
		
				$.contextMenu({
					selector: 'body',
					events: {
						hide: function() {
							$.contextMenu('destroy');
						}
					},
					callback: $.proxy(function(key, options) {
						switch (key) {
						case "deleteswim":

							// delete line with undo/redo support
							try
							{
								if(confirm("Delete?")){var cmd = new draw2d.command.CommandDelete(this);
                                this.getCanvas().getCommandStack().execute(cmd);}
							}
							catch(e){}
                            // delete label with undo/redo support

							break;
						default:

							break;
						}

					}, this),
					x: x,
					y: y,
					items: {
						
						"deleteswim": {
							name: "Delete Swimlane",
							icon: "copy"
						},

					}

				});
			},

	/**
	 * @method
	 * Return an objects with all important attributes for XML or JSON serialization
	 *
	 * @returns {Object}
	 */
	getPersistentAttributes: function() {
		var memento = this._super();memento.id=this.getId();
		delete memento.x;
		delete memento.y;
		delete memento.width;
		delete memento.height;
		memento.start = this.getStartPoint();
		memento.end = this.getEndPoint();
		memento.stroke = this.stroke;
		memento.color = this.getColor().hash();
		memento.dasharray=this.dasharray;
		if (this.editPolicy.getSize() > 0) {
			memento.policy = this.editPolicy.getFirstElement().NAME;
		}

		return memento;
	},

	/**
	 * @method
	 * Read all attributes from the serialized properties and transfer them into the shape.
	 *
	 * @param {Object} memento
	 * @returns
	 */
	setPersistentAttributes: function(memento) {
		this._super(memento);/*this.alpha=1;*/this.setId(memento.id);
		this.setStartPoint(memento.start.x, memento.start.y);
		this.setDashArray(memento.dasharray)
		//alert(this.getStartPoint());
		this.setEndPoint(memento.end.x, memento.end.y);
		if (typeof memento.stroke !== "undefined") {
			this.setStroke(parseInt(memento.stroke));
		}
		if (typeof memento.color !== "undefined") {
			this.setColor(memento.color);
		}
		if (typeof memento.policy !== "undefined") {
			this.installEditPolicy(eval("new " + memento.policy + "()"));
		}
	}
});


var FLOHLProcess = draw2d.shape.basic.Rectangle.extend({
	NAME: "FLOHLProcess",
	init: function (width, height, labeltext, showPorts, fontsize, strokesize, userdata, parentPro,id) {
        //alert(width+"--"+ height+"--"+ labeltext+"--"+ showPorts+"--"+ fontsize+"--"+ strokesize+"--"+JSON.stringify(userdata)+"--"+parentPro+"--"+id)
		this._super(width, height);
		this.setBackgroundColor("#FFFFFF");
		this.setStroke(strokesize);
		this.setAlpha(1);
		//set edit policy
        this.installEditPolicy(new ShapeSelectionPolicy());

		//set default userdata if blank
		if (userdata == null | userdata == "null" | userdata == "") 
		{
			if (parentPro != null && parentPro != "") 
			{
				console.log("new process"+parentPro)
				//get parent process
				parentdata = canvas.getFigure(parentPro).getUserData();
				if(canvas.getFigure(parentPro).count==null)
				{
					//canvas.getFigure(parentPro).count=getStepCount();
					canvas.getFigure(parentPro).count=parentLength;
				};
				console.log("C1:  "+canvas.getFigure(parentPro).count+ "PP "+ parentPro+" bid "+background.getId())
				//if(canvas.getFigure(parentPro).count==0 && (parentPro==background.getId() | 1==1)){canvas.getFigure(parentPro).count=1}
				canvas.getFigure(parentPro).count++;
				var newnumber = parentdata.custrecord_flo_number + "." + (parseInt(canvas.getFigure(parentPro).count));
				console.log("newnumber1 "+newnumber);
				var newname = " New " + unescape(parentdata.name) + " Process";
                                labeltext=cleanText(newname);
                                //canvas.getFigure(parentPro).count++;
                //alert(parentdata.name+"--"+labeltext)
                console.log("newnumber2 "+newnumber);
			} 
			else 
			{
				var newname = "New High-Level Process";
				var labeltext=newname+"";
				var newnumber = Math.max(parentLength+1,1);
				console.log("newnumber3 "+newnumber);
                                
			}
            


			//create new process record
			if(id==null)
			{
				newpid=new Date().getTime();
				console.log([newname,newnumber,newpid,parentPro,5])
				createNewProcess(newname,newnumber,newpid,parentPro,5);
				
			}
			else
			{canvas.getFigure(parentPro).count++;}
			console.log("PP "+parentPro)
			userdata = {
				"internalid": newpid,
				"name": newname,
				"custrecord_flo_number": newnumber,
				"custrecord_flo_process_parent": parentPro,
				"custrecord_flo_step_type": "",
				"custrecord_flo_process_document": "",
				"owner": "",
				"formulanumeric": "0",
				"custrecord_flo_process_type": "",
				"custrecord_flo_process_description": "",
				"custrecord_flo_diagram_file": "",
				"custrecord_flo_supp_process": ""
			}
			console.log("UD "+JSON.stringify(userdata))
			
			shortnumber=newnumber.toString();
			if (shortnumber != "") 
			{
				if(shortnumber.indexOf(".")>0)
				{
					shortnumber=shortnumber.substring(shortnumber.lastIndexOf(".")+1);
				}
				labeltext = shortnumber + " " + labeltext;
			}

			//alert(userdata)
			//if the parent is specified set it
			if (parentPro != null && parentPro != "") {
				userdata.custrecord_flo_process_parent = parentPro;
			}

		}

		this.setUserData(userdata)


		// Add Label
		if (labeltext == null | labeltext == "null" | labeltext == "" | labeltext == " ") {
			labeltext == "New Process Step";
		} else if (tlp[i] != null && tlp[i].custrecord_flo_number != null) {
			var numval = tlp[i].custrecord_flo_number;
			if(numval.lastIndexOf(".")>=0 )
			
			{numval=numval.substring(numval.lastIndexOf(".")+1)}
			if (numval == "") {
				numval = "#"
			}
			labeltext = numval + ' ' + labeltext;
		}
		//
		this.label = new FLOShapeLabel(labeltext, this, "#FFFFFF");

		this.label.setFontSize(fontsize);
		this.label.setId("label" + newpid);


		this.addFigure(this.label, new draw2d.layout.locator.CenterLocator(this));
		
		$( "#inplaceeditor" ).live( "dblclick", function( event ) {
		  event.stopPropagation();
		  event.preventDefault();
		});
		
		
		if(typeof(newnumber)=="undefined")
		{newnumber=this.getUserData().custrecord_flo_number}
		if(canvas.getFigure(parentPro)!=null)
		{console.log(newnumber+"--"+canvas.getFigure(parentPro).getUserData().custrecord_flo_number)}
        if(pid=="" | (canvas.getFigure(parentPro)!=null && newnumber.indexOf(canvas.getFigure(parentPro).getUserData().custrecord_flo_number)==0))
        {
		this.label.installEditor(new FLOLabelInplaceEditor({
			// called after the value has been set to the LabelFigure
			onCommit: $.proxy(function(value) {
				//alert("new value set to:" + value + "__" + this.getId());
                                
				
				if (!isNaN(parseInt(value.split(" ")[0]))) {
					newnum = value.split(" ")[0];
					value = value.substring(value.indexOf(" ") + 1);

				}
								
                                //clean text on label
                                value=cleanText(value);
                               this.label.setText(newnum+ ' '+value);
                                //update process record with description without number
				/*if (value != unescape(canvas.getFigure(this.getId()).getUserData().name)) {
					top.nlapiSubmitField("customrecord_flo_process", this.getId(), "name", value);
				}
				if (newnum != canvas.getFigure(this.getId()).getUserData().custrecord_flo_number) {
					top.nlapiSubmitField("customrecord_flo_process", this.getId(), "custrecord_flo_number", newnum);
				}*/
				//check if the process has been created already
				setTimeout(updateStepNameNum(this.getId(), value, newnum,true),500);
			}, this),
			// called if the user abort the operation
			onCancel: function() {}
		}));
    	}
        else
        {
			this.setBackgroundColor("#EEEEEE");
			this.label.setBackgroundColor("#EEEEEE");
		}

	},
	
	/*onDragEnd: function(){
		this._super();
		getHit(this.getX(),this.getY());
		//var targetId=getHit(this.getX(),this.getY());
		//alert("TID:"+targetId);
		thisTarget=canvas.getFigure(targetId)
		//alert(thisTarget.getX()+'!='+this.getX() +"&&"+ thisTarget.getY()+"!="+this.getY()+" && "+this.getX()+"-"+thisTarget.getX()+"<="+thisTarget.getWidth()+" && "+this.getY()+"-"+thisTarget.getY()+"<="+thisTarget.getHeight())
		//Check that there is a thisTarget, that it's not itself and that the new position is within the thisTarget
		if(thisTarget!=null && thisTarget.getX()!=this.getX() && thisTarget.getY()!=this.getY() && Math.abs(this.getX()-thisTarget.getX())<=thisTarget.getWidth() && Math.abs(this.getY()-thisTarget.getY())<=thisTarget.getHeight())
		{
			if(thisTarget.getUserData().type!=8)
			{
				move=confirm("Moving "+unescape(this.getUserData().name)+" under "+unescape(thisTarget.getUserData().name)+".\n\n- Press 'OK' to proceed.\n Press 'Cancel' to cancel.");
				if(move)
				{
					
					//setTimeout(function(){top.nlapiSubmitField("customrecord_flo_process",this.getId(),"custrecord_flo_process_parent",targetId);},500);
					//copyMove(this,thisTarget,false);
					top.nlapiSubmitField("customrecord_flo_process",this.getId(),"inactive","T")
					var cmd = new draw2d.command.CommandDelete(this);
					this.getCanvas().getCommandStack().execute(cmd);
				}
			}
			else
			{
				copyMove=confirm("You can copy the process to the sandbox or move it entirely.\n\n- Press 'OK' to copy\nPress 'Cancel' to move");
				if(copyMove)
				{
					copyChild=confirm("Copy all children as well?\n\n- Press 'OK' to copy children\nPress 'Cancel' to copy only this process");
					setTimeout(copyMove(this,thisTarget,true,copyChild),500);
				}
				else
				{
					setTimeout(copyMove(this,thisTarget,false),500);
					var cmd = new draw2d.command.CommandDelete(this);
					this.getCanvas().getCommandStack().execute(cmd);
				}
			}
		}
		
	},*/



	onContextMenu: function(x, y) {
if (checkPermissions(pid) != true) {
		  if (confirm("You do not have permission to edit this process.  \n\nYou can print the process and its notes by clicking the print icon above.")){
			requestPermission(pid);
		}
		return
		}
		if(pid!="")
		{
		$.contextMenu({
			selector: 'body',
			events: {
				hide: function() {
					$.contextMenu('destroy');
				}
			},
			callback: $.proxy(function(key, options) {
				switch (key) {
				case "red":
					thisObject.setColor("ff0000");
					break;
				case "black":
					thisObject.setColor("000000");
					break;
				case "yellow":
					thisObject.setColor("fdd107");
					break;
				case "bred":
					thisObject.setBackgroundColor("ff0000");
					break;
				case "bwhite":
					thisObject.setBackgroundColor("ffffff");
					break;
				case "bgray":
					thisObject.setBackgroundColor("fdd107");
					break;
				case "byellow":
					thisObject.setBackgroundColor("fdd107");
					break;
				case "details":
					explodedView(this.getUserData());
					break;
				case "openprocess":
					openProcess(this.getId());
					break;
				case "drill":
					drillDown(this.getId(), this.getUserData());
					break;
				case "delete":
					// without undo/redo support
					//     this.getCanvas().removeFigure(this);
					// with undo/redo support
					//window.parent.processdetail.nlapiSubmitField("customrecord_flo_process",this.getId(),"custrecord_flo_process_document",4);
					deleteShape(this)
					
				default:

					break;
				}

			}, this),
			x: x,
			y: y,
			items: {
				"op": {
						name: "Options:"
				},
				"sep2": "---------",
				"openprocess": {
					name: "<b>Open Process Record</b>"
				},
				"details": {
					name: "<b>Process Assistant</b>"
				},
				"drill": {
					name: "<b>Swim Lane</b>"
				},
				/*"sep": "---------",
				"pick": {
					name: "<b>Set Line Color:</b>"
				},
				"red": {
					name: "Red"
				},
				"black": {
					name: "Black"
				},
				"yellow": {
					name: "Yellow"
				},
				"sep1": "---------",
				"pick2": {
					name: "<b>Set Fill Color:</b>"
				},
				"bred": {
					name: "Red"
				},
				"bblack": {
					name: "Black"
				},
				"byellow": {
					name: "Yellow"
				},*/
				"sep2": "---------",
				//"copy": {name: "Copy", icon: "copy"},
				"delete": {
					name: "Delete"
				},
			}
		});
	  }//end of pid check
	  else
	  {
		$.contextMenu({
			selector: 'body',
			events: {
				hide: function() {
					$.contextMenu('destroy');
				}
			},
			callback: $.proxy(function(key, options) {
				switch (key) {
				case "details":
					explodedView(this.getUserData());
					break;
				case "openprocess":
					openProcess(this.getId());
					break;
				case "drill":
					drillDown(this.getId(), this.getUserData());
					break;
				case "delete":
					// without undo/redo support
					//     this.getCanvas().removeFigure(this);
					// with undo/redo support
					//window.parent.processdetail.nlapiSubmitField("customrecord_flo_process",this.getId(),"custrecord_flo_process_document",4);
					deleteShape(this)
				default:

					break;
				}

			}, this),
			x: x,
			y: y,
			items: {
				"op": {
						name: "Options:"
				},
				"sep2": "---------",
				"openprocess": {
					name: "<b>Open Process Record</b>"
				},
				"details": {
					name: "<b>Process Assistant</b>"
				},
				"drill": {
					name: "<b>Swim Lane</b>"
				},
				"sep2": "---------",
				//"copy": {name: "Copy", icon: "copy"},
				"delete": {
					name: "Delete"
				},
			}
		});
	  }

	},





	/**
	 * @method
	 * Drill down to the next level if the user clicks on the element.
	 *
	 */
	onDoubleClick: function() {
		console.log("dbl 1");
		drillDown(this.getId(), this.getUserData())
	},
	

});

var FLOSuppProcess = draw2d.shape.basic.Rectangle.extend({
	NAME: "FLOSuppProcess",
	init: function (width, height, labeltext, showPorts, fontsize, strokesize, userdata, parentPro,id) {
        
		this._super(width, height);
		this.setBackgroundColor("#FFFFFF");
		this.setStroke(strokesize);
		this.setAlpha(1);
                if(pid!="")
                {parentPro=pid}
        
		//set default userdata if blank
		if (userdata == null | userdata == "null" | userdata == "") {
			if (parentPro != null && parentPro != "") {
				//alert("new process"+parent)
				//get parent process
				parentdata = canvas.getFigure(parentPro).getUserData();
				var newnumber = "S"+parentdata.custrecord_flo_number + "." + (si+1);
				var labeltext = " New " + unescape(parentdata.name) + " Process";
                                labeltext=cleanText(labeltext);
			} else {
				var labeltext = "New Supporting Process";
				var newnumber = si + 1;
				newnumber = newnumber.toString();
				
                                
			}
            si++

			//create new process record
			if(id==null)
			{

				newpid=new Date().getTime();
				createNewProcess(labeltext,newnumber,newpid,parentPro,6);
			/*var newprocess = top.nlapiCreateRecord("customrecord_flo_process");

			newprocess.setFieldValue("name", labeltext.replace("\n"," "));
			newprocess.setFieldValue("custrecord_flo_number", newnumber);
			if (parent != "") {
				parentvals = new Array();
				parentvals[0] = parentPro;

				newprocess.setFieldValues("custrecord_flo_process_parent", parentvals);
				//alert(newprocess.getFieldValues("custrecord_flo_process_parent"));
			}

                            newprocess.setFieldValue("custrecord_flo_step_type", 6);
                        
			try {
				newpid = top.nlapiSubmitRecord(newprocess);
				} catch (e) {alert(e.message)}*/
			}
/*if(parentPro!="")
{
canvas.getFigure(parentPro).count++;
//alert(canvas.getFigure(parentPro).count);
//alert(parentPro.count);
}
			
		
		else
		{canvas.getFigure(parentPro).count++;}*/
			if (newnumber != "" && newnumber.indexOf("S")!=0) {
				newnumber = "S"+ newnumber ;
			}
			
			userdata = {
				"internalid": newpid,
				"name": labeltext,
				"custrecord_flo_number": newnumber,
				"custrecord_flo_process_parent": parent,
				"custrecord_flo_step_type": "",
				"custrecord_flo_process_document": "",
				"owner": "",
				"formulanumeric": "0",
				"custrecord_flo_process_type": "",
				"custrecord_flo_process_description": "",
				"custrecord_flo_diagram_file": "",
				"custrecord_flo_supp_process": ""
			}

			//alert(userdata)
			//if the parent is specified set it
			if (parentPro != null && parentPro != "") {
				userdata.custrecord_flo_process_parent = parent;
			}

		}

		this.setUserData(userdata);
		userdata=this.getUserData();


		// Add Label
		if (labeltext == null | labeltext == "null" | labeltext == "" | labeltext == " ") {
			labeltext == "New Supporting Process";
		} else if (userdata != null && userdata.custrecord_flo_number != null) {
			var numval = userdata.custrecord_flo_number;
			if (numval == "") {
				numval = "#"
			}
			
			/*labeltext = numval + ' ' + labeltext;
			if(labeltext.indexOf("S")!=0)
			{labeltext="S"+labeltext;}*/
		}
		//
		this.label = new FLOShapeLabel(numval+" "+labeltext, this, "#FFFFFF");

		this.label.setFontSize(fontsize);
		this.label.setId("label" + newpid);


		this.addFigure(this.label, new draw2d.layout.locator.CenterLocator(this));

		this.label.installEditor(new FLOLabelInplaceEditor({
			// called after the value has been set to the LabelFigure
			onCommit: $.proxy(function(value) {
				//alert("new value set to:" + value + "__" + this.getId());
                                

				if (!isNaN(value.split(" ")[0])) {
					newnum = value.split(" ")[0];
					value = value.substring(value.indexOf(" ") + 1);

				}

                                //clean text on label
                                value=cleanText(value);
                               this.label.setText(newnum+ ' '+value);
                                //update process record with description without number
				if (value != unescape(canvas.getFigure(this.getId()).getUserData().name)) {
					//top.nlapiSubmitField("customrecord_flo_process", this.getId(), "name", value);


							var url_servlet = top.nlapiResolveURL('SUITELET', 'customscript_flo_record_update', 'customdeploy_flo_general_record_update');
									
							var url=url_servlet+'&id='+this.getId()+'&recordtype=customrecord_flo_process&json=[{"field":"name","multi":"F","values":"'+name+'"}]'
			
					jQuery.ajax({
					  method: "POST",
					  url: url,
					})
					.done(function(msg){
					    console.log("name updated");
					})

				}
				if (newnum != canvas.getFigure(this.getId()).getUserData().custrecord_flo_number) {
					//top.nlapiSubmitField("customrecord_flo_process", this.getId(), "custrecord_flo_number", newnum);


							var url_servlet = top.nlapiResolveURL('SUITELET', 'customscript_flo_record_update', 'customdeploy_flo_general_record_update');
									
							var url=url_servlet+'&id='+this.getId()+'&recordtype=customrecord_flo_process&json=[{"field":"custrecord_flo_number","multi":"F","values":"'+newnum+'"}]'
			
					jQuery.ajax({
					  method: "POST",
					  url: url,
					})
					.done(function(msg){
					    console.log("newnum updated");
					})

				}
				updateStepNameNum(this.getId(), value, newnum);
			}, this),
			// called if the user abort the operation
			onCancel: function() {}
		}));


	},



	onContextMenu: function(x, y) {
if (checkPermissions(pid) != true) {
		  if (confirm("You do not have permission to edit this process.  Click 'OK' to request permission from the process owner or 'Cancel' to return to the document.\n\nYou can print the process and its notes by clicking the print icon above.")){
			requestPermission(pid);
		}
		return
		}
		$.contextMenu({
			selector: 'body',
			events: {
				hide: function() {
					$.contextMenu('destroy');
				}
			},
			callback: $.proxy(function(key, options) {
				switch (key) {
				case "red":
					thisObject.setColor("ff0000");
					break;
				case "black":
					thisObject.setColor("000000");
					break;
				case "yellow":
					thisObject.setColor("fdd107");
					break;
				case "bred":
					thisObject.setBackgroundColor("ff0000");
					break;
				case "bwhite":
					thisObject.setBackgroundColor("ffffff");
					break;
				case "bgray":
					thisObject.setBackgroundColor("fdd107");
					break;
				case "byellow":
					thisObject.setBackgroundColor("fdd107");
					break;
				case "copy":

					break;
				case "details":
					explodedView(this.getUserData());
					break;
				case "openprocess":
					openProcess(this.getId());
					break;
				case "drill":
					drillDown(this.getId(), this.getUserData());
					break;
				case "delete":
					// without undo/redo support
					//     this.getCanvas().removeFigure(this);
					// with undo/redo support
					//window.parent.processdetail.nlapiSubmitField("customrecord_flo_process",this.getId(),"custrecord_flo_process_document",4);
					if(confirm("Delete?")){
					
					top.nlapiSubmitField("customrecord_flo_process", this.getId(), "isinactive", "T");

					    console.log("shape deleted:"+this.getId());

					/*var url_servlet = top.nlapiResolveURL('SUITELET', 'customscript_flo_record_update', 'customdeploy_flo_general_record_update');
									
					var url=url_servlet+'&id='+this.getId()+'&recordtype=customrecord_flo_process&json=[{"field":"isinactive","multi":"F","values":"T"}]'
			
					jQuery.ajax({
					  method: "POST",
					  url: url,
					})
					.done(function(msg){
					    console.log("shape deleted");
					})	
					*/

					var cmd = new draw2d.command.CommandDelete(this);
					this.getCanvas().getCommandStack().execute(cmd);
				}
				default:

					break;
				}

			}, this),
			x: x,
			y: y,
			items: {
				"op": {
						name: "Options:"
				},
				"sep2": "---------",
				"openprocess": {
					name: "<b>Open Process Record</b>"
				},
				"details": {
					name: "<b>Process Assistant</b>"
				},
				"drill": {
					name: "<b>Swim Lane</b>"
				},
				/*"sep": "---------",
				"pick": {
					name: "<b>Set Line Color:</b>"
				},
				"red": {
					name: "Red"
				},
				"black": {
					name: "Black"
				},
				"yellow": {
					name: "Yellow"
				},
				"sep1": "---------",
				"pick2": {
					name: "<b>Set Fill Color:</b>"
				},
				"bred": {
					name: "Red"
				},
				"bblack": {
					name: "Black"
				},
				"byellow": {
					name: "Yellow"
				},*/
				"sep2": "---------",
				//"copy": {name: "Copy", icon: "copy"},
				"delete": {
					name: "Delete"
				},
			}
		});

	},





	/**
	 * @method
	 * Drill down to the next level if the user clicks on the element.
	 *
	 */
	onDoubleClick: function() {
		console.log("dbl 2");
		drillDown(this.getId(), this.getUserData())
	}
});

var FLOProcessSandbox = draw2d.shape.basic.Rectangle.extend({
	NAME: "FLOProcessSandbox",
	init: function (width, height, labeltext, showPorts, fontsize, strokesize, userdata, parentPro,id) {
        
		this._super(width, height);
		this.setBackgroundColor("#FFFFFF");
		this.setStroke(strokesize);
		this.setAlpha(1);
                if(pid!="")
                {
					parentPro=pid
				}

		//set default userdata if blank
		if (userdata == null | userdata == "null" | userdata == "") {
			if (parentPro != null && parentPro != "") {
				//alert("new process"+parent)
				//get parent process
				parentdata = canvas.getFigure(parentPro).getUserData();
				//alert(JSON.stringify(parentdata))
				var newnumber = "SB"+parentdata.custrecord_flo_number + "." + (sb++ + 1);
				var labeltext = unescape(parentdata.name) + " Process Sandbox";
                                labeltext=cleanText(labeltext);
			} else {
				var labeltext = "Process Sandbox";
				var newnumber = sb++ + 1;
                newnumber=newnumber.toString();               
			}


			//create new process record
			if(id==null)
			{
				newpid=new Date().getTime();
				createNewProcess(labeltext,newnumber,newpid,parentPro,8);
			/*var newprocess = top.nlapiCreateRecord("customrecord_flo_process");

			newprocess.setFieldValue("name", labeltext.replace("\n"," "));
			newprocess.setFieldValue("custrecord_flo_number", newnumber);
			if (parent != "") {
				parentvals = new Array();
				parentvals[0] = parentPro;

				newprocess.setFieldValues("custrecord_flo_process_parent", parentvals);
				//alert(newprocess.getFieldValues("custrecord_flo_process_parent"));
			}

                            newprocess.setFieldValue("custrecord_flo_step_type", 8);
                        
			try {
				newpid = top.nlapiSubmitRecord(newprocess);
				} catch (e) {alert(e.message)}*/
			}
/*if(parentPro!="")
{
canvas.getFigure(parentPro).count++;
//alert(canvas.getFigure(parentPro).count);
//alert(parentPro.count);
}
			
		
		else
		{canvas.getFigure(parentPro).count++;}*/
		if (newnumber != "" && newnumber.indexOf("SB")!=0) {
			newnumber = "SB"+ newnumber ;
		}
			userdata = {
				"internalid": newpid,
				"name": labeltext,
				"custrecord_flo_number": newnumber,
				"custrecord_flo_process_parent": parent,
				"custrecord_flo_step_type": "",
				"custrecord_flo_process_document": "",
				"owner": "",
				"formulanumeric": "0",
				"custrecord_flo_process_type": "",
				"custrecord_flo_process_description": "",
				"custrecord_flo_diagram_file": "",
				"custrecord_flo_supp_process": ""
			}

			//alert(userdata)
			//if the parent is specified set it
			if (parentPro != null && parentPro != "") {
				userdata.custrecord_flo_process_parent = parent;
			}

		}

		this.setUserData(userdata);
		userdata=this.getUserData();


		// Add Label
		if (labeltext == null | labeltext == "null" | labeltext == "" | labeltext == " ") {
			labeltext == "New Supporting Process";
		} else if (userdata != null && userdata.custrecord_flo_number != null) {
			var numval = userdata.custrecord_flo_number;
			if (numval == "") {
				numval = "#"
			}
			
			/*labeltext = numval + ' ' + labeltext;
			if(labeltext.indexOf("S")!=0)
			{labeltext="S"+labeltext;}*/
		}
		//
		this.label = new FLOShapeLabel(numval+" "+labeltext, this, "#FFFFFF");

		this.label.setFontSize(fontsize);
		this.label.setId("label" + newpid);


		this.addFigure(this.label, new draw2d.layout.locator.CenterLocator(this));

		this.label.installEditor(new FLOLabelInplaceEditor({
			// called after the value has been set to the LabelFigure
			onCommit: $.proxy(function(value) {
				//alert("new value set to:" + value + "__" + this.getId());
                                

				if (!isNaN(value.split(" ")[0])) {
					newnum = value.split(" ")[0];
					value = value.substring(value.indexOf(" ") + 1);

				}

                                //clean text on label
                                value=cleanText(value);
                               this.label.setText(newnum+ ' '+value);
                                //update process record with description without number
				if (value != unescape(canvas.getFigure(this.getId()).getUserData().name)) {
					//top.nlapiSubmitField("customrecord_flo_process", this.getId(), "name", value);


							var url_servlet = top.nlapiResolveURL('SUITELET', 'customscript_flo_record_update', 'customdeploy_flo_general_record_update');
									
							var url=url_servlet+'&id='+this.getId()+'&recordtype=customrecord_flo_process&json=[{"field":"name","multi":"F","values":"'+name+'"}]'
			
					jQuery.ajax({
					  method: "POST",
					  url: url,
					})
					.done(function(msg){
					    console.log("name updated");
					})



				}
				if (newnum != canvas.getFigure(this.getId()).getUserData().custrecord_flo_number) {
					//top.nlapiSubmitField("customrecord_flo_process", this.getId(), "custrecord_flo_number", newnum);

		var url_servlet = top.nlapiResolveURL('SUITELET', 'customscript_flo_record_update', 'customdeploy_flo_general_record_update');
									
							var url=url_servlet+'&id='+this.getId()+'&recordtype=customrecord_flo_process&json=[{"field":"custrecord_flo_number","multi":"F","values":"'+newnum+'"}]'
			
					jQuery.ajax({
					  method: "POST",
					  url: url,
					})
					.done(function(msg){
					    console.log("newnum updated");
					})


				}
				updateStepNameNum(this.getId(), value, newnum);
			}, this),
			// called if the user abort the operation
			onCancel: function() {}
		}));


	},



	onContextMenu: function(x, y) {
if (checkPermissions(pid) != true) {
		  if (confirm("You do not have permission to edit this process.  Click 'OK' to request permission from the process owner or 'Cancel' to return to the document.\n\nYou can print the process and its notes by clicking the print icon above.")){
			requestPermission(pid);
		}
		return
		}
		$.contextMenu({
			selector: 'body',
			events: {
				hide: function() {
					$.contextMenu('destroy');
				}
			},
			callback: $.proxy(function(key, options) {
				switch (key) {
				case "red":
					thisObject.setColor("ff0000");
					break;
				case "black":
					thisObject.setColor("000000");
					break;
				case "yellow":
					thisObject.setColor("fdd107");
					break;
				case "bred":
					thisObject.setBackgroundColor("ff0000");
					break;
				case "bwhite":
					thisObject.setBackgroundColor("ffffff");
					break;
				case "bgray":
					thisObject.setBackgroundColor("fdd107");
					break;
				case "byellow":
					thisObject.setBackgroundColor("fdd107");
					break;
				case "copy":

					break;
				case "openprocess":
					openProcess(this.getId());
					break;
				case "details":
					explodedView(this.getUserData());
					break;
				case "drill":
					drillDown(this.getId(), this.getUserData());
					break;
				case "delete":
					// without undo/redo support
					//     this.getCanvas().removeFigure(this);
					// with undo/redo support
					//window.parent.processdetail.nlapiSubmitField("customrecord_flo_process",this.getId(),"custrecord_flo_process_document",4);
					if(confirm("Delete?")){
					
					top.nlapiSubmitField("customrecord_flo_process", this.getId(), "isinactive", "T");

					/*var url_servlet = top.nlapiResolveURL('SUITELET', 'customscript_flo_record_update', 'customdeploy_flo_general_record_update');
									
					var url=url_servlet+'&id='+this.getId()+'&recordtype=customrecord_flo_process&json=[{"field":"isinactive","multi":"F","values":"T"}]'
			
					jQuery.ajax({
					  method: "POST",
					  url: url,
					})
					.done(function(msg){
					    console.log("process record deleted");
					})	*/


					var cmd = new draw2d.command.CommandDelete(this);
					this.getCanvas().getCommandStack().execute(cmd);}
				default:

					break;
				}

			}, this),
			x: x,
			y: y,
			items: {
				"op": {
						name: "Options:"
				},
				"sep2": "---------",
				"openprocess": {
					name: "<b>Open Process Record</b>"
				},
				"details": {
					name: "<b>Process Assistant</b>"
				},
				"drill": {
					name: "<b>Swim Lane</b>"
				},
			/*	"sep": "---------",
				"pick": {
					name: "<b>Set Line Color:</b>"
				},
				"red": {
					name: "Red"
				},
				"black": {
					name: "Black"
				},
				"yellow": {
					name: "Yellow"
				},
				"sep1": "---------",
				"pick2": {
					name: "<b>Set Fill Color:</b>"
				},
				"bred": {
					name: "Red"
				},
				"bblack": {
					name: "Black"
				},
				"byellow": {
					name: "Yellow"
				},*/
				"sep2": "---------",
				//"copy": {name: "Copy", icon: "copy"},
				"delete": {
					name: "Delete"
				},
			}
		});

	},





	/**
	 * @method
	 * Drill down to the next level if the user clicks on the element.
	 *
	 */
	onDoubleClick: function() {
		console.log("dbl 3");
		drillDown(this.getId(), this.getUserData())
	}
});

var FLOStart = draw2d.shape.basic.Oval.extend({
	NAME: "FLOStart",
	init: function(width, height, labeltext, showPorts, fontsize, strokesize) {

		this._super(width, height);
		this.setBackgroundColor("#FFFFFF");
		this.setStroke(Math.max(strokesize*.75,1));
		this.setAlpha(1);
		this.createPort("output");
		this.setSelectable(true);
		this.setDeleteable(true);
		this.setResizeable(true);


		// Add Label
		//
		//this.label = new draw2d.shape.basic.Label("Start");
		this.label = new FLOShapeLabel("Start");
		this.label.setColor("#000000");
		this.label.setBackgroundColor("#FFFFFF");
		this.label.setFontColor("#000000");
		this.label.setStroke(0);
		this.label.setFontSize(fontsize / 1.25);
		this.addFigure(this.label, new draw2d.layout.locator.CenterLocator(this));

		this.label.installEditor(new FLOLabelInplaceEditor({
			// called after the value has been set to the LabelFigure
			onCommit: $.proxy(function(value) {
				//alert("new value set to:" + value);
				//update process data with the new description
				if (!isNaN(value.split(" ")[0])) {
					newnum = value.split(" ")[0];
					value = value.substring(value.indexOf(" ") + 1);
				}

				updateStepNameNum(this.getId(), value, newnum);
			})
		}));
	},

	/**
	 * @method
	 * Return an objects with all important attributes for XML or JSON serialization
	 *
	 * @returns {Object}
	 */
	getPersistentAttributes: function() {
		var memento = this._super();memento.id=this.getId();
		memento.color = this.getColor();
		memento.bgcolor = this.getBackgroundColor();
		memento.stroke = this.getStroke();
		this.setSelectable(true);
		this.setDeleteable(true);
		

		// add all decorations to the memento 
		//
		memento.labels = [];
		this.children.each(function(i, e) {
			memento.labels.push({
				id: e.figure.getId(),
				label: e.figure.getText(),
				locator: e.locator.NAME,

			});
		});

		return memento;
	},

	/**
	 * @method
	 * Read all attributes from the serialized properties and transfer them into the shape.
	 *
	 * @param {Object} memento
	 * @returns
	 */
	setPersistentAttributes: function(memento) {
		this._super(memento);/*this.alpha=1;*/this.setId(memento.id);
		//alert(JSON.stringify(memento.color))
		this.setColor(memento.color.hashString);
		this.setBackgroundColor(memento.bgcolor.hashString);
		this.setStroke(memento.stroke);
		// remove all decorations created in the constructor of this element
		//
		this.resetChildren();

		// and restore all children of the JSON document instead.
		//
		$.each(memento.labels, $.proxy(function(i, e) {
			//var label = new draw2d.shape.basic.Label(e.label);
			var label = new FLOShapeLabel(e.label);
			var locator = eval("new " + e.locator + "()");
			locator.setParent(this);
			this.addFigure(label, locator);
			label.installEditor(new FLOLabelInplaceEditor({
				// called after the value has been set to the LabelFigure
				onCommit: $.proxy(function(value) {
					//alert("new value set to:" + value);
					//update process data with the new description
					if (!isNaN(value.split(" ")[0])) {
						newnum = value.split(" ")[0];
						value = value.substring(value.indexOf(" ") + 1);
					}
					alert("ID:"+this.getId())
					updateStepNameNum(this.getId(), value, newnum);
				})
			}));
		}, this));
	},

	onContextMenu: function(x, y) {
		shapeClick(this, x, y)
	},


});

var FLOEnd = draw2d.shape.basic.Oval.extend({
	NAME: "FLOEnd",
	init: function(width, height, labeltext, showPorts, fontsize, strokesize) {

		this._super(width, height);
		this.setBackgroundColor("#FFFFFF");
		this.setStroke(Math.max(strokesize*.75,1));
		this.setAlpha(1);
		this.createPort("input");
		

		port3=this.createPort("input", new MyTopPortLocator(this));
		port3.setName("top");
		port4=this.createPort("input", new MyBottomPortLocator(this));
		port4.setName("bottom");

		// Add Label
		//
		//this.label = new draw2d.shape.basic.Label("End");
		this.label = new FLOShapeLabel("End");
		this.label.setColor("#000000");
		this.label.setBackgroundColor("#FFFFFF");
		this.label.setFontColor("#000000");
		this.label.setStroke(0);
		this.label.setFontSize(fontsize / 1.5);

		this.addFigure(this.label, new draw2d.layout.locator.CenterLocator(this));

		this.label.installEditor(new FLOLabelInplaceEditor({
			// called after the value has been set to the LabelFigure
			onCommit: $.proxy(function(value) {
				//alert("new value set to:" + value);
				//update process data with the new description
				if (!isNaN(value.split(" ")[0])) {
					newnum = value.split(" ")[0];
					value = value.substring(value.indexOf(" ") + 1);
				}

				updateStepNameNum(this.getId(), value, newnum);
			})
		}));
	},

	/**
	 * @method
	 * Return an objects with all important attributes for XML or JSON serialization
	 *
	 * @returns {Object}
	 */
	getPersistentAttributes: function() {
		var memento = this._super();memento.id=this.getId();
		memento.color = this.getColor();
		memento.bgcolor = this.getBackgroundColor();
		memento.stroke = this.getStroke();

		// add all decorations to the memento 
		//
		memento.labels = [];
		this.children.each(function(i, e) {
			memento.labels.push({
				id: e.figure.getId(),
				label: e.figure.getText(),
				locator: e.locator.NAME,

			});
		});

		return memento;
	},

	/**
	 * @method
	 * Read all attributes from the serialized properties and transfer them into the shape.
	 *
	 * @param {Object} memento
	 * @returns
	 */
	setPersistentAttributes: function(memento) {
		this._super(memento);/*this.alpha=1;*/this.setId(memento.id);
		//alert(JSON.stringify(memento.color))
		this.setColor(memento.color.hashString);
		this.setBackgroundColor(memento.bgcolor.hashString);
		this.setStroke(memento.stroke);
		// remove all decorations created in the constructor of this element
		//
		this.resetChildren();

		// and restore all children of the JSON document instead.
		//
		$.each(memento.labels, $.proxy(function(i, e) {
			//var label = new draw2d.shape.basic.Label(e.label);
			var label = new FLOShapeLabel(e.label);
			var locator = eval("new " + e.locator + "()");
			locator.setParent(this);
			this.addFigure(label, locator);
			label.installEditor(new FLOLabelInplaceEditor({
				// called after the value has been set to the LabelFigure
				onCommit: $.proxy(function(value) {
					//alert("new value set to:" + value);
					//update process data with the new description
					if (!isNaN(value.split(" ")[0])) {
						newnum = value.split(" ")[0];
						value = value.substring(value.indexOf(" ") + 1);
					}

					updateStepNameNum(this.getId(), value, newnum);
				})
			}));
		}, this));
	},

	onContextMenu: function(x, y) {
		shapeClick(this, x, y)
	},


});


	var FLONextPage = draw2d.shape.basic.Oval.extend({
		NAME: "FLONextPage",
			init: function (width, height, labeltext, showPorts, fontsize, strokesize, color, bgcolor,userdata,parentPro,id) {
				//this._super(100, 50);
				this._super(width,height);
				//this.setDimension(width, height);
			try{
				if(labeltext.indexOf("- p.")<0)
				{
					pagename=unescape(canvas.getFigure(pid).getUserData().name);
					if(pagename.indexOf("- p.")<0)
					{pagename=pagename+"- p.2"}
					else
					{pagename=pagename.split("- p.")[0]+"- p."+ (parseInt(pagename.split("- p.")[1])+1)}
					labeltext=pagename
				}
			}catch(e){

			}
				//alert("adding")
				makeShape(this,width, height, labeltext, showPorts, fontsize, strokesize, color, bgcolor,userdata,parentPro,id,7);
				//alert(JSON.stringify(this.getColor()))

			},

			onContextMenu: function(x, y) {
				shapeClick(this, x, y)
			},



			/** @method
			 * Enlarge the detail window
			 *
			 */
			onClick: function() {
				//explodedView(this.getId())
			},

			/**
			 * @method
			 * Drill down to the next level if the user clicks on the element.
			 *
			 */
			onDoubleClick: function() {
				console.log("dbl 4");
				//alert(this.getId()+"--"+JSON.stringify(canvas.getFigure(pid).getUserData()))
				drillDown(this.getId(),this.getUserData())
			},

				/**
				 * @method
				 * Return an objects with all important attributes for XML or JSON serialization
				 *
				 * @returns {Object}
				 */
				getPersistentAttributes: function() {
					var memento = this._super();memento.id=this.getId();
					memento.color = this.getColor();
					memento.bgcolor = this.getBackgroundColor();
					//alert(JSON.stringify(memento.bgcolor))
					memento.stroke = this.getStroke();

					// add all decorations to the memento 
					//
					memento.labels = [];
					this.children.each(function(i, e) {
						memento.labels.push({
							id: e.figure.getId(),
							label: e.figure.getText(),
							locator: e.locator.NAME,

						});
					});

					return memento;
				},

				/**
				 * @method
				 * Read all attributes from the serialized properties and transfer them into the shape.
				 *
				 * @param {Object} memento
				 * @returns
				 */
				setPersistentAttributes: function(memento) {
					this._super(memento);/*this.alpha=1;*/this.setId(memento.id);
					//alert(JSON.stringify(memento.color))
					this.setColor(memento.color.hashString);
					this.setBackgroundColor(memento.bgcolor.hashString);
					//alert(memento.bgcolor.hashString)
					if(memento.bgcolor.hashString=="none")
					{this.setBackgroundColor("#FFFFFF")}
					else
					{this.setBackgroundColor(memento.bgcolor.hashString);}
					this.setStroke(memento.stroke);
					// remove all decorations created in the constructor of this element
					//
					this.resetChildren();

					// and restore all children of the JSON document instead.
					//
					$.each(memento.labels, $.proxy(function(i, e) {
						//var label = new draw2d.shape.basic.Label(e.label);
						var label = new FLOShapeLabel(e.label);
						var locator = eval("new " + e.locator + "()");
						locator.setParent(this);
						this.addFigure(label, locator);
						label.installEditor(new FLOLabelInplaceEditor({
							// called after the value has been set to the LabelFigure
							onCommit: $.proxy(function(value) {
								//alert("new value set to:" + value);
								//update process data with the new description
								if (!isNaN(value.split(" ")[0])) {
									newnum = value.split(" ")[0];
									value = value.substring(value.indexOf(" ") + 1);
								}

								updateStepNameNum(this.getId(), value, newnum);
							})
						}));
					}, this));
				},
			});

var FLODecision = draw2d.shape.basic.Diamond.extend({
	NAME: "FLODecision",
	init: function (width, height, labeltext, showPorts, fontsize, strokesize, color, bgcolor,userdata,parentPro,id) {

		this._super(width, height);
		makeShape(this,width*1.25, height*1.25, labeltext, showPorts, fontsize, strokesize, color, bgcolor,userdata,parentPro,id,3);

	},

	onContextMenu: function(x, y) {
		shapeClick(this, x, y)
	},

	/**
	 * @method
	 * Return an objects with all important attributes for XML or JSON serialization
	 *
	 * @returns {Object}
	 */
	getPersistentAttributes: function() {
		var memento = this._super();memento.id=this.getId();
		memento.color = this.getColor();
		memento.bgcolor = this.getBackgroundColor();
		//alert(JSON.stringify(memento.bgcolor))
		memento.stroke = this.getStroke();

		// add all decorations to the memento 
		//
		memento.labels = [];
		this.children.each(function(i, e) {
			memento.labels.push({
				id: e.figure.getId(),
				label: e.figure.getText(),
				locator: e.locator.NAME,

			});
		});

		return memento;
	},

	/**
	 * @method
	 * Read all attributes from the serialized properties and transfer them into the shape.
	 *
	 * @param {Object} memento
	 * @returns
	 */
	setPersistentAttributes: function(memento) {
		this._super(memento);/*this.alpha=1;*/this.setId(memento.id);
		//alert(JSON.stringify(memento.color))
		this.setColor(memento.color.hashString);
		this.setBackgroundColor(memento.bgcolor.hashString);
		//alert(memento.bgcolor.hashString)
		if(memento.bgcolor.hashString=="none")
		{this.setBackgroundColor("#FFFFFF")}
		else
		{this.setBackgroundColor(memento.bgcolor.hashString);}
		this.setStroke(memento.stroke);
		// remove all decorations created in the constructor of this element
		//
		this.resetChildren();

		// and restore all children of the JSON document instead.
		//
		$.each(memento.labels, $.proxy(function(i, e) {
			//var label = new draw2d.shape.basic.Label(e.label);
			var label = new FLOShapeLabel(e.label);
			var locator = eval("new " + e.locator + "()");
			locator.setParent(this);
			this.addFigure(label, locator);
			label.installEditor(new FLOLabelInplaceEditor({
				// called after the value has been set to the LabelFigure
				onCommit: $.proxy(function(value) {
					//alert("new value set to:" + value);
					//update process data with the new description
										newnum="";
										if (!isNaN(value.split(" ")[0].split(".")[0].replace("S",""))) {
											newnum = value.split(" ")[0];
											value = value.substring(value.indexOf(" ") + 1);
										}



					updateStepNameNum(label.getParent().getId(), value, newnum);
				})
			}));
		}, this));
	},
});

var FLOProcess = draw2d.VectorFigure.extend({
	NAME: "FLOProcess",
	init: function (width, height, labeltext, showPorts, fontsize, strokesize, color, bgcolor,userdata,parentPro,id) {
		this._super();
		this.setDimension(width, height);
		//alert(labeltext)
		makeShape(this,width, height, labeltext, showPorts, fontsize, strokesize, color, bgcolor,userdata,parentPro,id,4);
		//alert(JSON.stringify(this.getColor()))

	},


	/**
	 * @inheritdoc
	 **/
	repaint: function(attributes) {
		if (this.shape === null) {
			return;
		}

		if (typeof attributes === "undefined") {
			attributes = {};
		}
		x = parseInt(this.getAbsoluteX());
		y = parseInt(this.getAbsoluteY());

		
		attributes.path = 'M' + x + ' ' + y + ' L' + (x + this.getWidth()) + ' ' + y + ' L' + (x + this.getWidth()) + ' ' + (y + this.getHeight()) + ' L' + x + ' ' + (y + this.getHeight()) + ' L' + (x + this.getWidth() * .1) + ' ' + (y + this.getHeight()) + ' L' + (x + this.getWidth() * .1) + ' ' + (y + 1) + ' L' + (x + this.getWidth() * .1) + ' ' + (y + this.getHeight()) + ' L' + x + '  ' + (y + this.getHeight()) + ' L' + (x + this.getWidth() * .9) + '  ' + (y + this.getHeight()) + ' L' + (x + this.getWidth() * .9) + '  ' + (y + 1) + ' L' + (x + this.getWidth() * .9) + '  ' + (y + this.getHeight()) + ' L' + (x + 0) + '  ' + (y + this.getHeight()) + ' L' + x + '  ' + y + +' Z';
		//alert(attributes.path)

		this._super(attributes);
		/*this.alpha=1;*/
		
	},
	
   
    /**
     * @method
     * Called by the framework if the related shape has init a drag&drop
     * operation
     * 
     * @param {draw2d.Canvas} canvas The host canvas
     * @param {draw2d.Figure} figure The related figure
     * @template
     */
    /*onDragStart: function(){
	    figure=this;
    	figure.shape.attr({cursor:"move"});
    	figure.isMoving = false;
    	figure.originalAlpha = figure.getAlpha();
        roles=getRoles(figure.getAbsoluteY(),figure.getAbsoluteY()+figure.getHeight());
        figure.userData.custrecord_flo_process_participants=roles;
        figure.userData.height=figure.getHeight();
        figure.userData.width=figure.getWidth();
        figure.userData.y=figure.getY();
        figure.userData.x=figure.getX();
    },*/
	/**
	     * @method
	     * Called by the framework if the drag drop operation ends.
	     * 
	     * @param {draw2d.Canvas} canvas The host canvas
	     * @param {draw2d.Figure} figure The related figure
	     * @template
	     */
	    onUnselect: function(){
		    try{
			figure=this;
			roles=getRoles(figure.getAbsoluteY(),figure.getAbsoluteY()+figure.getHeight());
			//alert(figure.getId())
			//alert(roles+"--"+figure.userData.custrecord_flo_process_participants)
            if(roles!=unescape(figure.userData.custrecord_flo_process_participants) | figure.getHeight()!=figure.userData.height | figure.getWidth()!=figure.userData.width | figure.getX()!=figure.userData.x | figure.getY()!=figure.userData.y)
            {
				revroles=roles.split(",");
				revroles=revroles.reverse().join();
            	if(roles!=unescape(figure.userData.custrecord_flo_process_participants) && revroles!=unescape(figure.userData.custrecord_flo_process_participants) && roles!="" )
            	{
					figure.userData.custrecord_flo_process_participants=escape(roles);
					debugger
				 //   setTimeout(function(){top.nlapiSubmitField("customrecord_flo_process",figure.getId(),"custrecord_flo_process_participants",roles)},100)
				var url_servlet = top.nlapiResolveURL('SUITELET', 'customscript_flo_record_update', 'customdeploy_flo_general_record_update');
									
							var url=url_servlet+'&id='+figure.getId()+'&recordtype=customrecord_flo_process&json=[{"field":"custrecord_flo_process_participants","multi":"F","values":"'+roles+'"}]'
			
					jQuery.ajax({
					  method: "POST",
					  url: url,
					})
					.done(function(msg){
					    console.log("roles updated onUnselect proc");
					})	



				}
				diagChanged=true;//setTimeout(function(){saveProcess()},500);
	        //alert("ROLES:"+roles)
            }
 
	    }catch(e){alert(e.message)}
	        //alert("submitted")
			figure.shape.attr({cursor:"default"});
	        figure.isMoving = false;
	    },
	    /**
	     * @method
	     * Called from the figure itself when any position changes happens. All listener
	     * will be informed.
	     * 
	     * @private
	     * @since 2.5.1
	     **/
	  /*  fireResizeEvent: function()
	    {
	         this.resizeListener.each($.proxy(function(i, item){
	            item.onOtherFigureIsResizing(this);
	        },this));
	        
	        //alert(this.width)

	        return this;
	    },*/
	
	onBlur: function(){
		//alert("Blurred: "+this.getWidth())
		
	},

	onContextMenu: function(x, y) {
		shapeClick(this, x, y)
	},

	/**
	 * @inheritdoc
	 */
	createShapeElement: function() {
		return this.canvas.paper.path("");
	},

	/** @method
	 * Enlarge the detail window
	 *
	 */
	onClick: function() {
		//explodedView(this.getId())
	},

	/**
	 * @method
	 * Drill down to the next level if the user clicks on the element.
	 *
	 */
	onDoubleClick: function() {
		console.log("dbl 5");
		drillDown(this.getId(),this.getUserData())
	},

	/**
	 * @method
	 * Return an objects with all important attributes for XML or JSON serialization
	 *
	 * @returns {Object}
	 */
	getPersistentAttributes: function() {
		var memento = this._super();memento.id=this.getId();
		memento.color = this.getColor();
		memento.bgcolor = this.getBackgroundColor();
		memento.stroke = this.getStroke();

		// add all decorations to the memento 
		//
		memento.labels = [];
		this.children.each(function(i, e) {
			memento.labels.push({
				id: e.figure.getId(),
				label: e.figure.getText(),
				locator: e.locator.NAME,

			});
		});

		return memento;
	},

	/**
	 * @method
	 * Read all attributes from the serialized properties and transfer them into the shape.
	 *
	 * @param {Object} memento
	 * @returns
	 */
	setPersistentAttributes: function(memento) {
		this._super(memento);/*this.alpha=1;*/this.setId(memento.id);
		//alert(JSON.stringify(memento.color))
		this.setColor(memento.color.hashString);
		this.setBackgroundColor(memento.bgcolor.hashString);
		this.setStroke(memento.stroke);
		// remove all decorations created in the constructor of this element
		//
		this.resetChildren();

		// and restore all children of the JSON document instead.
		//
		$.each(memento.labels, $.proxy(function(i, e) {
			//var label = new draw2d.shape.basic.Label(e.label);
			var label = new FLOShapeLabel(e.label);
			var locator = eval("new " + e.locator + "()");
			locator.setParent(this);
			this.addFigure(label, locator);
			label.installEditor(new FLOLabelInplaceEditor({
				// called after the value has been set to the LabelFigure
				onCommit: $.proxy(function(value) {
					//alert("new value set to:" + value);
					//update process data with the new description
										newnum="";
										if (!isNaN(value.split(" ")[0].split(".")[0])) {
											newnum = value.split(" ")[0];
											value = value.substring(value.indexOf(" ") + 1);
										}



					updateStepNameNum(label.getParent().getId(), value, newnum);
				})
			}));
		}, this));
	},


});



//This is the default connector
var FLOConnector = draw2d.Connection.extend({
	NAME: "FLOConnector",
	init: function() {
		this._super();
		this.setTargetDecorator(new draw2d.decoration.connection.ArrowDecorator(8, 8));
		this.setStroke(2);
		this.setSelectable(true);
		this.setDeleteable(true);
		// Create any Draw2D figure as decoration for the connection
		//
		//this.label = new draw2d.shape.basic.Label("I'm a Label");
		//this.label.setColor("#0d0d0d");
		//this.label.setFontColor("#0d0d0d");

		// add the new decoration to the connection with a position locator.
		//
		this.addFigure(this.label, new draw2d.layout.locator.ManhattanMidpointLocator(this));
		diagChanged=true;
	},

	getLabel: function() {
		return this.label.getText();
	},

	setLabel: function(text) {
		this.label.setText(text);
	},

	/**
	 * @method
	 * Return an objects with all important attributes for XML or JSON serialization
	 *
	 * @returns {Object}
	 */
	getPersistentAttributes: function() {
		var memento = this._super();memento.id=this.getId();
		//alert(JSON.stringify(memento));
		memento.stroke = this.getStroke();
		memento.color = this.getColor().hash();
		memento.arrow = this.getTargetDecorator();
		if (this.editPolicy.getSize() > 0) {
			memento.policy = this.editPolicy.getFirstElement().NAME;
		}

		return memento;
	},

	/**
	 * @method
	 * Read all attributes from the serialized properties and transfer them into the shape.
	 *
	 * @param {Object} memento
	 * @returns
	 */
	setPersistentAttributes: function(memento) {
		this._super(memento);/*this.alpha=1;*/this.setId(memento.id);
		this.setStroke(memento.stroke);
		//alert("setting target")
		this.setTargetDecorator(new draw2d.decoration.connection.ArrowDecorator(8, 8));
		if (typeof memento.stroke !== "undefined") {
			this.setStroke(parseInt(memento.stroke));
		}
		if (typeof memento.color !== "undefined") {
			this.setColor(memento.color);
		}
		if (typeof memento.policy !== "undefined") {
			this.installEditPolicy(eval("new " + memento.policy + "()"));
		}
		this.setSelectable(true);
		this.setDeleteable(true);
	}
});

//The canvas is the drawing environment.
var FLOCanvas = draw2d.Canvas.extend({
	NAME: "FLOCanvas",
	init: function(id) {
		this.defaultRouterClassName = "draw2d.layout.connection.ManhattanConnectionRouter";
		this.defaultRouter = new draw2d.layout.connection.ManhattanConnectionRouter();
		this._super(id);
		//this.setBackgroundColor("#FFFFFF"); 


	},
	
	
/*	setDefaultRouterClassName: function(  defaultRouterClassName){
		    this.defaultRouterClassName=  defaultRouterClassName;
	        this.defaultRouter = eval("new "+this.defaultRouterClassName+"()");
		},*/

	createConnection: function(startPort, endPort) {
		var conn = new LabelConnection(startPort,endPort);
		//conn.setRouter(this.defaultRouter);
		conn.setTargetDecorator(new draw2d.decoration.connection.ArrowDecorator(8, 8));
		conn.setStroke(2);
		this.setSelectable(true);
		this.setDeleteable(true);
		return conn;
	},
	
	/**
     * @method
     * Called if the user drop the droppedDomNode onto the canvas.<br>
     * <br>
     * Graphiti use the jQuery draggable/droppable lib. Please inspect
     * http://jqueryui.com/demos/droppable/ for further information.
     * 
     * @param {HTMLElement} droppedDomNode The dropped DOM element.
     * @param {Number} x the x coordinate of the drop
     * @param {Number} y the y coordinate of the drop
     * 
     * @template
     **/
    onDrop:function(droppedDomNode, x, y)
    {
	   //alert(droppedDomNode.getUserData().name+"-"+x+"/"+y)
    },
	
});

//The Background is the shape that sits behind all the other shapes to provide clickability.
var Background = draw2d.shape.basic.Rectangle.extend({

	NAME: "Background",

	init: function(width, height) {

		this._super(width, height);
		this.setBackgroundColor("#FFFFFF");
		//this.setAlpha(1);
		this.setStroke(4);
		this.setDraggable(0);
		this.setSelectable(0);
		//this.setResizeable(1);
		this.installEditPolicy(new draw2d.policy.figure.HorizontalEditPolicy());
		this.installEditPolicy(new draw2d.policy.figure.VerticalEditPolicy());
		//this.installEditPolicy(new draw2d.policy.canvas.BoundingboxSelectionPolicy());


	},

   onDoubleClick: function(x, y) {console.log("noactiondbl 2");},

	onContextMenu: function(x, y) {
		if (checkPermissions(pid) != true) {
		  if (confirm("You do not have permission to edit this process.  Click 'OK' to request permission from the process owner or 'Cancel' to return to the document.\n\nYou can print the process and its notes by clicking the print icon above.")){
			requestPermission(pid);
		}
                //alert("blocking the context menu");
		return
		}
		    
		    if(y>background.getHeight()-120)
		    {
			   	$.contextMenu({
					selector: 'body',
					events: {
						hide: function() {
							$.contextMenu('destroy');
						}
					},
					callback: $.proxy(function(key, options) {
						switch (key) {
							case "supprocess": 
								//if(pid==""){userdata=tlp[i];}else{userdata=canvas.getFigure(pid).getUserData()}
								var rec = new FLOSuppProcess(blockwidth, blockheight, "New Supporting Process", false, fontsize, strokesize, null, null);
	                                                       rec.setId(newpid);
	                                                       rec.label.setId("label"+newpid);
	                                                       rec.count=1;
								rec.setBackgroundColor("#FFFFFF");
								rec.label.setBackgroundColor("#FFFFFF");
								
								//this.getCanvas().addFigure(rec, Math.min(background.getWidth()*.1, 120) + 10 + (blockwidth+10) * (si), background.getHeight()*.9-blockheight/2);
	                            canvas.addFigure(rec, Math.min(background.getWidth()*.1, 120) + 10 + (blockwidth + 10) * (si-1), (background.getHeight() - 120) + 10)  
	                            si++;                          
								break;
								case "sandbox": 
									//if(pid==""){userdata=tlp[i];}else{userdata=canvas.getFigure(pid).getUserData()}
									var rec = new FLOProcessSandbox(blockwidth, blockheight, "Process Sandbox", false, fontsize, strokesize, null,null);
									
		                                                       rec.setId(newpid);
		                                                       rec.label.setId("label"+newpid);
		                                                       rec.count=1;
									rec.setBackgroundColor("#FFFFFF");
									rec.label.setBackgroundColor("#FFFFFF");
									sb++;
									//this.getCanvas().addFigure(rec, Math.min(background.getWidth()*.1, 120) + 10 + (blockwidth+10) * (si), background.getHeight()*.9-blockheight/2);
		                            canvas.addFigure(rec, background.getWidth() - 10 - (blockwidth + 10) * (sb), (background.getHeight() - 120) + 10)  
		                                                      
								break;
						default:

							break;
						}

					}, this),
					x: x,
					y: y,
					items: {
						"supprocess": {
							name: "Add Supporting Process",
							icon: "edit"
						},
						"sandbox": {
							name: "Add Process Sandbox",
							icon: "edit"
						},

					}

				});
			}//end of supporting process test	
            else if (hlp == true) 
			{
				userdata=tlp[i];
				if(pid!=""){userdata==""};
                                 //alert("HLP context menu");
				$.contextMenu({
					selector: 'body',
					events: {
						hide: function() {
							$.contextMenu('destroy');
						}
					},
					callback: $.proxy(function(key, options) {
						switch (key) {
						case "topprocess":
							//alert("tophlp")
							var rec = new FLOHLProcess(blockwidth, blockheight, "New Process", false, fontsize, strokesize,userdata, pid);
                                                       rec.setId(newpid);
                                                       rec.label.setId("label"+newpid);
                                                       rec.count=0;
													   
							rec.setBackgroundColor("#DDDDDD");
							rec.label.setBackgroundColor("#DDDDDD");
                                                       //check if resize is required
 													   if(pid!=="")
													   {topcount=canvas.getFigure(pid).count}
													   else
													   {parentLength=Math.max(parentLength,1);topcount=parentLength+1}
													   //alert(Math.min(background.getWidth()*.1, 120) + 10 + ((blockwidth+10) * (topcount))+">?"+background.getWidth())
                                                       if(Math.min(background.getWidth()*.1, 120) + 10 + ((blockwidth+10) * (topcount))>background.getWidth())
                                                       {
                                                          resizeBackground(background.width+blockwidth+20,background.height);
														  this.getCanvas().addFigure(rec, Math.min(background.getWidth()*.1, 120) + 10 + (blockwidth+10) * (topcount-1), 20);

                                                       }
                                                       else
                                                       {
							this.getCanvas().addFigure(rec, Math.min(background.getWidth()*.1, 120) + 10 + (blockwidth+10) * (topcount-1), 20);
                                                        }
														//Increase the top row count
														/*if(pid!=="")
													   {canvas.getFigure(pid).count++}
													   
													   $("#label"+newpid).focus();*/
													   if(pid==="")
													   {parentLength++}
							break;
							
						case "subprocess":
						    
							var parentPro = getParentShape(x)
							//If there is not parent, create hlp
							if(parentPro==background)
							{alert("Strongpoint is unable to identify the parent of this step.\nPlease create a high level process or select another position.");break}
							//alert("Calc Parent:"+parentPro.getId())
							var rec = new FLOHLProcess(blockwidth, blockheight, "New Process", false, fontsize, strokesize, tlp[i], parentPro.getId());
                                                       rec.setId(newpid);
                                                       rec.label.setId("label"+newpid);
                                    				   rec.count=0;
							rec.setBackgroundColor("#FFFFFF");
							rec.label.backgroundColor = "#FFFFFF";
                                                                            //if(parentPro.counter==null) {parentPro.counter=parentPro.count}

                                                        //alert("COUNT:"+parentPro.count)
														if(parentPro.count==0){parentPro.count++}
														newy=parentPro.count;
														/*if(newy>0)
														{newy--}*/
														//alert(background.height-120-20-(blockheight+10)*(newy)+"<"+(blockheight+10)*2)
														if(background.height-120-20-(blockheight+10)*(newy)+"<"+(blockheight+10)*2)
	                                                       {
	                                                          resizeBackground(background.width,background.height+(blockheight+20)*2);
															  //this.getCanvas().addFigure(rec, Math.min(background.getWidth()*.1, 120) + 10 + (blockwidth+10) * (topcount), 20);
															  this.getCanvas().addFigure(rec, parentPro.getX(), 20 + (blockheight + 10) * newy);

	                                                       }
	                                                       else
	                                                       {
																this.getCanvas().addFigure(rec, parentPro.getX(), 20 + (blockheight + 10) * newy);
	                                                        }
							
                                                         //parentPro.count++;

							//rec.label.text = parentPro.getUserData().custrecord_flo_number + "." + parentPro.count + " " + rec.label.text;
							break;
						
						case "label":
							addLabel(x, y);
							break;
						case "note":
							addQuickNote(x, y);
							break;
						case "details":
							explodeView(this.getId())
							break;
						case "swimlane":
							newline = new draw2d.shape.basic.Line();
							newline.setStartPoint(0, y);
							newline.setEndPoint(this.getWidth() - 1, y);
							this.getCanvas().addFigure(newline);
							//newlabel=new draw2d.shape.basic.Label("New Role");
							newlabel = new FLOShapeLabel("New Role");
							newline.setDashArray(". ");
                            newline.setStroke(1);
							newlabel.setColor("#FFFFFF");
							this.getCanvas().addFigure(newlabel, 20, y - 15);
							break;
						case "deleteswim":

							lines = this.getCanvas().getLines();

							// with undo/redo support
							//if(confirm("Delete?")){var cmd = new draw2d.command.CommandDelete(this);
							//this.getCanvas().getCommandStack().execute(cmd);}
							break;
							case "expand":
								resizeBackground(background.width+blockwidth+20,background.height);
								break;
							case "taller":
									resizeBackground(background.width,background.height+blockheight+20);
								break;
							case "shrink":
								resizeBackground(background.width,background.height,"shrink");
								break;
						default:

							break;
						}

					}, this),
					x: x,
					y: y,
					items: {
						"op": {
						name: "Options:"
						},
						"sep1": "---------",
						"topprocess": {
							name: "Add High Level Process",
							icon: "edit"
						},
						"subprocess": {
							name: "Add SubProcess",
							icon: "edit"
						},
						/*"sep1": "---------",
						"swimlane": {
							name: "Add Swimlane",
							icon: "copy"
						},*/
						"sep2": "---------",
						"expand": {
							name: "Widen Diagram",
							icon: "copy"
						},
						"taller": {
							name: "Add Height",
							icon: "copy"
						},
						"shrink": {
							name: "Shrink To Fit",
							icon: "copy"
						},

					}

				});
			} else {
                                
				$.contextMenu({
					selector: 'body',
					events: {
						hide: function() {
						$.contextMenu('destroy');
						}
					},
					callback: $.proxy(function(key, options) {
						switch (key) {
						case "start":
							var newStart = new FLOStart(blockwidth / 2, blockheight / 2, null, true, fontsize, strokesize);
							//(blockwidth, blockheight, "New Process", false, fontsize, strokesize, tlp[i], parentPro.getId());
							//,userdata,parentPro,id)
                            newStart.setId(newpid);
                            newStart.label.setId("label"+newpid);
							this.getCanvas().addFigure(newStart, x - 25, y - 15);
							diagChanged=true;//saveProcess();
							break;
						case "end":
							var newEnd = new FLOEnd(blockwidth / 2, blockheight / 2, null, true, fontsize, strokesize);
							newEnd.setId(newpid);
                            newEnd.label.setId("label"+newpid);
							this.getCanvas().addFigure(newEnd, x - 25, y - 15);
							diagChanged=true;//saveProcess();
							break;
						case "step":
							var newStep = new FLOStep(blockwidth, blockheight, "New Step", true, fontsize, strokesize,"000000","FFFFFF",null,null,"new");
							newpid=newStep.getUserData().internalid;
							newStep.setId(newpid);
                            newStep.label.setId("label"+newpid);
							this.getCanvas().addFigure(newStep, x - blockwidth/2, y - blockheight/2);
							resizeBackground(background.width,background.height);
							//top.nlapiSubmitField("customrecord_flo_process",newpid,"custrecord_flo_process_participants",getRoles(y-blockheight/2,y-blockheight/2+newStep.getHeight()));
							diagChanged=true;//saveProcess();
							break;
						case "process":
							var newStep = new FLOProcess(blockwidth, blockheight, "New Process", true, fontsize, strokesize,"000000","FFFFFF",null,null,"new");
							newpid=newStep.getUserData().internalid;
							newStep.setId(newpid);
                            newStep.label.setId("label"+newpid);
							this.getCanvas().addFigure(newStep, x - 50, y - 30);
							resizeBackground(background.width,background.height);
							diagChanged=true;//saveProcess();
							/*try
							{top.nlapiSubmitField("customrecord_flo_process",newpid,"custrecord_flo_process_participants",getRoles(y-blockheight/2,y-blockheight/2+newStep.getHeight()));}
							catch(e){alert(e.message)}*/
							break;
						case "decision":
							var newStep = new FLODecision(blockwidth, blockheight, "New Decision", true, fontsize, strokesize,"000000","FFFFFF",null,null,"new");
							newpid=newStep.getUserData().internalid;
							newStep.setId(newpid);
                            newStep.label.setId("label"+newpid);
							this.getCanvas().addFigure(newStep, x - 50, y - 30);
							resizeBackground(background.width,background.height);
							//top.nlapiSubmitField("customrecord_flo_process",newpid,"custrecord_flo_process_participants",getRoles(y-blockheight/2,y-blockheight/2+newStep.getHeight()));
							diagChanged=true;//saveProcess();
							break;
						case "next":
							var newStep = new FLONextPage(blockwidth*1.3, blockheight*.66, "Go To Next Page", true, fontsize, strokesize,"000000","FFFFFF",null,null,"new");
							newpid=newStep.getUserData().internalid;
							newStep.setId(newpid);
                            newStep.label.setId("label"+newpid);
							this.getCanvas().addFigure(newStep, x - 50, y - 20);
							//top.nlapiSubmitField("customrecord_flo_process",newpid,"custrecord_flo_process_participants",getRoles(y-blockheight/2,y-blockheight*.33+newStep.getHeight()));
							diagChanged=true;//saveProcess();
							break;
						case "details":
							explodeView(this.getId())
							break;
						case "label":
							addLabel(x, y);
							break;
						case "note":
							addQuickNote(x, y);
							break;
						case "supprocess":
 							newsupp=confirm("This will create a new supporting process record:\n\n- Press 'OK' to Proceed.\n- Press 'Cancel' to go to the Process Assistant and add an existing supporting process.");
                            if(newsupp==false)
                            {parent.newProcess()}
                            else
                            {
								var rec = new FLOSuppProcess(blockwidth, blockheight, "New Process", false, fontsize, strokesize, tlp[i], pid);
	                                      rec.setId(newpid);
	                                      rec.label.setId("label"+newpid);
	                                      rec.count=1;
								rec.setBackgroundColor("#FFFFFF");
								rec.label.setBackgroundColor("#FFFFFF");
								
								canvas.addFigure(rec, Math.min(background.getWidth()*.1, 120) + 10 + (blockwidth + 10) * (si-1), (background.getHeight() - 120) + 10)  
								si++;
	                        }                                
							break;
							case "sandbox": 
								if(pid==""){userdata=tlp[i];}else{userdata=canvas.getFigure(pid).getUserData()}
								var rec = new FLOProcessSandbox(blockwidth, blockheight, "New Process", false, fontsize, strokesize, userdata, pid);
	                                                       rec.setId(newpid);
	                                                       rec.label.setId("label"+newpid);
	                                                       rec.count=1;
								rec.setBackgroundColor("#FFFFFF");
								rec.label.setBackgroundColor("#FFFFFF");
								sb++;
								//this.getCanvas().addFigure(rec, Math.min(background.getWidth()*.1, 120) + 10 + (blockwidth+10) * (si), background.getHeight()*.9-blockheight/2);
	                            canvas.addFigure(rec, background.getWidth() - 10 - (blockwidth + 10) * (sb), (background.getHeight() - 120) + 10)  
	                                                      
							break;
						case "swimlane":
							newline = new draw2d.shape.basic.Line();
							newline.setStartPoint(0, y);
							newline.setEndPoint(this.getWidth() - 1, y);
							this.getCanvas().addFigure(newline);
							//newlabel=new draw2d.shape.basic.Label("New Role");
							newlabel = new FLOShapeLabel("New Role");
							newline.setDashArray(". ");
                            newline.setStroke(1);
							newlabel.setColor("#FFFFFF");
							this.getCanvas().addFigure(newlabel, 20, y - 15);
							break;
							case "expand":
								resizeBackground(background.width+blockwidth+20,background.height);
								break;
							case "taller":
									resizeBackground(background.width,background.height+blockheight+20);
								break;
							case "shrink":
								resizeBackground(background.width,background.height,"shrink");
								break;
						case "deleteswim":

							lines = this.getCanvas().getLines();

							// with undo/redo support
							//if(confirm("Delete?")){var cmd = new draw2d.command.CommandDelete(this);
							//this.getCanvas().getCommandStack().execute(cmd);}
							break;
						default:

							break;
						}

					}, this),
					x: x,
					y: y,
					items: {
						/*"label": {
							name: "Add A Label",
							icon: "edit"
						},*/
						"note": {
							name: "Add Textbox",
							icon: "edit"
						},
						"sep0": "---------",
						"step": {
							name: "Add Step",
							icon: "edit"
						},
						"process": {
							name: "Add Process",
							icon: "edit"
						},
						"decision": {
							name: "Add Decision",
							icon: "edit"
						},
						"start": {
							name: "Add Start",
							icon: "edit"
						},
						"end": {
							name: "Add End",
							icon: "copy"
						},
						"next": {
							name: "Add Next Page",
							icon: "copy"
						},

						//"sep1": "---------",
						//"swimlane": {
						//	name: "Add Swimlane",
						//	icon: "copy"
						//},
						"sep2": "---------",
						"expand": {
							name: "Widen Diagram",
							icon: "copy"
						},
						"taller": {
							name: "Add Height",
							icon: "copy"
						},
						"shrink": {
							name: "Shrink To Fit",
							icon: "copy"
						},

					} 

				});
			}//end of else

		} //end of permission allowed

	});




var FLOShapeLabel = draw2d.shape.basic.Label.extend({
	NAME: "FLOShapeLabel",
	init: function(textlabel, parent, color) {

		this._super();
		this.text = textlabel;
		if (color != null && color != "") {
			color = "#FFFFFF";
		}
		this.setBackgroundColor(color);
		this.setColor(color);

		//this.setParent(parent);
		this.setAlpha(1);
		this.setStroke(0);
		this.isDraggable(0);
		this.isResizeable(0);



	},

         onContextMenu: function(x, y) {
		if (checkPermissions(pid) != true) {
		  if (confirm("You do not have permission to edit this process.  Click 'OK' to request permission from the process owner or 'Cancel' to return to the document.\n\nYou can print the process and its notes by clicking the print icon above.")){
			requestPermission(pid);
		}
		return
		}
		        if(this.parent.id!=null)
		        {
		        	shapeClick(this.parent, x, y)
		        
	            }
	            else
	            {
				$.contextMenu({
					selector: 'body',
					events: {
						hide: function() {
							$.contextMenu('destroy');
						}
					},
					callback: $.proxy(function(key, options) {
						switch (key) {
						case "deletelabel":

							// delete line with undo/redo support
							try{
							var cmd = new draw2d.command.CommandDelete(this);
                                              		this.getCanvas().getCommandStack().execute(cmd);
							}catch(e){}
                                                        // delete label with undo/redo support

							break;
						default:

							break;
						}

					}, this),
					x: x,
					y: y,
					items: {
						
						"deletelabel": {
							name: "Delete Label",
							icon: "copy"
						},

					}

				});
			  }
			},

});

var FLORowLabel = draw2d.shape.basic.Label.extend({
	NAME: "FLORowLabel",
	init: function(textlabel, parent, color) {

		this._super();
		this.text = textlabel;
		if (color != null && color != "") {
			color = "#FFFFFF";
		}
		this.setBackgroundColor(color);
		this.setColor(color);

		//this.setParent(parent);
		this.setAlpha(1);
		this.setStroke(0);
		this.isDraggable(0);
		this.isResizeable(0);

		diagChanged=true;

	},

         onContextMenu: function(x, y) {
		if (checkPermissions(pid) != true) {
		  if (confirm("You do not have permission to edit this process.  Click 'OK' to request permission from the process owner or 'Cancel' to return to the document.\n\nYou can print the process and its notes by clicking the print icon above.")){
			requestPermission(pid);
		}
		return
		}
		        if(this.parent.id!=null)
		        {
		        shapeClick(this.parent, x, y)
	            }
	            else
	            {
				$.contextMenu({
					selector: 'body',
					events: {
						hide: function() {
							$.contextMenu('destroy');
						}
					},
					callback: $.proxy(function(key, options) {
						switch (key) {
						case "deleterow":

							// delete label with undo/redo support
							try{
							var lanename=this.getText();
							var cmd = new draw2d.command.CommandDelete(this);
							
                                              		this.getCanvas().getCommandStack().execute(cmd);
							// delete associated line
							laneline=canvas.getLine("Line:"+lanename);
							if(laneline!=null)
							{
								var cmd = new draw2d.command.CommandDelete(laneline);

	                                              		this.getCanvas().getCommandStack().execute(cmd);
							}
							//Recalc lanes for all items
							recalcRoles();
							}catch(e){}
                                                        // delete label with undo/redo support

							break;
						default:

							break;
						}

					}, this),
					x: x,
					y: y,
					items: {
						
						"deleterow": {
							name: "Delete Row",
							icon: "copy"
						},

					}

				});
			  }
			},

});

var FLOLaneLabel = FLOShapeLabel.extend({
	NAME: "FLOLaneLabel",
	init: function(textlabel, parent, color) {

		this._super();
		this.text = textlabel;
		if (color != null && color != "") {
			color = "#FFFFFF";
		}
		this.setBackgroundColor(color);
		this.setColor(color);

		//this.setParent(parent);
		this.setAlpha(1);
		this.setStroke(0);
		this.isDraggable(0);
		this.isResizeable(0);

		diagChanged=true;

	},
});

/**
 * @class draw2d.layout.locator.ManhattanMidpointLocator
 *
 * A ManhattanMidpointLocator that is used to place figures at the midpoint of a Manhatten routed
 * connection. The midpoint is always in the center of an edge.
 *
 * @author Andreas Herz
 * @extend draw2d.layout.locator.ConnectionLocator
 */
var FLOConnectLabelLocator = draw2d.layout.locator.ConnectionLocator.extend({
	NAME: "FLOConnectLabelLocator",

	/**
	 * @constructor
	 * Constructs a ManhattanMidpointLocator with associated Connection c.
	 *
	 * @param {draw2d.Connection} c the connection associated with the locator
	 */
	init: function(c) {
		this._super(c);
	},


	/**
	 * @method
	 * Relocates the given Figure always in the center of an edge.
	 *
	 * @param {Number} index child index of the target
	 * @param {draw2d.Figure} target The figure to relocate
	 **/
	relocate: function(index, target) {
		var conn = this.getParent();
		var points = conn.getPoints();

		var segmentIndex = Math.floor((points.getSize() - 2) / 2);
		if (points.getSize() <= segmentIndex + 1) return;

		var p1 = points.get(segmentIndex);
		var p2 = points.get(segmentIndex + 1);

		var x = ((p2.x - p1.x) / 2 + p1.x - target.getWidth() / 2) | 0;
		var y = ((p2.y - p1.y) / 2 + p1.y - target.getHeight() / 2) | 0;

		target.setPosition(x, y);
	}
});

/**
 * @class example.connection_locator.LabelConnection
 *
 * A simple Connection with a label which sticks in the middle of the connection..
 *
 * @author Andreas Herz
 * @extend draw2d.Connection
 */
var LabelConnection = draw2d.Connection.extend({

	init: function() {
		this._super();
        //this.setSource(startPort);
        //this.setTarget(endPort);
		this.setTargetDecorator(new draw2d.decoration.connection.ArrowDecorator(8, 8));

		this.setStroke(2);
		this.setDraggable(1);
		this.setResizeable(1);

		// Create any Draw2D figure as decoration for the connection
		// only add label text if the start is a decision.
/*this.label = new draw2d.shape.basic.Label("");
      this.label.setColor("#0d0d0d");
      this.label.setBackgroundColor("#FFFFFF");
      this.label.setFontColor("#0d0d0d");
      
      
      // add the new decoration to the connection with a position locator.
      //
      this.addFigure(this.label, new draw2d.layout.locator.ManhattanMidpointLocator(this));
      this.label.installEditor(new FLOLabelInplaceEditor());*/
      diagChanged=true;
	},

	getLabel: function() {
		return this.label.getText();
	},

	setLabel: function(text) {
		this.label.setText(text);
	},
	
	onContextMenu: function(x, y) {
	if (checkPermissions(pid) != true) {
	  if (confirm("You do not have permission to edit this process.  Click 'OK' to request permission from the process owner or 'Cancel' to return to the document.\n\nYou can print the process and its notes by clicking the print icon above.")){
		requestPermission(pid);
	}
	return
	}
	
			$.contextMenu({
				selector: 'body',
				events: {
					hide: function() {
						$.contextMenu('destroy');
					}
				},
				callback: $.proxy(function(key, options) {
					switch (key) {
					case "deleteconn":

						// delete conn with undo/redo support
						try{
						var cmd = new draw2d.command.CommandDelete(this);
                                          		this.getCanvas().getCommandStack().execute(cmd);
						}catch(e){}
                                                    // delete connection with undo/redo support

						break;
					case "addY":
					    this.label = new draw2d.shape.basic.Label("Y");
					      this.label.setColor("#000000");
					      this.label.setBackgroundColor("#FFFFFF");
					      this.label.setFontColor("#0d0d0d");


					      // add the new decoration to the connection with a position locator.
					      //
					      this.addFigure(this.label, new FLOConnectLabelLocator(this));
					      this.label.installEditor(new FLOLabelInplaceEditor());
					    break;
						case "addN":
						    this.label = new draw2d.shape.basic.Label("N");
						      this.label.setColor("#000000");
						      this.label.setBackgroundColor("#FFFFFF");
						      this.label.setFontColor("#0d0d0d");


						      // add the new decoration to the connection with a position locator.
						      //
						      this.addFigure(this.label, new FLOConnectLabelLocator(this));
						      this.label.installEditor(new FLOLabelInplaceEditor());
						    break;
					case "dellabel":
					    // delete conn with undo/redo support
						try{
						var cmd = new draw2d.command.CommandDelete(this.label);
                                          		this.getCanvas().getCommandStack().execute(cmd);
						}catch(e){}
                                                    // delete connection with undo/redo support
						break;
					default:

						break;
					}

				}, this),
				x: x,
				y: y,
				items: {
					"addY": {
						name: "Label Yes(Y)",
						icon: "copy"
					},
					"addN": {
						name: "Label No(N)",
						icon: "copy"
					},
					"dellabel": {
						name: "Delete Label",
						icon: "copy"
					},
					"deleteconn": {
						name: "Delete Arrow",
						icon: "copy"
					}



				}

			});
		},

/*onContextMenu: function(){
      this.label = new draw2d.shape.basic.Label("Click to Add Label");
      this.label.setColor("#0d0d0d");
      this.label.setBackgroundColor("#FFFFFF");
      this.label.setFontColor("#0d0d0d");
      
      
      // add the new decoration to the connection with a position locator.
      //
      this.addFigure(this.label, new FLOConnectLabelLocator(this));
      this.label.installEditor(new FLOLabelInplaceEditor());
    },*/

   getPersistentAttributes : function()
   {
       var memento = this._super();memento.id=this.getId();
      //memento.type=this.getCssClass();
       //alert(JSON.stringify(memento.type))
       delete memento.x;
       delete memento.y;
       delete memento.width;
       delete memento.height;
       //memento.start=this.getStartPoint();
       //memento.end=this.getEndPoint();
       memento.stroke = this.stroke;
       memento.color  = this.getColor().hash();
       if(this.editPolicy.getSize()>0){
           memento.policy = this.editPolicy.getFirstElement().NAME;
       }
        
       	// add all decorations to the memento 
		//
		memento.labels = [];
		this.children.each(function(i, e) {
			memento.labels.push({
				id: e.figure.getId(),
				label: e.figure.getText(),
				locator: e.locator.NAME,
				});
			});
       
       return memento;
   },

	/**
	 * @method
	 * Read all attributes from the serialized properties and transfer them into the shape.
	 *
	 * @param {Object} memento
	 * @returns
	 */
   setPersistentAttributes : function(memento)
   {
       this._super(memento);/*this.alpha=1;*/this.setId(memento.id);
       this.setCssClass("LABELCONNECTION");
       this.setTargetDecorator(new draw2d.decoration.connection.ArrowDecorator(8,8));
       this.setStroke(memento.stroke);
      //alert(this.targetDecorator);
       if(typeof memento.stroke !=="undefined"){
           this.setStroke(parseInt(memento.stroke));
       }
       if(typeof memento.color !=="undefined"){
           this.setColor(memento.color);
       }
       if(typeof memento.policy !=="undefined"){
           this.installEditPolicy(eval("new "+memento.policy +"()" ));
       }
       this.setDraggable(1);
	   this.setResizeable(1);
		// remove all decorations created in the constructor of this element
		//
		//this.resetChildren();

		// and restore all children of the JSON document instead.
		//
		try
		{
		$.each(memento.labels, $.proxy(function(i, e) {
			var label = new draw2d.shape.basic.Label(e.label);
			label.setBackgroundColor("#FFFFFF");
			//var label = new FLOShapeLabel(e.label);
			var locator = eval("new " + e.locator + "()");
			locator.setParent(this);
			this.addFigure(label, locator);

		}, this));
	 }
	 catch(e){}
	 this.setStroke(1);
	},

});

var FLOQuickNote = draw2d.shape.note.PostIt.extend({
	NAME: "FLOQuickNote",
	init: function(text) {

		this._super();
		this.setColor("#FF0000");
		this.setFontColor("#FF0000");
		this.setBackgroundColor(null);
		this.setText(text);
		this.setStroke(1);
		this.setAlpha(1);
		this.setMinHeight(20);
		this.setMinWidth(20);
		diagChanged=true;
	},

	/**
	 * @method
	 * Return an objects with all important attributes for XML or JSON serialization
	 *
	 * @returns {Object}
	 */
	getPersistentAttributes: function() {
		var memento = this._super();memento.id=this.getId();
		memento.stroke = this.stroke;
		memento.color = this.getColor().hash();
		if (this.editPolicy.getSize() > 0) {
			memento.policy = this.editPolicy.getFirstElement().NAME;
		}

		return memento;
	},

	/**
	 * @method
	 * Read all attributes from the serialized properties and transfer them into the shape.
	 *
	 * @param {Object} memento
	 * @returns
	 */
	setPersistentAttributes: function(memento) {
		this._super(memento);/*this.alpha=1;*/this.setId(memento.id);
		if (typeof memento.stroke !== "undefined") {
			this.setStroke(parseInt(memento.stroke));
		}
		if (typeof memento.color !== "undefined") {
			this.setColor(memento.color);
		}
		if (typeof memento.policy !== "undefined") {
			this.installEditPolicy(eval("new " + memento.policy + "()"));
		}
		this.setStroke(0);
	},

	onContextMenu: function(x, y) {
		shapeClick(this, x, y)
	},
});

var ShapeSelectionPolicy = draw2d.policy.figure.RectangleSelectionFeedbackPolicy.extend({
	NAME : "ShapeSelectionPolicy",
	
	/**
     * @constructor 
     * Creates a new Router object
     */
    init: function(){
        this._super();
        //roles=getRoles(this.getAbsoluteY(),this.getAbsoluteY()+this.getHeight());
        //this.userData.custrecord_flo_process_participants=roles;
    },

 

	onUnselect: function(canvas, figure){
	    try{
		    figure.selectionHandles.each(function(i,e){
			            e.hide();
			        });
			        figure.selectionHandles = new draw2d.util.ArrayList();
		    if(figure.getCssClass()=="FLOHLProcess" | hlp==true)
		    {
				checkOrder(figure)
			}
		    else
		    {

		roles=getRoles(figure.getAbsoluteY(),figure.getAbsoluteY()+figure.getHeight());
		revroles=roles.split(",");
		revroles=revroles.reverse().join();
    	if((roles!=unescape(figure.userData.custrecord_flo_process_participants) && revroles!=unescape(figure.userData.custrecord_flo_process_participants) && roles!="" ) | figure.getHeight()!=figure.userData.height | figure.getWidth()!=figure.userData.width | figure.getX()!=figure.userData.x | figure.getY()!=figure.userData.y)
        {
			if(roles!=unescape(figure.userData.custrecord_flo_process_participants) && revroles!=unescape(figure.userData.custrecord_flo_process_participants) && roles!="" )
			{
				figure.userData.custrecord_flo_process_participants=escape(roles);
				debugger
			    //setTimeout(function(){top.nlapiSubmitField("customrecord_flo_process",figure.getId(),"custrecord_flo_process_participants",roles)},100)
			
var url_servlet = top.nlapiResolveURL('SUITELET', 'customscript_flo_record_update', 'customdeploy_flo_general_record_update');
									
							var url=url_servlet+'&id='+figure.getId()+'&recordtype=customrecord_flo_process&json=[{"field":"custrecord_flo_process_participants","multi":"F","values":"'+roles+'"}]'
			
					jQuery.ajax({
					  method: "POST",
					  url: url,
					})
					.done(function(msg){
					    console.log("roles updated note");
					})	


			}
			//setTimeout(function(){saveProcess()},500);
        //alert("ROLES:"+roles)
        }
    	}
    }catch(e){alert(e.message)}
        //alert("submitted")
		//figure.shape.attr({cursor:"default"});
        //figure.isMoving = false;
        diagChanged=true;
 	    figure.isInDragDrop=false;
    },
	
});

var  ShapeDragEditPolicy = draw2d.policy.figure.DragDropEditPolicy.extend({

    NAME : "ShapeDragEditPolicy",

    /**
     * @constructor 
     * Creates a new Router object
     */
    init: function(){
        this._super();
        //roles=getRoles(this.getAbsoluteY(),this.getAbsoluteY()+this.getHeight());
        //this.userData.custrecord_flo_process_participants=roles;
    },
    

    /**
     * @method
     * Called by the framework if the related shape has init a drag&drop
     * operation
     * 
     * @param {draw2d.Canvas} canvas The host canvas
     * @param {draw2d.Figure} figure The related figure
     * @template
     */
    onDragStart: function(canvas, figure){
    	figure.shape.attr({cursor:"move"});
    	figure.isMoving = false;
    	figure.originalAlpha = figure.getAlpha();
        roles=getRoles(figure.getAbsoluteY(),figure.getAbsoluteY()+figure.getHeight());
        figure.userData.custrecord_flo_process_participants=roles;
        figure.userData.height=figure.getHeight();
        figure.userData.width=figure.getWidth();
        figure.userData.y=figure.getY();
        figure.userData.x=figure.getX();
    },
	/**
	     * @method
	     * Called by the framework if the drag drop operation ends.
	     * 
	     * @param {draw2d.Canvas} canvas The host canvas
	     * @param {draw2d.Figure} figure The related figure
	     * @template
	     */
	    onDragEnd: function(canvas, figure){
		    try{
			
			roles=getRoles(figure.getAbsoluteY(),figure.getAbsoluteY()+figure.getHeight());
			//alert(figure.getId())
            if(roles!=figure.userData.custrecord_flo_process_participants | figure.getHeight()!=figure.userData.height | figure.getWidth()!=figure.userData.width | figure.getX()!=figure.userData.x | figure.getY()!=figure.userData.y)
            {
				revroles=roles.split(",");
				revroles=revroles.reverse().join();
            	if(roles!=unescape(figure.userData.custrecord_flo_process_participants) && revroles!=unescape(figure.userData.custrecord_flo_process_participants) && roles!="" )
				{
					figure.userData.custrecord_flo_process_participants=escape(roles);
					debugger
				   // setTimeout(function(){top.nlapiSubmitField("customrecord_flo_process",figure.getId(),"custrecord_flo_process_participants",roles)},100)
				
var url_servlet = top.nlapiResolveURL('SUITELET', 'customscript_flo_record_update', 'customdeploy_flo_general_record_update');
									
							var url=url_servlet+'&id='+figure.getId()+'&recordtype=customrecord_flo_process&json=[{"field":"custrecord_flo_process_participants","multi":"F","values":"'+roles+'"}]'
			
					jQuery.ajax({
					  method: "POST",
					  url: url,
					})
					.done(function(msg){
					    console.log("roles updated note 2");
					})	


				}
				diagChanged=true;//setTimeout(function(){saveProcess()},500);
	        //alert("ROLES:"+roles)
            }
 
	    }catch(e){alert(e.message)}
	        //alert("submitted")
			figure.shape.attr({cursor:"default"});
	        figure.isMoving = false;
	        //figure.setStroke(1);
	    },
	
		
	
	    
});


var FLOLabelInplaceEditor = draw2d.ui.LabelEditor.extend({
    
    /**
     * @constructor
     * @private
     */
    init: function(listener){
        this._super();
        
        // register some default listener and override this with the handover one 
        this.listener = $.extend({onCommit:function(){}, onCancel:function(){}},listener);
    },
    
    /**
     * @method
     * Trigger the edit of the label text.
     * 
     * @param {draw2d.shape.basic.Label} label the label to edit
     */
    start: function( label){
        this.label = label;

        this.commitCallback = $.proxy(this.commit,this);
        
        // commit the editor if the user clicks anywhere in the document
        //
        $("body").bind("click",this.commitCallback);
      
        // append the input field to the document and register 
        // the ENTER and ESC key for commit /cancel the operation
        //
        this.html = $('<input id="inplaceeditor">');
		//fix missing spaces
		var labeltext = label.getText()
		if(labeltext) {
			labeltext =labeltext.replace(/(?:\r\n|\r|\n)/g, ' ');
		}
        this.html.val(labeltext);
        this.html.hide();
        
        $("body").append(this.html);
        
        this.html.autoResize({animate:false});
        
        this.html.bind("keyup",$.proxy(function(e){
            switch (e.which) {
            case 13:
                 this.commit();
                 break;
            case 27:
                this.cancel();
                 break;
           }
         },this));
        
         this.html.bind("blur",this.commitCallback);
         
         // avoid commit of the operation if we click inside the editor
         //
         this.html.bind("click",function(e){
           console.log('click');
             e.stopPropagation();
             e.preventDefault();
         });

     this.html.bind("dblclick",function(e){
           console.log('dblclick');
             e.stopPropagation();
             e.preventDefault();
         });

        // Position the INPUT and init the autoresize of the element
        //
        var canvas = this.label.getCanvas();
        var bb = this.label.getBoundingBox();

        bb.setPosition(canvas.fromCanvasToDocumentCoordinate(bb.x,bb.y));

        // remove the scroll from the body if we add the canvas directly into the body
        var scrollDiv = canvas.getScrollArea();
        if(scrollDiv.is($("body"))){
           bb.translate(canvas.getScrollLeft(), canvas.getScrollTop());
        }
        
        bb.translate(-1,-1);
        bb.resize(2,2);
        
        this.html.css({position:"absolute",top: bb.y, left:bb.x, "min-width":bb.w, height:bb.h});
        this.html.fadeIn($.proxy(function(){
            this.html.focus();
        },this));
    },
    
    /**
     * @method
     * Transfer the data from the editor into the label.<br>
     * Remove the editor.<br>
     * @private
     */
    commit: function(){
        this.html.unbind("blur",this.commitCallback);
        $("body").unbind("click",this.commitCallback);
        var label = this.html.val();
        this.label.setText(label);
        this.html.fadeOut($.proxy(function(){
            this.html.remove();
            this.html = null;
            this.listener.onCommit(this.label.getText());
        },this));
    },
    
    /**
     * @method
     * Transfer the data from the editor into the label.<br>
     * Remove the editor.<br>
     * @private
     */
    cancel: function(){
        this.html.unbind("blur",this.commitCallback);
        $("body").unbind("click",this.commitCallback);
        this.html.fadeOut($.proxy(function(){
            this.html.remove();
            this.html = null;
            this.listener.onCancel();
        },this));
        
    }
});


//The shapeClick function provides drop downs for the major shape types except the FLOHLProcess

function shapeClick(thisObject, x, y) {
        console.log(thisObject.getCssClass())
        if (checkPermissions(pid) != true) {
		  if (confirm("You do not have permission to edit this process.  Click 'OK' to request permission from the process owner or 'Cancel' to return to the document.\n\nYou can print the process and its notes by clicking the print icon above.")){
			requestPermission(pid);
		}
		return
		}
		else if(thisObject.getCssClass()=="FLOHLProcess" | hlp==true)
		{
			$.contextMenu({
				selector: 'body',
				events: {
					hide: function() {
						$.contextMenu('destroy');
					}
				},
				callback: $.proxy(function(key, options) {
					switch (key) {
					case "details":
						//explodedView(this.getUserData());
						setDetail(this.getId(),this.getUserData());
						resizeDetail(this.getId());
						break;
					case "openprocess":
						openProcess(this.getId());
						break;
					case "drill":
						drillDown(this.getId(), this.getUserData());
						break;
					case "delete":
						// without undo/redo support
						//     this.getCanvas().removeFigure(this);
						/*if(confirm("Delete?")){
						if (!isNaN(this.getId())) {
							top.nlapiSubmitField("customrecord_flo_process", this.getId(), "isinactive", "T");
						}
						

						// with undo/redo support
						var cmd = new draw2d.command.CommandDelete(this);
						this.getCanvas().getCommandStack().execute(cmd);}*/
						deleteShape(this);
					default:

						break;
					}

				}, thisObject),
				x: x,
				y: y,
				items: {
					"op": {
						name: "Options:"
					},
					"sep2": "---------",
					"openprocess": {
						name: "<b>Open Process Record</b>"
					},
					"details": {
						name: "<b>Process Assistant</b>"
					},
					"drill": {
						name: "<b>Swim Lane</b>"
					},

					"sep3": "---------",
					//"copy": {name: "Copy", icon: "copy"},
					"delete": {
						name: "Delete"
					},
				}
			});
		}
		else
		{

	$.contextMenu({
		selector: 'body',
		events: {
			hide: function() {
				$.contextMenu('destroy');
			}
		},
		callback: $.proxy(function(key, options) {
			switch (key) {
			case "red":
				thisObject.setColor("ff0000");
				break;
			case "black":
				thisObject.setColor("000000");
				break;
			case "yellow":
				thisObject.setColor("fdd107");
				break;
			case "bred":
				thisObject.setBackgroundColor("ff0000");
				break;
			case "bwhite":
				thisObject.setBackgroundColor("ffffff");
				break;
			case "byellow":
				thisObject.setBackgroundColor("fdd107");
				break;
			case "copy":

				break;
			case "step":
			    details=thisObject.getPersistentAttributes();
				var newNode = new FLOStep(blockwidth, blockheight, null, null, fontsize, strokesize,null, null,thisObject.getUserData(),pid,thisObject.getId());
				//newNode.setColor(this.getColor());
				newNode.setPersistentAttributes(details);
				this.getCanvas().addFigure(newNode, this.getAbsoluteX(), this.getAbsoluteY());
				moveConnections(this,newNode);
				top.nlapiSubmitField("customrecord_flo_process",newNode.getId(),"custrecord_flo_step_type",2);
				var cmd = new draw2d.command.CommandDelete(this);
				this.getCanvas().getCommandStack().execute(cmd);
				break;
			case "process":
				details=thisObject.getPersistentAttributes();
				var newNode = new FLOProcess(blockwidth, blockheight, null, null, fontsize, strokesize,null, null,thisObject.getUserData(),pid,thisObject.getId());
				newNode.setPersistentAttributes(details);
				this.getCanvas().addFigure(newNode, this.getAbsoluteX(), this.getAbsoluteY());
				moveConnections(this,newNode);
				top.nlapiSubmitField("customrecord_flo_process",newNode.getId(),"custrecord_flo_step_type",4);
				var cmd = new draw2d.command.CommandDelete(this);
				this.getCanvas().getCommandStack().execute(cmd);
				
				break;
			case "decision":
			    details=thisObject.getPersistentAttributes();
				var newNode = new FLODecision(blockwidth, blockheight, null, null, fontsize, strokesize,null, null,thisObject.getUserData(),pid,thisObject.getId());
				newNode.setPersistentAttributes(details);
				this.getCanvas().addFigure(newNode, this.getAbsoluteX(), this.getAbsoluteY());
				moveConnections(this,newNode);
				top.nlapiSubmitField("customrecord_flo_process",newNode.getId(),"custrecord_flo_step_type",3);
				var cmd = new draw2d.command.CommandDelete(this);
				this.getCanvas().getCommandStack().execute(cmd);
				break;
				break;
			case "details":
				//explodedView(this.getUserData());
				setDetail(this.getId(),this.getUserData());
				resizeDetail(this.getId());
				break;
			case "openprocess":
				openProcess(this.getId());
				break;
			case "drill":
				drillDown(this.getId(), this.getUserData());
				break;
			case "delete":
				// without undo/redo support
				//     this.getCanvas().removeFigure(this);
				if(confirm("Delete?")){
				if (!isNaN(this.getId())) {
					top.nlapiSubmitField("customrecord_flo_process", this.getId(), "isinactive", "T");
				
					/*var url_servlet = top.nlapiResolveURL('SUITELET', 'customscript_flo_record_update', 'customdeploy_flo_general_record_update');
									
					var url=url_servlet+'&id='+this.getId()+'&recordtype=customrecord_flo_process&json=[{"field":"isinactive","multi":"F","values":"T"}]'
			
					jQuery.ajax({
					  method: "POST",
					  url: url,
					})
					.done(function(msg){
					    console.log("process record deleted");
					})	*/

				}

				// with undo/redo support
				var cmd = new draw2d.command.CommandDelete(this);
				this.getCanvas().getCommandStack().execute(cmd);}
			default:

				break;
			}

		}, thisObject),
		x: x,
		y: y,
		items: {
			"op": {
						name: "Options:"
				},
			"sep2": "---------",
			"openprocess": {
					name: "<b>Open Process Record</b>"
			},
			"details": {
				name: "<b>Process Assistant</b>"
			},
			"drill": {
				name: "<b>Swim Lane</b>"
			},
			"sep3": "---------",
			//"copy": {name: "Copy", icon: "copy"},
			"delete": {
				name: "Delete"
			},
			"sep2": "---------",
			"change": {
				name: "<b>Change Shape To:</b>"
			},
			"step": {
				name: "Step"
			},
			"process": {
				name: "Process"
			},
			"decision": {
				name: "Decision"
			},
			"sep": "---------",
			"pick": {
				name: "<b>Set Line Color:</b>"
			},
			"red": {
				name: "Red"
			},
			"black": {
				name: "Black"
			},
			"yellow": {
				name: "Yellow"
			},
			"sep1": "---------",
			"pick2": {
				name: "<b>Set Fill Color:</b>"
			},
			"bred": {
				name: "Red"
			},
			"bwhite": {
				name: "White"
			},
			"byellow": {
				name: "Yellow"
			},


		}
	});
	}	
}



function getParentShape(x) {
	var bestfig;
	try
	{
	//This function locates the top-level parent of a new or moved HLP object
	var bestfig = canvas.getBestFigure(x,30, background);
	//alert(JSON.stringify(bestfig.getId()))
	//console.log(bestfig.getId())
    if(bestfig==null){
    	
    	var bestfig = canvas.getBestFigure(x+100,30, background);

    	if(bestfig==null || isNaN(bestfig.getId()))
    	{

    		var bestfig = canvas.getBestFigure(x-100,30, background);
			
			if(bestfig==null){
				return null
			}
		}

    }
		if(bestfig.getId().indexOf("label")>=0)
		{
			console.log(bestfig.getId().substring(5));
			bestfig=canvas.getFigure(bestfig.getId().substring(5))
		}

	if(isNaN(bestfig.getId()))
	{
		//alert("Parent cannot be detected please re locate the process")
		bestfig=null;
	}


	}
	catch(e){bestfig=null;}
	return bestfig
}

function getHit(x,y) {

	//This function checks whether a moved HLP object is dropped onto another object
	x=Math.round(x);
    y=Math.round(y);
	var bestfig = canvas.getBestFigure(parseInt(x), parseInt(y), background);
	//alert(JSON.stringify(bestfig.getId()))
	if(bestfig==null){alert("no match");return}
	if(bestfig.getId().indexOf("label")>=0)
	{bestfig=canvas.getFigure(bestfig.getId().substring(5))}
	//alert(bestfig.getId())
	//Check if the the attributes are accessible - this is to address a bug in the x,y figure location
    if(bestfig.getId()==null | isNaN(bestfig.getId()))
    {getHit(bestfig.getX(),bestfig.getY());}
    else
    {
		targetId=bestfig.getId()
	}
	
}

function addLabel(x, y) {
	this.label = new draw2d.shape.basic.Label("Double Click To Edit");
	this.label.setColor("#FFFFFF");
	this.label.setFontColor("#000000");
	this.label.setStroke(0);
	this.label.setAlpha(1);


	// add the new decoration to the connection with a position locator.
	//
	canvas.addFigure(this.label, x, y);
	this.label.installEditor(new FLOLabelInplaceEditor());
}



function addQuickNote(x, y, text, color) {
	//This function adds a quick freeform note to a process doc
	if (text == null | text == "") {
		text = "Enter Text";
	}
	var shape = new FLOQuickNote(text);
	if (color == null | color == "") {
		color == "#FF0000";
	}
	shape.setColor(color);
	//shape.setBackgroundColor("#FFFFFF");
	shape.setFontColor("#000000");
	shape.setPadding(20);
	shape.setResizeable(1);

	canvas.addFigure(shape, x, y);
	//allow editing if permission is available
	if (checkPermissions(pid) == true) {
		shape.installEditor(new FLOLabelInplaceEditor());
	}

}

function requestPermission(id) {
	//alert("currently disabled");
}

function OLDcreateNewProcess(newname,newnumber,newpid,parentPro,type)
{

setTimeout(function(){ 
var newprocess = top.nlapiCreateRecord("customrecord_flo_process");

newprocess.setFieldValue("name", newname.replace("\n"," "));
newprocess.setFieldValue("custrecord_flo_number", newnumber);
console.log("newnumber  "+newnumber)
if (parentPro != "") 
{
	parentvals = new Array();
	parentvals[0] = parentPro;

	newprocess.setFieldValues("custrecord_flo_process_parent", parentvals);
//alert(newprocess.getFieldValues("custrecord_flo_process_parent"));
}

 newprocess.setFieldValue("custrecord_flo_step_type", 5);
 if(type!=null)
 {newprocess.setFieldValue("custrecord_flo_step_type", type);}
        
//try {
	console.log('Start: '+new Date().getTime());
	procpid = top.nlapiSubmitRecord(newprocess);
	console.log('End: '+new Date().getTime());

	if(parentPro!="")
	{
		
		//alert(canvas.getFigure(parentPro).count);
		//alert(parentPro.count);
	}

//} catch (e) {alert(e.message)}
thisFig=canvas.getFigure(newpid);
//console.log(thisFig.getId());
thisFig.setId(procpid);
//console.log(thisFig.getId());
//console.log(thisFig.label.getId())
//thisLabel=canvas.getFigure("label"+newpid);
thisFig.label.setId("label"+procpid);
thisFig.getUserData().internalid=procpid;
newpid=procpid;
//update participants
if(type!=5)
{
	y=thisFig.getY();
	//top.nlapiSubmitField("customrecord_flo_process",newpid,"custrecord_flo_process_participants",getRoles(y-blockheight/2,y-blockheight/2+thisFig.getHeight()));

					var url_servlet = top.nlapiResolveURL('SUITELET', 'customscript_flo_record_update', 'customdeploy_flo_general_record_update');
									
					var myroles=getRoles(y-blockheight/2,y-blockheight/2+thisFig.getHeight());

					debugger

					var url=url_servlet+'&id='+newpid+'&recordtype=customrecord_flo_process&json=[{"field":"custrecord_flo_process_participants","multi":"F","values":"'+myroles+'"}]'
			
					jQuery.ajax({
					  method: "POST",
					  url: url,
					})
					.done(function(msg){
					    console.log("roles updated create");
					})	


 }
///update shape order
checkOrder(thisFig);
//return newpid
},50);

}

function createNewProcess(newname,newnumber,newpid,parentPro,type)
{
	myDialog=top.jQuery("<style>.no-close .ui-dialog-titlebar-close{display: none;}</style><div>Creating New Element...</div>").dialog({modal:true,dialogClass:"no-close"});

setTimeout(function(){ 
	var name=newname.replace("\n"," ");

	var json='[{"field":"name","multi":"F","values":"'+name+'"}'

	json+=',{"field":"custrecord_flo_number","multi":"F","values":"'+newnumber+'"}'

	if (parentPro != "") 
	{
		parentvals = new Array();
		parentvals[0] = parentPro;
	//	newprocess.setFieldValues("custrecord_flo_process_parent", parentvals);
		json+=',{"field":"custrecord_flo_process_parent","multi":"T","values":"'+parentvals+'"}'

	//alert(newprocess.getFieldValues("custrecord_flo_process_parent"));
	}

 //newprocess.setFieldValue("custrecord_flo_step_type", 5);
	 if(type!=null)
	 {
	 	//newprocess.setFieldValue("custrecord_flo_step_type", type);
	   json+=',{"field":"custrecord_flo_step_type","multi":"F","values":"'+type+'"}'
	 }else{
	   json+=',{"field":"custrecord_flo_step_type","multi":"F","values":"5"}'
	 }
	        

//debugger


//json+=',{"field":"externalid","multi":"F","values":"'+newpid+'}';

json+=']';

var url_servlet = top.nlapiResolveURL('SUITELET', 'customscript_flo_record_update', 'customdeploy_flo_general_record_update');
var url=url_servlet+'&id=X&recordtype=customrecord_flo_process&json='+json;


/*
setTimeout(function(){ 
setTimemyDialog=top.jQuery("<style>.no-close .ui-dialog-titlebar-close{display: none;}</style><div>Creating New Element...</div>").dialog({modal:true,dialogClass:"no-close"});
myDialog.dialog("open");},50);
*/

thisFig=canvas.getFigure(newpid);
thisFig.setId(newpid);
thisFig.label.setId("label"+newpid);
thisFig.getUserData().internalid=newpid;


console.log('Start: '+new Date().getTime());

jQuery.ajax({
  method: "POST",
  url: url,
}).done(function(msg){

	procpid=msg;
	thisFig=canvas.getFigure(newpid);
	thisFig.setId(procpid);
	thisFig.label.setId("label"+procpid);
	thisFig.getUserData().internalid=procpid;
	newpid=procpid;
	console.log("shape created");


//update participants
if(type!=5)
{
	y=thisFig.getY();
	//top.nlapiSubmitField("customrecord_flo_process",newpid,"custrecord_flo_process_participants",getRoles(y-blockheight/2,y-blockheight/2+thisFig.getHeight()));

					var url_servlet = top.nlapiResolveURL('SUITELET', 'customscript_flo_record_update', 'customdeploy_flo_general_record_update');
									
					var myroles=getRoles(y-blockheight/2,y-blockheight/2+thisFig.getHeight());
					console.log("myroles"+myroles);
					//debugger

					var url=url_servlet+'&id='+newpid+'&recordtype=customrecord_flo_process&json=[{"field":"custrecord_flo_process_participants","multi":"F","values":"'+myroles+'"}]'
			
					jQuery.ajax({
					  method: "POST",
					  url: url,
					})
					.done(function(msg){
					    console.log("roles updated create");
					})	


}

checkOrder(thisFig);

console.log('End: '+new Date().getTime());

})	

myDialog.dialog( "close" );

},500);

}

function updateTLP(labeltext,newnumber,parentPro,type,id,parent)
{
	//this function checks if there is a matching tlp entry - if not, it creates one.
	var tlpmatch="";//flag for matched tlp
	for(t=0;tlp[t]!=null && tlpmatch=="";t++)
	{
		if(tlp[t].internalid==id)
		{tlpmatch=t}
	}
	
	if(tlpmatch!="")
	{
		//if found update the name and number
		tlp[tlpmatch].name=labeltext;
		tlp[tlpmatch].custrecord_flo_number=newnumber;
	}
	else
	{
		tlp.push({"formulatext":"-5","internalid":id,"name":labeltext,"custrecord_flo_number":newnumber,"custrecord_flo_step_type":type,"custrecord_flo_process_status":"","owner":"","entityid":"null","custrecord_flo_process_editors":"","custrecord_flo_process_audience":"","custrecord_flo_process_participants":"","formulanumeric":newnumber,"custrecord_flo_process_parent":parentPro,"custrecord_flo_process_overview":"","custrecord_flo_comments":"","custrecord_flo_first_step":"","custrecord_flo_first_stepdesc":"","custrecord_flo_last_step":"","custrecord_flo_last_stepdesc":"","custrecord_flo_process_description":"",})
	}
}

function makeShape(shape,width, height, labeltext, showPorts, fontsize, strokesize, color, bgcolor,userdata,parentPro,id,type){
		//alert(color)
		//alert(shape+"--"+width+"--"+ height+"--"+ labeltext+"--"+ showPorts+"--"+ fontsize+"--"+ strokesize+"--"+ color+"--"+ bgcolor+"--"+JSON.stringify(userdata)+"--"+parentPro+"--"+id+"--"+type)
		if (typeof color == 'undefined' || color == null || color == "") {
			color = "000000";
			bgcolor = "FFFFFF";
		}
		var reload=false;//tracks whether this is a new object or a reloade object;
		shape.installEditPolicy(new ShapeSelectionPolicy())
		//shape.installEditPolicy(new ShapeDragEditPolicy())
		

		
		try{
			shape.setColor(color);
			shape.setBackgroundColor(bgcolor);
		}catch(e){
			color = "000000";
			bgcolor = "FFFFFF";
			shape.setColor(color);
			shape.setBackgroundColor(bgcolor);
		}
		shape.setStroke(Math.max(strokesize*.75,1));
		shape.setAlpha(1);
                //alert("PID:"+pid);
                if(parentPro==null | parentPro=="")
                {parentPro=parent.currentpid}
                //set default userdata if blank
        

		if (!userdata |userdata == null | userdata == "null" | userdata == "") 
		{
			if (parentPro != null && parentPro != "") 
			{
                
				//get parent process
				parentdata = canvas.getFigure(parentPro).getUserData();
				//alert(JSON.stringify(parentdata))
				if(canvas.getFigure(parentPro).count==null)
				{canvas.getFigure(parentPro).count=getStepCount()};
				canvas.getFigure(parentPro).count++;
				//alert(canvas.getFigure(parentPro).count)
				var newnumber = parentdata.custrecord_flo_number + "." + (canvas.getFigure(parentPro).count);
				//newnumber = parentdata.custrecord_flo_number + "." + canvas.figures.length;
				if(labeltext==null | labeltext=="")
				{var labeltext = " New " + unescape(parentdata.name) + " Step";}
	
			} 
			else 
			{
				var labeltext = "New Process Step";
				var newnumber = (parentLength + 1);
				//alert("NN"+newnumber)
			}

            
            if((id=="new"))
            {
	            //create new process record
	            //alert("creating new record")
				newpid=new Date().getTime();
				console.log([labeltext,newnumber,newpid,parentPro,type]);
				createNewProcess(labeltext,newnumber,newpid,parentPro,type);
				
				
			}
			else
			{
				newpid=id;
			}

		/*	if (newnumber != "") {
				labeltext = newnumber + " " + labeltext;
			}*/
			userdata = {
				"internalid": newpid,
				"name": labeltext,
				"custrecord_flo_number": newnumber,
				"custrecord_flo_process_parent": parentPro,
				"custrecord_flo_step_type": type,
				"custrecord_flo_process_document": "",
				"owner": userid,
				"formulanumeric": "0",
				"custrecord_flo_process_type": "",
				"custrecord_flo_process_description": "",
				"custrecord_flo_diagram_file": "",
				"custrecord_flo_supp_process": ""
			}

			//alert(userdata)
			//if the parent is specified set it
			if (parentPro != null && parentPro != "") {
				userdata.custrecord_flo_process_parent = parentPro;
			}

		}
		//alert(userdata.custrecord_flo_number)
	   var newnumber=userdata.custrecord_flo_number;
	   try{
	   if(type!=7)
	   {labeltext = newnumber.substring(newnumber.lastIndexOf(".")+1) + " " + cleanText(labeltext);}
       }
       catch(e){}


		shape.setUserData(userdata)
		// add ports
		port1=shape.createPort("hybrid", new MyRightPortLocator(shape));
		port1.setName("right");
		port2=shape.createPort("hybrid", new MyLeftPortLocator(shape));
		port2.setName("left");
		port3=shape.createPort("hybrid", new MyTopPortLocator(shape));
		port3.setName("top");
		port4=shape.createPort("hybrid", new MyBottomPortLocator(shape));
		port4.setName("bottom");



		// Add Label
		/*if (labeltext == null | labeltext == "null" | labeltext == "" | labeltext == " ") {
			labeltext == "New Process Step";
		} else if (tlp[i] != null && tlp[i].custrecord_flo_number != null) {
			var numval = tlp[i].custrecord_flo_number;
			if (numval == "") {
				numval = "#"
			}
			labeltext=cleanText(labeltext);
			if(labeltext.indexOf(".")<0)
			{labeltext = numval + ' ' + labeltext;}
		}*/
		//
		shape.label = new FLOShapeLabel(labeltext, shape, "#FFFFFF");
		shape.label.setColor(bgcolor);
		shape.label.setBackgroundColor(bgcolor);
		shape.label.setFontColor("#000000");
		shape.label.setStroke(0);
		shape.label.setFontSize(fontsize);


		shape.addFigure(shape.label, new draw2d.layout.locator.CenterLocator(shape));

		shape.label.installEditor(new FLOLabelInplaceEditor({
			// called after the value has been set to the LabelFigure
			onCommit: $.proxy(function(value) {
				//alert("new value set to:" + shape.value);
				//update process data with the new description
				newnum="";
				if (!isNaN(value.split(" ")[0].replace("S",""))) {
					num = value.split(" ")[0];
					newnum=num;
					if(num.indexOf(".")>=0)
					{newnum=newnum.substring(newnum.lastIndexOf("."))}
					value = cleanText(value.substring(value.indexOf(" ") + 1));
					if(newnum!=num)
					{this.label.setText(newnum+" "+value)}
					
					
				}

				updateStepNameNum(shape.getId(), value, newnum, "step");
			})
		}));
		
		
}

function moveConnections(fig,newfig)
{
	var ports=fig.getPorts().asArray();
	for(ps=0;ports[ps]!=null;ps++)
	{
		conns=ports[ps].getConnections().asArray();
		for(cs=0;conns!=null && conns[cs]!=null;cs++)
		{
			if(conns[cs].getTarget()==ports[ps])
			{
				conns[cs].setTarget(newfig.getPort(ports[ps].getName()));
			}
			else
			{
				conns[cs].setSource(newfig.getPort(ports[ps].getName()));
			}
		}
		
	}
}

function getStepCount(shapeClass)
{
	var stepShapes=canvas.getFigures().asArray();
	//alert(stepShapes.join())
	var sc=0;//counter of process steps
	for(ss=0;stepShapes[ss]!=null;ss++)
	{
		thisClass=stepShapes[ss].NAME+"";
        if(shapeClass!=null && thisClass.indexOf(shapeClass)>=0)
        {sc++}
		else if(thisClass.indexOf("FLO")>=0 && thisClass.indexOf("Start")<0 && thisClass.indexOf("End")<0 && thisClass.indexOf("Row")<0 && thisClass.indexOf("Shape")<0 && thisClass.indexOf("Next")<0)
		{sc++}
		//alert(thisClass+"--"+sc)
	}
	//alert(sc)
	return sc
}

function  getLaneLineArray()
{
	var stepShapes=canvas.getLines().asArray();

	var laneArray=[];
	for(ss=0;stepShapes[ss]!=null;ss++)
	{
		thisClass=stepShapes[ss].NAME+"";
		//alert(stepShapes[ss].NAME)
		//alert(thisClass)
		if(thisClass=="FLOLaneLine")
		{
			//alert(stepShapes[ss])
			laneArray.push(stepShapes[ss])
		}
	}
	
	if(!hlp)
	{
		console.log("SSL:"+stepShapes.length)
		laneArray.sort(function(a, b){return a.getStartPoint().getY()-b.getStartPoint().getY()})
	}

	return laneArray
}

function getLabelArray()
{
	try{
	var stepShapes=canvas.getFigures().asArray();
	var labelArray=[];
	for(ss=0;stepShapes[ss]!=null;ss++)
	{
		thisId=stepShapes[ss].getId();
		//alert(stepShapes[ss].NAME)
		//alert(thisClass)
		if(thisId != null && thisId.indexOf("Label::")==0 && thisId.indexOf("Label::Supporting")<0)
		{
			//alert(stepShapes[ss])
			labelArray.push(stepShapes[ss])
		}
	}
	    
		labelArray.sort(function(a, b){return a.getY()-b.getY()});
		labelIds=[];
		for(lA=0;labelArray[lA]!=null;lA++)
		{
			labelIds.push(labelArray[lA].getId())
		}

	 }catch(e){
	 		
	 }

	return labelIds
}

function getStepArray()
{
	var stepShapes=canvas.getFigures().asArray();
	var stepArray=[];
	for(ss=0;stepShapes[ss]!=null;ss++)
	{
		thisId=stepShapes[ss].getId();
		//alert(stepShapes[ss].NAME)
		//alert(thisClass)
		//if(!isNaN(thisId) && thisId!=pid && stepShapes[ss].getUserData().custrecord_flo_step_type!=6 && stepShapes[ss].getUserData().custrecord_flo_step_type!=8)
		if(!isNaN(thisId) && thisId!=pid)
		{
			//alert(stepShapes[ss])
			stepArray.push(stepShapes[ss])
		}
	}

	return stepArray
}

function cleanupLanes(lanes)
{
	lines=getLaneLineArray();
	//alert(lines.length)
	for(l=0;lines!=null && lines[l]!=null;l++)
	{
		//alert(lines[l].getId())
		thisLaneName=lines[l].getId().replace("Line::","");
		if(lanes.indexOf(thisLaneName)<0 | lanes.indexOf(thisLaneName)==lanes.length-1)
		{
			//delete line
			//alert("deleting line: "+thisLaneName)
			var cmd = new draw2d.command.CommandDelete(lines[l]);
            lines[l].getCanvas().getCommandStack().execute(cmd);
		}

	}
	
	labels=getLabelArray();
	
	for(l=0;labels!=null && labels[(l+1)]!=null;l++)
	{
		//alert(labels[l])
		thisLabel=labels[l].replace("Label::","");
		//alert("#"+thisLabel+"--"+unescape(thisLabel)+"--"+lanes.join()+"--"+lanes.indexOf(unescape(thisLabel)))
		if(lanes.indexOf(unescape(thisLabel))<0 && thisLabel.indexOf("Label::Supporting")<0)
		{
			//delete label
			//alert("deleting label: "+thisLabel+"#");
		
			var cmd = new draw2d.command.CommandDelete(canvas.getFigure(labels[l]));
            canvas.getCommandStack().execute(cmd);
		}
	}
	
}

function repositionEnd(resize)
{
	var stepShapes=canvas.getFigures().asArray();
    var thisEnd="";
	for(ss=0;stepShapes[ss]!=null && thisEnd=="";ss++)
	{
		//alert(stepShapes[ss].NAME)
		thisClass=stepShapes[ss].NAME+"";
		//alert(stepShapes[ss].NAME)
		//alert(thisClass)
		if(thisClass=="FLOEnd")
		{
			//alert(stepShapes[ss])
			thisEnd=stepShapes[ss];
		}
	}

	if(thisEnd!="")
	{
		console.log(resize)
		if(resize!=null)
		{
			thisEnd.setPosition(background.getWidth()-thisEnd.getWidth()-20,thisEnd.getY());
			return
		}
		//alert("thisEnd"+thisEnd.NAME);
		stepArray=getStepArray();
		if(lastshape==null)
		{lastshape=stepArray[0];}
		lastX=0;
		//Double check  the last step by comparing the numbers
		for(ls=0;stepArray!=null && stepArray[ls]!=null;ls++)
		{
			thisX=stepArray[ls].getX();
			thisClass=stepArray[ls].NAME+"";
			if((thisClass=="FLOProcess" | thisClass=="FLODecision" | thisClass=="FLOStep") && thisX>lastX)
			{
				lastX=thisX*1;
				lastshape=stepArray[ls];
			}
			
			
		}
		resizeBackground(lastshape.getX()+lastshape.getWidth()*2+spread*3,background.height);
		//Move end if it is inside of the lastshape and inline with it.

		if(Math.abs(thisEnd.getY()-lastshape.getY())<blockheight && thisEnd.getX()<(lastshape.getX()+lastshape.getWidth()+spread))
		{thisEnd.setPosition(lastshape.getX()+lastshape.getWidth()+spread,thisEnd.getY());}
		
		//Change connections if the lastshape is not the current shape that the end is connected to
		connections=thisEnd.getConnections().asArray();
		//alert(connections.length)
		if(connections.length==1)
		{
			
			connections[0].setSource(lastshape.getHybridPort("right"));
			connections[0].setTarget(thisEnd.getInputPort(0));
		}
		else if(connections.length==0)
		{
			endport=thisEnd.getInputPort(0)

			connect= new draw2d.Connection();
			connect.setTargetDecorator(new draw2d.decoration.connection.ArrowDecorator(8, 8));
			connect.setStroke(Math.max(strokesize,1));
			connect.setSource(lastshape.getHybridPort("right"));
			connect.setTarget(endport);
			canvas.addFigure(connect);
		}
	}
}

function resizeBackground(w,h,shrink)
{
	//create new background
	/*newbackground = new Background(w, h, hlp);//the background is used to enable us to control the appearance of the diagram.
	newbackground.setId(background.getId());
	newbackground.setUserData(background.getUserData());
	var cmd = new draw2d.command.CommandDelete(background);
    //canvas.getCommandStack().execute(cmd);	
	canvas.addFigure(newbackground, 2, 2);*/
	console.log(w+"--"+h)
	if(w<top.window.innerWidth-70){
		w=top.window.innerWidth-70
	}
	//if(w>canvas.getWidth()-20)
	//{w==canvas.getWidth()-20}
	//check if width is too wide
	//get furthest element to the right
	var stepsArray=getStepArray();
	lineArray=canvas.getLines().asArray();
	bottomLine=lineArray[0];
	var lineY=bottomLine.getStartPoint().getY();
	var edge=0;
	var yedge=0;
	for(var s=0;stepsArray!=null && stepsArray[s]!=null;s++)
	{
		if(stepsArray[s].getY()<lineY && stepsArray[s].getX()>edge)
		{edge=stepsArray[s].getX()}
		if(stepsArray[s].getY()<lineY && stepsArray[s].getY()>yedge)
		{
			console.log(s+" yedge: "+yedge+" stepsArray[s].getY() "+ stepsArray[s].getY())
			yedge=stepsArray[s].getY()
		}
	}
	
	if(typeof shrink == "undefined" | shrink==null | shrink=="")
	{
		
		w=Math.min(Math.max(w,edge+(blockwidth+spread)*2),canvas.getWidth()-20);
		
	}
	else
	{
		
		w=Math.min(Math.min(w,edge+(blockwidth+spread)*2),canvas.getWidth()-20);
		h=Math.min(Math.min(h,yedge+(blockheight+20)*3),canvas.getHeight()-20);

		
	}
	
	origHeight=background.height;
	origWidth=background.width
	background.setDimension(w,h);
	background.repaint(background.attributes);
	if(origWidth>w)
	{repositionEnd(true)}
	resizeLanes(w);
	extendLeftCol(h);
	repositionBottomRow(background.getHeight(),w,origHeight);
}

function resizeLanes(w)
{
	var lineArray=getLaneLineArray();
	for(la=0;lineArray!=null && lineArray[la];la++)
	{
		end=lineArray[la].getEndPoint();
		newend=lineArray[la].setEndPoint(w,end.getY());
	}
}

function extendLeftCol(h)
{
	laneArray=canvas.getLines().asArray();
	leftLane=laneArray[1];
	leftLane.setEndPoint(leftLane.getEndPoint().getX(),h);
}



function repositionBottomRow(h,w,oh)
{
	laneArray=canvas.getLines().asArray();
	bottomLane=laneArray[0];
	currentY=bottomLane.getStartPoint().getY();
	newY=h-(oh-currentY);
	bottomLane.setStartPoint(0,newY);
	bottomLane.setEndPoint(w,newY);
	
	//readjust the label
	var stepShapes=canvas.getFigures().asArray();
    var thisSupport="";
	for(ss=0;stepShapes[ss]!=null && thisSupport=="";ss++)
	{
        
		if(stepShapes[ss].getId().indexOf("Label::Supporting")>=0)
		{
			
			thisSupport=stepShapes[ss];
		}
	}
	if(thisSupport=="")
	{
		thisSupport=rowLabel(canvas, "Supporting\nProcesses", (Math.min(background.getWidth()*.1, 120))/5, bottomLane.getStartPoint().getY()+60);
	}

		thisSupport.setPosition(60-thisSupport.width/2,bottomLane.getStartPoint().getY()+60-thisSupport.height/2);
		
	//readjust objects below the current supporting process line
	suppsteps=getStepArray();
	for(var s=0;suppsteps!=null && suppsteps[s]!=null;s++)
	{
		thisY=suppsteps[s].getY();
		thisX=suppsteps[s].getX();
		if(thisY>currentY)
		{suppsteps[s].setPosition(thisX,thisY+(newY-currentY))}
	}
    
}



function removeExtraShapes()
{
	console.log("removing extra steps")
	//This function removes unneeded shapes from the diagram
	var stepArray=getStepArray();
	var laneArray=getLaneLineArray();
	for(sa=0;stepArray!=null && stepArray[sa]!=null;sa++)
	{
		thisId=stepArray[sa].getId();
		smatch=false;
		//loop through the steps to check if the step still exists
		for(s=0;steps[s]!=null;s++)
		{
			if(steps[s].internalid==thisId)
			{
				smatch=true;
			}
		}// end of loop looking for matching object
		if(!smatch)
		{
			//delete step
			//alert("deleting: "+JSON.stringify(stepArray[sa].getUserData()));
			console.log("removing "+stepArray[sa].getId())
			debugger
			var cmd = new draw2d.command.CommandDelete(stepArray[sa]);
            stepArray[sa].getCanvas().getCommandStack().execute(cmd);
		}
	}

}

function cleanupSteps()
{

	
	//This function checks and repositions shapes correctly based on the new lines
	var stepArray=getStepArray();
	var laneArray=getLaneLineArray();
	for(sa=0;stepArray!=null && stepArray[sa]!=null;sa++)
	{

		thisId=stepArray[sa].getId();
			//alert("checking position"+stepArray[sa].getId())
			//check positioning and size
			//get raw data
			stepdata="";
			for(rd=0;steps[rd]!=null && stepdata=="";rd++)
			{
				//alert(steps[rd].internalid+"--"+thisId)
				if(steps[rd].internalid==thisId)
				{
					stepdata=steps[rd].roles;
					roles=stepdata;
				}
			}
			if(stepdata=="")
			{
				roles=stepArray[sa].getUserData().roles;
			}
			//alert(roles)
			rolelist=roles.split(",");
			roleCount=rolelist.length;
		    ynum1=Math.max(getYPos(roles),0);
		    //alert(ynum1)
		    //ynum2=ynum1+roleCount-1;
		    var ltop=0;//position of lane above
		    var lbot;//position of lane below
		    if(ynum1+roleCount-1<=laneArray.length-1)
		    {
				lbot=laneArray[Math.max(ynum1+roleCount-1,laneArray.length-1)].getStartPoint().getY();//position of the lane below
			}
			else
			{
				lbot=(background.height-140);
			}
		

			if(roleCount>1)
			{
				if(ynum1!=0)
			    {   
					ltop=laneArray[ynum1].getStartPoint().getY();
				}
			
				ltop=laneArray[Math.max(ynum1,0)].getStartPoint().getY();
				lnum=0;
				for(rl=0;rolelist[rl]!=null;rl++)
				{
					lmatched=false;
					for(lb=0;laneArray[lb]!=null && lmatched==false;lb++)
					{
						if(laneArray[lb].getId()=="Line::"+rolelist[rl])
						{
							//alert("found lane:"+laneArray[lb].getId())
							lnum=Math.max(lnum,lb);
							lmatched=true;
							//alert(lnum)
						}
					}
					if(lmatched==false)
					{lnum=roleCount-2}
				}
				//alert("lnum:"+lnum)
				lbot=laneArray[lnum].getStartPoint().getY();
			}
			
			//check position
			botpos=stepArray[sa].y+stepArray[sa].height;//current position of the bottom of the shape
			//alert(thisId+"--"+roleCount+"--"+botpos+"--"+lbot+"--"+ltop)
			if(roleCount==1 && botpos>lbot)
			{
				stepArray[sa].setPosition(stepArray[sa].x,lbot-20-stepArray[sa].height);
				if(stepArray[sa].y<ltop)
				{stepArray[sa].height=Math.max(stepArray[sa].height-(ltop-stepArray[sa].y)-20,blockheight)}
			}

			if(roleCount==2 && (Math.abs(botpos-lbot)>stepArray[sa].height | botpos>lbot | stepArray[sa].y<ltop))
			{
				//alert("2 ROLES: repositioning: "+stepArray[sa].getId()+"--"+ltop)
				stepArray[sa].setPosition(stepArray[sa].x,ltop-blockheight/2);
				stepArray[sa].height=blockheight;
			}
			if(roleCount>2 && (Math.abs(botpos-lbot)>stepArray[sa].height | botpos>lbot | stepArray[sa].y<ltop))
			{
				//alert("2+ ROLES: repositioning: "+stepArray[sa].getId()+"--"+ltop)
				//alert(stepArray[sa].y+">"+ltop+"?")
				//alert(stepArray[sa].y+stepArray[sa].height+"<"+lbot+"?")
				botRow=laneArray[laneArray.length-1].getStartPoint().getY();;
				topRow=laneArray[0].getStartPoint().getY();
				//alert(roles)
				rolelist=roles.split(",");
				//alert(rolelist.length+"--"+rolelist[rolelist.length-1])
				for(rl=0;rl<roleCount;rl++)
				{
					

					thisRow=canvas.getFigure("Line::"+rolelist[rl]);
					if(thisRow!=null)
					{
						thisY=thisRow.getStartPoint.getY();
					}
					else
					{
						thisY=laneArray[laneArray.length-1].getStartPoint().getY();
					}

					topRow=Math.min(topRow,Math.max(thisY,0));
					botRow=Math.max(botRow,Math.max(thisY,0));
					//alert(rl)
					
				}
				//alert(stepArray[sa].getUserData().name+"--"+topRow+"--"+botRow);
				stepArray[sa].setPosition(stepArray[sa].x,topRow-blockheight/2);
				//botpos=laneArray[botRow].getStartPoint().getY();
				stepArray[sa].height==botRow-topRow+blockheight;
			}

				
			
			
		    
		    
		
	}
}



function getRoles(topy,botty)
{
	
	var roleLanes=getLaneLineArray();
	var roles=[];
	var toplane="";//top lane name
	var bottomlane="";//bottom lane name
	var lastlane=0;//height of last lane
	for(rl=0;roleLanes[rl]!=null;rl++)
	{
		//alert(roleLanes[rl].getId().split("::")[1]+"--"+topy+"--"+botty+"--"+roleLanes[rl].getStartPoint().getY())
		console.log((roleLanes[rl].getId().split("::")[1]+"--"+topy+"--"+botty+"--"+roleLanes[rl].getStartPoint().getY()))
		lastlane=roleLanes[rl].getStartPoint().getY();
		if(toplane=="" && roleLanes[rl].getStartPoint().getY()>=topy)
		{
			
			toplane=roleLanes[rl].getId().split("::")[1];
			roles.push(toplane);
			
				
		}
		if(bottomlane=="" && roles.length>0 && roleLanes[rl].getStartPoint().getY()>botty)
		{
			bottomlane=roleLanes[rl].getId().split("::")[1];
			
			if(roles.indexOf(bottomlane)<0)
			{roles.push(bottomlane);}
			
		}
		//alert(toplane+"--"+bottomlane)
	}
	
	/*if(lastlane<botty)
	{roles.push(bottomlane);}*/	
	//alert(roleLanes[rl-1].getStartPoint().getY()+"-z-z-z-"+botty)
	if(roleLanes[rl-1]!=null && roleLanes[rl-1].getStartPoint().getY()<botty)
	{
		roles.push(getLastLabel())
	}
	roles=roles.join()
	//alert(roles)
	return roles
}

function getLastLabel()
{
	/*var stepShapes=canvas.getFigures().asArray();
	var rowArray=[];
	for(ss=0;stepShapes[ss]!=null;ss++)
	{
		thisClass=stepShapes[ss].NAME+"";
		//alert(stepShapes[ss].NAME)
		//alert(thisClass)
		if(thisClass=="FLORowLabel")
		{
			//alert(stepShapes[ss])
			rowArray.push(stepShapes[ss])
		}
	}
	
	return rowArray[rowArray.length-2].getId().split("::")[1];*/
	labels=getLabelArray().reverse();
	return labels[0].split("::")[1]
}

function copyMove(shape,target,copyFlag,childFlag)
{
	alert("copyMove")
	try
	{
	//This function copies process elements (hlp, process, steps)
	//If the target is background, it copies it to the canvas with a slight offset to the original
	if(target==background)
	{
		//alert("background")
		newProcess=shape.clone();
		newProcess.setId(newpid);
		newProcess.label.setId("label:"+newpid);
		canvas.addFigure(newProcess,shape.getX()-20,shape.getY()-20);
		if(childFlag)
		{top.nlapiSubmitField("customrecord_flo_process",newpid,"custrecord_flo_copy_children","T")}
	}
	else if(copyFlag)
	{
		alert("copyFlag:"+copyFlag)
		//Otherwise it simply creates a copy in the backend with the specified parent
		newProcess=top.nlapiCopyRecord("customrecord_flo_process",shape.getId());
		newProcess.setFieldValues("custrecord_flo_process_parent",target.getId());
		newProcess.setFieldValue("custrecord_flo_copy",shape.getId());
		if(childFlag)
		{newProcess.setFieldValue("custrecord_flo_copy_children","T");}
		newpid=top.nlapiSubmitRecord(newProcess)
	}
	else
	{
		//alert("copyFlag:"+copyFlag)
		//alert(shape.getId())
		//If copyFlag is false
		//newProcess=top.nlapiLoadRecord("customrecord_flo_process",shape.getId());
		top.nlapiSubmitField("customrecord_flo_process",351,"name",shape.getUserData().name+" - T")
		//alert("here")
		//newProcess.setFieldValues("custrecord_flo_process_parent",target.getId());
		//newpid=top.nlapiSubmitRecord(newProcess)
		//alert(newpid)
		
	}
	}
	catch(e){alert(e.message)}
	
}

function deleteShape(shape)
{
	//locate parent
	var shapeParent=getParentShape(shape.getX());
	if(shapeParent!=null)
	{var parentid=shapeParent.getId();}
	else
	{parentid=""}
	
	//Confirm delete
	if(confirm("Delete?")){
		//Check for multiple parents
		
		console.log(shape.getUserData().custrecord_flo_process_parent+"--"+shape.getUserData().custrecord_flo_process_parent.indexOf("%2C"));

		if(shape.getUserData().custrecord_flo_process_parent.indexOf("%2C")<0)
		{
			//Single parents can be deleted
			//alert("deleting")
			/*setTimeout(function(){
				top.nlapiSubmitField("customrecord_flo_process", shape.getId(), "isinactive", "T");
				},200);*/
				top.nlapiSubmitField("customrecord_flo_process", shape.getId(), "isinactive", "T");

					/*var url_servlet = top.nlapiResolveURL('SUITELET', 'customscript_flo_record_update', 'customdeploy_flo_general_record_update');
									
					var url=url_servlet+'&id='+shape.getId()+'&recordtype=customrecord_flo_process&json=[{"field":"isinactive","multi":"F","values":"T"}]'
			
					jQuery.ajax({
					  method: "POST",
					  url: url,
					})
					.done(function(msg){
					    console.log("shape deleted");
					})	*/
					    console.log("shape deleted" +shape.getId());



		}
		else
		{
			//remove parent from multiple parents.
			if(parentid!=null && parentid!="")
			{
				
				parents=","+unescape(shape.getUserData().custrecord_flo_process_parent);
				//alert("checking parents:"+parents)
				newparents=parents.replace(","+parentid,"").substring(1);
				if(newparents!=parents)
				{
					//alert("resetting parents:"+newparents+"id:"+shape.getId())
					setTimeout(function(){
						
					try
					{
					if(newparents.indexOf(",")==-1){

						//top.nlapiSubmitField("customrecord_flo_process", shape.getId(), "custrecord_flo_process_parent", newparents);
					//}else{
  					
  						var url_servlet = top.nlapiResolveURL('SUITELET', 'customscript_flo_record_update', 'customdeploy_flo_general_record_update');
						var url=url_servlet+'&id='+shape.getId()+'&recordtype=customrecord_flo_process&json=[{"field":"custrecord_flo_process_parent","multi":"T","values":"'+newparents+'"}]'

						//var a = {"User-Agent-x": "SuiteScript-Call"};
						
						//top.nlapiRequestURL(url, null, a, handleResponse);

						jQuery.ajax({
						  method: "POST",
						  url: url,
						})
						.done(function(msg){
						    console.log("end update delete shape");
						})	
	
					}		




					}
					catch(e){alert(e.message+"--"+newparents)}
					},200);
				}
			}
			
		}
	if(parentid!=null && parentid!="")
	{
			canvas.getFigure(parentid).count--;
	}
	else 
	{
			parentLength--;
	}
	var cmd = new draw2d.command.CommandDelete(shape);
	shape.getCanvas().getCommandStack().execute(cmd);
	}
}

function checkOrder(movedShape)
{

	//return true;

	try{
       var allsteps=getStepArray();
   
    //setflag on movedShape
    if(movedShape!=null)
    {
	   console.log("setting move flag"+movedShape.getId())
	   movedShape.getUserData().moved=true
	}
       
    for(as=0;as<allsteps.length;as++)
    {
		//if(movedShape==null || (movedShape!=null && allsteps[as]==movedShape))
		//if((movedShape==null && allsteps[as].getY()>blockheight && allsteps[as].getY()<blockheight*2) || (movedShape!=null && allsteps[as]==movedShape))
		if((movedShape==null && allsteps[as].getUserData().moved!=null && allsteps[as].getUserData().moved==true) || (movedShape!=null && allsteps[as]==movedShape))
		{
			//console.log(as)
			thisShape=allsteps[as];
	//quit if the shape does not yet have its internal id - this method is called when the id is returned anyway.
	if(thisShape!=background && !isNaN(thisShape.getId()))
	{
	//find parent
	thisParent=getParentShape(thisShape.getX());
	
	thisParentId=thisParent.getId();

	try{
		shapeOrder=unescape(thisParent.getUserData().custrecord_flo_shape_order);
	
	}catch(e){
		shapeOrder="";
	}
	//get shapes
	
	var pshapes=[];//array to hold the shapes belonging to each parent
	
	//Check if the parent of this object needs to be changed
	/*var thisShapeParent=unescape(thisShape.getUserData().custrecord_flo_process_parent).split(",");
	if(thisShapeParent.indexOf(thisParentId)<0)
	{
		if(thisShapeParent.getUserData().copy==true)
		{
			
			thisShapeParent.push(thisParentId)
		}
		else if(thisShapeParent.length==1)
		{
			thisShapeParent=[thisParentId];
		}
		else
		{
			
		}
	}*/
	
	//loop through shapes and find steps with same parent
	for(ps=0;allsteps[ps]!=null;ps++)
	{
		currentParent=unescape(allsteps[ps].getUserData().custrecord_flo_process_parent).split(",");
		if(currentParent.indexOf(thisParentId)>=0)
		{
			pshapes.push(allsteps[ps]);
		}
	}
	
	//sort in vertical descending order
	pshapes.sort(function(a, b){return a.getY()-b.getY()})
	currOrder=[];//current shape order
	for(ps=0;pshapes[ps]!=null;ps++)
	{
		if(currOrder.indexOf(pshapes[ps].getId())<0)
		{currOrder.push(pshapes[ps].getId());}
	}
	
	
			if(currOrder.indexOf()<0){
				currOrder.push(thisShape.getId())
			}

			currOrder=currOrder.join();

			console.log("currOrder: #"+currOrder+"#  shapeorder: #"+shapeOrder+"#")

		if(currOrder!=shapeOrder)
		{
			//alert("new order:  "+currOrder)

			if(movedShape!=null)
			{
				console.log("updating parent due to move")

				//setTimeout(function(){
								try{
								
									console.log('Start 2: '+new Date().getTime());	
									
									//top.nlapiSubmitField("customrecord_flo_process", thisParentId, "custrecord_flo_shape_order", currOrder);	

									//console.log('Start 1: '+new Date().getTime());	

									var url_servlet = top.nlapiResolveURL('SUITELET', 'customscript_flo_record_update', 'customdeploy_flo_general_record_update');
									
									var url=url_servlet+'&id='+thisParentId+'&recordtype=customrecord_flo_process&json=[{"field":"custrecord_flo_shape_order","multi":"F","values":"'+currOrder+'"}]'

									//var a = {"User-Agent-x": "SuiteScript-Call"};
									
									//top.nlapiRequestURL(url, null, a, handleResponse);	
								
										jQuery.ajax({
										  method: "POST",
										  url: url,
										})
										.done(function(msg){
										    console.log("end update");
										})

									console.log('End 2: '+new Date().getTime());


									var url_servlet = top.nlapiResolveURL('SUITELET', 'customscript_flo_record_update', 'customdeploy_flo_general_record_update');
									

									if(thisParentId!=thisShape.getId()){

										//thisParentId=""
									
									var url=url_servlet+'&id='+thisShape.getId()+'&recordtype=customrecord_flo_process&json=[{"field":"custrecord_flo_process_parent","multi":"F","values":"'+thisParentId+'"}]'
									
						
									//var a = {"User-Agent-x": "SuiteScript-Call"};
									
									//top.nlapiRequestURL(url, null, a, handleResponse);	

									jQuery.ajax({
										  method: "POST",
										  url: url,
										})
										.done(function(msg){
											
											alert("New parent Set");

										    console.log("end update thisParentId");
										})

									};
									
									thisParent.getUserData().custrecord_flo_shape_order=currOrder;

								//remove moved flag on movedShape
							    movedShape.getUserData().moved=false;
							    
							    console.log("removed move flag"+movedShape.getId())

									}catch(e){console.log(e.message+"--"+thisParentId)}

								//console.log(top.nlapiLookupField("customrecord_flo_process", thisParentId, "custrecord_flo_shape_order"))
								//},500);						
			}
			
			else
			{
				console.log("updating parent due to final check")
				top.nlapiSubmitField("customrecord_flo_process", thisParentId, "custrecord_flo_shape_order", currOrder);

				/*	var url_servlet = top.nlapiResolveURL('SUITELET', 'customscript_flo_record_update', 'customdeploy_flo_general_record_update');
									
					var url=url_servlet+'&id='+thisParentId+'&recordtype=customrecord_flo_process&json=[{"field":"custrecord_flo_shape_order","multi":"F","values":"'+currOrder+'"}]'
			
					jQuery.ajax({
					  method: "POST",
					  url: url,
					})
					.done(function(msg){
					    console.log("shape deleted");
					})	
				*/
				thisParent.getUserData().custrecord_flo_shape_order=currOrder;
				//console.log(top.nlapiLookupField("customrecord_flo_process", thisParentId, "custrecord_flo_shape_order"))
			}
		}
		else
		{
			if(movedShape!=null)
			{
				console.log("removing move flag"+movedShape.getId())
				//remove moved flag on movedShape
		    	movedShape.getUserData().moved=false;
			}
		}
		}
	}
}
	}catch(e){
		console.log(e);
	}
	
}

function handleResponse(response)
{
						/*	var headers = response.getAllHeaders();
							var output = 'Code: '+response.getCode()+'\n';
							output += 'Headers:\n';
							for (var i in headers)
								output += i + ': '+headers[i]+'\n';
								output += '\n\nBody:\n\n';
								output += response.getBody();
								console.log( output );*/
}