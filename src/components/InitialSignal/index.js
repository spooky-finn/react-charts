import InitialSignalPlot from "./InitialSignalPlot"

const InitialSignal = props => {

    var y_points = [0, 10, -10, 0, 0, 0 , 100, -100, -40, -100, 100]
    const x_points = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

    return(
        <InitialSignalPlot x_points={x_points.map(x => x)} y_points={y_points.map(y => y)} />
    )
}
export default InitialSignal