import sass from './styles.module.sass'
import React, { useRef, useEffect, useState } from 'react'

class PathObject {
    path_d = []

    move(x, y){
        this.path_d.push(`M ${x} ${y}`)
    }

    line(x, y){
        this.path_d.push(`L ${x} ${y}`)
        this.path_d.push(`M ${x} ${y}`)
    }

    lineRelative(x, y){
        this.path_d.push(`l ${x} ${y}`)
        this.path_d.push(`M ${x} ${y}`)
    }

    toString(){
        return this.path_d.join(' ')
    }
}

class AbsPlot {
    PATH_STORAGE = []

    // The plot containt the rect. At the same time the rect are consists the graph

    // plot the main object which contain a a rect and outside margin
    plot = {
        clientWidth: 0,
        clientHeight: 0,

        // distabce between upper side of plot ond OX axis
        ox_distance: 0,

        ox_margin: 60,
        oy_margin: 30
    }

    // rect contain the border and spase between border and graphic (nmaed like 'padding')
    rect = {
        ox_padding: 10,
        oy_padding: 10,
        borderColor: 'black',
        strokeWidth: '1',
        
        // расстояние от рамки то элементов текст
        distToText: 20
    }


    // Graph object contain a properties about the function itself without any paddings and spases.
    graph = {
        with: 0,
        height: 0,

        ox_marksSpan: 100,
        oy_marksSpan: 100,

        ox_distance: 0,
        normalizationCoef: 1,

        topCord: 0,
        bottomCord: 0,
    }

    dimentions = {
        sizesDashesLengthPx: 8,
        y_of_ox_dimentions: 0,
        x_of_oy_dimentions: 20,
        fontSize: 12,
    }

    ox_combinedSpace = this.plot.ox_margin + this.rect.ox_padding
    oy_combinedSpace = this.plot.oy_margin + this.rect.oy_padding

    constructor(plot_id, x_samples, y_samples, plotRef){
        if (x_samples.length !== y_samples.length){
            throw new Error(`Samples have different length. x: ${x_samples.length}, y: ${y_samples.length}`)
        }

        this.id = plot_id
        this.x_samples = x_samples;
        this.y_samples = y_samples;

        this.y_samples_min = Math.min(...y_samples)
        this.y_samples_max = Math.max(...y_samples)

        this.plotRef = plotRef;

    }

    setGraphicsSizes({ clientWidth, clientHeight}){
        this.plot.clientWidth = clientWidth
        this.plot.clientHeight = clientHeight

        this.graph.with = clientWidth - 2 * this.ox_combinedSpace
        this.graph.height = clientHeight - 2 * this.oy_combinedSpace

        this.dimentions.y_of_ox_dimentions = clientHeight - this.plot.oy_margin + this.rect.distToText

        this.graph.topCord = this.oy_combinedSpace
        this.graph.bottomCord = this.oy_combinedSpace + this.graph.height

    }

    renderPlot(pathFigures, ox_marks){
        return(
            <div className={sass.plotWrap}>
                <svg id={this.id} width="100%" height='100%' ref={this.plotRef}>
                    {pathFigures}
                    {ox_marks}
                </svg>
            </div>
        )
    }
    
    defineOX(){
        // коэффециент отношений положительной ординаты к отрицательной
        const k = this.y_samples_max / this.y_samples_min

        if (k > 0) {
            this.plot.ox_distance = this.graph.height;
            this.graph.ox_distance = this.graph.height - this.oy_combinedSpace
        } else {
            this.plot.ox_distance = this.plot.clientHeight / 2
            this.graph.ox_distance = (this.plot.clientHeight - 2*this.oy_combinedSpace) / 2
        }

        const path = new PathObject()

        path.move( this.ox_combinedSpace, this.plot.ox_distance )
        path.lineRelative( this.graph.with, 0)

        return <path d={path} stroke="red"  strokeWidth="1" />
    }

    offset(val, axis){
        if (axis === 'OX') 
            return val + this.plot.ox_margin  + this.rect.ox_padding
        else if (axis === 'OY')
            return val + this.plot.oy_margin  + this.rect.oy_padding
            throw new Error('Offset didnt recive a valid axis name')
    }

    /*
    If we need sharper values on the axis labels,
    then we must multiply by 10 in some power
    */
    computeMultiplicationStage(e_stage, referenceValue){
        // base non recurtion case
        if (referenceValue >= 1 && referenceValue <= 100) 
            return e_stage

        else if (referenceValue > 100)
            return this.computeMultiplicationStage(e_stage/10, referenceValue/10)
        else if (referenceValue < 1)
            return this.computeMultiplicationStage(e_stage*10,  referenceValue*10)
    }

