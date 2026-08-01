import React, {lazy} from 'react'
import {AnimatePresence, motion, useAnimationControls} from "framer-motion";
import EEGlobal from "./util/Event Emitter.ts";
import VLabels, { Label } from "./values/labels.ts";
import { Store } from '@tauri-apps/plugin-store'


const LabelSelector = lazy(() => import("./pages/Label Selector/Label Selector.tsx"));
const LabelEditor = lazy(() => import("./pages/Label Editor/Label Editor.tsx"));






const App = () => {
    const [labelSelectorUI, setLabelSelectorUI] = React.useState<boolean>(false)
    const [labelEditorUI, setLabelEditorUI] = React.useState<boolean>(false)

    const labels = VLabels(s=>s.labels)
    const setLabels = VLabels(s=>s.setLabels)


    const documentCreatorButtonAnimationController = useAnimationControls()


    React.useEffect(() => {

        const onToggleLabelSelectorUI = (toggle:boolean) => {
            setLabelSelectorUI(toggle);
            documentCreatorButtonAnimationController.set({ y:400, x:"-50%" })
        }

        const onToggleLabelEditorUI = (toggle:boolean) => {
            setLabelEditorUI(toggle);
        }


        EEGlobal.addListener("toggleLabelSelectorUI", onToggleLabelSelectorUI)
        EEGlobal.addListener("toggleLabelEditorUI", onToggleLabelEditorUI)
        return () => {
            EEGlobal.removeListener("toggleLabelSelectorUI", onToggleLabelSelectorUI)
            EEGlobal.removeListener("toggleLabelEditorUI", onToggleLabelEditorUI)
        }
    }, [])


    React.useEffect(() => {
        (async () => {
            const store = await Store.load("labels.json")
            const labels = await store.get<Label[]>("labels")
            labels&&setLabels(labels)
        })()
    }, [])


    return (
        <div
            className="bg-[#020202] w-screen h-screen flex flex-col items-center justify-center text-white overflow-hidden"
        >

            <AnimatePresence>
                {labelSelectorUI && (<LabelSelector />)}
            </AnimatePresence>

            <AnimatePresence>
                {labelEditorUI && (<LabelEditor />)}
            </AnimatePresence>


            <div

                className="h-full flex-col flex w-full max-w-[1000px] items-center overflow-hidden relative"
            >

                {/*Header*/}

                <div
                    className={"flex flex-col w-full pt-[20px] pb-[100px] "}
                >

                    <p
                        className="text-[3em] font-bold"
                    >
                        Lockout Tag Out
                    </p>


                    <p
                        className="text-[1.2em] translate-y-[-10px]"
                    >
                        Procedure Label Builder
                    </p>


                </div>


                {/*Label Widget*/}
                <div
                    className={`bg-linear-to-b from-[#014B7E33] to-[#01304E33] w-full border-[#014B7E] border-[1px] border-solid rounded-[20px] flex p-[15px_20px] max-w-[1000px] relative gap-[10px] `}
                >

                    <div
                        className={"flex flex-col flex-1 justify-between"}
                    >

                        <div>


                            <p
                                className={"font-bold text-[1.5em]"}
                            >Labels</p>


                            <p
                                className={"text-[1em]"}
                            >{labels.length}</p>


                        </div>

                        <div
                            className={"flex justify-center align-center bg-[#FFFFFF] border-solid border-[1px] border-[#81B3FF] w-full rounded-[10px] w-full max-w-[400px] cursor-pointer"}
                            onClick={()=>EEGlobal.emit("toggleLabelEditorUI", true)}
                        >
                            <p
                                className={"text-[#2CA0FF] text-[1.5em] font-bold"}
                            >Edit</p>
                        </div>


                    </div>

                    <div
                        style={{
                            width:`${100*0.5*4+100}px`, height:100/(167/223)
                        }}
                        className={`flex gap-[20px]`}
                    >

                        {Array.from({ length:5 }).map((_, i) => (
                            <img
                                key={i}
                                className={`w-[100px] object-cover absolute right-5 rounded-[5px]`}
                                style={{ transform: `translateX(-${i * 50}%)`, zIndex: 5-i }}
                                src={'/assets/temp/label.png'}
                            />
                        ))}


                    </div>

                </div>



                {/*Document Creator*/}
                <motion.div
                    initial={{ y:400, x:"-50%" }}
                    onHoverStart={() => documentCreatorButtonAnimationController.start({ y:300, x:"-50%" })}
                    onHoverEnd={() => !labelSelectorUI&&documentCreatorButtonAnimationController.start({ y:400, x:'-50%' })}
                    animate={documentCreatorButtonAnimationController}


                    className={"absolute bottom-[0px] left-[50%] w-[500px] h-[500px] bg-[#FDFDFD] rounded-[10px_10px_0_0] cursor-pointer p-[10px_15px]"}
                    onClick={() => {
                        setLabelSelectorUI(true);
                        documentCreatorButtonAnimationController.start({ y:-1000, x:'-50%' })
                    }}
                >


                    <div
                        className={"flex justify-between items-center"}
                    >

                        <p
                            className={"text-[1.2em] text-black"}
                        >Create document</p>

                        <img
                            className={"w-[20px]"}
                            src={'/assets/plus-circ-blk.png'}
                        />
                    </div>


                </motion.div>


            </div>




        </div>
    )
}


export default App