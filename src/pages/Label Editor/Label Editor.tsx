


import {AnimatePresence, motion} from "framer-motion";
import EEGlobal from "../../util/Event Emitter.ts";
import VLabels, {Label} from '../../values/labels.ts'
import React from "react";
import {Store} from "@tauri-apps/plugin-store";



const LabelEditor = (
    {  }:{  }
) => {
    const labels = VLabels(s=>s.labels)
    const addLabel = VLabels(s=>s.addLabel)

    const [searchInput, setSearchInput] = React.useState<string>("")

    const filteredLabels = searchInput.length>0?labels.filter(l=>l.name.toLowerCase().includes(searchInput.toLowerCase())):labels;


    return (
        <motion.div

            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}



            className="w-screen h-screen absolute left-0 top-0 z-[200] flex items-center justify-center  "
        >
            <motion.div

                initial={{ y:100}}
                animate={{y: 0}}
                exit={{y: -100}}

                // radius={30}
                // color={"black"}
                // chromaticAberration={2}
                // strength={100}
                // depth={10}
                // blur={2}
                className="max-h-[95%] aspect-[0.9] p-[30px_30px] bg-[#000]/25 relative backdrop-blur-[15px] rounded-[30px] border-solid border-[1px] border-[#5C5C5C]"
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
                            onClick={async () => {
                                EEGlobal.emit("toggleLabelEditorUI", false)

                                const store = await Store.load("labels.json")
                                await store.set("labels", labels)
                                await store.save()
                            }}
                        />

                    </div>

                    {/*Search Bar*/}
                    <div
                        className={"w-full h-[45px] bg-[#060606] border-solid border-[1px] border-[#6E6E6E] rounded-[100px] m-[30px_0_0_0] flex items-center gap-[20px] px-[20px]"}
                    >


                        <img
                            className={"w-[20px]"}
                            src={'/assets/search.png'}
                        />

                        <input
                            type={'text'}
                            className={"flex-1 text-white outline-none placeholder:italic"}
                            placeholder={'Search by name'}
                            onChange={e=>setSearchInput(e.target.value)}
                            value={searchInput}
                        />

                        <motion.img
                            initial={{scale:0}}
                            animate={{ scale:searchInput.length>0?1:0 }}
                            exit={{scale:1}}
                            className={"w-[10px] cursor-pointer"}
                            src={'/assets/x.png'}
                            onClick={()=>setSearchInput("")}
                        />

                    </div>

                    <div
                        className={"flex items-center justify-center w-full gap-[10px] mt-[10px] cursor-pointer"}
                        onClick={() => {
                            addLabel({ name:"Name", type:"Type", url:"URL", id:String(Math.random()) })
                        }}
                    >




                        <img
                            className={"w-[20px]"}
                            src={'/assets/plus-circ.png'}
                        />

                        <p
                            className={"text-[1em]"}
                        >Add Label</p>

                    </div>

                </div>


                <div
                    className={"flex-1 h-full flex flex-col gap-[10px] overflow-auto p-[20px_0] [content-visibility:auto]"}
                >
                    <AnimatePresence initial={false} mode="popLayout">
                        {filteredLabels.map((label, i) => (
                            <motion.div
                                key={label.id}
                                layout
                                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                            >
                                <LabelItem label={label} lastItem={!(i<(100-2))} />
                            </motion.div>

                        ))}
                    </AnimatePresence>
                </div>


            </motion.div>
        </motion.div>
    );
}



const LabelItem = (
    { label, lastItem }:{ label:Label, lastItem:boolean }
) => {
    const setLabel = VLabels(s=>s.setLabel)
    const deleteLabel = VLabels(s=>s.deleteLabel)


    return (
        <>

            <div
                className={"w-full flex items-center justify-between select-none [contain-intrinsic-size]"}

            >

                <div className={"flex-1"}>

                    <input
                        className={`font-bold text-[1.2em] outline-none bg-transparent border-none p-0 w-full`}
                        value={label.name}
                        onChange={e => setLabel({...label, name: e.target.value})}
                    />


                    <input
                        className={`text-[1em] outline-none bg-transparent border-none p-0 w-full`}
                        value={label.type}
                        onChange={e => setLabel({...label, type: e.target.value})}
                    />


                    <input
                        className={`text-[1em] outline-none bg-transparent border-none p-0 w-full  mt-[30px]`}
                        value={label.url}
                        onChange={e => setLabel({...label, url: e.target.value})}
                    />


                </div>

                <motion.img

                    whileHover={{ scale:1.1 }}

                    className={"w-[15px] cursor-pointer"}
                    src={'/assets/delete.png'}

                    onClick={() => {
                        deleteLabel(label)
                    }}
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


export default LabelEditor