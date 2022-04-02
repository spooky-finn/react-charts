export default class PathObject {
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
