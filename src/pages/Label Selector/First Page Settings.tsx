import {AnimatePresence, motion} from "framer-motion";
import EEGlobal from "../../util/Event Emitter.ts";






const FirstPageSettings = (
    { disabledStickers }:{ disabledStickers:boolean[] }
) => {



    return (
        <motion.div

            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}

            className="w-screen h-screen absolute left-0 top-0 z-[200] flex items-center justify-center "
        >
            <motion.div


                initial={{y: 100}}
                animate={{y: 0}}
                exit={{y: -100}}

                className="max-h-[95%] aspect-[0.95] p-[20px_30px] bg-[#000]/25 relative backdrop-blur-[15px] rounded-[30px] border-solid border-[1px] border-[#5C5C5C] overflow-auto"
                style={{
                    width: "clamp(0px, 95%, 800px)",
                }}
            >


                <div
                    className={"flex w-full items-center justify-between"}
                >
                    <p
                        className={"text-[1.8em] font-bold"}
                    >First Page Settings</p>

                    <motion.img

                        whileHover={{scale: 1.1}}
                        whileTap={{scale: 0.9}}

                        onClick={() => EEGlobal.emit("toggleFirstPageSettingsUI", false)}

                        className={"w-[20px] cursor-pointer"}
                        src={'/assets/x.png'}
                    />

                </div>

                <div
                    className={"mt-[40px] w-full"}
                >
                    <p
                        className={"text-[1.5em] font-bold"}
                    >Print Avoid</p>

                    <p
                        className={"text-[1em]"}
                    >Select any stickers that have already been used or you dont want to use</p>

                    <div
                        className={"w-full flex justify-center items-center mt-[30px]"}
                    >
                        <div
                            className={"w-[95%] max-w-[500px] bg-[#1F1F1F]/70 p-[20px] gap-[30px] aspect-[1.294] flex flex-col"}
                        >


                            {Array.from({ length:3 }).map((_, i) => (
                                <div
                                    className={"flex gap-[10px]"}
                                    key={i}
                                >
                                    {Array.from({length: 2}).map((_, i2) => (
                                        <motion.div

                                            whileHover={{ boxShadow: "0px 2px 20px #000" }}

                                            className={"flex-1 aspect-[3/2] bg-[#282828]/85 rounded-[10px] cursor-pointer flex items-center justify-center"}
                                            key={i2}
                                            onClick={() => {
                                                const idx = i*2 + i2;
                                                EEGlobal.emit("toggleDisabledSticker", idx)
                                            }}
                                        >

                                            <AnimatePresence>
                                                {!disabledStickers[i*2+i2]&&(
                                                    <motion.img

                                                        initial={{ rotate:"20deg", scale:0 }}
                                                        animate={{ rotate:"0deg", scale:1 }}
                                                        exit={{ rotate:"20deg", scale:0 }}


                                                        className={"w-[50px] max-w-[50%]"}
                                                        src={'/assets/none.png'}
                                                    />
                                                )}

                                            </AnimatePresence>


                                        </motion.div>
                                    ))}
                                </div>
                            ))}


                        </div>
                    </div>


                </div>


            </motion.div>
        </motion.div>
    )
}


export default FirstPageSettings