    drawSizesDashes(){
        const len = this.dimentions.sizesDashesLengthPx   

        const sizesDashesPath = new PathObject()
        sizesDashesPath.move( this.offset(0, 'OX'), this.offset(this.graph.height, 'OY'))
        // --- OX --- 
        const y_coord_of_ox_marks = this.plot.clientHeight - this.plot.oy_margin + this.rect.distToText

        for (var cur_x_cord = 0; cur_x_cord <= this.graph.with; cur_x_cord += this.graph.ox_marksSpan){
            const x  = this.offset(cur_x_cord, 'OX')
            sizesDashesPath.move(x, y_coord_of_ox_marks - this.rect.distToText)
            sizesDashesPath.lineRelative(0 , len)        
        } 

        // --- OY --- 
        const x = this.plot.ox_margin 

        // Sers zero mark
        sizesDashesPath.move(x, this.plot.ox_distance)
        sizesDashesPath.lineRelative(-len , 0)   

        // upper half-plane
        for (var y = this.plot.ox_distance; y > this.oy_combinedSpace; y -= this.graph.oy_marksSpan){
            sizesDashesPath.move(x, y)
            sizesDashesPath.lineRelative(-len , 0)        
        }

        // lower half-plane
        // eslint-disable-next-line no-redeclare
        for (var y = this.plot.ox_distance; y < this.offset( this.graph.height ,'OY'); y += this.graph.oy_marksSpan){
            sizesDashesPath.move(x, y)
            sizesDashesPath.lineRelative(-len , 0)        
        }

        this.PATH_STORAGE.push( <path d={sizesDashesPath} stroke="black"  strokeWidth="1" />)
    }

    arrangeOXvalues(){
        const result = []
        const latest_x = this.x_samples[this.x_samples.length-1]
        const marks_per_px = latest_x / this.graph.with


        const referenceValue = this.x_samples[this.x_samples.length-1]
        const mul_stage = this.computeMultiplicationStage(1, referenceValue)

        for (var cur_x_cord = 0; cur_x_cord <= this.graph.with; cur_x_cord += this.graph.ox_marksSpan){

            const val = (marks_per_px * cur_x_cord * mul_stage).toFixed(1)
            const x  = this.offset(cur_x_cord, 'OX')

            const halfWidthMark = val.toString().replace('.', '').length * 8 / 2
            
            const textMark = <text x={x-halfWidthMark} y={this.dimentions.y_of_ox_dimentions} key={cur_x_cord} >{val}</text>
            result.push(textMark)
        } 

        // Draw the coefficient of dimentional measurements
       
        if (mul_stage !== 1){
            const e_stage = (Math.log(mul_stage) / Math.log(10)).toFixed(0);
            result.push(<text x={this.graph.with+this.ox_combinedSpace} y={this.dimentions.y_of_ox_dimentions}>10e{e_stage}</text> )
        }
    
        return result
    }

    // First, the coordinates of the upper half-plane, includeng zero, are rendered.
    // After that, we draw the coordinates of the lower half-plane
    arrangeOYvalues(){
        const result = []

        const x = this.dimentions.x_of_oy_dimentions

        // Коэффициент домножения значения точки y (относительно оси OX кстати)
        const absAmplitudes = this.y_samples.map(each => Math.abs(each))
        const marks_per_px = Math.max(...absAmplitudes) / this.graph.ox_distance

        const referenceValue = Math.max( ...absAmplitudes )
        // console.log(this.y_samples / this.graph.normalizationCoef);
        const mul_stage = this.computeMultiplicationStage(1, referenceValue)
        console.log(mul_stage);

       // upper half-plane
        for (var y = this.plot.ox_distance; y > this.graph.topCord; y -= this.graph.oy_marksSpan){
            const val = ( this.getYrelativeOX(y) * marks_per_px / this.graph.normalizationCoef * mul_stage).toFixed(1)
            const textMark = <text x={x} y={y + this.dimentions.fontSize/2} key={`OY_Mark_${y}`} > {val}</text>
            result.push(textMark)
        }

        // lower half-plane
        for (var y = this.plot.ox_distance + this.graph.oy_marksSpan; y < this.graph.bottomCord; y += this.graph.oy_marksSpan){
            const val = ( this.getYrelativeOX(y) * marks_per_px / this.graph.normalizationCoef * mul_stage).toFixed(1)
            const textMark = <text x={x} y={y + this.dimentions.fontSize/2} key={`OY_Mark_${y}`} > {val}</text>
            result.push(textMark)
        }


        if (mul_stage !== 1){
            const e_stage = (Math.log(mul_stage) / Math.log(10)).toFixed(0);
            result.push(<text x={x} y={this.plot.oy_margin}>10e{e_stage}</text> )
        }

        return result
    }

