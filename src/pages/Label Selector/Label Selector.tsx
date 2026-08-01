import {AnimatePresence, motion} from "framer-motion";
import React, {lazy} from 'react'

import EEGlobal from "../../util/Event Emitter.ts";
import VLabels from "../../values/labels.ts";


const PrintScreen = lazy(() => import("./Print Screen.tsx"))
const FirstPageSettings = lazy(() => import("./First Page Settings.tsx"))




const LabelSelector = () => {
    const labels = VLabels(s=>s.labels)

    const [searchInput, setSearchInput] = React.useState<string>("");
    const [labelSelectedCounter, setLabelSelectedCounter] = React.useState<{[key:string]:string}>({})
    const [disabledStickers, setDisabledStickers] = React.useState<boolean[]>(Array.from({ length:6 }, () => true))


    const [printUI, setPrintUI] = React.useState<boolean>(false)
    const [firstPageSettingsUI, setFirstPageSettingsUI] = React.useState<boolean>(false)


    let filteredLabels = searchInput.length>0?labels.filter(l=>l.name.toLowerCase().includes(searchInput.toLowerCase())):labels; // Filter labels by search
    filteredLabels = filteredLabels.filter(l=>!(l.name==="Name"||l.type==="Type"||l.url==="URL")) // Filter default input labels


    // UI Toggles
    React.useEffect(() => {

        const onTogglePrintUI = (toggle:boolean) => {
            setPrintUI(toggle)
        }

        const onToggleFirstPageSettingsUI = (toggle:boolean) => {
            setFirstPageSettingsUI(toggle)
        }


        EEGlobal.addListener("togglePrintUI", onTogglePrintUI)
        EEGlobal.addListener("toggleFirstPageSettingsUI", onToggleFirstPageSettingsUI)
        return () => {
            EEGlobal.removeListener("togglePrintUI", onTogglePrintUI)
            EEGlobal.removeListener("toggleFirstPageSettingsUI", onToggleFirstPageSettingsUI)
        }
    }, [])


    // Variable Toggles
    React.useEffect(() => {

        const onToggleDisabledSticker = (stickerIndex:number) => {
            setDisabledStickers(p => p.map((v, n) => n === stickerIndex ? !v : v));
        }

        EEGlobal.addListener("toggleDisabledSticker", onToggleDisabledSticker)
        return () => {
            EEGlobal.removeListener("toggleDisabledSticker", onToggleDisabledSticker)
        }
    }, [])


    const selectedLabels = labels.filter(l => labelSelectedCounter[l.name]!==undefined&&parseInt(labelSelectedCounter[l.name])>0).map(l=>({...l, count:parseInt(labelSelectedCounter[l.name])}))
    const numOfActiveStickers = disabledStickers.filter(s=>s).length


    return (
        <motion.div

            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}

            className={"w-screen h-screen bg-[#020202] absolute left-0 top-0 z-100 flex items-center justify-center overflow-hidden z-100"}
        >

            <AnimatePresence>
                {printUI&&(<PrintScreen selectedLabels={selectedLabels} disabledStickers={disabledStickers}/>)}
            </AnimatePresence>

            <AnimatePresence>
                {firstPageSettingsUI&&(<FirstPageSettings disabledStickers={disabledStickers} />)}
            </AnimatePresence>



            <motion.div


                initial={{ y:100 }}
                animate={{ y:0 }}
                exit={{ y:-100 }}

                className={"h-full w-full max-w-[1000px] p-[50px_30px] pb-0 flex flex-col items-start overflow-x-visible"}
            >

                <div
                    className={"flex justify-between items-center w-full"}
                >

                    <p
                        className={"text-[2em] font-bold"}
                    >Select Label</p>

                    <div
                        className={"flex gap-[20px]"}
                    >
                        <motion.img

                            whileTap={{scale: 0.9}}
                            whileHover={{scale: 1.1}}

                            className={"w-[20px] cursor-pointer"}
                            src={'/assets/printer.png'}
                            onClick={() => EEGlobal.emit("togglePrintUI", true)}
                        />

                        <motion.img

                            whileTap={{scale: 0.9}}
                            whileHover={{scale: 1.1}}

                            className={"w-[15px] h-[15px] cursor-pointer"}
                            src={'/assets/x.png'}
                            onClick={() => EEGlobal.emit("toggleLabelSelectorUI", false)}
                        />

                    </div>

                </div>

                {/*First Page Editor BTN*/}
                <div
                    className={"p-[5px_10px] bg-[#161616] border-[#3F3F3F] border-solid border-[1px] flex gap-[10px] rounded-[100px] items-center select-none cursor-pointer"}
                    onClick={() => EEGlobal.emit("toggleFirstPageSettingsUI", true)}
                >

                    <p
                        className={"text-[0.9em]"}
                    >{numOfActiveStickers} slots available on first page</p>

                    <div
                        className={"w-[2px] h-[20px] bg-[#828282] rounded-[10px]"}
                    />

                    <img

                        className={"h-[20px]"}
                        src={'/assets/document settings.png'}
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



                {/*Label List*/}
                <div
                    className={"flex-1 overflow-y-auto overflow-x-visible w-full pt-[20px] flex flex-col gap-[10px] pb-[50px] px-[20px]"}
                >

                    <AnimatePresence initial={false} mode="popLayout">
                        {filteredLabels.map((label) => (
                            <motion.div
                                key={label.name}
                                layout
                                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                            >
                                <LabelItem label={label} value={labelSelectedCounter[label.name]} setValue={(val:string)=>setLabelSelectedCounter(p=>({...p, [label.name]:String(Math.min(Math.max(Number(val), 0), 10))}))} />
                            </motion.div>
                        ))}
                    </AnimatePresence>



                </div>

            </motion.div>
        </motion.div>
    )
}



