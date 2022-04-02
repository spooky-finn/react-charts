/* eslint-disable no-redeclare */
import PathObject from './PathObject'

export default class Rect{
    strokeWidth = 1
    strokeColor = 'black'
    sizesDashesLengthPx = 8

    // The width and height of svg dom object
    clientHeight = undefined
    clientWidth = undefined

    ox_distance = undefined

    graph = {
        width: undefined,
        height: undefined,
        top: undefined,
        left: undefined,
        bottom: undefined,
        right: undefined,
    }

    rect = {
        width: undefined,
        height: undefined,
        top: undefined,
        left: undefined,
        bottom: undefined,
        right: undefined,
        x_dashes: [],
        y_dashes: [],
    }

    pathStorage = []
    ref = undefined

    constructor(ref){
        this.ref = ref
    }

    /*
     After the svg element is mounted, we can the set dimention of parent svg-element 
    and run calculation
    */
    _initDimentions(){
        const { clientWidth, clientHeight } = this.ref?.current
        this.clientHeight = clientHeight
        this.clientWidth = clientWidth

        this.graph = {
            width: clientWidth - 2 * (this.ox_margin + this.ox_padding),
            height: clientHeight - 2 * (this.oy_margin + this.oy_padding),
            top: this.oy_margin + this.oy_padding,
            left: this.ox_margin + this.ox_padding,
            bottom: this.clientHeight - this.oy_margin - this.oy_padding,
            right: this.clientWidth - this.ox_margin - this.ox_padding
        }

        this.rect = {
            width: clientWidth - 2 * this.ox_margin,
            height: clientHeight - 2 * this.oy_margin,
            top: this.oy_margin,
            left: this.ox_margin,
            bottom: this.clientHeight - this.oy_margin,
            right: this.clientWidth - this.ox_margin,
            x_dashes: [],
            y_dashes: [],
        }
    }

    /* 
    This method creates a black border around graph
    On the lines of the frame will stay a coordinate marks
    That means that this border have outher margins (outherOX/OYPadding property)
    Also this have a inner space between the frame and maximum amplitused
    */
    _drawRectBoundary(){
        const boundaryPath = new PathObject()
        boundaryPath.path_d = [`M ${this.ox_margin} ${this.oy_margin},
                                h ${this.clientWidth - 2*this.ox_margin},
                                v ${this.clientHeight - 2*this.oy_margin},
                                h -${this.clientWidth - 2*this.ox_margin}, 
                                v -${this.clientHeight - 2*this.oy_margin}`
                            ]
        this.pathStorage.push(<path d={boundaryPath} key={this._drawRectBoundary.name} stroke={this.strokeColor} fill="transparent" strokeWidth={this.strokeWidth} />)
    }

    _drawSizesDashes(){
        if (!this.ox_distance)
            throw new Error('Ox_distance property of class named Rect is undefined')

        const len = this.sizesDashesLengthPx   
        const graph = this.graph
        const rect = this.rect
      
        const sizesDashesPath = new PathObject()
       
        // --- OX --- 
        const x_next = graph.width / this.ox_marksCount
        for (var x = graph.left; x <= graph.right; x += x_next){
            rect.x_dashes.push(x)
        }

        rect.x_dashes.forEach(each => {
            sizesDashesPath.move(each, rect.bottom)
            sizesDashesPath.lineRelative(0 , len)  
        })
        // --- OX --- 
        
        // --- OY --- 
        const y_next = (this.ox_distance - graph.top) / (this.oy_marksCount / 2)

        // upper half-plane
        for (var y = this.ox_distance; y >= graph.top; y -= y_next){
            rect.y_dashes.push(y)
        }

        // lower half-plane
        for (var y = this.ox_distance + y_next; y <= graph.bottom; y += y_next){
            rect.y_dashes.push(y)
        }

        rect.y_dashes.forEach(each => {
            sizesDashesPath.move(rect.left, each)
            sizesDashesPath.lineRelative(-len , 0)  
        })
        
        const attributes = {
            d: sizesDashesPath,
            key: this._drawSizesDashes.name,
            stroke: this.strokeColor,
            strokeWidth: this.strokeWidth
        }
        
        this.pathStorage.push( <path {...attributes} />)
    }

    _setOxDistance(){
        let ox_distance = undefined
        const y_samples_min = Math.min(...this.y_samples)
        const y_samples_max = Math.max(...this.y_samples)
        
        const k = y_samples_max / y_samples_min

        if (k > 0)
            ox_distance = this.clientHeight - this.graph.top
        else 
            ox_distance = this.clientHeight / 2

        this.ox_distance = ox_distance
    }
    
    _drawOXaxis(){
        const path = new PathObject()

        path.move( 0, this.ox_distance )
        path.lineRelative( this.clientWidth, 0)
        
        this.pathStorage.push(<path d={path} stroke="red" key={this._drawOXaxis.name} strokeWidth="1" />)
    }    
}