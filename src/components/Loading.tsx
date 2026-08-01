import { Ring } from 'ldrs/react'
import 'ldrs/react/Ring.css'



const Loading = (
    { size=20, stroke=3, speed=2, color="white" }:{ size?:number, stroke?:number, speed?:number, color?:string }
) => {

    return (
        <Ring
            {...{size, stroke, speed, color}}
        />
    )
}


export default  Loading