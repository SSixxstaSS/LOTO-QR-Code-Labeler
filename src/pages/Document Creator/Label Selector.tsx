import LiquidGlass from "../../components/LiquidGlass.tsx";


import {motion} from "framer-motion";
import EEGlobal from "../../util/Event Emitter.ts";


const LabelSelector = (
    { labelIndex, enabled }:{ labelIndex?:number, enabled:boolean }
) => {



    return (
        <motion.div

            animate={{ y:enabled?"0%":"100%" }}
            transition={{ duration:0.2 }}
            exit={{ y:"100%" }}

            style={{
                pointerEvents: enabled?"auto":'none',
            }}
            className="w-screen h-screen absolute left-0 top-0 z-[200] flex items-center justify-center "
        >
            <LiquidGlass
                radius={30}
                color={"black"}
                chromaticAberration={2}
                strength={100}
                depth={10}
                blur={2}
                className="max-h-[95%] aspect-[0.9] p-[30px_30px]"
                style={{
                    width:"clamp(0px, 95%, 700px)",
                }}
            >

                {/*Header*/}
                <div
                    className={"w-full"}
                >

                    <div
                        className={"w-full flex items-center justify-between"}
                    >

                        <p
                            className={"font-bold text-[1.5em]"}
                        >Labels</p>

                        <img
                            className={"w-[15px] cursor-pointer"}
                            src={'/assets/x.png'}
                            onClick={() => EEGlobal.emit("toggleLabelEditorUI", {toggle:false})}
                        />

                    </div>


                    <LiquidGlass
                        radius={100}
                        chromaticAberration={2}
                        strength={100}
                        depth={10}
                        blur={2}

                        className="w-full h-[50px] mt-[10px]"
                    >

                        <div
                            className={"w-full h-full flex items-center p-[0_15px] gap-[10px]"}
                        >

                            <img
                                className={"w-[20px]"}
                                src={'/assets/search.png'}
                            />

                            <input
                                className={"flex-1 h-full outline-none"}
                                placeholder="Search equipment names"
                            />

                        </div>
                    </LiquidGlass>


                </div>


                <div
                    className={"flex-1 h-full flex flex-col gap-[10px] overflow-auto p-[20px_0] [content-visibility:auto]"}
                >

                    {Array.from({ length:100 }).map((_, i) => (
                        <LabelItem key={i} lastItem={!(i<(100-2))} onClick={() => {
                            EEGlobal.emit("setLabel", {index: labelIndex, value: {name:"awdawdaw", type:"Joe mama"}})
                            EEGlobal.emit("toggleLabelSelectorUI", { toggle:false })
                        }} />
                    ))}


                </div>


            </LiquidGlass>
        </motion.div>
    );
}



const LabelItem = (
    { lastItem, onClick }:{ lastItem:boolean, onClick:()=>void }
) => {



    return (
        <>

            <div
                className={"w-full flex items-center justify-between cursor-pointer select-none [contain-intrinsic-size]"}
                onClick={onClick}
            >

                <div>
                    <p
                        className={"font-bold text-[1.2em]"}
                    >Pump Filler</p>

                    <p
                        className={"text-[1em]"}
                    >Filler</p>
                </div>

                <img
                    className={"w-[15px] rotate-180"}
                    src={'/assets/chevron.png'}
                />

            </div>

            {!lastItem && (
                <div
                    className={"w-full bg-[#EBEBEB] p-[0.5px]"}
                ></div>
            )}

        </>
    )
}


export default LabelSelector