const LabelItem = (
    {label, value, setValue}: { label: { name: string, type: string }, value: string, setValue: (v: string) => void }
) => {

    let normalizedVal = value ? Number(value) : 0
    if (isNaN(normalizedVal)) normalizedVal = 0


    return (
        <div
            className={"w-full bg-[#060606] border-[1px] border-solid border-[#3C3C3C] rounded-[10px] flex items-center p-[10px_15px] select-none relative"}
        >


            <div
                className={"flex gap-[10px] items-center flex-1 flex-shrink-1"}
            >
                <p
                    className={"text-[1.1em] font-bold"}
                >{label.name}</p>

                <div
                    className={"rounded-[100px] bg-white w-[3px] aspect-[1]"}
                />

                <p
                    className={"text-[0.9em] italic"}
                >{label.type}</p>

            </div>


            <div
                className={"flex gap-[10px] items-center"}
            >

                <motion.div


                    whileHover={"whileHover"}
                    whileTap={"whileTap"}

                    className={"w-[10px] ] cursor-pointer"}
                    onClick={() => setValue(String(normalizedVal + 1))}
                >
                    <motion.img

                        variants={{
                            whileTap: {x: -10},
                            whileHover: {x: -5}
                        }}

                        className={"w-[10px] rotate-[90deg]"}
                        src={'/assets/chevron.png'}

                    />

                </motion.div>


                <input
                    type="text"
                    inputMode="numeric"
                    className="w-[30px] aspect-square bg-[#2B2B2B] rounded-[10px] text-center outline-none"
                    value={normalizedVal}
                    onChange={e => {
                        const raw = e.target.value;
                        if (raw === '') return setValue('');
                        if (!/^\d{1,2}$/.test(raw)) return;
                        setValue(raw);
                    }}
                    onBlur={() => value === '' && setValue('0')}
                />


                <motion.div


                    whileHover={"whileHover"}
                    whileTap={"whileTap"}

                    className={"w-[10px] ] cursor-pointer"}
                    onClick={() => setValue(String(normalizedVal - 1))}
                >
                    <motion.img

                        variants={{
                            whileTap: {x: -10},
                            whileHover: {x: -5}
                        }}

                        className={"w-[10px] rotate-[-90deg]"}
                        src={'/assets/chevron.png'}

                    />

                </motion.div>

            </div>


        </div>
    )
}




export default LabelSelector;