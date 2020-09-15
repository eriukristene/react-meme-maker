import React from 'react';
import { Modal, ModalHeader, ModalBody, FormGroup, Label, NavbarBrand } from 'reactstrap';

// photos array which contains links to the photos for our meme maker
const photos = [
  // can use this type of path declaration if the images are in the public folder
  { src: "/Images/drake1.jpg" },
  { src: "/Images/ngtyson1.png" },
  { src: "/Images/niccage.png" },
  { src: "/Images/sunglasses.jpg" },
  { src: "/Images/thinkingdude.jpg" },
  { src: "/Images/distracted-boyfriend.jpg" },
  { src: "/Images/success-kid.jpg" },
  { src: "/Images/willywonka.png" },
  { src: "/Images/womanyellingcat.jpg" },
  { src: "/Images/frymeme.png" }
  // .. And much more meme-templates
];

/**
 * an initialState object with initial settings of the captions and their positioning. The position, content and drag-status of the top and bottom texts can be later modified by triggering state mutations
 * 
 * these are the things that are changing in the app, so they need an initialized value
 * 
 * state: stores a component’s dynamic data and determines the component’s behavior. In other words, it is the interface between any data of changes (backend or local) and the representation of this data with UI-elements in the frontend
 */
const initialState = {
  toptext: "", // Top caption of the meme
  bottomtext: "", // Bottom caption of the meme
  isTopDragging: false, // Checking whether top text is repositioned
  isBottomDragging: false,  // Checking whether bottom text is repositioned
  // X and Y coordinates of the top caption
  topY: "10%",  
  topX: "50%",
  // X and Y coordinates of the bottom caption
  bottomX: "50%",
  bottomY: "90%"
}

class MemeMaker extends React.Component {
  constructor() {
    super();
    this.state = {
      currentImage: 0,
      modalIsOpen: false,
      currentImagebase64: null,
      // Setting the initialState properties to the state object.
      // making a copy of the initial state so we don't mess up the initialized values
      ...initialState
    };
  }

  // determine the current selected image through an onClick on the img tag
  // opens up a reactstrap modal
  openImage = (index) => {
    const image = photos[index];
    const base_image = new Image();
    base_image.src = image.src;
    // image tag’s xlinkHref will be embedded(base64) path. Raw src URLs cannot be converted to PNGs while downloading
    const currentImagebase64 = this.getBase64Image(base_image);
    // Setting the currently selected image on the state.
    this.setState(prevState => ({
      currentImage: index,
      modalIsOpen: !prevState.modalIsOpen,
      currentImagebase64,
      ...initialState
    }));
  }
  
  toggle = () => {
    this.setState(prevState => ({
      modalIsOpen: !prevState.modalIsOpen
    }));
  }

  // we capture the user’s meme caption here, and mutate the state
  changeText = (event) => {
    this.setState({
      [event.currentTarget.name]: event.currentTarget.value
    });
  }

  getStateObj = (e, type) => {
    let rect = this.imageRef.getBoundingClientRect();
    // This getBoundingClientRect() returns height, width and positions of the element
    // In our case, we get the image's positions in the DOM since we position the text on the image.
    const xOffset = e.clientX - rect.left;
    const yOffset = e.clientY - rect.top;
    // This calculation yields us the current x and y positions of the element/cursor.
    let stateObj = {};
    // This is common function for top and bottom captions.
    if (type === "bottom") {
      stateObj = {
        isBottomDragging: true,
        isTopDragging: false,
        bottomX: `${xOffset}px`,
        bottomY: `${yOffset}px`
      }
    } else if (type === "top") {
      stateObj = {
        isTopDragging: true,
        isBottomDragging: false,
        topX: `${xOffset}px`,
        topY: `${yOffset}px`
      }
    }
    return stateObj;
  }

  // Mouse press —onMouseDown — Finds the selected text tag, determines current X and Y positions, and attaches “mousemove” event listener to it.
  // We then attach the “mousemove” event listener to track mouse movements on “mousedown”
  handleMouseDown = (e, type) => {
    const stateObj = this.getStateObj(e, type);
    // Finding current co-ordinates of the dragged <text />
    document.addEventListener('mousemove', (event) => this.handleMouseMove(event, type));
    // Start tracking the mouse movement.
    this.setState({
      ...stateObj
    })
  }

  // Mouse move — onMouseMove — Finds the current position(x and y) of the text tag as the mouse is held and moved.
  handleMouseMove = (e, type) => {
    if (this.state.isTopDragging || this.state.isBottomDragging) {
      // Only if dragging is active in the state, track mouse movements.
      let stateObj = {};
      if (type === "bottom" && this.state.isBottomDragging) {
        stateObj = this.getStateObj(e, type); // Getting the co-ordinates for bottom caption
      } else if (type === "top" && this.state.isTopDragging){
        stateObj = this.getStateObj(e, type); // Getting the co-ordinates for top caption
      }
      this.setState({
        ...stateObj
      });
    }
  };

  // Mouse release — onMouseUp — Finds the drop position or release position. Determines the X and Y where text is dropped. Removes the “mousemove” event listener from the element and terminates drag and drop.
  // Once the text tag is dropped, we remove the attached mouse move event listener in “mouseup”
  handleMouseUp = (event) => {
    // If mouse is released, remove the event listener and terminate drag actions.
    document.removeEventListener('mousemove', this.handleMouseMove);
    this.setState({
      isTopDragging: false,
      isBottomDragging: false
    });
  }

