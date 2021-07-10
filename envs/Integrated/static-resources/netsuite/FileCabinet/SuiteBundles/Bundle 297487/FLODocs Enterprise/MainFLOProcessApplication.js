	
	
	// declare the namespace for this example
	var example = {};

	/**
	 * 
	 * The **GraphicalEditor** is responsible for layout and dialog handling.
	 * 
	 * @author Andreas Herz
	 * @extends draw2d.ui.parts.GraphicalEditor
	 */
	example.Application = Class.extend(
	{
	    NAME : "example.Application", 

	    /**
	     * @constructor
	     * 
	     * @param {String} canvasId the id of the DOM element to use as paint container
	     */
	    init : function()
	    {


		     //this.view = new draw2d.Canvas("gfx_holder");
                     this.view = new FLOCanvas("gfx_holder");
                         this.view.installEditPolicy(new draw2d.policy.canvas.BoundingboxSelectionPolicy());
			 this.view.installEditPolicy(new draw2d.policy.canvas.FadeoutDecorationPolicy());
		      this.view.defaultRouterClassName = "draw2d.layout.connection.ManhattanConnectionRouter";
	          this.view.defaultRouter = new draw2d.layout.connection.ManhattanConnectionRouter();
	          //this.toolbar = new example.Toolbar("toolbar", this, this.view );
	          //this.view.setScrollArea("#canvas");

		       // layout FIRST the body
		       /*this.appLayout = $('#container').layout({
		   	     north: {
		              resizable:false,
		              closable:false,
	                  spacing_open:0,
	                  spacing_closed:0,
	                  size:50,
		              paneSelector: "#toolbar"
		            },
		            center: {
		              resizable:false,
		              closable:false,
	                  spacing_open:0,
	                  spacing_closed:0,
		              paneSelector: "#canvas"
		            }
		       });*/

		},

		/**
		 * Load the JSON data into the view/canvas
		 */
		/*load: function(jsonDocument){
		    this.view.clear();

		    // unmarshal the JSON document into the canvas
		    // (load)
		    var reader = new draw2d.io.json.Reader();
		    reader.unmarshal(this.view, jsonDocument);

		},*/

		/*setDefaultRouterClassName: function(  defaultRouterClassName){
		    this.defaultRouterClassName=  defaultRouterClassName;
	        this.defaultRouter = eval("new "+this.defaultRouterClassName+"()");
		},*/

		createConnection : function(startPort,endPort){
		   // var conn = new draw2d.Connection();
                   //alert("App:LabelConnection")
                    var conn = new LabelConnection();
		    //conn.setRouter(this.defaultRouter);
		    conn.setTargetDecorator(new draw2d.decoration.connection.ArrowDecorator(8,8));
		    conn.setStroke(2);
                    
                   
		    return conn;
		},


	});
