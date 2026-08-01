import { motion } from 'framer-motion';
import LabelSelector from "./Label Selector.tsx";
import React from "react";
import EEGlobal from "../../util/Event Emitter.ts";


type Label = {
    name?: string;
    type?:string;
}



const DocumentCreator = (
    { enabled }:{ enabled: boolean }
) => {

    const [labelSelectorUI, setLabelSelectorUI] = React.useState<{labelIndex:number}|undefined>(undefined)
    const [labels, setLabels] = React.useState<Label[]>(Array.from({ length:6 }));


    React.useEffect(() => {

        const onSetLabel = ({index, value}:{index:number, value:Label}) => {
            setLabels(p => {p[index] = value; return p});
        }
        const onToggleLabelSelectorUI = ({ toggle, labelIndex }:{ toggle:boolean, labelIndex:number }) => {
            toggle?setLabelSelectorUI({labelIndex}):setLabelSelectorUI(undefined);
        }

        EEGlobal.addListener("setLabel", onSetLabel);
        EEGlobal.addListener("toggleLabelSelectorUI", onToggleLabelSelectorUI);
        return () => {
            EEGlobal.removeListener("setLabel", onSetLabel);
            EEGlobal.removeListener("toggleLabelSelectorUI", onToggleLabelSelectorUI);
        }
    }, [])



    return (
        <motion.div

            animate={{ opacity:enabled?1:0 }}
            style={{
                pointerEvents:enabled?"auto":'none'
            }}

            className={"w-screen h-screen absolute left-0 top-0 z-100 bg-[#020202] overflow-hidden"}
        >

            <LabelSelector
                enabled={!!labelSelectorUI}
                {...labelSelectorUI}
            />


            <div
                className={"w-full h-full flex items-center justify-center"}
            >
                <div
                    className={"w-full h-[90%] max-h-[1000px] items-center justify-center gap-[20px] flex flex-col"}
                >
                    <div
                        className={"flex-1 flex items-center gap-[20px]"}
                    >

                        {Array.from({length: 3}).map((_, i) => (
                            <LabelItem key={i} label={labels[i]} index={i} />
                        ))}

                    </div>

                    <div
                        className={"flex-1 flex items-center gap-[20px]"}
                    >

                        {Array.from({length: 3}).map((_, i) => (
                            <LabelItem key={i} label={labels[i+3]} index={i+3}/>
                        ))}

                    </div>
                </div>
            </div>

        </motion.div>
    )
}


const LabelItem = (
    { label, index }:{ label: Label, index:number }
) => {


    return (
        <motion.div

            whileHover={{ scale:1.05 }}

            className={"h-full aspect-[283/371] bg-[#0C0C0C] rounded-[20px] cursor-pointer select-none overflow-hidden relative"}
            onClick={() => EEGlobal.emit("toggleLabelSelectorUI", {toggle:true, labelIndex:index})}
        >


            <div
                className={"flex items-center justify-center w-full gap-[10px] p-[20px_0_0_0]"}
            >

                <img
                    className={"w-[20px]"}
                    src={'/assets/plus-circ.png'}
                />

                <p
                    className={"text-[1.2em]"}
                >Add Label</p>

            </div>

            <motion.div

                initial={{scale: 0, y:"100%", x:'-50%' }}
                animate={{ scale:label?1:0, y:label?"0%":"100%", x:'-50%' }}
                transition={{ duration:0.3 }}

                className={"h-full aspect-[283/371] absolute left-[50%] bottom-0 translate"}
            >
                <LabelMock label={label} />
            </motion.div>



        </motion.div>
    )
}



const LabelMock = (
    { label }:{ label:Label }
) => {


    return (
        <div
            className={"w-full h-full bg-white relative p-[10px] rounded-[20px]"}
        >

            <img
                className={"h-full w-full absolute left-0 top-0 rounded-[20px]"}
                src={'/assets/label/bg.png'}
            />

            <div
                className={"w-full h-full flex flex-col bg-white z-10 relative rounded-[20px]"}
            >

                <div
                    className={"p-[15px_0] justify-center items-center flex border-b-solid w-full border-b-[2px] border-b-[#000]"}
                >

                    <p
                        className={"text-[#000] font-bold text-[1.2em]"}
                    >Lock Out Tag Out Procedures</p>

                </div>


                <div
                    className={"flex flex-1 flex-col justify-evenly items-center w-full"}
                >

                    <img
                        className={"w-[250px]"}
                        src={'/assets/label/rick.png'}
                    />

                    <div
                        className={"flex items-center justify-center flex-col"}
                    >

                        <p
                            className={"text-[1.2em] text-[#4F81BD] font-bold"}
                        >{label?.name}</p>
                        <p
                            className={"text-[0.9em] text-[#000]"}
                        >{label?.type}</p>

                    </div>

                </div>


            </div>

        </div>

    )
}


export default DocumentCreator;