  /**
   * When a user clicks the download button, we are converting the SVG to an XML serialised string and drawing it in an HTML5 canvas. We use toDataUrl() method of html canvas (generates a base64 image URI) to generate an “image/png” mime-type image!
   */
  convertSvgToImage = () => {
    const svg = this.svgRef;
    let svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.setAttribute("id", "canvas");
    const svgSize = svg.getBoundingClientRect();
    canvas.width = svgSize.width;
    canvas.height = svgSize.height;
    const img = document.createElement("img");
    img.setAttribute("src", "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData))));
    img.onload = function() {
      canvas.getContext("2d").drawImage(img, 0, 0);
      const canvasdata = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.download = "meme.png";
      a.href = canvasdata;
      document.body.appendChild(a);
      a.click();
    };
  }

  /**
   * 
   * finds the currently selected image, converts it to data URI
   */
  getBase64Image(img) {
    // This function converts image to data URI
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL
    var dataURL = canvas.toDataURL("image/png");
    return dataURL;
  }

  

  render() {
    // converting SVG to PNG while exporting the meme is relatively simple task
    const image = photos[this.state.currentImage];
    const base_image = new Image();
    base_image.src = image.src;
    var wrh = base_image.width / base_image.height;
    // a little workaround to fix the aspect ratio
    // converts the selected image from whatever width it was to a width of 600px
    var newWidth = 600;
    // calculates the new height
    var newHeight = newWidth / wrh;
    const textStyle = {
      fontFamily: "Impact",
      fontSize: "50px",
      textTransform: "uppercase",
      fill: "#FFF",
      stroke: "#000",
      userSelect: "none"
    }

    return (
      <div>
        <div className="main-content">
          <div className="sidebar">
            <NavbarBrand href="/">Make-a-Meme</NavbarBrand>
            <p>
              This is a fun 5 hour project inspired by imgur. Built with React.
            </p>
            <p>
              You can add top and bottom text to a meme-template, move the text around and can save the image by downloading it.
            </p>
          </div>
          <div className="content">
            {/* We create the image gallery here! */}
            {photos.map((image, index) => (
              <div className="image-holder" key={image.src}>
                <span className="meme-top-caption">Top text</span>
                <img
                  style={{
                    width: "100%",
                    cursor: "pointer",
                    height: "100%"
                  }}
                  alt={index}
                  src={image.src}
                  // finds the currently selected image, converts it to data URI and opens up a reactstrap modal
                  onClick={() => this.openImage(index)}
                  role="presentation"
                />
              <span className="meme-bottom-caption">Bottom text</span>
              </div>
            ))}
          </div>
        </div>
        {/* The workstation for meme creation */}
        <Modal className="meme-gen-modal" isOpen={this.state.modalIsOpen}>
          <ModalHeader toggle={this.toggle}>Make-a-Meme</ModalHeader>
          <ModalBody>
            {/* The overall structure inside the SVG is pretty straightforward. It holds the image and the captions. 
            // supplying the calculated height and width to the SVG from above
            */}
            <svg
              width={newWidth}
              id="svg_ref"
              height={newHeight}
              ref={el => { this.svgRef = el }}
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink">
              <image
                ref={el => { this.imageRef = el }}
                // image tag’s xlinkHref will be embedded(base64) path. Raw src URLs cannot be converted to PNGs while downloading
                xlinkHref={this.state.currentImagebase64}
                height={newHeight}
                width={newWidth}
              />
              {/* And we will have event listeners attached to the <text /> tags to move them around. We'll see it in later part of the article. 
              */}
              <text
                style={{ ...textStyle, zIndex: this.state.isTopDragging ? 4 : 1 }}
                // x and y coordinates of the top and bottom <text /> tags are maintained in the state 
                x={this.state.topX}
                y={this.state.topY}
                dominantBaseline="middle"
                textAnchor="middle"
                onMouseDown={event => this.handleMouseDown(event, 'top')}
                onMouseUp={event => this.handleMouseUp(event, 'top')}
              >
                  {this.state.toptext}
              </text>
              <text
                style={textStyle}
                dominantBaseline="middle"
                textAnchor="middle"
                x={this.state.bottomX}
                y={this.state.bottomY}
                onMouseDown={event => this.handleMouseDown(event, 'bottom')}
                onMouseUp={event => this.handleMouseUp(event, 'bottom')}
              >
                  {this.state.bottomtext}
              </text>
            </svg>
            <div className="meme-form">
              <FormGroup>
                <Label for="toptext">Add your top caption here</Label>
                {/* two <input /> tags to allow the user to input their top and bottom captions for the meme 
                
                 onChange event captures the top-caption and bottom-caption, and sets them in the state as and when we change it
                */}
                <input className="form-control" type="text" name="toptext" id="toptext" placeholder="Add text to the top" onChange={this.changeText} />
              </FormGroup>
              <FormGroup>
                <Label for="bottomtext">Add your bottom caption here</Label>
                <input className="form-control" type="text" name="bottomtext" id="bottomtext" placeholder="Add text to the bottom" onChange={this.changeText} />
              </FormGroup>
              <button onClick={() => this.convertSvgToImage()} className="btn btn-primary">Download Meme!</button>
            </div>
          </ModalBody>
        </Modal>
      </div>
    )
  }
}

export default MemeMaker;