    getYrelativeOX(y){
        return this.plot.ox_distance - y
    }

    changeCoordinateSystem(){
        // переходим от отсчета от верхнего края оберки графика к отсчету отностительно оси ОX     
        this.y_chords = this.y_samples.map(each => this.plot.ox_distance - each)
    }
    
    normalyzeAmplitude(){
        // Коэффициент нормализации растягивает или уменьшает график таким образом чтобы она занимал по вертикали
        // все доступное пространство
        const absAmplitudes = this.y_samples.map(each => Math.abs(each))
        const normalizationCoef = this.graph.ox_distance / Math.max(...absAmplitudes)
        this.graph.normalizationCoef = normalizationCoef
        this.y_samples = this.y_samples.map(each => each * normalizationCoef)
    }

    /* 
    This method creates a black border around graph
    On the lines of the frame will stay a coordinate marks
    That means that this border have outher margins (outherOX/OYPadding property)
    Also this have a inner space between the frame and maximum amplitused
    */
    drawRectBoundary(){
        const boundaryPath = new PathObject()
        boundaryPath.path_d = [`M ${this.plot.ox_margin} ${this.plot.oy_margin},
                                h ${this.plot.clientWidth - 2*this.plot.ox_margin},
                                v ${this.plot.clientHeight - 2*this.plot.oy_margin},
                                h -${this.plot.clientWidth - 2*this.plot.ox_margin}, 
                                v -${this.plot.clientHeight - 2*this.plot.oy_margin}`
                            ]
        return <path d={boundaryPath} stroke={this.rect.borderColor} fill="transparent" strokeWidth={this.rect.strokeWidth} />
    }

    computePathObject(){
        // Initialing
        const { clientWidth, clientHeight } = this.plotRef?.current
        this.setGraphicsSizes({clientWidth, clientHeight})


        this.PATH_STORAGE.push(  this.drawRectBoundary() )

        let plotPath = new PathObject()
        
        // The distance between two x samples.
        const OXdomain = this.graph.with
        const delta_x = OXdomain / Math.max(...this.x_samples)

        // Sets an offet for x coorfitane to keep up a padding into canvas
        this.x_chords = this.x_samples.map(each => {
            return this.offset(delta_x * each, 'OX')
        });

        this.PATH_STORAGE.push( this.defineOX() )


        const ox_marks = this.arrangeOXvalues()
        const oy_marks = this.arrangeOYvalues()

    

        this.normalyzeAmplitude()
        this.changeCoordinateSystem()
       
        // // Sets a pen into starts of coordinate axis
        plotPath.move(this.x_chords[0], this.y_chords[0])
        // Drawing line by points
        this.x_chords.forEach( (val, idx) => {
            plotPath.line( this.x_chords[idx], this.y_chords[idx]  )
        })

        this.drawSizesDashes()


        this.PATH_STORAGE.push(<path d={plotPath} stroke="blue"  strokeWidth="1.5" />)


        return { pathStorage: this.PATH_STORAGE, ox_marks, oy_marks }
    }


}

const InitialSignalPlot = props => {
    var y_points = [5, 7, 10, 20, 0, 0 , 0, 0, -40, -150, -80]
    const x_points = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    // const p = Array.from(y_points).map(each => Math.abs(each))

    const [pathObjects , setPathObjects] = useState([])
    const [oxMarks, setOxMarks] = useState()

    

    const plotRef = useRef(null)

    const plot = new AbsPlot('curve1', x_points.map(each => each * 1), y_points.map(each => each / 100000), plotRef)

    useEffect(() => {
        const {pathStorage , ox_marks, oy_marks} = plot.computePathObject()    
        setPathObjects(pathStorage)
        setOxMarks( ox_marks.concat(oy_marks) )
    }, [])


    const time_domain = plot.renderPlot(pathObjects, oxMarks)

    return (
        <>
           {time_domain}
        </>
    )
}

export default InitialSignalPlot