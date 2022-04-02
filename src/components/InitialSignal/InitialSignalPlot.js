/* eslint-disable no-unreachable */
import sass from './styles.module.sass'
import React, { useRef, useEffect, useState } from 'react'

import Rect from './Rect'
import PathObject from './PathObject'

class AbsPlot extends Rect{
    graphStrokeColor = 'blue'
    graphstrokeWidth = '2'

    ox_margin = 60
    oy_margin = 60
    ox_padding = 30
    oy_padding = 30

    ox_marksCount = 5
    oy_marksCount = 4

    id = undefined
    plotRef = undefined
    x_samples = undefined
    y_samples = undefined
    // Коэф. нормализации показывакт во сколько раз нужно увеличить каждую y координату, 
    // чтобы график занимал всю отведенную для него высоту
    normalizationCoef = undefined
    dimentions = {
        sizesDashesLengthPx: 8,
        fontSize: 12,
        offset_ox: 20,
    }

    constructor(plotRef, x_samples, y_samples, {
        plot_id,
        graphStrokeColor,
        graphstrokeWidth
        }){

        if (x_samples.length !== y_samples.length){
            throw new Error(`Samples have different length. x: ${x_samples.length}, y: ${y_samples.length}`)
        }

        super(plotRef)
        this.x_samples = x_samples;
        this.y_samples = y_samples;
        this.plotRef = plotRef;

        if (plot_id)
            this.id = plot_id
        if (graphStrokeColor)
            this.graphStrokeColor = graphStrokeColor
        if (graphstrokeWidth)
            this.graphstrokeWidth = graphstrokeWidth
    }

    getLatest(array){
        return array[array.length-1]
    }

    getYrelativeOX(y){
        return this.ox_distance - y
    }

    /*
    If we need sharper values on the axis labels,
    then we must multiply by 10 in some power
    */
    computeMultiplicationStage(e_stage, referenceValue){
        // base non recurtion case
        if (referenceValue >= 1 && referenceValue <= 10) 
            return e_stage

        else if (referenceValue > 10)
            return this.computeMultiplicationStage(e_stage/10, referenceValue/10)
        else if (referenceValue < 1)
            return this.computeMultiplicationStage(e_stage*10,  referenceValue*10)
    }

  
    _arrangeOXvalues(){
        const rect = this.rect
        const graph = this.graph
        const pS = this.pathStorage

        const y_level = this.rect.bottom + this.dimentions.offset_ox
        const latest_x = this.getLatest(this.x_samples)

        const value_per_px = latest_x / graph.width

        const referenceValue = this.x_samples[this.x_samples.length-1]
        const mul_stage = this.computeMultiplicationStage(1, referenceValue)

        rect.x_dashes.forEach( xCoord => {
            const val = (value_per_px * (xCoord - graph.left) * mul_stage).toFixed(1)

            const textWidth = val.toString().replace('.', '').length * this.dimentions.fontSize / 2
            const x  = xCoord - textWidth / 2
            
            const attributes = {
                x: x,
                y: y_level,
                key: `ox-mark-${xCoord}`,
            }
            
            pS.push( <text {...attributes}> {val} </text> )
        })

        // Draw the coefficient of dimentional measurements
        if (mul_stage !== 1){
            const e_stage = (Math.log(mul_stage) / Math.log(10)).toFixed(0);

            const attributes = {
                x: rect.right + 10,
                y: y_level,
                key: 'ox-mul-stage',
            }

            pS.push( <text {...attributes}> 10e{-e_stage} </text> )
        }
    
    }

    // First, the coordinates of the upper half-plane, includeng zero, are rendered.
    // After that, we draw the coordinates of the lower half-plane
    _arrangeOYvalues(){
        const pS = this.pathStorage

        const x = this.dimentions.offset_ox

        // Коэффициент домножения значения точки y (относительно оси OX кстати)
        const absAmplitudes = this.y_samples.map(each => Math.abs(each))
        const value_per_px = Math.max(...absAmplitudes) / (this.ox_distance - this.graph.top)


        const referenceValue = Math.max( ...absAmplitudes )
        const mul_stage = this.computeMultiplicationStage(1, referenceValue)

        this.rect.y_dashes.forEach( yCoord => {
           
            // realat_y - это реально координата отметки, но нее ее значение
            const realat_y = this.getYrelativeOX(yCoord)
            const val = ( value_per_px * (realat_y) * mul_stage ).toFixed(1)

            // TODO: откалибровать нормально позиционирование размеров
            const attributes = {
                x: x,
                y: yCoord + this.dimentions.fontSize / 3 ,
                key: `OY_Mark_${yCoord}`
            }

            pS.push( <text {...attributes} > {val} </text> )
        })


        if (mul_stage !== 1){
            const e_stage = (Math.log(mul_stage) / Math.log(10)).toFixed(0);
            const attributes = {
                x: x,
                y: this.dimentions.fontSize,
                key: 'oy-mul-stage'
            }
            pS.push(<text {...attributes}>10e{-e_stage}</text> )
        }
    }

    /*
    Коэффициент нормализации растягивает или уменьшает график таким образом чтобы она занимал по вертикали
    все доступное пространство
    */
    _setNormalizationCoef(){
        if (!this.ox_distance)
            throw new Error('Cannot set a normalization coefficient because OX axis didnt established')

        const absAmplitudes = this.y_samples.map(y => Math.abs(y))
        this.normalizationCoef = (this.ox_distance - this.graph.top) / Math.max(...absAmplitudes)
    }

    _drawGraphic(){
        let plotPath = new PathObject()
        const delta_x = this.graph.width / Math.max(...this.x_samples)

        // Нормализованные отсчеты y
        const norm_y_samples = this.y_samples.map( y => y*this.normalizationCoef)

        const x_chords = this.x_samples.map(x => {
            return (delta_x * x) + this.graph.left
        });

        plotPath.move(x_chords[0], this.getYrelativeOX(norm_y_samples[0]) )

        x_chords.forEach( (val, idx) => {
            plotPath.line( x_chords[idx], this.getYrelativeOX(norm_y_samples[idx])  )
        })

        const attributes = {
            d: plotPath, 
            stroke: this.graphStrokeColor,
            strokeWidth: this.graphstrokeWidth,
            key: 'graphics'
        }

        this.pathStorage.push(<path {...attributes}/>)
    }

    render(){
        this._initDimentions()
      
        this._setOxDistance()
        // this._drawOXaxis()

        this._setNormalizationCoef()

        this._drawRectBoundary()
        this._drawSizesDashes()

        this._arrangeOXvalues()
        this._arrangeOYvalues()

        this._drawGraphic()
    }

    getSvgElement(pathStorage){
        return(
            <div className={sass.plotWrap}>
                <svg id={this.id} width="100%" height='100%' ref={this.plotRef}>
                    {pathStorage}
                </svg>
            </div>
        )
    }

}

const InitialSignalPlot = props => {
    const plotRef = useRef(null)    
    const plot = new AbsPlot(plotRef, props.x_points, props.y_points, { id: 1})

    const [pathStorage, setPathStorage] = useState(plot.PathObject)

    useEffect(() => {
        plot.render()
        setPathStorage(plot.pathStorage)
    }, [])
    
    return (
        <>
           {plot.getSvgElement(pathStorage)}
        </>
    )
}

export default InitialSignalPlot